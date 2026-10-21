import { getRepository } from "../storage/repository.js";
import { el } from "../ui/dom.js";
import { RATING } from "../srs/scheduler.js";

const MAX_QUESTIONS = 10;
const OPTIONS_PER_QUESTION = 4;
const FEEDBACK_DELAY_MS = 1200;

export async function mount(outlet, { path } = {}) {
  const slot = outlet.querySelector("#quiz-card");
  const repo = await getRepository();

  const params = new URLSearchParams(path.split("?")[1] || "");
  const deckId = params.get("deck") || undefined;

  const allCards = await repo.listCards(deckId);

  if (allCards.length < 2) {
    slot.append(
      el("div", { class: "empty-state" },
        el("h2", { text: "Servono almeno 2 carte" }),
        el("p", { class: "muted", text: "Aggiungi altre carte per giocare al quiz." }),
        el("a", { href: "#/decks", class: "btn btn-primary", text: "Vai ai mazzi" }),
      ),
    );
    return { destroy() {} };
  }

  const questions = shuffle([...allCards]).slice(0, Math.min(MAX_QUESTIONS, allCards.length));
  const container = el("div", { class: "quiz" });
  slot.appendChild(container);

  let index = 0;
  let correct = 0;
  let timeoutId = null;

  render();

  function render() {
    container.replaceChildren();

    if (index >= questions.length) {
      renderResult();
      return;
    }

    const card = questions[index];
    const distractors = pickDistractors(card, OPTIONS_PER_QUESTION - 1);
    const options = shuffle([card.back, ...distractors.map((c) => c.back)]);

    container.append(
      el("div", { class: "quiz__header" },
        el("span", { class: "muted", text: `Domanda ${index + 1} di ${questions.length}` }),
        el("span", { class: "muted", text: `Punteggio: ${correct}` }),
      ),
      el("div", { class: "quiz__prompt" },
        el("p", { class: "flashcard__text", text: card.front }),
      ),
      el("div", { class: "quiz__options" },
        options.map((opt) =>
          el("button", {
            type: "button",
            class: "btn quiz__option",
            text: opt,
            onClick: (e) => handleAnswer(e.currentTarget, opt, card),
          }),
        ),
      ),
    );
  }

  function pickDistractors(card, n) {
    const pool = allCards.filter((c) => c.id !== card.id && c.back !== card.back);
    return shuffle([...pool]).slice(0, n);
  }

  async function handleAnswer(button, choice, card) {
    const buttons = container.querySelectorAll(".quiz__option");
    buttons.forEach((b) => (b.disabled = true));

    const isCorrect = choice === card.back;
    if (isCorrect) {
      correct++;
      button.classList.add("is-correct");
    } else {
      button.classList.add("is-wrong");
      buttons.forEach((b) => {
        if (b.textContent === card.back) b.classList.add("is-correct");
      });
    }

    try {
      await repo.saveReview(card.id, isCorrect ? RATING.GOOD : RATING.AGAIN);
    } catch (e) {
      console.error(e);
    }

    timeoutId = setTimeout(() => {
      index++;
      render();
    }, FEEDBACK_DELAY_MS);
  }

  function renderResult() {
    container.append(
      el("div", { class: "empty-state empty-state--success" },
        el("h2", { text: "Quiz completato!" }),
        el("p", { text: `Risposte corrette: ${correct} su ${questions.length}.` }),
        el("div", { class: "form-row" },
          el("button", {
            type: "button", class: "btn", text: "Rigioca",
            onClick: () => {
              index = 0;
              correct = 0;
              shuffle(questions);
              render();
            },
          }),
          el("a", { href: "#/home", class: "btn btn-primary", text: "Torna alla home" }),
        ),
      ),
    );
  }

  return {
    destroy() {
      if (timeoutId) clearTimeout(timeoutId);
    },
  };
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}