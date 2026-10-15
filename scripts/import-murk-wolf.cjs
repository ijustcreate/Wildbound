// Local experiment: resample Khada's Murk Wolf Mini GLB into Wildbound poses.
// No mesh, texture, or glTF runtime is needed by the resulting pixel rig.
const fs = require("node:fs"),
  path = require("node:path"),
  crypto = require("node:crypto");
const root = path.resolve(__dirname, "..");
const input = process.argv[2];
if (!input)
  throw Error("Usage: node scripts/import-murk-wolf.cjs <exported GLB>");
const file = fs.readFileSync(input),
  jsonLength = file.readUInt32LE(12),
  g = JSON.parse(file.subarray(20, 20 + jsonLength)),
  bin = file.subarray(28 + jsonLength);
if (file.toString("ascii", 0, 4) !== "glTF") throw Error("Expected GLB");
const identity = () => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
function mul(a, b) {
  return Array.from({ length: 16 }, (_, i) => {
    const r = i % 4,
      c = Math.floor(i / 4);
    return (
      a[r] * b[c * 4] +
      a[4 + r] * b[c * 4 + 1] +
      a[8 + r] * b[c * 4 + 2] +
      a[12 + r] * b[c * 4 + 3]
    );
  });
}
function trs(t = [0, 0, 0], q = [0, 0, 0, 1], s = [1, 1, 1]) {
  const norm = Math.hypot(...q),
    [x, y, z, w] = q.map((v) => v / norm);
  return [
    (1 - 2 * (y * y + z * z)) * s[0],
    2 * (x * y + z * w) * s[0],
    2 * (x * z - y * w) * s[0],
    0,
    2 * (x * y - z * w) * s[1],
    (1 - 2 * (x * x + z * z)) * s[1],
    2 * (y * z + x * w) * s[1],
    0,
    2 * (x * z + y * w) * s[2],
    2 * (y * z - x * w) * s[2],
    (1 - 2 * (x * x + y * y)) * s[2],
    0,
    ...t,
    1,
  ];
}
const point = (m, p = [0, 0, 0]) =>
  [0, 1, 2].map(
    (i) => m[i] * p[0] + m[i + 4] * p[1] + m[i + 8] * p[2] + m[i + 12],
  );
const dims = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 },
  cache = new Map();
function accessor(i) {
  if (cache.has(i)) return cache.get(i);
  const a = g.accessors[i],
    v = g.bufferViews[a.bufferView],
    n = dims[a.type];
  if (a.componentType !== 5126 || a.sparse)
    throw Error("Only dense float animation accessors supported");
  const start = (v.byteOffset || 0) + (a.byteOffset || 0),
    stride = v.byteStride || n * 4;
  const data = Array.from({ length: a.count }, (_, r) =>
    Array.from({ length: n }, (_, c) =>
      bin.readFloatLE(start + r * stride + c * 4),
    ),
  );
  cache.set(i, data);
  return data;
}
function slerp(a, b, f) {
  let dot = a.reduce((n, v, i) => n + v * b[i], 0);
  if (dot < 0) {
    b = b.map((v) => -v);
    dot = -dot;
  }
  dot = Math.min(1, dot);
  if (dot > 0.9995) {
    const q = a.map((v, i) => v + (b[i] - v) * f),
      len = Math.hypot(...q);
    return q.map((v) => v / len);
  }
  const angle = Math.acos(dot),
    sa = Math.sin(angle);
  return a.map(
    (v, i) => (v * Math.sin((1 - f) * angle) + b[i] * Math.sin(f * angle)) / sa,
  );
}
function sample(a, time) {
  const nodes = g.nodes.map((n) => ({
    t: n.translation || [0, 0, 0],
    r: n.rotation || [0, 0, 0, 1],
    s: n.scale || [1, 1, 1],
  }));
  if (a)
    for (const c of a.channels) {
      const sampler = a.samplers[c.sampler],
        times = accessor(sampler.input).map((v) => v[0]),
        values = accessor(sampler.output);
      if (!["LINEAR", "STEP", undefined].includes(sampler.interpolation))
        throw Error("Unsupported interpolation");
      let hi = times.findIndex((v) => v > time);
      if (hi < 0) hi = times.length - 1;
      let lo = Math.max(0, hi - 1);
      if (time >= times.at(-1)) lo = hi;
      const f =
        lo === hi || sampler.interpolation === "STEP"
          ? 0
          : Math.max(
              0,
              Math.min(1, (time - times[lo]) / (times[hi] - times[lo])),
            );
      const v =
        c.target.path === "rotation"
          ? slerp(values[lo], values[hi], f)
          : values[lo].map((x, i) => x + (values[hi][i] - x) * f);
      nodes[c.target.node][
        { translation: "t", rotation: "r", scale: "s" }[c.target.path]
      ] = v;
    }
  const world = [];
  function visit(i, parent) {
    const n = nodes[i];
    world[i] = mul(parent, g.nodes[i].matrix || trs(n.t, n.r, n.s));
    for (const child of g.nodes[i].children || []) visit(child, world[i]);
  }
  for (const i of g.scenes[g.scene || 0].nodes) visit(i, identity());
  return world;
}
const idx = Object.fromEntries(g.nodes.map((n, i) => [n.name, i]));
const mapped = {
  pelvis: ["Pelvis", ""],
  spine: ["Spine1", "pelvis"],
  chest: ["Spine3", "spine"],
  neck: ["C_Neck", "chest"],
  head: ["C_Head", "neck"],
  earL: ["C_Head_L_Ear", "head"],
  earR: ["C_Head_R_Ear", "head"],
  jaw: ["C_Jaw", "head"],
  tailBase: ["Tail1", "pelvis"],
  tailMid: ["Tail3", "tailBase"],
  tailTip: ["Tail4", "tailMid"],
};
for (const s of ["L", "R"])
  for (const [key, source, parent] of [
    ["hip", "Hip", "pelvis"],
    ["knee", "Knee", "hip"],
    ["hock", "Ankle", "knee"],
    ["rearPaw", "Foot", "hock"],
    ["shoulder", "Shoulder", "chest"],
    ["elbow", "Elbow", "shoulder"],
    ["frontPaw", "Paw", "elbow"],
  ])
    mapped[key + s] = [
      s + "_" + source,
      ["pelvis", "chest"].includes(parent) ? parent : parent + s,
    ];
const scale = 29,
  restWorld = sample(null, 0),
  rootRest = point(restWorld[idx.Root]),
  originZ = -0.16;
function positions(world, inPlace = true) {
  const motion = point(world[idx.Root]),
    out = {};
  const convert = (p) => [
    (p[0] - (inPlace ? motion[0] - rootRest[0] : 0)) * scale,
    (p[2] - (inPlace ? motion[2] - rootRest[2] : 0) - originZ) * scale,
    p[1] * scale,
  ];
  for (const [name, [source]] of Object.entries(mapped))
    out[name] = convert(point(world[idx[source]]));
  // Head-local registration markers capture skull pitch/yaw and jaw opening.
  for (const [name, source, offset] of [
    ["muzzle", "C_Head", [0, -0.04, 0.16]],
    ["nose", "C_Head", [0, -0.025, 0.29]],
    ["eyeL", "C_Head", [0.14, 0.06, 0.145]],
    ["eyeR", "C_Head", [-0.14, 0.06, 0.145]],
    ["jawTip", "C_Jaw", [0.24, 0, 0]],
  ])
    out[name] = convert(point(world[idx[source]], offset));
  // Fit the expressive pixel skull, while retaining each ear's independent motion.
  for (const side of ["L", "R"]) {
    const ear = "ear" + side;
    out[ear] = out.head.map((v, i) => v + (out[ear][i] - v) * 1.7);
    const top = convert(
      point(world[idx.C_Head], [side === "L" ? 0.16 : -0.16, 0.29, -0.02]),
    );
    out["earTip" + side] = top.map(
      (v, i) => v + (out[ear][i] - out.head[i]) * 0.15,
    );
  }
  return out;
}
const rest = positions(restWorld, false);
const parents = {
  ...Object.fromEntries(Object.entries(mapped).map(([n, v]) => [n, v[1]])),
  muzzle: "head",
  nose: "muzzle",
  eyeL: "head",
  eyeR: "head",
  jawTip: "jaw",
  earTipL: "earL",
  earTipR: "earR",
};
const clips = {},
  sources = {};
const choices = {
  idle: ["SRU_MurkwolfMini_idle1.anm", true],
  run: ["Run_Base", true],
  bite: ["Attack1_BASE", false],
  attack2: ["Attack2_BASE", false],
  pounce: ["SRU_Murkwolf_pounce.anm", false],
  howl: ["SRU_MurkwolfMini_howl.anm", false],
  death: ["Death_Base", false],
  death2: ["SRU_Murkwolf_death2.anm", false],
  alert: ["SRU_MurkwolfMini_idle_aggro1.anm", true],
  look_left: ["Idle_Lookat_L45", true],
  look_right: ["Idle_Lookat_R45", true],
  spawn_left: ["SRU_MurkwolfMini_spawn_left.anm", false],
  spawn_right: ["SRU_MurkwolfMini_spawn_right.anm", false],
  idle2: ["SRU_MurkwolfMini_idle2.anm", true],
  idle3: ["SRU_MurkwolfMini_idle3.anm", true],
  idle4: ["SRU_MurkwolfMini_idle4.anm", true],
  idle5: ["SRU_MurkwolfMini_idle5.anm", true],
  idle6: ["SRU_MurkwolfMini_idle6.anm", true],
  idle7: ["SRU_MurkwolfMini_idle7.anm", true],
  alert2: ["SRU_MurkwolfMini_idle_aggro2.anm", true],
  alert3: ["SRU_MurkwolfMini_idle_aggro3.anm", true],
  alert_to_idle: ["SRU_MurkwolfMini_idle1_a2n.anm", false],
  idle_to_alert: ["SRU_MurkwolfMini_idle1_n2a.anm", false],
  look_forward: ["Idle_Lookat_0", true],
};
for (const [name, [source, loop]] of Object.entries(choices)) {
  const a = g.animations.find((a) => a.name === source);
  if (!a) throw Error("Missing " + source);
  const duration = Math.max(
      ...a.samplers.map((s) => accessor(s.input).at(-1)[0]),
    ),
    length = Math.max(
      2,
      Math.min(120, Math.ceil(duration * 24) + (loop ? 0 : 1)),
    ),
    fps = (loop ? length : length - 1) / duration;
  clips[name] = {
    fps: Math.min(30, Math.max(1, fps)),
    length,
    loop,
    keys: Array.from({ length }, (_, frame) => {
      const p = positions(
        sample(a, (frame * duration) / (loop ? length : length - 1)),
      );
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
  sources[name] = { clip: source, duration };
}
clips.walk = structuredClone(clips.run);
clips.walk.fps *= 0.55;
sources.walk = { derivedFrom: "run", playbackRate: 0.55 };
clips.windup = structuredClone(clips.idle_to_alert);
clips.recover = structuredClone(clips.alert_to_idle);
clips.hurt = {
  fps: 12,
  length: 4,
  loop: false,
  keys: [
    { frame: 0, joints: { head: [0, -2, 1], chest: [0, -1, -1] } },
    { frame: 3, joints: { head: [0, 0, 0], chest: [0, 0, 0] } },
  ],
};
const model = {
  version: 1,
  type: "quadruped",
  name: "Murk Wolf — motion transfer test",
  joints: Object.fromEntries(
    Object.entries(rest).map(([n, position]) => [
      n,
      { parent: parents[n], position: position.map((v) => +v.toFixed(4)) },
    ]),
  ),
  palette: {
    body: "#8b6445",
    shade: "#3b3335",
    head: "#696970",
    legs: "#695044",
    tail: "#57555c",
    cream: "#decaa1",
    eyes: "#76e8f0",
    outline: "#241e24",
  },
  shape: { bodyWidth: 10, headSize: 9, legWidth: 4, tailWidth: 5 },
  clips,
  provenance: {
    reference:
      "https://modelviewer.lol/model-viewer?group=extras&alias=sru_murkwolfmini&id=0",
    sourceSha256: crypto.createHash("sha256").update(file).digest("hex"),
    sourceAnimations: g.animations.length,
    scale,
    axes: "glTF (X,Y,Z) -> Wildbound (X,Z,Y)",
    rootMotion:
      "Horizontal Root translation removed; vertical movement retained.",
    rights:
      "Riot animation data: local compatibility experiment. New generated pixel artwork. Not cleared for redistribution.",
    clips: sources,
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
fs.mkdirSync(path.join(root, "assets/murk-wolf"), { recursive: true });
fs.writeFileSync(
  path.join(root, "src/murk-wolf-data.mjs"),
  "// Generated by scripts/import-murk-wolf.cjs. Local test; see assets/murk-wolf/README.md.\nexport default " +
    JSON.stringify(model) +
    ";\n",
);
fs.writeFileSync(
  path.join(root, "assets/murk-wolf/motion-provenance.json"),
  JSON.stringify(model.provenance, null, 2) + "\n",
);
console.log(
  JSON.stringify(
    {
      joints: model.joints,
      clips: Object.fromEntries(
        Object.entries(clips).map(([n, c]) => [
          n,
          { length: c.length, fps: c.fps },
        ]),
      ),
    },
    null,
    2,
  ),
);
