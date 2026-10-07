import test from 'node:test';
import assert from 'node:assert/strict';
import {Game, EVENTS} from '../src/core.mjs';
import {OLD_WELL_EVENT, applyDefinitions} from '../src/definitions.mjs';
import {eventAvailable} from '../src/night-cycle.mjs';
import {selectEvent} from '../src/event-director.mjs';
import {saveSession, restoreSession} from '../src/session.mjs';
import {snapshot} from '../src/rooms.mjs';
import {tickSpellHealing} from '../src/healing-magic.mjs';
import {appendOldWellEvent, generateWellTunnels, spawnOldWell, validWellSpawn, ensureOldWells, enterOldWell,
  interactOldWell, leaveOldWell, oldWellBlocked, wellForPlayer, wellTunnelBlocked,
  oldWellRoomStep, tickOldWells, lootOldWellChest, wellRoomCamera} from '../src/old-well.mjs';

const setup = (environment = 'forest', seed = 738) => {
  const g = new Game(() => .37); g.environment = environment; g.seed = seed;
  const p = g.addPlayer('keyboard', 'Well explorer'); g.start(); g.openingBoard = false;
  const d = spawnOldWell(g); assert.ok(d, environment + ' has a world-valid well');
  Object.assign(p, {x: d.x, y: d.y + 50});
  return {g, p, d};
};
const press = (g, p, input = {}, dt = .05) => {
  const handled = oldWellRoomStep(g, p, input, dt);
  p.previousInput = {...input}; return handled;
};
const takeChest = (g, p) => {
  assert.equal(p.ui?.storage, 'old-well');
  assert.equal(g.storageFor(p), wellForPlayer(g, p).well.chest.items);
  g.inventoryAction(p, 'lootAll'); p.ui = null;
};
// Walk actual collision/movement along a tile path, including corridor bends.
export function walkTunnel(g, p, target) {
  const s = wellForPlayer(g, p).well, width = s.width;
  const start = Math.floor(p.roomY / 16) * width + Math.floor(p.roomX / 16);
  const end = Math.floor(target.y / 16) * width + Math.floor(target.x / 16);
  const previous = new Map([[start, null]]), queue = [start];
  for (let i = 0; i < queue.length && !previous.has(end); i++) {
    const n = queue[i], x = n % width, y = Math.floor(n / width);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy, next = ny * width + nx;
      if (nx >= 0 && ny >= 0 && nx < width && ny < s.height && s.tiles[next] && !previous.has(next)) {
        previous.set(next, n); queue.push(next);
      }
    }
  }
  assert.ok(previous.has(end), 'tunnel target is connected');
  const route = []; for (let n = end; n != null; n = previous.get(n)) route.unshift(n);
  for (const n of route) {
    const x = n % width * 16 + 8, y = Math.floor(n / width) * 16 + 8;
    for (let step = 0; Math.hypot(x - p.roomX, y - p.roomY) > 1; step++) {
      assert.ok(step < 50, 'movement advances through the real corridor');
      const dx = x - p.roomX, dy = y - p.roomY, len = Math.hypot(dx, dy);
      press(g, p, {x: dx / len, y: dy / len}, Math.min(.05, len / 78));
      assert.equal(wellTunnelBlocked(s, p.roomX, p.roomY), false);
    }
  }
}
const outer = g => JSON.stringify({terrain: g.terrain, scenery: g.scenery, house: g.house,
  enemies: g.enemies, loot: g.loot, explored: [...g.explored], seed: g.seed, environment: g.generatedEnvironment,
  turn: g.turn, round: g.round, turnOrder: g.turnOrder, deck: g.deck, cleared: g.cleared,
  director: g.eventDirector, objective: g.objective, progress: g.players.map(p => p.progress)});

test('Appended well event is selectable in forest and house without shifting legacy indices', () => {
  const before = EVENTS.map(e => e.name), appended = structuredClone(EVENTS);
  const index = appendOldWellEvent(appended);
  assert.deepEqual(appended.slice(0, before.length).map(e => e.name), before);
  assert.equal(appendOldWellEvent(appended), index);
  const authored = [{name: 'User card', kind: 'lion'}, {...OLD_WELL_EVENT, weight: 2, tip: 'User-authored well hint'}];
  assert.equal(appendOldWellEvent(authored), 1); assert.equal(authored[1].weight, 2);
  assert.equal(authored[1].tip, 'User-authored well hint');
  for (const environment of ['forest', 'house', 'temple', 'desert', 'ice', 'beach']) {
    const g = new Game(() => .4); g.generatedEnvironment = environment;
    assert.equal(eventAvailable(g, OLD_WELL_EVENT), ['forest', 'house'].includes(environment));
    assert.equal(selectEvent(g, [OLD_WELL_EVENT], eventAvailable), ['forest', 'house'].includes(environment) ? 0 : null);
  }
  assert.equal(OLD_WELL_EVENT.type, 'old_well'); assert.equal(OLD_WELL_EVENT.count, 0);
});

test('Existing wells are not rerolled, and old event indices stay stable in legacy packs', () => {
  const {g} = setup(); assert.equal(selectEvent(g, [OLD_WELL_EVENT], eventAvailable), null);
  const legacy = structuredClone(EVENTS).filter(e => e.kind !== 'old_well');
  const names = legacy.map(e => e.name), index = appendOldWellEvent(legacy);
  assert.equal(index, names.length); assert.deepEqual(legacy.slice(0, index).map(e => e.name), names);
});

test('Real definition migration appends the well to old authored rosters and retains authored well edits', () => {
  const source = structuredClone(EVENTS), legacy = source.filter(e => e.kind !== 'old_well');
  const restored = structuredClone(source);
  applyDefinitions({version: 1, events: legacy}, restored, {});
  assert.deepEqual(restored.slice(0, legacy.length), legacy);
  assert.equal(restored.at(-1).kind, 'old_well');
  assert.deepEqual(restored.at(-1).environments, ['forest', 'house']);
  const edited = [...legacy, {...OLD_WELL_EVENT, weight: 3, tip: 'An authored well tip'}];
  applyDefinitions({version: 1, events: edited}, restored, {});
  assert.equal(restored.filter(e => e.kind === 'old_well').length, 1);
  assert.equal(restored.at(-1).weight, 3); assert.equal(restored.at(-1).tip, 'An authored well tip');
});

test('Boundless forest wells spawn by the party and return to its original remote anchor', () => {
  const {g, p} = setup(); g.portals = []; g.mapMode = 'boundless';
  Object.assign(p, {x: 4216, y: -2040});
  const d = spawnOldWell(g); assert.ok(d); assert.ok(Math.hypot(d.x - p.x, d.y - p.y) < 725);
  const without = {...g, portals: []}; without.blocked = (...args) => Game.prototype.blocked.call(without, ...args);
  assert.ok(validWellSpawn(without, d));
  Object.assign(p, {x: d.x, y: d.y + 50}); const anchor = {x: p.x, y: p.y};
  assert.ok(enterOldWell(g, p, d)); assert.ok(leaveOldWell(g, p));
  assert.deepEqual({x: p.x, y: p.y}, anchor);
});

test('Seeded generation connects every walkable tile, all six rooms, enemies and treasure', () => {
  for (const seed of [0, 1, 2, 99, 761, 999999]) {
    const s = generateWellTunnels(seed), visited = new Set(), queue = [];
    queue.push(Math.floor(s.exit.y / 16) * s.width + Math.floor(s.exit.x / 16));
    for (let i = 0; i < queue.length; i++) {
      const n = queue[i]; if (visited.has(n)) continue; visited.add(n);
      const x = n % s.width, y = Math.floor(n / s.width);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy, next = ny * s.width + nx;
        if (nx >= 0 && ny >= 0 && nx < s.width && ny < s.height && s.tiles[next] && !visited.has(next)) queue.push(next);
      }
    }
    assert.equal(visited.size, s.tiles.filter(Boolean).length);
    assert.equal(s.rooms.length, 6); assert.ok(s.connections.length > s.rooms.length - 1, 'loop routes');
    for (const a of [s.exit, s.chest, ...s.enemies]) assert.equal(wellTunnelBlocked(s, a.x, a.y), false);
    assert.equal(wellTunnelBlocked(s, -1, 0), true); assert.equal(wellTunnelBlocked(s, NaN, 0), true);
    assert.deepEqual(s, generateWellTunnels(seed));
  }
  assert.ok(new Set([0, 1, 2, 3, 4, 5, 6, 7].map(seed => JSON.stringify(generateWellTunnels(seed).tiles))).size > 1);
});

test('Actual forest and house worlds spawn a clear rim and landing; spawn is idempotent', () => {
  for (const env of ['forest', 'house']) for (const seed of [17, 738, 9071]) {
    const {g, d} = setup(env, seed);
    // Validate without its own rim counting as an existing obstruction.
    const without = {...g, portals: []};
    without.blocked = (...args) => Game.prototype.blocked.call(without, ...args);
    assert.ok(validWellSpawn(without, d));
    assert.equal(without.blocked(d.x, d.y, 38, false, false, false, 0), false);
    assert.equal(oldWellBlocked(g, d.x, d.y), true);
    assert.equal(oldWellBlocked(g, d.x, d.y + 50), false);
    assert.equal(oldWellBlocked(g, d.x, d.y, 8, d), false);
    assert.equal(spawnOldWell(g), d); assert.equal(g.portals.filter(d => d.oldWell).length, 1);
    if (env === 'house') assert.ok(!g.house.floors.some(r => d.x >= r.x && d.y >= r.y && d.x < r.x + r.w && d.y < r.y + r.h));
  }
});

test('No well is placed over water, the board, a blocked footprint or an unsupported biome', () => {
  const {g} = setup(); g.portals = [];
  assert.equal(validWellSpawn(g, {x: 800, y: 800}), false);
  assert.equal(validWellSpawn(g, {x: 5, y: 5}), false);
  const original = g.blocked; g.blocked = () => true;
  assert.equal(spawnOldWell(g), null); g.blocked = original;
  g.terrain.fill('water'); assert.equal(spawnOldWell(g), null);
  g.generatedEnvironment = 'desert'; assert.equal(spawnOldWell(g), null);
});

test('Actual enter/explore/chest/exit preserves the original expedition and new loot in both worlds', () => {
  for (const env of ['forest', 'house']) {
    const {g, p, d} = setup(env); p.progress = 13; p.rolls = 5; g.turn = 2; g.round = 4;
    g.loot.push({id: 70001, x: 300, y: 310, type: 'stone', qty: 3});
    const refs = [g.terrain, g.scenery, g.house, g.enemies, g.loot, g.explored], before = outer(g), anchor = {x: p.x, y: p.y};
    assert.equal(interactOldWell(g, p), true); assert.equal(wellForPlayer(g, p), d);
    const explored = d.well.explored.length;
    for (const r of d.well.rooms) walkTunnel(g, p, {x: (r.x + Math.floor(r.w / 2)) * 16 + 8, y: (r.y + Math.floor(r.h / 2)) * 16 + 8});
    assert.ok(d.well.explored.length > explored + 150);
    const camera = wellRoomCamera(p, d.well); assert.ok(camera.x > 0 && camera.y > 0);
    press(g, p, {interact: true}); assert.ok(d.well.chest.opened);
    assert.equal(p.inventory.some(i => i?.type === 'magic_essence'), false, 'opening never transfers items');
    takeChest(g, p); assert.equal(d.well.chest.items.some(Boolean), false);
    assert.equal(p.inventory.find(i => i?.type === 'magic_essence').qty, 6);
    walkTunnel(g, p, d.well.exit); press(g, p, {interact: true});
    assert.equal(p.room, null); assert.deepEqual({x: p.x, y: p.y}, anchor); assert.ok(p.invuln >= 1);
    assert.equal(outer(g), before);
    assert.deepEqual([g.terrain, g.scenery, g.house, g.enemies, g.loot, g.explored], refs);
    refs.forEach((ref, i) => assert.equal([g.terrain, g.scenery, g.house, g.enemies, g.loot, g.explored][i], ref));
    assert.equal(p.progress, 13); assert.equal(p.rolls, 5); assert.equal(g.portals.includes(d), true);
  }
});

test('Rim collision and substepped tunnel movement prevent walking through walls', () => {
  const {g, p, d} = setup(); enterOldWell(g, p, d);
  Object.assign(p, {roomX: 60, roomY: 70}); assert.equal(wellTunnelBlocked(d.well, p.roomX, p.roomY), false);
  for (let n = 0; n < 40; n++) press(g, p, {x: -1}, .2);
  assert.ok(p.roomX >= 54); assert.equal(wellTunnelBlocked(d.well, p.roomX, p.roomY), false);
  assert.equal(p.room, d.id, 'walking onto daylight does not force exit');
});

test('Co-op shares tunnels and one chest while keeping separate entry/exit anchors', () => {
  const {g, p, d} = setup('house'), q = g.addPlayer('pad:0', 'Second explorer');
  Object.assign(q, {x: d.x + 48, y: d.y}); const anchors = [p, q].map(p => ({x: p.x, y: p.y}));
  assert.ok(enterOldWell(g, p, d)); assert.ok(enterOldWell(g, q, d));
  Object.assign(p, {roomX: d.well.chest.x, roomY: d.well.chest.y});
  Object.assign(q, {roomX: d.well.chest.x, roomY: d.well.chest.y});
  assert.ok(lootOldWellChest(g, p)); takeChest(g, p);
  assert.ok(lootOldWellChest(g, q)); takeChest(g, q);
  assert.equal(q.inventory.some(i => i?.type === 'magic_essence'), false);
  assert.ok(leaveOldWell(g, p)); assert.equal(q.room, d.id); assert.ok(g.portals.includes(d));
  assert.ok(leaveOldWell(g, q)); assert.ok(g.portals.includes(d));
  [p, q].forEach((p, i) => assert.deepEqual({x: p.x, y: p.y}, anchors[i]));
  assert.equal(d.closing, null); assert.equal(d.autoEnter, false);
});

test('Full backpacks leave chest loot available, and taking it cannot regenerate rewards', () => {
  const {g, p, d} = setup(); enterOldWell(g, p, d);
  Object.assign(p, {roomX: d.well.chest.x, roomY: d.well.chest.y});
  p.inventory = Array.from({length: 24}, () => ({type: 'sword', qty: 1}));
  const before = JSON.stringify(d.well.chest.items); lootOldWellChest(g, p);
  assert.equal(JSON.stringify(d.well.chest.items), before); assert.equal(d.well.chest.opened, true);
  g.inventoryAction(p, 'use'); assert.match(p.ui.notice, /full/i);
  assert.equal(JSON.stringify(d.well.chest.items), before);
  p.inventory[0] = null; g.inventoryAction(p, 'use'); assert.equal(d.well.chest.items[0], null);
  assert.ok(d.well.chest.items[1]); p.inventory[1] = null; p.inventory[2] = null;
  g.inventoryAction(p, 'lootAll'); const inventory = JSON.stringify(p.inventory);
  g.inventoryAction(p, 'lootAll'); ensureOldWells(g); assert.equal(JSON.stringify(p.inventory), inventory);
  assert.equal(d.well.chest.items.some(Boolean), false);
});

test('Save and multiplayer snapshot restore underground coordinates, kills, exploration and chest depletion', () => {
  const {g, p, d} = setup('house'); enterOldWell(g, p, d); const anchor = {...p.wellReturn};
  walkTunnel(g, p, d.well.chest); lootOldWellChest(g, p); takeChest(g, p);
  d.well.enemies[0].hp = 0; const state = JSON.parse(JSON.stringify(d.well));
  const restored = restoreSession(JSON.parse(JSON.stringify(saveSession(g)))); ensureOldWells(restored);
  const rp = restored.players[0], rd = wellForPlayer(restored, rp);
  assert.deepEqual(rd.well, state); assert.deepEqual(rp.wellReturn, anchor);
  assert.equal(rp.roomX, p.roomX); assert.equal(rp.roomY, p.roomY);
  assert.equal(snapshot(restored).portals[0].well.chest.items.some(Boolean), false);
  assert.ok(leaveOldWell(restored, rp)); assert.equal(rp.x, anchor.x); assert.equal(rp.y, anchor.y);
  assert.ok(enterOldWell(restored, rp, rd)); assert.equal(rd.well.enemies[0].hp, 0);
  assert.equal(rd.well.chest.items.some(Boolean), false);
});

test('Exit finds a safe alternate landing if the saved anchor is obstructed', () => {
  const {g, p, d} = setup(); enterOldWell(g, p, d); const anchor = {...p.wellReturn};
  const original = g.blocked.bind(g);
  g.blocked = (x, y, ...args) => Math.hypot(x - anchor.x, y - anchor.y) < 18 || original(x, y, ...args);
  assert.ok(leaveOldWell(g, p)); assert.ok(Math.hypot(p.x - anchor.x, p.y - anchor.y) >= 18);
  assert.equal(g.blocked(p.x, p.y, 10, false, false, false, 0), false);
});

test('Completely obstructed exits keep the player in the room and do not reset progress', () => {
  const {g, p, d} = setup(); enterOldWell(g, p, d); p.progress = 17; g.blocked = () => true;
  assert.equal(leaveOldWell(g, p), false); assert.equal(p.room, d.id); assert.equal(p.progress, 17);
});

test('Spiders and bats tick once, attack only room occupants, and stop when the room is empty', () => {
  const {g, p, d} = setup(), q = g.addPlayer('pad:1', 'Outside'); enterOldWell(g, p, d);
  const e = d.well.enemies[0]; Object.assign(p, {roomX: e.x + 12, roomY: e.y, invuln: 0});
  const qhp = q.hp, before = p.hp; tickOldWells(g, .05); assert.equal(e.state, 'windup');
  for (let n = 0; n < 12; n++) tickOldWells(g, .05);
  assert.ok(p.hp < before); assert.equal(q.hp, qhp); assert.equal(g.enemies.some(e => e.id?.startsWith?.('well-creature')), false);
  leaveOldWell(g, p); const room = JSON.stringify(d.well); tickOldWells(g, .1); assert.equal(JSON.stringify(d.well), room);
});

test('Real melee and ranged room attacks kill persisted creatures without hitting players', () => {
  for (const ranged of [false, true]) {
    const {g, p, d} = setup(); enterOldWell(g, p, d); const e = d.well.enemies[0];
    if (ranged) e.speed = 0;
    Object.assign(p, {roomX: e.x - 24, roomY: e.y, faceX: 1, faceY: 0});
    p.equipment.hand1 = ranged ? 'bow' : 'sword'; p.inventory.push({type: 'arrow', qty: 8});
    const hp = p.hp;
    for (let n = 0; n < 12 && e.hp > 0; n++) {
      press(g, p, {attack: true, aimX: 1, aimY: 0});
      for (let frame = 0; frame < 10; frame++) {press(g, p); if (ranged) tickOldWells(g, .05);}
    }
    assert.equal(e.hp, 0); assert.equal(e.state, 'defeated'); assert.equal(e.killedBy, p.id);
    assert.ok(d.well.drops.length || p.inventory.find(i => i?.type === 'relic_dust'));
    if (!ranged) assert.equal(p.hp, hp);
    leaveOldWell(g, p); enterOldWell(g, p, d); assert.equal(e.hp, 0);
    const restored = restoreSession(JSON.parse(JSON.stringify(saveSession(g)))); ensureOldWells(restored);
    assert.equal(wellForPlayer(restored, restored.players[0]).well.enemies[0].hp, 0);
  }
});

test('Death exits the well into normal revival handling without restoring HP or discarding loot', () => {
  const {g, p, d} = setup(); enterOldWell(g, p, d); p.hp = 0; p.progress = 22;
  p.inventory.push({type: 'magic_essence', qty: 6}); tickOldWells(g, .05);
  assert.equal(p.room, null); assert.equal(p.hp, 0); assert.equal(p.progress, 22);
  assert.equal(p.inventory.find(i => i?.type === 'magic_essence').qty, 6);
});

test('Invalid entry and distant chest interaction do not mutate state', () => {
  const {g, p, d} = setup(); p.x = 5; p.y = 5; assert.equal(enterOldWell(g, p, d), false);
  Object.assign(p, {x: d.x, y: d.y + 50, hp: 0}); assert.equal(interactOldWell(g, p), false);
  p.hp = 100; p.ui = {}; assert.equal(interactOldWell(g, p), false); p.ui = null;
  enterOldWell(g, p, d); assert.equal(lootOldWellChest(g, p), false); assert.equal(d.well.chest.opened, false);
});

test('Actual main g.update inputs investigate, explore, open item slots, transfer once and climb out', () => {
  for (const env of ['forest', 'house']) {
    const {g, p, d} = setup(env), anchor = {x: p.x, y: p.y};
    g.update(.05, {keyboard: {}}); assert.equal(p.room, null, 'proximity alone does not enter');
    g.update(.05, {keyboard: {interact: true}}); assert.equal(p.room, d.id);
    const oldY = p.roomY; g.update(.05, {keyboard: {y: 1}}); assert.ok(p.roomY > oldY);
    Object.assign(p, {roomX: d.well.chest.x, roomY: d.well.chest.y, previousInput: {}});
    d.well.enemies.forEach(e => {e.speed = 0; e.cooldown = 999;});
    g.update(.05, {keyboard: {interact: true}});
    assert.equal(p.ui.storage, 'old-well'); assert.equal(p.ui.panel, 'chest');
    assert.equal(p.ui.loot, true); assert.equal(d.well.chest.items.filter(Boolean).length, 3);
    g.update(.05, {keyboard: {use: true}});
    assert.equal(d.well.chest.items[0], null); assert.equal(p.inventory.find(i => i?.type === 'magic_essence').qty, 6);
    g.update(.05, {keyboard: {close: true}}); assert.equal(p.ui, null);
    g.leaveRoom(p); assert.equal(p.room, d.id, 'public leaveRoom rejects a distant exit');
    Object.assign(p, {roomX: d.well.exit.x, roomY: d.well.exit.y, previousInput: {}});
    g.update(.05, {keyboard: {interact: true}});
    assert.equal(p.room, null); assert.deepEqual({x: p.x, y: p.y}, anchor);
    g.update(.05, {keyboard: {}}); assert.equal(p.room, null, 'no automatic reentry after exit');
  }
});

test('Actual spawnEvent appends a well card at the tail and spawns a portal rather than an enemy', () => {
  const index = EVENTS.findIndex(e => e.kind === 'old_well'); assert.equal(index, EVENTS.length - 1);
  for (const env of ['forest', 'house', 'desert', 'temple']) {
    const g = new Game(() => .37); g.environment = env; g.addPlayer('keyboard'); g.start();
    const enemies = g.enemies.length; g.spawnEvent(index);
    assert.equal(g.portals.some(d => d.oldWell), ['forest', 'house'].includes(env));
    assert.equal(g.enemies.length, enemies, 'the event never creates an old_well combat actor');
    if (env === 'forest' || env === 'house') assert.equal(g.event.type, 'old_well');
  }
});

test('Healing wand uses shared room healing and halo rules without damaging spiders, bats or outside players', () => {
  const {g, p, d} = setup(), q = g.addPlayer('pad:0', 'Patient'), outside = g.addPlayer('pad:1', 'Outside');
  Object.assign(q, {x: d.x + 48, y: d.y}); enterOldWell(g, p, d); enterOldWell(g, q, d);
  Object.assign(p, {roomX: 180, roomY: 104, faceX: 1, faceY: 0, mana: 100, previousInput: {}});
  Object.assign(q, {roomX: 220, roomY: 104, hp: 20, maxHp: 100});
  outside.hp = 20; p.equipment.hand1 = 'healing_wand'; p.equipment.head = 'halo'; q.equipment.head = 'halo';
  const enemyHP = d.well.enemies.map(e => e.hp), mana = p.mana;
  for (let n = 0; n < 12; n++) press(g, p, {attack: true, aimX: 1, aimY: 0}, .1);
  assert.equal(d.well.bolts.length, 0, 'held Attack charges without firing');
  press(g, p, {aimX: 1, aimY: 0});
  assert.equal(p.mana, mana - 12); assert.equal(d.well.bolts[0].damage, 0);
  for (let n = 0; n < 5; n++) tickOldWells(g, .05);
  assert.equal(q.hp, 76.25); assert.equal(outside.hp, 20); assert.deepEqual(d.well.enemies.map(e => e.hp), enemyHP);
  assert.equal(q.healingOverTime.length, 1);
  tickSpellHealing(g, 1); assert.equal(q.hp, 82.5);
  assert.equal(g.effects.filter(fx => fx.text === '+56.25' && fx.room === d.id).length, 1);
  assert.equal(g.effects.filter(fx => fx.healingRise && fx.room === d.id).length, 2, 'one rise for bolt heal, one for HoT');
  p.wellAttackCooldown = 0; p.previousInput = {}; p.mana = 0;
  press(g, p, {attack: true}); press(g, p); assert.equal(d.well.bolts.length, 0); assert.equal(p.mana, 0);
});

test('Healing bolts ignore cave enemies while ordinary wand bolts retain room damage controls', () => {
  for (const healing of [true, false]) {
    const {g, p, d} = setup(); enterOldWell(g, p, d); const e = d.well.enemies[0];
    e.speed = 0; e.cooldown = 999;
    Object.assign(p, {roomX: e.x - 26, roomY: e.y, faceX: 1, faceY: 0, mana: 100, previousInput: {}});
    p.equipment.hand1 = healing ? 'healing_wand' : 'wand'; const before = e.hp;
    press(g, p, {attack: true, aimX: 1, aimY: 0}); press(g, p, {aimX: 1, aimY: 0});
    for (let n = 0; n < 15; n++) tickOldWells(g, .05);
    assert.equal(e.hp < before, !healing);
    if (healing) assert.equal(e.hp, before);
  }
});

test('Actual Attack release casts a charged offhand healer and retains damaging main-hand wand controls', () => {
  const {g, p, d} = setup(); enterOldWell(g, p, d);
  p.equipment.hand1 = 'wand'; p.equipment.hand2 = 'healing_wand';
  Object.assign(p, {mana: 100, roomX: 120, roomY: 104, faceX: 1, faceY: 0, previousInput: {}});
  d.well.enemies.forEach(e => {e.speed = 0; e.cooldown = 999;});
  for (let n = 0; n < 24; n++) g.tickAdventure(.05, {keyboard: {attack: true}});
  assert.equal(d.well.bolts.length, 0); assert.equal(p.charge, 1.2);
  g.tickAdventure(.05, {keyboard: {}});
  const healing = d.well.bolts.find(b => b.healing), damaging = d.well.bolts.find(b => !b.healing);
  assert.ok(healing); assert.ok(damaging); assert.equal(healing.slot, 'hand2'); assert.equal(damaging.slot, 'hand1');
  assert.equal(healing.healingAmount, 36); assert.equal(healing.damage, 0); assert.ok(damaging.damage > 0);
  assert.equal(p.charge, 0);
  const count = d.well.bolts.length;
  // The offhand key remains an inventory action; it cannot trigger another cast.
  g.tickAdventure(.05, {keyboard: {offhand: true}}); assert.ok(d.well.bolts.length <= count);
});
