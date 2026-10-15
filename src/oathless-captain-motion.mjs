import source from "./oathless-captain-data.mjs";
import {
  poseAt,
  projectPoint,
  facingIndex,
  limb,
  ellipse,
  validateMotion,
} from "./player-motion.mjs";
import { drawOrientedPixelVolume as volume } from "./murk-wolf-pixels.mjs";
import { pixelPolygon } from "./pixel-shapes.mjs";
import { paintLayers } from "./render-order.mjs";
import { validateSprite } from "./pixels.mjs";
import { jointAngle } from "./joint-angles.mjs";
import { drawItem } from "./item-art.mjs";
import { ITEMS } from "./items.mjs";

export const CAPTAIN_EQUIPMENT = Object.freeze({
  hand1: "sword",
  hand2: "shield",
});
export const defaultOathlessCaptainMotion = () => structuredClone(source);
export const oathlessCaptainMotion = defaultOathlessCaptainMotion();
export const loadOathlessCaptainArt = () => Promise.resolve(true);
export function validateOathlessCaptainMotion(m) {
  return (
    m?.type === "oathless_captain" &&
    validateMotion(m, source) &&
    (!m.visibility ||
      Object.entries(m.visibility).every(
        ([n, v]) =>
          source.joints[n] &&
          Array.isArray(v) &&
          v.length === 8 &&
          v.every((x) => typeof x === "boolean"),
      )) &&
    (!m.boneSprites ||
      Object.values(m.boneSprites).every(
        (v) =>
          v &&
          Object.entries(v).every(
            ([d, s]) =>
              Number.isInteger(+d) &&
              +d >= 0 &&
              +d < 8 &&
              validateSprite(s) &&
              Number.isFinite(s.x) &&
              Number.isFinite(s.y),
          ),
      ))
  );
}
export function replaceOathlessCaptainMotion(m) {
  if (!validateOathlessCaptainMotion(m))
    throw Error("Invalid Oathless Captain rig");
  const copy = structuredClone(m);
  for (const k of Object.keys(oathlessCaptainMotion))
    delete oathlessCaptainMotion[k];
  Object.assign(oathlessCaptainMotion, copy);
}
export function captainAction(a) {
  if (a.hp <= 0) return "death";
  if (a.flash > 0 || a.hit > 0) return "hurt";
  if (a.jumpHeight > 0 && ["", "run", "walk", "idle"].includes(a.animationAction || "")) return "jump";
  if (a.swimming && ["", "run", "walk", "idle"].includes(a.animationAction || ""))
    return a.moving ? "swim" : "swim_idle";
  if (a.animationAction)
    return a.animationAction === "attack" ? "slash" : a.animationAction;
  if (a.jumpHeight > 0) return "jump";
  if (a.swimming) return a.moving ? "swim" : "swim_idle";
  return a.moving ? (a.walking ? "walk" : "run") : "idle";
}
export function captainFrame(a, t, m = oathlessCaptainMotion) {
  const c = m.clips[captainAction(a)] || m.clips.idle;
  if (Number.isFinite(a.playerFrame)) return a.playerFrame;
  if (a.hp <= 0) return Math.min(c.length - 1, (a.deathTime || 0) * c.fps);
  if (Number.isFinite(a.poseTime)) return a.poseTime * (c.length - 1);
  return (a.captainClock ?? t) * c.fps;
}
const sub = (a, b) => a.map((v, i) => v - b[i]),
  add = (a, b) => a.map((v, i) => v + b[i]);
const norm = (v) => {
  const n = Math.hypot(...v) || 1;
  return v.map((x) => x / n);
};
const cross = (a, b) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const mid = (a, b, t = 0.5) => a.map((v, i) => v + (b[i] - v) * t);
function basis(right, up) {
  const u = norm(up),
    r = norm(right),
    f = norm(cross(u, r));
  return [norm(cross(f, u)), f, u];
}
const local = (o, b, v) =>
  o.map((x, i) => x + v.reduce((n, k, j) => n + k * b[j][i], 0));

export function drawOathlessCaptain(
  c,
  a,
  t,
  m = oathlessCaptainMotion,
  suppliedPose = null,
) {
  const d = facingIndex(a.faceX, a.faceY),
    action = captainAction(a),
    pose = suppliedPose || poseAt(m, action, captainFrame(a, t, m)),
    p = Object.fromEntries(
      Object.entries(pose).map(([n, v]) => [n, projectPoint(v, d)]),
    ),
    pal = m.palette,
    q = [],
    gear = { ...CAPTAIN_EQUIPMENT, ...a.equipment };
  const skin = {
      body: pal.skin,
      shade: pal.skinShade,
      light: pal.skinLight,
      outline: pal.outline,
    },
    gold = {
      body: pal.gold,
      shade: pal.goldShade,
      light: pal.goldLight,
      outline: pal.outline,
    },
    blue = {
      body: pal.blue,
      shade: pal.blueShade,
      light: pal.blueLight,
      outline: pal.outline,
    },
    steel = {
      body: pal.steel,
      shade: pal.steelShade,
      light: pal.steelLight,
      outline: pal.outline,
    },
    hair = {
      body: pal.hair,
      shade: pal.hairShade,
      light: pal.hairLight,
      outline: pal.outline,
    };
  const torso = basis(
      sub(pose.shoulderR, pose.shoulderL),
      sub(pose.chest, pose.pelvis),
    ),
    head = basis(sub(pose.earR, pose.earL), sub(pose.headUp, pose.head));
  const part = (bone, id, bones, paint, depth = p[bone].depth) => {
    if (m.visibility?.[bone]?.[d] !== false)
      q.push({
        bone,
        id,
        bones,
        depth,
        fn: () => {
          const angle =
            jointAngle(
              m,
              action,
              captainFrame(a, t, m),
              d,
              { swordGrip: "handR", shieldGrip: "handL" }[bone] || bone,
            ) || 0;
          c.save();
          if (angle) {
            c.translate(p[bone].x, p[bone].y);
            c.rotate((angle * Math.PI) / 180);
            c.translate(-p[bone].x, -p[bone].y);
          }
          try {
            paint();
          } finally {
            c.restore();
          }
        },
      });
  };
  const poly = (pts, color) =>
    pixelPolygon(
      c,
      pts.map((v) => {
        const s = projectPoint(v, d);
        return s;
      }),
      color,
    );
  const segment = (a, b, w, pal) => {
    limb(c, a, b, w + 1, pal.outline);
    limb(c, a, b, w, pal.body);
    limb(
      c,
      { x: a.x - 0.5, y: a.y - 0.5 },
      { x: b.x - 0.5, y: b.y - 0.5 },
      Math.max(1, w * 0.3),
      pal.light,
    );
  };
  const wear = (id, anchor, paint) => {
    const fit = m.wearables?.[id]?.[d];
    if (!fit) return paint();
    c.save();
    c.translate(anchor.x + (fit.x || 0), anchor.y + (fit.y || 0));
    c.rotate(((fit.rotation || 0) * Math.PI) / 180);
    c.scale(fit.scale || 1, fit.scale || 1);
    if (fit.pixels?.some(Boolean)) {
      fit.pixels.forEach((color, i) => {
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
  for (const s of ["L", "R"]) {
    part(
      "hip" + s,
      "Captain thigh " + s,
      ["hip" + s, "knee" + s],
      () => segment(p["hip" + s], p["knee" + s], m.shape.legWidth, steel),
      (p["hip" + s].depth + p["knee" + s].depth) * 0.5,
    );
    part(
      "knee" + s,
      "Captain greave " + s,
      ["knee" + s, "foot" + s, "toe" + s],
      () => {
        segment(p["knee" + s], p["foot" + s], m.shape.legWidth, gold);
        segment(p["foot" + s], p["toe" + s], 4.4, {
          ...gold,
          body: pal.leather,
        });
      },
      (p["knee" + s].depth + p["foot" + s].depth) * 0.5,
    );
    part(
      "shoulder" + s,
      "Captain sleeve " + s,
      ["shoulder" + s, "elbow" + s],
      () => segment(p["shoulder" + s], p["elbow" + s], m.shape.armWidth, blue),
      (p["shoulder" + s].depth + p["elbow" + s].depth) * 0.5,
    );
    part(
      "elbow" + s,
      "Captain gauntlet " + s,
      ["elbow" + s, "hand" + s],
      () => {
        segment(p["elbow" + s], p["hand" + s], m.shape.armWidth, gold);
        ellipse(c, p["hand" + s].x, p["hand" + s].y, 2, 2, pal.leather);
      },
      (p["elbow" + s].depth + p["hand" + s].depth) * 0.5,
    );
    part(
      "shoulder" + s,
      "Captain pauldron " + s,
      ["shoulder" + s],
      () => volume(c, pose["shoulder" + s], torso, [3.8, 3.4, 2.4], d, gold),
      p["shoulder" + s].depth + 0.3,
    );
  }
  part(
    "chest",
    "Captain breastplate",
    ["chest", "spine", "pelvis"],
    () =>
      wear(gear.chest || "captain-breastplate", p.chest, () => {
        const coat =
          gear.chest && ITEMS[gear.chest]
            ? { ...blue, body: ITEMS[gear.chest].color }
            : blue;
        volume(
          c,
          mid(pose.pelvis, pose.chest, 0.56),
          torso,
          [
            m.shape.bodyWidth,
            2.9,
            Math.hypot(...sub(pose.chest, pose.pelvis)) * 0.62,
          ],
          d,
          coat,
        );
        volume(c, pose.pelvis, torso, [3.7, 2.9, 2.3], d, gold);
        const panel = [
          [-2.9, 3, -1.5],
          [2.9, 3, -1.5],
          [2.3, 3, -8.5],
          [-2.3, 3, -8.5],
        ].map((v) => local(pose.chest, torso, v));
        poly(panel, pal.gold);
        poly(
          [
            [-2.1, 3.1, -2.1],
            [2.1, 3.1, -2.1],
            [1.6, 3.1, -7.8],
            [-1.6, 3.1, -7.8],
          ].map((v) => local(pose.chest, torso, v)),
          pal.blueShade,
        );
        // Simple original sun badge; readable at game scale.
        const badge = projectPoint(local(pose.chest, torso, [0, 3.3, -4.5]), d);
        ellipse(c, badge.x, badge.y, 1.5, 1.8, pal.goldLight);
      }),
    p.chest.depth,
  );
  part(
    "tabard",
    "Captain tabard",
    ["tabard", "tabardEnd"],
    () => {
      const top = local(pose.pelvis, torso, [0, 3, -0.4]),
        end = add(pose.tabardEnd, [0, 1, 0]);
      poly(
        [
          local(top, torso, [-2.9, 0, 0]),
          local(top, torso, [2.9, 0, 0]),
          local(end, torso, [2.6, 0, 0]),
          local(end, torso, [0, 0, -1.5]),
          local(end, torso, [-2.6, 0, 0]),
        ],
        pal.goldShade,
      );
      poly(
        [
          local(top, torso, [-2.1, 0.1, -0.5]),
          local(top, torso, [2.1, 0.1, -0.5]),
          local(end, torso, [1.9, 0.1, 0.5]),
          local(end, torso, [0, 0.1, -0.8]),
          local(end, torso, [-1.9, 0.1, 0.5]),
        ],
        pal.blue,
      );
    },
    p.pelvis.depth + 3.1,
  );
  part("neck", "Captain neck", ["neck"], () =>
    segment(p.neck, p.head, 3.5, skin),
  );
  part(
    "hair",
    "Captain hair rear",
    ["hair"],
    () => {
      for (const v of [
        [0, -2.5, -1.8],
        [-3.8, -1.4, -3.1],
        [3.8, -1.4, -3.1],
      ])
        volume(
          c,
          local(pose.head, head, v),
          head,
          [v[0] ? 1.9 : 4.8, 2.7, v[0] ? 5.2 : 6.4],
          d,
          hair,
        );
    },
    projectPoint(local(pose.head, head, [0, -3, -1.8]), d).depth + 1.3,
  );
  part(
    "head",
    "Captain face",
    ["head"],
    () =>
      volume(
        c,
        pose.head,
        head,
        [m.shape.headWidth, m.shape.headDepth, m.shape.headHeight],
        d,
        skin,
      ),
    p.head.depth,
  );
  for (const s of ["L", "R"])
    part(
      "ear" + s,
      "Captain ear " + s,
      ["ear" + s],
      () => {
        volume(c, pose["ear" + s], head, [1.1, 1.2, 1.6], d, skin);
      },
      p["ear" + s].depth + 0.2,
    );
  part(
    "hair",
    "Captain hair crown",
    ["hair"],
    () =>
      wear("hair:captain", p.hair, () => {
        volume(
          c,
          local(pose.head, head, [0, -0.7, 4.6]),
          head,
          [5.7, 4.4, 2.5],
          d,
          hair,
        );
        for (const [x, z] of [
          [-3.6, 3.2],
          [-1.5, 4.2],
          [3.8, 2.5],
        ])
          volume(
            c,
            local(pose.head, head, [x, 2.3, z]),
            head,
            [1.8, 1.9, 2],
            d,
            hair,
          );
      }),
    p.head.depth + 5,
  );
  for (const s of ["L", "R"])
    part(
      "eye" + s,
      "Captain eye " + s,
      ["eye" + s],
      () => {
        const h = { ...p["eye" + s] };
        if (d === 2) h.x += 1;
        if (d === 6) h.x -= 1;
        const closed = ["death", "sleep"].includes(action);
        c.fillStyle = pal.outline;
        c.fillRect(Math.round(h.x) - 1, Math.round(h.y) - 1, 3, closed ? 1 : 3);
        if (!closed) {
          c.fillStyle = pal.white;
          c.fillRect(Math.round(h.x) - 1, Math.round(h.y), 3, 2);
          c.fillStyle = pal.eyes;
          c.fillRect(Math.round(h.x), Math.round(h.y), 1, 2);
          c.fillStyle = pal.outline;
          c.fillRect(Math.round(h.x), Math.round(h.y) + 1, 1, 1);
        }
      },
      p.head.depth + 7,
    );
  part(
    "nose",
    "Captain nose",
    ["nose"],
    () => {
      c.fillStyle = pal.skinShade;
      c.fillRect(Math.round(p.nose.x), Math.round(p.nose.y), 1, 2);
      c.fillStyle = pal.skinLight;
      c.fillRect(Math.round(p.nose.x) - 1, Math.round(p.nose.y), 1, 1);
    },
    p.head.depth + 8,
  );
  part(
    "mouth",
    "Captain mouth",
    ["mouth"],
    () => {
      c.fillStyle = pal.skinShade;
      c.fillRect(Math.round(p.mouth.x) - 1, Math.round(p.mouth.y), 2, 1);
    },
    p.head.depth + 7,
  );
  const handsVisible = ![
    "salute",
    "talk",
    "kneel",
    "kneel_down",
    "kneel_up",
    "swim",
    "swim_idle",
    "swim_left",
    "swim_right",
  ].includes(action);
  if (handsVisible && gear.hand1)
    part(
      "swordGrip",
      "Captain weapon",
      ["swordGrip", "swordTip"],
      () =>
        wear(gear.hand1, p.swordGrip, () => {
          const a = p.swordGrip,
            b = p.swordTip,
            dx = b.x - a.x,
            dy = b.y - a.y,
            n = Math.hypot(dx, dy) || 1;
          if (ITEMS[gear.hand1]?.base === "sword" || gear.hand1 === "sword") {
            segment(a, b, 2.4, steel);
            const h = { x: a.x + dx * 0.13, y: a.y + dy * 0.13 };
            limb(
              c,
              { x: h.x - (dy / n) * 3, y: h.y + (dx / n) * 3 },
              { x: h.x + (dy / n) * 3, y: h.y - (dx / n) * 3 },
              1.6,
              pal.goldLight,
            );
            limb(
              c,
              a,
              { x: a.x - (dx / n) * 2, y: a.y - (dy / n) * 2 },
              2,
              pal.leather,
            );
          } else drawItem(c, gear.hand1, a.x, a.y, 15);
        }),
      Math.max(p.handR.depth, p.swordGrip.depth) + 0.3,
    );
  if (handsVisible && gear.hand2)
    part(
      "shieldGrip",
      "Captain offhand",
      ["shieldGrip", "shieldTop"],
      () =>
        wear(gear.hand2, p.shieldGrip, () => {
          const h = p.shieldGrip,
            dx = p.shieldTop.x - h.x,
            dy = p.shieldTop.y - h.y,
            ang = Math.atan2(dx, -dy);
          c.save();
          c.translate(h.x, h.y);
          c.rotate(ang);
          if (gear.hand2 === "shield") {
            pixelPolygon(
              c,
              [
                [-4, -5],
                [4, -5],
                [4, 1],
                [0, 6],
                [-4, 1],
              ].map(([x, y]) => ({ x, y })),
              pal.outline,
            );
            pixelPolygon(
              c,
              [
                [-3, -4],
                [3, -4],
                [3, 1],
                [0, 4],
                [-3, 1],
              ].map(([x, y]) => ({ x, y })),
              pal.gold,
            );
            pixelPolygon(
              c,
              [
                [-2, -3],
                [2, -3],
                [2, 0],
                [0, 3],
                [-2, 0],
              ].map(([x, y]) => ({ x, y })),
              pal.blue,
            );
            ellipse(c, 0, -0.5, 1.2, 1.2, pal.goldLight);
          } else drawItem(c, gear.hand2, 0, 0, 13);
          c.restore();
        }),
      p.shieldGrip.depth + 0.4,
    );
  if (gear.head)
    part(
      "head",
      "Captain headgear",
      ["head"],
      () =>
        wear(gear.head, p.head, () =>
          drawItem(c, gear.head, p.head.x, p.head.y - 2, 13),
        ),
      p.head.depth + 9,
    );
  paintLayers(q, m, d, c, p);
  return p;
}
