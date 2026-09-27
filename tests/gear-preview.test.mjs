import test from 'node:test';
import assert from 'node:assert/strict';
import {wearableDetails} from '../src/wearable-art.mjs';
import {defaultPlayerMotion,poseAt,projectPoint} from '../src/player-motion.mjs';
test('coat decoration stays between animated chest and pelvis in every facing',()=>{
 const model=defaultPlayerMotion();
 for(let d=0;d<8;d++)for(const frame of [0,2,4,6]){
  const p=Object.fromEntries(Object.entries(poseAt(model,'run',frame)).map(([n,v])=>[n,projectPoint(v,d)])),pixels=[];
  wearableDetails({fillRect:(x,y,w,h)=>pixels.push({x,y,w,h})},p,{chest:'armor'},null,d,0);
  assert.ok(pixels.length);assert.ok(pixels.every(r=>r.y>=Math.round(Math.min(p.chest.y,p.pelvis.y))-1&&r.y<=Math.round(Math.max(p.chest.y,p.pelvis.y))),d+':'+frame);
 }
});
