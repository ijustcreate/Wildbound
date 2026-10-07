import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/core.mjs';
import {give,count,transfer,splitStack} from '../src/items.mjs';
import {initLivingEcosystem,livingAnimals,updateLivingEcosystem,catchCritter,releaseCritter} from '../src/living-ecosystem.mjs';
import {coastalHabitat} from '../src/coastal-critters.mjs';
import {waterAt} from '../src/environment.mjs';
import {saveSession,restoreSession} from '../src/session.mjs';
import {salvageYield,tickSalvage} from '../src/salvage.mjs';
import {beachWorld,BEACH_SCENERY_LIMIT} from '../src/beach-world.mjs';

function setup(){const g=new Game(()=>.5);g.environment='beach';const p=g.addPlayer('keyboard');g.start();g.openingBoard=false;g.enemies=[];p.inventory=[];p.equipment={hand1:'critter_net'};return {g,p};}
function beside(g,p,kind){const a=livingAnimals(g).find(a=>a.kind===kind);assert.ok(a,kind);Object.assign(p,{x:a.x,y:a.y,faceX:1,faceY:0});return a;}
test('Beach has ten shoreline crabs and eight deep-water fish, deterministic and capped',()=>{
 const {g}=setup(),animals=livingAnimals(g);assert.equal(animals.filter(a=>a.kind==='crab').length,10);assert.equal(animals.filter(a=>a.kind==='fish').length,8);
 for(const a of animals){assert.ok(coastalHabitat(g,a.kind,a.x,a.y));assert.equal(waterAt(g,a.x,a.y)==='water',a.kind==='fish');}
 initLivingEcosystem(g);assert.deepEqual(livingAnimals(g),animals);assert.equal(g.enemies.length,0);
});
test('Coastal movement remains in each habitat and has no combat damage',()=>{
 const {g,p}=setup(),before=livingAnimals(g);p.x=800;p.y=800;const hp=p.hp;
 for(let i=0;i<200;i++)updateLivingEcosystem(g,.05);
 const after=livingAnimals(g);assert.equal(p.hp,hp);assert.ok(after.some((a,i)=>a.x!==before[i].x));for(const a of after)assert.ok(coastalHabitat(g,a.kind,a.x,a.y),a.kind);
});
test('Net in either hand accepts bottles and cages for crabs/fish and records actual container',()=>{
 for(const kind of ['crab','fish'])for(const container of ['empty_jar','critter_cage'])for(const hand of ['hand1','hand2']){
  const {g,p}=setup();p.equipment={[hand]:'critter_net'};const a=beside(g,p,kind);give(p.inventory,container);assert.ok(g.attack(p));
  assert.equal(count(p,container),0);assert.equal(count(p,'caught_'+kind),1);assert.equal(p.inventory.find(i=>i?.type==='caught_'+kind).captureContainer,container);assert.ok(!livingAnimals(g).some(b=>b.id===a.id));
 }
});
test('Catch failures never consume containers or remove critters',()=>{
 const {g,p}=setup(),a=beside(g,p,'crab');p.inventory=[{type:'caught_bird',qty:1}];assert.ok(catchCritter(g,p));assert.ok(livingAnimals(g).some(b=>b.id===a.id));assert.equal(count(p,'caught_bird'),1);
 p.inventory=[{type:'critter_cage',qty:2},...Array.from({length:23},()=>({type:'hat',qty:1}))];const before=JSON.stringify(p.inventory);catchCritter(g,p);assert.equal(JSON.stringify(p.inventory),before);assert.ok(livingAnimals(g).some(b=>b.id===a.id));
});
test('Last empty container supplies its own freed slot in a full backpack',()=>{
 const {g,p}=setup();beside(g,p,'crab');p.inventory=[{type:'critter_cage',qty:1},...Array.from({length:23},()=>({type:'hat',qty:1}))];catchCritter(g,p);assert.equal(count(p,'caught_crab'),1);assert.equal(p.inventory.filter(Boolean).length,24);
});
test('Net recognizes historical bottle IDs and accessible bag contents',()=>{
 const {g,p}=setup();beside(g,p,'fish');p.inventory=[{type:'empty_bottle',qty:1}];catchCritter(g,p);assert.equal(count(p,'caught_fish'),1);
 beside(g,p,'crab');p.inventory=[{type:'crafting_bag',qty:1,contents:[{type:'critter_cage',qty:1}]}];catchCritter(g,p);assert.equal(count(p,'caught_crab'),1);assert.equal(p.inventory[0].contents.filter(Boolean).length,0);
});
test('Captured wildlife preserves container identity through split storage stacks and save/restore',()=>{
 const {g,p}=setup();give(p.inventory,'caught_crab',2,24,{captureContainer:'empty_jar'});give(p.inventory,'caught_crab',3,24,{captureContainer:'critter_cage'});assert.equal(p.inventory.length,2);
 assert.ok(transfer(p.inventory,p.chests[0],0));assert.equal(p.chests[0][0].captureContainer,'empty_jar');
 const r=restoreSession(JSON.parse(JSON.stringify(saveSession(g))));assert.equal(r.players[0].chests[0][0].captureContainer,'empty_jar');assert.equal(r.players[0].inventory.find(Boolean).captureContainer,'critter_cage');
 assert.deepEqual(salvageYield('caught_crab',{captureContainer:'empty_jar'}),[{type:'dark_essence',qty:1},{type:'empty_jar',qty:1}]);assert.deepEqual(salvageYield('caught_fish',{captureContainer:'critter_cage'}),[{type:'dark_essence',qty:1},{type:'critter_cage',qty:1}]);
 assert.ok(splitStack(p.inventory,1,1));assert.equal(p.inventory.find(i=>i?.qty===1)?.captureContainer,'critter_cage');
 p.inventory=[{type:'caught_crab',qty:1,captureContainer:'empty_jar'}];g.openInventory(p);for(let n=0;n<13;n++)tickSalvage(g,p,true,.1);
 assert.equal(count(p,'caught_crab'),0);assert.ok(g.loot.some(i=>i.type==='empty_jar'));assert.ok(!g.loot.some(i=>i.type==='critter_cage'));
});
test('Release returns selected stack’s actual container; a fish cannot be released onto land',()=>{
 const {g,p}=setup();beside(g,p,'fish');give(p.inventory,'caught_fish',1,24,{captureContainer:'critter_cage'});g.openInventory(p);releaseCritter(g,p,0);assert.equal(count(p,'critter_cage'),1);assert.equal(count(p,'caught_fish'),0);
 p.x=800;p.y=800;p.inventory=[{type:'caught_fish',qty:1,captureContainer:'empty_jar'}];const before=JSON.stringify(p.inventory);releaseCritter(g,p,0);assert.equal(JSON.stringify(p.inventory),before);assert.match(p.ui.notice,/deep water/);
 p.inventory=[];give(p.inventory,'caught_crab',2,24,{captureContainer:'empty_jar'});give(p.inventory,'caught_crab',2,24,{captureContainer:'critter_cage'});releaseCritter(g,p,0);assert.equal(p.inventory[0].qty,1);assert.equal(p.inventory[1].qty,2);assert.equal(count(p,'empty_jar'),1);assert.equal(count(p,'critter_cage'),0);
});
test('Caught beach critters remain caught after restoring the same expedition',()=>{
 const {g,p}=setup(),a=beside(g,p,'crab');give(p.inventory,'empty_jar');catchCritter(g,p);const r=restoreSession(JSON.parse(JSON.stringify(saveSession(g))));assert.ok(!livingAnimals(r).some(b=>b.id===a.id));assert.equal(livingAnimals(r).length,17);assert.equal(count(r.players[0],'caught_crab'),1);
});
test('Beach has more cliffs/rocks without replacing clear pier/arch/board approaches',()=>{
 const {g}=setup();assert.ok(g.scenery.filter(p=>p.kind==='rock').length>=29);assert.equal(g.scenery.filter(p=>p.beachCliff).length,12);assert.ok(g.scenery.length<=BEACH_SCENERY_LIMIT);
 for(const [x,y] of [[448,400],[1296,500],[800,688],[800,912],[656,800],[944,800]])assert.equal(g.blocked(x,y,10,false,false,false,0),false,x+','+y);
 assert.deepEqual(beachWorld(123),beachWorld(123));
});
