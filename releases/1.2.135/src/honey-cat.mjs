import data from './graveyard_cat-donor-data.mjs';
import {poseAt,projectPoint,facingIndex,validateMotion} from './player-motion.mjs';
import {pixelVolume,pixelLine,pixelPolygon} from './pixel-shapes.mjs';
import {paintLayers} from './render-order.mjs';
import {honeyCatCoat} from './honey-cat-coats.mjs';

const stockPalette={body:'#3e4147',shade:'#272f35',light:'#646d70',outline:'#222c30',cream:'#ebe4cd',eye:'#b7ce77',nose:'#ce9b89'};
const headLift={neck:1,head:2.8,jaw:2.8,eyeL:2.8,eyeR:2.8,earL:2.8,earR:2.8};
export function defaultHoneyCat(){
 const model=structuredClone(data);
 for(const [joint,lift] of Object.entries(headLift)){
  model.joints[joint].position[2]+=lift;
  for(const action of ['sleep','death'])for(const key of model.clips[action].keys){
   if(key.joints[joint])key.joints[joint][2]-=lift;
  }
 }
 return {version:1,type:'graveyard_cat',name:'Cemetery cat / Honey rig',...model,palette:{...stockPalette},
  shape:{bodyWidth:4,headRadius:4.5,limbWidth:2.5,tailWidth:2},
  visibility:Object.fromEntries(Object.keys(model.joints).map(n=>[n,Array.from({length:8},(_,d)=>
   !n.startsWith('eye')||(![3,4,5].includes(d)&&!(n==='eyeR'&&d===2)&&!(n==='eyeL'&&d===6)))]))};
}
export const honeyCatMotion=defaultHoneyCat();
export const validateHoneyCat=m=>m?.type==='graveyard_cat'&&validateMotion(m,defaultHoneyCat());
export function replaceHoneyCat(m){if(!validateHoneyCat(m))throw Error('Invalid cemetery cat rig');Object.assign(honeyCatMotion,structuredClone(m));}

function drawCatEar(c,pose,d,side,near,colors,inner){
 const root=pose['ear'+side],sign=side==='L'?-1:1;
 const profile=d===2||d===6,x=root[0]+sign*.35,y=root[1]-1.1+(profile&&!near?2.25:0);
 const z=Math.max(root[2]-.65,pose.head[2]+2),tipZ=z+(profile&&!near?4.85:5.5);
 const points=[[x-sign*1.7,y-1.55,z],[x+sign*.9,y-.9,tipZ],[x+sign*2.05,y+2,z]];
 pixelPolygon(c,points.map(v=>projectPoint(v,d)),colors.outline);
 pixelPolygon(c,[[x-sign*.8,y-1,z+.7],[x+sign*.82,y-.7,tipZ-1.25],
  [x+sign*1.38,y+1.25,z+.65]].map(v=>projectPoint(v,d)),near?colors.light:colors.body);
 if(d!==4&&!(profile&&!near))pixelPolygon(c,[[x-sign*.18,y-.45,z+.85],[x+sign*.83,y-.36,tipZ-2.35],
  [x+sign*.82,y+.78,z+.78]].map(v=>projectPoint(v,d)),d<=2||d>=6?inner:colors.body);
}

export function drawHoneyCat(c,a,time=0,model=honeyCatMotion,supplied=null){
 const action=a.animationAction||(a.hp<=0&&a.hp!==undefined?'death':a.moving?(a.idle==='run'?'run':'walk'):a.idle==='sleep'?'sleep':a.idle==='sit'?'sit':'idle');
 const chosen=model.clips[action]?action:'idle',clip=model.clips[chosen],frame=a.playerFrame??(['sit','sleep'].includes(chosen)?clip.length-1:time*clip.fps),pose=supplied||poseAt(model,chosen,frame),d=facingIndex(a.faceX,a.faceY),p=Object.fromEntries(Object.entries(pose).map(([n,v])=>[n,projectPoint(v,d)])),q=[],pal=model.palette;
 const coat=Object.keys(stockPalette).every(key=>pal[key]===stockPalette[key])?honeyCatCoat(a):null;
 const fur=coat?.fur||{body:pal.body,shade:pal.shade,light:pal.light,outline:pal.outline};
 const white={...fur,body:pal.cream,light:'#fff4da',shade:'#a9b7a7'};
 const paws=coat?.paws||white,bib=coat?.bib||white,muzzle=coat?.muzzle||white;
 const add=(id,bone,fn,depth=p[bone].depth)=>{if(model.visibility[bone]?.[d]!==false)q.push({id,bone,bones:[bone],depth,fn});};
 add('Cat flexible tail','tailMid',()=>{
  pixelLine(c,p.tailBase,p.tailMid,fur.outline,3);
  if(coat)pixelLine(c,p.tailBase,p.tailMid,fur.body,2);
  pixelLine(c,p.tailMid,p.tailTip,coat?.tip.body||fur.body,2);
 });
 for(const side of['L','R'])for(const[a,b,end]of[['shoulder','elbow','frontPaw'],['hip','knee','rearPaw']])add('Cat '+end+' '+side,end+side,()=>{
  pixelLine(c,p[a+side],p[b+side],fur.body,3);pixelLine(c,p[b+side],p[end+side],paws.shade,2);
  pixelVolume(c,pose[end+side],1.8,2.4,1.6,d,paws);
 });
 add('Cat body','chest',()=>{const mid=pose.pelvis.map((v,i)=>(v+pose.chest[i])/2);pixelVolume(c,mid,4,9,4.5,d,fur,coat?.bodyPattern);});
 add('Cat white bib','neck',()=>pixelVolume(c,pose.neck,3,3.5,4,d,bib));
 add('Cat head','head',()=>pixelVolume(c,pose.head,4.6,4,4.4,d,fur,coat?.headPattern));
 for(const side of ['L','R']){
  const bone='ear'+side,other=side==='L'?'earR':'earL',near=p[bone].depth>=p[other].depth;
  const ear=(side==='R'&&coat?.earRight)||coat?.ears||fur;
  add('Cat ear '+side,bone,()=>drawCatEar(c,pose,d,side,near,ear,pal.nose),p.head.depth+(near ? .42 : -.6));
 }
 if(![3,4,5].includes(d))add('Cat cream muzzle','jaw',()=>{
  pixelVolume(c,pose.jaw,3,2.3,1.8,d,muzzle);const j=p.jaw;
  c.fillStyle=pal.nose;c.fillRect(Math.round(j.x),Math.round(j.y)-1,2,1);
  for(const sign of[-1,1])pixelLine(c,{x:j.x+sign*2,y:j.y},{x:j.x+sign*5,y:j.y-1},coat?muzzle.light:pal.cream,1);
 },p.head.depth+.2);
 for(const side of ['L','R'])add('Cat eye '+side,'eye'+side,()=>{
  const e=p['eye'+side];c.fillStyle=fur.outline;c.fillRect(Math.round(e.x)-1,Math.round(e.y)-1,3,2);
  if(chosen!=='sleep'){c.fillStyle=coat?.eye||pal.eye;c.fillRect(Math.round(e.x)-1,Math.round(e.y),2,1);}
 },p.head.depth+.8);
 paintLayers(q,model,d,c,p);return p;
}
