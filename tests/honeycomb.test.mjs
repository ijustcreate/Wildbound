import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,EVENTS} from '../src/core.mjs';
import {ITEMS,count,give} from '../src/items.mjs';
import {HONEYCOMB_HEAL,dropHiveHoney,useHoneycomb} from '../src/honeycomb.mjs';
import {inventoryToolbar} from '../src/inventory-toolbar.mjs';
function field(){const g=new Game(()=>.5);g.phase='play';g.openingBoard=false;g.terrain.fill('grass');g.scenery=[];g.house=null;g.enemies=[];const p=g.addPlayer('keyboard');Object.assign(p,{x:800,y:900,hp:30,maxHp:100});return {g,p};}
test('destroying a real hive drops three consumable combs once, not every death frame',()=>{
  const {g}=field();g.spawnEvent(EVENTS.findIndex(e=>e.kind==='bee'));const hive=g.enemies.find(e=>e.kind==='bee_hive');
  assert.equal(dropHiveHoney(g,hive),false);hive.hp=0;g.update(.05,{});
  const comb=g.loot.filter(i=>i.type==='honeycomb');assert.equal(comb.length,1);assert.equal(comb[0].qty,3);assert.equal(comb[0].manualPickup,true);
  g.update(.05,{});assert.equal(g.loot.filter(i=>i.type==='honeycomb').length,1);
  assert.equal(dropHiveHoney(g,JSON.parse(JSON.stringify(hive))),false);
});
test('honeycomb works through the actual inventory button, shows effective green healing and preserves stack',()=>{
  const {g,p}=field();give(p.inventory,'honeycomb',3);g.openInventory(p);p.ui.panel='pack';p.ui.index=p.inventory.findIndex(i=>i?.type==='honeycomb');
  assert.equal(inventoryToolbar(g,p,[]).options[0].reason,'');g.inventoryAction(p,'equip');
  assert.equal(p.hp,30+HONEYCOMB_HEAL);assert.equal(count(p,'honeycomb'),2);assert.equal(g.effects.at(-1).text,'+25');assert.equal(g.effects.at(-1).color,'#7ee89b');
  p.hp=96;assert.equal(useHoneycomb(g,p),true);assert.equal(p.hp,100);assert.equal(g.effects.at(-1).text,'+4');assert.equal(count(p,'honeycomb'),1);
});
test('full-health or dead heroes do not waste honeycomb; room consumption has room-local feedback',()=>{
  const {g,p}=field();give(p.inventory,'honeycomb',2);p.hp=p.maxHp;assert.equal(useHoneycomb(g,p),false);p.hp=0;assert.equal(useHoneycomb(g,p),false);assert.equal(count(p,'honeycomb'),2);
  p.hp=80;p.room='test-room';p.roomX=80;p.roomY=120;assert.equal(useHoneycomb(g,p),true);assert.equal(g.effects.at(-1).room,'test-room');assert.equal(g.effects.at(-1).x,80);assert.equal(g.effects.at(-1).y,90);
  assert.match(ITEMS.honeycomb.description,/25 health/);assert.ok(ITEMS.honeycomb.stack>1);
});
