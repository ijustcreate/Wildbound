import {applyIK} from './ik.mjs';
const copy=v=>structuredClone(v);
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const add=(a,b)=>a.map((v,i)=>v+b[i]);
export const NATIVE_STRIDE={walk:28,run:56};

// These are ordinary editable keys on the current Captain-derived rig.
// Only recognized shipping clips on recognized rest geometry are replaced.
export function refineNativeLocomotion(model,shipping){
 if(model.locomotionRevision===2||model.nativeHumanoidRevision!==1||!same(model.joints,shipping.joints))return model;
 const legacy=model.locomotionRevision===1?authorLocomotion(shipping,shipping,1):null;
 return authorLocomotion(model,legacy||shipping,2);
}
function authorLocomotion(model,shipping,revision){
 const target=copy(model),source={};
 for(const action of ['idle','walk','run']){
  if(!same(model.clips[action],shipping.clips[action]))continue;
  source[action]=copy(model.clips[action]);
  const count=action==='idle'?24:24,run=action==='run',moving=action!=='idle';
  const keys=Array.from({length:count},(_,frame)=>{
   const phase=frame/count,a=phase*Math.PI*2;
   const pose=Object.fromEntries(Object.entries(model.joints).map(([n,j])=>[n,[...j.position]]));
   // Weight stays over the feet; chest breathes while the skull stays quiet.
   const compression=moving?(revision===1?(run?3.3:2.35)+(1-Math.cos(a*2))*.45:run?3.5+(1-Math.cos(a*2))*.18:1.6+Math.cos(a*2)*.8):.65;
   for(const [n,p]of Object.entries(pose))if(!/^(knee|foot)/.test(n))p[2]-=compression;
   if(!moving){
    for(const n of ['chest','shoulderL','shoulderR'])pose[n][2]+=Math.sin(a)*.16;
    for(const n of ['head','eyeL','eyeR','earL','earR','nose','mouth'])pose[n][1]-=.3;
   }
   const twist=moving?Math.sin(a)*.07:0;
   for(const n of ['chest','head','eyeL','eyeR','earL','earR','nose','mouth','shoulderL','shoulderR']){
    const p=pose[n],x=p[0],y=p[1];p[0]=x*Math.cos(twist)-y*Math.sin(twist);p[1]=x*Math.sin(twist)+y*Math.cos(twist);
   }
   for(const n of ['hipL','hipR']){const p=pose[n],x=p[0],y=p[1];p[0]=x*Math.cos(-twist*.5)-y*Math.sin(-twist*.5);p[1]=x*Math.sin(-twist*.5)+y*Math.cos(-twist*.5);}
   for(const n of ['shoulderL','shoulderR'])pose[n][2]-=.25;
   for(const side of ['L','R']){
    const sign=side==='L'?-1:1,u=(phase+(side==='R'?.5:0))%1,stance=revision===1?(run?.38:.6):(run?.30:.52);
    const span=((revision===1?{walk:24,run:44}:NATIVE_STRIDE)[action]||0)*stance/(43/48),half=span/2;
    const swing=Math.max(0,(u-stance)/(1-stance)),smooth=swing*swing*(3-2*swing);
    const foot=pose['foot'+side];
    if(moving){foot[1]=u<stance?half-span*u/stance:-half+span*smooth;foot[2]+=u<stance?0:Math.sin(swing*Math.PI)*(revision===1?(run?4.4:2.4):(run?3:1.3));}
    const hip=pose['hip'+side];pose['knee'+side]=[hip[0],hip[1]+(moving?2.5:1),hip[2]-6];
    const shoulder=pose['shoulder'+side],swingArm=moving?-Math.sin((phase+(side==='R'?.5:0))*Math.PI*2)*(run?3.2:2):.3;
    pose['elbow'+side]=add(shoulder,[sign*1.1,swingArm*.45,-4.1]);
    pose['hand'+side]=add(shoulder,[sign*1.6,swingArm,-7.8+(moving?.8:0)]);
   }
   // Resolve the walking-plane pole before authoring the sole compensation.
   for(let i=0;i<(revision===1?4:1);i++)applyIK(model,pose);
   const angles={};
   for(let d=0;d<8;d++){
    const angle=d*Math.PI/4,project=p=>[p[0]*Math.cos(angle)-p[1]*Math.sin(angle),(p[0]*Math.sin(angle)+p[1]*Math.cos(angle))*.5-p[2]];
    angles[d]={};
    for(const side of ['L','R']){
     const n='foot'+side;if(Object.hasOwn(model.jointAngles?.[d]||{},n))continue;
     const ankle=project(pose[n]),knee=project(pose['knee'+side]),lift=Math.max(0,pose[n][2]-model.joints[n].position[2]),weight=Math.max(0,1-lift/1.8);
     angles[d][n]=-Math.atan2(knee[0]-ankle[0],ankle[1]-knee[1])*180/Math.PI*(revision===1?weight:1);
    }
   }
   return {frame,angles,joints:Object.fromEntries(Object.entries(pose).map(([n,p])=>[n,p.map((v,i)=>v-model.joints[n].position[i])]))};
  });
  target.clips[action]={...target.clips[action],length:count,fps:action==='idle'?6:run?30:24,loop:true,keys};
 }
 if(!Object.keys(source).length)return model;
 target.locomotionRevision=revision;target.locomotionSource=source;return target;
}

// Render history is bounded, never saved and never changes collision/input.
export class LocomotionHistory{
 constructor(){this.samples=new Map();}
 sample(actor,time,action,frame){
  if(actor.id==null||actor.animationAction||actor.poseTime!==undefined||actor.rigOverride||actor.playerFrame!==undefined)return {};
  const key=actor.id,old=this.samples.get(key),dt=old?time-old.time:0;
  if(old&&dt<=0&&dt>-.25)return old.presentation;
  const target=((Math.atan2(-(actor.faceX||0),actor.faceY??1)*4/Math.PI)%8+8)%8;
  const approach=(value,rate)=>{const delta=((target-value+12)%8)-4;return value+delta*(1-Math.exp(-Math.max(0,dt)*rate));};
  const valid=old&&dt>0&&dt<.25&&Math.hypot(actor.x-old.x,actor.y-old.y)<100;
  const direction=valid?approach(old.direction,16):target,head=valid?approach(old.head,27):target;
  const locomotion=['idle','walk','run'].includes(action);
  let transition=valid?old.transition:null;
  if(!locomotion)transition=null;
  if(valid&&old.action!==action&&locomotion&&['idle','walk','run'].includes(old.action))transition={action:old.action,frame:old.frame,started:time};
  if(transition&&time-transition.started>=.11)transition=null;
  const presentation={locomotionVisualDirection:direction,locomotionHeadDirection:head,
   locomotionTurning:Math.abs(((target-direction+12)%8)-4)>.025,
   locomotionTransition:transition?{...transition,weight:Math.min(1,(time-transition.started)/.11)}:null};
  if(this.samples.size>=256&&!this.samples.has(key))this.samples.delete(this.samples.keys().next().value);
  this.samples.set(key,{x:actor.x,y:actor.y,time,action,frame,direction,head,transition,presentation});return presentation;
 }
}
