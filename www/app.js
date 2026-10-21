(function () {
  "use strict";

  const el = (id) => document.getElementById(id);

  if (typeof DECKS === "undefined") {
    console.error("[app.js] DECKS non trovato");
    return;
  }

  const state = {
    deckId: DECKS[0]?.id || "en",
    cards: [],
    index: 0,
    flipped: false,
  };

  function currentLang() {
    return DECKS.find((d) => d.id === state.deckId)?.lang || "en-US";
  }

  function rebuild() {
    const deck = DECKS.find((d) => d.id === state.deckId);
    state.cards = (deck?.cards || []).slice();
    state.index = 0;
    state.flipped = false;
    render();
  }

  function render() {
    const card = state.cards[state.index];
    const wrap = el("cardWrap");
    const counter = el("counter");
    const pct = el("pct");
    const fill = el("progressFill");
    if (!wrap) return;

    if (!card) {
      wrap.innerHTML = '<div style="padding:40px;text-align:center">Nessuna carta</div>';
      return;
    }

    const total = state.cards.length;
    if (counter) counter.textContent = (state.index + 1) + " / " + total;
    if (pct) pct.textContent = Math.round(((state.index + 1) / total) * 100) + "%";
    if (fill) fill.style.width = Math.round(((state.index + 1) / total) * 100) + "%";

    const text = state.flipped ? card.back : card.front;
    const emoji = card.emoji || "";
    wrap.innerHTML =
      '<div style="background:#fff;border-radius:16px;padding:24px;text-align:center;min-height:200px;box-shadow:0 4px 16px rgba(0,0,0,.08);position:relative">' +
      '<button type="button" id="audioBtn" style="position:absolute;top:12px;left:12px;width:40px;height:40px;border-radius:50%;border:1px solid #e5e7eb;background:#fff;font-size:18px;cursor:pointer">🔊</button>' +
      (emoji ? '<div style="font-size:3rem">' + emoji + "</div>" : "") +
      '<div style="font-size:1.6rem;font-weight:700;margin-top:12px">' +
      text +
      "</div>" +
      '<div style="color:#6b7280;font-size:0.85rem;margin-top:12px">' +
      (state.flipped ? "Retro — tocca Gira per il fronte" : "Fronte — tocca Gira per la risposta") +
      "</div></div>";

    const audioBtn = el("audioBtn");
    if (audioBtn) {
      audioBtn.onclick = function (e) {
        e.stopPropagation();
        speakCurrent();
      };
    }
  }

  function speakCurrent() {
    const card = state.cards[state.index];
    if (!card || !window.TTS) return;
    const text = state.flipped ? card.back : card.front;
    const lang = state.flipped ? currentLang() : "it-IT";
    TTS.speak(text, lang);
  }

  function renderVoicePanel() {
    const badge = el("voiceBadge");
    const select = el("voiceSelect");
    const hint = el("voiceHint");
    const testBtn = el("voiceTestBtn");
    const resetBtn = el("voiceResetBtn");
    if (!badge) return;

    const hasCap =
      typeof window.Capacitor !== "undefined" &&
      (window.Capacitor.isNativePlatform
        ? window.Capacitor.isNativePlatform()
        : false);

    if (window.TTS && hasCap && !TTS.isReady()) {
      badge.textContent = "Caricamento TTS…";
      badge.className = "badge";
      if (select) {
        select.innerHTML = "<option>Inizializzazione…</option>";
        select.disabled = true;
      }
      if (hint) hint.textContent = "Attendo il motore vocale nativo Android…";
      return;
    }

    if (!window.TTS || !TTS.isSupported()) {
      badge.textContent = "Non supportato";
      badge.className = "badge warn";
      if (select) {
        select.innerHTML = "<option>Non disponibile</option>";
        select.disabled = true;
      }
      if (hint) {
        hint.textContent = hasCap
          ? "Plugin TTS non trovato. Esegui: npx cap sync android && ricostruisci l'APK."
          : "Web Speech API non disponibile in questo browser.";
      }
      return;
    }

    const lang = currentLang();
    const voices = TTS.getVoices(lang) || [];
    badge.textContent = voices.length
      ? voices.length + " voci · " + lang
      : "TTS attivo · " + lang;
    badge.className = "badge good";

    if (select) {
      select.innerHTML = "";
      const auto = document.createElement("option");
      auto.value = "";
      auto.textContent = "Automatica (migliore)";
      select.appendChild(auto);
      voices.forEach(function (v) {
        const o = document.createElement("option");
        o.value = v.name || v.lang || "";
        o.textContent = v.name || v.lang || "voce";
        select.appendChild(o);
      });
      select.disabled = false;
    }
    if (testBtn) testBtn.disabled = false;
    if (resetBtn) resetBtn.disabled = false;
    if (hint) {
      hint.textContent = hasCap
        ? "Motore nativo Android attivo."
        : voices.length + " voci web per " + lang;
    }
  }

  const deckSel = el("deckSelect");
  if (deckSel) {
    DECKS.forEach(function (d) {
      const o = document.createElement("option");
      o.value = d.id;
      o.textContent = (d.flag || "") + " " + d.name + " (" + (d.cards || []).length + ")";
      deckSel.appendChild(o);
    });
    deckSel.value = state.deckId;
    deckSel.onchange = function () {
      state.deckId = deckSel.value;
      rebuild();
      renderVoicePanel();
    };
  }

  const flipBtn = el("flipBtn");
  if (flipBtn) {
    flipBtn.onclick = function () {
      state.flipped = !state.flipped;
      render();
      if (state.flipped && el("autoSpeak") && el("autoSpeak").checked) speakCurrent();
    };
  }

  const nextBtn = el("nextBtn");
  if (nextBtn) {
    nextBtn.onclick = function () {
      if (state.index < state.cards.length - 1) {
        state.index++;
        state.flipped = false;
        render();
      }
    };
  }

  const prevBtn = el("prevBtn");
  if (prevBtn) {
    prevBtn.onclick = function () {
      if (state.index > 0) {
        state.index--;
        state.flipped = false;
        render();
      }
    };
  }

  const voiceTestBtn = el("voiceTestBtn");
  if (voiceTestBtn) {
    voiceTestBtn.onclick = function () {
      speakCurrent();
    };
  }

  const voiceHeader = el("voiceHeader");
  const voicePanel = el("voicePanel");
  if (voiceHeader && voicePanel) {
    voiceHeader.onclick = function () {
      voicePanel.classList.toggle("open");
    };
  }

  rebuild();
  renderVoicePanel();

  if (window.TTS) {
    TTS.onVoicesReady(function () {
      renderVoicePanel();
    });
    var tries = 0;
    var retry = setInterval(function () {
      tries++;
      renderVoicePanel();
      if ((TTS.isReady && TTS.isReady()) || tries >= 20) clearInterval(retry);
    }, 300);
  }
})();
