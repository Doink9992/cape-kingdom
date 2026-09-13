import { TILE } from '../engine/Constants.js';
import { SOLID_TILES, BUMPABLE_TILES, TILE_TYPES } from '../render/Tileset.js';

export class Level {
  constructor({ name, theme, grid, width, height, entitySpawns, playerStart, goalX, midpoint, timeLimit, powerupType, music }) {
    this.name = name;
    this.theme = theme || 'overworld';
    this.grid = grid; // grid[y][x] = tile id
    this.width = width;
    this.height = height;
    this.entitySpawns = entitySpawns;
    this.playerStart = playerStart;
    this.goalX = goalX;
    this.midpoint = midpoint;
    this.timeLimit = timeLimit || 300;
    this.powerupType = powerupType || 'fire';
    this.music = music || theme;
    this.tileMeta = new Map(); // "x,y" -> { bump: 0, hidden: false, used: false, fallT }
    this.revealedItems = [];
  }

  key(x, y) { return `${x},${y}`; }

  getTile(tx, ty) {
    if (ty < 0) return TILE_TYPES.EMPTY;
    if (tx < 0 || tx >= this.width || ty >= this.height) return TILE_TYPES.SOLID;
    return this.grid[ty][tx];
  }

  setTile(tx, ty, id) {
    if (ty < 0 || ty >= this.height || tx < 0 || tx >= this.width) return;
    this.grid[ty][tx] = id;
  }

  isSolidTile(id) {
    return SOLID_TILES.has(id);
  }

  isSolidAt(tx, ty) {
    return this.isSolidTile(this.getTile(tx, ty));
  }

  isBumpable(tx, ty) {
    return BUMPABLE_TILES.has(this.getTile(tx, ty));
  }

  getMeta(tx, ty) {
    const k = this.key(tx, ty);
    if (!this.tileMeta.has(k)) this.tileMeta.set(k, { bump: 0, used: false, fallT: 0, falling: false });
    return this.tileMeta.get(k);
  }

  widthPx() { return this.width * TILE; }
  heightPx() { return this.height * TILE; }
}
