// Tiny helper for baking procedural pixel-art sprites (original artwork,
// defined as character grids + a palette) into offscreen canvases that can
// be blitted cheaply every frame.

const cache = new Map();

export function bake(key, rows, palette, pixelSize = 2, flipX = false) {
  const cacheKey = key + (flipX ? ':flip' : '');
  if (cache.has(cacheKey)) return cache.get(cacheKey);

  const cols = rows[0].length;
  const h = rows.length;
  const canvas = document.createElement('canvas');
  canvas.width = cols * pixelSize;
  canvas.height = h * pixelSize;
  const ctx = canvas.getContext('2d');

  for (let ry = 0; ry < h; ry++) {
    const row = rows[ry];
    for (let rx = 0; rx < cols; rx++) {
      const c = row[rx];
      if (c === '.' || c === undefined) continue;
      const color = palette[c];
      if (!color) continue;
      const px = flipX ? cols - 1 - rx : rx;
      ctx.fillStyle = color;
      ctx.fillRect(px * pixelSize, ry * pixelSize, pixelSize, pixelSize);
    }
  }
  cache.set(cacheKey, canvas);
  return canvas;
}

export function clearCache() {
  cache.clear();
}
