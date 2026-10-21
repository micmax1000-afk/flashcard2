export function createEventBus() {
  const listeners = new Map();

  function on(event, handler) {
    if (!listeners.has(event)) listeners.set(event, new Set());
    listeners.get(event).add(handler);
    return () => off(event, handler);
  }

  function off(event, handler) {
    listeners.get(event)?.delete(handler);
  }

  function emit(event, payload) {
    listeners.get(event)?.forEach((h) => {
      try {
        h(payload);
      } catch (e) {
        console.error(`Errore in handler evento "${event}":`, e);
      }
    });
  }

  return { on, off, emit };
}

export const bus = createEventBus();

export const EVENTS = {
  CARD_REVIEWED: "card:reviewed",
  SESSION_STARTED: "session:started",
  SESSION_ENDED: "session:ended",
  THEME_CHANGED: "theme:changed",
  DECK_CHANGED: "deck:changed",
};
