import {GREYHAVEN} from './wild-castle-site.mjs';

const {drawbridge, door} = GREYHAVEN;
const width = drawbridge.right - drawbridge.left + 4;
const hingeY = drawbridge.top - 10;
const length = drawbridge.bottom - hingeY;
const layerCount = 9;
const screenLift = 74 / length;
const strip = typeof Image === 'undefined' ? null : new Image();
if (strip) strip.src = new URL('../assets/greyhaven/drawbridge-slices.png', import.meta.url).href;

const restDecks = new Map();

export function castleDrawbridgeProjection(progress) {
  const angle = Math.max(0, Math.min(1, progress)) * Math.PI / 2;
  const sine = Math.sin(angle);
  const cosine = Math.cos(angle);
  const depth = cosine - screenLift * sine;
  return {depth, lift: sine + screenLift * cosine, tipY: hingeY + length * depth};
}

function rect(c, x, y, w, h, color) {
  c.fillStyle = color;
  c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

function paintLayers(c, centerX, y, {depth, lift}) {
  c.save();
  c.imageSmoothingEnabled = false;
  c.translate(centerX, y);
  const frontFace = depth >= 0;
  // At edge-on the deck still presents its thickness. Give that face one
  // pixel of depth so nearest sampling retains it across the hinge turn.
  const scale = Math.abs(depth) < 1 / length ? (frontFace ? 1 : -1) / length : depth;
  c.scale(1, scale);
  for (let index = 0; index < layerCount; index++) {
    const layer = frontFace ? index : layerCount - 1 - index;
    c.drawImage(strip, layer * width, 0, width, length,
      -width / 2, -Math.round(layer * lift) / scale, width, length);
  }
  c.restore();
}

function paintFallback(c, depth) {
  const thickness = 6;
  const tip = hingeY + length * depth;
  const top = Math.min(hingeY, tip) - thickness;
  rect(c, door.x - width / 2, top, width, Math.abs(tip - hingeY) + thickness, '#40362b');
  for (let i = 0; i < 12; i++) {
    const a = hingeY + (tip - hingeY) * i / 12;
    const b = hingeY + (tip - hingeY) * (i + 1) / 12;
    const y = Math.min(a, b) - thickness;
    const h = Math.max(1, Math.abs(a - b) - 1);
    rect(c, drawbridge.left + 2, y, width - 8, h, i % 2 ? '#785b43' : '#876a4d');
    rect(c, drawbridge.left + 6 + i % 4 * 8, y + 1, 25 - i % 5 * 2, 1, '#b68b5769');
  }
}

function paintDeck(c, pose, progress) {
  if (strip?.naturalWidth !== width * layerCount || strip.naturalHeight !== length) {
    paintFallback(c, pose.depth);
    return;
  }
  if ((progress !== 0 && progress !== 1) || typeof document === 'undefined') {
    paintLayers(c, door.x, hingeY, pose);
    return;
  }
  if (!restDecks.has(progress)) {
    const offset = Math.ceil(Math.min(0, length * pose.depth) - (layerCount - 1) * pose.lift) - 2;
    const bottom = Math.ceil(Math.max(0, length * pose.depth)) + 2;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = bottom - offset;
    paintLayers(canvas.getContext('2d'), width / 2, -offset, pose);
    restDecks.set(progress, {canvas, offset});
  }
  const {canvas, offset} = restDecks.get(progress);
  c.drawImage(canvas, door.x - width / 2, hingeY + offset);
}

function oval(c, x, y, rx, ry, color) {
  c.fillStyle = color;
  c.beginPath();
  c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  c.fill();
}

function brace(c, x, footY, endX, endY, heavy = false) {
  c.beginPath();
  c.moveTo(x - 3, footY - 1);
  c.lineTo(x + 3, footY - 1);
  c.lineTo(endX + 4, endY);
  c.lineTo(endX - 4, endY);
  c.closePath();
  c.fillStyle = heavy ? '#352b27' : '#393a34';
  c.fill();
  c.beginPath();
  c.moveTo(x - 3, footY - 1);
  c.lineTo(x - 1, footY - 1);
  c.lineTo(endX - 1, endY);
  c.lineTo(endX - 4, endY);
  c.closePath();
  c.fillStyle = heavy ? '#8d6340' : '#787969';
  c.fill();
}

function paintMetalwork(c, pose) {
  const underside = pose.depth < -.05;
  const surfaceY = hingeY - (underside ? 1 : layerCount - 1) * pose.lift;
  const endY = surfaceY + (pose.tipY - hingeY);
  const reserve = 7 * Math.sign(pose.depth);
  if (Math.abs(endY - surfaceY) >= 12) {
    for (const side of [-1, 1]) {
      const x = door.x + side * 27;
      brace(c, x, surfaceY + reserve, underside ? door.x - side * 24 : x, endY - reserve, underside);
      for (const u of [.16, .47, .85]) {
        const boltX = underside ? door.x + side * (27 - 51 * u) : x;
        const boltY = surfaceY + (endY - surfaceY) * u;
        rect(c, boltX - 1, boltY - 1, 3, 3, '#3f4139');
        rect(c, boltX - 1, boltY - 1, 2, 1, '#b2aa8c');
      }
    }
    const y = endY - 7 * Math.sign(pose.depth);
    rect(c, door.x - 31, y - 1, 62, 3, '#4b4b41');
    rect(c, door.x - 29, y - 2, 58, 1, '#a29578');
  }
  rect(c, door.x - width / 2, hingeY - 4, width, 6, '#434940');
  rect(c, door.x - width / 2 + 1, hingeY - 4, width - 2, 2, '#a1a08b');
  for (const side of [-1, 1]) {
    const x = door.x + side * 37;
    oval(c, x, hingeY - 1, 7, 6, '#2f3937');
    oval(c, x, hingeY - 2, 5, 4, '#737567');
    rect(c, x - 2, hingeY - 4, 4, 3, '#a7a18b');
  }
}

function paintChain(c, side, pose, progress) {
  const socketX = door.x + side * 38, socketY = hingeY - 33;
  const hookX = door.x + side * 33;
  const hookY = pose.tipY - (pose.depth > 0 ? layerCount - 1 : 1) * pose.lift;
  oval(c, socketX + side * 1, socketY + 7, 10, 6, '#27353263');
  rect(c, socketX - 7, socketY - 6, 14, 13, '#565c50');
  rect(c, socketX - 6, socketY - 6, 12, 3, '#aaa28a');
  oval(c, socketX, socketY, 6, 6, '#3b433d');
  oval(c, socketX - 1, socketY - 1, 4, 4, '#7a7d6e');
  rect(c, socketX - 2, socketY - 3, 2, 2, '#b8aa8d');
  const links = Math.max(4, Math.round(Math.hypot(hookX - socketX, hookY - socketY) / 4));
  for (let i = 0; i <= links; i++) {
    const u = i / links;
    const slack = Math.sin(u * Math.PI) * (1 - progress) * 7;
    const x = socketX + (hookX - socketX) * u, y = socketY + (hookY - socketY) * u + slack;
    rect(c, x - (i % 2), y, i % 2 ? 4 : 2, 4, '#434a40');
    rect(c, x, y, i % 2 ? 3 : 1, 2, i % 2 ? '#a6a38d' : '#858977');
  }
  rect(c, hookX - 2, hookY - 2, 5, 5, '#777b69');
  rect(c, hookX - 1, hookY - 2, 3, 1, '#b8ad8c');
}

export function paintCastleDrawbridge(c, progress) {
  const pose = castleDrawbridgeProjection(progress);
  paintDeck(c, pose, progress);
  paintMetalwork(c, pose);
  for (const side of [-1, 1]) paintChain(c, side, pose, progress);
}
