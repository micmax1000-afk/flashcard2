/**
 * Backend astratto: due implementazioni con la stessa API.
 *   - IDB (se `indexedDB` è disponibile)
 *   - localStorage (fallback per ambienti sandbox o browser restrittivi)
 *
 * Interfaccia (tutte async, tranne `kind`):
 *   backend.kind
 *   backend.get(store, key)              -> record | null
 *   backend.getAll(store)                -> record[]
 *   backend.put(store, value)            -> key
 *   backend.delete(store, key)           -> void
 *   backend.clear(store)                 -> void
 */

const OPEN_TIMEOUT_MS = 3000;

export function isIndexedDbAvailable() {
  try {
    return typeof indexedDB !== "undefined" && indexedDB !== null;
  } catch {
    return false;
  }
}

export function openBackend({ name, version, upgrade }) {
  if (!isIndexedDbAvailable()) {
    return Promise.resolve(createLocalBackend(name));
  }

  return new Promise((resolve) => {
    let settled = false;
    const useFallback = (reason) => {
      if (settled) return;
      settled = true;
      if (reason) console.warn("IndexedDB non disponibile, uso localStorage:", reason);
      resolve(createLocalBackend(name));
    };

    try {
      const req = indexedDB.open(name, version);

      req.onupgradeneeded = (ev) => {
        try {
          upgrade(req.result, ev.oldVersion, req.transaction);
        } catch (err) {
          console.error("Errore durante la migrazione del DB:", err);
        }
      };

      req.onsuccess = () => {
        if (settled) {
          try { req.result.close(); } catch { /* noop */ }
          return;
        }
        settled = true;
        resolve(createIdbBackend(req.result));
      };

      req.onerror = () => useFallback(req.error);
      req.onblocked = () => useFallback("open bloccato");
      setTimeout(() => useFallback("timeout apertura DB"), OPEN_TIMEOUT_MS);
    } catch (err) {
      useFallback(err);
    }
  });
}

function promisifyRequest(req) {
  return new Promise((res, rej) => {
    req.onsuccess = () => res(req.result);
    req.onerror = () => rej(req.error);
  });
}

function createIdbBackend(db) {
  const tx = (store, mode = "readonly") => db.transaction(store, mode).objectStore(store);

  return {
    kind: "idb",
    get: (store, key) => promisifyRequest(tx(store).get(key)),
    getAll: (store) => promisifyRequest(tx(store).getAll()),
    put: (store, value) => promisifyRequest(tx(store, "readwrite").put(value)),
    delete: (store, key) => promisifyRequest(tx(store, "readwrite").delete(key)),
    clear: (store) => promisifyRequest(tx(store, "readwrite").clear()),
  };
}

function createLocalBackend(name) {
  const PREFIX = `flashcards:db:${name}:`;
  const keyFor = (store) => PREFIX + store;
  const keyField = (store) => (store === "meta" ? "key" : "id");

  function read(store) {
    try {
      const raw = localStorage.getItem(keyFor(store));
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  function write(store, arr) {
    try {
      localStorage.setItem(keyFor(store), JSON.stringify(arr));
    } catch (err) {
      console.warn(`localStorage pieno o non scrivibile (${store}):`, err);
    }
  }

  return {
    kind: "local",
    async get(store, key) {
      return read(store).find((r) => r[keyField(store)] === key) || null;
    },
    async getAll(store) {
      return read(store);
    },
    async put(store, value) {
      const arr = read(store);
      const field = keyField(store);
      const idx = arr.findIndex((r) => r[field] === value[field]);
      if (idx >= 0) arr[idx] = value;
      else arr.push(value);
      write(store, arr);
    },
    async delete(store, key) {
      const field = keyField(store);
      write(store, read(store).filter((r) => r[field] !== key));
    },
    async clear(store) {
      write(store, []);
    },
  };
}