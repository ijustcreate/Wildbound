import {defaultPlayerMotion,drawPlayer,validatePlayerMotion,upgradePlayerMotion} from './player-motion.mjs';
import {buildHeroGeneration} from './hero-generation.mjs';
import {BANSHEE_EQUIPMENT} from './items.mjs';

export function defaultBansheeMotion(){
 const model=buildHeroGeneration(defaultPlayerMotion());
 model.type='banshee_queen';model.name='Banshee Queen / equipped humanoid';
 Object.assign(model.palette,{head:'#85b9cd',body:'#453445',bodyShade:'#282131',arms:'#85b9cd',armShade:'#537c90',legs:'#352c39',legShade:'#201e2b'});
 return model;
}
export const bansheeMotion=defaultBansheeMotion();
export const validateBansheeMotion=model=>model?.type==='banshee_queen'&&!model.skeleton&&!model.robot&&validatePlayerMotion(model);
export function replaceBansheeMotion(model){if(!validateBansheeMotion(model))throw Error('Invalid Banshee Queen humanoid rig');Object.assign(bansheeMotion,upgradePlayerMotion(model));}
export function bansheeVisualActor(actor,model=bansheeMotion){
 const visual={...actor,equipment:{...BANSHEE_EQUIPMENT,...actor.equipment},inventory:actor.inventory||[{type:'arrow',qty:actor.arrowsLeft??36}],appearance:{skin:'#85b9cd',shirt:'#453445',pants:'#352c39',shoes:'#352c39',hair:'long',hairColor:'#b6c8cf',face:'elf',build:'slim',eyeColor:'#ee627f',...actor.appearance}};
 if(!actor.animationAction){
  if(actor.hp<=0)visual.animationAction='death';
  else if(actor.flash>0){visual.animationAction='hurt';visual.playerFrame=Math.max(0,1-actor.flash/.2)*(model.clips.hurt.length-1);}
  else if(actor.frozen>0||actor.state==='snared'){visual.animationAction='idle';visual.moving=false;}
  else if(actor.bansheeDrawLeft>0&&actor.faction!=='ally'){
   visual.charge=1.2*Math.max(.05,1-actor.bansheeDrawLeft/(actor.bansheeDrawDuration||.8));visual.bowAiming=true;
  }else if(actor.attack>0){visual.animationAction='ranged';visual.playerFrame=Math.max(0,1-actor.attack/.34)*(model.clips.ranged.length-1);}
  else if(actor.moving)visual.walking=true;
 }
 return visual;
}
export const drawBanshee=(c,actor,time,model=bansheeMotion,pose=null)=>drawPlayer(c,bansheeVisualActor(actor,model),time,model,pose);
