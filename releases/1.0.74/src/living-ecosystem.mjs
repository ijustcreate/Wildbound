import { footprintHit, terrainHash } from './world.mjs';
import {forestDecor} from './forest.mjs';
import {give,take,clearSlot,ITEMS,migrateLegacySupplies} from './items.mjs';
import {CRITTER_CONTAINERS,critterContainer} from './critter-containers.mjs';
import {seedCoastalCritters,tickCoastalCritter,nearbyFishWater,drawCoastalCritter} from './coastal-critters.mjs';
import { propBase, waterAt } from './environment.mjs';
import { nearbyScenery } from './performance.mjs';

/** Parent integration (world coordinates, seconds):
 * initLivingEcosystem(game) after world creation/restore; updateLivingEcosystem(game, dt)
 * during unpaused play. OR livingEcosystemBlocked(game,x,y,radius,flying,footOffset)
 * into Game.blocked; invoke cutLivingVines(game,player) on melee AND interact
 * (no tool/stamina requirement). Draw drawLivingEcosystem(ctx,game,'ground') before
 * actors and 'air' after actors, inside the world camera transform, never room UI.
 * game.livingEcosystem is versioned pure data, captured by the current snapshot().
 * Init again after replacing terrain/scenery even if biome/seed did not change.
 * No monkey patches, loot creation, enemy spawning, or timer/persist side effects.
 * Update/cut return true for a structural change; parent may schedule persistence.
 */
export const LIVING_LIMITS = Object.freeze({ vines: 24, animals: 18, growthSeconds: 45 });
const runtime = new WeakMap();
export const releasedCritters = g => (runtime.get(g)?.animals || []).filter(a=>a.releasedOwner!=null);
const biomes = ['forest', 'temple', 'house', 'ice', 'desert'];
const finite = (v, fallback = 0) => Number.isFinite(v) ? v : fallback;
const biome = g => g.generatedEnvironment || g.environment || 'forest';
const inside = (r, x, y, pad = 0) => x >= r.x-pad && y >= r.y-pad && x <= r.x+r.w+pad && y <= r.y+r.h+pad;
const distance = (a,b) => Math.hypot(a.x-b.x,a.y-b.y);
const outdoors = (g,x,y) => biome(g) !== 'house' || !(g.house?.floors || []).some(r=>inside(r,x,y,12));

function protectedSpot(g,x,y) {
  // Continuous escape lanes, including every river bridge and the temple entrance.
  if (Math.abs(x-800)<96 || [272,784,1296].some(v=>Math.abs(y-v)<64)) return true;
  if (Math.hypot(x-800,y-800)<210) return true;
  if (biome(g)==='temple' && Math.hypot(x-1040,y-590)<100) return true;
  if ((g.house?.doors || []).some(r=>inside(r,x,y,64))) return true;
  return (g.portals || []).some(p=>Math.hypot(x-p.x,y-p.y)<80);
}
function openSpot(g,x,y,radius=18) {
  if(x<48||x>1552||y<48||y>1552||!outdoors(g,x,y))return false;
  if(['water','shallow','bridge','floodbridge','quicksand'].includes(waterAt(g,x,y)))return false;
  // Match Game.blocked's foot coordinates, without calling the parent's hooked method.
  if(Math.abs(x-800)<100+radius&&Math.abs(y-800)<64+radius)return false;
  if([...(g.house?.walls||[]),...(g.house?.doors||[]),...(g.house?.furniture||[])].some(r=>inside(r,x,y,radius)))return false;
  return !nearbyScenery(g.scenery||[],x,y,radius).some(p=>footprintHit(p,g.spriteLibrary?.[p.kind],x,y,radius));
}
function occupied(g,v) {
  return [...(g.players||[]),...(g.enemies||[])].some(a=>!a.room&&a.hp>0&&Math.hypot(a.x-v.x,a.y+14-v.y)<70);
}
function vineProp(v) {
  // Reuse the exact procedural rock footprint: base is at the vine's ground Y.
  return {kind:'rock',procedural:true,size:48,x:v.x,y:v.y-48*.19};
}
function sites(g) {
  if(!['forest','temple'].includes(biome(g)))return [];
  const out=[];
  // Separated patches of up to three local segments: no spreading frontier.
  for(let i=0;i<160&&out.length<LIVING_LIMITS.vines;i++) {
    const x=80+Math.floor(terrainHash(i+finite(g.seed),31)*44)*32;
    const y=80+Math.floor(terrainHash(i+finite(g.seed),73)*44)*32;
    if(out.some(v=>Math.hypot(x-v.x,y-v.y)<130))continue;
    for(let j=0;j<3;j++) {
      const px=x+(j-1)*28, py=y+(j%2)*8;
      if(!protectedSpot(g,px,py)&&openSpot(g,px,py))
        out.push({id:`vine:${i}:${j}`,x:px,y:py,size:48,kind:'living_vine',procedural:true,stage:0,cut:false});
    }
  }
  return out.slice(0,LIVING_LIMITS.vines);
}

/** Explicit initialization also validates saved state; saved coordinates are never trusted. */
export function initLivingEcosystem(g) {
  const old=g.livingEcosystem;
  const compatible=old?.version===1&&old.biome===biome(g)&&old.seed===finite(g.seed);
  const saved=new Map((compatible&&Array.isArray(old.vines)?old.vines:[]).slice(0,24).map(v=>[v?.id,v]));
  const vines=sites(g).map(v=>{
    const prior=saved.get(v.id);
    v.cut=prior?.cut===true;
    v.stage=v.cut?0:Math.max(0,Math.min(3,Math.floor(finite(prior?.stage))));
    return v;
  });
  const state=g.livingEcosystem={version:1,biome:biome(g),seed:finite(g.seed),
    growth:compatible?Math.max(0,Math.min(44.999,finite(old.growth))):0,vines,caught:compatible?(old.caught||[]).filter(id=>Number.isInteger(id)&&id>=0&&id<18):[]};
  const animals=[];
  if(biome(g)==='beach')animals.push(...seedCoastalCritters(g,LIVING_LIMITS.animals));
  if(biomes.includes(biome(g))) {
    const species=biome(g)==='ice'?['white_mouse','fairy']:['dragonfly','frog','bird','scavenger'];
    for(let i=0;i<180&&animals.length<LIVING_LIMITS.animals;i++) {
      const x=64+terrainHash(i+finite(g.seed),93)*1472, y=64+terrainHash(i+finite(g.seed),117)*1472;
      if(!openSpot(g,x,y,5))continue;
      animals.push({id:animals.length,kind:species[animals.length%species.length],x,y,homeX:x,homeY:y,phase:terrainHash(i,4)*6.28});
    }
  }
  const banks=[];
  for(let ty=1;ty<49;ty++)for(let tx=1;tx<49;tx++){
   const x=tx*32+16,y=ty*32+16;
   if(openSpot(g,x,y,5)&&[[32,0],[-32,0],[0,32],[0,-32]].some(([dx,dy])=>['water','shallow'].includes(waterAt(g,x+dx,y+dy))))banks.push({x,y});
  }
  for(const a of animals.filter(a=>a.kind==='frog')){const bank=banks[(a.id*17)%banks.length];if(bank)Object.assign(a,{...bank,homeX:bank.x,homeY:bank.y,wait:a.phase});}
  runtime.set(g,{state,animals:animals.filter(a=>(a.kind!=='frog'||banks.length)&&!state.caught.includes(a.id)),time:0,attractionIn:0,targets:new Map()});
  return state;
}
function ensure(g) {
  let r=runtime.get(g);
  if(!r||r.state!==g.livingEcosystem||r.state.biome!==biome(g)||r.state.seed!==finite(g.seed)) {
    initLivingEcosystem(g);r=runtime.get(g);
  }
  return r;
}

/** Bounded, read-only attraction points; these never consume items or damage wildlife. */
export function livingAttractions(g) {
  const plants=(g.scenery||[]).filter(p=>!p.depleted&&!p.falling&&['flower','fern','tree','palm','frost_shrub'].includes(p.kind))
    .slice(0,64).map(p=>({...propBase(p),kind:'plant'}));
    const food=(g.loot||[]).filter(p=>!p.room&&['meat','fruit','frost_berry','coconut','berry'].includes(p.type)).slice(0,24);
  const carrion=(g.enemies||[]).filter(p=>p.hp<=0&&!p.room).slice(0,12);
  return {plants,food,carrion};
}
export function updateLivingEcosystem(g,dt) {
  const r=ensure(g),s=r.state;
  if(g.phase!=='play'||!Number.isFinite(dt)||dt<=0)return false;
  // No offline catch-up burst. A delayed frame advances at most one second.
  dt=Math.min(dt,1);r.time=(r.time+dt)%3600;s.growth+=dt;
  let changed=false;
  if(s.growth>=LIVING_LIMITS.growthSeconds) {
    s.growth-=LIVING_LIMITS.growthSeconds;
    const v=s.vines.find(v=>!v.cut&&v.stage<3&&!occupied(g,v)&&!protectedSpot(g,v.x,v.y)&&openSpot(g,v.x,v.y));
    if(v){v.stage++;changed=true;}
  }
  r.attractionIn-=dt;
  if(r.attractionIn<=0) {
    // Transient cache only: scan the world and choose targets four times/second.
    // Targets reference live animals/items; plants are cheap positional snapshots.
    r.attractionIn=.25;r.attractions=livingAttractions(g);
    const {plants,food,carrion}=r.attractions;
    const insects=r.animals.filter(a=>a.kind==='dragonfly');
    const prey=[...insects,...r.animals.filter(a=>a.kind==='frog')];
    const scraps=[...carrion,...food];
    for(const a of r.animals) {
      const options=a.kind==='frog'?insects:a.kind==='bird'?prey:a.kind==='scavenger'?scraps:a.kind==='white_mouse'?food:plants;
      let target=null,nearest=240;
      for(const p of options) {
        if(!Number.isFinite(p.x)||!Number.isFinite(p.y)||!outdoors(g,p.x,p.y))continue;
        const d=distance(a,p);if(d<nearest){nearest=d;target=p;}
      }
      r.targets.set(a.id,target);a.targetKind=target?(target.kind||'food'):null;
    }
  }
  for(const a of r.animals) {
    if(['crab','fish'].includes(a.kind)){
      const owner=a.releasedOwner!=null?g.players.find(p=>p.id===a.releasedOwner&&p.hp>0&&!p.room):null;
      tickCoastalCritter(g,a,dt,r.time,owner&&Math.hypot(owner.x-a.x,owner.y-a.y)>25?owner:null);continue;
    }
    if(a.releasedOwner!=null){
      const owner=g.players.find(p=>p.id===a.releasedOwner);
      if(owner&&!owner.room){const dx=owner.x-a.x,dy=owner.y+14-a.y,d=Math.hypot(dx,dy),step=Math.min(Math.max(0,d-22),dt*85);
        if(d>280){a.x=owner.x-18;a.y=owner.y+18;}else if(d>22){const x=a.x+dx/d*step,y=a.y+dy/d*step;if(!g.blocked?.(x,y,3,false,true)){a.x=x;a.y=y;}}
        a.hopHeight=a.kind==='frog'&&step>0?Math.abs(Math.sin(r.time*9+a.phase))*8:0;
      }continue;
    }
    if(a.kind==='frog'){tickFrog(g,a,dt,r.time);continue;}
    // Wildlife is never a combat target, but it should feel alive when the
    // party or a hostile creature approaches. Use a soft steering force so
    // critters drift away instead of teleporting or panicking in a straight
    // line.
    const threats = [...(g.players || []), ...(g.enemies || [])]
      .filter(t => !t.room && t.hp > 0)
      .map(t => ({ t, d: Math.hypot(t.x - a.x, t.y + 10 - a.y) }))
      .filter(v => v.d < 150)
      .sort((x, y) => x.d - y.d);
    const threat = threats[0];
    if (threat) {
      const dx = a.x - threat.t.x, dy = a.y - (threat.t.y + 10), length = Math.hypot(dx, dy) || 1;
      const urgency = Math.max(0, Math.min(1, (150 - threat.d) / 150));
      const speed = (a.kind === 'dragonfly' || a.kind === 'fairy' ? 58 : a.kind === 'frog' ? 44 : 38) * (0.7 + urgency * 0.8);
      a.fleeing = true;
      a.fleeX = dx / length * speed;
      a.fleeY = dy / length * speed;
      a.vx = finite(a.vx) + (a.fleeX - finite(a.vx)) * Math.min(1, dt * 4);
      a.vy = finite(a.vy) + (a.fleeY - finite(a.vy)) * Math.min(1, dt * 4);
      const fleeX = a.x + a.vx * dt, fleeY = a.y + a.vy * dt;
      if (openSpot(g, fleeX, fleeY, 4) && !livingEcosystemBlocked(g, fleeX, fleeY, 4, ['dragonfly','bird','fairy'].includes(a.kind), 0)) {
        a.x = fleeX; a.y = fleeY;
      }
      continue;
    }
    a.fleeing = false;
    a.vx = finite(a.vx) * Math.max(0, 1 - dt * 2.5);
    a.vy = finite(a.vy) * Math.max(0, 1 - dt * 2.5);
    const target=r.targets.get(a.id);
    const t=r.time+a.phase, goal=target||{x:a.homeX+Math.sin(t*.19)*32,y:a.homeY+Math.cos(t*.17)*24};
    // Orbit the attraction instead of stacking animals on one pixel.
    const dx=goal.x+Math.sin(t*.9+a.id)*12-a.x,dy=goal.y+Math.cos(t*.7+a.id)*10-a.y;
    const length=Math.hypot(dx,dy)||1,step=Math.min(length,dt*(a.kind==='frog'?8:18));
    const x=a.x+dx/length*step,y=a.y+dy/length*step;
    if(openSpot(g,x,y,4)&&!livingEcosystemBlocked(g,x,y,4,false,0)){a.x=x;a.y=y;}
  }
  return changed;
}

/** Input x/y match Game.blocked; flying creatures bypass vines. Read-only. */
export function livingEcosystemBlocked(g,x,y,radius=8,flying=false,footOffset=14) {
  if(flying||g.phase==='won')return false;
  const s=g.livingEcosystem;
  if(s?.biome!==biome(g)||s.seed!==finite(g.seed))return false;
  return (s.vines||[]).some(v=>v.stage>=2&&!v.cut&&!protectedSpot(g,v.x,v.y)&&
    footprintHit(vineProp(v),null,x,y+footOffset,radius));
}
/** One nearest facing segment per action; always free, cuts buds as well as blockers. */
export function cutLivingVines(g,p,range=64) {
  if(g.phase!=='play'||!p||p.room||p.hp<=0)return false;
  const s=ensure(g).state,fx=finite(p.faceX,1),fy=finite(p.faceY);
  const reach=Math.max(24,Math.min(96,finite(range,64)));
  const hit=s.vines.filter(v=>!v.cut&&v.stage>0).map(v=>({v,dx:v.x-p.x,dy:v.y-(p.y+14)}))
    .filter(h=>Math.hypot(h.dx,h.dy)<=reach&&(h.dx*fx+h.dy*fy)>=0)
    .sort((a,b)=>Math.hypot(a.dx,a.dy)-Math.hypot(b.dx,b.dy))[0];
  if(!hit)return false;
  hit.v.cut=true;hit.v.stage=0;return true;
}

/** Snapshot for optional depth sorting/debugging. Animals are ambient, never core actors. */
export function livingAnimals(g) {return (runtime.get(g)?.animals||[]).map(a=>({...a}));}

/** Procedural, integer pixel sprites. ctx is an ordinary CanvasRenderingContext2D. */
export function drawLivingEcosystem(c,g,layer='all') {
  const r=runtime.get(g);if(!r||r.state!==g.livingEcosystem||r.state.biome!==biome(g)||g.phase==='won')return;
  const ground=layer==='all'||layer==='ground',air=layer==='all'||layer==='air';
  c.save();
  const pixel=(x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,h);};
  if(ground)for(const v of r.state.vines) {
    if(v.cut){pixel(v.x-3,v.y-2,6,3,'#9b8252');continue;}
    if(!v.stage)continue;
    const width=v.stage*6;
    pixel(v.x-width,v.y-3,width*2,5,'#233d2a');
    for(let n=-width;n<=width;n+=3) {
      const y=v.y-4-Math.round(Math.sin(n*.35+v.x)*3);
      pixel(v.x+n,y,4,3,'#4f7841');pixel(v.x+n,y,2,1,'#a5bc64');
      if(n%2===0){pixel(v.x+n-2,y-4,5,3,'#688d49');pixel(v.x+n+2,y+3,4,2,'#355c35');}
    }
  }
  for(const a of r.animals) {
    const flying=['dragonfly','bird','fairy'].includes(a.kind);
    if(flying?!air:!ground)continue;
    if(['crab','fish'].includes(a.kind)){drawCoastalCritter(c,a,r.time);continue;}
    const x=Math.round(a.x),y=Math.round(a.y-(a.hopHeight||0)),flap=Math.sin(r.time*16+a.phase)>0?2:-1;
    pixel(x-3,y+2,7,2,'#20352b55');
    if(a.kind==='dragonfly'||a.kind==='fairy') {
      const fairy=a.kind==='fairy',yy=y-10-Math.round(Math.sin(r.time*3+a.phase)*2);
      pixel(x-6,yy-flap,5,2,fairy?'#dce4ff':'#b8e7d7');pixel(x+2,yy+flap,5,2,fairy?'#f4dcff':'#d1f1e4');
      pixel(x,yy-2,2,7,fairy?'#a992e3':'#467e9b');pixel(x,yy-3,2,2,'#fff0b4');
      if(fairy)pixel(x+7,yy+6,1,1,'#ffffff');
    } else if(a.kind==='frog') {
      if(a.swimming&&!a.hop){c.strokeStyle='#a0cac088';c.lineWidth=1;c.beginPath();c.ellipse(x,y+1,8,3,0,0,7);c.stroke();pixel(x-4,y-2,8,3,'#417b52');pixel(x-4,y-4,2,2,'#dee6a2');pixel(x+2,y-4,2,2,'#dee6a2');pixel(x-6,y+2,3,1,'#749968');pixel(x+4,y+2,3,1,'#749968');continue;}
      pixel(x-5,y-2,10,4,'#3c7040');pixel(x-3,y-4,6,4,'#88aa54');
      pixel(x-4,y-5,2,2,'#e6dc87');pixel(x+2,y-5,2,2,'#e6dc87');pixel(x-6,y+1,3,2,'#628348');pixel(x+3,y+1,3,2,'#628348');
    } else if(a.kind==='bird') {
      pixel(x-3,y-10,7,4,'#b08b50');pixel(x-8,y-11-flap,6,2,'#5d6954');pixel(x+3,y-11-flap,6,2,'#5d6954');pixel(x+4,y-10,3,1,'#efcb78');
    } else {
      const mouse=a.kind==='white_mouse';
      pixel(x-8,y,5,1,mouse?'#d7b4c1':'#75614d');pixel(x-4,y-4,9,5,mouse?'#f8faf7':'#807765');
      pixel(x+2,y-6,3,3,mouse?'#e5bac6':'#ac9e82');pixel(x+4,y-3,1,1,'#292e38');
      pixel(x-3,y+1,2,1,mouse?'#dabac8':'#3f423b');
    }
  }
  c.restore();
}

function tickFrog(g,a,dt,time){
 if(a.hop){const h=a.hop;h.t=Math.min(1,h.t+dt/.55);a.x=h.x+(h.tx-h.x)*h.t;a.y=h.y+(h.ty-h.y)*h.t;a.hopHeight=Math.sin(h.t*Math.PI)*12;if(h.t===1){a.hop=null;a.hopHeight=0;a.pad=h.pad;a.swimming=!a.pad&&['water','shallow'].includes(waterAt(g,a.x,a.y));a.wait=1.3+terrainHash(time,a.id)*2;}return;}
 a.wait=(a.wait||0)-dt;const threat=(g.players||[]).find(p=>!p.room&&p.hp>0&&Math.hypot(p.x-a.x,p.y-a.y)<48);if(a.wait>0&&!threat)return;
 const water=['water','shallow'].includes(waterAt(g,a.x,a.y)),pads=forestDecor(g).banks.filter(p=>p.kind==='lily'&&Math.hypot(p.x-a.x,p.y-a.y)<80);
 const choices=[...pads.map(p=>({...p,pad:true})),{x:a.homeX,y:a.homeY},...Array.from({length:8},(_,i)=>{const angle=i*Math.PI/4;return{x:a.x+Math.cos(angle)*32,y:a.y+Math.sin(angle)*32};})];
 const valid=choices.filter(p=>Math.hypot(p.x-a.x,p.y-a.y)>8&&Math.hypot(p.x-a.homeX,p.y-a.homeY)<110&&Array.from({length:8},(_,n)=>(n+1)/8).every(t=>!g.blocked?.(a.x+(p.x-a.x)*t,a.y+(p.y-a.y)*t,3,false,true,false,0))&&(['water','shallow'].includes(waterAt(g,p.x,p.y))||openSpot(g,p.x,p.y,3)));
 valid.sort((a,b)=>{const score=p=>(threat?(['water','shallow'].includes(waterAt(g,p.x,p.y))?100:0):p.pad?50:water&&!['water','shallow'].includes(waterAt(g,p.x,p.y))?35:0)+terrainHash(p.x+time,p.y)*40;return score(b)-score(a);});
 if(valid[0])a.hop={x:a.x,y:a.y,tx:valid[0].x,ty:valid[0].y,pad:valid[0].pad,t:0};else a.wait=1;
}
export function catchCritter(g,p){
 if(![p.equipment?.hand1,p.equipment?.hand2].includes('critter_net'))return false;
 const r=ensure(g),a=r.animals.filter(a=>Math.hypot(a.x-p.x,a.y-p.y)<46&&(a.x-p.x)*(p.faceX||0)+(a.y-p.y)*(p.faceY||0)>=-8).sort((a,b)=>distance(a,p)-distance(b,p))[0];
 if(!a){g.message('No critter within reach.');return true;}
 const preferred=critterContainer(a.kind),copy=structuredClone(p.inventory);migrateLegacySupplies(copy);
 const containers=[preferred,...CRITTER_CONTAINERS.filter(c=>c!==preferred)];
 const consume=list=>{for(const type of containers){if(take(list,type))return type;}for(const item of list||[])if(ITEMS[item?.type]?.bag&&item.contents){const found=consume(item.contents);if(found)return found;}return null;};
 const container=consume(copy);
 if(!container){g.message('You need an empty critter bottle/jar or travel cage in your backpack. Filled containers cannot be reused.');return true;}
 if(!give(copy,'caught_'+a.kind,1,24,{captureContainer:container})){g.message('Make space for your new passenger. Nothing was consumed.');return true;}
 p.inventory=copy;if(a.releasedOwner==null)r.state.caught.push(a.id);r.animals=r.animals.filter(b=>b!==a);p.attack=p.attackDuration=.34;p.attackClip='punch';g.message('Caught '+a.kind+'! Packed in your '+(container==='empty_jar'?'bottle.':'travel cage.'));g.persist?.();return true;
}
export function releaseCritter(g,p,index){
 const item=p.inventory[index];if(!item?.type?.startsWith('caught_')||p.room)return false;
 const kind=item.type.slice(7),container=critterContainer(item.type,item),copy=structuredClone(p.inventory),water=kind==='fish'?nearbyFishWater(g,p):null;
 if(kind==='fish'&&!water){p.ui.notice='Release your fish beside deep water. Nothing was consumed.';return true;}
 if(--copy[index].qty===0)clearSlot(copy,index);
 if(!give(copy,container,1)){p.ui.notice='Make room for the empty container first.';return true;}
 p.inventory=copy;const r=ensure(g),spot=water||{x:p.x+18,y:p.y+18};r.animals.push({id:'released-'+p.id+'-'+(g.nextId++),kind,...spot,homeX:spot.x,homeY:spot.y,phase:r.time,releasedOwner:p.id,hopHeight:0});
 p.ui.notice='Released! Your critter follows for this level. Catch it again before quitting.';g.uiRevision=(g.uiRevision||0)+1;g.persist?.();return true;
}
