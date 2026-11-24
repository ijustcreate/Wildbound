export const ANGLE_JOINTS=['handL','handR','footL','footR'];
export const wrapAngle=value=>((value+180)%360+360)%360-180;
export function jointAngle(model,clipName,frame,direction,joint,restOnly=false) {
  const rest=model.jointAngles?.[direction]?.[joint]||0,clip=model.clips[clipName]||model.clips.idle;
  if(restOnly||!clip)return rest;
  const keys=clip.keys.filter(k=>Number.isFinite(k.angles?.[direction]?.[joint])).sort((a,b)=>a.frame-b.frame);
  if(!keys.length)return rest;
  const t=clip.loop?((frame%clip.length)+clip.length)%clip.length:Math.max(0,Math.min(clip.length-1,frame));
  let left=keys.filter(k=>k.frame<=t).at(-1),right=keys.find(k=>k.frame>t),lt=left?.frame,rt=right?.frame;
  if(!left){left=clip.loop?keys.at(-1):keys[0];lt=left.frame-(clip.loop?clip.length:0);}
  if(!right){right=clip.loop?keys[0]:keys.at(-1);rt=right.frame+(clip.loop?clip.length:0);}
  let f=rt===lt?0:Math.max(0,Math.min(1,(t-lt)/(rt-lt)));
  if(left.interpolation?.[joint]==='hold')f=0;else if(left.interpolation?.[joint]==='smooth')f=f*f*(3-2*f);
  const a=left.angles[direction][joint],b=right.angles[direction][joint];
  return wrapAngle(a+wrapAngle(b-a)*f);
}
export function validAngles(value,joints) {
  return value===undefined || (!!value && Object.entries(value).every(([d,entries])=>/^[0-7]$/.test(d)&&entries&&Object.entries(entries).every(([n,v])=>joints[n]&&ANGLE_JOINTS.includes(n)&&Number.isFinite(v)&&Math.abs(v)<=180)));
}
