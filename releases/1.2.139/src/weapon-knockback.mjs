import {creatures} from './definitions.mjs';
import {hostileEnemy} from './enemy-systems.mjs';
import {encounterRole} from './expedition-trials.mjs';
import {actorRadius, clearShot, collisionOffset, flies} from './navigation.mjs';
import {meleeBodyRadius} from './melee-geometry.mjs';
import {stationaryCreature} from './stationary-creatures.mjs';
import {isCharmed} from './succubus-charm.mjs';
import {PEACEFUL_FAUNA_KINDS} from './wild-fauna-data.mjs';
import {emitGameplayFx} from './gameplay-fx.mjs';
import {ignite} from './hazards.mjs';
import {recordWeaponCombo} from './weapon-combo-discovery.mjs';
import {recordTeamFinish} from './team-combat.mjs';
import {showCombatImpact} from './combat-impact.mjs';

const activeByGame = new WeakMap();
const pendingTrapByActor = new WeakMap();
const MAX_LAUNCHES = 12;
const MAX_TRANSFERS = 2;
const elevation = enemy => (enemy.jumpHeight || 0) + (enemy.groundHeight || 0);
const bodyRadius = enemy => Math.max(actorRadius(enemy), meleeBodyRadius(enemy) * .75);

function canHit(enemy) {
  return hostileEnemy(enemy) && !enemy.friendly && enemy.owner == null && enemy.allyOwner == null &&
    enemy.controlledBy == null && !enemy.controlOwner && !enemy.holidayReindeer && !enemy.carriedBy && !enemy.room &&
    !enemy.trainRide && !enemy.invincible && !enemy.unattackable && !enemy.ghost && enemy.kind !== 'ghost' &&
    !PEACEFUL_FAUNA_KINDS.includes(enemy.kind) &&
    !['ally', 'neutral'].includes(creatures[enemy.kind]?.faction) && !flies(enemy) && !enemy.swimming;
}

function canLaunch(enemy) {
  return canHit(enemy) && !enemy.boss && !enemy.cryptBoss && encounterRole(enemy) !== 'boss' &&
    !stationaryCreature(enemy) && !enemy.rooted && !enemy.frozen &&
    !['charge', 'snared'].includes(enemy.state) && elevation(enemy) < 12;
}

export function launchMeleeTarget(game, player, enemy, charge) {
  if (isCharmed(player) || !game.enemies.includes(enemy) || enemy.spawnReadyAt > game.time || !canLaunch(enemy)) return false;
  const length = Math.hypot(player.faceX, player.faceY);
  if (!length) return false;
  let launches = activeByGame.get(game);
  if (!launches) activeByGame.set(game, launches = new Map());
  if (launches.size >= MAX_LAUNCHES || launches.has(enemy)) return false;

  const adjustedCharge = Math.min(1.2, Math.max(0, charge || 0));
  launches.set(enemy, {
    player, dx: player.faceX / length, dy: player.faceY / length,
    speed: 290 + 110 * adjustedCharge, remaining: .32, depth: 0,
    visited: new Set([enemy]), damage: 10 + 5 * adjustedCharge,
  });
  enemy.attack = 0;
  return true;
}

function showImpact(game, point, text, color, particle=true) {
  if(particle) emitGameplayFx(game, 'hit', {x: point.x, y: point.y - 14}, {life: .24, scale: .9});
  if (game.effects.filter(effect => effect.weaponKnockback).length < 24) {
    game.effects.push({weaponKnockback: true, x: point.x, y: point.y - 38, text, color, life: .72});
  }
}

function eligibleTarget(game, enemy, launch, launches, nextX, nextY) {
  const radius = bodyRadius(enemy);
  let nearest = null;
  let distance = Infinity;
  for (const target of game.enemies) {
    if (launch.visited.has(target) || launches.has(target) || !canHit(target) ||
        target.spawnReadyAt > game.time || Math.abs(elevation(target) - elevation(enemy)) > 12) continue;
    const dx = target.x - enemy.x;
    const dy = target.y - enemy.y;
    const projection = dx * launch.dx + dy * launch.dy;
    const gap = Math.hypot(target.x - nextX, target.y - nextY);
    if (projection <= 0 || gap >= radius + bodyRadius(target) + 5 || gap >= distance) continue;
    if (!clearShot(game, enemy, target, 1)) continue;
    nearest = target;
    distance = gap;
  }
  return nearest;
}

function dealImpact(game, player, enemy, amount, damageEnemy) {
  const dealt = damageEnemy(enemy, Math.round(amount), 'impact', {g: game, p: player, secondary: true});
  if (dealt > 0) {
    enemy.killedBy = player.id;
    enemy.ritualKill = false;
    enemy.aggro = true;
  }
  return dealt > 0;
}

function collideBodies(game, enemy, target, launch, launches, damageEnemy) {
  if (!dealImpact(game, launch.player, target, launch.damage, damageEnemy)) return;
  dealImpact(game, launch.player, enemy, launch.damage * .45, damageEnemy);
  launch.visited.add(target);
  const chained = launch.depth > 0;
  showImpact(game, target, chained ? 'CHAIN REACTION' : 'BODY CRASH', '#ffe49d');
  game.onSound?.('hurt', target);
  recordWeaponCombo(game, launch.player, chained ? 'chain_reaction' : 'body_collision');

  if (enemy.burning > 0 && target.hp > 0 && !(target.burning > 0) && !creatures[target.kind]?.fireImmune) {
    ignite(target, Math.max(1.4, Math.min(2.5, enemy.burning)), Math.min(4, enemy.burnDamage || 3));
    if (target.burning > 0) {
      emitGameplayFx(game, 'burning', target, {targetId: target.id, life: .38});
      recordWeaponCombo(game, launch.player, 'fire_bowling');
    }
  }
  if (launch.depth + 1 < MAX_TRANSFERS && canLaunch(target) && launches.size < MAX_LAUNCHES) {
    launches.set(target, {
      ...launch, remaining: .27, depth: launch.depth + 1,
      speed: Math.max(240, launch.speed * .84), damage: launch.damage * .8,
    });
    target.attack = 0;
  } else if (canLaunch(target)) {
    target.enemyFlinchUntil = Math.max(target.enemyFlinchUntil || 0, game.time + .13);
  }
}

export function recordBowledTrap(game, enemy, trap) {
  const pending = pendingTrapByActor.get(enemy);
  if (!pending || pending.game !== game || pending.trap !== trap || pending.until < game.time) return;
  pendingTrapByActor.delete(enemy);
  showImpact(game, enemy, 'TRAP SHOT', '#b9e6a1');
  recordWeaponCombo(game, pending.player, 'trap_bowling');
  recordTeamFinish(game, trap.owner, pending.player, 'team_trap');
}

function nearestArmedTrap(game, enemy, before) {
  return game.traps?.find(trap => trap.life > 0 && trap.owner != null && trap.variant !== 'slow' &&
    Math.hypot(before.x - trap.x, before.y - trap.y) >= 30 &&
    Math.hypot(enemy.x - trap.x, enemy.y - trap.y) < 30 && clearShot(game, enemy, trap, 1));
}

export function tickWeaponKnockback(game, dt, damageEnemy) {
  const launches = activeByGame.get(game);
  if (!launches?.size || !(dt > 0)) return null;
  const carried = new Set();
  // Transfers queued during this tick begin moving on the next tick.
  for (const [enemy, launch] of Array.from(launches)) {
    if (!game.enemies.includes(enemy) || !canLaunch(enemy) || isCharmed(launch.player)) {
      launches.delete(enemy);
      continue;
    }
    const elapsed = Math.min(dt, launch.remaining);
    const distance = launch.speed * elapsed;
    const substeps = Math.max(1, Math.ceil(distance / 3));
    let trapped = false;
    let stopped = false;
    for (let step = 0; step < substeps; step++) {
      const dx = launch.dx * distance / substeps;
      const dy = launch.dy * distance / substeps;
      const before = {x: enemy.x, y: enemy.y};
      const target = eligibleTarget(game, enemy, launch, launches, before.x + dx, before.y + dy);
      if (target) {
        collideBodies(game, enemy, target, launch, launches, damageEnemy);
        stopped = true;
        break;
      }
      game.moveActor(enemy, dx, dy);
      if (Math.hypot(enemy.x - before.x, enemy.y - before.y) < .05) {
        const radius = actorRadius(enemy);
        if (game.blocked(before.x + dx * 2, before.y + dy * 2, radius, false, true, false, collisionOffset(game, enemy), elevation(enemy)) &&
            dealImpact(game, launch.player, enemy, launch.damage * .85, damageEnemy)) {
          showCombatImpact(game,launch.player,enemy,{kind:'wallSlam',angle:Math.atan2(launch.dy,launch.dx)});
          showImpact(game, enemy, 'WALL SLAM', '#ffc997', false);
          game.onSound?.('fall', enemy);
          recordWeaponCombo(game, launch.player, 'wall_slam');
        }
        stopped = true;
        break;
      }
      const trap = nearestArmedTrap(game, enemy, before);
      if (trap) {
        pendingTrapByActor.set(enemy, {game, player: launch.player, trap, until: game.time + .25});
        trapped = stopped = true;
        break;
      }
    }
    enemy.moving = false;
    enemy.flash = Math.max(0, (enemy.flash || 0) - elapsed);
    launch.remaining -= elapsed;
    if (!trapped) carried.add(enemy);
    if (stopped || launch.remaining <= 0) launches.delete(enemy);
  }
  for (const enemy of launches.keys()) carried.add(enemy);
  return carried;
}
