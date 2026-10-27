import {creatures} from './definitions.mjs';
import {damageEnemy} from './enemy-damage.mjs';
import {clearShot,navigateEnemy,flies} from './navigation.mjs';
import {companionMovement} from './companion-locomotion.mjs';
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);

export function befriendCreature(actor,owner){
 if(!actor||actor.hp<=0||actor.practiceTarget||actor.kind==='bee_hive')return false;
 Object.assign(actor,{faction:'ally',allyOwner:owner,aggro:false,state:'idle',timer:0,moving:false,attack:0,animationAction:null,poseTime:null,motionDuration:null});
 if(actor.kind==='succubus')Object.assign(actor,{succubusAttack:null,succubusWindup:0,succubusFlightHeight:0,succubusFlying:false});
 if(actor.kind==='imp')Object.assign(actor,{impWindup:0,impAim:null});
 if(actor.kind==='zombie')Object.assign(actor,{zombieWindup:0,zombieAim:null,zombieTarget:null});
 if(['succubus','imp','zombie'].includes(actor.kind))actor.humanoidTrapRecovery=false;
 for(const key of ['playerFrame','animationProgress','animationTime','stateAge','night','stampeding','pounce','vx','vy'])delete actor[key];
 actor.step=Number.isFinite(actor.step)?actor.step:0;
 return true;
}

// Allies need the same transient-state upkeep as hostiles. Skipping it used to
// leave friendship-wand cats permanently flashing, biting or mid-pounce.
export function tickFriendlyCreature(g,e,dt,cfg=creatures[e.kind]){
 const finish=companionMovement(e,dt);
 try{return tickFriendly(g,e,dt,cfg);}finally{finish();}
}
function tickFriendly(g,e,dt,cfg){
 e.moving=false;
 for(const key of ['flash','hit','attack','summonPulse','healEffect','frozen','throwTime','cooldown'])e[key]=Math.max(0,(e[key]||0)-dt);
 const owned=e.allyOwner!==undefined&&e.allyOwner!==null;
 const owner=owned?g.players.find(p=>p.id===e.allyOwner&&p.hp>0&&!p.room):null;
 e.state=e.attack>0?'attack':'idle';e.animationAction=null;e.poseTime=null;
 // Also migrate already-charmed actors from older saved sessions.
 for(const key of ['playerFrame','animationProgress','animationTime','night'])delete e[key];
 if(e.frozen>0||owned&&!owner)return;
 const beh=cfg?.behaviors||{};
 let target=null,nearest=Infinity;
 if(!owner||distance(e,owner)<280)for(const q of g.enemies){
  if(q===e||q.hp<=0||q.defeated||q.practiceTarget||q.faction==='ally'||q.faction==='neutral'||['ally','neutral'].includes(creatures[q.kind]?.faction))continue;
  if(owner&&distance(owner,q)>220)continue;
  const d=distance(e,q);if(d<nearest){nearest=d;target=q;}
 }
 const goal=target||owner;
 if(!goal)return;
 const d=distance(e,goal),stop=target?38:65;
 if(d>stop&&beh.hunt){
  const oldX=e.x,oldY=e.y;
  if(g.house&&!flies(e))navigateEnemy(g,e,goal,dt);
  else {const step=Math.min(d-stop,(e.speed||60)*dt);g.moveActor(e,(goal.x-e.x)/(d||1)*step,(goal.y-e.y)/(d||1)*step,flies(e));}
  // Face actual travel; idle actors keep their last facing instead of jittering.
  if(e.moving){const travelled=Math.hypot(e.x-oldX,e.y-oldY)||1;e.faceX=(e.x-oldX)/travelled;e.faceY=(e.y-oldY)/travelled;e.state='hunt';}
 }
 if(target&&distance(e,target)<65&&e.cooldown<=0&&beh.melee&&clearShot(g,e,target)){
  const range=distance(e,target)||1;e.faceX=(target.x-e.x)/range;e.faceY=(target.y-e.y)/range;
  damageEnemy(target,e.damage||10);target.killedBy=e.allyOwner;
  e.cooldown=1;e.attack=.34;e.state='attack';
 }
}
