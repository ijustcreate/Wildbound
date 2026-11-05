import {drawPlayer,playerMotion,poseAt,validateMotion} from './player-motion.mjs';
import {defaultOathlessCaptainMotion} from './oathless-captain-motion.mjs';
import {ALAN_EQUIPMENT} from './items.mjs';

export function defaultAlanMotion(){
  const m=defaultOathlessCaptainMotion();
  m.type='alan';m.name='Alan / Oathless Captain humanoid rig';m.artGeneration=3;
  Object.assign(m.palette,{head:'#c78956',headShade:'#9d623e',body:'#b79357',bodyShade:'#765735',arms:'#c78956',armShade:'#9d623e',legs:'#9c7140',legShade:'#62492e',outline:'#2b2a20'});
  return m;
}
export const alanMotion=defaultAlanMotion();
export const validateAlanMotion=m=>m?.type==='alan'&&validateMotion(m,defaultOathlessCaptainMotion());
export function replaceAlanMotion(m){
  if(!validateAlanMotion(m))throw Error('Invalid Alan Captain rig');
  const copy=structuredClone(m);for(const key of Object.keys(alanMotion))delete alanMotion[key];Object.assign(alanMotion,copy);
}
export function drawAlan(c,actor,time,model=alanMotion,pose=null){
  const visual={...actor,sprite:'alan',equipment:{...ALAN_EQUIPMENT,...actor.equipment},
    appearance:{skin:'#c78956',shirt:'#b79357',pants:'#9c7140',shoes:'#493523',hair:'long',hairColor:'#49301e',face:'alan',build:'standard',...actor.appearance}};
  const action=visual.hp<=0?'death':visual.hit>0?'hurt':visual.animationAction==='attack'?'slash':visual.animationAction|| (visual.moving?'walk':'idle');
  const clip=model.clips[action]||model.clips.idle;
  const frame=Number.isFinite(visual.playerFrame)?visual.playerFrame:Number.isFinite(visual.poseTime)?visual.poseTime*(clip.length-1):time*clip.fps;
  // Keep Captain animation offsets, but anchor the limbs to the regular
  // playable human proportions. The imported Captain rest pose has a very
  // short torso and narrow hips when painted by the player gear pipeline.
  const captainPose=pose||poseAt(model,action,frame),fitted={...captainPose};
  for(const [name,rest]of Object.entries(playerMotion.joints)){
    const source=model.joints[name]?.position,point=captainPose[name];
    if(!source||!point)continue;
    fitted[name]=rest.position.map((v,i)=>v+point[i]-source[i]);
  }
  // Face stabilization reads rest landmarks as well as the posed points. Keep
  // those in the same retargeted space; Captain eye offsets on the human head
  // were flattening the eyes against the brim after the pose was fitted.
  return drawPlayer(c,visual,time,model,fitted,playerMotion);
}
