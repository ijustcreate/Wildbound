import assert from 'node:assert/strict';
import test from 'node:test';
import {EVENTS, Game} from '../src/core.mjs';
import {COMBO_ENCOUNTERS, ENCOUNTER_LAYOUTS, encounterCampfires} from '../src/encounter-layout-data.mjs';
import {findEncounterSite} from '../src/encounter-layouts.mjs';
import {applyDefinitions} from '../src/definitions.mjs';
import {saveSession, restoreSession} from '../src/session.mjs';
import {knownWeaponCombos} from '../src/weapon-combo-discovery.mjs';

const card = id => COMBO_ENCOUNTERS.find(event => event.comboLayout === id);
const eventIndex = id => EVENTS.findIndex(event => event.comboLayout === id);
const location = (game, id) => game.scenery.find(prop => prop.encounterVenue?.id === id)?.encounterVenue;
const point = (anchor, [x, y]) => ({x: anchor.x + x, y: anchor.y + y});

function forest(random = .35, coop = false) {
  const game = new Game(() => random);
  const player = game.addPlayer('keyboard', 'Alder');
  const partner = coop ? game.addPlayer('pad:1', 'Ember') : null;
  game.environment = 'forest';
  game.start();
  return {game, player, partner};
}

function advance(game, update, frames) {
  for (let i = 0; i < frames; i++) {
    game.time += .02;
    game[update](.02);
  }
}

function collect(game, player, item, quick = false) {
  const loot = game.loot.find(drop => drop.type === item);
  assert.ok(loot, `${item} is placed on the map`);
  Object.assign(player, {x: loot.x, y: loot.y});
  assert.ok(game.collect(player, loot, quick));
}

function arriveAtRoll(game, player, progress = 0) {
  player.progress = progress;
  game.roll = null;
  game.rollCooldown = 0;
  game.turnOrder = [];
  game.locked = false;
  assert.ok(game.hitTable(player));
  game.resolveRoll();
}

test('natural forest rolls feature each encounter at its intended point in progression', () => {
  const {game, player} = forest(.35);
  // A 3 + 3 roll stays in the forest, below the Snare Pass threshold.
  arriveAtRoll(game, player);
  assert.equal(game.event.name, 'Ember Clearing');
  assert.ok(location(game, 'ember_clearing'));
  assert.deepEqual(game.enemies.filter(enemy => enemy.comboLayout).map(enemy => enemy.kind), ['slime', 'slime']);
  game.enemies = [];
  arriveAtRoll(game, player, 6);
  assert.equal(game.event.name, 'Snare Pass');
  assert.ok(location(game, 'snare_pass'));
  game.enemies = [];
  arriveAtRoll(game, player, 12);
  assert.equal(game.event.name, 'Shieldgate Ruins');
  assert.ok(location(game, 'shieldgate'));
  assert.deepEqual(game.enemies.filter(enemy => enemy.comboLayout).map(enemy => enemy.combatRole), ['shield', 'charger', 'archer']);
});

test('the opening camp supplies orient a real starter-bow shot through the fire', () => {
  const {game, player} = forest(.35);
  arriveAtRoll(game, player);
  const lead = game.enemies.find(enemy => enemy.comboLayout === 'ember_clearing');
  const anchor = location(game, 'ember_clearing');
  const fire = encounterCampfires(game)[0];
  assert.equal(fire.x, lead.x);
  collect(game, player, 'starter_bow', true);
  collect(game, player, 'arrow');
  assert.equal(player.equipment.hand1, 'starter_bow');
  Object.assign(player, point(anchor, ENCOUNTER_LAYOUTS.ember_clearing.entry), {faceX: 0, faceY: -1});
  game.time = lead.spawnReadyAt + .01;
  assert.ok(game.fireArrow(player, .5));
  advance(game, 'tickProjectiles', 50);
  assert.ok(knownWeaponCombos(player).includes('fire_arrows'));
  assert.ok(lead.burning > 0);
});

test('a partner can arm the center lane and a rear heavy strike sends the lead zombie into it', () => {
  const {game, player, partner} = forest(.35, true);
  game.spawnEvent(eventIndex('snare_pass'), {test: true});
  const anchor = location(game, 'snare_pass');
  const layout = ENCOUNTER_LAYOUTS.snare_pass;
  const lead = game.enemies.find(enemy => enemy.comboLayout === 'snare_pass');
  const trapPoint = point(anchor, layout.trap);
  collect(game, partner, 'trap');
  Object.assign(partner, {x: trapPoint.x, y: trapPoint.y + 34, faceX: 0, faceY: -1});
  assert.ok(game.trap(partner));
  assert.deepEqual([game.traps[0].x, game.traps[0].y], [trapPoint.x, trapPoint.y]);
  Object.assign(player, {x: lead.x, y: lead.y - 43, faceX: 0, faceY: 1, equipment: {hand1: 'sword'}, attackClip: 'swipe_big'});
  game.resolveMelee(player, .2, {damage: 1.3});
  advance(game, 'tickCombatActors', 18);
  assert.equal(game.traps[0].life, 0);
  assert.ok(knownWeaponCombos(player).includes('trap_bowling'));
});

test('Shieldgate uses a solid backstop and a forest route around its divider', () => {
  const {game, player} = forest(.35);
  game.spawnEvent(eventIndex('shieldgate'), {test: true});
  const anchor = location(game, 'shieldgate');
  const charger = game.enemies.find(enemy => enemy.combatRole === 'charger');
  const backstop = game.scenery.find(prop => prop.id === 'encounter:shieldgate:wall:1');
  assert.ok(game.blocked(backstop.x, backstop.y - 10, 8));
  assert.ok(!game.blocked(anchor.x + 116, anchor.y - 55, 8));
  collect(game, player, 'ice_wand', true);
  assert.equal(player.equipment.hand1, 'ice_wand');
  Object.assign(player, {x: charger.x, y: charger.y + 44, faceX: 0, faceY: -1, equipment: {hand1: 'sword'}, attackClip: 'swipe_big'});
  game.resolveMelee(player, .2, {damage: 1.3});
  advance(game, 'tickCombatActors', 24);
  assert.ok(knownWeaponCombos(player).includes('wall_slam'));
  assert.ok(charger.y > backstop.y);
});

test('saved and repeated layouts keep their original geometry and supplies do not respawn', () => {
  const {game} = forest();
  game.spawnEvent(eventIndex('ember_clearing'), {test: true});
  const original = location(game, 'ember_clearing');
  const count = game.loot.length;
  const restored = restoreSession(JSON.parse(JSON.stringify(saveSession(game))));
  assert.deepEqual(location(restored, 'ember_clearing'), original);
  assert.equal(encounterCampfires(restored).length, 1);
  restored.enemies = [];
  restored.spawnEvent(eventIndex('ember_clearing'), {test: true});
  assert.equal(restored.loot.length, count);
  assert.equal(encounterCampfires(restored).length, 1);
});

test('a blocked layout leaves the prior event and world intact instead of creating floating supplies', () => {
  const {game} = forest();
  game.terrain.fill('water');
  assert.equal(findEncounterSite(game, card('ember_clearing')), null);
  const before = {event: game.event, scenery: game.scenery.length, loot: game.loot.length};
  assert.equal(game.spawnEvent(eventIndex('ember_clearing'), {test: true}), false);
  assert.deepEqual({event: game.event, scenery: game.scenery.length, loot: game.loot.length}, before);
});

test('authored layout choices survive definition import, with native additions appended to older rosters', () => {
  const events = structuredClone(EVENTS);
  applyDefinitions({version: 1, events: [
    {name: 'Imported skirmish', kind: 'lion', comboLayout: 'shieldgate', environment: 'forest'},
    {name: 'Old test', kind: 'lion', comboLayout: '__proto__'},
  ]}, events, {}, {spriteOverrides: false});
  assert.equal(events[0].comboLayout, 'shieldgate');
  assert.equal(events[1].comboLayout, undefined);
  for (const event of COMBO_ENCOUNTERS) assert.equal(events.find(source => source.name === event.name).comboLayout, event.comboLayout);
});
