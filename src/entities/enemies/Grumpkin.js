import { Enemy } from './Enemy.js';
import { drawGrumpkin } from '../../render/Sprites.js';
import { TILE } from '../../engine/Constants.js';

export class Grumpkin extends Enemy {
  constructor(tileX, tileY) {
    const w = 26, h = 24;
    const px = tileX * TILE + (TILE - w) / 2;
    const py = (tileY + 1) * TILE - h;
    super(px, py, w, h, { speed: 0.9, turnAtLedge: false, kind: 'grumpkin', score: 100 });
  }

  draw(ctx, camera) {
    drawGrumpkin(ctx, this.x - camera.x, this.y - camera.y, this.w, this.h, {
      squashed: this.squashed,
      frame: this.frame,
    });
  }
}
