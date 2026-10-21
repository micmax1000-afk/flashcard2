import { el } from "../dom.js";

/**
 * Grafico a barre minimale in SVG, senza dipendenze.
 * @param {object} opts
 * @param {number} opts.width         larghezza viewBox (default 320)
 * @param {number} opts.height        altezza viewBox (default 120)
 * @param {string} [opts.label]       etichetta in alto
 * @param {(v:number)=>string} [opts.format]  formattazione del valore corrente
 */
export function createBarChart({ width = 320, height = 120, label = "", format } = {}) {
  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.setAttribute("class", "chart");
  svg.setAttribute("role", "img");

  const labelEl = el("div", { class: "chart__label", text: label });
  const root = el("div", { class: "chart-wrap" }, labelEl, svg);

  const fmt = format || ((v) => String(v));

  /**
   * @param {number[]} values
   * @param {string[]} [labels]
   */
  function set(values, labels) {
    if (!values || !values.length) {
      svg.replaceChildren();
      svg.setAttribute("aria-label", "Nessun dato");
      return;
    }
    const max = Math.max(1, ...values);
    const pad = 4;
    const gap = 4;
    const bw = (width - pad * 2 - gap * (values.length - 1)) / values.length;
    const baseY = height - pad;

    svg.replaceChildren();
    values.forEach((v, i) => {
      const h = Math.round((v / max) * (height - pad * 2 - 12));
      const x = pad + i * (bw + gap);
      const y = baseY - h;
      const rect = document.createElementNS(svgNS, "rect");
      rect.setAttribute("x", String(x));
      rect.setAttribute("y", String(y));
      rect.setAttribute("width", String(bw));
      rect.setAttribute("height", String(h));
      rect.setAttribute("rx", "3");
      rect.setAttribute("class", "chart__bar");
      const title = document.createElementNS(svgNS, "title");
      title.textContent = `${labels?.[i] ?? i}: ${fmt(v)}`;
      rect.appendChild(title);
      svg.appendChild(rect);
    });
    svg.setAttribute("aria-label", `Grafico: ${values.map(fmt).join(", ")}`);
  }

  return { node: root, set };
}

/**
 * Mini "heatmap" a 7 colonne per i giorni di studio (settimana corrente).
 * @param {{days:string[]}} streak  elenco di date locali YYYY-MM-DD
 * @param {number} [weeks=8]
 */
export function createHeatmap({ weeks = 8 } = {}) {
  const root = el("div", { class: "heatmap", role: "img", "aria-label": "Attività di studio" });

  function set(days) {
    const set_ = new Set(days || []);
    const total = weeks * 7;
    root.replaceChildren();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(today);
    start.setDate(start.getDate() - (total - 1));

    for (let i = 0; i < total; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const key = dayKey(d);
      const active = set_.has(key);
      root.appendChild(
        el("span", {
          class: `heatmap__cell ${active ? "is-active" : ""}`,
          title: key,
          ariaHidden: "true",
        }),
      );
    }
  }

  return { node: root, set };
}

function dayKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}