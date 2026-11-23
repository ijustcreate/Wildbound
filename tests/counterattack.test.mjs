import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/core.mjs';
import {creatures} from '../src/definitions.mjs';
import {drawTacticalTell,initializeTacticalEnemy,tacticalPhase} from '../src/combat-tactics-state.mjs';
import {speciesPhase} from '../src/enemy-species-combat.mjs';
import {counterOpeningForView,readCounterOpening} from '../src/counterattack.mjs';
import {damageEnemy} from '../src/enemy-damage.mjs';
import {knownWeaponCombos} from '../src/weapon-combo-discovery.mjs';
import {Rooms,snapshot} from '../src/rooms.mjs';

function scene() {
  const game = new Game(() => .5);
  const defender = game.addPlayer('keyboard', 'Alder');
  game.start();
  Object.assign(game, {openingBoard:false, scenery:[], enemies:[], traps:[], event:null, weather:null, house:null, time:20});
  game.terrain.fill('grass');
  game.persist = () => {};
  Object.assign(defender, {x:600, y:600, faceX:1, faceY:0, invincible:false, invuln:0,
    equipment:{hand1:'sword', hand2:'shield'}});
  return {game, defender};
}

function charger(game, target, route = 'tactics') {
  const enemy = {id:game.nextId++, kind:'lion', x:633, y:600, faceX:-1, faceY:0,
    dx:-1, dy:0, hp:300, maxHp:300, damage:18, speed:65, state:'charge', timer:.12};
  if (route === 'tactics') {
    enemy.combatRole = 'charger';
    initializeTacticalEnemy(enemy);
    tacticalPhase(enemy, 'active', .12).targetId = target.id;
  } else if (route === 'species') speciesPhase(enemy, 'active', .12).targetId = target.id;
  game.enemies.push(enemy);
  return enemy;
}

function advance(game, frames, input = {}) {
  for (let frame = 0; frame < frames; frame++) game.update(.02, {keyboard:input});
}

test('a fresh frontal shield press catches a Crossfire rush and stops it before touching the next player', () => {
  const {game,defender} = scene();
  const partner = game.addPlayer('pad:1', 'Ember');
  Object.assign(partner, {x:595, y:605});
  const enemy = charger(game, defender);
  const health = [defender.hp, partner.hp];
  advance(game, 1, {block:true});
  assert.deepEqual([defender.hp,partner.hp], health);
  assert.equal(enemy.tactics.phase, 'recover');
  assert.equal(readCounterOpening(game,enemy,partner)?.ownerId, defender.id);
  assert.equal(readCounterOpening(game,enemy,partner)?.kind, 'caught');
  assert.ok(game.effects.some(effect => effect.text === 'CHARGE CAUGHT' && effect.targetId === enemy.id));
});

test('an old raised guard blocks damage without catching, and an unblocked hit offers no special counter', () => {
  for (const block of [true,false]) {
    const {game,defender} = scene();
    advance(game, 20, {block});
    const enemy = charger(game, defender), health = defender.hp;
    advance(game, 12, {block});
    assert.equal(enemy.tactics.phase, 'recover');
    assert.equal(defender.hp === health, block);
    assert.equal(readCounterOpening(game,enemy,defender), null);
  }
});

test('a sidestep earns a finite miss opening and the cue survives actor projection', () => {
  const {game,defender} = scene();
  const enemy = charger(game, defender);
  defender.y += 45;
  advance(game, 9);
  const opening = readCounterOpening(game,enemy,defender);
  assert.equal(opening?.kind, 'missed');
  const fills = [];
  const canvas = {save(){},restore(){},fillRect(...rect){fills.push(rect);},globalAlpha:1};
  drawTacticalTell(canvas, {...enemy, x:100}, game.time);
  assert.ok(fills.some(([, , width, height]) => width === 15 && height === 7));
  assert.equal(readCounterOpening(game,JSON.parse(JSON.stringify(enemy)),defender), null);
  game.time = opening.expiresAt;
  assert.equal(readCounterOpening(game,enemy,defender), null);
  fills.length = 0;
  drawTacticalTell(canvas, {...enemy}, game.time);
  assert.ok(!fills.some(([, , width]) => width === 15));
});

test('Dreadmane’s swept pounce can be caught without changing his boss attack state machine', () => {
  const {game,defender} = scene();
  const enemy = charger(game,defender,'legacy');
  Object.assign(enemy, {kind:'dreadmane_lion',boss:true,x:637,state:'pounce',
    dreadAction:'pounce',dreadAge:.37,dreadHits:[],dreadPounceTargetId:defender.id});
  const health = defender.hp;
  advance(game, 1, {block:true});
  assert.equal(defender.hp, health);
  assert.equal(enemy.state, 'recover');
  assert.equal(enemy.dreadAction, 'idle');
  assert.equal(readCounterOpening(game,enemy,defender)?.kind, 'caught');
});

test('LAN packets preserve only counter presentation and ordinary save snapshots omit it', () => {
  const {game,defender} = scene();
  const enemy = charger(game,defender);
  advance(game, 1, {block:true});
  const opening = readCounterOpening(game,enemy,defender);
  const frames = [];
  Rooms.prototype.tick.call({role:'host',age:0,send:frame => frames.push(frame)},game,.12,{});
  const packet = JSON.parse(JSON.stringify(frames[0]));
  const remoteEnemy = packet.state.enemies[0];
  assert.deepEqual(counterOpeningForView(remoteEnemy,packet.state.time), {
    kind:'caught',startedAt:opening.startedAt,expiresAt:opening.expiresAt,
  });
  assert.equal(readCounterOpening(game,remoteEnemy,defender), null);
  assert.equal(counterOpeningForView(remoteEnemy,opening.expiresAt), null);
  assert.equal(counterOpeningForView(snapshot(game).enemies[0],game.time), null);
  assert.ok(!Object.hasOwn(snapshot(packet.state).enemies[0],'counterOpeningCue'));
});

test('a stationary LAN controller sends block and dodge without requiring movement or an attack', () => {
  const frames = [];
  const room = {role:'client',send:frame => frames.push(frame)};
  for (const action of ['block','dodge']) {
    Rooms.prototype.tick.call(room,null,.02,{keyboard:{},'pad:1':{[action]:true}});
    assert.deepEqual(frames.at(-1), {type:'input',input:{[action]:true}});
  }
});

test('native and editor-overridden ordinary lions use the same timed catch', t => {
  const previous = creatures.lion.edited;
  t.after(() => {creatures.lion.edited = previous;});
  for (const route of ['species','legacy']) {
    creatures.lion.edited = route === 'legacy';
    const {game,defender} = scene();
    const enemy = charger(game,defender,route);
    advance(game, 2, {block:true});
    assert.equal(enemy.state, 'recover', route);
    assert.equal(readCounterOpening(game,enemy,defender)?.kind, 'caught', route);
  }
});

test('solo direct heavy follow-up claims a counter once while light and secondary hits leave it available', () => {
  const {game,defender} = scene();
  const enemy = charger(game,defender);
  advance(game, 1, {block:true});
  const light = damageEnemy(enemy, 25, 'physical', {g:game,p:defender,melee:true});
  damageEnemy(enemy, 25, 'physical', {g:game,p:defender,secondary:true,heavy:true,melee:true});
  assert.ok(readCounterOpening(game,enemy,defender));
  const counter = damageEnemy(enemy, 25, 'physical', {g:game,p:defender,heavy:true,melee:true});
  assert.ok(counter > light);
  assert.equal(readCounterOpening(game,enemy,defender), null);
  damageEnemy(enemy, 25, 'physical', {g:game,p:defender,heavy:true,melee:true});
  assert.equal(game.effects.filter(effect => effect.text === 'COUNTER HIT').length, 1);
});

test('a partner finishes the caught charge with a real heavy cut that carries the enemy into a trap', () => {
  const {game,defender} = scene();
  const finisher = game.addPlayer('pad:1','Ember');
  Object.assign(finisher, {x:595,y:605,faceX:1,faceY:0,equipment:{hand1:'sword'},attackClip:'swipe_big'});
  const enemy = charger(game,defender);
  advance(game, 1, {block:true});
  const trap = {x:691,y:600,life:5,owner:defender.id,variant:'capture',capture:1};
  game.traps.push(trap);
  game.resolveMelee(finisher, 0, {damage:1.3});
  assert.equal(readCounterOpening(game,enemy,finisher), null);
  assert.ok(knownWeaponCombos(defender).includes('team_guard'));
  assert.ok(knownWeaponCombos(finisher).includes('team_guard'));
  advance(game, 25);
  assert.equal(enemy.state, 'snared');
  assert.ok(trap.life <= 0);
  assert.ok(knownWeaponCombos(finisher).includes('trap_bowling'));
  assert.ok(knownWeaponCombos(defender).includes('team_trap'));
  assert.ok(knownWeaponCombos(finisher).includes('team_trap'));
});
