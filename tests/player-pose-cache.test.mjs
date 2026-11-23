import test from 'node:test';
import assert from 'node:assert/strict';
import {playerMotion,poseAt,withPlayerPoseCache} from '../src/player-motion.mjs';
test('scoped key indexing preserves every native clip pose including fractional and looping frames',()=>{for(const name of Object.keys(playerMotion.clips))for(const frame of [-1,0,.375,4.125,1000]){const expected=poseAt(playerMotion,name,frame),actual=withPlayerPoseCache(()=>poseAt(playerMotion,name,frame));assert.deepEqual(actual,expected,name+' at '+frame);}});
test('pose results remain independent and live clip edits appear in the next paint',()=>{const model={joints:{a:{position:[0,0,0]}},clips:{idle:{length:4,loop:false,keys:[{frame:0,joints:{a:[1,2,3]}},{frame:3,joints:{a:[4,5,6]}}]}}};withPlayerPoseCache(()=>{const first=poseAt(model,'idle',0);first.a[0]=999;assert.equal(poseAt(model,'idle',0).a[0],1);});model.clips.idle.keys[0].joints.a[0]=20;assert.equal(withPlayerPoseCache(()=>poseAt(model,'idle',0)).a[0],20);assert.throws(()=>withPlayerPoseCache(()=>{throw Error('paint');}));model.clips.idle.keys[0].joints.a[0]=30;assert.equal(poseAt(model,'idle',0).a[0],30);});

