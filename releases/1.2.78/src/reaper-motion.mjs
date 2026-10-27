import {defaultPlayerMotion,drawPlayer,validatePlayerMotion,upgradePlayerMotion} from './player-motion.mjs';
import {buildHeroGeneration} from './hero-generation.mjs';
import {addReaperClips} from './reaper-clips.mjs';
import {REAPER_EQUIPMENT} from './items.mjs';
export function defaultReaperMotion(){
 const m=buildHeroGeneration(defaultPlayerMotion());
 // Author the Reaper's new keys against the final humanoid proportions.
 for(const name of ['scythe_sweep','scythe_reap','reaper_raise','reaper_channel'])delete m.clips[name];
 addReaperClips(m);
 m.type='grim_reaper';m.name='Grim Reaper / equipped humanoid';
 Object.assign(m.palette,{head:'#d7ceb0',headShade:'#a49c84',body:'#292b32',bodyShade:'#16171e',arms:'#292b32',armShade:'#16171e',legs:'#292b32',legShade:'#16171e'});
 return m;
}
export const reaperMotion=defaultReaperMotion();
export const validateReaperMotion=m=>m?.type==='grim_reaper'&&validatePlayerMotion(m);
export function replaceReaperMotion(m){if(!validateReaperMotion(m))throw Error('Invalid Reaper humanoid rig');Object.assign(reaperMotion,addReaperClips(upgradePlayerMotion(m)));}
export function reaperVisualActor(a){
 const visual={...a,equipment:{...REAPER_EQUIPMENT,...a.equipment},appearance:{skin:'#d7ceb0',shirt:'#292b32',pants:'#292b32',shoes:'#16171e',hair:'none',...a.appearance}};
 if(visual.poseTime===null)delete visual.poseTime;
 if(a.hp<=0){visual.animationAction='death';visual.poseTime=Math.min(1,(a.deathTimer||0)/.5);}
 return visual;
}
export function drawReaper(c,a,time,m=reaperMotion,pose=null){return drawPlayer(c,reaperVisualActor(a),time,m,pose);}
