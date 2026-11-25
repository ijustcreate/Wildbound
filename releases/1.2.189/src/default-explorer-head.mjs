import { skinPalette } from './human-head.mjs';
import { hairPalette } from './hair-design.mjs';

const explorerHairColor = '#593923';
const explorerHairTones = { k: '#33231f', s: '#4b2e27', b: '#664332', h: '#87583e' };
const hairX = -7.5;
const hairY = -8.35;

// Indexed cells in rig order S, SW, W, NW, N, NE, E, SE. The short
// swept fringe turns with the skull while the lit crown stays on screen left.
const cropViews = [
  [ // South
    '........kkkkk',
    '......kkhhbbbkk',
    '....kkhhhhbbbbbkk',
    '..kkhhhhhbbbbsssbk',
    '....khhhhhbbsssssbkk',
    '.kkhhhhhbbbbsssssssbk',
    'khhhhbbbbbbbssssssssbk',
    '.kbbbsbbbbbbbsssssssbk',
    'kbbssbbbbbbbbkkksssbk',
    'kssssbbbbkkkk...ksbk',
    '.kssbkkkk.........kk',
    '..kkk',
  ],
  [ // Southwest
    '........kkkkk',
    '......kkhhbbbkk',
    '....kkhhhhbbbbbkk',
    '..kkhhhhhbbbbsssbk',
    '....khhhbbbssssssbk',
    '.kkhhhbbbbbbssssssbk',
    'khhhbbbbbbbbsssssssbk',
    '.kbbbbbsbbbbssssssssbk',
    '.kbbssbbbbbbkkksssssbk',
    '..ksbbbbkkkk...kssssbk',
    '...kkkkk........kssbk',
    '.................kkk',
  ],
  [ // West
    '........kkkk',
    '......kkhhbbkk',
    '....kkhhhhbbbbkk',
    '..kkhhhhhbbbbssbkk',
    '....khhhbbbssssssbk',
    '.kkhhbbbbbbbssssssbk',
    'khhhbbbbbbbbsssssssbk',
    '.kbbbbbbbbbbssssssssbk',
    '.kbbbbbbkkkkksssssssbk',
    '..ksbkkk.....ksssssbk',
    '...kk.........ksssbk',
    '...............kskk',
    '................k',
  ],
  [ // Northwest
    '.........kkkk',
    '.......kkhbbbkk',
    '.....kkhhhhbbbbkk',
    '....khhhhhbbbbbsskk',
    '...khhhhhbbbbbssssbk',
    '..khhhbbbbbbbssssssbk',
    '..kbbbbbbbbbbssssssssbk',
    '..kbbbbbbbbbbssssssssbk',
    '...kbbbbbbbbbssssssssbk',
    '...kbbbbbbbbbssssssssbk',
    '....kbbbbbbbssssssssbk',
    '....kbbbbbbbssssssssbk',
    '.....kbbbbbbsssssssbk',
    '......kkbbbbssssssbk',
    '........kkbbsssssbk',
    '..........kksssbkk',
    '............kkkk',
  ],
  [ // North
    '.........kkkk',
    '......kkkhbbbkk',
    '....kkhhhhbbbbbkk',
    '...khhhhhbbbbbbbskk',
    '..khhhhhbbbbbbbssssbk',
    '..khhhbbbbbbbbsssssbk',
    '.kbbbbbbbbbbbssssssssbk',
    '.kbbbbbbbbbbsssssssssbk',
    '.kbbbbbbbbbbsssssssssbk',
    '.kbbbbbbbbbssssssssssbk',
    '.kbbbbbbbbbsssssssssbk',
    '..kbbbbbbbbsssssssssbk',
    '..kbbbbbbbsssssssssbk',
    '...kbbbbbbssssssssbk',
    '....kkbbbbssssssbkk',
    '......kkbbbsssskk',
    '........kkkkkkk',
  ],
  [ // Northeast
    '.........kkkk',
    '......kkkhbbbkk',
    '....kkhhhhbbbbbkk',
    '...khhhhhbbbbbbbskk',
    '..khhhhhbbbbbbbssssbk',
    '..khhhbbbbbbbbssssssbk',
    '.kbbbbbbbbbbbsssssssbk',
    '.kbbbbbbbbbbbsssssssbk',
    '.kbbbbbbbbbbsssssssbk',
    '.kbbbbbbbbbbsssssssbk',
    '.kbbbbbbbbbsssssssbk',
    '..kbbbbbbbbssssssbk',
    '..kbbbbbbbbsssssbk',
    '...kbbbbbbbssssbkk',
    '....kbbbbbbssbkk',
    '.....kkbbsskk',
    '.......kkkk',
  ],
  [ // East
    '..........kkkk',
    '.......kkkhbbbkk',
    '.....kkhhhhbbbbbkk',
    '...kkhhhhhbbbbbbsskkk',
    '..khhhhhhbbbbbssssbk',
    '.khhhhbbbbbbbsssssssbkk',
    '.kbbbbbbbbbbbbsssssssbk',
    '.kbbbbbbbbbbbbbbsssbk',
    '.kbbbbbbbbkkkkbbbbbk',
    '..kbbbbbkk....kkbbk',
    '..kbbbkk........kk',
    '...kbk',
    '....k',
  ],
  [ // Southeast
    '.........kkkkk',
    '.......kkhhbbbkk',
    '.....kkhhhhbbbbbkk',
    '...kkhhhhhbbbbbssbkk',
    '..khhhhhhbbbbbssssbk',
    '.khhhhbbbbbbbsssssssbkk',
    '.kbbbbbbbbbbbssssssssbk',
    '.kbbbbbbbbbbbbbssssbk',
    '.kbbbbbbbbkkkkbbbbbk',
    '.kbbbbbbkk....kkbbk',
    '..kbbbkk........kk',
    '...kkk',
  ],
];

const hairTiles = new Map();

function cropTones(color) {
  if (color === explorerHairColor) return explorerHairTones;
  const {ink, shade, base, light} = hairPalette(color);
  return {k: ink, s: shade, b: base, h: light};
}

function paintHair(c, rows, tones, x, y, cellWidth, cellHeight) {
  for (let row = 0; row < rows.length; row++) {
    const colors = rows[row];
    for (const area of colors.matchAll(/([ksbh])\1*/g)) {
      c.fillStyle = tones[area[1]];
      c.fillRect(x + area.index * cellWidth, y + row * cellHeight, area[0].length * cellWidth, cellHeight);
    }
  }
}

export function drawDefaultExplorerHair(c, head, direction, hairColor) {
  const rows = cropViews[direction];
  const color = /^#[0-9a-f]{6}$/i.test(hairColor || '') ? hairColor.toLowerCase() : explorerHairColor;
  const cellWidth = .64;
  const cellHeight = direction >= 3 && direction <= 5 ? .68 : .62;
  if (!c.drawImage || typeof document === 'undefined') {
    paintHair(c, rows, cropTones(color), head.x + hairX, head.y + hairY, cellWidth, cellHeight);
    return;
  }
  const key = direction + ':' + color;
  let tile = hairTiles.get(key);
  if (!tile) {
    tile = document.createElement('canvas');
    tile.width = Math.max(...rows.map(row => row.length));
    tile.height = rows.length;
    paintHair(tile.getContext('2d'), rows, cropTones(color), 0, 0, 1, 1);
    if (hairTiles.size >= 64) hairTiles.delete(hairTiles.keys().next().value);
    hairTiles.set(key, tile);
  }
  c.save();
  c.imageSmoothingEnabled = false;
  c.drawImage(tile, head.x + hairX, head.y + hairY, tile.width * cellWidth, tile.height * cellHeight);
  c.restore();
}

const skullViews = [
  // The broad cheek curve continues under the fringe before stepping into the jaw.
  [[-4.5,-5.5],[4.2,-5.5],[5.8,-4.3],[6.6,-2.6],[6.9,.3],[6.1,2.6],[4.6,4.1],[2.8,4.7],[-3.1,4.7],[-5,3.7],[-6.3,2],[-6.9,.1],[-6.7,-2.8],[-5.8,-4.5]],
  [[-4.1,-5.4],[3.8,-5.7],[5.7,-4.7],[6.7,-2.9],[7,.2],[6.2,2.2],[4.7,3.9],[2.6,4.7],[-2.7,4.7],[-4.9,3.8],[-6.3,2.4],[-6.7,.6],[-6.3,-3.2],[-5.5,-4.6]],
  // The forehead and nose project ahead of the cheek. The nape rounds back in.
  [[-3.9,-5.1],[2.9,-5.5],[4.9,-4.7],[6.3,-2.8],[6.7,.1],[5.8,2.2],[4.6,3.2],[2.3,4.5],[-1.6,4.8],[-4.3,3.7],[-5.2,2.4],[-5.2,1.6],[-6.3,1.1],[-6.3,.4],[-5.6,-.4],[-5.5,-2.7]],
  [[-3.8,-5.5],[4.2,-5.6],[6.2,-4.1],[6.9,-2],[6.7,.6],[5.6,2.8],[3.1,4.4],[-1,4.7],[-3.9,3.8],[-5.6,2.2],[-6.1,.1],[-6.1,-2.8],[-5.2,-4.5]],
  [[-4.4,-5.6],[4.4,-5.6],[6.2,-4.2],[6.9,-2],[6.8,.5],[5.8,2.6],[3.8,4],[-3.8,4],[-5.8,2.6],[-6.8,.5],[-6.9,-2],[-6.2,-4.2]],
];

// Use each drawing's lower contour so the smaller head stays seated on the collar.
const headFits = skullViews.map(view => ({scale: 0.85 * 0.9, anchorY: Math.max(...view.map(([, y]) => y))}));
export const defaultExplorerHeadFit = direction => headFits[direction <= 4 ? direction : 8 - direction];

// Main color blocks span two or three half-width cells. This keeps the pupil
// and ivory connected through the world raster's final nearest-neighbor pass.
const eyeCellWidth = .65;
const eyeCellHeight = 1.3;
const eyeRows = {
  front: ['.kkk.', '.wggg', '.wppp'],
  near: ['.kk..', 'ggpww', 'pppww'],
  far: ['.kk.', 'ggww', 'ppww'],
  closed: ['.kkk.'],
  farClosed: ['.kk.'],
};
const eyeTiles = new Map();

function paintEye(c, rows, palette, left, top, cellWidth, cellHeight, mirror) {
  const width = rows[0].length;
  for (const [row, colors] of rows.entries()) {
    for (const [column, tone] of [...colors].entries()) {
      if (tone === '.') continue;
      c.fillStyle = palette[tone];
      const x = mirror ? width - column - 1 : column;
      c.fillRect(left + x * cellWidth, top + row * cellHeight, cellWidth, cellHeight);
    }
  }
}

export function drawDefaultExplorerEyes(c, points, direction, look, visible) {
  const diagonal = direction === 1 || direction === 7;
  const mirror = direction === 7;
  const farName = mirror ? 'eyeR' : 'eyeL';
  const {head} = points;
  const palette = {
    k: '#352b2a', p: look.curseEyeColor ? '#902e39' : '#352b2a',
    g: look.eyeColor || '#506c59', w: look.curseEyeColor ? '#dc6b66' : '#fff1d9',
  };

  for (const name of ['eyeL', 'eyeR']) {
    if (!visible(name)) continue;
    const far = diagonal && name === farName;
    const eye = points[name];
    const kind = look.eyesClosed ? (far ? 'farClosed' : 'closed') : diagonal ? (far ? 'far' : 'near') : 'front';
    const rows = eyeRows[kind];
    const width = rows[0].length * eyeCellWidth;
    // Leave a skin gap at the bridge and keep the narrower far eye inside the cheek.
    const farOutset = mirror ? .5 : .9;
    const outward = diagonal ? (mirror === far ? 1 : -1) * (far ? farOutset : 1.05) : (name === 'eyeL' ? -.75 : .75);
    const brow = eye.y - head.y - (diagonal ? (far ? 1.65 : 3) : 1.8);
    const left = head.x + Math.round((eye.x - head.x + outward - width / 2) * 4) / 4;
    const top = head.y + Math.round((brow + (look.eyesClosed ? eyeCellHeight : 0)) * 4) / 4;
    if (!c.drawImage || typeof document === 'undefined') {
      paintEye(c, rows, palette, left, top, eyeCellWidth, eyeCellHeight, mirror);
      continue;
    }
    const key = [kind, mirror, palette.g, palette.p].join(':');
    let tile = eyeTiles.get(key);
    if (!tile) {
      tile = document.createElement('canvas');
      tile.width = rows[0].length;
      tile.height = rows.length;
      paintEye(tile.getContext('2d'), rows, palette, 0, 0, 1, 1, mirror);
      if (eyeTiles.size >= 32) eyeTiles.delete(eyeTiles.keys().next().value);
      eyeTiles.set(key, tile);
    }
    c.save();
    c.imageSmoothingEnabled = false;
    c.drawImage(tile, left, top, width, rows.length * eyeCellHeight);
    c.restore();
  }
}

const skullTiles = new Map();
const skullLeft = -7.5;
const skullTop = -6;
const skullWidth = 30;
const skullHeight = 23;

function inside(points, x, y) {
  let found = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [ax, ay] = points[i], [bx, by] = points[j];
    if ((ay > y) !== (by > y) && x < ax + (bx - ax) * (y - ay) / (by - ay)) found = !found;
  }
  return found;
}

function paintSkull(c, direction, skin, x, y, size) {
  const view = skullViews[direction <= 4 ? direction : 8 - direction];
  const mirror = direction > 4 ? -1 : 1;
  const back = direction >= 3 && direction <= 5;
  const colors = skinPalette(skin);
  const cover = (sx, sy) => inside(view, sx * mirror, sy);
  for (let row = 0; row < skullHeight; row++) {
    const sy = skullTop + row / 2 + .25;
    for (let col = 0; col < skullWidth; col++) {
      const sx = skullLeft + col / 2 + .25;
      if (!cover(sx, sy)) continue;
      const edge = !cover(sx - .53, sy) || !cover(sx + .53, sy) || !cover(sx, sy + .53) || !cover(sx, sy - .53);
      if (edge) c.fillStyle = colors.ink;
      else if (back || sy > 2.65 + sx * .15 || sx > 4.5 - sy * .16) c.fillStyle = colors.shadow;
      else if (sx < -1.2 + sy * .4 && sy < 1.9) c.fillStyle = colors.light;
      else c.fillStyle = colors.base;
      c.fillRect(x + col * size, y + row * size, size, size);
    }
  }
}

export function drawDefaultExplorerSkull(c, head, direction, skin) {
  const x = head.x + skullLeft, y = head.y + skullTop;
  if (!c.drawImage || typeof document === 'undefined') {
    paintSkull(c, direction, skin, x, y, .5);
    return;
  }
  const key = direction + ':' + skin;
  let tile = skullTiles.get(key);
  if (!tile) {
    tile = document.createElement('canvas');
    tile.width = skullWidth;
    tile.height = skullHeight;
    paintSkull(tile.getContext('2d'), direction, skin, 0, 0, 1);
    if (skullTiles.size >= 32) skullTiles.delete(skullTiles.keys().next().value);
    skullTiles.set(key, tile);
  }
  c.save();
  c.imageSmoothingEnabled = false;
  c.drawImage(tile, x, y, skullWidth / 2, skullHeight / 2);
  c.restore();
}
