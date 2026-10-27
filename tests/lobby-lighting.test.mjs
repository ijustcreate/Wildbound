import test from 'node:test';
import assert from 'node:assert/strict';
import {drawLobbyCeilingWash,drawLobbyCastShadow,lobbyFootContacts} from '../src/lobby-lighting.mjs';

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

test('standing foot contacts turn with the rig, follow elevated support and disappear during jumps',()=>{
 const a={x:300,y:240,hp:100,equipment:{},faceX:0,faceY:1,animationAction:'idle'};
 const front=lobbyFootContacts(a,0),side=lobbyFootContacts({...a,faceX:1,faceY:0},0);
 assert.equal(front.length,2);assert.notDeepEqual(front,side);assert.ok(front.every(p=>Math.abs(p.y-a.y)<8));
 const raised=lobbyFootContacts({...a,groundHeight:40},0);assert.deepEqual(raised,front.map(p=>({...p,y:p.y-40})));
 assert.deepEqual(lobbyFootContacts({...a,jumpHeight:30},0),[]);assert.deepEqual(lobbyFootContacts({...a,wingHover:true},0),[]);
});
