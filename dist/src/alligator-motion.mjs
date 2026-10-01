import { paintLayers } from "./render-order.mjs";
import { defaultLionMotion, lionFrame, lionAction } from "./lion-motion.mjs";
import {
  poseAt,
  projectPoint,
  facingIndex,
  ellipse,
  limb,
  validateMotion,
} from "./player-motion.mjs";
export function defaultAlligatorMotion() {
  const m = defaultLionMotion();
  delete m.clips.sit;
  m.type = "crocodile";
  m.name = "Alligator";
  m.palette = {
    body: "#658353",
    shade: "#364f3c",
    light: "#a8b576",
    mouth: "#e7dbc0",
    eyes: "#e6bb60",
  };
  m.shape = { bodyWidth: 13, headWidth: 5, legWidth: 4, tailWidth: 9 };
  for (const [name, j] of Object.entries(m.joints)) {
    j.position[2] *= 0.48;
    if (/^(shoulder|elbow|frontPaw|hip|knee|hock|rearPaw)/.test(name))
      j.position[0] *= 1.5;
  }
  const set = (n, p) => (m.joints[n].position = p);
  set("head", [0, 20, 6]);
  set("face", [0, 25, 6]);
  set("muzzle", [0, 31, 5]);
  set("nose", [0, 34, 6]);
  set("eyeL", [-3, 23, 9]);
  set("eyeR", [3, 23, 9]);
  set("tailBase", [0, -15, 7]);
  set("tailMid", [0, -29, 5]);
  set("tailTip", [0, -44, 2]);
  for (const name of ["face", "muzzle", "nose"]) m.visibility[name].fill(true);
  m.visibility.earL.fill(false);
  m.visibility.earR.fill(false);
  for (const clip of Object.values(m.clips))
    for (const key of clip.keys)
      for (const v of Object.values(key.joints)) v[2] *= 0.4;
  m.clips.lunge = m.clips.pounce;
  delete m.clips.pounce;
  return m;
}
export const alligatorMotion = defaultAlligatorMotion();
export const validateAlligatorMotion = (m) =>
  m?.type === "crocodile" &&
  validateMotion(m, defaultAlligatorMotion()) &&
  Object.keys(defaultAlligatorMotion().visibility).every(
    (n) =>
      Array.isArray(m.visibility?.[n]) &&
      m.visibility[n].length === 8 &&
      m.visibility[n].every((v) => typeof v === "boolean"),
  );
export function replaceAlligatorMotion(m) {
  if (!validateAlligatorMotion(m)) throw Error("Invalid alligator rig");
  Object.assign(alligatorMotion, structuredClone(m));
}
export function drawAlligator(
  c,
  a,
  time,
  m = alligatorMotion,
  suppliedPose = null,
) {
  const action =
    a.animationAction || (a.state === "charge" ? "lunge" : lionAction(a));
  const frame = Number.isFinite(a.playerFrame)
    ? a.playerFrame
    : action === "lunge"
      ? Math.max(0, 1 - (a.timer || 0) / (a.motionDuration || 0.48)) * 7
      : lionFrame({ ...a, animationAction: action }, time, m);
  const d = facingIndex(a.faceX, a.faceY),
    pose = suppliedPose || poseAt(m, action, frame),
    p = Object.fromEntries(
      Object.entries(pose).map(([n, v]) => [n, projectPoint(v, d)]),
    );
  const s = m.shape,
    pal = m.palette,
    q = [],
    add = (depth, fn, id, bone, bones) => q.push({ depth, fn, id, bone, bones }),
    visible = (n) => m.visibility[n]?.[d] !== false;
  for (const side of ["L", "R"])
    for (const chain of [
      ["shoulder", "elbow", "frontPaw"],
      ["hip", "knee", "hock", "rearPaw"],
    ]) {
      const names = chain.map((n) => n + side),
        x = names[0],
        z = names.at(-1);
      add((p[x].depth + p[z].depth) / 2, () => {
        for (let i = 1; i < names.length; i++)
          limb(
            c,
            p[names[i - 1]],
            p[names[i]],
            s.legWidth,
            i === 1 ? pal.shade : pal.body,
          );
        ellipse(c, p[z].x, p[z].y, 3, 1.5, pal.light);
      }, (chain[0] === "shoulder" ? "Front leg " : "Rear leg ") + side, x, names);
    }
  for (const [x, y, w] of [
    ["tailBase", "tailMid", s.tailWidth],
    ["tailMid", "tailTip", s.tailWidth * 0.5],
  ])
    add((p[x].depth + p[y].depth) / 2, () => {
      for (let i = 0; i < 12; i++) {
        const t = i / 11;
        ellipse(
          c,
          p[x].x + (p[y].x - p[x].x) * t,
          p[x].y + (p[y].y - p[x].y) * t,
          Math.max(0.5, (w * (1 - t * 0.7)) / 2),
          Math.max(0.5, (w * (1 - t * 0.7)) / 2),
          pal.body,
        );
      }
    }, y === "tailTip" ? "Tail tip" : "Tail base", x, [x, y]);
  add((p.pelvis.depth + p.chest.depth) / 2, () => {
    limb(c, p.pelvis, p.chest, s.bodyWidth, pal.body);
    for (let i = 0; i < 5; i++) {
      const t = i / 4;
      ellipse(
        c,
        p.pelvis.x + (p.chest.x - p.pelvis.x) * t,
        p.pelvis.y + (p.chest.y - p.pelvis.y) * t - 2,
        2,
        1,
        pal.light,
      );
    }
  }, "Body", "chest", ["pelvis", "chest"]);
  add(p.head.depth, () => {
    limb(c, p.chest, p.head, s.bodyWidth * 0.7, pal.shade);
    if (visible("face")) limb(c, p.head, p.face, s.headWidth * 2, pal.body);
    if (visible("muzzle")) {
      limb(c, p.face, p.muzzle, s.headWidth * 1.7, pal.body);
      limb(
        c,
        { x: p.face.x, y: p.face.y + 2 },
        { x: p.muzzle.x, y: p.muzzle.y + 2 },
        1,
        pal.mouth,
      );
    }
    if (visible("nose")) ellipse(c, p.nose.x, p.nose.y, 2, 1, pal.shade);
    for (const n of ["eyeL", "eyeR"])
      if (visible(n)) ellipse(c, p[n].x, p[n].y, 1.4, 1.1, pal.eyes);
  }, "Head", "head", ["head", "neck"]);
  paintLayers(q, m, d, c, p);
  return p;
}
