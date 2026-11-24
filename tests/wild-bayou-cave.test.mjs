import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/core.mjs';
import { restoreSession, saveSession } from '../src/session.mjs';
import { trainPrompt } from '../src/train-test.mjs';
import { enterWildLands } from '../src/wild-lands.mjs';
import { WILD_LANDS_EXIT, WILD_LANDS_GATES, wildLandsGatePrompt } from '../src/wild-lands-world.mjs';
import { nativeWildProps } from '../src/wild-native-biomes.mjs';

test('existing Wild Lands Bayou shrines enter the native Caverns and return to the same doorstep after reload', () => {
  const game = new Game(() => .5, { deferWorld: true });
  const explorer = game.addPlayer('keyboard', 'Shrine explorer');
  const partner = game.addPlayer('pad:0', 'Companion');
  enterWildLands(game, { persistent: true });
  const train = game.trainTest;
  const shrines = nativeWildProps(train, { left: 11200, right: 15600, top: 480, bottom: 3500 })
    .filter(prop => prop.kind === 'bayou_shrine');
  assert.ok(shrines.length > 1, 'The existing generated entrances share the route');
  for (const shrine of shrines) {
    const { x, rootY } = shrine;
    assert.equal(wildLandsGatePrompt(game, { ...explorer, x, y: rootY - 24 }), '', 'Rear stone wall');
    assert.equal(wildLandsGatePrompt(game, { ...explorer, x: x + 65, y: rootY + 30 }), '', 'Beside the doorway');
    assert.equal(wildLandsGatePrompt(game, { ...explorer, x, y: rootY + 30, swimming: true }), '', 'Swimmers cannot activate it');
    assert.equal(wildLandsGatePrompt(game, { ...explorer, x, y: rootY + 30 }), 'ENTER BAYOU CAVERNS');
    assert.equal(game.blocked(x, rootY + 30, 8, false, false), false, 'Real walkable front approach');
    assert.equal(game.blocked(x, rootY - 8, 8, false, false), true, 'The closed foundation stays solid');
  }
  const target = shrines.at(-1);
  Object.assign(explorer, { x: target.x - 7, y: target.rootY + 30 });
  Object.assign(partner, { x: target.x + 28, y: target.rootY + 53 });
  const entryPoints = game.players.map(({ id, x, y }) => ({ id, x, y }));
  assert.equal(trainPrompt(game, explorer), 'E · ENTER BAYOU CAVERNS');
  const cyanGate = WILD_LANDS_GATES.find(gate => gate.id === 'caverns');
  assert.equal(wildLandsGatePrompt(game, { ...explorer, x: cyanGate.x, y: cyanGate.y }), 'ENTER CAVERNS');

  game.dropLoot(target.x - 120, target.rootY + 90, 'fruit', 1);
  const surfaceLoot = game.loot.map(({ id, x, y }) => ({ id, x, y }));
  game.update(.02, { keyboard: { interact: true } });
  assert.equal(train.design.activeRoom, 'caverns');
  assert.equal(train.wildLandsReturn.entrance, target.id);
  assert.deepEqual(train.wildLandsReturn.entryPoints, entryPoints);
  assert.ok(game.players.every(player => player.x >= 8000 && player.y === 5450));
  assert.equal(game.loot.length, 0, 'Surface loot stays on the surface');

  const restored = restoreSession(JSON.parse(JSON.stringify(saveSession(game))));
  const returning = restored.players[0];
  assert.equal(restored.trainTest.design.activeRoom, 'caverns');
  assert.deepEqual(restored.trainTest.wildLandsReturn.entryPoints, entryPoints);
  Object.assign(returning, WILD_LANDS_EXIT);
  assert.equal(trainPrompt(restored, returning), 'E · RETURN TO THE WILD LANDS');
  restored.update(.02, { keyboard: { interact: true } });
  assert.equal(restored.trainTest.design.activeRoom, undefined);
  assert.deepEqual(restored.players.map(({ id, x, y }) => ({ id, x, y })), entryPoints);
  assert.deepEqual(restored.loot.map(({ id, x, y }) => ({ id, x, y })), surfaceLoot);
});
