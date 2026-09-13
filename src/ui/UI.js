import { VIEW_W, VIEW_H } from '../engine/Constants.js';
import { WORLDS, allLevelDefs } from '../data/world.js';
import { drawMushroom, drawFireFlower, drawStar, drawCoin } from '../render/Sprites.js';
import { drawTile, TILE_TYPES } from '../render/Tileset.js';

function bigText(ctx, str, x, y, size, color, shadow) {
  ctx.font = `bold ${size}px monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillStyle = shadow;
  for (let i = 6; i >= 1; i--) ctx.fillText(str, x, y + i);
  ctx.strokeStyle = '#1a1208';
  ctx.lineWidth = size / 7;
  ctx.lineJoin = 'round';
  ctx.miterLimit = 2;
  ctx.strokeText(str, x, y);
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
}

function text(ctx, str, x, y, size, color, align = 'left', outline = true) {
  ctx.font = `bold ${size}px monospace`;
  ctx.textAlign = align;
  ctx.textBaseline = 'top';
  if (outline) {
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = Math.max(3, size / 4);
    ctx.strokeText(str, x, y);
  }
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
}

function panel(ctx, x, y, w, h, alpha = 0.72) {
  ctx.fillStyle = `rgba(10,10,20,${alpha})`;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
}

export function drawTitle(ctx, game) {
  const grad = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  grad.addColorStop(0, '#3f6fd8');
  grad.addColorStop(0.7, '#5c94fc');
  grad.addColorStop(1, '#cfe8ff');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  const cloudCount = Math.ceil(VIEW_W / 220) + 1;
  for (let i = 0; i < cloudCount; i++) {
    const cx = ((i * 220 + game.titleBlink * 6) % (VIEW_W + 220)) - 110;
    drawTile(ctx, TILE_TYPES.BG_CLOUD, cx, 40 + (i % 3) * 34, 96);
  }

  const hillW = 260;
  const hillCount = Math.ceil(VIEW_W / hillW) + 1;
  for (let i = 0; i < hillCount; i++) {
    drawTile(ctx, TILE_TYPES.BG_HILL, i * hillW - 40, VIEW_H - 210, hillW * 1.3);
  }
  for (let i = 0; i < hillCount + 1; i++) {
    drawTile(ctx, TILE_TYPES.BG_BUSH, i * 150 + 20, VIEW_H - 108, 110);
  }
  for (let gx = 0; gx < VIEW_W; gx += 32) {
    drawTile(ctx, TILE_TYPES.GROUND, gx, VIEW_H - 48, 32);
    drawTile(ctx, TILE_TYPES.GROUND, gx, VIEW_H - 16, 32);
  }

  const cx = VIEW_W / 2;
  bigText(ctx, 'CAPE KINGDOM', cx, 58, 52, '#ffcf3a', 'rgba(120,60,0,0.9)');
  text(ctx, 'ein Super-Mario-World-inspirierter Plattformer', cx, 122, 13, '#fff8e0', 'center');

  const bob = Math.sin(game.titleBlink * 3) * 6;
  drawMushroom(ctx, cx - 200, 170 + bob, 46, 46, 'power');
  drawFireFlower(ctx, cx - 23, 170 - bob, 46, 46);
  drawStar(ctx, cx + 154, 170 + bob, 46, 46, Math.floor(game.titleBlink * 8));

  panel(ctx, cx - 190, 236, 380, 40, 0.55);
  if (Math.floor(game.titleBlink * 2) % 2 === 0) {
    text(ctx, 'DRÜCKE LEERTASTE / Z ZUM START', cx, 246, 16, '#fff', 'center');
  }

  panel(ctx, cx - 320, VIEW_H - 78, 640, 62, 0.5);
  text(ctx, 'Pfeiltasten: bewegen   Shift/X: rennen   Leertaste/Z: springen', cx, VIEW_H - 68, 11, '#eee', 'center');
  text(ctx, 'Runter+Springen: Spin-Jump   Feuer/Cape: Rennen-Taste', cx, VIEW_H - 50, 11, '#eee', 'center');
  text(ctx, 'github.com — original fan-made engine, keine Nintendo-Assets', cx, VIEW_H - 32, 9, '#cceeff', 'center');
}

export function drawMap(ctx, game) {
  ctx.fillStyle = '#2c7a3f';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  for (let i = 0; i < 20; i++) {
    ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)';
    ctx.fillRect((i * 53) % VIEW_W, (i * 97) % VIEW_H, 40, 40);
  }

  const n = allLevelDefs.length;
  const margin = 60;
  const spacing = (VIEW_W - margin * 2) / (n - 1);
  const baseY = VIEW_H / 2;

  ctx.strokeStyle = '#d8c088';
  ctx.lineWidth = 8;
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const x = margin + i * spacing;
    const y = baseY + Math.sin(i * 1.3) * 60;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();

  for (let i = 0; i < n; i++) {
    const x = margin + i * spacing;
    const y = baseY + Math.sin(i * 1.3) * 60;
    const unlocked = i <= game.progress.unlockedIndex;
    const completed = game.progress.completed.includes(i);
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.fillStyle = completed ? '#ffcf3a' : unlocked ? '#f2f2f2' : '#6a6a6a';
    ctx.fill();
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 3;
    ctx.stroke();
    text(ctx, allLevelDefs[i].shortName, x, y - 8, 11, '#1a1a1a', 'center', false);

    if (i === game.mapCursor) {
      const bob = Math.sin(game.frame * 0.2) * 6;
      ctx.beginPath();
      ctx.moveTo(x, y - 34 + bob);
      ctx.lineTo(x - 8, y - 46 + bob);
      ctx.lineTo(x + 8, y - 46 + bob);
      ctx.closePath();
      ctx.fillStyle = '#e8402c';
      ctx.fill();
    }
  }

  const cur = allLevelDefs[game.mapCursor];
  panel(ctx, VIEW_W / 2 - 160, 24, 320, 44);
  text(ctx, cur.name, VIEW_W / 2, 34, 16, '#fff', 'center');

  panel(ctx, 20, VIEW_H - 50, VIEW_W - 40, 34, 0.6);
  text(ctx, `Leben: ${game.progress.lives ?? 4}   Coins: ${game.progress.coinsCarry ?? 0}   Punkte: ${game.progress.scoreTotal ?? 0}`, 30, VIEW_H - 42, 13, '#fff');
  text(ctx, '◀ ▶ wählen · Sprung-Taste: Start', VIEW_W - 30, VIEW_H - 42, 13, '#fff', 'right');
}

export function drawHUD(ctx, game) {
  const p = game.player;
  if (!p) return;
  ctx.save();

  const grad = ctx.createLinearGradient(0, 0, 0, 46);
  grad.addColorStop(0, 'rgba(10,10,20,0.75)');
  grad.addColorStop(1, 'rgba(10,10,20,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, VIEW_W, 46);

  const cx = VIEW_W / 2;
  const cols = [cx - 320, cx - 130, cx + 70, cx + 260];

  text(ctx, 'PUNKTE', cols[0], 8, 12, '#cfd8ff');
  text(ctx, String(p.score).padStart(6, '0'), cols[0], 24, 18, '#ffe870');

  drawCoin(ctx, cols[1] - 4, 6, 18, 22, Math.floor(game.frame / 8) % 4);
  text(ctx, String(p.coins).padStart(2, '0'), cols[1] + 22, 12, 18, '#ffe870');

  text(ctx, 'WELT', cols[2], 8, 12, '#cfd8ff');
  text(ctx, game.level.name.split(' ')[0], cols[2], 24, 18, '#fff');

  text(ctx, 'ZEIT', cols[3], 8, 12, '#cfd8ff');
  text(ctx, String(Math.max(0, Math.ceil(game.timeLeft))).padStart(3, '0'), cols[3], 24, 18, game.timeLeft < 40 ? '#ff5040' : '#fff');

  for (let i = 0; i < Math.min(p.lives, 8); i++) {
    drawMushroom(ctx, 16 + i * 22, VIEW_H - 34, 20, 20, 'life');
  }
  if (game.combo > 1) {
    text(ctx, `COMBO x${game.combo}`, VIEW_W - 20, 54, 14, '#ffcf3a', 'right');
  }
  ctx.restore();
}

export function drawIntro(ctx, game) {
  panel(ctx, 0, VIEW_H / 2 - 40, VIEW_W, 80, 0.75);
  text(ctx, game.level.name, VIEW_W / 2, VIEW_H / 2 - 24, 22, '#fff', 'center');
  text(ctx, `Leben: ${game.player.lives}`, VIEW_W / 2, VIEW_H / 2 + 6, 14, '#ffcf3a', 'center');
}

export function drawPause(ctx, game) {
  panel(ctx, 0, 0, VIEW_W, VIEW_H, 0.55);
  text(ctx, 'PAUSE', VIEW_W / 2, VIEW_H / 2 - 30, 32, '#fff', 'center');
  text(ctx, 'Enter/Esc zum Fortsetzen', VIEW_W / 2, VIEW_H / 2 + 20, 14, '#eee', 'center');
}

export function drawLevelComplete(ctx, game) {
  panel(ctx, VIEW_W / 2 - 160, VIEW_H / 2 - 70, 320, 140, 0.8);
  text(ctx, 'LEVEL GESCHAFFT!', VIEW_W / 2, VIEW_H / 2 - 55, 20, '#ffcf3a', 'center');
  text(ctx, `Punkte: ${game.player.score}`, VIEW_W / 2, VIEW_H / 2 - 20, 14, '#fff', 'center');
  text(ctx, `Coins: ${game.player.coins}`, VIEW_W / 2, VIEW_H / 2, 14, '#fff', 'center');
  if (game.completeStage >= 1) {
    text(ctx, 'Weiter...', VIEW_W / 2, VIEW_H / 2 + 30, 12, '#eee', 'center');
  }
}

export function drawGameOver(ctx, game) {
  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  text(ctx, 'GAME OVER', VIEW_W / 2, VIEW_H / 2 - 30, 36, '#ff4040', 'center');
  text(ctx, 'Sprung-Taste für die Weltkarte', VIEW_W / 2, VIEW_H / 2 + 30, 14, '#fff', 'center');
}

export function drawWin(ctx, game) {
  const grad = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  grad.addColorStop(0, '#0e1030');
  grad.addColorStop(1, '#5c94fc');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  text(ctx, 'DU HAST CAPE KINGDOM GERETTET!', VIEW_W / 2, 140, 22, '#ffcf3a', 'center');
  text(ctx, `Endpunktzahl: ${game.progress.scoreTotal}`, VIEW_W / 2, 190, 16, '#fff', 'center');
  drawStar(ctx, VIEW_W / 2 - 24, 240 + Math.sin(game.titleBlink * 2) * 10, 48, 48, Math.floor(game.titleBlink * 8));
  text(ctx, 'Danke fürs Spielen! Leertaste für das Titelmenü.', VIEW_W / 2, 340, 13, '#eee', 'center');
}
