import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/core.mjs';
import {controllerButtonNames} from '../src/controls.mjs';

test('One backpack reaches all 24 stable slots and ignores old categories',()=>{
 const g=new Game(()=>.5),p=g.addPlayer('pad:0');g.phase='play';g.openInventory(p);
 p.inventory=[{type:'sword',qty:1},{type:'stone',qty:1},{type:'potion',qty:1}];
 p.ui.tab='crafting';p.ui.index=0;
 const seen=new Set();for(let i=0;i<24;i++){seen.add(p.ui.index);g.inventoryAction(p,'next');}
 assert.equal(seen.size,24);assert.equal(p.ui.index,0);assert.equal(p.ui.tab,undefined);
 g.inventoryAction(p,'down');assert.equal(p.ui.index,6);
 g.inventoryAction(p,'up');assert.equal(p.ui.index,0);
 g.inventoryAction(p,'up');assert.equal(p.ui.panel,'gear');
 g.inventoryAction(p,'down');assert.equal(p.ui.panel,'pack');
 g.inventoryAction(p,'use');assert.equal(p.equipment.hand1,'sword');
 assert.equal(p.inventory[1].type,'stone');assert.equal(p.inventory[2].type,'potion');
});

test('Each controller family labels the same accept/back positions correctly',()=>{
 for(const [family,accept,back,trigger] of [['xbox','A','B','RT'],['switch','B','A','ZR'],['playstation','Cross','Circle','R2']]){
 const names=controllerButtonNames(family);assert.equal(names[0],accept);assert.equal(names[1],back);assert.equal(names[7],trigger);
 }
});

test('Controller primary press opens nearby supplies once without charging an attack',()=>{
 const g=new Game(()=>.5),p=g.addPlayer('pad:0');g.start();g.openingBoard=false;
 g.enemies=[];g.loot=[];g.supplyChests=[{id:'test',x:p.x+25,y:p.y,opened:false,potions:1,name:'Supplies'}];
 g.update(.016,{'pad:0':{attack:true}});
 assert.equal(g.supplyChests[0].opened,true);assert.equal(p.charge,0);
 const drops=g.loot.length;g.update(.016,{'pad:0':{attack:true}});assert.equal(g.loot.length,drops);assert.equal(p.charge,0);
 g.update(.016,{'pad:0':{attack:false}});assert.equal(p.charge,0);
});
