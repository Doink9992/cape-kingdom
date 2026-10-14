const test = require('node:test');
const assert = require('node:assert');
const Voice = require('../js/speech.js');
const AI = require('../js/ai.js');
const { LANGS, LESSONS } = require('../js/data.js');

test('Daten: jede Sprache hat Lektionen, eindeutige IDs und gültige Einträge', () => {
  for (const lang of Object.keys(LANGS)) {
    const ids = LESSONS[lang].map((l) => l.id);
    assert.strictEqual(new Set(ids).size, ids.length);
    const ts = LESSONS[lang].flatMap((l) => l.items.map((i) => i.t));
    assert.strictEqual(new Set(ts).size, ts.length, `${lang}: doppelte Einträge`);
    for (const it of LESSONS[lang].flatMap((l) => l.items)) {
      assert.ok(it.t && it.de, `${lang}: leerer Eintrag`);
      if (lang === 'ja') assert.ok(it.r, `ja: Umschrift fehlt bei ${it.t}`);
    }
  }
});

test('score: exakte und tolerante Treffer', () => {
  assert.strictEqual(Voice.score(['Hello'], ['Hello'], 'en-US'), 1);
  assert.strictEqual(Voice.score(['hello!'], ['Hello'], 'en-US'), 1);
  assert.ok(Voice.score(['si'], ['Sì'], 'it-IT') === 1);
  assert.ok(Voice.score(['Dove è la stazione'], ['Dov’è la stazione?', 'Dove è la stazione?'], 'it-IT') === 1);
  assert.ok(Voice.score(['goodbye'], ['Hello'], 'en-US') < 0.5);
  assert.strictEqual(Voice.score([], ['Hello'], 'en-US'), 0);
});

test('score: Japanisch (Katakana/Hiragana, Ziffern, Alternativen)', () => {
  assert.strictEqual(Voice.score(['こーひー'], ['コーヒー'], 'ja-JP'), 1);
  assert.strictEqual(Voice.score(['3'], ['三', 'さん', '3'], 'ja-JP'), 1);
  assert.strictEqual(Voice.score(['おねがいします'], ['お願いします', 'おねがいします'], 'ja-JP'), 1);
  assert.ok(Voice.score(['こんばんは'], ['こんにちは'], 'ja-JP') < 0.75);
});

test('parseReply trennt Korrektur und Umschrift', () => {
  const r = AI.parseReply('こんにちは！げんきですか？\n(Konnichiwa! Genki desu ka?)\n\nKorrektur: Besser: ...');
  assert.strictEqual(r.fix, 'Besser: ...');
  assert.strictEqual(r.speakable, 'こんにちは！げんきですか？');
});

const KANA = require('../js/kana.js');

test('Kana: Tabellen vollständig, Umschrift eindeutig, Katakana korrekt abgeleitet', () => {
  for (const script of ['hira', 'kata']) {
    const chars = KANA[script].flatMap((g) => g.chars);
    assert.strictEqual(chars.length, 46 + 10 + 13 + 33, `${script}: Anzahl`); // Grund + g/z + d/b/p (ohne ぢ/づ) + Kombinationen
    assert.strictEqual(new Set(chars.map((c) => c.r)).size, chars.length, `${script}: doppelte Umschrift`);
    assert.strictEqual(new Set(chars.map((c) => c.k)).size, chars.length, `${script}: doppelte Zeichen`);
  }
  const first = (s) => KANA[s][0].chars.map((c) => c.k).join('');
  assert.strictEqual(first('hira'), 'あいうえお');
  assert.strictEqual(first('kata'), 'アイウエオ');
  const kyo = KANA.kata.flatMap((g) => g.chars).find((c) => c.r === 'kyo');
  assert.strictEqual(kyo.k, 'キョ');
});

test('Japanisch: Lesungen zum Vorlesen sind echte Kana-Alternativen', () => {
  const kanaOnly = /^[぀-ヿ]+$/;
  const sevens = LESSONS.ja.flatMap((l) => l.items).find((i) => i.t === '七');
  assert.strictEqual(sevens.alt.find((a) => kanaOnly.test(a)), 'なな');
});

test('Japanisch: Anime-Lektionen vorhanden und Einträge eindeutig', () => {
  const ids = LESSONS.ja.map((l) => l.id);
  assert.ok(ids.includes('anime1') && ids.includes('anime2'));
  assert.strictEqual(LESSONS.ja.find((l) => l.id === 'anime1').items.length, 10);
});
