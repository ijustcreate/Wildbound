// Convert the exact Golden Retriever (NPC 120973) Wowhead M2 Stand/Walk/Run
// clips onto Wildbound's editable native quadruped joints. No donor mesh ships.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { loadM2 } = require('./lib/wow-m2.cjs');

const root = path.resolve(__dirname, '..');
const input = path.resolve(process.argv[2] || path.join(root, 'test-output/wow-motion-audit/1599825.m2'));
const output = path.resolve(process.argv[3] || path.join(root, 'src/golden-retriever-wow-motion-data.mjs'));
if (!fs.existsSync(input)) throw Error(`Missing Wowhead Golden Retriever M2: ${input}`);
const source = loadM2(input);
if (source.bones.length !== 73 || source.sequences.length !== 31) throw Error(`Unexpected Golden Retriever donor layout: ${source.bones.length} bones / ${source.sequences.length} sequences`);

// Evidence from source pivots and hierarchy: 2/3 are pelvis/chest; 4/5 are
// paired hind limbs; 8/9 are paired front limbs; 6→12→18→28→35 is the tail;
// 7→14 is neck/head. Positive donor Y maps to Wildbound R (+X). The target has
// fewer links, so each native intermediate joint averages two donor pivots.
const sourceToTarget = {
  pelvis: [2], chest: [3], neck: [7], head: [14], muzzle: [14], eyeL: [14], eyeR: [14],
  earL: [22], earR: [21], tailBase: [6], tailMid: [18, 28], tailTip: [35],
  hipL: [4], kneeL: [10, 16], rearPawL: [26, 33],
  hipR: [5], kneeR: [11, 17], rearPawR: [27, 34],
  shoulderL: [8], elbowL: [13, 19], frontPawL: [29, 36],
  shoulderR: [9], elbowR: [15, 25], frontPawR: [32, 37],
};
const sourceClips = {
  idle: { sequence: 0, animationId: 0, label: 'Stand', loop: true },
  walk: { sequence: 29, animationId: 4, label: 'Walk', loop: true },
  run: { sequence: 19, animationId: 5, label: 'Run', loop: true },
};
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

const clips = {}, clipRecords = {};
for (const [targetName, selection] of Object.entries(sourceClips)) {
  const sequence = source.sequences[selection.sequence];
  if (!sequence || sequence.id !== selection.animationId || sequence.variant !== 0 || (sequence.flags & 64))
    throw Error(`Unexpected or aliased Golden Retriever sequence for ${targetName}`);
  const durationMs = sequence.duration, fps = 24;
  const frameCount = Math.max(2, Math.ceil(durationMs / 1000 * fps));
  const restSample = source.sample(selection.sequence, 0);
  const rest = Object.fromEntries(Object.entries(sourceToTarget).map(([name, bones]) => [name, averagePosition(restSample, bones)]));
  const rootRest = restSample.positions[0], rootDrift = [], pawZ = [];
  clips[targetName] = {
    fps, length: frameCount, loop: selection.loop,
    keys: Array.from({ length: frameCount }, (_, frame) => {
      const time = Math.min(durationMs, frame / fps * 1000), sample = source.sample(selection.sequence, time);
      const rootDelta = sample.positions[0].map((value, axis) => value - rootRest[axis]);
      rootDrift.push(Math.hypot(...rootDelta));
      // Check terminal paw joints (not the mid-limb target pivots) across the
      // full clip so the grounding note reflects the actual foot endpoints.
      for (const index of [33, 34, 36, 37]) pawZ.push(sample.positions[index][2]);
      const joints = Object.fromEntries(Object.entries(sourceToTarget).map(([name, bones]) => {
        const point = averagePosition(sample, bones);
        return [name, toWildboundDelta(point, rest[name], rootDelta).map(value => +value.toFixed(4))];
      }));
      return { frame, joints };
    }),
  };
  clipRecords[targetName] = {
    sequenceIndex: selection.sequence, animationId: selection.animationId,
    donorAnimation: selection.label, durationMs, fps, frameCount, loop: selection.loop,
    sourceAlias: false, resolvedSequenceIndex: source.resolve(selection.sequence),
    sampledRootDriftUnits: +Math.max(...rootDrift).toFixed(5),
    minimumSourcePawHeight: +Math.min(...pawZ).toFixed(5),
  };
}

const bytes = fs.readFileSync(input), md20 = bytes.subarray(8, 8 + bytes.readUInt32LE(4));
const arrayAt = offset => ({ count: md20.readUInt32LE(offset), offset: md20.readUInt32LE(offset + 4) });
const vertices = arrayAt(60), influence = Array.from({ length: source.bones.length }, () => ({ weight: 0, xyz: [0, 0, 0] }));
for (let index = 0; index < vertices.count; index++) {
  const vertex = vertices.offset + index * 48, xyz = [0,1,2].map(axis => md20.readFloatLE(vertex + axis * 4));
  for (let lane = 0; lane < 4; lane++) {
    const weight = md20.readUInt8(vertex + 12 + lane) / 255, bone = md20.readUInt8(vertex + 16 + lane);
    if (!weight || !influence[bone]) continue;
    influence[bone].weight += weight;
    xyz.forEach((value, axis) => { influence[bone].xyz[axis] += value * weight; });
  }
}
const mappedBones = [...new Set(Object.values(sourceToTarget).flat())].map(index => {
  const bone = source.bones[index], record = influence[index], parentChain = [];
  for (let cursor = index; cursor >= 0; cursor = source.bones[cursor].parent) parentChain.unshift(cursor);
  return { index, parent: bone.parent, parentChain, keyBoneId: bone.key,
    pivot: bone.pivot.map(value => +value.toFixed(4)), weightedInfluence: +record.weight.toFixed(2),
    weightedCentroid: record.weight ? record.xyz.map(value => +(value / record.weight).toFixed(4)) : null };
});
const aliases = source.sequences.filter(sequence => sequence.flags & 64).map(sequence => ({
  index: sequence.index, animationId: sequence.id, variant: sequence.variant,
  durationMs: sequence.duration, aliasIndex: sequence.alias, resolvedIndex: source.resolve(sequence.index),
}));
const provenance = {
  donor: 'Wowhead NPC 120973 Golden Retriever, FileDataID 1599825',
  sourceUrl: 'https://wow.zamimg.com/modelviewer/live/m2/1599825.m2',
  sourceSha256: crypto.createHash('sha256').update(bytes).digest('hex'),
  sourceFormat: 'M2 v274, 73 bones, 31 sequences; external animation FileDataID 1600006 is referenced by the model.',
  sourceBones: source.bones.length, sourceVertices: vertices.count, sourceSequences: source.sequences.length,
  coordinateConversion: `Source +X forward, +Y left, +Z up -> Wildbound [Y, X, Z] * ${scale}; per-clip frame-zero-relative positions; bone-0 horizontal/vertical drift removed.`,
  sourceToTarget, mappedBones, sourceClips: clipRecords, aliasSequences: aliases,
  preservedNativeActions: ['trot','sit','wag','fetch','attack','hurt','death'],
  mappingCaveats: 'Positional retarget to existing Wildbound quadruped; pelvis/chest/head and four limb chains are mapped from the source parent/pivot hierarchy. Native head/eye/muzzle art remains independent; facial anchors follow the mapped head. This is not mesh skinning. Ground checks report terminal paw-joint pivot heights across all sampled frames; interpretation remains an approximation because the native pixel rig is not mesh-skinned.',
  rights: 'Blizzard source skeletal motion; original native Wildbound pixel art. Donor mesh/textures are not used.',
};
fs.writeFileSync(output, `// Generated from Wowhead NPC 120973 M2; donor mesh/texture are not included.\nexport const GOLDEN_RETRIEVER_WOW_MOTION = ${JSON.stringify({ clips, provenance }, null, 2)};\n`);
console.log(JSON.stringify({ output, clips: clipRecords, sourceSha256: provenance.sourceSha256, mappedBones: mappedBones.length, aliases: aliases.length }, null, 2));
