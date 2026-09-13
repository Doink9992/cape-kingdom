import { Entity } from '../Entity.js';
import { drawPiranha } from '../../render/Sprites.js';
import { TILE } from '../../engine/Constants.js';

export class Piranha extends Entity {
  // (tileX, tileY) marks the cell directly above the pipe opening — the
  // plant's fully-emerged resting position. It retracts downward by one
  // tile to hide when a player stands close by.
  constructor(tileX, tileY) {
    super(tileX * TILE + 3, tileY * TILE, 26, TILE);
    this.upY = this.y;
    this.downY = this.y + TILE;
    this.phase = Math.random() * Math.PI * 2;
    this.state = 'down'; // down, rising, up, falling
    this.timer = 1 + Math.random();
    this.stompable = false;
    this.kind = 'piranha';
    this.score = 200;
    this.dead = false;
  }

  kill() {
    this.dead = true;
    this.remove = true;
  }

  update(dt, level, player) {
    if (this.dead) return;
    const nearby = player && !player.dead && Math.abs(player.centerX - this.centerX) < 50 && player.bottom < this.downY + 20;
    this.timer -= dt;

    if (this.state === 'down') {
      this.y = this.downY;
      if (this.timer <= 0 && !nearby) { this.state = 'rising'; this.timer = 0.6; }
    } else if (this.state === 'rising') {
      this.y = Math.max(this.upY, this.y - 60 * dt);
      if (this.y <= this.upY) { this.y = this.upY; this.state = 'up'; this.timer = 1.2; }
      if (nearby) { this.state = 'falling'; }
    } else if (this.state === 'up') {
      this.y = this.upY;
      if (this.timer <= 0 || nearby) { this.state = 'falling'; this.timer = 0.6; }
    } else if (this.state === 'falling') {
      this.y = Math.min(this.downY, this.y + 60 * dt);
      if (this.y >= this.downY) { this.y = this.downY; this.state = 'down'; this.timer = 1 + Math.random(); }
    }

    this.frameTimer += dt;
    if (this.frameTimer > 0.3) { this.frame = (this.frame + 1) % 2; this.frameTimer = 0; }
  }

  draw(ctx, camera) {
    if (this.dead) return;
    drawPiranha(ctx, this.x - camera.x, this.y - camera.y, this.w, this.h, { frame: this.frame });
  }
}
