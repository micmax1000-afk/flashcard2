import { SRS_CONFIG } from "../core/config.js";

/**
 * Costruisce la coda della sessione a partire dall'elenco delle carte.
 * Le carte in scadenza vengono alternate a nuove carte con rapporto 5:1.
 */
export function buildQueue(cards, { newLimit, reviewLimit, now = Date.now() } = {}) {
  const nLimit = newLimit ?? SRS_CONFIG.newPerDay;
  const rLimit = reviewLimit ?? SRS_CONFIG.reviewPerDay;

  const reviews = cards
    .filter((c) => c.repetitions > 0 && c.due <= now)
    .sort((a, b) => a.due - b.due)
    .slice(0, rLimit);

  const news = cards.filter((c) => c.repetitions === 0).slice(0, nLimit);

  return {
    reviews,
    news,
    all: interleave(reviews, news),
    counts: { reviews: reviews.length, new: news.length, total: reviews.length + news.length },
  };
}

function interleave(reviews, news) {
  const out = [];
  let i = 0;
  let j = 0;
  const ratio = 5;

  while (i < reviews.length || j < news.length) {
    for (let k = 0; k < ratio && i < reviews.length; k++) {
      out.push(reviews[i++]);
    }
    if (j < news.length) out.push(news[j++]);
  }

  return out;
}

/**
 * Conta quante carte sono "in scadenza adesso" senza costruire la coda.
 */
export function countDue(cards, now = Date.now()) {
  let reviews = 0;
  let news = 0;
  for (const c of cards) {
    if (c.repetitions === 0) news++;
    else if (c.due <= now) reviews++;
  }
  return { reviews, news, total: reviews + news };
}
