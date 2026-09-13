import { Entity } from '../Entity.js';
import { moveAndCollide, isOnGroundBelow } from '../../level/Collision.js';
import { GRAVITY, FALL_GRAVITY, MAX_FALL_SPEED, TILE } from '../../engine/Constants.js';

// Base class for collectible power-ups that pop out of a bumped block:
// 'static'  - fire flower / cape feather: rises then sits idle with a bob
// 'walk'    - mushroom / 1-up: walks off in a direction, falls off ledges, bounces off walls
// 'bounce'  - star: hops continuously, bounces off walls
export class Item extends Entity {
  constructor(tileX, tileY, kind, behavior) {
    const w = 26, h = 26;
    const px = tileX * TILE + (TILE - w) / 2;
    const py = tileY * TILE;
    super(px, py, w, h);
    this.kind = kind;
    this.behavior = behavior;
    this.popupTarget = py - TILE;
    this.popup = true;
    this.facing = 1;
    this.vx = behavior === 'walk' ? 1.4 : behavior === 'bounce' ? 2.2 : 0;
    this.bobPhase = 0;
    this.collected = false;
  }

  update(dt, level) {
    if (this.collected) return;

    if (this.popup) {
      this.y -= 40 * dt;
      if (this.y <= this.popupTarget) {
        this.y = this.popupTarget;
        this.popup = false;
      }
      return;
    }

    if (this.behavior === 'static') {
      this.bobPhase += dt * 4;
      return;
    }

    this.vy += this.vy < 0 ? GRAVITY : FALL_GRAVITY;
    if (this.vy > MAX_FALL_SPEED) this.vy = MAX_FALL_SPEED;

    if (this.behavior === 'bounce' && this.onGround) {
      this.vy = -8;
    }

    if (this.behavior === 'walk' && this.onGround) {
      const aheadX = this.facing > 0 ? this.x + this.w + 2 : this.x - 2;
      if (!isOnGroundBelow(level, { x: aheadX, y: this.y, w: 1, h: this.h })) {
        // fall off the ledge naturally (no ledge-avoidance for items)
      }
    }

    this.onGround = false;
    moveAndCollide(level, this, this.vx * this.facing, 0);
    moveAndCollide(level, this, 0, this.vy);

    if (this.y > level.heightPx() + 200) this.remove = true;
  }

  onHitWall(dir) {
    this.facing = -dir;
  }

  bobOffset() {
    return this.behavior === 'static' ? Math.sin(this.bobPhase) * 3 : 0;
  }
}
