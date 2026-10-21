export function createStore(initial = {}) {
  let state = { ...initial };
  const listeners = new Set();

  function get() {
    return state;
  }

  function set(patch) {
    state = typeof patch === "function" ? patch(state) : { ...state, ...patch };
    listeners.forEach((fn) => fn(state));
  }

  function subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  }

  return { get, set, subscribe };
}
