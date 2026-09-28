import test from 'node:test';
import assert from 'node:assert/strict';
import { NIGHT_KINDS, STAMPEDE_KINDS, HUNTER_EQUIPMENT, nightMotions, defaultNightMotion, validateNightMotion, replaceNightMotion, nightAction, nightFrame } from '../src/night-rigs.mjs';
import { RIG_SUBJECTS } from '../src/rig-subjects.mjs';
import { poseAt, setJointKey, directionVector } from '../src/player-motion.mjs';
import { captureLayers, releaseLayers, boneSprites, renderLayers } from '../src/render-order.mjs';
import { definitionPack, applyDefinitions, creatures, creatureDefaults } from '../src/definitions.mjs';
import { NIGHT_EVENTS } from '../src/night-enemies.mjs';
import { HAZARD_EVENTS } from '../src/hazards.mjs';
import { rigPack, loadProjectRigs } from '../src/project-rigs.mjs';
import { saveRigSpriteOverride } from '../src/rig-sprite-storage.mjs';
import { ITEMS } from '../src/items.mjs';
import { Animator } from '../src/animation.mjs';

function context() {
  return {
    fillStyle: '', pixels: new Map(), calls: 0,
    fillRect(x, y, w, h) {
      assert.ok([x, y, w, h].every(Number.isFinite));
      assert.ok([x, y, w, h].every(Number.isInteger), 'raster stays on the pixel grid');
      assert.ok(Math.abs(x) < 128 && Math.abs(y) < 128, 'default art fits the render surface');
      this.calls++;
      for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) this.pixels.set(xx + ',' + yy, this.fillStyle);
    },
    translate() {}, clearRect() {}, save() {}, restore() {}, drawImage() {},
  };
}
const sprite = { width: 1, height: 1, x: 0, y: 0, palette: ['transparent', '#ff00ff'], pixels: [1] };

for (const kind of NIGHT_KINDS) test(kind + ': independent editable rig, every clip and facing rasterizes', () => {
  const subject = RIG_SUBJECTS[kind], model = subject.defaults();
  assert.ok(validateNightMotion(kind, model));
  assert.equal(subject.data, nightMotions[kind]);
  assert.equal(subject.sprite, kind);
  assert.notEqual(model, subject.data);
  const before = poseAt(model, subject.clip, 2)[subject.selected];
  setJointKey(model, subject.clip, 2, subject.selected, [before[0] + 2, ...before.slice(1)]);
  assert.equal(poseAt(model, subject.clip, 2)[subject.selected][0], before[0] + 2);
  assert.ok(validateNightMotion(kind, JSON.parse(JSON.stringify(model))));
  for (const action of Object.keys(model.clips)) for (let d = 0; d < 8; d++) {
    const [faceX, faceY] = directionVector(d), c = context();
    subject.draw(c, { kind, faceX, faceY, animationAction: action, playerFrame: 3 }, 0, model);
    assert.ok(c.pixels.size > 20, action + ' facing ' + d);
  }
  captureLayers(model);
  subject.draw(context(), { kind, faceY: 1 }, 0, model);
  assert.ok(boneSprites(model, 0, subject.selected).length > 0, 'selected joint exposes paintable sprite layers');
  releaseLayers(model);
  const layer = renderLayers(model, 0)[0];
  model.boneSprites = { [layer]: { 0: sprite } };
  model.renderOrder = { 0: [...renderLayers(model, 0).filter(id => id !== layer), layer] };
  const c = context(); subject.draw(c, { kind, faceY: 1 }, 0, model);
  assert.ok([...c.pixels.values()].includes('#ff00ff'), 'painted sprite is rendered');
  model.joints[subject.selected].position[0] = Infinity;
  assert.equal(validateNightMotion(kind, model), false);
});

test('Dedicated attacks have distinct motion and rooted plants keep their anchor', () => {
  for (const [kind, action, joint] of [
    ['carnivorous_flower', 'grab', 'head'], ['carnivorous_flower', 'mouth', 'jawTop'], ['carnivorous_flower', 'wilt', 'head'],
    ['night_stalker', 'pounce', 'frontPawR'], ['burrower', 'emerge', 'head'], ['burrower', 'burrow', 'head'],
    ['mimic_vine', 'wrap', 'tendril6'], ['mimic_vine', 'retract', 'tendril6'], ['mimic_vine', 'cut', 'head'],
    ['poison_pod', 'burst', 'sacR'], ['carrion_pack', 'bite', 'jaw'], ['hunter', 'shoot', 'rifleMuzzle'],
    ['elephant', 'trumpet', 'trunkTip'], ['zebra', 'rear', 'head'], ['pelican', 'fly', 'wingTipR'],
  ]) {
    const m = defaultNightMotion(kind);
    assert.notDeepEqual(poseAt(m, action, 0)[joint], poseAt(m, action, 3)[joint], kind + ' ' + action);
  }
  for (const kind of ['carnivorous_flower', 'mimic_vine', 'poison_pod']) {
    const m = defaultNightMotion(kind);
    for (const action of Object.keys(m.clips)) for (let f = 0; f < 8; f++) assert.deepEqual(poseAt(m, action, f).pelvis, [0, 0, 1]);
  }
  const burrower = defaultNightMotion('burrower');
  assert.ok(poseAt(burrower, 'underground', 2).head[2] < 0);
  assert.ok(poseAt(burrower, 'emerge', 7).head[2] > 0);
});

test('Gameplay phases override stale state; state aliases and explicit timeline controls work', () => {
  for (const [kind, phase, expected] of [
    ['hunter', 'aim', 'aim'], ['hunter', 'recover', 'reload'], ['carnivorous_flower', 'grab', 'grab'],
    ['carnivorous_flower', 'holding', 'mouth'], ['mimic_vine', 'holding', 'wrap'], ['poison_pod', 'barbs', 'spit'],
    ['burrower', 'burrow', 'underground'], ['burrower', 'emerge', 'emerge'], ['burrower', 'exposed', 'bite'],
    ['night_stalker', 'windup', 'crouch'], ['night_stalker', 'pounce', 'pounce'], ['night_stalker', 'recover', 'retreat'],
  ]) assert.equal(nightAction(kind, { state: 'windup', attack: 1, night: { phase } }), expected);
  assert.equal(nightAction('hunter', { state: 'fire' }), 'shoot');
  assert.equal(nightAction('carnivorous_flower', { state: 'swallow' }), 'mouth');
  assert.equal(nightAction('night_stalker', { state: 'pounce', animationAction: 'stalk' }), 'stalk');
  assert.equal(nightFrame('night_stalker', { night: { phase: 'pounce', timer: .19 } }, 100), 3.5);
  assert.equal(nightFrame('hunter', { state: 'fire', timer: .5, motionDuration: 1 }, 100), 3.5);
  assert.equal(nightFrame('hunter', { state: 'fire', playerFrame: 2, poseTime: 1 }, 100), 2);
  assert.equal(nightFrame('hunter', { state: 'fire', animationProgress: 2 }, 100), 7);
});

test('Hunter uses real safari equipment, and removed gear removes the corresponding art', () => {
  for (const [slot, id] of Object.entries(HUNTER_EQUIPMENT)) if (id) assert.equal(ITEMS[id].slot, slot);
  const model = defaultNightMotion('hunter'), subject = RIG_SUBJECTS.hunter;
  subject.draw(context(), { kind: 'hunter' }, 0, model);
  assert.ok(renderLayers(model, 0).includes('Safari hat'));
  assert.ok(renderLayers(model, 0).includes('Rifle'));
  const equipped = context(); subject.draw(equipped, { equipment: HUNTER_EQUIPMENT }, 0, model);
  const naked = context(); subject.draw(naked, { equipment: {} }, 0, model);
  assert.ok(!renderLayers(model, 0).includes('Safari hat'));
  assert.ok(!renderLayers(model, 0).includes('Rifle'));
  assert.notDeepEqual(equipped.pixels, naked.pixels);
});

test('Night definition defaults match event stats and expose the correct anatomy', () => {
  const types = { hunter: 'humanoid', carnivorous_flower: 'plant', mimic_vine: 'plant', poison_pod: 'plant', pelican: 'winged', burrower: 'serpent' };
  for (const kind of NIGHT_KINDS) {
    const defaults = creatureDefaults(kind), event = NIGHT_EVENTS.find(e => e.kind === kind);
    assert.ok(event, kind);
    for (const field of ['hp', 'speed', 'damage']) {
      assert.equal(defaults.stats[field], event[field], kind + ' ' + field);
      assert.equal(creatures[kind].stats[field], event[field]);
    }
    assert.equal(defaults.rig.type, types[kind] || 'quadruped');
    assert.equal(creatures[kind].rig.type, defaults.rig.type);
    assert.equal(RIG_SUBJECTS[kind].data.type, kind);
    assert.ok(validateNightMotion(kind, RIG_SUBJECTS[kind].defaults()));
  }
});

test('Runtime death timers advance and clamp death/wilt despite stale attack phases', () => {
  for (const kind of NIGHT_KINDS) {
    const model = defaultNightMotion(kind);
    const actor = { hp: 0, deathTimer: 0, state: 'windup', timer: 1, motionDuration: 1, night: { phase: 'grab', timer: .8 } };
    const action = nightAction(kind, actor, model), clip = model.clips[action];
    assert.ok(['death', 'wilt'].includes(action));
    assert.equal(nightFrame(kind, actor, 100, model), 0);
    actor.deathTimer = .25;
    assert.equal(nightFrame(kind, actor, 100, model), .25 * clip.fps);
    assert.notDeepEqual(poseAt(model, action, 0), poseAt(model, action, nightFrame(kind, actor, 100, model)));
    actor.deathTimer = 3;
    assert.equal(nightFrame(kind, actor, 100, model), clip.length - 1);
    assert.equal(nightFrame(kind, { ...actor, playerFrame: 2 }, 100, model), 2);
    assert.equal(nightFrame(kind, { ...actor, poseTime: .5 }, 100, model), (clip.length - 1) * .5);
  }
});

test('Older stampede imports gain the default mixed squad without losing edited fields', () => {
  const defaults = HAZARD_EVENTS.find(e => e.type === 'stampede');
  const legacy = { ...structuredClone(defaults), name: 'My herd', count: 9, speed: 123, damage: 31, weight: 2, tip: 'Custom tip', custom: { enabled: true } };
  delete legacy.squad;
  const events = structuredClone(HAZARD_EVENTS);
  applyDefinitions({ version: 1, events: [legacy] }, events, {}, { spriteOverrides: false });
  const migrated = events.find(e => e.type === 'stampede');
  assert.deepEqual(migrated, { ...legacy, squad: defaults.squad });
  assert.notEqual(migrated.squad, defaults.squad);
  assert.equal(Object.hasOwn(legacy, 'squad'), false, 'input is not mutated');
  for (const squad of [['elephant', 'pelican'], []]) {
    const edited = { ...legacy, squad };
    applyDefinitions({ version: 1, events: [edited] }, events, {}, { spriteOverrides: false });
    assert.deepEqual(events.find(e => e.type === 'stampede'), edited, 'explicit squads are preserved');
  }
  const empty = [];
  applyDefinitions({ version: 1, events: [legacy, { kind: 'rhino', type: 'enemy', count: 1 }] }, empty, {}, { spriteOverrides: false });
  assert.deepEqual(empty[0].squad, defaults.squad, 'fallback also supports empty event registries');
  assert.equal(Object.hasOwn(empty[1], 'squad'), false, 'ordinary rhinos are unaffected');
});

test('Night models round-trip independently, merge with older saves, and preserve per-species sprites', async t => {
  const original = rigPack([], {}), storage = globalThis.localStorage, win = globalThis.window;
  const store = new Map();
  globalThis.localStorage = { getItem: key => store.get(key), setItem: (key, value) => store.set(key, value) };
  t.after(() => { globalThis.localStorage = storage; globalThis.window = win; applyDefinitions(original, [], {}, { spriteOverrides: false }); });
  const first = nightMotions.night_stalker, other = structuredClone(nightMotions.carrion_pack);
  const edited = defaultNightMotion('night_stalker'); edited.boneSprites = { Body: { 0: sprite } }; edited.palette.body = '#123456';
  replaceNightMotion('night_stalker', edited);
  edited.palette.body = '#654321';
  assert.equal(first, nightMotions.night_stalker);
  assert.equal(first.palette.body, '#123456');
  assert.deepEqual(nightMotions.carrion_pack, other);
  const pack = JSON.parse(JSON.stringify(rigPack([], {})));
  assert.deepEqual(pack.nightMotions.night_stalker.boneSprites.Body[0], sprite);
  saveRigSpriteOverride('hunter', 'Body', 0, sprite);
  const events = NIGHT_KINDS.map(kind => ({ kind }));
  applyDefinitions({ version: 1, creatures: {}, events: [{ kind: 'lion' }] }, events, {});
  for (const kind of NIGHT_KINDS) { assert.ok(creatures[kind]); assert.ok(events.some(e => e.kind === kind)); }
  assert.deepEqual(nightMotions.hunter.boneSprites.Body[0], sprite);
  assert.equal(nightMotions.elephant.boneSprites, undefined);
  globalThis.window = { desktop: { loadProjectRigs: async () => pack } };
  await loadProjectRigs([], {});
  assert.equal(nightMotions.hunter.boneSprites, undefined, 'shared project clears stale local art');
  const invalid = { version: 1, nightMotions: { zebra: defaultNightMotion('zebra'), hunter: defaultNightMotion('hunter') } };
  invalid.nightMotions.zebra.palette.body = '#abcdef'; invalid.nightMotions.hunter.joints.head.position[0] = Infinity;
  const before = structuredClone(nightMotions.zebra);
  assert.throws(() => applyDefinitions(invalid, [], {}), /Invalid night/);
  assert.deepEqual(nightMotions.zebra, before, 'validation precedes all night mutations');
  assert.ok(definitionPack([], {}).nightMotions);
});

test('Stampede render cache separates species, refreshes changed models, and bypasses editor frames', t => {
  const doc = globalThis.document; let canvases = 0;
  globalThis.document = { createElement() { canvases++; const c = context(); return { width: 0, height: 0, getContext: () => c }; } };
  t.after(() => { globalThis.document = doc; });
  const animator = new Animator({}), c = context();
  for (const kind of STAMPEDE_KINDS) animator.draw(c, { kind, x: 0, y: 0, state: 'stampede', faceY: 1 }, 0);
  assert.equal(animator.nightStampedeFrames.size, 3);
  const count = canvases;
  animator.draw(c, { kind: 'zebra', x: 5, y: 5, state: 'stampede', faceY: 1 }, 0);
  assert.equal(canvases, count);
  replaceNightMotion('zebra', structuredClone(nightMotions.zebra));
  animator.draw(c, { kind: 'zebra', x: 5, y: 5, state: 'stampede', faceY: 1 }, 0);
  assert.equal(canvases, count + 1);
  animator.draw(c, { kind: 'zebra', x: 5, y: 5, state: 'stampede', playerFrame: 2 }, 0);
  assert.equal(canvases, count + 1);
});
