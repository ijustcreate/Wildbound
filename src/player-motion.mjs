import {humanoidClips} from './humanoid-clips.mjs';
import { wearableDetails, directionalHelmet } from "./wearable-art.mjs";
import { paintLayers } from "./render-order.mjs";
import { jointAngle, validAngles } from "./joint-angles.mjs";
import { ITEMS, itemKind } from "./items.mjs";
import { drawItem, drawItemPart } from "./item-art.mjs";
import { shade, drawHair } from "./appearance.mjs";
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
      head: "#dbc96c",
      headShade: "#ad9850",
      body: "#8059a8",
      bodyShade: "#584080",
      arms: "#2ca65d",
      armShade: "#167340",
      legs: "#b84686",
      legShade: "#803867",
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
export function wandLocalTip(visual) {
  if(Number.isFinite(visual?.tipX)&&Number.isFinite(visual?.tipY))return {x:visual.tipX,y:visual.tipY};
  const first=visual?.pixels?.findIndex(Boolean);
  if(first>=0){const row=Math.floor(first/16),xs=[];for(let x=0;x<16;x++)if(visual.pixels[row*16+x])xs.push(x);return {x:xs.reduce((a,b)=>a+b,0)/xs.length-7.5,y:row-7.5};}
  return {x:2,y:-10};
}
export function wandTipWorld(actor,slot,time,model=playerMotion,size=43){
  const d=facingIndex(actor.faceX,actor.faceY),side=slot==='hand1'?'R':'L',joint='hand'+side;
  const pose=poseAt(model,playerAction(actor),playerFrame(actor,time,model));
  const v=[...pose[joint]];if(actor.appearance?.build==='broad')v[0]*=1.12;else if(actor.appearance?.build&&actor.appearance.build!=='standard')v[0]*=.9;
  const hand=projectPoint(v,d),visual=model.wearables?.[actor.equipment?.[slot]]?.[d],tip=wandLocalTip(visual);
  const angle=(visual?.rotation||0)*Math.PI/180,scale=visual?.scale||1;
  let x=(tip.x*Math.cos(angle)-tip.y*Math.sin(angle))*scale+(visual?.x||0),y=(tip.x*Math.sin(angle)+tip.y*Math.cos(angle))*scale+(visual?.y||0);
  const rotation=jointAngle(model,playerAction(actor),playerFrame(actor,time,model),d,joint,actor.angleRestOnly)*Math.PI/180;
  const rx=x*Math.cos(rotation)-y*Math.sin(rotation),ry=x*Math.sin(rotation)+y*Math.cos(rotation);
  return {x:actor.x+(hand.x+rx)*size/48,y:actor.y-(actor.jumpHeight||0)+(hand.y+ry)*size/48};
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
  return positions;
}
export function playerAction(actor) {
  if (actor.animationAction)
    return actor.animationAction === "walk"
      ? "run"
      : actor.animationAction === "attack"
        ? "punch"
        : actor.animationAction;
  if(actor.hp<=0)return 'death';
  if (actor.hit > 0) return "hurt";
  if(actor.jumpHeight>0)return actor.jumpAge<.1?'jump_takeoff':actor.jumpVelocity>0?'jump_air':'jump_fall';
  if(actor.landTime>0)return 'land';
  if(actor.getUpTime>0)return 'get_up';
  if(actor.reviveAnimation>0)return 'revive';
  if(actor.interactAnimation>0)return 'interact';
  if (actor.dashTime > 0) return "dash";
  if (actor.blocking) return "block";
  if (
    itemKind(actor.equipment?.hand1) === "bow" &&
    (actor.charge > 0 || actor.attack > 0)
  )
    return "draw";
  if(actor.attack>0&&actor.attackClip)return actor.attackClip;
  if (actor.attack > 0)
    return actor.equipment?.hand1 || ITEMS[actor.equipment?.hand2]?.damage
      ? "slash"
      : "punch";
  if (actor.charge > 0) return "punch";
  if(actor.swimming&&actor.moving)return "swim";
  return actor.moving ? actor.walking?"walk":"run" : "idle";
}
export function playerFrame(actor, time, model = playerMotion) {
  const action = playerAction(actor),
    clip = model.clips[action] || model.clips.idle;
  if (Number.isFinite(actor.playerFrame)) return actor.playerFrame;
  if (actor.poseTime !== undefined) return actor.poseTime * (clip.length - 1);
  if (action === "run" || action === "walk")
    // Core accumulates 0.13 radians per world pixel. Keep footsteps tied to
    // distance, with an 88px stride (about 1.5 cycles/sec at normal speed).
    return actor.step === undefined
      ? time * clip.fps
      : (actor.step / (0.13 * 88)) * clip.length;
  if (action === "draw")
    return Math.min(clip.length - 1, (actor.charge || 1) * 7);
  if(action==='death')return Math.min(1,(actor.deathTime??.5)/.5)*(clip.length-1);
  if(action==='get_up')return (1-(actor.getUpTime||0)/.4)*(clip.length-1);
  if(action==='land')return (1-(actor.landTime||0)/.22)*(clip.length-1);
  if(actor.attack>0&&actor.attackClip===action)return Math.max(0,1-actor.attack/(actor.attackDuration||.34))*(clip.length-1);
  if (actor.charge > 0) return 0;
  if (["punch", "slash"].includes(action))
    return (1 - (actor.attack || 0) / 0.34) * (clip.length - 1);
  if (action === "hurt")
    return Math.max(0, (0.2 - (actor.hit || 0)) / 0.2) * (clip.length - 1);
  return time * clip.fps;
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
export function drawPlayer(
  c,
  actor,
  time,
  model = playerMotion,
  suppliedPose = null,
) {
  const d = facingIndex(actor.faceX, actor.faceY),
    positions = suppliedPose
      ? { ...suppliedPose }
      : poseAt(model, playerAction(actor), playerFrame(actor, time, model));
  if (actor.appearance?.build && actor.appearance.build !== "standard")
    for (const [key, v] of Object.entries(positions))
      positions[key] = [
        v[0] * (actor.appearance.build === "broad" ? 1.12 : 0.9),
        v[1],
        v[2],
      ];
  const p = Object.fromEntries(
    Object.entries(positions).map(([n, v]) => [n, projectPoint(v, d)]),
  );
  const pal = { ...model.palette },
    gear = { ...actor.equipment },
    back = d >= 3 && d <= 5;
  const rotateJoint = (joint,anchor,paint) => {
    const angle=jointAngle(model,playerAction(actor),playerFrame(actor,time,model),d,joint,actor.angleRestOnly);
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
  const look = actor.appearance;
  if (look)
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
  const add = (depth, fn, id) => queue.push({ depth, fn, id });
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
  if (gear.cape) {
    const top = positions.chest,
      bottom = positions.pelvis;
    const left = projectPoint([top[0] - 4, top[1] - 3, top[2]], d),
      right = projectPoint([top[0] + 4, top[1] - 3, top[2]], d);
    const sway =
      Math.sin(time * (actor.moving ? 7 : 3) + d * 0.35) *
      (actor.dashTime > 0 ? 4 : actor.moving ? 2 : 0.4);
    const a = projectPoint([bottom[0] - 6 + sway, bottom[1] - 4, 3], d),
      b = projectPoint([bottom[0] + 6 + sway, bottom[1] - 4, 3], d);
    add(
      p.chest.depth + (back ? 2 : -2),
      () => {
        wear("cape", p.chest, () => {
          for (let n = 0; n <= 14; n++) {
            const t = n / 14;
            limb(
              c,
              {
                x: left.x + (a.x - left.x) * t,
                y: left.y + (a.y - left.y) * t,
              },
              {
                x: right.x + (b.x - right.x) * t,
                y: right.y + (b.y - right.y) * t,
              },
              2,
              cosmetics.dye || ITEMS[gear.cape]?.artColor || "#985bad",
            );
          }
          limb(c, a, b, 1, "#dcbbe5");
          if (back)
            limb(
              c,
              { x: (left.x + right.x) / 2, y: (left.y + right.y) / 2 },
              { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
              1,
              "#71517d",
            );
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
          shade = gear.pants ? "#566d7b" : pal.legShade;
        wear("pants", hip, () => {
          limb(c, hip, knee, model.skeleton ? 2 : 4, shade);
          limb(c, knee, foot, model.skeleton ? 2 : 3.5, color);
        });
        const toe = projectPoint(
          [
            positions["foot" + side][0],
            positions["foot" + side][1] + 2,
            positions["foot" + side][2] - 0.5,
          ],
          d,
        );
        rotateJoint('foot'+side,foot,()=>{
        limb(
          c,
          foot,
          toe,
          3.5,
          gear.feet
            ? ITEMS[gear.feet]?.artColor || "#596443"
            : look?.shoes || color,
        );
        if (gear.feet)
          wear("feet", toe, () =>
            drawItemPart(
              c,
              gear.feet,
              side,
              toe.x,
              toe.y,
              8,
              12,
              cosmetics.dye,
            ),
          );
        });
      },
      "Leg " + side,
    );
    add(
      (shoulder.depth + hand.depth) / 2 + 0.1,
      () => {
        limb(
          c,
          shoulder,
          elbow,
          model.skeleton ? 2 : 3.5,
          gear.chest ? ITEMS[gear.chest]?.artColor || "#6c8580" : pal.armShade,
        );
        limb(
          c,
          elbow,
          hand,
          model.skeleton ? 2 : 3,
          gear.gloves ? ITEMS[gear.gloves]?.artColor || "#b4c992" : pal.arms,
        );
        ellipse(
          c,
          hand.x,
          hand.y,
          1.6,
          1.5,
          gear.gloves
            ? ITEMS[gear.gloves]?.artColor || "#d1ddb0"
            : pal.headShade,
        );
        if (gear.gloves)
          wear("gloves", hand, () =>
            drawItemPart(
              c,
              gear.gloves,
              side,
              hand.x,
              hand.y,
              8,
              10,
              cosmetics.dye,
            ),
          );
        if (gear.shoulders)
          wear("shoulders", shoulder, () =>
            drawItemPart(
              c,
              gear.shoulders,
              side,
              shoulder.x,
              shoulder.y + 1,
              10,
              9,
              cosmetics.dye,
            ),
          );
        const weaponId = gear[side === "R" ? "hand1" : "hand2"],
          weapon = itemKind(weaponId),
          weaponColor = ITEMS[weaponId]?.artColor;
        rotateJoint('hand'+side,hand,()=>wear(side === "R" ? "hand1" : "hand2", hand, () => {
          if (weapon === "sword" || weapon === "dagger") {
            const attack =
              actor.attack > 0 || actor.animationAction === "slash";
            const tip = {
              x: hand.x + (attack ? (d > 3 ? 8 : -8) : 2),
              y: hand.y - (weapon === "sword" ? 14 : 8),
            };
            limb(
              c,
              hand,
              tip,
              ITEMS[weaponId]?.style === "broad" ? 3 : 2,
              weaponColor || "#e1dfbd",
            );
            limb(
              c,
              { x: hand.x - 3, y: hand.y - 2 },
              { x: hand.x + 3, y: hand.y - 2 },
              1.5,
              "#b28d54",
            );
          }
          if (weapon === "wand") {
            const localTip=wandLocalTip();
            const tip = { x: hand.x + localTip.x, y: hand.y + localTip.y };
            limb(c, hand, tip, 2, "#755a89");
            ellipse(c, tip.x, tip.y, 2.5, 2.5, weaponColor || "#90baff");
            ellipse(c, tip.x, tip.y, 1, 1, "#f2ebff");
          }
          if (weapon === "shield") {
            ellipse(c, hand.x, hand.y, 5, 6, "#c6a46b");
            ellipse(
              c,
              hand.x,
              hand.y,
              3.5,
              4.5,
              actor.blocking ? "#d5e5bb" : weaponColor || "#53796b",
            );
          }
        }));
      },
      "Arm " + side,
    );
  }
  add(
    p.chest.depth,
    () => {
      const color = gear.chest
          ? ITEMS[gear.chest]?.artColor || "#93a3a2"
          : pal.body,
        shade = gear.chest ? "#53696b" : pal.bodyShade;
      wear("chest", p.chest, () => {
        limb(c, p.pelvis, p.chest, 7, shade);
        limb(
          c,
          { x: p.pelvis.x - 1, y: p.pelvis.y },
          { x: p.chest.x - 1, y: p.chest.y },
          5,
          color,
        );
        wearableDetails(c, p, {chest:gear.chest}, null, d, time, cosmetics);
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
          const pantsShade = gear.pants ? "#566d7b" : pal.legShade;
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
        });
      }
      wearableDetails(c, p, {pants:gear.pants}, null, d, time, cosmetics);
      if (itemKind(gear.neck) === "charm")
        wear("neck", p.chest, () => {
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
            ellipse(c, gem.x, gem.y, 2.6, 3.3, "#9c5724");
            ellipse(c, gem.x, gem.y, 1.9, 2.6, "#ffb43e");
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
      for (const name of ["earL", "earR"])
        if (visible(name))
          ellipse(c, p[name].x, p[name].y, 1.2, 1.8, pal.headShade);
      ellipse(c, h.x, h.y, side ? 3.5 : 4.2, 5, pal.headShade);
      ellipse(c, h.x - 0.6, h.y - 1, side ? 2.8 : 3.6, 4, pal.head);
      for (const name of ["eyeL", "eyeR"])
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
      if (visible("nose")) {
        c.fillStyle = model.skeleton ? pal.outline : pal.headShade;
        c.fillRect(
          Math.round(p.nose.x),
          Math.round(p.nose.y),
          1,
          model.skeleton ? 1 : 2,
        );
      }
      if (visible("mouth")) {
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
          drawHair(c, h, look, d);
          c.restore();
        } else drawHair(c, h, look, d);
      });
      // Hair is cosmetic and sits beneath head equipment.
      if (gear.head)
        wear("head", h, () => {
          if (!directionalHelmet(c, gear.head, h, d, cosmetics))
            drawItem(c, gear.head, h.x, h.y - 2, 14, cosmetics.dye);
        });
    },
    "Head and headwear",
  );
  if (itemKind(gear.hand1) === "bow")
    add(
      (p.handL.depth + p.handR.depth) / 2 + 0.2,
      () => {
        rotateJoint('handL',p.handL,()=>wear("hand1", p.handL, () => {
          const hand = p.handL;
          const top = { x: hand.x + 1, y: hand.y - 8 },
            mid = { x: hand.x + 5, y: hand.y },
            bottom = { x: hand.x + 1, y: hand.y + 8 };
          limb(c, top, mid, 1.5, ITEMS[gear.hand1]?.artColor || "#d4ac69");
          limb(c, mid, bottom, 1.5, ITEMS[gear.hand1]?.artColor || "#d4ac69");
          limb(c, top, p.handR, 0.7, "#dfd8b4");
          limb(c, p.handR, bottom, 0.7, "#dfd8b4");
          if (actor.charge > 0)
            limb(c, p.handR, { x: hand.x + 12, y: hand.y }, 1, "#dfc693");
        }));
      },
      "Bow",
    );
  paintLayers(queue, model, d);
  wearableDetails(c, p, {}, look, d, time, cosmetics);
  if (!cosmetics.hideRelics && !model.skeleton)
    (actor.inventory || [])
      .filter((i) => ITEMS[i?.type]?.relic)
      .slice(0, 2)
      .forEach((item, i) => {
        c.fillStyle = ITEMS[item.type].color || "#d4b866";
        c.fillRect(
          Math.round(p.pelvis.x - 5 + i * 8),
          Math.round(p.pelvis.y + 2),
          3,
          4,
        );
      });
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
