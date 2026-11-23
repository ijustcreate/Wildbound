// Native sword VFX: deliberately small pixel clusters, shared across all facings.
// No textures, timers, random state or raster caches are created while drawing.
const clamp = value => Math.max(0, Math.min(1, Number(value) || 0));
const pixel = Math.round;
const tau = Math.PI * 2;

export const SWORD_CHARGE_THEME = Object.freeze({
  ink: '#173b40',
  shadow: '#35676b',
  bronze: '#d5ad72',
  pale: '#e6e6c8',
  steel: '#86d7d6',
  light: '#dbfff0',
  gold: '#f6d888',
  white: '#fff8d7',
  blocked: '#efa16b',
  dust: '#a6a48b',
});

export function swordChargePalette(charge) {
  const power = clamp(charge / 1.2);
  return power >= 1
    ? { power, edge: SWORD_CHARGE_THEME.gold, core: SWORD_CHARGE_THEME.white, accent: SWORD_CHARGE_THEME.light }
    : power >= .48
      ? { power, edge: SWORD_CHARGE_THEME.steel, core: SWORD_CHARGE_THEME.light, accent: SWORD_CHARGE_THEME.pale }
      : { power, edge: SWORD_CHARGE_THEME.bronze, core: SWORD_CHARGE_THEME.pale, accent: SWORD_CHARGE_THEME.steel };
}

function polygon(c, points) {
  c.beginPath();
  for (let i = 0; i < points.length; i++) {
    const [x, y] = points[i];
    if (i) c.lineTo(pixel(x), pixel(y));
    else c.moveTo(pixel(x), pixel(y));
  }
  c.closePath();
}

function line(c, points, color, width = 1) {
  c.strokeStyle = color;
  c.lineWidth = width;
  c.beginPath();
  points.forEach(([x, y], i) => i ? c.lineTo(pixel(x), pixel(y)) : c.moveTo(pixel(x), pixel(y)));
  c.stroke();
}

function star(c, x, y, radius, color, core = SWORD_CHARGE_THEME.white) {
  x = pixel(x); y = pixel(y); radius = Math.max(1, pixel(radius));
  c.fillStyle = color;
  c.fillRect(x - radius, y, radius * 2 + 1, 1);
  c.fillRect(x, y - radius, 1, radius * 2 + 1);
  c.fillStyle = core;
  c.fillRect(x, y, 1, 1);
}

function brokenOctagon(c, rx, ry, progress, color, rotation = 0) {
  const count = Math.ceil(clamp(progress) * 8);
  for (let i = 0; i < count; i++) {
    const a = rotation + i * tau / 8 + .08, b = rotation + (i + .82) * tau / 8;
    line(c, [[Math.cos(a) * rx, Math.sin(a) * ry], [Math.cos(b) * rx, Math.sin(b) * ry]], color);
  }
}

/** A quiet footprint: one fill, one border and one readable stopping edge. */
export function drawSwordChargeLane(c, p, time = 0) {
  const charge = Math.max(0, Number(p.charge) || 0);
  if (!charge) return;
  const palette = swordChargePalette(charge), ready = palette.power >= 1;
  const requested = 32 + 148 * palette.power;
  const length = Math.max(0, Math.min(requested, Number.isFinite(p.swordChargePreview?.length) ? p.swordChargePreview.length : requested));
  const blocked = !!p.swordChargePreview?.blocked;
  c.save();
  c.translate(pixel(p.x), pixel(p.y));
  c.rotate(Math.atan2(Number(p.faceY) || 0, Number(p.faceX) || 0));
  c.lineJoin = 'miter';
  if (length >= 1) {
    c.save();
    c.globalAlpha *= .045 + palette.power * .025;
    c.fillStyle = palette.edge;
    c.fillRect(0, -15, length, 30);
    c.restore();
    // A subdued keyline keeps the single colored border readable on pale ground.
    c.save();
    c.globalAlpha *= .45;
    c.strokeStyle = SWORD_CHARGE_THEME.ink;
    c.lineWidth = 2;
    c.strokeRect(0, -15, length, 30);
    c.restore();
    c.save();
    c.globalAlpha *= .52 + palette.power * .22;
    c.strokeStyle = palette.edge;
    c.lineWidth = 1;
    c.strokeRect(0, -15, length, 30);
    c.restore();
  }
  // The end edge alone communicates full charge or an obstruction.
  c.globalAlpha *= blocked ? .9 : ready ? .9 : .65;
  c.fillStyle = blocked ? SWORD_CHARGE_THEME.blocked : ready ? palette.core : palette.edge;
  c.fillRect(pixel(length) - 1, -15, 1, 30);
  c.restore();
}

/** Blade-local energy is projected using the real fitted hand and tip for every direction. */
export function drawSwordBladeCharge(c, hand, tip, charge, time = 0, options = {}) {
  const palette = swordChargePalette(charge), power = palette.power;
  const dx = tip.x - hand.x, dy = tip.y - hand.y, length = Math.hypot(dx, dy);
  if (!length || length < .5 || power <= 0) return;
  const nx = -dy / length, ny = dx / length, motion = !options.reducedMotion;
  const phase = motion ? ((Number(time) || 0) * (1.1 + power * .6)) % 1 : .68;
  c.save();
  // A narrow coherent inner edge makes this feel like charged metal, not loose confetti.
  c.globalAlpha *= .18 + power * .24;
  line(c, [[hand.x + dx * .18, hand.y + dy * .18], [tip.x, tip.y]], palette.edge, 3);
  c.restore();
  c.save();
  for (let i = 0; i < 2; i++) {
    const t = .18 + ((phase + i * .5) % 1) * .8;
    const x = hand.x + dx * t, y = hand.y + dy * t, width = i ? 1.7 : 2.4;
    c.save(); c.globalAlpha *= (.45 + power * .4) * (1 - (t - .18) * .3);
    line(c, [[x - nx * width - dx * .055, y - ny * width - dy * .055], [x, y], [x + nx * width - dx * .055, y + ny * width - dy * .055]], palette.core);
    c.restore();
  }
  if (power >= .5) {
    const t = .45 + phase * .5;
    star(c, hand.x + dx * t + nx * 1.5, hand.y + dy * t + ny * 1.5, 1, palette.accent);
  }
  if (power >= 1) {
    const pulse = motion ? (Math.sin((Number(time) || 0) * 5) + 1) * .5 : .5;
    c.globalAlpha *= .7 + pulse * .25;
    star(c, tip.x, tip.y, 2 + (pulse > .8 ? 1 : 0), palette.edge);
    c.fillStyle = palette.core; c.fillRect(pixel(tip.x) - 1, pixel(tip.y) - 1, 2, 2);
  }
  c.restore();
}

function effectKind(fx) {
  return typeof fx.swordPolish === 'string' ? fx.swordPolish : fx.swordPolish?.kind || fx.kind;
}

/** Stateless finite-lived bursts; callers own the bounded gameplay effect collection. */
export function drawSwordCombatEffect(c, fx) {
  // Readiness is carried by the blade glint and the rectangle's end edge.
  if (effectKind(fx) === 'ready') return;
  const kind = effectKind(fx), duration = Math.max(.01, Number(fx.duration) || ({ ready: .36, release: .2, trail: .24, brake: .3, impact: .22, cancel: .2 }[kind] || .24));
  const t = clamp(1 - (Number(fx.life) || 0) / duration), fade = (1 - t) * (1 - t);
  if (fade <= 0) return;
  const power = clamp(fx.power ?? 1), palette = swordChargePalette(power * 1.2);
  c.save(); c.translate(pixel(fx.x), pixel(fx.y)); c.rotate(Number(fx.angle) || 0);
  c.globalAlpha *= fade; c.lineJoin = 'miter'; c.lineCap = 'butt';
  if (kind === 'release') {
    const reach = 10 + t * 25, width = 4 + power * 4;
    polygon(c, [[-9 - t * 7, -width], [reach, -2], [reach + 8, 0], [reach, 2], [-9 - t * 7, width], [0, 0]]);
    c.fillStyle = SWORD_CHARGE_THEME.steel; c.globalAlpha *= .45; c.fill(); c.globalAlpha /= .45;
    line(c, [[-5, -width - 3], [8 + t * 12, -width + 1]], palette.core);
    line(c, [[-5, width + 3], [8 + t * 12, width - 1]], palette.core);
    if (t < .45) star(c, 3, -6, 3, palette.edge);
  } else if (kind === 'trail') {
    const length = Math.max(5, Math.min(27, Number(fx.length) || 12 + power * 10));
    // A wake is displaced air and grit, not a row of directional UI arrows.
    // Stagger narrow longitudinal strips; separation grows as each patch settles.
    for (let i = 0; i < 3; i++) {
      const sign = i % 2 ? -1 : 1, y = sign * (3 + i + t * (2 + i));
      const back = -length - i * 2 - t * (4 + i), front = -2 - i * 3 - t * 3;
      c.save(); c.globalAlpha *= i === 2 ? .11 : .2;
      polygon(c, [[back, y], [back + 5, y - .7], [front, y], [front - 4, y + .6]]);
      c.fillStyle = i === 1 ? palette.accent : palette.edge; c.fill(); c.restore();
    }
    c.fillStyle = fx.dustColor || SWORD_CHARGE_THEME.dust;
    for (let i = 0; i < 3; i++) {
      const sign = i % 2 ? -1 : 1, x = -4 - i * 5 - t * (7 + i * 2), y = sign * (5 + t * (5 + i * 2));
      c.save(); c.globalAlpha *= .55;
      polygon(c, [[x - 2, y], [x, y - 1], [x + 2, y], [x, y + (i === 1 ? 2 : 1)]]);
      c.fill(); c.restore();
    }
  } else if (kind === 'brake') {
    c.save(); c.globalAlpha *= .38;
    brokenOctagon(c, 8 + t * 15, 5 + t * 8, .75, palette.edge, Math.PI * .25);
    c.restore();
    for (const sign of [-1, 1]) {
      const x = 3 + t * 12;
      line(c, [[-8 - t * 8, sign * (4 + t * 4)], [x, sign * (7 + t * 8)], [x + 4, sign * (5 + t * 8)]], fx.dustColor || SWORD_CHARGE_THEME.dust, 2);
    }
    line(c, [[-8, 0], [4 + t * 10, 0]], palette.core);
  } else if (kind === 'impact') {
    const r = 4 + t * (14 + power * 5);
    // One directional split cut and a handful of chunky ejecta replace the four-way star.
    c.save(); c.globalAlpha *= .3;
    polygon(c, [[-r * .6, 0], [0, -r * .7], [r, 0], [0, r * .7]]);
    c.fillStyle = palette.edge; c.fill(); c.restore();
    line(c, [[-r * .6, r * .65], [r * .65, -r * .65]], palette.core, t < .3 ? 3 : 1);
    for (let i = 0; i < 5; i++) {
      const a = -.95 + i * .46, along = r * (i % 2 ? .8 : 1.1), x = Math.cos(a) * along, y = Math.sin(a) * along;
      line(c, [[x * .58, y * .58], [x, y]], i % 2 ? palette.edge : palette.core, i === 2 ? 2 : 1);
    }
    if (t < .35) star(c, 0, 0, 3, palette.edge);
  } else if (kind === 'cancel') {
    c.save(); c.globalAlpha *= .5;
    for (const sign of [-1, 1]) {
      line(c, [[-6 + t * 2, sign * (4 - t * 2)], [1 + t * 4, sign * (6 + t * 3)]], palette.edge);
      c.fillStyle = palette.accent; c.fillRect(pixel(sign * (5 + t * 7)), pixel(-2 + t * 5), 1, 1);
    }
    c.restore();
  }
  c.restore();
}

/** Layered, tapered sweep from actual fitted hand/tip history; never a circular screen overlay. */
export function drawSwordChargeRibbon(c, points, power = 1) {
  if (!Array.isArray(points) || points.length < 2) return;
  const palette = swordChargePalette(clamp(power) * 1.2), count = Math.min(12, points.length), samples = points.slice(-count);
  c.save();
  for (const [inset, alpha, color] of [[.48, .18, SWORD_CHARGE_THEME.shadow], [.66, .48, palette.edge], [.88, .8, palette.core]]) {
    const outer = samples.map(({ tip }) => [tip.x, tip.y]);
    const inner = samples.map(({ hand, tip }, i) => {
      const taper = inset + (1 - i / (count - 1)) * (1 - inset) * .8;
      return [hand.x + (tip.x - hand.x) * taper, hand.y + (tip.y - hand.y) * taper];
    }).reverse();
    c.save(); c.globalAlpha *= alpha; polygon(c, [...outer, ...inner]); c.fillStyle = color; c.fill(); c.restore();
  }
  c.save(); c.globalAlpha *= .85;
  line(c, samples.map(p => [p.tip.x, p.tip.y]), palette.core);
  c.restore();
  const last = samples[count - 1];
  star(c, last.tip.x, last.tip.y, 1, palette.edge);
  c.restore();
}
