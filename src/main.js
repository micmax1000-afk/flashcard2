import { createRouter } from "./ui/router.js";
import { initTheme } from "./ui/theme.js";
import { ROUTES } from "./core/config.js";

const routes = {
  [ROUTES.HOME]: () => import("./views/home.js"),
  [ROUTES.STUDY]: () => import("./views/study.js"),
  [ROUTES.QUIZ]: () => import("./views/quiz.js"),
  [ROUTES.STATS]: () => import("./views/stats.js"),
  [ROUTES.DECKS]: () => import("./views/decks.js"),
  [ROUTES.SETTINGS]: () => import("./views/settings.js"),
};

initTheme();

const router = createRouter({
  routes,
  outlet: document.getElementById("main"),
  fallback: ROUTES.HOME,
});
router.start();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch((err) => {
      console.warn("Service worker non registrato:", err);
    });
  });
}
