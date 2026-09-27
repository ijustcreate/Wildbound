import test from 'node:test';
import assert from 'node:assert/strict';
import {Profiles} from '../src/profiles.mjs';
import {freshCharacter} from '../src/items.mjs';

test('deleting a character preserves other heroes and shared storage, and capture cannot restore it', async()=>{
  const p=new Profiles(), hero=freshCharacter('one','First'), other=freshCharacter('two','Second');
  p.data.heroes=[hero,other];p.data.sharedStash=[{id:'sword',count:1}];
  let saved;p.save=async()=>{saved=structuredClone(p.data);};
  await p.remove(hero.id);
  assert.deepEqual(saved.heroes,[other]);assert.deepEqual(saved.deletedIds,['one']);
  assert.deepEqual(saved.sharedStash,[{id:'sword',count:1}]);
  p.capture({players:[{...hero,profileId:'one'}],sharedStash:p.data.sharedStash});
  assert.equal(p.data.heroes.length,1);
});
test('failed deletion rolls back the full profile and readiness resets on character selection',async()=>{
  const p=new Profiles();p.data.heroes=[freshCharacter('one','First')];
  const before=structuredClone(p.data);p.save=async()=>{p.error='Disk unavailable';};
  await assert.rejects(p.remove('one'),/Disk unavailable/);assert.deepEqual(p.data,before);
  const player={ready:true};p.assign(player,p.data.heroes[0]);assert.equal(player.ready,false);
});
