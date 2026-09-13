import { VIEW_W, VIEW_H } from '../engine/Constants.js';
import { drawTile, TILE_TYPES } from './Tileset.js';

const THEMES = {
  overworld: { sky: ['#5c94fc', '#a8d0ff'], hills: true, clouds: true, bushes: true },
  underground: { sky: ['#0a0a1a', '#0a0a1a'], hills: false, clouds: false, bushes: false, grid: '#141428' },
  castle: { sky: ['#1a0e0e', '#3a1414'], hills: false, clouds: false, bushes: false, bricks: true },
  water: { sky: ['#1a4a8c', '#4a90d8'], hills: false, clouds: true, bushes: false },
  night: { sky: ['#0e1030', '#28204c'], hills: true, clouds: false, bushes: true, stars: true },
  sky: { sky: ['#7ac8ff', '#cfe8ff'], hills: false, clouds: true, bushes: false },
};

export function drawBackground(ctx, camera, theme) {
  const t = THEMES[theme] || THEMES.overworld;
  const grad = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  grad.addColorStop(0, t.sky[0]);
  grad.addColorStop(1, t.sky[1]);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  if (t.stars) {
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    for (let i = 0; i < 40; i++) {
      const sx = (i * 173 - camera.x * 0.1) % (VIEW_W + 40);
      const sy = (i * 97) % (VIEW_H * 0.6);
      ctx.fillRect(((sx + VIEW_W) % (VIEW_W + 40)), sy, 2, 2);
    }
  }

  if (t.clouds) {
    const offset = -(camera.x * 0.3) % 400;
    for (let i = -1; i < 4; i++) {
      drawTile(ctx, TILE_TYPES.BG_CLOUD, offset + i * 400 + 40, 40, 90);
      drawTile(ctx, TILE_TYPES.BG_CLOUD, offset + i * 400 + 220, 90, 70);
    }
  }

  if (t.hills) {
    const offset = -(camera.x * 0.5) % 600;
    for (let i = -1; i < 3; i++) {
      drawTile(ctx, TILE_TYPES.BG_HILL, offset + i * 600 + 60, VIEW_H - 140, 240);
      drawTile(ctx, TILE_TYPES.BG_HILL, offset + i * 600 + 300, VIEW_H - 100, 180);
    }
  }

  if (t.bushes) {
    const offset = -(camera.x * 0.7) % 320;
    for (let i = -1; i < 5; i++) {
      drawTile(ctx, TILE_TYPES.BG_BUSH, offset + i * 320 + 20, VIEW_H - 60, 80);
    }
  }

  if (t.bricks) {
    ctx.globalAlpha = 0.35;
    const offset = -(camera.x * 0.6) % 64;
    for (let x = -64; x < VIEW_W + 64; x += 64) {
      for (let y = 0; y < VIEW_H; y += 64) {
        drawTile(ctx, TILE_TYPES.CASTLE_BRICK, offset + x, y, 64);
      }
    }
    ctx.globalAlpha = 1;
  }

  if (t.grid) {
    ctx.fillStyle = t.grid;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  }
}
