import { ITEMS, itemKind } from './items.mjs';

export function meleeProfile(actor) {
  const ids = [actor.equipment?.hand1, actor.equipment?.hand2].filter(Boolean);
  const weaponId = ids.find(id => ITEMS[id]?.damage && !ITEMS[id]?.magic && !ITEMS[id]?.ranged);
  const base = weaponId ? itemKind(weaponId) : 'unarmed';
  const def = weaponId ? ITEMS[weaponId] : null;
  const range = Number(def?.reach ?? ITEMS[base]?.reach) || (weaponId ? 76 : 49);
  return { weaponId, kind: base, range: range * (Number(actor.attackReach) || 1), arc: Number(actor.attackArc) || 90, whip: def?.style === 'whip' };
}

export function meleeTargetInArc(actor, target, profile = meleeProfile(actor)) {
  const dx = target.x - actor.x, dy = target.y - actor.y, distance = Math.hypot(dx, dy);
  if (!distance || distance >= profile.range) return false;
  const facing = Math.hypot(actor.faceX, actor.faceY) || 1;
  return (dx * actor.faceX + dy * actor.faceY) / (distance * facing) >= Math.cos(profile.arc * Math.PI / 360);
}
