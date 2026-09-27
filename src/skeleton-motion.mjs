import {
  defaultPlayerMotion,
  drawPlayer,
  validatePlayerMotion,
  upgradePlayerMotion,
} from "./player-motion.mjs";
export const SKELETON_KINDS = [
  "skeleton",
  "archer",
  "skeleton_unarmed",
  "skeleton_boss",
];
export function defaultSkeletonMotion(kind = "skeleton") {
  const m = defaultPlayerMotion();
  m.type = kind;
  m.skeleton = true;
  Object.assign(m.palette, {
    head: "#e0dab9",
    headShade: "#999d87",
    body: "#d0cfb0",
    bodyShade: "#8b9580",
    arms: "#ded8b6",
    armShade: "#909783",
    legs: "#c6c5a8",
    legShade: "#89917b",
    outline: "#344039",
  });
  return m;
}
export const skeletonMotions = Object.fromEntries(
  SKELETON_KINDS.map((k) => [k, defaultSkeletonMotion(k)]),
);
export const validateSkeletonMotion = (kind, m) =>
  m?.type === kind && m.skeleton === true && validatePlayerMotion(m);
export function replaceSkeletonMotion(kind, m) {
  if (!validateSkeletonMotion(kind, m)) throw Error("Invalid skeleton rig");
  Object.assign(skeletonMotions[kind], upgradePlayerMotion(m));
}
export function drawSkeleton(
  c,
  a,
  time,
  model = skeletonMotions[a.sprite || a.kind],
  pose = null,
) {
  const kind = model.type,
    gear =
      kind === "archer"
        ? { hand1: "bow", hand2: "occupied" }
        : kind === "skeleton_boss"
          ? { hand1: "sun_blade", hand2: "sun_shield", head: "horned_helm" }
          : kind === "skeleton"
            ? { hand1: "sword" }
            : {};
  const actor = { ...a, equipment: gear };
  if (!a.animationAction) {
    if (a.flash > 0) {
      actor.hit = a.flash;
    } else if (a.state === "windup") {
      actor.animationAction = kind === "skeleton_unarmed" ? "punch" : "slash";
      actor.playerFrame = Math.min(
        2,
        Math.max(0, 1 - (a.timer || 0) / 0.65) * 2,
      );
    } else if (a.attack > 0) {
      actor.animationAction =
        kind === "archer"
          ? "draw"
          : kind === "skeleton_unarmed"
            ? "punch"
            : "slash";
      actor.playerFrame = 3 + (1 - a.attack / 0.34) * 4;
    }
  }
  return drawPlayer(c, actor, time, model, pose);
}
