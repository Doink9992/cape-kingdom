// Programmatic level authoring helper: build a grid of characters by
// coordinate instead of hand-aligning ASCII-art strings. Much less
// error-prone than counting columns by eye.
export class LevelBuilder {
  constructor(width, height = 14) {
    this.width = width;
    this.height = height;
    this.grid = Array.from({ length: height }, () => Array(width).fill(' '));
  }

  set(x, y, ch) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return this;
    this.grid[y][x] = ch;
    return this;
  }

  hline(x1, x2, y, ch) {
    for (let x = x1; x <= x2; x++) this.set(x, y, ch);
    return this;
  }

  vline(x, y1, y2, ch) {
    for (let y = y1; y <= y2; y++) this.set(x, y, ch);
    return this;
  }

  rect(x1, y1, x2, y2, ch) {
    for (let y = y1; y <= y2; y++) for (let x = x1; x <= x2; x++) this.set(x, y, ch);
    return this;
  }

  // Ground floor from x1..x2 down to the bottom of the level.
  ground(x1, x2, topRow = this.height - 2) {
    this.rect(x1, topRow, x2, this.height - 1, '#');
    return this;
  }

  pipe(x, topRow, height = 2, width = 2) {
    this.set(x, topRow, 'L');
    for (let i = 1; i < width; i++) this.set(x + i, topRow, 'R');
    for (let y = topRow + 1; y < topRow + height; y++) {
      this.set(x, y, 'l');
      for (let i = 1; i < width; i++) this.set(x + i, y, 'r');
    }
    return this;
  }

  entity(x, y, ch) { return this.set(x, y, ch); }

  player(x, y) { return this.set(x, y, '@'); }
  goal(x, y) { return this.set(x, y, '|'); }
  midpoint(x, y) { return this.set(x, y, 'O'); }

  rows() {
    return this.grid.map((row) => row.join(''));
  }
}
