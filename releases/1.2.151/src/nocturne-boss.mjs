import {DEFAULT_APPEARANCE} from './appearance.mjs';
import {ITEMS} from './items.mjs';
import {clearShot,navigateEnemy} from './navigation.mjs';
import {rangedLaunchOrigin} from './ranged-launch.mjs';

export const NOCTURNE_BOSS_ANCHOR=Object.freeze({x:9548,y:4889});
export const NOCTURNE_BOSS_AGGRO_RANGE=100;
export const NOCTURNE_BOSS_DEATH_TIME=2.6;
const LOOT_SOURCE='Nocturne court rewards';
const COURT_RANGE=260;
const LORD={...NOCTURNE_BOSS_ANCHOR,name:'Voldemort',nocturneBossRole:'lord',boss:true,maxHp:360,damage:31,speed:84,cooldown:.7,
 appearance:{...DEFAULT_APPEARANCE,skin:'#d5d3c9',hair:'none',shirt:'#171d1c',pants:'#181c20',shoes:'#1b2021'},
 equipment:{hand1:'dark_lord_wand',chest:'nocturne_lord_robe',cape:'warlock_cape',pants:'warlock_trousers',feet:'warlock_boots'}};
const MINIONS=[
 {x:9510,y:4927,mask:'death_eater_iron_mask',cooldown:1.3},
 {x:9589,y:4919,mask:'death_eater_ivory_mask',cooldown:1.9},
];
const TAUNTS=[
 {threshold:.9,text:'You mistake an open door for a safe one.'},
 {threshold:.6,text:'Still standing? Then I shall have to be more precise.'},
 {threshold:.3,text:'The shadows will remember who held this wand.'},
];
const idleLord={...LORD,id:'nocturne-lord',kind:'player',sprite:'player',hp:1,faceX:0,faceY:1,unattackable:true,nocturneBossWaiting:true};
const inCourt=g=>g.trainTest?.design.activeRoom==='diagon';
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);

function engage(g,player){
 const group=g.nextId;
 const add=spec=>{
  const span=distance(spec,player)||1;
  return {...structuredClone(spec),id:g.nextId++,group,kind:'skeleton_wizard',sprite:'player',faction:'enemy',
   hp:spec.maxHp,state:'hunt',aggro:true,faceX:(player.x-spec.x)/span,faceY:(player.y-spec.y)/span,
   attack:0,step:0,flash:0,timer:0,tacticTime:0,homeX:spec.x,homeY:spec.y};
 };
 const lord=add(LORD);
 const minions=MINIONS.map(({x,y,mask,cooldown})=>add({x,y,cooldown,name:'Death Eater',nocturneBossRole:'minion',
  maxHp:104,damage:18,speed:74,mask,appearance:{...DEFAULT_APPEARANCE,skin:'#9e7e67',shirt:'#24232b',pants:'#24232b'},
  equipment:{head:mask,chest:'warlock_robe',cape:'warlock_cape',feet:'warlock_boots',hand1:'alley_ashwood_wand'}}));
 const actors=[lord,...minions];
 g.trainTest.nocturneBoss={actors,defeatedIds:[],claimedLootIds:[],thresholds:[],speechQueue:[],engagedAt:g.time};
 g.enemies.push(...actors);
 g.message?.('Voldemort raises his wand and summons two Death Eaters.');
 g.onSound?.('magic',lord);
 g.persist?.();
}

function queueTaunts(state,lord){
 let changed=false;
 for(const taunt of TAUNTS){
  if(lord.hp>lord.maxHp*taunt.threshold||state.thresholds.includes(taunt.threshold))continue;
  state.thresholds.push(taunt.threshold);
  state.speechQueue.push(taunt);
  changed=true;
 }
 return changed;
}

function advanceSpeech(g,state){
 if(state.speech?.until>g.time||!state.speechQueue.length)return;
 const line=state.speechQueue.shift();
 state.speech={...line,startedAt:g.time,until:g.time+2.45};
 g.message?.(`Voldemort · ${line.text}`);
}

export function tickNocturneBoss(g){
 if(!inCourt(g))return;
 const state=g.trainTest.nocturneBoss;
 if(!state){
  const player=g.players.find(p=>p.hp>0&&!p.room&&!p.trainRide&&!p.pirateRide&&
   distance(p,NOCTURNE_BOSS_ANCHOR)<=NOCTURNE_BOSS_AGGRO_RANGE&&clearShot(g,p,NOCTURNE_BOSS_ANCHOR));
  if(player)engage(g,player);
  return;
 }
 if(state.hibernatedAt!==undefined){
  const away=g.time-state.hibernatedAt;
  if(state.speech){state.speech.startedAt+=away;state.speech.until+=away;}
  if(state.death)state.death.startedAt+=away;
  for(const actor of state.actors)if(actor.castAt!==undefined)actor.castAt+=away;
  delete state.hibernatedAt;
 }
 let changed=false;
 for(const [index,saved] of state.actors.entries()){
  if(state.defeatedIds.includes(saved.id))continue;
  const actor=g.enemies.find(e=>e.id===saved.id&&e.nocturneBossRole===saved.nocturneBossRole)||saved;
  if(!g.enemies.includes(actor))g.enemies.push(actor);
  g.nextId=Math.max(g.nextId,actor.id+1);
  state.actors[index]=actor;
  if(actor.nocturneBossRole==='lord')changed=queueTaunts(state,actor);
 }
 advanceSpeech(g,state);
 if(changed)g.persist?.();
}

export function suspendNocturneBoss(g){
 const state=g.trainTest.nocturneBoss;
 if(state)state.hibernatedAt=g.time;
}

export function nocturneBossActors(g){
 if(!inCourt(g))return [];
 if(!g.trainTest.nocturneBoss)return [idleLord];
 return g.enemies.filter(e=>e.nocturneBossRole&&(e.hp>0||e.nocturneBossRole==='minion'&&(e.deathTimer||0)<1.2));
}

export function tickNocturneBossCaster(g,actor,target,dt,range){
 const lord=actor.nocturneBossRole==='lord';
 if(distance(target,NOCTURNE_BOSS_ANCHOR)>COURT_RANGE){
  actor.charge=0;
  delete actor.castAt;
  const home={x:actor.homeX,y:actor.homeY};
  if(distance(actor,home)>10)navigateEnemy(g,actor,home,dt);
  return;
 }
 if(range>235||!clearShot(g,actor,target)){
  actor.charge=0;
  delete actor.castAt;
  navigateEnemy(g,actor,target,dt);
  return;
 }
 actor.faceX=(target.x-actor.x)/range;
 actor.faceY=(target.y-actor.y)/range;
 const windup=lord?.44:.34;
 if(actor.castAt!==undefined){
  actor.charge=Math.max(0,Math.min(1.2,(1-(actor.castAt-g.time)/windup)*1.2));
  if(g.time<actor.castAt)return;
  delete actor.castAt;
  actor.charge=0;actor.attack=.36;actor.cooldown=lord?1.92:2.75;
  const origin=rangedLaunchOrigin(actor,g.time,'magic');
  const length=distance(origin,target)||1,speed=lord?258:222;
  const color=lord?(ITEMS.dark_lord_wand?.spellColor||'#74ec3b'):'#c898f1';
  g.spells.push({x:origin.x,y:origin.y,vx:(target.x-origin.x)/length*speed,vy:(target.y-origin.y)/length*speed,
   life:1.55,remaining:260,size:lord?10:7,damage:actor.damage,color,age:0,owner:actor.id,
   hostile:true,nocturneBossRole:actor.nocturneBossRole,visualSeed:g.nextId++});
  g.onSound?.('magic',actor);
  return;
 }
 if(actor.cooldown<=0){actor.castAt=g.time+windup;return;}
 if(range<64){
  g.moveActor(actor,-actor.faceX*38*dt,-actor.faceY*38*dt);
 }
}

export const isNocturneBossLoot=loot=>loot?.source===LOOT_SOURCE;

export function dropNocturneBossLoot(g,enemy){
 const state=g.trainTest?.nocturneBoss;
 if(!enemy.nocturneBossRole||!inCourt(g)||!state||enemy.hp>0||!state.actors.some(actor=>actor.id===enemy.id))return false;
 if(state.defeatedIds.includes(enemy.id))return true;
 state.defeatedIds.push(enemy.id);
 const drop=(type,qty,dx)=>g.dropLoot(enemy.x+dx,enemy.y+10,type,qty,LOOT_SOURCE,true);
 if(enemy.nocturneBossRole==='lord'){
  queueTaunts(state,enemy);
  advanceSpeech(g,state);
  state.death={x:enemy.x,y:enemy.y,faceX:enemy.faceX,faceY:enemy.faceY,startedAt:g.time,id:enemy.id};
  drop('dark_lord_wand',1,-12);
  drop('dark_essence',10,13);
 }else drop(enemy.mask,1,0);
 g.persist?.();
 return true;
}

export function collectNocturneBossLoot(g,player,loot){
 const state=g.trainTest?.nocturneBoss;
 if(!inCourt(g)||!state||!isNocturneBossLoot(loot)||state.claimedLootIds.includes(loot.id))return false;
 state.claimedLootIds.push(loot.id);
 const t=g.trainTest;
 if(!t.persistent&&t.returnPlayers?.some(p=>p.id===player.id)){
  const receipt=((t.alleyPurchases??={})[player.id]??={spent:0,gold:0,items:[],delta:{}});
  receipt.delta[loot.type]=(receipt.delta[loot.type]||0)+loot.qty;
 }
 return true;
}
