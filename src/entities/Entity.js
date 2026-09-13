let nextId = 1;

export class Entity {
  constructor(x, y, w, h) {
    this.id = nextId++;
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.vx = 0;
    this.vy = 0;
    this.onGround = false;
    this.facing = 1;
    this.remove = false;
    this.frame = 0;
    this.frameTimer = 0;
  }

  get left() { return this.x; }
  get right() { return this.x + this.w; }
  get top() { return this.y; }
  get bottom() { return this.y + this.h; }
  get centerX() { return this.x + this.w / 2; }
  get centerY() { return this.y + this.h / 2; }

  isOnScreen(camera, margin = 200) {
    return this.x + this.w > camera.x - margin && this.x < camera.x + 512 + margin;
  }
}
