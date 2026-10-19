import { SCHEMA_VERSION } from "./schema.js";

const FORMAT = "flashcards-backup";

export async function exportBackup(repo) {
  const [decks, cards, reviews, meta] = await Promise.all([
    repo.backend.getAll("decks"),
    repo.backend.getAll("cards"),
    repo.backend.getAll("reviews"),
    repo.backend.getAll("meta"),
  ]);

  return {
    format: FORMAT,
    version: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    decks,
    cards,
    reviews,
    meta,
  };
}

/**
 * @param {object} repo    istanza repository
 * @param {object} data    payload prodotto da exportBackup
 * @param {object} options replace:true svuota tutto prima di importare
 */
export async function importBackup(repo, data, { replace = false } = {}) {
  if (!data || data.format !== FORMAT) {
    throw new Error("Formato backup non riconosciuto.");
  }
  if (!Array.isArray(data.decks) || !Array.isArray(data.cards)) {
    throw new Error("Backup non valido: mancano decks o cards.");
  }

  const backend = repo.backend;

  if (replace) {
    for (const store of ["decks", "cards", "reviews", "meta"]) {
      await backend.clear(store);
    }
  }

  for (const d of data.decks) await backend.put("decks", d);
  for (const c of data.cards) await backend.put("cards", c);
  for (const r of data.reviews || []) await backend.put("reviews", r);
  for (const m of data.meta || []) await backend.put("meta", m);

  return {
    decks: data.decks.length,
    cards: data.cards.length,
    reviews: (data.reviews || []).length,
    meta: (data.meta || []).length,
  };
}

export function downloadBackup(data, filename = `flashcards-backup-${Date.now()}.json`) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function readBackupFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        resolve(JSON.parse(String(reader.result)));
      } catch {
        reject(new Error("Il file non contiene JSON valido."));
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}