// Exact NPC 49877 -> display 36758 -> human female 2 -> M2 1000764 / SKEL 2137789.
// Reads only skeletal movement. No donor mesh or texture is shipped.
const fs = require("node:fs"),
  path = require("node:path"),
  crypto = require("node:crypto");
const { loadM2 } = require("./lib/wow-m2.cjs");
const root = path.resolve(__dirname, ".."),
  input = process.argv[2];
if (!input)
  throw Error(
    "Usage: node scripts/import-oathless-captain.cjs <human-female-1000764.m2> [--force]",
  );
const output = path.join(root, "src/oathless-captain-data.mjs");
if (fs.existsSync(output) && !process.argv.includes("--force"))
  throw Error("Captain output already exists; review before --force");
const source = loadM2(input),
  scale = 18,
  ground = 0.027;
const map = {
  pelvis: [2, ""],
  spine: [9, "pelvis"],
  chest: [16, "spine"],
  neck: [32, "chest"],
  head: [42, "neck", [-0.025, 0, 1.78]],
  shoulderL: [29, "chest"],
  elbowL: [37, "shoulderL"],
  handL: [43, "elbowL"],
  shoulderR: [30, "chest"],
  elbowR: [39, "shoulderR"],
  handR: [49, "elbowR"],
  hipL: [8, "pelvis"],
  kneeL: [14, "hipL"],
  footL: [28, "kneeL"],
  toeL: [34, "footL"],
  hipR: [6, "pelvis"],
  kneeR: [13, "hipR"],
  footR: [27, "kneeR"],
  toeR: [33, "footR"],
  swordGrip: [193, "handR", [0, 0, 0]],
  swordTip: [193, "swordGrip", [0.78, 0, 0]],
  shieldGrip: [188, "handL", [0, 0, 0]],
  shieldTop: [188, "shieldGrip", [0, 0, 0.38]],
  eyeL: [42, "head", [0.23, 0.125, 1.82]],
  eyeR: [42, "head", [0.23, -0.125, 1.82]],
  earL: [42, "head", [-0.02, 0.285, 1.78]],
  earR: [42, "head", [-0.02, -0.285, 1.78]],
  nose: [42, "head", [0.285, 0, 1.69]],
  mouth: [42, "head", [0.24, 0, 1.59]],
  hair: [42, "head", [-0.13, 0, 1.845]],
  headUp: [42, "head", [-0.025, 0, 2.08]],
  headFront: [42, "head", [0.275, 0, 1.78]],
  tabard: [4, "pelvis"],
  tabardEnd: [17, "tabard"],
};
const restRoot = source.sample(null, 0).positions[0];
function positions(sample) {
  const delta = sample.positions[0].map((v, i) => v - restRoot[i]);
  return Object.fromEntries(
    Object.entries(map).map(([n, [i, , anchor]]) => {
      const p = anchor
        ? source.point(sample.matrices[i], anchor)
        : sample.positions[i];
      return [
        n,
        [
          -(p[1] - delta[1]) * scale,
          (p[0] - delta[0]) * scale,
          (p[2] - ground) * scale,
        ],
      ];
    }),
  );
}
const rest = positions(source.sample(null, 0)),
  clips = {},
  provenance = {};
// Explicit useful subset; no claim that the viewer's hundreds of labels are distinct.
const selected = {
  idle: 0,
  walk: 1,
  run: 2,
  guard: 6,
  hurt: 7,
  slash: 8,
  parry: 9,
  block: 32,
  death: 34,
  thrust: 46,
  dodge: 29,
  strafe_left: 52,
  strafe_right: 53,
  salute: 86,
  jump: 88,
  jump_start: 90,
  land: 91,
  kneel_down: 57,
  kneel_up: 59,
  kneel: 95,
  battle_cry: 102,
  swim: 116,
  swim_idle: 30,
  swim_left: 134,
  swim_right: 135,
  walk_backwards: 142,
  talk: 138,
  heavy_slash: 224,
  charge_end: 238,
  charge: 239,
  shield_bash: 259,
};
const looping = new Set([
  "idle",
  "walk",
  "run",
  "guard",
  "strafe_left",
  "strafe_right",
  "jump",
  "kneel",
  "swim",
  "swim_idle",
  "swim_left",
  "swim_right",
  "walk_backwards",
  "charge",
]);
const names = {
  "0": "Stand",
  "1": "Death",
  "4": "Walk",
  "5": "Run",
  "9": "CombatWound",
  "11": "ShuffleLeft",
  "12": "ShuffleRight",
  "13": "Walkbackwards",
  "17": "Attack1H",
  "21": "Parry1H",
  "24": "ShieldBlock",
  "27": "Ready2H",
  "30": "Dodge",
  "37": "JumpStart",
  "38": "Jump",
  "39": "JumpEnd",
  "41": "SwimIdle",
  "42": "Swim",
  "43": "SwimLeft",
  "44": "SwimRight",
  "55": "BattleRoar",
  "60": "EmoteTalk",
  "85": "Attack1HPierce",
  "113": "EmoteSalute",
  "114": "KneelStart",
  "115": "KneelLoop",
  "116": "KneelEnd",
  "816": "CombatChargeLoop",
  "818": "CombatAbility1H01",
  "820": "CombatChargeEnd",
  "992": "CombatShieldBash"
};
for (const [name, index] of Object.entries(selected)) {
  const seq = source.sequences[index],
    duration = seq.duration / 1000,
    loop = looping.has(name),
    intervals = Math.min(
      loop ? 120 : 119,
      Math.max(2, Math.ceil(duration * 18)),
    ),
    length = intervals + (loop ? 0 : 1),
    fps = intervals / duration;
  clips[name] = {
    length,
    fps,
    loop,
    keys: Array.from({ length }, (_, frame) => ({
      frame,
      joints: Object.fromEntries(
        Object.entries(
          positions(source.sample(index, (frame / fps) * 1000)),
        ).map(([n, v]) => [n, v.map((x, i) => +(x - rest[n][i]).toFixed(3))]),
      ),
    })),
  };
  provenance[name] = {
    source: names[seq.id],
    sequence: index,
    animationId: seq.id,
    variant: seq.variant,
    duration,
    alias: !!(seq.flags & 64),
    resolvedSequence: source.resolve(index),
  };
}
const hash = (f) =>
  crypto.createHash("sha256").update(fs.readFileSync(f)).digest("hex");
const model = {
  version: 1,
  type: "oathless_captain",
  name: "Oathless Captain / WoW human motion",
  joints: Object.fromEntries(
    Object.entries(rest).map(([n, p]) => [
      n,
      { parent: map[n][1], position: p.map((v) => +v.toFixed(3)) },
    ]),
  ),
  palette: {
    skin: "#e2b58a",
    skinShade: "#b37d62",
    skinLight: "#f1ceb0",
    outline: "#332d35",
    blue: "#345a81",
    blueShade: "#243952",
    blueLight: "#6089ab",
    gold: "#c29954",
    goldShade: "#80613a",
    goldLight: "#ead39a",
    steel: "#85939f",
    steelShade: "#505c6a",
    steelLight: "#c0cbd0",
    hair: "#bb8b45",
    hairShade: "#755333",
    hairLight: "#e6c579",
    eyes: "#529897",
    white: "#f4ece0",
    leather: "#684739",
  },
  shape: {
    headWidth: 5.5,
    headDepth: 4.6,
    headHeight: 6,
    bodyWidth: 5,
    armWidth: 4,
    legWidth: 4.2,
  },
  wearables: {},
  clips,
  provenance: {
    reference:
      "https://www.wowhead.com/npc=49877/captain-lancy-revshon#modelviewer",
    npcId: 49877,
    displayId: 36758,
    characterId: 2,
    modelFileId: 1000764,
    skeletonFileId: 2137789,
    sourceBones: source.bones.length,
    sourceAnimations: source.sequences.length,
    importedAnimations: Object.keys(clips).length,
    sourceSha256: hash(input),
    skeletonSha256: hash(path.join(path.dirname(input), "2137789.skel")),
    scale,
    axes: "WoW X forward,Y left,Z up -> Wildbound -Y,X,Z",
    rootMotion:
      "Remove horizontal bone-0 displacement once. Preserve vertical movement.",
    boneMap: map,
    clips: provenance,
    externalAnimations: [1000780, 1000789].map((id) => ({
      id,
      sha256: hash(path.join(path.dirname(input), id + ".anim")),
    })),
    rights:
      "Blizzard animation donor; original native Wildbound pixels. No source mesh or textures bundled.",
  },
};
model.visibility = Object.fromEntries(
  ["eyeL", "eyeR", "earL", "earR", "nose", "mouth"].map((n) => [
    n,
    Array.from({ length: 8 }, (_, d) => n.startsWith("ear") || d < 3 || d > 5),
  ]),
);
model.visibility.eyeL[2] = false;
model.visibility.eyeR[6] = false;
fs.mkdirSync(path.join(root, "assets/oathless-captain"), { recursive: true });
fs.writeFileSync(
  output,
  "// Generated by scripts/import-oathless-captain.cjs.\nexport default " +
    JSON.stringify(model) +
    ";\n",
);
fs.writeFileSync(
  path.join(root, "assets/oathless-captain/motion-provenance.json"),
  JSON.stringify(model.provenance, null, 2) + "\n",
);
console.log(
  JSON.stringify({
    joints: Object.keys(map).length,
    clips: Object.keys(clips).length,
    output,
  }),
);
