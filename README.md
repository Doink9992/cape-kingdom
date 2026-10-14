# Sprachtrainer (Schwerpunkt: Japanisch verstehen)

Web-App zum Lernen von **Japanisch, Englisch und Italienisch** (Niveau A1, für Deutschsprachige).
Reines HTML/CSS/JS, kein Build, kein Server-Backend. Japanisch ist der Schwerpunkt, Ziel: **Hörverstehen**.

## Funktionen

- **Oberfläche**: moderne, kontrastreiche Gestaltung mit Hell-/Dunkelmodus, Tab-Leiste unten am Handy (oben am Desktop), Fortschrittsbalken, grünes/rotes Feedback nach jeder Antwort, Ergebnis-Bildschirm mit Konfetti. Animationen werden bei „Bewegung reduzieren“ abgeschaltet.
- **Serie und Punkte**: Tage in Folge (🔥) und Punkte (⭐) für Quiz, Hören, Kana, Vokabeln und Sprechen, angezeigt oben.
- **Heute** (nur Japanisch): Tagesplan für ca. 20–25 Minuten: Kana, Grammatik (solange neue Lektionen anstehen), Vokabeln wiederholen, Hörtraining.
- **Kana-Trainer** (nur Japanisch): Hiragana und Katakana in 15 Gruppen je Schrift (inkl. ゛/゜ und Kombinationen wie きゃ). Zeichen ansehen und anhören, Quiz in zwei Richtungen (Zeichen → Umschrift, Hören → Zeichen). Gruppe gilt ab 80 % als gelernt. Falsche Zeichen kommen früher zur Wiederholung.
- **Hörtraining**: Wort/Satz nur anhören (auch langsam), Bedeutung wählen, Text erst danach sichtbar. Braucht keine Kana-Kenntnisse.
- **Lektionen**: je 5 (Englisch, Italienisch) bzw. 67 (Japanisch) Lektionen mit Quiz, bei Japanisch nach Gruppen einklappbar. Japanisch mit Umschrift, darunter 2 „Anime“-Lektionen (häufige Ausrufe und Alltagsrituale in lockerer Sprache) und **ca. 470 häufige Wörter** in 46 Lektionen (Grundwörter, Verben, Nomen, Adjektive & mehr), jeweils mit Beispielsatz zum Anhören.
- **Grammatik** (nur Japanisch): 10 kurze Lektionen mit Erklärtext und 76 Beispielsätzen zum Anhören, Üben und Wiederholen: die Partikel は, が, を, に, で, の, も, と, から, まで, か, ね, よ, höfliche und Kurzform, Verneinung/Vergangenheit, て-Form, Wünsche und Aufforderungen (〜たい, 〜よう, 〜な).
- **Hörsätze**: Beispielsätze jeder Wortlisten-Lektion als Hörquiz (Satz hören, Bedeutung wählen).
- **Vokabeltrainer**: Karteikarten mit Wiederholungsplan (Leitner-Boxen: 1, 2, 4, 8, 16, 32 Tage). Karten kommen aus den Lektionen, die du geöffnet hast.
- **Sprechen üben**: Satz anhören, nachsprechen, die Spracherkennung des Browsers vergleicht (Treffer ab 75 %).
- **KI-Gespräch**: Konversation mit Claude auf Anfängerniveau, mit Korrekturen auf Deutsch. Braucht einen eigenen Anthropic-API-Key (Nutzung kostet nach Verbrauch).

## Von überall starten (Hosting + App installieren)

Die App ist eine installierbare Web-App (PWA) mit Offline-Modus und wird bei jedem Push auf `main` automatisch auf GitHub Pages veröffentlicht (Workflow `.github/workflows/pages.yml`: erst die Tests, dann das Deployment).

1. Adresse (bei Standard-Einstellungen): `https://doink9992.github.io/cape-kingdom/`. Die genaue Adresse steht unter Settings → Pages bzw. im Lauf des Workflows „Pages“.
2. Falls das Deployment mit „Pages not enabled“ o. Ä. scheitert: im Repo **Settings → Pages → Build and deployment → Source: „GitHub Actions“** einstellen und den Workflow unter **Actions** neu starten.
3. Am Handy im Browser öffnen und „Zum Startbildschirm hinzufügen“ (Chrome: Menü → „App installieren“, Safari: Teilen → „Zum Home-Bildschirm“). Nach dem ersten Laden funktioniert sie auch ohne Internet (nur Spracherkennung und KI-Gespräch brauchen Netz).

Hinweise: Bei privaten Repos braucht GitHub Pages je nach Tarif ein bezahltes Konto. Updates erscheinen nach dem nächsten Öffnen (Cache wird im Hintergrund erneuert). Dein Fortschritt liegt pro Gerät im Browser und wird nicht zwischen Geräten synchronisiert.

## Starten (lokal)

```sh
python3 -m http.server 8000
# dann http://localhost:8000 im Browser öffnen
```

Spracherkennung funktioniert nur über `https://` oder `localhost` und nur in **Chrome, Edge oder Safari** (nicht Firefox). Sie sendet Audio an den Dienst des Browser-Herstellers, es wird also eine Internetverbindung gebraucht.

## Grenzen

- **Die App allein führt nicht zu flüssigem Hörverstehen.** Die Stimme ist synthetisch und spricht langsam und deutlich. Dazu braucht es täglich echtes Japanisch von Muttersprachlern (z. B. NHK Easy News, Videos für Lernende, Anime mit japanischen Untertiteln). Realistisch dauert das Jahre, nicht Wochen.
- Kanji-Training fehlt noch. Die Grammatik deckt nur die Grundlagen ab (keine Höflichkeitsstufen im Detail, keine Bedingungs-/Passiv-/Kausativformen). Der Wortschatz umfasst rund 570 Einträge, für flüssiges Verstehen wären mehrere Tausend nötig.
- **Die Wortliste ist nicht geprüft:** Sie wurde von KI-Modellen aus dem Gedächtnis geschrieben, nicht nach einer Häufigkeitsstatistik sortiert und nicht von Muttersprachlern korrigiert. Lesungen und Romaji wurden maschinell auf Übereinstimmung geprüft, die Bedeutungen und Beispielsätze stichprobenartig gelesen. Einzelne Fehler sind möglich.
- Die Grammatik-Erklärungen und -Sätze habe ich selbst geschrieben und nicht von Muttersprachlern prüfen lassen.
- Einzelne Kana und Kanji werden von der Browser-Stimme nicht immer perfekt gelesen. Fürs Vorlesen wird deshalb wo möglich die Kana-Schreibweise genutzt.
- Die Aussprachebewertung ist nur der Textvergleich dessen, was die Spracherkennung verstanden hat. Sie sagt nicht, *wie* gut du klingst. Bei Japanisch kann die Erkennung Kanji statt Kana liefern; dafür gibt es Alternativschreibweisen in `js/data.js`.
- Die Qualität der Stimmen hängt vom Gerät ab. Fehlt eine Japanisch- oder Italienisch-Stimme, bleibt die Vorlesefunktion stumm.
- Der API-Key liegt im `localStorage` des Browsers und wird direkt an `api.anthropic.com` gesendet. Nur auf dem eigenen Gerät nutzen.
- Der Lernfortschritt liegt ebenfalls nur im Browser (`localStorage`).

## Inhalte erweitern

Neue Lektionen oder Sprachen in `js/data.js` ergänzen (Kana-Tabellen: `js/kana.js`, Wortliste: `js/data.freq.js`) (Zeilenformat steht oben in der Datei). Für eine neue Sprache zusätzlich den BCP-47-Code in `LANGS` setzen.

## Tests

```sh
node --test test/logic.test.js
```
