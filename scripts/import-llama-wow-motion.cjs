// Convert the exact Dottie (NPC 151788) Wowhead M2 Stand/Walk/Run tracks onto
// Wildbound's existing editable llama joints. No donor mesh or texture ships.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { loadM2 } = require('./lib/wow-m2.cjs');

const root = path.resolve(__dirname, '..');
const input = path.resolve(process.argv[2] || path.join(root, 'test-output/wow-motion-audit/2734738.m2'));
const output = path.resolve(process.argv[3] || path.join(root, 'src/llama-wow-motion-data.mjs'));
if (!fs.existsSync(input)) throw Error(`Missing Dottie donor M2: ${input}`);
const source = loadM2(input);
if (source.bones.length !== 70 || source.sequences.length !== 47) throw Error(`Unexpected Dottie donor layout: ${source.bones.length} bones / ${source.sequences.length} sequences`);

// Evidence uses the donor parent/pivot hierarchy and direct v274 vertex
// weights. Source +X points toward the face, +Y toward donor-left, and +Z up.
// Positive source Y maps to Wildbound R (+X); negative Y maps to L.
// Four limb chains are reduced to the editable llama's shoulder/elbow/paw and
// hip/knee/paw anchors. Ear and facial subparts remain attached to the head.
const sourceToTarget = {
  pelvis: [4], chest: [3], neck: [5], head: [13],
  muzzle: [13], eyeL: [13], eyeR: [13],
  earR: [21], earL: [22],
  tailBase: [12], tailMid: [18], tailTip: [18],
  shoulderR: [6], shoulderL: [7], elbowR: [23], elbowL: [25],
  frontPawR: [41], frontPawL: [42],
  hipR: [10], hipL: [11], kneeR: [28], kneeL: [29],
  rearPawR: [43], rearPawL: [44],
};
const sourceClips = {
  idle: { sequence: 3, animationId: 0, variant: 0, label: 'Stand', loop: true },
  walk: { sequence: 5, animationId: 4, variant: 0, label: 'Walk', loop: true },
  run: { sequence: 0, animationId: 5, variant: 0, label: 'Run', loop: true },
};
// Dottie's limb animation has about twice the excursion of the sheep donor.
// The Wildbound llama is a compact pixel rig, so halve the positional scale
// to keep hoof travel inside its authored silhouette.
const scale = 10;
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
  if (!sequence || sequence.id !== selection.animationId || sequence.variant !== selection.variant || (sequence.flags & 64))
    throw Error(`Unexpected or aliased Dottie source sequence for ${targetName}`);
  const durationMs = sequence.duration, fps = 24;
  const frameCount = Math.max(2, Math.ceil(durationMs / 1000 * fps));
  const restSample = source.sample(selection.sequence, 0);
  const rest = Object.fromEntries(Object.entries(sourceToTarget).map(([name, bones]) => [name, averagePosition(restSample, bones)]));
  const rootRest = restSample.positions[0];
  const rootDrift = [];
  clips[targetName] = {
    fps, length: frameCount, loop: selection.loop,
    keys: Array.from({ length: frameCount }, (_, frame) => {
      const time = Math.min(durationMs, frame / fps * 1000);
      const sample = source.sample(selection.sequence, time);
      const rootDelta = sample.positions[0].map((value, axis) => value - rootRest[axis]);
      rootDrift.push(Math.hypot(...rootDelta));
      const joints = Object.fromEntries(Object.entries(sourceToTarget).map(([name, bones]) => {
        const point = averagePosition(sample, bones);
        return [name, toWildboundDelta(point, rest[name], rootDelta).map(value => +value.toFixed(4))];
      }));
      return { frame, joints };
    }),
  };
  clipRecords[targetName] = {
    sequenceIndex: selection.sequence, animationId: selection.animationId,
    variant: selection.variant, donorAnimation: selection.label, durationMs,
    fps, frameCount, loop: selection.loop,
    sourceAlias: false, sourceAliasIndex: null, sequenceAliasField: sequence.alias,
    resolvedSequenceIndex: source.resolve(selection.sequence),
    sampledRootDriftUnits: +Math.max(...rootDrift).toFixed(5),
  };
}

const keyArray = arrayAt(52);
const keyBoneLookup = Array.from({ length: keyArray.count }, (_, index) => md20.readInt16LE(keyArray.offset + index * 2));
const mappedBones = [...new Set(Object.values(sourceToTarget).flat())].map(index => {
  const bone = source.bones[index], record = influence[index], parentChain = [];
  for (let cursor = index; cursor >= 0; cursor = source.bones[cursor].parent) parentChain.unshift(cursor);
  return {
    index, parent: bone.parent, parentChain,
    keyBoneId: bone.key, keyBoneTargetIndex: bone.key >= 0 ? keyBoneLookup[bone.key] : null,
    pivot: bone.pivot.map(value => +value.toFixed(4)),
    weightedInfluence: +record.weight.toFixed(2),
    weightedCentroid: record.weight ? record.xyz.map(value => +(value / record.weight).toFixed(4)) : null,
  };
});
const aliasSequences = source.sequences.filter(sequence => sequence.flags & 64).map(sequence => ({
  index: sequence.index, animationId: sequence.id, variant: sequence.variant,
  durationMs: sequence.duration, aliasIndex: sequence.alias,
  resolvedIndex: source.resolve(sequence.index),
}));
const provenance = {
  donor: 'Wowhead NPC 151788 Dottie, FileDataID 2734738',
  sourceUrl: 'https://wow.zamimg.com/modelviewer/live/m2/2734738.m2',
  sourceSha256: crypto.createHash('sha256').update(bytes).digest('hex'),
  sourceFormat: 'M2 v274, 70 bones, 1773 embedded vertices, 47 sequences; MD21 tracks',
  sourceBones: source.bones.length, sourceVertices: vertices.count, sourceSequences: source.sequences.length,
  keyBoneLookup,
  vertexInfluenceIndexing: 'v274 M2Vertex boneIndices directly index bones[]; weights are aggregated from each 48-byte vertex record. The separate boneCombos table is not applied to vertex indices.',
  coordinateConversion: `Source +X forward, +Y left, +Z up -> Wildbound [Y, X, Z] * ${scale}; each action is relative to its own frame-zero pose and bone-0 root drift is removed on all axes.`,
  sourceToTarget, mappedBones, sourceClips: clipRecords, aliasSequences,
  preservedNativeActions: ['trot', 'spit-warning', 'kick', 'attack', 'hurt', 'death'],
  intentionallyUnmappedActions: 'Only the exact non-aliased Stand, Walk, and Run clips are transferred. Dottie includes AttackUnarmed ID 16, Death ID 1 and swim IDs 41–45, but those motions are not assigned to Wildbound kick/spit/custom actions without an approved semantic match. Alias records are inventoried above and are not sampled as separate clips.',
  mappingCaveats: 'The target keeps its current llama skeleton and pixels. Dottie has longer/skinnier source proportions and several extra limb/helper bones; four limb chains are reduced to the existing shoulder/elbow/paw and hip/knee/paw joints. Eyes and muzzle inherit the source head pivot (13); ears use paired upper-head bones 21/22. Tail bones 12/18 provide a coarse base/tip motion because the target art has a short tail. This is a positional retarget, not mesh skinning; the original donor mesh/texture are not shipped.',
  referenceTurnarounds: ['test-output/modelviewer-references/151788-dottie-front-idle.png','test-output/modelviewer-references/151788-dottie-side-idle.png','test-output/modelviewer-references/151788-dottie-opposite-side-idle.png','test-output/modelviewer-references/151788-dottie-rear-idle.png'],
};

fs.writeFileSync(output, `// Generated by scripts/import-llama-wow-motion.cjs from the local Wowhead M2 source.\nexport const LLAMA_WOW_MOTION = ${JSON.stringify({ clips, provenance }, null, 2)};\n`);
console.log(JSON.stringify({ output, clips: clipRecords, sourceSha256: provenance.sourceSha256, mappedBones: mappedBones.length, aliases: aliasSequences.length }, null, 2));
