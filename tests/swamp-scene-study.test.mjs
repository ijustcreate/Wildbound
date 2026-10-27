import test from 'node:test';
import assert from 'node:assert/strict';
import {SWAMP_SCENE_CONTRACT,swampReviewBank,swampReviewTreePlan} from '../src/swamp-scene-study.mjs';
test('scene stays explicitly review-only and bounded',()=>{
  assert.equal(SWAMP_SCENE_CONTRACT.status,'draft-awaiting-user-review');
  assert.equal(SWAMP_SCENE_CONTRACT.width,640);assert.equal(SWAMP_SCENE_CONTRACT.waterFrames,8);assert.ok(SWAMP_SCENE_CONTRACT.maxTrees<=8);
});
test('tree structure varies deterministically without changing its root pivot',()=>{
  assert.deepEqual(swampReviewTreePlan(31),swampReviewTreePlan(31));assert.notDeepEqual(swampReviewTreePlan(31),swampReviewTreePlan(66));
  assert.notDeepEqual(swampReviewTreePlan(31),swampReviewTreePlan(31,'mangrove'));
  for(let seed=0;seed<100;seed++)for(const kind of ['cypress','mangrove']){
    const p=swampReviewTreePlan(seed,kind);assert.equal(p.crowns.length,5);
    for(const b of p.crowns){assert.ok(Math.abs(b.x)+b.rx<96);assert.ok(b.y-b.ry>-194);}
    for(const r of p.roots)assert.ok(Math.abs(r[0])<45);
  }
});
test('banks leave water, shallows and traversable land together',()=>{
  assert.ok(swampReviewBank(260,200)<-10);assert.ok(swampReviewBank(386,281)>15);
  assert.ok(swampReviewBank(70,250)>30);
});
