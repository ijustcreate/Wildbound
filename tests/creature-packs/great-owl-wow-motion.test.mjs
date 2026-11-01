import test from 'node:test';
import assert from 'node:assert/strict';
import { GREAT_OWL_WOW_MOTION } from '../../src/great-owl-wow-motion-data.mjs';
import { poseAt } from '../../src/player-motion.mjs';
import { CREATURE_PACK, defaultEldritchRig, renderEldritchPreview } from '../../src/creature-packs/eldritch.mjs';

test('Great Owl uses weight-verified Archimedes donor clips and retains its native glide', () => {
  const rig = defaultEldritchRig('great_owl');
  assert.equal(rig.animationSource, 'verified-wowhead-donor-motion-with-native-glide');
  assert.deepEqual(rig.animationProvenance, GREAT_OWL_WOW_MOTION.provenance);
  assert.equal(rig.animationProvenance.donor.includes('85676'), true);
  assert.equal(rig.animationProvenance.sourceFormat, 'M2 v274, embedded MD21 tracks');
  assert.match(rig.animationProvenance.flightClipLimit, /alias.*ground Stand/i);
  assert.deepEqual(Object.keys(GREAT_OWL_WOW_MOTION.clips).sort(), ['idle', 'swoop', 'walk']);
  for (const [name, clip] of Object.entries(GREAT_OWL_WOW_MOTION.clips)) {
    assert.ok(clip.keys.length >= 20, `${name} has sampled source frames`);
    assert.equal(clip.fps, 24);
    assert.equal(rig.clips[name].keys.length, clip.keys.length, `${name} reaches the runtime clip table`);
    for (const frame of clip.keys) assert.deepEqual(Object.keys(frame.joints).sort(), Object.keys(rig.joints).sort());
  }
  const supported = new Map(rig.animationProvenance.mappedBones.map(bone => [bone.index, bone.weightedVertexInfluence]));
  for (const index of [2, 3, 4, 5, 11, 14, 15, 17, 18, 19, 23, 24, 26, 27, 29, 30]) {
    assert.ok(supported.get(index) > 0, `mapped source bone ${index} has skinned vertex influence`);
  }
  assert.ok(rig.clips.glide, 'the existing native glide is preserved');
  assert.notEqual(rig.clips.glide, GREAT_OWL_WOW_MOTION.clips.walk);
});

test('Great Owl donor motion changes meaningful poses and renders across all eight directions', () => {
  const rig = defaultEldritchRig('great_owl');
  for (const action of ['idle', 'walk', 'swoop']) {
    const clip = rig.clips[action];
    const first = poseAt(rig, action, 1), middle = poseAt(rig, action, Math.floor(clip.length * .45));
    assert.notDeepEqual(middle.wingTipL, first.wingTipL, `${action} moves the left wing`);
    assert.notDeepEqual(middle.wingTipR, first.wingTipR, `${action} moves the right wing`);
    assert.notDeepEqual(middle.head, first.head, `${action} moves the head`);
  }
  const subject = CREATURE_PACK.subjects.great_owl;
  for (let facing = 0; facing < 8; facing++) {
    const angle = facing * Math.PI / 4;
    const render = (action, frame) => {
      const pixels = [];
      const ctx = { _fill: '#000', set fillStyle(value) { this._fill = value; }, get fillStyle() { return this._fill; }, fillRect(x, y, w, h) { pixels.push(`${Math.round(x)},${Math.round(y)},${w},${h},${this._fill}`); } };
      subject.draw(ctx, { kind: 'great_owl', faceX: -Math.sin(angle), faceY: Math.cos(angle), moving: action === 'walk', animationAction: action, playerFrame: frame }, 0, rig);
      return pixels.join('|');
    };
    for (const action of ['idle', 'walk', 'swoop']) {
      assert.notEqual(render(action, 1), render(action, Math.floor(rig.clips[action].length * .45)), `${action} pose changes at facing ${facing}`);
    }
  }
});
