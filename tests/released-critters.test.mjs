import test from 'node:test';import assert from 'node:assert/strict';
import {Game} from '../src/core.mjs';import {ITEMS,count,give,migrateLegacySupplies} from '../src/items.mjs';
import {releaseCritter,catchCritter,updateLivingEcosystem} from '../src/living-ecosystem.mjs';
import {salvageYield} from '../src/salvage.mjs';
const setup=()=>{const g=new Game(()=>.5),p=g.addPlayer('keyboard');g.start();g.openingBoard=false;g.house=null;g.terrain.fill('grass');g.scenery=[];p.x=p.y=800;p.inventory=[{type:'caught_frog',qty:2}];g.openInventory(p);return {g,p};};
test('All previously stackable items stack to 999; instance gear remains individual',()=>{
 for(const id of ['arrow','potion','stick','log','empty_jar','critter_cage','caught_frog','dark_essence'])assert.equal(ITEMS[id].stack,999);
 assert.equal(ITEMS.sword.stack||1,1);const bag=[];assert.ok(give(bag,'arrow',999));assert.equal(bag.length,1);
});
test('Legacy empty travel cages merge into one large stack at the original first slot',()=>{
 const bag=[{type:'potion',qty:2},{type:'empty_cage',qty:3},{type:'critter_cage',qty:4},{type:'stick',qty:5}];
 migrateLegacySupplies(bag);
 assert.deepEqual(bag,[{type:'potion',qty:2},{type:'critter_cage',qty:7},null,{type:'stick',qty:5}]);
 const fresh=[];assert.ok(give(fresh,'critter_cage',17));assert.deepEqual(fresh,[{type:'critter_cage',qty:17}]);
});
test('Released critter returns container and can be caught again',()=>{
 const {g,p}=setup();assert.ok(releaseCritter(g,p,0));assert.equal(count(p,'caught_frog'),1);assert.equal(count(p,'empty_jar'),1);
 p.ui=null;p.equipment.hand1='critter_net';p.faceX=p.faceY=1;updateLivingEcosystem(g,.1);assert.ok(catchCritter(g,p));assert.equal(count(p,'caught_frog'),2);assert.equal(count(p,'empty_jar'),0);
});
test('Captured critter salvage yields Dark Essence and the correct empty container',()=>{
 assert.deepEqual(salvageYield('caught_frog'),[{type:'dark_essence',qty:1},{type:'empty_jar',qty:1}]);assert.deepEqual(salvageYield('caught_bird'),[{type:'dark_essence',qty:1},{type:'critter_cage',qty:1}]);
});
