import { CREATURE_PACK as wildlifePack } from './wildlife.mjs';
import { CREATURE_PACK as eldritchPack } from './eldritch.mjs';
import { CREATURE_PACK as constructsPack } from './constructs.mjs';
import { applyCreaturePackRuntimeAdjustments } from '../creature-pack-runtime-adjustments.mjs';
import { tickSkunkActor } from '../skunk-behavior.mjs';

// New creature families stay isolated while they are authored in parallel.
// The runtime and Rig Studio consume this single, validated integration point.
export const CREATURE_PACKS = Object.freeze([
  wildlifePack,
  eldritchPack,
  constructsPack,
]);

function mergeUnique(field) {
  const result = {};
  for (const pack of CREATURE_PACKS) {
    for (const [key, value] of Object.entries(pack[field] || {})) {
      if (Object.hasOwn(result, key)) throw new Error(`Duplicate creature pack ${field}: ${key}`);
      result[key] = value;
    }
  }
  return Object.freeze(result);
}

export const CREATURE_PACK_SUBJECTS = mergeUnique('subjects');
applyCreaturePackRuntimeAdjustments(CREATURE_PACK_SUBJECTS);
export const CREATURE_PACK_DEFAULTS = mergeUnique('defaults');
export const CREATURE_PACK_EVENTS = Object.freeze(CREATURE_PACKS.flatMap(pack => pack.events || []));

export function tickCreaturePackActor(game, actor, dt, livingTargets) {
  // Controlled companions are driven by the player proxy. Let the normal ally
  // update advance their jump physics and combat state instead of letting a
  // creature pack AI return early and overwrite those inputs.
  if (actor?.controlledBy != null) return false;
  // Once a creature is befriended, generic companion locomotion owns its
  // navigation and combat. Pack-specific wild AI must not early-return first,
  // or charmed pack creatures ignore their owner and stay on wild behavior.
  if (actor?.faction === 'ally' || actor?.allyOwner != null) return false;
  if (actor?.kind === 'skunk') return tickSkunkActor(game, actor, dt, livingTargets);
  for (const pack of CREATURE_PACKS) {
    if (pack.tickActor?.(game, actor, dt, livingTargets)) return true;
  }
  return false;
}

export function initializeCreaturePackEvent(game, event, groupActors) {
  for (const pack of CREATURE_PACKS) pack.onSpawn?.(game, event, groupActors);
}

export function interactCreaturePackActor(game, player, actors = game.enemies || []) {
  const nearby = [...actors].filter(actor => actor && actor.hp > 0 && !actor.room &&
    Math.hypot((actor.x || 0) - player.x, (actor.y || 0) - player.y) < 62)
    .sort((a, b) => Math.hypot(a.x - player.x, a.y - player.y) - Math.hypot(b.x - player.x, b.y - player.y));
  for (const actor of nearby) for (const pack of CREATURE_PACKS) {
    const result = pack.interactActor?.(game, actor, player);
    if (result === false || result == null) continue;
    if (result.message && !result.ok) game.message?.(result.message);
    return result;
  }
  return false;
}
