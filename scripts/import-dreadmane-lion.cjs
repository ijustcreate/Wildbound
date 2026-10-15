const fs = require("node:fs"),
  path = require("node:path"),
  crypto = require("node:crypto");
const { loadM2 } = require("./lib/wow-m2.cjs");
const root = path.resolve(__dirname, ".."),
  input = process.argv[2];
if (!input)
  throw Error(
    "Usage: node scripts/import-dreadmane-lion.cjs <lion-124781.m2> [--force]",
  );
const output = path.join(root, "src/dreadmane-lion-data.mjs");
if (fs.existsSync(output) && !process.argv.includes("--force"))
  throw Error("Dreadmane output exists; review before using --force");
const source = loadM2(input),
  scale = 22,
  ground = 0.09;
const map = {
  pelvis: [9, ""],
  spine: [5, "pelvis"],
  chest: [0, "spine"],
  neck: [3, "chest", [0.57, 0, 1.11]],
  head: [8, "neck", [0.98, 0, 1.15]],
  jaw: [14, "head"],
  jawTip: [64, "jaw"],
  earL: [12, "head"],
  earR: [13, "head"],
  tailBase: [17, "pelvis"],
  tailMid: [22, "tailBase"],
  tailEnd: [27, "tailMid"],
  tailTip: [30, "tailEnd"],
};
for (const [side, sign, indices] of [
  ["L", 1, [6, 10, 20, 25, 18, 23, 28, 31, 33]],
  ["R", -1, [7, 11, 21, 26, 19, 24, 29, 32, 34]],
]) {
  const names = [
      "shoulder",
      "elbow",
      "wrist",
      "frontPaw",
      "hip",
      "knee",
      "hock",
      "ankle",
      "rearPaw",
    ],
    parents = [
      "chest",
      "shoulder",
      "elbow",
      "wrist",
      "pelvis",
      "hip",
      "knee",
      "hock",
      "ankle",
    ];
  names.forEach(
    (n, i) =>
      (map[n + side] = [
        indices[i],
        ["chest", "pelvis"].includes(parents[i])
          ? parents[i]
          : parents[i] + side,
      ]),
  );
  map["eye" + side] = [8, "head", [1.16, sign * 0.17, 1.22]];
  map["earTip" + side] = [
    side === "L" ? 12 : 13,
    "ear" + side,
    [0.985, sign * 0.18, 1.38],
  ];
}
map.muzzle = [8, "head", [1.19, 0, 1.03]];
map.nose = [8, "muzzle", [1.29, 0, 1.04]];
const rootRest = source.sample(null, 0).positions[0];
function positions(sample) {
  const delta = sample.positions[0].map((v, i) => v - rootRest[i]);
  return Object.fromEntries(
    Object.entries(map).map(([name, [index, , anchor]]) => {
      const p = anchor
        ? source.point(sample.matrices[index], anchor)
        : sample.positions[index];
      return [
        name,
        [
          (p[1] - delta[1]) * scale,
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
const names = {
  0: "idle",
  1: "walk",
  2: "run",
  3: "claw_left",
  4: "rip",
  5: "claw_right",
  6: "claw",
  7: "critical",
  8: "death",
  9: "hurt",
  10: "stand_wound",
  11: "cower",
  12: "cat_cower",
  13: "idle_scan",
  14: "sidestep_right",
  15: "sidestep_left",
  16: "sit",
  17: "sit_down",
  18: "sit_up",
  19: "sleep",
  20: "sleep_down",
  21: "sleep_up",
  22: "swim",
  23: "swim_idle",
  24: "jump_start",
  25: "jump_land",
  26: "jump",
  27: "fall",
  28: "rake_left",
  29: "ravage",
  30: "rake_right",
  31: "rake",
  32: "swim_backwards",
  33: "swim_left",
  34: "swim_right",
  35: "walk_backwards",
  36: "pounce",
  37: "roar",
  38: "dance",
  39: "drown",
  40: "eat",
  41: "use_standing",
  42: "use_standing_2",
  43: "kneel_down",
  44: "spell_kneel_down",
  45: "loot",
  46: "kneel_up",
  47: "spell_kneel_up",
  48: "drowned",
};
const sourceNames = {
  0: "Stand",
  1: "Death",
  4: "Walk",
  5: "Run",
  8: "StandWound",
  9: "CombatWound",
  10: "CombatCritical",
  11: "ShuffleLeft",
  12: "ShuffleRight",
  13: "Walkbackwards",
  16: "AttackUnarmed",
  37: "JumpStart",
  38: "Jump",
  39: "JumpEnd",
  40: "Fall",
  41: "SwimIdle",
  42: "Swim",
  43: "SwimLeft",
  44: "SwimRight",
  45: "SwimBackwards",
  50: "Loot",
  63: "EmoteUseStanding",
  69: "EmoteDance",
  94: "MountSpecial",
  96: "SitGroundDown",
  97: "SitGround",
  98: "SitGroundUp",
  99: "SleepDown",
  100: "Sleep",
  101: "SleepUp",
  114: "KneelStart",
  116: "KneelEnd",
  118: "SpecialUnarmed",
  123: "UseStandingLoop",
  131: "Drown",
  132: "Drowned",
  140: "SpellKneelStart",
  142: "SpellKneelEnd",
  170: "DruidCatPounce",
  171: "DruidCatRip",
  172: "DruidCatRake",
  173: "DruidCatRavage",
  174: "DruidCatClaw",
  175: "DruidCatCower",
};
const loops = new Set([
  "idle",
  "idle_scan",
  "walk",
  "run",
  "sit",
  "sleep",
  "swim",
  "swim_idle",
  "swim_backwards",
  "swim_left",
  "swim_right",
  "walk_backwards",
  "eat",
  "drowned",
]);
for (const seq of source.sequences) {
  const name = names[seq.index];
  if (!name) throw Error("Unmapped source sequence");
  const duration = seq.duration / 1000,
    loop = loops.has(name),
    intervals = Math.max(2, Math.ceil(duration * 24)),
    length = intervals + (loop ? 0 : 1),
    fps = intervals / duration;
  clips[name] = {
    length,
    fps,
    loop,
    keys: Array.from({ length }, (_, frame) => {
      const p = positions(source.sample(seq.index, (frame / fps) * 1000));
      return {
        frame,
        joints: Object.fromEntries(
          Object.entries(p).map(([n, v]) => [
            n,
            v.map((x, i) => +(x - rest[n][i]).toFixed(4)),
          ]),
        ),
      };
    }),
  };
  provenance[name] = {
    source: sourceNames[seq.id],
    animationId: seq.id,
    variation: seq.variant,
    sequence: seq.index,
    resolvedSequence: source.resolve(seq.index),
    duration,
    alias: !!(seq.flags & 64),
  };
}
const model = {
  version: 1,
  type: "quadruped",
  name: "Dreadmane Lion / WoW motion transfer",
  joints: Object.fromEntries(
    Object.entries(rest).map(([n, p]) => [
      n,
      { parent: map[n][1], position: p.map((v) => +v.toFixed(4)) },
    ]),
  ),
  palette: {
    body: "#c79046",
    shade: "#93602f",
    head: "#e1af65",
    legs: "#b67c39",
    tail: "#c79046",
    cream: "#f3dfb7",
    eyes: "#e8bd4e",
    outline: "#51351f",
    mane: "#704025",
    maneLight: "#9d6230",
  },
  shape: {
    bodyWidth: 11.5,
    headSize: 9,
    legWidth: 4.2,
    tailWidth: 2.2,
    maneSize: 12,
  },
  clips,
  provenance: {
    reference: "https://www.wowhead.com/npc=55491/lion#modelviewer",
    npcId: 55491,
    displayId: 39134,
    modelFileId: 124781,
    sourceUrl: "https://wow.zamimg.com/modelviewer/live/m2/124781.m2",
    sourceSha256: crypto
      .createHash("sha256")
      .update(fs.readFileSync(input))
      .digest("hex"),
    sourceBones: source.bones.length,
    sourceAnimations: source.sequences.length,
    distinctSequences: new Set(
      source.sequences.map((s) => source.resolve(s.index)),
    ).size,
    scale,
    axes: "WoW (X forward,Y left,Z up) -> Wildbound (Y,X,Z)",
    rootMotion:
      "Horizontal bone-0 translation removed; vertical motion retained.",
    boneMap: map,
    externalAnimations: Object.entries(source.files)
      .filter(([, id]) => id > 0)
      .map(([key, id]) => ({
        key,
        id,
        sha256: crypto
          .createHash("sha256")
          .update(fs.readFileSync(path.join(path.dirname(input), id + ".anim")))
          .digest("hex"),
      })),
    clips: provenance,
    rights:
      "Blizzard source animation; native Wildbound pixel art. Source mesh and textures are not bundled.",
  },
};
model.visibility = Object.fromEntries(
  ["eyeL", "eyeR", "muzzle", "nose", "jaw", "jawTip", "earL", "earR"].map(
    (n) => [
      n,
      Array.from(
        { length: 8 },
        (_, d) => n.startsWith("ear") || d < 3 || d > 5,
      ),
    ],
  ),
);
model.visibility.eyeL[2] = false;
model.visibility.eyeR[6] = false;
fs.mkdirSync(path.join(root, "assets/dreadmane-lion"), { recursive: true });
fs.writeFileSync(
  output,
  "// Generated by scripts/import-dreadmane-lion.cjs; see assets/dreadmane-lion/motion-provenance.json.\nexport default " +
    JSON.stringify(model) +
    ";\n",
);
fs.writeFileSync(
  path.join(root, "assets/dreadmane-lion/motion-provenance.json"),
  JSON.stringify(model.provenance, null, 2) + "\n",
);
console.log(
  JSON.stringify({
    joints: Object.keys(model.joints).length,
    sourceBones: source.bones.length,
    clips: Object.keys(clips).length,
    distinctSequences: model.provenance.distinctSequences,
    output,
  }),
);
