import test from 'node:test';
import assert from 'node:assert/strict';
import { SKUNK_WOW_MOTION } from '../../src/skunk-wow-motion-data.mjs';
import { skunkWowClip, skunkWowMotionProvenance } from '../../src/skunk-wow-motion.mjs';
import { CREATURE_PACK } from '../../src/creature-packs/wildlife.mjs';
import { creaturePackVisualActor } from '../../src/creature-pack-animation-routing.mjs';
import { markSkunkAttacked } from '../../src/skunk-state.mjs';
import { tickSkunkActor } from '../../src/skunk-behavior.mjs';

test('Skunk donor provenance uses its directly weighted M2 bone map and distinct source actions', () => {
  assert.equal(skunkWowMotionProvenance.donor, 'Wowhead NPC 62907 Highlands Skunk, FileDataID 125956');
  assert.equal(skunkWowMotionProvenance.sourceBones, 50);
  assert.equal(skunkWowMotionProvenance.sourceVertices, 566);
  assert.match(skunkWowMotionProvenance.vertexInfluenceIndexing, /directly address the M2 bones array/);
  assert.deepEqual(skunkWowMotionProvenance.sourceToTarget.pelvis, [2]);
  assert.deepEqual(skunkWowMotionProvenance.sourceToTarget.chest, [5]);
  assert.deepEqual(skunkWowMotionProvenance.sourceToTarget.head, [18]);
  assert.deepEqual(skunkWowMotionProvenance.sourceToTarget.frontPawR, [21]);
  assert.deepEqual(skunkWowMotionProvenance.sourceToTarget.rearPawL, [20]);
  assert.deepEqual(skunkWowMotionProvenance.sourceToTarget.tailTip, [35]);
  for (const [action, id, sequence, length] of [
    ['freeze', 0, 2, 48], ['amble', 4, 0, 33], ['scurry', 5, 1, 20],
    ['attack', 16, 3, 36], ['hurt', 9, 5, 24], ['death', 1, 7, 36],
  ]) {
    const source = skunkWowMotionProvenance.sourceClips[action];
    assert.equal(source.animationId, id);
    assert.equal(source.sequenceIndex, sequence);
    assert.equal(source.frameCount, length);
    assert.equal(source.loop, ['freeze', 'amble', 'scurry'].includes(action));
  }
  assert.ok(skunkWowMotionProvenance.aliasSequences.some(alias => alias.animationId === 43 && alias.resolvedIndex === 17));
  assert.match(skunkWowMotionProvenance.mappingCaveats, /Bone 44 is only a positional facial proxy/);
});

test('transferred Skunk clips are finite editable joint keys and preserve native spray actions', () => {
  const model = CREATURE_PACK.subjects.skunk.defaults();
  for (const action of ['freeze', 'amble', 'scurry', 'attack', 'hurt', 'death']) {
    const clip = model.clips[action];
    assert.ok(clip, `${action} exists`);
    assert.equal(clip.fps, 24);
    assert.equal(clip.length, skunkWowMotionProvenance.sourceClips[action].frameCount);
    assert.ok(clip.keys.every(key => Object.values(key.joints).every(delta => delta.length === 3 && delta.every(Number.isFinite))));
    assert.ok(clip.keys.some(key => Object.values(key.joints).some(delta => Math.hypot(...delta) > .1)), `${action} contains sampled motion`);
  }
  assert.ok(model.clips['raise-tail']);
  assert.ok(model.clips['spray-warning']);
  assert.equal(model.clips.walk.length, model.clips.amble.length, 'standard walk resolves to donor Walk');
  assert.equal(model.clips.run.length, model.clips.scurry.length, 'standard run resolves to donor Run');
  const first = skunkWowClip('amble'), second = skunkWowClip('amble');
  first.keys[1].joints.pelvis[0] = 999;
  assert.notEqual(second.keys[1].joints.pelvis[0], 999, 'clip instances do not share mutable arrays');
  assert.equal(skunkWowClip('spray-warning'), null, 'spray remains an authored native action');
  assert.equal(SKUNK_WOW_MOTION.provenance.preservedNativeActions.includes('spray cloud behavior'), true);
});

test('Skunk AI, controlled gaits and the native spray warning select species-appropriate clips', () => {
  const model = CREATURE_PACK.subjects.skunk.defaults();
  assert.equal(creaturePackVisualActor({ kind:'skunk', hp:40, moving:false }).animationAction, 'freeze');
  assert.equal(creaturePackVisualActor({ kind:'skunk', hp:40, moving:true, walking:true }).animationAction, 'amble');
  assert.equal(creaturePackVisualActor({ kind:'skunk', hp:40, moving:true, walking:false }).animationAction, 'scurry');
  assert.equal(creaturePackVisualActor({ kind:'skunk', hp:40, state:'attack', animationAction:'attack' }).animationAction, 'attack');
  assert.equal(creaturePackVisualActor({ kind:'skunk', hp:40, animationAction:'spray-warning' }).animationAction, 'spray-warning');

  const player={id:1,x:40,y:0,hp:100}, skunk={id:2,kind:'skunk',x:0,y:0,hp:40,speed:54,faceX:1,faceY:0};
  const game={time:0,players:[player],enemies:[skunk],effects:[],moveActor(a,dx,dy){a.x+=dx;a.y+=dy;}};
  tickSkunkActor(game,skunk,.1,[player]);
  assert.equal(skunk.animationAction,'scurry');
  skunk.x=-200;tickSkunkActor(game,skunk,.1,[player]);
  assert.equal(skunk.animationAction,'freeze');
  skunk.x=0;markSkunkAttacked(game,skunk,player);tickSkunkActor(game,skunk,.1,[player]);
  assert.equal(skunk.animationAction,'spray-warning');
  assert.ok(skunk.skunkCloud);
  assert.ok(model.clips[skunk.animationAction], 'native spray warning still resolves to a clip');
});
