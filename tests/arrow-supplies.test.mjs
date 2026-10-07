import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/core.mjs';
import {give,count,splitStack,transfer,ITEMS,migrateEquipment} from '../src/items.mjs';
import {craft} from '../src/field-systems.mjs';
import {arrowDrop,compactArrowDrops,enemyQuiver,retrieveEnemyArrows,loadQuiver,quiverType,frostImpact,tickArrowIce} from '../src/arrow-supplies.mjs';
import {dropIceRecipe,learnIceRecipe,tickMeltingIce} from '../src/ice-crafting.mjs';
import {saveSession,restoreSession} from '../src/session.mjs';
import {embeddedArrowGeometry} from '../src/embedded-arrow.mjs';
import {harvest} from '../src/environment.mjs';

function setup(){const g=new Game(()=>.5),p=g.addPlayer('keyboard');g.start();g.openingBoard=false;g.house=null;g.enemies=[];g.scenery=[];g.terrain.fill('grass');p.inventory=[];p.x=400;p.y=400;return {g,p};}
test('All recovered arrows share one stack without drifting their contact point',()=>{
 const {g}=setup();for(let i=0;i<12;i++)arrowDrop(g,{x:450+i*.4,y:400,angle:.8});
 assert.equal(g.loot.length,1);assert.equal(g.loot[0].qty,12);assert.equal(g.loot[0].x,450);assert.equal(g.loot[0].angle,.8);
 arrowDrop(g,{x:453,y:400,ammoType:'ice_arrow'});assert.equal(g.loot[0].qty,13);arrowDrop(g,{x:451,y:400,z:18,surfaceEmbedded:true});assert.equal(g.loot.length,2);
});
test('Old saved arrow fields consolidate at their existing anchors',()=>{
 const {g}=setup();g.loot=Array.from({length:12},(_,id)=>({id,x:450+id*.4,y:400,qty:1,type:'arrow',embedded:true,angle:.5}));
 compactArrowDrops(g);assert.equal(g.loot.length,1);assert.equal(g.loot[0].qty,12);assert.equal(g.loot[0].id,0);assert.equal(g.loot[0].x,450);
});
test('An archer stops at zero and resumes after retrieving ammunition',()=>{
 const {g,p}=setup();p.x=400;p.y=400;g.nightCycle={phase:'day',elapsed:0};
 const e={id:900,kind:'archer',x:580,y:400,hp:100,maxHp:100,speed:80,damage:1,state:'hunt',cooldown:0,flash:0,tacticTime:1,faceX:-1,faceY:0,aggro:true,startingArrows:36,arrowsLeft:1};g.enemies=[e];
 g.update(.05,{});assert.equal(e.arrowsLeft,0);assert.equal(g.arrows.filter(a=>a.hostile).length,1);
 g.arrows=[];g.loot=[];e.cooldown=0;g.update(.05,{});assert.equal(g.arrows.length,0);
 arrowDrop(g,{x:e.x+5,y:e.y,ammoType:'ice_arrow'},36);g.update(.05,{});assert.equal(e.arrowsLeft,36);assert.ok(!e.iceArrowsLeft);
 e.cooldown=0;g.update(.05,{});assert.equal(e.arrowsLeft,35);assert.equal(g.arrows[0].ammoType,'arrow');
});
test('Enemy quivers start generously and retrieve below half, up to starting capacity',()=>{
 const {g}=setup(),e={x:400,y:400};assert.equal(enemyQuiver(e),36);
 arrowDrop(g,{x:410,y:400},30);e.arrowsLeft=18;assert.equal(retrieveEnemyArrows(g,e,.05),false);
 e.arrowsLeft=17;assert.equal(retrieveEnemyArrows(g,e,.05),true);assert.equal(e.arrowsLeft,36);assert.equal(g.loot[0].qty,11);
 assert.equal(retrieveEnemyArrows(g,e,.05),false);
});
test('Low-ammo enemies move toward recoverable arrows',()=>{
 const {g}=setup(),e={id:77,kind:'archer',x:400,y:400,speed:80,arrowsLeft:3,startingArrows:36,state:'hunt',hp:80};
 arrowDrop(g,{x:490,y:400},10);assert.ok(retrieveEnemyArrows(g,e,.05));assert.ok(e.x>400);assert.ok(e.retrievingArrows);
});
test('Enemy death drops exactly the remaining quiver, not an endless fixed reward',()=>{
 const {g}=setup();g.enemyLoot({kind:'archer',x:450,y:400,arrowsLeft:7,startingArrows:36,id:88});
 assert.equal(g.loot.filter(l=>l.type==='arrow').reduce((n,l)=>n+l.qty,0),7);
});
test('Bows automatically use ordinary arrows regardless of an obsolete saved selection',()=>{
 const {g,p}=setup();p.equipment.hand1='bow';give(p.inventory,'arrow',4);give(p.inventory,'ice_arrow',2);
 p.field.quiver='ice_arrow';assert.equal(loadQuiver(p,'ice_arrow'),false);assert.ok(g.fireArrow(p,.3));assert.equal(g.arrows[0].ammoType,'arrow');assert.equal(count(p,'arrow'),5);
 const restored=restoreSession(JSON.parse(JSON.stringify(saveSession(g))));assert.equal(quiverType(restored.players[0]),'arrow');assert.ok(!('quiver' in restored.players[0].field));
 g.openInventory(p);g.inventoryAction(p,'panel:quiver');assert.equal(p.ui.panel,'pack');g.inventoryAction(p,'panel');assert.equal(p.ui.panel,'gear');g.inventoryAction(p,'panel');assert.equal(p.ui.panel,'pack');
 for(let i=0;i<5;i++)assert.ok(g.fireArrow(p,.3));assert.equal(g.fireArrow(p,.3),false);
});
test('Removed arrow variants and ice recipes are absent from loot/catalog/crafting',()=>{
 const {g,p}=setup();g.generatedEnvironment='ice';g.random=()=>0;
 for(const id of ['ice_arrow','starter_arrow','ice_arrow_recipe'])assert.equal(ITEMS[id],undefined);
 assert.equal(dropIceRecipe(g,p,400,400),false);assert.equal(learnIceRecipe(p),false);assert.equal(craft(p,'ice_arrow'),'Unknown recipe.');
});
test('Legacy arrows/recipes migrate in all storage while unrelated slots and world anchors survive',()=>{
 const {g,p}=setup();p.inventory=[{type:'arrow',qty:12},{type:'ice_arrow',qty:7},{type:'sword',qty:1,sockets:['azure_bead']},{type:'starter_arrow',qty:8},{type:'ice_arrow_recipe',qty:1}];
 p.chests[0]=[{type:'ice_arrow',qty:15}];p.starterChest=[{type:'starter_arrow',qty:8}];p.robotStock=[{type:'ice_arrow',qty:5,price:12}];p.field.overflow=[{type:'ice_arrow_recipe',qty:1}];p.field.recipes={ice_arrow:true,other:true};p.field.quiver='ice_arrow';
 p.chests[1]=[{type:'crafting_bag',qty:1,contents:[{type:'starter_arrow',qty:8}]}];
 g.sharedStash=[{type:'ice_arrow',qty:21}];g.loot=[{type:'ice_arrow',qty:2,x:10,y:10},{type:'starter_arrow',qty:3,x:900,y:900}];g.arrows=[{ammoType:'ice_arrow',x:4,y:4}];g.arrowIcePatches=[{life:9}];
 const restored=restoreSession(JSON.parse(JSON.stringify(saveSession(g)))),q=restored.players[0];assert.equal(count(q,'arrow'),47);assert.deepEqual(q.inventory[2].sockets,['azure_bead']);
 for(const list of [q.chests[0],q.chests[1][0].contents,q.starterChest,q.robotStock,q.field.overflow,restored.sharedStash,restored.loot])assert.ok(list.every(i=>i.type==='arrow'));
 assert.equal(q.field.overflow[0].qty,20);assert.equal(q.robotStock[0].price,12);assert.deepEqual(q.field.recipes,{other:true});assert.ok(!('quiver' in q.field));assert.equal(restored.arrows[0].ammoType,'arrow');assert.deepEqual(restored.arrowIcePatches,[]);assert.equal(restored.loot.length,2);assert.equal(restored.loot[1].x,900);
 const before=JSON.stringify(q);migrateEquipment(q);assert.equal(JSON.stringify(q),before);
});
test('Raw ice timer pauses in ice and survives splits/transfers/saves; ordinary arrows never melt',()=>{
 const {g,p}=setup();give(p.inventory,'raw_ice',6);give(p.inventory,'ice_arrow',20);
 g.generatedEnvironment='ice';tickMeltingIce(g,1000);assert.equal(p.inventory[0].meltRemaining,300);
 g.generatedEnvironment='forest';tickMeltingIce(g,200);splitStack(p.inventory,0,3);assert.equal(p.inventory[2].meltRemaining,100);
 transfer(p.inventory,p.chests[0],2);assert.equal(p.chests[0][0].meltRemaining,100);
 const restored=restoreSession(JSON.parse(JSON.stringify(saveSession(g))));tickMeltingIce(restored,99);assert.equal(count(restored.players[0],'raw_ice'),3);tickMeltingIce(restored,1);
 assert.equal(count(restored.players[0],'raw_ice'),0);assert.equal(restored.players[0].chests[0].filter(Boolean).length,0);assert.equal(count(restored.players[0],'arrow'),20);
});
test('Breaking ice produces raw ice, not stone',()=>{
 const {g,p}=setup();g.generatedEnvironment='ice';p.faceX=1;p.faceY=0;
 g.scenery=[{x:450,y:402,kind:'ice_spire',size:64,procedural:true}];assert.ok(harvest(g,p,40,90));
 assert.ok(g.loot.some(l=>l.type==='raw_ice'));assert.equal(g.loot.some(l=>l.type==='stone'),false);
});
test('Legacy elemental arrows no longer freeze enemies or create frost patches',()=>{
 const {g}=setup(),a={x:440,y:400,ammoType:'ice_arrow'},e={x:440,y:400,hp:10};
 frostImpact(g,a,e);assert.ok(!e.frozen);frostImpact(g,a);assert.equal(g.arrowIcePatches.length,0);
 g.enemies=[e];tickArrowIce(g,1);assert.ok(!e.frozen);assert.equal(g.arrowIcePatches.length,0);
});
test('Rock impacts break arrows; tree impacts lodge without growing their shaft',()=>{
 for(const kind of ['rock','tree']){
  const {g}=setup(),prop={x:500,y:400,size:64,procedural:true,kind};g.scenery=[prop];
  const y=400+64*(kind==='rock'?.19:.35)-14;
  const a={x:470,y,vx:300,vy:0,vz:0,z:18,gravity:0,shaftLength:24,embedDepth:5,damage:1};g.arrows=[a];
  for(let i=0;i<15&&g.arrows.length;i++)g.tickAdventure(.02,{});
  if(kind==='rock'){assert.equal(g.loot.filter(l=>l.type==='arrow').length,0);assert.ok(g.effects.some(e=>e.text==='Splinter'));}
  else {const drop=g.loot.find(l=>l.type==='arrow');assert.ok(drop?.surfaceEmbedded);assert.equal(drop.angle,0);assert.equal(drop.shaftLength,24);assert.ok(embeddedArrowGeometry(drop).length<=24);}
 }
});
