# Cape Kingdom

Ein browserbasierter 2D-Jump'n'Run-Plattformer, der sich eng an das Spielgefühl
von *Super Mario World* anlehnt: Laufen/Rennen, variable Sprunghöhe, Spin-Jump,
Cape-Flug mit Flatter-Fallschirm, Pilz/Feuerblume/Cape-Feder-Powerups,
Shell-Kick-Mechanik bei Koopa-ähnlichen Gegnern, Münzen, ?-Blöcke, Ziegel zum
Zerschlagen, eine Weltkarte mit freischaltbaren Leveln, Zwischenpunkte
(Checkpoints), ein Zielflaggenmast und vieles mehr.

**Wichtig:** Dieses Projekt enthält **keine** Original-Grafiken, -Sounds oder
-Markennamen von Nintendo. Alle Sprites werden zur Laufzeit prozedural mit
`<canvas>` gezeichnet, alle Soundeffekte werden mit der Web Audio API
synthetisiert. Es ist ein eigenständiges Fan-Projekt zu Lernzwecken, das die
*Spielmechanik* des Genres nachbildet, nicht dessen geschütztes Artwork.

## Spielen

Das Spiel läuft komplett im Browser (reines HTML5-Canvas + JavaScript, keine
Abhängigkeiten, kein Build-Schritt) und funktioniert identisch unter
**Windows** und **Linux Mint** (bzw. jedem aktuellen Betriebssystem mit
Browser).

Da das Spiel ES-Module lädt, muss es über einen lokalen Webserver aufgerufen
werden (nicht per Doppelklick auf `index.html`, das blockieren Browser aus
Sicherheitsgründen).

### Variante 1: Python (auf Windows & Linux Mint vorinstalliert/leicht verfügbar)

```bash
python3 -m http.server 8000
```

Windows (falls `python3` nicht gefunden wird, `python` verwenden):

```bash
python -m http.server 8000
```

Danach im Browser öffnen: [http://localhost:8000](http://localhost:8000)

### Variante 2: Node.js

```bash
npx serve .
```

### Variante 3: GitHub Pages

Die `main`-Branch kann direkt über GitHub Pages veröffentlicht werden
(Settings → Pages → Deploy from branch → `main` / root). Kein Build nötig.

## Steuerung

| Aktion              | Taste(n)                      |
| -------------------- | ------------------------------ |
| Bewegen               | Pfeiltasten / A, D             |
| Rennen (halten)       | Shift / X, J                   |
| Springen               | Leertaste / Z, K               |
| Spin-Jump             | Runter + Springen              |
| Ducken (als großer Charakter) | Pfeil runter / S       |
| Feuerball werfen / Cape-Flug steuern | Rennen-Taste (während in der Luft) |
| Pause                 | Escape / Enter                 |

Touch-Steuerung (Pfeile + Y/B) erscheint automatisch auf Touch-Geräten.

## Spielmechanik-Highlights

- **Variable Sprunghöhe** – je länger die Sprungtaste gehalten wird, desto
  höher der Sprung (bis zu einem Maximum).
- **Spin-Jump** – besiegt auch stachelige Gegner, die einen normalen
  Sprung-Stomp bestrafen würden.
- **Cape-Feder** – verleiht einen höheren Sprung nach einem Anlauf, sowie
  einen Flatter-Fallschirm zum Gleiten, wenn die Sprungtaste in der Luft
  gehalten wird.
- **Feuerblume** – erlaubt das Werfen von abprallenden Feuerbällen.
- **Koopa-Shells** – grüne Gegner laufen von Kanten herunter, rote drehen an
  Kanten um; ein Stomp verwandelt sie in einen Panzer, der sich wegkicken
  lässt und dabei andere Gegner sowie Ziegelsteine zerstört.
- **Combo-Scoring** – mehrere Gegner in Folge (ohne Bodenkontakt dazwischen)
  zu besiegen erhöht den Punktewert pro Treffer (100 → 200 → 400 → …), analog
  zum Original.
- **Münzen-Bonusleben** – 100 gesammelte Münzen ergeben ein Extraleben.
- **Zwischenpunkte (Checkpoints)** – ein erreichter Kontrollpunkt wird zum
  neuen Respawn-Punkt innerhalb eines Levels.
- **Fallende Donut-Blöcke** – lösen sich unter den Füßen, sobald man darauf
  steht.

## Projektstruktur

```
index.html            Einstiegspunkt / Canvas
src/
  engine/              Game-Loop, Input, Kamera, Sound, Konstanten
  entities/            Spieler, Gegner, Items, Projektile, Partikel
  level/               Level-Datenmodell, Kollisionslogik, Loader
  render/               Prozedurale Pixel-Art-Sprites & Tile-Rendering
  ui/                   HUD, Titel, Weltkarte, Menüs
  data/                 Level-Layouts (World 1 & 2) + Weltkarten-Daten
```

Level werden nicht als rohe ASCII-Strings von Hand gezählt, sondern über einen
kleinen [`LevelBuilder`](src/data/LevelBuilder.js) programmatisch erzeugt
(Koordinaten statt Zeichen-Zählerei), was Layout-Fehler deutlich reduziert.

## Umfang

Zwei Welten mit je vier Leveln (Wiesenland & Höhlenwelt, jeweils endend mit
einem Schlosslevel), Gegnerroster (Grumpkin/Goomba-Analog, grüne & rote
Shellback/Koopa-Analoga, fliegende Variante, Spiky, Piranha-Pflanze),
vollständiger Powerup-Zyklus (klein → groß → Feuer/Cape), Weltkarte mit
Speicherstand (`localStorage`), Pause-/Game-Over-/Sieg-Bildschirme.

Nicht enthalten (bewusst außerhalb des Zeitrahmens): Bosskämpfe, Mehrspieler,
Speicherstand in der Cloud, Vertikal-Level mit Kamera-Scroll nach oben.

## Mitwirken

Reines Vanilla-JS-Projekt ohne Build-Pipeline – einfach Dateien bearbeiten und
den lokalen Server neu laden. Neue Level lassen sich über den `LevelBuilder`
in `src/data/levels/` hinzufügen und in `src/data/world.js` registrieren.
