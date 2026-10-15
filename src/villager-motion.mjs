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
import { validateSprite } from "./pixels.mjs";
import { jointAngle } from "./joint-angles.mjs";
import { VILLAGERS, villagerById } from "./villager-data.mjs";
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
  const seated=poseAt(m,"idle",0);
  for(const joint of ["pelvis","spine","chest","neck","head","headUp","headFront","eyeL","eyeR","earL","earR","nose","mouth","hair","tabard","tabardEnd"] )seated[joint][2]-=2.2;
  for(const side of ["L","R"]){seated["hip"+side][2]-=2.2;seated["knee"+side][1]+=1.5;seated["knee"+side][2]+=.8;seated["foot"+side][1]+=2.2;seated["toe"+side][1]+=2.2;seated["foot"+side][2]-=.2;seated["toe"+side][2]-=.2;}
  arm(seated,m,"L",add(seated.kneeL,[0,.2,1]));arm(seated,m,"R",add(seated.kneeR,[0,.2,1]));
  m.clips.sit={fps:1,length:2,loop:true,keys:[{frame:0,joints:delta(m,seated)}]};  m.clips.sword_ready = structuredClone(m.clips.guard);
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
  a.animationAction || (a.sitting ? "sit" : a.moving ? (a.walking ? "walk" : "run") : "idle");
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
  const palette = (color) => ({
      body: color,
      shade: shade(color, 0.72),
      light: shade(color, 1.2),
      outline: m.palette.outline,
    }),
    skin = palette(spec.skin),
    shirt = palette(spec.shirt),
    pants = palette(spec.pants),
    hair = palette(spec.hairColor),
    boots = palette(spec.id === "april" ? m.palette.boots || "#754936" : "#754936"),
    head = basis(sub(pose.earR, pose.earL), sub(pose.headUp, pose.head)),
    torso = basis(
      sub(pose.shoulderR, pose.shoulderL),
      sub(pose.chest, pose.pelvis),
    );
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
      if (spec.id === "april") {
        // Shoulder-length auburn locks have an actual back and side volume.
        hblock([0, -3.1, -1.8], [6.5, 2.8, 7.2], hair);
        hblock([-6, -1.6, -3.2], [2.8, 2.8, 5.8], hair);
        hblock([6.3, -1.8, -3.8], [3, 2.8, 6.2], hair);
        hblock([7.5, -2.7, -6.3], [2.6, 2.4, 2.6], hair);
      } else if (spec.hair === "long" || spec.hair === "beanie")
        for (const x of [-4.2, 0, 4.2])
          hblock(
            [x, -2.2, -2],
            [x ? 2 : 4.6, 2.4, spec.hair === "long" ? 6 : 4.2],
            hair,
          );
      else hblock([0, -2.6, 0], [5.7, 2.2, 4.8], hair);
      if (spec.hair === "sidebun") hblock([7, -2, 2.8], [3, 2.6, 3], hair);
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
      if (spec.id === "april") {
        hblock([0, -0.9, 5.1], [7.6, 4.9, 2.7], hair);
        hblock([-4.8, 2.4, 4], [3, 1.9, 2.3], hair);
        hblock([-0.9, 3.6, 5], [3.9, 1.8, 1.9], hair);
        hblock([4.9, 3.1, 5.5], [3, 1.7, 1.5], hair);
        hblock([-6.6, 0.4, -0.7], [1.5, 2.1, 3.8], hair);
        return;
      }
      hblock(
        [0, -0.6, 5],
        [6.6, 4.7, 2],
        spec.hair === "beanie" ? palette("#a63743") : hair,
      );
      for (const [x, z] of [
        [-4, 3.4],
        [-1.7, 4.4],
        [2.7, 3.5],
      ])
        hblock([x, 2.7, z], [2.2, 1.6, 1.8], hair);
      if (spec.hair === "quiff" || spec.hair === "tuft")
        hblock(
          [spec.hair === "quiff" ? 2 : 0, 0, 7.7],
          [spec.hair === "quiff" ? 1.3 : 4.8, 2.8, 2.4],
          hair,
        );
      if (spec.hair === "beanie")
        hblock([0, 0, 8.5], [1.8, 1.8, 2], palette("#a63743"));
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
          c.fillStyle = "#28618a";
          c.fillRect(x + 1, y, 1, 3);
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
      if (spec.id === "april") {
        const x = Math.round(p.mouth.x), y = Math.round(p.mouth.y) - 1;
        c.fillStyle = "#9c5247";
        c.fillRect(x - 1, y, 3, 2);
        c.fillStyle = "#fff0dc";
        c.fillRect(x - 1, y, 3, 1);
        return;
      }
      c.fillStyle = skin.shade;
      c.fillRect(Math.round(p.nose.x), Math.round(p.nose.y), 1, 2);
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
      if (spec.beard) hblock([0, 3.5, -4.6], [3.8, 1.5, 1.7], hair);
    },
    p.head.depth + 7,
  );
  const sword = Object.hasOwn(a.equipment || {}, "hand1")
    ? a.equipment.hand1
    : spec.sword
      ? "sword"
      : null;
  if (sword && !["wave", "cheer", "shrug", "talk"].includes(action))
    part(
      "swordGrip",
      "Villager sword",
      ["swordGrip", "swordTip"],
      () => {
        const v = p.swordGrip,
          b = p.swordTip,
          n = Math.hypot(b.x - v.x, b.y - v.y) || 1,
          dx = (b.x - v.x) / n,
          dy = (b.y - v.y) / n,
          fit = m.wearables?.sword?.[d];
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
        } else {
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
        }
        c.restore();
      },
      p.swordGrip.depth + 0.4,
    );
  paintLayers(q, m, d, c, p);
  return p;
}
