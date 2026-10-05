import test from 'node:test';
import assert from 'node:assert/strict';
import {groupLodgedArrows} from '../src/embedded-arrow.mjs';
test('target arrow bundles retain count without mutating projectiles',()=>{
 const arrows=Array.from({length:10},(_,i)=>({id:i,enemy:0,stuck:true,ammoType:'starter_arrow',impactTime:i}));
 const before=structuredClone(arrows),groups=groupLodgedArrows(arrows);
 assert.equal(groups.length,1);assert.equal(groups[0].qty,10);assert.equal(groups[0].impactTime,9);assert.deepEqual(arrows,before);
});
test('separate targets, ammunition and flying arrows are not combined',()=>{
 const arrows=[{stuck:true,enemy:1},{stuck:true,enemy:2},{stuck:true,enemy:1,ammoType:'starter_arrow'},{stuck:false,enemy:1},{stuck:true}];
 assert.equal(groupLodgedArrows(arrows).length,5);
});
