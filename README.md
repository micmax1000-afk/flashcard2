# Flashcards — Ripetizione dilazionata

Web app **offline-first** per studiare flashcard di vocabolario con **ripetizione dilazionata (SRS)**. Nessun backend, nessun account: tutti i dati restano nel browser.

## Funzionalità

- **SRS SM-2 semplificato** — ogni carta ha `ease`, `interval`, `repetitions`, `lapses`, `due`. Le risposte sono `again` / `hard` / `good` / `easy`.
- **Coda di sessione intelligente** — 5 ripassi ogni nuova carta, con limiti giornalieri configurabili.
- **Modalità Quiz** — scelta multipla con distrattori pescati dallo stesso mazzo.
- **Statistiche** — totale carte, nuove/in apprendimento/consolidate, precisione, streak giornaliera, heatmap ultime 8 settimane, attività ultimi 7 giorni.
- **Gestione mazzi e carte** — CRUD completo con dialog accessibili.
- **Backup JSON** — export e import (merge o replace) da Impostazioni.
- **PWA** — installabile, con service worker e cache versionata.
- **Tema chiaro/scuro** — toggle manuale + rispetto di `prefers-color-scheme`.
- **Accessibilità** — focus visibile, tastiera (Spazio/Invio per girare, 1–4 per rispondere, Esc per uscire), dialog con focus trap, `aria-live` sulle notifiche.

## Stack

- Vanilla JS (ES modules), nessun framework
- IndexedDB con fallback trasparente a localStorage
- CSS custom properties, tema chiaro/scuro
- Vitest per i test
- Service worker con precache + stale-while-revalidate

## Avvio locale

```bash
npm install
npm run dev          # http://localhost:3000