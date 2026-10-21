import { describe, it, expect } from "vitest";
import { buildQueue, countDue } from "../src/srs/queue.js";

const NOW = 1_000_000_000_000;
const DAY = 24 * 60 * 60 * 1000;

const card = (id, rep, due) => ({ id, repetitions: rep, due });

describe("buildQueue", () => {
  it("coda vuota se non ci sono carte", () => {
    const q = buildQueue([], { now: NOW });
    expect(q.all).toEqual([]);
    expect(q.counts.total).toBe(0);
  });

  it("separa nuove e da ripassare", () => {
    const cards = [
      card("a", 0, NOW + DAY),
      card("b", 2, NOW - DAY),
      card("c", 1, NOW + DAY),
      card("d", 2, NOW - 1000),
    ];
    const q = buildQueue(cards, { now: NOW, newLimit: 10, reviewLimit: 10 });
    expect(q.counts.new).toBe(1);
    expect(q.counts.reviews).toBe(2);
  });

  it("rispetta i limiti giornalieri", () => {
    const cards = Array.from({ length: 20 }, (_, i) => card(`r${i}`, 2, NOW - 1000 * i));
    const q = buildQueue(cards, { now: NOW, newLimit: 5, reviewLimit: 3 });
    expect(q.counts.reviews).toBe(3);
  });

  it("interleave 5:1 tra ripassi e nuove", () => {
    const reviews = Array.from({ length: 10 }, (_, i) => card(`r${i}`, 2, NOW - 1000 * i));
    const news = Array.from({ length: 5 }, (_, i) => card(`n${i}`, 0, NOW));
    const q = buildQueue([...reviews, ...news], { now: NOW, newLimit: 10, reviewLimit: 20 });
    expect(q.all.length).toBe(15);
    // il primo blocco è di 5 ripassi
    expect(q.all.slice(0, 5).every((c) => c.repetitions > 0)).toBe(true);
    // il sesto è una nuova
    expect(q.all[5].repetitions).toBe(0);
  });
});

describe("countDue", () => {
  it("conta ripassi scaduti e nuove", () => {
    const cards = [
      card("a", 0, NOW),
      card("b", 2, NOW - 1),
      card("c", 2, NOW + 10_000),
    ];
    const c = countDue(cards, NOW);
    expect(c.news).toBe(1);
    expect(c.reviews).toBe(1);
    expect(c.total).toBe(2);
  });
});