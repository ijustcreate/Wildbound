import {damageEnemy} from './enemy-damage.mjs';
import {clearShot} from './navigation.mjs';
import {harvestGravestone} from './graveyard-world.mjs';
import {harvest} from './environment.mjs';
import {damageStructureMelee} from './structure-destruction.mjs';
import {strikeTallGrass} from './tall-grass.mjs';
import {PEACEFUL_FAUNA_KINDS} from './wild-fauna-data.mjs';
import {ITEMS,itemKind} from './items.mjs';
import {FELINE_CONTROL_KINDS} from './follower-control.mjs';

const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const controllableBird=e=>['bat','crow','raven'].includes(e?.kind);
const controlledCat=e=>FELINE_CONTROL_KINDS.has(e?.kind);
const captainRig=e=>e?.kind==='oathless_captain'||e?.villagerId==='april';

function targetsFor(game,follower,owner){
 return (game.enemies||[]).filter(e=>e!==follower&&e.hp>0&&!e.defeated&&!e.practiceTarget&&
  e.faction!=='ally'&&(e.faction!=='neutral'||PEACEFUL_FAUNA_KINDS.includes(e.kind))&&owner?.id!==e.id);
}
function hitTarget(game,follower,owner,target,damage=follower.damage||9){
 if(!target||target.hp<=0||!clearShot(game,follower,target))return false;
 const amount=Math.max(1,damage);
 target.killedBy=owner?.id??follower.allyOwner;
 damageEnemy(target,amount,'physical',{g:game,p:owner});
 target.aggro=true;
 game.effects.push({x:target.x,y:target.y-24,text:String(Math.round(amount)),color:'#ffe8ad',life:.5});
 return true;
}

/** Start the creature's own attack instead of applying the player's weapon. */
export function startFollowerAttack(game,owner,follower,charge=0){
 // Humanoid archers use the same bow, inventory ammunition, charge and aimed
 // projectile path as their owner. The creature melee branch consumes input.
 if(follower.kind==='archer'&&itemKind(owner.equipment?.hand1)==='bow')return false;
 if(follower.hp<=0||follower.frozen>0||follower.cooldown>0)return true;
 const rawX=Number.isFinite(owner.faceX)?owner.faceX:(follower.faceX??0),rawY=Number.isFinite(owner.faceY)?owner.faceY:(follower.faceY??1),faceLength=Math.hypot(rawX,rawY)||1;
 const aimX=rawX/faceLength,aimY=rawY/faceLength;
 if(controlledCat(follower)&&owner.pounceAimActive&&charge>=.18){
  const power=Math.max(0,Math.min(1,charge/1.2)),distance=55+power*125,duration=.38+power*.22;
  const target={x:follower.x+aimX*distance,y:follower.y+aimY*distance};
  Object.assign(follower,{faceX:aimX,faceY:aimY,moving:true,walking:false,state:'charge',animationAction:'pounce',timer:duration,motionDuration:duration,poseTime:0,
   controlledAttack:{phase:'pounce',timer:duration,duration,distance,startX:follower.x,startY:follower.y,aimX,aimY,target}});
  follower.pounceAim=target;follower.cooldown=Math.max(follower.cooldown||0,.45);game.onSound?.('attack',follower);return true;
 }
 if(follower.kind==='golem'){
  follower.faceX=aimX;follower.faceY=aimY;follower.moving=false;follower.rockGrabCharge=0;
  if(charge>=.52){
   const power=Math.max(0,Math.min(1,(charge-.52)/.68));
   game.arrows.push({id:game.nextId++,x:follower.x+aimX*17,y:follower.y+aimY*17,z:24,vx:aimX*(145+power*75),vy:aimY*(145+power*75),vz:45+power*35,damage:16+Math.round(power*18),hostile:false,owner:owner.id,rock:true});
   Object.assign(follower,{state:'throw',animationAction:'throw',throwTime:.48,attack:.48,poseTime:null,cooldown:.35,controlledAttack:{phase:'recover',timer:.48,aimX,aimY}});
   game.onSound?.('attack',follower);return true;
  }
  Object.assign(follower,{state:'attack',animationAction:'slam',poseTime:0,attack:.18,cooldown:.42,controlledAttack:{phase:'windup',timer:.1,windup:.1,aimX,aimY,nativeAction:'slam',hit:false}});
  game.onSound?.('attack',follower);return true;
 }
 if(follower.kind==='imp'&&charge>=1.1){
  const power=Math.max(0,Math.min(1,(charge-1.1)/.1)),speed=185+power*45;
  follower.faceX=aimX;follower.faceY=aimY;follower.moving=false;follower.fireballsAttack=.48;
  game.fireballs||=[];game.fireballs.push({x:follower.x+aimX*13,y:follower.y+aimY*13,vx:aimX*speed,vy:aimY*speed,
   life:2.8,trail:0,damage:Math.max(12,(follower.damage||12)+Math.round(power*8)),burnDamage:4+Math.round(power*3),
   friendly:true,owner:follower.id,controllerOwner:owner.id});
  Object.assign(follower,{state:'attack',animationAction:'cast',poseTime:0,cooldown:.45,controlledAttack:{phase:'recover',timer:.45,nativeAction:'cast',aimX,aimY}});
  game.onSound?.('attack',follower);return true;
 }
 if(['fire_elemental','water_elemental'].includes(follower.kind)&&charge>=1.18){
  const ice=follower.kind==='water_elemental',power=Math.max(0,Math.min(1,(charge-1.18)/.02)),speed=205+power*35;
  follower.faceX=aimX;follower.faceY=aimY;follower.moving=false;follower.fireballsAttack=.5;
  game.fireballs||=[];game.fireballs.push({x:follower.x+aimX*16,y:follower.y+aimY*16,vx:aimX*speed,vy:aimY*speed,
   life:2.8,trail:0,damage:Math.max(18,(follower.damage||18)+Math.round(power*8)),burnDamage:ice?0:5,
   friendly:true,ice,water:ice,owner:follower.id,controllerOwner:owner.id});
  Object.assign(follower,{state:'attack',animationAction:'cast',poseTime:0,cooldown:.5,controlledAttack:{phase:'recover',timer:.5,nativeAction:'cast',aimX,aimY}});
  game.onSound?.('attack',follower);return true;
 }
 const bird=controllableBird(follower),windup=follower.kind==='bat' ? .18 : bird ? .24 : .16;
 let nativeAction='attack';
 if(follower.kind==='imp')nativeAction='attack';
 if(captainRig(follower)){
  follower.captainCombo=(follower.captainCombo||0)+1;
  nativeAction=follower.villagerId==='april'?'jump_slash':follower.captainCombo%2?'slash':'thrust';
 }
 Object.assign(follower,{faceX:aimX,faceY:aimY,moving:false,controlledAttack:{phase:'windup',timer:windup,windup,aimX,aimY,nativeAction,hit:false},animationAction:bird?null:nativeAction,poseTime:0});
 if(follower.kind==='bat'){
  follower.state='windup';follower.timer=.18;follower.motionDuration=.18;
 }else{
  follower.state='attack';follower.attack=windup;
  if(follower.raven){follower.raven.phase='attack';follower.raven.phaseTime=0;}
 }
 game.onSound?.('attack',follower);
 return true;
}

/** Advance native creature attack phases for a controlled companion. */
export function tickFollowerAttack(game,follower,dt){
 const action=follower.controlledAttack;if(!action)return false;
 if(follower.hp<=0||follower.frozen>0){delete follower.controlledAttack;return true;}
 if(action.phase==='pounce'){
  action.timer=Math.max(0,action.timer-dt);
  const progress=1-action.timer/action.duration,step=action.distance/action.duration*dt;
  const moved=game.moveActor(follower,action.aimX*step,action.aimY*step,false);
  follower.jumpHeight=Math.sin(Math.min(1,progress)*Math.PI)*20;
  follower.state='charge';follower.animationAction='pounce';follower.moving=moved>.01;follower.walking=false;follower.timer=action.timer;
  if(action.timer<=0||moved<step*.5){follower.jumpHeight=0;action.phase='recover';action.timer=.22;follower.state='recover';follower.animationAction=null;follower.poseTime=0;follower.cooldown=.65;}
  return true;
 }
 if(follower.kind==='golem'&&action.phase==='recover'){
  action.timer=Math.max(0,action.timer-dt);follower.throwTime=Math.max(0,(follower.throwTime||0)-dt);follower.attack=Math.max(0,(follower.attack||0)-dt);
  follower.state=action.nativeAction==='slam'?'recover':'throw';
  if(action.timer<=0){delete follower.controlledAttack;follower.state='idle';follower.animationAction=null;follower.poseTime=null;follower.attack=0;follower.throwTime=0;}
  return true;
 }
 if((follower.kind==='imp'||['fire_elemental','water_elemental'].includes(follower.kind))&&action.phase==='recover'){
  action.timer=Math.max(0,action.timer-dt);follower.fireballsAttack=Math.max(0,(follower.fireballsAttack||0)-dt);
  follower.attack=action.timer;follower.state='attack';
  if(action.timer<=0){delete follower.controlledAttack;follower.state='idle';follower.animationAction=null;follower.poseTime=null;follower.attack=0;}
  return true;
 }
 action.timer=Math.max(0,action.timer-dt);
 if(action.phase==='windup'){
 if(action.timer>0){follower.state=controllableBird(follower)?(follower.kind==='bat'?'windup':'attack'):'attack';follower.timer=action.timer;follower.attack=action.timer;if(captainRig(follower))follower.poseTime=Math.min(.48,(1-action.timer/action.windup)*.48);return true;}
  action.phase=follower.kind==='bat'?'charge':'strike';
  action.timer=follower.kind==='bat'?.24:.12;
  follower.state=follower.kind==='bat'?'charge':'attack';
  follower.timer=action.timer;follower.motionDuration=action.timer;
  if(follower.kind==='bat')follower.attack=.24;
 }
 if(action.phase==='charge'){
  const travel=game.moveActor(follower,action.aimX*260*dt,action.aimY*260*dt,true);
  const target=targetsFor(game,follower,game.players.find(p=>p.id===follower.allyOwner))
   .filter(e=>distance(e,follower)<30&&clearShot(game,follower,e))
   .sort((a,b)=>distance(a,follower)-distance(b,follower))[0];
  if(target){hitTarget(game,follower,game.players.find(p=>p.id===follower.allyOwner),target);action.phase='recover';action.timer=.3;follower.cooldown=.9;}
  else if(action.timer<=0||travel<dt*60){action.phase='recover';action.timer=.3;follower.cooldown=.65;}
  follower.state='charge';follower.timer=Math.max(0,action.timer);follower.motionDuration=.24;
  if(action.phase==='recover'){follower.state='recover';follower.timer=action.timer;}
  return true;
 }
 if(action.phase==='strike'){
  const owner=game.players.find(p=>p.id===follower.allyOwner),reach=follower.kind==='bat'?34:controllableBird(follower)?38:captainRig(follower)?72:Math.max(30,follower.attackRange||34);
  // Native follower attacks bypass Game.attack's normal melee harvesting path.
  // Let their basic strike damage nearby tombstones just like a hero's melee.
  // Route the native strike through the same world targets as a hero melee
  // hit. Controlled followers should be able to gather wood and break house
  // structures without losing their rig-specific attack animation.
  const damage=follower.kind==='golem'?Math.max(22,follower.damage||0):follower.damage||9;
  const weaponIds=[follower.equipment?.hand1,follower.equipment?.hand2].filter(Boolean);
  const blade=weaponIds.some(id=>itemKind(id)==='sword'||ITEMS[id]?.base==='sword');
  const grassHit=strikeTallGrass(game,follower,reach,{blade});
  const structureHit=damageStructureMelee(game,follower,damage,reach);
  const gravestoneHit=harvestGravestone(game,follower,damage,reach);
  const sceneryHit=harvest(game,follower,damage,reach);
  if(grassHit||structureHit||gravestoneHit||sceneryHit)game.persist?.();
  const target=targetsFor(game,follower,owner).filter(e=>distance(e,follower)<=reach&&
   ((e.x-follower.x)*action.aimX+(e.y-follower.y)*action.aimY)>=-2&&clearShot(game,follower,e))
   .sort((a,b)=>distance(a,follower)-distance(b,follower))[0];
  if(target)hitTarget(game,follower,owner,target,follower.kind==='golem'?damage:undefined);
  follower.attack=action.timer;follower.state='attack';follower.timer=action.timer;follower.animationAction=action.nativeAction;follower.poseTime=captainRig(follower)?.72:null;
  if(follower.raven){follower.raven.phase='recover';follower.raven.phaseTime=0;}
  action.phase='recover';action.timer=follower.kind==='bat'?.3:.24;if(follower.kind==='golem')follower.cooldown=.42;return true;
 }
 if(action.phase==='recover'){
  follower.state='recover';follower.timer=action.timer;follower.attack=0;
  if(action.timer<=0){delete follower.controlledAttack;follower.state='idle';follower.animationAction=null;follower.poseTime=null;follower.attack=0;if(captainRig(follower))follower.captainAction=null;if(follower.raven)follower.raven.phase='perch';}
  return true;
 }
 return false;
}
