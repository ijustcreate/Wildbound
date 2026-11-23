import test from 'node:test';
import assert from 'node:assert/strict';
import {createSaveCoordinator,saveStatusText} from '../src/save-coordinator.mjs';
const deferred=()=>{let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve};};

test('every save caller waits for the newest queued immutable checkpoint',async()=>{
  const first=deferred(),last=deferred(),writes=[];
  const queue=createSaveCoordinator(async data=>{writes.push(data);await (writes.length===1?first:last).promise;});
  const data={coins:1};const a=queue.save(data);await Promise.resolve();
  data.coins=2;const b=queue.save(data);data.coins=3;const c=queue.save(data);data.coins=999;
  assert.equal(a,b);assert.equal(b,c);let finished=false;b.then(()=>finished=true);
  first.resolve();await new Promise(r=>setImmediate(r));
  assert.equal(finished,false);assert.equal(queue.state.saving,true);
  assert.deepEqual(writes,[{coins:1},{coins:3}]);
  last.resolve();await c;
  assert.equal(finished,true);assert.equal(queue.state.committed,3);assert.equal(queue.state.saving,false);
});
test('failed saves reject flush, retain failure, and retry the same snapshot',async()=>{
  let fail=true,writes=0;const queue=createSaveCoordinator(async()=>{writes++;if(fail)throw Error('Disk full');});
  await assert.rejects(queue.save({coins:3}),/Disk full/);
  assert.equal(queue.state.savedAt,null);assert.equal(queue.state.saving,false);
  await assert.rejects(queue.flush(),/Disk full/);
  fail=false;await queue.save({coins:3});assert.equal(writes,2);assert.equal(queue.state.error,null);
  await queue.save({coins:3});assert.equal(writes,2);
});
test('a queued successful newer snapshot supersedes a failed write',async()=>{
  const hold=deferred();let count=0;const queue=createSaveCoordinator(async()=>{if(++count===1){await hold.promise;throw Error('temporary');}});
  const a=queue.save({n:1});await Promise.resolve();const b=queue.save({n:2});hold.resolve();
  await Promise.all([a,b]);assert.equal(count,2);assert.equal(queue.state.committed,2);assert.equal(queue.state.error,null);
});
test('runtime save status never reports saved while another checkpoint is pending',()=>{
  assert.match(saveStatusText({saving:true,savedAt:123}),/Saving/);
  assert.match(saveStatusText({error:'Denied',saving:true}),/Save failed/);
  assert.match(saveStatusText({savedAt:1000},{now:2000}),/Saved just now/);
  assert.match(saveStatusText({savedAt:1000},{profileError:'Profile denied'}),/Profile denied/);
});
test('serialization errors preserve retryable status instead of inventing completion',async()=>{
  const queue=createSaveCoordinator(async()=>{}),circular={};circular.self=circular;
  await assert.rejects(queue.save(circular));assert.ok(queue.state.error);assert.equal(queue.state.savedAt,null);
  await queue.save({valid:true});assert.equal(queue.state.error,null);
});
test('an older successful write cannot erase a newer snapshot capture failure',async()=>{
  const hold=deferred(),queue=createSaveCoordinator(async()=>hold.promise);
  const older=queue.save({coins:2});const result=Promise.allSettled([older]);await Promise.resolve();
  await assert.rejects(queue.fail(Error('Snapshot could not be captured')),/Snapshot/);
  hold.resolve();assert.equal((await result)[0].status,'rejected');assert.match(queue.state.error,/Snapshot/);
  assert.equal(queue.state.committed,1);assert.equal(queue.state.requested,2);
  await queue.save({coins:3});assert.equal(queue.state.error,null);assert.equal(queue.state.committed,3);
});
