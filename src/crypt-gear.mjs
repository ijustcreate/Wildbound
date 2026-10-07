import { ITEMS, itemKind } from './items.mjs';
import { ignite } from './hazards.mjs';
import { propBase } from './environment.mjs';
import { clearShot } from './navigation.mjs';
import { meleeCanHit, meleeProfile } from './melee-geometry.mjs';
import { charmCanTarget } from './succubus-charm.mjs';
import { playerMotion, playerAction, playerPose, playerEquipmentAction, playerJointAngle, facingIndex, projectPoint } from './player-motion.mjs';
import { combatPhase, combatWeaponVector, SWING_ACTIONS } from './combat-animation.mjs';
import { PLAYER_RENDER_SIZE } from './render-settings.mjs';

export const CRYPT_GEAR_IDS = Object.freeze(['coffin_lid_shield', 'crypt_flame_sword']);
export const CRYPT_FLAME_LIMITS = Object.freeze({
  enemySeconds: 2, enemyDamage: 3, treeSeconds: 6, treeDamagePerSecond: 40,
  burningTrees: 32, treeParticles: 96, sharedParticles: 384,
  weaponParticlesPerHand: 12, particleSeconds: 0.55,
});
const HANDS = ['hand1', 'hand2'];
const TREES = new Set(['tree', 'palm', 'snow_tree', 'leafless_tree', 'grave_forest_tree']);
const finite = (value, fallback) => Number.isFinite(value) ? value : fallback;
const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
const flameEquipped = (p, slot) => HANDS.includes(slot) && p?.equipment?.[slot] === 'crypt_flame_sword';
const meleeLoadout = p => !HANDS.some(slot => {
  const def = ITEMS[p.equipment?.[slot]];
  // An exhausted staff can fall back to real melee alongside an offhand sword.
  return (def?.magic && def.base !== 'staff') || def?.ranged || def?.shot;
});

// Contact hook, not an attack attempt: call AFTER positive damageEnemy and BEFORE
// knockback, with the hand that contributed melee damage. No fire is made on a
// swing, and hazards remains the sole owner of enemy burn damage and particles.
export function flamingMeleeHit(g, p, target, slot = 'hand1') {
  if (!flameEquipped(p, slot) || !meleeLoadout(p) || !(p.hp > 0) || !(p.attack > 0) || p.room || p.ui ||
      !target || !(target.hp > 0) || target.room || target.practiceTarget || target.faction === 'ally' ||
      g.players?.includes(target) || !charmCanTarget(g, p, target)) return false;
  const enemy = g.enemies?.includes(target) || (target.wildTiger && g.ghosts?.includes(target));
  if (!enemy || ![p.x, p.y, target.x, target.y].every(Number.isFinite)) return false;
  const melee = meleeProfile(p), profile = p.meleeSweep ? { ...melee, range: 96, arc: 360 } : melee;
  const visible = point => !g.projectileBlocked || (
    !g.projectileBlocked(point.x, point.y, 0.5) && clearShot(g, p, point, 0.5) &&
    (target.kind === 'anaconda' || clearShot(g, target, point, 0.5))
  );
  if (!meleeCanHit(p, target, profile, visible)) return false;
  const cfg = ITEMS.crypt_flame_sword.meleeBurn;
  ignite(target, clamp(cfg.duration, 0, CRYPT_FLAME_LIMITS.enemySeconds), clamp(cfg.damage, 0, CRYPT_FLAME_LIMITS.enemyDamage));
  target.killedBy = p.id;
  return true;
}

// Invoke only from harvest's successful-contact callback. Harvest has already
// selected the rooted prop, played the work animation and applied melee damage.
export function igniteSwordTree(g, p, tree) {
  if (!p || !(p.hp > 0) || p.room || !meleeLoadout(p) || !HANDS.some(slot => flameEquipped(p, slot)) ||
      !tree || !g.scenery?.includes(tree) || !TREES.has(tree.kind) || tree.depleted || tree.fallen || tree.falling ||
      ![tree.x, tree.y, tree.size].every(Number.isFinite)) return false;
  if (!(tree.cryptBurn > 0) && g.scenery.filter(s => s.cryptBurn > 0 && !s.depleted && !s.falling).length >= CRYPT_FLAME_LIMITS.burningTrees) return false;
  const threshold = clamp(finite(tree.maxHarvest, Math.round(tree.size * 0.85)), 12, CRYPT_FLAME_LIMITS.treeSeconds * CRYPT_FLAME_LIMITS.treeDamagePerSecond);
  tree.maxHarvest = threshold;
  tree.cryptBurn = CRYPT_FLAME_LIMITS.treeSeconds;
  tree.cryptBurnRate = Math.min(CRYPT_FLAME_LIMITS.treeDamagePerSecond, Math.max(24, threshold / CRYPT_FLAME_LIMITS.treeSeconds));
  tree.cryptBurnSource = p.id;
  tree.cryptFallDirection = p.faceX < 0 ? -1 : 1;
  tree.cryptParticleTimer ??= 0;
  return true;
}
export const onFlamingHarvest = igniteSwordTree;

function clearTreeBurn(tree) {
  tree.cryptBurn = 0;
  delete tree.cryptBurnRate;
  delete tree.cryptBurnSource;
  delete tree.cryptFallDirection;
  delete tree.cryptParticleTimer;
}

// Tick once in environment simulation. Start the existing rooted fall only;
// tickEnvironment owns its progress, stump and exactly-once logs/coconuts.
export function tickFlamingTrees(g, dt) {
  if (!Number.isFinite(dt) || dt < 0) throw new RangeError('dt must be finite nonnegative seconds');
  if (!dt || (g.phase && !['play', 'won'].includes(g.phase))) return;
  let burning = 0, particles = (g.fireParticles || []).filter(f => f.cryptTree && f.life > 0).length, changed = false;
  for (const tree of g.scenery || []) {
    if (!(tree.cryptBurn > 0)) continue;
    if (!TREES.has(tree.kind) || tree.depleted || tree.fallen || tree.falling || ++burning > CRYPT_FLAME_LIMITS.burningTrees ||
        ![tree.x, tree.y, tree.size].every(Number.isFinite)) { clearTreeBurn(tree); continue; }
    const elapsed = Math.min(dt, clamp(finite(tree.cryptBurn, 0), 0, CRYPT_FLAME_LIMITS.treeSeconds));
    tree.cryptBurn = Math.max(0, Math.min(tree.cryptBurn, CRYPT_FLAME_LIMITS.treeSeconds) - elapsed);
    const threshold = clamp(finite(tree.maxHarvest, Math.round(tree.size * 0.85)), 12, CRYPT_FLAME_LIMITS.treeSeconds * CRYPT_FLAME_LIMITS.treeDamagePerSecond);
    tree.harvest = Math.min(threshold, Math.max(0, finite(tree.harvest, 0)) + elapsed * clamp(finite(tree.cryptBurnRate, 24), 0, CRYPT_FLAME_LIMITS.treeDamagePerSecond));
    tree.hitAt = finite(g.time, 0);
    tree.cryptParticleTimer = Math.max(0, finite(tree.cryptParticleTimer, 0) - dt);
    if (!tree.cryptParticleTimer) {
      tree.cryptParticleTimer = 0.12;
      const base = propBase(tree), height = clamp(tree.size * 0.6, 24, 90);
      for (let n = 0; n < 3 && particles < CRYPT_FLAME_LIMITS.treeParticles && (g.fireParticles?.length || 0) < CRYPT_FLAME_LIMITS.sharedParticles; n++) {
        (g.fireParticles ||= []).push({
          x: Math.round(base.x + Math.sin(finite(g.time, 0) * 9 + n * 2 + tree.x) * 6),
          y: Math.round(base.y - 8 - n * height / 3),
          life: CRYPT_FLAME_LIMITS.particleSeconds, smoke: n === 2, cryptTree: true,
        });
        particles++;
      }
    }
    if (tree.harvest >= threshold - 1e-8) {
      tree.harvest = threshold;
      tree.falling = 0.001;
      tree.fallDirection = tree.cryptFallDirection === -1 ? -1 : 1;
      tree.logCount = clamp(Math.round(tree.size / 32), 2, 12);
      clearTreeBurn(tree);
      changed = true;
    } else if (!tree.cryptBurn) clearTreeBurn(tree);
  }
  if (changed) g.persist?.();
}

const HIDDEN_HAND_ACTIONS = new Set(['salvage', 'mine', 'woodcut', 'carry', 'pickup', 'found_unique', 'swim', 'sleep', 'death', 'get_up']);
function handsVisible(p) {
  if (p.hp <= 0 || p.swimming || HIDDEN_HAND_ACTIONS.has(playerAction(p))) return false;
  const cosmetics = p.field?.cosmetics;
  return !(cosmetics?.stow && !p.moving && !(p.attack > 0) && !(p.charge > 0) && !p.blocking);
}

// The same posed hand, blade vector, wearable transform and joint rotation as
// drawPlayer. Returning world coordinates keeps flames attached through jumps,
// broad/slim bodies, layered combat, authored rigs and all eight directions.
export function cryptSwordTip(p, slot, time, model = playerMotion, size = PLAYER_RENDER_SIZE) {
  if (!flameEquipped(p, slot) || !handsVisible(p)) return null;
  const d = facingIndex(p.faceX, p.faceY), side = slot === 'hand1' ? 'R' : 'L', joint = 'hand' + side;
  const pose = playerPose(p, time, model), v = [...pose[joint]];
  if (p.appearance?.build === 'broad') v[0] *= 1.12;
  else if (p.appearance?.build && p.appearance.build !== 'standard') v[0] *= 0.9;
  const hand = projectPoint(v, d), equipment = playerEquipmentAction(p, time, model), a = d * Math.PI / 4;
  const attack = p.attack > 0 || p.animationAction === 'slash';
  let tip = { x: attack ? -Math.sin(a) * 12 : -Math.sin(a) * 5 + Math.cos(a) * (side === 'R' ? 3 : -3), y: -14 + (attack ? Math.cos(a) * 5 : 0) };
  if (!model.skeleton && !model.robot && model.artGeneration === 3 && SWING_ACTIONS.includes(equipment.action)) {
    const action = equipment.action, f = equipment.frame / (model.clips[action].length - 1);
    const phase = action === 'sword_combo' ? (f <= 0.5 ? f * 2 : (f - 0.5) * 2) : f;
    const reverse = action === 'swipe_two' || (action === 'sword_combo' && f > 0.5);
    const angle = (phase < 0.25 ? -0.7 : phase < 0.65 ? -0.7 + (phase - 0.25) / 0.4 * 2.5 : 1.8 - (phase - 0.65) / 0.35 * 1.6) * (reverse ? -1 : 1);
    tip = { x: Math.sin(angle) * 15 * Math.cos(a), y: -Math.cos(angle) * 15 };
    if (model.combatRevision === 4) {
      const dual = ['sword', 'dagger'].includes(itemKind(p.equipment?.[side === 'R' ? 'hand2' : 'hand1']));
      const active = !dual || (combatPhase(action, f).reverse ? side === 'L' : side === 'R');
      tip = projectPoint(combatWeaponVector(active ? action : 'slash', active ? f : 0, 'sword', side), d);
    }
  }
  const visual = model.wearables?.[p.equipment[slot]]?.[d];
  if (visual?.pixels?.some(Boolean)) {
    // Custom sprites may declare a tip; otherwise take the topmost painted row.
    const first = visual.pixels.findIndex(Boolean), row = Math.floor(first / 16), xs = [];
    for (let x = 0; x < 16; x++) if (visual.pixels[row * 16 + x]) xs.push(x);
    tip = { x: finite(visual.tipX, xs.reduce((sum, x) => sum + x, 0) / xs.length - 7.5), y: finite(visual.tipY, row - 7.5) };
  }
  const rotation = finite(visual?.rotation, 0) * Math.PI / 180, scale = finite(visual?.scale, 1);
  const x = (tip.x * Math.cos(rotation) - tip.y * Math.sin(rotation)) * scale + finite(visual?.x, 0);
  const y = (tip.x * Math.sin(rotation) + tip.y * Math.cos(rotation)) * scale + finite(visual?.y, 0);
  const angle = playerJointAngle(p, time, model, d, joint) * Math.PI / 180;
  return { x: p.x + (hand.x + x * Math.cos(angle) - y * Math.sin(angle)) * size / 48,
    y: p.y - (p.jumpHeight || 0) - (p.groundHeight || 0) + (hand.y + x * Math.sin(angle) + y * Math.cos(angle)) * size / 48 };
}

// Draw in world space beside the actor render. Fixed analytic square embers:
// no saved/spawned particles, gradients, shadows, blur or accumulating trails.
export function drawCryptWeaponFlames(ctx, p, time, model = playerMotion, size = PLAYER_RENDER_SIZE) {
  if (!p || !Number.isFinite(time) || ![p.x, p.y].every(Number.isFinite)) return 0;
  let count = 0;
  ctx.save();
  try {
    for (const slot of HANDS) {
      const tip = cryptSwordTip(p, slot, time, model, size);
      if (!tip || ![tip.x, tip.y].every(Number.isFinite)) continue;
      for (let i = 0; i < CRYPT_FLAME_LIMITS.weaponParticlesPerHand; i++) {
        const seed = finite(p.id, 0) * 0.13 + (slot === 'hand2' ? 0.37 : 0);
        const phase = time * (1.6 + i % 3 * 0.15) + i * 0.618 + seed, age = phase - Math.floor(phase);
        const pixelSize = i < 4 && age < 0.55 ? 2 : 1;
        ctx.fillStyle = age < 0.25 ? '#ffe4a2' : age < 0.65 ? '#ffb448' : '#e66c32';
        ctx.fillRect(Math.round(tip.x + Math.sin(i * 7.7 + age * 4) * (1 + age * 3)), Math.round(tip.y - age * 10), pixelSize, pixelSize);
        count++;
      }
    }
  } finally { ctx.restore(); }
  return count;
}

// Fit the lid to the existing renderer's independently depth-sorted offhand.
// Register only missing directions; existing authored wearable art wins.
export function registerCryptGearArt(model = playerMotion) {
  model.wearables ||= {};
  const views = model.wearables.coffin_lid_shield ||= {};
  for (let d = 0; d < 8; d++) {
    if (views[d]) continue;
    const pixels = Array(256).fill(null), profile = d === 2 || d === 6, rear = d >= 3 && d <= 5;
    const widths = [4, 4, 6, 8, 10, 12, 12, 12, 10, 10, 10, 8, 8, 8, 6];
    for (let y = 0; y < 15; y++) {
      const width = profile ? 3 : d % 2 ? Math.max(4, widths[y] - 2) : widths[y], start = profile ? 7 : 8 - width / 2;
      for (let x = start; x < start + width; x++) {
        const edge = x === start || x === start + width - 1 || y === 0 || y === 14;
        pixels[y * 16 + x] = edge ? '#352c27' : profile ? '#8e9895' : rear ? '#624735' : x % 3 === 0 ? '#654731' : '#896143';
        if (!edge && !profile && (y === 5 || y === 11)) pixels[y * 16 + x] = rear ? '#392c26' : '#667278';
        if (!edge && !rear && !profile && x === start + 1) pixels[y * 16 + x] = '#bc9262';
      }
    }
    views[d] = { pixels };
  }
  return model;
}
registerCryptGearArt();
