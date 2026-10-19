import { el } from "./dom.js";

let container = null;

function ensureContainer() {
  if (container && document.body.contains(container)) return container;
  container = el("div", {
    class: "toast-stack",
    role: "status",
    "aria-live": "polite",
    "aria-atomic": "false",
  });
  document.body.appendChild(container);
  return container;
}

/**
 * @param {string} message
 * @param {"info"|"success"|"warn"|"error"} kind
 * @param {number} duration  ms; 0 = permanente (chiudibile a mano)
 */
export function toast(message, kind = "info", duration = 3000) {
  const stack = ensureContainer();
  const node = el(
    "div",
    { class: `toast toast--${kind}`, role: kind === "error" ? "alert" : "status" },
    el("span", { class: "toast__msg", text: message }),
    el(
      "button",
      {
        type: "button",
        class: "toast__close",
        "aria-label": "Chiudi notifica",
        onClick: () => close(node),
      },
      "✕",
    ),
  );
  stack.appendChild(node);

  requestAnimationFrame(() => node.classList.add("is-open"));

  let timer = null;
  if (duration > 0) {
    timer = setTimeout(() => close(node), duration);
  }

  function close(target) {
    if (timer) clearTimeout(timer);
    target.classList.remove("is-open");
    target.addEventListener("transitionend", () => target.remove(), { once: true });
    // fallback se prefers-reduced-motion disattiva la transition
    setTimeout(() => target.remove(), 400);
  }

  return { close: () => close(node) };
}