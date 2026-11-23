import {defaultPlayerMotion,drawPlayer,validatePlayerMotion,upgradePlayerMotion} from './player-motion.mjs';
import {buildHeroGeneration} from './hero-generation.mjs';
import {WARLOCK_EQUIPMENT,ITEMS} from './items.mjs';

export function defaultWarlockMotion(){
 const model=buildHeroGeneration(defaultPlayerMotion());
 model.type='necromancer';model.name='Purple warlock / equipped humanoid';
 Object.assign(model.palette,{body:'#5d396f',bodyShade:'#34223f',arms:'#5d396f',armShade:'#34223f',legs:'#35293f',legShade:'#231e2c'});
 // A measured stride and raised staff during channeling, on the shared skeleton.
 for(const key of model.clips.walk.keys){key.joints.handR=[1,1,3];key.joints.elbowR=[1,0,2];}
 for(const key of model.clips.cast.keys){const t=key.frame/(model.clips.cast.length-1),raise=Math.sin(t*Math.PI);key.joints.handR=[2,2,5+raise*9];key.joints.elbowR=[1,1,3+raise*4];}
 return model;
}
export const warlockMotion=defaultWarlockMotion();
export const validateWarlockMotion=model=>model?.type==='necromancer'&&!model.skeleton&&!model.robot&&validatePlayerMotion(model);
export function replaceWarlockMotion(model){if(!validateWarlockMotion(model))throw Error('Invalid warlock humanoid rig');Object.assign(warlockMotion,upgradePlayerMotion(model));}
export function warlockVisualActor(actor,model=warlockMotion){
 const equipment={...WARLOCK_EQUIPMENT,...actor.equipment};
 // Older saved warlocks still carry the original staff identifier.
 if(!ITEMS[equipment.hand1]||equipment.hand1==='staff')equipment.hand1=WARLOCK_EQUIPMENT.hand1;
 const visual={...actor,equipment,appearance:{skin:'#b9adab',shirt:'#5d396f',pants:'#35293f',shoes:'#382d39',hair:'none',hairColor:'#b6b2a8',...actor.appearance}};
 if(!actor.animationAction){
  if(actor.hp<=0){visual.animationAction='death';}
  else if(actor.flash>0){visual.hit=actor.flash;visual.animationAction='hurt';visual.playerFrame=Math.max(0,1-actor.flash/.2)*(model.clips.hurt.length-1);}
  else if(Math.max(actor.summonPulse||0,actor.healEffect||0)>0){visual.animationAction='cast';visual.playerFrame=Math.max(0,Math.min(1,1-Math.max(actor.summonPulse||0,actor.healEffect||0)/.8))*(model.clips.cast.length-1);}
  else if(actor.state==='snared'){visual.animationAction='idle';visual.moving=false;}
  else if(actor.attack>0){visual.animationAction='slash';visual.playerFrame=Math.max(0,1-actor.attack/.34)*(model.clips.slash.length-1);}
  else if(actor.moving){visual.walking=true;}
 }
 return visual;
}
export function drawWarlock(c,actor,time,model=warlockMotion,pose=null){return drawPlayer(c,warlockVisualActor(actor,model),time,model,pose);}
