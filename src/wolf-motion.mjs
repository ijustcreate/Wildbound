import {defaultLionMotion, lionAction, lionFrame} from './lion-motion.mjs';
import {withCompanionClips} from './companion-motion.mjs';
import {poseAt, projectPoint, facingIndex, limb, ellipse, validateMotion} from './player-motion.mjs';
import {paintLayers} from './render-order.mjs';

// Independent canine rig: long muzzle, upright ears, lean legs and a bushy low tail.
export function defaultWolfMotion() {
  const m = defaultLionMotion();
  m.name = 'Wolf';
  m.palette = {body:'#778793', shade:'#3d4b59', head:'#94a2aa', legs:'#52616d', tail:'#647682', cream:'#d9ded8', eyes:'#e6b95f'};
  delete m.boneSprites;
  m.shape = {};
  for (const [n,j] of Object.entries(m.joints)) {
    j.position[0] *= .78;
    if (/ear/.test(n)) j.position[2] += 3;
    if (['face','muzzle','nose','eyeL','eyeR'].includes(n)) j.position[1] += 4;
    if (n === 'tailMid') j.position = [1,-21,10];
    if (n === 'tailTip') j.position = [2,-29,5];
  }
  // A canine trot keeps diagonal paws paired, with a flatter back than a cat's bound.
  for(const name of ['walk','run'])for(const key of m.clips[name].keys){
    const phase=key.frame/8*Math.PI*2, stride=name==='run'?5:3;
    for(const [side,offset] of [['L',0],['R',Math.PI]])for(const front of [true,false]){
      const a=phase+offset+(front?0:Math.PI), swing=Math.sin(a),lift=Math.max(0,-swing)*3;
      key.joints[(front?'frontPaw':'rearPaw')+side]=[0,swing*stride,lift];
      key.joints[(front?'elbow':'hock')+side]=[0,swing*stride*.5,lift*.55];
    }
    key.joints.chest=[0,0,Math.abs(Math.sin(phase))* .45];
    key.joints.pelvis=[0,0,Math.abs(Math.sin(phase))* .45];
    key.joints.tailMid=[Math.sin(phase)*.8,0,0];
    key.joints.tailTip=[Math.sin(phase-.4)*1.5,0,0];
  }
  return m;
}
export const wolfMotion = defaultWolfMotion();
export const validateWolfMotion = m => validateMotion(withCompanionClips(structuredClone(m)), defaultWolfMotion());
export function replaceWolfMotion(m) {
  if (!validateWolfMotion(m)) throw Error('Invalid wolf rig');
  for (const key of Object.keys(wolfMotion)) delete wolfMotion[key];
  Object.assign(wolfMotion, withCompanionClips(structuredClone(m)));
}
export function drawWolf(c, actor, time, model=wolfMotion, suppliedPose=null) {
  const d=facingIndex(actor.faceX,actor.faceY), pose=suppliedPose || poseAt(model,lionAction(actor),lionFrame(actor,time,model));
  const p=Object.fromEntries(Object.entries(pose).map(([n,v])=>[n,projectPoint(v,d)]));
  const pal=model.palette, q=[];
  const add=(bone,id,fn)=>q.push({bone,id,depth:p[bone].depth,fn});
  c.save();
  if(actor.alpha)c.scale(1.18,1.18);
  add('tailBase','Bushy tail',()=>{limb(c,p.tailBase,p.tailMid,5,pal.shade);limb(c,p.tailMid,p.tailTip,4,pal.tail);ellipse(c,p.tailTip.x,p.tailTip.y,1.5,2,pal.shade);});
  for(const side of ['L','R'])for(const front of [true,false]) {
    const a=(front?'shoulder':'hip')+side,b=(front?'elbow':'hock')+side,end=(front?'frontPaw':'rearPaw')+side;
    add(a,(front?'Front':'Rear')+' leg '+side,()=>{limb(c,p[a],p[b],3,pal.shade);limb(c,p[b],p[end],2,pal.legs);ellipse(c,p[end].x,p[end].y,2.1,1.3,pal.cream);});
  }
  add('chest','Lean body',()=>{limb(c,p.pelvis,p.chest,8,pal.shade);limb(c,{x:p.pelvis.x,y:p.pelvis.y-2},{x:p.chest.x,y:p.chest.y-2},6,pal.body);limb(c,p.chest,p.neck,5,pal.head);});
  add('head','Canine head',()=>{
    for(const side of ['L','R']){const e=p['ear'+side];for(let row=0;row<6;row++){c.fillStyle=row<2?pal.shade:pal.head;c.fillRect(Math.round(e.x)-Math.floor(row/2),Math.round(e.y)+row,1+Math.floor(row/2)*2,1);}c.fillStyle='#746e79';c.fillRect(Math.round(e.x),Math.round(e.y)+3,1,2);}
    ellipse(c,p.head.x,p.head.y,3.6,4,pal.head);
    limb(c,p.head,p.muzzle,4,pal.cream);limb(c,p.muzzle,p.nose,2.5,pal.cream);
    ellipse(c,p.nose.x,p.nose.y,1.6,1.2,'#202d36');
    if(d<3||d>5)for(const side of ['L','R']){const e=p['eye'+side];c.fillStyle=pal.shade;c.fillRect(Math.round(e.x)-1,Math.round(e.y),3,2);c.fillStyle=pal.eyes;c.fillRect(Math.round(e.x),Math.round(e.y),1,1);}
    if(actor.alpha){limb(c,p.neck,p.chest,2,pal.cream);}
    if(actor.attack>0){c.fillStyle='#eadfd2';c.fillRect(Math.round(p.muzzle.x)-1,Math.round(p.muzzle.y)+2,2,2);}
  });
  paintLayers(q,model,d,c,p);
  c.restore();
}
