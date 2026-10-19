const VERSION = "v1";
const STATIC_CACHE = `flashcards-static-${VERSION}`;
const RUNTIME_CACHE = `flashcards-runtime-${VERSION}`;

const PRECACHE = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/src/main.js",
  "/src/core/config.js",
  "/src/core/events.js",
  "/src/core/state.js",
  "/src/srs/scheduler.js",
  "/src/srs/queue.js",
  "/src/storage/db.js",
  "/src/storage/schema.js",
  "/src/storage/repository.js",
  "/src/storage/backup.js",
  "/src/ui/dom.js",
  "/src/ui/router.js",
  "/src/ui/theme.js",
  "/src/ui/toast.js",
  "/src/ui/dialog.js",
  "/src/ui/components/card.js",
  "/src/ui/components/progress.js",
  "/src/ui/components/chart.js",
  "/src/styles/tokens.css",
  "/src/styles/base.css",
  "/src/styles/layout.css",
  "/src/styles/components.css",
  "/src/styles/views.css",
  "/public/icons/icon-192.png",
  "/public/icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) =>
      Promise.all(
        PRECACHE.map((url) =>
          cache.add(url).catch((err) => console.warn("Precache miss:", url, err)),
        ),
      ),
    ),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== STATIC_CACHE && k !== RUNTIME_CACHE)
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Navigazione: network-first con fallback alla cache
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(RUNTIME_CACHE).then((c) => c.put(request, copy));
          return res;
        })
        .catch(() =>
          caches.match(request).then((r) => r || caches.match("/index.html")),
        ),
    );
    return;
  }

  // Asset statici: cache-first con stale-while-revalidate
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) {
        fetch(request)
          .then((res) => {
            if (res.ok) caches.open(STATIC_CACHE).then((c) => c.put(request, res));
          })
          .catch(() => {});
        return cached;
      }
      return fetch(request)
        .then((res) => {
          if (res.ok && url.pathname.startsWith("/src/")) {
            const copy = res.clone();
            caches.open(STATIC_CACHE).then((c) => c.put(request, copy));
          }
          return res;
        })
        .catch(() => caches.match("/index.html"));
    }),
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});