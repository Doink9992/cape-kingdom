(() => {
  'use strict';

  const view = document.getElementById('view');
  const nav = document.getElementById('nav');
  const langSelect = document.getElementById('lang');

  // ---------- Hilfsfunktionen ----------
  const store = {
    load(k, d) {
      try {
        return JSON.parse(localStorage.getItem(k)) ?? d;
      } catch {
        return d;
      }
    },
    save(k, v) {
      try {
        localStorage.setItem(k, JSON.stringify(v));
      } catch {}
    },
  };

  // Elemente bauen; Text immer als Textknoten (kein innerHTML -> kein XSS durch KI-Antworten)
  function h(tag, attrs, ...kids) {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
      else if (k === 'class') e.className = v;
      else if (v !== false && v != null) e.setAttribute(k, v);
    }
    for (const c of kids.flat()) if (c != null && c !== false) e.append(c);
    return e;
  }

  const shuffle = (a) => {
    const b = [...a];
    for (let i = b.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [b[i], b[j]] = [b[j], b[i]];
    }
    return b;
  };
  const pct = (x) => Math.round(x * 100) + ' %';
  const lab = (it) => (it.r ? `${it.t} · ${it.r}` : it.t);
  const PASS = 0.75;
  const DAY = 86400000;
  const INTERVALS = [0, 1, 2, 4, 8, 16, 32]; // Tage je Leitner-Box

  const state = {
    lang: store.load('lang', 'ja'),
    tab: 'lessons',
    progress: store.load('progress', {}),
    srs: store.load('srs', {}),
    daily: store.load('daily', {}), // { 'JJJJ-MM-TT': { kana: true, srs: true, listen: true } }
    settings: { apiKey: '', model: 'claude-haiku-5-5', autoSpeak: true, ...store.load('settings', {}) },
  };
  if (!LANGS[state.lang]) state.lang = 'ja';

  const persist = () => {
    store.save('progress', state.progress);
    store.save('srs', state.srs);
    store.save('daily', state.daily);
    store.save('settings', state.settings);
  };
  const info = () => LANGS[state.lang];
  const code = () => info().code;
  const lessons = () => LESSONS[state.lang];
  const prog = (id) => ((state.progress[state.lang] ||= {})[id] ||= { started: false, quiz: 0, speak: 0, listen: 0 });
  const show = (...nodes) => {
    window.scrollTo(0, 0);
    view.replaceChildren(...nodes.flat().filter(Boolean));
  };
  // Fürs Vorlesen bevorzugt die reine Kana-Schreibweise: Kanji-Lesungen (四 = yon/shi?) sind für die Stimme mehrdeutig.
  const KANA_ONLY = /^[\u3040-\u30ff]+$/;
  const spoken = (it) => (KANA_ONLY.test(it.t) ? it.t : it.alt?.find((a) => KANA_ONLY.test(a)) || it.t);
  const audioBtn = (x) => h('button', { class: 'icon', title: 'Anhören', onclick: () => Voice.speak(typeof x === 'string' ? x : spoken(x), code()) }, '🔊');
  const today = () => new Date().toISOString().slice(0, 10);
  const markDaily = (task) => {
    (state.daily[today()] ||= {})[task] = true;
    persist();
  };
  const doneToday = (task) => !!state.daily[today()]?.[task];
  // Leitner-Bewertung für beliebige Schlüssel (Vokabeln, Kana)
  const gradeKey = (key, ok) => {
    const box = ok ? Math.min((state.srs[key]?.box ?? 0) + 1, INTERVALS.length - 1) : 0;
    state.srs[key] = { box, due: ok ? Date.now() + INTERVALS[box] * DAY : Date.now() };
  };
  const startedItems = () => lessons().filter((l) => prog(l.id).started).flatMap((l) => l.items);
  const backBtn = (fn, text = '← Zurück') => h('button', { class: 'link', onclick: fn }, text);

  function errMsg(e) {
    switch (e.message) {
      case 'nosupport':
        return 'Dein Browser unterstützt keine Spracherkennung. Nutze Chrome, Edge oder Safari.';
      case 'not-allowed':
      case 'service-not-allowed':
        return 'Mikrofon nicht erlaubt. Bitte Zugriff im Browser freigeben.';
      case 'no-speech':
        return 'Ich habe nichts gehört. Nochmal versuchen?';
      case 'network':
        return 'Die Spracherkennung braucht eine Internetverbindung.';
      case 'audio-capture':
        return 'Kein Mikrofon gefunden.';
      default:
        return `Fehler: ${e.message}`;
    }
  }

  // ---------- Navigation ----------
  const TAB_LABELS = {
    today: '📅 Heute',
    kana: 'あ Kana',
    listen: '👂 Hören',
    lessons: '📚 Lektionen',
    srs: '🧠 Vokabeln',
    speak: '🎤 Sprechen',
    chat: '💬 Gespräch',
    settings: '⚙️ Einstellungen',
  };
  // Japanisch ist der Schwerpunkt: dort kommen Tagesplan und Kana-Trainer dazu.
  const tabsFor = () => (state.lang === 'ja' ? ['today', 'kana', 'listen', 'lessons', 'srs', 'speak', 'chat', 'settings'] : ['lessons', 'listen', 'srs', 'speak', 'chat', 'settings']);
  const VIEWS = { today: viewToday, kana: viewKana, listen: viewListen, lessons: viewLessons, srs: viewSrs, speak: viewSpeak, chat: viewChat, settings: viewSettings };

  function buildNav() {
    nav.replaceChildren(...tabsFor().map((id) => h('button', { 'data-tab': id, onclick: () => go(id) }, TAB_LABELS[id])));
  }

  function go(tab) {
    if (!tabsFor().includes(tab)) tab = tabsFor()[0];
    state.tab = tab;
    for (const b of nav.children) b.classList.toggle('active', b.dataset.tab === tab);
    VIEWS[tab]();
  }

  // ---------- Lektionen ----------
  function viewLessons() {
    show(
      h('h2', {}, `${info().flag} ${info().name}`),
      h(
        'div',
        { class: 'grid' },
        lessons().map((l) => {
          const p = prog(l.id);
          return h(
            'button',
            { class: 'card', onclick: () => openLesson(l) },
            h('strong', {}, l.title),
            h('span', { class: 'muted' }, `${l.items.length} Einträge`),
            h('span', { class: 'muted' }, p.started ? `Quiz ${pct(p.quiz)} · Hören ${pct(p.listen || 0)} · Sprechen ${pct(p.speak)}` : 'Noch nicht begonnen'),
          );
        }),
      ),
    );
  }

  function openLesson(l) {
    prog(l.id).started = true;
    persist();
    show(
      backBtn(() => go('lessons')),
      h('h2', {}, l.title),
      h(
        'ul',
        { class: 'items' },
        l.items.map((it) =>
          h('li', {}, audioBtn(it), h('div', {}, h('div', { class: 'target' }, it.t), it.r && h('div', { class: 'muted' }, it.r), h('div', {}, it.de))),
        ),
      ),
      h('div', { class: 'row' }, h('button', { class: 'primary', onclick: () => runQuiz(l) }, '📝 Quiz'), h('button', { class: 'primary', onclick: () => speakLesson(l) }, '🎤 Sprechen üben')),
    );
  }

  // ---------- Quiz ----------
  function runQuiz(l) {
    const pool = lessons().flatMap((x) => x.items);
    const items = shuffle(l.items);
    let i = 0;
    let ok = 0;

    const step = () => {
      if (i >= items.length) {
        const p = prog(l.id);
        p.quiz = Math.max(p.quiz, ok / items.length);
        persist();
        return show(
          h('h2', {}, 'Quiz beendet'),
          h('p', { class: 'big' }, `${ok} von ${items.length} richtig (${pct(ok / items.length)})`),
          h('div', { class: 'row' }, h('button', { onclick: () => openLesson(l) }, 'Zur Lektion'), h('button', { class: 'primary', onclick: () => runQuiz(l) }, 'Nochmal')),
        );
      }
      const it = items[i];
      const fromTarget = i % 2 === 0; // abwechselnd: Zielsprache -> Deutsch und Deutsch -> Zielsprache
      const opts = shuffle([it, ...shuffle(pool.filter((x) => x.de !== it.de && x.t !== it.t)).slice(0, 3)]);
      const out = h('div', { class: 'feedback' });
      const next = h('button', { class: 'primary hidden', onclick: () => (i++, step()) }, i + 1 < items.length ? 'Weiter' : 'Ergebnis');
      const btns = opts.map((o) =>
        h(
          'button',
          {
            class: 'option',
            onclick: (ev) => {
              btns.forEach((b) => (b.disabled = true));
              const right = o === it;
              if (right) ok++;
              ev.currentTarget.classList.add(right ? 'right' : 'wrong');
              btns[opts.indexOf(it)].classList.add('right');
              out.textContent = right ? 'Richtig!' : `Falsch – richtig ist: ${fromTarget ? it.de : lab(it)}`;
              next.classList.remove('hidden');
              Voice.speak(spoken(it), code());
            },
          },
          fromTarget ? o.de : lab(o),
        ),
      );
      show(
        backBtn(() => openLesson(l), '← Abbrechen'),
        h('p', { class: 'muted' }, `Frage ${i + 1} von ${items.length}`),
        fromTarget ? h('div', { class: 'prompt' }, h('span', { class: 'big' }, lab(it)), audioBtn(it)) : h('div', { class: 'prompt' }, h('span', { class: 'big' }, it.de)),
        h('div', { class: 'options' }, btns),
        out,
        next,
      );
    };
    step();
  }

  // ---------- Sprechen üben ----------
  function runSpeaking(items, onDone) {
    const best = items.map(() => 0);
    let i = 0;
    const step = () => {
      if (i >= items.length) return onDone(best);
      const it = items[i];
      const out = h('div', { class: 'feedback' });
      const mic = h('button', { class: 'primary' }, '🎤 Sprechen');
      mic.addEventListener('click', async () => {
        mic.disabled = true;
        mic.textContent = '🎙️ Ich höre zu…';
        out.className = 'feedback';
        out.textContent = '';
        try {
          const heard = await Voice.listen(code());
          const s = Voice.score(heard, [it.t, ...(it.alt || [])], code());
          best[i] = Math.max(best[i], s);
          out.className = 'feedback ' + (s >= PASS ? 'right' : 'wrong');
          out.textContent = `${pct(s)} – verstanden: „${heard[0]}“${s >= PASS ? ' ✔' : ' – versuch es nochmal'}`;
        } catch (e) {
          out.className = 'feedback wrong';
          out.textContent = errMsg(e);
        }
        mic.disabled = false;
        mic.textContent = '🎤 Sprechen';
      });
      show(
        backBtn(() => onDone(best, true), '← Beenden'),
        h('p', { class: 'muted' }, `Satz ${i + 1} von ${items.length}`),
        !Voice.canListen && h('p', { class: 'feedback wrong' }, errMsg(new Error('nosupport'))),
        h('div', { class: 'prompt' }, h('div', { class: 'big' }, it.t), it.r && h('div', { class: 'muted' }, it.r), h('div', {}, it.de)),
        h('div', { class: 'row' }, h('button', { onclick: () => Voice.speak(spoken(it), code()) }, '🔊 Anhören'), Voice.canListen && mic),
        out,
        h('button', { class: 'primary', onclick: () => (i++, step()) }, i + 1 < items.length ? 'Weiter' : 'Fertig'),
      );
    };
    step();
  }

  function speakLesson(l) {
    runSpeaking(l.items, (best, aborted) => {
      const avg = best.reduce((a, b) => a + b, 0) / best.length;
      const p = prog(l.id);
      p.speak = Math.max(p.speak, avg);
      persist();
      if (aborted) return openLesson(l);
      show(
        h('h2', {}, 'Geschafft'),
        h('p', { class: 'big' }, `Durchschnitt: ${pct(avg)}`),
        h('div', { class: 'row' }, h('button', { onclick: () => openLesson(l) }, 'Zur Lektion'), h('button', { class: 'primary', onclick: () => speakLesson(l) }, 'Nochmal')),
      );
    });
  }

  function viewSpeak() {
    show(
      h('h2', {}, `Sprechen üben – ${info().name}`),
      !Voice.canListen && h('p', { class: 'feedback wrong' }, errMsg(new Error('nosupport'))),
      h('p', { class: 'muted' }, 'Wähle eine Lektion. Du hörst den Satz, sprichst ihn nach, und die App vergleicht, was sie verstanden hat.'),
      h('div', { class: 'grid' }, lessons().map((l) => h('button', { class: 'card', onclick: () => (prog(l.id), speakLesson(l)) }, h('strong', {}, l.title), h('span', { class: 'muted' }, `Bestwert ${pct(prog(l.id).speak)}`)))),
    );
  }

  // ---------- Vokabeltrainer (Leitner-System) ----------
  const srsKey = (it) => `${state.lang}|${it.t}`;

  function viewSrs() {
    const started = lessons().filter((l) => prog(l.id).started);
    if (!started.length) {
      return show(h('h2', {}, 'Vokabeln'), h('p', {}, 'Öffne zuerst eine Lektion – ihre Wörter landen dann hier im Wiederholungstrainer.'), h('button', { class: 'primary', onclick: () => go('lessons') }, 'Zu den Lektionen'));
    }
    const now = Date.now();
    const all = started.flatMap((l) => l.items);
    const due = all.filter((it) => state.srs[srsKey(it)]?.due <= now);
    const fresh = all.filter((it) => !state.srs[srsKey(it)]).slice(0, 10);
    const queue = shuffle([...due, ...fresh]);
    const known = all.filter((it) => (state.srs[srsKey(it)]?.box ?? 0) >= 3).length;
    show(
      h('h2', {}, `Vokabeln – ${info().name}`),
      h('p', {}, `Fällig: ${due.length} · Neu heute: ${fresh.length} · Gefestigt: ${known} von ${all.length}`),
      queue.length ? h('button', { class: 'primary', onclick: () => runCards(queue) }, `Training starten (${queue.length} Karten)`) : h('p', {}, 'Heute ist nichts mehr fällig 🎉'),
    );
  }

  function runCards(queue) {
    const q = [...queue];
    const total = q.length;
    const step = () => {
      if (!q.length) {
        markDaily('srs');
        return show(h('h2', {}, 'Fertig 🎉'), h('p', {}, `${total} Karten wiederholt.`), h('button', { onclick: viewSrs }, 'Zurück'));
      }
      const it = q[0];
      const key = srsKey(it);
      const answers = h(
        'div',
        { class: 'row hidden' },
        h(
          'button',
          {
            onclick: () => {
              state.srs[key] = { box: 0, due: Date.now() };
              persist();
              q.push(q.shift()); // am Ende dieser Runde nochmal
              step();
            },
          },
          'Nicht gewusst',
        ),
        h(
          'button',
          {
            class: 'primary',
            onclick: () => {
              const box = Math.min((state.srs[key]?.box ?? 0) + 1, INTERVALS.length - 1);
              state.srs[key] = { box, due: Date.now() + INTERVALS[box] * DAY };
              persist();
              q.shift();
              step();
            },
          },
          'Gewusst',
        ),
      );
      const back = h('div', { class: 'hidden' }, h('div', { class: 'big' }, it.t), it.r && h('div', { class: 'muted' }, it.r));
      const reveal = h(
        'button',
        {
          class: 'primary',
          onclick: () => {
            back.classList.remove('hidden');
            answers.classList.remove('hidden');
            reveal.classList.add('hidden');
            Voice.speak(spoken(it), code());
          },
        },
        'Antwort zeigen',
      );
      show(backBtn(viewSrs, '← Beenden'), h('p', { class: 'muted' }, `Noch ${q.length} Karten`), h('div', { class: 'prompt' }, h('div', { class: 'big' }, it.de)), back, reveal, answers);
    };
    step();
  }

  // ---------- KI-Gespräch ----------
  const chats = {}; // pro Sprache, nur im Speicher

  function viewChat() {
    if (!state.settings.apiKey) {
      return show(
        h('h2', {}, 'Gesprächspartner (KI)'),
        h('p', {}, 'Dafür brauchst du einen Anthropic-API-Key. Die Nutzung wird nach Verbrauch abgerechnet.'),
        h('button', { class: 'primary', onclick: () => go('settings') }, 'Key eintragen'),
      );
    }
    const msgs = (chats[state.lang] ||= []);
    const log = h('div', { class: 'chatlog' });
    const input = h('input', { type: 'text', placeholder: `Schreib auf ${info().name}…`, autocomplete: 'off' });
    const status = h('div', { class: 'muted' });
    let busy = false;

    const bubble = (m, idx) => {
      if (idx === 0) return null; // versteckte Startnachricht
      if (m.role === 'user') return h('div', { class: 'bubble user' }, m.content);
      const r = AI.parseReply(m.content);
      return h('div', { class: 'bubble ai' }, h('div', {}, r.main, ' ', audioBtn(r.speakable)), r.fix && h('div', { class: 'fix' }, '✏️ ' + r.fix));
    };
    const draw = () => {
      log.replaceChildren(...msgs.map(bubble).filter(Boolean));
      log.scrollTop = log.scrollHeight;
    };

    const ask = async () => {
      busy = true;
      status.textContent = 'Denkt nach…';
      try {
        const reply = await AI.chat({ apiKey: state.settings.apiKey, model: state.settings.model, langName: info().name, isJa: state.lang === 'ja', messages: msgs });
        msgs.push({ role: 'assistant', content: reply });
        status.textContent = '';
        draw();
        if (state.settings.autoSpeak) Voice.speak(AI.parseReply(reply).speakable, code());
      } catch (e) {
        status.textContent = e.message;
        const last = msgs.pop(); // letzte Nutzernachricht zurücknehmen, damit man sie erneut senden kann
        if (msgs.length > 0) input.value = last.content;
        draw();
      }
      busy = false;
    };

    const send = (text) => {
      text = text.trim();
      if (!text || busy) return;
      msgs.push({ role: 'user', content: text });
      input.value = '';
      draw();
      ask();
    };

    const mic = h('button', { class: 'icon', title: 'Sprechen' }, '🎤');
    mic.addEventListener('click', async () => {
      mic.disabled = true;
      status.textContent = '🎙️ Ich höre zu…';
      try {
        const heard = await Voice.listen(code());
        input.value = heard[0];
        status.textContent = 'Prüfen, ggf. korrigieren und senden.';
      } catch (e) {
        status.textContent = errMsg(e);
      }
      mic.disabled = false;
    });

    input.addEventListener('keydown', (e) => e.key === 'Enter' && send(input.value));

    show(
      h('h2', {}, `Gespräch – ${info().name}`),
      log,
      status,
      h('div', { class: 'row nowrap' }, input, Voice.canListen && mic, h('button', { class: 'primary', onclick: () => send(input.value) }, 'Senden')),
      h('button', { class: 'link', onclick: () => ((chats[state.lang] = []), viewChat()) }, 'Neues Gespräch'),
    );

    if (msgs.length === 0) {
      msgs.push({ role: 'user', content: 'Beginne das Gespräch mit einer einfachen Begrüßung und einer Frage.' });
      ask();
    } else draw();
  }

  // ---------- Einstellungen ----------
  function viewSettings() {
    const key = h('input', { type: 'password', placeholder: 'sk-ant-…', value: state.settings.apiKey, autocomplete: 'off' });
    const model = h('input', { type: 'text', value: state.settings.model });
    const auto = h('input', { type: 'checkbox' });
    auto.checked = state.settings.autoSpeak;
    const msg = h('span', { class: 'muted' });
    show(
      h('h2', {}, 'Einstellungen'),
      h('label', {}, 'Anthropic-API-Key (für das KI-Gespräch)', key),
      h('p', { class: 'muted' }, 'Der Key wird nur in diesem Browser (localStorage) gespeichert und direkt an api.anthropic.com gesendet. Nutze die App nur auf deinem eigenen Gerät und niemals auf einem fremden Rechner.'),
      h('label', {}, 'Modell', model),
      h('label', { class: 'check' }, auto, ' KI-Antworten automatisch vorlesen'),
      h(
        'div',
        { class: 'row' },
        h(
          'button',
          {
            class: 'primary',
            onclick: () => {
              state.settings = { apiKey: key.value.trim(), model: model.value.trim() || 'claude-haiku-5-5', autoSpeak: auto.checked };
              persist();
              msg.textContent = 'Gespeichert.';
            },
          },
          'Speichern',
        ),
        msg,
      ),
      h('hr'),
      h('h3', {}, 'Browser-Unterstützung'),
      h('p', {}, `Sprachausgabe: ${Voice.canSpeak ? '✔' : '✘'} · Spracherkennung: ${Voice.canListen ? '✔' : '✘ (Chrome, Edge oder Safari nutzen)'}`),
      h('hr'),
      h(
        'button',
        {
          onclick: () => {
            if (confirm('Gesamten Lernfortschritt wirklich löschen?')) {
              state.progress = {};
              state.srs = {};
              persist();
              go('lessons');
            }
          },
        },
        'Lernfortschritt zurücksetzen',
      ),
    );
  }

  // ---------- Hörtraining ----------
  // Wort/Satz anhören, Bedeutung wählen. Kana-Kenntnisse sind dafür nicht nötig.
  function viewListen() {
    const started = startedItems();
    show(
      h('h2', {}, `Hörtraining – ${info().name}`),
      h('p', {}, 'Du hörst ein Wort oder einen Satz und wählst die Bedeutung. Der Text wird erst nach deiner Antwort gezeigt.'),
      h('p', { class: 'muted' }, 'Hinweis: Die Stimme ist synthetisch. Sie trainiert Wörter und Satzmelodie, ersetzt aber kein echtes, schnelles Japanisch von Muttersprachlern.'),
      h(
        'div',
        { class: 'grid' },
        h('button', { class: 'card', disabled: !started.length, onclick: () => listenMixed() }, h('strong', {}, 'Gemischt'), h('span', { class: 'muted' }, started.length ? `aus ${started.length} Einträgen deiner begonnenen Lektionen` : 'Starte zuerst eine Lektion')),
        lessons().map((l) => h('button', { class: 'card', onclick: () => listenLesson(l) }, h('strong', {}, l.title), h('span', { class: 'muted' }, `Bestwert ${pct(prog(l.id).listen || 0)}`))),
      ),
    );
  }

  function listenMixed() {
    runListening(startedItems(), (ok, n) => {
      markDaily('listen');
      listenResult(ok, n, () => listenMixed());
    }, viewListen);
  }

  function listenLesson(l) {
    prog(l.id).started = true;
    runListening(l.items, (ok, n) => {
      const p = prog(l.id);
      p.listen = Math.max(p.listen || 0, ok / n);
      markDaily('listen');
      listenResult(ok, n, () => listenLesson(l));
    }, viewListen);
  }

  function listenResult(ok, n, again) {
    show(
      h('h2', {}, 'Hörtraining beendet'),
      h('p', { class: 'big' }, `${ok} von ${n} richtig (${pct(ok / n)})`),
      h('div', { class: 'row' }, h('button', { onclick: viewListen }, 'Zur Übersicht'), h('button', { class: 'primary', onclick: again }, 'Nochmal')),
    );
  }

  function runListening(items, onDone, back) {
    const pool = lessons().flatMap((l) => l.items);
    const qs = shuffle(items).slice(0, 10);
    let i = 0;
    let ok = 0;
    const step = () => {
      if (i >= qs.length) {
        persist();
        return onDone(ok, qs.length);
      }
      const it = qs[i];
      const opts = shuffle([it, ...shuffle(pool.filter((x) => x.de !== it.de && x.t !== it.t)).slice(0, 3)]);
      const reveal = h('div', { class: 'hidden prompt' }, h('div', {}, h('div', { class: 'big' }, it.t), it.r && h('div', { class: 'muted' }, it.r)));
      const out = h('div', { class: 'feedback' });
      const next = h('button', { class: 'primary hidden', onclick: () => (i++, step()) }, i + 1 < qs.length ? 'Weiter' : 'Ergebnis');
      const btns = opts.map((o) =>
        h(
          'button',
          {
            class: 'option',
            onclick: (ev) => {
              btns.forEach((b) => (b.disabled = true));
              const right = o === it;
              if (right) ok++;
              ev.currentTarget.classList.add(right ? 'right' : 'wrong');
              btns[opts.indexOf(it)].classList.add('right');
              out.textContent = right ? 'Richtig!' : `Falsch – gemeint war: ${it.de}`;
              reveal.classList.remove('hidden');
              next.classList.remove('hidden');
            },
          },
          o.de,
        ),
      );
      show(
        backBtn(back, '← Abbrechen'),
        h('p', { class: 'muted' }, `Frage ${i + 1} von ${qs.length} – Was bedeutet das?`),
        h('div', { class: 'row' }, h('button', { class: 'primary', onclick: () => Voice.speak(spoken(it), code()) }, '🔊 Nochmal hören'), h('button', { onclick: () => Voice.speak(spoken(it), code(), 0.55) }, '🐢 Langsam')),
        !Voice.canSpeak && h('p', { class: 'feedback wrong' }, 'Dein Browser hat keine Sprachausgabe.'),
        h('div', { class: 'options' }, btns),
        out,
        reveal,
        next,
      );
      Voice.speak(spoken(it), code());
    };
    if (!qs.length) return viewListen();
    step();
  }

  // ---------- Kana-Trainer ----------
  const KANA_PASS = 0.8;
  const kanaGroups = () => [...KANA.hira, ...KANA.kata];

  function viewKana() {
    const section = (script) => [
      h('h3', {}, KANA.names[script]),
      h(
        'div',
        { class: 'grid' },
        KANA[script].map((g) => {
          const p = prog(g.id);
          return h(
            'button',
            { class: 'card', onclick: () => studyGroup(g) },
            h('span', { class: 'kana-preview' }, g.chars.map((c) => c.k).join(' ')),
            h('strong', {}, g.label),
            h('span', { class: 'muted' }, p.quiz >= KANA_PASS ? `✔ ${pct(p.quiz)}` : p.started ? `Quiz ${pct(p.quiz)}` : 'neu'),
          );
        }),
      ),
    ];
    show(
      h('h2', {}, 'Kana lernen'),
      h('p', {}, 'Fang mit Hiragana an, dann Katakana. Pro Gruppe: ansehen, anhören, Quiz (ab 80 % gilt sie als gelernt). Plane etwa 5–10 Minuten pro Gruppe.'),
      h('button', { class: 'primary', onclick: kanaReview }, '🔁 Wiederholung'),
      section('hira'),
      section('kata'),
    );
  }

  function studyGroup(g) {
    prog(g.id).started = true;
    persist();
    show(
      backBtn(() => go('kana')),
      h('h2', {}, `${KANA.names[g.script]} – ${g.label}`),
      h('p', { class: 'muted' }, 'Tippe auf ein Zeichen zum Anhören. Die Stimme liest einzelne Zeichen nicht immer perfekt vor.'),
      h(
        'div',
        { class: 'tiles' },
        g.chars.map((c) => h('button', { class: 'tile', onclick: () => Voice.speak(c.k, code()) }, h('span', { class: 'kana' }, c.k), h('span', { class: 'muted' }, c.r))),
      ),
      h('div', { class: 'row' }, h('button', { class: 'primary', onclick: () => groupQuiz(g) }, '📝 Quiz zu dieser Gruppe')),
    );
  }

  function groupQuiz(g) {
    let qs = shuffle(g.chars);
    while (qs.length < 8) qs = qs.concat(shuffle(g.chars));
    runKanaQuiz(qs.slice(0, 12), (ok, n) => {
      const p = prog(g.id);
      p.quiz = Math.max(p.quiz, ok / n);
      markDaily('kana');
      const idx = kanaGroups().indexOf(g);
      const next = kanaGroups()[idx + 1];
      show(
        h('h2', {}, ok / n >= KANA_PASS ? 'Gruppe geschafft ✔' : 'Noch nicht ganz'),
        h('p', { class: 'big' }, `${ok} von ${n} richtig (${pct(ok / n)})`),
        h(
          'div',
          { class: 'row' },
          h('button', { onclick: () => studyGroup(g) }, 'Zur Gruppe'),
          h('button', { onclick: () => groupQuiz(g) }, 'Nochmal'),
          ok / n >= KANA_PASS && next && h('button', { class: 'primary', onclick: () => studyGroup(next) }, `Weiter: ${KANA.names[next.script]} ${next.label}`),
          h('button', { onclick: () => go('kana') }, 'Übersicht'),
        ),
      );
    }, () => go('kana'));
  }

  function kanaReview() {
    const pool = kanaGroups().filter((g) => prog(g.id).started).flatMap((g) => g.chars);
    if (!pool.length) return show(backBtn(() => go('kana')), h('p', {}, 'Öffne zuerst eine Kana-Gruppe, dann gibt es etwas zu wiederholen.'));
    const now = Date.now();
    const due = pool.filter((c) => state.srs[`kana|${c.k}`]?.due <= now);
    const fresh = pool.filter((c) => !state.srs[`kana|${c.k}`]);
    const qs = [...shuffle(due), ...shuffle(fresh)].slice(0, 10);
    const targets = qs.length ? qs : shuffle(pool).slice(0, 10); // nichts fällig -> freie Übung
    runKanaQuiz(targets, (ok, n) => {
      markDaily('kana');
      show(
        h('h2', {}, 'Wiederholung beendet'),
        h('p', { class: 'big' }, `${ok} von ${n} richtig (${pct(ok / n)})`),
        h('div', { class: 'row' }, h('button', { onclick: () => go('kana') }, 'Übersicht'), h('button', { class: 'primary', onclick: kanaReview }, 'Nochmal')),
      );
    }, () => go('kana'));
  }

  // Wechselt zwischen "Zeichen sehen -> Umschrift wählen" und "Zeichen hören -> Zeichen wählen".
  function runKanaQuiz(qs, onDone, back) {
    let i = 0;
    let ok = 0;
    const step = () => {
      if (i >= qs.length) {
        persist();
        return onDone(ok, qs.length);
      }
      const c = qs[i];
      const hear = i % 2 === 1;
      const same = KANA[c.script].flatMap((g) => g.chars);
      const wrong = shuffle(same.filter((x) => x.k !== c.k && x.r !== c.r)).slice(0, 3);
      const opts = shuffle([c, ...wrong]);
      const out = h('div', { class: 'feedback' });
      const next = h('button', { class: 'primary hidden', onclick: () => (i++, step()) }, i + 1 < qs.length ? 'Weiter' : 'Ergebnis');
      const btns = opts.map((o) =>
        h(
          'button',
          {
            class: 'option',
            onclick: (ev) => {
              btns.forEach((b) => (b.disabled = true));
              const right = o === c;
              if (right) ok++;
              gradeKey(`kana|${c.k}`, right);
              ev.currentTarget.classList.add(right ? 'right' : 'wrong');
              btns[opts.indexOf(c)].classList.add('right');
              out.textContent = right ? 'Richtig!' : `Falsch – ${c.k} = ${c.r}`;
              next.classList.remove('hidden');
              if (!hear) Voice.speak(c.k, code());
            },
          },
          hear ? o.k : o.r,
        ),
      );
      show(
        backBtn(back, '← Abbrechen'),
        h('p', { class: 'muted' }, `Frage ${i + 1} von ${qs.length}`),
        hear
          ? h('div', { class: 'prompt' }, h('button', { class: 'primary', onclick: () => Voice.speak(c.k, code()) }, '🔊 Welches Zeichen ist das?'))
          : h('div', { class: 'prompt' }, h('span', { class: 'kana big-kana' }, c.k)),
        h('div', { class: `options ${hear ? 'kana-options' : ''}` }, btns),
        out,
        next,
      );
      if (hear) Voice.speak(c.k, code());
    };
    step();
  }

  // ---------- Heute (Tagesplan) ----------
  function viewToday() {
    const nextGroup = kanaGroups().find((g) => prog(g.id).quiz < KANA_PASS);
    const all = startedItems();
    const now = Date.now();
    const due = all.filter((it) => state.srs[srsKey(it)]?.due <= now).length;
    const fresh = all.filter((it) => !state.srs[srsKey(it)]).length;
    const tasks = [
      {
        key: 'kana',
        title: nextGroup ? `Kana: ${KANA.names[nextGroup.script]} – ${nextGroup.label}` : 'Kana wiederholen',
        detail: nextGroup ? 'Neue Gruppe ansehen und üben, ca. 8 Min.' : 'Alle Gruppen geschafft. Kurze Wiederholung, ca. 3 Min.',
        run: () => (nextGroup ? studyGroup(nextGroup) : kanaReview()),
      },
      {
        key: 'srs',
        title: 'Vokabeln wiederholen',
        detail: all.length ? `${due} fällig, ${Math.min(fresh, 10)} neu, ca. 5 Min.` : 'Öffne zuerst eine Lektion (z. B. „Begrüßung“).',
        run: () => (all.length ? go('srs') : go('lessons')),
      },
      {
        key: 'listen',
        title: 'Hörtraining: 10 Fragen',
        detail: all.length ? 'Wörter und Sätze nur hören, ca. 5 Min.' : 'Starte zuerst eine Lektion.',
        run: () => (all.length ? listenMixed() : go('lessons')),
      },
    ];
    show(
      h('h2', {}, `📅 Heute – ${new Date().toLocaleDateString('de-DE')}`),
      h('p', { class: 'muted' }, 'Rund 20 Minuten. Lieber jeden Tag ein bisschen als einmal pro Woche viel.'),
      h(
        'div',
        { class: 'grid' },
        tasks.map((t) => h('button', { class: 'card', onclick: t.run }, h('strong', {}, `${doneToday(t.key) ? '✔ ' : ''}${t.title}`), h('span', { class: 'muted' }, t.detail))),
      ),
      h('h3', {}, 'Dazu: echtes Japanisch hören'),
      h('p', {}, 'Für flüssiges Verstehen reicht diese App nicht. Hör zusätzlich täglich 10–15 Minuten echtes Japanisch von Muttersprachlern, z. B. NHK Easy News (Nachrichten in einfacher Sprache), Videos für Lernende (Suchbegriff „Comprehensible Japanese“) oder Anime mit japanischen Untertiteln. Anfangs verstehst du wenig, das ist normal. Wichtig ist die Regelmäßigkeit.'),
    );
  }

  // ---------- Start ----------
  for (const [id, l] of Object.entries(LANGS)) langSelect.append(h('option', { value: id }, `${l.flag} ${l.name}`));
  langSelect.value = state.lang;
  langSelect.addEventListener('change', () => {
    state.lang = langSelect.value;
    store.save('lang', state.lang);
    buildNav();
    go(state.tab);
  });
  if (Voice.canSpeak) speechSynthesis.getVoices(); // Stimmen früh laden
  buildNav();
  go(state.lang === 'ja' ? 'today' : 'lessons');
})();
