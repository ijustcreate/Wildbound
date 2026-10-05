import test from 'node:test';import assert from 'node:assert/strict';
import {Game} from '../src/core.mjs';
import {ITEMS,give,sellStack,sellValue} from '../src/items.mjs';
import {salvageYield,tickSalvage,salvageProgress} from '../src/salvage.mjs';
import {cleanInput} from '../src/rooms.mjs';
import {category} from '../src/field-systems.mjs';
import {playerAction,playerPose,defaultPlayerMotion,upgradePlayerMotion} from '../src/player-motion.mjs';
const setup=(type='sword')=>{const g=new Game(()=>.5),p=g.addPlayer('keyboard');g.start();g.openingBoard=false;g.loot=[];p.inventory=[{type,qty:1}];p.x=600;p.y=600;g.openInventory(p);return {g,p};};
const hold=(g,p,n=26)=>{for(let i=0;i<n;i++)tickSalvage(g,p,true,.05);};
test('salvage yields common dust, magic essence, and separate legendary essence',()=>{
 assert.deepEqual(salvageYield('sword'),[{type:'relic_dust',qty:1}]);
 assert.ok(salvageYield('wand').some(d=>d.type==='magic_essence'));
 assert.ok(salvageYield('moon_blade').some(d=>d.type==='magic_essence'));
 const legendary=Object.keys(ITEMS).find(id=>ITEMS[id].slot&&ITEMS[id].rarity==='legendary');
 assert.deepEqual(salvageYield(legendary),[{type:'relic_dust',qty:8},{type:'legendary_essence',qty:1}]);
 for(const id of ['relic_dust','magic_essence','legendary_essence','arrow','potion','starheart','friendship_wand'])assert.deepEqual(salvageYield(id),[]);
});
test('release cancels progress and completed hold cannot salvage the next item',()=>{
 const {g,p}=setup();p.inventory.push({type:'sword',qty:1});hold(g,p,10);assert.ok(salvageProgress(p)>.3);tickSalvage(g,p,false,.05);assert.equal(salvageProgress(p),0);assert.equal(g.loot.length,0);
 hold(g,p);assert.equal(p.inventory[0],null);assert.equal(g.loot.length,1);p.ui.index=1;hold(g,p,50);assert.equal(p.inventory[1].type,'sword');
 tickSalvage(g,p,false,.05);hold(g,p);assert.equal(g.loot.length,2);
});
test('selection changes, other actions and locked gear cannot accidentally salvage',()=>{
 const {g,p}=setup();p.inventory.push({type:'wand',qty:1});hold(g,p,20);p.ui.index=1;hold(g,p);assert.equal(g.loot.length,0);
 tickSalvage(g,p,false,.05);hold(g,p,20);g.inventoryAction(p,'prev');hold(g,p);assert.equal(g.loot.length,0);
 tickSalvage(g,p,false,.05);p.field.favorites=['sword'];p.ui.index=0;hold(g,p);assert.equal(g.loot.length,0);
});
test('socketed trinkets drop intact and materials require manual pickup',()=>{
 const {g,p}=setup('moon_blade');p.inventory[0].sockets=['starheart'];hold(g,p);
 assert.deepEqual(g.loot.map(l=>l.type),['relic_dust','magic_essence','starheart']);assert.ok(g.loot.every(l=>l.manualPickup&&l.salvageBorn===g.time));
 for(const loot of [...g.loot])assert.ok(g.collect(p,loot));assert.equal(g.loot.length,0);assert.ok(p.inventory.some(i=>i?.type==='starheart'));
});
test('materials merge to 999, overflow to another stack and sell by quantity',()=>{
 for(const type of ['relic_dust','magic_essence','legendary_essence']){
  const {p}=setup();p.inventory=[];assert.equal(ITEMS[type].stack,999);assert.equal(category(type),'Materials');
  give(p.inventory,type,998);give(p.inventory,type,5);assert.deepEqual(p.inventory.map(i=>i.qty),[999,4]);
  const before=p.coins;sellStack(p,0);assert.equal(p.coins-before,999*sellValue(type));
 }
});
test('dead, stunned, equipped and private-room selections are protected',()=>{
 for(const state of [{hp:0},{stun:1},{room:'storage'},{ui:{panel:'gear',index:8}},{ui:{panel:'pack',index:0,socket:{}}}]){
  const {g,p}=setup();Object.assign(p,state);hold(g,p);assert.equal(g.loot.length,0);assert.equal(p.inventory[0].type,'sword');
 }
});
test('network-safe input and adventure update drive a complete hold',()=>{
 assert.equal(cleanInput({salvage:true}).salvage,true);const {g,p}=setup();
 for(let i=0;i<28;i++)g.tickAdventure(.05,{keyboard:{salvage:true}});
 assert.equal(g.loot.length,1);assert.ok(!p.inventory[0]);
});
test('salvage animates the hands, completes with a short release and upgrades older rigs',()=>{
 const {g,p}=setup();const m=defaultPlayerMotion(),before=playerPose(p,0,m);hold(g,p,12);assert.equal(playerAction(p),'salvage');assert.notDeepEqual(playerPose(p,0,m).handR,before.handR);
 tickSalvage(g,p,false,.05);assert.notEqual(playerAction(p),'salvage');hold(g,p);assert.equal(playerAction(p),'salvage');assert.equal(p.salvageFinish,.3);
 for(let i=0;i<8;i++)g.tickAdventure(.05,{keyboard:{}});assert.notEqual(playerAction(p),'salvage');
 delete m.clips.salvage;assert.ok(upgradePlayerMotion(m).clips.salvage);
});
test('lobby salvage returns materials and sockets directly, and full backpacks fail atomically',()=>{
 const {g,p}=setup('moon_blade');g.phase='lobby';p.inventory[0].sockets=['azure_bead'];hold(g,p);
 assert.equal(g.loot.length,0);assert.ok(p.inventory.some(i=>i?.type==='relic_dust'));assert.ok(p.inventory.some(i=>i?.type==='magic_essence'));assert.ok(p.inventory.some(i=>i?.type==='azure_bead'));
 const second=setup('moon_blade');second.g.phase='lobby';second.p.inventory=Array.from({length:24},()=>({type:'sword',qty:1}));second.p.inventory[0]={type:'moon_blade',qty:1,sockets:['starheart']};const before=structuredClone(second.p.inventory);
 hold(second.g,second.p);assert.deepEqual(second.p.inventory,before);assert.equal(second.g.loot.length,0);assert.match(second.p.ui.notice,/space|full/i);
});
