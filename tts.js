/* =========================================================================
 * tts.js — Sintesi vocale naturale con fallback multipli
 * Da caricare DOPO data.js e meta.js, PRIMA dello script dell'app.
 *
 * Espone:
 *   TTS.speak(text, lang)  → Promise<void>
 *   TTS.stop()
 *   TTS.pickBestVoice(lang)
 *   TTS.onVoicesReady(cb)
 *
 * Configurazione opzionale (OpenAI TTS, BYOK):
 *   window.OPENAI_API_KEY = "sk-..."   (vedi avvertenze in fondo)
 * ========================================================================= */

(function () {
  "use strict";

  if (!("speechSynthesis" in window)) {
    console.warn("[tts.js] Web Speech API non supportata da questo browser.");
  }

  // ---------------------------------------------------------------------
  // 1. SELEZIONE VOCE MIGLIORE
  // ---------------------------------------------------------------------
  // Pattern in ordine di priorità: voci neurali → Enhanced/Premium → default
  const VOICE_PATTERNS = [
    /Online \(Natural\)/i,          // Edge Windows — le migliori gratuite
    /Natural/i,                     // altre "Natural"
    /Google.*(US|UK|Neural)/i,      // Chrome online
    /Premium/i,                     // Apple Premium (iOS/macOS)
    /Enhanced/i,                    // Apple Enhanced
    /Siri/i,                        // Apple Siri
  ];

  function pickBestVoice(lang) {
    if (!("speechSynthesis" in window)) return null;
    const voices = speechSynthesis.getVoices();
    if (!voices.length) return null;

    const prefix = (lang || "en-US").split("-")[0].toLowerCase();

    // 1) Cerca voci con nome prioritario e lingua corretta
    for (const re of VOICE_PATTERNS) {
      const match = voices.find(
        (v) => v.lang.toLowerCase().startsWith(prefix) && re.test(v.name)
      );
      if (match) return match;
    }

    // 2) Fallback: prima voce con lingua corretta
    const anyMatch = voices.find((v) =>
      v.lang.toLowerCase().startsWith(prefix)
    );
    if (anyMatch) return anyMatch;

    // 3) Ultimo fallback: lingua esatta o voce di default
    return voices[0] || null;
  }

  // ---------------------------------------------------------------------
  // 2. GESTIONE VOCI ASINCRONE
  // ---------------------------------------------------------------------
  // Su Chrome e Safari, getVoices() restituisce [] al primo call.
  // onvoiceschanged scatta quando il browser ha caricato le voci.
  let voicesReady = false;
  const readyCallbacks = [];

  function markVoicesReady() {
    if (voicesReady) return;
    voicesReady = true;
    while (readyCallbacks.length) {
      try { readyCallbacks.shift()(); } catch (e) { console.warn(e); }
    }
  }

  function onVoicesReady(cb) {
    if (voicesReady) cb();
    else readyCallbacks.push(cb);
  }

  if ("speechSynthesis" in window) {
    // Se già pronte
    if (speechSynthesis.getVoices().length) {
      markVoicesReady();
    } else {
      speechSynthesis.onvoiceschanged = markVoicesReady;
      // Sicurezza: dopo 1.5s considera comunque pronta la lista
      setTimeout(markVoicesReady, 1500);
    }
  }

  // ---------------------------------------------------------------------
  // 3. AUDIO PLAYER (per OpenAI TTS o blob esterni)
  // ---------------------------------------------------------------------
  let currentAudio = null;
  function stopAudio() {
    if (currentAudio) {
      try { currentAudio.pause(); } catch (_) {}
      try { URL.revokeObjectURL(currentAudio.src); } catch (_) {}
      currentAudio = null;
    }
  }

  // ---------------------------------------------------------------------
  // 4. OPENAI TTS (opzionale, BYOK)
  // ---------------------------------------------------------------------
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
          voice: "nova",       // alloy | echo | fable | onyx | nova | shimmer
          input: text,
          speed: 0.95,
        }),
      });
      if (!res.ok) throw new Error(await res.text());

      const blob = await res.blob();
      stopAudio();
      currentAudio = new Audio(URL.createObjectURL(blob));
      currentAudio.lang = lang || "en-US";
      await currentAudio.play();
      return true;
    } catch (err) {
      console.warn("[tts.js] OpenAI TTS fallito, fallback Web Speech:", err);
      return false;
    }
  }

  // ---------------------------------------------------------------------
  // 5. WEB SPEECH API
  // ---------------------------------------------------------------------
  function speakWebSpeech(text, lang) {
    return new Promise((resolve) => {
      if (!("speechSynthesis" in window)) return resolve();

      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = lang || "en-US";
      utter.rate = 0.95;   // più lento per lo studio
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
  // 6. API PUBBLICA
  // ---------------------------------------------------------------------
  async function speak(text, lang) {
    if (!text) return;
    // Prova prima OpenAI (se configurato), altrimenti Web Speech
    const usedOpenAI = await speakWithOpenAI(text, lang);
    if (!usedOpenAI) {
      await speakWebSpeech(text, lang);
    }
  }

  function stop() {
    if ("speechSynthesis" in window) speechSynthesis.cancel();
    stopAudio();
  }

  window.TTS = {
    speak,
    stop,
    pickBestVoice,
    onVoicesReady,
    getVoices: () => ("speechSynthesis" in window ? speechSynthesis.getVoices() : []),
    isSupported: () => "speechSynthesis" in window,
    openAIConfigured: () => !!window.OPENAI_API_KEY,
  };
})();