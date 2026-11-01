import test from 'node:test';
import assert from 'node:assert/strict';
import { SQUIRREL_WOW_MOTION } from '../../src/squirrel-wow-motion-data.mjs';
import { squirrelWowClip, squirrelWowMotionProvenance } from '../../src/squirrel-wow-motion.mjs';
import { CREATURE_PACK } from '../../src/creature-packs/wildlife.mjs';
import { creaturePackVisualActor } from '../../src/creature-pack-animation-routing.mjs';

test('squirrel donor data identifies actual Wowhead source and explicit target-bone map', () => {
  assert.equal(squirrelWowMotionProvenance.donor, 'Wowhead NPC 61081 Squirrel, display 134, FileDataID 1129448');
  assert.equal(squirrelWowMotionProvenance.sourceBones, 46);
  assert.equal(squirrelWowMotionProvenance.sourceSequences, 10);
  assert.deepEqual(squirrelWowMotionProvenance.sourceToTarget.tailBase, [2, 7]);
  assert.deepEqual(squirrelWowMotionProvenance.sourceToTarget.tailMid, [13, 18]);
  assert.deepEqual(squirrelWowMotionProvenance.sourceToTarget.tailTip, [21]);
  assert.deepEqual(squirrelWowMotionProvenance.sourceToTarget.frontPawR, [19, 44]);
  assert.deepEqual(squirrelWowMotionProvenance.sourceToTarget.frontPawL, [20, 45]);
  assert.equal(squirrelWowMotionProvenance.mappedBones.find(bone => bone.index === 3), undefined, 'unweighted connector must not be mislabeled as chest');
  assert.equal(squirrelWowMotionProvenance.mappedBones.find(bone => bone.index === 4)?.weightedVertexInfluence, 87.47);
  assert.equal(squirrelWowMotionProvenance.mappedBones.find(bone => bone.index === 8)?.weightedVertexInfluence, 325.6);
  assert.ok(squirrelWowMotionProvenance.unmappedAnatomyBones.some(bone => bone.index === 3 && bone.weightedVertexInfluence === 0));
});

test('squirrel Stand, Walk and Run become cloned finite native clips at source timing', () => {
  for (const [target, sourceId, duration] of [['freeze', 0, 2], ['walk', 4, 0.667], ['scamper', 5, 0.666]]) {
    const record = squirrelWowMotionProvenance.sourceClips[target];
    assert.equal(record.animationId, sourceId);
    assert.ok(Math.abs(record.durationSeconds - duration) < 0.002);
    const clip = squirrelWowClip(target);
    assert.equal(clip.loop, true);
    assert.ok(clip.length > 8);
    assert.ok(clip.keys.every(key => Object.values(key.joints).every(v => v.length === 3 && v.every(Number.isFinite))));
    assert.ok(Object.values(clip.keys[0].joints).every(v => v.every(value => value === 0)), `${target} frame zero is the clip-relative rest pose`);
  }
  const a = squirrelWowClip('walk'), b = squirrelWowClip('walk');
  a.keys[0].joints.pelvis[0] += 10;
  assert.notEqual(a.keys[0].joints.pelvis[0], b.keys[0].joints.pelvis[0], 'clip instances must not mutate shared source data');
  assert.equal(squirrelWowClip('leap'), null, 'custom Wildbound leap stays native');
  assert.equal(SQUIRREL_WOW_MOTION.provenance.sourceClips.walk.donorAnimation, 'Walk');
  assert.equal(SQUIRREL_WOW_MOTION.provenance.sourceClips.scamper.donorAnimation, 'Run');
});

test('squirrel native rig uses donor idle/walk/run while retaining its custom jump', () => {
  const subject = CREATURE_PACK.subjects.squirrel;
  const model = subject.defaults();
  assert.deepEqual(model.joints.head.position, [0, 6, 18]);
  assert.equal(model.clips.freeze.length, 48);
  assert.equal(model.clips.walk.length, 17);
  assert.equal(model.clips.scamper.length, 16);
  assert.equal(model.clips.leap.length, 10);
  assert.equal(model.clips.leap.loop, false);
  assert.deepEqual(model.palette, subject.defaults().palette);
  assert.deepEqual(model.shape, subject.defaults().shape);

  const walking = creaturePackVisualActor({ kind: 'squirrel', hp: 22, moving: true, walking: true, walk: true });
  const running = creaturePackVisualActor({ kind: 'squirrel', hp: 22, moving: true, walking: false });
  const idle = creaturePackVisualActor({ kind: 'squirrel', hp: 22, moving: false });
  assert.equal(walking.animationAction, 'walk');
  assert.equal(running.animationAction, 'scamper');
  assert.equal(idle.animationAction, 'freeze');
});
