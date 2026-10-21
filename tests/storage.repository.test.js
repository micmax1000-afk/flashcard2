import { describe, it, expect, beforeEach } from "vitest";
import { getRepository } from "../src/storage/repository.js";

const STORES = ["decks", "cards", "reviews", "meta"];

let repo;
beforeEach(async () => {
  repo = await getRepository();
  for (const s of STORES) await repo.backend.clear(s);
});

describe("repository — decks", () => {
  it("crea e legge un mazzo", async () => {
    const d = await repo.upsertDeck({ name: "Test", description: "x" });
    expect(d.id).toBeTruthy();
    const decks = await repo.listDecks();
    expect(decks).toHaveLength(1);
    expect(decks[0].name).toBe("Test");
  });

  it("aggiorna un mazzo esistente", async () => {
    const d = await repo.upsertDeck({ name: "A" });
    await repo.upsertDeck({ ...d, name: "B" });
    const decks = await repo.listDecks();
    expect(decks[0].name).toBe("B");
  });
});

describe("repository — cards", () => {
  it("crea una carta nuova con stato SRS iniziale", async () => {
    const d = await repo.upsertDeck({ name: "D" });
    const c = await repo.upsertCard({ deckId: d.id, front: "ciao", back: "hello" });
    expect(c.repetitions).toBe(0);
    expect(c.interval).toBe(0);
    expect(c.ease).toBe(2.5);
  });

  it("saveReview aggiorna lo stato della carta", async () => {
    const d = await repo.upsertDeck({ name: "D" });
    const c = await repo.upsertCard({ deckId: d.id, front: "a", back: "1" });
    const now = Date.now();
    const updated = await repo.saveReview(c.id, "good", now);
    expect(updated.repetitions).toBe(1);
    expect(updated.interval).toBe(1);
    expect(updated.due).toBe(now + 24 * 60 * 60 * 1000);
  });

  it("saveReview registra una review nel log", async () => {
    const d = await repo.upsertDeck({ name: "D" });
    const c = await repo.upsertCard({ deckId: d.id, front: "a", back: "1" });
    await repo.saveReview(c.id, "again");
    const reviews = await repo.backend.getAll("reviews");
    expect(reviews).toHaveLength(1);
    expect(reviews[0].rating).toBe("again");
  });

  it("deleteDeck rimuove anche le carte del mazzo", async () => {
    const d = await repo.upsertDeck({ name: "D" });
    await repo.upsertCard({ deckId: d.id, front: "a", back: "1" });
    await repo.upsertCard({ deckId: d.id, front: "b", back: "2" });
    await repo.deleteDeck(d.id);
    expect(await repo.listCards()).toHaveLength(0);
    expect(await repo.listDecks()).toHaveLength(0);
  });
});

describe("repository — stats & streak", () => {
  it("calcola le statistiche di base", async () => {
    const d = await repo.upsertDeck({ name: "D" });
    const c1 = await repo.upsertCard({ deckId: d.id, front: "a", back: "1" });
    await repo.upsertCard({ deckId: d.id, front: "b", back: "2" });
    await repo.saveReview(c1.id, "good");

    const s = await repo.getStats();
    expect(s.total).toBe(2);
    expect(s.new).toBe(1);
    expect(s.totalReviews).toBe(1);
    expect(s.accuracy).toBe(1);
  });

  it("incrementa la streak al primo review del giorno", async () => {
    const d = await repo.upsertDeck({ name: "D" });
    const c = await repo.upsertCard({ deckId: d.id, front: "a", back: "1" });
    await repo.saveReview(c.id, "good");
    const s = await repo.getStats();
    expect(s.streak.current).toBe(1);
  });
});

describe("repository — meta", () => {
  it("legge e scrive meta", async () => {
    await repo.setMeta("foo", 42);
    expect(await repo.getMeta("foo")).toBe(42);
    expect(await repo.getMeta("nope", "default")).toBe("default");
  });
});