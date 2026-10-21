import { el } from "../dom.js";
import { RATING } from "../../srs/scheduler.js";

/**
 * @param {object} opts
 * @param {object} opts.card
 * @param {(rating: number) => void} opts.onAnswer
 * @param {() => void} [opts.onExit]
 * @param {boolean} [opts.showBack]
 * @param {string} [opts.frontLang]  lingua del fronte (default it-IT)
 * @param {string} [opts.backLang]   lingua del retro (default en-US)
 */
export function createCard({
  card,
  onAnswer,
  onExit,
  showBack = false,
  frontLang = "it-IT",
  backLang = "en-US",
}) {
  let revealed = showBack;

  /** Usa il modulo TTS se presente, altrimenti fallback a speechSynthesis. */
  function speak(text, lang) {
    if (!text) return;
    if (window.TTS && typeof window.TTS.speak === "function") {
      window.TTS.speak(text, lang || "en-US").catch((err) => {
        console.warn("[card] TTS.speak error:", err);
      });
      return;
    }
    if ("speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (_) { /* ignore */ }
      const u = new SpeechSynthesisUtterance(text);
      u.lang = lang || "en-US";
      u.rate = 0.95;
      window.speechSynthesis.speak(u);
    }
  }

  const audioBtn = (text, lang) =>
    el(
      "button",
      {
        type: "button",
        class: "btn-icon",
        style: "margin-top: 0.5rem; font-size: 1.5rem;",
        "aria-label": "Ascolta pronuncia",
        onClick: (e) => {
          e.stopPropagation();
          speak(text, lang);
        },
      },
      "🔊",
    );

  const frontEl = el(
    "div",
    { class: "flashcard__face flashcard__face--front" },
    el("span", { class: "flashcard__lang", text: "Fronte" }),
    el("p", { class: "flashcard__text", text: card.front }),
    audioBtn(card.front, frontLang),
  );

  const backEl = el(
    "div",
    { class: "flashcard__face flashcard__face--back" },
    el("span", { class: "flashcard__lang", text: "Retro" }),
    el("p", { class: "flashcard__text", text: card.back }),
    audioBtn(card.back, backLang),
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
    el(
      "div",
      {
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
      },
      inner,
    ),
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
      if (window.TTS && typeof window.TTS.stop === "function") {
        window.TTS.stop();
      }
    },
  };
}
