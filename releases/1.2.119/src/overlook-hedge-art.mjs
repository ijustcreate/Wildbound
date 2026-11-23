import {pixelPolygon} from './pixel-shapes.mjs';

// A trimmed woodland shrub. The two-unit pixel, flat receding crown and
// shadowed leaf clusters follow the native forest brush and house projection.
const PIXEL = 2, HEIGHT = 25, MARGIN = 2;
const ENTRY_CROWN = 6;
const NORTH = 1, EAST = 2, SOUTH = 4, WEST = 8;
const CACHE_LIMIT = 176;
const INK = '#203a29', CORE = '#2b4933', SHADE = '#34563a';
const FROND = '#426741', FACE = '#4c7546', CROWN = '#5a8049';
const LIT = '#6f9652', TIP = '#86a861', MUTED = '#59754a';
const WOOD = '#514633', BARK = '#745b3c', CUT = '#b28a52';
const stamps = new Map();

// Contiguous, uneven scales keep each patch legible in the broad green planes.
const LEAVES = [
  ['..a..', '.aaa.', 'abbba', '.bb..'],
  ['.aa..', 'aaab.', '.bbba', '..b..'],
  ['..aa.', '.aaaa', 'abbba', '.b...'],
  ['.aa.', 'aaaa', '.bba'],
];

function rect(c, x, y, w, h, color) {
  c.fillStyle = color;
  c.fillRect(x, y, w, h);
}

function polygon(c, points, color) {
  pixelPolygon(c, points.map(([x, y]) => ({x, y})), color);
}

function leaf(c, x, y, shape, light, shade, twin = false) {
  const rows = LEAVES[shape & 3];
  for (let row = 0; row < rows.length; row++) {
    const stride = twin && row === 1 ? 1 : 0;
    const pixels = rows[row];
    for (let i = 0; i < pixels.length;) {
      const pixel = pixels[i];
      let end = i + 1;
      while (pixels[end] === pixel) end++;
      if (pixel !== '.') rect(c, x + i + stride, y + row, end - i, 1, pixel === 'a' ? light : shade);
      i = end;
    }
  }
}

function paintCut(c, w, d, variant) {
  const x = Math.floor(w / 2), y = HEIGHT + d - 5;
  polygon(c, [[1, y], [4, y - 3], [w - 4, y - 3], [w - 1, y + 1],
    [w - 2, y + 3], [3, y + 3]], '#273e2b');
  polygon(c, [[3, y + 1], [5, y - 2], [x + 2, y - 3], [w - 3, y],
    [w - 4, y + 2], [6, y + 2]], FROND);
  leaf(c, 1, y - 3, variant, FACE, SHADE);
  leaf(c, w - 6, y - 2, variant + 1, FACE, SHADE);
  for (const [dx, dy, length] of [[-3, 1, 4], [1, 0, 6], [3, 1, 3]]) {
    rect(c, x + dx, y + dy - length, 2, length, WOOD);
    rect(c, x + dx, y + dy - length, 1, Math.max(1, length - 2), BARK);
    rect(c, x + dx, y + dy - length, 2, 1, CUT);
  }
  rect(c, x - 6, y + 3, 3, 1, MUTED);
  rect(c, x + 4, y + 4, 3, 1, BARK);
}

function paintHedge(c, w, d, mask, variant, damage) {
  if (damage === 3) return paintCut(c, w, d, variant);
  const west = Boolean(mask & WEST), east = Boolean(mask & EAST);
  const north = Boolean(mask & NORTH), south = Boolean(mask & SOUTH);
  const left = west ? 0 : 1, right = east ? w : w - 1;
  const rear = north ? 0 : 1, front = d + (south ? 0 : 1);
  const bottom = d + HEIGHT;

  // Taper the free ends around the woody feet and keep connected edges flush.
  const topLeft = left + (west || north ? 0 : 2);
  const topRight = right - (east || north ? 0 : 2);
  polygon(c, [[topLeft, rear], [topRight, rear], [right, rear + (east ? 0 : 2)],
    [right, bottom - (east ? 1 : 3)], [right - (east ? 0 : 2), bottom],
    [left + (west ? 0 : 2), bottom], [left, bottom - (west ? 1 : 3)],
    [left, rear + (west ? 0 : 2)]], INK);

  const faceL = left + (west ? 0 : 1), faceR = right - (east ? 0 : 1);
  polygon(c, [[faceL, front - 3], [faceR, front - 3], [faceR, bottom - 4],
    [faceR - (east ? 0 : 1), bottom - 2], [faceL + (west ? 0 : 1), bottom - 2],
    [faceL, bottom - 4]], CORE);
  polygon(c, [[faceL, front - 2], [faceR, front - 2], [faceR, front + 9],
    [faceR - (east ? 0 : 3), front + 13], [w * .54, front + 16],
    [faceL + (west ? 0 : 2), front + 18], [faceL, front + 16]], SHADE);
  polygon(c, [[faceL, front], [faceR, front], [faceR, front + 5],
    [w * .68, front + 9], [w * .47, front + 8], [faceL, front + 12]], FROND);

  // The top is a larger lit mass with a short rounded lip over the side plane.
  polygon(c, [[topLeft, rear], [topRight, rear], [faceR, rear + (east ? 0 : 2)],
    [faceR, front - (east || south ? 0 : 2)], [faceR - (east || south ? 0 : 2), front],
    [faceL + (west || south ? 0 : 2), front], [faceL, front - (west || south ? 0 : 2)],
    [faceL, rear + (west ? 0 : 2)]], CROWN);
  if (!north) {
    const low = 2 + variant % 3, step = w * (.36 + (variant % 4) * .08);
    polygon(c, [[topLeft, rear + 1], [step + 3, rear + 1], [faceR - (east ? 0 : 2), low],
      [step + 2, low + 3], [step - 1, low + 1], [faceL, low + (variant & 1)]], LIT);
    const tuft = 3 + variant * 5 % Math.max(1, w - 7);
    rect(c, tuft, rear - 1, 4, 2, CROWN);
    rect(c, tuft + 1, rear - 1, 2, 1, LIT);
  }
  if (!south) {
    polygon(c, [[faceL, front - 3], [w * .4, front - 2], [w * .63, front - 4],
      [faceR, front - 3], [faceR - (east ? 0 : 1), front + 1],
      [w * .65, front + 1], [w * .43, front + 2], [faceL + (west ? 0 : 1), front + 1]], FACE);
  }
  if (!east) {
    polygon(c, [[faceR - 2, front + 1], [faceR, front + 1], [faceR, bottom - 5],
      [faceR - 1, bottom - 3], [faceR - 3, bottom - 4], [faceR - 3, front + 8]], SHADE);
  }
  if (!west) {
    rect(c, faceL - 1, front + 4, 1, 7, SHADE);
    rect(c, faceL, front + 5, 1, 4, FACE);
  }

  // A few foliage clusters break the planes. The cap stays clearly shorn.
  for (let col = 0; col < Math.max(1, Math.floor(w / 8)); col++) {
    const x = 2 + col * 7 + (variant + col * 2) % 3, lift = (col * 3 + variant) % 4;
    const capY = Math.max(2, Math.floor(d * .24) + lift);
    leaf(c, x, capY, variant + col, LIT, FACE, true);
    leaf(c, x - 1, Math.floor(d * .56) + (lift & 1), variant + col + 2, CROWN, FACE);
    if ((col + variant) % 3 === 0) rect(c, x + 1, capY, 2, 1, TIP);
    leaf(c, x - (lift & 1), front + 3 + lift, variant + col, FACE, SHADE);
    leaf(c, x - 1, front + 14 - lift, variant + col + 2, FROND, CORE);
    if (lift !== 2) leaf(c, x + 1, bottom - 7 - (lift & 1), variant + col + 1, SHADE, CORE);
  }
  if (!south) {
    const foot = 3 + variant * 7 % Math.max(1,w - 6), length = 3 + (variant & 1);
    rect(c, foot, bottom - length, 2, length, WOOD);
    if (variant % 3 !== 1) rect(c, foot, bottom - length + 1, 1, length - 1, BARK);
  }
  if (damage > 0) {
    const leftCut = variant % 2 === 0, width = Math.max(2, Math.floor(w / 4));
    const x = leftCut ? faceL + 1 : faceR - width;
    const y = front + 8 - (damage === 2 ? 2 : 0);
    polygon(c, [[x, y], [x + width, y + 2], [x + width - 1, y + 7],
      [x + 1, y + 11], [x, y + 7]], INK);
    rect(c, x + 1, y + 2, 1, 6, BARK);
    rect(c, x + 1, y + 2, 2, 1, CUT);
    if (damage === 2) {
      rect(c, x + width - 2, y + 4, 1, 5, BARK);
      rect(c, x + width - 2, y + 4, 1, 1, CUT);
      leaf(c, x - 1, y + 9, variant, FACE, SHADE);
    }
  }
}

// The two hand-trimmed entrance ends curve toward the gap. Keep the lighting
// anchored on the screen's upper left even when the pruning pattern turns.
function paintEntryHedge(c, w, d, side, variant, damage) {
  const bottom = d + HEIGHT, reverse = side === 'right';
  const profile = (points, color) => polygon(c, points.map(([u, y]) => {
    const x = Math.round(u * (w - 1));
    return [reverse ? w - 1 - x : x, y];
  }), color);
  profile([[0,1],[.18,0],[.38,-4],[.55,-6],[.73,-6],[.86,-4],[.94,-1],[1,4],
    [1,d+4],[.94,d+8],[.91,bottom-5],[.78,bottom],[.16,bottom],[0,bottom-2]], INK);
  profile([[0,2],[.19,1],[.41,-3],[.58,-5],[.72,-5],[.87,-2],[.94,3],
    [.94,d+4],[.875,d+9],[.86,bottom-5],[.76,bottom-2],[0,bottom-2]], CORE);
  profile([[0,d-2],[.22,d-2],[.48,d-1],[.7,d-3],[.91,d-1],[.91,d+7],
    [.85,d+13],[.84,bottom-6],[.66,bottom-4],[.37,bottom-5],[0,bottom-6]], SHADE);
  // Lower rounded ridge, shallow paired grooves, and the larger curved crown.
  profile([[0,d+6],[.27,d+8],[.5,d+9],[.76,d+7],[.88,d+4],[.88,d+10],
    [.74,d+14],[.52,d+16],[.3,d+14],[0,d+11]], FROND);
  profile([[0,d+2],[.25,d+4],[.46,d+6],[.67,d+5],[.85,d+2],[.92,d-1],
    [.92,d+3],[.81,d+7],[.61,d+9],[.43,d+9],[.25,d+7],[0,d+5]], CORE);
  profile([[0,1],[.2,0],[.42,-4],[.57,-5],[.74,-4],[.87,-2],[.94,3],
    [.94,d-1],[.86,d+3],[.66,d+6],[.45,d+7],[.21,d+5],[0,d+1]], FACE);
  profile([[0,1],[.2,0],[.42,-4],[.57,-5],[.74,-4],[.87,-2],[.91,2],
    [.88,d-5],[.69,d-1],[.47,d],[.2,d-2],[0,d-4]], CROWN);
  if (reverse) {
    profile([[.8,-3],[.91,-1],[.93,4],[.89,d-4],[.75,d-1],
      [.55,d-1],[.7,d-5],[.77,1]], LIT);
  } else {
    profile([[.18,0],[.42,-4],[.57,-5],[.72,-4],[.59,-1],[.46,2],
      [.41,d-5],[.28,d-3],[.1,d-5],[.13,3]], LIT);
  }
  const litX = Math.max(2, Math.floor(w * .22));
  const leafX = Math.min(w - 6, Math.floor(w * .47));
  leaf(c, litX, 1, variant, LIT, CROWN);
  leaf(c, leafX, d - 8, variant + 2, CROWN, FACE);
  leaf(c, litX, d + 9, variant + 1, FACE, FROND);
  leaf(c, leafX, d + 17, variant, FROND, CORE);
  rect(c, litX + 1, 1, 2, 1, TIP);
  rect(c, leafX + 1, bottom - 4, 2, 3, WOOD);
  if (damage > 0) {
    rect(c, leafX, d + 6, 4, damage + 4, INK);
    rect(c, leafX + 1, d + 7, 1, damage + 2, BARK);
    rect(c, leafX + 1, d + 7, 2, 1, CUT);
  }
}

function drawStamp(c, part, damage) {
  const {x, y, w = 32, h = 32, mask = 0, seed = 0} = part;
  const width = Math.max(8, Math.round(w / PIXEL)), depth = Math.max(8, Math.round(h / PIXEL));
  const mixed = Math.imul((seed | 0) ^ 0x9e3779b9, 0x45d9f3b);
  const entry = damage !== 3 && (part.entryEnd === 'left' || part.entryEnd === 'right') ? part.entryEnd : '';
  const cap = MARGIN + (entry ? ENTRY_CROWN : 0);
  const variant = (mixed ^ (mixed >>> 16)) & 7, key = `${width}:${depth}:${mask & 15}:${variant}:${damage}:${entry}`;
  let stamp = stamps.get(key);
  if (!stamp) {
    const paint = pen => entry ? paintEntryHedge(pen, width, depth, entry, variant, damage) :
      paintHedge(pen, width, depth, mask & 15, variant, damage);
    if (typeof OffscreenCanvas === 'undefined' && typeof document === 'undefined') {
      c.save();
      if (entry) {
        c.beginPath(); c.rect(x, y - (HEIGHT + cap) * PIXEL, w, h + (HEIGHT + cap + MARGIN) * PIXEL); c.clip();
      }
      c.translate(x, y - HEIGHT * PIXEL); c.scale(PIXEL, PIXEL);
      paint(c);
      c.restore();
      return;
    }
    const cols = width + MARGIN * 2, rows = depth + HEIGHT + cap + MARGIN;
    stamp = typeof OffscreenCanvas === 'undefined' ? document.createElement('canvas') : new OffscreenCanvas(cols, rows);
    if (stamp.width !== cols) stamp.width = cols;
    if (stamp.height !== rows) stamp.height = rows;
    const pen = stamp.getContext('2d');
    pen.translate(MARGIN, cap);
    paint(pen);
    if (stamps.size >= CACHE_LIMIT) stamps.delete(stamps.keys().next().value);
    stamps.set(key, stamp);
  }
  if (entry) {
    c.save();
    c.beginPath(); c.rect(x, y - (HEIGHT + cap) * PIXEL, w, h + (HEIGHT + cap + MARGIN) * PIXEL); c.clip();
  }
  const smoothing = c.imageSmoothingEnabled;
  c.imageSmoothingEnabled = false;
  c.drawImage(stamp, Math.round(x - MARGIN * PIXEL), Math.round(y - (HEIGHT + cap) * PIXEL),
    stamp.width * PIXEL, stamp.height * PIXEL);
  c.imageSmoothingEnabled = smoothing;
  if (entry) c.restore();
}

export function drawOverlookHedgeGround(c, part) {
  const {x, y, w = 32, h = 32, mask = 0, broken = false} = part;
  if (broken) {
    rect(c, x + 5, y + h - 14, w - 6, 13, '#152b2349');
    drawStamp(c, part, 3);
    return;
  }
  rect(c, x, y, w, h, '#162a2048');
  if (!(mask & EAST) && part.entryEnd !== 'left') {
    rect(c, x + w, y + 4, 5, h - 3, '#162a2055');
    rect(c, x + w + 5, y + 7, 3, h - 5, '#162a2033');
  }
  if (!(mask & SOUTH)) {
    const inner = part.entryEnd === 'left' ? 2 : 0;
    rect(c, x + 2, y + h, w - inner, 4, '#162a2060');
    rect(c, x + 5, y + h + 4, w - 4 - inner, 3, '#162a203a');
  }
}

export function drawOverlookHedge(c, part) {
  if (part.broken) return;
  const damage = part.damage >= .6 ? 2 : part.damage >= .28 ? 1 : 0;
  drawStamp(c, part, damage);
}

export const overlookHedgeCacheStats = () => ({entries: stamps.size, limit: CACHE_LIMIT});
