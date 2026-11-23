import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/core.mjs';
import { count } from '../src/items.mjs';
import { rangedLaunchOrigin } from '../src/ranged-launch.mjs';
import { arrowCrossesFlame, arrowFlameSources, flameArrowTargetHit } from '../src/flame-arrows.mjs';
import { saveSession, restoreSession } from '../src/session.mjs';

function setup() {
  const game = new Game(() => .5);
  const bow = game.addPlayer('keyboard', 'Bow');
  game.phase = 'play';
  game.openingBoard = false;
  game.house = null;
  game.scenery = [];
  game.questNpcs = [];
  game.enemies = [];
  game.terrain.fill('grass');
  Object.assign(bow, { x: 400, y: 420, faceX: 1, faceY: 0, equipment: { hand1: 'bow' }, inventory: [{ type: 'arrow', qty: 3 }] });
  return { game, bow };
}

function advance(game, amount = .02) {
  game.time += amount;
  game.tickProjectiles(amount);
}

test('swept flame detection requires simultaneous world-plane contact and flight height', () => {
  const flame = { x: 0, y: 0, radius: 4, bottom: 8, top: 28 };
  assert.equal(arrowCrossesFlame({ x: -20, y: 0, z: 16 }, { x: 20, y: 0, z: 16 }, flame), true);
  assert.equal(arrowCrossesFlame({ x: -20, y: 6, z: 16 }, { x: 20, y: 6, z: 16 }, flame), false);
  assert.equal(arrowCrossesFlame({ x: -20, y: 0, z: 40 }, { x: 20, y: 0, z: 48 }, flame), false);
  assert.equal(arrowCrossesFlame({ x: -20, y: 0, z: 42 }, { x: 20, y: 0, z: 26 }, flame), false);
  assert.equal(arrowCrossesFlame({ x: -20, y: 0, z: 42 }, { x: 20, y: 0, z: 10 }, flame), true);
});

test('a real bow release catches campfire, saves discovery once, burns the target and keeps ordinary ammo', () => {
  const { game, bow } = setup();
  const other = game.addPlayer('pad:0', 'Partner');
  const start = rangedLaunchOrigin(bow, game.time, 'bow', { charge: 0 });
  game.villageCampState = { campId: 'test', fire: { x: start.x + 75, y: start.y } };
  const target = { id: 912, kind: 'skeleton', x: start.x + 155, y: start.y, hp: 100, maxHp: 100 };
  game.enemies = [target];
  assert.equal(game.fireArrow(bow, 0), true);
  const arrow = game.arrows[0];
  for (let step = 0; step < 60 && !arrow.stuck; step++) advance(game);
  assert.equal(count(bow, 'arrow'), 2);
  assert.equal(arrow.ammoType, 'arrow');
  assert.equal(arrow.enemy, target.id);
  assert.equal(target.hp, 100 - Math.round(arrow.damage * 1.15));
  assert.equal(target.burning, 2);
  assert.equal(target.killedBy, bow.id);
  assert.deepEqual(bow.field.weaponCombos, ['fire_arrows']);
  assert.equal(other.field.weaponCombos, undefined);
  const restored = restoreSession(JSON.parse(JSON.stringify(saveSession(game))));
  assert.deepEqual(restored.players[0].field.weaponCombos, ['fire_arrows']);
  assert.equal(restored.arrows[0].ammoType, 'arrow');
});

test('blocked, hostile, frost and high shots do not collect heat through a campfire', () => {
  for (const config of [{ blocked: true }, { hostile: true }, { bansheeFrost: true }, { z: 70 }]) {
    const { game, bow } = setup();
    game.villageCampState = { fire: { x: 501, y: 420 } };
    if (config.blocked) game.projectileBlocked = x => x >= 480;
    const arrow = { id: 71, owner: bow.id, ammoType: 'arrow', x: 450, y: 420, z: 18, vx: 300, vy: 0, vz: 0, gravity: 0, damage: 10, ...config };
    game.arrows.push(arrow);
    advance(game, .4);
    assert.equal(!!arrow.flameUsed, false, JSON.stringify(config));
    assert.equal(bow.field.weaponCombos, undefined, JSON.stringify(config));
  }
});

test('active ground flames and a teammate torch count, spent flames and carried packs do not', () => {
  const { game, bow } = setup();
  const other = game.addPlayer('pad:0', 'Partner');
  Object.assign(other, { x: 500, y: 420, faceX: 1, faceY: 0, equipment: { hand1: 'torch' } });
  bow.inventory.push({ type: 'torch', qty: 1 });
  game.firePatches = [{ x: 480, y: 400, life: 2 }, { x: 600, y: 400, life: 0 }];
  assert.deepEqual(arrowFlameSources(game).map(source => source.owner), [null, other.id]);
  const arrow = { id: 72, owner: bow.id, x: 440, y: 416, z: 18, vx: 300, vy: 0, vz: 0, gravity: 0, damage: 10 };
  game.arrows.push(arrow);
  advance(game, .23);
  assert.ok(arrow.flameDistance > 200);
  advance(game, 1);
  assert.equal(arrow.flameDistance, 0);
  assert.equal(arrow.flameUsed, true);
});

test('an effective surviving hit burns, a shield block or non-damaging contact does not', () => {
  const arrow = { flameDistance: 25 };
  const target = { hp: 15, tacticalBlocked: true };
  assert.equal(flameArrowTargetHit(arrow, target, 4), false);
  target.tacticalBlocked = false;
  assert.equal(flameArrowTargetHit(arrow, target, 0), false);
  assert.equal(flameArrowTargetHit(arrow, target, 4), true);
  assert.equal(target.burnDamage, 3);
});

test('a low hot arrow scorches grass but cools on shallow water before reaching the next target', () => {
  const { game, bow } = setup();
  game.villageCampState = { fire: { x: 480, y: 416 } };
  const grass = { kind: 'tall_grass', x: 510, y: 384, rootY: 416, size: 80 };
  game.scenery = [grass];
  game.terrain[13 * 50 + 17] = 'shallow';
  const target = { id: 81, kind: 'skeleton', x: 610, y: 416, hp: 100, maxHp: 100 };
  game.enemies = [target];
  const arrow = { id: 70, owner: bow.id, x: 435, y: 416, z: 8, vx: 300, vy: 0, vz: 0, gravity: 0, damage: 10 };
  game.arrows.push(arrow);
  advance(game, .6);
  assert.equal(arrow.flameUsed, true);
  assert.ok(grass.grassBurnMarks?.length > 0);
  assert.equal(arrow.flameDistance, 0);
  assert.equal(arrow.enemy, target.id);
  assert.equal(target.hp, 90);
  assert.equal(target.burning, undefined);
});
