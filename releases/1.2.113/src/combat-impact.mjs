import {encounterRole} from './expedition-trials.mjs';
import {combatTuning} from './combat-workshop-settings.mjs';
import {emitGameplayFx} from './gameplay-fx.mjs';

export const IMPACT_PROFILES = Object.freeze({
  cut: {pause:0, strength:0.9, duration:0.095, flash:0.13, particle:'cut-impact', life:0.18, lift:18, scale:0.65, rank:1},
  heavy: {pause:0.042, strength:2.1, duration:0.13, flash:0.2, particle:'heavy', life:0.3, lift:18, scale:0.82, rank:3},
  boss: {pause:0.058, strength:3.2, duration:0.16, flash:0.24, particle:'heavy', life:0.3, lift:18, scale:1, rank:4},
  shieldBlock: {pause:0.022, strength:1.35, duration:0.12, flash:0, particle:'block', life:0.24, lift:20, scale:0.7, rank:2},
  wallSlam: {pause:0.064, strength:3.65, duration:0.21, flash:0.23, particle:'wall-impact', life:0.45, lift:3, scale:0.62, rank:5},
  thermal: {pause:0.035, strength:2.4, duration:0.17, flash:0.22, particle:'thermal-burst', life:0.42, lift:14, scale:0.68, rank:3},
});
const recentByGame = new WeakMap();

export function combatImpactKind(target, {heavy=false, cut=false, kind}={}) {
  if (Object.hasOwn(IMPACT_PROFILES, kind)) return kind;
  if (encounterRole(target || {}) === 'boss' || target?.boss) return 'boss';
  return heavy ? 'heavy' : cut ? 'cut' : null;
}

export function triggerCombatImpact(game, source, target, options = {}) {
  const kind = combatImpactKind(target, options);
  if (!kind || !game || !target) return null;
  let recent = recentByGame.get(game);
  if (!recent) recentByGame.set(game, recent = new WeakMap());
  let last = recent.get(target);
  if (!last) recent.set(target, last = {});
  const now = game.time || 0;
  const delay = kind === 'cut' ? 0.085 : 0.16;
  if (now - (last[kind] ?? -Infinity) < delay) return null;
  last[kind] = now;

  const profile = IMPACT_PROFILES[kind];
  target.flash = Math.max(target.flash || 0, profile.flash);
  if (combatTuning.impactFreeze && profile.pause) {
    game.combatHitstop = Math.max(game.combatHitstop || 0, profile.pause);
  }
  if (combatTuning.impactShake > 0 && !target.room) {
    const shake = {
      x:target.x ?? source?.x ?? 0, y:target.y ?? source?.y ?? 0,
      strength:profile.strength, duration:profile.duration, age:0, rank:profile.rank,
      seed:((Number(target.id)||0)*17 + (Number(source?.id)||0)*7) % 31,
    };
    const active = game.combatImpactShakes ??= [];
    if (active.length >= 6) {
      const weakest = active.reduce((i, effect, j) => effect.rank < active[i].rank ? j : i, 0);
      if (active[weakest].rank <= profile.rank) active.splice(weakest, 1, shake);
    } else {
      active.push(shake);
    }
  }
  return {kind, ...profile};
}

export function showCombatImpact(game, source, target, options = {}) {
  const impact = triggerCombatImpact(game, source, target, options);
  if (!impact) return null;
  const lift = impact.lift + (target.jumpHeight || 0) + (target.groundHeight || 0);
  const room = target.room || null;
  const angle = options.angle ?? Math.atan2(target.y-(source?.y??target.y), target.x-(source?.x??target.x));
  const point = {id:target.id, x:room ? target.roomX??target.x : target.x, y:(room ? target.roomY??target.y : target.y)-lift};
  emitGameplayFx(game, impact.particle, point, {room, angle, life:impact.life, scale:impact.scale});
  return impact;
}

export function advanceCombatImpacts(game, dt) {
  const active = game.combatImpactShakes;
  if (!active?.length) return;
  for (let i = active.length - 1; i >= 0; i--) {
    const shake = active[i];
    shake.age += dt;
    if (shake.age >= shake.duration) active.splice(i, 1);
  }
}

export function combatImpactCameraOffset(impact) {
  if (!impact || !(impact.duration > 0)) return {x:0,y:0};
  const t = Math.max(0, Math.min(1, (impact.age || 0) / impact.duration));
  const envelope = (1-t)*(1-t);
  const phase = (1-t)*34 + (impact.seed || 0);
  const strength = (impact.strength || 0) * envelope;
  return {x:Math.sin(phase)*strength, y:Math.cos(phase*1.31)*strength*0.48};
}

export function viewCombatImpact(game, camera, viewerWidth, viewerHeight, reducedMotion) {
  let strongest = null;
  let best = 0;
  if (!reducedMotion && combatTuning.impactShake > 0) {
    const zoom = camera.zoom || 1;
    for (const impact of game.combatImpactShakes || []) {
      const distance = Math.max(
        Math.abs(impact.x-camera.x)*zoom/Math.max(1, viewerWidth/2),
        Math.abs(impact.y-camera.y)*zoom/Math.max(1, viewerHeight/2),
      );
      const weight = Math.max(0, 1-Math.max(0, distance-0.75)/0.5);
      const strength = impact.strength * weight * (1-impact.age/impact.duration);
      if (strength > best) {
        best = strength;
        strongest = {...impact, strength:impact.strength*weight*combatTuning.impactShake};
      }
    }
  }
  return combatImpactCameraOffset(strongest);
}
