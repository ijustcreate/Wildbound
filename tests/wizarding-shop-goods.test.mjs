import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/core.mjs';
import {broomFlightSpeed,broomProfileInventory,dismountBroom,useBroom} from '../src/broom-mount.mjs';
import {give,ITEMS,itemStats,socketTrinket,stat} from '../src/items.mjs';
import {alleyGate,ALLEY_SHOPS,interactAlley} from '../src/diagon-alley.mjs';
import {enterWildLands} from '../src/wild-lands.mjs';
import {leaveTrainTest,trainInteraction} from '../src/train-test.mjs';
import {merchantAction,merchantRows} from '../src/traveling-merchant.mjs';
import {FIREBOLT_STOCK,FLOURISH_SPELLBOOK_STOCK} from '../src/wizarding-shop-goods.mjs';

function setup(){
 const g=new Game(()=>.5),p=g.addPlayer('keyboard');
 g.start();g.phase='play';g.openingBoard=false;g.house=null;g.enemies=[];g.scenery=[];g.terrain.fill('grass');
 Object.assign(p,{x:430,y:430,faceX:1,faceY:0,coins:1250});
 p.equipment.hand1='starter_wand';
 return {g,p};
}

test('Firebolt flies slightly faster through normal movement and returns as its own item',()=>{
 const distances={};
 for(const id of ['flying_broom','nimbus_2000','firebolt']){
  const {g,p}=setup();p.inventory=[{type:id,qty:1}];
  g.openInventory(p);assert.ok(useBroom(g,p,0));
  assert.equal(broomFlightSpeed(p),id==='firebolt'?225:210);
  assert.equal(broomProfileInventory(p)[0].type,id);
  const start=p.x;for(let i=0;i<30;i++)g.update(1/60,{keyboard:{x:1}});
  distances[id]=p.x-start;
  assert.ok(dismountBroom(g,p));assert.equal(p.inventory[0].type,id);
 }
 assert.equal(distances.flying_broom,distances.nimbus_2000);
 assert.ok(distances.firebolt>distances.nimbus_2000*1.06&&distances.firebolt<distances.nimbus_2000*1.09);
});

test('Flourish books change live casts and mana reserves only after socketing',()=>{
 const trials=[
  {place:'hand1',id:'alley_battle_charms',key:'spellDamage',boost:5,check:({g,p})=>{
   assert.equal(g.spells.at(-1).damage,ITEMS[p.equipment.hand1].damage+5);
  }},
  {place:'hand1',id:'alley_efficient_casting',key:'manaDiscount',boost:.14,check:({p,manaBefore})=>{
   assert.ok(Math.abs(manaBefore-p.mana-ITEMS[p.equipment.hand1].manaCost*.86)<.01);
  }},
  {place:'hand2',id:'alley_healing_charms',key:'outgoingSpellHealing',boost:.18,check:({g,p})=>{
   assert.ok(Math.abs(g.spells.at(-1).healingAmount-ITEMS[p.equipment.hand1].healingAmount*1.18)<.01);
  }},
 ];
 for(const trial of trials){
  const {g,p}=setup();
  if(trial.place==='hand2'){p.equipment.hand1='healing_wand';p.equipment.hand2='starter_wand';}
  give(p.inventory,trial.id);
  assert.equal(stat(p,trial.key),0);
  assert.ok(socketTrinket(p,{mode:'gear',slot:trial.place},p.inventory.findIndex(v=>v?.type===trial.id)));
  assert.equal(stat(p,trial.key),trial.boost);
  p.mana=p.maxMana;const manaBefore=p.mana;
  assert.ok(g.fireSpell(p,0));
  trial.check({g,p,manaBefore});
 }
 const {g,p}=setup(),cap=p.maxMana;
 give(p.inventory,'alley_mana_runes');
 assert.ok(socketTrinket(p,{mode:'gear',slot:'hand1'},p.inventory.findIndex(v=>v?.type==='alley_mana_runes')));
 assert.equal(p.maxMana,cap+12);
 p.mana=10;g.tickHeroVitals(p,1);
 assert.ok(Math.abs(p.mana-19.2)<.01);
 assert.match(itemStats('alley_efficient_casting'),/14%/);
});

test('the real merchants add all new stock to already opened shops and charge once',()=>{
 const {g,p:original}=setup();
 assert.ok(enterWildLands(g).ok);g.trainTest.preparing=false;
 const p=g.players[0],gate=alleyGate(g);
 Object.assign(p,{x:gate.x,y:gate.y+60});
 assert.ok(trainInteraction(g,p));g.trainTest.time+=1;
 assert.ok(trainInteraction(g,p));
 for(const [id,additions] of [['flourish',FLOURISH_SPELLBOOK_STOCK],['quidditch',[FIREBOLT_STOCK]]]){
  const shop=ALLEY_SHOPS.find(value=>value.id===id);
  const old=shop.stock.filter(([type])=>!additions.some(([added])=>added===type));
  (g.trainTest.alleyMerchants??={})[id]={alleyShop:true,trainTailor:true,revision:0,
   stock:old.map(([type,price])=>({item:{type,qty:1},price}))};
  Object.assign(p,{x:shop.x-105,y:shop.y+12});
  assert.ok(interactAlley(g,p));
  assert.equal(p.ui.alleyShop,id);
  const rows=merchantRows(g,p);
  assert.deepEqual(rows.map(row=>[row.item.type,row.price]),shop.stock);
  p.ui=null;assert.ok(interactAlley(g,p));
  assert.deepEqual(merchantRows(g,p),rows);
  for(const [type,price] of additions){
   const coins=p.coins,row=rows.find(row=>row.item.type===type);
   assert.ok(merchantAction(g,p,'select:'+row.index));assert.ok(merchantAction(g,p,'use'));
   assert.equal(p.coins,coins-price);assert.ok(p.inventory.some(item=>item?.type===type));
  }
  p.ui=null;
 }
 leaveTrainTest(g);
 for(const [type] of [...FLOURISH_SPELLBOOK_STOCK,FIREBOLT_STOCK])assert.ok(original.inventory.some(item=>item?.type===type));
});
