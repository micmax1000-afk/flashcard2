import { getRepository } from "../storage/repository.js";
import { el, clear } from "../ui/dom.js";

export async function mount(outlet) {
  const summary = outlet.querySelector("#home-summary");
  const repo = await getRepository();

  clear(summary);

  const [counts, stats] = await Promise.all([repo.getDueCounts(), repo.getStats()]);

  const cards = [
    card("Ripassi oggi", counts.reviews, "review"),
    card("Nuove", counts.news, "new"),
    card("Consolidate", stats.known, "known"),
    card("Precisione", `${Math.round(stats.accuracy * 100)}%`, "accuracy"),
  ];

  summary.append(el("div", { class: "stat-grid" }, cards));

  if (counts.total === 0) {
    summary.append(
      el("p", { class: "muted empty-note" },
        "Nessuna carta in scadenza. Aggiungi carte dalla sezione ",
        el("a", { href: "#/decks", text: "Mazzi" }),
        ".",
      ),
    );
  } else {
    summary.append(
      el("p", { class: "muted" },
        `${counts.total} carte pronte per la sessione di oggi.`,
      ),
    );
  }

  if (stats.streak?.current) {
    summary.append(
      el("p", { class: "streak-inline" },
        "🔥 ",
        el("strong", { text: String(stats.streak.current) }),
        ` giorni di fila (record: ${stats.streak.longest})`,
      ),
    );
  }

  return { destroy() {} };
}

function card(label, value, kind) {
  return el(
    "div",
    { class: `stat-card stat-card--${kind}` },
    el("span", { class: "stat-card__value", text: String(value) }),
    el("span", { class: "stat-card__label", text: label }),
  );
}