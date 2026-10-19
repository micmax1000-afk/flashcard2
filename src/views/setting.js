import { getRepository } from "../storage/repository.js";
import { el } from "../ui/dom.js";
import { toast } from "../ui/toast.js";
import { confirmDialog } from "../ui/dialog.js";
import {
  exportBackup,
  importBackup,
  downloadBackup,
  readBackupFile,
} from "../storage/backup.js";
import { SRS_CONFIG } from "../core/config.js";

export async function mount(outlet) {
  const container = outlet.querySelector("#settings-content");
  const repo = await getRepository();

  const newLimit = (await repo.getMeta("limits:new", null)) ?? SRS_CONFIG.newPerDay;
  const reviewLimit = (await repo.getMeta("limits:review", null)) ?? SRS_CONFIG.reviewPerDay;

  // ---------- Limiti giornalieri ----------
  const newInput = el("input", {
    type: "number", min: "0", max: "500", value: String(newLimit), class: "input input--sm",
  });
  const reviewInput = el("input", {
    type: "number", min: "0", max: "1000", value: String(reviewLimit), class: "input input--sm",
  });

  newInput.addEventListener("change", async () => {
    await repo.setMeta("limits:new", Number(newInput.value) || 0);
    toast("Limite carte nuove aggiornato", "success");
  });
  reviewInput.addEventListener("change", async () => {
    await repo.setMeta("limits:review", Number(reviewInput.value) || 0);
    toast("Limite ripassi aggiornato", "success");
  });

  container.append(
    el("section", { class: "settings-section" },
      el("h3", { text: "Limiti giornalieri" }),
      el("p", { class: "muted", text: "Quante carte nuove e quante in ripasso al giorno." }),
      el("div", { class: "form-row" },
        el("label", { class: "field" }, "Nuove al giorno", newInput),
        el("label", { class: "field" }, "Ripassi al giorno", reviewInput),
      ),
    ),

    el("section", { class: "settings-section" },
      el("h3", { text: "Backup" }),
      el("p", { class: "muted", text: "Esporta o importa i tuoi mazzi e progressi in JSON." }),
      el("div", { class: "form-row" },
        el("button", { type: "button", class: "btn", text: "Esporta backup", onClick: handleExport }),
        el("button", { type: "button", class: "btn", text: "Importa backup", onClick: handleImport }),
      ),
    ),

    el("section", { class: "settings-section settings-section--danger" },
      el("h3", { text: "Zona pericolosa" }),
      el("p", { class: "muted", text: "Elimina tutti i mazzi, le carte e le statistiche." }),
      el("button", {
        type: "button", class: "btn btn-danger", text: "Cancella tutti i dati",
        onClick: handleReset,
      }),
    ),
  );

  // ---------- Handlers ----------
  async function handleExport() {
    try {
      const data = await exportBackup(repo);
      downloadBackup(data);
      toast("Backup scaricato", "success");
    } catch (e) {
      console.error(e);
      toast("Errore nell'esportazione", "error");
    }
  }

  async function handleImport() {
    const input = el("input", { type: "file", accept: ".json,application/json" });

    const file = await new Promise((resolve) => {
      input.addEventListener("change", () => resolve(input.files?.[0] || null), { once: true });
      input.click();
    });
    if (!file) return;

    let data;
    try {
      data = await readBackupFile(file);
    } catch (e) {
      return toast(e.message, "error");
    }

    const replace = await confirmDialog({
      title: "Importare il backup?",
      message:
        "Vuoi SOSTITUIRE tutti i dati attuali o unirli? Premi OK per sostituire, Annulla per unire.",
      confirmLabel: "Sostituisci",
    });

    try {
      const result = await importBackup(repo, data, { replace });
      toast(`Importati: ${result.decks} mazzi, ${result.cards} carte`, "success");
    } catch (e) {
      console.error(e);
      toast(e.message || "Errore nell'importazione", "error");
    }
  }

  async function handleReset() {
    const ok = await confirmDialog({
      title: "Cancellare tutti i dati?",
      message: "Questa azione è irreversibile: mazzi, carte e statistiche saranno eliminati.",
      confirmLabel: "Elimina tutto",
      danger: true,
    });
    if (!ok) return;

    const ok2 = await confirmDialog({
      title: "Sei davvero sicuro?",
      message: "Ultima possibilità. Confermi la cancellazione totale?",
      confirmLabel: "Sì, cancella",
      danger: true,
    });
    if (!ok2) return;

    for (const store of ["decks", "cards", "reviews", "meta"]) {
      await repo.backend.clear(store);
    }
    toast("Dati cancellati", "success");
    setTimeout(() => location.reload(), 600);
  }

  return { destroy() {} };
}