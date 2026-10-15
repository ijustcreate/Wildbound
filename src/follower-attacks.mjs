import {damageEnemy} from './enemy-damage.mjs';
import {clearShot} from './navigation.mjs';

const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const controllableBird=e=>['bat','crow','raven'].includes(e?.kind);

function targetsFor(game,follower,owner){
 return (game.enemies||[]).filter(e=>e!==follower&&e.hp>0&&!e.defeated&&!e.practiceTarget&&
  e.faction!=='ally'&&e.faction!=='neutral'&&owner?.id!==e.id);
}
function hitTarget(game,follower,owner,target){
 if(!target||target.hp<=0||!clearShot(game,follower,target))return false;
 const amount=Math.max(1,follower.damage||9);
 target.killedBy=owner?.id??follower.allyOwner;
 damageEnemy(target,amount,'physical',{g:game,p:owner});
 target.aggro=true;
 game.effects.push({x:target.x,y:target.y-24,text:String(Math.round(amount)),color:'#ffe8ad',life:.5});
 return true;
}

/** Start the creature's own attack instead of applying the player's weapon. */
export function startFollowerAttack(game,owner,follower){
 if(follower.hp<=0||follower.frozen>0||follower.cooldown>0)return true;
 const faceLength=Math.hypot(owner.faceX||0,owner.faceY||0)||1;
 const aimX=(owner.faceX||follower.faceX||0)/faceLength,aimY=(owner.faceY||follower.faceY||1)/faceLength;
 const bird=controllableBird(follower),windup=follower.kind==='bat' ? .18 : bird ? .24 : .16;
 let nativeAction='attack';
 if(follower.kind==='oathless_captain'){
  follower.captainCombo=(follower.captainCombo||0)+1;
  nativeAction=follower.captainCombo%2?'slash':'thrust';
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
 action.timer=Math.max(0,action.timer-dt);
 if(action.phase==='windup'){
  if(action.timer>0){follower.state=controllableBird(follower)?(follower.kind==='bat'?'windup':'attack'):'attack';follower.timer=action.timer;follower.attack=action.timer;if(follower.kind==='oathless_captain')follower.poseTime=Math.min(.48,(1-action.timer/action.windup)*.48);return true;}
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
  const owner=game.players.find(p=>p.id===follower.allyOwner),reach=follower.kind==='bat'?34:controllableBird(follower)?38:follower.kind==='oathless_captain'?72:Math.max(30,follower.attackRange||34);
  const target=targetsFor(game,follower,owner).filter(e=>distance(e,follower)<=reach&&
   ((e.x-follower.x)*action.aimX+(e.y-follower.y)*action.aimY)>=-2&&clearShot(game,follower,e))
   .sort((a,b)=>distance(a,follower)-distance(b,follower))[0];
  if(target)hitTarget(game,follower,owner,target);
  follower.attack=action.timer;follower.state='attack';follower.timer=action.timer;follower.animationAction=action.nativeAction;follower.poseTime=follower.kind==='oathless_captain'?.72:null;
  if(follower.raven){follower.raven.phase='recover';follower.raven.phaseTime=0;}
  action.phase='recover';action.timer=follower.kind==='bat'?.3:.24;return true;
 }
 if(action.phase==='recover'){
  follower.state='recover';follower.timer=action.timer;follower.attack=0;
  if(action.timer<=0){delete follower.controlledAttack;follower.state='idle';follower.animationAction=null;follower.poseTime=null;follower.attack=0;if(follower.kind==='oathless_captain')follower.captainAction=null;if(follower.raven)follower.raven.phase='perch';}
  return true;
 }
 return false;
}
