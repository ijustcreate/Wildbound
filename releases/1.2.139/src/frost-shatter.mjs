import {spawnProtected} from './combat-fairness.mjs';
import {encounterRole} from './expedition-trials.mjs';
import {emitGameplayFx} from './gameplay-fx.mjs';
import {clearShot} from './navigation.mjs';
import {isCharmed} from './succubus-charm.mjs';
import {PEACEFUL_FAUNA_KINDS} from './wild-fauna-data.mjs';
import {recordWeaponCombo} from './weapon-combo-discovery.mjs';
import {recordTeamFinish} from './team-combat.mjs';
import {combatTuning} from './combat-workshop-settings.mjs';
import {showCombatImpact} from './combat-impact.mjs';

const SHARD_TARGET_LIMIT = 4;
const SHARD_FREEZE_SECONDS = 1.25;
const SAME_SWING_GRACE = 0.2;
const frostOwners = new WeakMap();

function frostTarget(game, target) {
  return target.hp > 0 && !target.practiceTarget && !target.unattackable &&
    !target.invincible && !(target.invuln > 0) && !target.friendly &&
    !target.pet && !target.hunterPet && target.owner == null && !target.ownerKey &&
    target.allyOwner == null && target.controlledBy == null && !target.carriedBy &&
    !['ally', 'neutral', 'friendly'].includes(target.faction) &&
    !PEACEFUL_FAUNA_KINDS.includes(target.kind) && encounterRole(target) !== 'peaceful' &&
    !game.players?.includes(target) && !spawnProtected(target, game.time || 0);
}

function isBoss(target) {
  return target.boss || target.cryptBoss || encounterRole(target) === 'boss';
}

export function planFrostFinisher(target, amount, type, context) {
  const game = context?.g;
  const source = context?.p;
  const heavy = context?.melee && context?.heavy && type === 'physical';
  const thermal = type === 'fire' || context?.shot?.flameDistance > 0;
  if (!(amount > 0) || !game || !source || !(source.hp > 0) || isCharmed(source) || context.secondary ||
      (!heavy && !thermal) || (type === 'physical' && (target.tacticalBlocked || context.glancing)) ||
      !frostTarget(game, target) || (source.room || null) !== (target.room || null) ||
      !(target.frozen > (target.jumanjiVines || 0)) ||
      (target.frostShardAt ?? -Infinity) + SAME_SWING_GRACE > (game.time || 0)) return null;

  const boss = isBoss(target);
  const multiplier = heavy ? combatTuning.shatterBonus : combatTuning.thermalBonus;
  const factor = boss ? (heavy ? multiplier*0.25/0.65 : multiplier*0.18/0.42) : multiplier;
  const cap = heavy ? (boss ? 25 : 46) : (boss ? 18 : 32);
  const minimum = !factor ? 0 : boss ? 1 : heavy ? 4 : 3;
  const setup = frostOwners.get(target);
  return {
    kind:heavy ? 'ice_shatter' : 'thermal_shock',
    bonus:Math.min(cap, Math.max(minimum, Math.round(amount*factor))),
    setupId:setup?.game === game && setup.until >= game.time ? setup.id : null,
  };
}

export function applyCombatFrost(game, target, duration, ownerId) {
  const existing = target.frozen || 0;
  const owner = game.players?.find(player => player.id === ownerId && player.hp > 0);
  target.frozen = Math.max(existing, duration);
  if (owner && !(duration < existing && frostOwners.get(target)?.until > game.time)) {
    frostOwners.set(target, {game, id:owner.id, until:(game.time || 0)+duration});
  }
}

export function freezeFromIceSpell(game, bolt, target) {
  if (!bolt.ice || bolt.hostile || !frostTarget(game, target)) return false;
  const charged = bolt.structureCharge >= 0.75;
  if (!charged && game.random() >= 0.35) return false;
  const duration = isBoss(target) ? 1.2 : charged ? 2.4 : 1.6;
  applyCombatFrost(game, target, duration, bolt.owner);
  return true;
}

export function finishCombatFrost(game, source, target, finisher, damageEnemy) {
  // Break only the ice. Jungle vines can still be holding the same actor.
  target.frozen = target.jumanjiVines || 0;
  delete target.frostShardAt;
  frostOwners.delete(target);
  if (finisher.kind === 'thermal_shock') {
    showCombatImpact(game, source, target, {kind:'thermal'});
    if (game.effects.filter(effect => effect.comboFinisher).length < 18) {
      const room = target.room || null;
      game.effects.push({
        comboFinisher:true, room, x:room ? target.roomX??target.x : target.x,
        y:(room ? target.roomY??target.y : target.y)-39, text:'THERMAL SHOCK', color:'#f5c9a5', life:.7,
      });
    }
    if (target.hp > 0 && !isBoss(target)) {
      target.enemyFlinchUntil = Math.max(target.enemyFlinchUntil || 0, game.time + combatTuning.thermalOpening);
    }
    game.onSound?.('glassBreak', target);
  } else {
    burstFrostShatter(game, source, target, finisher.bonus, damageEnemy);
  }
  recordWeaponCombo(game, source, finisher.kind);
  recordTeamFinish(game, finisher.setupId, source, 'team_elements');
}

function burstFrostShatter(game, source, target, bonus, damageEnemy) {
  const height = actor => (actor.groundHeight || 0) + (actor.jumpHeight || 0);
  const room = target.room || null;
  const x = room ? (target.roomX ?? target.x) : target.x;
  const y = (room ? (target.roomY ?? target.y) : target.y) - height(target);
  // Start with the impact flash so the existing block breaks on contact.
  emitGameplayFx(game, 'ice-break', {x, y, id: target.id}, {room, life: 0.5, duration: 0.65, scale: 0.9});
  game.onSound?.('glassBreak', target);
  const range = combatTuning.shatterRange;

  // Stay in the current room and at the struck actor's elevation. Geometry
  // checks are limited to nearby candidates, closest first.
  const candidates = [];
  for (const enemy of game.enemies || []) {
    if (enemy === target || (enemy.room || null) !== room ||
        !frostTarget(game, enemy) || Math.abs(height(enemy) - height(target)) > 20) continue;
    const distance = Math.hypot(enemy.x - target.x, enemy.y - target.y);
    if (distance <= range) candidates.push({enemy, distance});
  }
  candidates.sort((a, b) => a.distance - b.distance);
  let hits = 0;
  for (const {enemy, distance} of candidates) {
    if (hits >= SHARD_TARGET_LIMIT) break;
    if (game.projectileBlocked?.(enemy.x, enemy.y, 1) ||
        (game.projectileBlocked && !clearShot(game, target, enemy, 1))) continue;
    const damage = bonus > 0 ? Math.max(3, Math.round(bonus * (0.55 - distance / range * 0.3))) : 0;
    if (!damage) break;
    if (!(damageEnemy(enemy, damage, 'ice', {g: game, p: source, secondary: true}) > 0)) continue;
    hits++;
    enemy.killedBy = source.id;
    enemy.ritualKill = false;
    if (enemy.hp > 0) {
      const alreadyFrozen = enemy.frozen > (enemy.jumanjiVines || 0);
      applyCombatFrost(game, enemy, isBoss(enemy) ? 0.65 : SHARD_FREEZE_SECONDS, source.id);
      // One broad sword swing cannot rekindle itself on its own fresh shards.
      if (!alreadyFrozen) enemy.frostShardAt = game.time || 0;
    }
  }
}
