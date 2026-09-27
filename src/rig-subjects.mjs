import {wolfMotion, defaultWolfMotion, replaceWolfMotion, drawWolf} from './wolf-motion.mjs';
import {
  BEAST_KINDS,
  beastMotions,
  defaultBeastMotion,
  replaceBeastMotion,
  drawBeast,
} from "./beast-motion.mjs";
import {
  alligatorMotion,
  defaultAlligatorMotion,
  replaceAlligatorMotion,
  drawAlligator,
} from "./alligator-motion.mjs";
import {
  SKELETON_KINDS,
  skeletonMotions,
  defaultSkeletonMotion,
  replaceSkeletonMotion,
  drawSkeleton,
} from "./skeleton-motion.mjs";
import {
  playerMotion,
  defaultPlayerMotion,
  replacePlayerMotion,
  drawPlayer,
} from "./player-motion.mjs";
import {
  rhinoMotion,
  defaultRhinoMotion,
  replaceRhinoMotion,
  drawRhino,
} from "./rhino-motion.mjs";
import {
  lionMotion,
  defaultLionMotion,
  replaceLionMotion,
  drawLion,
} from "./lion-motion.mjs";
import {
  batMotion,
  defaultBatMotion,
  replaceBatMotion,
  drawBat,
} from "./bat-motion.mjs";
import {
  creatureMotions,
  defaultCreatureMotion,
  replaceCreatureMotion,
  drawCreature,
  creatureRigLabels,
} from "./creature-motion.mjs";
export const RIG_SUBJECTS = {
  ...Object.fromEntries(
    BEAST_KINDS.map((kind) => [
      kind,
      {
        name:
          ['beetle','spider'].includes(kind)
            ? kind==='spider'?'Spider / eight legs':"Beetle / six legs"
            : kind[0].toUpperCase() + kind.slice(1) + " / quadruped",
        data: beastMotions[kind],
        defaults: () => defaultBeastMotion(kind),
        replace: (m) => replaceBeastMotion(kind, m),
        draw: drawBeast,
        sprite: kind,
        selected: kind === "beetle" ? "antennaL" : "head",
        palette: Object.keys(beastMotions[kind].palette),
        tracks:
          ['beetle','spider'].includes(kind)
            ? ["foot0L", "foot1R", "foot2L", kind==='spider'?'foot3R':"antennaL"]
            : ["frontPawL", "frontPawR", "rearPawL", "rearPawR", "tailTip"],
        clip: "run",
        scale: 6,
      },
    ]),
  ),
  crocodile: {
    name: "Alligator / quadruped",
    data: alligatorMotion,
    defaults: defaultAlligatorMotion,
    replace: replaceAlligatorMotion,
    draw: drawAlligator,
    sprite: "crocodile",
    selected: "tailMid",
    palette: ["body", "shade", "light", "mouth"],
    tracks: ["frontPawL", "frontPawR", "rearPawL", "rearPawR", "tailTip"],
    clip: "run",
    scale: 5,
  },
  ...Object.fromEntries(
    SKELETON_KINDS.map((kind) => [
      kind,
      {
        name: {
          skeleton: "Skeleton / sword",
          archer: "Skeleton / archer",
          skeleton_unarmed: "Skeleton / unarmed",
          skeleton_boss: "Skeleton / horned boss",
          frost_skeleton_mage: "Frost skeletal mage",
        }[kind],
        data: skeletonMotions[kind],
        defaults: () => defaultSkeletonMotion(kind),
        replace: (m) => replaceSkeletonMotion(kind, m),
        draw: drawSkeleton,
        sprite: kind,
        selected: "handR",
        palette: ["head", "headShade", "body", "bodyShade", "arms", "armShade", "legs", "legShade"],
        tracks: ["handL", "handR", "footL", "footR"],
        clip: "run",
      },
    ]),
  ),
  rhino: {
    name: "Rhino / quadruped",
    data: rhinoMotion,
    defaults: defaultRhinoMotion,
    replace: replaceRhinoMotion,
    draw: drawRhino,
    sprite: "rhino",
    selected: "hornTip",
    palette: ["body", "shade", "face", "horn"],
    tracks: ["frontPawL", "frontPawR", "rearPawL", "rearPawR", "hornTip"],
    clip: "run",
    scale: 6,
  },
  player: {
    name: "Player / humanoid",
    data: playerMotion,
    defaults: defaultPlayerMotion,
    replace: replacePlayerMotion,
    draw: drawPlayer,
    sprite: "explorer-teal",
    selected: "handR",
    palette: ["head", "body", "arms", "legs"],
    tracks: ["handL", "handR", "footL", "footR"],
    clip: "run",
  },
  lion: {
    name: "Lion / quadruped",
    data: lionMotion,
    defaults: defaultLionMotion,
    replace: replaceLionMotion,
    draw: drawLion,
    sprite: "lion",
    selected: "frontPawR",
    palette: ["head", "body", "mane", "legs", "tail"],
    tracks: ["frontPawL", "frontPawR", "rearPawL", "rearPawR", "tailTip"],
    clip: "run",
  },
  wolf: {
    name: "Wolf / quadruped",
    data: wolfMotion,
    defaults: defaultWolfMotion,
    replace: replaceWolfMotion,
    draw: drawWolf,
    sprite: "wolf",
    selected: "frontPawR",
    palette: ["head", "body", "cream", "legs", "tail"],
    tracks: ["frontPawL", "frontPawR", "rearPawL", "rearPawR", "tailTip"],
    clip: "run",
  },
  bat: {
    scale: 5,
    name: "Bat / flying",
    data: batMotion,
    defaults: defaultBatMotion,
    replace: replaceBatMotion,
    draw: drawBat,
    sprite: "bat",
    selected: "wristR",
    palette: ["body", "head", "wing", "eyes"],
    tracks: ["wristL", "wristR", "wingTipL", "wingTipR"],
    clip: "fly",
  },
  ...Object.fromEntries(
    Object.entries(creatureMotions).map(([kind, data]) => [
      kind,
      {
        name: creatureRigLabels[kind],
        scale:
          kind === "dragon" ? 3 : kind === "fire_elemental" ? 5 : undefined,
        data,
        defaults: () => defaultCreatureMotion(kind),
        replace: (m) => replaceCreatureMotion(kind, m),
        draw: drawCreature,
        sprite: kind,
        selected: {
          fire_elemental: "flameCrown",
          water_elemental: "crest",
          dragon: "head",
          snake: "head",
          monkey: "handR",
          golem: "handR",
          vine: "jawTop",
          trap: "jawL",
        }[kind],
        palette: ["body", "shade", "face", "detail"],
        shapeKeys:
          kind === "snake"
            ? ["bodyWidth", "headRadius"]
            : kind === "golem" || kind === "vine"
              ? ["bodyWidth", "headRadius", "limbWidth"]
              : null,
        tracks: {
          fire_elemental: [
            "head",
            "handL",
            "handR",
            "footL",
            "footR",
            "flameCrown",
          ],
          water_elemental: ["head", "handL", "handR", "footL", "footR", "crest"],
          dragon: ["wingTipL", "wingTipR", "frontPawL", "frontPawR", "tailTip"],
          snake: ["segment2", "segment5", "tailTip", "jaw"],
          monkey: ["handL", "handR", "footL", "footR", "tailTip"],
          golem: ["handL", "handR", "footL", "footR"],
          vine: ["stem1", "stem2", "jawTop", "jawBottom"],
          trap: ["trigger", "hingeL", "jawL", "jawR"],
        }[kind],
        clip: {
          fire_elemental: "run",
          water_elemental: "idle",
          dragon: "run",
          snake: "slither",
          monkey: "run",
          golem: "walk",
          vine: "idle",
          trap: "snap",
        }[kind],
      },
    ]),
  ),
};
RIG_SUBJECTS.tiger={...RIG_SUBJECTS.lion,name:"Tiger / lion rig",sprite:"tiger",draw:(c,a,t,m,p)=>drawLion(c,{...a,skin:"tiger"},t,m,p)};
RIG_SUBJECTS.tsetse={...RIG_SUBJECTS.bat,name:"Tsetse fly / winged rig",sprite:"bat"};
export const rigSubject = (name) =>
  RIG_SUBJECTS[name?.startsWith("explorer") ? "player" : name==='baby_spider'?'spider':name==='tsetse'?'tsetse':name];
