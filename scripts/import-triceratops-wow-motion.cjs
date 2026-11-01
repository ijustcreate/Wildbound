// Import selected Wowhead Jammer M2 clips as editable Wildbound joint keys.
// Donor geometry, textures and materials are not copied into the game.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { loadM2 } = require('./lib/wow-m2.cjs');

const root = path.resolve(__dirname, '..');
const input = path.resolve(process.argv[2] || path.join(root, 'test-output/wow-motion-audit/660332.m2'));
const output = path.resolve(process.argv[3] || path.join(root, 'src/triceratops-wow-motion-data.mjs'));
if (!fs.existsSync(input)) throw Error(`Missing Jammer donor M2: ${input}`);

const source = loadM2(input);
if (source.bones.length !== 92 || source.sequences.length !== 37)
  throw Error(`Unexpected Jammer donor layout: ${source.bones.length} bones / ${source.sequences.length} sequences`);

// Anchors follow the donor's 92-bone parent chains and pivots. The trunk runs
// from pelvis bone 1 through 2/8/12/16 to skull bone 30; tail is 5/13/76.
// Bone 1 branches into the rear legs (6/10/14/18/23); the forelegs branch
// from skull/shoulder base 20/21 through 25/28/31 to 35/38. Donor +Y is the
// creature's right side, mapped to Wildbound's positive-X right joints.
const sourceToTarget = {
  pelvis: [1], chest: [2, 8, 12], neck: [16], head: [30], muzzle: [39],
  tailBase: [5], tailMid: [13], tailTip: [76],
  shoulderR: [20], elbowR: [28], frontPawR: [38],
  shoulderL: [21], elbowL: [29], frontPawL: [36],
  hipR: [6], kneeR: [18], rearPawR: [23],
  hipL: [7], kneeL: [19], rearPawL: [24],
  hornL: [79], hornR: [80], frill: [27],
};

const sourceClips = {
  idle: { sequence: 0, animationId: 0, variant: 0, label: 'Stand', loop: true },
  walk: { sequence: 28, animationId: 4, variant: 0, label: 'Walk', loop: true },
  run: { sequence: 22, animationId: 5, variant: 0, label: 'Run', loop: true },
  attack: { sequence: 4, animationId: 16, variant: 0, label: 'AttackUnarmed', loop: false },
};
// Jammer's playable silhouette is compact; the raw source limbs travel much
// farther than its pixel rig. A 3x scale preserves the cadence while keeping
// the body and feet inside the native drawing envelope.
const scale = 3;
const averagePosition = (sample, indices) => indices.reduce(
  (sum, index) => sum.map((value, axis) => value + sample.positions[index][axis] / indices.length),
  [0, 0, 0],
);
const toWildboundDelta = (point, restPoint, rootDelta) => [
  (point[1] - restPoint[1] - rootDelta[1]) * scale,
  (point[0] - restPoint[0] - rootDelta[0]) * scale,
  (point[2] - restPoint[2] - rootDelta[2]) * scale,
];

const bytes = fs.readFileSync(input);
const sha256 = crypto.createHash('sha256').update(bytes).digest('hex');
const clips = {}, clipRecords = {}, floorSamples = {};
for (const [targetName, selection] of Object.entries(sourceClips)) {
  const sequence = source.sequences[selection.sequence];
  if (!sequence || sequence.id !== selection.animationId || sequence.variant !== selection.variant || (sequence.flags & 64))
    throw Error(`Unexpected or aliased Jammer donor sequence for ${targetName}`);
  const durationMs = sequence.duration, fps = 24;
  const frameCount = Math.max(2, Math.ceil(durationMs / 1000 * fps));
  const restSample = source.sample(selection.sequence, 0);
  const rest = Object.fromEntries(Object.entries(sourceToTarget).map(([name, bones]) => [name, averagePosition(restSample, bones)]));
  const rootRest = restSample.positions[0];
  const rootDrift = [], pawHeight = { frontPawL: [], frontPawR: [], rearPawL: [], rearPawR: [] };
  clips[targetName] = {
    fps, length: frameCount, loop: selection.loop,
    keys: Array.from({ length: frameCount }, (_, frame) => {
      const time = Math.min(durationMs, frame / fps * 1000);
      const sample = source.sample(selection.sequence, time);
      const rootDelta = sample.positions[0].map((value, axis) => value - rootRest[axis]);
      rootDrift.push(Math.hypot(...rootDelta));
      const joints = Object.fromEntries(Object.entries(sourceToTarget).map(([name, bones]) => {
        const position = averagePosition(sample, bones);
        const delta = toWildboundDelta(position, rest[name], rootDelta);
        // The exact donor's low foot pivots pass slightly below the target's
        // ground anchor. Limit downward travel to the native one-pixel paw
        // clearance; upward swing remains fully donor-driven.
        if (name.startsWith('frontPaw') || name.startsWith('rearPaw')) delta[2] = Math.max(-1, delta[2]);
        const rounded = delta.map(value => +value.toFixed(4));
        if (name in pawHeight) pawHeight[name].push(rounded[2]);
        return [name, rounded];
      }));
      return { frame, joints };
    }),
  };
  floorSamples[targetName] = Object.fromEntries(Object.entries(pawHeight).map(([name, values]) => [name, {
    minOffset: +Math.min(...values).toFixed(4), maxOffset: +Math.max(...values).toFixed(4),
  }]));
  clipRecords[targetName] = {
    sequenceIndex: selection.sequence, animationId: selection.animationId,
    donorAnimation: selection.label, durationMs, fps, frameCount, loop: selection.loop,
    maximumRootDrift: +Math.max(...rootDrift).toFixed(5),
  };
}

const provenance = {
  donor: 'Wowhead NPC 142151 Jammer / triceratops, FileDataID 660332',
  sourceUrl: 'https://wow.zamimg.com/modelviewer/live/m2/660332.m2',
  sourceSha256: sha256,
  sourceFormat: 'M2 v274 with embedded MD21 tracks; no external .anim dependency',
  sourceBones: source.bones.length, sourceSequences: source.sequences.length,
  coordinateConversion: `Source +X forward, +Y right, +Z up -> Wildbound [Y, X, Z] * ${scale}; each joint is relative to its frame-zero source pose and root translation is removed per frame.`,
  sourceToTarget, sourceClips: clipRecords, floorSamples,
  preservedNativeActions: ['warn', 'charge', 'headbutt', 'hurt', 'death'],
  caveat: 'Review-only positional retarget of selected bone origins, not donor-mesh skinning. Native horns, frill rim and pixels remain attached to the existing editable Wildbound anatomy. Verify foot contact and eight-facing silhouettes in the assembled game before approval.',
};
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, `// Generated from Wowhead Jammer bone tracks by scripts/import-triceratops-wow-motion.cjs.\nexport const TRICERATOPS_WOW_MOTION = ${JSON.stringify({ clips, provenance }, null, 2)};\n`);
console.log(JSON.stringify({ output, sourceSha256: sha256, clips: clipRecords, floorSamples }, null, 2));
