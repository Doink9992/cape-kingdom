import { Item } from './Item.js';
import { drawCapeFeather } from '../../render/Sprites.js';

export class CapeFeather extends Item {
  constructor(tileX, tileY) {
    super(tileX, tileY, 'cape', 'static');
  }

  draw(ctx, camera) {
    drawCapeFeather(ctx, this.x - camera.x, this.y - camera.y + this.bobOffset(), this.w, this.h);
  }
}
