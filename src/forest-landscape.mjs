import {findPath} from './navigation.mjs';
import OverlappingModel from './vendor/wfc/overlapping-model.mjs';

export const forestHash = (x, y = 0) => {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return n - Math.floor(n);
};
const mix = (a, b, t) => a + (b - a) * t;
export function forestNoise(x, y, seed = 0) {
  const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
  const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
  return mix(mix(forestHash(ix + seed, iy), forestHash(ix + 1 + seed, iy), u),
    mix(forestHash(ix + seed, iy + 1), forestHash(ix + 1 + seed, iy + 1), u), v);
}
export function forestWind(x, y, time = 0) {
  const front = time * 1.2 - x * .007 - y * .003;
  return Math.sin(front) * (.55 + .45 * Math.sin(time * .37 + y * .002));
}
const wet = t => ['water', 'shallow', 'bridge', 'floodbridge'].includes(t);
const tile = (terrain, x, y) => terrain[Math.floor(y / 32) * 50 + Math.floor(x / 32)];
export function clearingDistance(x, y, seed) {
  const dx = (x - 800) / 175, dy = (y - 816) / 136;
  const a = Math.atan2(dy, dx);
  return Math.hypot(dx, dy) - .10 * Math.sin(a * 3 + seed) - .07 * Math.cos(a * 5);
}
export function routeDistance(plan, x, y) {
  const gx = Math.max(0, Math.min(98.999, x / 16 - .5));
  const gy = Math.max(0, Math.min(98.999, y / 16 - .5));
  const ix=Math.floor(gx),iy=Math.floor(gy),f=plan.routeField;
  return mix(mix(f[iy*100+ix],f[iy*100+ix+1],gx-ix),mix(f[(iy+1)*100+ix],f[(iy+1)*100+ix+1],gx-ix),gy-iy);
}
function softenTrail(points, terrain, seed) {
  const safe=p=>[[0,0],[14,0],[-14,0],[0,14],[0,-14]].every(([dx,dy])=>tile(terrain,p.x+dx,p.y+dy)!=='water');
  let smooth=points;
  for(let pass=0;pass<2;pass++){
    const next=[smooth[0]];
    for(let i=1;i<smooth.length-1;i++){
      const a=smooth[i-1],b=smooth[i],d=smooth[i+1];
      const p={x:a.x*.2+b.x*.6+d.x*.2,y:a.y*.2+b.y*.6+d.y*.2};
      next.push(safe(p)?p:b);
    }
    next.push(smooth.at(-1));smooth=next;
  }
  return smooth.map((p,i)=>{
    if(i===0||i===smooth.length-1)return p;
    const a=smooth[i-1],b=smooth[i+1],len=Math.hypot(b.x-a.x,b.y-a.y)||1;
    const offset=Math.sin((p.x+p.y)/117+seed)*17;
    const q={x:p.x-(b.y-a.y)/len*offset,y:p.y+(b.x-a.x)/len*offset};
    return safe(q)?q:p;
  });
}
function markRoute(field, a, b) {
  const dx = b.x - a.x, dy = b.y - a.y, len = dx * dx + dy * dy;
  for (let y = Math.max(0, Math.floor((Math.min(a.y, b.y) - 100) / 16)); y <= Math.min(99, Math.ceil((Math.max(a.y, b.y) + 100) / 16)); y++)
    for (let x = Math.max(0, Math.floor((Math.min(a.x, b.x) - 100) / 16)); x <= Math.min(99, Math.ceil((Math.max(a.x, b.x) + 100) / 16)); x++) {
      const px = x * 16 + 8, py = y * 16 + 8;
      const t = Math.max(0, Math.min(1, ((px - a.x) * dx + (py - a.y) * dy) / (len || 1)));
      field[y * 100 + x] = Math.min(field[y * 100 + x], Math.hypot(px - a.x - dx * t, py - a.y - dy * t));
    }
}

export function makePaving(seed) {
  const sample = [
    '00000000', '01110110', '01210110', '01110000',
    '00000110', '01110120', '01210110', '00000000',
  ];
  const pixels = new Uint8Array(8 * 8 * 4);
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
    const i = (y * 8 + x) * 4;
    pixels[i] = Number(sample[y][x]) * 100; pixels[i + 3] = 255;
  }
  const model = new OverlappingModel(pixels, 8, 8, 2, 24, 24, true, false, 8);
  let cursor = 0;
  for (let attempt = 0; attempt < 3; attempt++) {
    if (model.generate(() => forestHash(seed + attempt * 73, cursor++))) {
      const result = model.graphics();
      return {resolved: true, cells: Array.from({length: 576}, (_, i) => Math.round(result[i * 4] / 100))};
    }
  }
  return {resolved: false, cells: Array.from({length: 576}, (_, i) => Number(sample[Math.floor(i / 24) % 8][i % 8]))};
}

export function createForestLandscape(seed, terrain) {
  const plan = {version: 1, seed, routes: [], routeField: new Float32Array(10000).fill(200),
    landmarks: [], paving: makePaving(seed), cover: []};
  // The existing pathfinder owns connectivity; WFC only supplies local masonry.
  const routing = {time: 0, house: null, blocked(x, y) {
    return x < 48 || y < 48 || x > 1552 || y > 1552 || tile(terrain, x, y) === 'water';
  }};
  const hub = {x: 800, y: 880};
  const destinations = [
    {x: 752, y: 368, kind: 'shrine'}, {x: 976, y: 1280, kind: 'courtyard'},
    {x: 160, y: 800, kind: 'gateway'}, {x: 1440, y: 752, kind: 'colonnade'},
    {x: 176, y: 272}, {x: 1424, y: 272}, {x: 176, y: 1296}, {x: 1424, y: 1296},
  ];
  for (const goal of destinations) {
    const points = softenTrail([hub, ...findPath(routing, {x: hub.x, y: hub.y}, goal)],terrain,seed);
    if (points.length < 2) throw Error('Forest route could not reach its destination');
    plan.routes.push(points);
    for (let i = 1; i < points.length; i++) markRoute(plan.routeField, points[i - 1], points[i]);
    if (goal.kind) plan.landmarks.push({...goal, seed: seed + plan.landmarks.length * 31});
  }
  // Outer trails form loops between the north/south crossings and each side landmark.
  for (const side of [176, 1424]) {
    const points = softenTrail(findPath(routing, {x: side, y: 272}, {x: side, y: 1296}),terrain,seed);
    plan.routes.push(points);
    for (let i = 1; i < points.length; i++) markRoute(plan.routeField, points[i - 1], points[i]);
  }
  return plan;
}

export function forestRuinProps(plan, terrain) {
  const props = [];
  const add = (landmark, dx, dy, width, depth, height, shape) => {
    const x = landmark.x + dx, y = landmark.y + dy;
    if (x - width / 2 < 40 || x + width / 2 > 1560 || y - depth < 40 || y > 1560) return;
    for (let py = y - depth - 12; py <= y + 12; py += 12)
      for (let px = x - width / 2 - 12; px <= x + width / 2 + 12; px += 12)
        if (wet(tile(terrain, px, py)) || routeDistance(plan, px, py) < 32) return;
    props.push({id: `ruin:${props.length}`, kind: 'forest_ruin', x, y, rootY: y,
      width, depth, height, shape, size: Math.max(width, height + depth), procedural: true,
      seed: landmark.seed + props.length});
  };
  for (const l of plan.landmarks) {
    if (l.kind === 'shrine') {
      add(l, -84, -28, 64, 45, 58, 'shrine'); add(l, 82, -35, 38, 32, 80, 'pillar');
      add(l, -100, 67, 58, 25, 18, 'terrace'); add(l, 110, 85, 70, 30, 28, 'terrace');
    } else if (l.kind === 'gateway') {
      add(l, -75, -45, 42, 34, 98, 'pillar'); add(l, 85, -42, 46, 36, 74, 'pillar');
      add(l, -68, 77, 90, 40, 28, 'terrace');
    } else if (l.kind === 'colonnade') {
      for (let i = 0; i < 3; i++) add(l, 80, -120 + i * 104, 38, 32, 65 + i * 13, 'pillar');
      add(l, -104, -40, 66, 44, 38, 'terrace');
    } else {
      add(l, -106, -45, 95, 42, 42, 'terrace'); add(l, 100, -60, 66, 40, 80, 'shrine');
      add(l, -92, 70, 66, 38, 25, 'terrace'); add(l, 110, 65, 50, 30, 48, 'pillar');
    }
  }
  return props;
}

export function createForestScenery(seed, terrain, plan) {
  const scenery = forestRuinProps(plan, terrain);
  for (let cy = 1; cy < 33; cy++) for (let cx = 1; cx < 33; cx++) {
    const x = cx * 48 + (forestHash(cx + seed, cy) - .5) * 34;
    const rootY = cy * 48 + (forestHash(cy, cx + seed) - .5) * 34;
    if (tile(terrain, x, rootY) !== 'grass' || clearingDistance(x, rootY, seed) < 1.28) continue;
    if (routeDistance(plan, x, rootY) < 57) continue;
    if (plan.landmarks.some(l => Math.hypot(x - l.x, rootY - l.y) < 165)) continue;
    const density = forestNoise(x / 190, rootY / 190, seed);
    const chance = forestHash(cx + 9, cy + seed);
    if (chance > .10 + density * .48) continue;
    const tree = chance < .055 + density * .31;
    const size = tree ? 88 + forestHash(cx + seed, cy + 4) * 57 : 25 + forestHash(cx, cy) * 23;
    const grove = forestNoise(x / 280 + 12, rootY / 280, seed);
    const treeType = grove < .32 ? 'birch' : grove > .72 ? 'pine' : 'oak';
    scenery.push({id: `grove:${cx}:${cy}`, x, y: rootY - size * (tree ? .35 : .19), rootY,
      kind: tree ? 'tree' : chance > .3 ? 'rock' : 'bush', size, treeType,
      ...(tree && grove > .54 && grove < .64 ? {autumnAccent: true} : {}), procedural: true});
  }
  for (let y = 32; y < 1570; y += 18) for (let x = 32; x < 1570; x += 18) {
    const px = x + forestHash(x, y + seed) * 15, py = y + forestHash(y, x + seed) * 15;
    if (tile(terrain, px, py) !== 'grass' || routeDistance(plan, px, py) < 28 || clearingDistance(px, py, seed) < .92) continue;
    const density = forestNoise(px / 100, py / 100, seed + 8);
    if (forestHash(x + seed, y) > density * .8) continue;
    if (scenery.some(p => p.kind === 'forest_ruin' && px > p.x - p.width / 2 - 4 && px < p.x + p.width / 2 + 4 && py > p.y - p.depth - 4 && py < p.y + 4)) continue;
    plan.cover.push({x: px, y: py, kind: density > .68 ? 'fern' : density < .4 ? 'flower' : 'grass', seed: forestHash(x, y) * 1000});
  }
  return scenery;
}

export function restoreForestLandscape(g, version = g.forestLandscapeVersion) {
  if (version !== 1 || (g.generatedEnvironment || g.environment || 'forest') !== 'forest') {
    g.forestLandscape = null; g.forestLandscapeVersion = 0; return;
  }
  if (g.forestLandscape?.seed === g.seed && g.forestLandscape?.routeField instanceof Float32Array) return;
  const plan = createForestLandscape(g.seed, g.terrain);
  createForestScenery(g.seed, g.terrain, plan);
  g.forestLandscape = plan;
}
