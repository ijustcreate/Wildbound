import captain from './oathless-captain-data.mjs';
import {breaststrokeNativePlayer,widenHumanoidStance} from './humanoid-chat-update.mjs';
import {buildCombatPass} from './combat-animation.mjs';
import {refineNativeLocomotion} from './native-locomotion.mjs';

const copy=v=>structuredClone(v);
const add=(a,b)=>a.map((v,i)=>v+b[i]);
const sub=(a,b)=>a.map((v,i)=>v-b[i]);
const mul=(a,k)=>a.map(v=>v*k);
const length=a=>Math.hypot(...a);
const canonical=v=>JSON.stringify(v,(_k,x)=>x&&typeof x==='object'&&!Array.isArray(x)?Object.fromEntries(Object.entries(x).sort(([a],[b])=>a.localeCompare(b))):x);
const same=(a,b)=>canonical(a)===canonical(b);
const facial=new Set(['eyeL','eyeR','earL','earR','nose','mouth']);
let combatShipping;

// Transfer parent-relative segment directions, then restore target lengths.
// Output remains normal editable delta keys; no donor runtime is required.
export function retargetHumanoidClip(source,target,clip) {
  const ratio=target.joints.head.position[2]/source.joints.head.position[2];
  const keys=clip.keys.map(key=>{
    const absolute=Object.fromEntries(Object.entries(source.joints).map(([n,j])=>[n,add(j.position,key.joints[n]||[0,0,0])]));
    // The Captain has spine/neck handles between joints on the older player.
    // Reconstruct those handles along the animated torso, not at a static rest.
    const between=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
    if(!absolute.spine&&absolute.pelvis&&absolute.chest)absolute.spine=between(absolute.pelvis,absolute.chest,.55);
    if(!absolute.neck&&absolute.chest&&absolute.head)absolute.neck=between(absolute.chest,absolute.head,.75);
    const points={};
    const visit=n=>{
      if(points[n])return points[n];
      const joint=target.joints[n],parent=joint.parent;
      if(!parent)return points[n]=add(joint.position,mul(key.joints[n]||[0,0,0],ratio));
      const anchor=visit(parent),rest=sub(joint.position,target.joints[parent].position);
      if(!absolute[n]||!absolute[parent])return points[n]=add(anchor,rest);
      const vector=sub(absolute[n],absolute[parent]);
      // Keep the donor's facial rotation, but use the target facial dimensions.
      const size=length(rest),distance=length(vector);
      return points[n]=add(anchor,distance>.0001?mul(vector,size/distance):rest);
    };
    for(const n of Object.keys(target.joints))visit(n);
    return {frame:key.frame,joints:Object.fromEntries(Object.entries(points).map(([n,p])=>[n,sub(p,target.joints[n].position)]))};
  });
  return {...copy(clip),keys};
}

// Fill the Captain/April action library from the complete player library.
// Existing named clips and custom poses always take precedence.
export function completeHumanoidActions(target,source) {
  const added=[];
  for(const [name,clip] of Object.entries(source.clips))if(!target.clips[name]){
    target.clips[name]=retargetHumanoidClip(source,target,clip);added.push(name);
  }
  target.playerActionCoverage={revision:1,added};
  return target;
}

const DONOR_ACTIONS={idle:'idle',walk:'walk',run:'run',hurt:'hurt',death:'death',
  dash:'dodge',jump_takeoff:'jump_start',jump_air:'jump',jump_fall:'jump',land:'land',
  swim:'swim',interact:'kneel_down',get_up:'kneel_up',revive:'kneel',
  slash:'slash',swipe_one:'slash',swipe_two:'thrust',swipe_big:'heavy_slash',
  block:'guard',shield:'guard',parry:'parry'};
const baseActions=new Set(['idle','walk','run','hurt','death','dash','jump_takeoff','jump_air','jump_fall','land','swim','interact','get_up','revive']);

let locomotionShipping;
export function upgradeNativeHumanoid(model,shipping){
 const result=upgradeNativeHumanoidBase(model,shipping);
 if(result.nativeHumanoidRevision!==1)return result;
 locomotionShipping??=upgradeNativeHumanoidBase(copy(shipping),shipping);
 return refineNativeLocomotion(result,locomotionShipping);
}
function upgradeNativeHumanoidBase(model,shipping) {
  if(model.nativeHumanoidRevision===1)return widenHumanoidStance(refineNativeJump(breaststrokeNativePlayer(balanceLocomotionHead(model),same(model.clips.swim,retargetHumanoidClip(captain,model,captain.clips.swim))),false));
  if(model.artGeneration!==3||model.skeleton||model.robot||model.type)return model;
  // Adopt the new base only for recognized player geometry. Custom rest rigs
  // stay intact. Original action data is retained for reversible migration;
  // sprites and eight-view wearable overrides remain authored by the user.
  const recognized=Object.keys(model.joints).length===Object.keys(shipping.joints).length&&Object.entries(shipping.joints).every(([n,j])=>same(model.joints[n],j));
  if(!recognized)return model;
  const old=copy(model),target=copy(model);
  combatShipping??=buildCombatPass(shipping);
  const shippingClip=(name,clip)=>same(clip,shipping.clips[name])||same(clip,combatShipping.clips[name]);
  const points={};
  const visit=n=>{
    if(points[n])return points[n];
    const j=captain.joints[n],parent=j.parent;
    if(!parent)return points[n]=mul(j.position,.83);
    const factor=facial.has(n)?1.12:n==='spine'||n==='chest'?1.35:n==='head'?2:n==='neck'?.88:.83;
    return points[n]=add(visit(parent),mul(sub(j.position,captain.joints[parent].position),factor));
  };
  for(const n of Object.keys(captain.joints))visit(n);
  const scale=shipping.joints.head.position[2]/points.head[2];
  for(const [n,j] of Object.entries(target.joints)){
    j.position=mul(points[n],scale);
    if(/^(hip|knee|foot)/.test(n))j.position[0]+=(n.endsWith('L')?-1:1)*.8;
  }
  // The existing head artwork owns these feature dimensions. The donor has
  // different skull proportions, so preserve the face's local attachment frame.
  for(const n of facial)target.joints[n].position=add(target.joints.head.position,sub(shipping.joints[n].position,shipping.joints.head.position));
  // Retarget edited clips to the new base too, retaining their original data
  // alongside provenance so the migration is reversible from the editor/export.
  const edited=Object.entries(model.clips).some(([n,c])=>!shippingClip(n,c));
  const preserved={};
  for(const [name,clip] of Object.entries(model.clips)){
    if(!shippingClip(name,clip)){
      preserved[name]=copy(clip);
      if(!baseActions.has(name)){target.clips[name]=retargetHumanoidClip(old,target,clip);continue;}
    }
    const donor=captain.clips[DONOR_ACTIONS[name]];
    if(donor){
      const transferred=retargetHumanoidClip(captain,target,donor);
      // Combat and jump gameplay clocks use the original action duration.
      if(!['idle','walk','run','swim'].includes(name))transferred.fps=Math.max(1,Math.min(30,transferred.length*clip.fps/clip.length));
      transferred.loop=clip.loop;
      if(name==='idle')for(const key of transferred.keys)for(const side of ['L','R']){
        const shoulder=add(target.joints['shoulder'+side].position,key.joints['shoulder'+side]);
        const sign=side==='L'?-1:1;
        for(const [joint,offset] of [['elbow',[sign*.9,.4,-4.7]],['hand',[sign*1.3,1,-9.5]]])
          key.joints[joint+side]=sub(add(shoulder,offset),target.joints[joint+side].position);
      }
      target.clips[name]=transferred;
    }else target.clips[name]=retargetHumanoidClip(old,target,clip);
  }
  target.nativeHumanoidRevision=1;
  target.name='Wildbound hero / Captain native base';
  target.nativeHumanoidSource={subject:'oathless_captain',revision:1,
    originalJoints:copy(old.joints),preservedClips:preserved,customClipsRetargeted:edited};
  return widenHumanoidStance(refineNativeJump(breaststrokeNativePlayer(balanceLocomotionHead(target),true),true));
}

// Distinct push, tuck, extension and compression as ordinary editable keys.
function refineNativeJump(model,fresh){
 if(model.nativeJumpRevision===1)return model;
 const neutral=copy(model.clips.idle.keys[0].joints),original={};
 const pose=(squat=0,tuck=0,arms=0)=>{
  const p=copy(neutral);
  for(const n of Object.keys(model.joints)){
   p[n]??=[0,0,0];
   if(!/^(knee|foot)/.test(n))p[n][2]-=squat;
   if(n.startsWith('knee')){p[n][1]+=squat*.65+tuck*.4;p[n][2]+=tuck*.4;}
   if(n.startsWith('foot')){p[n][1]-=tuck*.3;p[n][2]+=tuck;}
   if(n.startsWith('hand')){p[n][1]+=arms*.25;p[n][2]+=arms;}
   if(n.startsWith('elbow'))p[n][2]+=arms*.45;
  }return p;
 };
 const rest=pose(),compressed=pose(2.4,0,-1),push=pose(0,0,2),tuck=pose(0,3.5,4),extend=pose(0,.2,1.5);
 const stages={jump_takeoff:[compressed,push],jump_air:[push,tuck],jump_fall:[tuck,extend],land:[extend,compressed,rest]};
 for(const [name,poses]of Object.entries(stages)){
  const clip=model.clips[name];if(!clip)continue;
  const donor=captain.clips[DONOR_ACTIONS[name]];
  if(!fresh&&(!donor||!same(clip,retargetHumanoidClip(captain,model,donor))))continue;
  original[name]=copy(clip);
  clip.loop=false;clip.keys=poses.map((joints,i)=>({frame:Math.round(i*(clip.length-1)/(poses.length-1)),joints:copy(joints)}));
 }
 if(Object.keys(original).length){model.nativeJumpSource=original;model.nativeJumpRevision=1;}
 return model;
}

// Author ordinary editable keys. Only an exact donor-generated locomotion clip
// is migrated: imported/edited poses and deliberate combat bends remain intact.
export function balanceLocomotionHead(model){
 if(model.nativeHumanoidRevision!==1||model.headBalanceRevision===1)return model;
 const target=copy(model);let changed=false;
 for(const name of ['walk','run']){
  const clip=model.clips[name],expected=retargetHumanoidClip(captain,model,captain.clips[name]);
  if(!same(clip,expected))continue;
  changed=true;
  for(const key of target.clips[name].keys){
   const absolute=n=>add(model.joints[n].position,key.joints[n]||[0,0,0]);
   const oldHead=absolute('head'),chest=absolute('chest'),v=sub(oldHead,chest),size=length(v);
   const balanced=[v[0]*.18,v[1]*.18,Math.sqrt(Math.max(0,size*size-(v[0]*.18)**2-(v[1]*.18)**2))];
   const head=add(chest,balanced);key.joints.head=sub(head,model.joints.head.position);
   for(const n of facial){
    const rest=sub(model.joints[n].position,model.joints.head.position),old=sub(absolute(n),oldHead);
    const direction=rest.map((v,i)=>v*.85+old[i]*.15),magnitude=length(direction)||1;
    key.joints[n]=sub(add(head,mul(direction,length(rest)/magnitude)),model.joints[n].position);
   }
  }
 }
 if(changed)target.headBalanceRevision=1;
 return changed?target:model;
}
