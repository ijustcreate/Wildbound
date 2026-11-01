import test from 'node:test';
import assert from 'node:assert/strict';
import { Game, EVENTS } from '../../src/core.mjs';
import { CREATURE_PACK, defaultEldritchRig, renderEldritchPreview, validateEldritchRig } from '../../src/creature-packs/eldritch.mjs';

const kinds = ['arcane_eye','great_owl','butterfly_dragon','evil_hand','eye_tentacle','jade_tentacle','flying_raptor','archangel','watcher','cave_monster','tree_ent','spore'];
const clone = value => structuredClone(value);

test('eldritch pack exposes the shared isolated pack contract and all requested subjects', () => {
  assert.deepEqual(Object.keys(CREATURE_PACK.subjects).sort(), [...kinds].sort());
  assert.deepEqual(Object.keys(CREATURE_PACK.defaults).sort(), [...kinds].sort());
  assert.ok(CREATURE_PACK.events.length >= kinds.length);
  for (const kind of kinds) {
    const d = CREATURE_PACK.defaults[kind];
    assert.ok(d.baseKind && d.aiKind && d.rigType, `${kind} needs a base/AI/rig descriptor`);
    assert.ok(d.stats.hp > 0 && d.behaviors);
    assert.equal(CREATURE_PACK.subjects[kind].data.animationSource, kind === 'great_owl' ? 'verified-wowhead-donor-motion-with-native-glide' : kind === 'butterfly_dragon' ? 'verified-wowhead-ground-motion-with-native-fly' : kind === 'evil_hand' ? 'verified-wowhead-hand-crawl-and-attack-with-native-warning-death' : 'native-wildbound-approximation');
    assert.equal(typeof CREATURE_PACK.subjects[kind].replace, 'function');
  }
  assert.equal(typeof CREATURE_PACK.tickActor, 'function');
  assert.equal(typeof CREATURE_PACK.onSpawn, 'function');
});

test('editable rigs have finite articulated joints and meaningful native clips', () => {
  const uniqueMorphologies = new Set();
  for (const kind of kinds) {
    const rig = defaultEldritchRig(kind);
    assert.equal(validateEldritchRig(rig), true, kind);
    assert.ok(Object.keys(rig.joints).length >= 8, `${kind} joint count`);
    assert.ok(Object.keys(rig.clips).length >= 4, `${kind} clips`);
    assert.ok(Object.values(rig.clips).some(clip => clip.keys.some(frame => Object.values(frame.joints).some(v => v.some(n => n !== 0)))), `${kind} needs an animated clip`);
    uniqueMorphologies.add(Object.keys(rig.joints).sort().join(','));
  }
  assert.ok(uniqueMorphologies.size >= 8, 'creatures should use distinct silhouettes/rigs');
  const model = defaultEldritchRig('great_owl');
  model.joints.head.position[0] += 99;
  assert.notEqual(defaultEldritchRig('great_owl').joints.head.position[0], model.joints.head.position[0], 'editor defaults are isolated copies');
  const loneEye = defaultEldritchRig('arcane_eye');
  assert.ok(!Object.keys(loneEye.joints).some(name => name.startsWith('stalk')), 'Corrupted Eye rig has no unused stalk joints');
  assert.notEqual(CREATURE_PACK.defaults.arcane_eye.baseKind, 'beholder', 'the floating eye does not inherit beholder identity or behavior');
  assert.ok(['eye', 'iris', 'pupil', 'lidTop', 'lidBottom'].every(name => Object.hasOwn(loneEye.joints, name)), 'Corrupted Eye rig articulates only its eye anatomy');
  for (const clip of Object.values(loneEye.clips)) for (const frame of clip.keys) {
    assert.deepEqual(Object.keys(frame.joints).sort(), Object.keys(loneEye.joints).sort(), 'Corrupted Eye clip keys match its editable rig');
  }
  assert.ok(Object.keys(defaultEldritchRig('watcher').joints).some(name => name.startsWith('stalk')), 'Watcher keeps its sensor stalk rig');
});

test('Clinging Remains alternates planted finger pairs and lifts its wrist throughout the crawl cycle', () => {
  const rig = defaultEldritchRig('evil_hand');
  const crawl = rig.clips.crawl;
  assert.equal(crawl.loop, true);
  assert.ok(crawl.keys.length >= 20, 'crawl preserves the sampled donor timing');
  for (let frame = 0; frame < crawl.keys.length; frame++) {
    const pose = crawl.keys[frame].joints;
    assert.ok(pose.wrist && pose.palm, `frame ${frame} raises/lower the forearm chain`);
    for (let finger = 0; finger < 4; finger++) {
      assert.ok(pose[`finger${finger}`] && pose[`finger${finger}Mid`] && pose[`finger${finger}Tip`], `frame ${frame} animates finger ${finger} through its articulated chain`);
    }
    assert.ok(pose.thumbBase && pose.thumbTip, `frame ${frame} curls the thumb too`);
  }
  const frame1 = crawl.keys[Math.floor(crawl.keys.length * .25)].joints, frame5 = crawl.keys[Math.floor(crawl.keys.length * .75)].joints;
  assert.notDeepEqual(frame1.finger0Tip, frame5.finger0Tip, 'opposite finger pairs exchange the plant/reach pose');
  assert.notDeepEqual(frame1.wrist, frame5.wrist, 'the wrist has a distinct lift phase');
  assert.notDeepEqual(frame1.palm, frame5.palm, 'the palm loads and unloads with each crawl step');
  assert.ok(rig.clips.grab.length >= 20, 'attack uses sampled donor timing');
});

test('moving Clinging Remains selects its animated crawl in all eight facings', () => {
  const rig = defaultEldritchRig('evil_hand');
  const renderPixels = (facing, frame) => {
    const pixels = [];
    const ctx = { _color: '#000', set fillStyle(value) { this._color = value; }, get fillStyle() { return this._color; }, fillRect(x, y, w, h) { pixels.push(`${Math.round(x)},${Math.round(y)},${w},${h},${this._color}`); } };
    const angle = facing * Math.PI / 4;
    renderEldritchPreview(ctx, 'evil_hand', { kind: 'evil_hand', faceX: Math.sin(angle), faceY: Math.cos(angle), moving: true, playerFrame: frame }, 0, rig);
    return pixels.join('|');
  };
  for (let facing = 0; facing < 8; facing++) {
    assert.notEqual(renderPixels(facing, 1), renderPixels(facing, 5), `crawl art changes during the alternating step at facing ${facing}`);
  }
});

test('Butterfly Dragon has a broad eight-frame native flight flap in all facings', () => {
  const rig = defaultEldritchRig('butterfly_dragon'), fly = rig.clips.fly;
  assert.equal(fly.loop, true);
  for (let frame = 0; frame < 8; frame++) {
    assert.ok(fly.keys[frame].joints.wingRootL && fly.keys[frame].joints.wingTipL && fly.keys[frame].joints.wingFingerL, `flight frame ${frame} animates the left sail chain`);
    assert.ok(fly.keys[frame].joints.wingRootR && fly.keys[frame].joints.wingTipR && fly.keys[frame].joints.wingFingerR, `flight frame ${frame} animates the right sail chain`);
  }
  const renderPixels = (facing, frame) => {
    const pixels = [];
    const ctx = { _color: '#000', set fillStyle(value) { this._color = value; }, get fillStyle() { return this._color; }, fillRect(x, y, w, h) { pixels.push(`${Math.round(x)},${Math.round(y)},${w},${h},${this._color}`); } };
    const angle = facing * Math.PI / 4;
    renderEldritchPreview(ctx, 'butterfly_dragon', { kind: 'butterfly_dragon', faceX: Math.sin(angle), faceY: Math.cos(angle), moving: true, playerFrame: frame }, 0, rig);
    return pixels.join('|');
  };
  for (let facing = 0; facing < 8; facing++) {
    assert.notEqual(renderPixels(facing, 1), renderPixels(facing, 5), `flight silhouette flaps at facing ${facing}`);
  }
});

test('every facing renders original pixel output and editor replacement persists independently', () => {
  for (const kind of kinds) for (let facing = 0; facing < 8; facing++) {
    let count = 0;
    const c = { set fillStyle(_value) {}, fillRect() { count++; } };
    const a = facing * Math.PI / 4;
    const result = renderEldritchPreview(c, kind, { kind, faceX: Math.sin(a), faceY: Math.cos(a), state: 'idle' }, .3);
    assert.ok(result && Object.keys(result).length, `${kind} facing ${facing} pose`);
    assert.ok(count > 20, `${kind} facing ${facing} has visible art (${count} pixels)`);
  }
  const before = CREATURE_PACK.subjects.spore.defaults();
  const originalAccent = before.palette.accent;
  const changed = clone(before); changed.palette.accent = '#ff00ff';
  CREATURE_PACK.subjects.spore.replace(changed);
  assert.equal(CREATURE_PACK.subjects.spore.defaults().palette.accent, '#ff00ff');
  assert.equal(before.palette.accent, originalAccent, 'editor copy is detached from the source model');
  CREATURE_PACK.subjects.spore.replace(before);
});

test('Corrupted Eye dev event spawns the appendage-free studio rig and renders all facings', () => {
  const eventIndex = EVENTS.findIndex(event => event.name === 'Corrupted Eye');
  assert.notEqual(eventIndex, -1, 'dev event is registered');
  const game = new Game(() => 0.25, { deferWorld: true });
  game.scenery = [];
  game.spawnEvent(eventIndex, { force: true, test: true });
  const actor = game.enemies.find(enemy => enemy.kind === 'arcane_eye');
  assert.ok(actor, 'dev event creates a Corrupted Eye actor');
  assert.equal(actor.name, 'Corrupted Eye', 'spawned actor carries the corrected display identity');
  const rig = defaultEldritchRig('arcane_eye');
  assert.ok(!Object.keys(rig.joints).some(name => name.startsWith('stalk')));
  for (let facing = 0; facing < 8; facing++) {
    let pixels = 0;
    const ctx = { set fillStyle(_value) {}, fillRect() { pixels++; } };
    const angle = facing * Math.PI / 4;
    renderEldritchPreview(ctx, 'arcane_eye', { ...actor, faceX: Math.sin(angle), faceY: Math.cos(angle), state: 'idle' }, 0, rig);
    assert.ok(pixels > 0, `spawned event actor draws at facing ${facing}`);
  }
});

test('jade court initializes three tentacles with shared host health and death', () => {
  const event = CREATURE_PACK.events.find(e => e.linkedJadeGroup);
  assert.ok(event);
  assert.equal(event.enemies.find(e => e.kind === 'jade_tentacle').count, 3);
  const group = [
    { id: 'host', kind: 'watcher', x: 10, y: 20, hp: 125, maxHp: 125 },
    ...[0,1,2].map(i => ({ id: `t${i}`, kind: 'jade_tentacle', x: 0, y: 0, hp: 130, maxHp: 130 })),
  ];
  const game = { enemies: group };
  CREATURE_PACK.onSpawn(game, event, group);
  assert.ok(group.every(a => a.jadeLinkId === group[0].jadeLinkId));
  assert.equal(group[0].maxHp, 125);
  group[2].hp = 61;
  CREATURE_PACK.tickActor(game, group[2], .1, []);
  assert.ok(group.every(a => a.hp === 61));
  group[0].hp = 0;
  CREATURE_PACK.tickActor(game, group[0], .1, []);
  assert.ok(group.every(a => a.hp === 0 && a.state === 'dead'));
});

test('pack tick declines unrelated actors and melee attack waits for windup', () => {
  const unrelated = { kind: 'lion', hp: 20 };
  assert.equal(CREATURE_PACK.tickActor({}, unrelated, .1, []), false);
  const attacker = { kind: 'evil_hand', hp: 58, x: 0, y: 0, cooldown: 0, stats: CREATURE_PACK.defaults.evil_hand.stats };
  const target = { id: 'player', hp: 100, x: 12, y: 0 };
  let hits = 0;
  const game = { moveActor() {}, hurt(t, amount) { hits++; t.hp -= amount; } };
  assert.equal(CREATURE_PACK.tickActor(game, attacker, .05, [target]), true);
  assert.equal(hits, 0, 'attack does not resolve at windup start');
  CREATURE_PACK.tickActor(game, attacker, .2, [target]);
  CREATURE_PACK.tickActor(game, attacker, .3, [target]);
  assert.equal(hits, 1, 'attack resolves once when the warning expires');
});
