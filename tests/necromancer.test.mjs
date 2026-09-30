import test from 'node:test';
import assert from 'node:assert/strict';
import { Game, EVENTS } from '../src/core.mjs';
import { creatures } from '../src/definitions.mjs';
import { ITEMS } from '../src/items.mjs';

test('warlock event spawns a staff necromancer and configurable summon roster', () => {
  const g = new Game(() => .4), p = g.addPlayer('keyboard', 'Tester');
  g.start(); g.openingBoard = false;
  g.spawnEvent(EVENTS.findIndex(e => e.kind === 'necromancer'));
  const e = g.enemies[0];
  assert.equal(e.kind, 'necromancer');
  assert.equal(e.equipment.hand1, 'staff');
  assert.deepEqual(e.summonKinds, ['skeleton','skeleton_unarmed','skeleton_wizard','skeleton_caster']);
  for (let n = 0; n < 90; n++) g.update(.1, {keyboard:{}});
  assert.ok(g.enemies.some(a => a.summonedBy === e.id));
  assert.ok(g.enemies.filter(a => a.summonedBy === e.id).length <= 4);
  assert.ok(creatures.skeleton_caster);
});

test('necromancer drops at most one missing set piece per player', () => {
  const g = new Game(() => .01), a = g.addPlayer('keyboard', 'A'), b = g.addPlayer('pad:1', 'B');
  g.start(); g.openingBoard = false;
  a.equipment.hand1 = 'necromancer_dagger';
  g.enemyLoot({kind:'necromancer',x:800,y:700,id:99});
  const drops = g.loot.filter(l => l.source === 'Necromancer set piece');
  assert.equal(drops.length, 2);
  assert.ok(['necromancer_dagger','necromancer_wand'].includes(drops[0].type));
});

test('GM items are marked restricted and mana regeneration trinkets are available', () => {
  assert.equal(ITEMS.friendship_wand.gmOnly, true);
  assert.equal(ITEMS.sword_of_a_thousand_truths.damage, 1000);
  assert.deepEqual(['mana_rune','void_sigil','astral_heart'].map(id => ITEMS[id].manaRegen), [1,2,3]);
});
