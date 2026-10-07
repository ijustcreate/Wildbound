import { ITEMS, take } from "./items.mjs";
import {isCharmed,charmShot,playerCombatTargets} from './succubus-charm.mjs';
import {damageEnemy} from './enemy-damage.mjs';
import { equipmentAttack } from "./equipment-runtime.mjs";
import { ignite, firePatch } from "./hazards.mjs";
import { clearShot } from "./navigation.mjs";
import { propBase } from "./environment.mjs";
import { emitNoise } from "./night-cycle.mjs";

// Parent hooks: attack BEFORE default combat; tick once per simulation step;
// draw in world coordinates after actors; applyTorchHit after confirmed melee
// or harvest contact. Enemy burning is ticked by the existing hazard system.
// Hunters equip a rifle and carry cartridges in inventory just like players.
// charge is the existing hold duration in seconds (>=0.6); facing supplies aim.
// State lives on g.rifleShots and actor.rifleReload (seconds), both serializable.
export function tryEquipmentAttack(g, p, charge = 0) {
  const attack = equipmentAttack(p);
  if (!["utility", "rifle"].includes(attack.kind)) return false;
  if (!["play", "won"].includes(g.phase) || p.hp <= 0 || p.room || p.ui || p.attack > 0) return true;
  if (attack.kind === "utility") return true;
  if (p.rifleReload > 0) return true;
  const def = ITEMS[attack.type], cfg = def.shot;
  if (!Number.isFinite(charge) || charge < cfg.aimTime) return true;
  const length = Math.hypot(p.faceX, p.faceY);
  if (!Number.isFinite(length) || length === 0) return true;
  if (!take(p.inventory || [], def.ammo, 1)) {
    if (g.players?.includes(p)) g.message?.("Rifle needs a cartridge.");
    return true;
  }
  const x = p.faceX / length, y = p.faceY / length;
  p.rifleReload = cfg.cooldown;
  p.attack = p.attackDuration = 0.25;
  p.attackClip = "draw";
  (g.rifleShots ||= []).push({ x: p.x, y: p.y, prevX: p.x, prevY: p.y,
    ...charmShot(p),
    vx: x * cfg.speed, vy: y * cfg.speed, remaining: cfg.range,
    owner: p.id, playerOwned: !!g.players?.includes(p), damage: def.damage,
    aimed: Number.isFinite(charge) && charge >= cfg.aimTime });
  emitNoise(g, p, "rifle", 700);
  g.onSound?.("rifle", p);
  g.persist?.();
  return true;
}

const trees = new Set(["tree", "palm", "snow_tree", "frozen_log"]);
const iceProps = new Set(["ice_rock", "ice_spire", "snow_drift"]);
export function meltEquipmentIce(g, point, radius = 48) {
  let changed = (g.scenery || []).some(s => s.melted);
  for (const s of g.scenery || []) {
    if (s.depleted || !iceProps.has(s.kind)) continue;
    const b = propBase(s);
    if (Math.hypot(b.x - point.x, b.y - point.y) <= radius && clearShot(g, point, b)) {
      s.depleted = true; s.melted = true; changed = true;
    }
  }
  for (let ty = Math.max(0, Math.floor((point.y - radius) / 32)); ty <= Math.min(49, Math.floor((point.y + radius) / 32)); ty++) {
    for (let tx = Math.max(0, Math.floor((point.x - radius) / 32)); tx <= Math.min(49, Math.floor((point.x + radius) / 32)); tx++) {
      const b = { x: tx * 32 + 16, y: ty * 32 + 16 }, index = ty * 50 + tx;
      if (g.terrain?.[index] === "ice" && Math.hypot(b.x - point.x, b.y - point.y) <= radius && clearShot(g, point, b)) {
        g.terrain[index] = "shallow"; changed = true;
      }
    }
  }
  if (changed) {
    g.scenery = (g.scenery || []).filter(s => !s.melted);
    g.terrainRevision = (g.terrainRevision || 0) + 1;
  }
  return changed;
}

export function applyTorchHit(g, p, target) {
  const id = [p.equipment?.hand1, p.equipment?.hand2].find(id => ITEMS[id]?.fire);
  if (!id || !target || p.hp <= 0 || target.depleted) return false;
  const cfg = ITEMS[id].fire;
  if (g.scenery?.includes(target)) {
    if (trees.has(target.kind) && !target.falling) {
      target.torchBurn = Math.max(target.torchBurn || 0, cfg.duration);
      target.torchSource = p.id;
      return true;
    }
    if (iceProps.has(target.kind)) {
      target.depleted = true; target.melted = true;
      meltEquipmentIce(g, propBase(target), cfg.meltRadius);
      g.persist?.(); return true;
    }
    return false;
  }
  if (target.hp > 0) { ignite(target, cfg.duration, cfg.damage); return true; }
  return false;
}

export function lightTorchFire(g,p) {
  if(g.phase!=='play'||p.hp<=0||p.room||p.ui||![p.equipment?.hand1,p.equipment?.hand2].some(id=>ITEMS[id]?.fire))return false;
  const length=Math.hypot(p.faceX,p.faceY)||1;
  const x=p.x+p.faceX/length*56,y=p.y+p.faceY/length*56;
  if(g.projectileBlocked(x,y,3)||!clearShot(g,p,{x,y}))return false;
  const kind=g.terrain?.[Math.floor(y/32)*50+Math.floor(x/32)];
  if(['water','shallow','floodbridge'].includes(kind))return false;
  const fire=firePatch(g,x,y,7,2);
  fire.playerLit=true;fire.ownerId=p.id;
  emitNoise(g,p,'fire',90);
  g.message?.('Torch fire lit. Keep clear of the flames.');g.persist?.();
  return true;
}

export function tickNightEquipment(g, dt) {
  if (!Number.isFinite(dt) || dt < 0) throw new RangeError("dt must be finite nonnegative seconds");
  if (dt === 0 || !["play", "won"].includes(g.phase)) return;
  const players = g.players || [], enemies = g.enemies || [];
  let changed = false;
  for (const p of [...players, ...enemies]) {
    p.rifleReload = Math.max(0, (p.rifleReload || 0) - dt);
    if (p.hp <= 0 || p.room) continue;
    if ([p.equipment?.hand1, p.equipment?.hand2].some(id => ITEMS[id]?.fire)) {
      changed = meltEquipmentIce(g, p, ITEMS.torch.fire.meltRadius) || changed;
    }
  }
  for (const s of g.scenery || []) {
    if(trees.has(s.kind)&&!s.depleted&&!s.falling) {
      const base=propBase(s);
      if(g.firePatches?.some(f=>f.life>0&&Math.hypot(f.x+16-base.x,f.y+16-base.y)<32))s.torchBurn=Math.max(s.torchBurn||0,2);
    }
    if (!(s.torchBurn > 0) || s.depleted || s.falling) continue;
    const elapsed = Math.min(dt, s.torchBurn);
    s.torchBurn = Math.max(0, s.torchBurn - dt);
    s.harvest = (s.harvest || 0) + elapsed * 24;
    if (s.harvest >= (s.maxHarvest || Math.round(s.size * 0.85))) {
      changed = true;
      s.falling = 0.001; s.fallDirection = 1;
      s.logCount = Math.max(2, Math.round(s.size / 32)); s.torchBurn = 0;
    }
  }
  for (const b of g.rifleShots || []) {
    b.prevX = b.x; b.prevY = b.y;
    const speed = Math.hypot(b.vx, b.vy), travel = Math.min(b.remaining, speed * dt);
    const steps = Math.max(1, Math.ceil(travel / 4)), step = travel / steps;
    const targets = b.playerOwned ? playerCombatTargets(g,b) : players.filter(p=>!isCharmed(p));
    for (let i = 0; i < steps && b.remaining > 0; i++) {
      const next = { x: b.x + b.vx / speed * step, y: b.y + b.vy / speed * step };
      if (g.projectileBlocked(next.x, next.y, 2, true)) { b.remaining = 0; break; }
      const previous = { x: b.x, y: b.y };
      b.x = next.x; b.y = next.y; b.remaining -= step;
      const hit = targets.filter(t => t.hp > 0 && !t.room && Math.hypot(t.x - b.x, t.y - b.y) < (t.radius || t.r || 12) + 2 && clearShot(g, previous, t))
        .sort((a, z) => Math.hypot(a.x - previous.x, a.y - previous.y) - Math.hypot(z.x - previous.x, z.y - previous.y))[0];
      if (hit) {
        if (players.includes(hit)) g.hurt(hit, b.damage, b);
        else { damageEnemy(hit,b.damage); hit.killedBy = b.owner; hit.ritualKill = false; hit.aggro = true; hit.flash = 0.2; }
        b.remaining = 0; break;
      }
    }
  }
  g.rifleShots = (g.rifleShots || []).filter(b => b.remaining > 0);
  if (changed) g.persist?.();
}

export function drawNightEquipment(c, g) {
  c.save();
  c.strokeStyle = "#ffe7a0"; c.lineWidth = 2;
  for (const b of g.rifleShots || []) {
    c.beginPath(); c.moveTo(b.prevX, b.prevY); c.lineTo(b.x, b.y); c.stroke();
  }
  for (const s of g.scenery || []) {
    if (!(s.torchBurn > 0) || s.depleted) continue;
    const b = propBase(s), flicker = Math.sin((g.time || 0) * 18 + s.x) * 3;
    c.fillStyle = "#ed7439"; c.fillRect(b.x - 7, b.y - 19 - flicker, 14, 19 + flicker);
    c.fillStyle = "#ffe091"; c.fillRect(b.x - 3, b.y - 12, 6, 12);
  }
  c.restore();
}
