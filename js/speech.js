// Sprachausgabe (TTS), Spracherkennung (STT) und Vergleich gesprochen/Soll – alles Browser-eigene APIs.
const Voice = (() => {
  const hasWindow = typeof window !== 'undefined';
  const SR = hasWindow ? window.SpeechRecognition || window.webkitSpeechRecognition : null;
  const canSpeak = hasWindow && 'speechSynthesis' in window;
  const canListen = !!SR;

  // Text vereinheitlichen: Satzzeichen/Leerzeichen weg, Kleinschreibung, Katakana -> Hiragana (Japanisch),
  // Akzente weg (sonst), damit "Sì" und "si" gleich zählen.
  function norm(s, code) {
    s = String(s).normalize('NFKC').toLowerCase();
    if (code.startsWith('ja')) {
      s = s.replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));
    } else {
      s = s.normalize('NFD').replace(/[̀-ͯ]/g, '');
    }
    return s.replace(/[^\p{L}\p{N}]/gu, '');
  }

  function lev(a, b) {
    a = Array.from(a);
    b = Array.from(b);
    let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
    for (let i = 1; i <= a.length; i++) {
      const cur = [i];
      for (let j = 1; j <= b.length; j++) {
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      }
      prev = cur;
    }
    return prev[b.length];
  }

  // Beste Übereinstimmung (0..1) über alle erkannten Varianten und alle zulässigen Schreibweisen.
  function score(heard, targets, code) {
    let best = 0;
    for (const h of heard) {
      const nh = norm(h, code);
      for (const t of targets) {
        const nt = norm(t, code);
        const len = Math.max(nh.length, nt.length);
        if (!len) continue;
        best = Math.max(best, 1 - lev(nh, nt) / len);
      }
    }
    return best;
  }

  function pickVoice(code) {
    const c = code.toLowerCase();
    const voices = speechSynthesis.getVoices();
    return (
      voices.find((v) => v.lang.replace('_', '-').toLowerCase() === c) ||
      voices.find((v) => v.lang.toLowerCase().startsWith(c.split('-')[0]))
    );
  }

  function speak(text, code) {
    if (!canSpeak) return false;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = code;
    u.rate = 0.85; // etwas langsamer für Lernende
    const v = pickVoice(code);
    if (v) u.voice = v;
    speechSynthesis.speak(u);
    return true;
  }

  function listen(code) {
    return new Promise((resolve, reject) => {
      if (!SR) return reject(new Error('nosupport'));
      if (canSpeak) speechSynthesis.cancel();
      const r = new SR();
      r.lang = code;
      r.interimResults = false;
      r.maxAlternatives = 5;
      let got = false;
      r.onresult = (e) => {
        got = true;
        resolve(Array.from(e.results[0]).map((a) => a.transcript));
      };
      r.onerror = (e) => reject(new Error(e.error));
      r.onend = () => {
        if (!got) reject(new Error('no-speech'));
      };
      try {
        r.start();
      } catch (err) {
        reject(err);
      }
    });
  }

  return { canSpeak, canListen, norm, lev, score, speak, listen };
})();

if (typeof module !== 'undefined') module.exports = Voice;
