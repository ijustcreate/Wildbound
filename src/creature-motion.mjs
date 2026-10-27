import {requestedCreatureDefaults,upgradeRequestedCreature} from './requested-creature-transfer.mjs';
import {drawDragonPixels} from './dragon-pixels.mjs';
import { paintLayers } from "./render-order.mjs";
import {
  poseAt,
  projectPoint,
  facingIndex,
  ellipse,
  limb,
  validateMotion,
} from "./player-motion.mjs";

const humanoid = {
  pelvis: ["", 0, -2, 13],
  chest: ["pelvis", 0, 1, 22],
  head: ["chest", 0, 3, 31],
  shoulderL: ["chest", -7, 1, 23],
  elbowL: ["shoulderL", -10, 2, 15],
  handL: ["elbowL", -10, 4, 7],
  shoulderR: ["chest", 7, 1, 23],
  elbowR: ["shoulderR", 10, 2, 15],
  handR: ["elbowR", 10, 4, 7],
  hipL: ["pelvis", -4, -2, 12],
  kneeL: ["hipL", -5, 2, 6],
  footL: ["kneeL", -5, 4, 1],
  hipR: ["pelvis", 4, -2, 12],
  kneeR: ["hipR", 5, 2, 6],
  footR: ["kneeR", 5, 4, 1],
  earL: ["head", -6, 3, 31],
  earR: ["head", 6, 3, 31],
  eyeL: ["head", -2, 8, 32],
  eyeR: ["head", 2, 8, 32],
  muzzle: ["head", 0, 9, 29],
};
const legacyDragonSkeleton = {
  pelvis: ["", 0, -12, 15],
  chest: ["pelvis", 0, 13, 1],
  neck: ["chest", 0, 10, 3],
  head: ["neck", 0, 7, 1],
  snout: ["head", 0, 6, -1],
  jaw: ["head", 0, 5, -3],
  eyeL: ["head", -3, 3, 3],
  eyeR: ["head", 3, 3, 3],
  hornL: ["head", -5, -1, 6],
  hornTipL: ["hornL", -2, -1, 7],
  hornR: ["head", 5, -1, 6],
  hornTipR: ["hornR", 2, -1, 7],
  wingRootL: ["chest", -6, 0, 4],
  wingTipL: ["wingRootL", -18, 3, 14],
  wingFingerL: ["wingRootL", -11, 9, 9],
  wingRootR: ["chest", 6, 0, 4],
  wingTipR: ["wingRootR", 18, 3, 14],
  wingFingerR: ["wingRootR", 11, 9, 9],
  shoulderL: ["chest", -6, 5, -4],
  elbowL: ["shoulderL", -1, 5, -6],
  frontPawL: ["elbowL", -1, 4, -6],
  shoulderR: ["chest", 6, 5, -4],
  elbowR: ["shoulderR", 1, 5, -6],
  frontPawR: ["elbowR", 1, 4, -6],
  hipL: ["pelvis", -6, -3, -2],
  kneeL: ["hipL", -1, -5, -5],
  rearPawL: ["kneeL", -1, -5, -7],
  hipR: ["pelvis", 6, -3, -2],
  kneeR: ["hipR", 1, -5, -5],
  rearPawR: ["kneeR", 1, -5, -7],
  tailBase: ["pelvis", 0, -9, 1],
  tailMid: ["tailBase", 1, -11, 0],
  tailTip: ["tailMid", 1, -11, -1],
};

const skeletons = {
  dragon: {
    pelvis: ["", 0, -10, 16],
    chest: ["pelvis", 0, 9, 20],
    neck: ["chest", 0, 21, 30],
    head: ["neck", 0, 30, 34],
    snout: ["head", 0, 41, 31],
    jaw: ["head", 0, 38, 27],
    eyeL: ["head", -4, 34, 36],
    eyeR: ["head", 4, 34, 36],
    hornL: ["head", -5, 27, 38],
    hornTipL: ["hornL", -9, 18, 47],
    hornR: ["head", 5, 27, 38],
    hornTipR: ["hornR", 9, 18, 47],
    wingRootL: ["chest", -6, 5, 23],
    wingTipL: ["wingRootL", -35, -2, 43],
    wingFingerL: ["wingRootL", -30, -40, 12],
    wingRootR: ["chest", 6, 5, 23],
    wingTipR: ["wingRootR", 35, -2, 43],
    wingFingerR: ["wingRootR", 30, -40, 12],
    shoulderL: ["chest", -8, 11, 18],
    elbowL: ["shoulderL", -11, 15, 9],
    frontPawL: ["elbowL", -11, 21, 1],
    shoulderR: ["chest", 8, 11, 18],
    elbowR: ["shoulderR", 11, 15, 9],
    frontPawR: ["elbowR", 11, 21, 1],
    hipL: ["pelvis", -8, -10, 15],
    kneeL: ["hipL", -12, -17, 8],
    rearPawL: ["kneeL", -12, -11, 1],
    hipR: ["pelvis", 8, -10, 15],
    kneeR: ["hipR", 12, -17, 8],
    rearPawR: ["kneeR", 12, -11, 1],
    tailBase: ["pelvis", 0, -23, 14],
    tailMid: ["tailBase", 5, -39, 12],
    tailTip: ["tailMid", 11, -56, 17],
  },
  fire_elemental: {
    ...humanoid,
    flameCrown: ["head", 0, 2, 46],
    flameL: ["chest", -10, 0, 33],
    flameR: ["chest", 10, 0, 33],
  },
  water_elemental: {
    ...humanoid,
    crest: ["head", 0, 2, 46],
    core: ["chest", 0, 3, 25],
  },
  snake: {
    pelvis: ["", 0, -5, 3],
    ...Object.fromEntries(
      Array.from({ length: 8 }, (_, i) => [
        "segment" + i,
        [i ? "segment" + (i - 1) : "pelvis", 0, -5 - i * 4, 3],
      ]),
    ),
    tailTip: ["segment7", 0, -39, 2],
    neck: ["pelvis", 0, 2, 5],
    head: ["neck", 0, 8, 7],
    jaw: ["head", 0, 10, 5],
    eyeL: ["head", -2.5, 10, 8.5],
    eyeR: ["head", 2.5, 10, 8.5],
    tongue: ["jaw", 0, 16, 5],
  },
  monkey: {
    ...humanoid,
    tailBase: ["pelvis", 0, -8, 15],
    tailMid: ["tailBase", 2, -17, 18],
    tailTip: ["tailMid", 5, -23, 25],
  },
  golem: { ...humanoid },
  vine: {
    pelvis: ["", 0, 0, 1],
    stem1: ["pelvis", 0, 0, 9],
    stem2: ["stem1", 0, 1, 17],
    neck: ["stem2", 0, 3, 25],
    head: ["neck", 0, 5, 32],
    jawTop: ["head", 0, 8, 37],
    jawBottom: ["head", 0, 8, 27],
    leafL: ["stem1", -12, 0, 8],
    leafR: ["stem1", 12, 0, 8],
    eyeL: ["head", -4, 11, 35],
    eyeR: ["head", 4, 11, 35],
  },
  trap: {
    pelvis: ["", 0, 0, 1],
    trigger: ["pelvis", 0, 0, 2],
    hingeL: ["pelvis", -12, 0, 2],
    jawL: ["hingeL", -16, 0, 3],
    hingeR: ["pelvis", 12, 0, 2],
    jawR: ["hingeR", 16, 0, 3],
  },
  beholder: {
    pelvis: ["", 0, 0, 14],
    body: ["pelvis", 0, 0, 22],
    eye: ["body", 0, 7, 28],
    stalk0: ["body", -8, -7, 29], stalk0Tip: ["stalk0", -15, -12, 38],
    stalk1: ["body", -11, 0, 23], stalk1Tip: ["stalk1", -23, -2, 25],
    stalk2: ["body", -8, 8, 18], stalk2Tip: ["stalk2", -20, 12, 15],
    stalk3: ["body", 8, -7, 29], stalk3Tip: ["stalk3", 15, -12, 38],
    stalk4: ["body", 11, 0, 23], stalk4Tip: ["stalk4", 23, -2, 25],
    stalk5: ["body", 8, 8, 18], stalk5Tip: ["stalk5", 20, 12, 15],
    stalk6: ["body", 0, -4, 32], stalk6Tip: ["stalk6", 0, -8, 46],
  },
};
skeletons.lesser_beholder = {pelvis:skeletons.beholder.pelvis,body:skeletons.beholder.body,eye:skeletons.beholder.eye};
for(const [i,v]of [[-12,-7,24,-8,-8,35],[-14,0,25,-12,-1,34],[-10,8,24,-8,10,34],[12,-7,24,8,-8,35],[14,0,25,12,-1,34],[10,8,24,8,10,34]].entries()){
  skeletons.lesser_beholder[`stalk${i}`]=['body',...v.slice(0,3)];skeletons.lesser_beholder[`stalk${i}Tip`]=[`stalk${i}`,...v.slice(3)];
}
const labels = {
  dragon: "Dragon / winged quadruped",
  fire_elemental: "Fire elemental / living flame",
  water_elemental: "Water elemental / living water",
  snake: "Snake / segmented",
  monkey: "Monkey / primate",
  golem: "Golem / stone",
  vine: "Snapping plant / rooted",
  trap: "Trap / mechanism",
  beholder: "Beholder / eyestalk aberration",
  lesser_beholder: "Lesser beholder / eyestalk aberration",
};
const palette = {
  body: "#7b9351",
  shade: "#435e39",
  light: "#b8c879",
  face: "#c6bd79",
  detail: "#e9d58b",
  eye: "#f4dc65",
  outline: "#25372d",
};
const dragonPalette = {
  body: "#c64b35",
  shade: "#71384f",
  light: "#ee8150",
  face: "#e69a56",
  detail: "#f2cc73",
  eye: "#fff073",
  outline: "#302433",
};
const zero = (spec) =>
  Object.fromEntries(Object.keys(spec).map((n) => [n, [0, 0, 0]]));
function makeKeys(kind, action) {
  const spec = skeletons[kind];
  return Array.from({ length: 8 }, (_, frame) => {
    const t = frame / 7,
      a = (frame * Math.PI) / 4,
      j = zero(spec);
    if (kind === "beholder" || kind === "lesser_beholder") {
      const bob = action === "death" ? -t * 7 : Math.sin(a) * (action === "idle" ? 1.2 : 2.4);
      for (const n of Object.keys(spec)) j[n] = [0, 0, bob];
      for (let i = 0; i < (kind==='beholder'?7:6); i++) {
        const phase = a + i * 0.75;
        const idleSway=action==='idle'?1:1.5;
        j[`stalk${i}`] = [Math.sin(phase) * idleSway, Math.cos(phase) * idleSway, bob];
        j[`stalk${i}Tip`] = [
          Math.sin(phase + .5) * (action === "attack" ? 3 : action==='idle'?2.5:1.5),
          Math.cos(phase + .5) * (action==='idle'?2.2:1.5),
          bob + (action === "attack" ? Math.sin(t * Math.PI) * 3 : 0),
        ];
      }
      if (action === "hurt") for (const n of Object.keys(j)) j[n][1] -= (1 - t) * 3;
      if (action === "death") j.eye[2] -= 4 * t;
    } else if (kind === "snake") {
      const coil = ["coil", "windup", "snared"].includes(action),
        strike = action === "strike";
      for (let i = 0; i < 8; i++) {
        const n = "segment" + i,
          phase = a - i * 0.65;
        if (coil) {
          const angle = i * 0.9,
            r = 4 + i * 0.8;
          j[n] = [
            Math.sin(angle) * r,
            Math.cos(angle) * r - 6 - spec[n][2],
            i * 0.25,
          ];
        } else
          j[n] = [
            Math.sin(phase) * (action === "idle" ? 1 : 4),
            0,
            Math.sin(phase) * 0.3,
          ];
      }
      j.tailTip = coil ? [2, 24, 0] : [Math.sin(a - 5.8) * 5, 0, 0];
      const lift = coil ? 5 + t * 3 : 0,
        lunge = strike ? Math.sin(t * Math.PI) * 13 : 0;
      for (const n of ["neck", "head", "jaw", "eyeL", "eyeR", "tongue"])
        j[n] = [Math.sin(a) * 0.5, lunge, lift];
      if (strike) j.jaw[2] -= Math.sin(t * Math.PI) * 2;
      j.tongue[1] += Math.sin(a * 2) * 2;
    } else if (kind === "dragon") {
      const walking = ["walk", "run"].includes(action),
        stride = walking ? (action === "run" ? 5 : 3) : 0,
        bob = walking ? Math.abs(Math.sin(a * 2)) * 1.3 : Math.sin(a) * 0.35,
        tailSweep = ["tailSwipe", "attack"].includes(action)
          ? Math.sin(t * Math.PI * 2) * 32
          : Math.sin(a - 0.6) * 3;
      for (const n of ["pelvis", "chest", "neck", "head"]) j[n][2] = bob;
      for (const [side, phase] of [
        ["L", 0],
        ["R", Math.PI],
      ]) {
        const front = Math.sin(a + phase) * stride,
          rear = Math.sin(a + phase + Math.PI) * stride;
        j["elbow" + side] = [
          0,
          walking ? front * 0.55 : 0,
          Math.max(0, -front) * 1.2,
        ];
        j["frontPaw" + side] = [
          0,
          walking ? front : 0,
          Math.max(0, -front) * 2,
        ];
        j["knee" + side] = [0, walking ? rear * 0.55 : 0, Math.max(0, -rear)];
        j["rearPaw" + side] = [0, walking ? rear : 0, Math.max(0, -rear) * 1.8];
        const flap = Math.sin(a);
        j["wingTip" + side] = [
          0,
          0,
          (action === "idle" ? flap * 1.5 : flap * 5) + bob,
        ];
        j["wingFinger" + side] = [0, 0, flap * 2];
      }
      j.tailMid = [tailSweep * 0.45, 0, bob];
      j.tailTip = [tailSweep, action === "tailSwipe" ? 3 : 0, bob];
      if (["breath", "attack"].includes(action)) {
        const lunge = Math.sin(t * Math.PI);
        j.neck = [0, 4 * lunge, 1.5 * lunge];
        j.head = [0, 6 * lunge, lunge];
        j.jaw = [0, 0, -4 * lunge];
      }
      if (action === "windup") {
        j.head = [0, -2 * t, -t];
        j.tailTip = [Math.sin(t * Math.PI) * 6, 0, 1];
      }
      for (const n of [
        "snout",
        "jaw",
        "eyeL",
        "eyeR",
        "hornL",
        "hornR",
        "hornTipL",
        "hornTipR",
      ])
        j[n] = j[n].map((v, i) => v + j.head[i]);
    } else if (["monkey", "golem", "fire_elemental"].includes(kind)) {
      const moving = ["run", "walk"].includes(action),
        heavy = kind === "golem";
      const bob = moving
        ? Math.cos(a * 2) * (heavy ? 0.7 : 1.2)
        : Math.sin(a) * 0.3;
      for (const n of Object.keys(j)) if (!n.startsWith("foot")) j[n][2] = bob;
      for (const [side, sign] of [
        ["L", 1],
        ["R", -1],
      ]) {
        const stride = moving ? Math.sin(a) * sign * (heavy ? 2.5 : 5) : 0;
        j["foot" + side] = [0, stride, Math.max(0, -stride) * 0.6];
        j["knee" + side] = [0, stride * 0.6, Math.max(0, -stride) * 0.3];
        j["hand" + side] = [0, -stride, Math.max(0, stride) * 0.4 + bob];
        j["elbow" + side] = [0, -stride * 0.5, bob];
        if(action==='grab'){
          const lift=Math.max(0,Math.min(1,(t-.24)/.62)),crouch=Math.sin(Math.min(1,t*3.4)*Math.PI/2)*(1-lift);
          j.pelvis=[0,crouch*4,-crouch*2];
          j["hand"+side]=[sign*-2,crouch*12+lift*2,-crouch*8+lift*28];
          j["elbow"+side]=[0,crouch*5+lift*2,-crouch*4+lift*17];
          j.chest=[0,crouch*4+lift*2,-crouch*3];j.head=[0,crouch*5,-crouch*3];
        } else if(action==='throw'){
          const follow=Math.sin(Math.min(1,t*1.25)*Math.PI/2);
          j["hand"+side]=[sign*-2,2+follow*15,27-follow*31];
          j["elbow"+side]=[0,4+follow*7,16-follow*18];
          j.chest=[0,follow*5,-follow*2];
        } else if (["windup", "slam", "punch"].includes(action)) {
          const raised = action === "windup" ? t : 1 - t;
          j["hand" + side] = [sign * -2, 4 + 5 * (1 - raised), raised * 28];
          j["elbow" + side] = [0, 3, raised * 13];
        }
      }
      if (kind === "fire_elemental") {
        j.flameCrown = [Math.sin(a) * 3, 0, Math.cos(a * 2) * 3];
        j.flameL = [Math.sin(a + 1) * 2, 0, Math.sin(a * 2) * 3];
        j.flameR = [Math.sin(a - 1) * 2, 0, Math.cos(a * 2) * 3];
        if (action === "cast") {
          j.handR = [0, Math.sin(t * Math.PI) * 16, 12];
          j.elbowR = [0, 7, 8];
        }
      }
      if (kind === "monkey") {
        j.tailBase = [0, 0, bob];
        j.tailMid = [Math.sin(a) * 3, 0, bob];
        j.tailTip = [Math.sin(a - 0.7) * 5, 0, bob + Math.cos(a) * 2];
        if (action === "throw") {
          j.handR = [-2, Math.sin(t * Math.PI) * 14 - 5, (1 - t) * 27];
          j.elbowR = [0, Math.sin(t * Math.PI) * 6 - 2, (1 - t) * 10];
        }
      }
      if (action === "hurt")
        for (const n of [
          "chest",
          "head",
          "eyeL",
          "eyeR",
          "earL",
          "earR",
          "muzzle",
        ])
          j[n][1] -= (1 - t) * 4;
    } else if (kind === "vine") {
      const reach =
        action === "bite"
          ? Math.sin(t * Math.PI) * 16
          : action === "windup"
            ? -t * 5
            : Math.sin(a) * 2;
      for (const [n, f] of [
        ["stem1", 0.1],
        ["stem2", 0.35],
        ["neck", 0.7],
        ["head", 1],
        ["jawTop", 1],
        ["jawBottom", 1],
        ["eyeL", 1],
        ["eyeR", 1],
      ])
        j[n] = [
          Math.sin(a) * f * 1.8,
          reach * f,
          action === "bite" ? -Math.sin(t * Math.PI) * 7 * f : 0,
        ];
      const gape =
        action === "windup"
          ? t * 5
          : action === "bite"
            ? Math.max(0, 1 - t * 2) * 5
            : 1 + Math.sin(a) * 0.5;
      j.jawTop[2] += gape;
      j.jawBottom[2] -= gape;
      j.leafL[2] = Math.sin(a) * 2;
      j.leafR[2] = -Math.sin(a) * 2;
    } else if (kind === "trap") {
      const closed =
        action === "hold"
          ? 1
          : action === "snap"
            ? Math.min(1, t * 2)
            : action === "arm"
              ? 1 - t
              : 0;
      j.jawL = [closed * 13, 0, closed * 11];
      j.jawR = [-closed * 13, 0, closed * 11];
      j.trigger[2] = -closed;
    }
    return { frame, joints: j };
  });
}
export function legacyCreatureMotion(kind) {
  const spec = skeletons[kind];
  if (!spec) throw Error("Unknown creature rig");
  const clips =
    kind === "beholder" || kind === "lesser_beholder"
      ? ["idle", "float", "attack", "recover", "hurt", "death"]
      : kind === "fire_elemental"
      ? ["idle", "walk", "run", "cast", "hurt", "snared"]
      : kind === "dragon"
        ? [
            "idle",
            "walk",
            "run",
            "windup",
            "breath",
            "tailSwipe",
            "attack",
            "recover",
            "hurt",
            "snared",
          ]
        : kind === "snake"
          ? [
              "idle",
              "slither",
              "coil",
              "windup",
              "strike",
              "recover",
              "hurt",
              "snared",
            ]
          : kind === "monkey"
            ? ["idle", "run", "punch", "throw", "recover", "hurt", "snared"]
            : kind === "golem"
              ? ["idle", "walk", "windup", "grab", "throw", "slam", "recover", "hurt", "snared"]
              : kind === "vine"
                ? ["idle", "windup", "bite", "recover", "hurt", "snared"]
                : ["idle", "arm", "snap", "hold"];
  const pal = { ...palette };
  if (kind === "dragon") Object.assign(pal, dragonPalette);
  if (kind === "water_elemental")
    Object.assign(pal, {
      body: "#328b9c",
      shade: "#20556f",
      light: "#55c8d0",
      face: "#9ae7e4",
      detail: "#d4ffff",
      eye: "#eaffff",
    });
  if (kind === "fire_elemental")
    Object.assign(pal, {
      body: "#f87526",
      shade: "#bb3529",
      light: "#ffc64b",
      face: "#ffdd65",
      detail: "#fff3a1",
      eye: "#fffce0",
      outline: "#632530",
    });
  if (kind === "monkey")
    Object.assign(pal, {
      body: "#926044",
      shade: "#5b3c35",
      light: "#c78b5a",
      face: "#e0b475",
      detail: "#d7a575",
    });
  if (kind === "golem")
    Object.assign(pal, {
      body: "#748a80",
      shade: "#354c49",
      light: "#b1c0a7",
      face: "#829990",
      detail: "#d5cb7a",
      eye: "#c6ffca",
      outline: "#26383a",
    });
  if (kind === "vine")
    Object.assign(pal, { face: "#d75c73", detail: "#fff1cd", eye: "#f7d788" });
  if (kind === "trap")
    Object.assign(pal, {
      body: "#839798",
      shade: "#455b60",
      light: "#c2c7aa",
      face: "#bcb88b",
      detail: "#e1dcc1",
    });
  if (kind === "beholder" || kind === "lesser_beholder")
    Object.assign(pal, {
      body: "#667b9b",
      shade: "#3b3155",
      light: "#8da6c2",
      face: "#ffb94e",
      detail: "#f7d878",
      eye: "#fff1b0",
      outline: "#241c36",
    });
  return {
    version: 1,
    type: kind,
    name: labels[kind],
      ...(["dragon","beholder"].includes(kind) ? { artRevision: 2 } : {}),
    joints: Object.fromEntries(
      Object.entries(spec).map(([n, [parent, ...position]]) => [
        n,
        { parent, position },
      ]),
    ),
    palette: pal,
    shape:
      kind === "dragon"
        ? {
            bodyWidth: 8.5,
            headRadius: 6,
            limbWidth: 4.5,
            tailWidth: 5,
            wingSpan: 20,
          }
        : kind === "trap"
          ? { baseRadius: 16, jawWidth: 3, jawLength: 8, triggerRadius: 5 }
          : {
              bodyWidth: kind === "golem" ? 15 : kind === "snake" ? 6 : 8,
              headRadius: kind === "golem" ? 7 : kind === "vine" ? 10 : 5,
              limbWidth: kind === "golem" ? 7 : 3,
              tailWidth: 2.5,
            },
    visibility: Object.fromEntries(
      Object.keys(spec)
        .filter((n) => /^(eye|ear|muzzle|tongue|horn)/.test(n))
        .map((n) => [
          n,
          Array.from(
            { length: 8 },
            (_, d) =>
              !n.startsWith("eye") ||
              (!(d >= 3 && d <= 5) &&
                !(n === "eyeR" && d === 2) &&
                !(n === "eyeL" && d === 6)),
          ),
        ]),
    ),
    clips: Object.fromEntries(
      clips.map((action) => [
        action,
        {
          fps: kind === "golem" ? 8 : 12,
          length: 8,
          loop: [
            "idle",
            "float",
            "breath",
            "tailSwipe",
            "attack",
            "run",
            "walk",
            "slither",
            "coil",
            "snared",
            "hold",
          ].includes(action),
          keys: makeKeys(kind, action),
        },
      ]),
    ),
  };
}
export function defaultCreatureMotion(kind){const m=legacyCreatureMotion(kind);return kind==='dragon'?requestedCreatureDefaults(m):m;}
export const creatureMotions = Object.fromEntries(
  Object.keys(skeletons).map((k) => [k, defaultCreatureMotion(k)]),
);
export function upgradeCreatureMotion(kind, model) {
  const m = kind==='dragon'?upgradeRequestedCreature(model,legacyCreatureMotion(kind)):structuredClone(model);
  if(kind==='beholder'&&m?.joints&&!m.artRevision){
    const defaults=defaultCreatureMotion(kind),old=[[-12,-7,24,-8,-8,35],[-14,0,25,-12,-1,34],[-10,8,24,-8,10,34],[12,-7,24,8,-8,35],[14,0,25,12,-1,34],[10,8,24,8,10,34]];
    for(let i=0;i<6;i++)for(const [name,position] of [[`stalk${i}`,old[i].slice(0,3)],[`stalk${i}Tip`,old[i].slice(3)]]){
      if(JSON.stringify(m.joints[name]?.position)===JSON.stringify(position))m.joints[name]=structuredClone(defaults.joints[name]);
    }
    for(const name of ['stalk6','stalk6Tip'])if(!m.joints[name]){
      m.joints[name]=structuredClone(defaults.joints[name]);
      for(const [action,clip] of Object.entries(m.clips||{}))for(const key of clip.keys||[]){const source=defaults.clips[action]?.keys.find(k=>k.frame===key.frame);if(source&&!key.joints[name])key.joints[name]=structuredClone(source.joints[name]);}
    }
    m.artRevision=2;
  }
  if(kind==='golem'&&m?.clips){
    const defaults=defaultCreatureMotion(kind);
    for(const action of ['grab','throw'])if(!m.clips[action])m.clips[action]=structuredClone(defaults.clips[action]);
  }
  if (kind === "dragon" && m && !m.artRevision && m.joints) {
    for (const [name, [, ...oldPosition]] of Object.entries(
      legacyDragonSkeleton,
    )) {
      const position = m.joints[name]?.position;
      if (Array.isArray(position))
        m.joints[name].position = position.map(
          (v, i) => v - oldPosition[i] + defaultCreatureMotion(kind).joints[name].position[i],
        );
    }
    if (m.shape?.bodyWidth === 10) m.shape.bodyWidth = 8.5;
    if (m.shape?.limbWidth === 3) m.shape.limbWidth = 4.5;
    m.artRevision = 2;
    m.motionDonorRevision=1;
  }
  if(kind==='dragon'&&m.clips){const def=defaultCreatureMotion(kind);for(const[name,clip]of Object.entries(def.clips))m.clips[name]??=structuredClone(clip);}
  return m;
}
export function validateCreatureMotion(kind, m) {
  m = upgradeCreatureMotion(kind, m);
  const def = defaultCreatureMotion(kind);
  return (
    m?.type === kind &&
    validateMotion(m, def) &&
    Object.keys(def.visibility).every(
      (n) =>
        Array.isArray(m.visibility?.[n]) &&
        m.visibility[n].length === 8 &&
        m.visibility[n].every((v) => typeof v === "boolean"),
    )
  );
}
export function replaceCreatureMotion(kind, m) {
  if (!validateCreatureMotion(kind, m))
    throw Error("Invalid " + kind + " rig. Nothing imported.");
  Object.assign(creatureMotions[kind], upgradeCreatureMotion(kind, m));
}
export function creatureAction(kind, a) {
  if (kind === "beholder" || kind === "lesser_beholder") {
    if (a.hp <= 0 || a.state === "death") return "death";
    if (a.beholderRayTime > 0 || a.attack > 0) return "attack";
    if (a.flash > 0 || a.hit > 0) return "hurt";
    if (a.state === "recover") return "recover";
    return a.moving ? "float" : "idle";
  }
  if (kind === "vine" && a.spitTime > 0) return "bite";
  if(kind==='golem'&&a.state==='rocklift')return 'grab';
  if (["fire_elemental", "water_elemental"].includes(kind)) {
    if (a.animationAction)
      return a.animationAction === "attack" ? "cast" : a.animationAction;
    if (a.fireballsAttack > 0) return "cast";
    if (a.flash > 0) return "hurt";
    return a.moving ? "run" : "idle";
  }
  if (a.animationAction)
    return a.animationAction === "attack" && kind === "dragon"
      ? "breath"
      : a.animationAction === "run"
        ? kind === "snake"
          ? "slither"
          : kind === "golem"
            ? "walk"
            : kind === "vine"
              ? "idle"
              : a.animationAction
        : a.animationAction;
  if (kind === "trap")
    return a.triggered ? "snap" : a.age < 0.5 ? "arm" : "idle";
  if (a.state === "snared") return "snared";
  if (
    kind === "dragon" &&
    ["breath", "tailSwipe", "rocklift"].includes(a.state)
  )
    return a.state === "rocklift" ? "windup" : a.state;
  if (a.flash > 0 || a.hit > 0) return "hurt";
  if (kind === "monkey" && a.throwTime > 0) return "throw";
  if (a.state === "windup") return "windup";
  if (a.state === "charge") return kind === "snake" ? "strike" : "run";
  if (a.attack > 0)
    return kind === "vine"
      ? "bite"
      : kind === "golem"
        ? "slam"
        : kind === "monkey"
          ? "punch"
          : "strike";
  if (a.state === "recover") return "recover";
  if (a.moving)
    return kind === "snake"
      ? "slither"
      : kind === "golem"
        ? "walk"
        : kind === "monkey"
          ? "run"
          : kind === "dragon"
            ? "run"
            : "idle";
  return "idle";
}
export function creatureFrame(kind, a, time, model = creatureMotions[kind]) {
  const action = creatureAction(kind, a),
    clip = model.clips[action] || model.clips.idle;
  if (Number.isFinite(a.playerFrame)) return a.playerFrame;
  if (Number.isFinite(a.poseTime)) return a.poseTime * (clip.length - 1);
  if (kind === "trap" && ["snap", "arm"].includes(action))
    return Math.min(7, ((a.age || 0) / 0.5) * 7);
  if (action === "throw") return Math.max(0, 1 - (a.throwTime || 0) / 0.5) * 7;
  if (
    kind === "dragon" &&
    Number.isFinite(a.fireActionTimer) &&
    ["breath", "tailSwipe"].includes(action)
  )
    return (
      Math.max(
        0,
        Math.min(
          1,
          1 - (a.fireActionTimer || 0) / (action === "breath" ? 0.8 : 0.45),
        ),
      ) * 7
    );
  if (["bite", "slam", "punch"].includes(action))
    return Math.max(0, 1 - (a.attack || 0) / 0.34) * 7;
  if (["windup", "strike", "recover"].includes(action))
    return (
      Math.max(
        0,
        Math.min(1, 1 - (a.timer || 0) / (a.motionDuration || 0.65)),
      ) * 7
    );
  if (action === "hurt")
    return Math.max(0, 1 - (a.flash || a.hit || 0) / 0.2) * 7;
  if (["run", "walk", "slither"].includes(action) && a.step !== undefined)
    return (a.step / (0.13 * (kind === "golem" ? 65 : 88))) * 8;
  return time * clip.fps + (a.id || 0) * 0.73;
}
// Scanline rasterization keeps wing and flame edges on the same pixel grid as the rig.
function pixelPolygon(c, points, color) {
  c.fillStyle = color;
  const ys = points.map((p) => p.y);
  for (
    let y = Math.floor(Math.min(...ys));
    y <= Math.ceil(Math.max(...ys));
    y++
  ) {
    const hits = [];
    for (let i = 0; i < points.length; i++) {
      const a = points[i],
        b = points[(i + 1) % points.length];
      if ((a.y <= y && b.y > y) || (b.y <= y && a.y > y))
        hits.push(a.x + ((y - a.y) * (b.x - a.x)) / (b.y - a.y));
    }
    hits.sort((a, b) => a - b);
    for (let i = 0; i + 1 < hits.length; i += 2)
      c.fillRect(
        Math.ceil(hits[i]),
        y,
        Math.max(1, Math.floor(hits[i + 1]) - Math.ceil(hits[i]) + 1),
        1,
      );
  }
}
export function drawCreature(
  c,
  actor,
  time,
  model = creatureMotions[actor.kind || actor.sprite],
  suppliedPose = null,
) {
  // The old lesser rig remains readable for save compatibility; active artwork uses the shared current rig.
  if(model.type==='lesser_beholder')return drawCreature(c,actor,time,creatureMotions.beholder);
  const kind = model.type,
    d = facingIndex(actor.faceX, actor.faceY),
    pose =
      suppliedPose ||
      poseAt(
        model,
        creatureAction(kind, actor),
        creatureFrame(kind, actor, time, model),
      );
  if(kind==='dragon'&&model.motionDonorRevision===1)return drawDragonPixels(c,actor,model,pose,d);
  if (kind === "beholder" || kind === "lesser_beholder")
    return drawBeholder(c, actor, time, model, pose, d);
  if(kind==='monkey'&&actor.jumpHeight>0&&!suppliedPose){for(const name of ['footL','footR','kneeL','kneeR'])pose[name]=[pose[name][0],pose[name][1]+3,pose[name][2]+5];for(const name of ['handL','handR'])pose[name]=[pose[name][0],pose[name][1],pose[name][2]+8];}
  const p = Object.fromEntries(
      Object.entries(pose).map(([n, v]) => [n, projectPoint(v, d)]),
    ),
    pal = model.palette,
    s = model.shape;
  const visible = (n) => model.visibility[n]?.[d] !== false,
    queue = [],
    add = (depth, fn, id) => queue.push({ depth, fn, id });
  const line = (a, b, width, color) => limb(c, p[a], p[b], width, color);
  const ball = (n, r, color) => {
    if (kind === "golem" && !n.startsWith("eye")) {
      c.fillStyle = color;
      c.fillRect(
        Math.round(p[n].x - r),
        Math.round(p[n].y - r),
        Math.ceil(r * 2),
        Math.ceil(r * 2),
      );
      c.fillStyle = pal.light;
      c.fillRect(
        Math.round(p[n].x - r + 1),
        Math.round(p[n].y - r),
        Math.max(1, Math.ceil(r)),
        1,
      );
    } else ellipse(c, p[n].x, p[n].y, r, r, color);
  };
  if (kind === "dragon") {
    const membrane = (root, tip, finger, anchor) => {
      const r = p[root],
        t = p[tip],
        f = p[finger],
        base = p[anchor];
      const mid = { x: (t.x + f.x) / 2, y: (t.y + f.y) / 2 };
      const notch = (a, b) => ({
        x: a.x * 0.4 + b.x * 0.4 + r.x * 0.2,
        y: a.y * 0.4 + b.y * 0.4 + r.y * 0.2,
      });
      const outline = [
        r,
        t,
        notch(t, mid),
        mid,
        notch(mid, f),
        f,
        notch(f, base),
        base,
      ];
      pixelPolygon(c, outline, pal.outline);
      pixelPolygon(
        c,
        outline.map((q) => ({
          x: r.x + (q.x - r.x) * 0.92,
          y: r.y + (q.y - r.y) * 0.92,
        })),
        pal.shade,
      );
      pixelPolygon(c, [r, t, notch(t, mid), mid], "#aa4146");
      limb(c, r, t, 2.5, pal.body);
      limb(c, r, mid, 1.5, pal.light);
      limb(c, r, f, 1.5, pal.body);
      limb(c, t, { x: t.x, y: t.y - 4 }, 1.5, pal.detail);
    };
    for (const side of ["L", "R"]) add(p["wingRoot"+side].depth - 10, () => {
      membrane("wingRoot"+side,"wingTip"+side,"wingFinger"+side,"pelvis");
    }, "Wing " + side);
    add((p.pelvis.depth + p.tailBase.depth) / 2, () => {
      limb(c, p.pelvis, p.tailBase, s.tailWidth + 2, pal.shade);
      limb(c, p.tailBase, p.tailMid, s.tailWidth, pal.body);
      limb(c, p.tailMid, p.tailTip, Math.max(2, s.tailWidth * 0.55), pal.light);
      const t = p.tailTip;
      c.fillStyle = pal.detail;
      c.beginPath();
      c.moveTo(t.x, t.y - 5);
      c.lineTo(t.x + 4, t.y + 1);
      c.lineTo(t.x, t.y + 6);
      c.lineTo(t.x - 4, t.y + 1);
      c.closePath();
      c.fill();
    }, "Tail");
    for (const side of ["L", "R"]) {
      for (const [first, middle, paw] of [
        ["shoulder" + side, "elbow" + side, "frontPaw" + side],
        ["hip" + side, "knee" + side, "rearPaw" + side],
      ]) {
        const depth = (p[first].depth + p[middle].depth + p[paw].depth) / 3;
        add(depth, () => {
          const legColor = depth < p.pelvis.depth ? pal.shade : pal.body;
          limb(c, p[first], p[middle], s.limbWidth + 1, pal.outline);
          limb(c, p[middle], p[paw], s.limbWidth + 1, pal.outline);
          limb(c, p[first], p[middle], s.limbWidth, legColor);
          limb(c, p[middle], p[paw], s.limbWidth, pal.light);
          ellipse(c, p[paw].x, p[paw].y, 3, 2, pal.face);
          c.fillStyle = pal.detail;
          c.fillRect(Math.round(p[paw].x + 2), Math.round(p[paw].y), 2, 1);
        }, paw);
      }
    }
    add((p.pelvis.depth + p.chest.depth) / 2, () => {
      limb(c, p.pelvis, p.chest, s.bodyWidth * 2.45, pal.outline);
      limb(c, p.pelvis, p.chest, s.bodyWidth * 2.05, pal.body);
      limb(
        c,
        { x: p.pelvis.x - 1, y: p.pelvis.y - 1 },
        { x: p.chest.x - 1, y: p.chest.y - 1 },
        s.bodyWidth * 0.95,
        pal.light,
      );
      limb(c, p.chest, p.neck, 12, pal.outline);
      limb(c, p.chest, p.neck, 9, pal.body);
      for (let n = 0; n < 4; n++) {
        const t = (n + 1) / 5,
          x = p.pelvis.x + (p.chest.x - p.pelvis.x) * t,
          y = p.pelvis.y + (p.chest.y - p.pelvis.y) * t;
        c.fillStyle = n % 2 ? pal.detail : "#f1b760";
        c.fillRect(Math.round(x - 3), Math.round(y - 1), 6, 2);
      }
    }, "Body");
    add(p.chest.depth + 0.1, () => {
      for (const [start, end] of [
        ["tailMid", "tailBase"],
        ["tailBase", "pelvis"],
        ["pelvis", "chest"],
        ["chest", "neck"],
      ]) {
        for (const t of [0.25, 0.75]) {
          const a = p[start],
            b = p[end],
            x = a.x + (b.x - a.x) * t,
            y = a.y + (b.y - a.y) * t;
          pixelPolygon(
            c,
            [
              { x: x - 2, y },
              { x: x + 1, y: y - 5 },
              { x: x + 3, y: y + 1 },
            ],
            pal.detail,
          );
        }
      }
    }, "Neck");
    add(p.head.depth, () => {
      limb(c, p.neck, p.head, 8, pal.outline);
      limb(c, p.neck, p.head, 6, pal.body);
      ellipse(c, p.head.x, p.head.y, 7, 6, pal.outline);
      ellipse(c, p.head.x, p.head.y, 6, 5, pal.face);
      limb(c, p.head, p.snout, 6, pal.body);
      ellipse(c, p.snout.x, p.snout.y, 6, 3.2, pal.light);
      limb(c, p.head, p.jaw, 3, pal.shade);
      for (const side of ["L", "R"]) {
        const horn = p["horn" + side],
          tip = p["hornTip" + side];
        limb(c, horn, tip, 3.5, pal.outline);
        limb(c, horn, tip, 2, pal.detail);
        if (visible("eye" + side)) {
          ellipse(
            c,
            p["eye" + side].x,
            p["eye" + side].y,
            2.1,
            1.6,
            pal.outline,
          );
          c.fillStyle = pal.eye;
          c.fillRect(
            Math.round(p["eye" + side].x),
            Math.round(p["eye" + side].y),
            2,
            2,
          );
          c.fillStyle = pal.outline;
          c.fillRect(
            Math.round(p["eye" + side].x + 1),
            Math.round(p["eye" + side].y),
            1,
            2,
          );
        }
      }
      c.fillStyle = pal.outline;
      c.fillRect(Math.round(p.snout.x - 3), Math.round(p.snout.y - 1), 2, 1);
      c.fillRect(Math.round(p.snout.x + 2), Math.round(p.snout.y - 1), 2, 1);
      c.fillStyle = pal.detail;
      c.fillRect(Math.round(p.jaw.x - 2), Math.round(p.jaw.y), 1, 2);
      c.fillRect(Math.round(p.jaw.x + 2), Math.round(p.jaw.y), 1, 2);
      if (["breath", "attack"].includes(creatureAction(kind, actor))) {
        ellipse(
          c,
          p.snout.x + actor.faceX * 4,
          p.snout.y + actor.faceY * 4,
          4,
          3,
          "#ff7b35",
        );
        ellipse(
          c,
          p.snout.x + actor.faceX * 5,
          p.snout.y + actor.faceY * 5,
          2,
          1.5,
          "#ffe17b",
        );
      }
    }, "Head");
    paintLayers(queue, model, d, c, p);
    return p;
  } else if (["fire_elemental", "water_elemental"].includes(kind)) {
    const phase = creatureFrame(kind, actor, time, model) * 0.78;
    const flame = (base, tip, width) => {
      const height = base.y - tip.y;
      for (const [scale, color] of [
        [1, pal.shade],
        [0.78, pal.body],
        [0.5, pal.light],
        [0.24, pal.detail],
      ]) {
        const w = width * scale;
        pixelPolygon(
          c,
          [
            { x: base.x - w, y: base.y },
            { x: base.x - w, y: base.y - height * 0.35 },
            { x: base.x - w * 0.8, y: base.y - height * 0.7 * scale },
            { x: base.x - w * 0.25, y: base.y - height * 0.45 * scale },
            {
              x: base.x + (tip.x - base.x) * scale,
              y: base.y - height * scale,
            },
            { x: base.x + w * 0.5, y: base.y - height * 0.4 * scale },
            { x: base.x + w, y: base.y - height * 0.55 * scale },
            { x: base.x + w, y: base.y - height * 0.1 },
          ],
          color,
        );
        ellipse(c, base.x, base.y, w, w * 0.5, color);
      }
    };
    for (const side of ["L", "R"]) {
      const foot = p["foot" + side],
        hand = p["hand" + side],
        elbow = p["elbow" + side];
      add(foot.depth, () => {
        limb(c, p["hip" + side], p["knee" + side], 5, pal.body);
        limb(c, p["knee" + side], foot, 4, pal.light);
        flame(foot, { x: foot.x + Math.sin(phase) * 3, y: foot.y - 12 }, 4);
      });
      add(hand.depth, () => {
        limb(c, p["shoulder" + side], elbow, 6, pal.shade);
        limb(c, elbow, hand, 4, pal.body);
        limb(c, elbow, hand, 2, pal.light);
        flame(hand, { x: hand.x + Math.sin(phase + 1) * 3, y: hand.y - 13 }, 5);
      });
    }
    add(p.chest.depth, () => {
      const crown = p.flameCrown || p.crest;
      flame(p.pelvis, crown, 11);
      flame({ x: p.chest.x - 7, y: p.chest.y + 3 }, p.flameL || { x: p.chest.x - 10, y: p.chest.y - 10 }, 5);
      flame({ x: p.chest.x + 7, y: p.chest.y + 3 }, p.flameR || { x: p.chest.x + 10, y: p.chest.y - 10 }, 5);
      flame({ x: p.head.x, y: p.head.y + 3 }, crown, 7);
      for (const side of ["L", "R"])
        if (visible("eye" + side)) {
          const eye = p["eye" + side];
          c.fillStyle = pal.outline;
          c.fillRect(Math.round(eye.x) - 2, Math.round(eye.y) - 1, 4, 3);
          c.fillStyle = pal.eye;
          c.fillRect(Math.round(eye.x) - 1, Math.round(eye.y), 2, 1);
        }
    });
    paintLayers(queue, model, d, c, p);
    for (let i = 0; i < 5; i++) {
      const rise = (((phase * 3 + i * 7) % 27) + 27) % 27;
      c.fillStyle = i % 2 ? pal.light : pal.body;
      c.fillRect(
        Math.round(p.head.x + Math.sin(i * 3 + phase) * 12),
        Math.round(p.head.y - 7 - rise),
        1 + (i % 2),
        2,
      );
    }
    return p;
  } else if (kind === "snake") {
    const chain = [
      "head",
      "neck",
      "pelvis",
      ...Array.from({ length: 8 }, (_, i) => "segment" + i),
      "tailTip",
    ];
    for (let i = 1; i < chain.length; i++) {
      const a = chain[i - 1],
        b = chain[i],
        w = Math.max(1, s.bodyWidth * (1 - i / (chain.length + 1)));
      add((p[a].depth + p[b].depth) / 2, () => {
        line(a, b, w, pal.body);
        ball(b, Math.max(0.5, w * 0.3), pal.light);
      });
    }
    add(p.head.depth + 0.01, () => {
      ball("head", s.headRadius, pal.body);
      line("head", "jaw", 3, pal.face);
      if (visible("tongue")) line("jaw", "tongue", 1, "#de6e71");
    });
  } else if (kind === "vine") {
    add(-100, () => {
      ellipse(
        c,
        p.pelvis.x,
        p.pelvis.y,
        s.bodyWidth * 1.5,
        s.bodyWidth * 0.625,
        pal.shade,
      );
      ellipse(
        c,
        p.pelvis.x,
        p.pelvis.y - 1,
        s.bodyWidth * 1.125,
        s.bodyWidth * 0.375,
        pal.body,
      );
    });
    for (const [a, b] of [
      ["pelvis", "stem1"],
      ["stem1", "stem2"],
      ["stem2", "neck"],
      ["neck", "head"],
      ["stem1", "leafL"],
      ["stem1", "leafR"],
    ])
      add((p[a].depth + p[b].depth) / 2, () =>
        line(
          a,
          b,
          a === "stem1" && b.startsWith("leaf") ? 6 : s.limbWidth + 1,
          pal.body,
        ),
      );
    add(p.head.depth, () => {
      ellipse(c, p.head.x, p.head.y, s.headRadius, s.headRadius, pal.face);
      ellipse(
        c,
        p.head.x,
        p.head.y,
        s.headRadius * 0.83,
        s.headRadius * 0.62,
        pal.outline,
      );
      for (const n of ["jawTop", "jawBottom"]) {
        ellipse(c, p[n].x, p[n].y, s.headRadius, s.headRadius * 0.48, pal.face);
        const edge = n === "jawTop" ? 1 : -1;
        for (let x = -6; x <= 6; x += 4)
          ((c.fillStyle = pal.detail),
            c.fillRect(
              Math.round(p[n].x + x),
              Math.round(p[n].y + edge * 2),
              2,
              3,
            ));
        ellipse(c, p[n].x - 3, p[n].y - 1, 1.5, 1, pal.detail);
      }
    });
  } else if (kind === "trap") {
    ellipse(
      c,
      p.pelvis.x,
      p.pelvis.y,
      s.baseRadius,
      s.baseRadius * 0.5,
      pal.shade,
    );
    ellipse(
      c,
      p.trigger.x,
      p.trigger.y,
      s.triggerRadius,
      s.triggerRadius * 0.6,
      pal.face,
    );
    for (const side of ["L", "R"]) {
      const a = p["jaw" + side],
        h = p["hinge" + side];
      limb(c, h, a, s.jawWidth, pal.body);
      ellipse(c, a.x, a.y, s.jawWidth, s.jawLength, pal.light);
      for (let y = -6; y <= 6; y += 4)
        ((c.fillStyle = pal.detail),
          c.fillRect(
            Math.round(a.x + (side === "L" ? 1 : -3)),
            Math.round(a.y + y),
            3,
            2,
          ));
    }
  } else {
    if (kind === "monkey")
      for (const [a, b] of [
        ["pelvis", "tailBase"],
        ["tailBase", "tailMid"],
        ["tailMid", "tailTip"],
      ])
        add((p[a].depth + p[b].depth) / 2, () =>
          line(a, b, s.tailWidth, pal.body),
        );
    for (const side of ["L", "R"])
      for (const chain of [
        ["shoulder", "elbow", "hand"],
        ["hip", "knee", "foot"],
      ]) {
        const [a, b, end] = chain.map((n) => n + side);
        add((p[a].depth + p[end].depth) / 2, () => {
          if(kind==='golem')line(a,end,s.limbWidth+2,pal.outline);
          line(a, b, s.limbWidth, pal.shade);
          line(b, end, s.limbWidth, pal.body);
          ball(
            end,
            s.limbWidth * 0.65,
            kind === "monkey" ? pal.face : pal.light,
          );
        });
      }
    add(p.chest.depth, () => {
      line("pelvis", "chest", s.bodyWidth, pal.body);
      if (kind === "golem") {
        const x=p.chest.x,y=p.chest.y;
        pixelPolygon(c,[{x:x-10,y:y-8},{x:x+8,y:y-7},{x:x+12,y:y+1},{x:x+7,y:y+10},{x:x-9,y:y+9},{x:x-13,y:y+1}],pal.outline);
        pixelPolygon(c,[{x:x-8,y:y-7},{x:x+7,y:y-6},{x:x+10,y:y+1},{x:x+5,y:y+8},{x:x-8,y:y+7},{x:x-10,y:y+1}],pal.body);
        c.fillStyle=pal.light;c.fillRect(Math.round(x-7),Math.round(y-6),8,2);c.fillRect(Math.round(x-10),Math.round(y-3),2,5);
        c.fillStyle=pal.shade;c.fillRect(Math.round(x+4),Math.round(y+2),5,4);c.fillRect(Math.round(x-3),Math.round(y+4),5,2);
        c.fillStyle=pal.detail;c.fillRect(Math.round(x-1),Math.round(y-2),3,2);c.fillRect(Math.round(x+1),Math.round(y),2,2);
      }
    });
    add(p.head.depth, () => {
      for (const n of ["earL", "earR"])
        if (visible(n)) ball(n, kind === "monkey" ? 3 : 2, pal.face);
      ball("head", s.headRadius, pal.body);
      if(kind==='golem'){
        const h=p.head;c.fillStyle=pal.outline;c.fillRect(Math.round(h.x-7),Math.round(h.y-5),14,11);
        c.fillStyle=pal.face;c.fillRect(Math.round(h.x-6),Math.round(h.y-5),12,9);
        c.fillStyle=pal.light;c.fillRect(Math.round(h.x-5),Math.round(h.y-4),7,2);c.fillRect(Math.round(h.x-6),Math.round(h.y-2),2,3);
        c.fillStyle=pal.shade;c.fillRect(Math.round(h.x+3),Math.round(h.y+1),3,3);
      }
      if (!(d >= 3 && d <= 5) && visible("muzzle")) {
        ball("muzzle", kind === "monkey" ? 3.5 : 3, pal.face);
      }
    });
    if (
      kind === "monkey" &&
      creatureAction(kind, actor) === "throw" &&
      creatureFrame(kind, actor, time, model) < 3
    )
      add(100, () => {
        const h = p.handR;
        limb(
          c,
          { x: h.x - 2, y: h.y - 2 },
          { x: h.x + 2, y: h.y - 3 },
          2,
          "#edd66b",
        );
      });
  }
  for (const n of ["eyeL", "eyeR"])
    if (p[n] && visible(n))
      add(p.head.depth + 1, () => {
        ball(n, kind === "golem" ? 1.7 : 1, pal.eye);
      });
  paintLayers(queue, model, d, c, p);
  return p;
}

function drawBeholder(c, actor, time, model, pose, d) {
  const p = Object.fromEntries(Object.entries(pose).map(([n, v]) => [n, projectPoint(v, d)]));
  const pal = {...model.palette, ...(actor.beholderPalette || {})};
  const s = model.shape || {}, action = creatureAction(model.type, actor);
  const body=p.body,eye=p.eye;
  if(model.type==='beholder'){
    // Near stalks turn across the face; they do not stay pinned to the silhouette.
    // Authored joint/pose deltas still move each editable root and eye handle.
    const fronts=[[-8,-6,-15,-19],[-11,0,-23,-1],[-8,7,-20,12],[8,-6,15,-19],[11,0,23,-1],[8,7,20,12],[0,-10,0,-25]];
    const diagonals=[[-10,-5,-20,-15],[-11,1,-25,1],[-7,8,-19,14],[6,-7,8,-17],[11,-1,12,0],[7,7,10,16],[-1,-10,-3,-26]];
    const profiles=[[-7,-8,-16,-20],[-11,-1,-24,-4],[-7,7,-18,13],[-2,-8,-6,-18],[-7,0,-10,0],[-3,8,-6,17],[0,-11,0,-27]];
    const rearDiagonals=[[-9,-6,-18,-19],[-11,1,-24,2],[-7,7,-17,15],[-8,-7,-10,-11],[-11,0,-13,2],[-7,8,-11,13],[0,-11,2,-26]];
    const rear=[[-8,-7,-17,-20],[-11,0,-24,-2],[-8,7,-20,13],[8,-7,17,-20],[11,0,24,-2],[8,7,20,13],[0,-11,0,-26]];
    const view=d===0?fronts:d===4?rear:d===2||d===6?profiles:d===1||d===7?diagonals:rearDiagonals;
    for(let i=0;i<7;i++)for(const [suffix,start]of [['',0],['Tip',2]]){
      const name=`stalk${i}${suffix}`,rest=skeletons.beholder[name];if(!p[name]||!rest)continue;
      const base=projectPoint(rest.slice(1),d),mirror=d>=5?-1:1;
      p[name]={...p[name],x:body.x+view[i][start]*mirror+p[name].x-base.x,y:body.y+view[i][start+1]+p[name].y-base.y};
    }
  }
  const beam = action === "attack" && actor.hp > 0;
  const radius = model.type === "lesser_beholder" ? 9 : 12;
  const limbEye = (base, tip, scale = 1, index = 0, part = 'all') => {
    // Curved, tapered flesh stems; endpoints remain the editable rig handles.
    const root=p[base],end=p[tip],dx=end.x-root.x,dy=end.y-root.y,length=Math.hypot(dx,dy)||1;
    const bend=(index%2?-1:1)*(3+Math.sin(time*.9+index*1.7)*.65)*scale;
    const nx=-dy/length,ny=dx/length;
    if(model.type==='lesser_beholder'&&part!=='eye'){limb(c,root,end,3.5*scale,pal.outline);limb(c,root,end,2.2*scale,pal.shade);}
    else if(part!=='eye')for(const [color,width] of [[pal.outline,3.6],[pal.body,2.2]]){
      c.fillStyle=color;
      for(let j=0;j<=24;j++){
        const t=j/24,curve=Math.sin(t*Math.PI)*(index%3===0?Math.cos(t*Math.PI):1)*bend;
        const x=root.x+dx*t+nx*curve,y=root.y+dy*t+ny*curve;
        const size=(width*(1-t*.3))*scale;
        c.fillRect(Math.round(x-size/2),Math.round(y-size/2),Math.max(1,Math.ceil(size)),Math.max(1,Math.ceil(size)));
      }
    }
    if(part==='stem')return;
    const bulb=model.type==='lesser_beholder'?3.2:4.3,inner=model.type==='lesser_beholder'?2.2:3.2;
    ellipse(c,p[tip].x,p[tip].y,bulb*scale,bulb*scale,pal.outline);
    const back=model.type==='beholder'&&d>=3&&d<=5;
    ellipse(c,p[tip].x,p[tip].y,inner*scale,inner*scale,back?pal.body:pal.face);
    if(back){ellipse(c,p[tip].x-scale,p[tip].y-scale,1.6*scale,1.2*scale,pal.light);return;}
    const idle=action==='idle',phase=time*.78+index*2.13;
    const blink=idle?Math.pow(Math.max(0,Math.cos(phase)),34):0;
    if(blink>.22){
      c.fillStyle=pal.face;c.fillRect(Math.round(p[tip].x-2*scale),Math.round(p[tip].y-.7*scale),Math.ceil(4*scale),Math.max(1,Math.ceil(1.4*scale)));
      c.fillStyle=pal.outline;c.fillRect(Math.round(p[tip].x-2*scale),Math.round(p[tip].y-.7*scale),Math.ceil(4*scale),1);
    }else{
      const gx=(model.type==='beholder'?(d===1||d===2?-1:d===6||d===7?1:0)*scale:0)+(idle?Math.round(Math.sin(time*.63+index*1.71)*scale):0);
      const gy=idle?Math.round(Math.cos(time*.51+index*2.27)*scale*.55):0;
      c.fillStyle=pal.outline;
      c.fillRect(Math.round(p[tip].x-.7*scale+gx),Math.round(p[tip].y-1.7*scale+gy),Math.max(1,Math.ceil(1.5*scale)),Math.ceil(3.5*scale));
      c.fillStyle=pal.detail;
      c.fillRect(Math.round(p[tip].x-1.5*scale+gx),Math.round(p[tip].y-1.5*scale+gy),Math.max(1,Math.ceil(scale)),Math.max(1,Math.ceil(scale)));
    }
  };
  const queue=[],add=(depth,fn,id,bones)=>queue.push({depth,fn,id,bones});
  const faceVisible=model.type==='lesser_beholder'||!(d>=3&&d<=5),eyeWidth=model.type==='lesser_beholder'?7:d===2||d===6?2.8:d===1||d===7?5.6:7;
  const ray=()=>{
    const fx=actor.faceX??0,fy=actor.faceY??1,len=Math.hypot(fx,fy)||1,dx=fx/len,dy=fy/len;
    c.save();c.globalAlpha=.8;c.strokeStyle=pal.detail;c.lineWidth=5;
    c.beginPath();c.moveTo(eye.x,eye.y);c.lineTo(eye.x+dx*58,eye.y+dy*58);c.stroke();
    c.globalAlpha=1;c.strokeStyle='#c15cff';c.lineWidth=2;
    c.beginPath();c.moveTo(eye.x,eye.y);c.lineTo(eye.x+dx*58,eye.y+dy*58);c.stroke();c.restore();
  };
  if(beam)add(body.depth+(faceVisible?100:-100),ray,'Eye ray',['eye']);
  for(let i=0;i<7;i++){
    const base=`stalk${i}`,tip=base+'Tip';if(!p[base]||!p[tip])continue;
    const scale=model.type==='lesser_beholder'?.8:1;
    // Profile/rear roots grow from the far crown, as in the authored turn
    // reference. The orb masks their overlapping portions, including tips.
    const behindOrb=model.type==='beholder'&&d>=2&&d<=6;
    const depth=(p[base].depth+p[tip].depth)/2,eyeDepth=p[tip].depth;
    if(model.type==='lesser_beholder'){add(depth,()=>limbEye(base,tip,scale,i),`Stalk ${i}`,[base,tip]);continue;}
    const far=behindOrb||depth<body.depth;
    // Bulbs cap the stems rather than being painted underneath their own tips.
    add(body.depth+(far?-60:10)+depth*.1,()=>limbEye(base,tip,scale,i,'stem'),`Stalk ${i} / stem`,[base,tip]);
    add(body.depth+(far?-20:30)+eyeDepth*.1,()=>limbEye(base,tip,scale,i,'eye'),`Stalk ${i} / eye`,[tip]);
  }
  add(body.depth,()=>{
  const bodyY=model.type==='lesser_beholder'?radius*.86:radius;
  ellipse(c,body.x,body.y+(model.type==='lesser_beholder'?2:0),radius+2,bodyY+2,pal.outline);
  ellipse(c,body.x,body.y,radius,bodyY,pal.body);
  ellipse(c, body.x - 2, body.y - 3, radius * .7, radius * .38, pal.light);
  },'Orb',['body']);
  add(body.depth+50,()=>{
  if(faceVisible){
  ellipse(c,eye.x,eye.y,eyeWidth,7,pal.outline);
  ellipse(c,eye.x,eye.y,Math.max(1.6,eyeWidth-1.2),5.8,pal.face);
  const centralPhase=time*.78+9.1,centralBlink=action==='idle'?Math.pow(Math.max(0,Math.cos(centralPhase)),34):0;
  if(centralBlink>.22){c.fillStyle=pal.face;c.fillRect(Math.round(eye.x-4),Math.round(eye.y-1),8,2);c.fillStyle=pal.outline;c.fillRect(Math.round(eye.x-4),Math.round(eye.y-1),8,1);}
  else{
    const gx=action==='idle'?Math.round(Math.sin(time*.63+4.6)*1.5):0,gy=action==='idle'?Math.round(Math.cos(time*.51+3.7)):0;
    c.fillStyle=pal.outline;c.fillRect(Math.round(eye.x-1.5+gx),Math.round(eye.y-4+gy),3,8);
    c.fillStyle=pal.detail;c.fillRect(Math.round(eye.x-2.5+gx),Math.round(eye.y-2.5+gy),2,2);
  }
  }
  if(faceVisible){
  c.fillStyle = pal.outline;
  c.beginPath(); c.arc(body.x+(model.type==='beholder'?(d===2?-6:d===6?6:0):0), body.y + 7, model.type==='beholder'&&(d===2||d===6)?3:5, 0, Math.PI); c.fill();
  c.fillStyle = pal.detail;
  c.fillRect(Math.round(body.x - 3), Math.round(body.y + 7), 2, 2);
  c.fillRect(Math.round(body.x + 1), Math.round(body.y + 7), 2, 2);
  }
  },'Main eye and mouth',['eye','body']);
  paintLayers(queue,model,d,c,p,true);
  if (action === "hurt") {
    c.strokeStyle = "#fff0c4"; c.lineWidth = 2;
    c.beginPath(); c.moveTo(body.x - 7, body.y - 7); c.lineTo(body.x + 7, body.y + 7); c.moveTo(body.x + 7, body.y - 7); c.lineTo(body.x - 7, body.y + 7); c.stroke();
  }
  return p;
}
export const creatureRigLabels = labels;
