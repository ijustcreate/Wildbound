import { paintLayers } from "./render-order.mjs";
import { defaultLionMotion } from "./lion-motion.mjs";
import {
  poseAt,
  projectPoint,
  facingIndex,
  ellipse,
  limb,
  validateMotion,
} from "./player-motion.mjs";
export function defaultRhinoMotion() {
  const m = defaultLionMotion();
  delete m.clips.sit;
  m.type = "rhino";
  m.name = "Rhino";
  m.palette = {
    body: "#87908c",
    shade: "#576663",
    light: "#aab3a5",
    face: "#919b91",
    horn: "#ded7b4",
    eye: "#252e2d",
  };
  m.shape = {
    bodyWidth: 19,
    headRadius: 7,
    legWidth: 6,
    tailWidth: 2,
    hornWidth: 4,
  };
  const oldHead = [...m.joints.head.position];
  m.joints.head.position = [0, 22, 12];
  for (const [name, j] of Object.entries(m.joints)) {
    if (j.parent === "head")
      j.position = j.position.map(
        (v, i) => v + m.joints.head.position[i] - oldHead[i],
      );
    if (/^(shoulder|elbow|frontPaw|hip|knee|hock|rearPaw)/.test(name))
      j.position[0] *= 1.4;
  }
  m.joints.neck.position = [0, 13, 14];
  m.joints.tailBase.position = [0, -15, 14];
  m.joints.tailMid.position = [0, -20, 10];
  m.joints.tailTip.position = [0, -23, 7];
  for (const [name, position] of Object.entries({
    hornBase: [0, 28, 14],
    hornTip: [0, 32, 23],
    smallHornBase: [0, 24, 15],
    smallHornTip: [0, 26, 20],
  })) {
    m.joints[name] = {
      parent: name.endsWith("Tip") ? name.replace("Tip", "Base") : "head",
      position,
    };
    m.visibility[name] = Array(8).fill(true);
    for (const clip of Object.values(m.clips))
      for (const key of clip.keys)
        key.joints[name] = [...(key.joints.head || [0, 0, 0])];
  }
  delete m.clips.bite;
  m.clips.charge = structuredClone(m.clips.run);
  m.clips.charge.fps = 16;
  delete m.clips.pounce;
  m.clips.snared = structuredClone(m.clips.idle);
  for (const clip of Object.values(m.clips))
    for (const key of clip.keys)
      for (const [name, v] of Object.entries(key.joints)) {
        v[2] *= 0.5;
        if (name.startsWith("tail")) v[0] *= 0.25;
      }
  return m;
}
export const rhinoMotion = defaultRhinoMotion();
export let rhinoMotionRevision = 0;
export function invalidateRhinoFrames() {
  rhinoMotionRevision++;
}
export function validateRhinoMotion(m) {
  return (
    m?.type === "rhino" &&
    validateMotion(m, defaultRhinoMotion()) &&
    Object.keys(defaultRhinoMotion().visibility).every(
      (n) =>
        Array.isArray(m.visibility?.[n]) &&
        m.visibility[n].length === 8 &&
        m.visibility[n].every((b) => typeof b === "boolean"),
    )
  );
}
export function replaceRhinoMotion(m) {
  if (!validateRhinoMotion(m))
    throw Error("Invalid rhino rig or animation. Nothing imported.");
  Object.assign(rhinoMotion, structuredClone(m));
  invalidateRhinoFrames();
}
export function rhinoAction(a) {
  if (a.animationAction) return a.animationAction;
  if (a.flash > 0 || a.hit > 0) return "hurt";
  if (a.state === "snared") return "snared";
  if (a.state === "windup") return "windup";
  if (a.state === "stampede" || a.state === "charge") return "charge";
  if (a.state === "recover") return "recover";
  return a.moving ? "run" : "idle";
}
export function rhinoFrame(a, time, model = rhinoMotion) {
  const action = rhinoAction(a),
    clip = model.clips[action] || model.clips.idle;
  if (Number.isFinite(a.playerFrame)) return a.playerFrame;
  if (Number.isFinite(a.poseTime)) return a.poseTime * (clip.length - 1);
  if (["run", "walk", "charge"].includes(action))
    return a.step === undefined
      ? time * clip.fps
      : (a.step / (0.13 * 105)) * clip.length;
  if (["windup", "recover"].includes(action))
    return (
      Math.max(
        0,
        Math.min(1, 1 - (a.timer || 0) / (a.motionDuration || 0.65)),
      ) *
      (clip.length - 1)
    );
  if (action === "hurt")
    return Math.max(0, 1 - (a.flash || a.hit || 0) / 0.2) * (clip.length - 1);
  return time * clip.fps;
}
export function drawRhino(
  c,
  a,
  time,
  model = rhinoMotion,
  suppliedPose = null,
) {
  const d = facingIndex(a.faceX, a.faceY),
    pose =
      suppliedPose || poseAt(model, rhinoAction(a), rhinoFrame(a, time, model));
  const p = Object.fromEntries(
      Object.entries(pose).map(([n, v]) => [n, projectPoint(v, d)]),
    ),
    s = model.shape,
    pal = model.palette;
  const q = [],
    add = (depth, fn, id, bone, bones) => q.push({ depth, fn, id, bone, bones }),
    visible = (n) => model.visibility[n]?.[d] !== false;
  for (const [start, end] of [
    ["tailBase", "tailMid"],
    ["tailMid", "tailTip"],
  ])
    add(
      (p[start].depth + p[end].depth) / 2,
      () => limb(c, p[start], p[end], s.tailWidth, pal.shade),
      end === "tailTip" ? "Tail tip" : "Tail base",
      start,
      [start, end],
    );
  for (const side of ["L", "R"])
    for (const names of [
      ["shoulder" + side, "elbow" + side, "frontPaw" + side],
      ["hip" + side, "knee" + side, "hock" + side, "rearPaw" + side],
    ]) {
      const depth = names.reduce((v, n) => v + p[n].depth, 0) / names.length;
      add(depth, () => {
        for (let i = 1; i < names.length; i++)
          limb(
            c,
            p[names[i - 1]],
            p[names[i]],
            s.legWidth,
            depth < p.pelvis.depth ? pal.shade : pal.body,
          );
        const foot = p[names.at(-1)];
        c.fillStyle = pal.shade;
        c.fillRect(
          Math.round(foot.x - s.legWidth / 2),
          Math.round(foot.y - 2),
          s.legWidth,
          4,
        );
        c.fillStyle = pal.light;
        for (let x = -2; x <= 2; x += 2)
          c.fillRect(Math.round(foot.x + x), Math.round(foot.y), 1, 2);
      }, (names[0].startsWith("shoulder") ? "Front leg " : "Rear leg ") + side, names[0], names);
    }
  add((p.chest.depth + p.pelvis.depth) / 2, () => {
    limb(c, p.pelvis, p.chest, s.bodyWidth, pal.shade);
    limb(
      c,
      { x: p.pelvis.x - 1, y: p.pelvis.y - 2 },
      { x: p.chest.x - 1, y: p.chest.y - 2 },
      s.bodyWidth - 2,
      pal.body,
    );
    ellipse(
      c,
      p.chest.x,
      p.chest.y - 1,
      s.bodyWidth * 0.48,
      s.bodyWidth * 0.5,
      pal.body,
    );
    limb(c, p.chest, p.neck, s.bodyWidth * 0.72, pal.shade);
  });
  add(p.head.depth, () => {
    limb(c, p.neck, p.head, s.headRadius * 1.7, pal.body);
    ellipse(c, p.head.x, p.head.y, s.headRadius, s.headRadius * 0.8, pal.body);
    for (const n of ["earL", "earR"])
      if (visible(n)) {
        const e = p[n];
        ellipse(c, e.x, e.y, 2.5, 3.5, pal.shade);
        ellipse(c, e.x, e.y - 1, 1, 2, pal.light);
      }
    if (visible("face")) limb(c, p.head, p.face, s.headRadius * 1.3, pal.face);
    if (visible("muzzle")) ellipse(c, p.muzzle.x, p.muzzle.y, 4.5, 3, pal.face);
    if (visible("nose")) ellipse(c, p.nose.x, p.nose.y, 1.5, 1, pal.shade);
    for (const n of ["eyeL", "eyeR"])
      if (visible(n)) {
        c.fillStyle = pal.eye;
        c.fillRect(Math.round(p[n].x), Math.round(p[n].y), 1, 1);
      }
  });
  for (const prefix of ["smallHorn", "horn"]) {
    const base = p[prefix + "Base"],
      tip = p[prefix + "Tip"];
    if (visible(prefix + "Base") && visible(prefix + "Tip"))
      add((base.depth + tip.depth) / 2, () => {
        const width = s.hornWidth * (prefix === "horn" ? 1 : 0.65);
        for (let i = 0; i < 9; i++) {
          const t = i / 8;
          ellipse(
            c,
            base.x + (tip.x - base.x) * t,
            base.y + (tip.y - base.y) * t,
            Math.max(0.5, width * (1 - t)),
            Math.max(0.5, width * (1 - t)),
            pal.horn,
          );
        }
      });
  }
  paintLayers(q, model, d, c, p);
  return p;
}
