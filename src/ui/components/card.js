import { el } from "../dom.js";
import { RATING } from "../../srs/scheduler.js";

export function createCard({ card, onAnswer, onExit, showBack = false }) {
  let revealed = showBack;

  // Funzione per l'audio (Text-to-Speech)
  const speak = (text, lang = "en-US") => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = lang;
      u.rate = 0.9;
      window.speechSynthesis.speak(u);
    }
  };

  // Pulsante audio
  const audioBtn = (text, lang) => el("button", {
    type: "button",
    class: "btn-icon",
    style: "margin-top: 0.5rem; font-size: 1.5rem;",
    "aria-label": "Ascolta pronuncia",
    onClick: (e) => {
      e.stopPropagation(); // Evita che cliccando l'audio si giri la carta
      speak(text, lang);
    }
  }, "🔊");

  // NOTA: Cambia "it-IT" e "en-US" se il fronte/retro della tua lingua è diverso
  const frontEl = el("div", { class: "flashcard__face flashcard__face--front" },
    el("span", { class: "flashcard__lang", text: "Fronte" }),
    el("p", { class: "flashcard__text", text: card.front }),
    audioBtn(card.front, "it-IT") 
  );

  const backEl = el("div", { class: "flashcard__face flashcard__face--back" },
    el("span", { class: "flashcard__lang", text: "Retro" }),
    el("p", { class: "flashcard__text", text: card.back }),
    audioBtn(card.back, "en-US")
  );

  const inner = el("div", { class: "flashcard__inner" }, frontEl, backEl);

  const revealBtn = el("button", {
      type: "button",
      class: "btn btn-primary flashcard__reveal",
      onClick: reveal,
    }, "Mostra risposta"
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
    },
  };
}
