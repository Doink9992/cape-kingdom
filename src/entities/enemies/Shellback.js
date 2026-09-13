import { Entity } from '../Entity.js';
import { moveAndCollide, isOnGroundBelow } from '../../level/Collision.js';
import { GRAVITY, FALL_GRAVITY, MAX_FALL_SPEED, TILE } from '../../engine/Constants.js';
import { Sound } from '../../engine/Sound.js';
import { drawShellback } from '../../render/Sprites.js';
import { TILE_TYPES } from '../../render/Tileset.js';

const COLORS = {
  green: { color: '#2ea043', colorShade: '#1c6b2c' },
  red: { color: '#c8262a', colorShade: '#8c1418' },
};

export class Shellback extends Entity {
  constructor(tileX, tileY, opts = {}) {
    const w = 26, h = 26;
    const px = tileX * TILE + (TILE - w) / 2;
    const py = (tileY + 1) * TILE - h;
    super(px, py, w, h);
    this.color = opts.color || 'green';
    this.winged = !!opts.winged;
    this.speed = 0.85;
    this.facing = -1;
    this.vx = this.speed * this.facing;
    this.inShell = false;
    this.shellMoving = false;
    this.dead = false;
    this.removeTimer = 0;
    this.hopTimer = 1.2 + Math.random();
    this.kind = 'shellback';
    this.score = 200;
    this.stompable = true;
  }

  stompedByPlayer() {
    if (this.winged) {
      this.winged = false;
      this.vy = -4;
      Sound.stomp();
      return;
    }
    if (!this.inShell) {
      this.inShell = true;
      this.shellMoving = false;
      this.vx = 0;
      const bottom = this.y + this.h;
      this.h = 20;
      this.y = bottom - this.h;
      Sound.stomp();
      return;
    }
    if (this.shellMoving) {
      this.shellMoving = false;
      this.vx = 0;
      Sound.stomp();
      return;
    }
    Sound.stomp();
  }

  kickBy(playerCenterX) {
    if (!this.inShell) return;
    this.shellMoving = true;
    this.facing = this.centerX < playerCenterX ? -1 : 1;
    this.vx = this.facing * 6.2;
    Sound.kick();
  }

  kill() {
    if (this.dead) return;
    this.dead = true;
    this.vx = 0;
    this.vy = -5;
    this.removeTimer = 0.9;
  }

  update(dt, level) {
    if (this.dead) {
      this.vy += GRAVITY;
      this.y += this.vy;
      this.removeTimer -= dt;
      if (this.removeTimer <= 0) this.remove = true;
      return;
    }

    this.vy += this.vy < 0 ? GRAVITY : FALL_GRAVITY;
    if (this.vy > MAX_FALL_SPEED) this.vy = MAX_FALL_SPEED;

    if (this.winged && this.onGround) {
      this.hopTimer -= dt;
      if (this.hopTimer <= 0) {
        this.vy = -7.5;
        this.hopTimer = 1.1 + Math.random() * 0.6;
      }
    }

    const turnAtLedge = this.color === 'red' && !this.winged && !this.inShell;
    if (turnAtLedge && this.onGround) {
      const aheadX = this.facing > 0 ? this.x + this.w + 2 : this.x - 2;
      if (!isOnGroundBelow(level, { x: aheadX, y: this.y, w: 1, h: this.h })) {
        this.facing *= -1;
      }
    }

    if (this.inShell && !this.shellMoving) {
      this.vx = 0;
    } else {
      this.vx = this.speed * (this.inShell ? Math.sign(this.vx || this.facing) * 6.2 : this.facing);
    }

    this.onGround = false;
    moveAndCollide(level, this, this.vx, 0);
    moveAndCollide(level, this, 0, this.vy);

    if (this.y > level.heightPx() + 200) this.remove = true;

    this.frameTimer += dt;
    if (this.frameTimer > (this.shellMoving ? 0.06 : 0.25)) {
      this.frame = (this.frame + 1) % 2;
      this.frameTimer = 0;
    }
  }

  onHitWall(dir, hits) {
    if (this.inShell && this.shellMoving && this.game) {
      let broke = false;
      for (const h of hits) {
        if (this.game.level.getTile(h.tx, h.ty) === TILE_TYPES.BRICK) {
          this.game.breakBrick(h.tx, h.ty, this.vx);
          broke = true;
        }
      }
      if (broke) { this.vx = this.facing * 6.2; return; }
    }
    this.facing = -dir;
    if (this.inShell && this.shellMoving) this.vx = this.facing * 6.2;
  }

  draw(ctx, camera) {
    const c = COLORS[this.color];
    drawShellback(ctx, this.x - camera.x, this.y - camera.y, this.w, this.h, {
      inShell: this.inShell,
      winged: this.winged,
      frame: this.frame,
      spinFrame: this.frame,
      color: c.color,
      colorShade: c.colorShade,
    });
  }
}
