import {drawTorchFlame} from './torch-flame.mjs';
import {detailedLimb,humanoidArtAvailable,materialIndex,withDetailedHeadScale,detailedChain,detailedArm} from './humanoid-hd.mjs';
import {drawWhip} from './whip-visual.mjs';
import {humanoidClips} from './humanoid-clips.mjs';
import { applyIK } from './ik.mjs';
import { fitHeroGrip } from './hero-generation.mjs';
import {fitCombatLoadout,combatWeaponVector,combatPhase,castWandVector,SWING_ACTIONS} from './combat-animation.mjs';
import {drawParticleEffect} from './particles.mjs';
import {SALVAGE_SECONDS} from './salvage.mjs';
import {defaultAnimationLayers,validAnimationLayers,blendJointMask} from './animation-layers.mjs';
import { capeRows } from './cape-motion.mjs';
import {widenBansheeCape} from './banshee-gear-art.mjs';
import {keeperGearDetails,keeperHeadgear,keeperStaff,keeperBlade,keeperBand} from './keeper-gear-art.mjs';
import {SUCCUBUS_JOINTS,attachmentPose,drawHumanoidWing,drawHumanoidTail} from './succubus-attachments.mjs';
import { wearableDetails, directionalHelmet } from "./wearable-art.mjs";
import { drawHumanHead, skinPalette } from './human-head.mjs';
import {drawZombieFace,drawZombieClaws,drawZombieRags} from './zombie-art.mjs';
import {drawHeroTorso,withPixelRotation,unrotateFace} from './hero-art.mjs';
import { gearPalette, fittedGear, fittedShield, withBootPose } from './gear-art.mjs';
import { paintLayers } from "./render-order.mjs";
import { jointAngle, validAngles } from "./joint-angles.mjs";
import { ITEMS, count, itemKind } from "./items.mjs";
import { drawItem, paintItem } from "./item-art.mjs";
import { shade, drawHair, DEFAULT_APPEARANCE } from "./appearance.mjs";
import { quiverType } from './quiver.mjs';
// One player definition, pose evaluator and pixel renderer for both game and studio.
// Coordinates are model-space pixels: x across shoulders, y forward, z height.
export const DIRECTIONS = ["S", "SW", "W", "NW", "N", "NE", "E", "SE"];
export const JOINTS = {
  pelvis: ["", 0, 0, 15],
  chest: ["pelvis", 0, 0, 23],
  head: ["chest", 0, 0, 30],
  eyeL: ["head", -2, 3, 31.5],
  eyeR: ["head", 2, 3, 31.5],
  earL: ["head", -4, 0, 30],
  earR: ["head", 4, 0, 30],
  nose: ["head", 0, 4, 30],
  mouth: ["head", 0, 3, 28.5],
  shoulderL: ["chest", -4, 0, 23],
  elbowL: ["shoulderL", -5, 0, 18],
  handL: ["elbowL", -5, 1, 14],
  shoulderR: ["chest", 4, 0, 23],
  elbowR: ["shoulderR", 5, 0, 18],
  handR: ["elbowR", 5, 1, 14],
  hipL: ["pelvis", -2.5, 0, 14],
  kneeL: ["hipL", -2.5, 0, 8],
  footL: ["kneeL", -2.5, 1, 1],
  hipR: ["pelvis", 2.5, 0, 14],
  kneeR: ["hipR", 2.5, 0, 8],
  footR: ["kneeR", 2.5, 1, 1],
};
const clone = (v) => structuredClone(v);
const zero = () =>
  Object.fromEntries(Object.keys(JOINTS).map((n) => [n, [0, 0, 0]]));
function runKey(frame) {
  const p = zero(),
    a = (frame / 8) * Math.PI * 2;
  const bob = Math.abs(Math.sin(a)) * 1.5;
  for (const v of Object.values(p)) v[2] += bob;
  for (const [side, offset] of [
    ["L", 0],
    ["R", Math.PI],
  ]) {
    const s = Math.sin(a + offset),
      lift = Math.max(0, -s);
    p["knee" + side][1] = s * 4;
    p["knee" + side][2] += lift * 2;
    p["foot" + side][1] = s * 7;
    p["foot" + side][2] += lift * 6;
    p["elbow" + side][1] = -s * 3;
    p["elbow" + side][2] += 1;
    p["hand" + side][1] = -s * 5;
    p["hand" + side][2] += 2 + Math.max(0, -s) * 3;
  }
  return { frame, joints: p };
}
function actionKey(frame, reach, lift = 0) {
  const joints = zero();
  joints.handR = [-reach * 0.18, reach, lift];
  joints.elbowR = [-reach * 0.12, reach * 0.45, lift * 0.6];
  joints.chest = [0, reach * 0.12, 0];
  joints.head = [0, reach * 0.12, 0];
  joints.handL = [1, 2, 3];
  return { frame, joints };
}
export function defaultPlayerMotion() {
  const model = {
    version: 1,
    name: "Wildbound player",
    wearables: {},
    joints: Object.fromEntries(
      Object.entries(JOINTS).map(([n, [parent, ...position]]) => [
        n,
        { parent, position },
      ]),
    ),
    palette: {
      head: "#d9ab76",
      headShade: "#987853",
      body: "#bb8c35",
      bodyShade: "#836225",
      arms: "#bb8c35",
      armShade: "#836225",
      legs: "#655039",
      legShade: "#473828",
      outline: "#33324f",
    },
    clips: {
      idle: {
        fps: 8,
        length: 8,
        loop: true,
        keys: [
          { frame: 0, joints: zero() },
          {
            frame: 4,
            joints: {
              chest: [0, 0, 0.5],
              head: [0, 0, 0.5],
              handL: [0, 0, 0.4],
              handR: [0, 0, 0.4],
            },
          },
        ],
      },
      run: {
        fps: 12,
        length: 8,
        loop: true,
        keys: Array.from({ length: 8 }, (_, i) => runKey(i)),
      },
      punch: {
        fps: 18,
        length: 6,
        loop: false,
        keys: [
          actionKey(0, -3, 4),
          actionKey(1, 2, 7),
          actionKey(2, 12, 8),
          actionKey(3, 10, 8),
          actionKey(5, 0, 0),
        ],
      },
      slash: {
        fps: 18,
        length: 6,
        loop: false,
        keys: [
          actionKey(0, -4, 12),
          actionKey(2, 11, 8),
          actionKey(3, 8, 0),
          actionKey(5, 0, 0),
        ],
      },
      draw: {
        fps: 12,
        length: 8,
        loop: false,
        keys: [
          { frame: 0, joints: { handR: [-3, 3, 6], handL: [3, 5, 6] } },
          {
            frame: 7,
            joints: {
              handR: [-4, -2, 9],
              elbowR: [2, -3, 3],
              handL: [3, 10, 8],
              elbowL: [1, 5, 3],
            },
          },
        ],
      },
      hurt: {
        fps: 12,
        length: 4,
        loop: false,
        keys: [
          {
            frame: 0,
            joints: {
              chest: [0, -3, -2],
              head: [0, -3, -2],
              handL: [-2, -2, 2],
              handR: [2, -2, 2],
            },
          },
          { frame: 3, joints: zero() },
        ],
      },
      dash: {
        fps: 12,
        length: 4,
        loop: true,
        keys: [
          {
            frame: 0,
            joints: {
              chest: [0, 4, -3],
              head: [0, 6, -3],
              handL: [0, -4, 3],
              handR: [0, -4, 3],
              footL: [0, -5, 2],
              footR: [0, 5, 1],
            },
          },
          {
            frame: 2,
            joints: {
              chest: [0, 4, -3],
              head: [0, 6, -3],
              handL: [0, -4, 3],
              handR: [0, -4, 3],
              footL: [0, 5, 1],
              footR: [0, -5, 2],
            },
          },
        ],
      },
      block: {
        fps: 8,
        length: 4,
        loop: true,
        keys: [
          {
            frame: 0,
            joints: { handL: [3, 7, 8], elbowL: [1, 4, 3], handR: [-2, 2, 3] },
          },
        ],
      },
    },
  };
  Object.assign(model.clips,humanoidClips(model.clips));
  model.animationLayers=defaultAnimationLayers(model);
  model.clips.sleep = {
    fps: 4, length: 2, loop: true,
    keys: [
      { frame: 0, joints: { chest: [0, 7, -10], head: [0, 13, -10], handL: [-3, 6, -4], handR: [3, 6, -4], footL: [-2, 5, -8], footR: [2, 5, -8] } },
      { frame: 1, joints: { chest: [0, 7, -10], head: [0, 13, -10], handL: [-3, 6, -5], handR: [3, 6, -5], footL: [-2, 5, -8], footR: [2, 5, -8] } },
    ],
  };
  model.visibility = humanVisibility();
  for (const clip of Object.values(model.clips))
    for (const key of clip.keys)
      for (const n of ["eyeL", "eyeR", "earL", "earR", "nose", "mouth"])
        key.joints[n] = [...(key.joints.head || [0, 0, 0])];
  return model;
}
export const HUMAN_FACE_PARTS = [
  "eyeL",
  "eyeR",
  "earL",
  "earR",
  "nose",
  "mouth",
];
function humanVisibility() {
  return {
    eyeL: [true, true, true, false, false, false, false, true],
    eyeR: [true, true, false, false, false, false, true, true],
    earL: [true, true, true, true, true, false, false, false],
    earR: [true, false, false, false, true, true, true, true],
    nose: [true, true, true, false, false, false, true, true],
    mouth: [true, true, true, false, false, false, true, true],
  };
}
export function upgradePlayerMotion(input) {
  const m = clone(input);
  if (!m?.joints || !m.clips) return m;
  if (HUMAN_FACE_PARTS.every((n) => !m.joints[n]) && m.joints.head?.position) {
    for (const n of HUMAN_FACE_PARTS) {
      const [, ...rest] = JOINTS[n];
      m.joints[n] = {
        parent: "head",
        position: rest.map(
          (v, i) => v + m.joints.head.position[i] - JOINTS.head[i + 1],
        ),
      };
      for (const clip of Object.values(m.clips))
        for (const key of clip.keys || [])
          if (key.joints) key.joints[n] = [...(key.joints.head || [0, 0, 0])];
    }
  }
  const defaults=defaultPlayerMotion();
  m.animationLayers ??= clone(defaults.animationLayers);
  // Upgrade only the untouched shipping stroke, never a user-authored swim clip.
  const rest=Object.fromEntries(Object.keys(JOINTS).map(n=>[n,[0,0,0]]));
  const legacySwim={fps:16,length:8,loop:true,keys:[
    {frame:0,joints:{...rest,handL:[-6,6,8],handR:[6,-4,8],footL:[0,-5,3]}},
    {frame:7,joints:{...rest,handL:[-6,-4,8],handR:[6,6,8],footR:[0,-5,3]}}
  ]};
  const canonical=value=>JSON.stringify(value,(_k,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.entries(v).sort(([a],[b])=>a.localeCompare(b))):v);
  if(canonical(m.clips.swim)===canonical(legacySwim))m.clips.swim=clone(defaults.clips.swim);
  for(const [name,clip] of Object.entries(defaults.clips))m.clips[name] ??= clone(clip);
  m.visibility ??= humanVisibility();
  m.wearables ??= {};
  return m;
}
export const playerMotion = defaultPlayerMotion();
export function validatePlayerMotion(m) {
  const upgraded = upgradePlayerMotion(m);
  return (
    validateMotion(upgraded, defaultPlayerMotion()) &&
    HUMAN_FACE_PARTS.every(
      (n) =>
        Array.isArray(upgraded.visibility?.[n]) &&
        upgraded.visibility[n].length === 8 &&
        upgraded.visibility[n].every((v) => typeof v === "boolean"),
    )
  );
}
export function validateMotion(m, template) {
  if (m?.version !== 1 || !m.joints || !m.clips || !m.palette) return false;
  if(!validAngles(m.jointAngles,m.joints))return false;
  if(!validAnimationLayers(m))return false;
  if(m.ik!==undefined){
    if(!m.ik||typeof m.ik!=='object'||Array.isArray(m.ik))return false;
    for(const [key,c] of Object.entries(m.ik))if(!c||key!==c.end||!m.joints[c.root]||m.joints[c.mid]?.parent!==c.root||m.joints[c.end]?.parent!==c.mid||![1,-1].includes(c.bend)||typeof c.enabled!=='boolean')return false;
  }
  const finiteVec = (v) =>
    Array.isArray(v) &&
    v.length === 3 &&
    v.every((n) => Number.isFinite(n) && Math.abs(n) <= 100);
  if (Object.keys(m.joints).length !== Object.keys(template.joints).length)
    return false;
  for (const n of Object.keys(template.joints)) {
    const j = m.joints[n];
    if (!j || !finiteVec(j.position) || j.parent !== template.joints[n].parent)
      return false;
  }
  for (const k of Object.keys(template.palette))
    if (!/^#[0-9a-f]{6}$/i.test(m.palette[k] || "")) return false;
  for (const key of Object.keys(template.shape || {}))
    if (
      !Number.isFinite(m.shape?.[key]) ||
      m.shape[key] < 0.5 ||
      m.shape[key] > 20
    )
      return false;
  for (const name of Object.keys(template.clips)) {
    const c = m.clips[name];
    if (
      !c ||
      !Number.isInteger(c.length) ||
      c.length < 2 ||
      c.length > 120 ||
      !Number.isFinite(c.fps) ||
      c.fps < 1 ||
      c.fps > 30 ||
      !Array.isArray(c.keys) ||
      c.keys.length < 1 ||
      c.keys.length > 120
    )
      return false;
    const seen = new Set();
    for (const k of c.keys) {
      if(!validAngles(k.angles,m.joints))return false;
      if (
        !Number.isInteger(k.frame) ||
        k.frame < 0 ||
        k.frame >= c.length ||
        seen.has(k.frame) ||
        !k.joints
      )
        return false;
      seen.add(k.frame);
      for (const [n, v] of Object.entries(k.joints))
        if (!template.joints[n] || !finiteVec(v)) return false;
    }
  }
  return true;
}
export let playerMotionRevision = 0;
export function replacePlayerMotion(m) {
  playerMotionRevision++;
  if (!validatePlayerMotion(m))
    throw Error("Invalid player rig or animation clips. Nothing imported.");
  Object.assign(playerMotion, upgradePlayerMotion(m));
}
export function facingIndex(x = 0, y = 1) {
  return ((Math.round(Math.atan2(-x, y) / (Math.PI / 4)) % 8) + 8) % 8;
}
export function directionVector(index) {
  const a = (index * Math.PI) / 4;
  return [-Math.sin(a), Math.cos(a)];
}
export function wandLocalTip(visual, direction=0, side='R') {
  if(Number.isFinite(visual?.tipX)&&Number.isFinite(visual?.tipY))return {x:visual.tipX,y:visual.tipY};
  const first=visual?.pixels?.findIndex(Boolean);
  if(first>=0){const row=Math.floor(first/16),xs=[];for(let x=0;x<16;x++)if(visual.pixels[row*16+x])xs.push(x);return {x:xs.reduce((a,b)=>a+b,0)/xs.length-7.5,y:row-7.5};}
  const a=direction*Math.PI/4;
  return {x:Math.round(-Math.sin(a)*5+Math.cos(a)*(side==='R'?2:-2)),y:-10+Math.round(Math.cos(a)*2)};
}
function posedWandTip(actor,time,model,d,side,visual){
  const action=playerEquipmentAction(actor,time,model);
  if(model.combatRevision!==4||visual||action.action!=='cast')return wandLocalTip(visual,d,side);
  const t=action.frame/(model.clips.cast.length-1);
  return projectPoint(castWandVector(t,side),d);
}
export function bowHandleWorld(actor,time,model=playerMotion,size=43){
  const d=facingIndex(actor.faceX,actor.faceY),pose=playerPose(actor,time,model),v=[...pose.handL];
  if(actor.appearance?.build==='broad')v[0]*=1.12;
  else if(actor.appearance?.build&&actor.appearance.build!=='standard')v[0]*=.9;
  const hand=projectPoint(v,Number.isFinite(actor.bowVisualAngle)?actor.bowVisualAngle*4/Math.PI:d),visual=model.wearables?.[actor.equipment?.hand1]?.[d];
  const rotation=playerJointAngle(actor,time,model,d,'handL')*Math.PI/180;
  const x=visual?.x||0,y=visual?.y||0;
  return {x:actor.x+(hand.x+x*Math.cos(rotation)-y*Math.sin(rotation))*size/48,
    y:actor.y-(actor.jumpHeight||0)-(actor.groundHeight||0)+(hand.y+x*Math.sin(rotation)+y*Math.cos(rotation))*size/48};
}
// Keep a readable curve when the bow's plane is nearly edge-on to the camera.
export function bowRigGeometry(hand,d,length=10,carried=false){
  if(carried){
    // Diagonal, lowered bow across the hips; rotate its plane with the hero.
    const point=v=>{const q=projectPoint(v,d);return {x:hand.x+q.x,y:hand.y+q.y};};
    const scale=length/10;
    const top=point([15*scale,2,13*scale]),bottom=point([-13*scale,2,-3*scale]);
    // A small silhouette allowance prevents side views collapsing to a straight line.
    if(Math.abs(top.x-bottom.x)<8){const sign=d<4?-1:1;top.x=hand.x+sign*5;bottom.x=hand.x-sign*3;}
    return {top,mid:hand,bottom};
  }
  const bend=projectPoint([0,-4,0],d);
  if(Math.abs(bend.x)<2.5)bend.x=(d<4?-1:1)*3.5;
  return {top:{x:hand.x+bend.x,y:hand.y+bend.y-length},
    mid:hand,bottom:{x:hand.x+bend.x,y:hand.y+bend.y+length}};
}
export function wandTipWorld(actor,slot,time,model=playerMotion,size=43){
  const d=facingIndex(actor.faceX,actor.faceY),side=slot==='hand1'?'R':'L',joint='hand'+side;
  const pose=playerPose(actor,time,model);
  const v=[...pose[joint]];if(actor.appearance?.build==='broad')v[0]*=1.12;else if(actor.appearance?.build&&actor.appearance.build!=='standard')v[0]*=.9;
  const hand=projectPoint(v,d),visual=model.wearables?.[actor.equipment?.[slot]]?.[d],tip=posedWandTip(actor,time,model,d,side,visual);
  const angle=(visual?.rotation||0)*Math.PI/180,scale=visual?.scale||1;
  let x=(tip.x*Math.cos(angle)-tip.y*Math.sin(angle))*scale+(visual?.x||0),y=(tip.x*Math.sin(angle)+tip.y*Math.cos(angle))*scale+(visual?.y||0);
  const rotation=playerJointAngle(actor,time,model,d,joint)*Math.PI/180;
  const rx=x*Math.cos(rotation)-y*Math.sin(rotation),ry=x*Math.sin(rotation)+y*Math.cos(rotation);
  return {x:actor.x+(hand.x+rx)*size/48,y:actor.y-(actor.jumpHeight||0)-(actor.groundHeight||0)+(hand.y+ry)*size/48};
}
export function projectPoint(p, direction) {
  const a = (direction * Math.PI) / 4,
    c = Math.cos(a),
    s = Math.sin(a);
  return {
    x: p[0] * c - p[1] * s,
    y: (p[0] * s + p[1] * c) * 0.5 - p[2],
    depth: p[0] * s + p[1] * c,
  };
}
export function screenDelta(dx, dy, direction) {
  const a = (direction * Math.PI) / 4;
  return [dx * Math.cos(a), -dx * Math.sin(a), -dy];
}
export function poseAt(model, clipName, frame) {
  const clip = model.clips[clipName] || model.clips.idle;
  const t = clip.loop
    ? ((frame % clip.length) + clip.length) % clip.length
    : Math.max(0, Math.min(clip.length - 1, frame));
  const positions = {};
  for (const [name, j] of Object.entries(model.joints)) {
    const keys = clip.keys
      .filter((k) => k.joints[name])
      .sort((a, b) => a.frame - b.frame);
    let delta = [0, 0, 0];
    if (keys.length) {
      let left = keys.filter((k) => k.frame <= t).at(-1),
        right = keys.find((k) => k.frame > t);
      let lt = left?.frame,
        rt = right?.frame;
      if (!left) {
        left = clip.loop ? keys.at(-1) : keys[0];
        lt = clip.loop ? left.frame - clip.length : left.frame;
      }
      if (!right) {
        right = clip.loop ? keys[0] : keys.at(-1);
        rt = clip.loop ? right.frame + clip.length : right.frame;
      }
      let f = rt === lt ? 0 : Math.max(0, Math.min(1, (t - lt) / (rt - lt)));
      const interpolation = left.interpolation?.[name];
      if (interpolation === "hold") f = 0;
      else if (interpolation === "smooth") f = f * f * (3 - 2 * f);
      delta = left.joints[name].map(
        (v, i) => v + (right.joints[name][i] - v) * f,
      );
    }
    positions[name] = j.position.map((v, i) => v + delta[i]);
  }
  return applyIK(model,positions);
}
export function playerAction(actor) {
  if (actor.animationAction)
    return actor.animationAction === "attack"
        ? "punch"
        : actor.animationAction;
  if (actor.foundUnique > 0) return "found_unique";
  if (actor.pickupTime > 0) return "pickup";
  if (actor.gatherTime > 0) return actor.gatherAction || "mine";
  if (actor.carryingItem) return "carry";
  if (actor.parry > 0) return "parry";
  if(actor.hp<=0)return 'death';
  if(actor.sleeping > 0)return 'sleep';
  if (actor.hit > 0) return "hurt";
  if((actor.salvageHold?.elapsed>0&&!actor.salvageHold.latched)||actor.salvageFinish>0)return 'salvage';
  if(actor.jumpHeight>0)return actor.wingHover?'jump_air':actor.jumpAge<.1?'jump_takeoff':actor.jumpVelocity>0?'jump_air':'jump_fall';
  if(actor.swimming)return actor.moving?'swim':'idle';
  if(actor.landTime>0)return 'land';
  if(actor.getUpTime>0)return 'get_up';
  if(actor.reviveAnimation>0)return 'revive';
  if(actor.interactAnimation>0)return 'interact';
  if (actor.dashTime > 0) return "dash";
  if (actor.blocking) return "block";
  if (
    ["bow", "rifle"].includes(itemKind(actor.equipment?.hand1)) &&
    (actor.charge > 0 || actor.attack > 0 || actor.bowAiming)
  )
    return actor.attack > 0 ? "ranged" : "draw";
  if(actor.attack>0&&actor.attackClip)return actor.attackClip;
  if(actor.bowAiming && ['hand1','hand2'].some(slot=>ITEMS[actor.equipment?.[slot]]?.magic))return 'cast';
  if (actor.attack > 0)
    return actor.equipment?.hand1 || ITEMS[actor.equipment?.hand2]?.damage
      ? "slash"
      : "punch";
  if (actor.charge > 0) return "punch";
  return actor.moving ? actor.walking?"walk":"run" : "idle";
}
export function playerFrame(actor, time, model = playerMotion, action = playerAction(actor)) {
  const
    clip = model.clips[action] || model.clips.idle;
  if (Number.isFinite(actor.playerFrame)) return actor.playerFrame;
  if (actor.poseTime !== undefined) return actor.poseTime * (clip.length - 1);
  const timed={pickup:['pickupTime',.42],found_unique:['foundUnique',1.1],mine:['gatherTime',.55],woodcut:['gatherTime',.55],interact:['interactAnimation',.35],parry:['parry',.32],dash:['dashTime',actor.dashAnimationDuration||.28]};
  if(timed[action]&&actor[timed[action][0]]>0)return Math.max(0,1-actor[timed[action][0]]/timed[action][1])*(clip.length-1);
  if(action==='revive'&&actor.reviveAnimation>0)return Math.min(clip.length*.7,time*clip.fps%(clip.length*.7));
  if(action==='salvage')return (actor.salvageFinish>0?8+(1-actor.salvageFinish/.3)*3:Math.min(8,(actor.salvageHold?.elapsed||0)/SALVAGE_SECONDS*8))/11*(clip.length-1);
  if (action === "run" || action === "walk")
    // Core accumulates 0.13 radians per world pixel. Keep footsteps tied to
    // distance, with an 88px stride (about 1.5 cycles/sec at normal speed).
    return actor.step === undefined
      ? time * clip.fps
      : (actor.step / (0.13 * (model.artGeneration===3&&action==='walk'?56:88))) * clip.length;
  if (action === "draw")
    return Math.min(clip.length - 1, Math.max(actor.bowAiming?.65:0,actor.charge ?? 1) * (clip.length-1));
  if(action==='death')return Math.min(1,(actor.deathTime??.5)/.5)*(clip.length-1);
  if(action==='get_up')return (1-(actor.getUpTime||0)/.4)*(clip.length-1);
  if(action==='land')return (1-(actor.landTime||0)/.22)*(clip.length-1);
  if(actor.attack>0&&actor.attackClip===action)return Math.max(0,1-actor.attack/(actor.attackDuration||.34))*(clip.length-1);
  if(actor.bowAiming && action==='cast')return (clip.length-1)*.5;
  if (actor.charge > 0 && !action.startsWith('jump')) return 0;
  if (["punch", "slash", "ranged"].includes(action))
    return (1 - (actor.attack || 0) / (actor.attackDuration||.34)) * (clip.length - 1);
  if (action === "hurt")
    return Math.max(0, (0.2 - (actor.hit || 0)) / 0.2) * (clip.length - 1);
  return time * clip.fps;
}
export function playerLayers(actor,time,model=playerMotion){
 const current=playerAction(actor),preview=actor.layerPreview;
 if(actor.angleRestOnly||(!preview&&(actor.animationAction||actor.hp<=0||actor.hit>0)))return [];
 const combat=actor.attack>0||actor.charge>0||actor.bowAiming||actor.blocking;
 const combatActor={...actor,animationAction:null,jumpHeight:0,swimming:false,landTime:0,foundUnique:0,pickupTime:0,gatherTime:0,carryingItem:false,parry:0};
 return (model.animationLayers||[]).flatMap((layer,index)=>{
  if(!layer.enabled||layer.weight<=0||(preview&&preview.index!==index))return [];
  if(!preview&&!(layer.condition==='always'||layer.condition==='airborne'&&actor.jumpHeight>0||layer.condition==='moving'&&actor.moving||layer.condition==='combat'&&combat))return [];
  if(!preview&&layer.overlay==='$combat'&&!combat)return [];
  const base=preview?.base||(layer.base==='$current'?current:layer.base),overlay=preview?.overlay||(layer.overlay==='$combat'?playerAction(combatActor):layer.overlay);
  return [{...layer,base,overlay,baseFrame:playerFrame(actor,time,model,base),overlayFrame:preview?time*(model.clips[overlay]?.fps||12):playerFrame(combatActor,time,model,overlay)}];
 });
}
export function playerPose(actor,time,model=playerMotion){
 let pose=poseAt(model,playerAction(actor),playerFrame(actor,time,model));
 for(const layer of playerLayers(actor,time,model)){
  if(layer.base!=='$current'&&layer.base!==playerAction(actor))pose=poseAt(model,layer.base,layer.baseFrame);
  pose=blendJointMask(pose,poseAt(model,layer.overlay,layer.overlayFrame),layer);
 }
  if(model.artGeneration===3)applyIK(model,pose);
  const equipment=playerEquipmentAction(actor,time,model),action=equipment.action,t=equipment.frame/(model.clips[action]?.length-1||1);
  fitCombatLoadout(pose,model,action,t,['hand1','hand2'].map(slot=>itemKind(actor.equipment?.[slot])));
  if(itemKind(actor.equipment?.hand1)==='bow'&&['draw','ranged'].includes(action)){
    pose.handL[0]-=2.5;applyIK(model,pose);
  }
  if(itemKind(actor.equipment?.hand1)==='bow'&&['idle','walk','run'].includes(action)){
    const chest=pose.chest,idle=action==='idle';
    // Relaxed two-hand ready pose: low grip, other hand resting above the string.
    pose.handL=[chest[0]-4, chest[1]+6,chest[2]-10];
    pose.handR=[chest[0]+1,chest[1]+7,chest[2]-5];
    pose.elbowL=[chest[0]-7,chest[1]+3,chest[2]-6];
    pose.elbowR=[chest[0]+7,chest[1]+2,chest[2]-4];
    if(idle){pose.footL[0]-=1.2;pose.footR[0]+=1.2;pose.kneeL[0]-=.6;pose.kneeR[0]+=.6;}
    applyIK(model,pose);
  }
  pose=fitHeroGrip(pose,actor,model,action);
  if(itemKind(actor.equipment?.hand1)==='bow'&&!actor.animationAction&&Number.isFinite(actor.bowAimBlend)&&['idle','walk','run','draw','ranged'].includes(action)){
    const blend=actor.bowAimBlend,aimed=['draw','ranged'].includes(action);
    const other=playerPose({...actor,bowAimBlend:undefined,animationAction:aimed?(actor.moving?(actor.walking?'walk':'run'):'idle'):'draw',charge:aimed?0:.65,bowAiming:!aimed,attack:0},time,model);
    const resting=aimed?other:pose,raised=aimed?pose:other;
    for(const key of Object.keys(pose))if(resting[key]&&raised[key])pose[key]=resting[key].map((v,i)=>v+(raised[key][i]-v)*blend);
  }
  return pose;
}
export function playerEquipmentAction(actor,time,model=playerMotion){
  const layer=playerLayers(actor,time,model).filter(l=>l.joints.includes('handR')||l.joints.includes('handL')).at(-1);
  const action=layer?.overlay||playerAction(actor);
  return {action,frame:layer?.overlayFrame??playerFrame(actor,time,model,action)};
}
export function playerJointAngle(actor,time,model,d,joint){
 let angle=jointAngle(model,playerAction(actor),playerFrame(actor,time,model),d,joint,actor.angleRestOnly);
 for(const layer of playerLayers(actor,time,model)){
  if(layer.base!==playerAction(actor))angle=jointAngle(model,layer.base,layer.baseFrame,d,joint);
  if(layer.joints.includes(joint)){const target=jointAngle(model,layer.overlay,layer.overlayFrame,d,joint);angle+=(((target-angle+540)%360)-180)*layer.weight;}
 }
 return angle;
}
// Raster primitives only write whole pixels; no filtered rotations or antialiased seams.
export function ellipse(c, x, y, rx, ry, color) {
  c.fillStyle = color;
  if (rx <= 0 || ry <= 0) return;
  for (let py = Math.ceil(y - ry); py <= Math.floor(y + ry); py++) {
    const dy = (py - y) / ry;
    const extent = rx * Math.sqrt(Math.max(0, 1 - dy * dy));
    let left = Math.ceil(x - extent),
      right = Math.floor(x + extent);
    // Preserve the original boundary predicate even at floating-point edges.
    const inside = (px) => ((px - x) / rx) ** 2 + dy * dy <= 1;
    if (inside(left - 1)) left--;
    if (!inside(left)) left++;
    if (inside(right + 1)) right++;
    if (!inside(right)) right--;
    if (right >= left) c.fillRect(left, py, right - left + 1, 1);
  }
}
export function limb(c, a, b, width, color) {
  if(detailedLimb(c,a,b,width,color))return;
  const steps = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) * 2));
  for (let i = 0; i <= steps; i++)
    ellipse(
      c,
      a.x + ((b.x - a.x) * i) / steps,
      a.y + ((b.y - a.y) * i) / steps,
      width / 2,
      width / 2,
      color,
    );
}
export function quiverPose(positions,direction){
  const normalize=v=>{const n=Math.hypot(...v)||1;return v.map(x=>x/n);};
  const up=normalize(positions.chest.map((v,i)=>v-positions.pelvis[i]));
  const right=normalize(positions.shoulderR.map((v,i)=>v-positions.shoulderL[i]));
  const rear=normalize([right[1]*up[2]-right[2]*up[1],right[2]*up[0]-right[0]*up[2],right[0]*up[1]-right[1]*up[0]]);
  const attach=(joint,side,height)=>projectPoint(joint.map((v,i)=>v+rear[i]*4+right[i]*side+up[i]*height),direction);
  const top=attach(positions.chest,3,3),bottom=attach(positions.pelvis,-1,-2);
  const rearDepth=projectPoint(rear,direction).depth;
  return {top,bottom,width:4,depth:projectPoint(positions.chest,direction).depth+rearDepth*4,behind:rearDepth<=0.001};
}
export function stabilizeSculptedEyes(points,model,d){
  const head=model.joints.head.position;
  const lower=d===2||d===6?3:d===1||d===7?2:1;
  for(const name of ['eyeL','eyeR']){
    const eye=model.joints[name]?.position;
    if(!eye)continue;
    const offset=projectPoint(eye.map((value,i)=>value-head[i]),d);
    const inward=d===2?1:d===6?-1:0;
    points[name]={...points[name],x:points.head.x+offset.x+inward,y:points.head.y+offset.y+lower};
  }
  return points;
}
export function alignWorkKnees(points,action){
  if(!['mine','woodcut'].includes(action))return points;
  for(const side of ['L','R']){
    const center=(points['hip'+side].x+points['foot'+side].x)/2;
    points['knee'+side].x=center+(points['knee'+side].x-center)*.2;
  }
  return points;
}
export function drawPlayer(
  c,
  actor,
  time,
  model = playerMotion,
  suppliedPose = null,
) {
  const visualDirection=itemKind(actor.equipment?.hand1)==='bow'&&Number.isFinite(actor.bowVisualAngle)?((actor.bowVisualAngle*4/Math.PI)%8+8)%8:null;
  const d = visualDirection===null?facingIndex(actor.faceX, actor.faceY):((Math.round(visualDirection)%8)+8)%8,
    positions = suppliedPose
      ? { ...suppliedPose }
      : playerPose(actor,time,model);
  if (actor.appearance?.build && actor.appearance.build !== "standard")
    for (const [key, v] of Object.entries(positions))
      positions[key] = [
        v[0] * (actor.appearance.build === "broad" ? 1.12 : 0.9),
        v[1],
        v[2],
      ];
  const p = Object.fromEntries(
    Object.entries(positions).map(([n, v]) => [n, projectPoint(v, visualDirection??d)]),
  );
  const pal = { ...model.palette },
    gear = { ...actor.equipment },
    back = d >= 3 && d <= 5;
  const salvaging=playerAction(actor)==='salvage';
  if(salvaging){gear.hand1=null;gear.hand2=null;}
  const propAction=model.artGeneration===3?playerAction(actor):null;
  if(['mine','woodcut','carry','pickup','found_unique','swim','sleep','death','get_up'].includes(propAction)){gear.hand1=null;gear.hand2=null;}
  const rotateJoint = (joint,anchor,paint) => {
    const angle=playerJointAngle(actor,time,model,d,joint);
    if(!angle)return paint();
    c.save();c.translate(anchor.x,anchor.y);c.rotate(angle*Math.PI/180);c.translate(-anchor.x,-anchor.y);
    try {paint();} finally {c.restore();}
  };
  const cosmetics = actor.field?.cosmetics || {};
  for (const slot of ["head", "chest", "cape"])
    if (cosmetics[slot] && ITEMS[cosmetics[slot]]?.slot === slot)
      gear[slot] = cosmetics[slot];
  if (cosmetics.hideHelmet) gear.head = null;
  const stowed =
    cosmetics.stow &&
    !actor.moving &&
    !(actor.attack > 0) &&
    !(actor.charge > 0) &&
    !actor.blocking;
  const stowedWeapon = stowed ? gear.hand1 : null;
  if (stowed) {
    gear.hand1 = null;
    gear.hand2 = null;
  }
  const human = !model.skeleton && !model.robot;
  const sculpted=human&&model.artGeneration===3;
  if(sculpted){stabilizeSculptedEyes(p,model,d);alignWorkKnees(p,playerAction(actor));}
  const equipmentPose=playerEquipmentAction(actor,time,model);
  const look = actor.appearance || (human ? DEFAULT_APPEARANCE : null);
  const ink = human ? "#302b2b" : pal.outline;
  const pixel = (x, y, w, h, color) => {
    c.fillStyle = color;
    c.fillRect(Math.round(x), Math.round(y), w, h);
  };
  if (actor.appearance)
    Object.assign(pal, {
      head: look.skin,
      headShade: shade(look.skin),
      body: look.shirt,
      bodyShade: shade(look.shirt),
      arms: look.shirt,
      armShade: shade(look.shirt),
      legs: look.pants,
      legShade: shade(look.pants),
    });
  const queue = [];
  const add = (depth, fn, id, bones) => queue.push({ depth, fn, id, bones });
  if(ITEMS[gear.shoulders]?.humanoidWings||model.humanoidTail===true){
    const attached=attachmentPose(positions,actor,time,model),points=Object.fromEntries(Object.entries(attached).map(([n,v])=>[n,projectPoint(v,d)]));
    for(const name of Object.keys(SUCCUBUS_JOINTS))if(name.startsWith('wing')?ITEMS[gear.shoulders]?.humanoidWings:model.humanoidTail===true)p[name]=points[name];
    if(ITEMS[gear.shoulders]?.humanoidWings)for(const side of ['L','R']){
      const root=points['wingRoot'+side];
      add(root.depth,()=>drawHumanoidWing(c,points,side,ITEMS[gear.shoulders]?.wingPalette||model.appendagePalette),'Wing '+side,['wingRoot'+side,'wingMid'+side,'wingTip'+side,'chest']);
      queue.at(-1).attachmentOrder={anchors:['Body and pelvis','Cape'],behind:root.depth<=p.chest.depth};
    }
    if(model.humanoidTail===true){add(points.tailBase.depth,()=>drawHumanoidTail(c,points),'Tail',['tailBase','tailMid','tailTip','pelvis']);queue.at(-1).attachmentOrder={anchors:['Body and pelvis'],behind:points.tailBase.depth<=p.pelvis.depth};}
  }
  const wear = (slot, anchor, paint) => {
    const visual =
      model.wearables?.[slot === "hair" ? "hair:" + look?.hair : gear[slot]]?.[
        d
      ];
    if (!visual) return paint();
    c.save();
    c.translate(anchor.x + (visual.x || 0), anchor.y + (visual.y || 0));
    c.rotate(((visual.rotation || 0) * Math.PI) / 180);
    c.scale(visual.scale || 1, visual.scale || 1);
    if (visual.pixels?.some(Boolean)) {
      visual.pixels.forEach((color, i) => {
        if (color) {
          c.fillStyle = color;
          c.fillRect((i % 16) - 8, Math.floor(i / 16) - 8, 1, 1);
        }
      });
    } else {
      c.translate(-anchor.x, -anchor.y);
      paint();
    }
    c.restore();
  };
  if (stowedWeapon)
    add(
      p.chest.depth - 3,
      () => {
        limb(
          c,
          { x: p.chest.x - 7, y: p.chest.y - 8 },
          { x: p.pelvis.x + 8, y: p.pelvis.y + 6 },
          2,
          ITEMS[stowedWeapon]?.artColor || "#a99a70",
        );
        limb(
          c,
          { x: p.chest.x - 10, y: p.chest.y - 4 },
          { x: p.chest.x - 3, y: p.chest.y - 10 },
          2,
          "#d4b76a",
        );
      },
      "Stowed weapon",
    );
  if(itemKind(gear.back)==='quiver'){
    const q=quiverPose(positions,visualDirection??d);
    add(q.depth,()=>{
    const carrier={...actor,inventory:actor.inventory||[]};
    const ammo=Math.min(3,count(carrier,quiverType(carrier)));
    const dx=q.bottom.x-q.top.x,dy=q.bottom.y-q.top.y,length=Math.hypot(dx,dy)||1;
    const nx=-dy/length,ny=dx/length;
    for(let arrow=0;arrow<ammo;arrow++){
      const offset=arrow-1,base={x:q.top.x+nx*offset,y:q.top.y+ny*offset},tip={x:base.x-dx/length*(5+arrow%2),y:base.y-dy/length*(5+arrow%2)};
      limb(c,base,tip,1,'#d9bd81');limb(c,{x:tip.x-nx,y:tip.y-ny},{x:tip.x+nx,y:tip.y+ny},1,'#f2edcc');
    }
    const quiverMaterial=gearPalette(gear.back),bansheeQuiver=ITEMS[gear.back].bansheeGear;
    limb(c,q.top,q.bottom,q.width+2,bansheeQuiver?quiverMaterial.ink:'#30251a');
    limb(c,q.top,q.bottom,q.width,ITEMS[gear.back].artColor||'#96643e');
    limb(c,{x:q.top.x+nx,y:q.top.y+ny},{x:q.bottom.x+nx,y:q.bottom.y+ny},1,bansheeQuiver?quiverMaterial.light:'#c6a779');
    limb(c,{x:q.top.x-nx*2,y:q.top.y-ny*2},{x:q.top.x+nx*2,y:q.top.y+ny*2},2,bansheeQuiver?quiverMaterial.trim:'#ddc18d');
    if(bansheeQuiver){const x=(q.top.x+q.bottom.x)/2,y=(q.top.y+q.bottom.y)/2;pixel(x-1,y-1,3,3,quiverMaterial.trim);pixel(x,y,1,1,'#9ae5ed');}
  },'Quiver',['chest','pelvis']);
    // A back attachment must not become a foreground overlay in saved rig orders.
    queue.at(-1).attachmentOrder={anchors:['Body and pelvis','Cape'],behind:q.behind};
  }
  if (gear.cape) {
    const top = positions.shoulderL.map((v,i)=>(v+positions.shoulderR[i])/2),
      bottom = positions.pelvis;
    const left = projectPoint([top[0] - 4, top[1] - 3, top[2]], d),
      right = projectPoint([top[0] + 4, top[1] - 3, top[2]], d);
    const capeStyle=ITEMS[gear.cape]?.style;
    const clothRows=capeRows(top,bottom,actor,time,capeStyle,{left:positions.shoulderL,right:positions.shoulderR});
    const rows=(ITEMS[gear.cape]?.bansheeGear?widenBansheeCape(clothRows):clothRows).map(row=>({...row,left:projectPoint(row.left,d),right:projectPoint(row.right,d),segments:row.segments.map(s=>({...s,left:projectPoint(s.left,d),right:projectPoint(s.right,d)}))}));
    const a=rows.at(-1).left,b=rows.at(-1).right;
    add(
      p.chest.depth + (back ? 2 : -2),
      () => {
        wear("cape", p.chest, () => {
          const cloth=gearPalette(gear.cape,cosmetics.dye);
          for (let n = 0; n < rows.length; n++) {
            const row=rows[n];
            for(const segment of row.segments)limb(
              c,
              segment.left,
              segment.right,
              2,
              segment.hem?cloth.trim:n<3?cloth.light:row.fold<-.6?cloth.dark:cloth.base,
            );
          }
          for(let n=1;n<rows.length;n++)for(const edge of ['left','right'])limb(c,rows[n-1][edge],rows[n][edge],1,cloth.ink);
          if(capeStyle!=='tattered'){
            limb(c, a, b, 2, cloth.ink);
            limb(c,{x:a.x,y:a.y-1},{x:b.x,y:b.y-1},1,cloth.trim);
          }
          for(const t of [.25,.7])for(let n=1;n<rows.length;n++){
            if(capeStyle==='tattered'&&n>15)continue;
            const point=row=>({x:row.left.x+(row.right.x-row.left.x)*t,y:row.left.y+(row.right.y-row.left.y)*t});
            limb(c,point(rows[n-1]),point(rows[n]),1,t<.5?cloth.light:cloth.dark);
          }
        });
      },
      "Cape",
    );
  }
  for (const side of ["L", "R"]) {
    const hip = p["hip" + side],
      knee = p["knee" + side],
      foot = p["foot" + side];
    const shoulder = p["shoulder" + side],
      elbow = p["elbow" + side],
      hand = p["hand" + side];
    add(
      (hip.depth + knee.depth + foot.depth) / 3,
      () => {
        const color = gear.pants
            ? ITEMS[gear.pants]?.artColor || "#819a9b"
            : pal.legs,
          shade = gear.pants ? gearPalette(gear.pants,cosmetics.dye).dark : pal.legShade;
        wear("pants", hip, () => {
          if(human&&detailedChain(c,[hip,knee,foot],[5.3,4.5,3.8],color,materialIndex(gear.pants)))return;
          if (human) {
            limb(c, hip, knee, sculpted?6:4.8, ink);
            limb(c, knee, foot, 5.5, ink);
          }
          limb(c, hip, knee, model.skeleton ? 2 : sculpted?4.8:4, shade);
          limb(c, knee, foot, model.skeleton ? 2 : sculpted?4:3.5, color);
          if (human) {
            limb(c, {x:hip.x-1,y:hip.y+1}, {x:knee.x-1,y:knee.y}, 1, color);
            pixel(knee.x-1,knee.y,2,1,shade);
            limb(c,{x:knee.x+1,y:knee.y+2},{x:foot.x+1,y:foot.y-3},1,shade);
            const fabric=gearPalette(gear.pants,cosmetics.dye||color);
            limb(c,{x:hip.x-1,y:hip.y+2},{x:knee.x-1,y:knee.y-1},1,fabric.light);
            pixel(knee.x-1,knee.y+1,2,1,fabric.base);
          }
        });
        const toe = projectPoint(
          [
            positions["foot" + side][0],
            positions["foot" + side][1] + 2,
            positions["foot" + side][2] - 0.5,
          ],
          d,
        );
        withBootPose(c,foot,knee,()=>rotateJoint('foot'+side,foot,()=>{
        if (!gear.feet) {
        if (human) limb(c, foot, toe, 5.5, ink);
        limb(
          c,
          foot,
          toe,
          3.5,
          look?.shoes || color,
        );
        if (human) {
          pixel(toe.x - 1, toe.y - 1, 2, 1, "#b39874");
          pixel(toe.x - 2, toe.y + 1, 4, 1, "#302b2b");
        }
        }
        if (gear.feet)
          // The boot already includes its toe extension. Its shaft and rotation
          // must share the ankle anchor rather than applying that offset twice.
          wear("feet", foot, () => {
            fittedGear(c,gear.feet,foot,d,side,cosmetics.dye);
          });
        }),!!model.wearables?.[gear.feet]?.[d]?.pixels?.some(Boolean));
      },
      "Leg " + side,
    );
    add(
      // Preserve near/far arm occlusion in diagonal and profile views.
      (shoulder.depth + elbow.depth + hand.depth) / 3 + (back ? -0.35 : 0.35),
      () => {
        if(model.type==='zombie'&&actor.missingArm===side){ellipse(c,shoulder.x,shoulder.y,2.5,2.5,pal.headShade);pixel(shoulder.x-1,shoulder.y-1,2,2,pal.head);return;}
        const hdArm=human&&detailedArm(c,shoulder,elbow,hand,gear.chest?ITEMS[gear.chest]?.artColor||'#6c8580':pal.arms,pal.head,gear.chest);
        if(!hdArm){
        if (human) {
          limb(c, shoulder, elbow, sculpted?5.5:4.5, ink);
          limb(c, elbow, hand, sculpted?4.5:3.5, ink);
        }
        limb(
          c,
          shoulder,
          elbow,
          model.skeleton ? 2 : sculpted?4.5:3.5,
          gear.chest ? ITEMS[gear.chest]?.artColor || "#6c8580" : pal.armShade,
        );
        limb(
          c,
          elbow,
          hand,
          model.skeleton ? 2 : sculpted?3.5:2.5,
          // Gloves belong to the hand anchor; they must not recolor the
          // entire forearm or turn the character into a pair of mitts.
          human ? pal.headShade : pal.arms,
        );
        ellipse(
          c,
          hand.x,
          hand.y,
          1.6,
          1.5,
          pal.headShade,
        );
        if (human && !gear.gloves) {
          ellipse(c, hand.x, hand.y, sculpted?2:1.7, sculpted?2:1.8, ink);
          ellipse(c, hand.x, hand.y - 0.5, sculpted?1.5:1.1, sculpted?1.5:1.3, pal.head);
          pixel(hand.x-1,hand.y-1,1,1,skinPalette(pal.head).light);
        }
        if (human) {
          const sleeve=gearPalette(gear.chest,cosmetics.dye||(gear.chest?ITEMS[gear.chest]?.artColor:pal.arms));
          limb(c,{x:shoulder.x-1,y:shoulder.y},{x:elbow.x-1,y:elbow.y-2},1,sleeve.light);
          limb(c,{x:elbow.x-.5,y:elbow.y+1},{x:hand.x-.5,y:hand.y-2},1,skinPalette(pal.head).base);
          pixel(elbow.x-1,elbow.y,2,1,sleeve.dark);
        }
        if (human && !gear.chest) {
          limb(c,{x:elbow.x-.8,y:elbow.y-1},{x:elbow.x+.8,y:elbow.y-1},c.__humanoidDetail?.75:2,"#d2c6a7");
        }
        }
        if(model.type==='zombie')drawZombieClaws(c,hand,d);
        if (gear.gloves)
          wear("gloves", hand, () => {
            fittedGear(c,gear.gloves,hand,d,side,cosmetics.dye);
          });
        if (gear.shoulders)
          wear("shoulders", shoulder, () =>
            fittedGear(c,gear.shoulders,shoulder,d,side,cosmetics.dye),
          );
        else if(sculpted&&!gear.chest&&!hdArm){
          ellipse(c,shoulder.x,shoulder.y,2.7,1.8,ink);
          ellipse(c,shoulder.x,shoulder.y-.3,2,1.2,'#8c704b');
          pixel(shoulder.x-1,shoulder.y-1,2,1,'#c6a16a');
        }
      },
      "Arm " + side,
    );
    add(hand.depth + .6, () => {
        if(model.type==='zombie'&&actor.missingArm===side)return;
        const weaponId = gear[side === "R" ? "hand1" : "hand2"],
          weapon = itemKind(weaponId),
          weaponColor = ITEMS[weaponId]?.artColor;
        rotateJoint('hand'+side,hand,()=>wear(side === "R" ? "hand1" : "hand2", hand, () => {
          if (weapon === "lantern" || weapon === "torch") {
            drawItem(c, weaponId, hand.x, hand.y + (weapon === "lantern" ? 5 : -7), 15);
            if(weapon === "torch")drawTorchFlame(c,hand.x,hand.y-11,time,d*.17+(side==="L"?2:0));
          }
          if(weapon==='critter_net')drawItem(c,weaponId,hand.x,hand.y-8,24);
          if(weapon==='boomerang')drawItem(c,weaponId,hand.x,hand.y+3,19);
          if (weapon === "rifle") {
            const length = Math.hypot(actor.faceX, actor.faceY) || 1;
            const aim = { x: (actor.faceX ?? 0) / length, y: (actor.faceY ?? 1) / length };
            const aimed=sculpted&&['draw','ranged'].includes(equipmentPose.action);
            const butt = aimed?{x:p.shoulderR.x,y:p.shoulderR.y+1}:{ x: hand.x - aim.x * 6, y: hand.y - aim.y * 3 };
            const muzzle = aimed?{x:p.handL.x+(p.handL.x-hand.x)*1.5,y:p.handL.y+(p.handL.y-hand.y)*1.5}:{ x: hand.x + aim.x * 21, y: hand.y + aim.y * 11 - 2 };
            limb(c,butt,hand,6,ink);limb(c,hand,muzzle,4,ink);
            limb(c, butt, hand, 4, "#916642");
            limb(c, hand, muzzle, 2.5, "#39434b");
            limb(c, { x: hand.x, y: hand.y - 1 }, { x: muzzle.x, y: muzzle.y - 1 }, 1, "#c6d0c7");
            pixel(hand.x-1,hand.y+1,3,2,"#302b2b");
            pixel(butt.x,butt.y-1,2,1,"#bc9765");
          }
          if (weapon === "sword" || weapon === "dagger") {
            const style=ITEMS[weaponId]?.style;
            if(style==='whip'){
              const action=equipmentPose.action,t=equipmentPose.frame/(model.clips[action]?.length-1||1);
              drawWhip(c,hand,action==='whip'?'swipe_big':action,t,side,d,projectPoint,weaponColor);
            } else {
            const attack =
              actor.attack > 0 || actor.animationAction === "slash";
            let tip = {
              x: hand.x + (attack ? -Math.sin(d*Math.PI/4)*12 : -Math.sin(d*Math.PI/4)*5+Math.cos(d*Math.PI/4)*(side==='R'?3:-3)),
              y: hand.y - (weapon === "sword" ? 14 : 8) + (attack ? Math.cos(d*Math.PI/4)*5 : 0),
            };
            if(sculpted){
              const action=equipmentPose.action,swing=['slash','swipe_one','swipe_two','swipe_big','sword_combo'].includes(action);
              if(swing){
                const f=equipmentPose.frame/(model.clips[action].length-1);
                const phase=action==='sword_combo'?(f<=.5?f*2:(f-.5)*2):f,reverse=action==='swipe_two'||action==='sword_combo'&&f>.5;
                const angle=(phase<.25?-.7:phase<.65?-.7+(phase-.25)/.4*2.5:1.8-(phase-.65)/.35*1.6)*(reverse?-1:1);
                const reach=weapon==='sword'?15:9;
                tip={x:hand.x+Math.sin(angle)*reach*Math.cos(d*Math.PI/4),y:hand.y-Math.cos(angle)*reach};
                if(model.combatRevision===4){
                  const otherKind=itemKind(gear[side==='R'?'hand2':'hand1']),dual=['sword','dagger'].includes(otherKind),active=!dual||(combatPhase(action,f).reverse?side==='L':side==='R');
                  const v=projectPoint(combatWeaponVector(active?action:'slash',active?f:0,weapon,side),d);
                  tip={x:hand.x+v.x,y:hand.y+v.y};
                }
              }
            }
            const material=gearPalette(weaponId);
            if(weaponId==='stick'){
              limb(c,hand,tip,4,'#493a28');
              limb(c,hand,tip,2,'#a78652');
              limb(c,{x:hand.x-1,y:hand.y},{x:tip.x-1,y:tip.y},1,'#d0b17a');
              limb(c,{x:tip.x-(tip.x-hand.x)*.3,y:tip.y-(tip.y-hand.y)*.3},{x:tip.x+3,y:tip.y+3},2,'#a78652');
            }else if(!keeperBlade(c,weaponId,hand,tip)){
            const bladeWidth=style==='broad'?4:2;
            const bladeLength=Math.hypot(tip.x-hand.x,tip.y-hand.y)||1;
            const ux=(tip.x-hand.x)/bladeLength,uy=(tip.y-hand.y)/bladeLength;
            const guard={x:hand.x+ux*2,y:hand.y+uy*2};
            limb(c,hand,tip,bladeWidth+2,material.ink);
            limb(
              c,
              hand,
              tip,
              bladeWidth,
              weaponColor || "#e1dfbd",
            );
            limb(c,{x:hand.x-1,y:hand.y-2},{x:tip.x-1,y:tip.y+1},1,material.light);
            if(style==='crescent'||style==='hook') limb(c,tip,{x:tip.x+3,y:tip.y+2},2,material.base);
            if(style==='star') {pixel(tip.x-2,tip.y+1,5,1,material.light);}
            limb(c,{x:guard.x+uy*3,y:guard.y-ux*3},{x:guard.x-uy*3,y:guard.y+ux*3},3,material.ink);
            limb(
              c,
              { x: guard.x + uy*3, y: guard.y - ux*3 },
              { x: guard.x - uy*3, y: guard.y + ux*3 },
              1.5,
              "#b28d54",
            );
            limb(c,hand,{x:hand.x-ux*3,y:hand.y-uy*3},2,material.leather);
            pixel(guard.x-1,guard.y-1,1,1,material.shine);
            pixel(hand.x-ux*2,hand.y-uy*2,1,1,material.trim);
            pixel(hand.x-ux*3-1,hand.y-uy*3,2,1,material.trim);
            }
            }
          }
          if(weapon==='staff'){
            const material=gearPalette(weaponId),action=equipmentPose.action,t=equipmentPose.frame/(model.clips[action]?.length-1||1);
            const angle=(action==='slash'?Math.sin(Math.max(0,Math.min(1,t))*Math.PI)*1.15:.09)*(d<4?-1:1),dx=Math.sin(angle),dy=-Math.cos(angle);
            const tip={x:hand.x+dx*23,y:hand.y+dy*23},butt={x:hand.x-dx*7,y:hand.y-dy*7};
            if(!keeperStaff(c,weaponId,hand,tip)){
            limb(c,butt,tip,3,material.ink);limb(c,butt,tip,1,material.base);
            if(ITEMS[weaponId]?.warlockGear){
              pixel(tip.x-3,tip.y-3,7,6,'#302936');pixel(tip.x-2,tip.y-3,5,4,'#c9c0a0');pixel(tip.x-1,tip.y-4,3,1,'#e0d6b5');
              pixel(tip.x-2,tip.y-1,2,1,'#3c3444');pixel(tip.x+1,tip.y-1,2,1,'#3c3444');pixel(tip.x-1,tip.y-1,1,1,'#91d9bc');pixel(tip.x+1,tip.y-1,1,1,'#91d9bc');
              pixel(tip.x,tip.y+1,1,1,'#66546b');pixel(tip.x-2,tip.y+2,5,2,'#a3977c');pixel(tip.x-1,tip.y+2,1,1,'#dfd5b2');pixel(tip.x+1,tip.y+2,1,1,'#dfd5b2');
            }else{ellipse(c,tip.x,tip.y,3,4,material.ink);ellipse(c,tip.x,tip.y-1,2,2.5,'#c99ef1');pixel(tip.x-1,tip.y-2,1,1,'#f3e4ff');}
            pixel(hand.x-1,hand.y-4,3,1,'#baa780');
            }
          }
          if (weapon === "wand") {
            const localTip=posedWandTip(actor,time,model,d,side,null);
            const tip = { x: hand.x + localTip.x, y: hand.y + localTip.y };
            const material=gearPalette(weaponId),style=ITEMS[weaponId]?.style;
            limb(c,hand,tip,3,material.ink);
            limb(c, hand, tip, 1, material.leather);
            ellipse(c,tip.x,tip.y,2.5,3,material.ink);
            ellipse(c, tip.x, tip.y, 1.5, 2, weaponColor || "#90baff");
            pixel(tip.x-1,tip.y-1,1,1,"#f2ebff");
            pixel(tip.x-1,tip.y+2,3,1,material.trim);
            if(style==='flame') {pixel(tip.x-1,tip.y-4,2,3,'#ffc164');pixel(tip.x,tip.y-3,1,2,material.shine);}
            if(style==='star'||style==='sun') {pixel(tip.x-4,tip.y,2,1,material.light);pixel(tip.x+3,tip.y,2,1,material.light);pixel(tip.x,tip.y-4,1,2,material.light);}
          }
          if (weapon === "shield") {
            fittedShield(c,weaponId,hand,d,actor.blocking,cosmetics.dye);
          }
          if(['wand','staff','sword','dagger','rifle'].includes(weapon)) {
            pixel(hand.x-1,hand.y-1,3,2,gear.gloves?gearPalette(gear.gloves,cosmetics.dye).base:pal.head);
            pixel(hand.x-1,hand.y+1,2,1,gear.gloves?gearPalette(gear.gloves,cosmetics.dye).dark:pal.headShade);
          }
        }));
      },
      "Held item " + side,
      ['hand'+side],
    );
    // The grip is part of this arm. A projected hand depth can fall behind
    // its own forearm in profile poses, hiding a shield or wand in the sleeve.
    if(['shield','wand','staff'].includes(itemKind(gear[side === 'R' ? 'hand1' : 'hand2'])))
      queue.at(-1).attachmentOrder={anchors:['Arm '+side],behind:false};
  }
  add(
    p.chest.depth,
    () => {
      const color = gear.chest
          ? ITEMS[gear.chest]?.artColor || "#93a3a2"
          : pal.body,
        shade = gear.chest ? gearPalette(gear.chest,cosmetics.dye).dark : pal.bodyShade;
      wear("chest", p.chest, () => {
        if(sculpted){
          limb(c,p.chest,{x:p.head.x,y:p.head.y+3},4,pal.headShade);
          drawHeroTorso(c,p,d,color,pal.head,back);
        }else{
        if (human) limb(c, p.pelvis, p.chest, 10, ink);
        limb(c, p.pelvis, p.chest, 7, shade);
        limb(
          c,
          { x: p.pelvis.x - 1, y: p.pelvis.y },
          { x: p.chest.x - 1, y: p.chest.y },
          5,
          color,
        );
        }
        if (human && !gear.chest && !sculpted) {
          // Collared tunic: highlights, center seam and a small stitched pocket.
          const x = p.chest.x, y = p.chest.y;
          limb(c,{x:x-3,y:y+1},{x:p.pelvis.x-3,y:p.pelvis.y-2},1,gearPalette(null,color).light);
          pixel(x-3,y-2,2,2,"#eadcc0");
          pixel(x+1,y-2,2,2,"#eadcc0");
          if (!back) {
            limb(c,{x,y:y+1},{x:p.pelvis.x,y:p.pelvis.y-2},1,shade);
            pixel(x,y+2,1,1,"#e3bf70");
            pixel(x+1,y+4,2,1,shade);
            pixel(x-3,y+3,2,3,shade);
            pixel(x-3,y+3,2,1,"#c5aa73");
            pixel(x,y+5,1,1,"#e3bf70");
          } else {
            limb(c,{x:x-2,y:y+1},{x:x+2,y:y+1},1,shade);
            limb(c,{x:x+2,y:y+2},{x:p.pelvis.x+2,y:p.pelvis.y-2},1,shade);
          }
        }
        wearableDetails(c, p, {chest:gear.chest}, {skin:pal.head}, d, time, cosmetics);
        keeperGearDetails(c,gear.chest,p,d,cosmetics.dye);
        if (model.skeleton && !gear.chest) {
          limb(c, p.pelvis, p.chest, 1, pal.head);
          c.fillStyle = pal.outline;
          for (let n = 0; n < 3; n++)
            c.fillRect(
              Math.round(p.chest.x - 3),
              Math.round(p.chest.y + 2 + n * 3),
              6,
              1,
            );
        }
      });
      if (!model.skeleton || gear.pants) {
        wear("pants", p.pelvis, () => {
          const pantsColor = gear.pants ? ITEMS[gear.pants]?.artColor || "#819a9b" : pal.legs;
          const pantsShade = gear.pants ? gearPalette(gear.pants,cosmetics.dye).dark : pal.legShade;
          if(sculpted){
            limb(c,p.hipL,p.hipR,5,ink);limb(c,p.hipL,p.hipR,3.5,pantsColor);
            const vx=p.pelvis.x-p.chest.x,vy=p.pelvis.y-p.chest.y,len=Math.hypot(vx,vy)||1;
            const a={x:p.pelvis.x-vy/len*4,y:p.pelvis.y+vx/len*4},b={x:p.pelvis.x+vy/len*4,y:p.pelvis.y-vx/len*4};
            limb(c,a,b,2,'#4b3c2e');
            if(!back){pixel(p.pelvis.x-1,p.pelvis.y-1,3,2,'#c5a268');pixel(p.pelvis.x,p.pelvis.y,1,1,'#53402d');}
            keeperGearDetails(c,gear.pants,p,d,cosmetics.dye);
            return;
          }
          // Base clothing needs the same connected hip panel as equipped pants.
          // Cover the rounded shirt endpoint, then join both animated hips so
          // shirt pixels cannot hang into the crotch between the legs.
          const top = Math.round(p.pelvis.y - 1);
          const bottom = Math.ceil(Math.max(p.pelvis.y + 4, p.hipL.y + 2, p.hipR.y + 2));
          const left = Math.min(p.hipL.x, p.hipR.x) - 2;
          const right = Math.max(p.hipL.x, p.hipR.x) + 2;
          for (let y = top; y < bottom; y++) {
            const t = (y - top) / Math.max(1, bottom - top - 1);
            const x0 = Math.round(p.pelvis.x - 3.5 + (left - p.pelvis.x + 3.5) * t);
            const x1 = Math.round(p.pelvis.x + 3.5 + (right - p.pelvis.x - 3.5) * t);
            c.fillStyle = y === top ? pantsShade : pantsColor;
            c.fillRect(x0, y, Math.max(1, x1 - x0), 1);
          }
          keeperGearDetails(c,gear.pants,p,d,cosmetics.dye);
        });
      }
      wearableDetails(c, p, {pants:gear.pants}, null, d, time, cosmetics);
      if (human) {
        pixel(p.pelvis.x-4,p.pelvis.y-1,8,2,"#493628");
        if (!back) { pixel(p.pelvis.x-1,p.pelvis.y-1,2,2,"#d6ad60"); }
      }
      if (itemKind(gear.neck) === "charm")
        wear("neck", p.chest, () => {
          if(keeperBand(c,gear.neck,p.chest,d))return;
          const chest = positions.chest;
          const attach = (x, y, z) =>
            projectPoint([chest[0] + x, chest[1] + y, chest[2] + z], d);
          if (back) {
            const clasp = attach(0, -3, 0);
            limb(c, attach(-3, -2, 1), attach(3, -2, 1), 1, "#ad8549");
            c.fillStyle = "#ffb43e";
            c.fillRect(Math.round(clasp.x) - 1, Math.round(clasp.y), 2, 2);
          } else {
            const gem = attach(0, 4, -4);
            limb(c, attach(-3, 2, 1), gem, 1, "#f2ce7c");
            limb(c, attach(3, 2, 1), gem, 1, "#f2ce7c");
            ellipse(c, gem.x, gem.y, 2.6, 3.3, ITEMS[gear.neck]?.warlockGear?'#302b3c':"#9c5724");
            ellipse(c, gem.x, gem.y, 1.9, 2.6, ITEMS[gear.neck]?.warlockGear?'#81ceb1':"#ffb43e");
            c.fillStyle = "#fff0ad";
            c.fillRect(Math.round(gem.x) - 1, Math.round(gem.y) - 1, 1, 2);
          }
        });

    },
    "Body and pelvis",
  );
  add(
    p.head.depth + 0.15,
    () => {
      const hasCustomHead=model.wearables?.[gear.head]?.[d]||model.wearables?.['hair:'+look?.hair]?.[d];
      const headAngle=sculpted&&!hasCustomHead?Math.atan2(p.head.x-p.chest.x,p.chest.y-p.head.y):0;
      const facePoints=sculpted?unrotateFace(p,headAngle):p;
      const faceLook=sculpted?{...look,eyesClosed:['sleep','death'].includes(playerAction(actor))}:look;
      withPixelRotation(c,p.head,headAngle,()=>withDetailedHeadScale(c,p.head,human&&!hasCustomHead,()=>{
      const h = p.head,
        side = d === 2 || d === 6;
      const visible = (n) => model.visibility?.[n]?.[d] !== false;
      if (model.robot) {
        c.fillStyle = pal.headShade;
        c.fillRect(Math.round(h.x) - 5, Math.round(h.y) - 6, 10, 11);
        c.fillStyle = pal.head;
        c.fillRect(Math.round(h.x) - 4, Math.round(h.y) - 5, 8, 8);
        for (const name of ["eyeL", "eyeR"])
          if (visible(name)) {
            c.fillStyle = "#b6fff1";
            c.fillRect(Math.round(p[name].x) - 1, Math.round(p[name].y), 2, 2);
          }
        c.fillStyle = "#d1b46f";
        c.fillRect(Math.round(h.x), Math.round(h.y) - 10, 1, 4);
        c.fillRect(Math.round(h.x) - 1, Math.round(h.y) - 11, 3, 2);
        return;
      }
      if (!human) for (const name of ["earL", "earR"])
        if (visible(name))
          ellipse(c, p[name].x, p[name].y, 1.2, 1.8, pal.headShade);
      if (human) {
        drawHumanHead(c,facePoints,d,pal.head,faceLook,visible);
      } else {
        ellipse(c, h.x, h.y, side ? 3.5 : 4.2, 5, pal.headShade);
        ellipse(c, h.x - 0.6, h.y - 1, side ? 2.8 : 3.6, 4, pal.head);
      }
      if (!human) for (const name of ["eyeL", "eyeR"])
        if (visible(name)) {
          c.fillStyle = pal.outline;
          const q = p[name];
          c.fillRect(
            Math.round(q.x) - (model.skeleton ? 1 : 0),
            Math.round(q.y),
            model.skeleton ? 2 : 1,
            2,
          );
        }
      if (!human && visible("nose")) {
        c.fillStyle = model.skeleton ? pal.outline : pal.headShade;
        c.fillRect(
          Math.round(p.nose.x),
          Math.round(p.nose.y),
          1,
          model.skeleton ? 1 : 2,
        );
      }
      if (!human && visible("mouth")) {
        c.fillStyle = model.skeleton ? pal.outline : pal.headShade;
        const q = p.mouth;
        if (model.skeleton) {
          for (let x = -2; x <= 2; x += 2)
            c.fillRect(Math.round(q.x) + x, Math.round(q.y), 1, 1);
        } else c.fillRect(Math.round(q.x) - 1, Math.round(q.y), 2, 1);
      }
      wear("hair", h, () => {
        if (
          gear.head &&
          ITEMS[gear.head]?.style !== "circlet" &&
          c.save &&
          c.rect &&
          c.clip
        ) {
          c.save();
          c.beginPath();
          c.rect(h.x - 8, h.y - 2, 16, 18);
          c.clip();
          drawHair(c, h, look, d, playerFrame(actor,time,model), playerAction(actor));
          c.restore();
        } else drawHair(c, h, look, d, playerFrame(actor,time,model), playerAction(actor));
      });
      if (human) drawHumanHead(c,facePoints,d,pal.head,faceLook,visible,true,pal.outline);
      if(model.type==='zombie')drawZombieFace(c,facePoints,d,actor,time);
      // Hair is cosmetic and sits beneath head equipment.
      if (gear.head)
        wear("head", h, () => {
          if (!keeperHeadgear(c,gear.head,h,d) && !directionalHelmet(c, gear.head, h, d, cosmetics))
            drawItem(c, gear.head, h.x, h.y - 2, 14, cosmetics.dye);
        });
      }));
    },
    "Head and headwear",
  );
  if(model.type==='zombie')add(p.chest.depth+.2,()=>drawZombieRags(c,p,d),'Tattered cloth',['chest','pelvis']);
  if (itemKind(gear.hand1) === "bow")
    add(
      p.handL.depth + 0.6,
      () => {
        rotateJoint('handL',p.handL,()=>wear("hand1", p.handL, () => {
          const hand = p.handL;
          const style=ITEMS[gear.hand1]?.style,material=gearPalette(gear.hand1);
          const length=style==='longbow'?12:10;
          const facing=d>0&&d<4?-1:1,bulge=(d===2||d===6)?3:5;
          let top = { x: hand.x + facing, y: hand.y - length },
            mid = { x: hand.x + facing*bulge, y: hand.y },
            bottom = { x: hand.x + facing, y: hand.y + length };
          const action=equipmentPose.action,aimed=['draw','ranged'].includes(action),t=equipmentPose.frame/(model.clips[action]?.length-1||1);
          if(model.combatRevision===4||!aimed){
            ({top,mid,bottom}=bowRigGeometry(hand,visualDirection??d,length,!aimed));
          }
          if(!actor.animationAction&&Number.isFinite(actor.bowAimBlend)&&['idle','walk','run','draw','ranged'].includes(action)){
            const low=bowRigGeometry(hand,visualDirection??d,length,true),high=bowRigGeometry(hand,visualDirection??d,length,false),blend=actor.bowAimBlend;
            const mix=key=>({x:low[key].x+(high[key].x-low[key].x)*blend,y:low[key].y+(high[key].y-low[key].y)*blend});
            top=mix('top');mid=hand;bottom=mix('bottom');
          }
          // Smooth laminated limbs, not the old two straight segments forming a V.
          const curve=(a,b)=>{
            const control={x:mid.x+(a.x-mid.x)*.72,y:mid.y+(a.y-mid.y)*.18};
            let last=a;
            for(let i=1;i<=8;i++){const t=i/8,u=1-t,next={x:u*u*a.x+2*u*t*control.x+t*t*b.x,y:u*u*a.y+2*u*t*control.y+t*t*b.y};
              limb(c,last,next,3,material.ink);last=next;}
            last=a;for(let i=1;i<=8;i++){const t=i/8,u=1-t,next={x:u*u*a.x+2*u*t*control.x+t*t*b.x,y:u*u*a.y+2*u*t*control.y+t*t*b.y};limb(c,last,next,1.5,material.light);last=next;}
          };
          curve(top,mid);curve(bottom,mid);
          const stringHand=model.combatRevision===4&&(!aimed||action==='ranged'&&t>.1)?{x:(top.x+bottom.x)/2,y:(top.y+bottom.y)/2}:p.handR;
          limb(c, top, stringHand, 0.7, "#dfd8b4");
          limb(c, stringHand, bottom, 0.7, "#dfd8b4");
          limb(c,{x:mid.x,y:mid.y-2},{x:mid.x,y:mid.y+2},2,material.leather);
          if(style==='winged'||style==='recurve') {
            limb(c,top,{x:top.x+facing*3,y:top.y-2},2,material.light);
            limb(c,bottom,{x:bottom.x+facing*3,y:bottom.y+2},2,material.light);
          }
          if(ITEMS[gear.hand1]?.bansheeGear){
            for(const tip of [top,bottom]){limb(c,{x:tip.x-facing*2,y:tip.y-2},{x:tip.x+facing*3,y:tip.y+2},1,material.shine);}
            pixel(mid.x-1,mid.y-1,3,3,material.ink);pixel(mid.x,mid.y,1,1,'#9ae5ed');
          }
          const relaxed=['idle','walk','run'].includes(action);
          if(relaxed&&count({...actor,inventory:actor.inventory||[]},quiverType({...actor,inventory:actor.inventory||[]}))>0){
            const v=projectPoint([14,0,-10],visualDirection??d),tip={x:hand.x+v.x,y:hand.y+v.y};
            limb(c,p.handR,tip,1,'#d8bd80');
            const dx=tip.x-p.handR.x,dy=tip.y-p.handR.y,len=Math.hypot(dx,dy)||1,ux=dx/len,uy=dy/len;
            limb(c,{x:tip.x-ux*3-uy,y:tip.y-uy*3+ux},tip,1,'#e4ece7');
            limb(c,{x:tip.x-ux*3+uy,y:tip.y-uy*3-ux},tip,1,'#9aafb1');
            pixel(p.handR.x-1,p.handR.y-1,3,2,gear.gloves?gearPalette(gear.gloves,cosmetics.dye).base:pal.head);
          }
          if (actor.charge > 0 || sculpted&&aimed&&!(model.combatRevision===4&&action==='ranged'&&t>.1)){
            const v=model.combatRevision===4?projectPoint([0,12,0],visualDirection??d):{x:facing*12,y:0};
            limb(c, p.handR, { x: hand.x + v.x, y: hand.y+v.y }, 1, "#dfc693");
            const tip={x:hand.x+v.x,y:hand.y+v.y};
            ellipse(c,tip.x,tip.y,1.5,1.5,'#dce7df');
            if(actor.charge>0){
              const power=Math.min(1,actor.charge/1.2),pulse=.5+.5*Math.sin(time*(power===1?18:10));
              const radius=power===1?3:1+power+pulse;
              limb(c,{x:tip.x-radius,y:tip.y},{x:tip.x+radius,y:tip.y},1,power===1?'#fff0a2':'#d5eedd');
              limb(c,{x:tip.x,y:tip.y-radius},{x:tip.x,y:tip.y+radius},1,power===1?'#fff0a2':'#d5eedd');
              pixel(tip.x,tip.y,1,1,'#ffffff');
            }
          }
          // Fingers close over the grip instead of being hidden behind the bow.
          pixel(hand.x-1,hand.y-1,3,3,gear.gloves?gearPalette(gear.gloves,cosmetics.dye).base:pal.head);
          pixel(hand.x-1,hand.y+1,2,1,gear.gloves?gearPalette(gear.gloves,cosmetics.dye).dark:pal.headShade);
        }));
      },
      "Bow",
    );
  if(queue.at(-1)?.id==='Bow')queue.at(-1).attachmentOrder={anchors:['Body and pelvis'],behind:p.handL.depth<p.chest.depth};
  if(sculpted&&['mine','woodcut','carry','pickup','found_unique'].includes(propAction))add((p.handL.depth+p.handR.depth)/2+.3,()=>{
    const a=p.handR,b=p.handL,mid={x:(a.x+b.x)/2,y:(a.y+b.y)/2};
    if(propAction==='mine'||propAction==='woodcut'){
      const length=Math.hypot(b.x-a.x,b.y-a.y)||1,ux=(b.x-a.x)/length,uy=(b.y-a.y)/length;
      const tip={x:b.x+ux*8,y:b.y+uy*8},butt={x:a.x-ux*4,y:a.y-uy*4};
      limb(c,butt,tip,3,ink);limb(c,butt,tip,1.5,'#a47c4e');
      const left={x:tip.x-uy*5,y:tip.y+ux*5},right={x:tip.x+uy*5,y:tip.y-ux*5};
      limb(c,left,right,propAction==='mine'?3:5,'#55696b');limb(c,left,right,1,'#c8d4cb');
      pixel(tip.x,tip.y,2,2,'#d5b678');
    }else{
      const type=propAction==='found_unique'||propAction==='pickup'?actor.pickupItem:typeof actor.carryingItem==='string'?actor.carryingItem:actor.carryingItem?.type;
      if(type&&ITEMS[type]){
        const size=propAction==='found_unique'?16:12,scale=size/24,x=mid.x-size/2,y=mid.y-size/2-2;
        paintItem({fillStyle:ink,fillRect(px,py,w,h){c.fillStyle=this.fillStyle;c.fillRect(Math.round(x+px*scale),Math.round(y+py*scale),Math.max(1,Math.round(w*scale)),Math.max(1,Math.round(h*scale)));}},type);
      }else{
        pixel(mid.x-5,mid.y-7,10,8,ink);pixel(mid.x-4,mid.y-6,8,6,'#9c7c4c');
        pixel(mid.x-4,mid.y-6,8,1,'#ceb177');pixel(mid.x-1,mid.y-6,2,6,'#594d38');
      }
    }
    for(const q of [a,b]){pixel(q.x-1,q.y-1,3,2,gear.gloves?gearPalette(gear.gloves).base:pal.head);}
  },'Interaction prop');
  const previousDetail=c.__humanoidDetail,previousMaterials=c.__humanoidMaterials;
  c.__humanoidDetail=human&&humanoidArtAvailable(c)&&!c.__legacyHumanoid;
  if(c.__humanoidDetail){
    const materials=new Map();
    for(const [color,kind] of [[pal.head,'skin'],[pal.headShade,'skin'],[pal.body,'cloth'],[pal.bodyShade,'cloth'],[pal.arms,'cloth'],[pal.armShade,'cloth'],[pal.legs,'cloth'],[pal.legShade,'cloth'],[look?.shoes,'leather']])materials.set(color,materialIndex(null,kind));
    for(const [slot,id]of Object.entries(gear))if(ITEMS[id])for(const color of Object.values(gearPalette(id,cosmetics.dye)))if(color!=='#302b2b')materials.set(color,materialIndex(id,['head','shoulders','chest','hand1','hand2'].includes(slot)?'metal':'leather'));
    c.__humanoidMaterials=materials;
  }
  try{paintLayers(queue, model, d, c, p,itemKind(gear.hand1)==='bow');}
  finally{c.__humanoidDetail=previousDetail;c.__humanoidMaterials=previousMaterials;}
  if (!human) wearableDetails(c, p, {}, look, d, time, cosmetics);
  if(salvaging){
    if(actor.salvageHold?.type&&!actor.salvageHold.latched)drawItem(c,actor.salvageHold.type,(p.handL.x+p.handR.x)/2,(p.handL.y+p.handR.y)/2,10);
    for(const [index,hand] of [p.handL,p.handR].entries())drawParticleEffect(c,actor.salvageFinish>0?'salvage-burst':'salvage-hands',hand.x,hand.y,actor.salvageFinish>0?.3-actor.salvageFinish:actor.salvageHold?.elapsed||time,index+17);
  }
  return p;
}
export function descendants(model, joint) {
  return Object.keys(model.joints).filter((n) => {
    let cur = n;
    while (cur) {
      if (cur === joint) return true;
      cur = model.joints[cur].parent;
    }
    return false;
  });
}
export function setJointKey(model, clipName, frame, joint, position) {
  const c = model.clips[clipName];
  frame = Math.max(0, Math.min(c.length - 1, Math.round(frame)));
  let key = c.keys.find((k) => k.frame === frame);
  if (!key) {
    key = { frame, joints: {} };
    c.keys.push(key);
    c.keys.sort((a, b) => a.frame - b.frame);
  }
  key.joints[joint] = position.map(
    (v, i) => v - model.joints[joint].position[i],
  );
}
