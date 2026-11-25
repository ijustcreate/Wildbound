const caches = new WeakMap();
const LIMIT = 36;

// Paint a low-resolution ground color layer for the current view while the
// worker prepares the full biome raster. A 512-unit tile needs 256 samples.
export function drawRailwayFloorFallback(context, design, x, y, span, sample, color, layer = 'surface') {
  let cache = caches.get(design);
  if (!cache) caches.set(design, cache = new Map());
  const key = `${layer}:${span}:${sample}:${x}:${y}`;
  let canvas = cache.get(key);
  if (canvas) cache.delete(key);
  else {
    const size = Math.ceil(span / sample);
    canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const paint = canvas.getContext('2d');
    for (let row = 0; row < size; row++) for (let column = 0; column < size; column++) {
      paint.fillStyle = color(x + (column + .5) * sample, y + (row + .5) * sample);
      paint.fillRect(column, row, 1, 1);
    }
  }
  cache.set(key, canvas);
  if (cache.size > LIMIT) cache.delete(cache.keys().next().value);
  context.imageSmoothingEnabled = false;
  context.drawImage(canvas, x, y, span, span);
}
