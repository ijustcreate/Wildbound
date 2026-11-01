import test from 'node:test';
import assert from 'node:assert/strict';
import { SHEEP_WOW_MOTION } from '../../src/sheep-wow-motion-data.mjs';
import { sheepWowClip, sheepWowMotionProvenance } from '../../src/sheep-wow-motion.mjs';
import { CREATURE_PACK } from '../../src/creature-packs/wildlife.mjs';
import { creaturePackVisualActor } from '../../src/creature-pack-animation-routing.mjs';

test('sheep donor provenance maps only the evidenced v274 tracks and limb chains', () => {
  assert.equal(sheepWowMotionProvenance.donor, 'Wowhead NPC 61170 Sheep, FileDataID 1377131');
  assert.equal(sheepWowMotionProvenance.sourceBones, 55);
  assert.equal(sheepWowMotionProvenance.sourceVertices, 814);
  assert.match(sheepWowMotionProvenance.vertexInfluenceIndexing, /directly index bones\[\]/);
  assert.deepEqual(sheepWowMotionProvenance.sourceToTarget.pelvis, [2]);
  assert.deepEqual(sheepWowMotionProvenance.sourceToTarget.chest, [1]);
  assert.deepEqual(sheepWowMotionProvenance.sourceToTarget.head, [3]);
  assert.deepEqual(sheepWowMotionProvenance.sourceToTarget.muzzle, [10]);
  assert.deepEqual(sheepWowMotionProvenance.sourceToTarget.frontPawR, [19]);
  assert.deepEqual(sheepWowMotionProvenance.sourceToTarget.rearPawL, [27]);
  assert.equal(sheepWowMotionProvenance.sourceClips.freeze.animationId, 0);
  assert.equal(sheepWowMotionProvenance.sourceClips.walk.animationId, 4);
  assert.equal(sheepWowMotionProvenance.sourceClips.run.animationId, 5);
  assert.match(sheepWowMotionProvenance.unavailableDonorActions, /No jump or graze\/bleat action exists/);
});

test('sheep Stand, Walk and Run tracks are native editable clips with source timing', () => {
  const model = CREATURE_PACK.subjects.sheep.defaults();
  for (const [target, sequence, length] of [['freeze', 0, 48], ['walk', 4, 26], ['run', 5, 10]]) {
    const record = sheepWowMotionProvenance.sourceClips[target];
    assert.equal(record.sequenceIndex, sequence);
    assert.equal(record.fps, 24);
    assert.equal(record.frameCount, length);
    assert.equal(record.loop, true);
    const clip = model.clips[target];
    assert.equal(clip.length, length);
    assert.equal(clip.fps, 24);
    assert.equal(clip.loop, true);
    assert.ok(clip.keys.every(key => Object.values(key.joints).every(delta => delta.length === 3 && delta.every(Number.isFinite))));
    assert.ok(Object.values(clip.keys[0].joints).every(delta => delta.every(value => value === 0)), `${target} begins at its source rest pose`);
    const visibleThreshold = target === 'freeze' ? .5 : 1;
    assert.ok(clip.keys.some(key => Object.values(key.joints).some(delta => Math.hypot(...delta) > visibleThreshold)), `${target} transfers visible movement`);
  }
  assert.ok(model.clips.graze && model.clips.bleat && model.clips.bound, 'native Sheep actions remain available');
  assert.equal(model.clips.bound.length, 6, 'jump/bound remains native rather than claiming a donor jump');
  const first = sheepWowClip('walk'), second = sheepWowClip('walk');
  first.keys[0].joints.pelvis[0] = 999;
  assert.equal(second.keys[0].joints.pelvis[0], 0, 'clip instances do not share mutable arrays');
  assert.equal(sheepWowClip('graze'), null, 'non-transferred actions remain native');
});

test('sheep runtime routes idle, walk and run to transferred clips without replacing behavior clips', () => {
  const model = CREATURE_PACK.subjects.sheep.defaults();
  assert.equal(model.clips.graze.length, 8);
  assert.equal(model.clips.bleat.length, 6);
  assert.equal(model.clips.bound.length, 6);
  assert.equal(creaturePackVisualActor({ kind:'sheep', hp:46, moving:false }).animationAction, 'freeze');
  assert.equal(creaturePackVisualActor({ kind:'sheep', hp:46, moving:true, walking:true }).animationAction, 'walk');
  assert.equal(creaturePackVisualActor({ kind:'sheep', hp:46, moving:true, walking:false }).animationAction, 'run');
});
