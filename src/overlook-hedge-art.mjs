import {pixelPolygon} from './pixel-shapes.mjs';

// A trimmed woodland shrub. The two-unit pixel, flat receding crown and
// shadowed leaf clusters follow the native forest brush and house projection.
const PIXEL = 2, HEIGHT = 25, MARGIN = 2;
const ENTRY_CROWN = 6;
const NORTH = 1, EAST = 2, SOUTH = 4, WEST = 8;
const CACHE_LIMIT = 176;
const INK = '#203a29', CORE = '#2b4933', SHADE = '#34563a';
const FROND = '#426841', FACE = '#517747', CROWN = '#61844d';
const LIT = '#7c9a56', TIP = '#96ab68', MUTED = '#59754a';
const WOOD = '#514633', BARK = '#745b3c', CUT = '#b28a52';
const SNOW_SHADE='#89a5a7',SNOW='#b8cfd2',SNOW_LIT='#d8e9e7';
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

function paintPackedSnow(c,left,rear,right,front,variant,coverage){
  const span=right-left,depth=front-rear;
  if(span<4||depth<3)return;
  if(coverage===1){
    leaf(c,left+1,rear+1,variant,SNOW,SNOW_SHADE);
    if(span>9)leaf(c,right-5,front-5,variant+2,SNOW_LIT,SNOW_SHADE);
    return;
  }
  const x=coverage===3?left:left+1;
  const end=coverage===3?right:right-2;
  const middle=x+(end-x)*(.37+(variant%3)*.09);
  const fall=coverage===3?front:rear+Math.max(3,Math.floor(depth*.64));
  polygon(c,[[x,rear+1],[x+2,rear],[end-1,rear],[end,rear+2],[end,fall-2],
    [end-2,fall],[middle+2,fall-1],[middle,fall+1],[x+1,fall-1],[x,fall-3]],SNOW_SHADE);
  polygon(c,[[x,rear+1],[end-1,rear+1],[end-1,fall-3],[end-3,fall-2],
    [middle+1,fall-3],[middle-1,fall-1],[x+1,fall-2],[x,fall-3]],SNOW);
  rect(c,x+1,rear+1,Math.max(1,Math.floor(span*.46)),1,SNOW_LIT);
  if(depth>7)leaf(c,Math.round(middle),rear+2,variant+1,SNOW_LIT,SNOW);
  if(coverage===3&&depth>6){
    rect(c,Math.round(middle+1),fall,2,2,SNOW_SHADE);
    if(variant%2)rect(c,end-3,fall-1,2,2,SNOW);
  }
}

function paintHedge(c, w, d, mask, variant, damage, snow) {
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

  // Long side-facing runs have their own clipped shoulder and shaded base.
  const flank = (x, leftSide) => {
    const shade=leftSide?FACE:SHADE, light=leftSide?LIT:CROWN;
    for (let y=3; y<d-1; y+=5) {
      const step=(y+variant*2)%3, edgeAt=x+(leftSide?step:-step);
      rect(c,edgeAt,y,2,Math.min(4,d-y),shade);
      if ((y+variant)%3!==0) rect(c,edgeAt+(leftSide?2:-1),y+1,2,Math.min(2,d-y-1),light);
    }
  };
  if (!west) flank(faceL,true);
  if (!east) flank(Math.max(2,faceR-2),false);

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
  for(let y=8;y<d-5;y+=9){
    const mid=Math.floor(w*.42)+(variant+y)%3-1;
    leaf(c,Math.min(w-6,Math.max(2,mid-2)),y,variant+y,FACE,SHADE);
    if((y+variant)%4===0)rect(c,Math.min(w-4,mid),y-1,2,1,LIT);
  }
  if (!south) {
    const foot = 3 + variant * 7 % Math.max(1,w - 6), length = 3 + (variant & 1);
    rect(c, foot, bottom - length, 2, length, WOOD);
    if (variant % 3 !== 1) rect(c, foot, bottom - length + 1, 1, length - 1, BARK);
  }
  if(snow===3&&!south){
    const l=faceL+1,r=faceR-1,span=r-l;
    const first=l+Math.max(2,Math.round(span*.27)),last=r-Math.max(2,Math.round(span*.24));
    const drift=Math.min(bottom-3,front+13+variant%4);
    polygon(c,[[l,front-3],[r,front-3],[r,drift-4],[last+1,drift-4],
      [last,drift+1],[first+1,drift-2],[first,drift],[l,drift-5]],SNOW_SHADE);
    polygon(c,[[l,front-3],[r-1,front-3],[r-1,drift-7],[last,drift-5],
      [last-1,drift-3],[first,drift-5],[l,drift-7]],SNOW);
    if(span>10){
      leaf(c,first+1,front+3,variant,SNOW_LIT,SNOW);
      rect(c,last-2,drift-6,3,1,SNOW_LIT);
    }
  }
  if(snow)paintPackedSnow(c,topLeft,rear,topRight,Math.max(rear+3,front-2),variant,snow);
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
function paintEntryHedge(c, w, d, side, variant, damage, snow) {
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
  if(snow){
    const spill=snow===3?d-4:Math.max(3,Math.floor(d*.52));
    profile([[.08,1],[.27,-1],[.49,-5],[.69,-5],[.85,-3],[.92,2],[.89,spill-1],
      [.76,spill+2],[.57,spill],[.39,spill+2],[.18,spill],[.08,spill-2]],SNOW_SHADE);
    profile([[.12,1],[.28,-1],[.5,-4],[.69,-4],[.83,-2],[.9,2],[.86,spill-2],
      [.68,spill],[.53,spill-2],[.35,spill],[.15,spill-2]],SNOW);
    profile([[.32,-1],[.48,-4],[.7,-4],[.71,-3],[.47,-2],[.34,1]],SNOW_LIT);
  }
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
  const snow=damage===3?0:Math.max(0,(part.snow||0)-(damage===2?1:0));
  const variant = (mixed ^ (mixed >>> 16)) & 7, key = `${width}:${depth}:${mask & 15}:${variant}:${damage}:${entry}:${snow}`;
  let stamp = stamps.get(key);
  if (!stamp) {
    const paint = pen => entry ? paintEntryHedge(pen, width, depth, entry, variant, damage, snow) :
      paintHedge(pen, width, depth, mask & 15, variant, damage, snow);
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
  const {x, y, w = 32, h = 32, mask = 0, broken = false,snow=0} = part;
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
    for(let i=0;i<2;i++){
      const px=x+4+((part.seed||0)+i*13)%Math.max(1,w-9),py=y+h+3+i*3;
      rect(c,px,py,snow>1?6:4,2,snow?'#9caeb0':'#4f633b');
      rect(c,px+1,py-1,snow>1?4:2,1,snow?'#c7dcdd':'#718052');
    }
  }
}

export function drawOverlookHedge(c, part) {
  if (part.broken) return;
  const damage = part.damage >= .6 ? 2 : part.damage >= .28 ? 1 : 0;
  drawStamp(c, part, damage);
}

export const overlookHedgeCacheStats = () => ({entries: stamps.size, limit: CACHE_LIMIT});
