export function createRouter({ routes, outlet, fallback = "/home" }) {
  let current = null;
  let currentPath = null;

  async function render() {
    const raw = location.hash.replace(/^#/, "") || fallback;
    const path = raw.split("?")[0];

    if (path === currentPath) return;

    const loader = routes[path];
    if (!loader) {
      location.hash = `#${fallback}`;
      return;
    }

    if (current && typeof current.destroy === "function") {
      try {
        current.destroy();
      } catch (e) {
        console.warn("Errore nel destroy della view:", e);
      }
    }

    outlet.replaceChildren();
    const tpl = document.getElementById(`view-${path.slice(1)}`);
    if (tpl) outlet.appendChild(tpl.content.cloneNode(true));

    try {
      const mod = await loader();
      current = mod.mount ? await mod.mount(outlet, { path }) : null;
    } catch (e) {
      console.error(`Errore nel caricamento della view "${path}":`, e);
      current = null;
    }

    currentPath = path;
    document.querySelectorAll("[data-route]").forEach((a) => {
      a.classList.toggle("is-active", a.getAttribute("href") === `#${path}`);
    });

    outlet.focus?.({ preventScroll: true });
  }

  function start() {
    window.addEventListener("hashchange", render);
    if (!location.hash) location.hash = `#${fallback}`;
    else render();
  }

  return { start, render };
}