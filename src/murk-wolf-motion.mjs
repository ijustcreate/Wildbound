import source from "./murk-wolf-data.mjs";
import { drawMurkBody, drawMurkSkull } from "./murk-wolf-pixels.mjs";
import {
  poseAt,
  projectPoint,
  facingIndex,
  limb,
  ellipse,
  validateMotion,
} from "./player-motion.mjs";
import { paintLayers } from "./render-order.mjs";
import { validateSprite } from "./pixels.mjs";
import { pixelPolygon } from "./pixel-shapes.mjs";

// Independent prototype. Does not share mutable model data with ordinary wolves.
export const defaultMurkWolfMotion = () => structuredClone(source);
export const murkWolfMotion = defaultMurkWolfMotion();
export let murkWolfRevision = 0;
export const validateMurkWolfMotion = (m) =>
  validateMotion(m, source) &&
  (!m.visibility ||
    Object.entries(m.visibility).every(
      ([joint, views]) =>
        source.joints[joint] &&
        Array.isArray(views) &&
        views.length === 8 &&
        views.every((v) => typeof v === "boolean"),
    )) &&
  (!m.boneSprites ||
    Object.values(m.boneSprites).every(
      (views) =>
        views &&
        Object.entries(views).every(
          ([d, s]) =>
            Number.isInteger(+d) &&
            +d >= 0 &&
            +d < 8 &&
            validateSprite(s) &&
            Number.isFinite(s.x) &&
            Number.isFinite(s.y),
        ),
    ));
export function replaceMurkWolfMotion(model) {
  if (!validateMurkWolfMotion(model)) throw Error("Invalid Murk Wolf test rig");
  const data = structuredClone(model);
  for (const key of Object.keys(murkWolfMotion)) delete murkWolfMotion[key];
  Object.assign(murkWolfMotion, data);
  murkWolfRevision++;
}
// Native pixel parts have no image-loading dependency. Preserve the preview API.
export const loadMurkWolfArt = () => Promise.resolve(true);
export const murkWolfArtStatus = () => ({ loaded: true, failed: false });
export function murkWolfAction(a) {
  if (a.animationAction)
    return a.animationAction === "attack" ? "bite" : a.animationAction;
  if (a.hp <= 0) return "death";
  if (a.hit > 0 || a.flash > 0) return "hurt";
  if (a.jumpHeight > 0 || a.state === "charge") return "pounce";
  if (a.state === "windup") return "windup";
  if (a.state === "recover") return "recover";
  if (a.attack > 0) return "bite";
  return a.moving ? (a.walking ? "walk" : "run") : "idle";
}
export function murkWolfFrame(a, t, m = murkWolfMotion) {
  const action = murkWolfAction(a),
    clip = m.clips[action] || m.clips.idle;
  if (Number.isFinite(a.playerFrame)) return a.playerFrame;
  if (Number.isFinite(a.poseTime)) return a.poseTime * (clip.length - 1);
  if (a.hp <= 0) return Math.min(1, (a.deathTime ?? 4) / 4) * (clip.length - 1);
  if (a.animationAction) return t * clip.fps;
  if (action === "run" || action === "walk")
    return a.step === undefined
      ? t * clip.fps
      : (a.step / (0.13 * 90)) * clip.length;
  if (a.attack > 0)
    return (
      Math.max(0, 1 - a.attack / (a.attackDuration || 0.34)) * (clip.length - 1)
    );
  if (["windup", "pounce", "recover"].includes(action))
    return (
      Math.max(
        0,
        Math.min(1, 1 - (a.timer || 0) / (a.motionDuration || 0.65)),
      ) *
      (clip.length - 1)
    );
  return t * clip.fps;
}
export function drawMurkWolf(
  c,
  actor,
  time,
  model = murkWolfMotion,
  suppliedPose = null,
) {
  loadMurkWolfArt();
  const d = facingIndex(actor.faceX, actor.faceY),
    pose =
      suppliedPose ||
      poseAt(model, murkWolfAction(actor), murkWolfFrame(actor, time, model)),
    p = Object.fromEntries(
      Object.entries(pose).map(([n, v]) => [n, projectPoint(v, d)]),
    ),
    pal = model.palette,
    q = [];
  const add = (bone, id, bones, fn, depth = p[bone].depth) => {
    if (model.visibility?.[bone]?.[d] !== false)
      q.push({ bone, id, bones, depth, fn });
  };
  const segment = (a, b, width, color) => {
    limb(c, a, b, width + 1, pal.outline);
    limb(c, a, b, width, color);
    limb(
      c,
      { x: a.x - 0.5, y: a.y - 0.6 },
      { x: b.x - 0.5, y: b.y - 0.6 },
      Math.max(1, width * 0.35),
      pal.body,
    );
  };
  add("tailBase", "Murk tail", ["tailBase", "tailMid", "tailTip"], () => {
    segment(p.tailBase, p.tailMid, model.shape.tailWidth, pal.shade);
    segment(p.tailMid, p.tailTip, model.shape.tailWidth * 0.8, pal.tail);
    ellipse(c, p.tailTip.x, p.tailTip.y, 1.9, 2.2, pal.cream);
  });
  for (const s of ["L", "R"])
    for (const front of [true, false]) {
      const a = (front ? "shoulder" : "hip") + s,
        b = (front ? "elbow" : "knee") + s,
        h = (front ? "elbow" : "hock") + s,
        end = (front ? "frontPaw" : "rearPaw") + s;
      add(
        a,
        (front ? "Front" : "Rear") + " leg " + s,
        [a, b, h, end],
        () => {
          segment(p[a], p[b], model.shape.legWidth + 1, pal.body);
          if (!front)
            segment(p[b], p[h], model.shape.legWidth * 0.8, pal.shade);
          segment(p[h], p[end], model.shape.legWidth * 0.7, pal.shade);
          ellipse(c, p[end].x, p[end].y, 3.1, 2.1, pal.outline);
          ellipse(c, p[end].x, p[end].y - 0.3, 2.7, 1.8, pal.cream);
          c.fillStyle = pal.shade;
          for (const dx of [-1, 1])
            c.fillRect(
              Math.round(p[end].x + dx),
              Math.round(p[end].y + 0.5),
              0.6,
              1,
            );
        },
        (p[a].depth + p[end].depth) * 0.5,
      );
    }
  add(
    "spine",
    "Murk body",
    ["pelvis", "spine", "chest", "neck"],
    () => drawMurkBody(c, pose, d, pal, model.shape.bodyWidth),
    (p.pelvis.depth + p.chest.depth) * 0.5,
  );
  // Native skull and cheeks follow the head frame; facial pieces remain separate.
  add(
    "head",
    "Murk skull",
    ["head"],
    () => drawMurkSkull(c, pose, d, pal, model.shape.headSize / 9),
    p.head.depth + 0.2,
  );
  for (const side of ["L", "R"]) {
    const ear = "ear" + side,
      tip = "earTip" + side;
    add(
      ear,
      "Murk ear " + side,
      [ear, tip],
      () => {
        const a = p[ear],
          b = p[tip],
          dx = b.x - a.x,
          dy = b.y - a.y,
          len = Math.hypot(dx, dy) || 1,
          nx = -dy / len,
          ny = dx / len;
        const triangle = (width, inset, color) =>
          pixelPolygon(
            c,
            [
              { x: a.x - nx * width, y: a.y - ny * width },
              { x: b.x - dx * inset, y: b.y - dy * inset },
              { x: a.x + nx * width, y: a.y + ny * width },
            ],
            color,
          );
        triangle(3.4, 0, pal.outline);
        triangle(2.4, 0.2, pal.head);
        if (d !== 4) triangle(1.2, 0.38, "#ad826e");
      },
      Math.max(p[ear].depth, p.head.depth + 0.3),
    );
    const eye = "eye" + side;
    add(
      eye,
      "Murk eye " + side,
      [eye],
      () => {
        const a = p[eye],
          profile = d === 2 || d === 6;
        ellipse(c, a.x, a.y, profile ? 1.8 : 2.1, 1.8, pal.outline);
        c.fillStyle = pal.eyes;
        c.fillRect(Math.round(a.x) - 1, Math.round(a.y) - 1, 2, 2);
        c.fillStyle = "#efffed";
        c.fillRect(Math.round(a.x), Math.round(a.y) - 1, 1, 1);
      },
      p.head.depth + 12,
    );
  }
  add(
    "jaw",
    "Murk jaw",
    ["jaw", "jawTip"],
    () => {
      limb(c, p.jaw, p.jawTip, 5, pal.outline);
      limb(c, p.jaw, p.jawTip, 3.6, pal.cream);
    },
    p.head.depth + 9,
  );
  add(
    "muzzle",
    "Murk muzzle",
    ["muzzle"],
    () => {
      limb(c, p.muzzle, p.nose, 6, pal.outline);
      limb(
        c,
        { x: p.muzzle.x, y: p.muzzle.y - 0.5 },
        { x: p.nose.x, y: p.nose.y - 0.5 },
        4.5,
        pal.cream,
      );
    },
    p.head.depth + 10,
  );
  add(
    "nose",
    "Murk nose",
    ["nose"],
    () => {
      ellipse(c, p.nose.x, p.nose.y, 2.2, 1.6, pal.outline);
      c.fillStyle = "#79727a";
      c.fillRect(Math.round(p.nose.x) - 1, Math.round(p.nose.y) - 1, 2, 1);
    },
    p.head.depth + 13,
  );
  paintLayers(q, model, d, c, p);
  return p;
}
