import test from 'node:test';import assert from 'node:assert/strict';
import {Game} from '../src/core.mjs';
import {meleeProfile,meleeTargetInArc,meleeCanHit} from '../src/melee-geometry.mjs';
const setup=()=>{const g=new Game(()=>.5);g.phase='play';g.scenery=[];g.terrain.fill('grass');g.house={walls:[],doors:[],furniture:[],pools:[]};const p=g.addPlayer('keyboard');Object.assign(p,{x:300,y:300,faceX:1,faceY:0,equipment:{hand1:'sword'}});g.enemies=[];return {g,p};};
const enemy=(g,x,y)=>{const e={id:g.nextId++,kind:'lion',x,y,hp:500,maxHp:500,state:'hunt',faceX:-1,faceY:0};g.enemies.push(e);return e;};
test('Melee includes the entire sector, its boundary and overlapping bodies in all directions',()=>{
 for(let facing=0;facing<8;facing++){
  const a=facing*Math.PI/4,p={x:300,y:300,faceX:Math.cos(a),faceY:Math.sin(a)},profile={range:76,arc:90};
  for(const offset of [-Math.PI/4,0,Math.PI/4])for(const r of [0,1,38,76])assert.ok(meleeTargetInArc(p,{x:300+Math.cos(a+offset)*r,y:300+Math.sin(a+offset)*r,hitRadius:0},profile));
  assert.ok(meleeTargetInArc(p,{x:300+Math.cos(a)*86,y:300+Math.sin(a)*86,kind:'lion'},profile));
  assert.equal(meleeTargetInArc(p,{x:300-Math.cos(a)*40,y:300-Math.sin(a)*40,kind:'lion'},profile),false);
 }
});
test('Actual attacks hit overlapping creatures and body edges without a center-point dead zone',()=>{
 const {g,p}=setup(),inside=enemy(g,300,300),edge=enemy(g,350,354),behind=enemy(g,255,300);
 g.attack(p);assert.ok(inside.hp<500);assert.ok(edge.hp<500);assert.equal(behind.hp,500);
});
test('Broken windows pass melee in both directions; solid walls and closed doors stop it',()=>{
 for(const reverse of [false,true])for(const kind of ['window','wall','door']){
  const {g,p}=setup(),barrier={kind,x:326,y:240,w:12,h:120,broken:kind==='window',open:false};
  if(kind==='door')g.house.doors=[barrier];else g.house.walls=[barrier];
  if(reverse){p.x=360;p.faceX=-1;}
  const e=enemy(g,reverse?300:360,300);g.attack(p);
  assert.equal(e.hp<500,kind==='window',kind+' reverse='+reverse);
 }
});
test('An exposed flank through a broken window can be struck despite an occluded center',()=>{
 const {g,p}=setup();p.y=300;g.house.walls=[{kind:'window',broken:true,x:326,y:260,w:12,h:48},{kind:'wall',x:326,y:308,w:12,h:120}];
 const e=enemy(g,355,323);g.attack(p);assert.ok(e.hp<500);
});
test('Floating melee damage is an integer and matches damage actually applied',()=>{
 const {g,p}=setup(),e=enemy(g,340,300);e.state='recover';g.attack(p,.27);
 const text=g.effects.find(f=>f.text&&/^\d/.test(f.text))?.text;assert.ok(/^\d+$/.test(text));assert.equal(Number(text),500-e.hp);
});
