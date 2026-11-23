import test from 'node:test';
import assert from 'node:assert/strict';
import {trainSceneDepth,trainLayerBounds,trainSceneOccluders} from '../src/train-scene-layers.mjs';
import {trainWorld} from '../src/train-track.mjs';

test('riders, scenery and enemies retain their shared ground order across all headings',()=>{
 for(let view=0;view<8;view++){
  const c={x:1000,y:1000,z:0,a:view*Math.PI/4,index:2,length:320,width:100};
  const p={...trainWorld(c,-90,-15),trainRide:{car:2}},tree={x:p.x,y:p.y+12,rootY:p.y+8},enemy={x:p.x,y:p.y-8};
  assert.deepEqual([tree,p,enemy].sort((a,b)=>trainSceneDepth(a)-trainSceneDepth(b)),[enemy,p,tree]);
  assert.equal(trainSceneDepth(p),p.y);
 }
});
test('a raised seated sprite uses its physical seat depth, not its drawn feet',()=>{
 assert.equal(trainSceneDepth({y:980,trainDepthY:1010}),1010);
});
test('an actor can be masked by either neighbour before scene order has painted any subjects',()=>{
 for(let view=0;view<8;view++){
  const a={x:1000,y:1000,z:0,a:view*Math.PI/4,index:2,length:320,width:100},b={...a,index:3,...trainWorld(a,-340,0)},p={...trainWorld(a,-165,0),trainRide:{car:2}};
  const out=trainSceneOccluders(p,{...p,y:p.y-20},[a,b],()=>({}));
  assert.equal(out.length,2);assert.ok(out.every(o=>Number.isFinite(o.rider.x)&&o.rider.floor===20));
 }
});
test('large environment sprites retain canopy bounds while distant subjects avoid masking work',()=>{
 const c={x:1000,y:1000,z:50,a:.7,index:0,length:250,width:100},tree={x:1000,y:1230,size:190},bounds=trainLayerBounds('tree',tree);
 assert.ok(bounds.above>=360);assert.ok(bounds.halfWidth>=170);
 assert.equal(trainSceneOccluders(tree,tree,[c],()=>({}),bounds).length,1);
 assert.equal(trainSceneOccluders({...tree,x:3000},{...tree,x:3000},[c],()=>({}),bounds).length,0);
});
