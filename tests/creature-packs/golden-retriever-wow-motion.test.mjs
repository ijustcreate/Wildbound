import test from 'node:test';
import assert from 'node:assert/strict';
import { GOLDEN_RETRIEVER_WOW_MOTION } from '../../src/golden-retriever-wow-motion-data.mjs';
import { goldenRetrieverWowClip, goldenRetrieverWowMotionProvenance } from '../../src/golden-retriever-wow-motion.mjs';
import { CREATURE_PACK } from '../../src/creature-packs/wildlife.mjs';
import { creaturePackVisualActor } from '../../src/creature-pack-animation-routing.mjs';
import { poseAt } from '../../src/player-motion.mjs';

test('Golden Retriever donor records exact, unique Stand/Walk/Run and the native joint map', () => {
  const p = goldenRetrieverWowMotionProvenance;
  assert.equal(p.donor, 'Wowhead NPC 120973 Golden Retriever, FileDataID 1599825');
  assert.equal(p.sourceBones, 73);
  assert.equal(p.sourceSequences, 31);
  assert.match(p.sourceSha256, /^[a-f\d]{64}$/);
  assert.deepEqual(p.sourceToTarget.pelvis, [2]);
  assert.deepEqual(p.sourceToTarget.chest, [3]);
  assert.deepEqual(p.sourceToTarget.head, [14]);
  assert.deepEqual(p.sourceToTarget.tailTip, [35]);
  assert.deepEqual(p.sourceToTarget.frontPawL, [29, 36]);
  assert.deepEqual(p.sourceToTarget.rearPawR, [27, 34]);
  for (const [name, sequenceIndex, animationId] of [
    ['idle', 0, 0], ['walk', 29, 4], ['run', 19, 5],
  ]) {
    const source = p.sourceClips[name], clip = GOLDEN_RETRIEVER_WOW_MOTION.clips[name];
    assert.equal(source.sequenceIndex, sequenceIndex);
    assert.equal(source.animationId, animationId);
    assert.equal(source.sourceAlias, false);
    assert.equal(source.fps, 24);
    assert.equal(source.loop, true);
    assert.equal(clip.length, source.frameCount);
    assert.ok(source.minimumSourcePawHeight >= -0.001, `${name} terminal source paws stay within 0.001 donor units of ground`);
    assert.ok(clip.keys.every(key => Object.values(key.joints).every(v => v.length === 3 && v.every(Number.isFinite))));
    assert.ok(Object.values(clip.keys[0].joints).every(v => v.every(n => n === 0)), `${name} starts at the sampled rest pose`);
  }
  assert.notDeepEqual(GOLDEN_RETRIEVER_WOW_MOTION.clips.walk.keys, GOLDEN_RETRIEVER_WOW_MOTION.clips.run.keys);
  assert.match(p.mappingCaveats, /not mesh skinning/);
});

test('Retriever routes donor idle/walk/run while retaining its friendly native actions', () => {
  const subject = CREATURE_PACK.subjects.golden_retriever, model = subject.defaults();
  assert.equal(model.motionDonorRevision, 1);
  for (const action of ['idle','walk','run']) {
    const clip = model.clips[action];
    assert.deepEqual(clip, goldenRetrieverWowClip(action));
    for (const frame of [0, Math.floor(clip.length / 4), Math.floor(clip.length / 2), clip.length - 1]) {
      const pose = poseAt(model, action, frame);
      assert.ok(Object.values(pose).every(v => v.every(Number.isFinite)), `${action} frame ${frame} is finite`);
    }
  }
  assert.notDeepEqual(poseAt(model, 'walk', 0), poseAt(model, 'walk', Math.floor(model.clips.walk.length / 2)));
  assert.notDeepEqual(poseAt(model, 'run', 0), poseAt(model, 'run', Math.floor(model.clips.run.length / 2)));
  assert.equal(creaturePackVisualActor({kind:'golden_retriever',hp:60,moving:false,animationAction:'idle'}).animationAction,'idle');
  assert.equal(creaturePackVisualActor({kind:'golden_retriever',hp:60,moving:true,walking:true,animationAction:'walk'}).animationAction,'walk');
  assert.equal(creaturePackVisualActor({kind:'golden_retriever',hp:60,moving:true,walking:false,animationAction:'run'}).animationAction,'run');
  for (const action of ['trot','sit','wag','fetch','attack','hurt','death']) assert.ok(model.clips[action], `${action} remains native and available`);
});

test('Retriever clips are independently editable and do not share references', () => {
  const first = goldenRetrieverWowClip('walk'), second = goldenRetrieverWowClip('walk');
  first.keys[0].joints.pelvis[0] = 999;
  assert.notEqual(second.keys[0].joints.pelvis[0], 999);
});
