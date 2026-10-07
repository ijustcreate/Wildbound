import test from 'node:test';
import assert from 'node:assert/strict';
import {Game, EVENTS} from '../src/core.mjs';
import {ITEMS} from '../src/items.mjs';
import {graveyardWorld, graveyardBlocked} from '../src/graveyard-world.mjs';
import {saveSession, restoreSession} from '../src/session.mjs';
import {snapshot} from '../src/rooms.mjs';
import {CRYPT_TITLE, CRYPT_BOSS_KIND, CRYPT_REWARDS, generateMausoleumCrypt,
  spawnMausoleumEvent, wakeMausoleumBoss, hitCryptEnemy, mausoleumLights,
  drawMausoleumEntrance} from '../src/mausoleum-crypt.mjs';
import {ensureOldWells, enterOldWell, leaveOldWell, interactOldWell, wellForPlayer,
  wellTunnelBlocked, oldWellBlocked, oldWellRoomStep, tickOldWells,
  lootOldWellChest, drawOldWellRoom, drawOldWell, wellRoomCamera} from '../src/old-well.mjs';

const setup = (seed = 738) => {
  const g = new Game(() => .37); g.environment = 'graveyard'; g.seed = seed;
  const p = g.addPlayer('keyboard', 'Crypt explorer'); g.start(); g.openingBoard = false;
  // Exercise the environment worker's actual generated scenery/footprints even
  // before main routes graveyard generation through Game.start.
  if (!g.graveyard) {Object.assign(g, graveyardWorld(seed)); g.generatedEnvironment = 'graveyard';}
  const d = spawnMausoleumEvent(g); assert.ok(d);
  Object.assign(p, {x: d.x, y: d.y + 50});
  return {g, p, d};
};
const press = (g, p, input = {}, dt = .05) => {
  const result = oldWellRoomStep(g, p, input, dt); p.previousInput = {...input}; return result;
};
const place = (p, a, dx = 0, dy = 0) => Object.assign(p, {roomX: a.x + dx, roomY: a.y + dy});
const bossFor = d => d.well.enemies.find(e => e.kind === CRYPT_BOSS_KIND);
const restore = g => restoreSession(JSON.parse(JSON.stringify(saveSession(g))));
const surface = g => JSON.stringify({seed: g.seed, terrain: g.terrain, scenery: g.scenery,
  graveyard: g.graveyard, enemies: g.enemies, loot: g.loot, explored: [...g.explored],
  turn: g.turn, round: g.round, deck: g.deck, cleared: g.cleared, objective: g.objective});
const ticks = (g, count, dt = .05) => {for (let n = 0; n < count; n++) tickOldWells(g, dt);};
const wake = ({g, p, d}) => {
  place(p, d.well.coffin, 0, 26); press(g, p); press(g, p, {interact: true});
  assert.equal(bossFor(d).state, 'rising'); ticks(g, 40); assert.equal(bossFor(d).state, 'hunt');
};
function route(s, from, to) {
  const index = a => Math.floor(a.y / 16) * s.width + Math.floor(a.x / 16);
  const start = index(from), end = index(to), queue = [start], previous = new Map([[start, null]]);
  for (let i = 0; i < queue.length && !previous.has(end); i++) {
    const n = queue[i], x = n % s.width, y = Math.floor(n / s.width);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy, next = ny * s.width + nx;
      if (nx >= 0 && ny >= 0 && nx < s.width && ny < s.height && s.tiles[next] && !previous.has(next)) {
        previous.set(next, n); queue.push(next);
      }
    }
  }
  assert.ok(previous.has(end), 'connected route');
  const path = []; for (let n = end; n != null; n = previous.get(n)) path.unshift(n);
  return path;
}
function walk(g, p, target) {
  const s = wellForPlayer(g, p).well;
  for (const n of route(s, {x: p.roomX, y: p.roomY}, target)) {
    const x = n % s.width * 16 + 8, y = Math.floor(n / s.width) * 16 + 8;
    for (let step = 0; Math.hypot(x - p.roomX, y - p.roomY) > 1; step++) {
      assert.ok(step < 50, 'real movement advances through bends');
      const dx = x - p.roomX, dy = y - p.roomY, len = Math.hypot(dx, dy);
      press(g, p, {x: dx / len, y: dy / len}, Math.min(.1, len / 78));
      assert.equal(wellTunnelBlocked(s, p.roomX, p.roomY), false);
    }
  }
}
function canvas() {
  const calls = [], stack = [];
  const c = {calls, globalAlpha: 1, fillStyle: '', x: 0, y: 0,
    save() {stack.push({globalAlpha: this.globalAlpha, fillStyle: this.fillStyle, x: this.x, y: this.y});},
    restore() {Object.assign(this, stack.pop());},
    translate(x, y) {this.x += x; this.y += y;},
    fillRect(x, y, w, h) {calls.push({kind: 'rect', x: x + this.x, y: y + this.y, w, h, color: this.fillStyle, alpha: this.globalAlpha});},
    fillText(text, x, y) {calls.push({kind: 'text', text, x, y});},
    strokeText() {}, beginPath() {}, rect() {}, clip() {},
  };
  return c;
}

test('Crypt generation connects every floor, all eight chambers, exit, treasure and coffin', () => {
  for (const seed of [0, 1, 738, 999999]) {
    const s = generateMausoleumCrypt(seed);
    assert.deepEqual(s, generateMausoleumCrypt(seed)); assert.equal(s.theme, 'mausoleum');
    assert.equal(s.rooms.length, 8); assert.ok(s.width * s.height > 3000);
    for (const a of [s.exit, s.arrival, s.chest, s.coffin, ...s.enemies, ...s.candles]) {
      assert.equal(wellTunnelBlocked(s, a.x, a.y), false); route(s, s.exit, a);
    }
    const path = route(s, s.exit, s.coffin);
    assert.ok(path.length > 115, 'coffin requires travelling the long connected catacombs');
    assert.ok(Math.hypot(s.arrival.x - s.exit.x, s.arrival.y - s.exit.y) >= 45);
    const start = Math.floor(s.exit.y / 16) * s.width + Math.floor(s.exit.x / 16), queue = [start], seen = new Set(queue);
    for (let i = 0; i < queue.length; i++) {
      const n = queue[i], x = n % s.width, y = Math.floor(n / s.width);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy, next = ny * s.width + nx;
        if (nx >= 0 && ny >= 0 && nx < s.width && ny < s.height && s.tiles[next] && !seen.has(next)) {seen.add(next); queue.push(next);}
      }
    }
    assert.equal(seen.size, s.tiles.filter(Boolean).length, 'no isolated floor cells');
    assert.equal(s.enemies.filter(e => e.kind === CRYPT_BOSS_KIND).length, 1);
    for (const kind of ['zombie', 'skeleton', 'spider', 'bat']) assert.ok(s.enemies.some(e => e.kind === kind));
    assert.deepEqual(s.chest.items, [{type: 'lantern', qty: 1}]);
  }
});

test('Spawn opens one existing generated building and its metadata; portal is idempotent and persistent', () => {
  const {g, d} = setup(); const props = g.scenery.filter(s => s.kind === 'mausoleum');
  assert.equal(props.filter(s => s.doorOpen).length, 1);
  assert.equal(props.find(s => s.id === d.mausoleumId).cryptPortalId, d.id);
  assert.equal(g.graveyard.mausoleums.find(s => s.id === d.mausoleumId).doorOpen, true);
  assert.equal(d.oldWell, true); assert.equal(d.mausoleum, true); assert.equal(d.autoEnter, false);
  assert.equal(d.closing, null); assert.equal(d.persistent, true);
  assert.equal(oldWellBlocked(g, d.x, d.y + 18), false, 'well rim cannot block mausoleum door');
  const next = g.nextId, state = JSON.stringify(d); assert.equal(spawnMausoleumEvent(g), d);
  assert.equal(g.nextId, next); assert.equal(JSON.stringify(d), state);
  const missing = {generatedEnvironment: 'graveyard', portals: [], scenery: [], players: [], nextId: 1};
  assert.equal(spawnMausoleumEvent(missing), null); assert.equal(missing.nextId, 1);
  assert.equal(spawnMausoleumEvent({...missing, generatedEnvironment: 'forest', scenery: props}), null);
});

test('Explicit authored door coordinates are used and both scenery and metadata doors open', () => {
  const door = {x: 510, y: 420, open: false};
  const s = {id: 'authored-tomb', kind: 'mausoleum', x: 500, y: 380, door};
  const metadata = {id: s.id, x: s.x, y: s.y};
  const g = {generatedEnvironment: 'graveyard', scenery: [s], graveyard: {mausoleums: [metadata]},
    players: [], portals: [], nextId: 7, seed: 8};
  const d = spawnMausoleumEvent(g);
  assert.deepEqual([d.x, d.y], [510, 420]); assert.equal(door.open, true); assert.equal(metadata.doorOpen, true);
});

test('Actual mausoleum event spawns a room portal without adding a surface combat actor', () => {
  const {g} = setup(); g.portals = []; const count = g.enemies.length;
  const index = EVENTS.findIndex(e => e.type === 'mausoleum'); assert.ok(index >= 0);
  g.spawnEvent(index); assert.ok(g.portals.some(d => d.mausoleum && d.oldWell));
  assert.equal(g.event.type, 'mausoleum'); assert.equal(g.enemies.length, count);
});

test('Main update enters through existing Interact, safely explores, transfers lantern and returns without changing expedition', () => {
  const {g, p, d} = setup(); const anchor = {x: p.x, y: p.y};
  const refs = {terrain: g.terrain, scenery: g.scenery, graveyard: g.graveyard};
  const layout = () => JSON.stringify({seed: g.seed, terrain: g.terrain,
    scenery: g.scenery.filter(s => s.graveyard).map(s => ({id: s.id, kind: s.kind, x: s.x, y: s.y, rootY: s.rootY,
      footprint: s.graveyardFootprint, hp: s.hp, doorOpen: s.doorOpen, cryptPortalId: s.cryptPortalId})),
    mausoleums: g.graveyard.mausoleums, plots: g.graveyard.plots, bounds: g.graveyard.bounds,
    gate: g.graveyard.gate, trail: g.graveyard.trail, turn: g.turn, round: g.round, deck: g.deck, cleared: g.cleared});
  const before = layout(), discovered = new Set(g.explored);
  p.progress = 18; p.rolls = 4;
  g.update(.05, {}); assert.equal(p.room, null);
  g.update(.05, {keyboard: {interact: true}}); assert.equal(p.room, d.id);
  assert.ok(Math.hypot(p.roomX - d.well.exit.x, p.roomY - d.well.exit.y) >= 45);
  const known = d.well.explored.length;
  walk(g, p, d.well.chest); assert.ok(d.well.explored.length > known + 350);
  const camera = wellRoomCamera(p, d.well); assert.ok(camera.y > 100);
  g.update(.05, {keyboard: {use: true}}); assert.equal(p.ui.storage, 'old-well');
  assert.equal(g.storageFor(p), d.well.chest.items); assert.equal(d.well.chest.opened, true);
  assert.equal(p.inventory.some(i => i?.type === 'lantern'), false, 'opening never transfers');
  g.update(.05, {keyboard: {}}); g.update(.05, {keyboard: {use: true}});
  assert.equal(d.well.chest.items.some(Boolean), false); assert.equal(p.inventory.find(i => i?.type === 'lantern').qty, 1);
  g.update(.05, {keyboard: {close: true}}); assert.equal(p.ui, null);
  walk(g, p, d.well.exit); g.update(.05, {keyboard: {interact: true}});
  assert.equal(p.room, null); assert.deepEqual({x: p.x, y: p.y}, anchor);
  const after = JSON.parse(layout()), initial = JSON.parse(before);
  assert.deepEqual(Object.keys(after).filter(key => JSON.stringify(after[key]) !== JSON.stringify(initial[key])), [], 'surface fields changed');
  for (const [key, ref] of Object.entries(refs)) assert.equal(g[key], ref, 'original ' + key + ' survives');
  for (const cell of discovered) assert.ok(g.explored.has(cell), 'no outside discovery is lost');
  assert.equal(p.progress, 18); assert.equal(p.rolls, 4);
  g.update(.05, {}); assert.equal(p.room, null); assert.ok(g.portals.includes(d));
});

test('Direct room exploration and return preserve the complete outside state without rerolling or replacing objects', () => {
  const {g, p, d} = setup(), before = surface(g);
  const refs = [g.terrain, g.scenery, g.graveyard, g.enemies, g.loot, g.explored];
  enterOldWell(g, p, d); place(p, d.well.chest); press(g, p);
  lootOldWellChest(g, p); g.inventoryAction(p, 'lootAll'); p.ui = null;
  assert.ok(leaveOldWell(g, p)); assert.equal(surface(g), before);
  refs.forEach((ref, n) => assert.equal([g.terrain, g.scenery, g.graveyard, g.enemies, g.loot, g.explored][n], ref));
});

test('Arrival and reload reject held Interact or Use even when previousInput is reset; both must release', () => {
  for (const key of ['interact', 'use']) {
    const {g, p, d} = setup(); assert.ok(enterOldWell(g, p, d)); place(p, d.well.exit);
    for (let n = 0; n < 4; n++) {p.previousInput = {}; g.update(.05, {keyboard: {[key]: true}}); assert.equal(p.room, d.id);}
    assert.equal(g.leaveRoom(p), false);
    // Releasing Interact while Use remains held must not arm the stairs.
    p.previousInput = {}; press(g, p, {use: true}); assert.equal(p.wellExitArmed, false);
    press(g, p); assert.equal(p.wellExitArmed, true);
    const loaded = restore(g), q = loaded.players[0], portal = wellForPlayer(loaded, q);
    assert.equal(q.wellExitArmed, false, 'restore resets the arrival latch');
    for (let n = 0; n < 3; n++) {q.previousInput = {}; loaded.update(.05, {keyboard: {[key]: true}}); assert.equal(q.room, portal.id);}
    loaded.update(.05, {}); loaded.update(.05, {keyboard: {[key]: true}}); assert.equal(q.room, null);
    assert.equal(q.hp > 0, true); assert.ok(q.invuln > 0);
  }
});

test('Invalid saved room coordinates rehome away from stairs, and a blocked surface exit preserves room and progress', () => {
  const {g, p, d} = setup(); enterOldWell(g, p, d); p.progress = 23;
  p.roomX = NaN; p.roomY = -999; ensureOldWells(g);
  assert.equal(wellTunnelBlocked(d.well, p.roomX, p.roomY), false);
  assert.ok(Math.hypot(p.roomX - d.well.exit.x, p.roomY - d.well.exit.y) >= 45);
  g.blocked = () => true; assert.equal(leaveOldWell(g, p), false);
  assert.equal(p.room, d.id); assert.equal(p.progress, 23); assert.equal(p.wellExitArmed, false);
});

test('Dead players exit at their surface anchor with HP, loot and progress intact and cannot interact', () => {
  const {g, p, d} = setup(); const anchor = {x: p.x, y: p.y}; enterOldWell(g, p, d);
  p.inventory.push({type: 'lantern', qty: 1}); p.progress = 12; p.hp = 0;
  place(p, d.well.coffin); assert.equal(wakeMausoleumBoss(g, p), false); assert.equal(lootOldWellChest(g, p), false);
  tickOldWells(g, .05); assert.equal(p.room, null); assert.equal(p.hp, 0);
  assert.deepEqual({x: p.x, y: p.y}, anchor); assert.equal(p.progress, 12);
  assert.equal(p.inventory.find(i => i?.type === 'lantern').qty, 1);
  assert.equal(interactOldWell(g, p), false);
});

test('Co-op retains separate world coordinates and return anchors with shared exploration, chest and boss', () => {
  const {g, p, d} = setup(), q = g.addPlayer('pad:0', 'Second explorer');
  Object.assign(q, {x: d.x + 48, y: d.y + 24});
  const anchors = [p, q].map(p => ({x: p.x, y: p.y})); enterOldWell(g, p, d); enterOldWell(g, q, d);
  place(p, d.well.chest); press(g, p); place(q, d.well.coffin, 0, 26); press(g, q);
  assert.equal(wakeMausoleumBoss(g, q), true); assert.equal(wakeMausoleumBoss(g, p), false);
  assert.equal(wellForPlayer(g, p).well, wellForPlayer(g, q).well);
  [p, q].forEach((p, i) => assert.deepEqual({x: p.x, y: p.y}, anchors[i]));
  lootOldWellChest(g, p); g.inventoryAction(p, 'lootAll'); p.ui = null;
  place(q, d.well.chest); lootOldWellChest(g, q); g.inventoryAction(q, 'lootAll'); q.ui = null;
  assert.equal(q.inventory.some(i => i?.type === 'lantern'), false);
  assert.ok(leaveOldWell(g, p)); assert.equal(q.room, d.id); assert.ok(leaveOldWell(g, q));
  [p, q].forEach((p, i) => assert.deepEqual({x: p.x, y: p.y}, anchors[i]));
  assert.equal(d.closing, null); assert.ok(g.portals.includes(d));
});

test('Full inventory keeps lantern in its real chest, and depletion persists across leave/reenter/reload', () => {
  const {g, p, d} = setup(); enterOldWell(g, p, d); place(p, d.well.chest);
  p.inventory = Array.from({length: 24}, () => ({type: 'sword', qty: 1}));
  lootOldWellChest(g, p); g.inventoryAction(p, 'use'); assert.match(p.ui.notice, /full/i);
  assert.deepEqual(d.well.chest.items, [{type: 'lantern', qty: 1}]);
  p.inventory[0] = null; g.inventoryAction(p, 'use'); assert.equal(d.well.chest.items.some(Boolean), false); p.ui = null;
  leaveOldWell(g, p); enterOldWell(g, p, d); assert.equal(d.well.chest.items.some(Boolean), false);
  const loaded = restore(g), portal = wellForPlayer(loaded, loaded.players[0]);
  assert.equal(portal.well.chest.opened, true); assert.equal(portal.well.chest.items.some(Boolean), false);
});

test('Coffin wakes exactly one immune rising boss via Use; rising animation and timer survive save', () => {
  const {g, p, d} = setup(); enterOldWell(g, p, d); const e = bossFor(d);
  hitCryptEnemy(g, d.well, e, 999, p); assert.equal(e.hp, 360, 'sealed coffin is immune');
  assert.equal(wakeMausoleumBoss(g, p), false, 'remote activation rejected');
  place(p, d.well.coffin, 0, 26); press(g, p); press(g, p, {use: true});
  assert.equal(e.state, 'rising'); assert.equal(d.well.coffin.opened, true);
  assert.equal(wakeMausoleumBoss(g, p), false); ticks(g, 12);
  assert.ok(e.rise > .2 && e.rise < .5); const hp = e.hp;
  hitCryptEnemy(g, d.well, e, 999, p); assert.equal(e.hp, hp);
  const loaded = restore(g), portal = wellForPlayer(loaded, loaded.players[0]), savedBoss = bossFor(portal);
  assert.equal(savedBoss.state, 'rising'); assert.equal(savedBoss.rise, e.rise); assert.equal(savedBoss.timer, e.timer);
  ticks(loaded, 28); assert.equal(savedBoss.state, 'hunt'); assert.equal(savedBoss.rise, 1);
  assert.equal(portal.well.enemies.filter(e => e.kind === CRYPT_BOSS_KIND).length, 1);
});

test('Boss sweep telegraphs, damages only room players, respects armor/invulnerability and can be dodged', () => {
  const state = setup(); const {g, p, d} = state; enterOldWell(g, p, d); wake(state);
  const outside = g.addPlayer('pad:1', 'Outside'); const e = bossFor(d), hp = p.hp, otherHP = outside.hp;
  place(p, e, 0, 30); p.invuln = 0; tickOldWells(g, .05);
  assert.equal(e.state, 'windup'); assert.equal(e.attackKind, 'sweep'); assert.equal(p.hp, hp);
  ticks(g, 14); assert.ok(p.hp < hp); assert.equal(outside.hp, otherHP);
  assert.ok(g.effects.some(fx => fx.room === d.id && fx.x === p.roomX && fx.y === p.roomY - 25));
  e.state = 'hunt'; e.cooldown = 0; e.attackCount = 0; p.invuln = 5; const protectedHP = p.hp;
  tickOldWells(g, .05); ticks(g, 14); assert.equal(p.hp, protectedHP);
  e.state = 'hunt'; e.cooldown = 0; e.attackCount = 0; p.invuln = 0; place(p, e, 0, 30);
  tickOldWells(g, .05); place(p, e, 0, 85); ticks(g, 14); assert.equal(p.hp, protectedHP, 'moving outside telegraph dodges sweep');
});

test('Boss bone volley is aimed, persistent, damaging, blocked by stone and frozen in empty rooms', () => {
  const state = setup(); const {g, p, d} = state; enterOldWell(g, p, d); wake(state); const e = bossFor(d);
  place(p, e, 80, 0); p.invuln = 0; const hp = p.hp;
  tickOldWells(g, .05); assert.equal(e.attackKind, 'volley'); const aim = [e.aimX, e.aimY];
  ticks(g, 19); assert.equal(d.well.hazards.length, 3); assert.deepEqual([e.aimX, e.aimY], aim);
  const loaded = restore(g), portal = wellForPlayer(loaded, loaded.players[0]);
  assert.deepEqual(portal.well.hazards, d.well.hazards); ticks(g, 15); assert.ok(p.hp < hp);
  // A projectile directed into the outer north wall must expire without sliding.
  d.well.hazards = [{kind: 'crypt_bone', x: 72, y: 54, vx: 0, vy: -126, damage: 19, life: 2, age: 0}];
  ticks(g, 2); assert.equal(d.well.hazards.length, 0);
  leaveOldWell(g, p); const before = JSON.stringify(d.well); ticks(g, 20); assert.equal(JSON.stringify(d.well), before);
});

test('Real melee and bow attacks defeat crypt enemies and give one room drop; lantern never attacks', () => {
  for (const weapon of ['sword', 'bow', 'lantern']) {
    const {g, p, d} = setup(); enterOldWell(g, p, d); const e = d.well.enemies.find(e => e.kind === 'skeleton');
    e.speed = 0; e.cooldown = 999; place(p, e, -24, 0); p.faceX = 1; p.faceY = 0;
    p.equipment.hand1 = weapon; p.inventory.push({type: 'arrow', qty: 20}); const hp = e.hp;
    for (let n = 0; n < 8 && e.hp > 0; n++) {
      press(g, p, {attack: true, aimX: 1, aimY: 0});
      for (let frame = 0; frame < 10; frame++) {press(g, p); if (weapon === 'bow') tickOldWells(g, .05);}
    }
    if (weapon === 'lantern') {assert.equal(e.hp, hp); assert.equal(d.well.bolts.length, 0);}
    else {
      assert.equal(e.hp, 0); assert.equal(e.killedBy, p.id); assert.equal(e.dropsGiven, true);
      assert.equal(d.well.drops.filter(drop => drop.id === e.id + '-drop').length, 1);
      hitCryptEnemy(g, d.well, e, 100, p); assert.equal(d.well.drops.filter(drop => drop.id === e.id + '-drop').length, 1);
    }
  }
});

test('Healing wand uses room ally targets and halo healing without hitting crypt enemies or surface actors', () => {
  const {g, p, d} = setup(), q = g.addPlayer('pad:0', 'Patient'), outside = g.addPlayer('pad:1', 'Outside');
  Object.assign(q, {x: d.x + 48, y: d.y + 24}); enterOldWell(g, p, d); enterOldWell(g, q, d);
  place(p, d.well.exit, -25, 56); place(q, d.well.exit, 25, 56);
  p.equipment.hand1 = 'healing_wand'; p.equipment.head = 'halo'; q.equipment.head = 'halo';
  p.mana = 100; q.hp = 20; q.maxHp = 100; outside.hp = 20;
  const before = d.well.enemies.map(e => e.hp);
  for (let n = 0; n < 12; n++) press(g, p, {attack: true, aimX: 1, aimY: 0}, .1);
  press(g, p, {aimX: 1, aimY: 0}); ticks(g, 8);
  assert.ok(q.hp > 70); assert.equal(outside.hp, 20); assert.deepEqual(d.well.enemies.map(e => e.hp), before);
  assert.equal(q.healingOverTime.length, 1); assert.ok(g.effects.some(fx => fx.room === d.id && fx.healingRise));
});

test('Main-defined flame sword ignites only landed room melee, persists its burn and resolves burn kills through the single-drop path', () => {
  const {g, p, d} = setup(); enterOldWell(g, p, d);
  assert.equal(ITEMS.crypt_flame_sword.meleeBurn.duration, 2);
  const e = d.well.enemies.find(e => e.kind === 'skeleton'); e.speed = 0; e.cooldown = 999;
  place(p, e, -24, 0); p.equipment.hand1 = 'crypt_flame_sword'; p.faceX = -1; p.faceY = 0;
  press(g, p, {attack: true}); assert.equal(e.burning, undefined, 'misses cannot ignite');
  for (let n = 0; n < 10; n++) press(g, p);
  e.hp = ITEMS.crypt_flame_sword.damage + 2;
  press(g, p, {attack: true, aimX: 1, aimY: 0}); assert.equal(e.hp, 2);
  assert.equal(e.burning, 2); assert.equal(e.burnDamage, 3); assert.equal(e.burnOwner, p.id);
  const loaded = restore(g), q = loaded.players[0], portal = wellForPlayer(loaded, q), burned = portal.well.enemies.find(a => a.id === e.id);
  assert.equal(burned.burning, 2); ticks(loaded, 11); assert.equal(burned.hp, 0);
  assert.equal(burned.killedBy, q.id); assert.equal(portal.well.drops.filter(a => a.id === e.id + '-drop').length, 1);
  ticks(loaded, 40); assert.equal(portal.well.drops.filter(a => a.id === e.id + '-drop').length, 1);
});

test('Real boss kill drops exactly shield and sword once; full bag, co-op pickup and JSON reload never duplicate or lose rewards', () => {
  const state = setup(); const {g, p, d} = state; enterOldWell(g, p, d); wake(state); const e = bossFor(d);
  p.inventory = Array.from({length: 24}, () => ({type: 'sword', qty: 1}));
  p.equipment.hand1 = 'sword'; place(p, e, 0, 26); p.faceX = 0; p.faceY = -1;
  e.hp = 12; press(g, p); press(g, p, {attack: true});
  assert.equal(e.hp, 0); assert.equal(e.state, 'defeated'); assert.equal(d.well.coffin.defeated, true);
  assert.deepEqual(d.well.drops.map(a => a.type), [...CRYPT_REWARDS]); assert.equal(d.well.coffin.rewardsDropped, true);
  place(p, e, 0, 8); press(g, p); assert.equal(d.well.drops.length, 2, 'full bag leaves both drops');
  hitCryptEnemy(g, d.well, e, 999, p); assert.equal(d.well.drops.length, 2);
  const loaded = restore(g), q = loaded.players[0], portal = wellForPlayer(loaded, q), deadBoss = bossFor(portal);
  assert.equal(deadBoss.hp, 0); assert.deepEqual(portal.well.drops.map(a => a.type), [...CRYPT_REWARDS]);
  q.inventory[0] = null; press(loaded, q); assert.equal(portal.well.drops.length, 1);
  assert.equal(q.inventory.filter(a => a?.type === 'coffin_lid_shield').length, 1);
  const partner = loaded.addPlayer('pad:0', 'Loot partner'); Object.assign(partner, {x: portal.x + 48, y: portal.y + 24});
  enterOldWell(loaded, partner, portal); place(partner, deadBoss, 0, 8); press(loaded, partner);
  assert.equal(portal.well.drops.length, 0); assert.equal(partner.inventory.filter(a => a?.type === 'crypt_flame_sword').length, 1);
  hitCryptEnemy(loaded, portal.well, deadBoss, 999, partner); assert.equal(portal.well.drops.length, 0);
  assert.equal(wakeMausoleumBoss(loaded, partner), false); leaveOldWell(loaded, q); enterOldWell(loaded, q, portal);
  const again = restore(loaded), saved = wellForPlayer(again, again.players[0]);
  assert.equal(saved.well.drops.length, 0); assert.equal(bossFor(saved).hp, 0); assert.equal(saved.well.coffin.rewardsDropped, true);
});

test('Save and multiplayer snapshots retain exploration, partial enemy health, room coordinates and independent return anchors', () => {
  const {g, p, d} = setup(); enterOldWell(g, p, d); const e = d.well.enemies[0];
  place(p, e, -20, 0); press(g, p); hitCryptEnemy(g, d.well, e, 17, p);
  const before = JSON.stringify(d.well), anchor = structuredClone(p.wellReturn), coordinates = [p.roomX, p.roomY, p.x, p.y];
  const wire = JSON.parse(JSON.stringify(snapshot(g))); assert.equal(JSON.stringify(wire.portals.find(a => a.id === d.id).well), before);
  const loaded = restore(g), q = loaded.players[0], portal = wellForPlayer(loaded, q);
  assert.equal(JSON.stringify(portal.well), before); assert.deepEqual(q.wellReturn, anchor);
  assert.deepEqual([q.roomX, q.roomY, q.x, q.y], coordinates); assert.equal(portal.well.enemies[0].hp, e.maxHp - 17);
  assert.equal(portal.autoEnter, false); assert.equal(portal.closing, null);
});

test('Native stone/candle/coffin/undead art branches through old-well renderer and hides unexplored treasure', () => {
  const {g, p, d} = setup(); enterOldWell(g, p, d); const c = canvas();
  assert.equal(drawOldWellRoom(c, g, p), true); assert.ok(c.calls.some(a => a.text === CRYPT_TITLE));
  assert.ok(c.calls.some(a => a.color === '#fff2a0'), 'native candle flames');
  assert.ok(c.calls.some(a => a.color === '#080a14' && a.alpha > .9), 'darkness is painted');
  assert.equal(c.calls.some(a => a.color === '#63545c'), false, 'unknown coffin art is withheld');
  assert.equal(c.calls.some(a => a.text?.includes('rope')), false);
  place(p, d.well.coffin, 0, 26); press(g, p); const sealed = canvas(); drawOldWellRoom(sealed, g, p);
  assert.ok(sealed.calls.some(a => a.color === '#63545c'), 'discovered sealed coffin');
  wakeMausoleumBoss(g, p); ticks(g, 20); const rising = canvas(); drawOldWellRoom(rising, g, p);
  assert.ok(rising.calls.some(a => a.color === '#c8a369'), 'unique crown draws during rise');
  assert.ok(rising.calls.some(a => a.color === '#080a14' && a.alpha < .8), 'boss fire lights the room');
  const entrance = canvas(); drawMausoleumEntrance(entrance, d); assert.ok(entrance.calls.length > 20);
  const routed = canvas(); drawOldWell(routed, d); assert.deepEqual(routed.calls, entrance.calls);
  assert.equal(c.x, 0); assert.equal(c.y, 0); assert.equal(c.globalAlpha, 1);
});

test('Equipped lantern expands persistent-room lighting for both cameras, while backpack/outside/dead actors do not', () => {
  const {g, p, d} = setup(), q = g.addPlayer('pad:0', 'Lamp bearer');
  Object.assign(q, {x: d.x + 48, y: d.y + 24}); enterOldWell(g, p, d); enterOldWell(g, q, d);
  place(p, {x: 280, y: 120}); place(q, {x: 320, y: 120}); press(g, p); press(g, q);
  q.inventory.push({type: 'lantern', qty: 1}); assert.equal(mausoleumLights(g, d).some(a => a.radius === 150), false);
  q.equipment.hand2 = 'lantern'; assert.ok(mausoleumLights(g, d).some(a => a.radius === 150 && a.x === q.roomX));
  const lit = canvas(); drawOldWellRoom(lit, g, p); q.equipment.hand2 = null;
  const dark = canvas(); drawOldWellRoom(dark, g, p);
  const sum = c => c.calls.filter(a => a.color === '#080a14' && a.w === 8).reduce((n, a) => n + a.alpha, 0);
  assert.ok(sum(lit) < sum(dark) - 5, 'equipped co-op light reduces darkness in the other camera');
  q.equipment.hand2 = 'lantern'; q.hp = 0; assert.equal(mausoleumLights(g, d).some(a => a.radius === 150), false);
  q.hp = 100; q.room = null; assert.equal(mausoleumLights(g, d).some(a => a.radius === 150), false);
});

test('Generated mausoleum approaches and successful returns are outside the physical building footprint', () => {
  for (const seed of [1, 738, 9071]) {
    const {g, p, d} = setup(seed); assert.equal(graveyardBlocked(g, p.x, p.y, 10), false);
    assert.ok(enterOldWell(g, p, d)); assert.ok(leaveOldWell(g, p));
    assert.equal(graveyardBlocked(g, p.x, p.y, 10), false);
    assert.equal(g.blocked(p.x, p.y, 10, false, false, false, 0), false);
  }
});
