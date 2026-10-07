import {ITEMS} from './items.mjs';
import {enemyCanSeeTarget} from './enemy-sight.mjs';
import {BOUNDLESS_SAFE_RADIUS} from './boundless-world.mjs';

export const RAVEN_FLOCK_SIZE = 3;
export const MURDER_FLOCK_SIZE = 6;
export const RAVEN_WORLD_CAP = 48;
export const RAVEN_IDLE_INTERVAL = 60;
export const MURDER_UNREACHABLE_SECONDS = 30;
const RADIUS = 6, CELL = 24, ROUTE_LIMIT = 128;
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const finite = (n, fallback) => Number.isFinite(n) ? n : fallback;
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const bird = e => e?.kind === 'raven' || e?.kind === 'crow';
const random = g => clamp(finite(g.random?.(), .5), 0, .999999);
const clone = value => JSON.parse(JSON.stringify(value));
const bounds = g => ({minX:24, minY:24, maxX:finite(g.worldWidth, 1600)-24, maxY:finite(g.worldHeight, 1600)-24});
function bounded(g, p) {
  const b = bounds(g);
  return {x:clamp(finite(p.x, 800), b.minX, b.maxX), y:clamp(finite(p.y, 800), b.minY, b.maxY)};
}
function blocked(g, e, x, y, height = 24) {
  const b = bounds(g);
  if (x < b.minX || x > b.maxX || y < b.minY || y > b.maxY) return true;
  if (g.mapMode==='boundless' && !['ally','neutral'].includes(e?.faction) && Math.hypot(x-800,y-800)<BOUNDLESS_SAFE_RADIUS) return true;
  // Flying skips water/scenery, never structure. Elevation >= 10 passes a broken
  // pane through the existing structureBlocked rule; doors are never opened here.
  return !!g.blocked(x, y, RADIUS, true, true, false, 0, Math.max(16, height), false, e);
}
function segmentClear(g, e, a, b) {
  const n = Math.max(1, Math.ceil(distance(a, b) / 3));
  for (let i = 1; i <= n; i++) {
    if (blocked(g, e, a.x + (b.x-a.x)*i/n, a.y + (b.y-a.y)*i/n)) return false;
  }
  return true;
}
function groundClear(g, e, p) {
  const b = bounds(g);
  return p.x >= b.minX && p.x <= b.maxX && p.y >= b.minY && p.y <= b.maxY &&
    !g.blocked(p.x, p.y, RADIUS, false, false, false, 0, p.height || 0, false, e);
}
const perchClear = (g,e,p) => p.height>0 ? !blocked(g,e,p.x,p.y,p.height) : groundClear(g,e,p);
function freeSpot(g, e, anchor, index = 0, ground = false) {
  for (let i = 0; i < 64; i++) {
    const a = (index*2.4+i*2.399963), r = i ? 18 + Math.floor(i/8)*20 : index*16;
    const p = bounded(g, {x:anchor.x+Math.cos(a)*r, y:anchor.y+Math.sin(a)*r});
    if (ground ? groundClear(g, e, p) : !blocked(g, e, p.x, p.y)) return p;
  }
  return null;
}

function perches(g) {
  const result = [];
  for (const p of [...(g.ravenPerches || []), ...(g.graveyard?.perches || [])]) {
    if (!Number.isFinite(p.x) || !Number.isFinite(p.y) || p.fallen || p.depleted) continue;
    result.push({x:p.x, y:p.y, height:clamp(finite(p.height, 0), 0, 160), kind:p.kind || 'perch', key:p.id ?? `${p.x}:${p.y}`});
  }
  for (const s of g.scenery || []) {
    if (s.fallen || s.falling || s.depleted) continue;
    const tree = ['leafless_tree','dead_tree','bare_tree'].includes(s.kind) ||
      ['tree','forest_tree','snow_tree'].includes(s.kind) && (s.leafless || s.bare || s.leaves === false);
    const grave = ['grave','gravestone','grave_stone','tombstone','mausoleum'].includes(s.kind);
    if (!tree && !grave) continue;
    const size = finite(s.size, 64), cemetery=s.graveyard || !!s.graveyardFootprint;
    const stoneHeight=cemetery ? 39+(s.variant===1?4:s.variant===3?3:0) : 20;
    const height = clamp(finite(s.perchHeight, tree ? size*.55 : s.kind === 'mausoleum' ? finite(s.height,48)+ (cemetery?2:0) : stoneHeight), 8, 160);
    // Cemetery props are foot-anchored. Legacy leafy forest art uses a root
    // offset; using that offset on the native bare tree leaves birds in midair.
    const root=s.rootY ?? (cemetery || s.kind==='leafless_tree' ? s.y : s.y+size*.35);
    result.push({x:finite(s.perchX, s.x), y:finite(s.perchY, tree ? root : s.y), height, kind:s.kind, key:s.id ?? `${s.x}:${s.y}`});
  }
  return result.slice(0, 256);
}
function choosePerch(g, e, anchor, index = 0, previous = null) {
  const choices = perches(g).filter(p => distance(p, anchor) <= 360 &&
    (!previous || distance(p, previous) > 18) && !blocked(g, e, p.x, p.y, p.height));
  choices.sort((a,b) => distance(a, anchor)-distance(b, anchor));
  if (choices.length) {
    const p = choices[index % Math.min(choices.length, 8)];
    // Separate flockmates sharing a branch or broad tomb roof.
    const shifted = {...p, x:p.x+(index%3-1)*12};
    return !blocked(g, e, shifted.x, shifted.y, shifted.height) ? shifted : {...p};
  }
  const base = previous ? {x:anchor.x+Math.cos(index*2.4+random(g)*6.28)*100, y:anchor.y+Math.sin(index*2.4+random(g)*6.28)*100} : anchor;
  const p = freeSpot(g, e, base, index, true);
  return p ? {...p, height:0, kind:'ground', key:null} : null;
}
function nextId(g) {
  g.nextId = Math.max(1, finite(g.nextId, 1));
  while ((g.enemies || []).some(e => e.id === g.nextId)) g.nextId++;
  return g.nextId++;
}
function newBird(g, flock, index, murder = flock.murder) {
  const e = {id:nextId(g), kind:murder ? 'crow' : flock.kind, group:flock.group,
    hp:flock.hp, maxHp:flock.hp, speed:flock.speed, damage:flock.damage,
    faceX:index%2 ? -1 : 1, faceY:0, state:'idle', cooldown:.5, attack:0, flash:0, frozen:0, step:0, moving:false, aggro:murder};
  const p = choosePerch(g, e, flock.anchor, index) || (() => {
    const q = freeSpot(g, e, flock.anchor, index); return q ? {...q,height:24,kind:'air',key:null} : null;
  })();
  if (!p) return null;
  e.x = p.x; e.y = p.y;
  e.raven = {version:1, flock:clone(flock), phase:murder || p.kind === 'air' ? 'fly' : 'perch', phaseTime:0,
    height:murder ? 24 : p.height, perch:p, relocateIn:RAVEN_IDLE_INTERVAL,
    carrying:null, lootDropped:false, lootScanIn:0, lootTargetId:null, targetId:null, route:null, failedRoutes:[]};
  e.state = murder ? 'hunt' : 'idle';
  return e;
}

/** Adds and returns actors. Main explicitly calls this for events and initial
 * graveyard groups; there is no biome scan, cross-level spawn, or global timer.
 * Options: x/y or anchor, group, kind ('raven'/'crow'), hp/speed/damage,
 * aggroRange/disengageRange. g.ravenPerches accepts {x,y,height,kind,id}.
 */
export function spawnRavenFlock(g, {count=3, murder=false, ...options} = {}) {
  if (typeof g.blocked !== 'function') throw new TypeError('Ravens require g.blocked');
  g.enemies ||= [];
  const requested = murder ? MURDER_FLOCK_SIZE : clamp(Math.floor(finite(count,3)), 0, RAVEN_FLOCK_SIZE);
  const room = RAVEN_WORLD_CAP-g.enemies.filter(e => bird(e) && e.hp > 0).length;
  if (!requested || room <= 0) return [];
  const anchor = bounded(g, options.anchor || options);
  const id = `raven:${Math.max(1,finite(g.nextId,1))}:${g.enemies.length}`;
  const flock = {id, group:options.group ?? id, kind:options.kind === 'crow' || murder ? 'crow' : 'raven',
    murder:!!murder, unreachableFor:0, refillIn:RAVEN_IDLE_INTERVAL, anchor,
    hp:Math.max(1,finite(options.hp,36)), speed:clamp(finite(options.speed,100),0,240), damage:Math.max(0,finite(options.damage,8)),
    aggroRange:clamp(finite(options.aggroRange,190),24,600), disengageRange:clamp(finite(options.disengageRange,420),24,1200)};
  flock.disengageRange = Math.max(flock.aggroRange, flock.disengageRange);
  const result = [];
  for (let i = 0; i < Math.min(requested,room); i++) {
    const e = newBird(g,flock,i);
    if (e) {g.enemies.push(e); result.push(e);}
  }
  return result;
}

// A bounded A* uses the flying bird's exact collision options. Generic enemy
// navigation currently classifies raven/crow as ground actors. Every grid edge
// is swept too: thin intact walls between walkable cells cannot be crossed.
function findRoute(g, e, target) {
  if (segmentClear(g,e,e,target)) return [{x:target.x,y:target.y}];
  const b = bounds(g), cols = Math.ceil((b.maxX-b.minX)/CELL)+1, rows = Math.ceil((b.maxY-b.minY)/CELL)+1;
  if (cols*rows > 5000) return null;
  const cell = p => clamp(Math.round((p.y-b.minY)/CELL),0,rows-1)*cols+clamp(Math.round((p.x-b.minX)/CELL),0,cols-1);
  const point = id => ({x:Math.min(b.maxX,b.minX+(id%cols)*CELL),y:Math.min(b.maxY,b.minY+Math.floor(id/cols)*CELL)});
  const start = cell(e), goal = cell(target), startPoint = point(start);
  if (!segmentClear(g,e,e,startPoint)) return null;
  const h = id => Math.abs(id%cols-goal%cols)+Math.abs(Math.floor(id/cols)-Math.floor(goal/cols));
  const costs = new Float32Array(cols*rows).fill(Infinity), parents = new Int32Array(cols*rows).fill(-1), closed = new Uint8Array(cols*rows), open=[start];
  costs[start] = 0;
  for (let iter=0; open.length && iter<5000; iter++) {
    let best=0;
    for (let i=1;i<open.length;i++) if (costs[open[i]]+h(open[i]) < costs[open[best]]+h(open[best])) best=i;
    const id = open.splice(best,1)[0];
    if (closed[id]) continue;
    closed[id]=1;
    const p=point(id);
    if (id===goal && segmentClear(g,e,p,target)) {
      const path=[{x:target.x,y:target.y}]; let at=id;
      while (at!==start && at>=0 && path.length<=ROUTE_LIMIT) {path.push(point(at)); at=parents[at];}
      if (path.length>ROUTE_LIMIT) return null;
      path.push(startPoint); return path.reverse();
    }
    const x=id%cols,y=Math.floor(id/cols);
    for (const [nx,ny] of [[x-1,y],[x+1,y],[x,y-1],[x,y+1]]) {
      if (nx<0 || ny<0 || nx>=cols || ny>=rows) continue;
      const next=ny*cols+nx;
      if (closed[next] || costs[next]<=costs[id]+1 || !segmentClear(g,e,p,point(next))) continue;
      parents[next]=id; costs[next]=costs[id]+1; open.push(next);
    }
  }
  return null;
}
function structureSignature(g) {
  return (g.house?.doors || []).map(d=>d.open?1:0).join('')+':'+
    (g.house?.walls || []).map(w=>w.broken || w.open?1:0).join('')+':'+(g.house?.destructionRevision||0);
}
function routeTo(g,e,target) {
  const s=e.raven, signature=structureSignature(g), key=`${target.id ?? 'point'}:${Math.floor(target.x/12)}:${Math.floor(target.y/12)}`;
  let route=s.route;
  if (!route || route.key!==key || route.signature!==signature || route.ttl<=0) {
    // Cache a handful of failed candidates separately so a sealed closest
    // player doesn't force an A* search every frame, or hide a reachable ally.
    if (s.failedRoutes?.some(r=>r.key===key && r.signature===signature && r.ttl>0)) return null;
    const path=findRoute(g,e,target);
    if (!path) {
      s.failedRoutes ||= [];
      s.failedRoutes.push({key,signature,ttl:1});
      if (s.failedRoutes.length>8) s.failedRoutes.shift();
      return null;
    }
    route=s.route={key,signature,ttl:1,path};
  }
  return route.path;
}
function move(g,e,target,dt,speed=e.speed) {
  const path=routeTo(g,e,target);
  if (!path) {e.moving=false; return false;}
  while (path.length>1 && distance(e,path[0])<4) path.shift();
  const next=path[0] || target,d=distance(e,next);
  if (d<.1) {e.moving=false; return true;}
  const dx=(next.x-e.x)/d,dy=(next.y-e.y)/d,step=Math.min(d,Math.max(0,speed)*dt),n=Math.max(1,Math.ceil(step/3));
  let moved=0;
  for (let i=0;i<n;i++) {
    const x=e.x+dx*step/n,y=e.y+dy*step/n;
    if (blocked(g,e,x,y,e.raven.height)) {e.raven.route=null;break;}
    e.x=x;e.y=y;moved+=step/n;
  }
  e.moving=moved>.01;
  if (e.moving) {e.faceX=dx;e.faceY=dy;e.step=(e.step||0)+moved*.13;}
  return true;
}
function setPhase(e,phase) {
  if (e.raven.phase!==phase) {e.raven.phase=phase;e.raven.phaseTime=0;}
  e.animationAction=phase;
}
function airborne(e,dt,height=24) {
  const s=e.raven;
  if (['perch','idle','landing'].includes(s.phase)) setPhase(e,'wing_open');
  if (s.phase==='wing_open' && s.phaseTime>=.22) setPhase(e,'takeoff');
  if (s.phase==='takeoff' && s.phaseTime>=.4) setPhase(e,'fly');
  s.height += clamp(height-s.height,-dt*40,dt*55);
  return !['wing_open','takeoff'].includes(s.phase);
}
function members(g,e) {
  return g.enemies.filter(q => bird(q) && q.hp>0 && q.raven?.flock.id===e.raven.flock.id);
}
function manageFlock(g,e,dt,visible) {
  const flockmates=members(g,e), leader=flockmates.reduce((a,b)=>a.id<b.id?a:b,e);
  if (leader!==e) return;
  const f=e.raven.flock;
  // Metadata is duplicated by JSON saves. Elect one live leader after reload
  // and synchronize the small object; members never independently replenish.
  if (f.murder) {
    const reachable=flockmates.some(q=>visible.some(p=>(q.speed>0 || distance(q,p)<=34) && !!routeTo(g,q,p)));
    f.unreachableFor=reachable?0:f.unreachableFor+dt;
    if (f.unreachableFor>=MURDER_UNREACHABLE_SECONDS) {
      f.murder=false;f.refillIn=RAVEN_IDLE_INTERVAL;
      for (const q of flockmates) {q.aggro=false;q.raven.targetId=null;q.raven.route=null;}
    }
  } else {
    f.refillIn=Math.max(0,f.refillIn-dt);
    const idle=flockmates.every(q=>!q.aggro && ['perch','idle','landing','fly','wing_open','takeoff'].includes(q.raven.phase));
    // A nearby visible player wins even on the leader's first tick of a frame.
    const threatened=flockmates.some(q=>visible.some(p=>distance(q,p)<=f.aggroRange));
    if (flockmates.length>=1 && flockmates.length<3 && idle && !threatened && f.refillIn<=1e-8) {
      f.refillIn=RAVEN_IDLE_INTERVAL;
      const capacity=RAVEN_WORLD_CAP-g.enemies.filter(q=>bird(q)&&q.hp>0).length;
      const missing=Math.min(3-flockmates.length,capacity),startIndex=flockmates.length;
      for (let i=0;i<missing;i++) {
        const q=newBird(g,f,startIndex+i,false);
        if (q) {g.enemies.push(q);flockmates.push(q);}
      }
    }
  }
  for (const q of flockmates) q.raven.flock=clone(f);
}
function lootCandidate(g,e) {
  let best=null,range=240;
  for (const l of g.loot || []) {
    if (l.room || l.used || l.collected || l.embedded || l.surfaceEmbedded || l.qty<=0 ||
      !['rare','unique','epic','legendary'].includes(ITEMS[l.type]?.rarity) || !Number.isFinite(l.x) || !Number.isFinite(l.y)) continue;
    const d=distance(e,l);
    if (d<range && segmentClear(g,e,e,l)) {best=l;range=d;}
  }
  return best;
}
function takeLoot(g,e,l) {
  if (e.raven.carrying || !g.loot.includes(l) || distance(e,l)>16 || !segmentClear(g,e,e,l)) return false;
  // Carry the whole loose stack, with sockets/contents/metadata intact. Inventory,
  // reward chests and embedded ammunition are never candidates.
  e.raven.carrying=clone(l); e.raven.lootTargetId=null;
  g.loot.splice(g.loot.indexOf(l),1); g.persist?.();
  return true;
}
function idle(g,e,dt) {
  const s=e.raven,f=s.flock;
  s.relocateIn=Math.max(0,s.relocateIn-dt);
  if (s.phase==='perch') {
    // A felled perch is reselected rather than leaving a floating idle bird.
    const support=s.perch;
    const valid=support?.key==null || perches(g).some(p=>p.key===support.key);
    if (!valid || s.relocateIn<=0) {
      s.perch=choosePerch(g,e,f.anchor,e.id,s.perch) || s.perch;
      s.relocateIn=RAVEN_IDLE_INTERVAL;setPhase(e,'wing_open');
    }
  }
  if (s.phase==='perch' || s.phase==='idle') {e.state='idle';return;}
  e.state='idle';
  if (s.phase==='landing') {
    const p=s.perch;
    if (!p || !perchClear(g,e,p)) {s.perch=choosePerch(g,e,e,e.id,p);s.route=null;setPhase(e,'fly');return;}
    s.height+=clamp(p.height-s.height,-dt*50,dt*50);
    if (Math.abs(s.height-p.height)<.5 && s.phaseTime>=.4) {s.height=p.height;setPhase(e,'perch');s.route=null;}
    return;
  }
  const flightReady=airborne(e,dt,Math.max(24,s.perch?.height || 0));
  if (!flightReady) return;
  s.lootScanIn=Math.max(0,s.lootScanIn-dt);
  if (!s.carrying && s.lootScanIn<=0) {s.lootTargetId=lootCandidate(g,e)?.id ?? null;s.lootScanIn=.75;}
  const l=!s.carrying && s.lootTargetId!=null ? (g.loot || []).find(q=>q.id===s.lootTargetId) : null;
  if (l) {
    move(g,e,l,dt,e.speed*.7);
    if (takeLoot(g,e,l)) s.route=null;
    else return;
  }
  const p=s.perch;
  if (!p) {s.perch=choosePerch(g,e,e,e.id);return;}
  if (distance(e,p)>4) {
    if (!move(g,e,p,dt,e.speed*.7)) {
      s.perch=choosePerch(g,e,e,e.id,p);s.route=null;
    }
    return;
  }
  setPhase(e,'landing');
  s.height+=clamp(p.height-s.height,-dt*50,dt*50);
  e.moving=false;
  if (!perchClear(g,e,p)) {s.perch=choosePerch(g,e,e,e.id,p);s.route=null;setPhase(e,'fly');}
}

/** Call before core's no-visible-target early return and generic jump/AI. Owns
 * timers, perception, flight and attack. Allies return false to generic ally AI.
 * Dead birds are handled but loot is recovered only by dropRavenLoot.
 */
export function tickRaven(g,e,dt) {
  if (!bird(e)) return false;
  if (e.faction==='ally') return false;
  if (!e.raven) {
    // Main should spawn through the API. Old/plain event actors can still safely
    // acquire standalone JSON state without creating another flock or actor.
    const template=newBird(g,{id:`raven:legacy:${e.id}`,group:e.group,kind:e.kind,murder:false,unreachableFor:0,
      refillIn:60,anchor:bounded(g,e),hp:e.maxHp || e.hp || 36,speed:e.speed ?? 100,damage:e.damage ?? 8,aggroRange:190,disengageRange:420},0);
    if (!template) return true;
    e.raven=template.raven;
  }
  e.moving=false;
  if (e.hp<=0) return true;
  dt=Math.max(0,finite(dt,0));
  if (g.phase && g.phase!=='play' || g.openingBoard || g.paused) return true;
  for (const key of ['flash','hit','attack','cooldown','frozen','healEffect','summonPulse']) e[key]=Math.max(0,(e[key]||0)-dt);
  const s=e.raven;
  // Cache age is time-based even when an attack/recovery stops movement.
  if (s.route) s.route.ttl=Math.max(0,s.route.ttl-dt);
  if (s.failedRoutes) s.failedRoutes=s.failedRoutes.map(r=>({...r,ttl:r.ttl-dt})).filter(r=>r.ttl>0);
  if (e.frozen>0 || e.stunned>0) return true;
  if (e.state==='snared') {e.timer=Math.max(0,(e.timer||0)-dt);if (!e.timer)e.hp=0;return true;}
  s.phaseTime+=dt;
  const visible=(g.players || []).filter(p=>enemyCanSeeTarget(e,p));
  manageFlock(g,e,dt,visible);
  const f=s.flock;
  let target=null,best=Infinity;
  for (const p of visible) {
    const d=distance(e,p),range=f.murder?Infinity:e.aggro?f.disengageRange:f.aggroRange;
    if (d<=range && d<best) {target=p;best=d;}
  }
  if (target && !routeTo(g,e,target)) {
    const alternatives=visible.filter(p=>p!==target && distance(e,p)<=(f.murder?Infinity:e.aggro?f.disengageRange:f.aggroRange))
      .sort((a,b)=>distance(e,a)-distance(e,b));
    for (const p of alternatives) if (routeTo(g,e,p)) {target=p;best=distance(e,p);break;}
  }
  if (!target) {
    if (e.aggro) {s.perch=choosePerch(g,e,f.anchor,e.id,s.perch) || s.perch;setPhase(e,'fly');s.route=null;}
    e.aggro=false;s.targetId=null;e.attack=0;
    idle(g,e,dt);return true;
  }
  e.aggro=true;s.targetId=target.id;s.lootTargetId=null;s.relocateIn=60;
  if (!airborne(e,dt,24)) {e.state='hunt';return true;}
  if (s.phase==='attack') {
    e.state='attack';
    if (s.phaseTime>=.24) {
      if (distance(e,target)<=34 && segmentClear(g,e,e,target)) g.hurt?.(target,e.damage,e);
      e.cooldown=1.1;e.attack=.15;setPhase(e,'recover');
    }
    return true;
  }
  if (s.phase==='recover' && s.phaseTime<.3) {e.state='recover';return true;}
  setPhase(e,'fly');e.state='hunt';
  if (best<=34 && e.cooldown<=0 && segmentClear(g,e,e,target)) {setPhase(e,'attack');e.attack=.24;e.state='attack';return true;}
  if (best>24) move(g,e,target,dt);
  return true;
}

/** Invoke once in the death path, including friendly deaths, before actor removal.
 * Returns true only when a carried drop was recovered. The JSON flag guards
 * duplicate core/death callbacks and reloads; original item metadata is retained.
 */
export function dropRavenLoot(g,e) {
  if (!bird(e) || !e.raven || e.hp>0 || e.raven.lootDropped) return false;
  const s=e.raven,l=s.carrying;
  if (!l) {s.lootDropped=true;return false;}
  const p=freeSpot(g,e,e,0,true) || bounded(g,e);
  const recovered={...clone(l),id:nextId(g),...p,source:'Recovered from '+e.kind,manualPickup:true};
  g.loot ||= [];
  g.loot.push(recovered);
  s.carrying=null;s.lootDropped=true;
  g.onSound?.('drop',recovered);g.persist?.();
  return true;
}
