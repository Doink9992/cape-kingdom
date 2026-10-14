// KI-Gesprächspartner über die Anthropic Messages API (direkt aus dem Browser, mit eigenem API-Key).
const AI = (() => {
  const systemPrompt = (name, isJa) =>
    [
      `Du bist ein freundlicher, geduldiger Gesprächspartner für ${name}. Dein Gegenüber ist ein deutschsprachiger Anfänger (Niveau A1).`,
      'Regeln:',
      `- Antworte auf ${name} mit höchstens 2 sehr kurzen, einfachen Sätzen und stelle am Ende eine einfache Frage zu Alltagsthemen (Begrüßung, Familie, Essen, Hobbys, Wege).`,
      isJa ? '- Schreibe Japanisch in Hiragana/Katakana und nur ganz einfachen Kanji. Setze danach in einer neuen Zeile die Romaji-Umschrift in Klammern.' : '',
      '- Enthält die letzte Nachricht des Lernenden einen Fehler, hänge nach einer Leerzeile eine kurze Zeile auf Deutsch an, die mit "Korrektur:" beginnt und die richtige Form nennt. Ohne Fehler keine Korrektur.',
      `- Schreibt der Lernende Deutsch, nenne kurz den passenden Satz auf ${name} und mach dann auf ${name} weiter.`,
      '- Kein Markdown, keine Aufzählungen.',
    ]
      .filter(Boolean)
      .join('\n');

  async function chat({ apiKey, model, langName, isJa, messages }) {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({ model, max_tokens: 400, system: systemPrompt(langName, isJa), messages }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(`API-Fehler ${res.status}: ${data.error?.message || res.statusText}`);
    return (data.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('').trim();
  }

  // Antwort in Hauptteil und Korrektur trennen; "speakable" ohne Umschrift-Zeilen für die Sprachausgabe.
  function parseReply(text) {
    const [main, fix = ''] = text.split(/\n*\s*Korrektur:\s*/i);
    const speakable = main
      .split('\n')
      .filter((l) => !/^\s*[(（]/.test(l))
      .join(' ')
      .trim();
    return { main: main.trim(), fix: fix.trim(), speakable };
  }

  return { chat, parseReply };
})();

if (typeof module !== 'undefined') module.exports = AI;
