import {facingIndex,poseAt,projectPoint,validateMotion} from './player-motion.mjs';
import {pixelLine,pixelVolume} from './pixel-shapes.mjs';
import {validateSprite} from './pixels.mjs';
import {paintLayers} from './render-order.mjs';

const kind='gloamwhisker_rat';
const joint=(parent,x,y,z)=>({parent,position:[x,y,z]});
const joints={pelvis:joint('',0,-4,3.5),chest:joint('pelvis',0,1.5,4.5),head:joint('chest',0,5.3,4.5),
 nose:joint('head',0,8.4,3.3),earL:joint('head',-2,4.6,6.6),earR:joint('head',2,4.6,6.6),
 eyeL:joint('head',-1.8,6.3,5.2),eyeR:joint('head',1.8,6.3,5.2),
 frontPawL:joint('chest',-1.9,4.6,.3),frontPawR:joint('chest',1.9,4.6,.3),
 rearPawL:joint('pelvis',-2.9,-4.7,.3),rearPawR:joint('pelvis',2.9,-4.7,.3),
 tailBase:joint('pelvis',0,-7,2.4),tailMid:joint('tailBase',.3,-11,1),tailTip:joint('tailMid',2.4,-15,.65)};
const palette={body:'#645966',shade:'#463e4c',light:'#928593',outline:'#302d39',ear:'#bf8c9b',tail:'#bb9da7',eye:'#e6caa3'};
const shape={bodyWidth:3.6,headWidth:2.5};

function makeClip(name,length,fps){
 const moving=name!=='idle',flee=name==='scurry';
 const keys=Array.from({length},(_,frame)=>{
  const phase=frame/length*Math.PI*2,bob=moving?Math.max(0,Math.cos(phase*2))*(flee?.65:.28):Math.sin(phase)*.15;
  const riff=moving?Math.sin(phase)*(flee?1.05:.75):Math.sin(phase*2)*.85;
  const head=moving?Math.sin(phase-.65)*.34:Math.sin(phase*2)*.65;
  const sniff=moving?0:Math.max(0,Math.sin(phase*2))*.65;
  const spread=flee?1:0;
  const points={pelvis:[0,-spread*.25,bob],chest:[0,spread*.55,bob],head:[0,head+spread*.45,bob+sniff],
   nose:[0,head*1.45+spread*.6,bob+sniff],earL:[0,head*.35-spread*.25,bob-spread*.25+sniff],earR:[0,head*.35-spread*.25,bob-spread*.25+sniff],
   eyeL:[0,head+spread*.45,bob+sniff],eyeR:[0,head+spread*.45,bob+sniff],
   tailBase:[0,-spread*.4,bob],tailMid:[riff*.4,-spread,.1+bob*.38],tailTip:[riff*1.35,-spread*1.6,Math.max(0,Math.cos(phase))*.45]};
  for(const [side,sign]of [['L',1],['R',-1]])for(const [leg,lead]of [['front',1],['rear',-1]]){
   const step=Math.sin(phase)*sign*lead;
   points[leg+'Paw'+side]=moving?[0,step*(flee?3:1.9),Math.max(0,step)*(flee?1.7:1.1)]:[0,0,0];
  }
  return {frame,joints:points};
 });
 return {length,fps,loop:true,keys};
}

const stock={version:1,type:kind,name:'Gloamwhisker rat / Nocturne critter',joints,palette,shape,
 clips:{idle:makeClip('idle',8,7),walk:makeClip('walk',8,15),scurry:makeClip('scurry',8,24)}};
export const defaultGloamwhiskerMotion=()=>structuredClone(stock);
export const gloamwhiskerMotion=defaultGloamwhiskerMotion();
export function validateGloamwhiskerMotion(model){
 return model?.type===kind&&validateMotion(model,stock)&&Object.values(model.boneSprites||{}).every(views=>views&&
  Object.entries(views).every(([direction,sprite])=>+direction>=0&&+direction<8&&Number.isInteger(+direction)&&validateSprite(sprite)&&Number.isFinite(sprite.x)&&Number.isFinite(sprite.y)));
}
export function replaceGloamwhiskerMotion(model){
 if(!validateGloamwhiskerMotion(model))throw Error('Invalid Gloamwhisker rat rig');
 const copy=structuredClone(model);
 for(const key of Object.keys(gloamwhiskerMotion))delete gloamwhiskerMotion[key];
 Object.assign(gloamwhiskerMotion,copy);
}

export function drawGloamwhisker(c,actor,time,model=gloamwhiskerMotion,supplied=null){
 const chosen=model.clips[actor.animationAction]?actor.animationAction:actor.moving?(actor.startled?'scurry':'walk'):'idle';
 const clip=model.clips[chosen],frame=actor.playerFrame??(Number.isFinite(actor.poseTime)?actor.poseTime*(clip.length-1):
  chosen==='idle'?time*clip.fps+(actor.phase||0):Number.isFinite(actor.step)?actor.step:time*clip.fps);
 const d=facingIndex(actor.faceX,actor.faceY),pose=supplied||poseAt(model,chosen,frame);
 const blinking=chosen==='idle'&&Math.floor(frame%clip.length)===clip.length-1;
 const p=Object.fromEntries(Object.entries(pose).map(([name,point])=>[name,projectPoint(point,d)]));
 const pal=model.palette,queue=[];
 const add=(id,bone,bones,fn,depth=p[bone].depth)=>queue.push({id,bone,bones,fn,depth});
 const pixel=(x,y,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),1,1);};
 const skin={body:pal.tail,shade:pal.ear,light:'#d4acb2',outline:pal.outline};
 add('Rat tail','tailBase',['tailBase','tailMid','tailTip'],()=>{
  pixelLine(c,p.tailBase,p.tailMid,pal.outline,2);pixelLine(c,p.tailBase,p.tailMid,pal.tail,1);
  pixelLine(c,p.tailMid,p.tailTip,pal.tail,1);
  for(let i=1;i<=3;i++){
   const t=i/4;
   pixel(p.tailMid.x*(1-t)+p.tailTip.x*t,p.tailMid.y*(1-t)+p.tailTip.y*t,pal.ear);
  }
 },p.pelvis.depth-16);
 for(const side of ['L','R'])for(const kind of ['front','rear']){
  const paw=kind+'Paw'+side,anchor=kind==='front'?'chest':'pelvis';
  add('Rat '+kind+' paw '+side,paw,[anchor,paw],()=>{
   const upper=pose[anchor],root=projectPoint([pose[paw][0]*.84,upper[1]+(kind==='front'?1.45:-.4),upper[2]-1.3],d);
   pixelLine(c,root,p[paw],pal.outline,1);
   pixelVolume(c,pose[paw],.85,1.4,.85,d,skin);
  });
 }
 add('Rat haunches','pelvis',['pelvis'],()=>pixelVolume(c,pose.pelvis,model.shape.bodyWidth,4.1,3.25,d,pal));
 add('Rat chest','chest',['chest'],()=>pixelVolume(c,pose.chest,model.shape.bodyWidth*.82,3.8,3,d,pal));
 for(const side of ['L','R']){
  const ear='ear'+side;
  add('Rat ear '+side,ear,[ear],()=>pixelVolume(c,pose[ear],1.35,1.3,1.55,d,skin));
 }
 add('Rat head','head',['head'],()=>pixelVolume(c,pose.head,model.shape.headWidth,3.2,2.2,d,pal));
 if(d<3||d>5){
  add('Rat muzzle','nose',['head','nose'],()=>{
   pixelVolume(c,pose.nose,1.16,1.45,.86,d,pal);
   pixel(p.nose.x,p.nose.y,pal.ear);
   const spread=d===0?2.2:1.6,sign=d<4?-1:1;
   pixel(p.nose.x+(d===0?spread:sign*spread),p.nose.y+.65,pal.tail);
   if(d===0)pixel(p.nose.x-spread,p.nose.y+.65,pal.tail);
  });
  for(const side of d===2?['L']:d===6?['R']:['L','R']){
   const eye='eye'+side;
   add('Rat eye '+side,eye,[eye],()=>pixel(p[eye].x,p[eye].y,blinking?pal.outline:pal.eye),p.head.depth+12);
  }
 }
 paintLayers(queue,model,d,c,p);
}
