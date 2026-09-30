import test from 'node:test';
import assert from 'node:assert/strict';
import { give, transfer, freshCharacter } from '../src/items.mjs';
import { inventoryCategory, tabIndices, storeInBag, takeFromBag } from '../src/inventory-containers.mjs';

test('Tabs partition occupied slots and preserve their saved indices', () => {
  const list = [{type:'sword',qty:1}, null, {type:'potion',qty:2}, {type:'relic_dust',qty:8}];
  assert.equal(inventoryCategory('sword'), 'gear');
  assert.equal(inventoryCategory('relic_dust'), 'crafting');
  assert.equal(inventoryCategory('charm'), 'relics');
  assert.equal(inventoryCategory('armor_bag'), 'other');
  assert.ok(tabIndices(list, 'other').includes(2));
  assert.ok(!tabIndices(list, 'gear').includes(2));
  assert.ok(tabIndices(list, 'gear').includes(1));
});

test('Bags reject incompatible items, preserve sockets and survive chest/save transfers', () => {
  const list = [], chest = [];
  give(list, 'armor_bag'); give(list, 'armor', 1, 24, {sockets:['azure_bead']}); give(list, 'sword');
  const bag = list[0];
  assert.equal(storeInBag(list, bag, 2), false);
  assert.equal(storeInBag(list, bag, 1), true);
  assert.equal(storeInBag(list, bag, 0), false);
  assert.ok(transfer(list, chest, 0));
  const restored = JSON.parse(JSON.stringify(chest));
  assert.deepEqual(restored[0].contents[0].sockets, ['azure_bead']);
  assert.ok(takeFromBag(restored[0], 0, list));
  assert.deepEqual(list.find(i => i?.type === 'armor').sockets, ['azure_bead']);
  assert.equal(restored[0].contents.length, 0);
});

test('Crafting pouch has exactly one slot; failed moves are atomic', () => {
  const list=[]; give(list,'crafting_bag'); give(list,'relic_dust',10); give(list,'magic_essence',2);
  const bag=list[0]; assert.ok(storeInBag(list,bag,1));
  const before=structuredClone(list); assert.equal(storeInBag(list,bag,2),false); assert.deepEqual(list,before);
  const full=Array.from({length:24},()=>({type:'sword',qty:1}));
  assert.equal(takeFromBag(bag,0,full),false); assert.equal(bag.contents[0].qty,10);
});

test('All tabs share a finite backpack capacity', () => {
  const p=freshCharacter(1,'Tester');
  p.inventory=Array.from({length:24},()=>({type:'sword',qty:1}));
  assert.equal(give(p.inventory,'potion'),false);
  assert.deepEqual(tabIndices(p.inventory,'other'),[]);
});
