import { defaultLionMotion, drawLion } from "./lion-motion.mjs";
import { paintLayers } from "./render-order.mjs";
import { defaultRhinoMotion, drawRhino } from "./rhino-motion.mjs";
import {
  poseAt,
  projectPoint,
  facingIndex,
  ellipse,
  limb,
  validateMotion,
} from "./player-motion.mjs";
export const BEAST_KINDS = ["panther", "boar", "beetle", "white_lion", "snow_leopard", "spider"];
export function defaultBeastMotion(kind) {
  if(kind==='white_lion'||kind==='snow_leopard'){
    const m=kind==='white_lion'?defaultLionMotion():defaultBeastMotion('panther');m.type=kind;m.name=kind==='white_lion'?'White lion':'Snow leopard';
    Object.assign(m.palette,{body:'#dce7e7',bodyShade:'#a0b7c4',head:'#edf0e6',headShade:'#adc3cd',mane:'#f5f3de',maneShade:'#b9cbd0',legs:'#d5e1e6',legShade:'#93acbc',tail:'#c4d4da',outline:'#294b60',muzzle:'#f8f4e6'});
    return m;
  }
  if (kind === "panther") {
    const m = defaultLionMotion();
    m.type = kind;
    m.name = "Panther";
    Object.assign(m.palette, {
      body: "#414650",
      bodyShade: "#252b36",
      head: "#555a65",
      headShade: "#303640",
      mane: "#414650",
      maneShade: "#272d39",
      legs: "#424953",
      legShade: "#252b36",
      tail: "#343b45",
      outline: "#dbca69",
      muzzle: "#72737a",
    });
    Object.assign(m.shape, {
      maneRadius: 5,
      headRadius: 4.5,
      bodyRadius: 6,
      legWidth: 3,
      tailWidth: 2,
      tuftSize: 0.7,
    });
    for (const n of ["earL", "earR"]) m.joints[n].position[2] -= 3;
    m.joints.tailTip.position = [4, -36, 17];
    for (const k of m.clips.pounce.keys)
      for (const v of Object.values(k.joints)) {
        v[1] *= 0.65;
        v[2] *= 0.65;
      }
    return m;
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
export function validateBeastMotion(kind, m) {
  return (
    m?.type === kind &&
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
  Object.assign(beastMotions[kind], structuredClone(m));
}
export function drawBeast(
  c,
  a,
  time,
  m = beastMotions[a.sprite || a.kind],
  suppliedPose = null,
) {
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
