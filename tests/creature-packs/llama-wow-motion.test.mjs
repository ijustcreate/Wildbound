import test from 'node:test';
import assert from 'node:assert/strict';
import { LLAMA_WOW_MOTION } from '../../src/llama-wow-motion-data.mjs';
import { llamaWowClip, llamaWowMotionProvenance } from '../../src/llama-wow-motion.mjs';
import { CREATURE_PACK } from '../../src/creature-packs/wildlife.mjs';
import { creaturePackVisualActor } from '../../src/creature-pack-animation-routing.mjs';
import { poseAt } from '../../src/player-motion.mjs';

test('Dottie donor provenance records exact non-aliased Stand, Walk and Run tracks', () => {
  const p = llamaWowMotionProvenance;
  assert.equal(p.donor, 'Wowhead NPC 151788 Dottie, FileDataID 2734738');
  assert.equal(p.sourceBones, 70);
  assert.equal(p.sourceVertices, 1773);
  assert.equal(p.sourceSequences, 47);
  assert.match(p.sourceSha256, /^[a-f\d]{64}$/);
  assert.deepEqual(p.sourceToTarget.pelvis, [4]);
  assert.deepEqual(p.sourceToTarget.chest, [3]);
  assert.deepEqual(p.sourceToTarget.head, [13]);
  assert.deepEqual(p.sourceToTarget.shoulderR, [6]);
  assert.deepEqual(p.sourceToTarget.shoulderL, [7]);
  assert.deepEqual(p.sourceToTarget.frontPawR, [41]);
  assert.deepEqual(p.sourceToTarget.rearPawL, [44]);
  for (const [name, sequenceIndex, animationId, length] of [
    ['idle', 3, 0, 48], ['walk', 5, 4, 29], ['run', 0, 5, 15],
  ]) {
    const source = p.sourceClips[name];
    assert.equal(source.sequenceIndex, sequenceIndex);
    assert.equal(source.animationId, animationId);
    assert.equal(source.frameCount, length);
    assert.equal(source.sourceAlias, false);
    assert.equal(source.fps, 24);
    assert.equal(source.loop, true);
    assert.equal(LLAMA_WOW_MOTION.clips[name].length, length);
    assert.equal(LLAMA_WOW_MOTION.clips[name].keys[0].frame, 0);
    assert.ok(LLAMA_WOW_MOTION.clips[name].keys.every(key => Object.values(key.joints).every(v => v.length === 3 && v.every(Number.isFinite))));
  }
  assert.ok(p.aliasSequences.some(alias => alias.animationId === 746 && alias.resolvedIndex === 0));
  assert.ok(p.aliasSequences.some(alias => alias.animationId === 742 && alias.resolvedIndex === 3));
  assert.match(p.mappingCaveats, /positional retarget/);
});

test('llama routes native editable Stand, Walk and Run while retaining custom actions', () => {
  const subject = CREATURE_PACK.subjects.llama;
  const model = subject.defaults();
  for (const action of ['idle', 'walk', 'run']) {
    const clip = model.clips[action];
    assert.equal(clip.fps, 24);
    assert.equal(clip.length, llamaWowMotionProvenance.sourceClips[action].frameCount);
    assert.equal(clip.loop, true);
    assert.ok(clip.keys.every(key => Object.values(key.joints).every(v => v.length === 3 && v.every(Number.isFinite))));
    assert.ok(Object.values(clip.keys[0].joints).every(v => v.every(n => n === 0)), `${action} starts from its sampled rest pose`);
    for (const frame of [0, Math.floor(clip.length / 4), Math.floor(clip.length / 2), clip.length - 1]) {
      const pose = poseAt(model, action, frame);
      assert.ok(Object.values(pose).every(v => v.every(Number.isFinite)), `${action} frame ${frame} has a finite pose`);
    }
  }
  assert.notDeepEqual(model.clips.walk.keys, model.clips.run.keys, 'Walk and Run are separate donor takes');
  assert.equal(creaturePackVisualActor({ kind: 'llama', hp: 62, moving: false }).animationAction, 'idle');
  assert.equal(creaturePackVisualActor({ kind: 'llama', hp: 62, moving: true, walking: true }).animationAction, 'walk');
  assert.equal(creaturePackVisualActor({ kind: 'llama', hp: 62, moving: true, walking: false }).animationAction, 'run');
  assert.equal(creaturePackVisualActor({ kind: 'llama', hp: 62, animationAction: 'spit-warning' }).animationAction, 'spit-warning');
  assert.equal(creaturePackVisualActor({ kind: 'llama', hp: 62, animationAction: 'kick' }).animationAction, 'kick');
  for (const action of ['trot', 'spit-warning', 'kick', 'attack', 'hurt', 'death']) assert.ok(model.clips[action], `${action} remains present`);
  assert.equal(llamaWowClip('spit-warning'), null);
});

test('llama clip instances are isolated and rig replacement preserves edited art and custom keys', () => {
  const first = llamaWowClip('walk'), second = llamaWowClip('walk');
  first.keys[0].joints.pelvis[0] = 999;
  assert.notEqual(second.keys[0].joints.pelvis[0], 999);

  const subject = CREATURE_PACK.subjects.llama;
  const original = subject.defaults();
  try {
    const edited = subject.defaults();
    edited.palette.body = '#aabbcc';
    edited.joints.head.position = [7, 8, 9];
    edited.clips['spit-warning'].keys[0].joints.head = [3, 4, 5];
    edited.clips.kick.keys[0].joints.frontPawR = [6, 7, 8];
    subject.replace(edited);
    const savedAndRestored = subject.defaults();
    assert.equal(savedAndRestored.palette.body, '#aabbcc');
    assert.deepEqual(savedAndRestored.joints.head.position, [7, 8, 9]);
    assert.deepEqual(savedAndRestored.clips['spit-warning'].keys[0].joints.head, [3, 4, 5]);
    assert.deepEqual(savedAndRestored.clips.kick.keys[0].joints.frontPawR, [6, 7, 8]);
    assert.ok(savedAndRestored.clips.walk && savedAndRestored.clips.run, 'donor gait remains in the same saved rig');
  } finally {
    subject.replace(original);
  }
});
