import {combatTuning} from './combat-workshop-settings.mjs';

const raisedGuards = new WeakMap();
// Projection copies retain the live cue, while JSON and save snapshots omit it.
const openingKey = Symbol('charge counter opening');

function sameFloor(a, b) {
  return (a.room ?? null) === (b.room ?? null) &&
    Math.abs((a.groundHeight ?? a.trainGround ?? 0) - (b.groundHeight ?? b.trainGround ?? 0)) < 16;
}

export function raiseCounterGuard(game, player) {
  raisedGuards.set(player, {game, time: game.time});
}

// The caller already resolved front-facing shield contact in the normal hurt path.
export function catchChargeGuard(game, player, charger) {
  const guard = raisedGuards.get(player);
  const elapsed = game.time - guard?.time;
  if (guard?.game !== game || !(elapsed >= 0 && elapsed <= combatTuning.guardWindow) ||
      !game.players.includes(player) || !game.enemies.includes(charger) || !sameFloor(player, charger) ||
      player.sleeping > 0 || player.stun > 0 || player.frozen > 0 || player.swimming || player.ui) return false;
  raisedGuards.delete(player);
  player.parry = Math.max(player.parry || 0, .32);
  return true;
}

function showCounterFeedback(game, enemy, text, color, ownership) {
  if (!game.effects || game.effects.filter(effect => effect.counterFeedback).length >= 16) return;
  game.effects.push({counterFeedback:true, targetId:enemy.id, x:enemy.x, y:enemy.y - 54,
    text, color, life:.72, ...ownership});
}

function openingDuration(kind) {
  return kind === 'caught' ? combatTuning.caughtWindow : combatTuning.missedWindow;
}

export function chargeRecoveryTime(kind, recovery) {
  return kind ? Math.max(recovery, openingDuration(kind)) : recovery;
}

export function openChargeCounter(game, enemy, owner, kind) {
  if (enemy.hp <= 0 || owner?.id == null || !Number.isFinite(game.time)) return;
  const opening = {game, kind, ownerId:owner.id, startedAt:game.time, expiresAt:game.time + openingDuration(kind),
    bonusMultiplier:1 + combatTuning.counterBonus};
  enemy[openingKey] = opening;
  showCounterFeedback(game, enemy, kind === 'caught' ? 'CHARGE CAUGHT' : 'OPENING',
    kind === 'caught' ? '#a2f0ff' : '#ffe4a0', {counterOwnerId:owner.id});
}

function visibleOpening(enemy, opening, time) {
  return enemy.hp > 0 && enemy.state === 'recover' &&
    (opening?.kind === 'caught' || opening?.kind === 'missed') &&
    Number.isFinite(opening.startedAt) && Number.isFinite(opening.expiresAt) &&
    time >= opening.startedAt && time < opening.expiresAt;
}

export function activeCounterOpening(enemy, time) {
  const opening = enemy[openingKey];
  return visibleOpening(enemy, opening, time) ? opening : null;
}

export function counterOpeningForView(enemy, time) {
  return activeCounterOpening(enemy, time) ||
    (visibleOpening(enemy, enemy.counterOpeningCue, time) ? enemy.counterOpeningCue : null);
}

export function readCounterOpening(game, enemy, player) {
  if (!game?.players?.includes(player) || !(player.hp > 0) || !sameFloor(enemy, player)) return null;
  const opening = activeCounterOpening(enemy, game.time);
  return opening?.game === game ? opening : null;
}

// Claim the returned object only after confirming a successful direct hit.
export function claimCounterOpening(game, enemy, player, opening) {
  if (!opening || enemy[openingKey] !== opening || opening.game !== game ||
      game.time >= opening.expiresAt) return false;
  delete enemy[openingKey];
  if (player.id === opening.ownerId || opening.kind !== 'caught') {
    showCounterFeedback(game, enemy, 'COUNTER HIT', '#ffe4a0', {
      counterOwnerId:opening.ownerId, counterFinisherId:player.id,
    });
  }
  return true;
}
