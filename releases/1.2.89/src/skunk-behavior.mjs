import { markSkunkAttacked } from './skunk-state.mjs';

const RANGE = 58;
const COOLDOWN = 60;
const CLOUD_LIFE = 12;
const TICK_EVERY = 2;
const DAMAGE = 2;
const MAX_EFFECTS = 160;

const distance = (a, b) => Math.hypot((a.x || 0) - (b.x || 0), (a.y || 0) - (b.y || 0));
const living = actor => actor && actor.hp > 0 && !actor.room && !actor.dead;

function nearestTarget(actor, targets = []) {
  return targets.filter(target => target !== actor && living(target))
    .sort((a, b) => distance(actor, a) - distance(actor, b))[0] || null;
}

function addCloud(game, skunk) {
  const fx = game.effects || (game.effects = []);
  // Keep transient gameplay visuals bounded if a test or a busy mob scene
  // accumulates other effects while the skunk cloud is alive.
  while (fx.length >= MAX_EFFECTS) fx.shift();
  const facingLength = Math.hypot(skunk.faceX || 0, skunk.faceY || 0) || 1;
  const backX = -(skunk.faceX || 0) / facingLength, backY = -(skunk.faceY || 0) / facingLength;
  const cloud = {
    x: skunk.x + backX * 12, y: skunk.y + backY * 10 + 2,
    age: 0, life: CLOUD_LIFE, until: (game.time || 0) + CLOUD_LIFE,
    nextTick: TICK_EVERY, pulse: 0, radius: RANGE,
  };
  skunk.skunkCloud = cloud;
  fx.push({ skunkCloud: true, x: cloud.x, y: cloud.y, radius: RANGE, color: '#99c45b', life: CLOUD_LIFE, total: CLOUD_LIFE, seed: skunk.id || 0 });
  skunk.skunkSprayReadyAt = (game.time || 0) + COOLDOWN;
  skunk.skunkAttacked = false;
  skunk.skunkSprayPhase = 'spray';
  skunk.skunkSprayTime = .48;
  skunk.moving = false;
  skunk.animationAction = 'spray-warning';
  skunk.state = 'spray';
}

function poisonTick(game, skunk, cloud, actors, damageEnemyFn) {
  for (const target of actors) {
    if (!living(target) || target === skunk || distance(target, cloud) > cloud.radius) continue;
    if (target.kind === 'skunk') continue;
    if (game.players?.includes(target)) {
      const before = target.hp, effectsBefore = game.effects?.length || 0;
      game.hurt?.(target, DAMAGE, null);
      if (target.hp < before) {
        const message = game.effects?.slice(effectsBefore).find(effect => effect.text);
        if (message) message.color = '#ade96e';
        else game.effects?.push({ x: target.x, y: target.y - 25, text: `−${Math.round(before - target.hp)}`, color: '#ade96e', life: .8 });
      }
    } else {
      const dealt = damageEnemyFn?.(target, DAMAGE, 'poison');
      if (dealt > 0) game.effects?.push({ x: target.x, y: target.y - 25, text: `−${Math.round(dealt)}`, color: '#ade96e', life: .8 });
    }
  }
}

export function tickSkunkClouds(game, dt, damageEnemyFn) {
  const actors = [...(game.players || []), ...(game.enemies || []), ...(game.ghosts || [])];
  for (const skunk of game.enemies || []) {
    const cloud = skunk.kind === 'skunk' ? skunk.skunkCloud : null;
    if (!cloud) continue;
    cloud.age += dt;
    cloud.life = Math.max(0, CLOUD_LIFE - cloud.age);
    const effect = game.effects?.find(fx => fx.skunkCloud && fx.seed === (skunk.id || 0) && Math.abs(fx.x - cloud.x) < .1 && Math.abs(fx.y - cloud.y) < .1);
    if (effect) effect.life = cloud.life;
    while (cloud.nextTick < CLOUD_LIFE && cloud.nextTick <= cloud.age) {
      poisonTick(game, skunk, cloud, actors, damageEnemyFn);
      cloud.nextTick += TICK_EVERY;
      cloud.pulse++;
    }
    if (cloud.life <= 0) {
      skunk.skunkCloud = null;
      if (game.effects) game.effects = game.effects.filter(fx => !(fx.skunkCloud && fx.seed === (skunk.id || 0) && Math.abs(fx.x - cloud.x) < .1 && Math.abs(fx.y - cloud.y) < .1));
    }
  }
}

export function tickSkunkActor(game, actor, dt, livingTargets = []) {
  if (actor?.kind !== 'skunk' || actor.hp <= 0 || actor.faction === 'ally' || actor.allyOwner != null) return false;
  const target = nearestTarget(actor, livingTargets);
  actor.wildlifeMoodTime = Math.max(0, (actor.wildlifeMoodTime || 0) - dt);
  if (actor.skunkSprayPhase === 'spray') {
    actor.skunkSprayTime = Math.max(0, (actor.skunkSprayTime || 0) - dt);
    actor.moving = false;
    actor.animationAction = 'spray-warning';
    actor.state = 'spray';
    if (actor.skunkSprayTime <= 0) actor.skunkSprayPhase = '';
    return true;
  }
  if (actor.skunkAttacked && (game.time || 0) >= (actor.skunkSprayReadyAt || 0)) {
    addCloud(game, actor);
    return true;
  }
  if (!target || distance(actor, target) > 150) {
    actor.moving = false;
    actor.animationAction = 'freeze';
    actor.state = 'idle';
    return true;
  }
  const dx = actor.x - target.x, dy = actor.y - target.y, d = Math.hypot(dx, dy) || 1;
  actor.faceX = dx / d; actor.faceY = dy / d;
  if (d > 82) {
    actor.moving = false;
    actor.animationAction = 'freeze';
    actor.state = 'idle';
    return true;
  }
  const step = Math.min(d, Math.max(0, actor.speed || 54) * 1.25 * dt);
  game.moveActor?.(actor, dx / d * step, dy / d * step);
  actor.moving = step > 0;
  actor.animationAction = actor.moving ? 'scurry' : 'freeze';
  actor.state = 'flee';
  return true;
}
