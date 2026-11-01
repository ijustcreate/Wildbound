// Donor-specific conversion of the exact Highlands Skunk M2. Transfers only
// distinct embedded actions with clear Wildbound rig targets.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { loadM2 } = require('./lib/wow-m2.cjs');

const root = path.resolve(__dirname, '..');
const input = path.resolve(process.argv[2] || path.join(root, 'test-output/wow-motion-audit/125956.m2'));
const output = path.resolve(process.argv[3] || path.join(root, 'src/skunk-wow-motion-data.mjs'));
if (!fs.existsSync(input)) throw Error(`Missing Skunk donor M2: ${input}`);
const source = loadM2(input);
if (source.bones.length !== 50 || source.sequences.length !== 29) throw Error(`Unexpected Skunk donor layout: ${source.bones.length} bones / ${source.sequences.length} sequences`);

// Weighted v272 regions plus parent/pivot evidence. WoW +X is forward and
// +Y is left; map +Y to Wildbound's +X / R joint suffix. Bone 18 is the M2
// Head key. Bone 44 is the head's forward-most facial pivot; it is used only
// as a derived muzzle handle, not claimed to be a named source jaw bone.
const sourceToTarget = {
  pelvis: [2], chest: [5], neck: [13], head: [18], eyeL: [18], eyeR: [18],
  muzzle: [44],
  shoulderR: [11], shoulderL: [12], elbowR: [16], elbowL: [17],
  frontPawR: [21], frontPawL: [22],
  hipR: [4], hipL: [6], kneeR: [8, 14], kneeL: [9, 15],
  rearPawR: [19], rearPawL: [20],
  tailBase: [7], tailMid: [10], tailTip: [35],
};
const sourceClips = {
  freeze: { sequence: 2, animationId: 0, variant: 0, label: 'Stand', loop: true },
  amble: { sequence: 0, animationId: 4, variant: 0, label: 'Walk', loop: true },
  scurry: { sequence: 1, animationId: 5, variant: 0, label: 'Run', loop: true },
  attack: { sequence: 3, animationId: 16, variant: 0, label: 'AttackUnarmed', loop: false },
  hurt: { sequence: 5, animationId: 9, variant: 0, label: 'CombatWound', loop: false },
  death: { sequence: 7, animationId: 1, variant: 0, label: 'Death', loop: false },
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

// The v272 vertex record stores four influence weights and four direct
// bone-array indices in each 48-byte record. No bone-combo lookup is applied.
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
    throw Error(`Unexpected or aliased source sequence for Skunk ${targetName}`);
  const durationMs = sequence.duration, fps = 24, length = Math.max(2, Math.ceil(durationMs / 1000 * fps));
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
        const point = averagePosition(sample, bones);
        return [name, toWildboundDelta(point, rest[name], rootDelta).map(value => +value.toFixed(4))];
      }));
      return { frame, joints };
    }),
  };
  clipRecords[targetName] = {
    sequenceIndex: selection.sequence, animationId: selection.animationId,
    variant: selection.variant, donorAnimation: selection.label, durationMs,
    fps, frameCount: length, loop: selection.loop,
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
const aliasSequences = source.sequences.filter(sequence => sequence.flags & 64).map(sequence => ({
  index: sequence.index, animationId: sequence.id, variant: sequence.variant,
  durationMs: sequence.duration, aliasIndex: sequence.alias, resolvedIndex: source.resolve(sequence.index),
}));
const provenance = {
  donor: 'Wowhead NPC 62907 Highlands Skunk, FileDataID 125956',
  sourceUrl: 'https://wow.zamimg.com/modelviewer/live/m2/125956.m2',
  sourceSha256: crypto.createHash('sha256').update(bytes).digest('hex'),
  sourceFormat: 'M2 v272, embedded MD21 tracks plus AFID external animation inventory',
  sourceBones: source.bones.length, sourceVertices: vertices.count,
  externalAnimationFiles: source.files,
  coordinateConversion: `Source +X forward, +Y left, +Z up -> Wildbound [Y, X, Z] * ${scale}; clip deltas are relative to their source frame-zero pose; bone-0 root translation is removed per frame.`,
  vertexInfluenceIndexing: 'v272 vertex bone indices directly address the M2 bones array; weights and indices are read from each 48-byte record.',
  keyBoneLookup,
  sourceToTarget, mappedBones, sourceClips: clipRecords, aliasSequences,
  preservedNativeActions: ['raise-tail', 'spray-warning', 'spray cloud behavior'],
  unavailableOrUnmapped: 'No donor tail-spray action is present. Keep Wildbound raise-tail and spray-warning. Stand variant 1 and nonessential sit/sleep/action clips are not transferred. IDs 43 and 44 (swim strafes) alias sequence 17 / ID 42 (forward swim); they are not independent tracks. IDs 42/43/44/45/41 are swim-only and remain unused.',
  mappingCaveats: 'The donor has three-fork fore/hind joint chains while the editable Wildbound Skunk uses shorter leg chains; hind knees average two intermediate donor points. Tail art is retained; bone 7 is an unweighted tail base connector, 10 drives the weighted plume, and 35 is an unweighted upper-tail pivot. Bone 44 is only a positional facial proxy, not asserted to be the named jaw.',
  editableArt: 'Only sampled joint-origin motion is transferred. Native Wildbound art, palette, silhouette, spray cloud, poison behavior, and one-minute cooldown are unchanged.',
};

fs.writeFileSync(output, `// Generated by scripts/import-skunk-wow-motion.cjs from the local Wowhead M2 source.\nexport const SKUNK_WOW_MOTION = ${JSON.stringify({ clips, provenance }, null, 2)};\n`);
console.log(JSON.stringify({ output, clips: clipRecords, sourceSha256: provenance.sourceSha256, mappedBones: mappedBones.length, aliases: aliasSequences.length }, null, 2));
