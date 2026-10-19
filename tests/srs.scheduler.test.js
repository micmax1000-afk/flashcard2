import { describe, it, expect } from "vitest";
import { createScheduler, RATING } from "../src/srs/scheduler.js";

const DAY = 24 * 60 * 60 * 1000;
const NOW = 1_000_000_000_000;

describe("scheduler", () => {
  const s = createScheduler({ defaultEase: 2.5, minEase: 1.3, lapseDelayMin: 10 });

  it("newCardState produce uno stato iniziale corretto", () => {
    const c = s.newCardState(NOW);
    expect(c.repetitions).toBe(0);
    expect(c.interval).toBe(0);
    expect(c.due).toBe(NOW);
    expect(c.ease).toBe(2.5);
    expect(c.lapses).toBe(0);
  });

  it("good su carta nuova imposta intervallo di 1 giorno", () => {
    const next = s.schedule(s.newCardState(NOW), RATING.GOOD, NOW);
    expect(next.repetitions).toBe(1);
    expect(next.interval).toBe(1);
    expect(next.due).toBe(NOW + DAY);
  });

  it("again genera un lapse con delay di 10 minuti", () => {
    const c = { ease: 2.5, interval: 6, repetitions: 3, lapses: 0, due: NOW, lastReviewed: null };
    const next = s.schedule(c, RATING.AGAIN, NOW);
    expect(next.repetitions).toBe(0);
    expect(next.lapses).toBe(1);
    expect(next.due).toBe(NOW + 10 * 60 * 1000);
    expect(next.ease).toBeLessThan(2.5);
  });

  it("easy allunga l'intervallo più di good", () => {
    const c = { ease: 2.5, interval: 6, repetitions: 2, lapses: 0, due: NOW, lastReviewed: null };
    const good = s.schedule(c, RATING.GOOD, NOW);
    const easy = s.schedule(c, RATING.EASY, NOW);
    expect(easy.interval).toBeGreaterThan(good.interval);
  });

  it("hard accorcia l'intervallo rispetto a good", () => {
    const c = { ease: 2.5, interval: 6, repetitions: 2, lapses: 0, due: NOW, lastReviewed: null };
    const good = s.schedule(c, RATING.GOOD, NOW);
    const hard = s.schedule(c, RATING.HARD, NOW);
    expect(hard.interval).toBeLessThan(good.interval);
  });

  it("l'ease non scende sotto minEase", () => {
    let c = s.newCardState(NOW);
    c = { ...c, ease: 1.3 };
    for (let i = 0; i < 20; i++) c = s.schedule(c, RATING.AGAIN, NOW);
    expect(c.ease).toBeGreaterThanOrEqual(1.3);
  });

  it("lancia su rating sconosciuto", () => {
    expect(() => s.schedule(s.newCardState(NOW), "wat", NOW)).toThrow();
  });
});