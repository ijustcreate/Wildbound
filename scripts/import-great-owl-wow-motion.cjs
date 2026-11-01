const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { loadM2 } = require('./lib/wow-m2.cjs');

const root = path.resolve(__dirname, '..');
const input = path.resolve(process.argv[2] || path.join(root, 'test-output/wow-motion-audit/1031301.m2'));
const output = path.resolve(process.argv[3] || path.join(root, 'src/great-owl-wow-motion-data.mjs'));
if (!fs.existsSync(input)) throw Error(`Missing Great Owl donor M2: ${input}`);

const source = loadM2(input);
if (source.bones.length !== 45 || source.sequences.length !== 77) {
  throw Error(`Unexpected Great Owl donor layout: ${source.bones.length} bones / ${source.sequences.length} sequences`);
}

// NPC 85676 / Archimedes, model 7743, FileDataID 1031301. The numeric map
// below is derived from the v274 parent/pivot hierarchy and vertex weights.
// Head and Jaw are also anchored by key-bone lookup entries 6=>11 and 7=>19.
// WoW axes are X-forward, Y-left, Z-up; the Wildbound art rig uses
// [source Y, source X, source Z] and suffix R at positive local X.
const sourceToTarget = {
  pelvis: [1], chest: [3], neck: [4], head: [11],
  eyeL: [11], eyeR: [11], beak: [19],
  tailTip: [16],
  wingRootR: [2], wingTipR: [15], wingFingerR: [14],
  wingRootL: [5], wingTipL: [24], wingFingerL: [23],
  // Source +Y is the donor's left and maps to the Wildbound rig's +X / R.
  hipL: [17], kneeL: [26], footL: [29],
  hipR: [18], kneeR: [27], footR: [30],
};
const sourceClips = {
  idle: { sequence: 22, animationId: 0, label: 'Stand', loop: true },
  walk: { sequence: 38, animationId: 4, label: 'Walk', loop: true },
  swoop: { sequence: 65, animationId: 16, label: 'AttackUnarmed', loop: false },
};
const scale = 14;
const clips = {}, sourceRecords = {};
const averagePosition = (sample, indices) => indices.reduce(
  (sum, index) => sum.map((value, axis) => value + sample.positions[index][axis] / indices.length),
  [0, 0, 0],
);
const convertDelta = (point, restPoint, rootDelta) => [
  (point[1] - restPoint[1] - rootDelta[1]) * scale,
  (point[0] - restPoint[0] - rootDelta[0]) * scale,
  (point[2] - restPoint[2] - rootDelta[2]) * scale,
];

for (const [targetName, selection] of Object.entries(sourceClips)) {
  const sequence = source.sequences[selection.sequence];
  if (!sequence || sequence.id !== selection.animationId || sequence.flags & 64) {
    throw Error(`Unexpected donor sequence for Great Owl ${targetName}`);
  }
  const durationMs = sequence.duration;
  const fps = 24;
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
    animation: selection.label,
    animationId: selection.animationId,
    sequenceIndex: selection.sequence,
    durationMs,
    fps,
    looping: selection.loop,
  };
}

// Confirm weight support for mapped joints directly from MD20's v274 vertex
// array. Each record is 48 bytes; v274 M2Vertex.boneIndices address bones[].
// The header array at 0x78 is boneCombos (batch/skin combo data), not a
// per-vertex remap. This follows WhiteoutLib's M2 spec §6.1/§8.1.
const file = fs.readFileSync(input);
const md20 = file.subarray(8, 8 + file.readUInt32LE(4));
const readArray = offset => ({ count: md20.readUInt32LE(offset), offset: md20.readUInt32LE(offset + 4) });
const vertices = readArray(60);
const weightTotals = Array.from({ length: source.bones.length }, () => 0);
for (let index = 0; index < vertices.count; index++) {
  const vertex = vertices.offset + index * 48;
  for (let influence = 0; influence < 4; influence++) {
    const weight = md20.readUInt8(vertex + 12 + influence);
    const bone = md20.readUInt8(vertex + 16 + influence);
    if (weight && weightTotals[bone] != null) weightTotals[bone] += weight / 255;
  }
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
  donor: 'Wowhead NPC 85676 Archimedes / Great Owl, display 59034, model 7743, FileDataID 1031301',
  sourceUrl: 'https://wow.zamimg.com/modelviewer/live/m2/1031301.m2',
  sourceSha256: sha256,
  sourceFormat: 'M2 v274, embedded MD21 tracks',
  sourceBones: source.bones.length,
  sourceVertices: vertices.count,
  keyBoneLookup: { head: 11, jaw: 19, sourceHeadKeyBoneIndex: 6, sourceJawKeyBoneIndex: 7 },
  coordinateConversion: 'Source X forward, Y left, Z up -> Wildbound [Y, X, Z] * 14; bone-0 root translation is removed per frame; clips are relative to their own frame-zero source pose.',
  vertexInfluenceIndexing: 'The v274 M2Vertex boneIndices directly index the M2 bones array; the MD20 +0x78 boneCombos table is not applied to vertex influences.',
  sourceToTarget,
  mappedBones,
  sourceClips: sourceRecords,
  flightClipLimit: 'The donor contains tier-3 flight behavior aliases, but they resolve to ground Stand and have no independent flight track. The existing editable Wildbound glide clip is retained; no source flight motion is claimed.',
  editableArt: 'Only sampled joint motion is transferred. Native Wildbound Owl pixels, palette, behavior, and silhouette remain editable and unchanged.',
};

fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, `// Generated by scripts/import-great-owl-wow-motion.cjs from the local Wowhead M2 source.\nexport const GREAT_OWL_WOW_MOTION = ${JSON.stringify({ clips, provenance }, null, 2)};\n`);
console.log(JSON.stringify({ output, clips: sourceRecords, provenance }, null, 2));
