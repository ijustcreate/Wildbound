import {defaultPlayerMotion,drawPlayer,validateMotion,upgradePlayerMotion} from './player-motion.mjs';
import {buildHeroGeneration} from './hero-generation.mjs';
export function defaultZombieMotion(){
 const m=buildHeroGeneration(defaultPlayerMotion());m.type='zombie';m.name='Zombie / shambling humanoid';
 Object.assign(m.palette,{head:'#8d9b7e',headShade:'#5b6d59',body:'#646071',bodyShade:'#393846',arms:'#646071',armShade:'#393846',legs:'#6d6554',legShade:'#403e37'});
 const stoop={chest:[0,2,-2],head:[1,3,-3],handL:[-1,6,8],handR:[1,7,7],elbowL:[-1,3,3],elbowR:[1,3,3]};
 m.clips.idle={fps:5,length:8,loop:true,keys:[{frame:0,joints:structuredClone(stoop)},{frame:4,joints:{...stoop,head:[0,3,-4],handL:[-1,6,7],handR:[1,7,8]}},{frame:7,joints:structuredClone(stoop)}]};
 m.clips.walk={fps:6,length:12,loop:true,keys:Array.from({length:6},(_,n)=>{const f=n*2,s=Math.sin(f/12*Math.PI*2);return {frame:f,joints:{...stoop,pelvis:[s*.5,0,Math.abs(s)*.3],head:[1,3,-3+Math.cos(f/12*Math.PI*2)*.5],footL:[0,s*3,Math.max(0,s)],footR:[0,-s*3,Math.max(0,-s)],kneeL:[0,s*1.5,0],kneeR:[0,-s*1.5,0],handR:[1,7+s,7],handL:[-1,6-s,8]}};})};
 m.clips.claw={fps:10,length:10,loop:false,keys:[
  {frame:0,joints:{...stoop,handR:[3,0,12],elbowR:[3,0,7]}},
  {frame:3,joints:{...stoop,handR:[7,-2,16],elbowR:[5,-1,10],head:[0,1,-2]}},
  {frame:5,joints:{...stoop,handR:[-8,15,8],elbowR:[-2,8,5],chest:[-2,4,-2]}},
  {frame:9,joints:structuredClone(stoop)},
 ]};return m;
}
export const zombieMotion=defaultZombieMotion();
export const validateZombieMotion=m=>m?.type==='zombie'&&!m.skeleton&&!m.robot&&!m.humanoidTail&&validateMotion(m,defaultZombieMotion());
export function replaceZombieMotion(m){if(!validateZombieMotion(m))throw Error('Invalid zombie humanoid rig');Object.assign(zombieMotion,upgradePlayerMotion(m));}
export function zombieVisualActor(actor,model=zombieMotion){
 const a={...actor,equipment:{...actor.equipment},appearance:{skin:'#8d9b7e',shirt:'#646071',pants:'#6d6554',shoes:'#4e453d',hair:actor.zombieVariant==='broken_jaw'?'none':'shag',hairColor:'#535348',eyeColor:'#d9dd88',build:'slim',...actor.appearance},missingArm:actor.zombieVariant==='one_arm'?'L':null};
 if(!actor.animationAction){
  if(actor.hp<=0)a.animationAction='death';
  else if(actor.frozen>0||actor.state==='snared'){a.animationAction='idle';a.playerFrame=0;}
  else if(actor.flash>0){a.animationAction='hurt';a.poseTime=1-actor.flash/.2;}
  else if(actor.zombieWindup>0){a.animationAction='claw';a.poseTime=(1-actor.zombieWindup/(actor.zombieWindupDuration||.65))*.32;}
  else if(actor.attack>0){a.animationAction='claw';a.poseTime=.32+(1-actor.attack/.4)*.68;}
  else if(actor.moving){a.animationAction='walk';a.playerFrame=(actor.step||0)*1.4;}
  else a.animationAction='idle';
 }return a;
}
export const drawZombie=(c,a,time,m=zombieMotion,pose=null)=>drawPlayer(c,zombieVisualActor(a,m),time,m,pose);
