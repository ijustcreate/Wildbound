import test from 'node:test';import assert from 'node:assert/strict';
import {Game} from '../src/core.mjs';import {tickHazards} from '../src/hazards.mjs';
import {embeddedArrowGeometry,arrowVisualAngle} from '../src/embedded-arrow.mjs';
test('Ground arrows anchor the buried tip and preserve incoming direction',()=>{
 for(let i=0;i<8;i++)for(const embedDepth of [5,15,30]){
 const p=embeddedArrowGeometry({x:100,y:200,angle:i*Math.PI/4,embedDepth});
 assert.equal(p.x,100);assert.equal(p.y,200);
 assert.ok(Math.abs((p.x-p.tailX)/p.length-Math.cos(i*Math.PI/4))<1e-8);
 assert.ok(Math.abs((p.y-p.tailY)/p.length-Math.sin(i*Math.PI/4))<1e-8);
 }
});
test('Arrow impact freezes the projected incoming angle including descent',()=>{
 const a={vx:300,vy:40,vz:-90};const before=arrowVisualAngle(a);
 a.angle=before;a.stuck=true;a.vx=0;a.vy=0;a.vz=0;
 assert.equal(arrowVisualAngle(a),before);assert.equal(before,Math.atan2(130,300));
});
test('Ground impacts keep their actual contact point and incoming slope',()=>{
 const g=new Game(()=>.5);g.addPlayer('keyboard');g.start();g.enemies=[];g.scenery=[];g.terrain.fill('grass');g.house=null;g.weather=null;g.projectileBlocked=()=>false;
 const a={x:400,y:400,vx:300,vy:100,vz:-60,z:1,gravity:0,damage:1,embedDepth:7};g.arrows=[a];
 g.tickAdventure(.05,{});assert.equal(g.arrows.length,0);
 const loot=g.loot.find(l=>l.embedded);assert.ok(loot);assert.equal(loot.x,a.x);assert.equal(loot.y,a.y);assert.equal(loot.angle,Math.atan2(160,300));
});
test('Ice and legacy water bolts damage without fire trails, particles or burning; fire is preserved',()=>{
 for(const kind of ['ice','water','fire']){
 const g=new Game();const p=g.addPlayer('keyboard');g.start();g.scenery=[];g.terrain.fill('grass');g.house=null;g.weather=null;g.enemies=[];Object.assign(p,{x:400,y:400,hp:100,invuln:0});
 g.fireballs=[{x:400,y:400,vx:0,vy:0,life:3,trail:0,damage:10,burnDamage:5,[kind]:true}];
 tickHazards(g,.01);assert.ok(p.hp<100);
 if(kind==='fire'){assert.ok(g.firePatches.length>0);assert.ok(p.burning>0||p.burn>0);}
 else {assert.equal(g.firePatches.length,0);assert.equal(g.fireParticles.length,0);assert.ok(!(p.burning>0)&&!(p.burn>0));assert.ok(g.effects.some(e=>e.color==='#a7edff'));}
 }
});
