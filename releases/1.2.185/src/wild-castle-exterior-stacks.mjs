import {drawCastleStack} from './wild-castle-stack.mjs';

const ashlar = ['#83877a', '#969987', '#a5a492', '#767f76', '#8d9384'];
const slate = ['#405967', '#496371', '#506b77', '#37515f'];
const baseStone = '#4d5853';
const stairStone = '#b3b19a';
const profiles = new Map();
const noise = (x, y) => ((Math.imul(x | 0, 19349663) ^ Math.imul(y | 0, 83492791)) >>> 0) % 997 / 997;
const mix = (start, end, amount) => Math.round(start + (end - start) * amount);

function stack(c, x, y, key, make, projection) {
 if (!profiles.has(key)) profiles.set(key, make());
 drawCastleStack(c, x, y, profiles.get(key), projection);
}

// Face-on stone relief. The bottom layer is the joint bed, followed by block faces and chipped lips.
export function drawCastleStoneCourses(c, left, top, right, bottom, width, height, ground = false) {
 const w = right - left, h = bottom - top;
 const key = `stone:${w}:${h}:${width}:${height}:${ground}`;
 stack(c, left, top, key, () => {
  const bed = [[0, 0, w, h, ground ? '#545f55' : baseStone]], blocks = [], bevels = [];
  for (let y = 0, row = 0; y < h; y += height, row++) {
   for (let x = -(row % 2) * Math.floor(width / 2), n = 0; x < w; n++) {
    const seed = noise(n + w, y + h);
    const step = Math.max(5, Math.round(width * (.72 + seed * .58)));
    const left = Math.max(0, x), right = Math.min(w, x + step - 2);
    x += step;
    const size = right - left, span = Math.min(height - 1, h - y);
    if (size < 2 || span < 2) continue;
    const tone = Math.floor(seed * ashlar.length);
    blocks.push([left, y + 2, size, span, ashlar[tone]]);
    bevels.push([left + 1, y + 3, size - 2, 1, seed > .43 ? '#b7b7a0' : '#a6a890']);
    if (span > 6 && size > 8) {
     bevels.push([left + 1, y + span, Math.round(size * (.3 + seed * .45)), 1, '#68746b']);
     if (seed > .52) bevels.push([left + size - 6, y + 5, 4, 2, '#737d70']);
    }
   }
  }
  if (ground) bevels.push([0, 2, 2, h, '#b4b39b'], [w - 2, 2, 2, h, '#555f54']);
  return [bed, blocks, bevels];
 });
}

// Ridge and eaves share a footprint. Each higher slate course narrows the hips.
export function drawCastleSlateRoof(c, left, top, right, bottom) {
 const w = right - left, d = bottom - top, lift = 3;
 stack(c, left, bottom, `roof:${w}:${d}`, () => {
  const count = Math.max(4, Math.round(d / 18));
  const layers = [];
  for (let step = 0; step <= count; step++) {
   const u = step / count, rise = step * lift;
   const x = mix(-2, 63, u), edge = mix(w + 5, w - 82, u);
   const rear = mix(-d * .55, -d, u) + rise;
   const front = mix(3, -d + 3, u) + rise;
   const courseHeight = Math.min(front - rear, Math.ceil(d / count) + 3);
   const courseTop = front - courseHeight;
   const layer = [[x, rear, edge - x, front - rear, '#293e49']];
   const west = mix(35, 14, u), east = mix(53, 13, u);
   if (courseHeight > 0 && edge - x > west + east) {
    layer.push([x + 2, courseTop, west, courseHeight - 1, '#59727d']);
    layer.push([edge - east, courseTop, east - 1, courseHeight - 1, '#293e4a']);
    const l = x + west, r = edge - east;
    for (let tile = l - (step % 2) * 23, n = 0; tile < r; tile += 47, n++) {
     const a = Math.max(l, tile), b = Math.min(r, tile + 46);
     const seed = noise(n, step * 3 + 4);
     if (b <= a) continue;
     layer.push([a, courseTop, b - a, courseHeight - 1, slate[Math.floor(seed * slate.length)]]);
     if (b - a > 8 && courseHeight > 5) {
      layer.push([a + 3, courseTop + 2, Math.floor((b - a - 3) * (.29 + seed * .62)), 1, '#68828b']);
      if (seed > .6) layer.push([b - 7, front - 4, 6, 2, '#354f5d']);
     }
    }
    layer.push([x + west - 2, courseTop, 2, courseHeight - 1, '#819696']);
    layer.push([edge - east, courseTop, 2, courseHeight - 1, '#21333e']);
    if (step === 0) layer.push([x + 1, front - 6, edge - x - 1, 6, '#293941'],
      [x + 2, front - 6, edge - x - 4, 2, '#6f8280']);
   }
   if (step === count) layer.push([x + 1, rear, edge - x - 2, 2, '#8ca0a1']);
   layers.push(layer);
  }
  return layers;
 }, {lift});
}

export function drawCastleRoofShoulders(c, left, top, width, height) {
 stack(c, left, top, `shoulders:${width}:${height}`, () => {
  const west = ['#506b76', '#59717d', '#4a646d'];
  const east = ['#344c59', '#3c515d', '#314753'];
  const decking = [[0, 0, width, height, '#344b56']], courses = [], edges = [];
  for (let y = 0, row = 0; y < height; y += 15, row++) {
   for (let x = -(row % 2) * 17; x < width; x += 37) {
    const l = Math.max(0, x), r = Math.min(width, x + 36), h = Math.min(height - y, 14);
    const color = (x < width * .52 ? west : east)[Math.floor(noise(x, y + 3) * 3)];
    courses.push([l, y + 2, r - l, h, color]);
    if (r - l > 6 && noise(x + 7, y) > .48) {
     edges.push([l + 2, y + 3, Math.floor((r - l) * .63), 1, x < width * .52 ? '#647e86' : '#455c65']);
    }
   }
  }
  return [decking, courses, edges];
 });
}

function discRows(rx, ry, paint) {
 const rows = [];
 for (let dy = -ry; dy <= ry; dy++) {
  const x = Math.floor(rx * Math.sqrt(Math.max(0, 1 - (dy / (ry + .5)) ** 2)));
  paint(rows, dy, x);
 }
 return rows;
}

export function drawCastleTowerShaft(c, x, y, radius, height) {
 const ry = 10;
 stack(c, x, y, `shaft:${radius}:${height}`, () => Array.from({length: height + 1}, (_, z) => {
  const collar = z > height - 8, row = Math.floor(z / 13), mortar = z % 13 === 0;
  const r = radius + (collar ? 5 : 0);
  return discRows(r, ry, (slice, dy, edge) => {
   if (edge < 1) return;
   slice.push([-edge, dy, 2 * edge + 1, 1, mortar ? '#47534f' : '#6d756e']);
   if (mortar) return;
   for (let p = -r - (row % 2) * 12, n = 0; p < edge; p += 24, n++) {
    const a = Math.max(-edge, p), b = Math.min(edge + 1, p + 23), w = b - a;
    if (w < 1) continue;
    const next = noise(n + 5, row + 1), bright = z % 13 === 12;
    let color = bright ? '#b1b19a' : ashlar[Math.floor(next * ashlar.length)];
    if (p + 12 > .39 * r) color = bright ? '#869083' : '#687670';
    else if (p < -r * .53 && !bright) color = '#a8a897';
    if (z <= 10 && next > .32 && z < 3 + next * 8) color = next > .62 ? '#526948' : '#6a7950';
    if (collar) color = z >= height - 3 ? '#a6a894' : '#5f6e6c';
    slice.push([a, dy, w, 1, color]);
   }
  });
 }));
}

export function drawCastleTurretCover(c, x, y, radius, height) {
 stack(c, x, y, `turret:${radius}:${height}`, () => {
  const layers = Array.from({length: height + 1}, (_, z) => {
   const taper = (1 - z / height) ** 1.13, rx = Math.max(1, Math.round(radius * taper));
   const ry = Math.max(1, Math.round(12 * taper));
   return discRows(rx, ry, (slice, dy, edge) => {
    const seam = (z + 3) % 14 < 2;
    const base = z < 4;
    const palette = base ? ['#3e555d', '#293c47', '#25363f']
      : seam ? ['#86a0a8', '#526d7a', '#304a5a'] : ['#65818c', '#415d6c', '#304958'];
    const west = Math.round(edge * -.42), east = Math.round(edge * .48);
    slice.push([-edge, dy, 2 * edge + 1, 1, palette[1]]);
    slice.push([-edge, dy, west + edge, 1, palette[0]], [east, dy, edge - east + 1, 1, palette[2]]);
   });
  });
  for (let z = 0; z < 12; z++) {
   const half = z === 9 ? 2 : z > 8 ? 0 : z > 5 ? 1 : 2;
   layers.push([[-half, -1, 2 * half + 1, 3, z < 4 ? '#526660' : '#c2a369'],
    [0, 0, 1, 1, z > 4 ? '#e2be7f' : '#c2a369']]);
  }
  return layers;
 });
}

function halfArch(z, width, height, archRise) {
 const a = Math.max(0, z - (height - archRise)) / archRise;
 return Math.floor(width * Math.sqrt(Math.max(0, 1 - a * a)));
}

export function drawCastleArch(c, x, y, width, height, illuminated, gate = false) {
 const frame = gate ? 9 : 3, archRise = gate ? 37 : 9;
 stack(c, x, y, `arch:${width}:${height}:${illuminated}:${gate}`, () => {
  const layers = Array.from({length: height + frame}, (_, z) => {
   const outer = halfArch(z, width + frame, height + frame, archRise + frame);
   const inner = z < height ? halfArch(z, width, height, archRise) : 0;
   const layer = [[-outer, -1, outer * 2 + 1, 4, '#53605b']];
   if (outer > 0) layer.push([-outer, -2, outer * 2 + 1, 5, z % (gate ? 10 : 6) === 0 ? '#8e9382' : stairStone]);
   if (!inner) return layer;
   layer.push([-inner, -2, 2 * inner + 1, 5, gate ? '#172626' : '#27353b']);
   layer.push([-inner, 0, 1, 3, '#64716a']);
   if (gate) {
    if (z < 53) {
     const trim = z % 17 < 3 ? '#9da194' : '#695940';
     layer.push([-inner + 2, -1, 9, 4, trim], [inner - 10, -1, 9, 4, trim]);
    }
    if (z >= 58 && z <= 78) for (let i = -2; i <= 2; i++) {
     if (Math.abs(i * 10) < inner - 1) layer.push([i * 10 - 1, 0, 2, 3, '#66716b']);
    }
    if (z >= 77 && z < 81) layer.push([-inner, 0, 2 * inner, 3, '#777e70']);
   } else if (illuminated && z >= 5 && z <= height - 11) {
    layer.push([-3, 0, 6, 3, '#c8914f'], [-1, 0, 2, 3, '#ffe0a1']);
   }
   return layer;
  });
  layers[0].push([-width - frame - 1, 0, 2 * (width + frame + 1), 4, '#5f6a5e']);
  if (gate) layers[1].push([-width + 6, 0, 2 * (width - 6), 3, '#9fa393']);
  return layers;
 });
}

export function drawCastleLantern(c, x, y, ground) {
 stack(c, x, y, `lamp:${ground}`, () => {
  const start = ground ? 27 : 0;
  const layers = Array.from({length: start + 17}, (_, z) => {
   if (z < start) {
    const half = z < 4 ? 8 : z > 22 ? 6 : 5;
    return [[-half, -3, half * 2 + 1, 6, '#5d6861'], [-half + 1, -2, 3, 5, '#a4a990'],
     [-half + 4, -2, half - 1, 5, '#848e7f']];
   }
   const section = z - start;
   if (section > 12) {
    const w = 5 - (section - 13), inset = w - 1;
    return [[-w, -2, w * 2 + 1, 5, '#30393b'], [-inset, -1, inset + 2, 4, '#8b7957']];
   }
   if (section < 3 || section > 10) return [[-6, -3, 13, 6, '#333b3c'], [-5, 1, 10, 1, '#a08b66']];
   return [[-5, -2, 11, 5, '#313a3b'], [-3, 0, 7, 3, '#c18042'], [-2, 1, 4, 2, '#eeb664'],
    [0, 2, 2, 1, '#ffe6a5']];
  });
  return layers;
 });
}

const bankStones = [
 ['#726c58', '#8f8870', '#aca284'], ['#695f4e', '#827862', '#a19678'], ['#656b5c', '#7e846b', '#aaa787'],
];

export function drawCastleBankBlock(c, x, y, variant, angle) {
 const [base, body, cap] = bankStones[variant];
 stack(c, x, y, `bank:${variant}`, () => [
  [[0, 0, 23, 12, base]], [[0, 1, 22, 9, body]],
  [[1, 2, 20, 5, cap], [1, 6, 3, 3, '#6f755d'], [16, 6, 5, 2, '#76725e']],
 ], {angle});
}

const grass = ['#5a7749', '#658052', '#6c8a53', '#607d4b'];
export function drawCastleGrassTuft(c, x, y, variant) {
 stack(c, x, y, `grass:${variant}`, () => [
  [[-5, -2, 11, 4, grass[variant]], [-3, 1, 6, 2, '#516e45']],
  [[-4, -1, 2, 3, '#718f56'], [-1, 1, 2, 3, '#809d63'], [2, 0, 2, 3, '#6d8b54']],
  [[-2, 1, 2, 1, '#8ba468'], [2, 0, 1, 2, '#75945a']],
 ]);
}

export function drawCastleLily(c, x, y, radius, flower) {
 stack(c, x, y, `lily:${radius}:${flower}`, () => {
  const width = radius * 2;
  const pad = [[-radius + 2, -2, width - 3, 1, '#87a05e'], [-radius, -1, width, 1, '#718e53'],
   [-radius, 0, width - 3, 1, '#759458'], [-radius + 1, 1, width - 4, 1, '#648453'],
   [-radius + 1, -1, radius - 2, 1, '#a2b371']];
  const layers = [[[-radius + 1, 0, width - 1, 2, '#375956']], pad];
  if (flower) layers.push([[-1, 0, 3, 1, '#b7877c']], [[-2, 0, 2, 1, '#d3a592'], [1, 0, 2, 1, '#c49782']], [[0, 1, 1, 1, '#f0c5a2']]);
  return layers;
 });
}
