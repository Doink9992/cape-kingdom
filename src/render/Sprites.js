// Original, procedurally-drawn "pixel art" for every character/object in the
// game. Everything is rendered with blocky fillRect/arc calls at a fixed
// pixel grid so it reads as retro sprite art without using any external
// image assets.

function block(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

const PAL = {
  hero: {
    cap: '#e8720c', capShade: '#b85608',
    skin: '#ffd0a0', skinShade: '#e0a878',
    shirt: '#e8720c', shirtShade: '#b85608',
    overalls: '#177a6c', overallsShade: '#0e5346',
    boots: '#5a3418', eye: '#1a1a1a', buckle: '#ffd84a',
  },
  heroFire: {
    cap: '#f2f2f2', capShade: '#c8c8c8',
    skin: '#ffd0a0', skinShade: '#e0a878',
    shirt: '#f2f2f2', shirtShade: '#c8c8c8',
    overalls: '#c81e1e', overallsShade: '#8c1414',
    boots: '#5a3418', eye: '#1a1a1a', buckle: '#ffd84a',
  },
  heroCape: {
    cap: '#f2d020', capShade: '#c8a412',
    skin: '#ffd0a0', skinShade: '#e0a878',
    shirt: '#f2d020', shirtShade: '#c8a412',
    overalls: '#177a6c', overallsShade: '#0e5346',
    boots: '#5a3418', eye: '#1a1a1a', buckle: '#ffd84a',
    cape: '#ffe14a', capeShade: '#e0b810',
  },
};

export function drawPlayer(ctx, x, y, w, h, s) {
  const big = h > 40;
  const facing = s.facing || 1;
  const pal = s.fire ? PAL.heroFire : (s.cape ? PAL.heroCape : PAL.hero);
  const walkBob = s.frame === 1 ? 1 : (s.frame === 2 ? -1 : 0);
  const crouch = s.crouch && big;
  const bodyH = crouch ? h * 0.62 : h;
  const top = y + (h - bodyH);

  ctx.save();
  if (s.starFlicker && Math.floor(s.time / 3) % 2 === 0) ctx.globalAlpha = 0.55;

  // Cape (drawn behind, billowing opposite of facing direction)
  if (s.cape && !crouch) {
    const flap = s.capeOpen ? 1 : (s.frame % 2 === 0 ? 0.5 : 0.8);
    ctx.save();
    ctx.translate(x + w / 2 - facing * w * 0.32, top + bodyH * 0.42);
    ctx.rotate(facing * -0.15 * flap);
    block(ctx, -w * 0.34, -h * 0.1, w * 0.42, h * 0.55, pal.cape);
    block(ctx, -w * 0.34, h * 0.32, w * 0.42, h * 0.1, pal.capeShade);
    ctx.restore();
  }

  const scaleUnit = w / 16;
  const cx = x + w / 2;

  if (!big) {
    // Small character: single 16x16-ish block figure
    const legOffset = s.crouch ? 0 : walkBob * scaleUnit;
    block(ctx, cx - 5 * scaleUnit, top + 1 * scaleUnit, 10 * scaleUnit, 3 * scaleUnit, pal.cap);
    block(ctx, cx - 6 * scaleUnit + (facing > 0 ? 2 * scaleUnit : 0), top + 2 * scaleUnit, 4 * scaleUnit, 2 * scaleUnit, pal.capShade);
    block(ctx, cx - 4 * scaleUnit, top + 4 * scaleUnit, 8 * scaleUnit, 4 * scaleUnit, pal.skin);
    block(ctx, cx - 4 * scaleUnit, top + 8 * scaleUnit, 8 * scaleUnit, 5 * scaleUnit, pal.overalls);
    block(ctx, cx - 4 * scaleUnit, top + 13 * scaleUnit - Math.abs(legOffset), 3.5 * scaleUnit, 3 * scaleUnit + Math.abs(legOffset), pal.boots);
    block(ctx, cx + 0.5 * scaleUnit, top + 13 * scaleUnit - Math.abs(legOffset === 0 ? 0 : -legOffset), 3.5 * scaleUnit, 3 * scaleUnit + Math.abs(legOffset), pal.boots);
    block(ctx, cx + (facing > 0 ? 3 : -6) * scaleUnit, top + 5.5 * scaleUnit, 2.5 * scaleUnit, 1.5 * scaleUnit, pal.eye);
  } else {
    const legLift = s.jumping || s.spinning ? scaleUnit * 2 : Math.abs(walkBob) * scaleUnit;
    // Cap
    block(ctx, cx - 6 * scaleUnit, top + 0, 12 * scaleUnit, 3 * scaleUnit, pal.cap);
    block(ctx, cx + (facing > 0 ? 3 : -8) * scaleUnit, top + 1 * scaleUnit, 5 * scaleUnit, 2 * scaleUnit, pal.capShade);
    block(ctx, cx - 5 * scaleUnit, top + 3 * scaleUnit, 10 * scaleUnit, 2 * scaleUnit, pal.cap);
    // Face
    block(ctx, cx - 5 * scaleUnit, top + 5 * scaleUnit, 10 * scaleUnit, 6 * scaleUnit, pal.skin);
    block(ctx, cx + (facing > 0 ? 1 : -6) * scaleUnit, top + 8 * scaleUnit, 5 * scaleUnit, 2 * scaleUnit, pal.skinShade);
    block(ctx, cx + (facing > 0 ? 2 : -4) * scaleUnit, top + 7 * scaleUnit, 2.5 * scaleUnit, 2 * scaleUnit, pal.eye);
    // Body / shirt+overalls
    if (!crouch) {
      block(ctx, cx - 6 * scaleUnit, top + 11 * scaleUnit, 12 * scaleUnit, 4 * scaleUnit, pal.shirt);
      block(ctx, cx - 6 * scaleUnit, top + 15 * scaleUnit, 12 * scaleUnit, 8 * scaleUnit, pal.overalls);
      block(ctx, cx - 2 * scaleUnit, top + 16 * scaleUnit, 4 * scaleUnit, 2 * scaleUnit, pal.buckle);
      // Arms
      const armSwing = s.spinning ? (s.frame % 2 === 0 ? 3 : -3) : walkBob;
      block(ctx, cx - 9 * scaleUnit, top + 11 * scaleUnit + armSwing * scaleUnit, 3 * scaleUnit, 6 * scaleUnit, pal.shirt);
      block(ctx, cx + 6 * scaleUnit, top + 11 * scaleUnit - armSwing * scaleUnit, 3 * scaleUnit, 6 * scaleUnit, pal.shirt);
      // Legs
      block(ctx, cx - 5 * scaleUnit, top + 23 * scaleUnit, 4.5 * scaleUnit, 6 * scaleUnit - legLift, pal.overallsShade);
      block(ctx, cx + 0.5 * scaleUnit, top + 23 * scaleUnit, 4.5 * scaleUnit, 6 * scaleUnit - legLift, pal.overallsShade);
      block(ctx, cx - 5 * scaleUnit, top + 27 * scaleUnit - legLift, 4.5 * scaleUnit, 2 * scaleUnit, pal.boots);
      block(ctx, cx + 0.5 * scaleUnit, top + 27 * scaleUnit - legLift, 4.5 * scaleUnit, 2 * scaleUnit, pal.boots);
    } else {
      block(ctx, cx - 7 * scaleUnit, top + 11 * scaleUnit, 14 * scaleUnit, 9 * scaleUnit, pal.overalls);
      block(ctx, cx - 7 * scaleUnit, top + 19 * scaleUnit, 14 * scaleUnit, 4 * scaleUnit, pal.boots);
    }
  }
  ctx.restore();
}

export function drawFireball(ctx, x, y, size, frame) {
  const colors = ['#ff8c1a', '#ffcf3a'];
  ctx.fillStyle = colors[frame % 2];
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff2c8';
  ctx.beginPath();
  ctx.arc(x + size / 2 - size * 0.15, y + size / 2 - size * 0.15, size * 0.18, 0, Math.PI * 2);
  ctx.fill();
}

export function drawGrumpkin(ctx, x, y, w, h, s) {
  const u = w / 16;
  const squish = s.squashed ? 0.35 : 1;
  const top = y + h * (1 - squish);
  const bh = h * squish;
  block(ctx, x + 1 * u, top + bh * 0.15, w - 2 * u, bh * 0.65, '#8a5a2c');
  block(ctx, x + 1 * u, top + bh * 0.7, w - 2 * u, bh * 0.3, '#6b431f');
  if (!s.squashed) {
    const eyeY = top + bh * 0.35;
    block(ctx, x + 3.5 * u, eyeY, 2.5 * u, 2.5 * u, '#fff');
    block(ctx, x + 10 * u, eyeY, 2.5 * u, 2.5 * u, '#fff');
    block(ctx, x + 4.2 * u, eyeY + 0.6 * u, 1.2 * u, 1.5 * u, '#1a1a1a');
    block(ctx, x + 10.7 * u, eyeY + 0.6 * u, 1.2 * u, 1.5 * u, '#1a1a1a');
    const footOffset = s.frame === 1 ? 1 * u : 0;
    block(ctx, x + 1 * u, y + h - 2 * u, 5 * u, 2 * u + footOffset, '#3a2410');
    block(ctx, x + w - 6 * u, y + h - 2 * u, 5 * u, 2 * u + (footOffset ? 0 : 1 * u), '#3a2410');
  }
}

export function drawShellback(ctx, x, y, w, h, s) {
  const u = w / 16;
  if (s.inShell) {
    const spin = s.spinFrame || 0;
    ctx.save();
    ctx.translate(x + w / 2, y + h / 2);
    ctx.rotate(spin * 0.6);
    ctx.translate(-w / 2, -h / 2);
    block(ctx, 1 * u, 3 * u, w - 2 * u, h - 6 * u, s.color || '#2ea043');
    block(ctx, 2 * u, 5 * u, w - 4 * u, h - 10 * u, s.colorShade || '#1c6b2c');
    block(ctx, 4 * u, 1 * u, w - 8 * u, 3 * u, '#e8e0b8');
    ctx.restore();
    return;
  }
  const bob = s.frame === 1 ? 1 * u : 0;
  block(ctx, x + 2 * u, y + 2 * u, w - 4 * u, 4 * u, '#ffd0a0');
  block(ctx, x + 4 * u, y + 3 * u, 1.2 * u, 1.5 * u, '#1a1a1a');
  block(ctx, x + 9 * u, y + 3 * u, 1.2 * u, 1.5 * u, '#1a1a1a');
  block(ctx, x + 1 * u, y + 6 * u, w - 2 * u, h - 10 * u, s.color || '#2ea043');
  block(ctx, x + 2.5 * u, y + 7.5 * u, w - 5 * u, h - 13 * u, s.colorShade || '#1c6b2c');
  block(ctx, x + 1 * u, y + h - 4 * u - bob, 4 * u, 4 * u, '#ffd0a0');
  block(ctx, x + w - 5 * u, y + h - 4 * u - (bob ? 0 : 1 * u), 4 * u, 4 * u, '#ffd0a0');
  if (s.winged) {
    const flap = s.frame % 2 === 0 ? -2 * u : 2 * u;
    block(ctx, x - 2 * u, y + 5 * u + flap, 5 * u, 3 * u, '#f2f2f2');
    block(ctx, x + w - 3 * u, y + 5 * u - flap, 5 * u, 3 * u, '#f2f2f2');
  }
}

export function drawSpiky(ctx, x, y, w, h, s) {
  const u = w / 16;
  block(ctx, x + 1 * u, y + 4 * u, w - 2 * u, h - 6 * u, '#c81e3a');
  const spikes = 5;
  for (let i = 0; i < spikes; i++) {
    const sx = x + (i + 0.5) * (w / spikes);
    ctx.fillStyle = '#8c1024';
    ctx.beginPath();
    ctx.moveTo(sx - 2 * u, y + 5 * u);
    ctx.lineTo(sx, y);
    ctx.lineTo(sx + 2 * u, y + 5 * u);
    ctx.fill();
  }
  block(ctx, x + 3.5 * u, y + 7 * u, 2 * u, 2 * u, '#fff');
  block(ctx, x + 9 * u, y + 7 * u, 2 * u, 2 * u, '#fff');
  block(ctx, x + 4.2 * u, y + 7.6 * u, 1 * u, 1 * u, '#000');
  block(ctx, x + 9.7 * u, y + 7.6 * u, 1 * u, 1 * u, '#000');
  const bob = s.frame === 1 ? 1 * u : 0;
  block(ctx, x + 1 * u, y + h - 3 * u - bob, 4 * u, 3 * u, '#3a2410');
  block(ctx, x + w - 5 * u, y + h - 3 * u - (bob ? 0 : 1 * u), 4 * u, 3 * u, '#3a2410');
}

export function drawPiranha(ctx, x, y, w, h, s) {
  const u = w / 16;
  const open = s.frame % 2 === 0;
  block(ctx, x + 4 * u, y + h - 4 * u, 2 * u, 4 * u, '#1c6b2c');
  block(ctx, x + 1 * u, y + 2 * u, w - 2 * u, h - 6 * u, '#c81e3a');
  block(ctx, x + 1 * u, y + (open ? 6 * u : 8 * u), w - 2 * u, open ? 4 * u : 2 * u, '#7a0f1f');
  for (let i = 0; i < 4; i++) {
    block(ctx, x + 2 * u + i * 3 * u, y + 3 * u, 1.5 * u, 1.5 * u, '#fff');
  }
  block(ctx, x + 3 * u, y, w - 6 * u, 3 * u, '#8fe870');
  block(ctx, x + 2 * u, y - 1 * u, 3 * u, 2 * u, '#8fe870');
  block(ctx, x + w - 5 * u, y - 1 * u, 3 * u, 2 * u, '#8fe870');
}

export function drawCoin(ctx, x, y, w, h, frame) {
  const u = w / 16;
  const widths = [8, 5, 2, 5];
  const cw = widths[frame % 4] * u;
  block(ctx, x + (w - cw) / 2, y + 1 * u, cw, h - 2 * u, '#ffd84a');
  block(ctx, x + (w - cw) / 2 + cw * 0.2, y + 2 * u, Math.max(1, cw * 0.3), h - 4 * u, '#fff2b0');
}

export function drawMushroom(ctx, x, y, w, h, variant = 'life') {
  const u = w / 16;
  const capColor = variant === 'life' ? '#2ea043' : '#c81e3a';
  block(ctx, x + 2 * u, y, w - 4 * u, 8 * u, capColor);
  block(ctx, x, y + 4 * u, w, 5 * u, capColor);
  block(ctx, x + 2 * u, y + 2 * u, 3 * u, 3 * u, '#fff');
  block(ctx, x + 11 * u, y + 2 * u, 3 * u, 3 * u, '#fff');
  block(ctx, x + 6.5 * u, y + 5 * u, 3 * u, 3 * u, '#fff');
  block(ctx, x + 3 * u, y + 9 * u, w - 6 * u, 6 * u, '#ffe0b0');
  block(ctx, x + 4 * u, y + 11 * u, 1.5 * u, 1.5 * u, '#c89058');
  block(ctx, x + 10 * u, y + 11 * u, 1.5 * u, 1.5 * u, '#c89058');
}

export function drawFireFlower(ctx, x, y, w, h) {
  const u = w / 16;
  block(ctx, x + 7 * u, y + 8 * u, 2 * u, 8 * u, '#2ea043');
  block(ctx, x + 5 * u, y + 12 * u, 3 * u, 2 * u, '#2ea043');
  const petals = ['#c81e1e', '#ffd84a'];
  block(ctx, x + 3 * u, y + 2 * u, 10 * u, 8 * u, petals[0]);
  block(ctx, x + 5 * u, y + 4 * u, 6 * u, 4 * u, petals[1]);
  block(ctx, x + 6.5 * u, y + 5.5 * u, 3 * u, 1.5 * u, '#ff8c1a');
}

export function drawCapeFeather(ctx, x, y, w, h) {
  const u = w / 16;
  block(ctx, x + 5 * u, y + 1 * u, 6 * u, 12 * u, '#f2d020');
  block(ctx, x + 3 * u, y + 3 * u, 4 * u, 8 * u, '#ffe870');
  block(ctx, x + 7 * u, y + 13 * u, 2 * u, 2 * u, '#c89058');
}

export function drawStar(ctx, x, y, w, h, frame) {
  const cx = x + w / 2, cy = y + h / 2;
  const spikes = 5, outer = w / 2, inner = w / 4.2;
  const rot = (frame % 8) * (Math.PI / 8);
  ctx.fillStyle = '#ffd84a';
  ctx.beginPath();
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = rot + (i * Math.PI) / spikes - Math.PI / 2;
    const px = cx + Math.cos(a) * r, py = cy + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ff8c1a';
  block(ctx, cx - 1.5, cy - 1, 1.5, 1.5, '#ff8c1a');
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
