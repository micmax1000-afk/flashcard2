import js from "@eslint/js";

const browserGlobals = {
  window: "readonly",
  document: "readonly",
  localStorage: "readonly",
  sessionStorage: "readonly",
  indexedDB: "readonly",
  navigator: "readonly",
  location: "readonly",
  console: "readonly",
  fetch: "readonly",
  caches: "readonly",
  self: "readonly",
  setTimeout: "readonly",
  clearTimeout: "readonly",
  setInterval: "readonly",
  clearInterval: "readonly",
  queueMicrotask: "readonly",
  requestAnimationFrame: "readonly",
  cancelAnimationFrame: "readonly",
  URL: "readonly",
  Blob: "readonly",
  FileReader: "readonly",
  Promise: "readonly",
  Event: "readonly",
  CustomEvent: "readonly",
  AbortController: "readonly",
  HTMLElement: "readonly",
  MutationObserver: "readonly",
  Audio: "readonly",
  SpeechSynthesisUtterance: "readonly",
  confirm: "readonly",
  alert: "readonly",
  prompt: "readonly",
  structuredClone: "readonly",
  crypto: "readonly",
  clients: "readonly",
  Response: "readonly",
  Request: "readonly",
  Node: "readonly",
  URLSearchParams: "readonly",
  speechSynthesis: "readonly",
};

const rules = {
  "no-unused-vars": ["warn", { argsIgnorePattern: "^_", caughtErrors: "none" }],
  "no-console": ["warn", { allow: ["warn", "error", "info"] }],
  "prefer-const": "warn",
  eqeqeq: ["warn", "smart"],
  // catch vuoti voluti: operazioni "best effort" (localStorage, TTS)
  "no-empty": ["error", { allowEmptyCatch: true }],
};

export default [
  {
    // android/ e node_modules sono generati; le cartelle www/* a parte gli script
    // caricati da index.html sono copie dei moduli di src/ non usate dall'app.
    ignores: [
      "node_modules/**",
      "android/**",
      "www/core/**",
      "www/srs/**",
      "www/storage/**",
      "www/ui/**",
      "www/views/**",
      "www/styles/**",
      "www/main.js",
    ],
  },
  js.configs.recommended,
  {
    // Moduli ES (app modulare in src/, test, service worker)
    files: ["src/**/*.js", "tests/**/*.js", "sw.js", "www/sw.js"],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: "module",
      globals: browserGlobals,
    },
    rules,
  },
  {
    // data.js definisce DECKS: qui non va dichiarato come globale
    files: ["data.js", "www/data.js"],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: "script",
      globals: browserGlobals,
    },
    rules: { ...rules, "no-unused-vars": "off" },
  },
  {
    // Script classici caricati da index.html con <script src="...">
    files: ["meta.js", "tts.js", "www/app.js", "www/meta.js", "www/tts.js"],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: "script",
      globals: {
        ...browserGlobals,
        // definiti in data.js / meta.js / tts.js e usati dagli altri script
        DECKS: "writable",
        THEMES: "writable",
        LEVELS: "writable",
        TTS: "writable",
        getThemesForCards: "writable",
        getLevelsForCards: "writable",
        filterCards: "writable",
        Capacitor: "readonly",
      },
    },
    rules: {
      ...rules,
      // questi file definiscono globali condivisi tra gli script
      "no-unused-vars": "off",
    },
  },
];
