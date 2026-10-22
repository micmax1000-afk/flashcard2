(function () {
  "use strict";

  var el = function (id) { return document.getElementById(id); };

  if (typeof DECKS === "undefined") {
    console.error("[app.js] DECKS non trovato");
    return;
  }

  var KNOWN_INTERVAL_MS = 3 * 24 * 60 * 60 * 1000; // 3 giorni se "Lo sapevo"
  var PROGRESS_PREFIX = "fc_progress_";
  var SESSION_KEY = "fc_session";

  var state = {
    deckId: DECKS[0] && DECKS[0].id ? DECKS[0].id : "en",
    cards: [],
    index: 0,
    flipped: false,
    // chiave della carta corrente (per riprendere dove si era)
    resumeKey: null,
  };

  function cardKey(card) {
    return String(card.front || "") + "\t" + String(card.back || "");
  }

  function loadSession() {
    try {
      var raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      var data = JSON.parse(raw);
      return data && typeof data === "object" ? data : null;
    } catch (_) {
      return null;
    }
  }

  function saveSession() {
    try {
      var card = state.cards[state.index];
      var payload = {
        deckId: state.deckId,
        cardKey: card ? cardKey(card) : state.resumeKey,
        index: state.index,
      };
      localStorage.setItem(SESSION_KEY, JSON.stringify(payload));
    } catch (_) {}
  }

  /* —— Progressi (localStorage) —— */
  function loadProgress(deckId) {
    try {
      var raw = localStorage.getItem(PROGRESS_PREFIX + deckId);
      if (!raw) return {};
      var data = JSON.parse(raw);
      return data && typeof data === "object" ? data : {};
    } catch (_) {
      return {};
    }
  }

  function saveProgress(deckId, map) {
    try {
      localStorage.setItem(PROGRESS_PREFIX + deckId, JSON.stringify(map));
    } catch (_) {}
  }

  function getCardProgress(card) {
    var map = loadProgress(state.deckId);
    return map[cardKey(card)] || null;
  }

  function setCardProgress(card, flag) {
    var map = loadProgress(state.deckId);
    var now = Date.now();
    var due = flag === "known" ? now + KNOWN_INTERVAL_MS : now;
    map[cardKey(card)] = { flag: flag, due: due, updated: now };
    saveProgress(state.deckId, map);
    updateStats();
  }

  function resetDeckProgress() {
    try {
      localStorage.removeItem(PROGRESS_PREFIX + state.deckId);
    } catch (_) {}
    updateStats();
    applyFilters({ resetIndex: true });
    showToast("Progressi del mazzo azzerati", "success");
  }

  /* —— Tema chiaro / scuro —— */
  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    var btn = el("themeBtn");
    if (btn) btn.textContent = theme === "dark" ? "\u2600\uFE0F" : "\uD83C\uDF19";
    try {
      localStorage.setItem("fc_theme", theme);
    } catch (_) {}
  }

  (function initTheme() {
    var theme = "light";
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

  var themeBtn = el("themeBtn");
  if (themeBtn) {
    themeBtn.onclick = function () {
      var cur = document.documentElement.getAttribute("data-theme") || "light";
      applyTheme(cur === "dark" ? "light" : "dark");
    };
  }

  function currentLang() {
    var d = DECKS.find(function (x) { return x.id === state.deckId; });
    return (d && d.lang) || "en-US";
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, String.fromCharCode(38) + "amp;")
      .replace(/</g, String.fromCharCode(38) + "lt;")
      .replace(/>/g, String.fromCharCode(38) + "gt;")
      .replace(/"/g, String.fromCharCode(38) + "quot;");
  }

  function showToast(msg, type) {
    var t = el("toast");
    if (!t) return;
    t.textContent = msg;
    t.className = "toast show" + (type ? " " + type : "");
    clearTimeout(showToast._timer);
    showToast._timer = setTimeout(function () {
      t.className = "toast";
    }, 2200);
  }

  function updateStats() {
    var stats = el("stats");
    if (!stats) return;
    var deck = DECKS.find(function (d) { return d.id === state.deckId; });
    var all = (deck && deck.cards) || [];
    var map = loadProgress(state.deckId);
    var now = Date.now();
    var known = 0, review = 0, due = 0;
    all.forEach(function (c) {
      var p = map[cardKey(c)];
      if (!p) {
        due++;
        return;
      }
      if (p.flag === "known") known++;
      if (p.flag === "review") review++;
      if ((p.due || 0) <= now) due++;
    });
    stats.textContent =
      all.length +
      " carte \u00b7 " +
      known +
      " sapute \u00b7 " +
      review +
      " da rivedere \u00b7 " +
      due +
      " in scadenza";
  }

  function applyFilters(opts) {
    opts = opts || {};
    var keepPosition = opts.keepPosition !== false;
    var preferKey = opts.preferKey || state.resumeKey;

    if (keepPosition && !preferKey && state.cards[state.index]) {
      preferKey = cardKey(state.cards[state.index]);
    }

    var deck = DECKS.find(function (d) { return d.id === state.deckId; });
    var cards = ((deck && deck.cards) || []).slice();

    var theme = el("themeSelect") ? el("themeSelect").value : "";
    var level = el("levelSelect") ? el("levelSelect").value : "";
    if (theme) {
      cards = cards.filter(function (c) { return c.theme === theme; });
    }
    if (level) {
      cards = cards.filter(function (c) { return c.level === level; });
    }

    var reviewOnly = el("reviewOnly") && el("reviewOnly").checked;
    var dueOnly = el("dueOnly") && el("dueOnly").checked;
    var map = loadProgress(state.deckId);
    var now = Date.now();

    if (reviewOnly) {
      cards = cards.filter(function (c) {
        var p = map[cardKey(c)];
        return p && p.flag === "review";
      });
    }
    if (dueOnly) {
      cards = cards.filter(function (c) {
        var p = map[cardKey(c)];
        if (!p) return true;
        return (p.due || 0) <= now;
      });
    }

    state.cards = cards;
    state.flipped = false;

    var newIndex = 0;
    if (opts.resetIndex) {
      newIndex = 0;
    } else if (keepPosition && preferKey) {
      var found = -1;
      for (var i = 0; i < cards.length; i++) {
        if (cardKey(cards[i]) === preferKey) {
          found = i;
          break;
        }
      }
      if (found >= 0) newIndex = found;
    }

    state.index = cards.length ? Math.min(newIndex, cards.length - 1) : 0;
    if (cards[state.index]) state.resumeKey = cardKey(cards[state.index]);
    saveSession();
    render();
    updateStats();
  }

  function render() {
    var card = state.cards[state.index];
    var wrap = el("cardWrap");
    var counter = el("counter");
    var pct = el("pct");
    var fill = el("progressFill");
    if (!wrap) return;

    if (!card) {
      var emptyMsg = "Nessuna carta";
      var emptyHint = "Cambia mazzo o filtri";
      if (el("reviewOnly") && el("reviewOnly").checked) {
        emptyMsg = "Nessuna da rivedere";
        emptyHint = "Segna carte con \u2717 Da rivedere";
      } else if (el("dueOnly") && el("dueOnly").checked) {
        emptyMsg = "Niente in scadenza";
        emptyHint = "Tutte le carte sono al giorno";
      }
      wrap.innerHTML =
        '<div class="flashcard"><div class="flashcard__face" style="position:relative">' +
        '<div class="flashcard__text" style="font-size:1.1rem;font-weight:600">' +
        emptyMsg +
        "</div>" +
        '<div class="flashcard__hint">' +
        emptyHint +
        "</div></div></div>";
      if (counter) counter.textContent = "0 / 0";
      if (pct) pct.textContent = "0%";
      if (fill) fill.style.width = "0%";
      return;
    }

    var total = state.cards.length;
    if (counter) counter.textContent = state.index + 1 + " / " + total;
    if (pct) pct.textContent = Math.round(((state.index + 1) / total) * 100) + "%";
    if (fill) fill.style.width = Math.round(((state.index + 1) / total) * 100) + "%";

    var front = escapeHtml(card.front || "");
    var back = escapeHtml(card.back || "");
    var emoji = card.emoji
      ? '<div class="flashcard__emoji">' + card.emoji + "</div>"
      : "";

    var prog = getCardProgress(card);
    var statusTag = "";
    if (prog && prog.flag === "review") {
      statusTag = '<span class="flashcard__side-tag" style="left:auto;right:14px;top:48px;background:var(--danger-soft);color:var(--danger)">Da rivedere</span>';
    } else if (prog && prog.flag === "known") {
      statusTag = '<span class="flashcard__side-tag" style="left:auto;right:14px;top:48px;background:var(--success-soft);color:var(--success)">Saputa</span>';
    }

    wrap.innerHTML =
      '<div class="flashcard' +
      (state.flipped ? " is-flipped" : "") +
      '" id="flashcard">' +
      '<button type="button" class="flashcard__audio" id="audioBtn" aria-label="Pronuncia">\uD83D\uDD0A</button>' +
      '<div class="flashcard__inner">' +
      '<div class="flashcard__face flashcard__face--front">' +
      '<span class="flashcard__side-tag">Fronte</span>' +
      statusTag +
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

    var audioBtn = el("audioBtn");
    if (audioBtn) {
      audioBtn.onclick = function (e) {
        e.stopPropagation();
        speakCurrent();
      };
    }

    var flash = el("flashcard");
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
    var card = state.cards[state.index];
    if (!card || !window.TTS) return;
    var text = state.flipped ? card.back : card.front;
    var lang = state.flipped ? currentLang() : "it-IT";
    TTS.speak(text, lang);
  }

  function fillThemesAndLevels() {
    var themeSel = el("themeSelect");
    var levelSel = el("levelSelect");
    if (themeSel && typeof THEMES !== "undefined" && Array.isArray(THEMES)) {
      themeSel.innerHTML = "";
      var allT = document.createElement("option");
      allT.value = "";
      allT.textContent = "Tutti i temi";
      themeSel.appendChild(allT);
      THEMES.forEach(function (t) {
        var o = document.createElement("option");
        o.value = t.id;
        o.textContent = (t.emoji ? t.emoji + " " : "") + t.name;
        themeSel.appendChild(o);
      });
    }
    if (levelSel && typeof LEVELS !== "undefined" && Array.isArray(LEVELS)) {
      levelSel.innerHTML = "";
      var allL = document.createElement("option");
      allL.value = "";
      allL.textContent = "Tutti i livelli";
      levelSel.appendChild(allL);
      LEVELS.forEach(function (lv) {
        var o = document.createElement("option");
        o.value = lv.id;
        o.textContent = lv.name;
        levelSel.appendChild(o);
      });
    }
  }

  function renderVoicePanel() {
    var badge = el("voiceBadge");
    var select = el("voiceSelect");
    var hint = el("voiceHint");
    var testBtn = el("voiceTestBtn");
    var resetBtn = el("voiceResetBtn");
    if (!badge) return;

    var hasCap =
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

    var lang = currentLang();
    var voices = (TTS.getVoices && TTS.getVoices(lang)) || [];
    badge.textContent = voices.length
      ? voices.length + " voci \u00b7 " + lang
      : "TTS attivo \u00b7 " + lang;
    badge.className = "badge good";

    if (select) {
      select.innerHTML = "";
      var auto = document.createElement("option");
      auto.value = "";
      auto.textContent = "Automatica (migliore)";
      select.appendChild(auto);
      voices.forEach(function (v) {
        var o = document.createElement("option");
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

  function goNextAfterRate() {
    var current = state.cards[state.index];
    var currentKey = current ? cardKey(current) : null;
    var nextKey = null;
    if (state.index < state.cards.length - 1 && state.cards[state.index + 1]) {
      nextKey = cardKey(state.cards[state.index + 1]);
    }

    state.resumeKey = nextKey || currentKey;
    applyFilters({ keepPosition: true, preferKey: nextKey || currentKey });

    if (currentKey && state.cards[state.index] && cardKey(state.cards[state.index]) === currentKey) {
      if (state.index < state.cards.length - 1) {
        state.index++;
        state.flipped = false;
        if (state.cards[state.index]) state.resumeKey = cardKey(state.cards[state.index]);
        saveSession();
        render();
      } else {
        showToast("Fine della lista", "success");
      }
    } else if (!state.cards.length) {
      showToast("Fine della lista", "success");
    }
  }

  /* —— Select mazzo / filtri —— */
  var deckSel = el("deckSelect");
  if (deckSel) {
    deckSel.innerHTML = "";
    DECKS.forEach(function (d) {
      var o = document.createElement("option");
      o.value = d.id;
      o.textContent =
        (d.flag || "") + " " + d.name + " (" + ((d.cards && d.cards.length) || 0) + ")";
      deckSel.appendChild(o);
    });
    deckSel.value = state.deckId;
    deckSel.onchange = function () {
      state.deckId = deckSel.value;
      state.resumeKey = null;
      var sess = loadSession();
      if (sess && sess.deckId === state.deckId && sess.cardKey) {
        state.resumeKey = sess.cardKey;
      }
      applyFilters({ keepPosition: true, preferKey: state.resumeKey, resetIndex: !state.resumeKey });
      renderVoicePanel();
    };
  }

  fillThemesAndLevels();

  var themeSel = el("themeSelect");
  if (themeSel) themeSel.onchange = function () { applyFilters({ resetIndex: true }); };
  var levelSel = el("levelSelect");
  if (levelSel) levelSel.onchange = function () { applyFilters({ resetIndex: true }); };

  var reviewOnlyEl = el("reviewOnly");
  if (reviewOnlyEl) reviewOnlyEl.onchange = function () { applyFilters({ resetIndex: true }); };
  var dueOnlyEl = el("dueOnly");
  if (dueOnlyEl) dueOnlyEl.onchange = function () { applyFilters({ resetIndex: true }); };

  /* —— Navigazione —— */
  var flipBtn = el("flipBtn");
  if (flipBtn) {
    flipBtn.onclick = function () {
      state.flipped = !state.flipped;
      var flash = el("flashcard");
      if (flash) flash.classList.toggle("is-flipped", state.flipped);
      else render();
      if (state.flipped && el("autoSpeak") && el("autoSpeak").checked) speakCurrent();
    };
  }

  var nextBtn = el("nextBtn");
  if (nextBtn) {
    nextBtn.onclick = function () {
      if (state.index < state.cards.length - 1) {
        state.index++;
        state.flipped = false;
        if (state.cards[state.index]) state.resumeKey = cardKey(state.cards[state.index]);
        saveSession();
        render();
      }
    };
  }

  var prevBtn = el("prevBtn");
  if (prevBtn) {
    prevBtn.onclick = function () {
      if (state.index > 0) {
        state.index--;
        state.flipped = false;
        if (state.cards[state.index]) state.resumeKey = cardKey(state.cards[state.index]);
        saveSession();
        render();
      }
    };
  }

  /* —— Valutazione —— */
  var knowBtn = el("knowBtn");
  if (knowBtn) {
    knowBtn.onclick = function () {
      var card = state.cards[state.index];
      if (!card) return;
      setCardProgress(card, "known");
      showToast("Segnata come saputa", "success");
      goNextAfterRate();
    };
  }

  var reviewBtn = el("reviewBtn");
  if (reviewBtn) {
    reviewBtn.onclick = function () {
      var card = state.cards[state.index];
      if (!card) return;
      setCardProgress(card, "review");
      showToast("Segnata da rivedere");
      goNextAfterRate();
    };
  }

  /* —— Export / Import / Reset —— */
  var exportBtn = el("exportBtn");
  if (exportBtn) {
    exportBtn.onclick = function () {
      var payload = {
        version: 1,
        exportedAt: new Date().toISOString(),
        progress: {},
      };
      DECKS.forEach(function (d) {
        payload.progress[d.id] = loadProgress(d.id);
      });
      var blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json",
      });
      var a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "flashcard-progress.json";
      a.click();
      URL.revokeObjectURL(a.href);
      showToast("Export scaricato", "success");
    };
  }

  var importBtn = el("importBtn");
  var importFile = el("importFile");
  if (importBtn && importFile) {
    importBtn.onclick = function () { importFile.click(); };
    importFile.onchange = function () {
      var file = importFile.files && importFile.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function () {
        try {
          var data = JSON.parse(String(reader.result || ""));
          var prog = data.progress || data;
          Object.keys(prog).forEach(function (deckId) {
            if (prog[deckId] && typeof prog[deckId] === "object") {
              saveProgress(deckId, prog[deckId]);
            }
          });
          applyFilters({ keepPosition: true });
          showToast("Import completato", "success");
        } catch (err) {
          showToast("File non valido", "error");
        }
        importFile.value = "";
      };
      reader.readAsText(file);
    };
  }

  var resetBtn = el("resetBtn");
  if (resetBtn) {
    resetBtn.onclick = function () {
      if (confirm("Azzerare i progressi del mazzo corrente?")) {
        resetDeckProgress();
      }
    };
  }

  var voiceTestBtn = el("voiceTestBtn");
  if (voiceTestBtn) {
    voiceTestBtn.onclick = function () { speakCurrent(); };
  }

  var voiceHeader = el("voiceHeader");
  var voicePanel = el("voicePanel");
  if (voiceHeader && voicePanel) {
    voiceHeader.onclick = function () {
      voicePanel.classList.toggle("open");
    };
  }

  // Ripristina mazzo e posizione dall'ultima sessione
  (function restoreSession() {
    var sess = loadSession();
    if (!sess) return;
    var exists = DECKS.some(function (d) { return d.id === sess.deckId; });
    if (exists) {
      state.deckId = sess.deckId;
      state.resumeKey = sess.cardKey || null;
      if (deckSel) deckSel.value = state.deckId;
    }
  })();

  applyFilters({ keepPosition: true, preferKey: state.resumeKey });
  renderVoicePanel();

  if (window.TTS) {
    if (TTS.onVoicesReady) {
      TTS.onVoicesReady(function () { renderVoicePanel(); });
    }
    var tries = 0;
    var retry = setInterval(function () {
      tries++;
      renderVoicePanel();
      if ((TTS.isReady && TTS.isReady()) || tries >= 20) clearInterval(retry);
    }, 300);
  }
})();
