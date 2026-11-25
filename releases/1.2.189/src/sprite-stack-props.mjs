// Source PNGs contain equally sized, bottom-first tiles from the approved prop trial.
// Fit each projected sprite to the current prop's game-space art bounds and anchor.
const definitions = {
  crypt_crate: {source: '../assets/greyhaven-stacks/crate.png', width: 19, depth: 15, count: 16, box: [-9, -19, 19, 22]},
  crypt_barrel: {source: '../assets/greyhaven-stacks/barrel.png', width: 15, depth: 15, count: 18, box: [-6, -18, 13, 20]},
  crypt_obelisk: {source: '../assets/sprite-stacks/obelisk.png', width: 17, depth: 15, count: 23, box: [-8, -25, 17, 28]},
  lantern: {source: '../assets/sprite-stacks/lantern.png', width: 26, depth: 14, count: 44, box: [-7, -49, 26, 49], pivot: [7.5, 7]},
  old_well: {source: '../assets/sprite-stacks/well.png', width: 62, depth: 52, count: 54, box: [-31, -54, 62, 74], rope: {first: 29, last: 42, left: 29, width: 4}},
};
const images = new Map();
const sprites = new Map();

function loadStrip(path) {
  if (!images.has(path)) {
    const image = new Image();
    image.src = new URL(path, import.meta.url).href;
    images.set(path, image);
  }
  return images.get(path);
}

function opaqueBounds(canvas, ctx) {
  const {width, height} = canvas;
  const data = ctx.getImageData(0, 0, width, height).data;
  let left = width, top = height, right = 0, bottom = 0;
  for (let y = 0; y < height; y += 1) for (let x = 0; x < width; x += 1) {
    if (!data[(y * width + x) * 4 + 3]) continue;
    left = Math.min(left, x);
    right = Math.max(right, x + 1);
    top = Math.min(top, y);
    bottom = Math.max(bottom, y + 1);
  }
  return [left, top, right - left, bottom - top];
}

function bake(definition, image, sway) {
  const {width, depth, count, box, rope} = definition;
  const [anchorX, anchorY] = definition.pivot ?? [width / 2, depth / 2];
  const margin = Math.ceil(Math.hypot(width, depth)) + 2;
  const centerY = margin + count;
  const projection = document.createElement('canvas');
  projection.width = margin * 2;
  projection.height = centerY + margin;
  const ctx = projection.getContext('2d', {willReadFrequently: true});
  ctx.imageSmoothingEnabled = false;
  const angle = 24 * Math.PI / 180;
  const pitch = .72;
  const sin = Math.sin(angle), cos = Math.cos(angle);
  for (let layer = 0; layer < count; layer += 1) {
    const y = centerY - layer;
    ctx.setTransform(cos, sin * pitch, -sin, cos * pitch, margin, y);
    const column = layer * width;
    if (sway && rope && layer >= rope.first && layer <= rope.last) {
      // These rows hold the unsupported rope in its own narrow columns.
      // Preserve the pier columns, and keep the top of the rope pin stationary.
      const {left, width: ropeWidth, first, last} = rope;
      const right = left + ropeWidth;
      ctx.drawImage(image, column, 0, left, depth, -anchorX, -anchorY, left, depth);
      ctx.drawImage(image, column + right, 0, width - right, depth, right - anchorX, -anchorY, width - right, depth);
      ctx.setTransform(cos, sin * pitch, -sin, cos * pitch, margin + Math.round(sway * (last - layer) / (last - first)), y);
      ctx.drawImage(image, column + left, 0, ropeWidth, depth, left - anchorX, -anchorY, ropeWidth, depth);
    } else {
      ctx.drawImage(image, column, 0, width, depth, -anchorX, -anchorY, width, depth);
    }
  }
  const [left, top, w, h] = opaqueBounds(projection, ctx);
  if (w <= 0 || h <= 0) return null;
  const sprite = document.createElement('canvas');
  sprite.width = box[2];
  sprite.height = box[3];
  const pixels = sprite.getContext('2d');
  pixels.imageSmoothingEnabled = false;
  pixels.drawImage(projection, left, top, w, h, 0, 0, sprite.width, sprite.height);
  return sprite;
}

export function drawSpriteStackProp(c, kind, x, y, time = 0) {
  const definition = Object.hasOwn(definitions, kind) && definitions[kind];
  if (!definition || typeof Image === 'undefined' || typeof document === 'undefined' || !c.drawImage) return false;
  const sway = definition.rope ? Math.round(Math.sin(time * .8)) : 0;
  const key = `${kind}:${sway}`;
  if (!sprites.has(key)) {
    const image = loadStrip(definition.source);
    if (image.naturalWidth !== definition.width * definition.count || image.naturalHeight !== definition.depth) return false;
    sprites.set(key, bake(definition, image, sway));
  }
  const sprite = sprites.get(key);
  if (!sprite) return false;
  const [left, top] = definition.box;
  c.save();
  c.imageSmoothingEnabled = false;
  c.drawImage(sprite, Math.round(x) + left, Math.round(y) + top);
  c.restore();
  return true;
}
