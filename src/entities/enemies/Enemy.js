import { Entity } from '../Entity.js';
import { moveAndCollide, isOnGroundBelow } from '../../level/Collision.js';
import { GRAVITY, FALL_GRAVITY, MAX_FALL_SPEED } from '../../engine/Constants.js';

export class Enemy extends Entity {
  constructor(x, y, w, h, opts = {}) {
    super(x, y, w, h);
    this.speed = opts.speed ?? 1.0;
    this.turnAtLedge = opts.turnAtLedge ?? false;
    this.facing = opts.facing ?? -1;
    this.vx = this.speed * this.facing;
    this.dead = false;
    this.squashed = false;
    this.removeTimer = 0;
    this.stompable = opts.stompable ?? true;
    this.score = opts.score ?? 100;
    this.kind = opts.kind || 'enemy';
    this.awake = false;
  }

  kill(game, opts = {}) {
    if (this.dead) return;
    this.dead = true;
    this.squashed = true;
    this.vx = 0;
    if (!opts.silent) this.removeTimer = 0.4;
    else this.remove = true;
  }

  bounceKill(game) {
    this.dead = true;
    this.squashed = false;
    this.vy = -6;
    this.vx = 0;
    this.spinDeath = true;
    this.removeTimer = 1.2;
  }

  update(dt, level) {
    if (this.dead) {
      if (this.spinDeath) {
        this.vy += GRAVITY;
        this.y += this.vy;
        this.x += this.vx;
      }
      this.removeTimer -= dt;
      if (this.removeTimer <= 0) this.remove = true;
      return;
    }

    if (!this.awake) {
      this.awake = true;
    }

    this.vy += this.vy < 0 ? GRAVITY : FALL_GRAVITY;
    if (this.vy > MAX_FALL_SPEED) this.vy = MAX_FALL_SPEED;

    if (this.turnAtLedge && this.onGround) {
      const aheadX = this.facing > 0 ? this.x + this.w + 2 : this.x - 2;
      const probe = { x: aheadX, y: this.y, w: 1, h: this.h };
      if (!isOnGroundBelow(level, probe)) {
        this.facing *= -1;
        this.vx = this.speed * this.facing;
      }
    }

    this.vx = this.speed * this.facing;
    this.onGround = false;
    moveAndCollide(level, this, this.vx, 0);
    const hitY = moveAndCollide(level, this, 0, this.vy);
    if (hitY.hitLeft === undefined) {}

    if (this.y > level.heightPx() + 200) this.remove = true;

    this.frameTimer += dt;
    if (this.frameTimer > 0.22) {
      this.frame = (this.frame + 1) % 2;
      this.frameTimer = 0;
    }
  }

  onHitWall(dir) {
    this.facing = -dir;
    this.vx = this.speed * this.facing;
  }
}
