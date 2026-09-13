import { TILE } from '../engine/Constants.js';

function tilesFor(level, ent, predicate) {
  const left = Math.floor(ent.x / TILE);
  const right = Math.floor((ent.x + ent.w - 0.01) / TILE);
  const top = Math.floor(ent.y / TILE);
  const bottom = Math.floor((ent.y + ent.h - 0.01) / TILE);
  const out = [];
  for (let ty = top; ty <= bottom; ty++) {
    for (let tx = left; tx <= right; tx++) {
      if (predicate(tx, ty)) out.push({ tx, ty, px: tx * TILE, py: ty * TILE });
    }
  }
  return out;
}

export function solidsUnder(level, ent) {
  return tilesFor(level, ent, (tx, ty) => level.isSolidAt(tx, ty) && !isFallenDonut(level, tx, ty));
}

function isFallenDonut(level, tx, ty) {
  const meta = level.getMeta(tx, ty);
  return meta.falling && meta.fallT >= 1;
}

// Moves an entity by (dx, dy), resolving collisions against solid level
// tiles one axis at a time (classic tile-platformer sweep). Calls optional
// hooks on the entity: onHitWall(dir, tiles), onLand(tiles), onHitCeiling(tiles).
export function moveAndCollide(level, ent, dx, dy) {
  const result = { hitLeft: false, hitRight: false, hitTop: false, hitBottom: false };

  if (dx !== 0) {
    ent.x += dx;
    const hits = solidsUnder(level, ent);
    if (hits.length) {
      if (dx > 0) {
        const minPx = Math.min(...hits.map((h) => h.px));
        ent.x = minPx - ent.w;
        result.hitRight = true;
      } else {
        const maxRight = Math.max(...hits.map((h) => h.px + TILE));
        ent.x = maxRight;
        result.hitLeft = true;
      }
      ent.vx = 0;
      if (ent.onHitWall) ent.onHitWall(dx > 0 ? 1 : -1, hits);
    }
  }

  if (dy !== 0) {
    ent.y += dy;
    const hits = solidsUnder(level, ent);
    if (hits.length) {
      if (dy > 0) {
        const minPy = Math.min(...hits.map((h) => h.py));
        ent.y = minPy - ent.h;
        ent.onGround = true;
        result.hitBottom = true;
        ent.vy = 0;
        if (ent.onLand) ent.onLand(hits);
      } else {
        const maxBottom = Math.max(...hits.map((h) => h.py + TILE));
        ent.y = maxBottom;
        result.hitTop = true;
        ent.vy = 0;
        if (ent.onHitCeiling) ent.onHitCeiling(hits);
      }
    }
  }

  return result;
}

export function isOnGroundBelow(level, ent) {
  const probe = { x: ent.x, y: ent.y + 1, w: ent.w, h: ent.h };
  return solidsUnder(level, probe).length > 0;
}

export function overlaps(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}
