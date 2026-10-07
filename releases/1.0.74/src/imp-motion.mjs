import {defaultSuccubusMotion} from './succubus-motion.mjs';
import {drawPlayer,validateMotion,upgradePlayerMotion} from './player-motion.mjs';
import {drawParticleEffect} from './particles.mjs';
export function defaultImpMotion(){
 const m=defaultSuccubusMotion();m.type='imp';m.name='Ember imp / small winged demon';
 Object.assign(m.palette,{head:'#ed865b',headShade:'#a3423b',body:'#ce543c',bodyShade:'#782738',arms:'#ed865b',armShade:'#a3423b',legs:'#a43736',legShade:'#63263a'});
 m.clips.lob=structuredClone(m.clips.cast);m.appendagePalette={ink:'#401c29',base:'#b63d38',dark:'#702939',light:'#ef8251',bone:'#dba475'};return m;
}
export const impMotion=defaultImpMotion();
export const validateImpMotion=m=>m?.type==='imp'&&m.humanoidTail===true&&!m.skeleton&&!m.robot&&validateMotion(m,defaultImpMotion());
export function replaceImpMotion(m){if(!validateImpMotion(m))throw Error('Invalid imp humanoid rig');Object.assign(impMotion,upgradePlayerMotion(m));}
export function impVisualActor(actor){
 const a={...actor,equipment:{head:'imp_horns',shoulders:'imp_wings',...actor.equipment},appearance:{skin:'#ed865b',shirt:'#ce543c',pants:'#a43736',shoes:'#502633',hair:'none',face:'elf',build:'slim',eyeColor:'#88e3c9',...actor.appearance}};
 if(!actor.animationAction){
  if(actor.hp<=0)a.animationAction='death';
  else if(actor.frozen>0||actor.state==='snared'){a.animationAction='fly';a.playerFrame=0;}
  else if(actor.flash>0){a.animationAction='hurt';a.playerFrame=Math.max(0,1-actor.flash/.2)*(impMotion.clips.hurt.length-1);}
  else if(actor.impWindup>0){a.animationAction='lob';a.poseTime=.1+.45*(1-actor.impWindup/(actor.impWindupDuration||.9));}
  else if(actor.attack>0){a.animationAction='lob';a.poseTime=.55+.45*(1-actor.attack/.4);}
  else a.animationAction='fly';
 }return a;
}
export function drawImp(c,actor,time,model=impMotion,pose=null){
 const a=impVisualActor(actor),p=drawPlayer(c,a,time,model,pose);
 if(actor.impWindup>0&&actor.hp>0&&!(actor.frozen>0))drawParticleEffect(c,'px-fire',p.handR.x,p.handR.y-2,Math.min(.9,.15+(1-actor.impWindup/(actor.impWindupDuration||.9))*.75),actor.id||0);
 return p;
}
