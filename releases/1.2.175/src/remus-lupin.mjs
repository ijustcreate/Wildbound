import {DEFAULT_APPEARANCE} from './appearance.mjs';
import {HOGSMEADE_BUILDINGS,HOGSMEADE_SHACK,hogsmeadeDoor,inHogsmeadeBuilding} from './hogsmeade-layout.mjs';
import {DAY_LENGTH} from './night-cycle.mjs';
import {tickNightEnemy} from './night-enemies.mjs';
import {clearShot} from './navigation.mjs';
import {hostileEnemy,tickEnemyFlinch} from './enemy-systems.mjs';

export const LUPIN_MIDNIGHT=375;
export const LUPIN_DAWN=450;
const door=hogsmeadeDoor(HOGSMEADE_SHACK);
export const LUPIN_OUTSIDE=Object.freeze({x:door.x+39,y:door.y+31});
const threshold={x:door.x,y:door.y+16},inside={x:door.x,y:door.y-29};
const patrol=[
 {x:door.x+70,y:door.y+51},{x:door.x+91,y:door.y+93},
 {x:door.x-5,y:door.y+111},{x:door.x-103,y:door.y+91},{x:door.x-66,y:door.y+38},
];
const human=Object.freeze({id:'remus-lupin',name:'Remus Lupin',title:'Defence Against the Dark Arts',
 kind:'player',sprite:'player',hp:1,maxHp:1,unattackable:true,faceX:.2,faceY:1,
 appearance:{...DEFAULT_APPEARANCE,hair:'sidepart',hairColor:'#695446',face:'scar',skin:'#c59c81',
  shirt:'#75615d',pants:'#514842',shoes:'#352d31',facialHair:'stubble'},
 equipment:{back:'alley_lantern_mantle'}});
const outdoor=g=>g.trainTest?.design.wildLands&&!g.trainTest.design.activeRoom;
const guest=p=>p?.hp>0&&!p.room&&!p.trainRide&&!p.pirateRide&&!p.swimming&&!p.underBridge;
const shieldedByBuilding=p=>HOGSMEADE_BUILDINGS.some(site=>inHogsmeadeBuilding(site,p.x,p.y,-4));
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const nearShack=p=>guest(p)&&dist(p,door)<650;
const dayNumber=g=>Math.floor((g.sky?.elapsed||0)/DAY_LENGTH);
const hour=g=>(g.sky?.elapsed||0)%DAY_LENGTH;
const moonUp=g=>hour(g)>=LUPIN_MIDNIGHT&&hour(g)<LUPIN_DAWN;
const progress=g=>g.trainTest?.hogsmeade?.remusLupin;
const writable=g=>((g.trainTest.hogsmeade??={}).remusLupin??={form:'human'});
const aliveWolf=e=>e?.lupinWerewolf&&e.hp>0&&!e.lupinDisappeared;

export function lupinNpc(g){
 if(!outdoor(g))return null;
 const state=progress(g);
 if(state?.form==='wolf'||state?.form==='returning')return null;
 if(state?.form==='sheltered')return {...human,...inside,building:HOGSMEADE_SHACK.id};
 if(state?.form==='injured')return {...human,x:state.x,y:state.y,injured:true,animationAction:'revive',poseTime:.75};
 if(moonUp(g)&&state?.night!==dayNumber(g))return null;
 return {...human,...LUPIN_OUTSIDE};
}

export function nearbyLupin(g,p,reach=58){
 const npc=lupinNpc(g);
 if(!npc||!guest(p)||dist(p,npc)>=reach)return null;
 const onInside=inHogsmeadeBuilding(HOGSMEADE_SHACK,p.x,p.y,-4);
 if(onInside!==inHogsmeadeBuilding(HOGSMEADE_SHACK,npc.x,npc.y,-4))return null;
 return clearShot(g,p,npc,2)?npc:null;
}

export function lupinDialogueNpc(g,p){
 const ui=p.ui;
 if(!ui?.lupin||ui.npcId!==human.id||ui.ownerDevice!==p.device||
  g.players.filter(hero=>hero.device===p.device).length!==1)return null;
 return nearbyLupin(g,p,82);
}

export function interactLupin(g,p){
 if(p.ui||!nearbyLupin(g,p))return false;
 p.ui={shop:'npc-dialogue',lupin:true,npcId:human.id,ownerDevice:p.device,node:'hello',index:0};
 p.consumeInput=true;p.charge=0;p.moving=false;
 g.onSound?.('ui',p);
 return true;
}

function closeTalk(g){
 for(const p of g.players)if(p.ui?.lupin){p.ui=null;p.consumeInput=true;}
}

export function tickLupin(g){
 if(!outdoor(g))return;
 const old=progress(g),night=dayNumber(g);
 if(old?.form==='sheltered'&&hour(g)<LUPIN_MIDNIGHT&&g.time>=old.wakesAt&&
   !g.players.some(p=>p.ui?.lupin)){
  old.form='human';
 }
 if(old?.form==='injured'&&old.night!==night&&!g.players.some(p=>p.ui?.lupin)){
  old.form='human';
 }
 if(!moonUp(g)||old?.night===night||old?.form==='wolf'||old?.form==='returning'||!g.players.some(nearShack))return;
 const state=writable(g),id=g.nextId++;
 const wolf={...LUPIN_OUTSIDE,id,group:id,name:'Lupin',kind:'werewolf',skin:'werewolf',sprite:'werewolf',
  lupinWerewolf:true,faction:'enemy',hp:125,maxHp:125,speed:85,damage:17,state:'idle',
  faceX:.2,faceY:1,step:0,attack:0,cooldown:0,timer:0,tacticTime:0,flash:0,patrolIndex:0};
 Object.assign(state,{form:'wolf',night,wolfId:id});
 g.enemies.push(wolf);
 closeTalk(g);
 g.message?.('A howl rises from the Shrieking Shack.');
 g.onSound?.('growl',wolf);
 g.persist?.();
}

function validTarget(wolf,target){
 return target!==wolf&&guest(target)&&!target.unattackable&&!shieldedByBuilding(target)&&
  Math.abs((target.jumpHeight||0)+(target.groundHeight||0)-(wolf.jumpHeight||0))<24&&
  dist(target,door)<430;
}

function targetFor(g,wolf){
 const pinned=['windup','pounce'].includes(wolf.night?.phase)?wolf.night.targetId:null;
 const id=pinned??wolf.lupinTargetId;
 if(pinned!=null||g.time<(wolf.lupinNextTargetAt||0)){
  if(id==null)return null;
  const target=g.players.find(p=>p.id===id)||g.enemies.find(e=>e.id===id&&hostileEnemy(e));
  return validTarget(wolf,target)&&dist(wolf,target)<210?target:null;
 }
 let best=null,range=150;
 function see(target){
  if(!validTarget(wolf,target))return;
  const distance=dist(wolf,target);
  if(distance>=range||!clearShot(g,wolf,target,3))return;
  best=target;range=distance;
 }
 for(const p of g.players)see(p);
 for(const e of g.enemies)if(hostileEnemy(e))see(e);
 wolf.lupinTargetId=best?.id;
 wolf.lupinNextTargetAt=g.time+.22;
 return best;
}

export function lupinTargetForEnemy(wolf,enemy){
 if(!aliveWolf(wolf)||!hostileEnemy(enemy)||enemy===wolf||enemy.room||shieldedByBuilding(enemy)||dist(enemy,wolf)>135)return null;
 return wolf;
}

export function lupinWolf(g){
 if(!outdoor(g)||progress(g)?.form!=='wolf')return null;
 const id=progress(g).wolfId;
 return g.enemies.find(e=>e.id===id&&aliveWolf(e))||null;
}

function walkTo(g,wolf,point,dt,speed){
 const dx=point.x-wolf.x,dy=point.y-wolf.y,length=Math.hypot(dx,dy);
 if(length<.1)return false;
 wolf.faceX=dx/length;wolf.faceY=dy/length;
 const travel=Math.min(length,speed*dt);
 return g.moveActor(wolf,wolf.faceX*travel,wolf.faceY*travel)>.04;
}

function retireWolf(g,wolf,state){
 Object.assign(state,{form:'sheltered',wakesAt:g.time+14});
 delete state.wolfId;
 wolf.hp=0;wolf.lupinDisappeared=true;
 g.persist?.();
}

export function settleLupinDefeat(g,wolf){
 if(!wolf.lupinWerewolf)return false;
 if(!wolf.lupinDisappeared&&outdoor(g)&&progress(g)?.wolfId===wolf.id){
  const state=writable(g);
  Object.assign(state,{form:'injured',x:wolf.x,y:wolf.y});
  delete state.wolfId;
  wolf.lupinDisappeared=true;
  g.message?.('The werewolf collapses. Remus Lupin is hurt, but alive.');
  g.persist?.();
 }
 wolf.lupinDisappeared=true;
 return true;
}

export function tickLupinWerewolf(g,wolf,dt,damageEnemy){
 const state=progress(g);
 if(!state||!outdoor(g)||wolf.hp<=0||state.wolfId!==wolf.id)return;
 wolf.moving=false;
 for(const key of ['flash','frozen','stun','sleeping','attack','invuln']){
  wolf[key]=Math.max(0,(wolf[key]||0)-dt);
 }
 if(tickEnemyFlinch(g,wolf,dt)||wolf.sleeping>0)return;
 if(state.form==='returning'){
  if(!g.players.some(nearShack)||dist(wolf,threshold)<7){retireWolf(g,wolf,state);return;}
  const cameFromWest=wolf.x<threshold.x;
  const waypoint=wolf.y<door.y+29&&Math.abs(wolf.x-threshold.x)>24?
   {x:threshold.x+(cameFromWest?-29:29),y:door.y+33}:threshold;
  if(!walkTo(g,wolf,waypoint,dt,62)){
   wolf.returnStalled=(wolf.returnStalled||0)+dt;
   if(wolf.returnStalled>2.8)retireWolf(g,wolf,state);
  }else wolf.returnStalled=0;
  return;
 }
 if(!g.players.some(nearShack)){
  if(!moonUp(g))retireWolf(g,wolf,state);
  return;
 }
 const target=targetFor(g,wolf);
 if(target)wolf.lupinChallengedAt=g.time;
 if(!moonUp(g)&&!target&&g.time-(wolf.lupinChallengedAt??-Infinity)>1.8){
  state.form='returning';wolf.jumpHeight=0;wolf.attack=0;
  delete wolf.night;delete wolf.groupTurn;
  return;
 }
 const strike=(victim,source,amount)=>{
  if(g.players.includes(victim)){
   if((victim.invuln||0)>0||g.shieldBlocks?.(victim,source))return false;
   const before=victim.hp;g.hurt(victim,amount,source);return victim.hp<before;
  }
  return damageEnemy(victim,amount,'physical',{g,p:source,secondary:true})>0;
 };
 tickNightEnemy(g,wolf,target,dt,strike);
 if(target||wolf.night?.phase!=='idle'||wolf.frozen>0||wolf.stun>0||wolf.state==='snared')return;
 const point=patrol[wolf.patrolIndex%patrol.length];
 if(dist(wolf,point)<7||!walkTo(g,wolf,point,dt,63)){
  wolf.patrolIndex=(wolf.patrolIndex+1)%patrol.length;
 }
}
