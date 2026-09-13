import { Entity } from '../Entity.js';
import { drawCoin } from '../../render/Sprites.js';
import { TILE } from '../../engine/Constants.js';

export class Coin extends Entity {
  constructor(tileX, tileY) {
    const w = 22, h = 26;
    super(tileX * TILE + (TILE - w) / 2, tileY * TILE + (TILE - h) / 2, w, h);
    this.kind = 'coin';
    this.collected = false;
  }

  update(dt) {
    this.frameTimer += dt;
    if (this.frameTimer > 0.09) { this.frame = (this.frame + 1) % 4; this.frameTimer = 0; }
  }

  draw(ctx, camera) {
    if (this.collected) return;
    drawCoin(ctx, this.x - camera.x, this.y - camera.y, this.w, this.h, this.frame);
  }
}

// A coin that pops out of a bumped block: rises, arcs briefly, then vanishes.
export class CoinPopup extends Entity {
  constructor(x, y) {
    super(x, y, 22, 26);
    this.vy = -6;
    this.life = 0.5;
  }

  update(dt) {
    this.y += this.vy;
    this.vy += 0.35;
    this.life -= dt;
    if (this.life <= 0) this.remove = true;
    this.frameTimer += dt;
    if (this.frameTimer > 0.09) { this.frame = (this.frame + 1) % 4; this.frameTimer = 0; }
  }

  draw(ctx, camera) {
    drawCoin(ctx, this.x - camera.x, this.y - camera.y, this.w, this.h, this.frame);
  }
}
