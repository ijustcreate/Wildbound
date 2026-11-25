import {count,give} from './items.mjs';
import {MOSSBELL_TRAIL,WILD_SLIME_HOLLOW as hollow} from './wild-slime-hollow-site.mjs';
import {WILD_SLIME_ENTRY_TIME,isWildSlimeChallenger,wildSlimeInArena} from './wild-slime-boss-combat.mjs';

const ADD_POSITIONS=[[-135,-74],[129,-67],[-148,74],[144,82]];
const REFILL_RANGE=35;
const RETREAT_GRACE=2;
const REWARD_SOURCE='Mossbell Hollow reward';

const inHollowScene=g=>g.trainTest?.design?.wildLands&&!g.trainTest.design.activeRoom&&!g.trainTest.wildLandsOverview;
const hollowState=t=>t.wildSlimeHollow??={checkpointPlayers:[],stockedPlayers:[],active:false,cleared:false};
const inReach=(p,point,range)=>Math.hypot(p.x-point.x,p.y-point.y)<=range;
const onFoot=p=>!p.room&&!p.trainRide&&!p.pirateRide&&!p.broomMount&&!p.vehicleId&&!p.swimming;

export function wildSlimeCheckpointPrompt(g,p){
 if(!inHollowScene(g)||!isWildSlimeChallenger(p)||p.jumpHeight>0||!inReach(p,hollow.checkpoint,REFILL_RANGE))return '';
 const state=g.trainTest.wildSlimeHollow;
 if(state?.cleared)return '';
 return state?.checkpointPlayers.includes(p.id)?'REST AT MOSSBELL LANTERN':'LIGHT MOSSBELL LANTERN';
}

function restock(g,state,p){
 if(state.stockedPlayers.includes(p.id)||count(p,'potion')>0)return '';
 if(!give(p.inventory,'potion')){g.inventoryFullNotice(p,'potion');return ' · Make space for a health potion.';}
 state.stockedPlayers.push(p.id);
 return ' · Health potion refilled.';
}

export function interactWildSlimeCheckpoint(g,p){
 if(!wildSlimeCheckpointPrompt(g,p))return false;
 const state=hollowState(g.trainTest);
 const knew=state.checkpointPlayers.includes(p.id);
 if(!knew)state.checkpointPlayers.push(p.id);
 const refill=restock(g,state,p);
 g.message((knew?'Mossbell Lantern · Checkpoint active.':'Mossbell Lantern lit · Checkpoint reached.')+refill);
 g.onSound(knew?'heal':'magic',p);
 g.persist?.();
 return true;
}

function spawnSlime(g,{role,x,y,variant,index,readyAt,party}){
 const boss=role==='boss';
 const enemy={id:g.nextId++,kind:'slime',skin:'slime',group:hollow.id,x,y,homeX:hollow.x,homeY:hollow.y,
  wildSlimeRole:role,wildSlimeReadyAt:readyAt,slimeBiome:boss?'temple':'forest',slimeVariant:variant,
  boss,state:'hunt',cooldown:boss?0:.52+index*.18,attack:0,flash:0,step:0,faceX:0,faceY:1,orbit:index%2?1:-1};
 g.configureCreature(enemy,false);
 const hp=boss?290+Math.min(3,party-1)*75:38;
 Object.assign(enemy,{faction:'enemy',hp,maxHp:hp,speed:boss?49:43,damage:boss?26:8});
 if(boss)Object.assign(enemy,{name:'Mireheart',hitRadius:35,unattackable:true});
 g.enemies.push(enemy);
}

function startAttempt(g,state,party){
 state.active=true;
 state.lastChallengedAt=g.time;
 const readyAt=g.time+WILD_SLIME_ENTRY_TIME;
 spawnSlime(g,{role:'boss',x:hollow.x-12,y:hollow.y+130,variant:2,index:0,readyAt,party});
 ADD_POSITIONS.forEach(([dx,dy],index)=>spawnSlime(g,{role:'add',x:hollow.x+dx,y:hollow.y+dy,variant:index%3,index,readyAt,party}));
 g.message('Mossbell Hollow · Mireheart stirs.');
}

function resetAttempt(g,state){
 state.active=false;
 state.stockedPlayers=[];
 delete state.lastChallengedAt;
 g.enemies=g.enemies.filter(enemy=>!enemy.wildSlimeRole);
}

export function tickWildSlimeHollow(g){
 if(!inHollowScene(g))return;
 const t=g.trainTest,state=t.wildSlimeHollow;
 if(state?.cleared)return;
 if(state?.active){
  if(g.players.some(p=>isWildSlimeChallenger(p)&&wildSlimeInArena(p,hollow)))state.lastChallengedAt=g.time;
  else if(g.time-state.lastChallengedAt>=RETREAT_GRACE){
   resetAttempt(g,state);
   g.persist?.();
  }
  return;
 }
 const challengers=g.players.filter(p=>isWildSlimeChallenger(p)&&wildSlimeInArena(p,hollow));
 if(!challengers.some(p=>inReach(p,hollow,hollow.radius-45)))return;
 startAttempt(g,hollowState(t),challengers.length);
 g.persist?.();
}

export function dropWildSlimeHollowLoot(g,enemy){
 if(!enemy.wildSlimeRole)return false;
 const state=g.trainTest?.wildSlimeHollow;
 if(!state?.active||state.cleared)return true;
 if(g.enemies.some(e=>e.wildSlimeRole&&!e.defeated)){
  if(enemy.wildSlimeRole==='boss'&&g.enemies.some(e=>e.wildSlimeRole==='add'&&e.hp>0))
   g.message('Mireheart fell. Clear the remaining slimes.');
  return true;
 }
 state.active=false;
 state.cleared=true;
 delete state.lastChallengedAt;
 state.reward=g.dropLoot(hollow.x,hollow.y,'amber_reliquary',1,REWARD_SOURCE,true);
 g.message('Mireheart defeated. The Amber reliquary lies in Mossbell Hollow.');
 g.persist?.();
 return true;
}

export function recordWildSlimeHollowPickup(g,loot){
 const state=g.trainTest?.wildSlimeHollow;
 if(loot.source===REWARD_SOURCE&&state?.reward?.id===loot.id)delete state.reward;
}

export function returnToWildSlimeCheckpoint(g){
 if(!inHollowScene(g))return false;
 const state=g.trainTest.wildSlimeHollow;
 if(!state?.active||state.cleared)return false;
 const downed=g.players.filter(p=>p.hp<=0&&onFoot(p)&&wildSlimeInArena(p,hollow));
 if(!downed.some(p=>state.checkpointPlayers.includes(p.id)))return false;
 resetAttempt(g,state);
 const approach=MOSSBELL_TRAIL.slice(0,MOSSBELL_TRAIL.indexOf(hollow.checkpointApproach)+1).reverse();
 for(const [index,p] of downed.entries()){
  const position=approach[index]??hollow.checkpointApproach;
  Object.assign(p,{x:position.x,y:position.y,faceX:0,faceY:-1,
   jumpHeight:0,jumpVelocity:0,groundHeight:0,underBridge:false,trainGround:0,moving:false,ui:null});
  if(state.checkpointPlayers.includes(p.id))restock(g,state,p);
 }
 return true;
}
