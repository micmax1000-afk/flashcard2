/**
 * Scheduler SM-2 semplificato.
 * Una carta è uno stato puro: { ease, interval, repetitions, lapses, due, lastReviewed }.
 * `schedule(state, rating, now)` restituisce il NUOVO stato senza mutare l'originale.
 */

export const RATING = Object.freeze({
  AGAIN: "again",
  HARD: "hard",
  GOOD: "good",
  EASY: "easy",
});

const GRADE = Object.freeze({
  [RATING.AGAIN]: 1,
  [RATING.HARD]: 3,
  [RATING.GOOD]: 4,
  [RATING.EASY]: 5,
});

const DAY_MS = 24 * 60 * 60 * 1000;
const MIN_MS = 60 * 1000;

const DEFAULTS = Object.freeze({
  defaultEase: 2.5,
  minEase: 1.3,
  lapseDelayMin: 10,
});

export function createScheduler(config = {}) {
  const opts = { ...DEFAULTS, ...config };

  function newCardState(now = Date.now()) {
    return {
      ease: opts.defaultEase,
      interval: 0,
      repetitions: 0,
      lapses: 0,
      due: now,
      lastReviewed: null,
    };
  }

  function schedule(state, rating, now = Date.now()) {
    const current = state ?? newCardState(now);
    const grade = GRADE[rating];
    if (grade == null) {
      throw new Error(`Rating sconosciuto: "${rating}"`);
    }

    let { ease, interval, repetitions, lapses } = current;
    let due;

    if (grade < 3) {
      // Lapse: la carta torna in coda dopo il ritardo di ripasso
      lapses += 1;
      repetitions = 0;
      interval = opts.lapseDelayMin / (24 * 60);
      due = now + opts.lapseDelayMin * MIN_MS;
      ease = Math.max(opts.minEase, ease - 0.2);
    } else {
      if (repetitions === 0) interval = 1;
      else if (repetitions === 1) interval = 6;
      else interval = Math.round(interval * ease);

      if (rating === RATING.HARD) interval = Math.max(1, Math.round(interval * 0.8));
      else if (rating === RATING.EASY) interval = Math.round(interval * 1.3);

      repetitions += 1;
      due = now + Math.round(interval * DAY_MS);
    }

    // Aggiornamento ease secondo SM-2
    ease = ease + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02));
    ease = Math.max(opts.minEase, ease);

    return {
      ease,
      interval,
      repetitions,
      lapses,
      due,
      lastReviewed: now,
    };
  }

  return { newCardState, schedule };
}

export const scheduler = createScheduler();
