# Sprachtrainer (Schwerpunkt: Japanisch verstehen)

Web-App zum Lernen von **Japanisch, Englisch und Italienisch** (Niveau A1, für Deutschsprachige).
Reines HTML/CSS/JS, kein Build, kein Server-Backend. Japanisch ist der Schwerpunkt, Ziel: **Hörverstehen**.

## Funktionen

- **Heute** (nur Japanisch): Tagesplan für ca. 20 Minuten: Kana, Vokabeln wiederholen, Hörtraining.
- **Kana-Trainer** (nur Japanisch): Hiragana und Katakana in 15 Gruppen je Schrift (inkl. ゛/゜ und Kombinationen wie きゃ). Zeichen ansehen und anhören, Quiz in zwei Richtungen (Zeichen → Umschrift, Hören → Zeichen). Gruppe gilt ab 80 % als gelernt. Falsche Zeichen kommen früher zur Wiederholung.
- **Hörtraining**: Wort/Satz nur anhören (auch langsam), Bedeutung wählen, Text erst danach sichtbar. Braucht keine Kana-Kenntnisse.
- **Lektionen**: je 5 (Englisch, Italienisch) bzw. 9 (Japanisch) Lektionen mit Quiz. Japanisch mit Umschrift.
- **Vokabeltrainer**: Karteikarten mit Wiederholungsplan (Leitner-Boxen: 1, 2, 4, 8, 16, 32 Tage). Karten kommen aus den Lektionen, die du geöffnet hast.
- **Sprechen üben**: Satz anhören, nachsprechen, die Spracherkennung des Browsers vergleicht (Treffer ab 75 %).
- **KI-Gespräch**: Konversation mit Claude auf Anfängerniveau, mit Korrekturen auf Deutsch. Braucht einen eigenen Anthropic-API-Key (Nutzung kostet nach Verbrauch).

## Starten

```sh
python3 -m http.server 8000
# dann http://localhost:8000 im Browser öffnen
```

Spracherkennung funktioniert nur über `https://` oder `localhost` und nur in **Chrome, Edge oder Safari** (nicht Firefox). Sie sendet Audio an den Dienst des Browser-Herstellers, es wird also eine Internetverbindung gebraucht.

## Grenzen

- **Die App allein führt nicht zu flüssigem Hörverstehen.** Die Stimme ist synthetisch und spricht langsam und deutlich. Dazu braucht es täglich echtes Japanisch von Muttersprachlern (z. B. NHK Easy News, Videos für Lernende, Anime mit japanischen Untertiteln). Realistisch dauert das Jahre, nicht Wochen.
- Kanji, Grammatik-Erklärungen und eine große Wortschatzliste nach Häufigkeit fehlen noch. Der Wortschatz umfasst bisher nur rund 80 Einträge.
- Einzelne Kana und Kanji werden von der Browser-Stimme nicht immer perfekt gelesen. Fürs Vorlesen wird deshalb wo möglich die Kana-Schreibweise genutzt.
- Die Aussprachebewertung ist nur der Textvergleich dessen, was die Spracherkennung verstanden hat. Sie sagt nicht, *wie* gut du klingst. Bei Japanisch kann die Erkennung Kanji statt Kana liefern; dafür gibt es Alternativschreibweisen in `js/data.js`.
- Die Qualität der Stimmen hängt vom Gerät ab. Fehlt eine Japanisch- oder Italienisch-Stimme, bleibt die Vorlesefunktion stumm.
- Der API-Key liegt im `localStorage` des Browsers und wird direkt an `api.anthropic.com` gesendet. Nur auf dem eigenen Gerät nutzen.
- Der Lernfortschritt liegt ebenfalls nur im Browser (`localStorage`).

## Inhalte erweitern

Neue Lektionen oder Sprachen in `js/data.js` ergänzen (Kana-Tabellen: `js/kana.js`) (Zeilenformat steht oben in der Datei). Für eine neue Sprache zusätzlich den BCP-47-Code in `LANGS` setzen.

## Tests

```sh
node --test test/logic.test.js
```
