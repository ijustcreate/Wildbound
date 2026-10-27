import test from 'node:test';
import assert from 'node:assert/strict';
import {aimStick,updateAimFacing} from '../src/ranged-aim.mjs';
import {recordArrowTrail,drawArrowTrail} from '../src/embedded-arrow.mjs';
import {characterLightingAt} from '../src/character-lighting.mjs';
test('analog aim preserves shallow angles through every cardinal axis',()=>{
 for(let degree=0;degree<360;degree+=.5){const angle=degree*Math.PI/180,input=aimStick(Math.cos(angle)*.8,Math.sin(angle)*.8),actor={};updateAimFacing(actor,{aimX:input.x,aimY:input.y});assert.ok(Math.abs(actor.faceX-Math.cos(angle))<1e-10);assert.ok(Math.abs(actor.faceY-Math.sin(angle))<1e-10);}
 assert.deepEqual(aimStick(.1,.1),{x:0,y:0});assert.deepEqual(aimStick(NaN,Infinity),{x:0,y:0});
});
test('arrow history follows height and curves, remains bounded and fades after impact',()=>{
 const arrow={x:0,y:0,z:10};for(let n=0;n<100;n++){Object.assign(arrow,{x:n,y:n*.3,z:10+n*.1});recordArrowTrail(arrow,n/120);}
 assert.ok(arrow.flightTrail.length<=18);assert.equal(arrow.flightTrail.at(-1).y,arrow.y-arrow.z);
 arrow.stuck=true;const length=arrow.flightTrail.length;recordArrowTrail(arrow,2);assert.equal(arrow.flightTrail.length,length);
 let strokes=0;const c={save(){},restore(){},beginPath(){},moveTo(){},lineTo(){},stroke(){strokes++;}};
 drawArrowTrail(c,arrow,.84);assert.ok(strokes>0);strokes=0;drawArrowTrail(c,arrow,2);assert.equal(strokes,0);
});
test('local light selection depends on position and retains color and direction',()=>{
 const frame={ambient:0,sources:[{x:0,y:0,radius:100,color:'#ffb070',intensity:1}]};
 const near=characterLightingAt(frame,{x:10,y:0}),far=characterLightingAt(frame,{x:200,y:0});
 assert.equal(near.lights.length,1);assert.equal(far.lights.length,0);assert.equal(near.lights[0].color,'#ffb070');assert.ok(near.lights[0].dx<0);
});
test('light falloff and direction use body height rather than the ground anchor',()=>{
 const frame={ambient:0,sources:[{x:0,y:0,height:40,radius:200,intensity:1}]};
 const ground=characterLightingAt(frame,{x:20,y:0}),jump=characterLightingAt(frame,{x:20,y:0,jumpHeight:120});
 assert.ok(ground.lights[0].strength>jump.lights[0].strength);
 assert.ok(ground.lights[0].dy<0);assert.ok(jump.lights[0].dy>0);
 const elevated=characterLightingAt(frame,{x:20,y:0},{lift:120,bodyHeight:22});assert.deepEqual(elevated,jump);
});
