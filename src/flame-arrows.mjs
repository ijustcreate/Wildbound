import { waterAt, propBase } from './environment.mjs';
import { ignite } from './hazards.mjs';
import { igniteTallGrassAt } from './tall-grass.mjs';
import { emitGameplayFx } from './gameplay-fx.mjs';
import { templeLightSources } from './house-lights.mjs';
import { heldItemWorld } from './player-motion.mjs';
import { rangedRenderSize } from './ranged-launch.mjs';
import { setTreeFallDirection } from './tree-fall.mjs';
import { recordWeaponCombo } from './weapon-combo-discovery.mjs';
import { encounterCampfires } from './encounter-layout-data.mjs';

const flameRange = 260;
const water = new Set(['water', 'shallow', 'floodbridge']);
const trees = new Set(['tree', 'oak', 'pine', 'palm', 'snow_tree', 'leafless_tree', 'grave_forest_tree']);

export function arrowCanCatchFire(arrow) {
  return !arrow.stuck && !arrow.remove && !arrow.hostile && !arrow.rock && !arrow.ice &&
    !arrow.bansheeFrost && !arrow.flameUsed && !arrow.room && arrow.owner != null;
}

export function arrowFlameSources(game) {
  const flames = [];
  const add = (x, y, radius, bottom, top, owner = null) => {
    if (Number.isFinite(x) && Number.isFinite(y)) flames.push({ x, y, radius, bottom, top, owner });
  };
  for (const npc of game.questNpcs || []) {
    if (!npc.room && !npc.rescueExplorer && !npc.santa) {
      add(npc.campX ?? npc.x, (npc.campY ?? npc.y) + 10, 17, 1, 42);
    }
  }
  const fire = game.villageCampState?.fire;
  if (fire) add(fire.x, fire.y, 18, 1, 42);
  for (const campfire of encounterCampfires(game)) add(campfire.x, campfire.y, 18, 1, 42);
  const merchant = game.merchant;
  if (merchant && !merchant.room) add((merchant.campX ?? merchant.x) - 32, (merchant.campY ?? merchant.y) + 5, 10, 1, 35);
  for (const patch of game.firePatches || []) {
    if (patch.life > 0) add(patch.x + 16, patch.y + 16, 16, 0, 34);
  }
  for (const torch of templeLightSources(game)) add(torch.x, torch.y, 9, 6, 34);

  // A second explorer can hold a torch for the shot. Packed items and the
  // shooter's own equipment never count as a source.
  const size = rangedRenderSize(game);
  for (const player of game.players || []) {
    if (!(player.hp > 0) || player.room || player.swimming || player.trainRide || player.vehicleId || player.controlledFollowerId) continue;
    for (const hand of ['hand1', 'hand2']) {
      if (player.equipment?.[hand] !== 'torch') continue;
      const point = heldItemWorld(player, hand, game.time || 0, undefined, size);
      const height = player.y - point.y + 11 * size / 48;
      add(point.x, player.y, 10, Math.max(0, height - 11), height + 12, player.id);
    }
  }
  return flames;
}

// Intersect the horizontal disk and vertical flame interval over the same
// portion of the swept segment, including a grazing or rising shot.
export function arrowCrossesFlame(from, to, flame) {
  const x = from.x - flame.x, y = from.y - flame.y;
  const dx = to.x - from.x, dy = to.y - from.y, dz = to.z - from.z;
  const lengthSquared = dx * dx + dy * dy;
  const outside = x * x + y * y - flame.radius * flame.radius;
  let enter = 0, leave = 1;
  if (lengthSquared === 0) {
    if (outside > 0) return false;
  } else {
    const dot = x * dx + y * dy;
    const discriminant = dot * dot - lengthSquared * outside;
    if (discriminant < 0) return false;
    const distance = Math.sqrt(discriminant);
    enter = Math.max(enter, (-dot - distance) / lengthSquared);
    leave = Math.min(leave, (-dot + distance) / lengthSquared);
  }
  if (dz === 0) return enter <= leave && from.z >= flame.bottom && from.z <= flame.top;
  const low = (flame.bottom - from.z) / dz, high = (flame.top - from.z) / dz;
  return Math.max(enter, Math.min(low, high)) <= Math.min(leave, Math.max(low, high));
}

export function stepArrowFlame(game, arrow, from, getFlames) {
  const distance = Math.hypot(arrow.x - from.x, arrow.y - from.y);
  if (arrow.flameDistance > 0) arrow.flameDistance = Math.max(0, arrow.flameDistance - distance);
  if (arrowCanCatchFire(arrow)) {
    const owner = (game.players || []).find(player => player.id === arrow.owner);
    const source = owner && getFlames().find(flame => flame.owner !== owner.id && arrowCrossesFlame(from, arrow, flame));
    if (source) {
      arrow.flameUsed = true;
      arrow.flameDistance = flameRange;
      emitGameplayFx(game, 'torch', { x: arrow.x, y: arrow.y - arrow.z }, { life: 0.36, scale: 0.65 });
      recordWeaponCombo(game, owner, 'fire_arrows');
    }
  }
  if (!(arrow.flameDistance > 0) || arrow.z > 9) return;
  if (water.has(waterAt(game, arrow.x, arrow.y))) {
    arrow.flameDistance = 0;
    return;
  }
  arrow.flameGrassTravel = (arrow.flameGrassTravel ?? 14) + distance;
  if (arrow.flameGrassTravel >= 14) {
    arrow.flameGrassTravel %= 14;
    igniteTallGrassAt(game, arrow.x, arrow.y, { trail: true });
  }
}

export function flameArrowDamage(arrow) {
  return arrow.flameDistance > 0 ? Math.round(arrow.damage * 1.15) : arrow.damage;
}

export function flameArrowTargetHit(arrow, target, damage) {
  if (!(arrow.flameDistance > 0 && damage > 0 && target.hp > 0) || target.practiceTarget || target.tacticalBlocked) return false;
  ignite(target, 2, 3);
  return true;
}

export function flameArrowGroundHit(game, arrow, prop) {
  if (!(arrow.flameDistance > 0) || water.has(waterAt(game, arrow.x, arrow.y))) return;
  if ((arrow.z || 0) <= 16) igniteTallGrassAt(game, arrow.x, arrow.y);
  if (prop && trees.has(prop.kind) && !prop.fallen && !prop.falling && !prop.depleted) {
    const base = propBase(prop);
    if (Math.hypot(base.x - arrow.x, base.y - arrow.y) <= 23) {
      prop.torchBurn = Math.max(prop.torchBurn || 0, 1.25);
      prop.torchSource = arrow.owner;
      setTreeFallDirection(prop, arrow.vx, arrow.vy);
      game.persist?.();
    }
  }
  emitGameplayFx(game, 'torch', { x: arrow.x, y: arrow.y - Math.max(0, arrow.z || 0) }, { life: 0.27, scale: 0.5 });
}
