import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/core.mjs';
import {normalizeMapping,DEFAULT_MAPPING,labelsForController} from '../src/controls.mjs';
function ready(){const g=new Game(()=>.4),p=g.addPlayer('keyboard');g.start();g.openingBoard=false;p.x=800;p.y=870;p.faceX=0;p.faceY=-1;return {g,p};}
test('Controller mapping rejects duplicate and invalid action buttons',()=>{const m=normalizeMapping({attack:8,inventory:8,field:8,loot:-1});assert.equal(new Set(Object.values(m)).size,Object.keys(m).length);assert.ok(Object.values(m).every(n=>Number.isInteger(n)&&n>=0&&n<=31));});
test('Gameplay face buttons use Xbox X/A/Y and Switch Y/B/X',()=>{
 assert.deepEqual([DEFAULT_MAPPING.attack,DEFAULT_MAPPING.jump,DEFAULT_MAPPING.interact],[2,0,3]);
 for(const [family,expected] of [['xbox',['X','A','Y']],['switch',['Y','B','X']]]){
  const labels=labelsForController(DEFAULT_MAPPING,family);
  assert.deepEqual([labels.attack,labels.jump,labels.interact],expected);
 }
 assert.deepEqual(normalizeMapping({attack:0,jump:1,loot:2,interact:3}),DEFAULT_MAPPING);
 assert.equal(normalizeMapping({attack:0,jump:1,loot:2,interact:3,board:5}).attack,0);
});
test('Closing inventory cannot release a charged board attack or reopen shared storage',()=>{const {g,p}=ready();p.charge=.6;g.openInventory(p);g.update(.05,{keyboard:{attack:true,interact:true}});g.update(.05,{keyboard:{inventory:true,attack:true,interact:true}});g.update(.05,{keyboard:{}});assert.equal(g.roll,null);assert.equal(p.ui,null);assert.equal(p.charge,0);assert.equal(g.enemies.length,0);});
test('Board interaction never opens a storage inventory',()=>{const {g,p}=ready();for(let n=0;n<20;n++)g.update(.05,{keyboard:{interact:true}});g.update(.05,{keyboard:{}});assert.equal(p.ui,null);g.update(.05,{keyboard:{interact:true}});g.update(.05,{keyboard:{}});assert.equal(p.ui,null);});
test('Idle time does not create spontaneous encounters',()=>{const {g}=ready();for(let n=0;n<1200;n++)g.update(.05,{});assert.equal(g.enemies.length,0);assert.equal(g.roll,null);});


