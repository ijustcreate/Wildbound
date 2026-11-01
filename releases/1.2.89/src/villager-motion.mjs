import captain from "./oathless-captain-data.mjs";
import {
  poseAt,
  projectPoint,
  facingIndex,
  limb,
  ellipse,
  validateMotion,
} from "./player-motion.mjs";
import { drawOrientedPixelVolume as volume } from "./murk-wolf-pixels.mjs";
import { paintLayers } from "./render-order.mjs";
import {drawNativeHair,drawFacialHair} from './hair-design.mjs';
import { validateSprite } from "./pixels.mjs";
import { jointAngle } from "./joint-angles.mjs";
import { VILLAGERS, villagerById } from "./villager-data.mjs";
import { ITEMS } from "./items.mjs";
import { drawItem } from "./item-art.mjs";
import {gearPalette,fittedGear,fittedShield,withBootPose} from './gear-art.mjs';
import {wearableDetails,directionalHelmet} from './wearable-art.mjs';
import {capeRows} from './cape-motion.mjs';
const add = (a, b) => a.map((v, i) => v + b[i]),
  sub = (a, b) => a.map((v, i) => v - b[i]),
  mul = (a, s) => a.map((v) => v * s),
  len = (a) => Math.hypot(...a),
  unit = (a) => mul(a, 1 / (len(a) || 1));
const cross = (a, b) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const basis = (r, u) => {
  u = unit(u);
  const f = unit(cross(u, unit(r)));
  return [unit(cross(f, u)), f, u];
};
const local = (o, b, v) =>
  o.map((x, i) => x + v.reduce((n, k, j) => n + k * b[j][i], 0));
const facial = new Set([
  "eyeL",
  "eyeR",
  "earL",
  "earR",
  "nose",
  "mouth",
  "hair",
  "headUp",
  "headFront",
]);
const factor = (n) =>
  facial.has(n)
    ? 1.12
    : n.startsWith("sword") || n.startsWith("shield")
      ? 0.9
      : n === "spine" || n === "chest"
        ? 1.35
        : n === "head"
          ? 2
          : n === "neck"
            ? 0.88
            : 0.83;
// Retarget each source segment along its own parent chain. Preserve directions
// and timing instead of scaling one assembled image or replacing the captain.
function retarget(pose) {
  const result = {};
  const visit = (n) => {
    if (result[n]) return result[n];
    const parent = captain.joints[n].parent;
    if (!parent) return (result[n] = mul(pose[n], 0.83));
    return (result[n] = add(
      visit(parent),
      mul(sub(pose[n], pose[parent]), factor(n)),
    ));
  };
  for (const n of Object.keys(pose)) visit(n);
  // The enlarged face is an ellipsoid. Keep feature anchors on its front
  // surface so diagonal eye whites cannot float beyond the cheek silhouette.
  const front=basis(sub(pose.earR,pose.earL),sub(pose.headUp,pose.head))[1];
  for(const n of ['eyeL','eyeR','nose','mouth']){const offset=sub(result[n],result.head),distance=offset.reduce((v,x,i)=>v+x*front[i],0);result[n]=sub(result[n],mul(front,distance*.32));}
  const axis = unit(sub(pose.shoulderR, pose.shoulderL));
  for (const s of ["L", "R"])
    for (const n of ["hip", "knee", "foot", "toe"])
      result[n + s] = add(result[n + s], mul(axis, s === "L" ? -1.1 : 1.1));
  return result;
}
const delta = (m, pose) =>
  Object.fromEntries(
    Object.entries(pose).map(([n, p]) => [
      n,
      sub(p, m.joints[n].position).map((x) => +x.toFixed(4)),
    ]),
  );
function arm(p, m, s, target) {
  const shoulder = p["shoulder" + s],
    old = p["hand" + s],
    upper = len(
      sub(m.joints["elbow" + s].position, m.joints["shoulder" + s].position),
    ),
    lower = len(
      sub(m.joints["hand" + s].position, m.joints["elbow" + s].position),
    ),
    direction = unit(sub(target, shoulder)),
    distance = Math.min(
      upper + lower - 0.02,
      Math.max(Math.abs(upper - lower) + 0.02, len(sub(target, shoulder))),
    ),
    along =
      (upper * upper - lower * lower + distance * distance) / (2 * distance),
    height = Math.sqrt(Math.max(0, upper * upper - along * along));
  const bend = unit(cross(direction, [0, 1, 0]));
  p["elbow" + s] = add(
    add(shoulder, mul(direction, along)),
    mul(bend, height * (s === "L" ? -1 : 1)),
  );
  p["hand" + s] = add(shoulder, mul(direction, distance));
  for (const n of s === "R"
    ? ["swordGrip", "swordTip"]
    : ["shieldGrip", "shieldTop"])
    p[n] = add(p[n], sub(p["hand" + s], old));
}
export function defaultVillagerMotion() {
  const m = structuredClone(captain),
    rest = retarget(
      Object.fromEntries(
        Object.entries(captain.joints).map(([n, j]) => [n, j.position]),
      ),
    );
  m.type = "villager";
  m.name = "Villager / captain proportions";
  m.provenance = {
    ...m.provenance,
    derivedFrom: "oathless_captain",
    retarget:
      "Parent-relative 0.83 limbs, 1.35 short captain spine, 0.88 neck, 2.0 short head segment, 1.12 facial handles; 1.1 lateral hip spread",
    nativeGestures: ["wave", "cheer", "shrug", "sword_ready", "jump_slash"],
  };
  for (const [n, j] of Object.entries(m.joints)) j.position = rest[n];
  for (const c of Object.values(m.clips))
    for (const k of c.keys) {
      const absolute = Object.fromEntries(
        Object.entries(captain.joints).map(([n, j]) => [
          n,
          add(j.position, k.joints[n] || [0, 0, 0]),
        ]),
      );
      k.joints = delta(m, retarget(absolute));
    }
  m.shape = {
    headWidth: 6.1,
    headDepth: 4.7,
    headHeight: 6.4,
    bodyWidth: 4.3,
    armWidth: 2.8,
    legWidth: 3.2,
  };
  m.palette = {
    ...m.palette,
    hair: "#a3412c",
    hairShade: "#6b3029",
    hairLight: "#d16b45",
    blue: "#388361",
    blueShade: "#24553d",
    blueLight: "#70aa7b",
    skin: "#efc099",
    eyes: "#60a8c9",
    pants: "#244955",
    boots: "#754936",
  };
  // A quarter-turn hides the far eye behind the rounded cheek and hair.
  m.visibility.eyeL[1]=false;
  m.visibility.eyeR[7]=false;
  for (const v of VILLAGERS.filter((v) => v.id !== "april"))
    for (const [field, color] of Object.entries({
      Hair: v.hairColor,
      Shirt: v.shirt,
      Pants: v.pants,
      Skin: v.skin,
      Eyes: v.eyes,
      ...(v.jacket ? { Jacket: v.jacket } : {}),
    }))
      m.palette[v.id + field] = color;
  for (const name of ["wave", "cheer", "shrug"]) {
    const keys = [];
    for (let f = 0; f < 25; f++) {
      const p = poseAt(m, "idle", 0),
        blend = Math.sin((Math.PI * f) / 24),
        head = p.head;
      for (const s of name === "wave" ? ["L"] : ["L", "R"]) {
        const hand = p["hand" + s],
          sgn = s === "L" ? -1 : 1,
          t =
            name === "shrug"
              ? add(p["shoulder" + s], [sgn * 4, 3, -2])
              : add(head, [
                  sgn * (name === "wave" ? 6 : 8),
                  1,
                  5 + Math.sin(f * 0.7) * 0.8,
                ]);
        arm(p, m, s, add(hand, mul(sub(t, hand), blend)));
      }
      keys.push({ frame: f, joints: delta(m, p) });
    }
    m.clips[name] = { fps: 18, length: 25, loop: false, keys };
  }
  {
    const keys=[];
    for(let f=0;f<13;f++){
      const p=poseAt(m,"idle",0),t=Math.sin(Math.PI*f/12);
      for(const joint of ["pelvis","spine","chest","neck","head"])p[joint][2]-=t*2.2;
      for(const side of ["L","R"]){p["hip"+side][2]-=t*.7;p["knee"+side][2]-=t*.9;}
      arm(p,m,"R",add(p.handR,[0,t*2.2,-t*5]));
      keys.push({frame:f,joints:delta(m,p)});
    }
    m.clips.pickup={fps:24,length:13,loop:false,keys};
  }
  const seated=poseAt(m,"idle",0);
  // A real seated silhouette: drop the hips, bring the thighs forward, bend
  // the shins down, and rest both hands on the knees instead of merely
  // lowering the entire standing rig by a couple of pixels.
  for(const joint of ["pelvis","spine","chest","neck","head","headUp","headFront","eyeL","eyeR","earL","earR","nose","mouth","hair","tabard","tabardEnd"] )seated[joint][2]-=6.5;
  for(const side of ["L","R"]){seated["hip"+side][2]-=6.5;seated["knee"+side][1]+=5;seated["knee"+side][2]+=3.2;seated["foot"+side][1]+=6;seated["toe"+side][1]+=6;seated["foot"+side][2]-=.2;seated["toe"+side][2]-=.2;}
  arm(seated,m,"L",add(seated.kneeL,[0,.25,1.5]));arm(seated,m,"R",add(seated.kneeR,[0,.25,1.5]));
  const relaxed=structuredClone(seated);
  for(const side of ["L","R"]){relaxed["hand"+side][1]+=.22;relaxed["elbow"+side][1]+=.12;}
  relaxed.head[0]+=.28;relaxed.chest[2]+=.18;
  m.clips.sit={fps:2,length:2,loop:true,keys:[{frame:0,joints:delta(m,seated)},{frame:1,joints:delta(m,relaxed)}]};  m.clips.sword_ready = structuredClone(m.clips.guard);
  m.clips.jump_slash = structuredClone(m.clips.slash);
  for (const k of m.clips.jump_slash.keys) {
    const lift =
      Math.sin((Math.PI * k.frame) / (m.clips.jump_slash.length - 1)) * 8;
    for (const v of Object.values(k.joints)) v[2] += lift;
  }
  delete m.boneSprites;
  delete m.renderOrder;
  delete m.wearables;
  return m;
}
const template = defaultVillagerMotion();
export const villagerMotion = structuredClone(template);
export const validateVillagerMotion = (m) =>
  m?.type === "villager" &&
  validateMotion(m, template) &&
  (!m.boneSprites ||
    Object.values(m.boneSprites).every((v) =>
      Object.entries(v).every(
        ([d, s]) =>
          +d >= 0 &&
          +d < 8 &&
          validateSprite(s) &&
          Number.isFinite(s.x) &&
          Number.isFinite(s.y),
      ),
    ));
export function replaceVillagerMotion(m) {
  if (!validateVillagerMotion(m)) throw Error("Invalid villager motion");
  const copy = structuredClone(m);
  for (const k of Object.keys(villagerMotion)) delete villagerMotion[k];
  Object.assign(villagerMotion, copy);
}
export const villagerAction = (a) =>
  (a.pickupTime>0?"pickup":a.animationAction) || (a.swimming ? (a.moving ? "swim" : "swim_idle") : a.sitting ? "sit" : a.moving ? (a.walking ? "walk" : "run") : "idle");
export function drawVillager(c, a, t, m = villagerMotion, suppliedPose = null) {
  const original = villagerById(a.villagerId || "april"),
    spec =
      original.id === "april"
        ? {
            ...original,
            hairColor: m.palette.hair,
            shirt: m.palette.blue,
            pants: m.palette.pants,
            skin: m.palette.skin,
            eyes: m.palette.eyes,
          }
        : {
            ...original,
            hairColor: m.palette[original.id + "Hair"] || original.hairColor,
            shirt: m.palette[original.id + "Shirt"] || original.shirt,
            pants: m.palette[original.id + "Pants"] || original.pants,
            skin: m.palette[original.id + "Skin"] || original.skin,
            eyes: m.palette[original.id + "Eyes"] || original.eyes,
            jacket: m.palette[original.id + "Jacket"] || original.jacket,
          },
    d = facingIndex(a.faceX, a.faceY),
    action = villagerAction(a),
    clip = m.clips[action] || m.clips.idle,
    frame = Number.isFinite(a.playerFrame)
      ? a.playerFrame
      : Number.isFinite(a.poseTime)
        ? a.poseTime * (clip.length - 1)
        : action==='pickup' ? Math.max(0,1-a.pickupTime/.42)*(clip.length-1)
        : (a.gestureAge ?? a.villagerClock ?? t) * clip.fps,
    pose = suppliedPose || poseAt(m, action, frame),
    p = Object.fromEntries(
      Object.entries(pose).map(([n, v]) => [n, projectPoint(v, d)]),
    ),
    q = [];
  const shade = (hex, f) =>
    "#" +
    hex
      .slice(1)
      .match(/../g)
      .map((x) =>
        Math.max(0, Math.min(255, Math.round(parseInt(x, 16) * f)))
          .toString(16)
          .padStart(2, "0"),
      )
      .join("");
  const material=id=>{const g=gearPalette(id,a.field?.cosmetics?.dye);return{body:g.base,shade:g.dark,light:g.light,outline:g.ink};};
  const palette = (color) => ({
      body: color,
      shade: shade(color, 0.72),
      light: shade(color, 1.2),
      outline: m.palette.outline,
    }),
    skin = palette(spec.skin),
    shirt = a.equipment?.chest ? material(a.equipment.chest) : palette(spec.shirt),
    pants = a.equipment?.pants ? material(a.equipment.pants) : palette(spec.pants),
    hair = palette(spec.hairColor),
    boots = palette(spec.id === "april" ? m.palette.boots || "#754936" : "#754936"),
    head = basis(sub(pose.earR, pose.earL), sub(pose.headUp, pose.head)),
    torso = basis(
      sub(pose.shoulderR, pose.shoulderL),
      sub(pose.chest, pose.pelvis),
    );
  const hairLook={hair:spec.id==='april'?'long':({quiff:'sidepart',tuft:'spikes',sidebun:'topknot',beanie:'bob'}[spec.hair]||spec.hair||'crop'),hairColor:spec.hairColor,...a.appearance};
  const part = (bone, id, bones, paint, depth = p[bone].depth) => {
    if (m.visibility?.[bone]?.[d] !== false)
      q.push({
        bone,
        id,
        bones,
        depth,
        fn: () => {
          const angle = jointAngle(m, action, frame, d, bone) || 0;
          c.save();
          if (angle) {
            c.translate(p[bone].x, p[bone].y);
            c.rotate((angle * Math.PI) / 180);
            c.translate(-p[bone].x, -p[bone].y);
          }
          paint();
          c.restore();
        },
      });
  };
  const segment = (a, b, w, pal) => {
    limb(c, a, b, w + 1, pal.outline);
    limb(c, a, b, w, pal.body);
    limb(
      c,
      { x: a.x - 0.4, y: a.y - 0.4 },
      { x: b.x - 0.4, y: b.y - 0.4 },
      Math.max(1, w * 0.3),
      pal.light,
    );
  };
  const block = (o, b, size, pal) => volume(c, o, b, size, d, pal),
    hblock = (offset, size, pal) =>
      block(local(pose.head, head, offset), head, size, pal);
  if (spec.id === "april") {
    skin.shade = shade(spec.skin, 0.83);
    skin.outline = shade(spec.skin, 0.65);
  }
  for (const s of ["L", "R"]) {
    part(
      "hip" + s,
      "Villager trousers " + s,
      ["hip" + s, "knee" + s],
      () => segment(p["hip" + s], p["knee" + s], m.shape.legWidth, pants),
      (p["hip" + s].depth + p["knee" + s].depth) / 2,
    );
    part(
      "knee" + s,
      "Villager boot " + s,
      ["knee" + s, "foot" + s, "toe" + s],
      () => {
        segment(
          p["knee" + s],
          p["foot" + s],
          m.shape.legWidth,
          spec.boots ? boots : spec.id === "poppy" ? skin : pants,
        );
        segment(
          p["foot" + s],
          p["toe" + s],
          4,
          spec.boots
            ? boots
            : palette(spec.id === "bram" ? "#4d97b7" : "#e0d6bc"),
        );
        if (spec.boots)
          block(
            add(pose["knee" + s], [0, 0, -0.6]),
            torso,
            spec.id === "april" ? [2.8, 2.3, 1.2] : [2, 2, 1],
            palette("#d7d3bf"),
          );
      },
      (p["knee" + s].depth + p["foot" + s].depth) / 2,
    );
    part(
      "shoulder" + s,
      "Villager sleeve " + s,
      ["shoulder" + s, "elbow" + s],
      () =>
        segment(
          p["shoulder" + s],
          p["elbow" + s],
          m.shape.armWidth,
          spec.id === "april"
            ? skin
            : spec.jacket
              ? palette(spec.jacket)
              : shirt,
        ),
      (p["shoulder" + s].depth + p["elbow" + s].depth) / 2,
    );
    part(
      "elbow" + s,
      "Villager hand " + s,
      ["elbow" + s, "hand" + s],
      () => {
        segment(p["elbow" + s], p["hand" + s], m.shape.armWidth, skin);
        ellipse(c, p["hand" + s].x, p["hand" + s].y, 1.6, 1.9, spec.skin);
      },
      (p["elbow" + s].depth + p["hand" + s].depth) / 2,
    );
  }
  part("chest", "Villager shirt", ["chest", "spine", "pelvis"], () => {
    const top = mul(add(pose.shoulderL, pose.shoulderR), 0.5);
    block(
      mul(add(pose.pelvis, top), 0.5),
      torso,
      [m.shape.bodyWidth, 2.4, len(sub(top, pose.pelvis)) * 0.6],
      shirt,
    );
    block(pose.pelvis, torso, [3.7, 2.5, 1.5], pants);
    if (spec.id === "april") {
      // A broad folded scarf and a small asymmetric tail, fitted to the chest.
      block(local(top, torso, [0, 1.8, -0.9]), torso, [4.2, 1.2, 1.4], shirt);
      block(local(top, torso, [-1.6, 2.5, -3]), torso, [1.5, 0.8, 2.4], shirt);
      block(local(top, torso, [0.6, 2.4, -1.5]), torso, [1, 0.6, 1], skin);
      block(local(pose.pelvis, torso, [0, 1.4, 0.8]), torso, [3.9, 1.2, 0.65], palette("#b69b72"));
    }
    if (spec.jacket)
      for (const x of [-3.4, 3.4])
        block(
          local(pose.chest, torso, [x, 0, -1.5]),
          torso,
          [1.1, 2.6, 4.1],
          palette(spec.jacket),
        );
    if (spec.id === "bram") {
      const v = projectPoint(local(pose.chest, torso, [0, 2.6, -1.8]), d);
      if ([0, 1, 7].includes(d)) {
        c.fillStyle = "#e8e4cd";
        c.fillRect(Math.round(v.x) - 2, Math.round(v.y) - 3, 1, 6);
        c.fillRect(Math.round(v.x) + 2, Math.round(v.y) - 3, 1, 6);
        c.fillRect(Math.round(v.x) - 1, Math.round(v.y) - 3, 3, 1);
        c.fillRect(Math.round(v.x) - 1, Math.round(v.y), 3, 1);
      }
    }
    if (spec.id === "theo")
      for (const z of [-1, -3, -5])
        block(
          local(pose.chest, torso, [0, 2.7, z]),
          torso,
          [0.45, 0.3, 0.45],
          palette("#edceb3"),
        );
  });
  part("neck", "Villager neck", ["neck"], () =>
    segment(p.neck, p.head, 3, skin),
  );
  part(
    "hair",
    "Villager rear hair",
    ["hair"],
    () => {
      return drawNativeHair(c,p.head,hairLook,d,frame,action,'rear',1.12);
    },
    projectPoint(local(pose.head, head, [0, -3, -2]), d).depth + 1,
  );
  part("head", "Villager face", ["head"], () =>
    block(
      pose.head,
      head,
      [m.shape.headWidth + (spec.id === "april" ? 0.8 : 0), m.shape.headDepth, m.shape.headHeight],
      skin,
    ),
  );
  for (const s of ["L", "R"])
    part(
      "ear" + s,
      "Villager ear " + s,
      ["ear" + s],
      () => block(pose["ear" + s], head, [1, 1.1, 1.4], skin),
      p["ear" + s].depth + 0.2,
    );
  part(
    "hair",
    "Villager crown",
    ["hair"],
    () => {
      return drawNativeHair(c,p.head,hairLook,d,frame,action,'front',1.12);
    },
    p.head.depth + 5,
  );
  for (const s of ["L", "R"])
    part(
      "eye" + s,
      "Villager eye " + s,
      ["eye" + s],
      () => {
        const e = p["eye" + s],
          x = Math.round(e.x) + (d === 2 ? 1 : d === 6 ? -1 : 0),
          y = Math.round(e.y);
        if (spec.id === "april") {
          // Separate tall eyes, blue irises and a single white glint.
          c.fillStyle = hair.shade;
          c.fillRect(x - 2, y - 2, 4, 1);
          c.fillStyle = "#fff5e5";
          c.fillRect(x - 2, y - 1, 4, 4);
          c.fillStyle = spec.eyes;
          c.fillRect(x, y - 1, 2, 4);
          c.fillStyle = "#273b50";
          c.fillRect(x + 1, y, 1, 2);
          c.fillStyle = "#fff5e5";
          c.fillRect(x, y - 1, 1, 1);
          c.fillStyle = "#db9276";
          c.fillRect(x - 2, y + 3, 3, 1);
          return;
        }
        c.fillStyle = m.palette.outline;
        c.fillRect(x - 2, y - 1, 4, 4);
        c.fillStyle = "#fff0dc";
        c.fillRect(x - 2, y, 4, 3);
        c.fillStyle = spec.eyes;
        c.fillRect(x, y, 2, 2);
        c.fillStyle = m.palette.outline;
        c.fillRect(x, y + 2, 2, 1);
        if (spec.glasses) {
          c.strokeStyle = "#284b59";
          c.lineWidth = 1;
          c.strokeRect(x - 3, y - 2, 6, 5);
        }
      },
      p.head.depth + 7,
    );
  part(
    "nose",
    "Villager nose",
    ["nose"],
    () => {
      c.fillStyle=skin.light;c.fillRect(Math.round(p.nose.x)-1,Math.round(p.nose.y)-1,1,2);
      c.fillStyle = skin.shade;
      c.fillRect(Math.round(p.nose.x), Math.round(p.nose.y)+1,2,1);
    },
    p.head.depth + 8,
  );
  part(
    "mouth",
    "Villager mouth",
    ["mouth"],
    () => {
      c.fillStyle = skin.shade;
      c.fillRect(Math.round(p.mouth.x) - 1, Math.round(p.mouth.y), 3, 1);
      drawFacialHair(c,p.head,{...hairLook,facialHair:a.appearance?.facialHair||(spec.beard?'shortbeard':'none')},d,1.12);
    },
    p.head.depth + 7,
  );
  const hand1 = Object.hasOwn(a.equipment || {}, "hand1")
    ? a.equipment.hand1
    : spec.sword
      ? "sword"
      : null;
  if (hand1 && !["wave", "cheer", "shrug", "talk"].includes(action))
    part(
      "swordGrip",
      "Villager weapon",
      ["swordGrip", "swordTip"],
      () => {
        const v = p.swordGrip,
          b = p.swordTip,
          n = Math.hypot(b.x - v.x, b.y - v.y) || 1,
          dx = (b.x - v.x) / n,
          dy = (b.y - v.y) / n,
          fit = m.wearables?.[hand1]?.[d] || ((ITEMS[hand1]?.base === "sword" || hand1 === "sword") ? m.wearables?.sword?.[d] : null);
        c.save();
        c.translate(v.x + (fit?.x || 0), v.y + (fit?.y || 0));
        c.rotate(((fit?.rotation || 0) * Math.PI) / 180);
        c.scale(fit?.scale || 1, fit?.scale || 1);
        if (fit?.pixels?.some(Boolean)) {
          fit.pixels.forEach((color, i) => {
            if (color) {
              c.fillStyle = color;
              c.fillRect((i % 16) - 8, Math.floor(i / 16) - 8, 1, 1);
            }
          });
        } else if (ITEMS[hand1]?.base === "sword" || hand1 === "sword") {
          segment(
            { x: 0, y: 0 },
            { x: b.x - v.x, y: b.y - v.y },
            spec.id === "april" ? 4 : 3,
            palette("#c6c5d3"),
          );
          limb(
            c,
            { x: -dy * 3, y: dx * 3 },
            { x: dy * 3, y: -dx * 3 },
            2,
            "#cda45b",
          );
          ellipse(c, -dx * 1.8, -dy * 1.8, 1.4, 1.4, "#754936");
        } else drawItem(c, hand1, 0, 0, 15);
        c.restore();
      },
      p.swordGrip.depth + 0.4,
    );
  // Fitted native gear shares the villager's posed anchors and depth queue.
  // Authored per-item wearable pixels continue to take precedence.
  const gear=a.equipment||{},cosmetics=a.field?.cosmetics||{},back=d>=3&&d<=5;
  const wear=(id,anchor,paint)=>{
    const fit=m.wearables?.[id]?.[d];
    if(!fit?.pixels?.some(Boolean))return paint();
    c.save();c.translate(anchor.x+(fit.x||0),anchor.y+(fit.y||0));c.rotate((fit.rotation||0)*Math.PI/180);c.scale(fit.scale||1,fit.scale||1);
    fit.pixels.forEach((color,i)=>{if(color){c.fillStyle=color;c.fillRect(i%16-8,Math.floor(i/16)-8,1,1);}});c.restore();
  };
  if(gear.cape)part('chest','Villager cape',['shoulderL','shoulderR','pelvis'],()=>wear(gear.cape,p.chest,()=>{
    const top=mul(add(pose.shoulderL,pose.shoulderR),.5),rows=capeRows(top,pose.pelvis,a,t,ITEMS[gear.cape]?.style,{left:pose.shoulderL,right:pose.shoulderR}),pal=gearPalette(gear.cape,cosmetics.dye);
    for(const row of rows)for(const seg of row.segments)limb(c,projectPoint(seg.left,d),projectPoint(seg.right,d),2,seg.hem?pal.trim:pal.base);
  }),p.chest.depth+(back?3:-5));
  for(const side of ['L','R']){
    for(const [slot,bone,depth]of [['shoulders','shoulder'+side,.5],['gloves','hand'+side,.6],['feet','foot'+side,.6]])if(gear[slot])part(bone,'Villager '+slot+' '+side,[bone],()=>wear(gear[slot],p[bone],()=>slot==='feet'?withBootPose(c,p[bone],p['knee'+side],()=>fittedGear(c,gear[slot],p[bone],d,side,cosmetics.dye)):fittedGear(c,gear[slot],p[bone],d,side,cosmetics.dye)),p[bone].depth+depth);
  }
  if(gear.chest||gear.pants)part('chest','Villager armor details',['chest','pelvis','kneeL','kneeR'],()=>wearableDetails(c,p,{chest:gear.chest,pants:gear.pants},{skin:spec.skin},d,t,cosmetics),p.chest.depth+.6);
  if(gear.head&&!cosmetics.hideHelmet)part('head','Villager headwear',['head'],()=>wear(gear.head,p.head,()=>directionalHelmet(c,gear.head,p.head,d,cosmetics)),p.head.depth+10);
  if(gear.hand2&&gear.hand2!=='occupied')part('handL','Villager offhand',['handL'],()=>wear(gear.hand2,p.handL,()=>ITEMS[gear.hand2]?.base==='shield'||gear.hand2==='shield'?fittedShield(c,gear.hand2,p.handL,d,a.blocking,cosmetics.dye):drawItem(c,gear.hand2,p.handL.x,p.handL.y,15)),p.handL.depth+.8);
  if(gear.neck&&!back)part('chest','Villager necklace',['chest'],()=>wear(gear.neck,p.chest,()=>{const pal=gearPalette(gear.neck,cosmetics.dye);limb(c,{x:p.chest.x-2,y:p.chest.y-2},{x:p.chest.x,y:p.chest.y+2},1,pal.trim);limb(c,{x:p.chest.x+2,y:p.chest.y-2},{x:p.chest.x,y:p.chest.y+2},1,pal.trim);c.fillStyle=pal.light;c.fillRect(Math.round(p.chest.x)-1,Math.round(p.chest.y)+2,2,2);}),p.chest.depth+.8);
  if(gear.back)part('chest','Villager back gear',['chest'],()=>wear(gear.back,p.chest,()=>drawItem(c,gear.back,p.chest.x+(d===2?4:d===6?-4:0),p.chest.y+5,14)),p.chest.depth+(back?4:-4));
  paintLayers(q, m, d, c, p);
  return p;
}
