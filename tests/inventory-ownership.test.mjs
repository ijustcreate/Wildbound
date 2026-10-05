import test from 'node:test';import assert from 'node:assert/strict';
import {Game} from '../src/core.mjs';import {SLOTS} from '../src/items.mjs';import {playerInput,guardInventoryKeys} from '../src/inventory-input.mjs';
const setup=()=>{const g=new Game(()=>.5);g.phase='play';g.scenery=[];g.house=null;g.terrain.fill('grass');const p=g.addPlayer('pad:0'),q=g.addPlayer('pad:1');for(const h of [p,q]){h.inventory=[{type:'sword',qty:1},{type:'potion',qty:4}];g.openInventory(h);}return {g,p,q};};
test('both controller inventories remain isolated through navigation, tabs and actions',()=>{
 const {g,p,q}=setup();g.tickAdventure(.01,{'pad:1':{next:true}});assert.equal(p.ui.index,0);assert.equal(q.ui.index,1);
 g.tickAdventure(.01,{});g.tickAdventure(.01,{'pad:0':{use:true}});assert.equal(p.equipment.hand1,'sword');assert.notEqual(q.equipment.hand1,'sword');
 g.tickAdventure(.01,{});g.tickAdventure(.01,{'pad:1':{panel:true}});assert.equal(q.ui.panel,'gear');assert.equal(p.ui.panel,'pack');
 g.tickAdventure(.01,{});g.tickAdventure(.01,{'pad:0':{close:true}});assert.equal(p.ui,null);assert.ok(q.ui);
});
test('held input repeat and salvage affect only the controller owning that panel',()=>{
 const {g,p,q}=setup();for(const h of [p,q])h.inventory=[{type:'phantom_charm',qty:1}];
 for(let n=0;n<30;n++)g.tickAdventure(.05,{'pad:1':{salvage:true}});
 assert.ok(p.inventory.some(i=>i?.type==='phantom_charm'));assert.ok(!q.inventory.some(i=>i?.type==='phantom_charm'));
 const before=p.ui.index;for(let n=0;n<20;n++)g.tickAdventure(.05,{'pad:1':{next:true}});assert.equal(p.ui.index,before);
});
test('a rebound/duplicate device cannot inherit another open inventory session',()=>{
 const {g,p,q}=setup();q.device=p.device;assert.deepEqual(playerInput(g.players,q,{'pad:0':{use:true}}),{});
 p.device='pad:2';assert.deepEqual(playerInput(g.players,p,{'pad:2':{use:true}}),{});assert.equal(p.ui.ownerDevice,'pad:0');
 g.openInventory(p);assert.equal(playerInput(g.players,p,{'pad:2':{use:true}}).use,true);
});
test('native keyboard activation cannot click a controller-focused inventory button',()=>{
 for(const owner of ['pad:0','pad:1','keyboard',undefined]){
 let blocked=false;guardInventoryKeys({key:'Enter',target:{closest:()=>owner?{dataset:{ownerDevice:owner}}:null},preventDefault(){blocked=true;}});assert.equal(blocked,!!owner&&owner!=='keyboard');
 }
});
test('gear drops work with a full backpack and retain sockets, including two-hand occupancy',()=>{
 for(const action of ['drop','store']){
 const {g,p}=setup();p.inventory=Array.from({length:24},()=>({type:'sword',qty:1}));p.equipment.hand1='moon_blade';p.equipmentSockets={hand1:['azure_bead']};p.ui.panel='gear';p.ui.index=SLOTS.indexOf('hand1');
 g.inventoryAction(p,action);assert.equal(p.equipment.hand1,null);assert.deepEqual(g.loot[0].sockets,['azure_bead']);assert.equal(g.loot[0].type,'moon_blade');assert.equal(p.inventory.length,24);
 p.equipment.hand1='bow';p.equipment.hand2='occupied';p.ui.index=SLOTS.indexOf('hand2');g.inventoryAction(p,action);assert.equal(p.equipment.hand1,null);assert.equal(p.equipment.hand2,null);assert.equal(g.loot[1].type,'bow');
 }
});
test('gear drops are blocked in lobby and rooms and respect protected gear',()=>{
 const {g,p}=setup();p.equipment.hand1='moon_blade';p.ui.panel='gear';p.ui.index=SLOTS.indexOf('hand1');
 g.phase='lobby';g.inventoryAction(p,'drop');g.phase='play';p.room='room';g.inventoryAction(p,'drop');assert.equal(g.loot.length,0);assert.equal(p.equipment.hand1,'moon_blade');
 p.room=null;p.field.favorites=['moon_blade'];g.inventoryAction(p,'drop');assert.equal(g.loot.length,0);
});
