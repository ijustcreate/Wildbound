import test from 'node:test';
import assert from 'node:assert/strict';
import { poseAt } from '../../src/player-motion.mjs';
import { CLINGING_REMAINS_WOW_MOTION } from '../../src/clinging-remains-wow-motion-data.mjs';
import { CREATURE_PACK, defaultEldritchRig, renderEldritchPreview, validateEldritchRig } from '../../src/creature-packs/eldritch.mjs';

const finite = rig => Object.values(rig.clips).every(clip => clip.keys.every(frame => Object.values(frame.joints).every(value => value.every(Number.isFinite))));

test('Clinging Remains embeds verified hand anatomy and real donor crawl/attack tracks', () => {
  const rig = defaultEldritchRig('evil_hand');
  assert.equal(rig.animationSource, 'verified-wowhead-hand-crawl-and-attack-with-native-warning-death');
  assert.deepEqual(rig.animationProvenance, CLINGING_REMAINS_WOW_MOTION.provenance);
  assert.match(rig.animationProvenance.donor, /179179.*3386315/);
  assert.deepEqual(Object.keys(CLINGING_REMAINS_WOW_MOTION.clips).sort(), ['crawl', 'grab']);
  for (const action of ['crawl', 'grab']) {
    const source = CLINGING_REMAINS_WOW_MOTION.clips[action];
    assert.equal(rig.clips[action].keys.length, source.keys.length, `${action} donor frames reach the editable runtime rig`);
    assert.equal(rig.clips[action].fps, 24);
    for (const frame of rig.clips[action].keys) assert.deepEqual(Object.keys(frame.joints).sort(), Object.keys(rig.joints).sort());
  }
  const mapped = new Map(rig.animationProvenance.mappedBones.map(bone => [bone.index, bone.weightedVertexInfluence]));
  for (const bone of [0, 1, 2, 3, 4, 5, 7, 8, 9, 10, 11, 12]) assert.ok(mapped.get(bone) > 0, `mapped source bone ${bone} is weighted in donor mesh`);
  assert.match(rig.animationProvenance.aliasReview, /Walk is sequence 6 \/ ID 4.*AttackUnarmed is sequence 8 \/ ID 16/);
  assert.ok(rig.clips.windup && rig.clips.death, 'native warning and death remain available');
  assert.equal(rig.palette.eye, '#f5b4c4', 'current eye pixels and tint are retained');
  assert.equal(validateEldritchRig(rig), true);
  assert.equal(finite(rig), true);
});

test('donor forearm rises and four fingers articulate distinctly in crawl and attack', () => {
  const rig = defaultEldritchRig('evil_hand');
  for (const action of ['crawl', 'grab']) {
    const clip = rig.clips[action], first = poseAt(rig, action, 0);
    const wristLift = clip.keys.map(frame => frame.joints.wrist[2]);
    assert.ok(Math.max(...wristLift) - Math.min(...wristLift) > .2, `${action} carries a visible vertical forearm stroke`);
    for (let finger = 0; finger < 4; finger++) {
      const bases = clip.keys.map(frame => frame.joints[`finger${finger}`]);
      const mids = clip.keys.map(frame => frame.joints[`finger${finger}Mid`]);
      const tips = clip.keys.map(frame => frame.joints[`finger${finger}Tip`]);
      assert.ok(bases.some(point => point.some((value, axis) => value !== first[`finger${finger}`][axis])), `${action} moves finger ${finger} base`);
      assert.ok(mids.some(point => point.some((value, axis) => value !== first[`finger${finger}Mid`][axis])), `${action} articulates finger ${finger} midpoint`);
      assert.ok(tips.some(point => point.some((value, axis) => value !== first[`finger${finger}Tip`][axis])), `${action} articulates finger ${finger} tip`);
    }
    assert.notDeepEqual(clip.keys[Math.floor(clip.keys.length * .25)].joints.finger0Tip, clip.keys[Math.floor(clip.keys.length * .25)].joints.finger3Tip, `${action} preserves asymmetric donor digit motion`);
  }
  const attack = poseAt(rig, 'grab', Math.floor(rig.clips.grab.length * .3));
  assert.notDeepEqual(attack.finger2Tip, poseAt(rig, 'grab', 0).finger2Tip, 'attack stroke curls/extends distal digits');
});

test('Clinging Remains action routing uses crawl and donor attack while preserving its source art', () => {
  const rig = defaultEldritchRig('evil_hand'), beforePalette = structuredClone(rig.palette);
  const actor = { kind: 'evil_hand', hp: 58, x: 0, y: 0, cooldown: 0, stats: CREATURE_PACK.defaults.evil_hand.stats };
  const target = { id: 'target', hp: 100, x: 20, y: 0 };
  CREATURE_PACK.tickActor({ moveActor() {}, hurt() {} }, actor, .05, [target]);
  assert.equal(actor.animationAction, 'windup', 'combat keeps the native warning pose');
  assert.equal(actor.state, 'windup');
  CREATURE_PACK.tickActor({ moveActor() {}, hurt() {} }, actor, .5, [target]);
  assert.equal(actor.animationAction, 'grab', 'the donor AttackUnarmed clip plays after the warning');
  assert.equal(actor.state, 'attack');
  const draw = (action, facing, frame) => {
    const pixels = [];
    const ctx = { _color: '#000', set fillStyle(value) { this._color = value; }, get fillStyle() { return this._color; }, fillRect(x, y, w, h) { pixels.push(`${Math.round(x)},${Math.round(y)},${w},${h},${this._color}`); } };
    const angle = facing * Math.PI / 4;
    renderEldritchPreview(ctx, 'evil_hand', { kind: 'evil_hand', faceX: Math.sin(angle), faceY: Math.cos(angle), moving: action === 'crawl', animationAction: action, playerFrame: frame }, 0, rig);
    return pixels.join('|');
  };
  for (let facing = 0; facing < 8; facing++) {
    assert.notEqual(draw('crawl', facing, 2), draw('crawl', facing, 14), `crawl changes across the cycle at facing ${facing}`);
    assert.notEqual(draw('grab', facing, 2), draw('grab', facing, 14), `attack changes through the donor strike at facing ${facing}`);
  }
  assert.deepEqual(rig.palette, beforePalette, 'animation import does not modify current pixel palette');
});

test('Clinging Remains rig edits and authored clip changes survive pack save/restore replacement', () => {
  const subject = CREATURE_PACK.subjects.evil_hand, original = subject.defaults(), edited = structuredClone(original);
  edited.joints.finger1.position[0] += 3;
  edited.clips.idle.keys[0].joints.wrist[2] += .75;
  subject.replace(JSON.parse(JSON.stringify(edited)));
  const restored = subject.defaults();
  assert.equal(restored.joints.finger1.position[0], original.joints.finger1.position[0] + 3);
  assert.equal(restored.clips.idle.keys[0].joints.wrist[2], original.clips.idle.keys[0].joints.wrist[2] + .75);
  assert.deepEqual(restored.animationProvenance, original.animationProvenance, 'migration-safe user edits retain immutable source mapping');
  subject.replace(original);
  assert.equal(subject.defaults().joints.finger1.position[0], original.joints.finger1.position[0]);
  assert.equal(subject.defaults().clips.crawl.keys.length, CLINGING_REMAINS_WOW_MOTION.clips.crawl.keys.length, 'reset/restore keeps transferred donor track');
});
