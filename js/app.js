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
    xp: store.load('xp', 0),
    daily: store.load('daily', {}), // { 'JJJJ-MM-TT': { kana: true, srs: true, listen: true } }
    settings: { apiKey: '', model: 'claude-haiku-5-5', autoSpeak: true, ...store.load('settings', {}) },
  };
  if (!LANGS[state.lang]) state.lang = 'ja';

  const persist = () => {
    store.save('progress', state.progress);
    store.save('srs', state.srs);
    store.save('daily', state.daily);
    store.save('xp', state.xp);
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
  const fmtDay = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const today = () => fmtDay(new Date());
  // Serie: aufeinanderfolgende Tage mit Aktivität. Ist heute noch nichts passiert, zählt die Serie bis gestern weiter.
  const streak = () => {
    const d = new Date();
    if (!state.daily[fmtDay(d)]) d.setDate(d.getDate() - 1);
    let n = 0;
    while (state.daily[fmtDay(d)]) {
      n++;
      d.setDate(d.getDate() - 1);
    }
    return n;
  };
  const renderStats = () => {
    const done = Object.keys(state.daily[today()] || {}).length;
    document.getElementById('stats').replaceChildren(h('span', { class: 'chip flame', title: 'Serie: Tage in Folge' }, `🔥 ${streak()}`), h('span', { class: 'chip xp', title: 'Punkte' }, `⭐ ${state.xp}`), h('span', { class: 'chip', title: 'Heute erledigte Übungsarten' }, `✔ ${done}`));
  };
  const addXp = (n) => {
    state.xp += Math.max(0, Math.round(n));
    persist();
    renderStats();
  };
  const markDaily = (task) => {
    (state.daily[today()] ||= {})[task] = true;
    persist();
    renderStats();
  };
  const doneToday = (task) => !!state.daily[today()]?.[task];
  // Leitner-Bewertung für beliebige Schlüssel (Vokabeln, Kana)
  const gradeKey = (key, ok) => {
    const box = ok ? Math.min((state.srs[key]?.box ?? 0) + 1, INTERVALS.length - 1) : 0;
    state.srs[key] = { box, due: ok ? Date.now() + INTERVALS[box] * DAY : Date.now() };
  };
  // Antwortoptionen aus der Gruppe der Lektion (Sätze bei Sätzen, Wörter bei Wörtern), sonst aus allen
  const poolFor = (l) => {
    const same = lessons().filter((x) => x.group === l.group).flatMap((x) => x.items);
    return same.length >= 12 ? same : lessons().flatMap((x) => x.items);
  };
  const startedItems = () => lessons().filter((l) => prog(l.id).started).flatMap((l) => l.items);
  const backBtn = (fn, text = '← Zurück') => h('button', { class: 'link', onclick: fn }, text);

  // ---------- Bausteine für die Oberfläche ----------
  const pageHead = (title, sub) => h('div', { class: 'pagehead' }, h('h2', {}, title), sub && h('p', { class: 'muted' }, sub));
  const statBox = (value, label) => h('div', { class: 'statbox' }, h('b', {}, value), h('span', {}, label));
  const bar = (v, cls = '') => {
    const w = Math.round(Math.min(1, Math.max(0, v || 0)) * 100);
    return h('div', { class: `bar ${cls}`, role: 'progressbar', 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-valuenow': w }, h('div', { class: 'fill', style: `width:${w}%` }));
  };
  // Kopfzeile während einer Übung: Abbrechen-Kreuz, Fortschrittsbalken, Zähler
  const quizTop = (back, i, n) =>
    h('div', { class: 'topbar' }, h('button', { class: 'close', title: 'Abbrechen', 'aria-label': 'Abbrechen', onclick: back }, '✕'), bar(i / n), h('span', { class: 'count' }, `${i + 1}/${n}`));
  // Rückmeldung nach einer Antwort (grün/rot) mit Weiter-Button
  const makeBanner = (label, onNext) => {
    const msg = h('div', { class: 'msg' });
    const btn = h('button', { class: 'primary', onclick: onNext }, label);
    const el = h('div', { class: 'banner hidden', role: 'status' }, msg, btn);
    return {
      el,
      reveal(right, text) {
        el.className = `banner ${right ? 'right' : 'wrong'}`;
        msg.textContent = `${right ? '✔ ' : '✘ '}${text}`;
        btn.focus({ preventScroll: true });
      },
    };
  };
  const confetti = () => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const colors = ['#5b4ce0', '#ffb020', '#1fa96b', '#ff7a1a', '#e5484d', '#3aa0ff'];
    const box = h('div', { class: 'confetti', 'aria-hidden': 'true' });
    for (let i = 0; i < 36; i++) {
      box.append(h('i', { style: `left:${Math.random() * 100}%;background:${colors[i % colors.length]};animation-delay:${(Math.random() * 0.6).toFixed(2)}s;animation-duration:${(1.6 + Math.random() * 1.2).toFixed(2)}s;--dx:${Math.round(Math.random() * 160 - 80)}px;--rot:${Math.round(Math.random() * 720)}deg` }));
    }
    document.body.append(box);
    setTimeout(() => box.remove(), 3400);
  };
  // Ergebnis-Bildschirm. actions: [[Beschriftung, Funktion, primär?], …]
  function resultScreen({ title, text, ratio, xp, actions }) {
    const good = ratio >= 0.8;
    show(
      h(
        'div',
        { class: 'result' },
        h('div', { class: 'trophy' }, good ? '🏆' : ratio >= 0.5 ? '👍' : '💪'),
        h('h2', {}, title),
        h('p', { class: 'big' }, text),
        bar(ratio, good ? 'gold' : ''),
        xp > 0 && h('div', { class: 'xp-chip' }, `+${Math.round(xp)} ⭐`),
        h('div', { class: 'stack' }, actions.map(([label, fn, primary]) => h('button', { class: primary ? 'primary' : '', onclick: fn }, label))),
      ),
    );
    if (good) confetti();
  }

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
  const TAB_INFO = {
    today: ['📅', 'Heute'],
    kana: ['あ', 'Kana'],
    listen: ['👂', 'Hören'],
    lessons: ['📚', 'Lernen'],
    srs: ['🧠', 'Vokabeln'],
    speak: ['🎤', 'Sprechen'],
    chat: ['💬', 'Gespräch'],
    settings: ['⚙️', 'Optionen'],
  };
  // Japanisch ist der Schwerpunkt: dort kommen Tagesplan und Kana-Trainer dazu.
  const tabsFor = () => (state.lang === 'ja' ? ['today', 'kana', 'listen', 'lessons', 'srs', 'speak', 'chat', 'settings'] : ['lessons', 'listen', 'srs', 'speak', 'chat', 'settings']);
  const VIEWS = { today: viewToday, kana: viewKana, listen: viewListen, lessons: viewLessons, srs: viewSrs, speak: viewSpeak, chat: viewChat, settings: viewSettings };

  function buildNav() {
    nav.replaceChildren(...tabsFor().map((id) => h('button', { 'data-tab': id, onclick: () => go(id) }, h('span', { class: 'ico' }, TAB_INFO[id][0]), h('span', { class: 'lbl' }, TAB_INFO[id][1]))));
  }

  function go(tab) {
    if (!tabsFor().includes(tab)) tab = tabsFor()[0];
    state.tab = tab;
    for (const b of nav.children) b.classList.toggle('active', b.dataset.tab === tab);
    VIEWS[tab]();
  }

  // ---------- Lektionen ----------
  const groupIcon = (g = '') => (g === 'Anime' ? '🎌' : g === 'Grammatik' ? '🧩' : g.startsWith('Häufige') ? '📚' : '🌱');
  const mastery = (l) => {
    const p = prog(l.id);
    return (p.quiz + (p.listen || 0) + p.speak) / 3;
  };
  const lessonCard = (l, onclick, sub) =>
    h('button', { class: 'card lesson', onclick }, h('span', { class: 'badge' }, groupIcon(l.group)), h('span', { class: 'body' }, h('strong', {}, l.title), h('span', { class: 'muted' }, sub), bar(mastery(l))));

  // Lektionskarten, bei Japanisch nach Gruppen (Grundlagen, Anime, Häufige Wörter …) einklappbar
  function lessonGrid(render) {
    const groups = [];
    for (const l of lessons()) {
      const name = l.group || '';
      let g = groups.find((x) => x.name === name);
      if (!g) groups.push((g = { name, items: [] }));
      g.items.push(l);
    }
    if (groups.length === 1) return h('div', { class: 'grid' }, groups[0].items.map(render));
    return groups.map((g) =>
      h(
        'details',
        { class: 'group', open: !g.name.startsWith('Häufige') || g.items.some((l) => prog(l.id).started) },
        h('summary', {}, h('span', {}, `${groupIcon(g.name)} ${g.name}`), h('span', { class: 'count-pill' }, g.items.length)),
        h('div', { class: 'grid' }, g.items.map(render)),
      ),
    );
  }

  function viewLessons() {
    show(
      pageHead(`${info().flag} ${info().name}`, 'Wähle eine Lektion. Der Balken zeigt, wie sicher du bist (Quiz, Hören, Sprechen).'),
      lessonGrid((l) => {
        const p = prog(l.id);
        return lessonCard(l, () => openLesson(l), p.started ? `Quiz ${pct(p.quiz)} · Hören ${pct(p.listen || 0)} · Sprechen ${pct(p.speak)}` : `${l.items.length} Einträge · noch nicht begonnen`);
      }),
    );
  }

  function openLesson(l) {
    prog(l.id).started = true;
    if (l.group === 'Grammatik') markDaily('grammar');
    persist();
    show(
      backBtn(() => go('lessons')),
      pageHead(l.title, `${l.items.length} Einträge`),
      l.note && h('p', { class: 'note' }, l.note),
      h(
        'div',
        { class: 'row actions' },
        h('button', { class: 'primary', onclick: () => runQuiz(l) }, '📝 Quiz'),
        h('button', { class: 'primary', onclick: () => listenLesson(l) }, l.group === 'Grammatik' ? '👂 Sätze hören' : '👂 Wörter hören'),
        l.items.some((it) => it.ex) && h('button', { class: 'primary', onclick: () => listenSentences(l) }, '👂 Sätze hören'),
        h('button', { class: 'primary', onclick: () => speakLesson(l) }, '🎤 Sprechen üben'),
      ),
      h(
        'ul',
        { class: 'items' },
        l.items.map((it) =>
          h(
            'li',
            {},
            audioBtn(it),
            h(
              'div',
              {},
              h('div', { class: 'target' }, it.t),
              it.r && h('div', { class: 'muted' }, it.r),
              h('div', {}, it.de),
              it.ex && h('div', { class: 'example' }, audioBtn(it.ex[0]), h('div', {}, it.ex[0], h('div', { class: 'muted' }, it.ex[1]), h('div', { class: 'muted' }, it.ex[2]))),
            ),
          ),
        ),
      ),
    );
  }

  // ---------- Quiz ----------
  function runQuiz(l) {
    const pool = poolFor(l);
    const items = shuffle(l.items);
    let i = 0;
    let ok = 0;

    const step = () => {
      if (i >= items.length) {
        const p = prog(l.id);
        p.quiz = Math.max(p.quiz, ok / items.length);
        addXp(ok * 10);
        markDaily('quiz');
        return resultScreen({
          title: 'Quiz beendet',
          text: `${ok} von ${items.length} richtig (${pct(ok / items.length)})`,
          ratio: ok / items.length,
          xp: ok * 10,
          actions: [['Nochmal', () => runQuiz(l), true], ['Zur Lektion', () => openLesson(l)]],
        });
      }
      const it = items[i];
      const fromTarget = i % 2 === 0; // abwechselnd: Zielsprache -> Deutsch und Deutsch -> Zielsprache
      const opts = shuffle([it, ...shuffle(pool.filter((x) => x.de !== it.de && x.t !== it.t)).slice(0, 3)]);
      const bn = makeBanner(i + 1 < items.length ? 'Weiter' : 'Ergebnis', () => (i++, step()));
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
              bn.reveal(right, right ? 'Richtig!' : `Richtig ist: ${fromTarget ? it.de : lab(it)}`);
              Voice.speak(spoken(it), code());
            },
          },
          fromTarget ? o.de : lab(o),
        ),
      );
      show(
        quizTop(() => openLesson(l), i, items.length),
        h('p', { class: 'question' }, fromTarget ? 'Was bedeutet das?' : 'Wie sagt man das auf Japanisch?'.replace('Japanisch', info().name)),
        fromTarget ? h('div', { class: 'prompt' }, h('span', { class: 'big' }, lab(it)), audioBtn(it)) : h('div', { class: 'prompt' }, h('span', { class: 'big' }, it.de)),
        h('div', { class: 'options' }, btns),
        bn.el,
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
      const label = h('div', { class: 'muted' }, 'Tippen und sprechen');
      const mic = h('button', { class: 'mic', 'aria-label': 'Sprechen' }, '🎤');
      mic.addEventListener('click', async () => {
        mic.disabled = true;
        mic.classList.add('listening');
        label.textContent = 'Ich höre zu…';
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
        mic.classList.remove('listening');
        label.textContent = 'Nochmal versuchen';
      });
      show(
        quizTop(() => onDone(best, true), i, items.length),
        !Voice.canListen && h('p', { class: 'feedback wrong' }, errMsg(new Error('nosupport'))),
        h('p', { class: 'question' }, 'Sprich den Satz nach'),
        h('div', { class: 'prompt' }, h('div', { class: 'big' }, it.t), it.r && h('div', { class: 'muted' }, it.r), h('div', {}, it.de)),
        h('div', { class: 'row center' }, h('button', { onclick: () => Voice.speak(spoken(it), code()) }, '🔊 Anhören'), h('button', { onclick: () => Voice.speak(spoken(it), code(), 0.55) }, '🐢 Langsam')),
        Voice.canListen && h('div', { class: 'micwrap' }, mic, label),
        out,
        h('button', { class: 'primary wide', onclick: () => (i++, step()) }, i + 1 < items.length ? 'Weiter' : 'Fertig'),
      );
    };
    step();
  }

  function speakLesson(l) {
    runSpeaking(l.items, (best, aborted) => {
      const avg = best.reduce((a, b) => a + b, 0) / best.length;
      const p = prog(l.id);
      p.speak = Math.max(p.speak, avg);
      addXp(avg * 50);
      markDaily('speak');
      if (aborted) return openLesson(l);
      resultScreen({
        title: 'Geschafft',
        text: `Durchschnitt: ${pct(avg)}`,
        ratio: avg,
        xp: avg * 50,
        actions: [['Nochmal', () => speakLesson(l), true], ['Zur Lektion', () => openLesson(l)]],
      });
    });
  }

  function viewSpeak() {
    show(
      pageHead(`🎤 Sprechen – ${info().name}`, 'Du hörst den Satz, sprichst ihn nach, und die App vergleicht, was sie verstanden hat.'),
      !Voice.canListen && h('p', { class: 'feedback wrong' }, errMsg(new Error('nosupport'))),
      lessonGrid((l) => lessonCard(l, () => speakLesson(l), `Bestwert ${pct(prog(l.id).speak)}`)),
    );
  }

  // ---------- Vokabeltrainer (Leitner-System) ----------
  const srsKey = (it) => `${state.lang}|${it.t}`;

  function viewSrs() {
    const started = lessons().filter((l) => prog(l.id).started);
    if (!started.length) {
      return show(
        pageHead('🧠 Vokabeln'),
        h('div', { class: 'empty' }, h('div', { class: 'trophy' }, '📭'), h('p', {}, 'Öffne zuerst eine Lektion. Ihre Wörter landen dann hier im Wiederholungstrainer.'), h('button', { class: 'primary', onclick: () => go('lessons') }, 'Zu den Lektionen')),
      );
    }
    const now = Date.now();
    const all = started.flatMap((l) => l.items);
    const due = all.filter((it) => state.srs[srsKey(it)]?.due <= now);
    const fresh = all.filter((it) => !state.srs[srsKey(it)]).slice(0, 10);
    const queue = shuffle([...due, ...fresh]);
    const known = all.filter((it) => (state.srs[srsKey(it)]?.box ?? 0) >= 3).length;
    show(
      pageHead(`🧠 Vokabeln – ${info().name}`),
      h('div', { class: 'statrow' }, statBox(due.length, 'fällig'), statBox(fresh.length, 'neu heute'), statBox(`${known}/${all.length}`, 'gefestigt')),
      bar(all.length ? known / all.length : 0),
      queue.length ? h('button', { class: 'primary wide', onclick: () => runCards(queue) }, `Training starten (${queue.length} Karten)`) : h('div', { class: 'empty' }, h('div', { class: 'trophy' }, '🎉'), h('p', {}, 'Heute ist nichts mehr fällig.')),
    );
  }

  function runCards(queue) {
    const q = [...queue];
    const total = q.length;
    const step = () => {
      if (!q.length) {
        markDaily('srs');
        addXp(total * 5);
        return resultScreen({ title: 'Fertig', text: `${total} Karten wiederholt`, ratio: 1, xp: total * 5, actions: [['Zurück', viewSrs, true]] });
      }
      const it = q[0];
      const key = srsKey(it);
      const answers = h(
        'div',
        { class: 'row hidden split' },
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
      const back = h('div', { class: 'hidden flash-back' }, h('div', { class: 'big' }, it.t), it.r && h('div', { class: 'muted' }, it.r));
      const reveal = h(
        'button',
        {
          class: 'primary wide',
          onclick: () => {
            back.classList.remove('hidden');
            answers.classList.remove('hidden');
            reveal.classList.add('hidden');
            Voice.speak(spoken(it), code());
          },
        },
        'Antwort zeigen',
      );
      show(quizTop(viewSrs, total - q.length, total), h('p', { class: 'question' }, 'Wie heißt das auf Japanisch?'.replace('Japanisch', info().name)), h('div', { class: 'prompt flash' }, h('div', { class: 'big' }, it.de), back), reveal, answers);
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
              state.daily = {};
              state.xp = 0;
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
      pageHead(`👂 Hörtraining – ${info().name}`, 'Du hörst ein Wort oder einen Satz und wählst die Bedeutung. Der Text erscheint erst nach deiner Antwort.'),
      h('p', { class: 'note' }, 'Die Stimme ist synthetisch. Sie trainiert Wörter und Satzmelodie, ersetzt aber kein echtes, schnelles Japanisch von Muttersprachlern.'),
      h(
        'div',
        { class: 'grid' },
        h(
          'button',
          { class: 'card lesson', disabled: !started.length, onclick: () => listenMixed() },
          h('span', { class: 'badge' }, '🎲'),
          h('span', { class: 'body' }, h('strong', {}, 'Gemischt'), h('span', { class: 'muted' }, started.length ? `aus ${started.length} Einträgen deiner begonnenen Lektionen` : 'Starte zuerst eine Lektion')),
        ),
      ),
      lessonGrid((l) => lessonCard(l, () => listenLesson(l), `Bestwert ${pct(prog(l.id).listen || 0)}`)),
    );
  }

  // Beispielsätze einer Lektion als Hör-Items (Satz, Umschrift, Übersetzung)
  const sentenceItems = (l) => l.items.filter((it) => it.ex).map((it) => ({ t: it.ex[0], r: it.ex[1], de: it.ex[2] }));

  function listenSentences(l) {
    const items = sentenceItems(l);
    const pool = lessons().flatMap(sentenceItems);
    runListening(items, (ok, n) => {
      markDaily('listen');
      listenResult(ok, n, () => listenSentences(l));
    }, () => openLesson(l), pool);
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
    }, viewListen, poolFor(l));
  }

  function listenResult(ok, n, again) {
    resultScreen({
      title: 'Hörtraining beendet',
      text: `${ok} von ${n} richtig (${pct(ok / n)})`,
      ratio: ok / n,
      xp: ok * 10,
      actions: [['Nochmal', again, true], ['Zur Übersicht', viewListen]],
    });
  }

  function runListening(items, onDone, back, pool = lessons().flatMap((l) => l.items)) {
    const qs = shuffle(items).slice(0, 10);
    let i = 0;
    let ok = 0;
    const step = () => {
      if (i >= qs.length) {
        addXp(ok * 10);
        return onDone(ok, qs.length);
      }
      const it = qs[i];
      const opts = shuffle([it, ...shuffle(pool.filter((x) => x.de !== it.de && x.t !== it.t)).slice(0, 3)]);
      const reveal = h('div', { class: 'hidden reveal' }, h('div', { class: 'big' }, it.t), it.r && h('div', { class: 'muted' }, it.r));
      const bn = makeBanner(i + 1 < qs.length ? 'Weiter' : 'Ergebnis', () => (i++, step()));
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
              bn.reveal(right, right ? 'Richtig!' : `Gemeint war: ${it.de}`);
              reveal.classList.remove('hidden');
            },
          },
          o.de,
        ),
      );
      show(
        quizTop(back, i, qs.length),
        h('p', { class: 'question' }, 'Was bedeutet das?'),
        h('div', { class: 'row center' }, h('button', { class: 'speaker', 'aria-label': 'Nochmal hören', onclick: () => Voice.speak(spoken(it), code()) }, '🔊'), h('button', { onclick: () => Voice.speak(spoken(it), code(), 0.55) }, '🐢 Langsam')),
        !Voice.canSpeak && h('p', { class: 'feedback wrong' }, 'Dein Browser hat keine Sprachausgabe.'),
        reveal,
        h('div', { class: 'options' }, btns),
        bn.el,
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
    const all = kanaGroups();
    const learned = all.filter((g) => prog(g.id).quiz >= KANA_PASS).length;
    const section = (script) => [
      h('h3', {}, KANA.names[script]),
      h(
        'div',
        { class: 'grid' },
        KANA[script].map((g) => {
          const p = prog(g.id);
          const done = p.quiz >= KANA_PASS;
          return h(
            'button',
            { class: `card kana-card${done ? ' done' : ''}`, onclick: () => studyGroup(g) },
            h('span', { class: 'kana-preview' }, g.chars.map((c) => c.k).join(' ')),
            h('strong', {}, g.label),
            h('span', { class: 'muted' }, done ? `✔ gelernt (${pct(p.quiz)})` : p.started ? `Quiz ${pct(p.quiz)}` : 'neu'),
            bar(p.quiz),
          );
        }),
      ),
    ];
    show(
      pageHead('あ Kana lernen', 'Erst Hiragana, dann Katakana. Pro Gruppe: ansehen, anhören, Quiz (ab 80 % gilt sie als gelernt). Plane etwa 5–10 Minuten pro Gruppe.'),
      h('div', { class: 'statrow' }, statBox(`${learned}/${all.length}`, 'Gruppen gelernt')),
      bar(learned / all.length),
      h('button', { class: 'primary wide', onclick: kanaReview }, '🔁 Wiederholung'),
      section('hira'),
      section('kata'),
    );
  }

  function studyGroup(g) {
    prog(g.id).started = true;
    persist();
    show(
      backBtn(() => go('kana')),
      pageHead(`${KANA.names[g.script]} – ${g.label}`, 'Tippe auf ein Zeichen zum Anhören. Die Stimme liest einzelne Zeichen nicht immer perfekt vor.'),
      h(
        'div',
        { class: 'tiles' },
        g.chars.map((c) => h('button', { class: 'tile', onclick: () => Voice.speak(c.k, code()) }, h('span', { class: 'kana' }, c.k), h('span', { class: 'muted' }, c.r))),
      ),
      h('button', { class: 'primary wide', onclick: () => groupQuiz(g) }, '📝 Quiz zu dieser Gruppe'),
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
      const passed = ok / n >= KANA_PASS;
      resultScreen({
        title: passed ? 'Gruppe geschafft ✔' : 'Noch nicht ganz',
        text: `${ok} von ${n} richtig (${pct(ok / n)})`,
        ratio: ok / n,
        xp: ok * 10,
        actions: [
          passed && next ? [`Weiter: ${KANA.names[next.script]} ${next.label}`, () => studyGroup(next), true] : ['Nochmal', () => groupQuiz(g), true],
          passed && ['Nochmal', () => groupQuiz(g)],
          ['Zur Gruppe', () => studyGroup(g)],
          ['Übersicht', () => go('kana')],
        ].filter(Boolean),
      });
    }, () => go('kana'));
  }

  function kanaReview() {
    const pool = kanaGroups().filter((g) => prog(g.id).started).flatMap((g) => g.chars);
    if (!pool.length) return show(backBtn(() => go('kana')), h('div', { class: 'empty' }, h('div', { class: 'trophy' }, '📭'), h('p', {}, 'Öffne zuerst eine Kana-Gruppe, dann gibt es etwas zu wiederholen.')));
    const now = Date.now();
    const due = pool.filter((c) => state.srs[`kana|${c.k}`]?.due <= now);
    const fresh = pool.filter((c) => !state.srs[`kana|${c.k}`]);
    const qs = [...shuffle(due), ...shuffle(fresh)].slice(0, 10);
    const targets = qs.length ? qs : shuffle(pool).slice(0, 10); // nichts fällig -> freie Übung
    runKanaQuiz(targets, (ok, n) => {
      markDaily('kana');
      resultScreen({
        title: 'Wiederholung beendet',
        text: `${ok} von ${n} richtig (${pct(ok / n)})`,
        ratio: ok / n,
        xp: ok * 10,
        actions: [['Nochmal', kanaReview, true], ['Übersicht', () => go('kana')]],
      });
    }, () => go('kana'));
  }

  // Wechselt zwischen "Zeichen sehen -> Umschrift wählen" und "Zeichen hören -> Zeichen wählen".
  function runKanaQuiz(qs, onDone, back) {
    let i = 0;
    let ok = 0;
    const step = () => {
      if (i >= qs.length) {
        addXp(ok * 10);
        return onDone(ok, qs.length);
      }
      const c = qs[i];
      const hear = i % 2 === 1;
      const same = KANA[c.script].flatMap((g) => g.chars);
      const wrong = shuffle(same.filter((x) => x.k !== c.k && x.r !== c.r)).slice(0, 3);
      const opts = shuffle([c, ...wrong]);
      const bn = makeBanner(i + 1 < qs.length ? 'Weiter' : 'Ergebnis', () => (i++, step()));
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
              bn.reveal(right, right ? 'Richtig!' : `${c.k} = ${c.r}`);
              if (!hear) Voice.speak(c.k, code());
            },
          },
          hear ? o.k : o.r,
        ),
      );
      show(
        quizTop(back, i, qs.length),
        h('p', { class: 'question' }, hear ? 'Welches Zeichen hörst du?' : 'Wie wird das Zeichen gesprochen?'),
        hear
          ? h('div', { class: 'prompt' }, h('button', { class: 'speaker', 'aria-label': 'Nochmal hören', onclick: () => Voice.speak(c.k, code()) }, '🔊'))
          : h('div', { class: 'prompt' }, h('span', { class: 'kana big-kana' }, c.k)),
        h('div', { class: `options ${hear ? 'kana-options' : ''}` }, btns),
        bn.el,
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
    const shortGrammar = (l) => l.title.replace(/^Grammatik \d+: /, '');
    const nextGrammar = lessons().find((l) => l.group === 'Grammatik' && !prog(l.id).started);
    const tasks = [
      {
        key: 'kana',
        icon: 'あ',
        title: nextGroup ? `Kana: ${KANA.names[nextGroup.script]} – ${nextGroup.label}` : 'Kana wiederholen',
        detail: nextGroup ? 'Neue Gruppe ansehen und üben, ca. 8 Min.' : 'Alle Gruppen geschafft. Kurze Wiederholung, ca. 3 Min.',
        run: () => (nextGroup ? studyGroup(nextGroup) : kanaReview()),
      },
      (nextGrammar || doneToday('grammar')) && {
        key: 'grammar',
        icon: '🧩',
        title: doneToday('grammar') || !nextGrammar ? 'Grammatik' : `Grammatik: ${shortGrammar(nextGrammar)}`,
        detail: doneToday('grammar')
          ? `Heute erledigt.${nextGrammar ? ` Nächste Lektion: ${shortGrammar(nextGrammar)}` : ''}`
          : 'Kurze Erklärung mit Beispielsätzen zum Anhören, ca. 5 Min.',
        run: () => (nextGrammar ? openLesson(nextGrammar) : go('lessons')),
      },
      {
        key: 'srs',
        icon: '🧠',
        title: 'Vokabeln wiederholen',
        detail: all.length ? `${due} fällig, ${Math.min(fresh, 10)} neu, ca. 5 Min.` : 'Öffne zuerst eine Lektion (z. B. „Begrüßung“).',
        run: () => (all.length ? go('srs') : go('lessons')),
      },
      {
        key: 'listen',
        icon: '👂',
        title: 'Hörtraining: 10 Fragen',
        detail: all.length ? 'Wörter und Sätze nur hören, ca. 5 Min.' : 'Starte zuerst eine Lektion.',
        run: () => (all.length ? listenMixed() : go('lessons')),
      },
    ].filter(Boolean);
    const doneCount = tasks.filter((t) => doneToday(t.key)).length;
    const hour = new Date().getHours();
    const [jp, de] = hour < 11 ? ['おはよう', 'Guten Morgen'] : hour < 18 ? ['こんにちは', 'Guten Tag'] : ['こんばんは', 'Guten Abend'];
    show(
      h(
        'section',
        { class: 'hero' },
        h('div', { class: 'hero-top' }, h('div', {}, h('div', { class: 'hello' }, jp), h('h2', {}, de)), h('div', { class: 'flame', title: 'Serie' }, h('span', {}, '🔥'), h('b', {}, streak()), h('small', {}, streak() === 1 ? 'Tag' : 'Tage'))),
        h('p', {}, doneCount === tasks.length ? 'Alles geschafft, stark! 🎉' : `${doneCount} von ${tasks.length} Aufgaben erledigt · ca. 20–25 Min.`),
        bar(doneCount / tasks.length, 'on-hero'),
      ),
      h('h3', {}, 'Dein Plan für heute'),
      h(
        'div',
        { class: 'tasks' },
        tasks.map((t) => {
          const done = doneToday(t.key);
          return h('button', { class: `card task${done ? ' done' : ''}`, onclick: t.run }, h('span', { class: 'check' }, done ? '✔' : t.icon), h('span', { class: 'body' }, h('strong', {}, t.title), h('span', { class: 'muted' }, t.detail)));
        }),
      ),
      h('h3', {}, 'Dazu: echtes Japanisch hören'),
      h('p', { class: 'note' }, 'Für flüssiges Verstehen reicht diese App nicht. Hör zusätzlich täglich 10–15 Minuten echtes Japanisch von Muttersprachlern, z. B. NHK Easy News (Nachrichten in einfacher Sprache), Videos für Lernende (Suchbegriff „Comprehensible Japanese“) oder Anime mit japanischen Untertiteln. Anfangs verstehst du wenig, das ist normal. Wichtig ist die Regelmäßigkeit.'),
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
  renderStats();
  buildNav();
  go(state.lang === 'ja' ? 'today' : 'lessons');
})();
