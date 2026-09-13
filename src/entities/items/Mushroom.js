import { Item } from './Item.js';
import { drawMushroom } from '../../render/Sprites.js';

export class Mushroom extends Item {
  constructor(tileX, tileY, oneUp = false) {
    super(tileX, tileY, oneUp ? '1up' : 'mushroom', 'walk');
  }

  draw(ctx, camera) {
    drawMushroom(ctx, this.x - camera.x, this.y - camera.y + this.bobOffset(), this.w, this.h, this.kind === '1up' ? 'life' : 'power');
  }
}
