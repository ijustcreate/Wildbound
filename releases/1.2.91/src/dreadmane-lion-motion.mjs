import source from "./dreadmane-lion-data.mjs";
import {
  drawDreadmaneBody,
  drawDreadmaneSkull,
  drawDreadmaneMane,
} from "./dreadmane-lion-pixels.mjs";
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

// Separate enemy rig. Does not share mutable data with the original lion.
export const defaultDreadmaneLionMotion = () => structuredClone(source);
export const dreadmaneLionMotion = defaultDreadmaneLionMotion();
export let dreadmaneLionRevision = 0;
export const validateDreadmaneLionMotion = (m) =>
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
export function replaceDreadmaneLionMotion(model) {
  if (!validateDreadmaneLionMotion(model))
    throw Error("Invalid Dreadmane Lion test rig");
  const data = structuredClone(model);
  for (const key of Object.keys(dreadmaneLionMotion))
    delete dreadmaneLionMotion[key];
  Object.assign(dreadmaneLionMotion, data);
  dreadmaneLionRevision++;
}
// Native pixel parts have no image-loading dependency. Preserve the preview API.
export const loadDreadmaneLionArt = () => Promise.resolve(true);
export const dreadmaneLionArtStatus = () => ({ loaded: true, failed: false });
export function dreadmaneLionAction(a) {
  if (a.hp <= 0) return "death";
  if (a.animationAction)
    return a.animationAction === "attack" ? "claw_left" : a.animationAction;
  if (a.hit > 0 || a.flash > 0) return "hurt";
  if (a.jumpHeight > 0) return "jump";
  if (a.attack > 0) return "claw_left";
  return a.moving ? (a.walking ? "walk" : "run") : "idle";
}
export function dreadmaneLionFrame(a, t, m = dreadmaneLionMotion) {
  const clip = m.clips[dreadmaneLionAction(a)] || m.clips.idle;
  if (Number.isFinite(a.playerFrame)) return a.playerFrame;
  if (a.hp <= 0) return Math.min(1, (a.deathTime || 0) / 2) * (clip.length - 1);
  if (Number.isFinite(a.poseTime))
    return Math.max(0, Math.min(1, a.poseTime)) * (clip.length - 1);
  return t * clip.fps;
}
export function drawDreadmaneLion(
  c,
  actor,
  time,
  model = dreadmaneLionMotion,
  suppliedPose = null,
) {
  loadDreadmaneLionArt();
  const d = facingIndex(actor.faceX, actor.faceY),
    pose =
      suppliedPose ||
      poseAt(
        model,
        dreadmaneLionAction(actor),
        dreadmaneLionFrame(actor, time, model),
      ),
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
  add(
    "tailBase",
    "Dreadmane tail",
    ["tailBase", "tailMid", "tailEnd", "tailTip"],
    () => {
      segment(p.tailBase, p.tailMid, model.shape.tailWidth, pal.shade);
      segment(p.tailMid, p.tailEnd, model.shape.tailWidth * 0.8, pal.tail);
      segment(p.tailEnd, p.tailTip, model.shape.tailWidth * 0.65, pal.tail);
      ellipse(c, p.tailTip.x, p.tailTip.y, 2.8, 3, pal.mane);
    },
  );
  for (const s of ["L", "R"])
    for (const front of [true, false]) {
      const chain = front
        ? ["shoulder", "elbow", "wrist", "frontPaw"]
        : ["hip", "knee", "hock", "ankle", "rearPaw"];
      const names = chain.map((n) => n + s),
        a = names[0],
        end = names.at(-1);
      add(
        a,
        (front ? "Front" : "Rear") + " leg " + s,
        names,
        () => {
          for (let i = 0; i < names.length - 1; i++)
            segment(
              p[names[i]],
              p[names[i + 1]],
              model.shape.legWidth * (i === 0 ? 1.2 : 0.75),
              pal.legs,
            );
          ellipse(c, p[end].x, p[end].y, 3, 2, pal.outline);
          ellipse(c, p[end].x, p[end].y - 0.4, 2.5, 1.5, pal.cream);
        },
        (p[a].depth + p[end].depth) * 0.5,
      );
    }

  add(
    "spine",
    "Dreadmane body",
    ["pelvis", "spine", "chest", "neck"],
    () => drawDreadmaneBody(c, pose, d, pal, model.shape.bodyWidth),
    (p.pelvis.depth + p.chest.depth) * 0.5,
  );
  add(
    "neck",
    "Dreadmane mane",
    ["neck", "head"],
    () => drawDreadmaneMane(c, pose, d, pal, model.shape.maneSize),
    p.head.depth - 0.2,
  );
  // Native skull and cheeks follow the head frame; facial pieces remain separate.
  add(
    "head",
    "Dreadmane skull",
    ["head"],
    () => drawDreadmaneSkull(c, pose, d, pal, model.shape.headSize / 9),
    p.head.depth + 0.2,
  );
  for (const side of ["L", "R"]) {
    const ear = "ear" + side,
      tip = "earTip" + side;
    add(
      ear,
      "Dreadmane ear " + side,
      [ear, tip],
      () => {
        const a = p[ear],
          b = p[tip],
          x = (a.x + b.x) / 2,
          y = (a.y + b.y) / 2;
        ellipse(c, x, y, 2.8, 3, pal.outline);
        ellipse(c, x, y - 0.3, 2, 2.2, pal.head);
        if (d !== 4) ellipse(c, x, y + 0.2, 1, 1.3, pal.mane);
      },
      Math.max(p[ear].depth, p.head.depth + 0.3),
    );
    const eye = "eye" + side;
    add(
      eye,
      "Dreadmane eye " + side,
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
    "Dreadmane jaw",
    ["jaw", "jawTip"],
    () => {
      limb(c, p.jaw, p.jawTip, 5, pal.outline);
      limb(c, p.jaw, p.jawTip, 3.6, pal.cream);
    },
    p.head.depth + 9,
  );
  add(
    "muzzle",
    "Dreadmane muzzle",
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
    "Dreadmane nose",
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
