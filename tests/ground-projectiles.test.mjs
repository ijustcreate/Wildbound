import test from 'node:test';import assert from 'node:assert/strict';
import {Game} from '../src/core.mjs';import {tickHazards} from '../src/hazards.mjs';
import {embeddedArrowGeometry} from '../src/embedded-arrow.mjs';
test('Ground arrows keep their tip anchored and their tail above the ground in every direction',()=>{
 for(let i=0;i<8;i++)for(const embedDepth of [5,15,30]){
 const p=embeddedArrowGeometry({x:100,y:200,angle:i*Math.PI/4,embedDepth});
 assert.equal(p.x,100);assert.equal(p.y,200);assert.ok(p.tailY<=189);assert.ok(Math.abs(p.tailX-100)<=7);
 }
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
