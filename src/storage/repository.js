import { openBackend } from "./db.js";
import { SCHEMA_VERSION, upgradeDb } from "./schema.js";
import { STORAGE_KEYS, SRS_CONFIG } from "../core/config.js";
import { scheduler } from "../srs/scheduler.js";
import { buildQueue, countDue } from "../srs/queue.js";

let repoPromise;

/** Lazy init: puoi chiamarla da qualsiasi view senza gestire l'inizializzazione. */
export function getRepository() {
  if (!repoPromise) repoPromise = createRepository();
  return repoPromise;
}

async function createRepository() {
  const backend = await openBackend({
    name: STORAGE_KEYS.DB_NAME,
    version: SCHEMA_VERSION,
    upgrade: upgradeDb,
  });
  return createRepoApi(backend);
}

function createRepoApi(backend) {
  return {
    backend,

    // ---------- Decks ----------
    async listDecks() {
      const decks = await backend.getAll("decks");
      return decks.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    },
    async getDeck(id) {
      return backend.get("decks", id);
    },
    async upsertDeck(deck) {
      const now = Date.now();
      const record = {
        id: deck.id || uid(),
        name: (deck.name || "Senza nome").trim(),
        description: deck.description || "",
        createdAt: deck.createdAt || now,
        updatedAt: now,
      };
      await backend.put("decks", record);
      return record;
    },
    async deleteDeck(id) {
      const all = await backend.getAll("cards");
      const toDelete = all.filter((c) => c.deckId === id);
      for (const c of toDelete) await backend.delete("cards", c.id);
      await backend.delete("decks", id);
    },

    // ---------- Cards ----------
    async listCards(deckId) {
      const all = await backend.getAll("cards");
      return deckId ? all.filter((c) => c.deckId === deckId) : all;
    },
    async getCard(id) {
      return backend.get("cards", id);
    },
    async upsertCard(card) {
      const now = Date.now();
      const base = card.id ? await backend.get("cards", card.id) : null;
      const record = {
        id: card.id || uid(),
        deckId: card.deckId,
        front: (card.front ?? "").trim(),
        back: (card.back ?? "").trim(),
        createdAt: base?.createdAt || card.createdAt || now,
        updatedAt: now,
        // Stato SRS — se la carta non ce l'ha, parte "nuova"
        ease: card.ease ?? base?.ease ?? SRS_CONFIG.defaultEase,
        interval: card.interval ?? base?.interval ?? 0,
        repetitions: card.repetitions ?? base?.repetitions ?? 0,
        lapses: card.lapses ?? base?.lapses ?? 0,
        due: card.due ?? base?.due ?? now,
        lastReviewed: card.lastReviewed ?? base?.lastReviewed ?? null,
      };
      await backend.put("cards", record);
      return record;
    },
    async deleteCard(id) {
      await backend.delete("cards", id);
    },

    // ---------- Sessioni ----------
    async getSessionQueue(deckId, opts = {}) {
      const all = await backend.getAll("cards");
      const cards = deckId ? all.filter((c) => c.deckId === deckId) : all;
      return buildQueue(cards, opts);
    },
    async getDueCounts(deckId, now = Date.now()) {
      const all = await backend.getAll("cards");
      const cards = deckId ? all.filter((c) => c.deckId === deckId) : all;
      return countDue(cards, now);
    },

    // ---------- Review ----------
    async saveReview(cardId, rating, now = Date.now()) {
      const card = await backend.get("cards", cardId);
      if (!card) throw new Error(`Carta ${cardId} non trovata`);

      // Se è una carta nuova non passiamo uno stato SRS: lo scheduler parte pulito.
      const state = card.repetitions != null ? card : null;
      const next = scheduler.schedule(state, rating, now);
      const updated = { ...card, ...next, updatedAt: now };
      await backend.put("cards", updated);

      await backend.put("reviews", {
        id: uid(),
        cardId,
        deckId: card.deckId,
        rating,
        at: now,
        prevDue: card.due ?? null,
        nextDue: next.due,
        interval: next.interval,
        repetitions: next.repetitions,
      });

      await updateStreak(backend, now);
      return updated;
    },

    // ---------- Statistiche ----------
    async getStats() {
      const [cards, reviews, meta] = await Promise.all([
        backend.getAll("cards"),
        backend.getAll("reviews"),
        backend.getAll("meta"),
      ]);
      const total = cards.length;
      const known = cards.filter((c) => c.repetitions >= 3).length;
      const learning = cards.filter((c) => c.repetitions > 0 && c.repetitions < 3).length;
      const fresh = cards.filter((c) => !c.repetitions).length;
      const totalReviews = reviews.length;
      const good = reviews.filter((r) => r.rating !== "again").length;
      const accuracy = totalReviews ? good / totalReviews : 0;
      const streak = meta.find((m) => m.key === "streak")?.value || {
        current: 0,
        longest: 0,
        days: [],
      };
      return { total, known, learning, new: fresh, totalReviews, accuracy, streak };
    },

    // ---------- Meta (settings, streak, …) ----------
    async getMeta(key, fallback = null) {
      const rec = await backend.get("meta", key);
      return rec ? rec.value : fallback;
    },
    async setMeta(key, value) {
      await backend.put("meta", { key, value });
    },
  };
}

// ---------- Utilità ----------
function uid() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `id_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

const DAY_MS = 24 * 60 * 60 * 1000;

async function updateStreak(backend, now) {
  const today = dayKey(now);
  const rec = await backend.get("meta", "streak");
  const prev = rec?.value || { current: 0, longest: 0, lastDay: null, days: [] };
  if (prev.lastDay === today) return;

  const yesterday = dayKey(now - DAY_MS);
  const current = prev.lastDay === yesterday ? prev.current + 1 : 1;
  const longest = Math.max(prev.longest || 0, current);
  const days = Array.from(new Set([...(prev.days || []), today])).slice(-400);

  await backend.put("meta", {
    key: "streak",
    value: { current, longest, lastDay: today, days },
  });
}

function dayKey(ts) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}