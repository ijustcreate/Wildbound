import {OVERLOOK_TRACE} from './overlook-maze-trace.mjs';

export const OVERLOOK_TILE = 32;
export const OVERLOOK_NORTH = -1760;
export const WILD_HOMESTEAD = Object.freeze({x: 8200, y: 7050});
export const OVERLOOK_AXE = 'cursed_axe';
export const OVERLOOK_BUCKET = 64;

const poster = {left: 47, top: 104, right: 405, bottom: 650};
const scale = 3.2, stroke = 8;
const within = (a, a1, b, b1) => a < b1 && b < a1;

function tracedWalls() {
  const horizontal = [], vertical = [];
  for (const [x1, y1, x2, y2] of OVERLOOK_TRACE) {
    if (y1 === y2) horizontal.push({left: x1, right: x2, top: y1 - stroke / 2, bottom: y1 + stroke / 2});
    else vertical.push({left: x1 - stroke / 2, right: x1 + stroke / 2, top: y1, bottom: y2});
  }
  const pieces = [];
  // Each junction belongs to the crossing horizontal hedge. Its two branches
  // meet the face at the same edge without hidden overlapping collision.
  for (const h of horizontal) {
    const breaks = [h.left, h.right];
    for (const v of vertical) {
      if (!within(v.top, v.bottom, h.top, h.bottom)) continue;
      if (v.left > h.left && v.left < h.right) breaks.push(v.left);
      if (v.right > h.left && v.right < h.right) breaks.push(v.right);
    }
    breaks.sort((a, b) => a - b);
    for (let i = 1; i < breaks.length; i++) {
      if (breaks[i] > breaks[i - 1]) pieces.push({...h, left: breaks[i - 1], right: breaks[i]});
    }
  }
  for (const v of vertical) {
    const cuts = horizontal.filter(h => within(h.left, h.right, v.left, v.right) && within(h.top, h.bottom, v.top, v.bottom))
      .sort((a, b) => a.top - b.top);
    const edges = new Set([v.left, v.right]);
    for (const h of cuts) {
      if (h.left > v.left) edges.add(h.left);
      if (h.right < v.right) edges.add(h.right);
    }
    const spans = [...edges].sort((a, b) => a - b);
    for (let i = 1; i < spans.length; i++) {
      const left = spans[i - 1], right = spans[i];
      let top = v.top;
      for (const h of cuts) {
        if (!within(h.left, h.right, left, right)) continue;
        if (h.top > top) pieces.push({left, right, top, bottom: h.top});
        top = Math.max(top, h.bottom);
      }
      if (top < v.bottom) pieces.push({left, right, top, bottom: v.bottom});
    }
  }
  return pieces;
}

const walls = tracedWalls();

function splitRun(left, top, right, bottom) {
  const w = right - left, h = bottom - top;
  const nx = Math.ceil(w / 34), ny = Math.ceil(h / 34);
  const pieces = [];
  for (let row = 0; row < ny; row++) for (let col = 0; col < nx; col++) {
    const x = Math.round(left + col * w / nx), y = Math.round(top + row * h / ny);
    const width = Math.round(left + (col + 1) * w / nx) - x;
    const height = Math.round(top + (row + 1) * h / ny) - y;
    if (width > 0 && height > 0) pieces.push({x,y,w:width,h:height});
  }
  return pieces;
}

function mergeShortPieces(pieces, axis, length, cross, depth) {
  const rows = new Map();
  for (const part of pieces) {
    const key = part[cross] + ':' + part[depth];
    if (!rows.has(key)) rows.set(key, []);
    rows.get(key).push(part);
  }
  return [...rows.values()].flatMap(row => {
    const merged = [];
    row.sort((a, b) => a[axis] - b[axis]);
    for (const p of row) {
      const before = merged.at(-1);
      if (before && before[axis] + before[length] === p[axis] &&
        Math.min(before[length], p[length]) < 17 && before[length] + p[length] <= 48) before[length] += p[length];
      else merged.push({...p});
    }
    return merged;
  });
}

function makeMaze(dx, dy) {
  const w = Math.round((poster.right - poster.left) * scale), h = Math.round((poster.bottom - poster.top) * scale);
  const x = 800 - Math.round(w / 2) + dx, y = 112 - h + dy;
  const mapX = px => x + (px - poster.left) * scale;
  const mapY = py => y + (py - poster.top) * scale;
  const cuts = walls.flatMap(r => splitRun(mapX(r.left), mapY(r.top), mapX(r.right), mapY(r.bottom)));
  const parts = mergeShortPieces(mergeShortPieces(cuts,'x','w','y','h'),'y','h','x','w');
  for (const [id, part] of parts.entries()) Object.assign(part, {id, seed:(id + 1) * 43, neighbors:[[],[],[],[]]});
  const opening = {left:Math.round(mapX(206)), right:Math.round(mapX(234)), y:mapY(108)};
  const southOpening = {left:Math.round(mapX(230)), right:Math.round(mapX(258)), y:Math.round(mapY(644))};
  for (const part of parts) {
    if (part.y <= opening.y && part.y + part.h > opening.y) {
      if (part.x + part.w === opening.left) part.entryEnd = 'left';
      if (part.x === opening.right) part.entryEnd = 'right';
    }
    if (part.y > southOpening.y || part.y + part.h <= southOpening.y) continue;
    const right=part.x+part.w;
    if (right>southOpening.left&&part.x<southOpening.right) {
      if (part.x<southOpening.left) part.w=southOpening.left-part.x;
      else if (right>southOpening.right) {part.x=southOpening.right;part.w=right-part.x;}
      else part.entranceGap=true; // Retain its index for stored hedge damage.
    }
    if (!part.entranceGap&&part.x+part.w===southOpening.left) part.southEntryEnd='left';
    if (!part.entranceGap&&part.x===southOpening.right) part.southEntryEnd='right';
  }
  const buckets = new Map();
  for (const p of parts) {
    if (p.entranceGap) continue;
    for (const other of parts) {
      if (p === other || other.entranceGap) continue;
      if (within(p.x, p.x + p.w, other.x, other.x + other.w)) {
        if (p.y === other.y + other.h) p.neighbors[0].push(other.id);
        if (p.y + p.h === other.y) p.neighbors[2].push(other.id);
      }
      if (within(p.y, p.y + p.h, other.y, other.y + other.h)) {
        if (p.x + p.w === other.x) p.neighbors[1].push(other.id);
        if (p.x === other.x + other.w) p.neighbors[3].push(other.id);
      }
    }
    for (let by = Math.floor((p.y - y) / OVERLOOK_BUCKET); by <= Math.floor((p.y + p.h - y) / OVERLOOK_BUCKET); by++) {
      for (let bx = Math.floor((p.x - x) / OVERLOOK_BUCKET); bx <= Math.floor((p.x + p.w - x) / OVERLOOK_BUCKET); bx++) {
        const k = bx + ':' + by;
        if (!buckets.has(k)) buckets.set(k, []);
        buckets.get(k).push(p);
      }
    }
  }
  const entrance = {x: Math.round(mapX(220)), y: y - 28};
  const chest = {x: Math.round(mapX(226)), y: Math.round(mapY(385))};
  const gate = {x: 800 + dx, y: 144 + dy};
  const outerX = x - 46, outerY = y - 43, southY = y + h + 18;
  const southEntrance={x:Math.round((southOpening.left+southOpening.right)/2),y:southOpening.y+29};
  const walk = [gate, {x:gate.x,y:southY}, {x:outerX,y:southY}, {x:outerX,y:outerY},
    {x:entrance.x,y:outerY}, {x:entrance.x,y:y+12}];
  const southWalk=[gate,{x:gate.x,y:southY},southEntrance,{x:southEntrance.x,y:southOpening.y-28}];
  const maze={x,y,w,h,buckets,parts,entrance,opening,southEntrance,southOpening,chest,gate,walk,southWalk};
  for(const part of parts)part.snow=Math.round(overlookSnowCoverage(maze,part.x+part.w/2,part.y+part.h/2)*3);
  return maze;
}

export const VILLA_OVERLOOK = makeMaze(0, 0);
export const WILDS_OVERLOOK = makeMaze(WILD_HOMESTEAD.x - 800, WILD_HOMESTEAD.y - 800);
const villaAccess = new WeakMap();

export function hasOverlookGarden(house) {
  if (!house || !(house.floorplanVersion >= 3)) return false;
  let hasGarden = villaAccess.get(house);
  if (hasGarden === undefined) {
    hasGarden = !!house.doors?.some(door => door.kind === 'gate' && door.y === 144 && door.x <= 800 && door.x + door.w >= 800);
    villaAccess.set(house, hasGarden);
  }
  return hasGarden;
}

export function overlookNorth(game) {
  return game.generatedEnvironment === 'house' && hasOverlookGarden(game.house) ? OVERLOOK_NORTH : 0;
}

export function inOverlookGround(maze, x, y, pad = 0) {
  return x >= maze.x - 76 - pad && x < maze.x + maze.w + 54 + pad &&
    y >= maze.y - 73 - pad && y < maze.gate.y + 8 + pad;
}

export function overlookSnowCoverage(maze, x, y) {
  if(!maze)return 0;
  const px=x-maze.x,py=y-maze.y;
  const front=maze.h*.5+Math.sin(px*.009)*46+Math.cos(px*.024+1)*18+Math.sin(px*.052)*7;
  const lip=Math.max(0,-px,px-maze.w,-py);
  return clampSnow((front-py+36)/72)*clampSnow(1-lip/74);
}

function clampSnow(value){return Math.max(0,Math.min(1,value));}
export const inOverlookSnow=(maze,x,y)=>overlookSnowCoverage(maze,x,y)>=.45;
