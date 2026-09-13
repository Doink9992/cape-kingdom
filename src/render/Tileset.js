// Procedural rendering for level tiles. Tile ids are simple integers defined
// in level JSON files; see TILE_TYPES for the legend.

export const TILE_TYPES = {
  EMPTY: 0,
  GROUND: 1,
  BRICK: 2,
  QUESTION: 3,
  USED: 4,
  SOLID: 5,
  PIPE_TL: 6,
  PIPE_TR: 7,
  PIPE_L: 8,
  PIPE_R: 9,
  CLOUD_BLOCK: 10,
  CASTLE_BRICK: 11,
  COIN_BLOCK_HIDDEN: 12,
  SPIKE: 13,
  WATER: 14,
  ROPE_ANCHOR: 15,
  DONUT_BLOCK: 16,
  VINE: 17,
  FLAGPOLE: 18,
  BG_HILL: 19,
  BG_BUSH: 20,
  BG_CLOUD: 21,
  GOAL_GATE_POST: 22,
};

export const SOLID_TILES = new Set([
  TILE_TYPES.GROUND, TILE_TYPES.BRICK, TILE_TYPES.QUESTION, TILE_TYPES.USED,
  TILE_TYPES.SOLID, TILE_TYPES.PIPE_TL, TILE_TYPES.PIPE_TR, TILE_TYPES.PIPE_L,
  TILE_TYPES.PIPE_R, TILE_TYPES.CLOUD_BLOCK, TILE_TYPES.CASTLE_BRICK,
  TILE_TYPES.COIN_BLOCK_HIDDEN, TILE_TYPES.DONUT_BLOCK,
]);

export const BUMPABLE_TILES = new Set([
  TILE_TYPES.BRICK, TILE_TYPES.QUESTION, TILE_TYPES.COIN_BLOCK_HIDDEN,
]);

function rect(ctx, x, y, w, h, c) {
  ctx.fillStyle = c;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

// 3D block bevel: light strip top+left, dark strip bottom+right, plus a
// faint outer border so adjacent tiles of the same type stay legible.
function bevel(ctx, x, y, size, u, light, dark, border = 'rgba(0,0,0,0.28)') {
  rect(ctx, x, y, size, u, light);
  rect(ctx, x, y, u, size, light);
  rect(ctx, x, y + size - u, size, u, dark);
  rect(ctx, x + size - u, y, u, size, dark);
  ctx.strokeStyle = border;
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, size - 1, size - 1);
}

export function drawTile(ctx, id, x, y, size, opts = {}) {
  const t = TILE_TYPES;
  const u = size / 16;
  switch (id) {
    case t.GROUND: {
      rect(ctx, x, y, size, size, '#a8622a');
      rect(ctx, x, y, size, 6 * u, '#3fa63f');
      rect(ctx, x, y + 5 * u, size, 2 * u, '#2c8a2c');
      rect(ctx, x, y, size, 1.6 * u, '#5fc85f');
      for (let i = 0; i < 3; i++) {
        rect(ctx, x + (2 + i * 5) * u, y + 8 * u, 2.4 * u, 2 * u, '#8c4f20');
      }
      rect(ctx, x, y + size - 1.5 * u, size, 1.5 * u, '#7a4818');
      ctx.strokeStyle = 'rgba(0,0,0,0.25)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 0.5, y + 0.5, size - 1, size - 1);
      break;
    }
    case t.BRICK:
    case t.CASTLE_BRICK: {
      const base = id === t.CASTLE_BRICK ? '#7a5644' : '#c85a2c';
      const light = id === t.CASTLE_BRICK ? '#8f6a56' : '#e07a48';
      const line = id === t.CASTLE_BRICK ? '#3e291f' : '#7a3010';
      rect(ctx, x, y, size, size, base);
      rect(ctx, x, y, size, 2 * u, light);
      rect(ctx, x, y, size, 1 * u, line);
      rect(ctx, x, y + size / 2 - u, size, 2 * u, line);
      rect(ctx, x, y + size - 1 * u, size, 1 * u, line);
      rect(ctx, x + size / 2 - u, y + 1 * u, 2 * u, size / 2 - 2 * u, line);
      rect(ctx, x, y + size / 2 + u, 2 * u, size / 2 - 2 * u, line);
      rect(ctx, x + size - 2 * u, y + size / 2 + u, 2 * u, size / 2 - 2 * u, line);
      ctx.strokeStyle = 'rgba(0,0,0,0.3)';
      ctx.strokeRect(x + 0.5, y + 0.5, size - 1, size - 1);
      break;
    }
    case t.QUESTION: {
      const pulse = opts.pulse || 0;
      const base = pulse ? '#ffcf3a' : '#e8a020';
      const inner = pulse ? '#ffe070' : '#f2b840';
      rect(ctx, x, y, size, size, '#8c5a10');
      rect(ctx, x + 1.5 * u, y + 1.5 * u, size - 3 * u, size - 3 * u, base);
      rect(ctx, x + 2.5 * u, y + 2.5 * u, size - 5 * u, size - 5 * u, inner);
      rect(ctx, x + 2.5 * u, y + 2.5 * u, size - 5 * u, 2 * u, '#fff6d0');
      ctx.fillStyle = '#8c5a10';
      ctx.font = `bold ${10 * u}px monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('?', x + size / 2, y + size / 2 + u + 1);
      break;
    }
    case t.USED: {
      rect(ctx, x, y, size, size, '#6b4a24');
      rect(ctx, x + 1.5 * u, y + 1.5 * u, size - 3 * u, size - 3 * u, '#8c6030');
      rect(ctx, x + 2.5 * u, y + 2.5 * u, size - 5 * u, 2 * u, '#a8783c');
      break;
    }
    case t.COIN_BLOCK_HIDDEN:
    case t.SOLID: {
      rect(ctx, x, y, size, size, '#6f6f6f');
      bevel(ctx, x, y, size, 2 * u, '#d0d0d0', '#5a5a5a');
      rect(ctx, x + 2 * u, y + 2 * u, size - 4 * u, size - 4 * u, '#9a9a9a');
      break;
    }
    case t.DONUT_BLOCK: {
      const alpha = opts.falling ? Math.max(0.25, 1 - (opts.fallT || 0)) : 1;
      ctx.globalAlpha = alpha;
      rect(ctx, x, y, size, size, '#a8622c');
      bevel(ctx, x, y, size, 2 * u, '#f0b878', '#8c4f20');
      rect(ctx, x + 2 * u, y + 2 * u, size - 4 * u, size - 4 * u, '#d89050');
      ctx.globalAlpha = 1;
      break;
    }
    case t.CLOUD_BLOCK: {
      rect(ctx, x, y, size, size, '#d8d8ff');
      rect(ctx, x + 1 * u, y + 1 * u, size - 2 * u, size - 5 * u, '#fbfbff');
      rect(ctx, x + 2 * u, y + size - 5 * u, size - 4 * u, 3 * u, '#c4c4f0');
      break;
    }
    case t.PIPE_TL: {
      rect(ctx, x, y, size, size, '#0f4a1e');
      rect(ctx, x + 2 * u, y, size - 2 * u, 4 * u, '#2ea043');
      rect(ctx, x + 2 * u, y, size - 2 * u, 1.2 * u, '#5fd873');
      rect(ctx, x, y + 4 * u, size, size - 4 * u, '#0f4a1e');
      rect(ctx, x + 2 * u, y + 4 * u, size - 4 * u, size - 4 * u, '#2ea043');
      rect(ctx, x + 2.5 * u, y + 4.5 * u, 2 * u, size - 5 * u, '#5fd873');
      break;
    }
    case t.PIPE_TR: {
      rect(ctx, x, y, size, size, '#0f4a1e');
      rect(ctx, x, y, size - 2 * u, 4 * u, '#2ea043');
      rect(ctx, x, y, size - 2 * u, 1.2 * u, '#5fd873');
      rect(ctx, x, y + 4 * u, size, size - 4 * u, '#0f4a1e');
      rect(ctx, x + 2 * u, y + 4 * u, size - 4 * u, size - 4 * u, '#2ea043');
      rect(ctx, x + 2.5 * u, y + 4.5 * u, 2 * u, size - 5 * u, '#5fd873');
      break;
    }
    case t.PIPE_L: {
      rect(ctx, x, y, size, size, '#0f4a1e');
      rect(ctx, x + 2 * u, y, size - 4 * u, size, '#2ea043');
      rect(ctx, x + 2.5 * u, y, 2 * u, size, '#5fd873');
      break;
    }
    case t.PIPE_R: {
      rect(ctx, x, y, size, size, '#0f4a1e');
      rect(ctx, x + 2 * u, y, size - 4 * u, size, '#2ea043');
      rect(ctx, x + 2.5 * u, y, 2 * u, size, '#5fd873');
      break;
    }
    case t.SPIKE: {
      ctx.fillStyle = '#3a3a3a';
      for (let i = 0; i < 2; i++) {
        ctx.beginPath();
        ctx.moveTo(x + i * (size / 2), y + size);
        ctx.lineTo(x + i * (size / 2) + size / 4, y + size / 2 - 2 * u);
        ctx.lineTo(x + i * (size / 2) + size / 2, y + size);
        ctx.fill();
      }
      ctx.fillStyle = '#7a7a7a';
      for (let i = 0; i < 2; i++) {
        ctx.beginPath();
        ctx.moveTo(x + i * (size / 2) + size / 4 - 1.5 * u, y + size);
        ctx.lineTo(x + i * (size / 2) + size / 4, y + size / 2 - 2 * u);
        ctx.lineTo(x + i * (size / 2) + size / 4 + 1.5 * u, y + size);
        ctx.fill();
      }
      break;
    }
    case t.WATER: {
      rect(ctx, x, y, size, size, 'rgba(50,110,210,0.55)');
      rect(ctx, x, y, size, 3 * u, 'rgba(210,235,255,0.65)');
      break;
    }
    case t.VINE: {
      rect(ctx, x + size / 2 - u, y, 2 * u, size, '#1c6b2c');
      rect(ctx, x + size / 2 - 0.6 * u, y, 1.2 * u, size, '#3fc453');
      rect(ctx, x + size / 2 - 3 * u, y + 4 * u, 6 * u, 2 * u, '#3fc453');
      break;
    }
    case t.BG_HILL: {
      ctx.fillStyle = '#2c8a2c';
      ctx.beginPath();
      ctx.moveTo(x, y + size);
      ctx.lineTo(x + size / 2, y - size * 0.4);
      ctx.lineTo(x + size, y + size);
      ctx.fill();
      ctx.fillStyle = '#3fa63f';
      ctx.beginPath();
      ctx.moveTo(x + size * 0.1, y + size);
      ctx.lineTo(x + size / 2, y - size * 0.4);
      ctx.lineTo(x + size / 2, y + size);
      ctx.fill();
      break;
    }
    case t.BG_BUSH: {
      ctx.fillStyle = '#1c6b2c';
      ctx.beginPath();
      ctx.arc(x + size * 0.25, y + size * 0.62, size * 0.35, 0, Math.PI * 2);
      ctx.arc(x + size * 0.55, y + size * 0.47, size * 0.4, 0, Math.PI * 2);
      ctx.arc(x + size * 0.85, y + size * 0.62, size * 0.32, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#3fa63f';
      ctx.beginPath();
      ctx.arc(x + size * 0.5, y + size * 0.42, size * 0.3, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case t.BG_CLOUD: {
      ctx.fillStyle = 'rgba(255,255,255,0.92)';
      ctx.beginPath();
      ctx.arc(x + size * 0.3, y + size * 0.55, size * 0.32, 0, Math.PI * 2);
      ctx.arc(x + size * 0.6, y + size * 0.4, size * 0.4, 0, Math.PI * 2);
      ctx.arc(x + size * 0.9, y + size * 0.55, size * 0.3, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    default:
      break;
  }
}
