// Renders a sprite into an offscreen canvas once per unique cache key, then
// adds a 1px silhouette outline (classic retro-sprite look) and caches the
// result so later frames just blit the finished bitmap.
const cache = new Map();

export function getSprite(key, w, h, paint) {
  let entry = cache.get(key);
  if (entry) return entry;

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  paint(ctx, w, h);
  outline(canvas, ctx, w, h);

  cache.set(key, canvas);
  return canvas;
}

function outline(canvas, ctx, w, h) {
  const img = ctx.getImageData(0, 0, w, h);
  const data = img.data;
  const opaque = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) opaque[i] = data[i * 4 + 3] > 24 ? 1 : 0;

  const outlineCanvas = document.createElement('canvas');
  outlineCanvas.width = w;
  outlineCanvas.height = h;
  const octx = outlineCanvas.getContext('2d');
  const outImg = octx.createImageData(w, h);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = y * w + x;
      if (opaque[idx]) continue;
      let touches = false;
      for (let dy = -1; dy <= 1 && !touches; dy++) {
        for (let dx = -1; dx <= 1 && !touches; dx++) {
          const nx = x + dx, ny = y + dy;
          if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
          if (opaque[ny * w + nx]) touches = true;
        }
      }
      if (touches) {
        const o = idx * 4;
        outImg.data[o] = 26;
        outImg.data[o + 1] = 18;
        outImg.data[o + 2] = 16;
        outImg.data[o + 3] = 255;
      }
    }
  }
  octx.putImageData(outImg, 0, 0);
  octx.drawImage(canvas, 0, 0);

  ctx.clearRect(0, 0, w, h);
  ctx.drawImage(outlineCanvas, 0, 0);
}

export function clearSpriteCache() {
  cache.clear();
}
