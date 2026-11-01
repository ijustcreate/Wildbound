import test from 'node:test';
import assert from 'node:assert/strict';
import { CREATURE_PACK_DEFAULTS, tickCreaturePackActor } from '../src/creature-packs/index.mjs';
import { tickFriendlyCreature } from '../src/friendly-creatures.mjs';

test('all creature-pack allies leave wild AI and follow their owner unless directly controlled', () => {
  const kinds = Object.keys(CREATURE_PACK_DEFAULTS);
  for (const kind of kinds) {
    const owner = { id: 1, x: 700, y: 700, hp: 100 };
    const actor = { id: 2, kind, x: 100, y: 100, hp: 100, speed: 60, faction: 'ally', allyOwner: 1 };
    const game = { players: [owner], enemies: [actor], time: 0, moveActor(a, dx, dy) { a.x += dx; a.y += dy; return Math.hypot(dx, dy); } };
    assert.equal(tickCreaturePackActor(game, actor, .1, []), false, `${kind} ally reaches generic companion update`);
    tickFriendlyCreature(game, actor, .1);
    if (CREATURE_PACK_DEFAULTS[kind].stats?.speed !== 0) {
      assert.ok(Math.hypot(actor.x - 100, actor.y - 100) > 0, `${kind} follows its distant owner`);
    }
    actor.controlledBy = 1;
    assert.equal(tickCreaturePackActor(game, actor, .1, []), false, `${kind} direct control retains player update`);
  }
});
