import { Enemy } from './Enemy.js';
import { drawSpiky } from '../../render/Sprites.js';
import { TILE } from '../../engine/Constants.js';

export class Spiky extends Enemy {
  constructor(tileX, tileY) {
    const w = 26, h = 26;
    const px = tileX * TILE + (TILE - w) / 2;
    const py = (tileY + 1) * TILE - h;
    super(px, py, w, h, { speed: 0.7, turnAtLedge: true, kind: 'spiky', score: 200 });
    this.stompable = false; // only spin-jump or fireball can defeat it
  }

  draw(ctx, camera) {
    drawSpiky(ctx, this.x - camera.x, this.y - camera.y, this.w, this.h, { frame: this.frame });
  }
}
