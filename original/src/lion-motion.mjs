import { paintLayers } from "./render-order.mjs";
import { validateSprite } from "./pixels.mjs";
import {
  poseAt,
  projectPoint,
  facingIndex,
  ellipse,
  limb,
  validateMotion,
} from "./player-motion.mjs";

export const LION_JOINTS = {
  pelvis: ["", 0, -7, 12],
  chest: ["pelvis", 0, 6, 14],
  neck: ["chest", 0, 10, 16],
  head: ["neck", 0, 15, 17],
  earL: ["head", -4, 15, 23],
  earR: ["head", 4, 15, 23],
  face: ["head", 0, 18, 16.3],
  eyeL: ["head", -1.8, 19, 17.8],
  eyeR: ["head", 1.8, 19, 17.8],
  muzzle: ["head", 0, 20, 14.5],
  nose: ["head", 0, 21, 15.5],
  shoulderL: ["chest", -5, 6, 12],
  elbowL: ["shoulderL", -5, 8, 7],
  frontPawL: ["elbowL", -5, 9, 1],
  shoulderR: ["chest", 5, 6, 12],
  elbowR: ["shoulderR", 5, 8, 7],
  frontPawR: ["elbowR", 5, 9, 1],
  hipL: ["pelvis", -5, -9, 13],
  kneeL: ["hipL", -5, -5, 8],
  hockL: ["kneeL", -5, -11, 4],
  rearPawL: ["hockL", -5, -9, 1],
  hipR: ["pelvis", 5, -9, 13],
  kneeR: ["hipR", 5, -5, 8],
  hockR: ["kneeR", 5, -11, 4],
  rearPawR: ["hockR", 5, -9, 1],
  tailBase: ["pelvis", 0, -15, 16],
  tailMid: ["tailBase", 2, -23, 19],
  tailTip: ["tailMid", 3, -30, 21],
};
const zero = () =>
  Object.fromEntries(Object.keys(LION_JOINTS).map((n) => [n, [0, 0, 0]]));
function gait(frame, run) {
  const joints = zero(),
    a = (frame / 8) * Math.PI * 2,
    bob = Math.abs(Math.sin(a)) * (run ? 1.5 : 0.5);
  for (const name of [
    "pelvis",
    "chest",
    "neck",
    "head",
    "shoulderL",
    "shoulderR",
    "hipL",
    "hipR",
    "tailBase",
    "tailMid",
    "tailTip",
  ])
    joints[name][2] = bob;
  for (const [side, phase] of [
    ["L", 0],
    ["R", Math.PI],
  ]) {
    for (const [front, shift] of [
      [true, 0],
      [false, Math.PI],
    ]) {
      const s = Math.sin(a + phase + shift),
        lift = Math.max(0, -s),
        stride = run ? 6 : 3.5;
      if (front) {
        joints["elbow" + side] = [0, s * stride * 0.45, lift * 2];
        joints["frontPaw" + side] = [0, s * stride, lift * (run ? 5 : 2.5)];
      } else {
        joints["knee" + side] = [0, s * stride * 0.35, lift * 1.5];
        joints["hock" + side] = [0, s * stride * 0.7, lift * 3];
        joints["rearPaw" + side] = [0, s * stride, lift * (run ? 5 : 2.5)];
      }
    }
  }
  joints.tailMid[0] = Math.sin(a - 0.5) * 2;
  joints.tailTip[0] = Math.sin(a - 1) * 4;
  joints.chest[1] = Math.sin(a * 2) * 0.5;
  joints.head[2] += Math.sin(a * 2) * 0.5;
  return { frame, joints };
}
function crouch(frame, amount) {
  const joints = zero();
  for (const n of ["chest", "neck", "head", "shoulderL", "shoulderR"])
    joints[n] = [0, -amount * 0.35, -amount];
  for (const n of ["pelvis", "hipL", "hipR"]) joints[n] = [0, 0, -amount * 0.6];
  joints.elbowL = [-1, 1, -amount * 0.4];
  joints.elbowR = [1, 1, -amount * 0.4];
  joints.tailTip = [4, -1, 2];
  return { frame, joints };
}
export const LION_PARTS = [
  "earL",
  "earR",
  "face",
  "eyeL",
  "eyeR",
  "muzzle",
  "nose",
];
const defaultVisibility = () =>
  Object.fromEntries(
    LION_PARTS.map((name) => [
      name,
      Array.from(
        { length: 8 },
        (_, d) =>
          name.startsWith("ear") ||
          (!(d >= 3 && d <= 5) &&
            !(name === "eyeR" && d === 2) &&
            !(name === "eyeL" && d === 6)),
      ),
    ]),
  );
export function defaultLionMotion() {
  const bite = zero();
  bite.head = [0, 5, -2];
  bite.neck = [0, 2, -1];
  const flight = zero();
  for (const v of Object.values(flight)) v[2] = 4;
  for (const s of ["L", "R"]) {
    flight["frontPaw" + s] = [0, 9, 8];
    flight["elbow" + s] = [0, 4, 6];
    flight["rearPaw" + s] = [0, -7, 6];
    flight["hock" + s] = [0, -4, 5];
  }
  const model = {
    version: 1,
    type: "quadruped",
    name: "Lion",
    joints: Object.fromEntries(
      Object.entries(LION_JOINTS).map(([n, [parent, ...position]]) => [
        n,
        { parent, position },
      ]),
    ),
    palette: {
      head: "#efc86e",
      headShade: "#c58c3f",
      body: "#dca24d",
      bodyShade: "#b27c38",
      legs: "#e6b357",
      legShade: "#a76c35",
      mane: "#9c5437",
      maneShade: "#713c2d",
      tail: "#78412e",
      outline: "#3f302b",
    },
    shape: {
      bodyRadius: 6.5,
      maneRadius: 10,
      headRadius: 5,
      legWidth: 4,
      tailWidth: 2,
      tuftSize: 2.8,
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
              chest: [0, 0, 0.4],
              neck: [0, 0, 0.4],
              head: [0, 0, 0.4],
              tailMid: [-2, 0, 0],
              tailTip: [-5, 0, -1],
            },
          },
        ],
      },
      walk: {
        fps: 10,
        length: 8,
        loop: true,
        keys: Array.from({ length: 8 }, (_, i) => gait(i, false)),
      },
      run: {
        fps: 12,
        length: 8,
        loop: true,
        keys: Array.from({ length: 8 }, (_, i) => gait(i, true)),
      },
      windup: {
        fps: 10,
        length: 6,
        loop: false,
        keys: [crouch(0, 0), crouch(5, 5)],
      },
      pounce: {
        fps: 12,
        length: 6,
        loop: false,
        keys: [
          crouch(0, 4),
          { frame: 2, joints: flight },
          { frame: 4, joints: flight },
          crouch(5, 2),
        ],
      },
      bite: {
        fps: 16,
        length: 6,
        loop: false,
        keys: [
          { frame: 0, joints: zero() },
          { frame: 2, joints: bite },
          { frame: 3, joints: bite },
          { frame: 5, joints: zero() },
        ],
      },
      recover: {
        fps: 10,
        length: 6,
        loop: false,
        keys: [crouch(0, 3), crouch(5, 0)],
      },
      hurt: {
        fps: 12,
        length: 4,
        loop: false,
        keys: [
          {
            frame: 0,
            joints: {
              head: [0, -3, 1],
              neck: [0, -2, 0],
              chest: [0, -1, -2],
              tailTip: [3, 0, 2],
            },
          },
          { frame: 3, joints: zero() },
        ],
      },
    },
  };
  model.visibility = defaultVisibility();
  for (const clip of Object.values(model.clips))
    for (const key of clip.keys)
      for (const name of LION_PARTS)
        key.joints[name] = [...(key.joints.head || [0, 0, 0])];
  return model;
}
export const lionMotion = defaultLionMotion();
// Tiger uses the same quadruped rig topology, but owns an independent model.
export const tigerMotion = defaultLionMotion();
// Upgrade old lion packages without discarding their edited head or animation.
export function upgradeLionMotion(input) {
  const m = structuredClone(input);
  if (!m?.joints || !m.clips) return m;
  if (LION_PARTS.every((n) => !m.joints[n]) && m.joints.head?.position) {
    for (const n of LION_PARTS) {
      const [, ...rest] = LION_JOINTS[n];
      m.joints[n] = {
        parent: "head",
        position: rest.map(
          (v, i) => v + m.joints.head.position[i] - LION_JOINTS.head[i + 1],
        ),
      };
      for (const clip of Object.values(m.clips))
        for (const key of clip.keys || [])
          if (key.joints) key.joints[n] = [...(key.joints.head || [0, 0, 0])];
    }
  }
  m.visibility ??= defaultVisibility();
  const legacy = {'Layer 1':['Tail base'],'Layer 2':['Tail tip'],'Layer 3':['Front leg L'],'Layer 4':['Rear leg L'],'Layer 5':['Front leg R'],'Layer 6':['Rear leg R'],'Layer 7':['Body'],'Layer 8':['Mane','Face']};
  for(const [direction,order] of Object.entries(m.renderOrder||{})) m.renderOrder[direction]=order.flatMap(id=>legacy[id]||[id]);
  return m;
}
export const validateLionMotion = (m) =>
  m?.type === "quadruped" &&
  (!m.boneSprites || Object.values(m.boneSprites).every(views=>views && Object.entries(views).every(([d,s])=>Number.isInteger(Number(d)) && Number(d)>=0 && Number(d)<8 && validateSprite(s) && Number.isFinite(s.x) && Number.isFinite(s.y)))) &&
  validateMotion(upgradeLionMotion(m), defaultLionMotion()) &&
  LION_PARTS.every((n) => {
    const v = upgradeLionMotion(m).visibility[n];
    return (
      Array.isArray(v) &&
      v.length === 8 &&
      v.every((b) => typeof b === "boolean")
    );
  });
export let lionRevision=0;
export function replaceLionMotion(m) {
  if (!validateLionMotion(m))
    throw Error("Invalid lion rig or clips. Nothing imported.");
  Object.assign(lionMotion, upgradeLionMotion(m));
  lionRevision++;
}
export let tigerRevision = 0;
export function replaceTigerMotion(m) {
  if (!validateLionMotion(m))
    throw Error("Invalid tiger rig or clips. Nothing imported.");
  Object.assign(tigerMotion, upgradeLionMotion(m));
  tigerRevision++;
}
export function lionAction(actor) {
  if (actor.animationAction)
    return actor.animationAction === "attack" ? "bite" : actor.animationAction;
  if (actor.flash > 0 || actor.hit > 0) return "hurt";
  if(actor.jumpHeight>0)return "pounce";
  if (actor.state === "windup") return "windup";
  if (actor.state === "charge") return "pounce";
  if (actor.state === "recover") return "recover";
  if (actor.attack > 0) return "bite";
  return actor.moving ? "run" : "idle";
}
export function lionFrame(actor, time, model = lionMotion) {
  const action = lionAction(actor),
    clip = model.clips[action] || model.clips.idle;
  if (Number.isFinite(actor.playerFrame)) return actor.playerFrame;
  if(actor.jumpHeight>0)return Math.min(clip.length-1,(actor.jumpAge||0)/.7*(clip.length-1));
  if (Number.isFinite(actor.poseTime))
    return actor.poseTime * (clip.length - 1);
  if (action === "walk" || action === "run")
    return actor.step === undefined
      ? time * clip.fps
      : (actor.step / (0.13 * 100)) * clip.length;
  if (["windup", "pounce", "recover"].includes(action)) {
    const duration =
      actor.motionDuration ||
      { windup: 0.65, pounce: 0.48, recover: 0.65 }[action];
    return (
      Math.max(0, Math.min(1, 1 - (actor.timer || 0) / duration)) *
      (clip.length - 1)
    );
  }
  if (action === "bite")
    return Math.max(0, 1 - (actor.attack || 0) / 0.34) * (clip.length - 1);
  if (action === "hurt")
    return (
      Math.max(0, 1 - (actor.flash || actor.hit || 0) / 0.2) * (clip.length - 1)
    );
  return time * clip.fps;
}
export function drawLion(
  c,
  actor,
  time,
  model = lionMotion,
  suppliedPose = null,
) {
  const direction = facingIndex(actor.faceX, actor.faceY),
    pose =
      suppliedPose ||
      poseAt(model, lionAction(actor), lionFrame(actor, time, model));
  const p = Object.fromEntries(
      Object.entries(pose).map(([n, v]) => [n, projectPoint(v, direction)]),
    ),
    pal = actor.skin==="tiger"||actor.kind==="tiger" ? {...model.palette,body:"#db8737",bodyShade:"#925022",head:"#eda349",headShade:"#aa602d",legs:"#d48c43",legShade:"#97552e",tail:"#392b28",muzzle:"#eee1c2"} : model.palette,
    s = model.shape;
  const tiger=actor.skin==="tiger"||actor.kind==="tiger";
  const stripe=(a,b,width=1.5)=>limb(c,a,b,width,"#302b29");
  const queue = [],
    add = (depth, fn, id, bone, bones) => queue.push({ depth, fn, id, bone, bones });
  // The skeleton is projected into the facing; the artwork is never spun flat.
  for (const [start, end, width] of [
    ["tailBase", "tailMid", s.tailWidth],
    ["tailMid", "tailTip", s.tailWidth * 0.8],
  ])
    add((p[start].depth + p[end].depth) / 2, () => {
      limb(c, p[start], p[end], width, pal.body);
      if(tiger)for(let i=1;i<5;i++){const t=i/5,x=p[start].x+(p[end].x-p[start].x)*t,y=p[start].y+(p[end].y-p[start].y)*t;stripe({x:x-2,y},{x:x+2,y});}
      if (end === "tailTip" && !tiger)
        ellipse(c, p[end].x, p[end].y, s.tuftSize, s.tuftSize * 1.2, pal.tail);
    }, end === "tailTip" ? "Tail tip" : "Tail base", start, [start,end]);
  for (const side of ["L", "R"]) {
    for (const names of [
      ["shoulder" + side, "elbow" + side, "frontPaw" + side],
      ["hip" + side, "knee" + side, "hock" + side, "rearPaw" + side],
    ]) {
      const points = names.map((n) => p[n]),
        depth = points.reduce((a, q) => a + q.depth, 0) / points.length;
      add(depth, () => {
        const far = depth < p.pelvis.depth;
        for (let n = 0; n < points.length - 1; n++)
          limb(
            c,
            points[n],
            points[n + 1],
            s.legWidth * (n === 0 ? 1.1 : 0.85),
            far ? pal.legShade : pal.legs,
          );
        if(tiger)for(const point of points.slice(0,-1))stripe({x:point.x-2,y:point.y},{x:point.x+2,y:point.y+1});
        const foot = points.at(-1),
          raw = pose[names.at(-1)],
          toe = projectPoint([raw[0], raw[1] + 2, raw[2]], direction);
        limb(c, foot, toe, s.legWidth + 1, far ? pal.legShade : pal.head);
      }, (names[0].startsWith("shoulder") ? "Front leg " : "Rear leg ") + side, names[0], names);
    }
  }
  add((p.pelvis.depth + p.chest.depth) / 2, () => {
    limb(c, p.pelvis, p.chest, s.bodyRadius * 2, pal.bodyShade);
    limb(
      c,
      { x: p.pelvis.x - 0.8, y: p.pelvis.y - 1 },
      { x: p.chest.x - 0.8, y: p.chest.y - 1 },
      s.bodyRadius * 1.65,
      pal.body,
    );
    limb(c, p.chest, p.neck, s.bodyRadius * 1.5, pal.body);
    if(tiger)for(let i=1;i<6;i++){const t=i/6,x=p.pelvis.x+(p.chest.x-p.pelvis.x)*t,y=p.pelvis.y+(p.chest.y-p.pelvis.y)*t;stripe({x:x-4,y:y-2},{x:x+3,y:y+2},1.6); }
  }, "Body", "chest", ["pelvis","chest","neck"]);
  const headDepth = direction === 6 ? Math.max(p.head.depth, (p.pelvis.depth+p.chest.depth)/2 + 0.2) : p.head.depth;
  if(!tiger)add(headDepth, () => {
    const h = p.head,
      back = direction >= 3 && direction <= 5;
    ellipse(c, h.x, h.y, s.maneRadius, s.maneRadius * 1.05, pal.maneShade);
    ellipse(
      c,
      h.x - 0.5,
      h.y - 1,
      s.maneRadius - 0.6,
      s.maneRadius - 0.5,
      pal.mane,
    );
  }, "Mane", "head", ["head","neck"]);
  add(headDepth + 0.01, () => {
    const visible = (name) => model.visibility?.[name]?.[direction] !== false;
    for (const name of ["earL", "earR"])
      if (visible(name)) {
        const ear = p[name];
        ellipse(c, ear.x, ear.y, 2, 2, pal.headShade);
        ellipse(c, ear.x, ear.y, 1, 1, pal.maneShade);
      }
    const face = p.face;
    if (visible("face")) {
      ellipse(
        c,
        face.x,
        face.y,
        s.headRadius,
        s.headRadius * 1.05,
        pal.headShade,
      );
      ellipse(
        c,
        face.x - 0.5,
        face.y - 0.5,
        s.headRadius - 0.5,
        s.headRadius - 0.6,
        pal.head,
      );
    }
    if(tiger){stripe({x:face.x-3,y:face.y-3},{x:face.x+2,y:face.y-2});stripe({x:face.x-4,y:face.y},{x:face.x-2,y:face.y+2});stripe({x:face.x+4,y:face.y},{x:face.x+2,y:face.y+2});}
    const muzzle = p.muzzle;
    if (visible("muzzle"))
      ellipse(c, muzzle.x, muzzle.y, 2.8, 2.1, pal.muzzle || "#f7d997");
    for (const name of ["eyeL", "eyeR"])
      if (visible(name)) {
        c.fillStyle = pal.outline;
        c.fillRect(Math.round(p[name].x), Math.round(p[name].y), 1, 1);
      }
    const nose = p.nose;
    if (visible("nose")) {
      c.fillStyle = pal.outline;
      c.fillRect(Math.round(nose.x) - 1, Math.round(nose.y), 2, 1);
    }
    if (visible("muzzle")) {
      if (lionAction(actor) === "bite") {
        c.fillRect(Math.round(muzzle.x) - 1, Math.round(muzzle.y) + 1, 3, 2);
        c.fillStyle = "#fff0bf";
        c.fillRect(Math.round(muzzle.x) - 1, Math.round(muzzle.y) + 1, 1, 1);
      }
    }
  }, "Face", "head", ["head","face","earL","earR","eyeL","eyeR","nose","muzzle"]);
  paintLayers(queue, model, direction, c, p);
  return p;
}
