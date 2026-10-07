import {tickSnow,drawBlizzard} from './ice-world.mjs';
import {tickWetWeather,clearWetWeather} from './wet-weather.mjs';
import {spawnMerchant,tickMerchant} from './traveling-merchant.mjs';
import {damageEnemy} from './enemy-damage.mjs';
import {isCharmed} from './succubus-charm.mjs';
import {advanceShot,clearShot} from './navigation.mjs';
import { stat } from "./items.mjs";
import { terrainHash } from "./world.mjs";
import { creatures } from "./definitions.mjs";
import {stampedeDestruction,tickDestruction} from './structure-destruction.mjs';
export const HAZARD_EVENTS = [
 {name:'A bargain with the bushes',type:'merchant',kind:'merchant',count:0,weight:5,verse:'A hat, a horse, a fire so bright.\nTrade well before they leave tonight.',tip:'Marlow Moss has set up camp away from the board. He stays until this map ends.'},
 {name:'The dunes take flight',type:'sandstorm',kind:'sandstorm',environment:'desert',count:0,weight:7,duration:45,intensity:1,verse:'The desert shakes its golden mane.\nHold fast until the dunes are tame.',tip:'Sand sweeps across the dunes. Stay together until the storm passes.'},
 {name:'A knock from the sky',type:'thunderstorm',kind:'thunderstorm',environment:'house',count:0,weight:7,duration:50,intensity:1,verse:'Who knocks above with hands of light?\nThe thunder wants to stay the night.',tip:'Take shelter inside. Wet footprints and puddles linger after the storm.'},
 {name:'The roof remembers rain',type:'thunderstorm',kind:'thunderstorm',environment:'temple',count:0,weight:7,duration:50,intensity:1,verse:'Old stone keeps secrets, rain slips through.\nThe roof has saved a drop for you.',tip:'The temple shelters you from rain, except beneath a few leaking stones.'},
 {name:'The white hush',type:'blizzard',kind:'blizzard',environment:'ice',count:0,weight:8,duration:50,intensity:1,hp:0,speed:0,damage:0,verse:'The sky lets fall a silent sea.\nSnow swallows root and stone and knee.',tip:'Snow slows grounded creatures and gives ice more grip. Gather frost berries and winter supplies.'},
  {
    name: "The sky breaks open",
    type: "monsoon",
    kind: "monsoon",
    count: 0,
    weight: 6,
    duration: 45,
    intensity: 1,
    hp: 0,
    speed: 0,
    damage: 0,
    verse:
      "The ceiling opens, clouds descend.\nThe rain forgets where skies should end.",
    tip: "A monsoon has arrived. Visibility shrinks until the rain passes.",
  },
  {
    name: "A mountain wakes",
    type: "volcano",
    kind: "volcano",
    count: 0,
    weight: 0.4,
    duration: 65,
    spread: 0.45,
    hp: 0,
    speed: 0,
    damage: 12,
    verse: "Deep below, a furnace glows.\nA mountain rises. Fire flows.",
    tip: "Rare eruption! Keep clear of the crater and flowing lava.",
  },
  {
    name: "Twenty thunders",
    type: "stampede",
    kind: "rhino",
    squad: ['rhino', 'elephant', 'zebra', 'zebra', 'pelican'],
    count: 20,
    weight: 4,
    hp: 130,
    speed: 185,
    damage: 20,
    verse:
      "Twenty shadows shake the plain.\nLet them pass, or earn their pain.",
    tip: "Rhinos, elephants, zebras and pelicans cross the jungle. Stand clear; only struck animals turn to fight.",
  },
];
export function initHazards(g) {
  clearWetWeather(g);
  g.merchant=null;
  g.weather = null;g.snowDepth=0;
  g.volcanoes = [];
  g.lava = [];
  g.bananas = [];
  g.poisonShots = [];
  g.fireballs = [];
  g.firePatches = [];
  g.fireParticles = [];
  g.impBombs=[];g.impFireCircles=[];
}
export function ignite(target, duration = 2, damage = 3) {
  target.burning = Math.max(target.burning || 0, duration);
  target.burnDamage = Math.max(target.burnDamage || 0, damage);
  target.burnTick ??= 0.5;
}
export function firePatch(g, x, y, life = 2.6, damage = 3) {
  const tx = Math.floor(x / 32) * 32,
    ty = Math.floor(y / 32) * 32;
  let patch = g.firePatches.find((f) => f.x === tx && f.y === ty);
  if (!patch) {
    patch = { x: tx, y: ty, life, damage, tick: 0 };
    g.firePatches.push(patch);
  } else patch.life = Math.max(patch.life, life);
  return patch;
}
export function startHazard(g, event) {
  if(event.type==='merchant'){spawnMerchant(g);return true;}
  if (['monsoon','sandstorm','thunderstorm','blizzard'].includes(event.type)) {
    g.weather = {
      type: event.type,
      life: event.duration || 45,
      duration: event.duration || 45,
      intensity: event.intensity || 1,
    };
    return true;
  }
  if (event.type === "volcano") {
    const a = g.random() * Math.PI * 2,
      x = Math.max(96, Math.min(1504, 800 + Math.cos(a) * 500)),
      y = Math.max(96, Math.min(1504, 800 + Math.sin(a) * 500));
    const v = {
      id: g.nextId++,
      x,
      y,
      life: event.duration || 65,
      spread: event.spread || 0.45,
      timer: 0,
      damage: event.damage || 12,
    };
    g.volcanoes.push(v);
    g.lava.push({
      x: Math.floor(x / 32) * 32,
      y: Math.floor(y / 32) * 32,
      source: v.id,
      life: 40,
      damage: v.damage,
    });
    g.reveal = { x, y, life: 4 };
    return true;
  }
  if (event.type === "stampede") {
    const dir = g.random() < 0.5 ? 1 : -1,
      lane = [8, 24, 40][Math.floor(g.random() * 3)] * 32 + 16;
    for (let n = 0; n < (event.count || 20); n++)
      g.enemies.push({
        ...event,
        id: g.nextId++,
        kind: (event.squad || ['rhino'])[n % (event.squad?.length || 1)],
        stampeding: true,
        x: dir > 0 ? -30 - n * 48 : 1630 + n * 48,
        y: lane + ((n % 3) - 1) * 18,
        lane: lane + ((n % 3) - 1) * 18,
        runDirection: dir,
        hp: event.hp || 130,
        maxHp: event.hp || 130,
        speed: event.speed || 185,
        damage: event.damage || 20,
        state: "stampede",
        aggro: false,
        cooldown: 0,
        flash: 0,
        timer: 0,
        step: 0,
        faceX: dir,
        faceY: 0,
        orbit: 1,
        tacticTime: 0,
      });
    return true;
  }
  return false;
}
export function tickHazards(g, dt) {
  tickDestruction(g,dt);
  tickMerchant(g,dt);
  tickSnow(g,dt);
  for (const b of g.fireballs || []) {
    if(!advanceShot(g,b,dt,3))continue;
    b.life -= dt;
    b.trail -= dt;
    const cold=!!(b.ice||b.water);
    if (b.trail <= 0) {
      if(!cold)firePatch(g, b.x, b.y, 2, b.burnDamage);
      b.trail = 0.14;
      if(cold)g.effects.push({x:b.x,y:b.y,life:.35,radius:5,color:'#a7edff'});
      else g.fireParticles.push({ x: b.x, y: b.y, life: 0.5, smoke: false });
    }
    for (const p of g.players)
      if (
        b.life > 0 &&
        !isCharmed(p) &&
        !p.room &&
        p.hp > 0 &&
        !((p.jumpHeight||0)>2 || (p.groundHeight||0)>2 || p.flying || p.flightHeight || p.roostHeight) &&
        Math.hypot(p.x - b.x, p.y - b.y) < 18 && clearShot(g,b,p)
      ) {
        if (!g.shieldBlocks(p, b) && p.invuln <= 0) {
          g.hurt(p, b.damage, b);
          if(!cold)ignite(p, 2, b.burnDamage);
        }
        b.life = 0;
      }
    if (b.life > 0 && g.projectileBlocked(b.x, b.y, 5,true)) {
      if(!cold)firePatch(g, b.x, b.y, 2, b.burnDamage);
      b.life = 0;
    }
  }
  g.fireballs = (g.fireballs || []).filter((b) => b.life > 0);
  for (const f of g.firePatches || []) {
    f.life -= dt;
    f.tick -= dt;
    if (f.life <= 0 || f.tick > 0) continue;
    f.tick = 0.5;
    for (const p of g.players)
      if (
        !p.room &&
        !((p.jumpHeight||0)>2 || (p.groundHeight||0)>2 || p.flying || p.flightHeight || p.roostHeight) &&
        p.hp > 0 &&
        p.x >= f.x &&
        p.x < f.x + 32 &&
        p.y >= f.y &&
        p.y < f.y + 32
      ) {
        g.hurt(p, f.damage);
        ignite(p, 2, f.damage);
      }
    if(f.playerLit)for(const e of g.enemies)
      if(!e.room&&e.hp>0&&!((e.jumpHeight||0)>2||(e.groundHeight||0)>2||e.flying||e.flightHeight||e.roostHeight||['bat','bee','wasp','tsetse','dragonfly','fairy','bird','pelican','raven','crow'].includes(e.kind))&&e.x>=f.x&&e.x<f.x+32&&e.y>=f.y&&e.y<f.y+32) {
        damageEnemy(e,f.damage,'fire');e.killedBy=f.ownerId;e.aggro=true;e.flash=.12;
        ignite(e,2,f.damage);
      }
  }
  g.firePatches = (g.firePatches || []).filter((f) => f.life > 0);
  for (const target of [...g.players, ...g.enemies])
    if (target.burning > 0) {
      target.burning = Math.max(0, target.burning - dt);
      target.burnTick = (target.burnTick || 0) - dt;
      if (target.burnTick <= 0) {
        if (target.hp > 0) {
          if (g.players.includes(target))
            g.hurt(target, target.burnDamage || 3);
          else damageEnemy(target,target.burnDamage || 3,'fire');
        }
        target.burnTick = 0.5;
      }
      target.burnParticleTimer = (target.burnParticleTimer || 0) - dt;
      if (target.burnParticleTimer <= 0) {
        target.burnParticleTimer = 0.07;
        g.fireParticles.push({
          x: target.x + (Math.random() - 0.5) * 16,
          y: target.y + (Math.random() - 0.5) * 14,
          life: 0.55,
          smoke: Math.random() < 0.35,
        });
      }
    }
  for (const f of g.fireParticles) f.life -= dt;
  g.fireParticles = g.fireParticles.filter((f) => f.life > 0);
  if (g.weather) {
    g.weather.life -= dt;
    if (g.weather.life <= 0) g.weather = null;
  }
  tickWetWeather(g,dt);
  for (const v of g.volcanoes) {
    v.life -= dt;
    v.timer -= dt;
    if (v.life <= 0 || v.timer > 0) continue;
    v.timer = v.spread;
    const cells = g.lava.filter((c) => c.source === v.id);
    if (cells.length >= 160) continue;
    const occupied = new Set(g.lava.map((c) => c.x + ":" + c.y));
    const candidates = [];
    for (const c of cells)
      for (const [dx, dy] of [
        [32, 0],
        [-32, 0],
        [0, 32],
        [0, -32],
      ]) {
        const x = c.x + dx,
          y = c.y + dy;
        if (
          x < 32 ||
          y < 32 ||
          x > 1536 ||
          y > 1536 ||
          Math.hypot(x - 800, y - 800) < 230 ||
          occupied.has(x + ":" + y)
        )
          continue;
        candidates.push({ x, y, score: terrainHash(x + g.seed, y) - y / 1800 });
      }
    candidates.sort((a, b) => a.score - b.score);
    const next = candidates[0];
    if (next)
      g.lava.push({
        x: next.x,
        y: next.y,
        source: v.id,
        life: 40,
        damage: v.damage,
      });
  }
  for (const c of g.lava) {
    if (g.volcanoes.find((v) => v.id === c.source)?.life > 0) c.life = 40;
    else c.life -= dt;
    if (c.life > 0)
      for (const p of g.players)
        if (
          !p.room &&
          p.hp > 0 &&
          p.x >= c.x &&
          p.x < c.x + 32 &&
          p.y >= c.y &&
          p.y < c.y + 32
        )
          g.hurt(p, c.damage);
  }
  g.lava = g.lava.filter((c) => c.life > -30);
  for (const b of g.poisonShots || []) {
    if(!advanceShot(g,b,dt,3))continue;
    b.life -= dt;
    for (const p of g.players)
      if (
        b.life > 0 &&
        !isCharmed(p) &&
        !p.room &&
        p.hp > 0 &&
        Math.hypot(p.x - b.x, p.y - b.y) < 18 && clearShot(g,b,p)
      ) {
        if (!g.shieldBlocks(p, b) && p.invuln <= 0) {
          const resist = Math.max(0, 1 - stat(p, "poisonResist"));
          p.poison = Math.max(p.poison || 0, b.duration * resist);
          p.poisonDamage = b.damage;
          p.poisonTick = 1;
          g.hurt(p, b.damage, b);
        }
        b.life = 0;
      }
  }
  g.poisonShots = (g.poisonShots || []).filter((b) => b.life > 0);
  for (const p of g.players)
    if (p.poison > 0) {
      p.poison = Math.max(0, p.poison - dt);
      p.poisonTick = (p.poisonTick || 0) - dt;
      if (p.poisonTick <= 0) {
        g.hurt(p, p.poisonDamage || 2);
        p.poisonTick = 1;
      }
    }
  for (const b of g.bananas) {
    if(!advanceShot(g,b,dt,3))continue;
    b.z += b.vz * dt;
    b.vz -= 180 * dt;
    b.life -= dt;
    for (const p of g.players)
      if (
        !isCharmed(p) &&
        !p.room &&
        p.hp > 0 &&
        b.z < 30 &&
        Math.hypot(p.x - b.x, p.y - b.y) < 18 && clearShot(g,b,p)
      ) {
        g.hurt(p, b.damage, b);
        b.life = 0;
      }
    if (b.z <= 0) b.life = 0;
  }
  g.bananas = g.bananas.filter((b) => b.life > 0);
  for (const e of g.enemies)
    if ((e.stampeding || e.kind === "rhino") && !e.aggro && e.hp > 0) {
      const from={x:e.x,y:e.y};
      e.x += e.runDirection * e.speed * dt;
      e.y =
        e.lane -
        (e.lane > 700 && e.lane < 850
          ? Math.max(0, Math.sin(((e.x - 500) / 600) * Math.PI)) * 145
          : 0);
      e.step += e.speed * dt * 0.13;
      e.moving = true;
      stampedeDestruction(g,e,from);
      for (const p of g.players)
        if (!p.room && Math.hypot(e.x - p.x, e.y - p.y) < 28)
          g.hurt(p, e.damage, e);
      if (e.runDirection > 0 ? e.x > 1660 : e.x < -60) e.escaped = true;
    }
  g.enemies = g.enemies.filter((e) => !e.escaped);
}
export function drawWeather(ctx, g, w, h) {
  if (!g.weather) return;
  if(drawBlizzard(ctx,g,w,h))return;
  if(g.weather.type==='sandstorm'){
    ctx.save();ctx.fillStyle='#b28c4830';ctx.fillRect(0,0,w,h);
    for(let i=0;i<180;i++){const x=(terrainHash(i,31)*w+g.time*(75+i%37))%w,y=terrainHash(i,71)*h+Math.sin(g.time*2+i)*5;ctx.globalAlpha=.15+terrainHash(i,9)*.35;ctx.fillStyle=i%3?'#dfbf7c':'#8a693f';ctx.fillRect(x,y,3+i%5,1);}ctx.restore();return;
  }
  const intensity = Math.min(2, g.weather.intensity);
  ctx.fillStyle = "#10283544";
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "#c7e5ea";
  ctx.font = "7px monospace";
  ctx.textAlign = "left";
  ctx.fillText((g.weather.type==='thunderstorm'?'THUNDERSTORM':'MONSOON')+" · " + Math.ceil(g.weather.life) + "s", 12, 65);
  if(g.weather.type==='thunderstorm'&&(g.time%9<.08||(g.time%9>.2&&g.time%9<.25))){ctx.fillStyle='#e9f5ff30';ctx.fillRect(0,0,w,h);}
}
export function drawHazards(ctx, g) {
  for (const f of g.firePatches || []) {
    ctx.fillStyle = "#9c3b2670";
    ctx.fillRect(f.x, f.y, 32, 32);
    ctx.fillStyle = Math.sin(g.time * 12 + f.x) > 0 ? "#ff9b3c" : "#f05b2d";
    ctx.fillRect(f.x + 7 + Math.floor((g.time * 9 + f.y) % 9), f.y + 12, 10, 8);
    ctx.fillStyle = "#ffd45d";
    ctx.fillRect(f.x + 12, f.y + 8, 5, 9);
  }
  for (const b of g.fireballs || []) {
    if(b.ice||b.water){
      ctx.save();ctx.translate(b.x,b.y);ctx.rotate(Math.atan2(b.vy,b.vx));
      ctx.fillStyle='#6fcce9';ctx.beginPath();ctx.moveTo(10,0);ctx.lineTo(-3,-5);ctx.lineTo(-8,0);ctx.lineTo(-3,5);ctx.closePath();ctx.fill();
      ctx.strokeStyle='#e4fcff';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-5,0);ctx.lineTo(7,0);ctx.stroke();ctx.restore();continue;
    }
    ctx.fillStyle = "#ff512c";
    ctx.beginPath();
    ctx.arc(b.x, b.y, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffe071";
    ctx.beginPath();
    ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
    ctx.fill();
  }
  for (const c of g.lava) {
    ctx.fillStyle =
      c.life <= 0
        ? "#44322e"
        : Math.floor(g.time * 3 + c.x / 32 + c.y / 32) % 2
          ? "#e96f2d"
          : "#bc3d21";
    ctx.fillRect(c.x, c.y, 32, 32);
    if (c.life > 0) {
      ctx.fillStyle = "#ffcb57";
      ctx.fillRect(c.x + 4 + ((g.time * 5) % 12), c.y + 9, 13, 3);
      ctx.fillRect(c.x + 8, c.y + 23, 16, 2);
    }
  }
  for (const v of g.volcanoes) {
    ctx.fillStyle = "#332b30";
    ctx.beginPath();
    ctx.moveTo(v.x - 57, v.y + 35);
    ctx.lineTo(v.x - 21, v.y - 54);
    ctx.lineTo(v.x + 23, v.y - 53);
    ctx.lineTo(v.x + 58, v.y + 35);
    ctx.fill();
    ctx.fillStyle = "#65473a";
    ctx.beginPath();
    ctx.moveTo(v.x - 12, v.y - 48);
    ctx.lineTo(v.x - 29, v.y + 27);
    ctx.lineTo(v.x + 17, v.y + 35);
    ctx.lineTo(v.x + 20, v.y - 48);
    ctx.fill();
    ctx.fillStyle = v.life > 0 ? "#ff9d37" : "#362a29";
    ctx.beginPath();
    ctx.ellipse(v.x, v.y - 49, 23, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    if (v.life > 0) {
      ctx.fillStyle = "#c0b6a477";
      for (let i = 0; i < 5; i++) {
        const t = (g.time * 0.5 + i * 0.2) % 1;
        ctx.fillRect(
          v.x - 9 + Math.sin(i + g.time) * 8,
          v.y - 55 - t * 65,
          14 + t * 15,
          9 + t * 14,
        );
      }
    }
  }
  for (const b of g.poisonShots || []) {
    ctx.fillStyle = "#9fe45b";
    ctx.fillRect(b.x - 3, b.y - 16, 6, 5);
    ctx.fillStyle = "#477b48";
    ctx.fillRect(b.x - b.vx * 0.025 - 2, b.y - b.vy * 0.025 - 15, 3, 3);
  }
  for (const b of g.bananas) {
    ctx.save();
    ctx.translate(b.x, b.y - b.z);
    ctx.rotate(g.time * 9);
    ctx.strokeStyle = "#f4cd5f";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, 5, 0, Math.PI);
    ctx.stroke();
    ctx.restore();
  }
}
