import { gearPalette, gearPixels } from './gear-art.mjs';

// Paint against the existing pose anchors. All shapes are rasterized on the
// player sprite's pixel grid so angled grips keep their crisp silhouettes.
function along(a, b, amount) {
  return { x: a.x + (b.x - a.x) * amount, y: a.y + (b.y - a.y) * amount };
}

function oriented(a, b) {
  const length = Math.hypot(b.x - a.x, b.y - a.y);
  const dx = length ? (b.x - a.x) / length : 0;
  const dy = length ? (b.y - a.y) / length : -1;
  return (distance, side = 0) => ({
    x: a.x + dx * distance - dy * side,
    y: a.y + dy * distance + dx * side,
  });
}

function polygon(c, color, points) {
  const top = Math.ceil(Math.min(...points.map(p => p.y)) - .5);
  const bottom = Math.ceil(Math.max(...points.map(p => p.y)) - .5);
  c.fillStyle = color;
  for (let y = top; y < bottom; y++) {
    const slice = y + .5, edges = [];
    for (let i = 0; i < points.length; i++) {
      const a = points[i], b = points[(i + 1) % points.length];
      if ((a.y > slice) === (b.y > slice)) continue;
      edges.push(a.x + (b.x - a.x) * (slice - a.y) / (b.y - a.y));
    }
    edges.sort((a, b) => a - b);
    for (let i = 0; i + 1 < edges.length; i += 2) {
      const left = Math.ceil(edges[i] - .5), right = Math.ceil(edges[i + 1] - .5);
      if (right > left) c.fillRect(left, y, right - left, 1);
    }
  }
}

function line(c, a, b, color) {
  let x = Math.round(a.x), y = Math.round(a.y);
  const x1 = Math.round(b.x), y1 = Math.round(b.y);
  const dx = Math.abs(x1 - x), dy = -Math.abs(y1 - y);
  const stepX = x < x1 ? 1 : -1, stepY = y < y1 ? 1 : -1;
  let error = dx + dy;
  c.fillStyle = color;
  while (true) {
    c.fillRect(x, y, 1, 1);
    if (x === x1 && y === y1) break;
    const change = error * 2;
    if (change >= dy) {
      error += dy;
      x += stepX;
    }
    if (change <= dx) {
      error += dx;
      y += stepY;
    }
  }
}

function beam(c, a, b, color, nearWidth, farWidth = nearWidth) {
  const point = oriented(a, b);
  const length = Math.hypot(b.x - a.x, b.y - a.y);
  if (length < .75 || nearWidth < 1.5) {
    line(c, a, b, color);
    return;
  }
  polygon(c, color, [
    point(-.5, -nearWidth / 2), point(length + .5, -farWidth / 2),
    point(length + .5, farWidth / 2), point(-.5, nearWidth / 2),
  ]);
}

const REED = {
  ink: '#352722', outside: '#936139', face: '#c8914b', edge: '#ebc17e',
  nock: '#ecd7a3', grip: '#3f4140', wrap: '#82936d',
};
const STARTER_BOW = {
  ink: '#3a2621', outside: '#845138', face: '#b57947', edge: '#dcad76',
  nock: '#dbb37e', grip: '#52362e', wrap: '#966447',
};

function bowLimb(c, tip, grip, colors) {
  const shoulder = { x: grip.x + (tip.x - grip.x) * .72, y: grip.y + (tip.y - grip.y) * .18 };
  const mid = along(along(tip, shoulder, .5), along(shoulder, grip, .5), .5);
  beam(c, grip, mid, colors.ink, 3.7, 3.5);
  beam(c, mid, tip, colors.ink, 3.5, 2.3);
  beam(c, grip, mid, colors.outside, 2.1, 2.5);
  beam(c, mid, along(mid, tip, .88), colors.outside, 2.5, 1.4);
  const edge = { x: mid.x - .55, y: mid.y - .55 };
  line(c, along(grip, edge, .27), edge, colors.face);
  line(c, edge, along(edge, tip, .74), colors.edge);
  line(c, along(mid, tip, .78), tip, colors.nock);
}

export function drawRefinedBow(c, id, { top, mid, bottom, stringHand }) {
  if (id !== 'bow' && id !== 'starter_bow') return false;
  const colors = id === 'bow' ? REED : STARTER_BOW;
  line(c, top, stringHand, '#d5c6a5');
  line(c, stringHand, bottom, '#d5c6a5');
  bowLimb(c, top, mid, colors);
  bowLimb(c, bottom, mid, colors);
  const grip = gearPixels(c, mid);
  grip(-1, -2, 3, 4, colors.grip);
  grip(-1, -2, 2, 1, colors.wrap);
  grip(0, 1, 2, 1, colors.wrap);
  return true;
}

export function drawRefinedRifle(c, id, { hand, butt, muzzle }) {
  if (id !== 'rifle') return false;
  const stock = oriented(butt, hand), barrel = oriented(hand, muzzle);
  const stockLength = Math.hypot(hand.x - butt.x, hand.y - butt.y);
  const barrelLength = Math.hypot(muzzle.x - hand.x, muzzle.y - hand.y);

  polygon(c, '#2d282b', [
    stock(-1, -2.5), stock(stockLength + 1, -1.6), stock(stockLength + 2, 1.4),
    stock(stockLength * .38, 3.1), stock(-1, 2.4),
  ]);
  polygon(c, '#825237', [
    stock(0, -1.6), stock(stockLength, -.7), stock(stockLength, 1.1),
    stock(stockLength * .35, 2.1), stock(0, 1.5),
  ]);
  line(c, stock(0, -1.6), stock(stockLength * .75, -.7), '#ba8959');
  beam(c, barrel(-.7), muzzle, '#22282c', 4.2, 2.6);
  beam(c, barrel(.1), barrel(Math.max(.1, barrelLength - .45)), '#586468', 2.7, 1.55);
  beam(c, barrel(0, 1.3), barrel(barrelLength * .47, 1.2), '#6f4934', 2.7, 1.7);
  line(c, barrel(barrelLength * .26, -.75), barrel(barrelLength * .88, -.75), '#a5b4ad');
  line(c, barrel(barrelLength * .09, -1), barrel(barrelLength * .21, -1), '#d0d0bb');
  return true;
}

const WANDS = {
  alley_ashwood_wand: {
    wood: '#493a36', edge: '#82736d', band: '#b1bbb1', border: '#354c3c',
    shade: '#72966b', face: '#a9d18b', shine: '#e1f1b0', span: 2.1, height: 3.1,
  },
  starter_wand: {
    wood: '#8b5537', edge: '#bc8050', band: '#a48061', border: '#36495a',
    shade: '#5683a1', face: '#88bedc', shine: '#dcf4f4', span: 2.2, height: 3,
  },
  storm_wand: {
    wood: '#374e5b', edge: '#61838a', band: '#9baaaa', border: '#254755',
    shade: '#38889f', face: '#75dce5', shine: '#d9fbf7', span: 2.5, height: 4.2,
  },
  sun_wand: {
    wood: '#885430', edge: '#bd864b', band: '#ebb968', border: '#754b37',
    shade: '#ad632f', face: '#ffc264', shine: '#fff0aa', span: 3, height: 3.7,
  },
};

export function drawRefinedWand(c, id, { hand, tip }) {
  if (!Object.hasOwn(WANDS, id)) return false;
  const colors = WANDS[id], shaft = oriented(hand, tip), head = oriented(tip, { x: tip.x + tip.x - hand.x, y: tip.y + tip.y - hand.y });
  const length = Math.hypot(tip.x - hand.x, tip.y - hand.y);
  const throat = shaft(Math.max(0, length - 2));
  beam(c, hand, throat, '#292629', 3.1, 2.4);
  beam(c, hand, throat, colors.wood, 1.6, 1.6);
  line(c, shaft(length * .2, -.55), shaft(length * .57, -.55), colors.edge);
  line(c, head(-2.7, -1), head(-2.7, 1), colors.band);

  const { span, height } = colors;
  polygon(c, colors.border, [head(height - 1.1), head(1.1, span), head(-1.5, span), head(-2.7), head(-1.5, -span), head(1.1, -span)]);
  polygon(c, colors.shade, [head(height - 1.4), head(.75, span - .6), head(-1.1, span - .6), head(-1.9), head(-1.25, -span + .7), head(.9, -span + .7)]);
  polygon(c, colors.face, [head(height - 1.5), head(.55, span - .7), head(-.6), head(.1, -span + .63)]);
  line(c, head(.2, -.75), head(height - 1.7), colors.shine);

  if (id === 'storm_wand') {
    line(c, head(-2.7), head(.35, -2.4), colors.band);
    line(c, head(-2.7), head(-.25, 2.25), '#527e8c');
  } else if (id === 'sun_wand') {
    line(c, head(-.4, -2.55), head(.65, -3.65), colors.band);
    line(c, head(-.4, 2.55), head(.65, 3.65), colors.band);
    line(c, head(-2.9), head(-1.5, -1.9), colors.band);
  }
  return true;
}

function drawBell(c, from, drop, shades) {
  const to = { x: from.x, y: from.y + drop };
  line(c, from, to, '#746252');
  const bell = gearPixels(c, to);
  bell(-1, -1, 3, 2, shades[0]);
  bell(-1, 0, 3, 1, shades[1]);
  bell(0, -1, 1, 1, shades[2]);
}

export function drawRefinedStaff(c, id, { hand, butt, tip }) {
  if (id !== 'keeper_staff') return false;
  const branch = oriented(tip, hand);
  const knot = branch(8, 1);
  beam(c, butt, knot, '#302630', 3.3, 4);
  beam(c, knot, tip, '#322730', 4, 3.7);
  beam(c, butt, knot, '#604858', 1.7, 2.35);
  beam(c, knot, tip, '#735365', 2.35, 1.6);
  line(c, branch(4, -.6), branch(15, -.9), '#a17b85');
  const left = branch(3, -5), right = branch(5, 5);
  beam(c, knot, left, '#392a36', 3.2, 1.7);
  beam(c, branch(11), right, '#392a36', 2.6, 1.7);
  line(c, branch(6, -2), left, '#936c82');
  line(c, branch(8, 3), right, '#825d72');

  const jewel = gearPixels(c, tip);
  jewel(-2, -1, 5, 3, '#4c3434');
  jewel(-1, -3, 3, 5, '#4c3434');
  jewel(-1, -2, 3, 3, '#bf773c');
  jewel(-1, -2, 2, 2, '#f8be62');
  jewel(-1, -2, 1, 1, '#fff0b5');
  drawBell(c, left, 4, ['#4d5453', '#7faea5', '#c0e4ca']);
  drawBell(c, right, 5, ['#513e55', '#9c779c', '#d9aac6']);
  drawBell(c, branch(7, -1), 6, ['#634838', '#bc8756', '#e8c58c']);
  return true;
}

const STARTER_SHIELD = {
  ink: '#322925', base: '#819074', shadow: '#56624f', lit: '#abac81',
  rim: '#755638', rimLight: '#bc9660', boss: '#8c8d6c', bossLight: '#d9d9a6',
  rear: '#614930', strap: '#a17849',
  rows: [2, 3, 4, 4, 4, 3, 3, 2, 1],
};
const SUNWALL = {
  ink: '#432e26', base: '#a76e43', shadow: '#79513b', lit: '#d29251',
  rim: '#af783e', rimLight: '#f4c36b', boss: '#e4a748', bossLight: '#fff0ac',
  rear: '#745239', strap: '#b8804b',
  rows: [3, 5, 5, 5, 5, 5, 5, 4, 4, 3, 2],
};

export function drawRefinedShield(c, id, { hand, direction, blocking, dye }) {
  if (id !== 'starter_shield' && id !== 'sun_shield') return false;
  const sun = id === 'sun_shield', colors = sun ? SUNWALL : STARTER_SHIELD;
  const shade = dye ? gearPalette(id, dye) : { base: colors.base, dark: colors.shadow, light: colors.lit };
  const put = gearPixels(c, hand), top = -Math.floor(colors.rows.length / 2);
  const edge = direction === 2 || direction === 6, rear = direction >= 3 && direction <= 5;
  const rimLight = blocking ? colors.bossLight : colors.rimLight;

  for (const [row, half] of colors.rows.entries()) {
    const width = edge ? 1 : half, y = top + row;
    put(-width, y, width * 2 + 1, 1, colors.ink);
    if (edge) {
      if (row > 0 && row < colors.rows.length - 1) put(0, y, 1, 1, row < 4 ? rimLight : colors.rim);
    } else if (row < colors.rows.length - 1) {
      put(1 - width, y, width * 2 - 1, 1, row < 2 ? rimLight : colors.rim);
      if (row > 0 && width > 2) {
        put(2 - width, y, width * 2 - 3, 1, rear ? colors.rear : shade.base);
        put(2 - width, y, 1, 1, rear ? shade.dark : shade.light);
        if (width > 3) put(width - 2, y, 1, 1, shade.dark);
      }
    }
  }
  if (edge) {
    put(0, -1, 2, 3, colors.strap);
  } else if (rear) {
    put(-2, -2, 5, 1, colors.strap);
    put(-1, -2, 2, 4, colors.ink);
    put(-1, 0, 1, 2, colors.rimLight);
  } else if (sun) {
    put(-3, -1, 7, 1, colors.boss);
    put(0, -4, 1, 7, colors.boss);
    put(-1, -2, 3, 3, colors.boss);
    put(0, -2, 1, 3, colors.bossLight);
    put(-2, -3, 1, 1, colors.rimLight);
    put(2, 1, 1, 1, colors.rim);
  } else {
    put(-2, -1, 5, 2, colors.ink);
    put(-1, -1, 3, 2, colors.boss);
    put(-1, -1, 2, 1, colors.bossLight);
    put(1, 1, 1, 2, shade.dark);
  }
  return true;
}
