import {drawOverlookHedge, drawOverlookHedgeGround} from './overlook-hedge-art.mjs';
import {overlookPartArt} from './overlook-maze.mjs';
import {drawStarterChest} from './starter-chest.mjs';
import {pixelPolygon} from './pixel-shapes.mjs';

const STEP = 12, PAD = 80, SOUTH = 58;
const grass = ['#405c3e', '#445f40', '#486242', '#4b6442'];
const dirt = ['#797452', '#7e7654', '#827957', '#857d58'];
const paving = ['#7d8072', '#8b8b79', '#95927e', '#828573'];
let groundRaster;

const hash = (x, y) => {
  const n = Math.imul(x + 677, 374761393) ^ Math.imul(y + 883, 668265263);
  return ((Math.imul(n ^ (n >>> 13), 1274126177) >>> 8) & 255) / 256;
};
const rect = (c, x, y, w, h, color) => { c.fillStyle = color; c.fillRect(x, y, w, h); };

function earthTone(x, y, ramp) {
  const field = Math.sin(x * .018 + y * .015) * .55 +
    Math.sin(y * .023 - x * .01) * .3 + Math.cos(y * .08 + x * .047) * .15;
  return ramp[Math.min(ramp.length - 1, Math.floor((field + 1) * ramp.length / 2))];
}

function walkDistance(points, x, y) {
  let distance = Infinity;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1], b = points[i];
    const dx = x - Math.max(Math.min(a.x, b.x), Math.min(x, Math.max(a.x, b.x)));
    const dy = y - Math.max(Math.min(a.y, b.y), Math.min(y, Math.max(a.y, b.y)));
    distance = Math.min(distance, dx * dx + dy * dy);
  }
  return distance;
}

function paintCourtyard(c, x, y) {
  const outline = [[-42,-48],[-29,-62],[29,-62],[42,-48],[42,48],[29,62],[-29,62],[-42,48]];
  const corners = outline.map(([dx, dy]) => ({x: x + dx, y: y + dy}));
  pixelPolygon(c, corners, '#555b49');
  c.save(); c.beginPath();
  for (const [i, q] of corners.entries()) i ? c.lineTo(q.x, q.y) : c.moveTo(q.x, q.y);
  c.closePath(); c.clip();
  for (let row = 0; row < 8; row++) for (let col = -1; col < 4; col++) {
    const px = x - 42 + col * 25 + (row % 2) * 12, py = y - 62 + row * 16, t = hash(col, row);
    rect(c, px + 1, py + 1, 24, 15, paving[Math.floor(t * 4)]);
    rect(c, px + 3, py + 2, 18, 1, '#a8a38b');
    rect(c, px + 2, py + 13, 20, 2, '#6e7463');
    if (t > .58) rect(c, px + 9, py + 9, 5, 2, '#6a785b');
  }
  c.restore();
  const base = [[-26, -19], [26, -19], [34, -10], [34, 15], [24, 26], [-24, 26], [-34, 15], [-34, -10]];
  pixelPolygon(c, base.map(([u,v]) => ({x:x+u,y:y+v+3})), '#505447');
  pixelPolygon(c, base.map(([u,v]) => ({x:x+u,y:y+v})), '#737463');
  pixelPolygon(c, base.map(([u,v]) => ({x:x+u*.9,y:y+v*.83-2})), '#a29a7e');
  rect(c, x - 23, y + 20, 46, 2, '#b6aa88');
  rect(c, x - 19, y + 24, 38, 2, '#596050');
  for (const dx of [-22,22]) {
    rect(c, x + dx - 3, y + 13, 6, 2, '#787a61');
    rect(c, x + dx, y + 11, 3, 5, '#d7c296');
  }
}

function paintThreshold(c, x, y, width) {
  const half = Math.floor(width / 2) - 2;
  pixelPolygon(c, [{x:x-half+9,y:y-69},{x:x+half-9,y:y-69},{x:x+half,y:y-56},
    {x:x+half,y:y+16},{x:x-half,y:y+16},{x:x-half,y:y-56}], '#655f47');
  for (let row = 0; row < 5; row++) {
    const py = y - 66 + row * 16;
    const inset = row === 0 ? 10 : 2;
    const first = x - half + inset, last = x + half - inset;
    for (let col = 0, px = first; px < last; col++, px += 19) {
      const w = Math.min(18, last - px);
      rect(c, px, py, w, 15, paving[(row * 3 + col * 5) % paving.length]);
      rect(c, px + 1, py + 1, Math.max(0,w - 3), 2, '#b1a88b');
      rect(c, px + 1, py + 12, Math.max(0,w - 2), 2, '#6c705e');
      if (hash(row,col) > .63) rect(c, px + 3, py + 9, Math.min(4,w - 3), 1, '#637854');
    }
  }
  rect(c, x - half + 2, y + 12, half * 2 - 4, 2, '#b7ad8e');
  rect(c, x - half, y + 15, half * 2, 2, '#595e4e');
}
function drawGardenRaster(c, maze, offsetX, offsetY) {
  const {w, h} = maze;
  const trail = maze.walk.map(p => ({x:p.x-maze.x,y:p.y-maze.y}));
  for (let py = -PAD; py < h + SOUTH; py += STEP) for (let px = -PAD; px < w + PAD; px += STEP) {
    const cx = px + STEP / 2, cy = py + STEP / 2;
    const inside = cx >= 0 && cx < w && cy >= 0 && cy < h;
    const path = inside || walkDistance(trail,cx,cy) < (23 + hash(px,py) * 5) ** 2;
    const edge = Math.max(-cx, cx - w, -cy, cy - h);
    const alpha = path ? 1 : Math.max(0, .82 - edge / 84 + hash(px, py) * .2);
    if (!alpha) continue;
    c.globalAlpha = alpha;
    rect(c, offsetX + px, offsetY + py, STEP, STEP, earthTone(cx, cy, path ? dirt : grass));
    const pick = hash(py, px);
    if (pick > .50) {
      const ax = offsetX + px + 2 + Math.floor(pick * 6), ay = offsetY + py + 2 + Math.floor(hash(px + 2,py) * 6);
      rect(c, ax, ay, pick > .82 ? 4 : 2, 1, path ? '#9b8963' : '#607650');
      if (pick > .75) rect(c, ax + 1, ay + 1, 2, 1, path ? '#6e684b' : '#354e39');
    }
  }
  c.globalAlpha = 1;
  paintThreshold(c, offsetX + maze.entrance.x - maze.x, offsetY + maze.opening.y - maze.y, maze.opening.right - maze.opening.left);
  paintCourtyard(c, offsetX + maze.chest.x - maze.x, offsetY + maze.chest.y - maze.y);
}

function gardenVisible(maze, visible) {
  return maze && visible({x: maze.x + maze.w / 2, y: maze.y + maze.h / 2}, maze.h / 2 + 140);
}

export function drawOverlookGarden(c, maze, visible, detail = true) {
  if (!gardenVisible(maze, visible)) return;
  if (!groundRaster && typeof document !== 'undefined') {
    groundRaster = document.createElement('canvas');
    groundRaster.width = maze.w + PAD * 2;
    groundRaster.height = maze.h + PAD + SOUTH;
    drawGardenRaster(groundRaster.getContext('2d'), maze, PAD, PAD);
  }
  if (groundRaster) c.drawImage(groundRaster, maze.x - PAD, maze.y - PAD);
  else drawGardenRaster(c, maze, maze.x, maze.y);
  for (const part of maze.parts) if (visible({x: part.x + part.w / 2, y: part.y + part.h / 2}, 40)) {
    const art = overlookPartArt(maze, part);
    if(detail)drawOverlookHedgeGround(c, art);
    else if(!art.broken)rect(c, part.x, part.y, part.w, part.h, '#355338');
  }
}

export function overlookSubjects(maze, visible, game) {
  if (!gardenVisible(maze, visible)) return [];
  const subjects = [];
  const party = game.players.filter(p => p.hp > 0 && !p.room && !p.trainRide);
  for (const part of maze.parts) if (visible({x: part.x + part.w / 2, y: part.y - 8}, 74)) {
    const art = overlookPartArt(maze, part);
    if (!art.broken) {
      const obscuresPlayer = party.some(p => p.x > part.x - 7 && p.x < part.x + part.w + 7 &&
        p.y < part.y + part.h && p.y > part.y - 56);
      subjects.push({hedge: art, depth: part.y + part.h, obscuresPlayer});
    }
  }
  if (visible(maze.chest, 80)) {
    const player = party.some(p => Math.hypot(p.x - maze.chest.x, p.y - maze.chest.y) <= 56);
    const prompt = player && !maze.state.opened ? (game.controlLabels?.interact || 'Interact') + ' · OPEN CHEST' : '';
    subjects.push({overlookChest: maze.chest, depth: maze.chest.y + 10, opened: maze.state.opened, prompt});
  }
  const sign = {x: maze.entrance.x + 97, y: maze.entrance.y - 19};
  if (visible(sign, 80)) subjects.push({overlookSign: sign, depth: sign.y + 2});
  return subjects;
}

export function drawOverlookSubject(c, subject) {
  if (subject.hedge) {
    if (subject.obscuresPlayer) { c.save(); c.globalAlpha *= .48; }
    drawOverlookHedge(c, subject.hedge);
    if (subject.obscuresPlayer) c.restore();
    return;
  }
  if (subject.overlookSign) {
    const {x, y} = subject.overlookSign;
    rect(c, x - 37, y - 3, 74, 5, '#283928aa');
    for (const dx of [-31, 25]) {
      rect(c, x + dx - 2, y - 2, 10, 6, '#5a5e4e');
      rect(c, x + dx - 1, y - 3, 8, 2, '#a39c78');
      rect(c, x + dx, y - 30, 6, 29, '#443629');
      rect(c, x + dx + 1, y - 27, 2, 26, '#9a7650');
    }
    const shape = [[-37,-37],[-32,-42],[-14,-42],[-9,-45],[9,-45],[14,-42],[32,-42],
      [37,-37],[37,-25],[32,-20],[-32,-20],[-37,-25]];
    pixelPolygon(c, shape.map(([dx,dy])=>({x:x+dx,y:y+dy})), '#292e25');
    pixelPolygon(c, shape.map(([dx,dy])=>({x:x+dx*.94,y:y-32+(dy+32)*.83})), '#6d5436');
    rect(c, x - 31, y - 40, 18, 1, '#bba16e');
    rect(c, x + 13, y - 40, 18, 1, '#bba16e');
    rect(c, x - 7, y - 43, 14, 1, '#ba9c66');
    rect(c, x - 30, y - 23, 60, 2, '#493d2d');
    for(const dx of [-30,29])rect(c, x + dx, y - 32, 2, 2, '#ccb17a');
    c.save(); c.textAlign = 'center'; c.font = 'bold 9px Georgia'; c.fillStyle = '#ead7a0';
    c.fillText('OVERLOOK', x, y - 28); c.restore();
    return;
  }
  const {x, y} = subject.overlookChest;
  rect(c, x - 24, y + 4, 48, 7, '#34382f66');
  c.save(); c.translate(x, y); c.scale(.37, .37); drawStarterChest(c, {x: 0, y: 0}, subject.opened ? 1 : 0); c.restore();
  if (!subject.opened) {
    rect(c, x - 1, y - 6, 2, 3, '#f3ad6f');
    rect(c, x, y - 6, 1, 1, '#e86766');
  }
  if (subject.prompt) {
    c.save(); c.font = '9px sans-serif'; c.textAlign = 'center';
    const width = c.measureText(subject.prompt).width + 12;
    rect(c, x - width / 2, y - 40, width, 15, '#172b24ef');
    c.fillStyle = '#fff1c8'; c.fillText(subject.prompt, x, y - 29); c.restore();
  }
}

export function drawOverlookClippings(c, effects, visible) {
  for (const fx of effects || []) {
    if (!fx.overlookClippings || !visible(fx, 40)) continue;
    const time = 1 - fx.life / fx.maxLife;
    c.save(); c.globalAlpha *= Math.min(1, fx.life * 4);
    for (let i = 0; i < 7; i++) {
      const x = (hash(fx.seed, i) - .5) * (16 + 27 * time), y = (hash(i, fx.seed) - .5) * (12 + 18 * time);
      const z = Math.sin(Math.PI * time) * (8 + 16 * hash(fx.seed + i, 7));
      rect(c, Math.round(fx.x + x), Math.round(fx.y + y - z), i % 3 ? 3 : 4, 2, ['#708c49','#9ea65e','#4d6b40'][i % 3]);
    }
    c.restore();
  }
}
