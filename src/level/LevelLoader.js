import { Level } from './Level.js';
import { TILE_TYPES as T } from '../render/Tileset.js';

const CHAR_TILE = {
  ' ': T.EMPTY,
  '#': T.GROUND,
  'B': T.BRICK,
  'U': T.USED,
  '=': T.SOLID,
  'C': T.CLOUD_BLOCK,
  'D': T.DONUT_BLOCK,
  'L': T.PIPE_TL,
  'R': T.PIPE_TR,
  'l': T.PIPE_L,
  'r': T.PIPE_R,
  '^': T.SPIKE,
  '~': T.WATER,
  'Z': T.CASTLE_BRICK,
};

// Cells that spawn something and become empty afterwards.
const ENTITY_CHARS = new Set(['g', 'k', 'K', 'w', 'y', 'v', 'c', '@', '|', 'O', '?', '!', '&', '$']);

export function parseLevel(def) {
  const rows = def.rows;
  const height = rows.length;
  const width = Math.max(...rows.map((r) => r.length));
  const grid = [];
  const entitySpawns = [];
  let playerStart = { x: 2, y: height - 4 };
  let goalX = width - 3;
  let midpoint = null;

  for (let y = 0; y < height; y++) {
    const row = rows[y].padEnd(width, ' ');
    const tileRow = [];
    for (let x = 0; x < width; x++) {
      const ch = row[x];
      if (ch === '@') {
        playerStart = { x, y };
        tileRow.push(T.EMPTY);
        continue;
      }
      if (ch === '|') {
        goalX = x;
        tileRow.push(T.EMPTY);
        continue;
      }
      if (ch === 'O') {
        midpoint = { x, y };
        tileRow.push(T.EMPTY);
        continue;
      }
      if (ch === '?') {
        entitySpawns.push({ type: 'block-coin', x, y });
        tileRow.push(T.QUESTION);
        continue;
      }
      if (ch === '!') {
        entitySpawns.push({ type: 'block-power', x, y });
        tileRow.push(T.QUESTION);
        continue;
      }
      if (ch === '&') {
        entitySpawns.push({ type: 'block-1up', x, y });
        tileRow.push(T.QUESTION);
        continue;
      }
      if (ch === '$') {
        entitySpawns.push({ type: 'block-star', x, y });
        tileRow.push(T.QUESTION);
        continue;
      }
      if (ENTITY_CHARS.has(ch)) {
        const map = { g: 'grumpkin', k: 'shellback-green', K: 'shellback-red', w: 'shellback-winged', y: 'spiky', v: 'piranha', c: 'coin' };
        if (map[ch]) entitySpawns.push({ type: map[ch], x, y });
        tileRow.push(T.EMPTY);
        continue;
      }
      tileRow.push(CHAR_TILE[ch] ?? T.EMPTY);
    }
    grid.push(tileRow);
  }

  return new Level({
    name: def.name,
    theme: def.theme,
    grid,
    width,
    height,
    entitySpawns,
    playerStart,
    goalX,
    midpoint,
    timeLimit: def.timeLimit,
    powerupType: def.powerupType,
    music: def.music,
  });
}
