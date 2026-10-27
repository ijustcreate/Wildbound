import {drawItem} from './item-art.mjs';
import {blueCryptLayout} from './mausoleum-layout.mjs';
import {drawBlueCryptBase} from './mausoleum-art.mjs';
import {drawDungeonDecor} from './dungeon-decor.mjs';
import {drawRoomVillagerFollowers} from './villager-followers-render.mjs';
import {drawGhost} from './ghost-motion.mjs';
import {applyDungeonDesign} from './location-designs.mjs';
import {tickGhostTrail} from './ghost-ai.mjs';
import {ITEMS, stat, itemKind} from './items.mjs';
import {damageEnemy} from './enemy-damage.mjs';
import {drawMagicBolt} from './magic-bolt-render.mjs';
import {drawRoomSpellEffects} from './room-spell-effects.mjs';
import {paintSwordImpact} from './sword-feel.mjs';
import {drawFlyingArrow,drawArrowTrail} from './embedded-arrow.mjs';
import {merchantSites} from './traveling-merchant.mjs';
import {UNDERGROUND_VIEW} from './underground-view.mjs';
import {PLAYER_RENDER_SIZE,creatureRenderSize} from './render-settings.mjs';

export const CRYPT_TITLE = 'The mausoleum crypt';
export const CRYPT_BOSS_KIND = 'crypt_skeleton_boss';
export const CRYPT_REWARDS = Object.freeze(['coffin_lid_shield', 'crypt_flame_sword']);
const TILE = 16;
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const point = p => ({x: p.roomX, y: p.roomY});
const hash = (seed, x, y) => {
  let n = (seed | 0) ^ Math.imul(x + 19, 374761393) ^ Math.imul(y + 37, 668265263);
  n = Math.imul(n ^ n >>> 13, 1274126177);
  return (n ^ n >>> 16) >>> 0;
};

/** JSON-only state: the old-well/session/inventory code owns d.well unchanged. */
export function generateMausoleumCrypt(seed = 0,{authored=true}={}) {
  const s = {version: 1, ghostRosterVersion:1, theme: 'mausoleum', seed, width: 72, height: 48, tile: TILE,
    tiles: Array(72 * 48).fill(0), explored: [], enemies: [], bolts: [], drops: [], hazards: [],
    rooms: [
      {name: 'THE DESCENT', x: 3, y: 3, w: 10, h: 9},
      {name: 'CANDLE GALLERY', x: 20, y: 3, w: 13, h: 9},
      {name: 'OSSUARY', x: 40, y: 3, w: 12, h: 10},
      {name: 'BELL VAULT', x: 59, y: 5, w: 10, h: 12},
      {name: 'LOW CATACOMBS', x: 42, y: 23, w: 13, h: 9},
      {name: 'MOURNERS HALL', x: 22, y: 23, w: 12, h: 10},
      {name: 'LANTERN TREASURY', x: 4, y: 24, w: 10, h: 8},
      {name: 'THE LAST COFFIN', x: 24, y: 39, w: 17, h: 7},
    ], connections: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [5, 7]]};
  const carve = (x, y, w, h) => {
    for (let ty = y; ty < y + h; ty++) for (let tx = x; tx < x + w; tx++)
      if (tx > 0 && ty > 0 && tx < s.width - 1 && ty < s.height - 1) s.tiles[ty * s.width + tx] = 1;
  };
  const center = r => ({x: r.x + Math.floor(r.w / 2), y: r.y + Math.floor(r.h / 2)});
  const roomPoint = n => {
    const p = center(s.rooms[n]); return {x: p.x * TILE + 8, y: p.y * TILE + 8};
  };
  for (const r of s.rooms) carve(r.x, r.y, r.w, r.h);
  // Three tiles wide, with bends instead of a shortcut through the whole map.
  for (const [a, b] of s.connections) {
    const from = center(s.rooms[a]), to = center(s.rooms[b]);
    if (a === 3) {
      carve(from.x - 1, from.y - 1, 3, to.y - from.y + 3);
      carve(to.x - 1, to.y - 1, from.x - to.x + 3, 3);
    } else {
      carve(Math.min(from.x, to.x) - 1, from.y - 1, Math.abs(to.x - from.x) + 3, 3);
      carve(to.x - 1, Math.min(from.y, to.y) - 1, 3, Math.abs(to.y - from.y) + 3);
    }
  }
  s.exit = roomPoint(0);
  s.arrival = {x: s.exit.x, y: s.exit.y + 56};
  s.chest = {...roomPoint(6), opened: false, items: [{type: 'lantern', qty: 1}]};
  s.coffin = {...roomPoint(7), opened: false, awakened: false, defeated: false, rewardsDropped: false};
  s.candles = s.rooms.flatMap((r, n) => [
    {x: (r.x + 2) * TILE + 8, y: (r.y + 2) * TILE + 8, radius: 66, phase: hash(seed, n, 0) % 13},
    {x: (r.x + r.w - 3) * TILE + 8, y: (r.y + r.h - 2) * TILE + 8, radius: 66, phase: hash(seed, n, 1) % 13},
  ]);
  for (const [room, kind, dx, dy] of [[1, 'zombie', 28, 12], [1, 'spider', -44, -8],
    [2, 'skeleton', 28, 8], [2, 'bat', -24, 22], [3, 'bat', -20, -8],
    [3, 'spider', 30, 30], [4, 'zombie', -24, -8], [4, 'skeleton', 30, 20],
    [5, 'skeleton', 30, 24], [5, 'zombie', -28, 0], [6, 'spider', 20, 12],
    [2,'ghost',-30,-24],[5,'ghost',10,-35]]) {
    const p = roomPoint(room), hp = {ghost:76,zombie: 82, skeleton: 64, spider: 20, bat: 24}[kind];
    s.enemies.push({id: 'crypt-creature-' + s.enemies.length, kind, x: p.x + dx, y: p.y + dy,
      hp, maxHp: hp, speed: {ghost:54,zombie: 23, skeleton: 37, spider: 32, bat: 58}[kind],
      damage: {ghost:12,zombie: 13, skeleton: 11, spider: 4, bat: 5}[kind],
      state: 'idle', cooldown: 0, attack: 0, step: 0, moving: false, faceX: 0, faceY: 1});
  }
  s.enemies.push({id: 'crypt-coffin-warden', kind: CRYPT_BOSS_KIND,
    x: s.coffin.x, y: s.coffin.y, hp: 360, maxHp: 360, speed: 34, damage: 27,
    state: 'dormant', timer: 0, cooldown: 0, attack: 0, step: 0, moving: false,
    faceX: 0, faceY: 1, rise: 0, attackCount: 0, dropsGiven: false});
  blueCryptLayout(s);return authored?applyDungeonDesign(s,'mausoleum'):s;
}

/** Surface records may live in scenery or graveyard.mausoleums / mausoleums.
 * Use doorX/doorY (or door: {x,y}) for the threshold; otherwise x/rootY.
 * Marks doorOpen and door.open, so an environment renderer can reuse its art.
 * Returns one persistent oldWell portal, or null if no mausoleum exists.
 */
export function spawnMausoleumEvent(g,{test=false}={}) {
  g.portals ||= [];
  const existing = g.portals.find(d => d.mausoleum && d.oldWell);
  if (existing) return existing;
  if (!test&&g.generatedEnvironment !== 'graveyard') return null;
  const records = [...(g.scenery || []).filter(s => s.kind === 'mausoleum'),
    ...(g.mausoleums || []), ...(g.graveyard?.mausoleums || [])];
  const ids = new Set();
  const candidates = records.filter(s => {
    const key = s.id ?? s;
    if (ids.has(key)) return false;
    ids.add(key); return true;
  })
    .filter(s => !s.depleted && Number.isFinite(s.x) && Number.isFinite(s.y));
  const focus = g.players?.find(p => p.hp > 0 && !p.room) || {x: 800, y: 800};
  candidates.sort((a, b) => distance(a, focus) - distance(b, focus));
  // Debug runs also need a usable crypt entrance on maps without mausoleums.
  const building = candidates[0]||(test?merchantSites(g).sort((a,b)=>distance(a,focus)-distance(b,focus))[0]:null);
  if (!building) {g.message?.('No mausoleum can be opened here.'); return null;}
  const x = building.doorX ?? building.door?.x ?? building.x;
  const y = building.doorY ?? building.door?.y ?? building.rootY ?? building.y;
  if (!Number.isFinite(x + y)) return null;
  const id = 'mausoleum-crypt-' + g.nextId++;
  // Generated metadata and scenery have separate records for the same building.
  for (const s of records.filter(s => s === building || building.id != null && s.id === building.id)) {
    s.doorOpen = true; s.cryptPortalId = id;
    if (s.door && typeof s.door === 'object') s.door.open = true;
  }
  const d = {id, oldWell: true, mausoleum: true, persistent: true, autoEnter: false,
    owner: null, closing: null, entryReady: [], x, y, mausoleumId: building.id ?? null,
    sourceEnvironment: g.generatedEnvironment, well: generateMausoleumCrypt(hash(g.seed, x, y))};
  g.portals.push(d); g.reveal = {x, y, life: 3};
  g.message?.('A mausoleum door opens. Descend the stairs to explore the crypt.');
  g.onSound?.('doorOpen', d); g.persist?.();
  return d;
}

export function closeMausoleumEntrances(g) {
  for (const world of [g, ...Object.values(g.houseWorlds?.worlds || {})]) {
    const entrances = (world.portals || []).filter(d => d.mausoleum);
    const ids = new Set(entrances.map(d => d.id));
    world.portals = (world.portals || []).filter(d => !d.mausoleum);
    for (const record of [...(world.scenery || []), ...(world.mausoleums || []), ...(world.graveyard?.mausoleums || [])]) {
      if (!record.cryptPortalId) continue;
      delete record.cryptPortalId;
      record.doorOpen = false;
      if (record.door && typeof record.door === 'object') record.door.open = false;
    }
    if (world !== g) continue;
    for (const p of g.players || []) if (ids.has(p.room)) {
      p.room = null; p.ui = null; p.x = 800; p.y = 850;
      delete p.wellReturn; delete p.wellExitArmed;
      for (const pet of [p.hunterPet, p.ritualPet]) if (pet && ids.has(pet.room)) {
        pet.room = null; pet.x = p.x + 24; pet.y = p.y + 20;
      }
    }
  }
}

export const cryptEnemyCanBeHit = e => e.hp > 0 &&
  !(e.kind === CRYPT_BOSS_KIND && ['dormant', 'rising'].includes(e.state));

export function wakeMausoleumBoss(g, p, d = (g.portals || []).find(d => d.mausoleum && d.id === p.room)) {
  if (!d?.mausoleum || p.room !== d.id || p.hp <= 0 || p.ui || distance(point(p), d.well.coffin) >= 42) return false;
  const s = d.well, boss = s.enemies.find(e => e.kind === CRYPT_BOSS_KIND);
  if (!boss || boss.state !== 'dormant' || s.coffin.awakened || s.coffin.defeated) return false;
  s.coffin.awakened = true; s.coffin.opened = true;
  boss.state = 'rising'; boss.timer = 2; boss.rise = 0; boss.cooldown = .8;
  g.message?.('The Coffin Warden rises! Watch its blade and the bone volley.');
  g.onSound?.('doorOpen', p); g.persist?.();
  return true;
}

/** Old-well melee and bolts call this, never the world loot/drop functions. */
export function hitCryptEnemy(g, s, e, amount, p, damageType = 'physical') {
  if (!cryptEnemyCanBeHit(e) || !Number.isFinite(amount) || amount <= 0) return;
  damageEnemy(e, amount, damageType); e.hp = Math.max(0, e.hp); e.hit = .18;
  if (!e.hp) {
    e.state = 'defeated'; e.moving = false; e.killedBy = p.id;
    if (!e.dropsGiven) {
      e.dropsGiven = true;
      if (e.kind === CRYPT_BOSS_KIND) {
        s.coffin.defeated = true;
        if (!s.coffin.rewardsDropped) {
          s.coffin.rewardsDropped = true;
          for (const [n, type] of CRYPT_REWARDS.entries())
            s.drops.push({id: e.id + '-' + type, x: e.x + (n ? 12 : -12), y: e.y + 8, type, qty: 1});
        }
        s.hazards = []; g.message?.('The Coffin Warden falls. Its shield and flame sword remain.');
      } else s.drops.push({id: e.id + '-drop', x: e.x, y: e.y,
        type: ['skeleton', 'zombie'].includes(e.kind) ? 'bone_shard' : e.kind === 'spider' ? 'relic_dust' : 'magic_essence', qty: 1});
    }
  }
  // Persist partial health too: reloading never heals an injured crypt enemy.
  g.onSound?.('hit', p); g.persist?.();
}

// g.hurt intentionally rejects room occupants. Match its armor/difficulty and
// invulnerability rules here, with room coordinates for feedback and guards.
function hurtInCrypt(g, d, p, amount, source) {
  if (p.room !== d.id || p.hp <= 0 || p.invuln > 0 || p.invincible) return false;
  const dir = {x: source.x - p.roomX, y: source.y - p.roomY};
  const guarded = p.blocking && itemKind(p.equipment?.hand2) === 'shield' &&
    dir.x * (p.faceX || 0) + dir.y * (p.faceY ?? 1) > 0;
  if (guarded) amount /= 3;
  amount *= p.field?.boon === 'guardian' ? .85 : 1;
  amount *= p.field?.curse ? 1.15 : 1;
  amount = g.difficulty === 'gentle' ? 1 : Math.max(1, amount - stat(p, 'armor'));
  amount *= g.difficulty === 'adventure' ? .65 : 1;
  const before = p.hp;
  p.hp = Math.max(0, p.hp - amount); p.invuln = .75; p.hit = .2;
  if (!p.hp && p.field?.skills?.second_wind && !p.secondWindUsed) {
    p.hp = Math.min(p.maxHp, 35); p.secondWindUsed = true; p.invuln = 2;
    g.message?.(p.name + ' found a second wind!');
  }
  (g.effects ||= []).push({room: d.id, x: p.roomX, y: p.roomY - 25,
    text: '−' + Math.round(Math.min(before, amount)), color: '#ff9c86', life: .7});
  g.onSound?.('hurt', p); g.persist?.(); return true;
}

/** Internal old-well adapter. Helpers use the shared tunnel collision/pathing. */
export function upgradeMausoleumGhosts(s){
 if(s.ghostRosterVersion>=1)return false;
 s.ghostRosterVersion=1;
 if(s.coffin?.defeated||s.completed)return false;
 s.enemies ||= [];
 if(s.enemies.some(e=>e.kind==='ghost'))return false;
 for(const [n,dx,dy]of [[2,-30,-24],[5,10,-35]]){
  const r=s.rooms?.[n];if(!r)continue;
  s.enemies.push({id:'crypt-ghost-upgrade-'+n,kind:'ghost',x:(r.x+Math.floor(r.w/2))*TILE+8+dx,y:(r.y+Math.floor(r.h/2))*TILE+8+dy,hp:76,maxHp:76,speed:54,damage:12,state:'idle',cooldown:0,attack:0,step:0,moving:false,faceX:0,faceY:1});
 }
 return true;
}
export function tickMausoleumCrypt(g, d, occupants, dt, helpers) {
  upgradeMausoleumGhosts(d.well);
  const s = d.well;
  s.hazards ||= [];
  const alive = () => occupants.filter(p => p.hp > 0 && p.room === d.id);
  for (const h of s.hazards) {
    h.life -= dt; h.age = (h.age || 0) + dt;
    const steps = Math.max(1, Math.ceil(Math.hypot(h.vx, h.vy) * dt / 4));
    for (let n = 0; n < steps && h.life > 0; n++) {
      if (helpers.blocked(s, h.x + h.vx * dt / steps, h.y + h.vy * dt / steps, 2)) {h.life = 0; break;}
      const moved = helpers.move(s, h, h.vx * dt / steps, h.vy * dt / steps, 2);
      if (moved < .01 && dt > 0) {h.life = 0; break;}
      const p = alive().find(p => distance(point(p), h) < 14);
      if (p) {hurtInCrypt(g, d, p, h.damage, h); h.life = 0;}
    }
  }
  s.hazards = s.hazards.filter(h => h.life > 0);
  for (const e of s.enemies) {
    e.room=d.id;e.roomX=e.x;e.roomY=e.y;
    if(e.kind==='ghost')tickGhostTrail(e,dt);
    // World hazards tick g.enemies, not persistent underground enemies. Carry
    // shared ignite fields here, using the same hit/death/reward path.
    if (e.hp > 0 && e.burning > 0) {
      const elapsed = Math.min(dt, e.burning);
      e.burning = Math.max(0, e.burning - elapsed); e.burnTick = (e.burnTick ?? .5) - elapsed;
      while (e.burnTick <= 1e-9 && e.hp > 0) {
        e.burnTick += .5;
        const owner = g.players.find(p => p.id === e.burnOwner) || {id: e.burnOwner ?? e.killedBy ?? null};
        hitCryptEnemy(g, s, e, e.burnDamage || 3, owner, 'fire');
      }
    }
    e.hit = Math.max(0, (e.hit || 0) - dt); e.attack = Math.max(0, (e.attack || 0) - dt);
    e.cooldown = Math.max(0, (e.cooldown || 0) - dt); e.moving = false;
    if (e.hp <= 0 || e.state === 'dormant') continue;
    const boss = e.kind === CRYPT_BOSS_KIND,ghost=e.kind==='ghost';
    if(ghost){e.frozen=Math.max(0,(e.frozen||0)-dt);if(e.frozen>0){if(e.state==='windup'){e.state='hunt';e.timer=0;e.attack=0;}continue;}}
    if (e.state === 'rising') {
      e.timer = Math.max(0, e.timer - dt); e.rise = 1 - e.timer / 2;
      if (e.timer <= 0) {e.state = 'hunt'; g.persist?.();}
      continue;
    }
    const targets = alive().filter(p => distance(point(p), s.exit) > 52);
    const p = targets.sort((a, b) => distance(point(a), e) - distance(point(b), e))[0];
    if (!p || distance(point(p), e) > (boss ? 320 : 180)) {e.state = 'idle'; continue;}
    const target = point(p), separation = distance(e, target);
    if (e.state === 'windup') {
      e.timer = Math.max(0, e.timer - dt);
      if (e.timer > 0) continue;
      if (e.attackKind === 'volley') {
        const a = Math.atan2(e.aimY, e.aimX);
        for (const offset of [-.24, 0, .24]) s.hazards.push({kind: 'crypt_bone',
          x: e.x, y: e.y, vx: Math.cos(a + offset) * 126, vy: Math.sin(a + offset) * 126,
          damage: 19, life: 2.1, age: 0, room: d.id, owner: e.id});
      } else for (const q of targets) {
        const t = point(q), len = distance(e, t), facing =
          ((t.x - e.x) * e.aimX + (t.y - e.y) * e.aimY) / (len || 1);
        if (len < (boss ? 62 : ghost?60:28) && facing > (boss ? -.2 : ghost?.5:-.5) && helpers.sight(s, e, t))
          hurtInCrypt(g, d, q, e.damage, e);
      }
      e.state = 'recover'; e.timer = boss ? .75 : .45; e.attack = .3;
      e.cooldown = boss ? 1.1 : 1.2; g.onSound?.('swing', e);
      continue;
    }
    if (e.state === 'recover') {e.timer -= dt; if (e.timer <= 0) e.state = 'hunt'; continue;}
    if (e.cooldown <= 0 && helpers.sight(s, e, target) && (separation < (boss ? 57 : ghost?56:26) || boss && separation < 225)) {
      e.attackKind = boss && (separation >= 57 || e.attackCount % 2 === 1) ? 'volley' : 'sweep';
      e.attackCount = (e.attackCount || 0) + 1;
      e.aimX = (target.x - e.x) / (separation || 1); e.aimY = (target.y - e.y) / (separation || 1);
      e.faceX = e.aimX; e.faceY = e.aimY;
      e.state = 'windup'; e.timer = boss ? (e.attackKind === 'volley' ? .9 : .65) : ghost?.6:.45;
      e.attack = e.timer; continue;
    }
    const goal = helpers.waypoint(s, e, target), len = distance(e, goal) || 1;
    e.faceX = (goal.x - e.x) / len; e.faceY = (goal.y - e.y) / len;
    if (separation > 19) {
      const moved = helpers.move(s, e, e.faceX * Math.min(len, e.speed * dt), e.faceY * Math.min(len, e.speed * dt), boss ? 8 : 5);
      e.moving = moved > 0; e.step += moved * .13;
    }
    e.state = 'hunt';
  }
  for (const p of occupants) if (p.hp <= 0 && p.room === d.id) helpers.leave(g, p);
}

function rect(c, x, y, w, h, color) {
  c.fillStyle = color; c.fillRect(Math.round(x), Math.round(y), w, h);
}
function disc(c, x, y, rx, ry, color) {
  for (let row = -ry; row <= ry; row += 2) {
    const half = Math.floor(rx * Math.sqrt(Math.max(0, 1 - row * row / (ry * ry))));
    rect(c, x - half, y + row, half * 2, 2, color);
  }
}
function arch(c, x, y, w, h) {
  rect(c, x, y + 5, w, h - 5, '#181b28');
  rect(c, x + 3, y + 2, w - 6, h - 2, '#181b28'); rect(c, x + 6, y, w - 12, h, '#181b28');
  rect(c, x - 2, y + 6, 2, h - 6, '#787786'); rect(c, x + w, y + 6, 2, h - 6, '#787786');
  rect(c, x + 3, y + 1, 3, 2, '#9d9ba5'); rect(c, x + w - 6, y + 1, 3, 2, '#9d9ba5');
}
function candle(c, a, time) {
  disc(c, a.x, a.y + 1, 8, 3, '#241f2a');
  rect(c, a.x - 3, a.y - 7, 6, 8, '#c9bfa7'); rect(c, a.x - 2, a.y - 6, 2, 7, '#e8dfbb');
  const flicker = Math.round(Math.sin(time * 8 + a.phase));
  rect(c, a.x - 2 + flicker, a.y - 12, 4, 5, '#e78c4b');
  rect(c, a.x - 1 + flicker, a.y - 13, 2, 4, '#fff2a0');
}
function stairs(c, exit) {
  rect(c, exit.x - 21, exit.y - 33, 42, 49, '#1a1b29');
  for (let n = 0; n < 7; n++) {
    const y = exit.y - 27 + n * 6;
    rect(c, exit.x - 19, y, 38, 5, ['#454958', '#575b68', '#6c6f7b'][n % 3]);
    rect(c, exit.x - 18, y, 36, 1, '#aaa6ab');
  }
  rect(c, exit.x - 24, exit.y - 34, 4, 53, '#8a8794');
  rect(c, exit.x + 20, exit.y - 34, 4, 53, '#8a8794');
  rect(c, exit.x - 16, exit.y - 37, 32, 9, '#c4c1b8');
}
function coffin(c, a) {
  disc(c, a.x, a.y + 7, 26, 11, '#13141e');
  rect(c, a.x - 19, a.y - 21, 38, 35, '#777481');
  rect(c, a.x - 16, a.y - 25, 32, 40, '#96919a');
  rect(c, a.x - 12, a.y - 22, 24, 33, '#191520');
  if (a.opened) {
    rect(c, a.x + 23, a.y - 24, 11, 38, '#96919a');
    rect(c, a.x + 27, a.y - 21, 3, 30, '#b6afab');
  } else {
    rect(c, a.x - 11, a.y - 21, 22, 32, '#63545c');
    rect(c, a.x - 1, a.y - 18, 3, 24, '#bbb39a'); rect(c, a.x - 6, a.y - 11, 13, 3, '#bbb39a');
  }
  rect(c, a.x - 18, a.y + 11, 36, 3, '#b6afab');
}
function drawUndead(c, e, time) {
  const boss = e.kind === CRYPT_BOSS_KIND;
  const rise = e.state === 'rising' ? e.rise : 1;
  const bob = e.moving ? Math.round(Math.sin(e.step) * 2) : 0;
  c.save(); c.translate(Math.round(e.x), Math.round(e.y + bob + (1 - rise) * 23));
  if (e.state === 'rising') {c.beginPath(); c.rect(-23, -45, 46, 45 - (1 - rise) * 23); c.clip();}
  const bone = e.hit > 0 ? '#fff2d8' : boss ? '#c9c4b0' : '#acaeac';
  const body = e.kind === 'zombie' ? '#465c4e' : '#363342';
  disc(c, 0, 1, boss ? 15 : 10, 4, '#161621');
  for (const side of [-1, 1]) {
    const stride = e.moving ? Math.round(Math.sin(e.step + (side < 0 ? 0 : Math.PI)) * 3) : 0;
    rect(c, side < 0 ? -7 : 3, -8 + stride, 4, 10, bone);
    rect(c, side < 0 ? -9 : 2, 1 + stride, 7, 3, body);
    rect(c, side < 0 ? -12 : 8, -24, 4, 13, bone);
  }
  rect(c, -8, -26, 16, 17, body);
  if (e.kind !== 'zombie') {
    rect(c, -1, -25, 2, 17, bone);
    for (let n = 0; n < 4; n++) rect(c, -6, -24 + n * 4, 12, 2, bone);
  } else {rect(c, -6, -25, 5, 11, '#658269'); rect(c, 1, -21, 6, 5, '#796958');}
  rect(c, -7, -39, 14, 12, e.kind === 'zombie' ? '#849474' : bone);
  rect(c, -5, -36, 4, 4, '#282633'); rect(c, 2, -36, 4, 4, '#282633');
  rect(c, -3, -30, 7, 2, '#363342');
  if (boss) {
    rect(c, -9, -41, 18, 3, '#8c7452');
    for (const x of [-7, -1, 5]) rect(c, x, -45, 3, 5, '#c8a369');
    rect(c, -18, -28, 9, 22, '#766773'); rect(c, -15, -26, 2, 18, '#b5ac9c');
    rect(c, 14, -33, 4, 26, '#dca987'); rect(c, 12, -12, 8, 3, '#d2b267');
    rect(c, 14, -37 + Math.round(Math.sin(time * 10)), 3, 11, '#ef9a55');
    rect(c, -4, -35, 2, 2, '#fca86d'); rect(c, 3, -35, 2, 2, '#fca86d');
  }
  if (e.state === 'windup') {
    rect(c, -12, -49, 24, 3, '#e99069');
    rect(c, -12, -49, Math.round(24 * clamp(e.timer / (boss ? .9 : .45), 0, 1)), 1, '#ffdeac');
  }
  if (e.burning > 0) for (let n = 0; n < 5; n++) {
    const rise = (time * 12 + n * 5) % 19;
    rect(c, -7 + n * 3, -9 - rise, 2, 3, n % 2 ? '#ffb448' : '#e66c32');
  }
  c.restore();
}
function drawVermin(c, e, time) {
  c.save(); c.translate(Math.round(e.x), Math.round(e.y));
  if (e.kind === 'spider') {
    for (const side of [-1, 1]) for (let n = 0; n < 4; n++) {
      const y = -5 + n * 2 + (e.moving ? Math.round(Math.sin(time * 12 + n * 2)) : 0);
      rect(c, side < 0 ? -8 : 2, y, 6, 1, '#080911');
      rect(c, side < 0 ? -9 : 7, y + 1, 2, 2, '#080911');
    }
    disc(c, 0, -2, 4, 4, '#080911'); rect(c, -2, -4, 4, 2, '#262633');
    rect(c, -2, -5, 1, 1, '#b69b8b'); rect(c, 1, -5, 1, 1, '#b69b8b');
  } else {
    const flap = Math.round(Math.sin(time * 13) * 4);
    for (const side of [-1, 1]) for (let n = 0; n < 4; n++)
      rect(c, side < 0 ? -14 + n * 3 : 3 + n * 3, -10 + n * 2 + flap, 4, 6 - n, '#625770');
    rect(c, -3, -12, 6, 11, '#252135'); rect(c, -4, -15, 2, 5, '#948197');
    rect(c, 2, -15, 2, 5, '#948197'); rect(c, -2, -10, 1, 1, '#d79a73'); rect(c, 1, -10, 1, 1, '#d79a73');
  }
  c.restore();
}

function drawCryptBossGear(c, e, time) {
  c.save(); c.translate(Math.round(e.x), Math.round(e.y));
  const bob=Math.round(Math.sin(time*4)*1);
  // A readable crypt-warden kit: iron crown, ribbed cuirass, shoulder plates,
  // and a torn funerary mantle layered over the normal skeleton rig.
  rect(c,-12,-48+bob,24,5,'#302a35'); rect(c,-9,-53+bob,18,5,'#75604d');
  for(const x of [-8,-2,4]) rect(c,x,-58+bob,3,7,'#c39d61');
  rect(c,-16,-31,32,19,'#343b47'); rect(c,-12,-29,24,15,'#62616b');
  for(let y=-26;y<-14;y+=4) rect(c,-10,y,20,1,'#bbb08f');
  rect(c,-22,-29,7,13,'#4a4d58'); rect(c,15,-29,7,13,'#4a4d58');
  rect(c,-25,-22,5,4,'#a88454'); rect(c,20,-22,5,4,'#a88454');
  rect(c,-19,-12,8,16,'#29232f'); rect(c,11,-12,8,16,'#29232f');
  c.restore();
}

/** An equipped lantern lights both co-op cameras; backpack lanterns stay dark. */
export function mausoleumLights(g, d) {
  const lights = [{...d.well.exit, radius: 80, intensity: .9},
    ...(d.well.candles || []).map(a => ({...a, intensity: .78}))];
  for (const p of (g.players || []).filter(p => p.hp > 0 && p.room === d.id)) {
    lights.push({...point(p), radius: 35, intensity: .5});
    for (const slot of ['hand1', 'hand2']) {
      const light = ITEMS[p.equipment?.[slot]]?.lightSource;
      if (light) lights.push({...point(p), radius: Math.min(180, light.radius), intensity: light.intensity || 1});
    }
  }
  for (const e of d.well.enemies) if (e.kind === CRYPT_BOSS_KIND && e.hp > 0 && e.state !== 'dormant')
    lights.push({x: e.x, y: e.y, radius: 65, intensity: .75});
  return lights;
}

// Sparse pixel-cell light with occlusion, not a blurred full-screen gradient.
function lightAt(s, x, y, lights) {
  let value = 0;
  for (const a of lights) {
    const len = Math.hypot(x - a.x, y - a.y);
    if (len >= a.radius) continue;
    let blocked = false;
    const steps = Math.max(1, Math.ceil(len / 8));
    for (let n = 1; n < steps; n++) {
      const tx = Math.floor((a.x + (x - a.x) * n / steps) / (s.tile||TILE));
      const ty = Math.floor((a.y + (y - a.y) * n / steps) / (s.tile||TILE));
      if (!s.tiles[ty * s.width + tx]) {blocked = true; break;}
    }
    if (!blocked) value = Math.max(value, (1 - len / a.radius) * a.intensity);
  }
  return value;
}

/** Native outside doorway overlay. Environment art draws the building itself. */
export function drawMausoleumEntrance(c, d, time = 0) {
  c.save(); c.translate(Math.round(d.x), Math.round(d.y)); c.imageSmoothingEnabled = false;
  disc(c, 0, 10, 25, 9, '#20212b');
  arch(c, -15, -34, 30, 37);
  for (let n = 0; n < 4; n++) {
    rect(c, -15 - n * 2, 1 + n * 4, 30 + n * 4, 4, '#575663');
    rect(c, -14 - n * 2, 1 + n * 4, 28 + n * 4, 1, '#9c98a1');
  }
  candle(c, {x: -23, y: 0, phase: 0}, time); candle(c, {x: 23, y: 0, phase: 3}, time);
  c.restore();
}

/** Called by drawOldWellRoom; camera/exploration remain old-well compatible. */
export function drawMausoleumRoom(c, g, p, d, camera, animator = null,view=UNDERGROUND_VIEW) {
  const s = d.well, TILE=s.tile||16, known = new Set(s.explored), lights = mausoleumLights(g, d), time = g.time || 0;
  const {width:w,height:h,top,bottom,zoom=1}=view,worldW=w/zoom,worldH=(h-top-bottom)/zoom;
  const minX = Math.max(0, Math.floor(camera.x / TILE)), maxX = Math.min(s.width - 1, Math.ceil((camera.x + worldW) / TILE));
  const minY = Math.max(0, Math.floor(camera.y / TILE)), maxY = Math.min(s.height - 1, Math.ceil((camera.y + worldH) / TILE));
  const knownPoint = a => known.has(Math.floor(a.y / TILE) * s.width + Math.floor(a.x / TILE));
  c.save(); c.imageSmoothingEnabled = false; rect(c, 0, 0, w, h, '#080a14');
  c.save(); c.beginPath(); c.rect(0, top, w, h-top-bottom); c.clip(); c.translate(0,top);c.scale(zoom,zoom);c.translate(-camera.x,-camera.y);
  if(s.theme==='mausoleum'||s.visualTheme==='blue_crypt')drawBlueCryptBase(c,s,time,{minX,maxX,minY,maxY,known});else{
  for (let ty = minY; ty <= maxY; ty++) for (let tx = minX; tx <= maxX; tx++) {
    const index = ty * s.width + tx, x = tx * TILE, y = ty * TILE, h = hash(s.seed, tx, ty);
    if (!known.has(index)) continue;
    if (s.tiles[index]) {
      rect(c, x, y, TILE, TILE, ['#484653', '#41414f', '#4e4c58'][h % 3]);
      rect(c, x, y, TILE, 1, '#676471'); rect(c, x, y, 1, TILE, '#292b3b');
      rect(c, x + 9, y + 6, 4, 1, '#393647');
      if (!s.tiles[index - s.width]) {rect(c, x, y, TILE, 6, '#777382'); rect(c, x + 1, y, TILE-2, 1, '#a09ba6');}
    } else {
      rect(c, x, y, TILE, TILE, '#202231'); rect(c, x + 1, y + 1, TILE-2, TILE-6, '#50505f');
      rect(c, x + 2, y + 2, TILE-5, 2, '#807b88'); rect(c, x + 1, y + TILE-4, TILE-2, 3, '#151826');
    }
  }
  if(s.decorations)drawDungeonDecor(c,[...s.decorations,...s.candles.map(p=>({...p,role:'light'}))],g.time||0);
  else for (const r of s.rooms) {
    const y = r.y * TILE + 8;
    for (let n = 1; n < r.w - 1; n += 3) {
      const x = (r.x + n) * TILE;
      if (!knownPoint({x, y})) continue;
      arch(c, x, y - 9, 22, 23); rect(c, x + 7, y + 2, 8, 3, '#85828a');
      rect(c, x + 10, y - 4, 2, 8, '#898491');
      if (r.name === 'OSSUARY') {
        rect(c, x + 5, y + 5, 5, 4, '#b3ae9c'); rect(c, x + 7, y + 6, 1, 1, '#1c1a25');
        rect(c, x + 14, y + 5, 4, 3, '#a59e92');
      }
    }
  }
  if (knownPoint(s.exit)) stairs(c, s.exit);
  for (const a of s.candles || []) if (knownPoint(a)) {
    c.save(); c.globalAlpha = .13; disc(c, a.x, a.y, 36, 17, '#cf945c'); c.restore(); candle(c, a, time);
  }
  const ch = s.chest;
  if (knownPoint(ch)) {
    rect(c, ch.x - 13, ch.y - 12, 26, 17, '#26212e'); rect(c, ch.x - 11, ch.y - 11, 22, 14, '#726172');
    rect(c, ch.x - 12, ch.y - (ch.opened ? 22 : 13), 24, 6, '#aaa0ac');
    rect(c, ch.x - 8, ch.y - 11, 2, 14, '#bfb38f'); rect(c, ch.x + 6, ch.y - 11, 2, 14, '#bfb38f');
    rect(c, ch.x - 2, ch.y - 6, 4, 4, '#ecd291');
  }
  if (knownPoint(s.coffin)) coffin(c, s.coffin);
  for (const drop of s.drops) if (knownPoint(drop)) rect(c, drop.x - 3, drop.y - 3, 6, 6, ITEMS[drop.type]?.color || '#eac093');
  }
  const ch=s.chest;
  if(s.theme==='mausoleum')for(const drop of s.drops||[])if(knownPoint(drop)){if(c.drawImage)drawItem(c,drop.type,drop.x,drop.y,18);else rect(c,drop.x-3,drop.y-3,6,6,ITEMS[drop.type]?.color||'#eac093');}
  const actors=[...s.enemies.filter(e=>(e.hp>0||e.defeated&&(e.deathTimer||0)<3.5)&&e.state!=='dormant'&&knownPoint(e)).map(e=>({...e,cryptEnemy:true})),...g.players.filter(q=>q.room===d.id).map(q=>({...q,x:q.roomX,y:q.roomY,kind:q.kind,sprite:'player'}))].sort((a,b)=>a.y-b.y);
  for(const actor of actors){
    c.save();c.globalAlpha=.4;disc(c,actor.x,actor.y+1,8,3,'#080a14');c.restore();
    if(animator){const boss=actor.kind===CRYPT_BOSS_KIND;
      if(actor.cryptPitFall){const t=Math.min(1,actor.cryptPitFall.time/.85),scale=1-t*.85;c.save();c.globalAlpha*=1-t;c.translate(actor.x,actor.y+t*t*42);c.scale(scale,scale);animator.draw(c,{...actor,x:0,y:0,jumpHeight:0,groundHeight:0,animationAction:'jump_fall'},time,PLAYER_RENDER_SIZE);c.restore();continue;}
      animator.draw(c,{...actor,room:d.id,...(boss?{kind:'skeleton',sprite:'skeleton',equipment:{hand1:'crypt_flame_sword',hand2:'coffin_lid_shield'}}:{}),sprite:boss?'skeleton':actor.cryptEnemy?actor.kind:'player'},time,actor.cryptEnemy?creatureRenderSize(boss?'skeleton':actor.kind):PLAYER_RENDER_SIZE);
    }
  }
  const runtime=s.worldRuntime||{};
  for(const arrow of runtime.arrows||[]){drawArrowTrail(c,arrow,time);drawFlyingArrow(c,arrow,time);}
  for(const spell of runtime.spells||[])drawMagicBolt(c,spell);
  drawRoomSpellEffects(c,{effects:(runtime.effects||[]).filter(f=>!f.swordImpact).map(f=>({...f,room:d.id}))},d.id);
  for(const fx of runtime.effects||[])if(fx.swordImpact)paintSwordImpact(c,fx);
  for (const b of s.bolts) {
    if (b.healing) drawMagicBolt(c, b);
    else rect(c, b.x - 2, b.y - 2, b.magic ? 4 : 5, 2, b.magic ? '#b9eadd' : '#e7c47d');
  }
  for (const h of s.hazards || []) {rect(c, h.x - 5, h.y - 1, 10, 2, '#d8ccb7'); rect(c, h.x - 5, h.y - 2, 2, 4, '#b7adab');}
  drawRoomVillagerFollowers(c,g,d.id,animator,48);
  drawRoomSpellEffects(c, g, d.id);
  // Explored rooms remain remembered but dark. Unexplored decorations never leak.
  if(!view.editor)for (let ty = minY; ty <= maxY; ty++) for (let tx = minX; tx <= maxX; tx++) {
    const x = tx * TILE, y = ty * TILE;
    if (!known.has(ty * s.width + tx)) {rect(c, x, y, TILE, TILE, '#080a14'); continue;}
    for (let dy = 0; dy < TILE; dy += 8) for (let dx = 0; dx < TILE; dx += 8) {
      c.globalAlpha = clamp(.74 - lightAt(s, x + dx + 4, y + dy + 4, lights) * .7, .04, .74);
      rect(c, x + dx, y + dy, 8, 8, '#080a14');
    }
    c.globalAlpha = 1;
  }
  c.restore();
  c.textAlign = 'center'; c.font = 'bold 11px sans-serif'; c.fillStyle = '#d7c9cd'; c.fillText(CRYPT_TITLE, w/2, 15);
  c.font = '9px sans-serif'; c.fillStyle = '#c0b5b2';
  const prompt = distance(point(p), s.exit) < 36 ? 'USE / INTERACT · STAIRS TO GRAVEYARD' :
    distance(point(p), ch) < 38 ? 'USE / INTERACT · ' + (ch.items.some(Boolean) ? 'OPEN LANTERN CHEST' : 'EMPTY CHEST') :
    distance(point(p), s.coffin) < 42 && !s.coffin.awakened ? 'USE / INTERACT · OPEN COFFIN' :
    'Follow the catacombs · Candles and lanterns light the dark';
  c.fillText(prompt, w/2, h-9);
  const boss = s.enemies.find(e => e.kind === CRYPT_BOSS_KIND);
  if (boss && boss.hp > 0 && !['dormant'].includes(boss.state) && knownPoint(boss)) {
    rect(c, w/2-80, 18, 160, 4, '#352d3a'); rect(c, w/2-80, 18, Math.round(160 * boss.hp / boss.maxHp), 4, '#bc785e');
  }
  // Scaled minimap fits the longer crypt inside the existing 320px panel.
  for (const index of s.explored) if (s.tiles[index]===1) rect(c, w-56 + Math.floor(index % s.width * .7), top+3 + Math.floor(Math.floor(index / s.width) * .7), 1, 1, '#797482');
  rect(c, w-56 + Math.floor(p.roomX / TILE * .7), top+3 + Math.floor(p.roomY / TILE * .7), 2, 2, p.color || '#87b8f2');
  c.restore(); return true;
}
