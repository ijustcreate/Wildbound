import test from 'node:test';import assert from 'node:assert/strict';import {Game} from '../src/core.mjs';import {SLOTS} from '../src/items.mjs';
const setup=()=>{const g=new Game(()=>.5),p=g.addPlayer('keyboard');g.phase='play';p.inventory=[];g.openInventory(p);g.inventoryAction(p,'panel:gear');return {g,p};};
test('Unequip uses selected gear, preserves sockets, and reports success',()=>{const {g,p}=setup();p.equipment.head='hat';p.equipmentSockets={head:['starheart']};p.ui.index=SLOTS.indexOf('head');g.inventoryAction(p,'use');assert.equal(p.equipment.head,null);assert.deepEqual(p.inventory[0].sockets,['starheart']);assert.match(p.ui.notice,/unequipped/);});
test('Full backpacks report the reason without losing equipped items',()=>{const {g,p}=setup();p.equipment.head='hat';p.inventory=Array.from({length:24},()=>({type:'sword',qty:1}));g.inventoryAction(p,'use');assert.equal(p.equipment.head,'hat');assert.equal(g.loot.length,0);assert.match(p.ui.notice,/Backpack full/);p.inventory[7]=null;g.inventoryAction(p,'use');assert.equal(p.equipment.head,null);assert.equal(p.inventory[7].type,'hat');});
test('Both occupied hands can unequip a two-handed weapon exactly once',()=>{for(const action of ['use','drop','store']){const {g,p}=setup();p.equipment.hand1='bow';p.equipment.hand2='occupied';p.equipmentSockets={hand1:['starheart']};p.ui.index=SLOTS.indexOf('hand2');g.inventoryAction(p,action);assert.equal(p.equipment.hand1,null);assert.equal(p.equipment.hand2,null);const items=action==='use'?p.inventory:g.loot;assert.equal(items.length,1);assert.equal(items[0].type,'bow');assert.deepEqual(items[0].sockets,['starheart']);g.inventoryAction(p,action);assert.equal(items.length,1);}});
test('Equipped drops work with full bags but are blocked in the lobby',()=>{const {g,p}=setup();p.inventory=Array.from({length:24},()=>({type:'sword',qty:1}));p.equipment.head='hat';g.phase='lobby';g.inventoryAction(p,'drop');assert.equal(p.equipment.head,'hat');assert.equal(g.loot.length,0);g.phase='play';g.inventoryAction(p,'drop');assert.equal(p.equipment.head,null);assert.equal(g.loot[0].manualPickup,true);assert.equal(p.inventory.length,24);});
test('Primary and Equip actions return selected gear to the first free inventory slot in lobby and expedition',()=>{
 for(const phase of ['lobby','play'])for(const action of ['use','equip'])for(const slot of ['head','hand1','hand2']){
  const {g,p}=setup();g.phase=phase;p.device='pad:0';p.ui.ownerDevice=p.device;
  p.equipment={head:'hat',hand1:'bow',hand2:'occupied'};p.equipmentSockets={hand1:['azure_bead']};
  p.inventory=Array.from({length:24},()=>({type:'hat',qty:1}));p.inventory[9]=null;p.ui.index=SLOTS.indexOf(slot);
  g.inventoryAction(p,action);assert.equal(p.equipment[slot],null);assert.equal(p.inventory[9].type,slot==='head'?'hat':'bow');
  if(slot!=='head'){assert.equal(p.equipment.hand1,null);assert.equal(p.equipment.hand2,null);assert.deepEqual(p.inventory[9].sockets,['azure_bead']);}
  assert.equal(g.loot.length,0);assert.match(p.ui.notice,/unequipped/);
 }
});
