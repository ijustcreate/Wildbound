import test from 'node:test';
import assert from 'node:assert/strict';
import { Game, EVENTS } from '../src/core.mjs';
import { saveSession, restoreSession } from '../src/session.mjs';
import { ITEMS } from '../src/items.mjs';
import { craft } from '../src/field-systems.mjs';
import {lightTorchFire} from '../src/night-equipment.mjs';
import {tickHazards} from '../src/hazards.mjs';

function setup(){const g=new Game(()=>.3),p=g.addPlayer('keyboard');g.start();g.scenery=[];g.terrain.fill('grass');g.openingBoard=false;p.x=400;p.y=500;p.faceX=1;p.faceY=0;return {g,p};}
test('A lantern cannot deal melee damage, while torch strikes ignite through the actual attack path',()=>{
  const {g,p}=setup();
  const e={id:900,kind:'lion',x:430,y:500,hp:100,maxHp:100,state:'hunt',speed:0,damage:0};g.enemies=[e];
  p.equipment.hand1='lantern';g.attack(p,1);assert.equal(e.hp,100);
  p.equipment.hand2='torch';g.attack(p);assert.ok(e.hp<100);assert.ok(e.burning>0);
});
test('Hunter save and reload preserves timer, kill reward is once, and equipment is obtainable',()=>{
  let {g,p}=setup();g.spawnEvent(EVENTS.findIndex(e=>e.kind==='hunter'));
  let hunter=g.enemies.find(e=>e.kind==='hunter');
  assert.equal(hunter.equipment.hand1,'rifle');
  hunter.night.objective.elapsed=73;
  g=restoreSession(JSON.parse(JSON.stringify(saveSession(g))));p=g.players[0];hunter=g.enemies.find(e=>e.kind==='hunter');
  assert.equal(hunter.night.objective.elapsed,73);
  hunter.hp=0;const coins=p.coins;g.update(.05,{});g.update(.05,{});
  assert.equal(p.coins,coins+20);
  assert.ok(g.loot.some(l=>l.type==='rifle'));assert.ok(g.loot.some(l=>l.type==='safari_hat'));
  assert.ok(g.loot.some(l=>l.type==='cartridge'));
});
test('Hunter timeout wins without a death or equipment reward and does not spawn more enemies',()=>{
  const {g,p}=setup();g.spawnEvent(EVENTS.findIndex(e=>e.kind==='hunter'));
  const hunter=g.enemies[0];hunter.night.objective.elapsed=119.98;
  g.update(.05,{});g.update(.05,{});
  assert.equal(g.nightEnemies.objectives[0].status,'survived');
  assert.equal(g.enemies.length,0);assert.equal(g.loot.length,0);assert.equal(p.coins,20);
});
test('Night supplies can be crafted and equipped with the existing inventory system',()=>{
  const {p}=setup();p.inventory=[{type:'stick',qty:2},{type:'log',qty:2},{type:'stone',qty:5}];
  assert.equal(craft(p,'torch'),'Trail torch crafted.');
  assert.equal(craft(p,'lantern'),'Unknown recipe.');
  assert.equal(craft(p,'cartridge'),'Unknown recipe.');
  assert.ok(p.inventory.some(i=>i?.type==='torch'));
  assert.ok(!p.inventory.some(i=>i?.type==='lantern'||i?.type==='cartridge'));
  assert.equal(ITEMS.lantern.damage,0);
});
test('Torch fire can be lit on dry ground but a lantern cannot light it',()=>{
  const {g,p}=setup();p.equipment.hand1='lantern';assert.equal(lightTorchFire(g,p),false);
  p.equipment.hand1='torch';assert.equal(lightTorchFire(g,p),true);assert.equal(g.firePatches.length,1);
  const patch=g.firePatches[0];assert.equal(patch.life,7);
  const enemy={id:2000,kind:'lion',hp:100,x:patch.x+16,y:patch.y+16};g.enemies.push(enemy);
  tickHazards(g,.05);assert.ok(enemy.hp<100);assert.ok(enemy.burning>0);assert.equal(enemy.killedBy,p.id);
  g.terrain.fill('water');assert.equal(lightTorchFire(g,p),false);
});
test('One player torch swing never ignites another player harvested tree',()=>{
  const {g,p}=setup();const q=g.addPlayer('gamepad:1');q.x=1000;q.y=500;q.faceX=1;q.faceY=0;
  const distant={kind:'tree',x:1040,y:492,size:64},near={kind:'tree',x:440,y:492,size:64};g.scenery=[distant,near];
  g.attack(q);assert.equal(distant.hitAt,g.time);
  p.equipment.hand1='torch';g.attack(p);
  assert.ok(near.torchBurn>0);assert.equal(distant.torchBurn,undefined);
});
