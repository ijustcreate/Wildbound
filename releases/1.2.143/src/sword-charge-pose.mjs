import {applyIK} from './ik.mjs';
import {itemKind} from './items.mjs';

const clamp=t=>Math.max(0,Math.min(1,Number(t)||0));
const smooth=t=>{t=clamp(t);return t*t*(3-2*t);};
const mix=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
const distance=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));
const copy=pose=>Object.fromEntries(Object.entries(pose).map(([name,p])=>[name,[...p]]));
const upper=name=>!name.startsWith('foot')&&!name.startsWith('knee');

// A transient overlay on the existing rig. No rest joint, clip or authored
// wearable is rewritten. Feet remain the support points throughout the coil.
export function applySwordChargePose(pose,model,actor,time,{charging=false,action='',progress=0,restPose=null}={}){
 if(model.nativeHumanoidRevision!==1||actor.hp<=0||actor.heldChickenId||actor.swimming||actor.jumpHeight>0||actor.dashTime>0||actor.hit>0)return pose;
 const releasePower=Number(actor.swordReleasePower??actor.swordPolish?.power??actor.swordDash?.power);
 const releasing=!charging&&actor.attack>0&&action==='swipe_big'&&Number.isFinite(releasePower);
 if(!charging&&!releasing)return pose;
 const power=clamp(charging?actor.charge/1.2:releasePower),entry=smooth(power*1.2/.16);
 const holdWeight=charging?entry:1-smooth(progress/.24);
 if(holdWeight>0){
  const target=copy(restPose||pose),sink=.45+power*1.15,breathe=charging?Math.sin(time*3.2)*.12*power:0;
  const scale=(model.joints.pelvis?.position?.[2]||17.12)/17.12;
  for(const [name,p]of Object.entries(target))if(upper(name)){
   // A small rearward coil and a lower center of mass; the head moves with the
   // torso, leaving the face readable rather than bobbing independently.
   const weight=/^(hip|pelvis)/.test(name)?.35:1;
   p[1]-=(.45+power*.8)*weight*scale;
   p[2]-=(sink-breathe)*scale;
  }
  for(const [slot,side,sign]of [['hand1','R',1],['hand2','L',-1]]){
   if(itemKind(actor.equipment?.[slot])!=='sword')continue;
   const root=target['shoulder'+side],rest=model.joints;
   if(!root||!rest['hand'+side]||!rest['elbow'+side])continue;
   const armScale=(distance(rest['shoulder'+side].position,rest['elbow'+side].position)+distance(rest['elbow'+side].position,rest['hand'+side].position))/8.9;
   target['hand'+side]=[root[0]+sign*(4.3+power*.3)*armScale,root[1]-(3.4+power*.9)*armScale,root[2]-(6.6+power*.2)*armScale];
   target['elbow'+side]=[root[0]+sign*4*armScale,root[1]+.5*armScale,root[2]-3*armScale];
  }
  applyIK(model,target);
  // Capture a quick tap partway into its entrance, instead of forcing that
  // small charge into the completed windup on the first release frame.
  if(releasing&&entry<1&&restPose)for(const name of Object.keys(target))if(restPose[name])target[name]=mix(restPose[name],target[name],entry);
  if(releasing&&entry<1)applyIK(model,target);
  for(const name of Object.keys(pose))if(target[name])pose[name]=mix(pose[name],target[name],holdWeight);
 }
 if(releasing){
  // Push the chest into the cut, then settle back into the existing clip. The
  // support feet stay fixed, so the dash never looks like a running animation.
  const thrust=Math.sin(clamp((progress-.15)/.58)*Math.PI)*(1-holdWeight)*(.5+power*.65);
  for(const [name,p]of Object.entries(pose))if(upper(name)&&!/^(hip|pelvis)/.test(name))p[1]+=thrust;
 }
 applyIK(model,pose);
 return pose;
}

// Use the exact same blend as the hand pose: the blade cannot pop upright on
// the release frame. The return to the stock swipe finishes before contact.
export function swordChargeBladeVector(actor,side,{charging=false,progress=0,stock=[0,0,14]}={}){
 const power=clamp(charging?actor.charge/1.2:actor.swordReleasePower??actor.swordPolish?.power??actor.swordDash?.power);
 const held=[side==='R'?3:-3,-16-power*1.5,2.8+power*.6];
 const entry=smooth(power*1.2/.16);
 if(charging)return mix(stock,held,entry);
 const captured=mix([side==='R'?3:-3,13,6],held,entry);
 return mix(captured,stock,smooth(progress/.24));
}
