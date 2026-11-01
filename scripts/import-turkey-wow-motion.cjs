// Convert only the exact Wowhead Turkey Stand/Walk/Run/Attack/Death tracks
// onto a separate review dataset. This file is intentionally not wired into
// WildlifePack: native art and gameplay clips stay untouched until review.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { loadM2 } = require('./lib/wow-m2.cjs');

const root = path.resolve(__dirname, '..');
const input = path.resolve(process.argv[2] || path.join(root, 'test-output/wow-motion-audit/126278.m2'));
const output = path.resolve(process.argv[3] || path.join(root, 'src/turkey-wow-motion-data.mjs'));
if (!fs.existsSync(input)) throw Error(`Missing Turkey donor M2: ${input}`);

const source = loadM2(input);
if (source.bones.length !== 48 || source.sequences.length !== 22) {
  throw Error(`Unexpected Turkey donor layout: ${source.bones.length} bones / ${source.sequences.length} sequences`);
}

// Evidence from v274 hierarchy, pivots, direct vertex weights/centroids, and
// Head key-bone lookup 6=>26. Positive source Y maps to Wildbound suffix R.
// The source has a simpler biped than the game rig's drawn feathers, so the
// Wildbound fan, wattle and visible art remain native overlays.
const sourceToTarget = {
  pelvis: [4], chest: [3], neck: [21, 24], head: [26],
  eyeL: [28], eyeR: [29], beak: [27],
  wingL: [7], wingTipL: [13], wingR: [6], wingTipR: [12],
  tailFan: [18, 19, 20],
  hipL: [10], kneeL: [15], footL: [23],
  hipR: [9], kneeR: [14], footR: [22],
};

// Animation IDs are cross-checked against the standard AnimationData table.
// Sequence indices are asserted too, so a donor file change cannot silently
// substitute a different action or an alias.
const sourceClips = {
  stand: { sequence: 0, animationId: 0, label: 'Stand', loop: true },
  walk: { sequence: 6, animationId: 4, label: 'Walk', loop: true },
  run: { sequence: 4, animationId: 5, label: 'Run', loop: true },
  attack: { sequence: 7, animationId: 16, label: 'AttackUnarmed', loop: false },
  death: { sequence: 9, animationId: 1, label: 'Death', loop: false },
};

const scale = 20;
const averagePosition = (sample, indices) => indices.reduce(
  (sum, index) => sum.map((value, axis) => value + sample.positions[index][axis] / indices.length),
  [0, 0, 0],
);
const toWildboundDelta = (point, restPoint, rootDelta) => [
  (point[1] - restPoint[1] - rootDelta[1]) * scale,
  (point[0] - restPoint[0] - rootDelta[0]) * scale,
  (point[2] - restPoint[2] - rootDelta[2]) * scale,
];

// v274 M2Vertex boneIndices directly address bones[]; boneCombos at +0x78
// are skin-batch indices, not a per-vertex remap.
const bytes = fs.readFileSync(input);
const md20 = bytes.subarray(8, 8 + bytes.readUInt32LE(4));
const arrayAt = offset => ({ count: md20.readUInt32LE(offset), offset: md20.readUInt32LE(offset + 4) });
const vertices = arrayAt(60);
const influence = Array.from({ length: source.bones.length }, () => ({ weight: 0, xyz: [0, 0, 0] }));
for (let vertexIndex = 0; vertexIndex < vertices.count; vertexIndex++) {
  const vertex = vertices.offset + vertexIndex * 48;
  const xyz = [0, 1, 2].map(axis => md20.readFloatLE(vertex + axis * 4));
  for (let lane = 0; lane < 4; lane++) {
    const weight = md20.readUInt8(vertex + 12 + lane) / 255;
    const bone = md20.readUInt8(vertex + 16 + lane);
    if (!weight || !influence[bone]) continue;
    influence[bone].weight += weight;
    xyz.forEach((value, axis) => { influence[bone].xyz[axis] += value * weight; });
  }
}

const clips = {}, clipRecords = {};
for (const [targetName, selection] of Object.entries(sourceClips)) {
  const sequence = source.sequences[selection.sequence];
  if (!sequence || sequence.id !== selection.animationId || (sequence.flags & 64)) {
    throw Error(`Unexpected or aliased donor sequence for Turkey ${targetName}`);
  }
  const durationMs = sequence.duration;
  const fps = 24;
  const length = Math.max(2, Math.ceil(durationMs / 1000 * fps));
  const restSample = source.sample(selection.sequence, 0);
  const rest = Object.fromEntries(Object.entries(sourceToTarget).map(([name, bones]) => [name, averagePosition(restSample, bones)]));
  const rootRest = restSample.positions[0];
  clips[targetName] = {
    fps, length, loop: selection.loop,
    keys: Array.from({ length }, (_, frame) => {
      const time = Math.min(durationMs, frame / fps * 1000);
      const sample = source.sample(selection.sequence, time);
      const rootDelta = sample.positions[0].map((value, axis) => value - rootRest[axis]);
      const joints = Object.fromEntries(Object.entries(sourceToTarget).map(([name, bones]) => {
        const position = averagePosition(sample, bones);
        return [name, toWildboundDelta(position, rest[name], rootDelta).map(value => +value.toFixed(4))];
      }));
      return { frame, joints };
    }),
  };
  clipRecords[targetName] = {
    sequenceIndex: selection.sequence, animationId: selection.animationId,
    donorAnimation: selection.label, durationMs, fps, frameCount: length, loop: selection.loop,
  };
}

const keyArray = arrayAt(52);
const keyBoneLookup = Array.from({ length: keyArray.count }, (_, index) => md20.readInt16LE(keyArray.offset + index * 2));
const usedBones = [...new Set(Object.values(sourceToTarget).flat())];
const mappedBones = usedBones.map(index => {
  const bone = source.bones[index], record = influence[index], parentChain = [];
  for (let cursor = index; cursor >= 0; cursor = source.bones[cursor].parent) parentChain.unshift(cursor);
  return {
    index, parent: bone.parent, parentChain, keyBoneId: bone.key,
    keyBoneTargetIndex: bone.key >= 0 ? keyBoneLookup[bone.key] : null,
    pivot: bone.pivot.map(value => +value.toFixed(4)),
    weightedInfluence: +record.weight.toFixed(2),
    weightedCentroid: record.weight ? record.xyz.map(value => +(value / record.weight).toFixed(4)) : null,
  };
});
const provenance = {
  donor: 'Wowhead NPC 62648 Turkey, FileDataID 126278',
  sourceUrl: 'https://wow.zamimg.com/modelviewer/live/m2/126278.m2',
  sourceSha256: crypto.createHash('sha256').update(bytes).digest('hex'),
  sourceFormat: 'M2 v274, embedded MD21 tracks; no external .anim dependencies',
  sourceBones: source.bones.length, sourceVertices: vertices.count, keyBoneLookup,
  vertexInfluenceIndexing: 'v274 M2Vertex boneIndices directly index bones[]; MD20 +0x78 boneCombos is not a vertex remap.',
  coordinateConversion: `Source +X forward, +Y left, +Z up -> Wildbound [Y, X, Z] * ${scale}; each clip is relative to its frame-zero source pose and bone-0 root translation is removed each frame.`,
  sourceToTarget, mappedBones, sourceClips: clipRecords,
  preservedNativeActions: ['strut', 'peck', 'flap-run', 'flap-attack', 'hurt'],
  unmappedSourceAnatomy: 'The donor tail/fan feathers and wattle are kept as native Wildbound overlays; only a representative tail fan pivot is mapped. Unweighted helpers and source bones outside the mapped torso, face, wings, legs and fan are omitted.',
  caveat: 'Review-only positional retarget of sampled joint origins, not donor-mesh skinning. The target has no separate torso feather/wing feather bones, so this does not reproduce every donor feather. Keep native Wildbound peck/strut and attacks until the eight-facing comparison is approved.',
};

fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, `// Generated by scripts/import-turkey-wow-motion.cjs from the local Wowhead M2 source.\nexport const TURKEY_WOW_MOTION_DRAFT = ${JSON.stringify({ clips, provenance }, null, 2)};\n`);
console.log(JSON.stringify({ output, clips: clipRecords, sourceSha256: provenance.sourceSha256, mappedBones: mappedBones.length }, null, 2));
