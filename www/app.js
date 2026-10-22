(function () {
  "use strict";

  const el = (id) => document.getElementById(id);

  if (typeof DECKS === "undefined") {
    console.error("[app.js] DECKS non trovato");
    return;
  }

  const state = {
    deckId: DECKS[0] && DECKS[0].id ? DECKS[0].id : "en",
    cards: [],
    index: 0,
    flipped: false,
  };

  /* —— Tema chiaro / scuro —— */
  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    const btn = el("themeBtn");
    if (btn) btn.textContent = theme === "dark" ? "\u2600\uFE0F" : "\uD83C\uDF19";
    try {
      localStorage.setItem("fc_theme", theme);
    } catch (_) {}
  }

  (function initTheme() {
    let theme = "light";
    try {
      theme = localStorage.getItem("fc_theme") || theme;
    } catch (_) {}
    try {
      if (!localStorage.getItem("fc_theme") && window.matchMedia) {
        if (window.matchMedia("(prefers-color-scheme: dark)").matches) theme = "dark";
      }
    } catch (_) {}
    applyTheme(theme);
  })();

  const themeBtn = el("themeBtn");
  if (themeBtn) {
    themeBtn.onclick = function () {
      const cur = document.documentElement.getAttribute("data-theme") || "light";
      applyTheme(cur === "dark" ? "light" : "dark");
    };
  }

  function currentLang() {
    const d = DECKS.find(function (x) { return x.id === state.deckId; });
    return (d && d.lang) || "en-US";
  }

  function rebuild() {
    const deck = DECKS.find(function (d) { return d.id === state.deckId; });
    state.cards = ((deck && deck.cards) || []).slice();
    state.index = 0;
    state.flipped = false;
    render();
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "\u0026amp;")
      .replace(/</g, "\u0026lt;")
      .replace(/>/g, "\u0026gt;")
      .replace(/"/g, "\u0026quot;");
  }

  function render() {
    const card = state.cards[state.index];
    const wrap = el("cardWrap");
    const counter = el("counter");
    const pct = el("pct");
    const fill = el("progressFill");
    if (!wrap) return;

    if (!card) {
      wrap.innerHTML =
        '<div class="flashcard"><div class="flashcard__face" style="position:relative">' +
        '<div class="flashcard__text" style="font-size:1.1rem;font-weight:600">Nessuna carta</div>' +
        '<div class="flashcard__hint">Cambia mazzo o filtri</div></div></div>';
      return;
    }

    const total = state.cards.length;
    if (counter) counter.textContent = (state.index + 1) + " / " + total;
    if (pct) pct.textContent = Math.round(((state.index + 1) / total) * 100) + "%";
    if (fill) fill.style.width = Math.round(((state.index + 1) / total) * 100) + "%";

    const front = escapeHtml(card.front || "");
    const back = escapeHtml(card.back || "");
    const emoji = card.emoji
      ? '<div class="flashcard__emoji">' + card.emoji + "</div>"
      : "";

    wrap.innerHTML =
      '<div class="flashcard' +
      (state.flipped ? " is-flipped" : "") +
      '" id="flashcard">' +
      '<button type="button" class="flashcard__audio" id="audioBtn" aria-label="Pronuncia">\uD83D\uDD0A</button>' +
      '<div class="flashcard__inner">' +
      '<div class="flashcard__face flashcard__face--front">' +
      '<span class="flashcard__side-tag">Fronte</span>' +
      emoji +
      '<div class="flashcard__text">' +
      front +
      "</div>" +
      '<div class="flashcard__hint">Tocca o premi Gira per la risposta</div>' +
      "</div>" +
      '<div class="flashcard__face flashcard__face--back">' +
      '<span class="flashcard__side-tag">Retro</span>' +
      emoji +
      '<div class="flashcard__text">' +
      back +
      "</div>" +
      '<div class="flashcard__hint">Tocca per tornare al fronte</div>' +
      "</div>" +
      "</div></div>";

    const audioBtn = el("audioBtn");
    if (audioBtn) {
      audioBtn.onclick = function (e) {
        e.stopPropagation();
        speakCurrent();
      };
    }

    const flash = el("flashcard");
    if (flash) {
      flash.onclick = function (e) {
        if (e.target && e.target.id === "audioBtn") return;
        state.flipped = !state.flipped;
        flash.classList.toggle("is-flipped", state.flipped);
        if (state.flipped && el("autoSpeak") && el("autoSpeak").checked) {
          speakCurrent();
        }
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

  function fillThemesAndLevels() {
    const themeSel = el("themeSelect");
    const levelSel = el("levelSelect");
    if (themeSel && typeof THEMES !== "undefined" && Array.isArray(THEMES)) {
      themeSel.innerHTML = "";
      const all = document.createElement("option");
      all.value = "";
      all.textContent = "Tutti i temi";
      themeSel.appendChild(all);
      THEMES.forEach(function (t) {
        const o = document.createElement("option");
        o.value = t.id;
        o.textContent = (t.emoji ? t.emoji + " " : "") + t.name;
        themeSel.appendChild(o);
      });
    }
    if (levelSel && typeof LEVELS !== "undefined" && Array.isArray(LEVELS)) {
      levelSel.innerHTML = "";
      const all = document.createElement("option");
      all.value = "";
      all.textContent = "Tutti i livelli";
      levelSel.appendChild(all);
      LEVELS.forEach(function (lv) {
        const o = document.createElement("option");
        o.value = lv.id;
        o.textContent = lv.name;
        levelSel.appendChild(o);
      });
    }
  }

  function applyFilters() {
    const deck = DECKS.find(function (d) { return d.id === state.deckId; });
    let cards = ((deck && deck.cards) || []).slice();
    const theme = el("themeSelect") ? el("themeSelect").value : "";
    const level = el("levelSelect") ? el("levelSelect").value : "";
    if (theme) {
      cards = cards.filter(function (c) { return c.theme === theme; });
    }
    if (level) {
      cards = cards.filter(function (c) { return c.level === level; });
    }
    state.cards = cards;
    state.index = 0;
    state.flipped = false;
    render();
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

    if (window.TTS && hasCap && TTS.isReady && !TTS.isReady()) {
      badge.textContent = "Caricamento TTS\u2026";
      badge.className = "badge";
      if (select) {
        select.innerHTML = "<option>Inizializzazione\u2026</option>";
        select.disabled = true;
      }
      if (hint) hint.textContent = "Attendo il motore vocale nativo Android\u2026";
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
    const voices = (TTS.getVoices && TTS.getVoices(lang)) || [];
    badge.textContent = voices.length
      ? voices.length + " voci \u00b7 " + lang
      : "TTS attivo \u00b7 " + lang;
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
    deckSel.innerHTML = "";
    DECKS.forEach(function (d) {
      const o = document.createElement("option");
      o.value = d.id;
      o.textContent =
        (d.flag || "") + " " + d.name + " (" + ((d.cards && d.cards.length) || 0) + ")";
      deckSel.appendChild(o);
    });
    deckSel.value = state.deckId;
    deckSel.onchange = function () {
      state.deckId = deckSel.value;
      applyFilters();
      renderVoicePanel();
    };
  }

  fillThemesAndLevels();

  const themeSel = el("themeSelect");
  if (themeSel) {
    themeSel.onchange = function () { applyFilters(); };
  }
  const levelSel = el("levelSelect");
  if (levelSel) {
    levelSel.onchange = function () { applyFilters(); };
  }

  const flipBtn = el("flipBtn");
  if (flipBtn) {
    flipBtn.onclick = function () {
      state.flipped = !state.flipped;
      const flash = el("flashcard");
      if (flash) flash.classList.toggle("is-flipped", state.flipped);
      else render();
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

  applyFilters();
  renderVoicePanel();

  if (window.TTS) {
    if (TTS.onVoicesReady) {
      TTS.onVoicesReady(function () {
        renderVoicePanel();
      });
    }
    var tries = 0;
    var retry = setInterval(function () {
      tries++;
      renderVoicePanel();
      if ((TTS.isReady && TTS.isReady()) || tries >= 20) clearInterval(retry);
    }, 300);
  }
})();
