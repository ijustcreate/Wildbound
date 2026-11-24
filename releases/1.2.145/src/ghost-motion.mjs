import {defaultZombieMotion} from './zombie-motion.mjs';
import {drawPlayer,validateMotion,upgradePlayerMotion} from './player-motion.mjs';
import {GHOST_EQUIPMENT} from './items.mjs';
import {DEFAULT_APPEARANCE} from './appearance.mjs';
export function defaultGhostMotion(){
 const m=defaultZombieMotion();m.type='ghost';m.name='Restless ghost / spectral humanoid';
 Object.assign(m.palette,{head:'#467c70',headShade:'#254a43',body:'#b8d9c4',bodyShade:'#719e8b',arms:'#b8d9c4',armShade:'#719e8b',legs:'#8bbfa9',legShade:'#4e8776',outline:'#365c56'});
 for(const action of ['idle','walk'])m.clips[action]={fps:8,length:12,loop:true,keys:Array.from({length:12},(_,f)=>{
  const a=f/12*Math.PI*2,bob=Math.sin(a)*.8;return {frame:f,joints:{pelvis:[0,0,2+bob],chest:[0,1,1+bob],head:[0,1,1+bob],handL:[-1,5,4+Math.sin(a+.7)],handR:[1,5,4-Math.sin(a+.7)],elbowL:[-1,2,2],elbowR:[1,2,2]}};
 })};
 return m;
}
export const ghostMotion=defaultGhostMotion();
export const validateGhostMotion=m=>m?.type==='ghost'&&!m.skeleton&&!m.robot&&!m.humanoidTail&&validateMotion(m,defaultGhostMotion());
export function replaceGhostMotion(m){if(!validateGhostMotion(m))throw Error('Invalid ghost humanoid rig');Object.assign(ghostMotion,upgradePlayerMotion(m));}
export function ghostVisualActor(actor,model=ghostMotion){
 const a={...actor,equipment:{...GHOST_EQUIPMENT,...actor.equipment},appearance:{...DEFAULT_APPEARANCE,skin:'#467c70',shirt:'#b8d9c4',pants:'#8bbfa9',shoes:'#4e8776',hair:'none',eyeColor:'#ddffe2',build:'slim',...actor.appearance}};
 if(!actor.animationAction){
  if(actor.hp<=0)a.animationAction='death';
  else if(actor.frozen>0||actor.state==='snared'){a.animationAction='idle';a.playerFrame=0;}
  else if(actor.flash>0||actor.hit>0){a.animationAction='hurt';a.poseTime=1-(actor.flash||actor.hit)/.2;}
  else if(actor.ghostWindup>0||actor.state==='windup'){a.animationAction='claw';a.poseTime=(1-(actor.ghostWindup||actor.timer)/(actor.ghostWindupDuration||.6))*.35;}
  else if(actor.attack>0){a.animationAction='claw';a.poseTime=.35+(1-actor.attack/.4)*.65;}
  else a.animationAction=actor.moving?'walk':'idle';
 }
 return a;
}
export const drawGhost=(c,a,time,m=ghostMotion,pose=null)=>drawPlayer(c,ghostVisualActor(a,m),a.frozen>0?0:time,m,pose);
