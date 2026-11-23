import test from 'node:test';
import assert from 'node:assert/strict';
import {clipTrainFace,clipTrainLine,trainViewDepth} from '../src/train-depth-clip.mjs';

for(let view=0;view<8;view++)test('physical face and trim segment split at the rider plane in view '+view,()=>{
 const angle=view*Math.PI/4,rider={x:3,y:-2},depth=trainViewDepth([rider.x,rider.y],angle),nx=Math.sin(angle),ny=Math.cos(angle),tx=Math.cos(angle),ty=-Math.sin(angle);
 const point=(d,s,z)=>[rider.x+nx*d+tx*s,rider.y+ny*d+ty*s,z];
 const square=[point(-12,-8,31),point(12,-8,31),point(12,8,34),point(-12,8,34)],face=clipTrainFace(square,angle,rider);
 assert.equal(face.length,4);assert.ok(face.every(p=>trainViewDepth(p,angle)>=depth-1e-6));assert.equal(face.filter(p=>Math.abs(trainViewDepth(p,angle)-depth)<1e-6).length,2);
 assert.ok(face.every(p=>p[2]>=31&&p[2]<=34));
 const segments=clipTrainLine([point(-12,0,20),point(12,0,40),point(-12,1,60)],angle,rider);
 assert.equal(segments.length,2);assert.ok(segments.flat().every(p=>trainViewDepth(p,angle)>=depth-1e-6));
 assert.equal(clipTrainFace(square.map(p=>[p[0]-nx*40,p[1]-ny*40,p[2]]),angle,rider).length,0);
 assert.equal(clipTrainLine([point(-12,0,20),point(-1,0,40)],angle,rider).length,0);
});

test('a coplanar visible face is retained without invalid zero-length intersections',()=>{
 const face=[[0,0,20],[10,0,20],[10,0,40],[0,0,40]];assert.deepEqual(clipTrainFace(face,0,{x:0,y:0}),face);
});
