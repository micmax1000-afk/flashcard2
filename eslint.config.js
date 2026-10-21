import js from "@eslint/js";

export default [
  js.configs.recommended,
  {
    files: ["src/**/*.js", "tests/**/*.js", "sw.js"],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: "module",
      globals: {
        window: "readonly",
        document: "readonly",
        localStorage: "readonly",
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
      },
    },
    rules: {
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "no-console": ["warn", { allow: ["warn", "error", "info"] }],
      "prefer-const": "warn",
      eqeqeq: ["warn", "smart"],
    },
  },
];
