import {drawPlayer,poseAt,validateMotion} from './player-motion.mjs';
import {defaultOathlessCaptainMotion} from './oathless-captain-motion.mjs';
import {SAFARI_HUNTER_EQUIPMENT} from './items.mjs';

const plus=(a,b)=>a.map((v,i)=>v+b[i]);
const minus=(a,b)=>a.map((v,i)=>v-b[i]);

export function defaultSafariHunterMotion(){
 const m=defaultOathlessCaptainMotion(),rest=Object.fromEntries(Object.entries(m.joints).map(([name,joint])=>[name,joint.position]));
 m.type='safari_hunter';m.name='Safari Hunter / Oathless Captain humanoid rig';m.artGeneration=3;
 Object.assign(m.palette,{head:'#d99560',headShade:'#a86e48',body:'#b56b30',bodyShade:'#714320',arms:'#b56b30',armShade:'#714320',legs:'#945b2d',legShade:'#503720',outline:'#302b2b'});
 const clip=(name,donor,length,fps,loop,sculpt)=>{
  const source=m.clips[donor],keys=Array.from({length},(_,frame)=>{
   const progress=frame/(length-1),sample=poseAt(m,donor,progress*(source.length-1));
   sculpt(sample,progress);
   return {frame,joints:Object.fromEntries(Object.keys(rest).map(joint=>[joint,minus(sample[joint],rest[joint])]))};
  });
  m.clips[name]={length,fps,loop,keys};
 };
 const ready=p=>{
  const chest=p.chest;
  p.handR=plus(chest,[5,6,-2]);p.handL=plus(chest,[-5,6,-2]);
  p.elbowR=plus(chest,[7,2,-3]);p.elbowL=plus(chest,[-7,2,-3]);
 };
 const aim=p=>{
  const chest=p.chest;
  p.handR=plus(chest,[6,4,-2]);p.handL=plus(chest,[-6,9,-2]);
  p.elbowR=plus(chest,[7,1,-3]);p.elbowL=plus(chest,[-7,5,-3]);
 };
 clip('hunter_rifle_idle','idle',16,12,true,ready);
 clip('hunter_rifle_walk','walk',16,16,true,ready);
 clip('hunter_kneel_aim','kneel',18,12,true,aim);
 clip('hunter_shoot','kneel',10,24,false,(p,t)=>{aim(p);const recoil=Math.max(0,1-Math.abs(t-.32)/.26);p.handR=plus(p.handR,[0,-recoil*2,recoil]);p.handL=plus(p.handL,[0,-recoil*2,recoil]);});
 clip('hunter_reload','guard',12,12,false,(p,t)=>{ready(p);const load=Math.sin(Math.PI*t);p.handL=plus(p.handL,[4*load,-2*load,-5*load]);});
 clip('hunter_retreat','dodge',12,24,false,ready);
 return m;
}
export const safariHunterMotion=defaultSafariHunterMotion();
export const validateSafariHunterMotion=m=>m?.type==='safari_hunter'&&validateMotion(m,defaultOathlessCaptainMotion());
export function replaceSafariHunterMotion(m){
 if(!validateSafariHunterMotion(m))throw Error('Invalid Safari Hunter Captain rig');
 const copy=structuredClone(m);for(const key of Object.keys(safariHunterMotion))delete safariHunterMotion[key];
 Object.assign(safariHunterMotion,copy);
}
export function safariHunterVisualActor(actor){
 const visual={...actor,sprite:'safari_hunter',equipment:{...SAFARI_HUNTER_EQUIPMENT,...actor.equipment},appearance:{skin:'#d99560',shirt:'#b56b30',pants:'#945b2d',shoes:'#29282b',hair:'crop',hairColor:'#4b352f',face:'safari_hunter',build:'broad',...actor.appearance}};
 const phase=actor.night?.phase;
 visual.animationAction=actor.hp<=0?'death':actor.hit>0?'hurt':phase==='aim'?'hunter_kneel_aim':phase==='fire'?'hunter_shoot':phase==='recover'?'hunter_reload':phase==='dash'?'hunter_retreat':actor.moving?'hunter_rifle_walk':'hunter_rifle_idle';
 if(actor.hp<=0)visual.poseTime=Math.min(1,(actor.deathTimer||0)/.5);
 else if(phase==='fire')visual.poseTime=1-Math.max(0,actor.night?.fire||0)/.2;
 else if(phase==='recover')visual.poseTime=actor.night?.timer>0?Math.max(0,1-actor.night.timer/1.4):1;
 else if(phase==='dash')visual.poseTime=Math.max(0,1-(actor.night?.timer||0)/.35);
 else delete visual.poseTime;
 return visual;
}
export function drawSafariHunter(c,actor,time,model=safariHunterMotion,pose=null){
 const visual=safariHunterVisualActor(actor),action=visual.animationAction,clip=model.clips[action]||model.clips.idle;
 const frame=Number.isFinite(visual.playerFrame)?visual.playerFrame:Number.isFinite(visual.poseTime)?visual.poseTime*(clip.length-1):time*clip.fps;
 return drawPlayer(c,visual,time,model,pose||poseAt(model,action,frame));
}
