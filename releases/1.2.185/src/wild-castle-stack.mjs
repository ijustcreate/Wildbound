// Composite horizontal pixel slices once and keep the pivot at ground height.
const stacks = new WeakMap();

function stackSpans(layers, squash, lift, angle) {
 const spans = [], cos = Math.cos(angle), sin = Math.sin(angle);
 const pixel = value => Math.ceil(value - .5);
 for (const [index, layer] of layers.entries()) {
  const rise = index * lift;
  for (const [x, y, width, depth, color] of layer) {
   if (width <= 0 || depth <= 0) continue;
   if (angle === 0) {
    const left = pixel(x), top = pixel(y * squash - rise);
    const right = pixel(x + width), bottom = pixel((y + depth) * squash - rise);
    if (right > left && bottom > top) spans.push([left, top, right, bottom, color]);
    continue;
   }
   const corners = [[x, y], [x + width, y], [x + width, y + depth], [x, y + depth]]
    .map(([u, v]) => [u * cos - v * sin, (u * sin + v * cos) * squash - rise]);
   const rows = corners.map(corner => corner[1]);
   for (let row = pixel(Math.min(...rows)); row < pixel(Math.max(...rows)); row++) {
    const scanY = row + .5, edges = [];
    for (let edge = 0; edge < 4; edge++) {
     const [ax, ay] = corners[edge], [bx, by] = corners[(edge + 1) % 4];
     if (scanY < Math.min(ay, by) || scanY >= Math.max(ay, by)) continue;
     edges.push(ax + (bx - ax) * (scanY - ay) / (by - ay));
    }
    const left = pixel(Math.min(...edges)), right = pixel(Math.max(...edges));
    if (right > left) spans.push([left, row, right, row + 1, color]);
   }
  }
 }
 return spans;
}

function paint(c, spans, x, y) {
 for (const [left, top, right, bottom, color] of spans) {
  c.fillStyle = color;
  c.fillRect(x + left, y + top, right - left, bottom - top);
 }
}

function bake(spans) {
 let left = Infinity, top = Infinity, right = -Infinity, bottom = -Infinity;
 for (const [x, y, edgeX, edgeY] of spans) {
  left = Math.min(left, x);
  top = Math.min(top, y);
  right = Math.max(right, edgeX);
  bottom = Math.max(bottom, edgeY);
 }
 const image = document.createElement('canvas');
 image.width = right - left;
 image.height = bottom - top;
 paint(image.getContext('2d'), spans, -left, -top);
 return {image, left, top};
}

// Layers run from the ground up. Each rectangle is [left, top, width, depth, color].
// Reuse a layers array to share a bake across placements with the same projection.
export function drawCastleStack(c, x, y, layers, {squash = 1, lift = 1, angle = 0} = {}) {
 const key = `${squash},${lift},${angle}`;
 let projections = stacks.get(layers);
 if (!projections) stacks.set(layers, projections = new Map());
 if (!projections.has(key)) {
  const spans = stackSpans(layers, squash, lift, angle);
  const projection = spans.length && typeof document !== 'undefined' ? bake(spans) : {spans};
  if (projections.size >= 12) projections.delete(projections.keys().next().value);
  projections.set(key, projection);
 }
 const {image, left, top, spans} = projections.get(key);
 const px = Math.round(x), py = Math.round(y);
 if (image) {
  c.save();
  c.imageSmoothingEnabled = false;
  c.drawImage(image, px + left, py + top);
  c.restore();
 } else {
  paint(c, spans, px, py);
 }
}
