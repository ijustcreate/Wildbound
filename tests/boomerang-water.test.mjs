import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/core.mjs';
import {ITEMS,rollGear} from '../src/items.mjs';
import {throwBoomerang,tickBoomerangs} from '../src/boomerang.mjs';
import {drawEmbeddedArrow} from '../src/embedded-arrow.mjs';
function setup(){const g=new Game(()=>.5),p=g.addPlayer('keyboard');g.start();g.openingBoard=false;g.house=null;g.scenery=[];g.enemies=[];g.terrain.fill('grass');p.x=p.y=400;return {g,p};}
test('Four boomerangs equip; three upgrades occur in their loot tiers',()=>{
 for(const [tier,id]of [['common','boomerang'],['rare','moon_boomerang'],['unique','sun_boomerang']]){
  assert.equal(ITEMS[id].rarity,tier);const pool=Object.keys(ITEMS).filter(id=>ITEMS[id].slot&&!ITEMS[id].supplyOnly&&ITEMS[id].rarity===tier),index=pool.indexOf(id);
  assert.equal(rollGear(()=> (index+.1)/pool.length,tier),id);
 }assert.equal(ITEMS.starter_boomerang.slot,'hand1');
});
test('Boomerang hits once, returns and can be thrown again without consuming gear',()=>{
 const {g,p}=setup();p.equipment.hand1='starter_boomerang';p.faceX=1;p.faceY=0;
 const e={id:900,x:460,y:400,hp:100,maxHp:100};g.enemies=[e];throwBoomerang(g,p);throwBoomerang(g,p);assert.equal(g.boomerangs.length,1);assert.equal(g.boomerangs[0].vy,0);
 for(let i=0;i<100;i++)tickBoomerangs(g,.02);
 assert.equal(e.hp,88);assert.equal(e.killedBy,p.id);assert.equal(g.boomerangs.length,0);assert.equal(p.equipment.hand1,'starter_boomerang');throwBoomerang(g,p);assert.equal(g.boomerangs.length,1);
});
test('Arrow bundle quantities are opt-in',()=>{
 const labels=[],c=new Proxy({measureText:()=>({width:10}),fillText:t=>labels.push(t)},{get:(o,k)=>k in o?o[k]:()=>{}});
 drawEmbeddedArrow(c,{x:100,y:100,qty:5});assert.equal(labels.length,0);drawEmbeddedArrow(c,{x:100,y:100,qty:5},0,true);assert.deepEqual(labels,['×5']);
});
test('Arrows landing in water are removed with a small splash, but airborne arrows cross it',()=>{
 const {g,p}=setup();g.terrain.fill('water');p.x=p.y=800;
 g.arrows=[{owner:p.id,x:400,y:400,z:1,vx:50,vy:0,vz:-100,damage:10,ammoType:'arrow'}];g.tickAdventure(.02,{});
 assert.equal(g.arrows.length,0);assert.equal(g.loot.filter(i=>i.type==='arrow').length,0);assert.ok(g.effects.some(e=>e.particle==='arrow-splash'));
 g.arrows=[{owner:p.id,x:400,y:400,z:100,vx:50,vy:0,vz:0,damage:10,ammoType:'arrow'}];g.tickAdventure(.02,{});assert.equal(g.arrows.length,1);
});
