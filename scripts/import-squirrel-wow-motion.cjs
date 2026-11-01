const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { loadM2 } = require('./lib/wow-m2.cjs');

const root = path.resolve(__dirname, '..');
const input = path.resolve(process.argv[2] || path.join(root, 'test-output/wow-motion-audit/1129448.m2'));
const output = path.resolve(process.argv[3] || path.join(root, 'src/squirrel-wow-motion-data.mjs'));
if (!fs.existsSync(input)) throw Error(`Missing Wowhead squirrel M2: ${input}`);

const source = loadM2(input);
if (source.bones.length !== 46 || source.sequences.length !== 10)
  throw Error(`Unexpected squirrel donor layout: ${source.bones.length} bones / ${source.sequences.length} sequences`);

// FileDataID 1129448 (NPC 61081, display 134), mapped from embedded M2
// weights, pivots, parent chains, and local Wowhead turnarounds. Source +X is
// forward, +Y is the donor's left, +Z is up. Wildbound uses [Y, X, Z] * 22.
// Positive donor Y is mapped to target joint suffix R because the current
// editable quadruped rig places its `R` joints at positive local X.
const sourceToTarget = {
  pelvis: [1],
  chest: [4],
  neck: [4],
  head: [8],
  muzzle: [8],
  eyeL: [8], eyeR: [8], earL: [8], earR: [8],
  tailBase: [2, 7],
  tailMid: [13, 18],
  tailTip: [21],
  hipR: [5], hipL: [6],
  kneeR: [11], kneeL: [12],
  rearPawR: [16], rearPawL: [17],
  shoulderR: [9], shoulderL: [10],
  elbowR: [14], elbowL: [15],
  frontPawR: [19, 44], frontPawL: [20, 45],
};
const sourceClips = {
  freeze: { sequence: 2, animationId: 0, label: 'Stand', loop: true },
  walk: { sequence: 0, animationId: 4, label: 'Walk', loop: true },
  scamper: { sequence: 1, animationId: 5, label: 'Run', loop: true },
};
const scale = 22;
const avgPosition = (sample, indices) => indices.reduce((p, index) => p.map((v, axis) => v + sample.positions[index][axis] / indices.length), [0, 0, 0]);
const toWildboundDelta = (point, clipRestPoint, rootDelta) => [
  (point[1] - clipRestPoint[1] - rootDelta[1]) * scale,
  (point[0] - clipRestPoint[0] - rootDelta[0]) * scale,
  (point[2] - clipRestPoint[2] - rootDelta[2]) * scale,
];
const clips = {};
const sourceRecords = {};

// The 48-byte v274 vertex record embeds four weights and four lookup indices.
// Include actual weighted centroids and parent chains for direct review.
const file = fs.readFileSync(input);
const md20 = file.subarray(8, 8 + file.readUInt32LE(4));
const readArray = offset => ({ count: md20.readUInt32LE(offset), offset: md20.readUInt32LE(offset + 4) });
const vertices = readArray(60);
const weightTotals = Array.from({ length: source.bones.length }, () => 0);
const weightedCentroids = Array.from({ length: source.bones.length }, () => ({ weight: 0, xyz: [0, 0, 0] }));
for (let index = 0; index < vertices.count; index++) {
  const vertex = vertices.offset + index * 48;
  const xyz = [0, 1, 2].map(axis => md20.readFloatLE(vertex + axis * 4));
  for (let influence = 0; influence < 4; influence++) {
    const weight = md20.readUInt8(vertex + 12 + influence) / 255;
    // v274 boneIndices are direct bone-array indices. Offset 120 is the
    // separate boneCombos lookup and must not be applied to these values.
    const bone = md20.readUInt8(vertex + 16 + influence);
    if (!weight || weightTotals[bone] == null) continue;
    weightTotals[bone] += weight;
    weightedCentroids[bone].weight += weight;
    xyz.forEach((value, axis) => { weightedCentroids[bone].xyz[axis] += value * weight; });
  }
}
const mappedBones = [...new Set(Object.values(sourceToTarget).flat())].map(index => {
  const bone = source.bones[index], centroid = weightedCentroids[index];
  const parentChain = [];
  for (let parent = index; parent >= 0; parent = source.bones[parent].parent) parentChain.unshift(parent);
  return {
    index, parent: bone.parent, parentChain,
    pivot: bone.pivot.map(value => +value.toFixed(4)),
    weightedVertexInfluence: +weightTotals[index].toFixed(2),
    weightedCentroid: centroid.weight ? centroid.xyz.map(value => +(value / centroid.weight).toFixed(4)) : null,
  };
});

for (const [targetName, selection] of Object.entries(sourceClips)) {
  const sequence = source.sequences[selection.sequence];
  if (!sequence || sequence.id !== selection.animationId || (sequence.flags & 64))
    throw Error(`Unexpected source sequence for ${targetName}`);
  const duration = sequence.duration / 1000;
  const intervals = Math.max(2, Math.ceil(duration * 24));
  const length = intervals;
  const fps = intervals / duration;
  const clipRestSample = source.sample(selection.sequence, 0);
  const clipRest = Object.fromEntries(Object.entries(sourceToTarget).map(([name, indices]) => [name, avgPosition(clipRestSample, indices)]));
  const clipRootRest = clipRestSample.positions[0];
  clips[targetName] = {
    fps,
    length,
    loop: true,
    keys: Array.from({ length }, (_, frame) => {
      const time = (frame / fps) * 1000;
      const sample = source.sample(selection.sequence, time);
      const rootDelta = sample.positions[0].map((v, axis) => v - clipRootRest[axis]);
      const joints = Object.fromEntries(Object.entries(sourceToTarget).map(([name, indices]) => {
        const point = avgPosition(sample, indices);
        return [name, toWildboundDelta(point, clipRest[name], rootDelta).map(v => +v.toFixed(4))];
      }));
      return { frame, joints };
    }),
  };
  sourceRecords[targetName] = {
    donorAnimation: selection.label,
    animationId: selection.animationId,
    sequenceIndex: selection.sequence,
    durationSeconds: duration,
    sampleRateFps: fps,
  };
}

const provenance = {
  donor: 'Wowhead NPC 61081 Squirrel, display 134, FileDataID 1129448',
  sourceUrl: 'https://wow.zamimg.com/modelviewer/live/m2/1129448.m2',
  sourceSha256: crypto.createHash('sha256').update(fs.readFileSync(input)).digest('hex'),
  sourceBones: source.bones.length,
  sourceSequences: source.sequences.length,
  conversion: 'World-space source pivots sampled from embedded v274 tracks; normalize each clip to its own frame-zero pose, remove bone-0 root drift on all axes, and map WoW (X forward, Y left, Z up) -> Wildbound [Y, X, Z] * 22. Positive donor Y maps to target R joints at positive local X. The clip-relative reference preserves the existing Wildbound crouched art pose instead of imposing the donor model’s upright stand pose.',
  sourceToTarget,
  mappedBones,
  mappingEvidence: 'Weights are summed directly from the v274 vertex boneIndices at byte 16 (these index bones[] directly; the separate boneCombos table is not applied). Torso1 has 84.45 weight units and centroid (-0.0399,0.0005,0.1283); its weighted child upper-torso4 has 87.47 units and centroid (0.0538,0.0005,0.1420); keyed head8 has 325.60 units and centroid (0.1264,0.0004,0.1967). Bone3 has zero vertex influence; it connects hind-leg branches 5/6 -> 11/12 -> 16/17 and is not used as chest. Tail branch is 2 -> 7 -> 13 -> 18 -> 21; base uses 2/7 (106.54/32.47), middle (13+18)/2 (22.49/49.51), tip 21 (109.45). Forelimbs are branches 9/10 -> 14/15 -> 19/20; all have nonzero influence, and terminal helpers 44/45 have zero weights but lie below weighted paw bones 19/20 and are averaged with them as paw endpoints. The donor has no separate weighted neck pivot; target neck shares weighted upper-torso bone4 rather than inventing an unsupported channel.',
  unmappedAnatomyBones: [0, 2, 3, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43].map(index => ({ index, parent: source.bones[index].parent, keyBone: source.bones[index].key, pivot: source.bones[index].pivot.map(value => +value.toFixed(4)), weightedVertexInfluence: +weightTotals[index].toFixed(2) })),
  sourceClips: sourceRecords,
  caveats: [
    'The Wildbound pixel art remains native and editable; donor meshes/textures are not bundled.',
    'The target joint mapping is explicit and based on donor hierarchy, bind-pivot coordinates and weighted-vertex regions.',
    'Ears, eyes and muzzle follow the donor head pivot because this donor exposes no separately weighted face parts in the selected target map.',
    'The source donor is upright in its idle; sampled donor motion is applied to the existing crouched quadruped pixel rig, so silhouette compatibility is approximate.',
    'The custom Wildbound leap remains separate; no donor jump clip was mapped in this pass.',
  ],
};

fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, `// Generated by scripts/import-squirrel-wow-motion.cjs from local Wowhead M2 source.\nexport const SQUIRREL_WOW_MOTION = ${JSON.stringify({ clips, provenance }, null, 2)};\n`);
console.log(JSON.stringify({ output, sourceBones: source.bones.length, sourceSequences: source.sequences.length, clips: Object.keys(clips), provenance }, null, 2));
