import {validateMotion} from './player-motion.mjs';
import {validateSprite} from './pixels.mjs';

// Use the humanoid joint names above the waist and a separate articulated tail.
// Local X is screen-right in the front view, Y points forward, and Z is up.
const joints={
 pelvis:{parent:'',position:[0,0,0]},chest:{parent:'pelvis',position:[0,0,13]},
 neck:{parent:'chest',position:[0,0,18]},head:{parent:'neck',position:[0,0,25]},
 eyeL:{parent:'head',position:[-2.4,3.2,26]},eyeR:{parent:'head',position:[2.4,3.2,26]},
 earL:{parent:'head',position:[-4.2,.2,25]},earR:{parent:'head',position:[4.2,.2,25]},
 nose:{parent:'head',position:[0,4,24.5]},mouth:{parent:'head',position:[0,3.8,23]},
 shoulderL:{parent:'chest',position:[-5.7,-.6,13]},elbowL:{parent:'shoulderL',position:[-7,1,6]},
 handL:{parent:'elbowL',position:[-8,2,.5]},
 shoulderR:{parent:'chest',position:[5.7,-.6,13]},elbowR:{parent:'shoulderR',position:[7,1,6]},
 handR:{parent:'elbowR',position:[8,2,.5]},
 tailBase:{parent:'pelvis',position:[4.2,0,-2.2]},
 tailMid:{parent:'tailBase',position:[13,.7,-5.5]},
 tailTip:{parent:'tailMid',position:[23,-.3,-3.5]},
 flukeL:{parent:'tailTip',position:[30,3,-.5]},flukeR:{parent:'tailTip',position:[32,-3,-2]},
 comb:{parent:'handR',position:[9,2,.5]},harp:{parent:'pelvis',position:[-13,5,-2]},
};
const copy=structuredClone;
const tau=Math.PI*2;
const sum=(a,b)=>a.map((n,i)=>n+b[i]);
const diff=(a,b)=>a.map((n,i)=>n-b[i]);
const mul=(a,s)=>a.map(n=>n*s);
const norm=a=>mul(a,1/(Math.hypot(...a)||1));
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const len=(a,b)=>Math.hypot(...diff(joints[a].position,joints[b].position));
const tailLengths=[len('pelvis','tailBase'),len('tailBase','tailMid'),len('tailMid','tailTip')];
const armLengths=[len('shoulderR','elbowR'),len('elbowR','handR')];

function aimArm(p,side,target,outward){
 const shoulder=p['shoulder'+side],ray=diff(target,shoulder),axis=norm(ray);
 const [upper,lower]=armLengths,distance=Math.max(.4,Math.min(upper+lower-.05,Math.hypot(...ray)));
 const travel=(upper*upper-lower*lower+distance*distance)/(2*distance);
 const bend=Math.sqrt(Math.max(0,upper*upper-travel*travel));
 const normal=norm(cross(axis,[0,1,.12]));
 p['elbow'+side]=sum(sum(shoulder,mul(axis,travel)),mul(normal,bend*outward));
 p['hand'+side]=sum(shoulder,mul(axis,distance));
}
function tailSegment(p,from,to,length,yaw,rise){
 const along=Math.sqrt(Math.max(0,1-rise*rise));
 p[to]=sum(p[from],[Math.cos(yaw)*length*along,Math.sin(yaw)*length*along,rise*length]);
}
function moveTorso(p,chestShift,headShift){
 for(const n of ['chest','neck','shoulderL','shoulderR'])p[n]=sum(p[n],chestShift);
 for(const n of ['head','eyeL','eyeR','earL','earR','nose','mouth'])p[n]=sum(p[n],headShift);
}
function keyPose(action,phase){
 const p=Object.fromEntries(Object.entries(joints).map(([n,j])=>[n,j.position.slice()]));
 const sin=Math.sin(phase),ripple=Math.sin(phase-1.2),breath=sin*.31;
 const shimmer=.04*sin;
 let yaw=[.05,-.11,.15],rise=[-.48,-.32,.28];
 if(action==='lay'){
  moveTorso(p,[-10.6,-.65,-7.4+breath],[-21.5,-.9,-15.6+breath*.7]);
  aimArm(p,'L',[-23,2.9,-.9],1);
  aimArm(p,'R',[1.9,4.2,1.1],-1);
  yaw=[-.22,-.38,-.15];rise=[-.21,.04,.4];
 }else if(action==='brush'){
  const stroke=(1-Math.cos(phase))*.5;
  moveTorso(p,[.8,-.3,breath],[.5,-.5,breath+stroke*.5]);
  aimArm(p,'R',[10+stroke*.6,1.2,24.5-stroke*8.8],-1);
  aimArm(p,'L',[-5.7,3.3,2.8],1);
  p.comb=sum(p.handR,[.7,.25,1+.5*stroke]);
  yaw=[-.08,-.22,.09];rise=[-.46,-.42,.34];
 }else if(action==='harp'){
  const pluck=Math.sin(phase*3);
  moveTorso(p,[-.9,1,breath],[-1.5,1.5,breath-.3]);
  aimArm(p,'L',[-12,5,12.8+sin*.6],1);
  aimArm(p,'R',[-3.9-pluck*2,6.6,11.5+pluck*2.4],-1);
  yaw=[.13,.3,-.2];rise=[-.62,-.31,.31];
 }else if(action==='swim'||action==='swim_idle'){
  const strong=action==='swim'?1:.43,bob=sin*1.3;
  const forward=action==='swim'?4:1.3;
  p.pelvis=sum(p.pelvis,[0,0,bob-2]);
  moveTorso(p,[0,forward,bob-1],[0,forward*1.8,bob-.4]);
  aimArm(p,'L',[-10,4+sin*strong*3,bob+4+strong*ripple],1);
  aimArm(p,'R',[10,4-sin*strong*3,bob+4-strong*ripple],-1);
  yaw=[-1.51,-1.53+sin*.3*strong,-1.58+ripple*.27*strong];
  rise=[-.45,-.38+sin*.28*strong,.06+ripple*.42*strong];
 }else if(action==='sit'){
  moveTorso(p,[-1,.85,-.5+breath],[-1.4,1,.4+breath]);
  aimArm(p,'L',[-9,3.3,.1],1);
  aimArm(p,'R',[5.8,3.4,1.3],-1);
  yaw=[.32,.36,-.06];rise=[-.5,-.39,.46];
 }else{
  moveTorso(p,[0,0,breath],[0,0,breath]);
  aimArm(p,'L',[-7,1.5,1.5],1);
  aimArm(p,'R',[7,2,1.1],-1);
 }
 tailSegment(p,'pelvis','tailBase',tailLengths[0],yaw[0]+shimmer,rise[0]);
 tailSegment(p,'tailBase','tailMid',tailLengths[1],yaw[1]+shimmer*2,rise[1]+breath*.12);
 tailSegment(p,'tailMid','tailTip',tailLengths[2],yaw[2]+shimmer*2.6,rise[2]+ripple*.08);
 tailSegment(p,'tailTip','flukeL',len('tailTip','flukeL'),yaw[2]+.41,.38+sin*.13);
 tailSegment(p,'tailTip','flukeR',len('tailTip','flukeR'),yaw[2]-.37,-.24+ripple*.12);
 return Object.fromEntries(Object.entries(joints).map(([n,j])=>[n,diff(p[n],j.position).map(v=>Number(v.toFixed(3)))]));
}
function clip(action,length,fps){
 return {length,fps,loop:true,keys:Array.from({length},(_,frame)=>({frame,joints:keyPose(action,frame/length*tau)}))};
}
const template={
 version:1,type:'lagoon_mermaid',name:'Lagoon mermaid',joints,
 palette:{
  skin:'#d39b73',bodice:'#678565',eyes:'#526e69',
  hair:'#30283a',hairShade:'#433549',hairLight:'#5f4b61',hairEdge:'#211d2b',
  tail:'#439a78',tailShade:'#286a5d',tailInk:'#204644',tailLight:'#77c393',tailGlint:'#a8d5aa',
 },
 shape:{tailBaseWidth:12.3,tailMidWidth:8.8,tailTipWidth:4.2,flukeWidth:9.2,headScale:1.29},
 clips:{
  idle:clip('idle',12,8),sit:clip('sit',12,8),lay:clip('lay',14,8),
  brush:clip('brush',20,8),harp:clip('harp',18,9),swim_idle:clip('swim_idle',16,10),swim:clip('swim',14,11),
 },
 visibility:Object.fromEntries(Object.keys(joints).map(n=>[n,Array(8).fill(true)])),
};
export const defaultLagoonMermaidMotion=()=>copy(template);
export const lagoonMermaidMotion=defaultLagoonMermaidMotion();
export function validateLagoonMermaidMotion(model){
 return model?.type==='lagoon_mermaid'&&validateMotion(model,template)&&
  (!model.boneSprites||Object.values(model.boneSprites).every(views=>Object.entries(views)
   .every(([d,s])=>+d>=0&&+d<8&&validateSprite(s)&&Number.isFinite(s.x)&&Number.isFinite(s.y))));
}
export function replaceLagoonMermaidMotion(model){
 if(!validateLagoonMermaidMotion(model))throw Error('Invalid lagoon mermaid rig or clips.');
 const next=copy(model);
 for(const key of Object.keys(lagoonMermaidMotion))delete lagoonMermaidMotion[key];
 Object.assign(lagoonMermaidMotion,next);
}
