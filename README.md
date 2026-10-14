# Sprachen sprechen lernen

Web-App zum Lernen von **Englisch, Japanisch und Italienisch** (Niveau A1, für Deutschsprachige).
Reines HTML/CSS/JS, kein Build, kein Server-Backend.

## Funktionen

- **Lektionen**: je 5 Lektionen pro Sprache (Begrüßung, Vorstellen, Zahlen, Essen, Unterwegs) mit Quiz.
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

- Die Aussprachebewertung ist nur der Textvergleich dessen, was die Spracherkennung verstanden hat. Sie sagt nicht, *wie* gut du klingst. Bei Japanisch kann die Erkennung Kanji statt Kana liefern; dafür gibt es Alternativschreibweisen in `js/data.js`.
- Die Qualität der Stimmen hängt vom Gerät ab. Fehlt eine Japanisch- oder Italienisch-Stimme, bleibt die Vorlesefunktion stumm.
- Der API-Key liegt im `localStorage` des Browsers und wird direkt an `api.anthropic.com` gesendet. Nur auf dem eigenen Gerät nutzen.
- Der Lernfortschritt liegt ebenfalls nur im Browser (`localStorage`).

## Inhalte erweitern

Neue Lektionen oder Sprachen in `js/data.js` ergänzen (Zeilenformat steht oben in der Datei). Für eine neue Sprache zusätzlich den BCP-47-Code in `LANGS` setzen.

## Tests

```sh
node --test test/logic.test.js
```
