import test from 'node:test';
import assert from 'node:assert/strict';
import {drawLobbyCeilingWash,drawLobbyCastShadow} from '../src/lobby-lighting.mjs';

function context(){
  const calls={rects:[],polygons:0,ellipses:0,gradients:[]};
  return {calls,save(){},restore(){},translate(){},fillRect(...args){calls.rects.push(args);},beginPath(){},moveTo(){calls.polygons++;},lineTo(){},closePath(){},fill(){},ellipse(){calls.ellipses++;},createLinearGradient(){const stops=[];calls.gradients.push(stops);return {addColorStop(...args){stops.push(args);}};},createRadialGradient(){const stops=[];calls.gradients.push(stops);return {addColorStop(...args){stops.push(args);}};}};
}

test('lobby overhead light adds a cool, soft wash across the floor',()=>{
  const c=context();drawLobbyCeilingWash(c,{left:16,top:68,right:1024,bottom:620});
  assert.equal(c.calls.rects.length,5);
  assert.equal(c.calls.gradients.length,5);
  assert.ok(c.calls.gradients[0].some(([,color])=>color.includes('191,220,222')));
});

test('lobby cast shadows use short angular shapes rather than oval blobs',()=>{
  const c=context();drawLobbyCastShadow(c,320,240,48,14);
  assert.equal(c.calls.polygons,2);
  assert.equal(c.calls.ellipses,0);
  assert.equal(c.calls.gradients.length,1);
});
