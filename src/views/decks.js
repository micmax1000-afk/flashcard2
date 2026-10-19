import { getRepository } from "../storage/repository.js";
import { el, clear } from "../ui/dom.js";
import { toast } from "../ui/toast.js";
import { openDialog, confirmDialog } from "../ui/dialog.js";

export async function mount(outlet) {
  const container = outlet.querySelector("#decks-list");
  const repo = await getRepository();

  let selectedDeckId = null;

  async function refresh() {
    clear(container);
    if (selectedDeckId) await renderCards(selectedDeckId);
    else await renderDecks();
  }

  // ---------- Lista mazzi ----------
  async function renderDecks() {
    const [decks, allCards] = await Promise.all([repo.listDecks(), repo.listCards()]);
    const countByDeck = allCards.reduce((acc, c) => {
      acc[c.deckId] = (acc[c.deckId] || 0) + 1;
      return acc;
    }, {});

    container.append(
      el("div", { class: "decks-header" },
        el("h3", { text: "I tuoi mazzi" }),
        el("button", {
          type: "button", class: "btn btn-primary", text: "Nuovo mazzo",
          onClick: () => createDeck(),
        }),
      ),
    );

    if (!decks.length) {
      container.append(
        el("p", { class: "muted", text: "Nessun mazzo ancora. Creane uno per iniziare." }),
      );
      return;
    }

    const list = el("ul", { class: "decks-list" });
    for (const d of decks) {
      const count = countByDeck[d.id] || 0;
      list.append(
        el("li", { class: "deck-item" },
          el("button", {
            type: "button", class: "deck-item__main",
            onClick: () => { selectedDeckId = d.id; refresh(); },
          },
            el("span", { class: "deck-item__name", text: d.name }),
            el("span", { class: "deck-item__count muted", text: `${count} carte` }),
          ),
          el("button", {
            type: "button", class: "btn-icon", "aria-label": "Rinomina",
            text: "✏️", onClick: () => editDeck(d),
          }),
          el("button", {
            type: "button", class: "btn-icon", "aria-label": "Elimina",
            text: "🗑️", onClick: () => deleteDeck(d),
          }),
        ),
      );
    }
    container.append(list);
  }

  // ---------- Carte di un mazzo ----------
  async function renderCards(deckId) {
    const [deck, cards] = await Promise.all([repo.getDeck(deckId), repo.listCards(deckId)]);

    container.append(
      el("div", { class: "decks-header" },
        el("button", {
          type: "button", class: "btn", text: "← Mazzi",
          onClick: () => { selectedDeckId = null; refresh(); },
        }),
        el("h3", { text: deck?.name || "Mazzo" }),
        el("button", {
          type: "button", class: "btn btn-primary", text: "Nuova carta",
          onClick: () => editCard(null),
        }),
      ),
    );

    if (!cards.length) {
      container.append(el("p", { class: "muted", text: "Nessuna carta in questo mazzo." }));
      return;
    }

    const list = el("ul", { class: "cards-list" });
    for (const c of cards) {
      list.append(
        el("li", { class: "card-item" },
          el("div", { class: "card-item__body" },
            el("div", { class: "card-item__front", text: c.front }),
            el("div", { class: "card-item__back muted", text: c.back }),
          ),
          el("button", {
            type: "button", class: "btn-icon", "aria-label": "Modifica",
            text: "✏️", onClick: () => editCard(c),
          }),
          el("button", {
            type: "button", class: "btn-icon", "aria-label": "Elimina",
            text: "🗑️", onClick: () => deleteCard(c),
          }),
        ),
      );
    }
    container.append(list);
  }

  // ---------- CRUD mazzi ----------
  async function createDeck() {
    const nameInput = el("input", { type: "text", placeholder: "Nome del mazzo", class: "input" });
    const descInput = el("input", { type: "text", placeholder: "Descrizione (opzionale)", class: "input" });

    const value = await openDialog({
      title: "Nuovo mazzo",
      body: el("div", { class: "form" }, nameInput, descInput),
      actions: [
        { label: "Annulla", value: null },
        { label: "Crea", primary: true, value: "ok" },
      ],
    }).result;

    if (value !== "ok") return;
    const name = nameInput.value.trim();
    if (!name) return toast("Il nome è obbligatorio", "warn");
    await repo.upsertDeck({ name, description: descInput.value.trim() });
    toast("Mazzo creato", "success");
    refresh();
  }

  async function editDeck(deck) {
    const nameInput = el("input", { type: "text", class: "input", value: deck.name });
    const descInput = el("input", { type: "text", class: "input", value: deck.description || "" });

    const value = await openDialog({
      title: "Modifica mazzo",
      body: el("div", { class: "form" }, nameInput, descInput),
      actions: [
        { label: "Annulla", value: null },
        { label: "Salva", primary: true, value: "ok" },
      ],
    }).result;

    if (value !== "ok") return;
    const name = nameInput.value.trim();
    if (!name) return toast("Il nome è obbligatorio", "warn");
    await repo.upsertDeck({ ...deck, name, description: descInput.value.trim() });
    toast("Mazzo aggiornato", "success");
    refresh();
  }

  async function deleteDeck(deck) {
    const ok = await confirmDialog({
      title: "Eliminare il mazzo?",
      message: `"${deck.name}" e tutte le sue carte verranno eliminate.`,
      confirmLabel: "Elimina",
      danger: true,
    });
    if (!ok) return;
    await repo.deleteDeck(deck.id);
    if (selectedDeckId === deck.id) selectedDeckId = null;
    toast("Mazzo eliminato", "success");
    refresh();
  }

  // ---------- CRUD carte ----------
  async function editCard(card) {
    const frontInput = el("input", {
      type: "text", class: "input", value: card?.front || "", placeholder: "Fronte",
    });
    const backInput = el("input", {
      type: "text", class: "input", value: card?.back || "", placeholder: "Retro",
    });

    const value = await openDialog({
      title: card ? "Modifica carta" : "Nuova carta",
      body: el("div", { class: "form" }, frontInput, backInput),
      actions: [
        { label: "Annulla", value: null },
        { label: "Salva", primary: true, value: "ok" },
      ],
    }).result;

    if (value !== "ok") return;
    const front = frontInput.value.trim();
    const back = backInput.value.trim();
    if (!front || !back) return toast("Fronte e retro sono obbligatori", "warn");
    await repo.upsertCard({ ...(card || {}), deckId: selectedDeckId, front, back });
    toast(card ? "Carta aggiornata" : "Carta aggiunta", "success");
    refresh();
  }

  async function deleteCard(card) {
    const ok = await confirmDialog({
      title: "Eliminare la carta?",
      message: `"${card.front}"`,
      confirmLabel: "Elimina",
      danger: true,
    });
    if (!ok) return;
    await repo.deleteCard(card.id);
    toast("Carta eliminata", "success");
    refresh();
  }

  await refresh();
  return { destroy() {} };
}