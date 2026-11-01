const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { loadM2 } = require('./lib/wow-m2.cjs');

const root = path.resolve(__dirname, '..');
const input = path.resolve(process.argv[2] || path.join(root, 'test-output/wow-motion-audit/3386315.m2'));
const output = path.resolve(process.argv[3] || path.join(root, 'src/clinging-remains-wow-motion-data.mjs'));
if (!fs.existsSync(input)) throw Error(`Missing Clinging Remains M2 donor: ${input}`);
const source = loadM2(input);
if (source.bones.length !== 40 || source.sequences.length !== 12) {
  throw Error(`Unexpected Clinging Remains donor layout: ${source.bones.length} bones / ${source.sequences.length} sequences`);
}

// NPC 179179 / Clinging Remains, Wowhead FileDataID 3386315. The hand donor
// contains an independently weighted forearm root (0), palm (1), four
// two-bone finger chains (2..5 -> 8..11), and a three-bone thumb (6 -> 7 -> 12).
// Wildbound stores each editable joint as an absolute offset from its own rig
// rest pose. Midpoint targets interpolate the donor's two-segment fingers.
const targetTracks = {
  wrist: [{ bones: [0] }],
  palm: [{ bones: [1] }],
  thumbBase: [{ bones: [7] }], thumbTip: [{ bones: [12] }],
};
for (let finger = 0; finger < 4; finger++) {
  const base = 2 + finger, tip = 8 + finger;
  targetTracks[`finger${finger}`] = [{ bones: [base] }];
  targetTracks[`finger${finger}Mid`] = [{ bones: [base], weight: .5 }, { bones: [tip], weight: .5 }];
  targetTracks[`finger${finger}Tip`] = [{ bones: [tip] }];
}

// Source sequence indices are checked against their animation IDs and alias
// flag. IDs 213-216 are real, independent tracks, but their semantics are
// uncertain and their root motion is large; they are deliberately excluded.
// IDs 0/4/16 are the standard Stand/Walk/AttackUnarmed records.
const sourceClips = {
  crawl: { sequence: 6, animationId: 4, label: 'Walk', loop: true },
  grab: { sequence: 8, animationId: 16, label: 'AttackUnarmed', loop: false },
};
const fps = 24, scale = 14, clips = {}, sourceRecords = {};
const pointFor = (sample, entries) => entries.reduce((sum, entry) => {
  const p = entry.bones.reduce((v, index) => v.map((n, axis) => n + sample.positions[index][axis] / entry.bones.length), [0, 0, 0]);
  return sum.map((n, axis) => n + p[axis] * (entry.weight ?? 1));
}, [0, 0, 0]);
const convert = (point, rest, rootDelta, keepRootMotion = false) => [
  (point[1] - rest[1] - (keepRootMotion ? 0 : rootDelta[1])) * scale,
  (point[0] - rest[0] - (keepRootMotion ? 0 : rootDelta[0])) * scale,
  (point[2] - rest[2] - (keepRootMotion ? 0 : rootDelta[2])) * scale,
].map(value => Math.max(-8, Math.min(8, value)));

for (const [action, selection] of Object.entries(sourceClips)) {
  const sequence = source.sequences[selection.sequence];
  if (!sequence || sequence.id !== selection.animationId || sequence.flags & 64) {
    throw Error(`Unexpected donor sequence ${selection.sequence} for Clinging Remains ${action}`);
  }
  const length = Math.max(2, Math.ceil(sequence.duration / 1000 * fps));
  const restSample = source.sample(selection.sequence, 0);
  const rests = Object.fromEntries(Object.entries(targetTracks).map(([name, entries]) => [name, pointFor(restSample, entries)]));
  const rootRest = restSample.positions[0];
  clips[action] = {
    fps, length, loop: selection.loop,
    keys: Array.from({ length }, (_, frame) => {
      const time = Math.min(sequence.duration, frame / fps * 1000);
      const sample = source.sample(selection.sequence, time);
      const rootDelta = sample.positions[0].map((value, axis) => value - rootRest[axis]);
      const joints = Object.fromEntries(Object.entries(targetTracks).map(([name, entries]) => [
        name,
        convert(pointFor(sample, entries), rests[name], rootDelta, name === 'wrist').map(value => +value.toFixed(4)),
      ]));
      return { frame, joints };
    }),
  };
  sourceRecords[action] = { animation: selection.label, animationId: selection.animationId, sequenceIndex: selection.sequence, durationMs: sequence.duration, fps, looping: selection.loop };
}

const file = fs.readFileSync(input);
const md20 = file.subarray(8, 8 + file.readUInt32LE(4));
const readArray = offset => ({ count: md20.readUInt32LE(offset), offset: md20.readUInt32LE(offset + 4) });
const vertices = readArray(60), weightTotals = Array.from({ length: source.bones.length }, () => 0);
for (let index = 0; index < vertices.count; index++) {
  const vertex = vertices.offset + index * 48;
  for (let influence = 0; influence < 4; influence++) {
    const weight = md20.readUInt8(vertex + 12 + influence) / 255;
    const bone = md20.readUInt8(vertex + 16 + influence);
    if (weight && weightTotals[bone] != null) weightTotals[bone] += weight;
  }
}
const mappedBones = [...new Set(Object.values(targetTracks).flatMap(entries => entries.flatMap(entry => entry.bones)))].map(index => ({
  index, parent: source.bones[index].parent, keyBone: source.bones[index].key,
  pivot: source.bones[index].pivot.map(value => +value.toFixed(4)), weightedVertexInfluence: +weightTotals[index].toFixed(2),
}));
const provenance = {
  donor: 'Wowhead NPC 179179 Clinging Remains, FileDataID 3386315',
  sourceUrl: 'https://wow.zamimg.com/modelviewer/live/m2/3386315.m2',
  sourceSha256: crypto.createHash('sha256').update(file).digest('hex'),
  sourceFormat: 'M2 v274 with embedded MD21 tracks', sourceBones: source.bones.length, sourceVertices: vertices.count,
  coordinateConversion: 'Source X forward, Y left, Z up -> Wildbound [Y, X, Z] * 14, then each positional channel is clamped to +/-8 Wildbound pixels to contain source-space attack travel. Donor bone 0 motion remains on wrist as forearm lift; its per-frame translation is removed from palm and digit tracks to retain local articulation.',
  sourceToTarget: targetTracks, mappedBones, sourceClips: sourceRecords,
  aliasReview: 'Stand is sequence 0 / ID 0; Walk is sequence 6 / ID 4; Run is sequence 5 / ID 5; CombatWound is sequence 7 / ID 9; AttackUnarmed is sequence 8 / ID 16; Death is sequence 9 / ID 1. None has the M2 alias flag (flags & 64). Independent IDs 213–216 are not aliased but remain unmapped because their clip semantics are uncertain and root travel is large.',
  editableArt: 'Only donor joint motion is transferred. Existing Wildbound pixels, palette/eye treatment, AI, native idle/warning/recover/hurt/death clips remain in place.',
};
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, `// Generated by scripts/import-clinging-remains-wow-motion.cjs from the local Wowhead M2 source.\nexport const CLINGING_REMAINS_WOW_MOTION = ${JSON.stringify({ clips, provenance }, null, 2)};\n`);
console.log(JSON.stringify({ output, clips: sourceRecords, provenance }, null, 2));
