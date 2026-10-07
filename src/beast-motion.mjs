import { defaultLionMotion, drawLion } from "./lion-motion.mjs";
import {withCompanionClips} from './companion-motion.mjs';
import { paintLayers } from "./render-order.mjs";
import {validateSprite} from './pixels.mjs';
import { defaultRhinoMotion, drawRhino } from "./rhino-motion.mjs";
import {defaultBeetleMotion,upgradeBeetleMotion,drawBeetle} from './beetle-motion.mjs';
import {defaultSpiderMotion,upgradeSpiderMotion,drawSpider} from './spider-motion.mjs';
import {
  poseAt,
  projectPoint,
  facingIndex,
  ellipse,
  limb,
  validateMotion,
} from "./player-motion.mjs";
export const BEAST_KINDS = ["panther", "boar", "beetle", "white_lion", "snow_leopard", "spider", "tarantula"];
const pantherPose = (model, frame, changes = {}) => ({frame, joints: Object.fromEntries(Object.keys(model.joints).map(name => [name, changes[name] || (['face','eyeL','eyeR','earL','earR','muzzle','nose'].includes(name) ? changes.head : null) || [0,0,0]]))});
function pantherClip(model, fps, length, loop, frames) {
  return {fps,length,loop,keys:frames.map(([frame,joints])=>pantherPose(model,frame,joints))};
}
function addPantherClips(model) {
  const rear = (z,y=0)=>({pelvis:[0,y,z],hipL:[0,0,z],hipR:[0,0,z],kneeL:[0,3,-z*.5],kneeR:[0,3,-z*.5],hockL:[0,5,-z*.5],hockR:[0,5,-z*.5],rearPawL:[0,7,0],rearPawR:[0,7,0]});
  const front = (z,y=0)=>({chest:[0,y,z],neck:[0,y,z],head:[0,y,z],shoulderL:[0,0,z],shoulderR:[0,0,z],elbowL:[0,2,-z*.5],elbowR:[0,2,-z*.5],frontPawL:[0,4,0],frontPawR:[0,4,0]});
  model.clips.prowl=pantherClip(model,10,8,true,Array.from({length:8},(_,i)=>{const a=i*Math.PI/4,w=Math.sin(a)*2.8,l=Math.max(0,Math.cos(a))*2;return [i,{pelvis:[0,0,-1+Math.sin(a*2)*.4],chest:[0,0,-1],head:[0,-1,-1],frontPawL:[0,w,l],frontPawR:[0,-w,-l*.5],rearPawL:[0,-w,l*.5],rearPawR:[0,w,l],tailMid:[Math.sin(a)*2,0,0],tailTip:[Math.sin(a-.5)*4,0,0]}]}));
  model.clips.booty_shake=pantherClip(model,9,8,true,Array.from({length:8},(_,i)=>[i,{...front(-2),...rear(-2),pelvis:[Math.sin(i*Math.PI/2)*4,0,-2],tailBase:[Math.sin(i*Math.PI/2)*3,0,1],tailMid:[Math.sin(i*Math.PI/2+.7)*6,0,1],tailTip:[Math.sin(i*Math.PI/2+1.3)*8,0,1]}]));
  model.clips.crouch=pantherClip(model,10,6,false,[[0,{}],[3,{...front(-4),...rear(-3),head:[0,2,-4],tailTip:[3,0,0]}],[5,{...front(-5),...rear(-4),head:[0,2,-5],tailTip:[-3,0,1]}]]);
  model.clips.sit=pantherClip(model,8,8,true,[[0,{}],[3,{...rear(-9,6),...front(1,-2),head:[0,-2,2],tailBase:[0,0,-5],tailMid:[4,1,-8],tailTip:[6,4,-10]}],[7,{...rear(-9,6),...front(1,-2),head:[0,-2,1],tailBase:[0,0,-5],tailMid:[4,1,-8],tailTip:[7,4,-10]}]]);
  model.clips.lie=pantherClip(model,8,8,true,[[0,{...rear(-10,3),...front(-11,1),neck:[0,3,-11],head:[0,5,-12],tailBase:[0,0,-10],tailMid:[3,2,-14],tailTip:[7,5,-15]}],[4,{...rear(-10,3),...front(-11,1),neck:[0,3,-12],head:[0,5,-13],tailBase:[0,0,-10],tailMid:[3,2,-14],tailTip:[7,5,-15]}]]);
  model.clips.branch_lie=pantherClip(model,8,8,true,[[0,{...rear(-10,2),...front(-11,1),neck:[0,3,-11],head:[0,5,-12],frontPawL:[0,7,-3],frontPawR:[0,7,-3],rearPawL:[0,-3,-4],tailBase:[0,-2,-8],tailMid:[2,-2,-12],tailTip:[3,-3,-17]}],[4,{...rear(-10,2),...front(-11,1),neck:[0,3,-12],head:[0,5,-13],frontPawL:[0,7,-3],frontPawR:[0,7,-3],rearPawL:[0,-3,-4],tailBase:[0,-2,-8],tailMid:[2,-2,-12],tailTip:[5,-3,-17]}]]);
  model.clips.climb=pantherClip(model,10,8,false,[[0,{...front(-2),...rear(-2)}],[3,{...front(3),...rear(1),frontPawL:[0,9,10],frontPawR:[0,5,7],rearPawL:[0,-5,7],rearPawR:[0,-2,4],tailTip:[3,-4,2]}],[7,{...front(1),...rear(1),frontPawL:[0,8,3],frontPawR:[0,8,3],tailTip:[4,-4,-5]}]]);
  for(const [side,sign] of [['left',-1],['right',1]])model.clips['swipe_'+side]=pantherClip(model,16,6,false,[[0,{...front(-2)}],[2,{chest:[sign*2,2,0],head:[sign*2,3,0],['shoulder'+(sign<0?'L':'R')]:[sign*3,5,2],['elbow'+(sign<0?'L':'R')]:[sign*5,8,6],['frontPaw'+(sign<0?'L':'R')]:[sign*8,12,7]}],[4,{chest:[-sign*2,1,0],head:[-sign*1,2,0],['frontPaw'+(sign<0?'L':'R')]:[-sign*5,13,2]}],[5,{}]]);
  model.clips.bite=pantherClip(model,16,6,false,[[0,{...front(-2)}],[2,{neck:[0,5,0],head:[0,9,-2],muzzle:[0,9,-2],nose:[0,9,-2],frontPawL:[0,4,2],frontPawR:[0,4,2]}],[4,{head:[0,7,-1],muzzle:[0,7,-1]}],[5,{}]]);
  model.clips.swoop=pantherClip(model,14,6,false,[[0,{...front(-5),...rear(-4)}],[2,{pelvis:[0,4,6],chest:[0,8,8],head:[0,11,8],frontPawL:[-2,14,8],frontPawR:[2,14,8],rearPawL:[0,-7,6],rearPawR:[0,-7,6],tailTip:[0,-9,6]}],[4,{pelvis:[0,7,4],chest:[0,12,5],head:[0,15,4],frontPawL:[-3,18,3],frontPawR:[3,18,3]}],[5,{...front(-3),...rear(-2)}]]);
  return model;
}
export function defaultBeastMotion(kind) {
  if(kind==='beetle')return defaultBeetleMotion();
  if(kind==='spider'||kind==='tarantula')return defaultSpiderMotion(kind);
  if(kind==='white_lion'||kind==='snow_leopard'){
    const m=kind==='white_lion'?defaultLionMotion():defaultBeastMotion('panther');m.type=kind;m.name=kind==='white_lion'?'White lion':'Snow leopard';
    if(kind==='snow_leopard'){
      for(const clip of ['prowl','booty_shake','crouch','lie','branch_lie','climb','swipe_left','swipe_right','swoop'])delete m.clips[clip];
      for(const color of ['highlight','rosette','claw'])delete m.palette[color];
    }
    Object.assign(m.palette,{body:'#dce7e7',bodyShade:'#a0b7c4',head:'#edf0e6',headShade:'#adc3cd',mane:'#f5f3de',maneShade:'#b9cbd0',legs:'#d5e1e6',legShade:'#93acbc',tail:'#c4d4da',outline:'#294b60',muzzle:'#f8f4e6'});
    return m;
  }
  if (kind === "panther") {
    const m = defaultLionMotion();
    m.type = kind;
    m.name = "Panther";
    Object.assign(m.palette, {
      body: "#303941", bodyShade: "#171f2a", head: "#3c4850", headShade: "#1e2732",
      mane: "#303941", maneShade: "#1e2732", legs: "#323e47", legShade: "#1a2430",
      tail: "#202c36", outline: "#d8c471", muzzle: "#69737a", highlight: "#66727a", rosette: "#222c36", claw: "#d9d2b9",
    });
    Object.assign(m.shape, {
      maneRadius: 5, headRadius: 5, bodyRadius: 7, legWidth: 3.5, tailWidth: 2.3, tuftSize: 1.5,
    });
    for (const n of ["earL", "earR"]) m.joints[n].position[2] -= 3;
    m.joints.tailTip.position = [4, -36, 17];
    for (const k of m.clips.pounce.keys)
      for (const v of Object.values(k.joints)) {
        v[1] *= 0.65;
        v[2] *= 0.65;
      }
    return addPantherClips(m);
  }
  if (kind === "boar") {
    const m = defaultRhinoMotion();
    m.type = kind;
    m.name = "Boar";
    Object.assign(m.palette, {
      body: "#80604a",
      shade: "#503f35",
      light: "#a78a64",
      face: "#a68265",
      horn: "#e5d8ac",
      eye: "#201f21",
    });
    Object.assign(m.shape, {
      bodyWidth: 17,
      legWidth: 4,
      headRadius: 6,
      hornWidth: 2,
    });
    m.joints.hornBase.position = [-4, 25, 9];
    m.joints.hornTip.position = [-7, 28, 16];
    m.joints.smallHornBase.position = [4, 25, 9];
    m.joints.smallHornTip.position = [7, 28, 16];
    m.joints.tailTip.position = [2, -23, 15];
    return m;
  }
  return legacyInsectMotion(kind);
}
export function legacyInsectMotion(kind='beetle') {
  const m = {
    version: 1,
    type: kind==='spider'?'spider':'beetle',
    name: kind==='spider'?'Spider':'Beetle',
    palette: {
      body: "#4f7f75",
      shade: "#243f40",
      light: "#9fbb83",
      face: "#364c49",
      eye: "#e8cf78",
    },
    shape: { bodyWidth: 12, headRadius: 5, legWidth: 2 },
    joints: {
      pelvis: { parent: "", position: [0, -4, 8] },
      chest: { parent: "pelvis", position: [0, 5, 9] },
      head: { parent: "chest", position: [0, 12, 8] },
    },
    visibility: {},
    clips: {},
  };
  for (const side of ["L", "R"]) {
    const sign = side === "L" ? -1 : 1;
    for (let i = 0; i < (kind==='spider'?4:3); i++) {
      const root = "leg" + i + side,
        knee = "knee" + i + side,
        foot = "foot" + i + side;
      m.joints[root] = { parent: "pelvis", position: [sign * 7, 6 - i * 7, 7] };
      m.joints[knee] = { parent: root, position: [sign * 13, 8 - i * 8, 4] };
      m.joints[foot] = { parent: knee, position: [sign * 17, 10 - i * 9, 1] };
    }
    m.joints["antenna" + side] = {
      parent: "head",
      position: [sign * 7, 23, 13],
    };
    m.joints["jaw" + side] = { parent: "head", position: [sign * 4, 19, 6] };
  }
  if(kind==='spider'){
    Object.assign(m.palette,{body:'#655073',shade:'#302e45',light:'#b09ebd',face:'#51415e',eye:'#ee8268'});
    m.shape.bodyWidth=10;
    for(const side of ['L','R']){delete m.joints['antenna'+side];m.joints['jaw'+side].position=[side==='L'?-3:3,18,4];}
  }
  for (const n of Object.keys(m.joints)) m.visibility[n] = Array(8).fill(true);
  for (const action of [
    "idle",
    "run",
    "walk",
    "windup",
    "charge",
    "recover",
    "hurt",
    "snared",
  ]) {
    m.clips[action] = {
      length: 8,
      fps: 12,
      loop: ["idle", "run", "walk", "charge"].includes(action),
      keys: Array.from({ length: 8 }, (_, frame) => {
        const joints = {};
        for (const [n, j] of Object.entries(m.joints)) {
          let v = [0, 0, 0],
            a = (frame * Math.PI) / 4;
          if (
            /^(foot|knee)/.test(n) &&
            ["run", "walk", "charge"].includes(action)
          ) {
            const phase =
              a +
              (Number(n.match(/\d/)[0]) + (n.endsWith("L") ? 0 : 1)) * Math.PI;
            v = [0, Math.sin(phase) * 4, Math.max(0, Math.cos(phase)) * 3];
          }
          if (n.startsWith("antenna")) v = [Math.sin(a) * 2, 0, Math.cos(a)];
          if (action === "windup") v[2] = -frame * 0.3;
          if (action === "hurt") v[0] = Math.sin(a) * 2;
          joints[n] = v;
        }
        return { frame, joints };
      }),
    };
  }
  return m;
}
export const beastMotions = Object.fromEntries(
  BEAST_KINDS.map((k) => [k, defaultBeastMotion(k)]),
);
export const beastMotionRevisions=Object.fromEntries(BEAST_KINDS.map(kind=>[kind,0]));
export function validateBeastMotion(kind, m) {
  if(kind==='spider'&&m?.artGeneration!==2){
    if(!validateMotion(m,legacyInsectMotion('spider')))return false;
    m=upgradeSpiderMotion(m,legacyInsectMotion('spider'));
  }
  if(kind==='beetle'&&m?.artGeneration!==2){
    if(!validateMotion(m,legacyInsectMotion('beetle'))||!Object.keys(legacyInsectMotion('beetle').visibility).every(n=>m.visibility?.[n]?.length===8&&m.visibility[n].every(v=>typeof v==='boolean')))return false;
    m=upgradeBeetleMotion(m,legacyInsectMotion('beetle'));
  }
  if(['panther','white_lion','snow_leopard'].includes(kind))m=withCompanionClips(structuredClone(m));
  return (
    m?.type === kind &&
    (!m.boneSprites || Object.values(m.boneSprites).every(views=>views && Object.entries(views).every(([d,s])=>Number.isInteger(Number(d)) && Number(d)>=0 && Number(d)<8 && validateSprite(s) && Number.isFinite(s.x) && Number.isFinite(s.y)))) &&
    validateMotion(m, defaultBeastMotion(kind)) &&
    Object.keys(defaultBeastMotion(kind).visibility).every(
      (n) =>
        m.visibility?.[n]?.length === 8 &&
        m.visibility[n].every((v) => typeof v === "boolean"),
    )
  );
}
export function replaceBeastMotion(kind, m) {
  if (!validateBeastMotion(kind, m)) throw Error("Invalid " + kind + " rig");
  Object.assign(beastMotions[kind], kind==='spider'?upgradeSpiderMotion(m,legacyInsectMotion('spider')):kind==='beetle'?upgradeBeetleMotion(m,legacyInsectMotion('beetle')):['panther','white_lion','snow_leopard'].includes(kind)?withCompanionClips(structuredClone(m)):structuredClone(m));
  beastMotionRevisions[kind]++;
}
export function drawBeast(
  c,
  a,
  time,
  m = beastMotions[a.sprite || a.kind],
  suppliedPose = null,
) {
  if(m.type==='beetle')return drawBeetle(c,a,time,m,suppliedPose);
  if(m.type==='spider'||m.type==='tarantula')return drawSpider(c,a,time,m,suppliedPose);
  if (['panther','white_lion','snow_leopard'].includes(m.type)) {
    const p=drawLion(c,a,time,m,suppliedPose);
    if(m.type==='snow_leopard'){c.fillStyle='#496073';for(let i=0;i<7;i++){const t=i/7;c.fillRect(Math.round(p.pelvis.x*(1-t)+p.chest.x*t)+(i%2?2:-2),Math.round(p.pelvis.y*(1-t)+p.chest.y*t)-2,2,2);}}
    return p;
  }
  if (m.type === "boar") return drawRhino(c, a, time, m, suppliedPose);
  const action =
    a.animationAction ||
    (a.flash > 0
      ? "hurt"
      : ["windup", "charge", "recover", "snared"].includes(a.state)
        ? a.state
        : a.moving
          ? "run"
          : "idle");
  const clip = m.clips[action] || m.clips.idle,
    frame = Number.isFinite(a.playerFrame)
      ? a.playerFrame
      : Number.isFinite(a.poseTime)
        ? a.poseTime * (clip.length - 1)
        : a.moving
          ? ((a.step || 0) / 13) * 8
          : time * clip.fps;
  const pose = suppliedPose || poseAt(m, action, frame),
    d = facingIndex(a.faceX, a.faceY),
    p = Object.fromEntries(
      Object.entries(pose).map(([n, v]) => [n, projectPoint(v, d)]),
    ),
    pal = m.palette,
    s = m.shape;
  const visible = (n) => m.visibility[n]?.[d] !== false;
  const layers = [];
  for (const side of ["L", "R"])
    for (let i = 0; i < (m.type==='spider'?4:3); i++) {
      const r = "leg" + i + side,
        k = "knee" + i + side,
        f = "foot" + i + side;
      if (visible(f)) {
        layers.push({id:f, depth:layers.length, fn:()=>{
        limb(c, p[r], p[k], s.legWidth, pal.shade);
        limb(c, p[k], p[f], s.legWidth, pal.light);
        }});
      }
    }
  layers.push({id:'Body',depth:layers.length,fn:()=>{
  limb(c, p.pelvis, p.chest, s.bodyWidth * 2, pal.shade);
  limb(
    c,
    { ...p.pelvis, x: p.pelvis.x - 1 },
    { ...p.chest, x: p.chest.x - 1 },
    s.bodyWidth * 1.75,
    pal.body,
  );
  limb(c, p.pelvis, p.chest, 1, pal.light);
  }});
  layers.push({id:'Head',depth:layers.length,fn:()=>{
  ellipse(c, p.head.x, p.head.y, s.headRadius, s.headRadius * 0.8, pal.face);
  for (const side of ["L", "R"]) {
    if (p['antenna'+side]&&visible("antenna" + side))
      limb(c, p.head, p["antenna" + side], 1, pal.light);
    if (visible("jaw" + side)) limb(c, p.head, p["jaw" + side], 2, pal.shade);
  }
  c.fillStyle = pal.eye;
  c.fillRect(Math.round(p.head.x) - 3, Math.round(p.head.y) - 1, 1, 1);
  c.fillRect(Math.round(p.head.x) + 2, Math.round(p.head.y) - 1, 1, 1);
  if(m.type==='spider'){c.fillRect(Math.round(p.head.x)-1,Math.round(p.head.y)-2,2,1);c.fillRect(Math.round(p.head.x)-4,Math.round(p.head.y)+1,1,1);c.fillRect(Math.round(p.head.x)+3,Math.round(p.head.y)+1,1,1);}
  }});
  paintLayers(layers,m,d,c,p);
  return p;
}
