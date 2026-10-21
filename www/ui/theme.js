import { STORAGE_KEYS } from "../core/config.js";
import { bus, EVENTS } from "../core/events.js";

export function initTheme() {
  const stored = safeGet(STORAGE_KEYS.THEME);
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const theme = stored || (prefersDark ? "dark" : "light");
  applyTheme(theme);

  document.getElementById("theme-toggle")?.addEventListener("click", () => {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    applyTheme(next);
    safeSet(STORAGE_KEYS.THEME, next);
    bus.emit(EVENTS.THEME_CHANGED, next);
  });

  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (ev) => {
    if (!safeGet(STORAGE_KEYS.THEME)) applyTheme(ev.matches ? "dark" : "light");
  });
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
}

function safeGet(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* ambiente senza storage: ignora */
  }
}