import { VIEW_W, VIEW_H } from './Constants.js';

export class Camera {
  constructor(levelWidthPx, levelHeightPx) {
    this.x = 0;
    this.y = 0;
    this.levelWidthPx = levelWidthPx;
    this.levelHeightPx = levelHeightPx;
    this.maxX = 0;
  }

  follow(target) {
    const desiredX = target.x + target.w / 2 - VIEW_W / 2;
    const desiredY = target.y + target.h / 2 - VIEW_H / 2 + 40;
    this.x += (desiredX - this.x) * 0.14;
    this.y += (desiredY - this.y) * 0.1;

    const maxX = Math.max(0, this.levelWidthPx - VIEW_W);
    const maxY = Math.max(0, this.levelHeightPx - VIEW_H);
    this.x = Math.max(0, Math.min(this.x, maxX));
    this.y = Math.max(0, Math.min(this.y, maxY));
    if (this.x > this.maxX) this.maxX = this.x;
  }

  snap(target) {
    this.x = Math.max(0, Math.min(target.x + target.w / 2 - VIEW_W / 2, Math.max(0, this.levelWidthPx - VIEW_W)));
    this.y = Math.max(0, Math.min(target.y + target.h / 2 - VIEW_H / 2, Math.max(0, this.levelHeightPx - VIEW_H)));
    this.maxX = this.x;
  }
}
