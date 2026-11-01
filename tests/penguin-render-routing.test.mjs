import test from 'node:test';
import assert from 'node:assert/strict';
import { usesLegacyWildFaunaArt } from '../src/animation.mjs';
import { RIG_SUBJECTS } from '../src/rig-subjects.mjs';
import { CREATURE_PACK_EVENTS } from '../src/creature-packs/index.mjs';

test('Flipper event and sprite use the native penguin rig, not legacy Arctic Fox art',()=>{
  const event=CREATURE_PACK_EVENTS.find(item=>item.kind==='penguin');
  assert.ok(event,'a dev/event spawn still exists for Flipper');
  assert.ok(RIG_SUBJECTS.penguin?.data?.joints?.wingL,'Flipper has its own native bird rig');
  assert.equal(usesLegacyWildFaunaArt({kind:'penguin'}),false);
  assert.equal(usesLegacyWildFaunaArt({kind:'arctic_fox'}),true);
});
