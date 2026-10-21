/* =========================================================================
 * tts.js — Sintesi vocale con supporto nativo Android (Capacitor)
 * Da caricare DOPO data.js e meta.js, PRIMA dello script dell'app.
 *
 * Su Android usa @capacitor-community/text-to-speech.
 * Sul browser usa la Web Speech API (speechSynthesis).
 *
 * API pubblica invariata:
 *   TTS.speak(text, lang)             → Promise<void>
 *   TTS.stop()
 *   TTS.pickBestVoice(lang)           → voce selezionata/migliore
 *   TTS.getVoices(lang?)              → voci disponibili per lingua
 *   TTS.getSelectedVoice(lang)        → voce corrente
 *   TTS.setVoice(lang, voiceName)     → salva la scelta
 *   TTS.clearVoiceSelection(lang)
 *   TTS.onVoicesReady(cb)
 *   TTS.preload(langs?)               → Promise
 *   TTS.isReady()                     → boolean
 *   TTS.isSupported()                 → boolean
 *   TTS.openAIConfigured()            → boolean (legacy, sempre false)
 * ========================================================================= */

(function () {
  "use strict";

  // ---------------------------------------------------------------------
  // COSTANTI
  // ---------------------------------------------------------------------
  const VOICE_STORAGE_KEY = "flashcard-voice-prefs-v1";
  const PRELOAD_TEXT = "Hello";

  // Pattern per la scelta automatica della voce Web (solo browser)
  const WEB_VOICE_PATTERNS = [
    /Online \(Natural\)/i,
    /Natural/i,
    /Google.*(US|UK|Neural)/i,
    /Premium/i,
    /Enhanced/i,
    /Siri/i,
  ];

  // ---------------------------------------------------------------------
  // STATO
  // ---------------------------------------------------------------------
  const state = {
    // Web Speech
    supportedWeb: "speechSynthesis" in window,
    voicesReadyWeb: false,
    allVoicesWeb: [],
    voicesByLangWeb: new Map(),

    // Nativo (Capacitor)
    native: false,
    nativeInitialized: false,
    nativeInitializing: null,
    voicesReadyNative: false,
    voicesNative: [],              // tutti gli oggetti voce nativi
    voicesByLangNative: new Map(), // "en" → [oggetti voce]
    selectedIndexByLang: {},       // "en-US" → indice numerico nel plugin

    // Comune
    selectedByLangWeb: {},         // "en-US" → voiceName (Web)
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
        // Formato v1: { "en-US": "voce web" }  → può contenere sia web che nativo?
        // Per evitare conflitti, separiamo con chiavi diverse.
        if (data.web) state.selectedByLangWeb = data.web;
        if (data.native) state.selectedIndexByLang = data.native;
      }
    } catch (err) {
      console.warn("[tts.js] pref lettura fallita:", err);
    }
  }

  function savePrefs() {
    try {
      localStorage.setItem(
        VOICE_STORAGE_KEY,
        JSON.stringify({
          web: state.selectedByLangWeb,
          native: state.selectedIndexByLang,
        })
      );
    } catch (err) {
      console.warn("[tts.js] pref scrittura fallita:", err);
    }
  }

  // ---------------------------------------------------------------------
  // HELPER
  // ---------------------------------------------------------------------
  function langPrefix(lang) {
    return (lang || "en-US").split("-")[0].toLowerCase();
  }

  // ---------------------------------------------------------------------
  // INIZIALIZZAZIONE NATIVA (Capacitor)
  // ---------------------------------------------------------------------
  async function initNative() {
    if (state.nativeInitialized) return;
    if (state.nativeInitializing) return state.nativeInitializing;

    state.nativeInitializing = (async () => {
      try {
        const cap = await import("@capacitor/core");
        const Capacitor = cap.Capacitor;
        if (!Capacitor.isNativePlatform()) {
          state.native = false;
          state.nativeInitialized = true;
          state.nativeInitializing = null;
          return;
        }

        const mod = await import("@capacitor-community/text-to-speech");
        const TextToSpeech = mod.TextToSpeech;
        if (!TextToSpeech) throw new Error("TextToSpeech non trovato nel plugin");

        state.native = true;
        state.TextToSpeech = TextToSpeech;

        // Carica le voci disponibili
        await loadNativeVoices();

        state.nativeInitialized = true;
      } catch (err) {
        console.warn("[tts.js] Plugin nativo non disponibile:", err);
        state.native = false;
        state.nativeInitialized = true;
      } finally {
        state.nativeInitializing = null;
      }
    })();

    return state.nativeInitializing;
  }

  async function loadNativeVoices() {
    if (!state.TextToSpeech) return;
    try {
      const result = await state.TextToSpeech.getSupportedVoices();
      const voices = result.voices || [];
      state.voicesNative = voices;

      const byLang = new Map();
      for (const v of voices) {
        const prefix = langPrefix(v.lang);
        if (!byLang.has(prefix)) byLang.set(prefix, []);
        byLang.get(prefix).push(v);
      }
      state.voicesByLangNative = byLang;
      state.voicesReadyNative = true;

      console.log(`[tts.js] ${voices.length} voci native caricate`);

      // Notifica i callback in attesa
      flushReadyCallbacks();
    } catch (err) {
      console.warn("[tts.js] getSupportedVoices fallito:", err);
      state.voicesReadyNative = true;
      flushReadyCallbacks();
    }
  }

  // ---------------------------------------------------------------------
  // WEB SPEECH — caricamento voci
  // ---------------------------------------------------------------------
  function refreshWebVoices() {
    if (!state.supportedWeb) return;
    const voices = speechSynthesis.getVoices() || [];
    if (!voices.length) return;

    state.allVoicesWeb = voices.slice();
    state.voicesByLangWeb = new Map();
    for (const v of voices) {
      const prefix = langPrefix(v.lang);
      if (!state.voicesByLangWeb.has(prefix)) state.voicesByLangWeb.set(prefix, []);
      state.voicesByLangWeb.get(prefix).push(v);
    }
    state.voicesReadyWeb = true;
    flushReadyCallbacks();
  }

  // ---------------------------------------------------------------------
  // CALLBACK READY
  // ---------------------------------------------------------------------
  function flushReadyCallbacks() {
    const ready = state.native ? state.voicesReadyNative : state.voicesReadyWeb;
    if (!ready) return;
    while (state.readyCallbacks.length) {
      try { state.readyCallbacks.shift()(); } catch (e) { console.warn(e); }
    }
  }

  function onVoicesReady(cb) {
    const ready = state.native ? state.voicesReadyNative : state.voicesReadyWeb;
    if (ready) {
      try { cb(); } catch (e) { console.warn(e); }
    } else {
      state.readyCallbacks.push(cb);
    }
  }

  // ---------------------------------------------------------------------
  // SELEZIONE VOCE
  // ---------------------------------------------------------------------
  function pickBestVoice(lang) {
    if (state.native) {
      if (!state.voicesReadyNative) return null;
      const prefix = langPrefix(lang);
      const voices = state.voicesByLangNative.get(prefix) || [];
      if (!voices.length) return null;

      // 1. Voce scelta dall'utente (indice)
      const savedIndex = state.selectedIndexByLang[lang];
      if (typeof savedIndex === "number" && voices[savedIndex]) {
        return voices[savedIndex];
      }

      // 2. Voce di default per la lingua
      const def = voices.find((v) => v.default);
      if (def) return def;

      // 3. Prima voce disponibile
      return voices[0];
    }

    // Web Speech
    if (!state.voicesReadyWeb) return null;
    const prefix = langPrefix(lang);
    const voices = state.voicesByLangWeb.get(prefix) || [];
    if (!voices.length) return null;

    const selectedName = state.selectedByLangWeb[lang];
    if (selectedName) {
      const exact = voices.find((v) => v.name === selectedName);
      if (exact) return exact;
    }

    for (const re of WEB_VOICE_PATTERNS) {
      const match = voices.find((v) => re.test(v.name));
      if (match) return match;
    }
    return voices[0];
  }

  function getVoices(lang) {
    if (state.native) {
      if (!state.voicesReadyNative) return [];
      if (!lang) return state.voicesNative.slice();
      const prefix = langPrefix(lang);
      return (state.voicesByLangNative.get(prefix) || []).slice();
    }

    if (!state.voicesReadyWeb) return [];
    if (!lang) return state.allVoicesWeb.slice();
    const prefix = langPrefix(lang);
    return (state.voicesByLangWeb.get(prefix) || []).slice();
  }

  function getSelectedVoice(lang) {
    return pickBestVoice(lang);
  }

  function setVoice(lang, voiceNameOrIndex) {
    if (state.native) {
      // voiceNameOrIndex può essere un indice o un nome.
      // L'UI attuale passa il nome (v.name). Cerchiamo l'indice globale.
      if (typeof voiceNameOrIndex === "number") {
        state.selectedIndexByLang[lang] = voiceNameOrIndex;
      } else if (typeof voiceNameOrIndex === "string") {
        const idx = state.voicesNative.findIndex(
          (v) => v.name === voiceNameOrIndex && langPrefix(v.lang) === langPrefix(lang)
        );
        if (idx >= 0) state.selectedIndexByLang[lang] = idx;
        else delete state.selectedIndexByLang[lang];
      } else {
        delete state.selectedIndexByLang[lang];
      }
      savePrefs();
      console.log(`[tts.js] Voce nativa per ${lang}: indice ${state.selectedIndexByLang[lang]}`);
      return;
    }

    // Web Speech
    if (!voiceNameOrIndex) {
      delete state.selectedByLangWeb[lang];
    } else {
      state.selectedByLangWeb[lang] = voiceNameOrIndex;
    }
    savePrefs();
    console.log(`[tts.js] Voce Web per ${lang}: ${voiceNameOrIndex || "(auto)"}`);
  }

  function clearVoiceSelection(lang) {
    if (state.native) {
      delete state.selectedIndexByLang[lang];
    } else {
      delete state.selectedByLangWeb[lang];
    }
    savePrefs();
  }

  // ---------------------------------------------------------------------
  // PRECARICAMENTO
  // ---------------------------------------------------------------------
  async function preload(langs) {
    const list = Array.isArray(langs) ? langs : ["en-US", "es-ES", "fr-FR", "de-DE"];

    if (state.native) {
      // Le voci native sono già caricate da loadNativeVoices().
      // Non serve "riscaldare" il motore; verifichiamo solo le lingue.
      for (const lang of list) {
        try {
          await state.TextToSpeech.isLanguageSupported({ lang });
        } catch (_) { /* ignora */ }
      }
      return;
    }

    // Web Speech: riscalda il motore
    for (const lang of list) {
      await preloadWebLang(lang);
    }
  }

  function preloadWebLang(lang) {
    if (!state.supportedWeb) return Promise.resolve();
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
        setTimeout(finish, 800);

        speechSynthesis.cancel();
        speechSynthesis.speak(utter);
      } catch (err) {
        console.warn("[tts.js] preload Web errore:", err);
        resolve();
      }
    });
  }

  // ---------------------------------------------------------------------
  // SPEAK
  // ---------------------------------------------------------------------
  async function speak(text, lang) {
    if (!text) return;

    // Assicurati che il nativo sia inizializzato prima di decidere
    if (!state.nativeInitialized) {
      await initNative();
    }

    if (state.native) {
      try {
        const options = {
          text: text,
          lang: lang || "en-US",
          rate: 0.95,
          pitch: 1.0,
          volume: 1.0,
          category: "ambient",
          queueStrategy: 1,
        };

        const selected = pickBestVoice(lang);
        if (selected) {
          const idx = state.voicesNative.indexOf(selected);
          if (idx >= 0) options.voice = idx;
        }

        await state.TextToSpeech.speak(options);
        return;
      } catch (err) {
        console.warn("[tts.js] TTS nativo fallito:", err);
        // Non facciamo fallback a Web Speech su Android: non funzionerebbe.
        return;
      }
    }

    // Web Speech (browser)
    await speakWebSpeech(text, lang);
  }

  function speakWebSpeech(text, lang) {
    return new Promise((resolve) => {
      if (!state.supportedWeb) return resolve();

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
  // STOP
  // ---------------------------------------------------------------------
  function stop() {
    if (state.native && state.TextToSpeech) {
      state.TextToSpeech.stop().catch(() => {});
      return;
    }
    if (state.supportedWeb) speechSynthesis.cancel();
    stopAudio();
  }

  function stopAudio() {
    if (state.currentAudio) {
      try { state.currentAudio.pause(); } catch (_) {}
      try { URL.revokeObjectURL(state.currentAudio.src); } catch (_) {}
      state.currentAudio = null;
    }
  }

  // ---------------------------------------------------------------------
  // SUPPORTO
  // ---------------------------------------------------------------------
  function isSupported() {
    // Prima dell'init nativo, considera supportato se Web Speech esiste.
    // Dopo l'init, su nativo è sempre supportato (se il plugin è presente).
    if (state.nativeInitialized && state.native) return true;
    return state.supportedWeb;
  }

  function isReady() {
    return state.native ? state.voicesReadyNative : state.voicesReadyWeb;
  }

  function openAIConfigured() {
    return false; // OpenAI TTS non è più usato
  }

  // ---------------------------------------------------------------------
  // AVVIO
  // ---------------------------------------------------------------------
  loadPrefs();

  // Web Speech: carica le voci
  if (state.supportedWeb) {
    refreshWebVoices();
    if (typeof speechSynthesis.onvoiceschanged !== "undefined") {
      speechSynthesis.onvoiceschanged = refreshWebVoices;
    }
    let pollCount = 0;
    const poll = setInterval(() => {
      pollCount++;
      if (state.voicesReadyWeb || pollCount > 40) {
        clearInterval(poll);
        return;
      }
      refreshWebVoices();
    }, 250);
  }

  // Nativo: inizializza in background
  initNative().catch(() => {});

  // Quando le voci sono pronte, precarica le lingue principali
  onVoicesReady(() => {
    setTimeout(() => {
      preload().catch(() => {});
    }, 300);
  });

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
    isReady,
    isSupported,
    openAIConfigured,
    _state: state,
  };
})();
