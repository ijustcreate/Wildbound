// Beholder combat is an original Wildbound adaptation of the classic
// eye-ray idea: one visible telegraph, one distinct control/damage effect.
import { clearShot } from './navigation.mjs';

// Palette swaps keep one rig/art pass useful for classic, fire, swamp, and
// arcane encounters without duplicating the animation set.
export const BEHOLDER_PALETTES = Object.freeze({
  classic: Object.freeze({ body: '#667b9b', shade: '#3b3155', light: '#8da6c2', face: '#ffb94e', detail: '#f7d878', eye: '#fff1b0', outline: '#241c36' }),
  fire: Object.freeze({ body: '#a8493b', shade: '#5f2e3c', light: '#d76b49', face: '#ffb13b', detail: '#ffe27b', eye: '#fff3bd', outline: '#321e2c' }),
  swamp: Object.freeze({ body: '#597a58', shade: '#304637', light: '#84a66a', face: '#d8b34f', detail: '#f1df78', eye: '#fff0ac', outline: '#23332d' }),
  arcane: Object.freeze({ body: '#76508e', shade: '#3b2457', light: '#a77ad0', face: '#e39cff', detail: '#f7c6ff', eye: '#fff0ff', outline: '#241733' }),
});

export function beholderPaletteFor(variant = 'classic') {
  return { ...(BEHOLDER_PALETTES[variant] || BEHOLDER_PALETTES.classic) };
}

export const BEHOLDER_EVENT = Object.freeze({
  name: 'The many-eyed watcher',
  kind: 'beholder',
  count: 1,
  hp: 520,
  speed: 34,
  damage: 34,
  weight: 1,
  paletteVariant: 'classic',
  verse: 'A hundred pupils open in the dark.\nThe watcher has chosen you.',
  tip: 'Keep moving, interrupt the eye beam, and do not let the watcher corner the party.',
});

export const LESSER_BEHOLDER_EVENT = Object.freeze({
  name: 'A lesser watcher',
  kind: 'lesser_beholder',
  count: 2,
  hp: 145,
  speed: 42,
  damage: 16,
  weight: 4,
  paletteVariant: 'swamp',
  verse: 'Small eyes blink between the stones.\nThe lesser watchers drift closer.',
  tip: 'The eyestalks charge one ray at a time. Split them up and keep your distance.',
});

const RAYS = ['disintegrate', 'fear', 'sleep', 'petrify', 'slow', 'death'];

export function tickBeholder(g, e, p, dt, stats = {}) {
  if (e.hp <= 0 || e.frozen > 0 || e.stun > 0) return;
  e.recovery = Math.max(0, (e.recovery || 0) - dt);
  if (e.recovery > 0) { e.moving = false; return; }
  const d = Math.hypot(p.x - e.x, p.y - e.y) || 1;
  e.faceX = (p.x - e.x) / d;
  e.faceY = (p.y - e.y) / d;
  e.beholderCooldown = Math.max(0, (e.beholderCooldown ?? .8) - dt);
  const rayWasActive = e.beholderRayTime > 0;
  e.beholderRayTime = Math.max(0, (e.beholderRayTime || 0) - dt);
  if (rayWasActive) {
    e.moving = false;
    if (e.beholderRayTime <= 0 && !e.beholderRayResolved) {
      e.beholderRayResolved = true;
      applyRay(g, e, p, e.beholderRayType, stats);
      e.state = 'recover';
      e.recovery = .7;
    }
    return;
  }
  e.beholderRayResolved = false;
  if (d > (stats.rangedRange || 330)) {
    e.moving = true;
    g.moveActor(e, e.faceX * e.speed * dt, e.faceY * e.speed * dt);
    return;
  }
  if (d < 190) {
    e.moving = true;
    g.moveActor(e, -e.faceX * e.speed * dt, -e.faceY * e.speed * dt);
    return;
  }
  e.moving = false;
  if (e.beholderCooldown <= 0 && clearShot(g, e, p)) {
    e.beholderRayType = RAYS[(e.beholderRayIndex || 0) % RAYS.length];
    e.beholderRayIndex = (e.beholderRayIndex || 0) + 1;
    e.beholderRayTime = stats.rayWindup || .58;
    e.attack = e.beholderRayTime;
    e.beholderCooldown = stats.rangedCooldown || 2.8;
  }
}

function applyRay(g, e, p, ray, stats) {
  const damage = stats.damage || e.damage || 16;
  if (ray === 'fear') { p.stun = Math.max(p.stun || 0, 1.1); p.stunMax = p.stun; return; }
  if (ray === 'sleep') { p.sleeping = Math.max(p.sleeping || 0, 2.2); return; }
  if (ray === 'petrify') { p.rooted = Math.max(p.rooted || 0, 1.5); return; }
  if (ray === 'slow') { p.slowUntil = Math.max(p.slowUntil || 0, g.time + 2.8); return; }
  g.hurt(p, ray === 'death' ? damage * 1.5 : damage, e);
  if (ray === 'disintegrate') p.burning = Math.max(p.burning || 0, 1.5);
}
