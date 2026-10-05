import test from 'node:test';
import assert from 'node:assert/strict';
import {updateBowAimBlend} from '../src/ranged-aim.mjs';
import {playerPose,defaultPlayerMotion,playerFrame} from '../src/player-motion.mjs';
const actor=()=>({hp:100,faceX:0,faceY:1,equipment:{hand1:'bow'},charge:0,bowAiming:true});
test('aim raise/lower is frame-rate independent and never changes firing direction',()=>{
 const a=actor(),b=actor();for(let i=0;i<12;i++)updateBowAimBlend(a,{},1/60);for(let i=0;i<6;i++)updateBowAimBlend(b,{},1/30);
 assert.ok(Math.abs(a.bowAimBlend-b.bowAimBlend)<1e-8);assert.ok(a.bowAimBlend>.95);
 a.bowAiming=false;updateBowAimBlend(a,{},1/60);assert.ok(a.bowAimBlend>0&&a.bowAimBlend<.95);
 a.faceX=1;a.faceY=0;const old=a.bowVisualAngle;updateBowAimBlend(a,{},1/60);
 assert.equal(a.faceX,1);assert.equal(a.faceY,0);assert.ok(a.bowVisualAngle<old&&a.bowVisualAngle>-Math.PI/2);
});
test('holding aim without drawing raises bow and blends hands between ready/aimed poses',()=>{
 const a=actor(),model=defaultPlayerMotion();assert.ok(playerFrame(a,0,model,'draw')>0);
 const low=playerPose({...a,bowAimBlend:0},0,model),high=playerPose({...a,bowAimBlend:1},0,model),mid=playerPose({...a,bowAimBlend:.5},0,model);
 for(const joint of ['handL','handR','elbowL','elbowR'])for(let i=0;i<3;i++)assert.ok(Math.abs(mid[joint][i]-(low[joint][i]+high[joint][i])/2)<1e-8);
});
