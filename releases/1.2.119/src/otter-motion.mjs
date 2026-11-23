import {poseAt,projectPoint,facingIndex,validateMotion} from './player-motion.mjs';
import {drawOtterPixels} from './otter-art.mjs';

const rest={pelvis:['',0,-7,9],spine:['pelvis',0,0,10],chest:['spine',0,8,11],belly:['spine',0,1,5],neck:['chest',0,12,13],head:['neck',0,17,15],jaw:['head',0,22,11.5],muzzle:['head',0,23,13.5],nose:['muzzle',0,25.2,14.8],eyeL:['head',-6.4,22,17.5],eyeR:['head',6.4,22,17.5],earL:['head',-7.5,13,17.8],earR:['head',7.5,13,17.8],tailBase:['pelvis',0,-16,7],tailMid:['tailBase',0,-25,3.5],tailTip:['tailMid',-3,-35,1.5],tailEnd:['tailTip',-4,-41,1.4],find:['belly',0,3,16]};
for(const [side,s]of [['L',-1],['R',1]])Object.assign(rest,{['shoulder'+side]:['chest',s*6,9,8],['elbow'+side]:['shoulder'+side,s*7,10,4.5],['frontPaw'+side]:['elbow'+side,s*7,13,2],['hip'+side]:['pelvis',s*6,-9,7],['knee'+side]:['hip'+side,s*7,-11,4],['rearPaw'+side]:['knee'+side,s*7,-7,1.7]});
const base=()=>Object.fromEntries(Object.entries(rest).map(([n,v])=>[n,v.slice(1)]));
const mix=(a,b,t)=>Object.fromEntries(Object.keys(a).map(n=>[n,a[n].map((v,i)=>v+(b[n][i]-v)*t)]));
function swimPose(phase){
 const p=base();for(const v of Object.values(p))v[2]-=3;
 for(const [i,n]of ['tailBase','tailMid','tailTip','tailEnd'].entries()){p[n][0]+=Math.sin(phase-i*.6)*(1+i*1.4);p[n][2]=4+Math.sin(phase-i*.5)*.6;}
 for(const [side,s]of [['L',-1],['R',1]])for(const [i,part]of ['elbow','frontPaw','knee','rearPaw'].entries()){
  const a=phase+s*.7+(i>1?Math.PI:0);p[part+side][0]=s*(i%2?9:7);p[part+side][1]+=Math.sin(a)*(i%2?5:2);p[part+side][2]=3+Math.max(0,Math.cos(a))*1.5;
 }
 return p;
}
function floatPose(phase){
 const p=swimPose(phase*.5);p.pelvis=[0,-7,7];p.spine=[0,0,7];p.chest=[0,8,7.5];p.belly=[0,1,13.5];p.neck=[0,12,7];p.head=[0,17,8.5];
 // Head tips back to face the sky; muzzle, eyes and ears follow that rotation.
 for(const n of ['jaw','muzzle','nose','eyeL','eyeR','earL','earR']){const v=base()[n],dy=v[1]-17,dz=v[2]-15;p[n]=[v[0],17+dy*.45-dz*.89,8.5+dy*.89+dz*.45];}
 p.find=[0,3+Math.sin(phase)*.3,19];
 for(const [side,s]of [['L',-1],['R',1]]){p['shoulder'+side]=[s*6,7,11.5];p['elbow'+side]=[s*7,4,15];p['frontPaw'+side]=[s*3.5,3,18.5];p['hip'+side]=[s*5,-9,8];p['knee'+side]=[s*7,-11,7];p['rearPaw'+side]=[s*(8+Math.sin(phase+s)*.8),-8+Math.sin(phase+s),7];}
 return p;
}
function sample(action,t){
 const phase=t*Math.PI*2,p=base();
 if(action==='swim'||action==='underwater'){const q=swimPose(phase);if(action==='underwater')for(const v of Object.values(q))v[2]-=18;return q;}
 if(action==='belly_float'||action==='eat'){const q=floatPose(phase);if(action==='eat'){const reach=(1-Math.cos(phase))*.5;for(const n of ['find','frontPawL','frontPawR']){q[n][1]+=reach*13;q[n][2]+=reach*1.5;}}return q;}
 if(action==='roll'||action==='return'){const blend=action==='roll'?t:1-t,q=action==='roll'?mix(sample('surface',1),floatPose(0),t):mix(floatPose(0),swimPose(0),t);for(const n of ['pelvis','spine','chest','belly'])q[n][0]+=Math.sin(blend*Math.PI)*3;return q;}
 if(action==='dive'){const q=swimPose(0),angle=t*1.1;for(const v of Object.values(q)){const y=v[1],z=v[2]-7;v[1]=y*Math.cos(angle)+z*Math.sin(angle);v[2]=7-y*Math.sin(angle)+z*Math.cos(angle)-t*14;}return q;}
 if(action==='surface'){const q=mix(sample('dive',1),swimPose(0),t);for(const n of ['frontPawL','frontPawR']){q[n][0]*=.6;q[n][1]=12;q[n][2]+=t*5;}q.find=[0,15,8*t];return q;}
 if(action==='death'){for(const v of Object.values(p))v[2]=Math.max(1,v[2]*(1-t*.7));return p;}
 if(action==='walk'||action==='run'){
  for(const [side,s]of [['L',-1],['R',1]])for(const [i,part]of ['elbow','frontPaw','knee','rearPaw'].entries()){const swing=Math.sin(phase+(i>1?Math.PI:0)+(s<0?Math.PI:0));p[part+side][1]+=swing*(i%2?3.5:1.5);p[part+side][2]+=Math.max(0,swing)*(i%2?1.4:.8);}
  for(const n of ['pelvis','spine','chest','head','neck','jaw','muzzle','nose','eyeL','eyeR','earL','earR'])p[n][2]+=Math.abs(Math.sin(phase))*.6;
 }else for(const n of ['chest','head','neck','muzzle','jaw','nose','eyeL','eyeR','earL','earR'])p[n][2]+=Math.sin(phase)*.35;
 for(const [i,n]of ['tailBase','tailMid','tailTip','tailEnd'].entries())p[n][0]+=Math.sin(phase-i*.45)*(.3+i*.65);
 return p;
}
export function defaultOtterMotion(){
 const joints=Object.fromEntries(Object.entries(rest).map(([n,v])=>[n,{parent:v[0],position:v.slice(1)}])),clips={};
 for(const [name,length,fps,loop]of [['idle',33,8,true],['walk',25,18,true],['run',25,25,true],['swim',33,18,true],['dive',19,20,false],['underwater',25,12,true],['surface',19,20,false],['roll',21,20,false],['belly_float',33,9,true],['eat',25,10,true],['return',19,18,false],['death',19,18,false]]){
  clips[name]={length,fps,loop,keys:Array.from({length},(_,frame)=>{const p=sample(name,frame/(length-1));return {frame,joints:Object.fromEntries(Object.keys(rest).map(n=>[n,p[n].map((v,i)=>v-joints[n].position[i])]))};})};
 }
 return {version:1,type:'river_otter',name:'River otter / swimming and foraging',joints,clips,ik:Object.fromEntries(['L','R'].flatMap(side=>[['frontPaw','shoulder','elbow',1],['rearPaw','hip','knee',-1]].map(([end,root,mid,bend])=>[end+side,{end:end+side,root:root+side,mid:mid+side,bend,enabled:true}]))),palette:{outline:'#302b28',shade:'#523e32',body:'#79553e',light:'#aa8258',cream:'#dfc69a',creamShade:'#ad9470',creamLight:'#f0dbaf',nose:'#242624',find:'#9b8ca5'},shape:{bodyWidth:8,bodyHeight:6.5,headWidth:9.5,headHeight:6.5,muzzleWidth:7.8,tailWidth:5.3,pawSize:2.8},visibility:Object.fromEntries(Object.keys(joints).map(n=>[n,Array(8).fill(true)])),provenance:{source:'Native Wildbound otter rig; hand-authored joint clips',revision:1}};
}
export const otterMotion=defaultOtterMotion();
export let otterMotionRevision=0;
export const validateOtterMotion=m=>m?.type==='river_otter'&&validateMotion(m,defaultOtterMotion());
export function replaceOtterMotion(m){if(!validateOtterMotion(m))throw Error('Invalid otter rig');for(const key of Object.keys(otterMotion))delete otterMotion[key];Object.assign(otterMotion,structuredClone(m));otterMotionRevision++;}
export function otterAction(a,model=otterMotion){return a.hp<=0?'death':a.frozen>0||a.state==='snared'?'idle':a.animationAction&&model.clips[a.animationAction]?a.animationAction:a.swimming?'swim':a.moving?(a.state==='flee'?'run':'walk'):'idle';}
export function drawOtterRig(c,a,time=0,model=otterMotion,supplied=null){
 const action=otterAction(a,model),clip=model.clips[action]||model.clips.idle,frame=a.playerFrame??(a.frozen>0||a.state==='snared'?0:Number.isFinite(a.otterAnimationProgress)?a.otterAnimationProgress*(clip.length-1):!clip.loop?Math.min(clip.length-1,(a.deathTimer||a.animationTime||0)*clip.fps):a.moving&&Number.isFinite(a.step)?a.step*3:time*clip.fps),pose=supplied||poseAt(model,action,frame),d=facingIndex(a.faceX,a.faceY);
 drawOtterPixels(c,model,pose,d,{...a,animationAction:action});return Object.fromEntries(Object.entries(pose).map(([n,v])=>[n,projectPoint(v,d)]));
}
export function drawOtter(c,a,time,size=47){c.save();c.translate(Math.round(a.x),Math.round(a.y));c.scale(size/47*.72,size/47*.72);c.imageSmoothingEnabled=false;const p=drawOtterRig(c,a,time);c.restore();return p;}
