import test from 'node:test';
import assert from 'node:assert/strict';
import { BLINKY_WOW_MOTION } from '../../src/blinky-wow-motion-data.mjs';
import { poseAt } from '../../src/player-motion.mjs';
import { CREATURE_PACK, defaultEldritchRig } from '../../src/creature-packs/eldritch.mjs';

test('Blinky uses verified Wowhead donor ground clips while retaining native flight', () => {
  const rig = defaultEldritchRig('butterfly_dragon');
  const provenance = BLINKY_WOW_MOTION.provenance;
  assert.equal(rig.animationSource, 'verified-wowhead-ground-motion-with-native-fly');
  assert.deepEqual(rig.animationProvenance, provenance);
  assert.match(provenance.donor, /179589.*4080510/);
  assert.equal(provenance.sourceBones, 66);
  assert.equal(provenance.sourceVertices, 6638);
  assert.match(provenance.vertexInfluenceIndexing, /directly index.*bones array/);
  assert.match(provenance.flightClipLimit, /135.*alias chain 4 -> 5 -> 3.*Run/);
  assert.deepEqual(Object.keys(BLINKY_WOW_MOTION.clips).sort(), ['breath', 'idle', 'run', 'walk']);
  for (const [name, clip] of Object.entries(BLINKY_WOW_MOTION.clips)) {
    assert.equal(clip.fps, 24);
    assert.ok(clip.keys.length >= 20, `${name} samples source motion`);
    assert.equal(rig.clips[name].keys.length, clip.keys.length, `${name} reaches the runtime rig`);
    for (const frame of clip.keys) assert.deepEqual(Object.keys(frame.joints).sort(), Object.keys(rig.joints).sort());
  }
  const influences = new Map(provenance.mappedBones.map(bone => [bone.index, bone.weightedVertexInfluence]));
  for (const index of [2, 3, 4, 5, 6, 7, 8, 10, 11, 14, 15, 17, 18, 19, 22, 23, 24, 25, 26, 27, 28, 34]) {
    assert.ok(influences.get(index) > 0, `anatomical source bone ${index} has direct skinned influence`);
  }
  assert.equal(influences.get(49), 0, 'wing finger 49 is a helper pivot and not a weighted skin bone');
  assert.equal(influences.get(50), 0, 'wing finger 50 is a helper pivot and not a weighted skin bone');
  assert.ok(rig.clips.fly, 'native flight remains available');
  assert.notEqual(rig.clips.fly, BLINKY_WOW_MOTION.clips.run, 'aliased source Run is not passed off as independent flight');
  assert.notEqual(rig.clips.fly, BLINKY_WOW_MOTION.clips.walk);
});

test('Blinky donor clips articulate anatomy and render motion in each facing', () => {
  const rig = defaultEldritchRig('butterfly_dragon');
  const subject = CREATURE_PACK.subjects.butterfly_dragon;
  for (const action of ['idle', 'walk', 'run', 'breath']) {
    const clip = rig.clips[action];
    const first = poseAt(rig, action, 1), middle = poseAt(rig, action, Math.floor(clip.length * .45));
    assert.notDeepEqual(middle.wingTipL, first.wingTipL, `${action} changes left wing pose`);
    assert.notDeepEqual(middle.wingTipR, first.wingTipR, `${action} changes right wing pose`);
  }
  for (let facing = 0; facing < 8; facing++) {
    const angle = facing * Math.PI / 4;
    const render = (action, frame) => {
      const pixels = [];
      const ctx = { _fill: '#000', set fillStyle(value) { this._fill = value; }, get fillStyle() { return this._fill; }, fillRect(x, y, w, h) { pixels.push(`${Math.round(x)},${Math.round(y)},${w},${h},${this._fill}`); } };
      subject.draw(ctx, { kind: 'butterfly_dragon', faceX: -Math.sin(angle), faceY: Math.cos(angle), moving: action === 'walk' || action === 'run', animationAction: action, playerFrame: frame }, 0, rig);
      return pixels.join('|');
    };
    for (const action of ['idle', 'walk', 'run', 'breath']) {
      assert.notEqual(render(action, 1), render(action, Math.floor(rig.clips[action].length * .45)), `${action} changes rendered pose at facing ${facing}`);
    }
    assert.notEqual(render('fly', 1), render('fly', Math.floor(rig.clips.fly.length * .45)), `native flight still animates at facing ${facing}`);
  }
});
