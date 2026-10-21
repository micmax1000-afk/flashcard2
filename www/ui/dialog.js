import { el } from "./dom.js";

/**
 * Dialog accessibile con focus trap.
 * @param {object} options
 * @param {string} options.title
 * @param {string|Node} options.body
 * @param {Array<{label:string, value?:any, kind?:string, primary?:boolean, onClick?:Function}>} options.actions
 * @returns {{ close: () => void, result: Promise<any> }}
 */
export function openDialog({ title, body, actions = [] }) {
  const previouslyFocused = document.activeElement;
  let resolveResult;
  const result = new Promise((res) => (resolveResult = res));

  const content = el(
    "div",
    { class: "dialog", role: "dialog", "aria-modal": "true", "aria-labelledby": "dlg-title" },
    el("header", { class: "dialog__header" },
      el("h2", { id: "dlg-title", class: "dialog__title", text: title || "" }),
      el(
        "button",
        {
          type: "button",
          class: "dialog__close",
          "aria-label": "Chiudi",
          onClick: () => close(undefined),
        },
        "✕",
      ),
    ),
    el("div", { class: "dialog__body" },
      typeof body === "string" ? el("p", { text: body }) : body,
    ),
    actions.length
      ? el(
          "footer",
          { class: "dialog__footer" },
          actions.map((a) =>
            el(
              "button",
              {
                type: "button",
                class: `btn ${a.primary ? "btn-primary" : ""} ${a.kind ? `btn-${a.kind}` : ""}`.trim(),
                onClick: () => {
                  a.onClick?.();
                  close(a.value ?? a.label);
                },
              },
              a.label,
            ),
          ),
        )
      : null,
  );

  const backdrop = el("div", { class: "dialog-backdrop" }, content);
  document.body.appendChild(backdrop);
  document.body.style.overflow = "hidden";
  requestAnimationFrame(() => backdrop.classList.add("is-open"));

  // focus trap
  const focusables = () =>
    Array.from(
      content.querySelectorAll(
        'a[href],button:not([disabled]),textarea,input,select,[tabindex]:not([tabindex="-1"])',
      ),
    );

  function onKey(e) {
    if (e.key === "Escape") {
      e.preventDefault();
      close(undefined);
      return;
    }
    if (e.key !== "Tab") return;
    const items = focusables();
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
  document.addEventListener("keydown", onKey);

  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) close(undefined);
  });

  queueMicrotask(() => (focusables()[0] || content).focus());

  function close(value) {
    document.removeEventListener("keydown", onKey);
    document.body.style.overflow = "";
    backdrop.classList.remove("is-open");
    setTimeout(() => backdrop.remove(), 200);
    resolveResult(value);
    if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
  }

  return { close, result };
}

export function confirmDialog({ title, message, confirmLabel = "Conferma", danger = false }) {
  return new Promise((resolve) => {
    const dlg = openDialog({
      title,
      body: message,
      actions: [
        { label: "Annulla", value: false },
        {
          label: confirmLabel,
          value: true,
          primary: !danger,
          kind: danger ? "danger" : undefined,
        },
      ],
    });
    dlg.result.then((v) => resolve(v === true));
  });
}