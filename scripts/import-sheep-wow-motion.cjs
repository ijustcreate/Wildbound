// Convert only the exact embedded Wowhead Sheep Stand/Walk/Run tracks onto
// Wildbound's editable sheep joints. No donor mesh or texture is imported.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { loadM2 } = require('./lib/wow-m2.cjs');

const root = path.resolve(__dirname, '..');
const input = path.resolve(process.argv[2] || path.join(root, 'test-output/wow-motion-audit/1377131.m2'));
const output = path.resolve(process.argv[3] || path.join(root, 'src/sheep-wow-motion-data.mjs'));
if (!fs.existsSync(input)) throw Error(`Missing Sheep donor M2: ${input}`);

const source = loadM2(input);
if (source.bones.length !== 55 || source.sequences.length !== 9) {
  throw Error(`Unexpected Sheep donor layout: ${source.bones.length} bones / ${source.sequences.length} sequences`);
}

// v274 hierarchy and direct weighted vertex centers (documented in review):
// pelvis=2, chest=1, head=3 (key-bone lookup Head), jaw/muzzle=10 (Jaw),
// forelegs 4→11→19 and 5→12→20, hind legs 13→21→24→26 and 14→22→25→27.
// Source +Y maps to Wildbound +X / R; source -Y maps to -X / L.
const sourceToTarget = {
  pelvis: [2], chest: [1], neck: [1], head: [3], eyeL: [3], eyeR: [3], muzzle: [10],
  earR: [7], earL: [8],
  shoulderR: [4], shoulderL: [5], elbowR: [11], elbowL: [12],
  frontPawR: [19], frontPawL: [20],
  hipR: [13], hipL: [14],
  // Keep the intermediate hind-chain articulation visible in the native knee.
  kneeR: [21, 24], kneeL: [22, 25], rearPawR: [26], rearPawL: [27],
};
const sourceClips = {
  freeze: { sequence: 0, animationId: 0, label: 'Stand', loop: true },
  walk: { sequence: 4, animationId: 4, label: 'Walk', loop: true },
  run: { sequence: 5, animationId: 5, label: 'Run', loop: true },
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

// M2 v274 vertices contain four direct bones[] indices. The +0x78 array is
// boneCombos for skin batches and must not be used to remap these indices.
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
  if (!sequence || sequence.id !== selection.animationId || (sequence.flags & 64))
    throw Error(`Unexpected or aliased source sequence for Sheep ${targetName}`);
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
  donor: 'Wowhead NPC 61170 Sheep, FileDataID 1377131',
  sourceUrl: 'https://wow.zamimg.com/modelviewer/live/m2/1377131.m2',
  sourceSha256: crypto.createHash('sha256').update(bytes).digest('hex'),
  sourceFormat: 'M2 v274, embedded MD21 tracks; no external .anim files',
  sourceBones: source.bones.length, sourceVertices: vertices.count, keyBoneLookup,
  vertexInfluenceIndexing: 'v274 M2Vertex boneIndices directly index bones[]; MD20 +0x78 boneCombos is not a vertex remap.',
  coordinateConversion: `Source +X forward, +Y left, +Z up -> Wildbound [Y, X, Z] * ${scale}; each clip is relative to its frame-zero source pose and bone-0 root translation is removed each frame.`,
  sourceToTarget, mappedBones, sourceClips: clipRecords,
  preservedNativeActions: ['graze', 'bleat', 'bound', 'jump', 'attack', 'hurt', 'death'],
  unavailableDonorActions: 'The local source contains Stand, Stand variation, CombatWound, Death, Walk, Run, and AttackUnarmed. No jump or graze/bleat action exists. The 143 and 225 sequences are aliases resolving to Run; they are not independent motion.',
  unmappedSourceAnatomy: 'Source bone 28 and helper/batch bones 29–45 and 49–51 are non-skinned; source bone 9 and any motion-only helpers are not mapped. Eye anchors inherit the keyed head displacement (bone 3); source 7/8 are used as paired ear pivots. The target rig has one knee joint for a donor hind chain with two intermediate joints, so source 21/24 and 22/25 are averaged.',
  caveat: 'This is 2.5D positional retargeting of bone origins, not mesh skinning. Stand, Walk, and Run remain an unapproved motion draft pending the eight-facing Electron review.',
};

fs.writeFileSync(output, `// Generated by scripts/import-sheep-wow-motion.cjs from the local Wowhead M2 source.\nexport const SHEEP_WOW_MOTION = ${JSON.stringify({ clips, provenance }, null, 2)};\n`);
console.log(JSON.stringify({ output, clips: clipRecords, sourceSha256: provenance.sourceSha256, mappedBones: mappedBones.length }, null, 2));
