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

export function drawTile(ctx, id, x, y, size, opts = {}) {
  const t = TILE_TYPES;
  const u = size / 16;
  switch (id) {
    case t.GROUND: {
      rect(ctx, x, y, size, size, '#c87830');
      rect(ctx, x, y, size, 4 * u, '#3fa63f');
      rect(ctx, x, y + 4 * u, size, 3 * u, '#2c8a2c');
      for (let i = 0; i < 2; i++) {
        rect(ctx, x + 2 * u + i * 8 * u, y + 9 * u, 3 * u, 2 * u, '#a8622a');
      }
      break;
    }
    case t.BRICK:
    case t.CASTLE_BRICK: {
      const base = id === t.CASTLE_BRICK ? '#6b4a3a' : '#c85a2c';
      const line = id === t.CASTLE_BRICK ? '#4a3226' : '#8c3c1a';
      rect(ctx, x, y, size, size, base);
      rect(ctx, x, y + size / 2 - u, size, 2 * u, line);
      rect(ctx, x + size / 2 - u, y, 2 * u, size / 2, line);
      rect(ctx, x, y + size / 2, 2 * u, size / 2, line);
      rect(ctx, x + size - 2 * u, y + size / 2, 2 * u, size / 2, line);
      break;
    }
    case t.QUESTION: {
      const pulse = opts.pulse || 0;
      rect(ctx, x, y, size, size, pulse ? '#ffcf3a' : '#e8a020');
      rect(ctx, x + 2 * u, y + 2 * u, size - 4 * u, size - 4 * u, pulse ? '#ffe070' : '#f2b840');
      ctx.fillStyle = '#8c5a10';
      ctx.font = `bold ${10 * u}px monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('?', x + size / 2, y + size / 2 + u);
      rect(ctx, x, y, size, 2 * u, '#fff6d0');
      break;
    }
    case t.USED: {
      rect(ctx, x, y, size, size, '#a8783c');
      rect(ctx, x + 2 * u, y + 2 * u, size - 4 * u, size - 4 * u, '#8c6030');
      break;
    }
    case t.COIN_BLOCK_HIDDEN:
    case t.SOLID: {
      rect(ctx, x, y, size, size, '#9a9a9a');
      rect(ctx, x + 2 * u, y + 2 * u, size - 4 * u, size - 4 * u, '#c0c0c0');
      break;
    }
    case t.DONUT_BLOCK: {
      const alpha = opts.falling ? Math.max(0.2, 1 - (opts.fallT || 0)) : 1;
      ctx.globalAlpha = alpha;
      rect(ctx, x, y, size, size, '#d89050');
      rect(ctx, x + 2 * u, y + 2 * u, size - 4 * u, size - 4 * u, '#c87830');
      ctx.globalAlpha = 1;
      break;
    }
    case t.CLOUD_BLOCK: {
      rect(ctx, x, y, size, size, '#f2f2f2');
      rect(ctx, x + 2 * u, y + size - 5 * u, size - 4 * u, 3 * u, '#d8d8ff');
      break;
    }
    case t.PIPE_TL: {
      rect(ctx, x, y, size, size, '#1c6b2c');
      rect(ctx, x + 2 * u, y, size - 2 * u, 4 * u, '#2ea043');
      rect(ctx, x, y + 4 * u, size, size - 4 * u, '#1c6b2c');
      rect(ctx, x + 2 * u, y + 4 * u, size - 4 * u, size - 4 * u, '#2ea043');
      break;
    }
    case t.PIPE_TR: {
      rect(ctx, x, y, size, size, '#1c6b2c');
      rect(ctx, x, y, size - 2 * u, 4 * u, '#2ea043');
      rect(ctx, x, y + 4 * u, size, size - 4 * u, '#1c6b2c');
      rect(ctx, x + 2 * u, y + 4 * u, size - 4 * u, size - 4 * u, '#2ea043');
      break;
    }
    case t.PIPE_L: {
      rect(ctx, x, y, size, size, '#1c6b2c');
      rect(ctx, x + 2 * u, y, size - 4 * u, size, '#2ea043');
      break;
    }
    case t.PIPE_R: {
      rect(ctx, x, y, size, size, '#1c6b2c');
      rect(ctx, x + 2 * u, y, size - 4 * u, size, '#2ea043');
      break;
    }
    case t.SPIKE: {
      ctx.fillStyle = '#8a8a8a';
      for (let i = 0; i < 2; i++) {
        ctx.beginPath();
        ctx.moveTo(x + i * (size / 2), y + size);
        ctx.lineTo(x + i * (size / 2) + size / 4, y + size / 2);
        ctx.lineTo(x + i * (size / 2) + size / 2, y + size);
        ctx.fill();
      }
      break;
    }
    case t.WATER: {
      rect(ctx, x, y, size, size, 'rgba(60,120,220,0.55)');
      rect(ctx, x, y, size, 3 * u, 'rgba(200,230,255,0.6)');
      break;
    }
    case t.VINE: {
      rect(ctx, x + size / 2 - u, y, 2 * u, size, '#2ea043');
      rect(ctx, x + size / 2 - 3 * u, y + 4 * u, 6 * u, 2 * u, '#3fc453');
      break;
    }
    case t.BG_HILL: {
      ctx.fillStyle = '#3fa63f';
      ctx.beginPath();
      ctx.moveTo(x, y + size);
      ctx.lineTo(x + size / 2, y - size * 0.4);
      ctx.lineTo(x + size, y + size);
      ctx.fill();
      break;
    }
    case t.BG_BUSH: {
      ctx.fillStyle = '#2c8a2c';
      ctx.beginPath();
      ctx.arc(x + size * 0.25, y + size * 0.6, size * 0.35, 0, Math.PI * 2);
      ctx.arc(x + size * 0.55, y + size * 0.45, size * 0.4, 0, Math.PI * 2);
      ctx.arc(x + size * 0.85, y + size * 0.6, size * 0.32, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case t.BG_CLOUD: {
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
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
