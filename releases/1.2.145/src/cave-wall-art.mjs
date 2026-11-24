import {pixelPolygon} from './pixel-shapes.mjs';

const NORTH = 1, EAST = 2, SOUTH = 4, WEST = 8;
const TILE = 32;
const STYLES = {
  limestone: {
    void: '#111923', seam: '#253037', foot: '#303a3c', dark: '#38464a',
    shade: '#455557', face: '#566664', pale: '#697770', cap: '#7e8677',
    mineral: '#8e8e77', damp: '#4c6965',
  },
  well: {
    void: '#101218', seam: '#211f24', foot: '#2d2a2a', dark: '#383435',
    shade: '#45403b', face: '#574b42', pale: '#685849', cap: '#7b6853',
    mineral: '#8b7459', damp: '#565c4e',
  },
};
const styles = Object.keys(STYLES);
const VARIANTS = 8;
const WALL_CACHE_LIMIT = styles.length * 15 * VARIANTS;
const atlas = new Map();

// All edge polygons stay inside their original solid cell. Ground at the edge
// therefore remains readable, even in narrow passages and co-op closeups.
export function caveEdgeMask(x, y, openAt) {
  return (openAt(x, y - 1) ? NORTH : 0) |
    (openAt(x + 1, y) ? EAST : 0) |
    (openAt(x, y + 1) ? SOUTH : 0) |
    (openAt(x - 1, y) ? WEST : 0);
}

function seedAt(seed, x, y) {
  let value = (seed | 0) ^ Math.imul(x + 61, 374761393) ^ Math.imul(y + 113, 668265263);
  value = Math.imul(value ^ (value >>> 13), 1274126177);
  return (value ^ (value >>> 16)) >>> 0;
}

function wallPoint(side, across, depth) {
  switch (side) {
    case SOUTH: return {x: across, y: TILE - depth};
    case EAST: return {x: TILE - depth, y: across};
    case WEST: return {x: depth, y: across};
    default: return {x: across, y: depth};
  }
}

function paintFace(c, side, mask, variant, color) {
  const h = side === SOUTH ? (mask & NORTH ? 21 : 27) : side === NORTH ? 9 : 17;
  const seed = variant * 53 + side * 9;
  const jitter = (n, span) => seedAt(seed, n, 7) % span;
  const first=5+jitter(1,11),second=19+jitter(2,8);
  const poly = (points, shade) => pixelPolygon(c, points.map(([a, d]) => wallPoint(side, a, d)), shade);

  // A thick shoulder separates the exposed face from solid dark rock behind it.
  const rim=[[32,h-4],[27+jitter(3,4),h-2-jitter(4,5)],[22+jitter(4,4),h-jitter(5,6)],
    [17+jitter(6,3),h-3-jitter(7,4)],[12+jitter(8,4),h-jitter(9,5)],
    [8+jitter(10,4),h-1-jitter(11,5)],[4+jitter(12,3),h-2-jitter(13,4)],[0,h-4]];
  poly([[0,0],[32,0],...rim],color.dark);
  poly([[0,1],[32,1],...rim.map(([x,y])=>[x,y-3])],side===SOUTH?color.face:color.shade);

  // Three uneven connected stone planes. Their breaks stay coarse enough to
  // read at normal camera zoom, with strongest light on the upper-left lip.
  if (h > 10) {
    poly([[0,4],[first-2,3],[first+2,7],[first-1,h-7],
      [first-5,h-9],[0,h-9]], variant%3===1?color.face:color.pale);
    poly([[first,3],[second-4,4],[second,8],[second-4,h-7],
      [first+4,h-5],[first-1,8]], color.shade);
    poly([[second-2,1],[32,3],[32,h-9],[second+3,h-7],
      [second+2,8]],side===WEST||variant%4===0?color.face:color.pale);
    poly([[first-1,1],[first+1,1],[first+4,6],[first+2,10],
      [first+3,h-6],[first-1,h-9],[first+1,7]], color.seam);
    poly([[second-2,1],[second,1],[second+3,7],[second+1,11],
      [second+2,h-8],[second-2,h-10],[second+1,7]], color.dark);
    if (side === SOUTH) {
      const left = 3 + jitter(3, 5), right = 22 + jitter(4, 4);
      poly([[left,9],[left+8,10],[left+13,9],[left+17,12],[right+1,12],
        [right,14],[left+14,14],[left+9,12],[left,11]], color.damp);
      if (variant===3||variant===6) {
        poly([[left,h-10],[left+4,h-12],[left+11,h-12],[left+16,h-15],
          [left+23,h-15],[left+23,h-14],[left+17,h-14],[left+12,h-11],[left,h-9]], color.mineral);
      }
    }
  }

  // Walkable floor starts at depth zero. A continuous thin contact band and
  // broken bevel keep the stair-stepped silhouette legible at inside corners.
  poly([[0,0],[32,0],[32,2],[second,2],[second-2,3],[first,2],[0,3]], color.foot);
  poly([[0,3],[first-3,3],[first,4],[first-4,5],[0,5]], side === EAST ? color.shade : color.cap);
  poly([[second+2,2],[32,2],[32,4],[second+5,4]], color.pale);
}

function paintStone(c, mask, variant, color) {
  c.fillStyle = color.void;
  c.fillRect(0, 0, TILE, TILE);
  for (const side of [NORTH, WEST, EAST, SOUTH]) {
    if (mask & side) paintFace(c, side, mask, variant, color);
  }
}

function raster(mask, variant, style) {
  const key = (styles.indexOf(style) * 16 + mask) * VARIANTS + variant;
  let image = atlas.get(key);
  if (image) return image;
  if (typeof OffscreenCanvas !== 'undefined') image = new OffscreenCanvas(TILE, TILE);
  else if (typeof document !== 'undefined') {
    image = document.createElement('canvas');
    image.width = image.height = TILE;
  } else return null;
  paintStone(image.getContext('2d'), mask, variant, STYLES[style]);
  atlas.set(key, image);
  return image;
}

export function drawCaveWallCell(c, x, y, size, mask, seed, tx, ty, style = 'limestone') {
  const color = STYLES[style];
  if (!mask) {
    c.fillStyle = color.void;
    c.fillRect(x, y, size, size);
    return;
  }
  const variant = (seedAt(seed,tx,ty)>>>14)%VARIANTS;
  const image = raster(mask, variant, style);
  if (image) {
    c.imageSmoothingEnabled = false;
    c.drawImage(image, x, y, size, size);
  } else {
    c.save();c.beginPath();c.rect(x,y,size,size);c.clip();
    c.translate(x,y);c.scale(size/TILE,size/TILE);
    paintStone(c, mask, variant, color);
    c.restore();
  }
}

export function caveWallCacheStats() {
  return {surfaces: atlas.size, limit: WALL_CACHE_LIMIT};
}

// The opt-in smooth-contour study paints the same bands from its distance
// field. Its authored wall sprites and pools still sit above this ground art.
export function cavernContourStone(x, y, distance, variation) {
  const tone = STYLES.limestone;
  if(distance>=57)return tone.void;
  const fault = Math.sin(x * .054 + y * .047) + Math.cos(x * .091 - y * .038);
  const bedding = Math.sin(x * .015 + y * .109) + variation * .64;
  if (distance < 3) return tone.foot;
  if (distance < 11 + fault * 2) return bedding > .62 ? tone.pale : tone.face;
  if (distance < 26 + fault * 3) return bedding > .56 ? tone.face : tone.shade;
  if (distance < 38 + fault * 5) return bedding > .45 ? tone.dark : tone.seam;
  if (distance < 51 + fault * 6) return tone.seam;
  return tone.void;
}
