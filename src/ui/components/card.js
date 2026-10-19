import { el } from "../dom.js";
import { RATING } from "../../srs/scheduler.js";

/**
 * Flashcard interattiva.
 *
 * @param {object} opts
 * @param {{front:string, back:string}} opts.card
 * @param {(rating:"again"|"hard"|"good"|"easy") => void} opts.onAnswer
 * @param {(reason:"exit") => void} [opts.onExit]
 * @param {boolean} [opts.showBack=false]   per la modalità studio: parte sul fronte
 * @returns {{ node: HTMLElement, reveal: () => void, destroy: () => void }}
 */
export function createCard({ card, onAnswer, onExit, showBack = false }) {
  let revealed = showBack;

  const frontEl = el("div", { class: "flashcard__face flashcard__face--front" },
    el("span", { class: "flashcard__lang", text: "Fronte" }),
    el("p", { class: "flashcard__text", text: card.front }),
  );
  const backEl = el("div", { class: "flashcard__face flashcard__face--back" },
    el("span", { class: "flashcard__lang", text: "Retro" }),
    el("p", { class: "flashcard__text", text: card.back }),
  );

  const inner = el("div", { class: "flashcard__inner" }, frontEl, backEl);

  const revealBtn = el(
    "button",
    {
      type: "button",
      class: "btn btn-primary flashcard__reveal",
      onClick: reveal,
    },
    "Mostra risposta",
  );

  const ratings = el(
    "div",
    { class: "flashcard__ratings", role: "group", "aria-label": "Valuta la risposta" },
    ratingButton("Ancora", "again", RATING.AGAIN, "btn-danger"),
    ratingButton("Difficile", "hard", RATING.HARD, ""),
    ratingButton("Bene", "good", RATING.GOOD, "btn-primary"),
    ratingButton("Facile", "easy", RATING.EASY, ""),
  );

  const root = el(
    "div",
    { class: "flashcard", "aria-label": "Flashcard" },
    el("div", {
      class: "flashcard__scene",
      onClick: () => (!revealed ? reveal() : null),
      role: "button",
      tabindex: "0",
      "aria-label": revealed ? "Carta girata" : "Carta coperta, premi invio per girare",
      onKeydown: (e) => {
        if ((e.key === "Enter" || e.key === " ") && !revealed) {
          e.preventDefault();
          reveal();
        }
      },
    }, inner),
    el("div", { class: "flashcard__actions" }, revealBtn, ratings),
  );

  function ratingButton(label, dataRating, value, cls) {
    return el(
      "button",
      {
        type: "button",
        class: `btn ${cls}`.trim(),
        dataset: { rating: dataRating },
        onClick: () => {
          if (!revealed) return;
          onAnswer(value);
        },
      },
      label,
    );
  }

  function reveal() {
    if (revealed) return;
    revealed = true;
    root.classList.add("is-revealed");
    revealBtn.setAttribute("disabled", "true");
    revealBtn.textContent = "Risposta mostrata";
    ratings.querySelector("button")?.focus();
  }

  // scorciatoie da tastiera
  function onKey(e) {
    if (e.target.matches?.("input, textarea")) return;
    if (!revealed && (e.key === " " || e.key === "Enter")) {
      e.preventDefault();
      reveal();
      return;
    }
    if (!revealed) return;
    const map = { 1: RATING.AGAIN, 2: RATING.HARD, 3: RATING.GOOD, 4: RATING.EASY };
    if (map[e.key]) {
      e.preventDefault();
      onAnswer(map[e.key]);
    }
    if (e.key === "Escape" && onExit) onExit("exit");
  }
  document.addEventListener("keydown", onKey);

  return {
    node: root,
    reveal,
    destroy() {
      document.removeEventListener("keydown", onKey);
      root.remove();
    },
  };
}