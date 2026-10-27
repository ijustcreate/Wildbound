import {
  defaultPlayerMotion,
  defaultNativePlayerMotion,
  drawPlayer,
  validatePlayerMotion,
  upgradePlayerMotion,
} from "./player-motion.mjs";
import {retargetHumanoidClip,completeHumanoidActions} from './native-humanoid-base.mjs';
import {ensureSkeletonEquipment,SKELETON_COSTUME_KINDS} from './skeleton-equipment.mjs';
let skeletonBase;
function authorSkeletonWizardCast(model){
 const clip=model.clips.cast,joints=['shoulderR','elbowR','handR','shoulderL','elbowL','handL','chest','head'];
 const marks=[
  [0,{ }],
  [2,{elbowR:[2,-1,2],handR:[3,-2,4],elbowL:[-1,-1,1],handL:[-1,-2,2],chest:[0,-1,-1]}],
  [4,{shoulderR:[1,0,1],elbowR:[4,-2,4],handR:[7,-3,9],shoulderL:[-1,0,1],elbowL:[-2,-2,2],handL:[-3,-3,4],chest:[0,-2,-2],head:[0,0,1]}],
  [6,{shoulderR:[1,1,0],elbowR:[3,5,2],handR:[5,9,3],shoulderL:[-1,0,0],elbowL:[-2,3,1],handL:[-3,5,2],chest:[0,1,-1]}],
  [8,{}],
 ];
 clip.length=9;clip.fps=12;clip.loop=false;
 clip.keys=Array.from({length:9},(_,frame)=>{
  const hi=marks.findIndex(([at])=>at>=frame),right=hi<0?marks.length-1:hi,left=marks[Math.max(0,right-1)],next=marks[right],f=next[0]===left[0]?0:(frame-left[0])/(next[0]-left[0]);
  const values=Object.fromEntries(joints.map(name=>[name,(left[1][name]||[0,0,0]).map((v,i)=>v+((next[1][name]||[0,0,0])[i]-v)*f)]));
  return {frame,joints:values};
 });
}
function authorLongAxeSwing(model){
 const clip=structuredClone(model.clips.swipe_big);
 clip.name='Long axe / two-hand cut';clip.loop=false;
 for(const key of clip.keys){
  for(const [right,left] of [['shoulderR','shoulderL'],['elbowR','elbowL'],['handR','handL']]){
   const delta=key.joints[right];if(delta)key.joints[left]=[-delta[0],delta[1],delta[2]];
  }
 }
 model.clips.long_axe_swing=clip;
}
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
function compactSkeletonJoints(base){
 const joints=structuredClone(base.joints);
 for(const joint of Object.values(joints))joint.position=joint.position.map((v,i)=>v*(i===2?.68:.78));
 for(const name of ['eyeL','eyeR','nose','mouth','earL','earR'])joints[name].position=joints.head.position.map((v,i)=>v+(base.joints[name].position[i]-base.joints.head.position[i])*[1.45,1.5,1.3][i]);
 return joints;
}
export function upgradeSkeletonToNative(model){
 if(model.type==='krampus'||model.nativeSkeletonRevision===3)return model;
 const legacy=defaultPlayerMotion(),base=skeletonBase??=defaultNativePlayerMotion();
 const recognized=same(model.joints,legacy.joints)||same(model.joints,base.joints)||model.nativeSkeletonRevision===2&&same(model.joints,compactSkeletonJoints(base));
 // Edited rest geometry is authored content; only known shipping rigs migrate.
 if(!recognized)return model;
 const target=structuredClone(model);target.joints=structuredClone(base.joints);
 const original=model.nativeSkeletonSource||legacy;
 target.clips=Object.fromEntries(Object.entries(model.clips).map(([name,clip])=>{
  const prior=original.clips?.[name],hero=base.clips[name];
  const generated=prior&&(same(clip,prior)||same(clip,retargetHumanoidClip(original,model,prior)))||hero&&same(clip,retargetHumanoidClip(base,model,hero));
  // Normal locomotion uses the regular player keys. Edited attacks and casts
  // are retargeted onto the same full-height bones instead of being discarded.
  return [name,generated&&hero?structuredClone(hero):retargetHumanoidClip(model,target,clip)];
 }));
 completeHumanoidActions(target,base);target.nativeSkeletonRevision=3;
 // Actual edited clips remain in target.clips. Do not duplicate the entire
 // expanded player action library in provenance (six variants share it).
 target.nativeSkeletonSource={revision:3,previousRevision:model.nativeSkeletonRevision||0,joints:structuredClone(model.joints)};
 return target;
}
export const SKELETON_KINDS = [
  "skeleton",
  "archer",
  "skeleton_unarmed",
  "skeleton_boss",
  "frost_skeleton_mage",
  "skeleton_wizard",
  "krampus",
];
export function defaultSkeletonMotion(kind = "skeleton") {
  const m = defaultPlayerMotion();
  m.type = kind;
  m.skeleton = true;
  Object.assign(m.palette, {
    head: "#e0dab9",
    headShade: "#999d87",
    body: "#d0cfb0",
    bodyShade: "#8b9580",
    arms: "#ded8b6",
    armShade: "#909783",
    legs: "#c6c5a8",
    legShade: "#89917b",
    outline: "#344039",
  });
  if (kind === "krampus") Object.assign(m.palette, {
    head: "#a33b3b", headShade: "#632b31", body: "#8a3038", bodyShade: "#4b2630",
    arms: "#a64040", armShade: "#642b32", legs: "#473746", legShade: "#2d2938", outline: "#241d29",
  });
  const model=upgradeSkeletonToNative(m);
  if(kind==='skeleton_wizard')authorSkeletonWizardCast(model);
  authorLongAxeSwing(model);
  return model;
}
export const skeletonMotions = Object.fromEntries(
  SKELETON_KINDS.map((k) => [k, defaultSkeletonMotion(k)]),
);
export const validateSkeletonMotion = (kind, m) =>
  m?.type === kind && m.skeleton === true && validatePlayerMotion(m);
export function replaceSkeletonMotion(kind, m) {
  if (!validateSkeletonMotion(kind, m)) throw Error("Invalid skeleton rig");
  const next=upgradeSkeletonToNative(upgradePlayerMotion(m));
  if(!next.clips.long_axe_swing)authorLongAxeSwing(next);
  for(const field of ['nativeSkeletonRevision','nativeSkeletonSource'])if(!Object.hasOwn(next,field))delete skeletonMotions[kind][field];
  Object.assign(skeletonMotions[kind], next);
}
export function drawSkeleton(
  c,
  a,
  time,
  model = skeletonMotions[a.sprite || a.kind],
  pose = null,
) {
  const kind = model.type,
    gear =
      kind === "archer"
        ? { hand1: "bow", hand2: "occupied" }
        : kind === "skeleton_wizard"
          ? { hand1: "warlock_staff", chest: "warlock_robe", cape: "warlock_cape", pants: "warlock_trousers", gloves: "warlock_gloves" }
        : kind === "frost_skeleton_mage"
          ? { hand1: "ice_wand", cape: "cape", head: "moon_circlet" }
          : kind === "skeleton_boss"
          ? { hand1: "sun_blade", hand2: "sun_shield", head: "horned_helm" }
          : kind === "krampus"
            ? { hand1: "krampus_whip", head: "santa_hat" }
          : kind === "skeleton"
            ? a.equipment?.hand1 === "lantern" ? { hand1: "lantern" } : { hand1: "sword" }
            : {};
  const costume=SKELETON_COSTUME_KINDS.includes(kind);
  const dressed=costume?ensureSkeletonEquipment({...a,kind,equipment:a.equipment&&{...a.equipment},inventory:a.inventory&&[...a.inventory]}):a;
  const equipment=costume?dressed.equipment:{...gear,...a.equipment};
  if(equipment.hand1==='skeleton_long_axe')equipment.hand2='occupied';
  const actor = { ...a, equipment,skeletonCostume:costume,appearance:costume?{skin:'#d4a073',shirt:'#487663',pants:'#665479',shoes:'#493b2d',hair:'crop',hairColor:'#65472f',face:'classic',...a.appearance}:a.appearance };
  if (!a.animationAction) {
    if (a.flash > 0) {
      actor.hit = a.flash;
    } else if (a.state === "windup") {
      actor.animationAction = kind === "skeleton_unarmed" ? "punch" : kind === "skeleton_wizard" ? "cast" : a.equipment?.hand1==='skeleton_long_axe' ? (model.clips.long_axe_swing?'long_axe_swing':'swipe_big') : "slash";
      actor.playerFrame = Math.min(1,Math.max(0,1-(a.timer||0)/.65))*(model.clips[actor.animationAction].length-1)*.3;
    } else if (a.attack > 0) {
      actor.animationAction =
        kind === "archer"
          ? "draw"
          : kind === "skeleton_wizard"
            ? "cast"
          : a.equipment?.hand1==='skeleton_long_axe'
            ? model.clips.long_axe_swing?'long_axe_swing':'swipe_big'
          : kind === "skeleton_unarmed"
            ? "punch"
            : "slash";
      actor.playerFrame = (.3+Math.min(1,Math.max(0,1-a.attack/.34))*.7)*(model.clips[actor.animationAction].length-1);
    }
  }
  return drawPlayer(c, actor, time, model, pose);
}
