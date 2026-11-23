import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/core.mjs';
import { ITEMS } from '../src/items.mjs';
import { drawBoomerang, throwBoomerang, tickBoomerangs } from '../src/boomerang.mjs';
import { boomerangContact } from '../src/boomerang-flight.mjs';
import { projectedAimTrajectory } from '../src/bow-aim.mjs';
import { rangedLaunchOrigin } from '../src/ranged-launch.mjs';
import { combatTuning } from '../src/combat-workshop-settings.mjs';

function setup() {
  const g = new Game(() => .5), p = g.addPlayer('keyboard');
  g.start();
  Object.assign(g, {openingBoard: false, house: null, scenery: [], enemies: []});
  g.terrain.fill('grass');
  Object.assign(p, {x: 440, y: 440, faceX: 1, faceY: 0});
  p.equipment.hand1 = 'starter_boomerang';
  return {g, p};
}

function throwBlade(g, p) {
  assert.ok(g.attack(p));
  assert.equal(g.boomerangs.length, 1);
  return g.boomerangs[0];
}

function sentry(id, x, y, shield = false) {
  const enemy = {id, x, y, hp: 100, maxHp: 100};
  if (shield) Object.assign(enemy, {
    faceX: -1, faceY: 0, combatRole: 'shield',
    tactics: {phase: 'approach'}, roleMind: {guard: 100},
  });
  return enemy;
}

test('a swept contact catches grazing targets between endpoints', () => {
  assert.deepEqual(boomerangContact({x:0,y:0},{x:40,y:0},{x:20,y:3},5), {x:16,y:0});
  assert.equal(boomerangContact({x:0,y:0},{x:40,y:0},{x:20,y:6},5), null);
  const from = {x: 10, y: 0};
  assert.equal(boomerangContact(from,{x:20,y:0},{x:11,y:1},5), from);
});

test('move after the throw to line up a new return hit and catch without consuming gear', () => {
  const {g, p} = setup();
  const blade = throwBlade(g, p), initialY = blade.y;
  const launchWeapon = ITEMS.starter_boomerang;
  tickBoomerangs(g, launchWeapon.range / launchWeapon.speed + .001);
  assert.ok(blade.returning && blade.turnRemaining > 0);
  assert.ok(Math.abs(blade.travel - launchWeapon.range) < .0001);

  assert.ok(g.moveActor(p, 0, 144) > 0);
  const hand = rangedLaunchOrigin(p, g.time, 'boomerang');
  assert.ok(hand.y - initialY > 130);
  const enemy = sentry(901, (blade.x + hand.x) / 2, (blade.y + hand.y) / 2);
  g.enemies = [enemy];
  const inventory = structuredClone(p.inventory);
  throwBoomerang(g, p);
  assert.equal(g.boomerangs[0], blade);
  tickBoomerangs(g, .85);
  assert.equal(enemy.hp, 88);
  assert.equal(enemy.killedBy, p.id);
  assert.equal(g.boomerangs.length, 0);
  assert.ok(g.effects.some(effect => effect.gameplayFx === 'salvage'));
  assert.deepEqual(p.inventory, inventory);
  assert.equal(p.equipment.hand1, 'starter_boomerang');
  assert.ok(throwBoomerang(g, p));
  assert.equal(g.boomerangs.length, 1);
});

test('a chipped guard can take one clean hit from the rear on the return', () => {
  const {g, p} = setup();
  const blade = throwBlade(g, p);
  const shield = sentry(901, blade.x + 90, blade.y, true);
  g.enemies = [shield];
  tickBoomerangs(g, .63);
  assert.equal(shield.hp, 98);
  assert.equal(shield.roleMind.guard, 82);
  assert.deepEqual(blade.hits, []);
  assert.deepEqual(blade.guardedHits, [shield.id]);
  const originalHandY = blade.returnHand.y;
  assert.ok(g.moveActor(p, 0, 30) > 0);
  tickBoomerangs(g, 1);
  assert.ok(blade.returnHand.y - originalHandY > 25);
  assert.equal(shield.hp, 86);
  assert.equal(shield.roleMind.guard, 82);
  assert.deepEqual(blade.hits, [shield.id]);
  assert.ok(p.field.weaponCombos.includes('return_flank'));
});

test('a shield that turns to face the return cannot be chipped twice or award the flank', () => {
  const {g, p} = setup();
  const blade = throwBlade(g, p);
  const shield = sentry(901, blade.x + 90, blade.y, true);
  g.enemies = [shield];
  tickBoomerangs(g, .63);
  shield.faceX = 1;
  tickBoomerangs(g, 1);
  assert.equal(shield.hp, 98);
  assert.equal(shield.roleMind.guard, 82);
  assert.ok(!p.field.weaponCombos?.includes('return_flank'));
  assert.equal(g.boomerangs.length, 0);
});

test('a thin wall clips both the aimed turn and the real throw without exposing targets behind it', () => {
  const {g, p} = setup();
  const blade = throwBlade(g, p), start = {x:blade.x,y:blade.y,z:16};
  const wallX = blade.x + 50;
  g.projectileBlocked = x => x >= wallX && x <= wallX + 8;
  const enemy = sentry(901, wallX + 13, blade.y);
  g.enemies = [enemy];
  const trajectory = projectedAimTrajectory(p,{origin:start,direction:{x:1,y:0},kind:'boomerang',world:g});
  assert.equal(trajectory.at(-1).y, blade.y);
  assert.ok(trajectory.at(-1).x < wallX);
  tickBoomerangs(g, .165);
  assert.ok(blade.returning && blade.turnRemaining > 0);
  assert.ok(Math.abs(blade.x - trajectory.at(-1).x) <= 4);
  tickBoomerangs(g, 1);
  assert.equal(enemy.hp, 100);
  assert.equal(g.boomerangs.length, 0);
});

test('live Studio tuning controls turnaround and the return guide', () => {
  const {g, p} = setup();
  const previous = {...combatTuning};
  const guide = [];
  const canvas = new Proxy({globalAlpha:1,strokeRect:(...rect)=>guide.push(rect)}, {
    get: (target, key) => target[key] ?? (()=>{}),
  });
  try {
    Object.assign(combatTuning, {boomerangTurnTime:.23,boomerangReturnSpeed:.75,boomerangGuide:true});
    const blade = throwBlade(g, p), {range, speed} = ITEMS.starter_boomerang;
    tickBoomerangs(g, range / speed);
    assert.ok(Math.abs(blade.turnRemaining - .23) < 1e-6);
    tickBoomerangs(g, .24);
    assert.ok(Math.abs(blade.vx + speed * .75) < 1e-6);
    drawBoomerang(canvas, blade, g.time, false);
    assert.equal(guide.length, 0);
    drawBoomerang(canvas, blade, g.time, true);
    assert.equal(guide.length, 1);
    combatTuning.boomerangGuide = false;
    drawBoomerang(canvas, blade, g.time, true);
    assert.equal(guide.length, 1);
  } finally {
    Object.assign(combatTuning, previous);
  }
});
