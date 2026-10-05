import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/core.mjs';
import {SLOTS} from '../src/items.mjs';
import {controllerButtonNames} from '../src/controls.mjs';
import {inventoryToolbar} from '../src/inventory-toolbar.mjs';
const setup=()=>{const g=new Game(()=>.5),p=g.addPlayer('pad:0');g.phase='play';p.inventory=Array(24).fill(null);g.openInventory(p);return {g,p};};
const toolbar=(g,p,family='xbox')=>inventoryToolbar(g,p,controllerButtonNames(family));
test('empty slots retain all eight controls with an explanation instead of losing the toolbar',()=>{
 const {g,p}=setup(),empty=toolbar(g,p);assert.equal(empty.options.length,8);assert.ok(empty.options.every(o=>o.reason));
 p.inventory[0]={type:'sword',qty:1};const occupied=toolbar(g,p);assert.deepEqual(occupied.options.map(o=>o.id),empty.options.map(o=>o.id));
 assert.ok(!occupied.options.find(o=>o.id==='use').reason);assert.ok(!occupied.options.find(o=>o.id==='salvage-hold').reason);
});
test('hand 2, split and sockets expose distinct, truthful controller actions',()=>{
 const {g,p}=setup();p.inventory[0]={type:'sword',qty:1};let options=toolbar(g,p).options;
 assert.equal(options.find(o=>o.id==='offhand').key,'Y');assert.equal(options.find(o=>o.id==='sockets-pack').key,'LT+Y');
 assert.ok(options.find(o=>o.id==='split').reason);p.inventory[0].qty=2;options=toolbar(g,p).options;
 assert.ok(options.find(o=>o.id==='offhand').reason);assert.equal(options.find(o=>o.id==='split').reason,'');
 for(const [family,trigger]of [['xbox','RT'],['switch','ZR'],['playstation','R2']])assert.equal(toolbar(g,p,family).options.find(o=>o.id==='salvage-hold').key,trigger);
});
test('place stays available over an empty destination while other actions cannot affect a held item',()=>{
 const {g,p}=setup();p.inventory[0]={type:'sword',qty:1};g.inventoryAction(p,'pick');g.inventoryAction(p,'select:23');
 const options=toolbar(g,p).options;assert.equal(options.find(o=>o.id==='move-item').label,'Place');
 assert.equal(options.find(o=>o.id==='move-item').reason,'');assert.ok(options.filter(o=>o.id!=='move-item').every(o=>o.reason));
});
test('lobby drops, protected items and occupied offhand socket controls are disabled',()=>{
 const {g,p}=setup();p.inventory[0]={type:'sword',qty:1};g.phase='lobby';assert.ok(toolbar(g,p).options.find(o=>o.id==='drop').reason);
 g.phase='play';p.field.favorites=['sword'];assert.ok(toolbar(g,p).options.find(o=>o.id==='drop').reason);
 p.equipment.hand1='bow';p.equipment.hand2='occupied';p.ui.panel='gear';p.ui.index=SLOTS.indexOf('hand2');
 const result=toolbar(g,p);assert.equal(result.item.type,'bow');assert.ok(!result.options.find(o=>o.id==='use').reason);assert.ok(result.options.find(o=>o.id==='sockets-gear').reason);
});
