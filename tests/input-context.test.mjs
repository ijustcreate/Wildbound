import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/core.mjs';
import {normalizeMapping,DEFAULT_MAPPING,labelsForController} from '../src/controls.mjs';
function ready(){const g=new Game(()=>.4),p=g.addPlayer('keyboard');g.start();g.openingBoard=false;p.x=800;p.y=870;p.faceX=0;p.faceY=-1;return {g,p};}
test('Controller mapping rejects duplicate and invalid action buttons',()=>{const m=normalizeMapping({attack:8,inventory:8,field:8,loot:-1});assert.equal(new Set(Object.values(m)).size,Object.keys(m).length);assert.ok(Object.values(m).every(n=>Number.isInteger(n)&&n>=0&&n<=31));});

test('Shoulders and menu buttons migrate the shipped layout while preserving unrelated custom bindings',()=>{
 const old={...DEFAULT_MAPPING,dodge:7,board:4,potion:5,block:6};
 assert.deepEqual(normalizeMapping(old),DEFAULT_MAPPING);
 assert.deepEqual(normalizeMapping({...old,inventory:9,pause:8}),DEFAULT_MAPPING);
 const customFace=normalizeMapping({...old,attack:16});assert.equal(customFace.attack,16);assert.equal(customFace.dodge,7);assert.equal(customFace.block,6);
 const custom={...DEFAULT_MAPPING,attack:16,inventory:9,pause:8};const result=normalizeMapping(custom);
 assert.equal(result.attack,16);assert.equal(result.inventory,8);assert.equal(result.pause,9);
 assert.deepEqual([DEFAULT_MAPPING.dodge,DEFAULT_MAPPING.block],[7,6]);
 assert.deepEqual([labelsForController(DEFAULT_MAPPING,'switch').dodge,labelsForController(DEFAULT_MAPPING,'switch').block],['ZR','ZL']);
 assert.equal(custom.inventory,9,'Saved object is not mutated');
});

test('trigger aim/dash, right-bumper creature control and D-pad storage are unambiguous on both pads',()=>{
 const migrated=normalizeMapping({attack:16,jump:0,dodge:5,block:4,board:6,potion:7,portal:13,inventory:8,pause:9});
 assert.deepEqual([migrated.block,migrated.dodge,migrated.controlCycle,migrated.portal,migrated.board,migrated.potion],[6,7,5,12,14,4]);assert.equal(migrated.attack,16);
 for(const [family,expected]of [['xbox',['LT','RT','RB']],['switch',['ZL','ZR','R']]]){
  const labels=labelsForController(migrated,family);assert.deepEqual([labels.block,labels.dodge,labels.controlCycle],expected);assert.equal(labels.portal,'D-up');assert.equal(labels.board,'D-left');
 }
});
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

test('board migrates from either legacy left binding to D-pad Left and restores L aim',()=>{
 for(const saved of [{...DEFAULT_MAPPING,board:6},{...DEFAULT_MAPPING,board:4,block:6,dodge:7},{...DEFAULT_MAPPING,board:4,block:7,dodge:6,potion:5,attack:16}]){
  const before=structuredClone(saved),mapping=normalizeMapping(saved);
  assert.equal(mapping.board,14);assert.equal(mapping.block,6);assert.equal(mapping.dodge,7);
  assert.equal(mapping.attack,saved.attack);assert.equal(new Set(Object.values(mapping)).size,Object.keys(mapping).length);
  assert.deepEqual(saved,before);assert.deepEqual(normalizeMapping(mapping),mapping);
 }
 for(const family of ['switch','xbox','playstation'])assert.equal(labelsForController(DEFAULT_MAPPING,family).board,'D-left');
});
test('Board interaction never opens a storage inventory',()=>{const {g,p}=ready();for(let n=0;n<20;n++)g.update(.05,{keyboard:{interact:true}});g.update(.05,{keyboard:{}});assert.equal(p.ui,null);g.update(.05,{keyboard:{interact:true}});g.update(.05,{keyboard:{}});assert.equal(p.ui,null);});
test('Idle time does not create spontaneous encounters',()=>{const {g}=ready();for(let n=0;n<1200;n++)g.update(.05,{});assert.equal(g.enemies.length,0);assert.equal(g.roll,null);});


