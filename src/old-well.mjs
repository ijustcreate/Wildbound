import {OLD_WELL_EVENT} from './definitions.mjs';
import {ITEMS, give, take, stat, itemKind} from './items.mjs';
import {waterAt} from './environment.mjs';
import {graveyardBlocked} from './graveyard-world.mjs';
import {ignite} from './hazards.mjs';
import {createRoomHealingBolt, spellHealingTargets, spellHealingPoint, hitHealingBolt} from './healing-magic.mjs';
import {drawMagicBolt} from './magic-bolt-render.mjs';
import {finishMagicBolt} from './magic-bolt-effects.mjs';
import {drawRoomSpellEffects} from './room-spell-effects.mjs';
import {CRYPT_TITLE, generateMausoleumCrypt, cryptEnemyCanBeHit, hitCryptEnemy,
  wakeMausoleumBoss, tickMausoleumCrypt, drawMausoleumRoom, drawMausoleumEntrance} from './mausoleum-crypt.mjs';

export {OLD_WELL_EVENT};
export const WELL_TITLE = 'The bottom of the well';
export const WELL_TILE = 16;
export const WELL_VIEW = {width: 320, height: 240, top: 26, bottom: 22};
const wet = new Set(['water', 'shallow', 'floodbridge', 'mud', 'quicksand']);
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const roomPoint = p => ({x: p.roomX, y: p.roomY});
const tileIndex = (s, x, y) => y * s.width + x;
// Restore creates new player objects. Each arrival/load must observe a release
// before accepting an exit edge, even though session resets previousInput.
const arrivalGuarded = new WeakSet();
const hash = (seed, x, y) => {
  let n = (seed | 0) ^ Math.imul(x + 19, 374761393) ^ Math.imul(y + 37, 668265263);
  n = Math.imul(n ^ n >>> 13, 1274126177);
  return (n ^ n >>> 16) >>> 0;
};

// Call after legacy/authored event packs are loaded as well as at startup.
export function appendOldWellEvent(events) {
  const index = events.findIndex(e => e.kind === OLD_WELL_EVENT.kind);
  if (index >= 0) return index;
  events.push(structuredClone(OLD_WELL_EVENT));
  return events.length - 1;
}

/** Plain JSON room state, carried by the same portal snapshots as the temple. */
export function generateWellTunnels(seed = 0) {
  const s = {version: 1, seed, width: 40, height: 28, tile: WELL_TILE,
    tiles: Array(40 * 28).fill(0), explored: [], enemies: [], bolts: [], drops: [],
    rooms: [
      {name: 'THE SHAFT', x: 3, y: 3, w: 9, h: 7},
      {name: 'ROOT GALLERY', x: 17, y: 3, w: 8, h: 7},
      {name: 'BAT ROOST', x: 29, y: 3, w: 8, h: 8},
      {name: 'CROSSROADS', x: 15, y: 16, w: 9, h: 7},
      {name: 'SILK HOLLOW', x: 3, y: 18, w: 8, h: 7},
      {name: 'BURIED VAULT', x: 29, y: 19, w: 8, h: 6},
    ]};
  const carve = (x, y, w, h) => {
    for (let ty = y; ty < y + h; ty++) for (let tx = x; tx < x + w; tx++)
      if (tx > 0 && ty > 0 && tx < s.width - 1 && ty < s.height - 1)
        s.tiles[tileIndex(s, tx, ty)] = 1;
  };
  for (const r of s.rooms) carve(r.x, r.y, r.w, r.h);
  const center = r => ({x: r.x + Math.floor(r.w / 2), y: r.y + Math.floor(r.h / 2)});
  s.connections = [[0, 1], [1, 2], [1, 3], [0, 4], [4, 3], [3, 5], [2, 5]];
  for (const [a, b] of s.connections) {
    const from = center(s.rooms[a]), to = center(s.rooms[b]);
    // Three-tile passages leave room for co-op and collision at bends.
    carve(Math.min(from.x, to.x) - 1, from.y - 1, Math.abs(to.x - from.x) + 3, 3);
    carve(to.x - 1, Math.min(from.y, to.y) - 1, 3, Math.abs(to.y - from.y) + 3);
  }
  // A seeded side pocket adds a small optional exploration branch.
  carve(11, 11 + hash(seed, 1, 1) % 2, 5, 3);
  carve(8, 11, 5, 3);
  const point = n => {
    const p = center(s.rooms[n]); return {x: p.x * WELL_TILE + 8, y: p.y * WELL_TILE + 8};
  };
  s.exit = point(0);
  s.chest = {...point(5), opened: false,
    items: [{type: 'magic_essence', qty: 6}, {type: 'relic_dust', qty: 12}, {type: 'potion', qty: 2}]};
  for (const [room, kind, ox, oy] of [[1, 'spider', 12, 0], [4, 'spider', -16, 8],
    [2, 'bat', -16, 0], [2, 'bat', 20, 18], [5, 'bat', -20, -16]]) {
    const p = point(room), hp = kind === 'bat' ? 24 : 48;
    s.enemies.push({id: 'well-creature-' + s.enemies.length, kind, x: p.x + ox, y: p.y + oy,
      hp, maxHp: hp, speed: kind === 'bat' ? 55 : 31, damage: kind === 'bat' ? 5 : 8,
      state: 'idle', cooldown: 0, attack: 0, step: 0, moving: false, faceX: 0, faceY: 1});
  }
  revealWell(s, s.exit.x, s.exit.y);
  return s;
}

export function wellTunnelBlocked(s, x, y, radius = 6) {
  if (!s || !Number.isFinite(x + y)) return true;
  for (const [dx, dy] of [[-radius, -radius], [radius, -radius], [-radius, radius], [radius, radius], [0, 0]]) {
    const tx = Math.floor((x + dx) / WELL_TILE), ty = Math.floor((y + dy) / WELL_TILE);
    if (tx < 0 || ty < 0 || tx >= s.width || ty >= s.height || !s.tiles[tileIndex(s, tx, ty)]) return true;
  }
  return false;
}
function moveInTunnels(s, a, dx, dy, radius = 6) {
  const start = {x: a.x, y: a.y};
  const steps = Math.max(1, Math.ceil(Math.hypot(dx, dy) / 4));
  for (let n = 0; n < steps; n++) {
    if (!wellTunnelBlocked(s, a.x + dx / steps, a.y, radius)) a.x += dx / steps;
    if (!wellTunnelBlocked(s, a.x, a.y + dy / steps, radius)) a.y += dy / steps;
  }
  return distance(a, start);
}
function tunnelSight(s, a, b) {
  const steps = Math.max(1, Math.ceil(distance(a, b) / 5));
  for (let n = 1; n <= steps; n++)
    if (wellTunnelBlocked(s, a.x + (b.x - a.x) * n / steps, a.y + (b.y - a.y) * n / steps, 0)) return false;
  return true;
}
function revealWell(s, x, y) {
  const known = new Set(s.explored), source = {x, y};
  for (let ty = Math.floor(y / WELL_TILE) - 6; ty <= Math.floor(y / WELL_TILE) + 6; ty++)
    for (let tx = Math.floor(x / WELL_TILE) - 6; tx <= Math.floor(x / WELL_TILE) + 6; tx++) {
      if (tx < 0 || ty < 0 || tx >= s.width || ty >= s.height) continue;
      const dest = {x: tx * WELL_TILE + 8, y: ty * WELL_TILE + 8};
      if (distance(source, dest) < 104 && tunnelSight(s, source, dest)) known.add(tileIndex(s, tx, ty));
    }
  // Visible floor edges expose their stone wall faces too.
  for (const index of [...known]) if (s.tiles[index]) {
    const tx = index % s.width, ty = Math.floor(index / s.width);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]])
      if (tx + dx >= 0 && ty + dy >= 0 && tx + dx < s.width && ty + dy < s.height)
        known.add(tileIndex(s, tx + dx, ty + dy));
  }
  s.explored = [...known];
}
function wellArrival(s) {
  // Retain the existing +56 safe-arrival preference, outside the exit radius.
  const candidates = [s.arrival, {x: s.exit.x, y: s.exit.y + 56},
    {x: s.exit.x + 56, y: s.exit.y}, {x: s.exit.x - 56, y: s.exit.y}].filter(Boolean);
  for (let radius = 48; radius <= 96; radius += 16) for (let n = 0; n < 8; n++)
    candidates.push({x: s.exit.x + Math.cos(n * Math.PI / 4) * radius,
      y: s.exit.y + Math.sin(n * Math.PI / 4) * radius});
  return candidates.find(a => !wellTunnelBlocked(s, a.x, a.y) && distance(a, s.exit) >= 45) ||
    {x: s.exit.x, y: s.exit.y + 20};
}

export const wellForPlayer = (g, p) => (g.portals || []).find(d => d.oldWell && d.id === p.room) || null;
export function oldWellBlocked(g, x, y, radius = 8, from = null) {
  // The rope landing is outside this solid stone rim.
  return (g.portals || []).some(d => d.oldWell && !d.mausoleum && d !== from && Math.hypot(x - d.x, y - d.y) < 25 + radius);
}
function surfaceClear(g, x, y, radius = 10, ignore = null) {
  const ground = waterAt(g, x, y);
  return Number.isFinite(x + y) && (g.mapMode === 'boundless' ||
    x > radius && y > radius && x < 1600 - radius && y < 1600 - radius) &&
    (!wet.has(ground) || ignore?.mausoleum && ground === 'mud') &&
    !(ignore?.mausoleum && graveyardBlocked(g, x, y, radius)) &&
    !g.blocked(x, y, radius, false, false, false, 0, 0, false, ignore);
}
export function validWellSpawn(g, point) {
  if (!point || !surfaceClear(g, point.x, point.y, 38) || oldWellBlocked(g, point.x, point.y, 60)) return false;
  if (g.generatedEnvironment === 'house' && (g.house?.floors || []).some(r =>
    point.x > r.x - 50 && point.y > r.y - 50 && point.x < r.x + r.w + 50 && point.y < r.y + r.h + 50)) return false;
  // Check the whole visible rim, approach and rope landing, not only its center.
  for (const dx of [-30, 0, 30]) for (const dy of [-30, 0, 30])
    if (!surfaceClear(g, point.x + dx, point.y + dy, 8)) return false;
  if ((g.portals || []).some(d => Math.hypot(point.x - d.x, point.y - d.y) < 105)) return false;
  return surfaceClear(g, point.x, point.y + 50, 10);
}
export function spawnOldWell(g, preferred = null) {
  if (!OLD_WELL_EVENT.environments.includes(g.generatedEnvironment)) return null;
  g.portals ||= [];
  const existing = g.portals.find(d => d.oldWell && !d.mausoleum);
  if (existing) return existing;
  let spot = preferred && validWellSpawn(g, preferred) ? preferred : null;
  const focus = preferred || g.players.find(p => p.hp > 0 && !p.room) || {x: 800, y: 960};
  const candidates = [];
  const minX = g.mapMode === 'boundless' ? Math.floor(focus.x / 32) * 32 + 16 - 512 : 80;
  const minY = g.mapMode === 'boundless' ? Math.floor(focus.y / 32) * 32 + 16 - 512 : 80;
  const maxX = g.mapMode === 'boundless' ? minX + 1024 : 1520;
  const maxY = g.mapMode === 'boundless' ? minY + 1024 : 1520;
  for (let y = minY; y < maxY; y += 32) for (let x = minX; x < maxX; x += 32) {
    // House wells belong to the outdoor courtyard/grounds.
    if (g.generatedEnvironment === 'house' && (g.house?.floors || []).some(r =>
      x > r.x - 50 && y > r.y - 50 && x < r.x + r.w + 50 && y < r.y + r.h + 50)) continue;
    candidates.push({x, y});
  }
  candidates.sort((a, b) => Math.abs(distance(a, focus) - 170) - Math.abs(distance(b, focus) - 170));
  if (!spot) spot = candidates.find(p => validWellSpawn(g, p));
  if (!spot) {g.message?.('There is no clear ground for the old well.'); return null;}
  const id = 'old-well-' + g.nextId++;
  const d = {id, oldWell: true, persistent: true, autoEnter: false, owner: null,
    closing: null, entryReady: [], x: spot.x, y: spot.y, sourceEnvironment: g.generatedEnvironment,
    well: generateWellTunnels(hash(g.seed, spot.x, spot.y))};
  g.portals.push(d);
  g.reveal = {x: d.x, y: d.y, life: 3};
  g.message?.('The old well — investigate the rope and bucket.');
  g.persist?.();
  return d;
}
/** Call after restore, or before adventure updates. Never refills an opened chest. */
export function ensureOldWells(g) {
  for (const d of (g.portals || []).filter(d => d.oldWell)) {
    d.closing = null; d.autoEnter = false; d.persistent = true; d.entryReady ||= [];
    d.well ||= (d.mausoleum ? generateMausoleumCrypt : generateWellTunnels)(hash(g.seed, d.x, d.y));
    d.well.bolts ||= []; d.well.drops ||= []; d.well.explored ||= [];
    if (!d.well.explored.length) revealWell(d.well, d.well.exit.x, d.well.exit.y);
    if (d.mausoleum) d.well.hazards ||= [];
    for (const p of g.players.filter(p => p.room === d.id)) {
      p.wellReturn ||= {portalId: d.id, x: p.x, y: p.y, environment: d.sourceEnvironment};
      if (!arrivalGuarded.has(p)) {p.wellExitArmed = false; arrivalGuarded.add(p);}
      if (wellTunnelBlocked(d.well, p.roomX, p.roomY)) {
        const entry = wellArrival(d.well);
        Object.assign(p, {roomX: entry.x, roomY: entry.y, wellExitArmed: false});
      }
    }
  }
}
export function enterOldWell(g, p, d) {
  const reach=d?.mausoleum?64:74;
  if (!d?.oldWell || !g.portals.includes(d) || p.room || p.ui || p.hp <= 0 || distance(p, d) > reach) return false;
  ensureOldWells(g);
  p.wellReturn = {portalId: d.id, x: p.x, y: p.y, environment: g.generatedEnvironment};
  const entry = wellArrival(d.well);
  p.room = d.id; p.roomX = entry.x; p.roomY = entry.y;p.wellExitArmed=false;
  arrivalGuarded.add(p); revealWell(d.well, entry.x, entry.y);
  p.roomMoving = false; p.roomStep = 0; p.charge = 0; p.ui = null;
  p.interactTime = 0; p.interactUsed = true; p.consumeInput = true;
  p.wellAttackCooldown = 0;
  for (const pet of [p.hunterPet, p.ritualPet].filter(a => a?.spiritGhost))
    Object.assign(pet, {room: d.id, roomX: p.roomX + 12, roomY: p.roomY + 8});
  p.previousInput = {...p.previousInput, interact: true};
  if (d.mausoleum) p.previousInput.use = true;
  g.message?.(d.mausoleum ? CRYPT_TITLE + '. Follow the candles; the entrance stairs lead home.' :
    WELL_TITLE + '. Follow the tunnels; the rope leads home.');
  g.onSound?.('doorOpen', p); g.persist?.();
  return true;
}
export function interactOldWell(g, p) {
  if (p.room || p.ui || p.hp <= 0) return false;
  const d = (g.portals || []).filter(d => d.oldWell && distance(p, d) <= (d.mausoleum?64:74))
    .sort((a, b) => distance(p, a) - distance(p, b))[0];
  return !!d && enterOldWell(g, p, d);
}
export function leaveOldWell(g, p) {
  const d = wellForPlayer(g, p); if (!d) return false;
  const anchor = p.wellReturn?.portalId === d.id ? p.wellReturn : {x: d.x, y: d.y + 50};
  const candidates = [anchor, {x: d.x, y: d.y + 50}];
  for (let radius = 48; radius <= 112; radius += 16) for (let n = 0; n < 12; n++)
    candidates.push({x: d.x + Math.cos(n * Math.PI / 6) * radius, y: d.y + Math.sin(n * Math.PI / 6) * radius});
  const spot = candidates.find(a => surfaceClear(g, a.x, a.y, 10, d) &&
    Math.hypot(a.x - d.x, a.y - d.y) >= 36 && !oldWellBlocked(g, a.x, a.y, 10, d));
  if (!spot) {g.message?.(d.mausoleum ? 'The mausoleum stairs are obstructed above.' : 'The rope landing is obstructed. Clear the ground above before climbing.'); return false;}
  p.room = null; p.ui = null; p.x = spot.x; p.y = spot.y;
  p.roomMoving = false; p.charge = 0; p.consumeInput = true;
  p.interactTime = 0; p.interactUsed = true; p.invuln = Math.max(p.invuln || 0, 1.2);
  p.previousInput = {...p.previousInput, interact: true};
  if (d.mausoleum) p.previousInput.use = true;
  delete p.wellReturn; delete p.wellAttackCooldown;delete p.wellExitArmed;
  arrivalGuarded.delete(p);
  d.entryReady = d.entryReady.filter(id => id !== p.id); d.closing = null;
  for (const pet of [p.hunterPet, p.ritualPet].filter(a => a?.spiritGhost))
    Object.assign(pet, {room: null, x: p.x, y: p.y});
  g.message?.('You climb back to the ' + (d.mausoleum ? 'graveyard.' : d.sourceEnvironment === 'house' ? 'house grounds.' : 'forest.'));
  g.onSound?.('doorClose', p); g.persist?.();
  return true;
}
export function lootOldWellChest(g, p) {
  const d = wellForPlayer(g, p);
  if (!d || p.hp <= 0 || distance(roomPoint(p), d.well.chest) > 38) return false;
  const chest = d.well.chest; chest.opened = true;
  g.openInventory(p, 'old-well');
  Object.assign(p.ui, {panel: 'chest', loot: true, index: Math.max(0, chest.items.findIndex(Boolean))});
  g.message?.(chest.items.some(Boolean) ? (d.mausoleum ? 'The lantern treasure chest opened.' : 'The old well treasure chest opened.') : 'The chest is empty.');
  g.persist?.(); return true;
}

function hitWellEnemy(g, s, e, damage, p) {
  if (s.theme === 'mausoleum') {hitCryptEnemy(g, s, e, damage, p); return;}
  if (e.hp <= 0) return;
  e.hp = Math.max(0, e.hp - damage); e.hit = .18; e.state = e.hp ? 'hunt' : 'defeated';
  if (!e.hp) {
    e.killedBy = p.id;
    s.drops.push({id: e.id + '-drop', x: e.x, y: e.y, type: e.kind === 'spider' ? 'relic_dust' : 'magic_essence', qty: 1});
    g.persist?.();
  }
  g.onSound?.('hit', p);
}
function attackInWell(g, p, s, input, charge = 0, slot = 'hand1') {
  const weapon = ITEMS[p.equipment?.[slot]];
  if (weapon?.utility) return;
  const aimed = Math.hypot(input.aimX || 0, input.aimY || 0) > .1;
  const aimX = aimed ? input.aimX || 0 : p.faceX || 0;
  const aimY = aimed ? input.aimY || 0 : p.faceY ?? 1, len = Math.hypot(aimX, aimY) || 1;
  // Support magic must never fall through to the damaging bolt/melee branch.
  // Mana, halo modifiers, cast healing and bolt strength belong to the helper.
  if (weapon?.healing) {
    p.wellAttackCooldown = .38;
    const bolt = createRoomHealingBolt(g, p, charge, slot,
      {origin: roomPoint(p), aim: {x: aimX, y: aimY}});
    if (bolt) {s.bolts.push(bolt); p.attack = .28;}
    return;
  }
  const damage = Math.max(8, weapon?.damage || 12) * (weapon?.magic ? 1 + clamp(charge / 1.2, 0, 1) * .5 : 1) + stat(p, 'damageBonus');
  p.wellAttackCooldown = .38; p.attack = .28;
  if (weapon?.ranged || weapon?.magic) {
    if ((weapon.base === 'bow' || p.equipment.hand1 === 'bow') && !take(p.inventory, 'arrow')) {
      g.message?.('You need an arrow.'); return;
    }
    if (weapon.magic) {
      const cost = weapon.manaCost || 8;
      if ((p.mana || 0) < cost) {g.message?.('Not enough mana.'); return;}
      p.mana -= cost;
    }
    s.bolts.push({x: p.roomX, y: p.roomY - 4, vx: aimX / len * 170, vy: aimY / len * 170,
      life: 1.1, damage, owner: p.id, room: p.room, slot, magic: !!weapon.magic});
  } else for (const e of s.enemies) {
    const from = roomPoint(p), dx = e.x - from.x, dy = e.y - from.y, d = Math.hypot(dx, dy);
    if (e.hp > 0 && (s.theme !== 'mausoleum' || cryptEnemyCanBeHit(e)) && d < 40 && (d < 12 || (dx * aimX + dy * aimY) / (d * len) > .1) && tunnelSight(s, from, e)) {
      hitWellEnemy(g, s, e, damage, p);
      if (s.theme === 'mausoleum' && e.hp > 0 && weapon?.meleeBurn) {
        ignite(e, weapon.meleeBurn.duration, weapon.meleeBurn.damage); e.burnOwner = p.id;
        g.persist?.();
      }
    }
  }
  g.onSound?.('swing', p);
}
export function oldWellRoomStep(g, p, input, dt) {
  const d = wellForPlayer(g, p); if (!d) return false;
  if (p.hp <= 0) {leaveOldWell(g, p); return true;}
  if (p.ui) return true;
  const s = d.well, edge = key => input[key] && !p.previousInput?.[key];
  if(!input.interact && (!d.mausoleum || !input.use))p.wellExitArmed=true;
  dt = clamp(Number(dt) || 0, 0, .2);
  p.wellAttackCooldown = Math.max(0, (p.wellAttackCooldown || 0) - dt);
  const a = roomPoint(p), ix = clamp(input.x || 0, -1, 1), iy = clamp(input.y || 0, -1, 1), norm = Math.max(1, Math.hypot(ix, iy));
  const moved = moveInTunnels(s, a, ix / norm * 78 * dt, iy / norm * 78 * dt);
  p.roomX = a.x; p.roomY = a.y; p.roomMoving = moved > 0; p.roomStep = (p.roomStep || 0) + moved * .13;
  if (moved) {p.faceX = ix / norm; p.faceY = iy / norm;}
  p.blocking = !!input.block && itemKind(p.equipment?.hand2) === 'shield';
  revealWell(s, p.roomX, p.roomY);
  // World Attack casts every equipped magic hand on release. Offhand is an
  // inventory/equip action, not a second combat button; use the same routing.
  const magicSlots = ['hand1', 'hand2'].filter(slot => ITEMS[p.equipment?.[slot]]?.magic);
  if (magicSlots.length) {
    if (input.attack) p.charge = Math.min(1.2, (p.charge || 0) + dt);
    else if (p.previousInput?.attack && p.charge > 0) {
      if (!p.wellAttackCooldown) for (const slot of magicSlots) attackInWell(g, p, s, input, p.charge, slot);
      p.charge = 0;
    }
  } else if (edge('attack') && !p.wellAttackCooldown) attackInWell(g, p, s, input);
  if (edge('potion')) g.usePotion?.(p);
  if (edge('interact') || d.mausoleum && edge('use')) {
    if (p.wellExitArmed!==false&&distance(a, s.exit) < 36) {leaveOldWell(g, p); return true;}
    if (distance(a, s.chest) < 38) lootOldWellChest(g, p);
    else if (d.mausoleum) wakeMausoleumBoss(g, p, d);
  }
  for (const drop of [...s.drops]) if (distance(a, drop) < 20 && give(p.inventory, drop.type, drop.qty)) {
    s.drops.splice(s.drops.indexOf(drop), 1); g.persist?.();
  }
  for (const pet of [p.hunterPet, p.ritualPet].filter(a => a?.spiritGhost))
    Object.assign(pet, {room: d.id, roomX: p.roomX + 12, roomY: p.roomY + 8});
  return true;
}
function tunnelWaypoint(s, from, to) {
  if (tunnelSight(s, from, to)) return to;
  const start = tileIndex(s, Math.floor(from.x / WELL_TILE), Math.floor(from.y / WELL_TILE));
  const goal = tileIndex(s, Math.floor(to.x / WELL_TILE), Math.floor(to.y / WELL_TILE));
  const queue = [goal], previous = new Map([[goal, null]]);
  for (let i = 0; i < queue.length && !previous.has(start); i++) {
    const n = queue[i], x = n % s.width, y = Math.floor(n / s.width);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy, next = tileIndex(s, nx, ny);
      if (nx < 0 || ny < 0 || nx >= s.width || ny >= s.height || !s.tiles[next] || previous.has(next)) continue;
      previous.set(next, n); queue.push(next);
    }
  }
  const next = previous.get(start);
  return next == null ? from : {x: next % s.width * WELL_TILE + 8, y: Math.floor(next / s.width) * WELL_TILE + 8};
}
/** One tick per game frame, independent of how many players have a room panel. */
export function tickOldWells(g, dt) {
  ensureOldWells(g); dt = clamp(Number(dt) || 0, 0, .2);
  for (const d of (g.portals || []).filter(d => d.oldWell)) {
    for (const p of g.players.filter(p => p.room === d.id && p.hp <= 0)) leaveOldWell(g, p);
    const occupants = g.players.filter(p => p.room === d.id && p.hp > 0);
    if (!occupants.length) continue;
    const s = d.well;
    for (const b of s.bolts) {
      if (b.healing) b.damage = 0;
      b.life -= dt; b.age = (b.age || 0) + dt;
      const speed = Math.hypot(b.vx, b.vy);
      if (!Number.isFinite(speed) || speed <= 0) {b.life = 0; continue;}
      b.remaining ??= speed * Math.max(0, b.life + dt);
      const steps = Math.max(1, Math.ceil(speed * dt / 4));
      for (let n = 0; n < steps && b.life > 0; n++) {
        const move = Math.min(speed * dt / steps, b.remaining);
        b.x += b.vx / speed * move; b.y += b.vy / speed * move; b.remaining -= move;
        if (wellTunnelBlocked(s, b.x, b.y, b.healing ? (b.size || 6) / 2 : 1)) {
          b.life = 0; if (b.healing) finishMagicBolt(g, b, true); break;
        }
        if (b.healing) {
          const target = spellHealingTargets(g, b).find(a => a.room === d.id &&
            distance(spellHealingPoint(a), b) < 16 + (b.size || 6) / 2);
          if (target && hitHealingBolt(g, b, target)) {b.life = 0; finishMagicBolt(g, b, true);}
          if (b.remaining <= 0) b.life = 0;
          continue;
        }
        const e = s.enemies.find(e => e.hp > 0 && (s.theme !== 'mausoleum' || cryptEnemyCanBeHit(e)) && distance(e, b) < 13);
        if (e) {const p = g.players.find(p => p.id === b.owner); if (p) hitWellEnemy(g, s, e, b.damage, p); b.life = 0;}
        if (b.remaining <= 0) b.life = 0;
      }
      if (b.healing && b.life <= 0) finishMagicBolt(g, b, false);
    }
    s.bolts = s.bolts.filter(b => b.life > 0);
    if (d.mausoleum) {
      tickMausoleumCrypt(g, d, occupants, dt,
        {move: moveInTunnels, sight: tunnelSight, waypoint: tunnelWaypoint, blocked: wellTunnelBlocked, leave: leaveOldWell});
      continue;
    }
    for (const e of s.enemies) {
      e.hit = Math.max(0, (e.hit || 0) - dt); e.attack = Math.max(0, (e.attack || 0) - dt);
      e.cooldown = Math.max(0, e.cooldown - dt); e.moving = false;
      if (e.hp <= 0) continue;
      const p = occupants.filter(p => p.hp > 0 && p.room === d.id && distance(roomPoint(p), s.exit) > 52)
        .sort((a, b) => distance(roomPoint(a), e) - distance(roomPoint(b), e))[0];
      if (!p || distance(roomPoint(p), e) > 150) {e.state = 'idle'; continue;}
      const target = roomPoint(p), goal = tunnelWaypoint(s, e, target), len = distance(e, goal) || 1;
      e.faceX = (goal.x - e.x) / len; e.faceY = (goal.y - e.y) / len;
      if (distance(e, target) > 17) {
        const moved = moveInTunnels(s, e, e.faceX * Math.min(len, e.speed * dt), e.faceY * Math.min(len, e.speed * dt), 5);
        e.moving = moved > 0; e.step += moved * .13;
      }
      if (distance(e, target) < 23 && e.cooldown <= 0 && tunnelSight(s, e, target)) {
        if (e.state !== 'windup') {e.state = 'windup'; e.attack = .45;}
        else if (e.attack <= 0) {
          e.cooldown = 1.3; e.state = 'hunt';
          if (!(p.invuln > 0) && !p.invincible) {
            const damage = g.difficulty === 'gentle' ? 1 : Math.max(1, e.damage - stat(p, 'armor'));
            p.hp = Math.max(0, p.hp - (p.blocking ? Math.ceil(damage / 3) : damage));
            p.invuln = .7; p.hit = .2; g.onSound?.('hit', p);
          }
          if (p.hp <= 0) leaveOldWell(g, p);
        }
      } else if (e.state !== 'windup') e.state = 'hunt';
    }
  }
}

// Native pixel art: every rock, light ring, plank and rope is drawn on canvas.
function rect(c, x, y, w, h, color) {c.fillStyle = color; c.fillRect(Math.round(x), Math.round(y), w, h);}
function pixelDisc(c, x, y, rx, ry, color) {
  for (let row = -ry; row <= ry; row += 2) {
    const half = Math.floor(rx * Math.sqrt(Math.max(0, 1 - row * row / (ry * ry))));
    rect(c, x - half, y + row, half * 2, 2, color);
  }
}
function bucket(c, x, y) {
  rect(c, x - 5, y - 9, 10, 10, '#33271d'); rect(c, x - 4, y - 8, 8, 7, '#9d7650');
  rect(c, x - 5, y - 8, 10, 2, '#c4ad7e'); rect(c, x - 5, y - 2, 10, 2, '#746957');
  rect(c, x - 3, y - 12, 6, 1, '#c9b790'); rect(c, x - 4, y - 11, 1, 3, '#c9b790');
  rect(c, x + 3, y - 11, 1, 3, '#c9b790');
}
export function drawOldWell(c, d, time = 0) {
  if (d.mausoleum) {drawMausoleumEntrance(c, d, time); return;}
  c.save(); c.translate(Math.round(d.x), Math.round(d.y)); c.imageSmoothingEnabled = false;
  pixelDisc(c, 0, 4, 34, 17, '#1a211c');
  pixelDisc(c, 0, -2, 29, 22, '#50534a'); pixelDisc(c, 0, -10, 29, 16, '#9c9b7e');
  pixelDisc(c, 0, -10, 21, 11, '#272e28'); pixelDisc(c, 0, -8, 16, 7, '#101b1b');
  for (let x = -24; x <= 24; x += 12) {rect(c, x, 1, 1, 13, '#353d35'); rect(c, x + 2, 2, 7, 2, '#757d62');}
  rect(c, -27, -51, 5, 49, '#453826'); rect(c, -25, -49, 2, 45, '#9d8256');
  rect(c, 22, -51, 5, 49, '#453826'); rect(c, 23, -49, 2, 45, '#9d8256');
  rect(c, -30, -54, 60, 7, '#57412d'); rect(c, -29, -54, 57, 2, '#bd9861');
  rect(c, -6, -48, 13, 8, '#765634'); rect(c, -4, -48, 2, 8, '#d2b47a');
  const sway = Math.round(Math.sin(time * .8) * 1);
  for (let y = -40; y < -9; y += 3) rect(c, sway, y, 2, 3, y % 2 ? '#ad8c54' : '#e0c38a');
  bucket(c, 35, 12);
  rect(c, -23, 5, 8, 3, '#637c47'); rect(c, 15, 11, 7, 3, '#637c47');
  c.restore();
}
export function drawOldWells(c, g) {
  for (const d of (g.portals || []).filter(d => d.oldWell)) {
    drawOldWell(c, d, g.time);
    if (g.players.some(p => !p.room && p.hp > 0 && distance(p, d) <= 74 && !p.ui)) {
      c.save(); c.fillStyle = '#ffe7a9'; c.font = 'bold 12px sans-serif'; c.textAlign = 'center';
      c.fillText(d.mausoleum ? 'E / Y · ENTER MAUSOLEUM' : 'E / Y · INVESTIGATE OLD WELL', d.x, d.y - 67); c.restore();
    }
  }
}
function shaft(c, exit, time) {
  pixelDisc(c, exit.x, exit.y, 47, 38, '#413e2d');
  pixelDisc(c, exit.x, exit.y, 39, 33, '#686648');
  pixelDisc(c, exit.x, exit.y, 32, 28, '#999472');
  pixelDisc(c, exit.x, exit.y, 24, 24, '#d1c99a');
  pixelDisc(c, exit.x, exit.y, 19, 19, '#eee4b7');
  // Round patch of daylight, with falling dust, rope and the lowered bucket.
  for (let y = -80; y < 14; y += 3) {
    rect(c, exit.x + 5, exit.y + y, 2, 3, y % 2 ? '#7e653c' : '#b79b63');
    if (y % 9 === 0) rect(c, exit.x + 4, exit.y + y, 4, 1, '#e1bd7d');
  }
  bucket(c, exit.x + 6, exit.y + 22);
  for (let n = 0; n < 9; n++) {
    const x = exit.x - 22 + hash(n, 1, 2) % 44, y = exit.y - 30 + ((time * 8 + n * 7) % 58);
    rect(c, x, y, 1, 1, '#e4dba9');
  }
}
function drawCaveCreature(c, e, time) {
  c.save(); c.translate(Math.round(e.x), Math.round(e.y));
  if (e.kind === 'spider') {
    for (const side of [-1, 1]) for (let n = 0; n < 4; n++) {
      const y = -5 + n * 3, swing = e.moving ? Math.round(Math.sin(time * 10 + n * Math.PI) * 2) : 0;
      rect(c, side < 0 ? -12 : 5, y + swing, 7, 2, '#62646a');
      rect(c, side < 0 ? -13 : 11, y + 1 + swing, 2, 4, '#2d303b');
    }
    pixelDisc(c, 0, -2, 7, 6, e.hit > 0 ? '#b2a2a0' : '#202630');
    rect(c, -4, -5, 8, 5, '#43444d'); rect(c, -3, -4, 2, 1, '#db7655'); rect(c, 2, -4, 2, 1, '#db7655');
  } else {
    const flap = Math.round(Math.sin(time * 13) * 4);
    for (const side of [-1, 1]) for (let n = 0; n < 4; n++)
      rect(c, side < 0 ? -14 + n * 3 : 3 + n * 3, -10 + n * 2 + flap, 4, 6 - n, '#676078');
    rect(c, -3, -12, 6, 11, e.hit > 0 ? '#b2a2a0' : '#312d40');
    rect(c, -4, -15, 2, 5, '#b69b99'); rect(c, 2, -15, 2, 5, '#b69b99');
    rect(c, -2, -10, 1, 1, '#ecb071'); rect(c, 1, -10, 1, 1, '#ecb071');
  }
  if (e.state === 'windup') {rect(c, -9, -21, 18, 2, '#e99a64');}
  c.restore();
}
export function wellRoomCamera(p, s) {
  return {x: Math.round(clamp(p.roomX - 160, 0, s.width * WELL_TILE - 320)),
    y: Math.round(clamp(p.roomY - 96, 0, s.height * WELL_TILE - 192))};
}
export function drawOldWellRoom(c, g, p, animator = null) {
  const d = wellForPlayer(g, p); if (!d) return false;
  const s = d.well, camera = wellRoomCamera(p, s), known = new Set(s.explored);
  if (d.mausoleum) return drawMausoleumRoom(c, g, p, d, camera, animator);
  c.save(); c.imageSmoothingEnabled = false;
  rect(c, 0, 0, 320, 240, '#101218');
  c.save(); c.beginPath(); c.rect(0, 26, 320, 192); c.clip(); c.translate(-camera.x, 26 - camera.y);
  for (let ty = Math.floor(camera.y / WELL_TILE); ty <= Math.min(s.height - 1, Math.ceil((camera.y + 192) / WELL_TILE)); ty++)
    for (let tx = Math.floor(camera.x / WELL_TILE); tx <= Math.min(s.width - 1, Math.ceil((camera.x + 320) / WELL_TILE)); tx++) {
      const index = tileIndex(s, tx, ty), x = tx * WELL_TILE, y = ty * WELL_TILE, h = hash(s.seed, tx, ty);
      if (!known.has(index) && distance({x: x + 8, y: y + 8}, roomPoint(p)) > 88) continue;
      if (s.tiles[index]) {
        rect(c, x, y, 16, 16, ['#343331', '#3c3a34', '#3d3832'][h % 3]);
        rect(c, x + 2 + h % 7, y + 3, 3, 1, '#595344');
        rect(c, x + 9, y + 11, 2, 2, '#262c2b');
        if (!s.tiles[index - s.width]) {rect(c, x, y, 16, 4, '#6d6552'); rect(c, x + 2, y + 1, 11, 1, '#9b8867');}
        if (!s.tiles[index + 1]) rect(c, x + 13, y, 3, 16, '#272b2c');
      } else {
        rect(c, x, y, 16, 16, '#191c22'); rect(c, x + 1, y + 1, 13, 10, '#2c3034');
        rect(c, x + 3, y + 2, 9, 2, '#45433d'); rect(c, x + 1, y + 12, 14, 3, '#10161c');
      }
    }
  // Roots, native crystals and silk in their respective chambers.
  for (const r of s.rooms) {
    const x = r.x * 16 + 12, y = r.y * 16 + 8;
    for (let n = 0; n < 5; n++) {
      rect(c, x + n * 21, y, 2, 9 + n % 3 * 4, '#756047');
      rect(c, x + n * 21 - 3, y + 8, 4, 2, '#9a7b50');
    }
    if (r.name === 'SILK HOLLOW') {
      c.strokeStyle = '#858a91'; c.lineWidth = 1;
      for (let n = 0; n < 5; n++) {c.beginPath(); c.moveTo(x, y); c.lineTo(x + n * 7, y + 32 - n * 5); c.stroke();}
    }
    if (r.name === 'BURIED VAULT') for (let n = 0; n < 4; n++) {
      rect(c, x + n * 25, y + 7, 3, 12, '#628d95'); rect(c, x + n * 25, y + 7, 1, 7, '#b7e4d7');
    }
  }
  shaft(c, s.exit, g.time || 0);
  const ch = s.chest;
  rect(c, ch.x - 13, ch.y - 12, 26, 17, '#221f1d');
  rect(c, ch.x - 11, ch.y - 11, 22, 14, '#865b35');
  rect(c, ch.x - 12, ch.y - (ch.opened ? 22 : 13), 24, 6, '#c19456');
  rect(c, ch.x - 8, ch.y - 11, 2, 14, '#d2ba79'); rect(c, ch.x + 6, ch.y - 11, 2, 14, '#d2ba79');
  rect(c, ch.x - 2, ch.y - 6, 4, 4, '#edcf80');
  for (const drop of s.drops) rect(c, drop.x - 2, drop.y - 2, 4, 4, ITEMS[drop.type].color);
  for (const e of s.enemies.filter(e => e.hp > 0)) if (known.has(tileIndex(s, Math.floor(e.x / 16), Math.floor(e.y / 16))))
    drawCaveCreature(c, e, g.time || 0);
  for (const b of s.bolts) {
    if (b.healing) drawMagicBolt(c, b);
    else rect(c, b.x - 2, b.y - 2, b.magic ? 4 : 5, 2, b.magic ? '#b9eadd' : '#e7c47d');
  }
  for (const q of g.players.filter(q => q.room === d.id)) {
    if (animator) animator.draw(c, {...q, x: q.roomX, y: q.roomY, moving: q.roomMoving, step: q.roomStep}, g.time, 29);
    else {rect(c, q.roomX - 4, q.roomY - 14, 8, 12, q.color || '#87b8f2'); rect(c, q.roomX - 3, q.roomY - 19, 6, 6, '#e2bc88');}
    if (q.attack > 0) rect(c, q.roomX + (q.faceX || 1) * 12, q.roomY - 8 + (q.faceY || 0) * 10, 8, 2, '#edd7b0');
  }
  // Darken unseen cells last, including decorations and unrevealed treasure.
  for (let ty = 0; ty < s.height; ty++) for (let tx = 0; tx < s.width; tx++)
    if (!known.has(tileIndex(s, tx, ty))) rect(c, tx * 16, ty * 16, 16, 16, '#101218');
  drawRoomSpellEffects(c, g, d.id);
  c.restore();
  c.textAlign = 'center'; c.font = 'bold 11px sans-serif'; c.fillStyle = '#eddbb3'; c.fillText(WELL_TITLE, 160, 15);
  c.font = '9px sans-serif'; c.fillStyle = '#c7b68c';
  const prompt = distance(roomPoint(p), s.exit) < 36 ? 'E / Y · CLIMB ROPE TO RETURN' :
    distance(roomPoint(p), ch) < 38 ? 'E / Y · ' + (ch.items.some(Boolean) ? 'OPEN TREASURE CHEST' : 'EMPTY CHEST') :
    'Explore the tunnels · Attack spiders and bats';
  c.fillText(prompt, 160, 231);
  // Shared exploration, separate camera for every co-op room panel.
  for (const index of s.explored) if (s.tiles[index]) rect(c, 274 + index % s.width, 29 + Math.floor(index / s.width), 1, 1, '#8c876f');
  rect(c, 274 + Math.floor(s.exit.x / 16), 29 + Math.floor(s.exit.y / 16), 2, 2, '#f2df98');
  rect(c, 274 + Math.floor(p.roomX / 16), 29 + Math.floor(p.roomY / 16), 2, 2, p.color || '#87b8f2');
  c.restore(); return true;
}
