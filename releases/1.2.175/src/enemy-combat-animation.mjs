import {ENEMY_COMBAT_CATALOG,combatPhase} from './enemy-combat-catalog.mjs';
const clamp=t=>Math.max(0,Math.min(1,t)),smooth=t=>{t=clamp(t);return t*t*(3-2*t);};
export function enemyCombatAnimation(actor,model){
 const profile=ENEMY_COMBAT_CATALOG[actor.kind];
 if(!profile||actor.hp<=0||actor.combatRole||actor.animationAction||actor.rigOverride||Number.isFinite(actor.playerFrame)||Number.isFinite(actor.poseTime))return actor;
 if(actor.tacticalBlocked&&actor.guardFlash>0)return {...actor,flash:0,hit:0,...(model?.clips?.block?{animationAction:'block',playerFrame:(model.clips.block.length-1)*.5}:{})};
 const phase=combatPhase(actor),s=actor.speciesCombat,read=actor.enemyCombatRead;
 // Boar rushes use the planted gallop driven by distance travelled.
 if(phase==='active'&&actor.kind==='boar'&&actor.state==='charge'&&model?.clips?.charge?.loop)return actor;
 const duration=s?.duration||read?.duration||actor.motionDuration||.65;
 const progress=s?clamp(1-s.remaining/Math.max(.01,duration)):clamp((read?.age||0)/Math.max(.01,duration));
 let names=[],frame=progress;
 if(phase==='windup'){
  names=actor.kind==='archer'?(s?.bowBash?['punch_left','swipe_one']:['draw','windup']):profile.family==='caster'||['fire_elemental','water_elemental'].includes(actor.kind)?['cast','fireball','windup','attack']:profile.family==='serpent'?['coil','windup']:actor.kind==='skeleton_unarmed'?['punch_left','windup']:['windup','crouch','swipe_big','slash'];
  frame=smooth(progress/.8);
 }else if(phase==='active'){
  names=s?.style==='rush'?['pounce','dive','charge','strike','bite']:actor.kind==='skeleton_unarmed'?['punch_left','punch_right','uppercut']:['swipe_one','swipe_two','swipe_big','slash','bite','attack'];
  if(s?.bowBash){names=['punch_left','swipe_one'];frame=phase==='recover'?.9+.1*smooth(progress/.35):progress;}
  else if(profile.family==='fighter'&&s){const n=s.index%3;names=actor.kind==='skeleton_unarmed'?[[ 'punch_left'],['punch_right'],['uppercut']][n]:[['swipe_one','slash'],['swipe_two','slash'],['swipe_big','slash']][n];}
 }else if(phase==='recover'){
  names=['recover'];
  if(s?.bowBash){names=['punch_left','swipe_one'];frame=phase==='recover'?.9+.1*smooth(progress/.35):progress;}
  else if(profile.family==='fighter'&&s){names=[s.index%3===2?'swipe_big':s.index%3===1?'swipe_two':'swipe_one','slash','recover','idle'];frame=.9+.1*smooth(progress/.35);}
 }
 const action=names.find(name=>model?.clips?.[name]);if(!action)return actor;
 if(phase==='windup'&&['swipe_big','slash','punch_left'].includes(action))frame*=.3;
 return {...actor,animationAction:action,playerFrame:frame*(model.clips[action].length-1),motionDuration:duration,enemyCombatFrame:true};
}
