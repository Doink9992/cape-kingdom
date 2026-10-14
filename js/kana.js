// Kana-Tabellen. Katakana wird aus Hiragana abgeleitet (Unicode-Abstand 0x60).
// ぢ/づ fehlen absichtlich: Ihre Umschrift (ji/zu) ist identisch mit じ/ず und würde Quizfragen mehrdeutig machen.
const KANA = (() => {
  // [Label, Zeichenfolge als "kana:romaji kana:romaji ..."]
  const SRC = [
    ['Vokale', 'あ:a い:i う:u え:e お:o'],
    ['k', 'か:ka き:ki く:ku け:ke こ:ko'],
    ['s', 'さ:sa し:shi す:su せ:se そ:so'],
    ['t', 'た:ta ち:chi つ:tsu て:te と:to'],
    ['n', 'な:na に:ni ぬ:nu ね:ne の:no'],
    ['h', 'は:ha ひ:hi ふ:fu へ:he ほ:ho'],
    ['m', 'ま:ma み:mi む:mu め:me も:mo'],
    ['y', 'や:ya ゆ:yu よ:yo'],
    ['r', 'ら:ra り:ri る:ru れ:re ろ:ro'],
    ['w und n', 'わ:wa を:wo ん:n'],
    ['g und z', 'が:ga ぎ:gi ぐ:gu げ:ge ご:go ざ:za じ:ji ず:zu ぜ:ze ぞ:zo'],
    ['d, b und p', 'だ:da で:de ど:do ば:ba び:bi ぶ:bu べ:be ぼ:bo ぱ:pa ぴ:pi ぷ:pu ぺ:pe ぽ:po'],
    ['Kombinationen 1', 'きゃ:kya きゅ:kyu きょ:kyo しゃ:sha しゅ:shu しょ:sho ちゃ:cha ちゅ:chu ちょ:cho にゃ:nya にゅ:nyu にょ:nyo'],
    ['Kombinationen 2', 'ひゃ:hya ひゅ:hyu ひょ:hyo みゃ:mya みゅ:myu みょ:myo りゃ:rya りゅ:ryu りょ:ryo'],
    ['Kombinationen 3', 'ぎゃ:gya ぎゅ:gyu ぎょ:gyo じゃ:ja じゅ:ju じょ:jo びゃ:bya びゅ:byu びょ:byo ぴゃ:pya ぴゅ:pyu ぴょ:pyo'],
  ];

  const toKata = (s) => s.replace(/[ぁ-ゖ]/g, (c) => String.fromCharCode(c.charCodeAt(0) + 0x60));

  const build = (script) =>
    SRC.map(([label, row], i) => ({
      id: `kana-${script}-${i}`,
      script,
      label,
      chars: row.split(' ').map((p) => {
        const [k, r] = p.split(':');
        return { k: script === 'kata' ? toKata(k) : k, r, script };
      }),
    }));

  return { hira: build('hira'), kata: build('kata'), names: { hira: 'Hiragana', kata: 'Katakana' } };
})();

if (typeof module !== 'undefined') module.exports = KANA;
