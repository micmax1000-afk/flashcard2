/**
 * Versione dello schema del database.
 * Incrementala ogni volta che cambi la struttura degli store,
 * poi aggiungi un blocco `if (oldVersion < N) { ... }` in `upgradeDb`.
 */
export const SCHEMA_VERSION = 1;

export function upgradeDb(db, oldVersion, _transaction) {
  if (oldVersion < 1) {
    const decks = db.createObjectStore("decks", { keyPath: "id" });
    decks.createIndex("by_name", "name");

    const cards = db.createObjectStore("cards", { keyPath: "id" });
    cards.createIndex("by_deck", "deckId");
    cards.createIndex("by_due", "due");
    cards.createIndex("by_rep_due", ["repetitions", "due"]);

    const reviews = db.createObjectStore("reviews", { keyPath: "id" });
    reviews.createIndex("by_card", "cardId");
    reviews.createIndex("by_at", "at");

    db.createObjectStore("meta", { keyPath: "key" });
  }

  // Esempio per il futuro:
  // if (oldVersion < 2) {
  //   const cards = _transaction.objectStore("cards");
  //   cards.createIndex("by_tag", "tag");
  // }
}