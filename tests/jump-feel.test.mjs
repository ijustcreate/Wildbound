import test from 'node:test';
import assert from 'node:assert/strict';
import {startJump,releaseJump,tickJump,jumpMotion} from '../src/jumping.mjs';
import {defaultNativePlayerMotion,playerAction,playerFrame,playerPose} from '../src/player-motion.mjs';

test('jump poses use jump progress, independent of when in the game a jump starts',()=>{
 const m=defaultNativePlayerMotion();assert.equal(m.nativeJumpRevision,1);
 const a={hp:100,jumpImpulse:230,jumpGravity:1200,jumpHeld:true};startJump(a);
 const seen=new Set();
 for(let i=0;i<120&&a.jumpHeight;i++){
  tickJump(a,1/120);const action=playerAction(a);seen.add(action);
  assert.equal(playerFrame(a,.5,m),playerFrame(a,900,m),action);
  assert.deepEqual(playerPose(a,.5,m),playerPose(a,900,m));
 }
 for(const name of ['jump_takeoff','jump_air','jump_fall','land'])assert.ok(seen.has(name),name);
 assert.notDeepEqual(m.clips.jump_air.keys,m.clips.jump_fall.keys);
});
test('releasing jump never snaps velocity; taps stay lower and integration is stable',()=>{
 const arc=(dt,hold)=>{const a={hp:100,jumpHeld:true,jumpImpulse:230,jumpGravity:1200};startJump(a);let peak=0,t=0;
  while(a.jumpHeight>0&&t<2){if(!hold&&t>=.03){const v=a.jumpVelocity;releaseJump(a);assert.equal(a.jumpVelocity,v);}tickJump(a,dt);peak=Math.max(peak,a.jumpHeight);t+=dt;}return {peak,t};};
 const tap=arc(1/120,false),held=arc(1/120,true),coarse=arc(1/30,true);
 assert.ok(held.peak>tap.peak*1.35);assert.ok(held.t<.6);
 assert.ok(Math.abs(held.peak-coarse.peak)<1);assert.ok(Math.abs(held.t-coarse.t)<.04);
});
test('air movement adds modest reach with gradual steering independent of held Jump',()=>{
 const a={hp:100,jumpImpulse:230,jumpGravity:1200,jumpHeld:true};jumpMotion(a,1,0,133,.02);startJump(a);
 const first=jumpMotion(a,1,0,133,.02);assert.ok(Math.abs(first.dx-2.66*1.15)<.001);
 const steering=jumpMotion(a,-1,0,133,.02);assert.ok(steering.dx>0&&steering.dx<first.dx);
 const v=a.jumpAirVX;releaseJump(a);assert.equal(a.jumpAirVX,v);
});

test('extra reach preserves the vertical arc and does not launch stationary jumps sideways',()=>{
 const a={hp:100,jumpImpulse:230,jumpGravity:1200,jumpHeld:true},b={...a};
 startJump(a);startJump(b);let distance=0,baseline=0;
 while(a.jumpHeight>0){
  const motion=jumpMotion(a,1,0,133,1/120);distance+=motion.dx;baseline+=133/120;
  tickJump(a,1/120);tickJump(b,1/120);
  assert.equal(a.jumpHeight,b.jumpHeight);assert.equal(a.jumpVelocity,b.jumpVelocity);
 }
 assert.ok(Math.abs(distance/baseline-1.15)<.001);
 const still={hp:100};startJump(still);assert.deepEqual(jumpMotion(still,0,0,133,.02),{dx:0,dy:0});
});
