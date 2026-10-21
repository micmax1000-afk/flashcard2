import { getRepository } from "../storage/repository.js";
import { el } from "../ui/dom.js";
import { createCard } from "../ui/components/card.js";
import { toast } from "../ui/toast.js";

export async function mount(outlet, { path } = {}) {
  const cardSlot = outlet.querySelector("#study-card");
  const progressEl = outlet.querySelector("#study-progress");
  const exitBtn = outlet.querySelector("#study-exit");

  const repo = await getRepository();

  const params = new URLSearchParams(path.split("?")[1] || "");
  const deckId = params.get("deck") || undefined;

  const newLimit = (await repo.getMeta("limits:new", null)) ?? undefined;
  const reviewLimit = (await repo.getMeta("limits:review", null)) ?? undefined;
  const queue = await repo.getSessionQueue(deckId, { newLimit, reviewLimit });

  let currentCtrl = null;
  let index = 0;
  const total = queue.all.length;

  progressEl.value = 0;
  progressEl.max = Math.max(1, total);

  exitBtn.addEventListener("click", handleExit);

  if (!total) {
    cardSlot.append(
      el("div", { class: "empty-state" },
        el("h2", { text: "Tutto fatto!" }),
        el("p", { class: "muted", text: "Nessuna carta in scadenza oggi." }),
        el("a", { href: "#/home", class: "btn btn-primary", text: "Torna alla home" }),
      ),
    );
    exitBtn.disabled = true;
    return { destroy() { exitBtn.removeEventListener("click", handleExit); } };
  }

  showCurrent();

  function showCurrent() {
    currentCtrl?.destroy();
    cardSlot.replaceChildren();

    if (index >= total) {
      showDone();
      return;
    }

    currentCtrl = createCard({
      card: queue.all[index],
      onAnswer: handleAnswer,
      onExit: handleExit,
    });
    cardSlot.appendChild(currentCtrl.node);
    progressEl.value = index;
  }

  async function handleAnswer(rating) {
    const card = queue.all[index];
    try {
      await repo.saveReview(card.id, rating);
    } catch (e) {
      console.error(e);
      toast("Errore nel salvataggio", "error");
      return;
    }
    index++;
    progressEl.value = index;
    showCurrent();
  }

  function handleExit() {
    location.hash = "#/home";
  }

  async function showDone() {
    currentCtrl?.destroy();
    cardSlot.replaceChildren();
    exitBtn.disabled = true;

    const stats = await repo.getStats();
    cardSlot.append(
      el("div", { class: "empty-state empty-state--success" },
        el("h2", { text: "Sessione completata!" }),
        el("p", { class: "muted", text: `${total} carte ripassate.` }),
        stats.streak?.current
          ? el("p", { class: "streak-inline" },
              "🔥 ",
              el("strong", { text: String(stats.streak.current) }),
              " giorni di fila",
            )
          : null,
        el("a", { href: "#/home", class: "btn btn-primary", text: "Torna alla home" }),
      ),
    );
  }

  return {
    destroy() {
      currentCtrl?.destroy();
      exitBtn.removeEventListener("click", handleExit);
    },
  };
}