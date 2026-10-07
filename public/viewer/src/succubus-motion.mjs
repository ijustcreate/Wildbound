import {defaultPlayerMotion,drawPlayer,validateMotion,upgradePlayerMotion} from './player-motion.mjs';
import {buildHeroGeneration} from './hero-generation.mjs';
import {SUCCUBUS_JOINTS} from './succubus-attachments.mjs';
import {SUCCUBUS_EQUIPMENT} from './items.mjs';

export function defaultSuccubusMotion(){
 const m=buildHeroGeneration(defaultPlayerMotion());m.type='succubus';m.name='Succubus / winged humanoid';m.humanoidTail=true;
 Object.assign(m.joints,structuredClone(SUCCUBUS_JOINTS));
 Object.assign(m.palette,{head:'#dca197',headShade:'#a26470',body:'#443343',bodyShade:'#2a202e',arms:'#dca197',armShade:'#a26470',legs:'#3a2939',legShade:'#241d2b'});
 const attach=(frame,flight=false)=>{
  const a=frame/8*Math.PI*2,flap=Math.sin(a),joints={};
  for(const side of ['L','R']){const s=side==='L'?-1:1;joints['wingMid'+side]=[s*(flight?1:0),flap*(flight?3:1),flap*(flight?6:1)];joints['wingTip'+side]=[s*(flight?0:-7),flap*(flight?5:1),flap*(flight?9:2)-3];}
  joints.tailMid=[Math.sin(a)*2,0,0];joints.tailTip=[Math.sin(a-.6)*4,0,Math.cos(a)];return joints;
 };
 for(const name of ['idle','walk','run'])for(const key of m.clips[name].keys)Object.assign(key.joints,attach(key.frame));
 m.clips.fly={fps:12,length:8,loop:true,keys:Array.from({length:8},(_,frame)=>({frame,joints:{...attach(frame,true),kneeL:[0,-2,2],kneeR:[0,1,3],footL:[0,-4,3],footR:[0,-1,5],handL:[-1,0,2],handR:[1,0,2]}}))};
 m.clips.kiss={fps:10,length:10,loop:false,keys:[
  {frame:0,joints:{handL:[-1,2,4],handR:[0,-2,1]}},
  {frame:3,joints:{handL:[4,4,15],elbowL:[1,2,7],head:[0,1,0]}},
  {frame:6,joints:{handL:[4,12,12],elbowL:[1,6,7],head:[0,2,0]}},
  {frame:9,joints:{handL:[0,2,2],elbowL:[0,1,1]}},
 ]};
 m.clips.whip=structuredClone(m.clips.swipe_big);
 return m;
}
export const succubusMotion=defaultSuccubusMotion();
export const validateSuccubusMotion=m=>m?.type==='succubus'&&m.humanoidTail===true&&!m.skeleton&&!m.robot&&validateMotion(m,defaultSuccubusMotion())&&['eyeL','eyeR','earL','earR','nose','mouth'].every(n=>m.visibility?.[n]?.length===8&&m.visibility[n].every(v=>typeof v==='boolean'));
export function replaceSuccubusMotion(m){if(!validateSuccubusMotion(m))throw Error('Invalid succubus humanoid rig');Object.assign(succubusMotion,upgradePlayerMotion(m));}
export function succubusVisualActor(actor,time=0,model=succubusMotion){
 const a={...actor,equipment:{...SUCCUBUS_EQUIPMENT,...actor.equipment},appearance:{skin:'#dca197',shirt:'#443343',pants:'#3a2939',shoes:'#312535',hair:'long',hairColor:'#554168',face:'elf',build:'slim',eyeColor:'#76e0e2',...actor.appearance}};
 if(!actor.animationAction){
  if(actor.hp<=0)a.animationAction='death';
  else if(actor.frozen>0||actor.state==='snared'){a.animationAction='idle';a.playerFrame=0;}
  else if(actor.flash>0){a.animationAction='hurt';a.playerFrame=Math.max(0,1-actor.flash/.2)*(model.clips.hurt.length-1);}
  else if(actor.succubusAttack==='kiss'){a.animationAction='kiss';a.poseTime=1-actor.succubusWindup/(actor.succubusWindupDuration||1);}
  else if(actor.succubusAttack==='whip'){a.animationAction='whip';a.poseTime=(1-actor.succubusWindup/(actor.succubusWindupDuration||.75))*.28;}
  else if(actor.attack>0){a.animationAction='whip';a.poseTime=.28+(1-actor.attack/.45)*.72;}
  else if(actor.succubusFlightHeight>1)a.animationAction='fly';
  else if(actor.moving)a.walking=true;
 }
 if(actor.frozen>0||actor.hp<=0||actor.state==='snared')a.attachmentTime=0;
 return a;
}
export const drawSuccubus=(c,a,time,m=succubusMotion,pose=null)=>drawPlayer(c,succubusVisualActor(a,time,m),time,m,pose);
