import assert from 'node:assert/strict';
import test from 'node:test';

test('game boot retains creature metadata and loads donor rigs on demand', async t => {
  globalThis.window = { wildboundBoot: {} };
  t.after(() => { delete globalThis.window; });
  const { CREATURE_PACK_DEFAULTS, CREATURE_PACK_SUBJECTS, loadCreatureMotion, loadAdventureCreatureMotions } =
    await import('../src/creature-packs/index.mjs');
  const owl = CREATURE_PACK_SUBJECTS.great_owl.data;
  const dragon = CREATURE_PACK_SUBJECTS.butterfly_dragon.data;
  assert.ok(CREATURE_PACK_DEFAULTS.great_owl.name);
  assert.ok(owl.joints.wingTipL && owl.clips.glide);
  assert.ok(owl.clips[CREATURE_PACK_SUBJECTS.great_owl.clip]);
  assert.equal(owl.animationProvenance, undefined);

  const owlRequest = loadCreatureMotion('great_owl');
  assert.equal(owlRequest, loadCreatureMotion('great_owl'));
  await owlRequest;
  assert.equal(CREATURE_PACK_SUBJECTS.great_owl.data, owl);
  assert.ok(owl.animationProvenance && owl.clips.glide);
  assert.equal(loadCreatureMotion('great_owl'), null);
  assert.equal(dragon.animationProvenance, undefined);

  // A caller replacing a rig during its request must keep the authored pose.
  const sheep = CREATURE_PACK_SUBJECTS.sheep;
  const authoredSheep = sheep.defaults();
  authoredSheep.clips.idle.keys[0].joints.head = [0, 1, 2];
  const sheepRequest = loadCreatureMotion('sheep');
  sheep.replace(authoredSheep);
  await sheepRequest;
  assert.deepEqual(sheep.data.clips.idle.keys[0].joints.head, [0, 1, 2]);

  const worldResults = await loadAdventureCreatureMotions();
  assert.ok(worldResults.length > 0);
  assert.ok(worldResults.every(result => result.status === 'fulfilled'));
  assert.ok(dragon.animationProvenance);
  assert.ok(CREATURE_PACK_SUBJECTS.turkey.data.clips['wowhead-walk']);
  for (const kind of ['squirrel', 'sheep', 'skunk', 'llama', 'golden_retriever', 'turkey', 'triceratops', 'great_owl', 'butterfly_dragon', 'evil_hand']) {
    const subject = CREATURE_PACK_SUBJECTS[kind];
    assert.ok(subject.data.clips[subject.clip], `${kind} Studio default clip exists`);
    assert.ok(subject.tracks.every(track => subject.data.joints[track]), `${kind} Studio tracks exist`);
  }
  assert.equal(loadAdventureCreatureMotions(), null);
});
