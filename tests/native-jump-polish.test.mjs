import test from 'node:test';
import assert from 'node:assert/strict';
import {defaultNativePlayerMotion,poseAt,upgradePlayerToNative,projectPoint} from '../src/player-motion.mjs';
import {jointAngle} from '../src/joint-angles.mjs';
test('generated jump keeps knees in the walking plane and soles level at authored stages',()=>{
 const m=defaultNativePlayerMotion();assert.equal(m.jumpPolishRevision,1);
 for(const name of ['jump_takeoff','jump_air','jump_fall','land'])for(const key of m.clips[name].keys){
  const p=poseAt(m,name,key.frame);
  for(const side of ['L','R']){
   assert.ok(Math.abs(p['foot'+side][0]-p['hip'+side][0])<.01,'ankle remains under its hip');
   assert.ok(Math.abs(p['knee'+side][0]-p['hip'+side][0])<.01,'knee does not splay sideways');
   for(let d=0;d<8;d++){
    const f=projectPoint(p['foot'+side],d),k=projectPoint(p['knee'+side],d);
    assert.ok(Math.abs(Math.atan2(k.x-f.x,f.y-k.y)*180/Math.PI+jointAngle(m,name,key.frame,d,'foot'+side))<.01,'shoe stays level');
   }
  }
 }
 for(const [a,b]of [['jump_takeoff','jump_air'],['jump_air','jump_fall'],['jump_fall','land']]){
  const end=poseAt(m,a,m.clips[a].length-1),start=poseAt(m,b,0);
  for(const n of Object.keys(end))assert.ok(Math.hypot(...end[n].map((v,i)=>v-start[n][i]))<.01,'continuous '+a+' to '+b);
 }
});
test('jump migration preserves edited jump keys and remains idempotent',()=>{
 const m=defaultNativePlayerMotion(),old=structuredClone(m);
 for(const [name,clip]of Object.entries(old.jumpPolishSource))old.clips[name]=structuredClone(clip);
 delete old.jumpPolishSource;delete old.jumpPolishRevision;
 old.clips.jump_air.keys[0].joints.footL[1]+=.25;
 const custom=structuredClone(old.clips.jump_air),next=upgradePlayerToNative(old);
 assert.deepEqual(next.clips.jump_air,custom);assert.deepEqual(upgradePlayerToNative(next),next);
});
import {readFileSync} from 'node:fs';
test('actual shared player rig receives the corrected base jump while preserving original keys',()=>{
 const original=JSON.parse(readFileSync(new URL('../authored/rigs.json',import.meta.url))).player;
 const m=upgradePlayerToNative(original);assert.equal(m.jumpPolishRevision,1);
 assert.deepEqual(m.nativeHumanoidSource.preservedClips.jump_air,original.clips.jump_air);
 for(const n of ['jump_takeoff','jump_air','jump_fall','land'])assert.ok(m.jumpPolishSource[n],n);
});
