// Original, procedurally-drawn "pixel art" for every character/object in the
// game. Shapes are composed from a handful of rectangles per part (with a
// cheap octagon-rounding trick so nothing reads as a raw rectangle), baked
// once per animation state into a cached bitmap with an automatic 1px
// silhouette outline (see SpriteCache.js), then blitted every frame. No
// external image assets are used anywhere.

import { getSprite } from './SpriteCache.js';

function block(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

// Cheap "rounded rect" for blocky pixel art: overlaying a slightly-narrower
// vertical bar with a slightly-shorter horizontal bar cuts the corners.
function soft(ctx, x, y, w, h, color, cut = 2) {
  block(ctx, x + cut, y, w - cut * 2, h, color);
  block(ctx, x, y + cut, w, h - cut * 2, color);
}

function eye(ctx, x, y, s, color = '#1a1a1a') {
  block(ctx, x, y, s, s, '#fff');
  block(ctx, x + s * 0.3, y + s * 0.3, s * 0.6, s * 0.6, color);
}

const PAL = {
  hero: {
    cap: '#e8720c', capDark: '#b85608', capLight: '#ff9838',
    skin: '#ffd0a0', skinDark: '#e0a878',
    shirt: '#e8720c', shirtDark: '#b85608',
    overalls: '#177a6c', overallsDark: '#0e5346', overallsLight: '#22a68f',
    boots: '#5a3418', bootsDark: '#3a2410', buckle: '#ffd84a',
  },
  heroFire: {
    cap: '#f4f4f4', capDark: '#c8c8c8', capLight: '#ffffff',
    skin: '#ffd0a0', skinDark: '#e0a878',
    shirt: '#f4f4f4', shirtDark: '#c8c8c8',
    overalls: '#d3241e', overallsDark: '#921712', overallsLight: '#f04438',
    boots: '#5a3418', bootsDark: '#3a2410', buckle: '#ffd84a',
  },
  heroCape: {
    cap: '#f2d020', capDark: '#c8a412', capLight: '#ffe870',
    skin: '#ffd0a0', skinDark: '#e0a878',
    shirt: '#f2d020', shirtDark: '#c8a412',
    overalls: '#177a6c', overallsDark: '#0e5346', overallsLight: '#22a68f',
    boots: '#5a3418', bootsDark: '#3a2410', buckle: '#ffd84a',
    cape: '#ffe14a', capeDark: '#e0b810', capeLight: '#fff4b0',
  },
};

// Classic side-view platformer silhouette: drawn facing right, then mirrored
// for facing left. A running stride staggers front/back legs instead of the
// old symmetric front-facing pose.
function paintPlayer(ctx, w, h, s) {
  const big = h > 40;
  const pal = s.fire ? PAL.heroFire : (s.cape ? PAL.heroCape : PAL.hero);
  const walkBob = s.frame === 1 ? 1 : (s.frame === 2 ? -1 : 0);
  const crouch = s.crouch && big;
  const bodyH = crouch ? h * 0.62 : h;
  const top = h - bodyH;
  const u = w / 16;
  const cx = w / 2;

  ctx.save();
  if (s.facing < 0) { ctx.translate(w, 0); ctx.scale(-1, 1); }

  if (s.cape && !crouch) {
    const flap = s.capeOpen ? 7 : (s.frame % 2 === 0 ? 2 : 3.6);
    const backX = cx - 4 * u;
    const topCapeY = top + (big ? 9 : 4.5) * u;
    const capeLen = big ? 18 * u : 9.5 * u;
    const capeW = big ? 9 * u : 5.4 * u;
    ctx.beginPath();
    ctx.moveTo(backX - capeW * 0.1, topCapeY);
    ctx.lineTo(backX + capeW * 0.5, topCapeY);
    ctx.quadraticCurveTo(backX + capeW * 0.6 - flap * u, topCapeY + capeLen * 0.55, backX + capeW * 0.25 - flap * u, topCapeY + capeLen);
    ctx.lineTo(backX - capeW * 0.35 - flap * u * 0.6, topCapeY + capeLen * 0.92);
    ctx.quadraticCurveTo(backX - capeW * 0.6 - flap * u * 0.3, topCapeY + capeLen * 0.5, backX - capeW * 0.1, topCapeY);
    ctx.closePath();
    ctx.fillStyle = pal.capeDark;
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(backX - capeW * 0.05, topCapeY + capeW * 0.22);
    ctx.lineTo(backX + capeW * 0.35, topCapeY + capeW * 0.22);
    ctx.lineTo(backX + capeW * 0.1 - flap * u * 0.7, topCapeY + capeLen * 0.78);
    ctx.lineTo(backX - capeW * 0.2 - flap * u * 0.4, topCapeY + capeLen * 0.72);
    ctx.closePath();
    ctx.fillStyle = pal.cape;
    ctx.fill();
    block(ctx, backX - capeW * 0.02, topCapeY + capeW * 0.12, capeW * 0.28, capeLen * 0.16, pal.capeLight);
  }

  if (!big) {
    const swing = Math.abs(walkBob);
    const frontX = cx + 0.5 * u + walkBob * 1.4 * u;
    const backX2 = cx - 3.4 * u - walkBob * 1.4 * u;
    const frontLift = walkBob > 0 ? 1.2 * u : 0;
    const backLift = walkBob < 0 ? 1.2 * u : 0;
    const legW = 2.6 * u, legTop = top + 12 * u, legH = 4 * u;

    block(ctx, backX2, legTop + backLift, legW, legH - backLift, pal.bootsDark);
    soft(ctx, backX2 - 0.3 * u, legTop + legH - backLift - 0.4 * u, legW + 0.6 * u, 1.8 * u, pal.boots, 0.8);

    soft(ctx, cx - 5 * u, top + 0.2 * u, 8.5 * u, 3.6 * u, pal.cap, 1.8);
    block(ctx, cx + 1.5 * u, top + 2 * u, 4.2 * u, 1.7 * u, pal.capDark);
    block(ctx, cx - 4 * u, top + 0.6 * u, 5.5 * u, 1 * u, pal.capLight);
    soft(ctx, cx - 4 * u, top + 3.2 * u, 7 * u, 4.4 * u, pal.skin, 1.2);
    block(ctx, cx + 2.6 * u, top + 5 * u, 1.8 * u, 1.7 * u, pal.skin);
    eye(ctx, cx + 1 * u, top + 4.2 * u, 1.5 * u);
    block(ctx, cx - 1 * u, top + 6.9 * u, 3 * u, 0.8 * u, pal.skinDark);

    const armY = top + 8 * u - swing * 0.6 * u;
    soft(ctx, cx + 2 * u, armY, 2.2 * u, 3.6 * u, pal.shirt, 0.6);

    soft(ctx, cx - 4 * u, top + 7.6 * u, 7 * u, 4.4 * u, pal.overalls, 1.2);
    block(ctx, cx - 1.4 * u, top + 7.6 * u, 1.8 * u, 1.3 * u, pal.overallsLight);

    block(ctx, frontX, legTop + frontLift, legW, legH - frontLift, pal.bootsDark);
    soft(ctx, frontX - 0.3 * u, legTop + legH - frontLift - 0.4 * u, legW + 0.6 * u, 1.8 * u, pal.boots, 0.8);
    ctx.restore();
    return;
  }

  const swingBig = s.spinning ? (s.frame % 2 === 0 ? 1 : -1) : walkBob;
  const legLiftBase = s.jumping || s.spinning ? 2.6 * u : 0;
  const frontLegLift = legLiftBase + (swingBig > 0 ? 1.6 * u : 0);
  const backLegLift = legLiftBase + (swingBig < 0 ? 1.6 * u : 0);
  const frontLegX = cx + 0.6 * u + swingBig * 1.6 * u;
  const backLegX = cx - 5 * u - swingBig * 1.6 * u;
  const legW = 4.4 * u, legTop = top + 23 * u, legH = 6 * u;

  block(ctx, backLegX, legTop + backLegLift, legW, legH - backLegLift, pal.overallsDark);
  soft(ctx, backLegX - 0.4 * u, legTop + legH - backLegLift - 0.6 * u, legW + 0.8 * u, 2.6 * u, pal.boots, 1);

  if (crouch) {
    soft(ctx, cx - 6 * u, top, 11 * u, 4.4 * u, pal.cap, 2.2);
    block(ctx, cx + 2.5 * u, top + 1.8 * u, 5.5 * u, 2 * u, pal.capDark);
    block(ctx, cx - 5 * u, top + 0.8 * u, 7 * u, 1.3 * u, pal.capLight);
    soft(ctx, cx - 4.8 * u, top + 4.2 * u, 9 * u, 5 * u, pal.skin, 1.6);
    eye(ctx, cx + 1.6 * u, top + 5.8 * u, 2 * u);
    block(ctx, cx + 3.4 * u, top + 7 * u, 2.4 * u, 1.8 * u, pal.skin);
    soft(ctx, cx - 7 * u, top + 8.6 * u, 13 * u, 8.4 * u, pal.overalls, 2);
    block(ctx, cx - 7 * u, top + 8.6 * u, 13 * u, 1.1 * u, pal.overallsLight);
    block(ctx, cx - 7 * u, top + 15.5 * u, 13 * u, 3.5 * u, pal.boots);
    ctx.restore();
    return;
  }

  soft(ctx, cx - 6 * u, top, 11 * u, 4 * u, pal.cap, 2.2);
  block(ctx, cx + 2.5 * u, top + 1.6 * u, 5.5 * u, 2.2 * u, pal.capDark);
  block(ctx, cx - 5 * u, top + 0.8 * u, 7 * u, 1.3 * u, pal.capLight);
  block(ctx, cx - 5 * u, top + 3.2 * u, 10 * u, 1.6 * u, pal.cap);

  soft(ctx, cx - 4.8 * u, top + 4.8 * u, 9 * u, 6.4 * u, pal.skin, 1.6);
  block(ctx, cx + 3.4 * u, top + 7.4 * u, 2.6 * u, 2.4 * u, pal.skin);
  eye(ctx, cx + 1.6 * u, top + 6.6 * u, 2 * u);
  block(ctx, cx - 1.4 * u, top + 10.2 * u, 4 * u, 1 * u, pal.skinDark);

  const backArmY = top + 12 * u - (swingBig < 0 ? 2 * u : 0);
  soft(ctx, cx - 8 * u, backArmY, 3.2 * u, 6 * u, pal.shirtDark, 1);

  soft(ctx, cx - 6 * u, top + 11 * u, 11 * u, 4.4 * u, pal.shirt, 1.8);
  soft(ctx, cx - 6 * u, top + 14.6 * u, 11 * u, 8.4 * u, pal.overalls, 1.8);
  block(ctx, cx - 6 * u, top + 14.6 * u, 11 * u, 1.2 * u, pal.overallsLight);
  block(ctx, cx - 1.8 * u, top + 16 * u, 3.6 * u, 2.2 * u, pal.buckle);

  const frontArmY = top + 11.5 * u - (swingBig > 0 ? 2 * u : 0);
  soft(ctx, cx + 4 * u, frontArmY, 3.4 * u, 6.4 * u, pal.shirt, 1.2);
  block(ctx, cx + 4 * u, frontArmY + 5 * u, 3.4 * u, 1.8 * u, pal.skin);

  block(ctx, frontLegX, legTop + frontLegLift, legW, legH - frontLegLift, pal.overallsDark);
  soft(ctx, frontLegX - 0.4 * u, legTop + legH - frontLegLift - 0.6 * u, legW + 0.8 * u, 2.6 * u, pal.boots, 1);

  ctx.restore();
}

export function drawPlayer(ctx, x, y, w, h, s) {
  if ((s.starFlicker) && Math.floor(s.time / 3) % 2 === 0) return;
  const key = ['hero', h > 40 ? 'big' : 'small', s.fire ? 'fire' : s.cape ? 'cape' : 'norm',
    s.facing, s.frame, s.crouch ? 1 : 0, s.jumping ? 1 : 0, s.spinning ? 1 : 0, s.capeOpen ? 1 : 0].join('_');
  const sprite = getSprite(key, Math.ceil(w), Math.ceil(h), (c, cw, ch) => paintPlayer(c, cw, ch, s));
  ctx.drawImage(sprite, Math.round(x), Math.round(y));
}

export function drawFireball(ctx, x, y, size, frame) {
  const key = `fireball_${frame % 2}`;
  const sprite = getSprite(key, size, size, (c) => {
    const colors = ['#ff8c1a', '#ffcf3a'];
    c.fillStyle = colors[frame % 2];
    c.beginPath(); c.arc(size / 2, size / 2, size / 2 - 1, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#fff2c8';
    c.beginPath(); c.arc(size / 2 - size * 0.15, size / 2 - size * 0.15, size * 0.18, 0, Math.PI * 2); c.fill();
  });
  ctx.drawImage(sprite, Math.round(x), Math.round(y));
}

function paintGrumpkin(ctx, w, h, s) {
  const u = w / 16;
  const squish = s.squashed ? 0.4 : 1;
  const top = h * (1 - squish);
  const bh = h * squish;
  soft(ctx, 0.5 * u, top + bh * 0.1, w - 1 * u, bh * 0.7, '#96622f', 2.4);
  block(ctx, 0.5 * u, top + bh * 0.1, w - 1 * u, bh * 0.18, '#a8703a');
  soft(ctx, 1.5 * u, top + bh * 0.62, w - 3 * u, bh * 0.34, '#5c3a1c', 1.6);
  if (!s.squashed) {
    const eyeY = top + bh * 0.32;
    eye(ctx, 3.2 * u, eyeY, 2.6 * u);
    eye(ctx, 10.2 * u, eyeY, 2.6 * u);
    block(ctx, 2.6 * u, top + bh * 0.16, 4 * u, 1 * u, '#3a2410');
    block(ctx, 9.6 * u, top + bh * 0.16, 4 * u, 1 * u, '#3a2410');
    const footOffset = s.frame === 1 ? 1.2 * u : 0;
    soft(ctx, 1 * u, h - 2.6 * u, 5 * u, 2.6 * u + footOffset, '#3a2410', 1);
    soft(ctx, w - 6 * u, h - 2.6 * u, 5 * u, 2.6 * u + (footOffset ? 0 : 1.2 * u), '#3a2410', 1);
  }
}

export function drawGrumpkin(ctx, x, y, w, h, s) {
  const key = `grumpkin_${s.squashed ? 1 : 0}_${s.frame}`;
  const sprite = getSprite(key, Math.ceil(w), Math.ceil(h), (c, cw, ch) => paintGrumpkin(c, cw, ch, s));
  ctx.drawImage(sprite, Math.round(x), Math.round(y));
}

function paintShellback(ctx, w, h, s) {
  const u = w / 16;
  const color = s.color || '#2ea043';
  const colorDark = s.colorShade || '#1c6b2c';
  const colorLight = s.colorLight || '#4fc463';
  if (s.inShell) {
    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.rotate((s.spinFrame || 0) * 0.6);
    ctx.translate(-w / 2, -h / 2);
    soft(ctx, 1 * u, 2 * u, w - 2 * u, h - 4 * u, colorDark, 2.4);
    soft(ctx, 2 * u, 3.2 * u, w - 4 * u, h - 7.4 * u, color, 1.8);
    block(ctx, 3.5 * u, 4.5 * u, w - 7 * u, 2 * u, colorLight);
    block(ctx, 4 * u, 0.6 * u, w - 8 * u, 2.4 * u, '#e8e0b8');
    ctx.restore();
    return;
  }
  const bob = s.frame === 1 ? 1 * u : 0;
  if (s.winged) {
    const flap = s.frame % 2 === 0 ? -2.2 * u : 1.6 * u;
    soft(ctx, -2.5 * u, 4 * u + flap, 5.5 * u, 3.4 * u, '#f2f2f2', 1.4);
    soft(ctx, w - 3 * u, 4 * u - flap, 5.5 * u, 3.4 * u, '#f2f2f2', 1.4);
  }
  soft(ctx, 2 * u, 1.6 * u, w - 4 * u, 4.4 * u, '#ffd0a0', 1.2);
  eye(ctx, 4 * u, 2.6 * u, 1.4 * u);
  eye(ctx, 9.4 * u, 2.6 * u, 1.4 * u);
  soft(ctx, 0.6 * u, 5.6 * u, w - 1.2 * u, h - 9.6 * u, colorDark, 2.4);
  soft(ctx, 1.6 * u, 6.8 * u, w - 3.2 * u, h - 12 * u, color, 1.8);
  block(ctx, 3 * u, 7.6 * u, w - 6 * u, 1.6 * u, colorLight);
  soft(ctx, 1 * u, h - 4 * u - bob, 4 * u, 4 * u, '#ffd0a0', 1);
  soft(ctx, w - 5 * u, h - 4 * u - (bob ? 0 : 1.2 * u), 4 * u, 4 * u, '#ffd0a0', 1);
}

export function drawShellback(ctx, x, y, w, h, s) {
  const key = `shellback_${s.color}_${s.inShell ? 1 : 0}_${s.winged ? 1 : 0}_${s.frame}_${s.spinFrame}`;
  const sprite = getSprite(key, Math.ceil(w), Math.ceil(h), (c, cw, ch) => paintShellback(c, cw, ch, {
    ...s,
    colorShade: s.colorShade,
    colorLight: s.color === '#c8262a' ? '#e8545a' : '#4fc463',
  }));
  ctx.drawImage(sprite, Math.round(x), Math.round(y));
}

function paintSpiky(ctx, w, h, s) {
  const u = w / 16;
  soft(ctx, 1 * u, 4.5 * u, w - 2 * u, h - 6.5 * u, '#8c1024', 2.4);
  soft(ctx, 2 * u, 5.7 * u, w - 4 * u, h - 10 * u, '#c81e3a', 1.8);
  const spikes = 5;
  for (let i = 0; i < spikes; i++) {
    const sx = (i + 0.5) * (w / spikes);
    ctx.fillStyle = '#7a0f1f';
    ctx.beginPath();
    ctx.moveTo(sx - 2.2 * u, 5.5 * u);
    ctx.lineTo(sx, 0);
    ctx.lineTo(sx + 2.2 * u, 5.5 * u);
    ctx.fill();
  }
  eye(ctx, 3.6 * u, 7.2 * u, 2 * u);
  eye(ctx, 9.6 * u, 7.2 * u, 2 * u);
  const bob = s.frame === 1 ? 1 * u : 0;
  soft(ctx, 1 * u, h - 3.2 * u - bob, 4 * u, 3.2 * u, '#3a2410', 1);
  soft(ctx, w - 5 * u, h - 3.2 * u - (bob ? 0 : 1.2 * u), 4 * u, 3.2 * u, '#3a2410', 1);
}

export function drawSpiky(ctx, x, y, w, h, s) {
  const key = `spiky_${s.frame}`;
  const sprite = getSprite(key, Math.ceil(w), Math.ceil(h), (c, cw, ch) => paintSpiky(c, cw, ch, s));
  ctx.drawImage(sprite, Math.round(x), Math.round(y));
}

function paintPiranha(ctx, w, h, s) {
  const u = w / 16;
  const open = s.frame % 2 === 0;
  block(ctx, 4 * u, h - 5 * u, 2.2 * u, 5 * u, '#1c6b2c');
  soft(ctx, 3 * u, 1 * u, w - 6 * u, 3.2 * u, '#8fe870', 1.2);
  soft(ctx, 1 * u, 2.4 * u, w - 2 * u, h - 7 * u, '#8c1024', 2.4);
  soft(ctx, 1.6 * u, 3.4 * u, w - 3.2 * u, h - 9 * u, '#e8402c', 1.8);
  block(ctx, 1.6 * u, open ? 6.2 * u : 8.2 * u, w - 3.2 * u, open ? 4 * u : 2 * u, '#7a0f1f');
  for (let i = 0; i < 4; i++) {
    block(ctx, 2.4 * u + i * 2.8 * u, 3.6 * u, 1.4 * u, 1.4 * u, '#fff');
  }
}

export function drawPiranha(ctx, x, y, w, h, s) {
  const key = `piranha_${s.frame}`;
  const sprite = getSprite(key, Math.ceil(w), Math.ceil(h + 4), (c, cw, ch) => paintPiranha(c, cw, ch, s));
  ctx.drawImage(sprite, Math.round(x), Math.round(y - 4));
}

export function drawCoin(ctx, x, y, w, h, frame) {
  const widths = [0.5, 0.32, 0.14, 0.32];
  const key = `coin_${frame % 4}`;
  const sprite = getSprite(key, Math.ceil(w), Math.ceil(h), (c, cw, ch) => {
    const u = cw / 16;
    const cwid = widths[frame % 4] * cw;
    soft(c, (cw - cwid) / 2, 1 * u, cwid, ch - 2 * u, '#c89412', 2);
    soft(c, (cw - cwid * 0.7) / 2, 2 * u, cwid * 0.7, ch - 4 * u, '#ffd84a', 1.4);
    block(c, cw / 2 - cwid * 0.12, 3 * u, Math.max(1, cwid * 0.18), ch - 6 * u, '#fff2b0');
  });
  ctx.drawImage(sprite, Math.round(x), Math.round(y));
}

export function drawMushroom(ctx, x, y, w, h, variant = 'life') {
  const key = `mushroom_${variant}`;
  const sprite = getSprite(key, Math.ceil(w), Math.ceil(h), (c, cw, ch) => {
    const u = cw / 16;
    const capColor = variant === 'life' ? '#2ea043' : '#d3241e';
    const capDark = variant === 'life' ? '#1c6b2c' : '#921712';
    soft(c, 0, 3 * u, cw, 7 * u, capDark, 3);
    soft(c, 0.6 * u, 3.6 * u, cw - 1.2 * u, 6 * u, capColor, 2.6);
    block(c, 1.5 * u, 1.6 * u, 3.2 * u, 3.2 * u, '#fff');
    block(c, cw - 4.7 * u, 1.6 * u, 3.2 * u, 3.2 * u, '#fff');
    block(c, cw / 2 - 1.6 * u, 4.6 * u, 3.2 * u, 3.2 * u, '#fff');
    soft(c, 3 * u, 9 * u, cw - 6 * u, 6 * u, '#f0c088', 1.6);
    block(c, 3 * u, 9 * u, cw - 6 * u, 1.2 * u, '#fff2d8');
    block(c, 4 * u, 11.4 * u, 1.6 * u, 1.6 * u, '#c89058');
    block(c, cw - 5.6 * u, 11.4 * u, 1.6 * u, 1.6 * u, '#c89058');
  });
  ctx.drawImage(sprite, Math.round(x), Math.round(y));
}

export function drawFireFlower(ctx, x, y, w, h) {
  const sprite = getSprite('fireflower', Math.ceil(w), Math.ceil(h), (c, cw, ch) => {
    const u = cw / 16;
    block(c, 7 * u, 8 * u, 2.4 * u, 8 * u, '#2ea043');
    block(c, 5 * u, 12 * u, 3 * u, 2.2 * u, '#2ea043');
    soft(c, 2.6 * u, 1.6 * u, 10.8 * u, 8.4 * u, '#921712', 2.4);
    soft(c, 3 * u, 2 * u, 10 * u, 7.6 * u, '#e8402c', 2);
    soft(c, 5 * u, 4 * u, 6 * u, 4 * u, '#ffd84a', 1.6);
    block(c, 6.6 * u, 5.4 * u, 2.8 * u, 1.6 * u, '#ff8c1a');
  });
  ctx.drawImage(sprite, Math.round(x), Math.round(y));
}

function paintFeatherShape(ctx, cx, topY, len, width, color, colorLight, colorDark) {
  ctx.save();
  ctx.translate(cx, topY);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(width, len * 0.2, width * 0.55, len * 0.75);
  ctx.quadraticCurveTo(width * 0.3, len * 0.95, 0, len);
  ctx.quadraticCurveTo(-width * 0.3, len * 0.95, -width * 0.55, len * 0.75);
  ctx.quadraticCurveTo(-width, len * 0.2, 0, 0);
  ctx.fill();
  ctx.fillStyle = colorLight;
  ctx.beginPath();
  ctx.moveTo(0, len * 0.05);
  ctx.quadraticCurveTo(width * 0.3, len * 0.25, width * 0.15, len * 0.7);
  ctx.quadraticCurveTo(0, len * 0.85, 0, len * 0.05);
  ctx.fill();
  ctx.strokeStyle = colorDark;
  ctx.lineWidth = Math.max(1, width * 0.08);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, len);
  ctx.stroke();
  for (let i = 1; i < 5; i++) {
    const t = i / 5;
    ctx.beginPath();
    ctx.moveTo(0, len * t);
    ctx.lineTo(-width * 0.7 * (1 - t * 0.5), len * (t + 0.08));
    ctx.moveTo(0, len * t);
    ctx.lineTo(width * 0.7 * (1 - t * 0.5), len * (t + 0.08));
    ctx.stroke();
  }
  ctx.restore();
}

export function drawCapeFeather(ctx, x, y, w, h) {
  const sprite = getSprite('capefeather', Math.ceil(w), Math.ceil(h), (c, cw, ch) => {
    c.save();
    c.translate(cw * 0.5, ch * 0.04);
    c.rotate(-0.22);
    paintFeatherShape(c, 0, 0, ch * 0.86, cw * 0.36, '#f2d020', '#ffef9c', '#c8a412');
    c.restore();
    block(c, cw * 0.42, ch * 0.84, cw * 0.12, ch * 0.14, '#c89058');
  });
  ctx.drawImage(sprite, Math.round(x), Math.round(y));
}

export function drawStar(ctx, x, y, w, h, frame) {
  const cx = x + w / 2, cy = y + h / 2;
  const spikes = 5, outer = w / 2 - 1, inner = w / 4.4;
  const rot = (frame % 8) * (Math.PI / 8);
  ctx.fillStyle = '#c89412';
  starPath(ctx, cx, cy, spikes, outer, inner, rot);
  ctx.fill();
  ctx.fillStyle = '#ffd84a';
  starPath(ctx, cx - w * 0.03, cy - w * 0.03, spikes, outer * 0.86, inner * 0.86, rot);
  ctx.fill();
  eye(ctx, cx - w * 0.14, cy - h * 0.04, w * 0.09);
  eye(ctx, cx + w * 0.05, cy - h * 0.04, w * 0.09);
}

function starPath(ctx, cx, cy, spikes, outer, inner, rot) {
  ctx.beginPath();
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = rot + (i * Math.PI) / spikes - Math.PI / 2;
    const px = cx + Math.cos(a) * r, py = cy + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

export function drawParticlePoof(ctx, x, y, size, life) {
  ctx.globalAlpha = Math.max(0, life);
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(x, y, size * (1 - life * 0.4), 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}

export function drawBrickFragment(ctx, x, y, size, rot) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  block(ctx, -size / 2, -size / 2, size, size, '#a8542c');
  block(ctx, -size / 2, -size / 2, size, size * 0.3, '#c46a3a');
  ctx.restore();
}

export function drawFlagpole(ctx, x, y, h) {
  block(ctx, x, y, 4, h, '#c8c8c8');
  ctx.fillStyle = '#7a7a7a';
  ctx.beginPath();
  ctx.arc(x + 2, y, 5, 0, Math.PI * 2);
  ctx.fill();
}

export function drawFlag(ctx, x, y, w, h, color = '#2ea043') {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w, y + h / 2);
  ctx.lineTo(x, y + h);
  ctx.closePath();
  ctx.fill();
}
