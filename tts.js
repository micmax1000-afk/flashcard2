/* =========================================================================
 * tts.js — Sintesi vocale con precaricamento, cache e selezione voce
 * Da caricare DOPO data.js e meta.js, PRIMA dello script dell'app.
 *
 * API pubblica:
 *   TTS.speak(text, lang)             → Promise<void>
 *   TTS.stop()
 *   TTS.pickBestVoice(lang)           → SpeechSynthesisVoice | null
 *   TTS.getVoices(lang?)              → SpeechSynthesisVoice[]
 *   TTS.getSelectedVoice(lang)        → SpeechSynthesisVoice | null
 *   TTS.setVoice(lang, voiceName)     → salva la scelta per la lingua
 *   TTS.clearVoiceSelection(lang)
 *   TTS.onVoicesReady(cb)             → eseguito quando le voci sono pronte
 *   TTS.preload()                     → Promise: "riscalda" il motore TTS
 *   TTS.isReady()                     → boolean
 *   TTS.isSupported()                 → boolean
 *   TTS.openAIConfigured()            → boolean
 *
 * Configurazione opzionale:
 *   window.OPENAI_API_KEY = "sk-..."
 * ========================================================================= */

(function () {
  "use strict";

  // ---------------------------------------------------------------------
  // COSTANTI
  // ---------------------------------------------------------------------
  const VOICE_STORAGE_KEY = "flashcard-voice-prefs-v1";
  const PRELOAD_TEXT = "Hello";

  const VOICE_PATTERNS = [
    /Online \(Natural\)/i,          // Edge Windows — migliori gratuite
    /Natural/i,
    /Google.*(US|UK|Neural)/i,
    /Premium/i,                     // Apple
    /Enhanced/i,                    // Apple
    /Siri/i,
  ];

  // ---------------------------------------------------------------------
  // STATO INTERNO
  // ---------------------------------------------------------------------
  const state = {
    supported: "speechSynthesis" in window,
    voicesReady: false,
    allVoices: [],
    voicesByLang: new Map(),        // "en" → [voices]
    selectedByLang: {},             // "en-US" → voiceName
    preloadedLangs: new Set(),
    currentAudio: null,
    readyCallbacks: [],
  };

  // ---------------------------------------------------------------------
  // PERSISTENZA PREFERENZE VOCE
  // ---------------------------------------------------------------------
  function loadPrefs() {
    try {
      const raw = localStorage.getItem(VOICE_STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (data && typeof data === "object") {
        state.selectedByLang = data;
      }
    } catch (err) {
      console.warn("[tts.js] pref lettura fallita:", err);
    }
  }

  function savePrefs() {
    try {
      localStorage.setItem(VOICE_STORAGE_KEY, JSON.stringify(state.selectedByLang));
    } catch (err) {
      console.warn("[tts.js] pref scrittura fallita:", err);
    }
  }

  // ---------------------------------------------------------------------
  // CARICAMENTO E CACHE DELLE VOCI
  // ---------------------------------------------------------------------
  function groupVoicesByLang(voices) {
    const map = new Map();
    for (const v of voices) {
      const prefix = (v.lang || "").split("-")[0].toLowerCase();
      if (!map.has(prefix)) map.set(prefix, []);
      map.get(prefix).push(v);
    }
    return map;
  }

  function refreshVoices() {
    if (!state.supported) return;
    const voices = speechSynthesis.getVoices() || [];
    if (!voices.length) return;

    state.allVoices = voices.slice();
    state.voicesByLang = groupVoicesByLang(voices);
    state.voicesReady = true;

    // Debug utile in console
    const groups = [...state.voicesByLang.entries()]
      .map(([k, v]) => `${k}:${v.length}`)
      .join(", ");
    console.log(`[tts.js] ${voices.length} voci caricate (${groups})`);

    while (state.readyCallbacks.length) {
      try { state.readyCallbacks.shift()(); } catch (e) { console.warn(e); }
    }
  }

  // ---------------------------------------------------------------------
  // SELEZIONE VOCE MIGLIORE
  // ---------------------------------------------------------------------
  function langPrefix(lang) {
    return (lang || "en-US").split("-")[0].toLowerCase();
  }

  function pickBestVoice(lang) {
    if (!state.voicesReady) return null;
    const prefix = langPrefix(lang);
    const voices = state.voicesByLang.get(prefix) || [];
    if (!voices.length) return null;

    // Prima la voce scelta dall'utente (match esatto o per prefisso)
    const selectedName = state.selectedByLang[lang];
    if (selectedName) {
      const exact = voices.find((v) => v.name === selectedName);
      if (exact) return exact;
    }

    // Poi le voci prioritarie per nome
    for (const re of VOICE_PATTERNS) {
      const match = voices.find((v) => re.test(v.name));
      if (match) return match;
    }

    // Fallback: prima voce della lingua
    return voices[0];
  }

  function getVoices(lang) {
    if (!state.voicesReady) return [];
    if (!lang) return state.allVoices.slice();
    const prefix = langPrefix(lang);
    return (state.voicesByLang.get(prefix) || []).slice();
  }

  function getSelectedVoice(lang) {
    return pickBestVoice(lang);
  }

  function setVoice(lang, voiceName) {
    if (!voiceName) {
      delete state.selectedByLang[lang];
    } else {
      state.selectedByLang[lang] = voiceName;
    }
    savePrefs();
    console.log(`[tts.js] Voce per ${lang}: ${voiceName || "(auto)"}`);
  }

  function clearVoiceSelection(lang) {
    delete state.selectedByLang[lang];
    savePrefs();
  }

  // ---------------------------------------------------------------------
  // PRECARICAMENTO
  // ---------------------------------------------------------------------
  // "Riscalda" il motore TTS con un'utterance a volume 0,
  // riducendo la latenza alla prima vera pronuncia.
  function preloadLang(lang) {
    if (!state.supported) return Promise.resolve();
    if (state.preloadedLangs.has(lang)) return Promise.resolve();

    return new Promise((resolve) => {
      try {
        const utter = new SpeechSynthesisUtterance(PRELOAD_TEXT);
        utter.lang = lang;
        utter.volume = 0;
        utter.rate = 1;
        const voice = pickBestVoice(lang);
        if (voice) utter.voice = voice;

        let done = false;
        const finish = () => {
          if (done) return;
          done = true;
          state.preloadedLangs.add(lang);
          resolve();
        };
        utter.onend = finish;
        utter.onerror = finish;
        setTimeout(finish, 800); // timeout di sicurezza

        speechSynthesis.cancel();
        speechSynthesis.speak(utter);
      } catch (err) {
        console.warn("[tts.js] preload errore:", err);
        resolve();
      }
    });
  }

  async function preload(langs) {
    const list = Array.isArray(langs) ? langs : ["en-US", "es-ES", "fr-FR", "de-DE"];
    for (const lang of list) {
      await preloadLang(lang);
    }
  }

  // ---------------------------------------------------------------------
  // OPENAI TTS (opzionale)
  // ---------------------------------------------------------------------
  function stopAudio() {
    if (state.currentAudio) {
      try { state.currentAudio.pause(); } catch (_) {}
      try { URL.revokeObjectURL(state.currentAudio.src); } catch (_) {}
      state.currentAudio = null;
    }
  }

  async function speakWithOpenAI(text, lang) {
    const key = window.OPENAI_API_KEY;
    if (!key) return false;

    try {
      const res = await fetch("https://api.openai.com/v1/audio/speech", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "tts-1",
          voice: "nova",
          input: text,
          speed: 0.95,
        }),
      });
      if (!res.ok) throw new Error(await res.text());

      const blob = await res.blob();
      stopAudio();
      state.currentAudio = new Audio(URL.createObjectURL(blob));
      state.currentAudio.lang = lang || "en-US";
      await state.currentAudio.play();
      return true;
    } catch (err) {
      console.warn("[tts.js] OpenAI TTS fallito, fallback Web Speech:", err);
      return false;
    }
  }

  // ---------------------------------------------------------------------
  // WEB SPEECH
  // ---------------------------------------------------------------------
  function speakWebSpeech(text, lang) {
    return new Promise((resolve) => {
      if (!state.supported) return resolve();

      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = lang || "en-US";
      utter.rate = 0.95;
      utter.pitch = 1.0;
      utter.volume = 1.0;

      const voice = pickBestVoice(lang);
      if (voice) utter.voice = voice;

      utter.onend = () => resolve();
      utter.onerror = (e) => {
        console.warn("[tts.js] speechSynthesis error:", e.error);
        resolve();
      };

      speechSynthesis.cancel();
      speechSynthesis.speak(utter);
    });
  }

  // ---------------------------------------------------------------------
  // API PUBBLICA
  // ---------------------------------------------------------------------
  async function speak(text, lang) {
    if (!text) return;
    const usedOpenAI = await speakWithOpenAI(text, lang);
    if (!usedOpenAI) await speakWebSpeech(text, lang);
  }

  function stop() {
    if (state.supported) speechSynthesis.cancel();
    stopAudio();
  }

  function onVoicesReady(cb) {
    if (state.voicesReady) {
      try { cb(); } catch (e) { console.warn(e); }
    } else {
      state.readyCallbacks.push(cb);
    }
  }

  // ---------------------------------------------------------------------
  // INIZIALIZZAZIONE
  // ---------------------------------------------------------------------
  loadPrefs();

  if (state.supported) {
    // Primo tentativo sincrono
    refreshVoices();

    // Evento ufficiale
    if (typeof speechSynthesis.onvoiceschanged !== "undefined") {
      speechSynthesis.onvoiceschanged = refreshVoices;
    }

    // Polling di sicurezza (alcuni browser non sparano l'evento)
    let pollCount = 0;
    const poll = setInterval(() => {
      pollCount++;
      if (state.voicesReady || pollCount > 40) {
        clearInterval(poll);
        return;
      }
      refreshVoices();
    }, 250);

    // Precarica le lingue principali in background appena pronte
    onVoicesReady(() => {
      setTimeout(() => {
        preload(["en-US", "es-ES", "fr-FR", "de-DE"]).catch(() => {});
      }, 300);
    });
  } else {
    console.warn("[tts.js] Web Speech API non supportata.");
  }

  // ---------------------------------------------------------------------
  // EXPORT
  // ---------------------------------------------------------------------
  window.TTS = {
    speak,
    stop,
    pickBestVoice,
    getVoices,
    getSelectedVoice,
    setVoice,
    clearVoiceSelection,
    onVoicesReady,
    preload,
    isReady: () => state.voicesReady,
    isSupported: () => state.supported,
    openAIConfigured: () => !!window.OPENAI_API_KEY,
    // Debug
    _state: state,
  };
})();
