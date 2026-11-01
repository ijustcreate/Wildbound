const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { loadM2 } = require('./lib/wow-m2.cjs');

const root = path.resolve(__dirname, '..');
const input = path.resolve(process.argv[2] || path.join(root, 'test-output/wow-motion-audit/4080510.m2'));
const output = path.resolve(process.argv[3] || path.join(root, 'src/blinky-wow-motion-data.mjs'));
if (!fs.existsSync(input)) throw Error(`Missing Blinky donor M2: ${input}`);

const source = loadM2(input);
if (source.bones.length !== 66 || source.sequences.length !== 17) {
  throw Error(`Unexpected Blinky donor layout: ${source.bones.length} bones / ${source.sequences.length} sequences`);
}

// NPC 179589 / Blinky, FileDataID 4080510. The fitted anatomical map follows
// embedded v274 vertex weights, parent chains and rest pivots: 2 is the body,
// 10 the neck, 11 the keybone-6 head, 19 the keybone-7 jaw, 4/12/22 and
// 5/13/23 are the opposing wing root/mid/tip chains, 6/14/24 and 7/15/25 are
// front legs, 17/27 and 18/28 are rear legs, and 26..34 form the curled tail.
// Donor +Y maps to target R; source +X is forward; Z is up.
const sourceToTarget = {
  pelvis: [8], chest: [2, 3], neck: [10], head: [11], snout: [19], jaw: [19],
  eyeL: [11], eyeR: [11],
  tailBase: [26], tailTip: [34],
  wingRootR: [4], wingTipR: [22], wingFingerR: [49],
  wingRootL: [5], wingTipL: [23], wingFingerL: [50],
  shoulderR: [7], elbowR: [15], frontPawR: [25],
  shoulderL: [6], elbowL: [14], frontPawL: [24],
  hipR: [17], kneeR: [27], rearPawR: [27],
  hipL: [18], kneeL: [28], rearPawL: [28],
};
const sourceClips = {
  idle: { sequence: 0, animationId: 0, label: 'Stand', loop: true },
  walk: { sequence: 2, animationId: 4, label: 'Walk', loop: true },
  run: { sequence: 3, animationId: 5, label: 'Run', loop: true },
  breath: { sequence: 6, animationId: 16, label: 'AttackUnarmed', loop: false },
};

// v274 M2Vertex has four direct indices into bones[] (the distinct boneCombos
// table at MD20 +0x78 is batch/skin data and is not an influence remap).
const file = fs.readFileSync(input);
const md20 = file.subarray(8, 8 + file.readUInt32LE(4));
const readArray = offset => ({ count: md20.readUInt32LE(offset), offset: md20.readUInt32LE(offset + 4) });
const vertices = readArray(60);
const weightTotals = Array.from({ length: source.bones.length }, () => 0);
for (let index = 0; index < vertices.count; index++) {
  const vertex = vertices.offset + index * 48;
  for (let influence = 0; influence < 4; influence++) {
    const weight = md20.readUInt8(vertex + 12 + influence) / 255;
    const bone = md20.readUInt8(vertex + 16 + influence);
    if (weight && weightTotals[bone] != null) weightTotals[bone] += weight;
  }
}

const fps = 24, scale = 14;
const averagePosition = (sample, indices) => indices.reduce(
  (sum, index) => sum.map((value, axis) => value + sample.positions[index][axis] / indices.length), [0, 0, 0],
);
const convertDelta = (point, restPoint, rootDelta) => [
  (point[1] - restPoint[1] - rootDelta[1]) * scale,
  (point[0] - restPoint[0] - rootDelta[0]) * scale,
  (point[2] - restPoint[2] - rootDelta[2]) * scale,
];
const clips = {}, sourceRecords = {};
for (const [targetName, selection] of Object.entries(sourceClips)) {
  const sequence = source.sequences[selection.sequence];
  if (!sequence || sequence.id !== selection.animationId || (sequence.flags & 64)) {
    throw Error(`Unexpected donor sequence for Blinky ${targetName}`);
  }
  const durationMs = sequence.duration;
  const length = Math.max(2, Math.ceil(durationMs / 1000 * fps));
  const restSample = source.sample(selection.sequence, 0);
  const rest = Object.fromEntries(Object.entries(sourceToTarget).map(([name, indices]) => [name, averagePosition(restSample, indices)]));
  const rootRest = restSample.positions[0];
  clips[targetName] = {
    fps, length, loop: selection.loop,
    keys: Array.from({ length }, (_, frame) => {
      const time = Math.min(durationMs, frame / fps * 1000);
      const sample = source.sample(selection.sequence, time);
      const rootDelta = sample.positions[0].map((value, axis) => value - rootRest[axis]);
      const joints = Object.fromEntries(Object.entries(sourceToTarget).map(([name, indices]) => {
        const point = averagePosition(sample, indices);
        return [name, convertDelta(point, rest[name], rootDelta).map(value => +value.toFixed(4))];
      }));
      return { frame, joints };
    }),
  };
  sourceRecords[targetName] = {
    animation: selection.label, animationId: selection.animationId,
    sequenceIndex: selection.sequence, durationMs, fps, looping: selection.loop,
  };
}

const mappedBones = [...new Set(Object.values(sourceToTarget).flat())].map(index => ({
  index,
  parent: source.bones[index].parent,
  keyBone: source.bones[index].key,
  pivot: source.bones[index].pivot.map(value => +value.toFixed(4)),
  weightedVertexInfluence: +weightTotals[index].toFixed(2),
}));
const sha256 = crypto.createHash('sha256').update(file).digest('hex');
const provenance = {
  donor: 'Wowhead NPC 179589 Blinky / Butterfly Dragon, FileDataID 4080510',
  sourceUrl: 'https://wow.zamimg.com/modelviewer/live/m2/4080510.m2',
  sourceSha256: sha256,
  sourceFormat: 'M2 v274, embedded MD21 tracks',
  sourceBones: source.bones.length,
  sourceVertices: vertices.count,
  keyBoneLookup: { head: 11, jaw: 19, sourceHeadKeyBoneIndex: 6, sourceJawKeyBoneIndex: 7 },
  coordinateConversion: 'Source X forward, Y left, Z up -> Wildbound [Y, X, Z] * 14; bone-0 root translation is removed per frame; clips are relative to their own frame-zero source pose.',
  vertexInfluenceIndexing: 'The v274 M2Vertex boneIndices directly index the M2 bones array; MD20 +0x78 boneCombos is not applied to vertex influences.',
  sourceToTarget,
  mappedBones,
  sourceClips: sourceRecords,
  flightClipLimit: 'The apparent source animation ID 135 is an alias chain 4 -> 5 -> 3, resolving to the Run sequence (animation ID 5); it is not independent flight motion. The native editable Wildbound fly clip is retained. IDs 131 and 132 are not used as flight clips.',
  editableArt: 'Only sampled joint motion is transferred. Native Wildbound Butterfly Dragon pixels, palette, behavior, and silhouette remain editable and unchanged.',
};

fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, `// Generated by scripts/import-blinky-wow-motion.cjs from the local Wowhead M2 source.\nexport const BLINKY_WOW_MOTION = ${JSON.stringify({ clips, provenance }, null, 2)};\n`);
console.log(JSON.stringify({ output, clips: sourceRecords, provenance }, null, 2));
