import {pixelLine, pixelPolygon} from './pixel-shapes.mjs';

const CHUNK = 128;
const CACHE_LIMIT = 96;
const GEOMETRY_LIMIT = 512;
const NORTH = 1, EAST = 2, SOUTH = 4, WEST = 8;
const LITTLE_ENDIAN = new Uint8Array(Uint32Array.of(1).buffer)[0] === 1;
const atlas = new Map();
const slabs = new Map();
const STONE = {
  limestone: {width: 72, height: 48, base: [69, 79, 83], light: [1, 1, .85], shadow: '18,27,34'},
  well: {width: 54, height: 36, base: [62, 56, 53], light: [1, .86, .67], shadow: '24,22,27'},
};

function stoneHash(seed, x, y) {
  let bits = (seed | 0) ^ Math.imul(x + 149, 374761393) ^ Math.imul(y + 67, 668265263);
  bits = Math.imul(bits ^ (bits >>> 13), 1274126177);
  return (bits ^ (bits >>> 16)) >>> 0;
}

function siteAt(seed, x, y, rock) {
  const grain = stoneHash(seed, x, y);
  return {
    x: (x + .23 + (grain & 255) / 475) * rock.width,
    y: (y + .21 + ((grain >>> 8) & 255) / 447) * rock.height,
    grain,
  };
}

function tone(rock, lift, bias = 0) {
  const [r, g, b] = rock.base;
  const red = Math.round(r + lift * rock.light[0] + bias);
  const green = Math.round(g + lift * rock.light[1]);
  const blue = Math.round(b + lift * rock.light[2] - bias);
  return LITTLE_ENDIAN ? red | green << 8 | blue << 16 | 255 << 24 : red << 24 | green << 16 | blue << 8 | 255;
}

function ambient(seed, x, y) {
  // Broad, stationary light follows strata well past gameplay tile and raster boundaries.
  return Math.sin(x * .009 + y * .006 + (seed & 63)) * 6 +
    Math.sin(y * .020 - x * .004 + ((seed >>> 6) & 63)) * 4;
}

function clipSlab(points, a, b) {
  const nx = b.x - a.x, ny = b.y - a.y;
  const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
  const plane = p => (p.x - mx) * nx + (p.y - my) * ny;
  const clipped = [];
  for (let i = 0; i < points.length; i++) {
    const from = points[i], to = points[(i + 1) % points.length];
    const d0 = plane(from), d1 = plane(to);
    if (d0 <= 0) clipped.push(from);
    if ((d0 <= 0) !== (d1 <= 0)) {
      const t = d0 / (d0 - d1);
      clipped.push({x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t});
    }
  }
  return clipped;
}

function insetSlab(points, site, amount) {
  return points.map(p => {
    const dx = site.x - p.x, dy = site.y - p.y;
    const t = amount / Math.max(1, Math.hypot(dx, dy));
    return {x: p.x + dx * t, y: p.y + dy * t};
  });
}

function stratum(c, x, y, size, direction, rock, face, bias) {
  const points = [[-8,0],[-5,-2],[-2,-2],[0,-3],[4,-2],[7,-2],[8,0],[4,1],[2,3],[-2,2],[-6,2]];
  const shape = points.map(([u,v]) => ({x: x + u * size * direction, y: y + v * size + u * .15}));
  pixelPolygon(c, shape, tone(rock, face + 4, bias));
  const lip = shape[0], step = shape[1], end = shape[4];
  pixelLine(c, lip, step, tone(rock, face + 7, bias));
  pixelLine(c, step, end, tone(rock, face + 6, bias));
  pixelLine(c, shape[7], shape[9], tone(rock, face - 5, bias));
}

function slabAt(seed, ix, iy, rock) {
  const key = `${seed}:${rock.width}:${rock.height}:${ix}:${iy}`;
  const cached = slabs.get(key);
  if (cached) return cached;
  const site = siteAt(seed, ix, iy, rock);
  let points = [{x: site.x - rock.width, y: site.y - rock.height},
    {x: site.x + rock.width, y: site.y - rock.height},
    {x: site.x + rock.width, y: site.y + rock.height},
    {x: site.x - rock.width, y: site.y + rock.height}];
  for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
    if (dx || dy) points = clipSlab(points, site, siteAt(seed, ix + dx, iy + dy, rock));
  }
  const xs = points.map(p => p.x), ys = points.map(p => p.y);
  const slab = {site, points, left: Math.min(...xs), right: Math.max(...xs), top: Math.min(...ys), bottom: Math.max(...ys)};
  if (slabs.size >= GEOMETRY_LIMIT) slabs.delete(slabs.keys().next().value);
  slabs.set(key, slab);
  return slab;
}

function paintSlab(c, seed, ox, oy, ix, iy, width, height, rock) {
  const {site, points, left, right, top, bottom} = slabAt(seed, ix, iy, rock);
  // Off-raster slabs need no paint. Leave space for the chipped rim and its flecks.
  const margin = 12;
  if (right < ox - margin || left >= ox + width + margin || bottom < oy - margin || top >= oy + height + margin) return;
  // Pull alternating edges inward to break the regular joint into chipped stone.
  const locals = points.map(p => ({x: p.x - ox, y: p.y - oy}));
  const center = {...site, x: site.x - ox, y: site.y - oy};
  const rough = [];
  const {grain} = site;
  for (let i = 0; i < locals.length; i++) {
    const a = locals[i], b = locals[(i + 1) % locals.length];
    rough.push(a);
    if (Math.hypot(b.x - a.x, b.y - a.y) < 18) continue;
    const t = .32 + ((grain >>> (i % 6 * 4)) & 15) / 53;
    rough.push(...insetSlab([{x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t}], center, 4));
  }

  const light = ambient(seed, site.x, site.y), bias = ((grain >>> 26) & 3) - 1;
  const face = light + ((grain >>> 16) & 7) - 2;
  pixelPolygon(c, locals, tone(rock, light - 5, bias));
  const rim = insetSlab(rough, center, 1);
  pixelPolygon(c, rim, tone(rock, face - 8, bias));
  const planes = insetSlab(rough, center, 2.4);
  pixelPolygon(c, planes, tone(rock, face, bias));

  for (let i = 0; i < rim.length; i++) {
    const a = rim[i], b = rim[(i + 1) % rim.length];
    const dx = b.x - a.x, dy = b.y - a.y;
    if (-dx + dy >= -9 || Math.hypot(dx, dy) < 11 || ((grain >>> (i % 16)) & 3) === 0) continue;
    pixelLine(c, a, {x: a.x + dx * .70, y: a.y + dy * .70}, tone(rock, face + 8, bias));
  }

  // A low relief plane and a break in its rock bed, with compact mineral flecks.
  const i = (grain >>> 22) % planes.length;
  const a = planes[i], b = planes[(i + 1) % planes.length];
  const chip = {x: (center.x + a.x + b.x) / 3, y: (center.y + a.y + b.y) / 3};
  const brokenFace = {x: (b.x * 3 + a.x) / 4 - 2, y: (b.y * 3 + a.y) / 4 + 2};
  pixelPolygon(c, [a, b, brokenFace, chip], tone(rock, face + (grain & 1 ? 3 : -3), bias));
  if ((grain & 7) !== 1) {
    const end = {x: center.x + (a.x - center.x) * .21, y: center.y + (a.y - center.y) * .21};
    const bend = {x: (chip.x + end.x) / 2 - ((grain & 3) + 2), y: (chip.y + end.y) / 2 + 2};
    pixelLine(c, a, chip, tone(rock, face - 6, bias));
    pixelLine(c, chip, bend, tone(rock, face - 6, bias));
    pixelLine(c, bend, end, tone(rock, face - 9, bias));
  }
  const direction = grain & 4 ? 1 : -1, scale = rock.height / 48;
  stratum(c, Math.round((chip.x + center.x * 2) / 3), Math.round((chip.y + center.y * 2) / 3), scale, direction, rock, face, bias);
  if ((grain & 3) !== 0) {
    const other = planes[(i + Math.floor(planes.length / 2)) % planes.length];
    const x = Math.round((other.x + center.x * 2) / 3), y = Math.round((other.y + center.y * 2) / 3);
    stratum(c, x, y, scale * .65, direction, rock, face - 2, bias);
  }
  const flecks = 7 + ((grain >>> 24) & 7);
  for (let n = 0; n < flecks; n++) {
    const bits = stoneHash(seed ^ grain, n, n + 71);
    const point = planes[bits % planes.length];
    const t = .25 + ((bits >>> 10) & 31) / 72;
    const x = Math.round(center.x + (point.x - center.x) * t);
    const y = Math.round(center.y + (point.y - center.y) * t);
    c.fillStyle = tone(rock, face + (n % 3 ? 6 : -7), bias);
    c.fillRect(x, y, n % 5 ? 2 : 3, 1);
    if (n % 5 === 0) {
      c.fillStyle = tone(rock, face - 6, bias);
      c.fillRect(x + 1, y + 1, 2, 1);
    }
  }
}

function paintGround(c, seed, ox, oy, width, height, rock) {
  c.fillStyle = tone(rock, -5);
  c.fillRect(0, 0, width, height);
  const left = Math.floor(ox / rock.width) - 1, right = Math.floor((ox + width) / rock.width) + 1;
  const top = Math.floor(oy / rock.height) - 1, bottom = Math.floor((oy + height) / rock.height) + 1;
  for (let iy = top; iy <= bottom; iy++) for (let ix = left; ix <= right; ix++) {
    paintSlab(c, seed, ox, oy, ix, iy, width, height, rock);
  }
}

function paintRaster(context, seed, ox, oy, rock) {
  const frame = context.createImageData(CHUNK, CHUNK);
  const pixels = new Uint32Array(frame.data.buffer);
  // The shared pixel shapes emit integer rectangles and scanline spans. Draw
  // them in memory so a cold raster does one canvas upload instead of many draws.
  const pen = {
    fillStyle: 0,
    fillRect(x, y, width, height) {
      const left = Math.max(0, x), right = Math.min(CHUNK, x + width);
      const top = Math.max(0, y), bottom = Math.min(CHUNK, y + height);
      if (left >= right) return;
      for (let row = top; row < bottom; row++) pixels.fill(this.fillStyle, row * CHUNK + left, row * CHUNK + right);
    },
  };
  paintGround(pen, seed, ox, oy, CHUNK, CHUNK, rock);
  context.putImageData(frame, 0, 0);
}

function paintDirect(context, seed, ox, oy, size, rock) {
  const pen = {
    set fillStyle(color) {
      const r = LITTLE_ENDIAN ? color & 255 : color >>> 24;
      const g = (color >>> (LITTLE_ENDIAN ? 8 : 16)) & 255;
      const b = (color >>> (LITTLE_ENDIAN ? 16 : 8)) & 255;
      context.fillStyle = `rgb(${r},${g},${b})`;
    },
    fillRect(x, y, width, height) { context.fillRect(x, y, width, height); },
  };
  paintGround(pen, seed, ox, oy, size, size, rock);
}

function raster(seed, cx, cy, material) {
  const key = `${material}:${seed}:${cx}:${cy}`;
  if (atlas.has(key)) return atlas.get(key);
  let image;
  if (typeof OffscreenCanvas !== 'undefined') image = new OffscreenCanvas(CHUNK, CHUNK);
  else if (typeof document !== 'undefined') {
    image = document.createElement('canvas');
    image.width = image.height = CHUNK;
  } else return null;
  paintRaster(image.getContext('2d'), seed, cx * CHUNK, cy * CHUNK, STONE[material]);
  if (atlas.size >= CACHE_LIMIT) atlas.delete(atlas.keys().next().value);
  atlas.set(key, image);
  return image;
}

export function caveFloorEdges(tx, ty, openAt) {
  const north = openAt(tx, ty - 1), east = openAt(tx + 1, ty);
  const south = openAt(tx, ty + 1), west = openAt(tx - 1, ty);
  const mask = (north ? 0 : NORTH) | (east ? 0 : EAST) | (south ? 0 : SOUTH) | (west ? 0 : WEST);
  const hallway = !north && (!south || !openAt(tx, ty + 2)) ||
    !south && !openAt(tx, ty - 2) || !east && (!west || !openAt(tx - 2, ty)) ||
    !west && !openAt(tx + 2, ty);
  return {mask, hallway};
}

function contactShade(c, x, y, size, {mask, hallway}, rock) {
  const depth = hallway ? Math.ceil(size / 11) : Math.ceil(size / 7);
  for (const [width, opacity] of [[depth, .10], [2, .16], [1, .14]]) {
    c.fillStyle = `rgba(${rock.shadow},${opacity})`;
    if (mask & NORTH) c.fillRect(x, y, size, width);
    if (mask & EAST) c.fillRect(x + size - width, y, width, size);
    if (mask & SOUTH) c.fillRect(x, y + size - width, size, width);
    if (mask & WEST) c.fillRect(x, y, width, size);
  }
}

export function drawCaveFloorCell(c, x, y, size, seed, tx, ty, edges = null, material = 'limestone') {
  const wx = tx * size, wy = ty * size, cx = Math.floor(wx / CHUNK), cy = Math.floor(wy / CHUNK);
  const rasterX = wx - cx * CHUNK, rasterY = wy - cy * CHUNK;
  const rock = STONE[material], image = raster(seed, cx, cy, material);
  if (image && rasterX + size <= CHUNK && rasterY + size <= CHUNK) {
    c.imageSmoothingEnabled = false;
    c.drawImage(image, rasterX, rasterY, size, size, x, y, size, size);
  } else {
    c.save(); c.beginPath(); c.rect(x, y, size, size); c.clip(); c.translate(x, y);
    paintDirect(c, seed, wx, wy, size, rock);
    c.restore();
  }
  if (edges?.mask) contactShade(c, x, y, size, edges, rock);
}

export function caveFloorCacheStats() {
  return {surfaces: atlas.size, limit: CACHE_LIMIT};
}
