import { Item } from './Item.js';
import { drawStar } from '../../render/Sprites.js';

export class Star extends Item {
  constructor(tileX, tileY) {
    super(tileX, tileY, 'star', 'bounce');
    this.spinFrame = 0;
    this.spinTimer = 0;
  }

  update(dt, level) {
    super.update(dt, level);
    this.spinTimer += dt;
    if (this.spinTimer > 0.05) { this.spinFrame++; this.spinTimer = 0; }
  }

  draw(ctx, camera) {
    drawStar(ctx, this.x - camera.x, this.y - camera.y, this.w, this.h, this.spinFrame);
  }
}
