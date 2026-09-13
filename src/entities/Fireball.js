import { Entity } from './Entity.js';
import { moveAndCollide } from '../level/Collision.js';
import { drawFireball } from '../render/Sprites.js';

export class Fireball extends Entity {
  constructor(x, y, facing) {
    super(x, y, 14, 14);
    this.facing = facing;
    this.vx = facing * 6;
    this.vy = 2;
    this.bounces = 0;
    this.life = 2.5;
  }

  update(dt, level) {
    this.vy += 0.5;
    if (this.vy > 8) this.vy = 8;
    this.life -= dt;
    if (this.life <= 0) { this.remove = true; return; }

    const hitsX = moveAndCollide(level, this, this.vx, 0);
    if (hitsX.hitLeft || hitsX.hitRight) { this.remove = true; return; }
    const hitsY = moveAndCollide(level, this, 0, this.vy);
    if (hitsY.hitBottom) {
      this.vy = -7;
      this.bounces++;
      if (this.bounces > 3) this.remove = true;
    }
    if (this.y > level.heightPx() + 100) this.remove = true;

    this.frameTimer += dt;
    if (this.frameTimer > 0.06) { this.frame = (this.frame + 1) % 2; this.frameTimer = 0; }
  }

  draw(ctx, camera) {
    drawFireball(ctx, this.x - camera.x, this.y - camera.y, this.w, this.frame);
  }
}
