import {forestHash as hash, forestNoise as noise, forestWind, clearingDistance, routeDistance} from './forest-landscape.mjs';

const rect = (c, x, y, w, h, color) => {
  c.fillStyle = color; c.fillRect(Math.round(x), Math.round(y), Math.ceil(w), Math.ceil(h));
};
function polygon(c, points, color) {
  c.fillStyle = color; c.beginPath();
  points.forEach(([x, y], i) => i ? c.lineTo(Math.round(x), Math.round(y)) : c.moveTo(Math.round(x), Math.round(y)));
  c.closePath(); c.fill();
}
const groundCache = new WeakMap();
export const hasForestLandscape = g => !!g.forestLandscape && (g.generatedEnvironment || g.environment || 'forest') === 'forest';
const grassColors = ['#365744', '#426344', '#557346', '#668348', '#7e944e', '#94a358'];

function paving(c, plan, cx, cy, rx, ry, seed) {
  const cells = plan.paving.cells;
  for (let y = -12; y < 12; y++) for (let x = -12; x < 12; x++) {
    const px = cx + x * 12, py = cy + y * 9;
    if ((x * 12 / rx) ** 2 + (y * 9 / ry) ** 2 > .8 + noise(x * .3, y * .3, seed) * .4) continue;
    const v = cells[(y + 12) * 24 + x + 12];
    if (!v) continue;
    rect(c, px, py + 1, 11, 8, '#536452');
    rect(c, px, py, 10, 6, v === 2 ? '#a4ac87' : '#879775');
    rect(c, px, py, 8, 1, '#bdc09a');
    if (hash(x + seed, y) > .6) rect(c, px + 6, py + 3, 5, 3, '#718c4d');
  }
}

export function drawLandscapeGround(c, g, bounds) {
  const plan = g.forestLandscape;
  let entry = groundCache.get(plan);
  if(entry&&entry.terrain!==g.terrain&&entry.terrainKey===g.terrain.join(','))entry.terrain=g.terrain;
  if (!entry || entry.terrain !== g.terrain) {
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 1600;
    const ctx = canvas.getContext('2d'); ctx.imageSmoothingEnabled = false;
    for (let y = 0; y < 1600; y += 8) for (let x = 0; x < 1600; x += 8) {
      const large = noise(x / 235, y / 235, plan.seed);
      const detail = noise(x / 45, y / 45, plan.seed + 23);
      const clear = clearingDistance(x, y, plan.seed);
      const light = Math.max(0, 1 - clear) * .28;
      const n = large * .75 + detail * .25 + light;
      const path = routeDistance(plan, x, y), edge = 23 + noise(x / 70, y / 70, plan.seed) * 16;
      let color = grassColors[Math.min(5, Math.floor(n * 6))];
      if (path < edge || clear < .92) color = ['#89975d', '#929d64', '#9ca56d'][Math.min(2, Math.floor(detail * 3))];
      if (path < edge - 10 && clear > 1) color = ['#8a9270', '#969b78', '#a4a481'][Math.min(2, Math.floor(detail * 3))];
      rect(ctx, x, y, 8, 8, color);
      if (hash(x, y + plan.seed) > .65) rect(ctx, x + 2, y + 4, 3, 1, path < edge ? '#b7b38a' : '#a4b06c');
    }
    paving(ctx, plan, 800, 816, 137, 99, plan.seed);
    for (const l of plan.landmarks) paving(ctx, plan, l.x, l.y, 138, 108, l.seed);
    // Ground litter uses contextual clusters rather than one mark per tile.
    for (const p of g.scenery) {
      if (p.kind === 'forest_ruin') {
        for (let i = 0; i < 28; i++) {
          const x = p.x + (hash(i, p.seed) - .5) * (p.width + 55), y = p.y + hash(p.seed, i) * 24;
          rect(ctx, x, y + 2, 5 + hash(i, 1) * 8, 3, '#46594b');
          rect(ctx, x, y, 5 + hash(i, 1) * 8, 3, i % 3 ? '#82917a' : '#a4ab8c');
        }
      }
      if (p.kind !== 'tree') continue;
      const by = p.rootY ?? p.y + p.size * .35;
      for (let i = 0; i < 52; i++) {
        const x = p.x + (hash(p.x, i) - .5) * p.size, y = by + (hash(i, p.y) - .5) * p.size * .55;
        if (g.terrain[Math.floor(y / 32) * 50 + Math.floor(x / 32)] !== 'grass') continue;
        rect(ctx, x, y, 2 + hash(i, p.x) * 3, 2, p.autumnAccent || p.season === 'autumn' ? ['#b4a355', '#ac784b', '#775b42'][i % 3] : ['#71834d', '#8e9659', '#586d43'][i % 3]);
      }
      for(const sign of [-1,1])for(let step=0;step<9;step++){
        const x=p.x+sign*step*4,y=by+step*1.3+Math.sin(step*.8)*2;
        if(g.terrain[Math.floor(y/32)*50+Math.floor(x/32)]!=='grass')continue;
        rect(ctx,x,y,5,Math.max(1,4-step*.35),'#536348');
        rect(ctx,x,y,4,1,p.treeType==='birch'?'#b1b89b':'#8c8b60');
      }
    }
    entry = {canvas, terrain: g.terrain, terrainKey:g.terrain.join(',')}; groundCache.set(plan, entry);
  }
  const {sx, sy, ex, ey} = bounds;
  c.drawImage(entry.canvas, sx * 32, sy * 32, (ex - sx) * 32, (ey - sy) * 32,
    sx * 32, sy * 32, (ex - sx) * 32, (ey - sy) * 32);
}

export function drawForestBank(c, g, x, y, kind) {
  if (!['shallow', 'water', 'floodbridge'].includes(kind)) return;
  const terrain = g.terrain, tx = x / 32, ty = y / 32;
  for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
    if (terrain[(ty + dy) * 50 + tx + dx] !== 'grass') continue;
    for (let k = 0; k < 32; k += 4) {
      const depth = 3 + Math.floor(noise((x + k) / 38, (y + k) / 38, g.seed) * (kind==='shallow'?22:4));
      const px = dx ? x + (dx < 0 ? 0 : 32 - depth) : x + k;
      const py = dy ? y + (dy < 0 ? 0 : 32 - depth) : y + k;
      rect(c, px, py + 2, dx ? depth : 4, dy ? depth : 4, '#315b4b');
      rect(c, px, py, dx ? depth : 4, dy ? depth : 4, '#7c9561');
      if (hash(px, py) > .65) rect(c, px, py - 2, 2, 4, '#b0b777');
      if(kind==='shallow'&&hash(px,py+g.seed)>.93){rect(c,px-2,py+3,7,4,'#446962');rect(c,px-2,py+1,6,3,'#9da989');}
    }
  }
  // World-coordinate streamlets travel downstream without restarting at tile edges.
  c.save(); c.beginPath(); c.rect(x, y, 32, 32); c.clip();
  for (let py = Math.floor((y - g.time * 12) / 47) * 47 + g.time * 12; py < y + 32; py += 47) {
    const px = Math.floor(x / 19) * 19 + Math.sin(py * .012 + g.seed) * 5;
    rect(c, px, py, 2, 9, '#a8d7b955'); rect(c, px + 12, py + 16, 1, 6, '#d4e9bf66');
  }
  c.restore();
}

export function drawCanopyShadow(c, p, g) {
  const base = p.rootY ?? p.y + p.size * .35;
  if (p.fallen) {rect(c, p.x - 9, base, 25, 5, '#173e3444'); return;}
  const s = p.size / 64, wind = forestWind(p.x, base, g.time) * 2;
  c.save(); c.globalAlpha *= .24;
  polygon(c, [[p.x - 4, base], [p.x + 6, base], [p.x + 53 * s, base + 23 * s], [p.x + 45 * s, base + 29 * s]], '#173d3b');
  for (let row = -12; row < 13; row += 3) {
    const span = Math.sqrt(Math.max(0, 1 - row * row / 169)) * 25;
    const x = p.x + (40 + row * .6 - span) * s + wind, y = base + (18 + row) * s;
    rect(c, x, y, (span * 2 + hash(row, p.x) * 3) * s, 3 * s, '#163b37');
  }
  c.restore();
}

export function drawLandscapeCover(c, g, visible) {
  const plan = g.forestLandscape;
  for (const p of plan.cover) {
    if (!visible(p) || (g.bloom < 3 && Math.hypot(p.x - 800, p.y - 800) > g.bloom * 430)) continue;
    const wind = Math.round(forestWind(p.x, p.y, g.time) * 2);
    const shade = noise(p.x / 235, p.y / 235, plan.seed) < .45;
    if (p.kind === 'fern') {
      for (let i = 0; i < 4; i++) for (const sign of [-1, 1]) {
        rect(c, p.x + sign * i * 2 + wind, p.y - i * 2, 4, 2, shade ? '#447553' : '#6d9653');
        rect(c, p.x + sign * i * 2 + wind, p.y - i * 2 - 1, 2, 1, '#a3b76b');
      }
    } else {
      for (let i = 0; i < 3; i++) {
        const height = 3 + hash(i, p.seed) * 7;
        rect(c, p.x + i * 3, p.y - height / 2, 1, height / 2, '#526f40');
        rect(c, p.x + i * 3 + wind, p.y - height, 1, height / 2 + 1, shade ? '#739453' : '#b3bd77');
      }
      if (p.kind === 'flower') {
        const color = p.seed % 3 < 1 ? '#e2c865' : '#ce9ebb';
        rect(c, p.x + 2 + wind, p.y - 7, 5, 2, color); rect(c, p.x + 3 + wind, p.y - 8, 2, 4, color);
        rect(c, p.x + 3 + wind, p.y - 7, 1, 1, '#f0ddb0');
      }
    }
  }
}

function stoneBlock(c, x, y, w, h, seed) {
  rect(c, x, y, w, h, '#405354');
  rect(c, x + 1, y, w - 2, h - 2, ['#667674', '#71807a', '#7f8c81'][Math.floor(hash(x + seed, y) * 3)]);
  rect(c, x + 1, y, w - 2, 2, '#a0a996');
  if (hash(x, y + seed) > .6) {rect(c, x + w * .6, y + 2, 2, h - 3, '#485e58'); rect(c, x + w * .6 - 3, y + 3, 4, 1, '#485e58');}
  if (hash(y + seed, x) > .48) {
    rect(c, x + 2, y + h - 4, w * .6, 3, '#657e47'); rect(c, x + 3, y + h - 3, w * .3, 1, '#a1ad64');
  }
}
export function drawForestRuin(c, p) {
  const left = p.x - p.width / 2, top = p.y - p.depth - p.height;
  polygon(c, [[left, p.y], [left + p.width, p.y], [left + p.width + p.height * .7, p.y + p.height * .35], [left + p.height * .7, p.y + p.height * .35]], '#193d3533');
  rect(c, left, top + p.depth, p.width, p.height, '#405656');
  for (let row = 0; row < Math.ceil(p.height / 11); row++) {
    const y = top + p.depth + row * 11, h = Math.min(11, p.y - y);
    for (let x = left - (row % 2) * 12; x < left + p.width; x += 25) {
      const lx = Math.max(left, x), width = Math.min(left + p.width, x + 25) - lx;
      if (width > 0 && h > 0) stoneBlock(c, lx, y, width, h, p.seed);
    }
  }
  rect(c, left, top + p.depth, 5, p.height, '#9aa58e');
  rect(c, left + p.width - 7, top + p.depth + 2, 7, p.height - 2, '#394e50');
  rect(c, left - 3, top + p.depth - 3, p.width + 6, 6, '#acb399');
  rect(c, left - 3, top + p.depth + 3, p.width + 6, 3, '#526564');
  polygon(c, [[left, top], [left + p.width, top + 2], [left + p.width + 3, top + p.depth - 3], [left - 3, top + p.depth - 3]], '#a7af8b');
  rect(c, left + 5, top + 3, p.width - 10, Math.max(4, p.depth - 10), '#7f9958');
  for (let i = 0; i < p.width * .65; i++) {
    const x = left + hash(i, p.seed) * p.width, y = top + hash(p.seed, i) * (p.depth - 3);
    rect(c, x, y, 1, 2 + hash(i, 3) * 4, i % 3 ? '#b9c47e' : '#526f45');
  }
  if (p.shape === 'shrine') {
    rect(c, p.x - 12, top + p.depth + 13, 24, Math.max(12, p.height - 19), '#304c49');
    rect(c, p.x - 5, top + p.depth + 17, 10, 10, '#a3aa94');
    polygon(c, [[p.x - 4, top + p.depth + 27], [p.x + 4, top + p.depth + 27], [p.x + 9, p.y - 5], [p.x - 9, p.y - 5]], '#81917d');
  }
  if (p.shape === 'pillar') {
    rect(c, p.x - 5, top + p.depth + 12, 10, Math.max(5, p.height - 23), '#526966');
    rect(c, p.x - 2, top + p.depth + 14, 2, Math.max(3, p.height - 27), '#889782');
  }
  // Buttress steps are solid decorative faces within the same ground footprint.
  if (p.shape === 'terrace') for (let i = 0; i < 4; i++) {
    const y = p.y - i * 6;
    rect(c, left + 8 + i * 2, y - 3, p.width * .4 - i * 2, 3, '#aab193');
    rect(c, left + 8 + i * 2, y, p.width * .4 - i * 2, 2, '#4c6260');
  }
  for (let i = 0; i < 5; i++) {
    const x = left + hash(i, p.seed) * p.width, length = 8 + hash(p.seed, i) * p.height * .65;
    for (let k = 0; k < length; k += 4) rect(c, x + Math.sin(k * .2) * 2, top + p.depth + k, 2 + k % 3, 4, k % 8 ? '#627c46' : '#92a65c');
  }
}
