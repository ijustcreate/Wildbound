import test from 'node:test';
import assert from 'node:assert/strict';
import { TURKEY_WOW_MOTION_DRAFT } from '../../src/turkey-wow-motion-data.mjs';
import { turkeyWowMotionDraftModel } from '../../src/turkey-wow-motion-draft.mjs';

test('Turkey draft provenance identifies the exact Wowhead donor and evidence-backed pivots', () => {
  const { provenance } = TURKEY_WOW_MOTION_DRAFT;
  assert.equal(provenance.donor, 'Wowhead NPC 62648 Turkey, FileDataID 126278');
  assert.equal(provenance.sourceFormat, 'M2 v274, embedded MD21 tracks; no external .anim dependencies');
  assert.match(provenance.vertexInfluenceIndexing, /directly index bones\[\]/);
  assert.deepEqual(provenance.sourceToTarget.head, [26]);
  assert.deepEqual(provenance.sourceToTarget.beak, [27]);
  assert.deepEqual(provenance.sourceToTarget.wingL, [7]);
  assert.deepEqual(provenance.sourceToTarget.wingR, [6]);
  assert.deepEqual(provenance.sourceToTarget.footL, [23]);
  assert.deepEqual(provenance.sourceToTarget.footR, [22]);
  assert.equal(provenance.mappedBones.find(bone => bone.index === 26).keyBoneTargetIndex, 26);
  assert.ok(provenance.mappedBones.every(bone => bone.weightedInfluence > 0 || [9, 10].includes(bone.index)), 'only the paired hip parents are unweighted; their knee/foot descendants are weighted');
});

test('only verified Stand, Walk, Run, Attack and Death clips are transferred with exact source timing', () => {
  const expected = {
    stand: [0, 0, 2834, 69, true],
    walk: [6, 4, 1000, 24, true],
    run: [4, 5, 700, 17, true],
    attack: [7, 16, 1000, 24, false],
    death: [9, 1, 1767, 43, false],
  };
  assert.deepEqual(Object.keys(TURKEY_WOW_MOTION_DRAFT.clips), Object.keys(expected));
  for (const [name, [sequence, animationId, durationMs, frameCount, loop]] of Object.entries(expected)) {
    const record = TURKEY_WOW_MOTION_DRAFT.provenance.sourceClips[name];
    const clip = TURKEY_WOW_MOTION_DRAFT.clips[name];
    assert.deepEqual([record.sequenceIndex, record.animationId, record.durationMs, record.frameCount, record.loop], [sequence, animationId, durationMs, frameCount, loop]);
    assert.equal(clip.fps, 24);
    assert.equal(clip.length, frameCount);
    assert.equal(clip.loop, loop);
    assert.deepEqual(Object.keys(clip.keys[0].joints), Object.keys(TURKEY_WOW_MOTION_DRAFT.provenance.sourceToTarget));
    assert.ok(clip.keys.every(key => Object.values(key.joints).every(delta => delta.length === 3 && delta.every(Number.isFinite))));
    assert.ok(Object.values(clip.keys[0].joints).every(delta => delta.every(value => value === 0)), `${name} begins at its source rest pose`);
    assert.ok(clip.keys.some(key => Object.values(key.joints).some(delta => Math.hypot(...delta) > .5)), `${name} contains visible sampled movement`);
  }
});

test('Turkey motion remains an isolated draft and leaves native pixels, behavior clips and model data untouched', () => {
  // Small representative model fixture lets this donor-data test run while
  // WildlifePack is being edited by the parallel Llama transfer pass.
  const native = {
    joints: { pelvis:{position:[0,0,11]}, wingL:{position:[-7,0,14]} },
    palette: { body:'#78604b', outline:'#342c2a' },
    shape: { bodyWidth:11, tailWidth:16 },
    clips: Object.fromEntries(['idle','strut','flap-run','flap-attack','hurt','death','peck'].map((name,index)=>[name,{fps:10,length:6,loop:name==='idle',keys:[{frame:0,joints:{pelvis:[index,0,0]}}]}])),
  };
  const baseline = structuredClone(native);
  const draft = turkeyWowMotionDraftModel(native);
  assert.deepEqual(native, baseline, 'building a draft does not mutate the source model');
  assert.deepEqual(draft.joints, baseline.joints);
  assert.deepEqual(draft.palette, baseline.palette);
  assert.deepEqual(draft.shape, baseline.shape);
  for (const action of ['strut', 'peck', 'flap-run', 'flap-attack', 'hurt', 'death'])
    assert.deepEqual(draft.clips[action], baseline.clips[action], `${action} stays native and unchanged`);
  for (const action of Object.keys(TURKEY_WOW_MOTION_DRAFT.clips))
    assert.deepEqual(draft.clips[`wowhead-${action}`], TURKEY_WOW_MOTION_DRAFT.clips[action]);
  assert.equal(native.motionSource, undefined, 'no runtime donor integration is claimed');
});
