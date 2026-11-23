import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/core.mjs';
import {launchMeleeTarget} from '../src/weapon-knockback.mjs';
import {knownWeaponCombos} from '../src/weapon-combo-discovery.mjs';

function scene() {
  const game = new Game(() => .5);
  const player = game.addPlayer('keyboard', 'Alder');
  game.start();
  Object.assign(game, {openingBoard: false, scenery: [], enemies: [], weather: null, event: null});
  game.terrain.fill('grass');
  Object.assign(player, {x: 560, y: 560, faceX: 1, faceY: 0, equipment: {hand1: 'sword'}, invincible: true});
  return {game, player};
}

function enemy(game, x, y = 560, extra = {}) {
  const actor = {id: game.nextId++, kind: 'skeleton_unarmed', x, y, hp: 180, maxHp: 180,
    speed: 0, damage: 0, state: 'hunt', cooldown: 99, tacticTime: 99, faceX: -1, faceY: 0, flash: 0, ...extra};
  game.enemies.push(actor);
  return actor;
}

function step(game, count) {
  for (let i = 0; i < count; i++) {
    game.time += .02;
    game.tickCombatActors(.02);
  }
}

test('a real heavy cut rolls two transfers, spreads fire, and leaves allies and a fourth target alone', () => {
  const {game, player} = scene();
  const first = enemy(game, 605, 560, {burning: 2.8, burnDamage: 3});
  const second = enemy(game, 669);
  const third = enemy(game, 734);
  const fourth = enemy(game, 794);
  const ally = enemy(game, 690, 588, {faction: 'ally', allyOwner: player.id, pet: true});
  player.attackClip = 'swipe_big';
  game.resolveMelee(player, 0, {damage: 1.3});
  assert.ok(first.hp < 180);
  assert.equal(second.hp, 180);
  step(game, 34);
  assert.ok(first.x > 605 && second.x > 669);
  assert.ok(second.hp < 180 && third.hp < 180);
  assert.ok(second.burning > 0 && third.burning > 0);
  assert.equal(ally.hp, 180);
  assert.equal(fourth.hp, 180);
  assert.deepEqual(knownWeaponCombos(player).sort(), ['body_collision', 'chain_reaction', 'fire_bowling']);
});

test('a solid obstruction stops the swept body, awards one wall hit and protects a target on its far side', () => {
  const {game, player} = scene();
  const first = enemy(game, 605);
  const behind = enemy(game, 670);
  const blocked = game.blocked.bind(game);
  game.blocked = (x, y, radius, ...rest) => (Math.abs(y - 560) < 45 && x + radius >= 648 && x - radius < 650) || blocked(x, y, radius, ...rest);
  assert.ok(launchMeleeTarget(game, player, first, 1.2));
  step(game, 25);
  assert.ok(first.x > 605 && first.x < 648);
  assert.ok(first.hp < 180);
  assert.equal(behind.hp, 180);
  assert.deepEqual(knownWeaponCombos(player), ['wall_slam']);
  const health = first.hp;
  step(game, 25);
  assert.equal(first.hp, health);
});

test('an ally’s trap credits both explorers after a real launch and capture', () => {
  const {game, player} = scene();
  const partner = game.addPlayer('pad:1', 'Ember');
  const first = enemy(game, 605);
  const trap = {x: 677, y: 560, life: 5, owner: partner.id, variant: 'capture', capture: 1};
  game.traps.push(trap);
  assert.ok(launchMeleeTarget(game, player, first, 1.2));
  step(game, 18);
  assert.equal(trap.life, 0);
  assert.equal(first.state, 'snared');
  assert.deepEqual(knownWeaponCombos(player), ['trap_bowling', 'team_trap']);
  assert.deepEqual(knownWeaponCombos(partner), ['team_trap']);
});

test('heavy hits respect boss footing and stationary and airborne actors', () => {
  const {game, player} = scene();
  for (const extra of [{boss: true}, {kind: 'vine'}, {kind: 'bat'}, {jumpHeight: 24}, {faction: 'neutral'}, {hp: 0}]) {
    assert.equal(launchMeleeTarget(game, player, enemy(game, 605, 560, extra), 1.2), false);
  }
});
