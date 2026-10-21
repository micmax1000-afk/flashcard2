import { getRepository } from "../storage/repository.js";
import { el } from "../ui/dom.js";
import { createBarChart, createHeatmap } from "../ui/components/chart.js";

const RECENT_DAYS = 7;
const HEATMAP_WEEKS = 8;

export async function mount(outlet) {
  const container = outlet.querySelector("#stats-content");
  const repo = await getRepository();

  const [stats, reviews] = await Promise.all([
    repo.getStats(),
    repo.backend.getAll("reviews"),
  ]);

  // 1) Riepilogo numerico
  container.append(
    el("div", { class: "stat-grid" },
      statCard("Totale carte", stats.total),
      statCard("Nuove", stats.new),
      statCard("In apprendimento", stats.learning),
      statCard("Consolidate", stats.known),
      statCard("Precisione", `${Math.round(stats.accuracy * 100)}%`),
      statCard("Review totali", stats.totalReviews),
    ),
  );

  // 2) Streak + heatmap
  const streak = stats.streak || { current: 0, longest: 0, days: [] };
  const heatmap = createHeatmap({ weeks: HEATMAP_WEEKS });
  heatmap.set(streak.days || []);

  container.append(
    el("section", { class: "stats-section" },
      el("h3", { text: "Streak" }),
      el("p", { class: "stats-streak" },
        el("strong", { text: String(streak.current) }),
        " ",
        el("span", { class: "muted", text: `giorni (record: ${streak.longest})` }),
      ),
      heatmap.node,
    ),
  );

  // 3) Attività ultimi 7 giorni
  const days = lastNDays(RECENT_DAYS);
  const counts = days.map(({ key }) =>
    reviews.filter((r) => dayKey(new Date(r.at)) === key).length,
  );

  const chart = createBarChart({
    label: "Ripassi ultimi 7 giorni",
    format: (v) => String(v),
  });
  chart.set(counts, days.map((d) => d.key));

  container.append(
    el("section", { class: "stats-section" },
      el("h3", { text: "Attività recente" }),
      chart.node,
    ),
  );

  return { destroy() {} };
}

function statCard(label, value) {
  return el(
    "div",
    { class: "stat-card" },
    el("span", { class: "stat-card__value", text: String(value) }),
    el("span", { class: "stat-card__label", text: label }),
  );
}

function lastNDays(n) {
  const out = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    out.push({ date: d, key: dayKey(d) });
  }
  return out;
}

function dayKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}