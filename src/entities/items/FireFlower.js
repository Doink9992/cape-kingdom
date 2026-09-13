import { Item } from './Item.js';
import { drawFireFlower } from '../../render/Sprites.js';

export class FireFlower extends Item {
  constructor(tileX, tileY) {
    super(tileX, tileY, 'fire', 'static');
  }

  draw(ctx, camera) {
    drawFireFlower(ctx, this.x - camera.x, this.y - camera.y + this.bobOffset(), this.w, this.h);
  }
}
