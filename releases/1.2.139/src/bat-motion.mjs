import {withCompanionClips} from './companion-motion.mjs';
import { paintLayers } from "./render-order.mjs";
import {
  poseAt,
  projectPoint,
  facingIndex,
  ellipse,
  limb,
  validateMotion,
} from "./player-motion.mjs";

export const BAT_JOINTS = {
  pelvis: ["", 0, -12, 25],
  chest: ["pelvis", 0, 2, 25],
  head: ["chest", 0, 8, 29],
  earL: ["head", -4, 7, 36],
  earR: ["head", 4, 7, 36],
  eyeL: ["head", -2.5, 12, 30],
  eyeR: ["head", 2.5, 12, 30],
  nose: ["head", 0, 14, 27],
  shoulderL: ["chest", -4, 2, 25],
  elbowL: ["shoulderL", -12, 5, 26],
  wristL: ["elbowL", -20, 6, 26],
  wingTipL: ["wristL", -31, 1, 24],
  fingerL: ["wristL", -22, -16, 26],
  innerFingerL: ["wristL", -12, -18, 26],
  shoulderR: ["chest", 4, 2, 25],
  elbowR: ["shoulderR", 12, 5, 26],
  wristR: ["elbowR", 20, 6, 26],
  wingTipR: ["wristR", 31, 1, 24],
  fingerR: ["wristR", 22, -16, 26],
  innerFingerR: ["wristR", 12, -18, 26],
  footL: ["pelvis", -3, -16, 24],
  footR: ["pelvis", 3, -16, 24],
};
const features = ["earL", "earR", "eyeL", "eyeR", "nose"];
function wingbeat(frame, amplitude = 1, folded = false) {
  const a = (frame * Math.PI) / 4,
    bob = Math.sin(a - 0.7) * 1.1;
  const joints = Object.fromEntries(
    Object.keys(BAT_JOINTS).map((n) => [n, [0, 0, bob]]),
  );
  for (const side of ["L", "R"])
    for (const name of ["elbow", "wrist", "wingTip", "finger", "innerFinger"]) {
      const n = name + side,
        x = BAT_JOINTS[n][1],
        spread = folded ? 0.36 : 1 - Math.abs(Math.sin(a)) * 0.43;
      joints[n] = [
        x * (spread - 1),
        folded ? -3 : 0,
        bob + Math.sin(a) * Math.abs(x) * 0.65 * amplitude,
      ];
    }
  return { frame, joints };
}
export function defaultBatMotion() {
  const loop = (fps, amp) => ({
    fps,
    length: 8,
    loop: true,
    keys: Array.from({ length: 8 }, (_, i) => wingbeat(i, amp)),
  });
  const windup = wingbeat(2),
    dive = wingbeat(4, 0, true),
    hurt = wingbeat(1);
  windup.frame = 3;
  dive.frame = 0;
  hurt.frame = 0;
  for (const v of Object.values(windup.joints)) v[2] += 4;
  for (const v of Object.values(dive.joints)) {
    v[2] -= 12;
    v[1] += 3;
  }
  hurt.joints.wingTipL[2] -= 8;
  return withCompanionClips({
    version: 1,
    type: "flying",
    name: "Bat",
    joints: Object.fromEntries(
      Object.entries(BAT_JOINTS).map(([n, [parent, ...position]]) => [
        n,
        { parent, position },
      ]),
    ),
    palette: {
      body: "#685078",
      bodyShade: "#44334f",
      head: "#80608d",
      wing: "#b85b8b",
      wingShade: "#793e6d",
      bone: "#ce83a1",
      eyes: "#f2d974",
      outline: "#292039",
      ears: "#ce729a",
    },
    shape: { bodyRadius: 5, headRadius: 5.8, earSize: 3, wingBoneWidth: 1.2 },
    visibility: Object.fromEntries(
      features.map((n) => [
        n,
        Array.from(
          { length: 8 },
          (_, d) =>
            n.startsWith("ear") ||
            (!(d >= 3 && d <= 5) &&
              !(n === "eyeR" && d === 2) &&
              !(n === "eyeL" && d === 6)),
        ),
      ]),
    ),
    clips: {
      idle: loop(8, 0.7),
      fly: loop(12, 1),
      windup: { fps: 10, length: 4, loop: false, keys: [wingbeat(0), windup] },
      dive: {
        fps: 12,
        length: 4,
        loop: false,
        keys: [dive, { frame: 3, joints: structuredClone(dive.joints) }],
      },
      recover: {
        fps: 10,
        length: 8,
        loop: false,
        keys: Array.from({ length: 8 }, (_, i) => wingbeat(i)),
      },
      hurt: {
        fps: 12,
        length: 4,
        loop: false,
        keys: [hurt, { ...wingbeat(0), frame: 3 }],
      },
      snared: {
        fps: 4,
        length: 8,
        loop: true,
        keys: Array.from({ length: 8 }, (_, i) => wingbeat(i, 0.15, true)),
      },
    },
  },true);
}
export const batMotion = defaultBatMotion();
export function validateBatMotion(m) {
  m=withCompanionClips(structuredClone(m),true);
  return (
    m?.type === "flying" &&
    validateMotion(m, defaultBatMotion()) &&
    features.every(
      (n) =>
        Array.isArray(m.visibility?.[n]) &&
        m.visibility[n].length === 8 &&
        m.visibility[n].every((v) => typeof v === "boolean"),
    )
  );
}
export function replaceBatMotion(m) {
  if (!validateBatMotion(m))
    throw Error("Invalid bat rig or animation clips. Nothing imported.");
  Object.assign(batMotion, withCompanionClips(structuredClone(m),true));
}
export function batAction(a) {
  if (a.animationAction)
    return ["run", "walk"].includes(a.animationAction)
      ? "fly"
      : a.animationAction;
  if (a.state === "snared") return "snared";
  if (a.flash > 0 || a.hit > 0) return "hurt";
  if (a.state === "windup") return "windup";
  if (a.state === "charge") return "dive";
  if (a.state === "recover") return "recover";
  return a.moving ? "fly" : "idle";
}
export function batFrame(a, time, model = batMotion) {
  const action = batAction(a),
    clip = model.clips[action] || model.clips.idle;
  if (Number.isFinite(a.playerFrame)) return a.playerFrame;
  if (Number.isFinite(a.poseTime)) return a.poseTime * (clip.length - 1);
  if (["windup", "dive", "recover"].includes(action))
    return (
      Math.max(
        0,
        Math.min(1, 1 - (a.timer || 0) / (a.motionDuration || 0.65)),
      ) *
      (clip.length - 1)
    );
  if (action === "hurt")
    return Math.max(0, 1 - (a.flash || a.hit || 0) / 0.2) * (clip.length - 1);
  // Wings keep beating while hovering; phase varies between flock members.
  return time * clip.fps + (a.id || 0) * 1.73;
}
function polygon(c, points, color) {
  c.fillStyle = color;
  const min = Math.floor(Math.min(...points.map((p) => p.y))),
    max = Math.ceil(Math.max(...points.map((p) => p.y)));
  for (let y = min; y <= max; y++) {
    const xs = [];
    for (let i = 0; i < points.length; i++) {
      const a = points[i],
        b = points[(i + 1) % points.length],
        py = y + 0.5;
      if ((a.y <= py && b.y > py) || (b.y <= py && a.y > py))
        xs.push(a.x + ((py - a.y) * (b.x - a.x)) / (b.y - a.y));
    }
    xs.sort((a, b) => a - b);
    for (let i = 0; i + 1 < xs.length; i += 2)
      c.fillRect(
        Math.ceil(xs[i]),
        y,
        Math.max(0, Math.ceil(xs[i + 1]) - Math.ceil(xs[i])),
        1,
      );
  }
}
export function drawBat(
  c,
  actor,
  time,
  model = batMotion,
  suppliedPose = null,
) {
  const direction = facingIndex(actor.faceX, actor.faceY),
    pose =
      suppliedPose ||
      poseAt(model, batAction(actor), batFrame(actor, time, model));
  const p = Object.fromEntries(
    Object.entries(pose).map(([n, v]) => [n, projectPoint(v, direction)]),
  );
  const pal = model.palette,
    s = model.shape,
    visible = (n) => model.visibility[n]?.[direction] !== false,
    queue = [];
  const add = (depth, draw, id, bone, bones) => queue.push({ depth, draw, id, bone, bones });
  for (const side of ["L", "R"]) {
    const shoulder = p["shoulder" + side],
      elbow = p["elbow" + side],
      wrist = p["wrist" + side],
      tip = p["wingTip" + side],
      finger = p["finger" + side],
      inner = p["innerFinger" + side];
    add((shoulder.depth + wrist.depth) / 2, () => {
      const far = wrist.depth < p.chest.depth;
      // Concave trailing edge reads as a bat membrane instead of feathered wings.
      const notch = (a, b) => ({
        x: (a.x + b.x) / 2 + (wrist.x - (a.x + b.x) / 2) * 0.28,
        y: (a.y + b.y) / 2 + (wrist.y - (a.y + b.y) / 2) * 0.28,
      });
      polygon(
        c,
        [
          shoulder,
          elbow,
          wrist,
          tip,
          notch(tip, finger),
          finger,
          notch(finger, inner),
          inner,
          notch(inner, p.pelvis),
          p.pelvis,
        ],
        far ? pal.wingShade : pal.wing,
      );
      for (const [a, b] of [
        [shoulder, elbow],
        [elbow, wrist],
        [wrist, tip],
        [wrist, finger],
        [wrist, inner],
      ])
        limb(c, a, b, s.wingBoneWidth, far ? pal.bodyShade : pal.bone);
    }, "Wing " + side, "shoulder" + side, ["shoulder" + side, "elbow" + side, "wrist" + side, "wingTip" + side]);
    add(
      p["foot" + side].depth,
      () => limb(c, p.pelvis, p["foot" + side], 2, pal.bone),
      "Foot " + side,
      "foot" + side,
      ["foot" + side, "pelvis"],
    );
  }
  add(
    p.chest.depth,
    () => limb(c, p.pelvis, p.chest, s.bodyRadius * 2, pal.body),
    "Body",
    "chest",
    ["pelvis", "chest"],
  );
  add(p.head.depth, () => {
    for (const n of ["earL", "earR"])
      if (visible(n)) {
        const e = p[n];
        polygon(
          c,
          [
            { x: e.x - s.earSize, y: e.y + 3 },
            { x: e.x, y: e.y - 5 },
            { x: e.x + s.earSize, y: e.y + 3 },
          ],
          pal.ears,
        );
        limb(
          c,
          { x: e.x, y: e.y + 2 },
          { x: e.x, y: e.y - 2 },
          1,
          pal.bodyShade,
        );
      }
    ellipse(c, p.head.x, p.head.y, s.headRadius, s.headRadius, pal.bodyShade);
    ellipse(
      c,
      p.head.x - 0.5,
      p.head.y - 0.5,
      s.headRadius - 0.6,
      s.headRadius - 0.6,
      pal.head,
    );
    for (const n of ["eyeL", "eyeR"])
      if (visible(n)) {
        ellipse(c, p[n].x, p[n].y, 1.3, 1.4, pal.eyes);
        c.fillStyle = pal.outline;
        c.fillRect(Math.round(p[n].x), Math.round(p[n].y), 1, 1);
      }
    if (visible("nose")) ellipse(c, p.nose.x, p.nose.y, 1.4, 1, pal.ears);
  }, "Head", "head", ["head", "neck"]);
  paintLayers(queue, model, direction, c, p);
  return p;
}
