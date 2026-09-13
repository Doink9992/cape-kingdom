import { Entity } from './Entity.js';
import { drawParticlePoof, drawBrickFragment } from '../render/Sprites.js';

export class Poof extends Entity {
  constructor(x, y) {
    super(x, y, 24, 24);
    this.life = 1;
  }

  update(dt) {
    this.life -= dt * 3;
    if (this.life <= 0) this.remove = true;
  }

  draw(ctx, camera) {
    drawParticlePoof(ctx, this.x - camera.x, this.y - camera.y, 14, this.life);
  }
}

export class BrickFragment extends Entity {
  constructor(x, y, vx, vy) {
    super(x, y, 10, 10);
    this.vx = vx;
    this.vy = vy;
    this.rot = 0;
    this.rotSpeed = (Math.random() - 0.5) * 10;
    this.life = 1.2;
  }

  update(dt) {
    this.vy += 0.5;
    this.x += this.vx;
    this.y += this.vy;
    this.rot += this.rotSpeed * dt;
    this.life -= dt;
    if (this.life <= 0) this.remove = true;
  }

  draw(ctx, camera) {
    drawBrickFragment(ctx, this.x - camera.x, this.y - camera.y, 10, this.rot);
  }
}

export class ScorePopup extends Entity {
  constructor(x, y, text) {
    super(x, y, 10, 10);
    this.text = text;
    this.life = 0.8;
  }

  update(dt) {
    this.y -= 30 * dt;
    this.life -= dt;
    if (this.life <= 0) this.remove = true;
  }

  draw(ctx, camera) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, this.life * 2));
    ctx.fillStyle = '#fff8d0';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    const dx = this.x - camera.x, dy = this.y - camera.y;
    ctx.strokeText(this.text, dx, dy);
    ctx.fillText(this.text, dx, dy);
    ctx.restore();
  }
}
