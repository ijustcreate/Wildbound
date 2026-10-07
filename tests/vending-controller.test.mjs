import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/core.mjs';
import {count} from '../src/items.mjs';
import {HeroUI} from '../src/hero-ui.mjs';
import {Profiles} from '../src/profiles.mjs';
import {saveSession,restoreSession} from '../src/session.mjs';

function setup(device='pad:0') {
  const g=new Game(()=>.37),p=g.addPlayer(device);
  g.start();g.openingBoard=false;g.scenery=[];g.terrain.fill('grass');
  p.x=p.y=400;g.portal(p);const door=g.portals.find(d=>d.owner===p.id);p.x=door.x;p.y=door.y;g.enterRoom(p,door);
  p.inventory=[];p.coins=200;g.openShop(p,'vending');
  let saves=0;g.onPersist=()=>saves++;
  const step=input=>g.update(.05,{[p.device]:input});
  const press=input=>{step({});step(input);step({});};
  const ready=(slot=0)=>{g.purchaseVending(p,slot);const order=p.vendingOrders.at(-1);order.ready=true;order.elapsed=1.6;return order;};
  return {g,p,step,press,ready,saves:()=>saves};
}

test('D-pad reaches the actual ready tray and confirm collects instead of buying again',()=>{
  const {g,p,press,ready}=setup(),order=ready();p.ui.index=9;
  press({down:true});assert.equal(p.ui.vendingView,'tray');assert.equal(p.ui.vendingOrderId,order.id);
  const before=JSON.stringify(p.vendingStock),gold=p.coins;
  press({use:true});assert.equal(count(p,'potion'),1);assert.equal(p.vendingOrders.length,0);
  assert.equal(p.coins,gold);assert.equal(JSON.stringify(p.vendingStock),before);
  assert.equal(p.ui.vendingView,'catalog');assert.equal(p.ui.index,9);
});

test('Shoulder toggle and tray navigation select stable order IDs, not backpack actions',()=>{
  const {g,p,press,ready}=setup(),first=ready(),second=ready(1);
  p.inventory=[{type:'potion',qty:3}];const before=JSON.stringify(p.inventory);
  press({panel:true});assert.equal(p.ui.vendingView,'tray');
  press({next:true});assert.equal(p.ui.vendingOrderId,second.id);
  for(const action of ['split','sockets','drop','dropOne','store','pick'])g.inventoryAction(p,action);
  assert.equal(JSON.stringify(p.inventory),before);assert.equal(p.ui.split,undefined);assert.equal(p.ui.socket,undefined);
  press({use:true});assert.equal(count(p,'stamina_potion'),1);
  assert.equal(p.ui.vendingOrderId,first.id);press({up:true});assert.equal(p.ui.vendingView,'catalog');
});

test('Top-face shortcut collects once per fresh press, even when several orders are ready',()=>{
  const {p,step,ready}=setup();ready();ready(1);
  step({offhand:true});for(let n=0;n<20;n++)step({offhand:true});
  assert.equal(count(p,'potion'),1);assert.equal(p.vendingOrders.length,1);
  step({});step({offhand:true});assert.equal(count(p,'stamina_potion'),1);assert.equal(p.vendingOrders.length,0);
});

test('Full bag retains the exact paid order, gold and stock; retry is atomic and single-use',()=>{
  const {g,p,press,ready,saves}=setup(),order=ready(1);
  p.inventory=Array.from({length:24},()=>({type:'sword',qty:1}));press({panel:true});
  const before=JSON.stringify([p.inventory,p.vendingOrders,p.coins,p.vendingStock]),saved=saves();
  press({use:true});assert.equal(JSON.stringify([p.inventory,p.vendingOrders,p.coins,p.vendingStock]),before);
  assert.equal(saves(),saved);assert.match(p.ui.notice,/Backpack full/);assert.equal(p.ui.vendingOrderId,order.id);
  p.inventory[23]=null;press({use:true});assert.equal(count(p,'stamina_potion'),1);assert.equal(p.vendingOrders.length,0);
  assert.equal(g.collectVending(p,order.id),false);assert.equal(count(p,'stamina_potion'),1);
});

test('Full occupied bag can collect into an existing non-full potion stack',()=>{
  const {p,press,ready}=setup();ready();
  p.inventory=Array.from({length:24},()=>({type:'sword',qty:1}));p.inventory[4]={type:'potion',qty:1};
  press({offhand:true});assert.equal(count(p,'potion'),2);assert.equal(p.vendingOrders.length,0);assert.equal(p.inventory.length,24);
});

test('Not-ready, foreign-machine and stale explicit IDs never collect or fall back to another purchase',()=>{
  const {g,p,ready}=setup();g.purchaseVending(p,0);const pending=p.vendingOrders[0],valid=ready(1);
  p.vendingOrders.push({...valid,id:99,owner:'another-house'});
  for(const id of [pending.id,99,1000])assert.equal(g.collectVending(p,id),false);
  assert.equal(count(p,'potion'),0);assert.equal(count(p,'stamina_potion'),0);assert.equal(p.vendingOrders.length,3);
  assert.equal(g.collectVending(p,valid.id),true);assert.equal(p.vendingOrders.length,2);
});

test('Wrong pad and keyboard cannot collect or purchase for a pad-owned panel',()=>{
  const {g,p,ready}=setup();ready();const q=g.addPlayer('pad:1');q.previousInput={};
  const before=JSON.stringify([p.inventory,p.vendingOrders,p.coins,p.vendingStock]);
  g.update(.05,{'pad:1':{offhand:true,use:true,panel:true},keyboard:{offhand:true,use:true}});
  assert.equal(JSON.stringify([p.inventory,p.vendingOrders,p.coins,p.vendingStock]),before);
});

test('Rebound or duplicate devices cannot invoke stale vendor UI callbacks or inventory actions',()=>{
  const {g,p,ready}=setup();ready();p.device='pad:1';
  const before=JSON.stringify([p.inventory,p.vendingOrders,p.coins,p.vendingStock]);
  assert.equal(g.collectVending(p),false);assert.equal(g.purchaseVending(p,0),false);
  g.inventoryAction(p,'offhand');assert.equal(JSON.stringify([p.inventory,p.vendingOrders,p.coins,p.vendingStock]),before);
  p.device='pad:0';g.players.unshift({...p,id:999});assert.equal(g.collectVending(p),false);
});

test('Closed shop and dead buyer cannot collect through old UI callbacks',()=>{
  const {g,p,ready}=setup();ready();p.hp=0;assert.equal(g.collectVending(p),false);
  p.hp=p.maxHp;g.inventoryAction(p,'close');assert.equal(p.ui,null);assert.equal(g.collectVending(p),false);
});

test('Dispensing finishes in real Game.update; held shortcut does not consume newly ready orders',()=>{
  const {p,step}=setup();step({use:true});assert.equal(p.vendingOrders.length,1);assert.equal(p.vendingOrders[0].ready,false);
  for(let n=0;n<40;n++)step({offhand:true});assert.equal(p.vendingOrders[0].ready,true);assert.equal(count(p,'potion'),0);
  step({});step({offhand:true});assert.equal(count(p,'potion'),1);assert.equal(p.vendingOrders.length,0);
});

test('Queue limit and sold-out/poor purchases leave economy unchanged',()=>{
  const {g,p}=setup();for(let n=0;n<6;n++)g.purchaseVending(p,n);
  const before=JSON.stringify([p.coins,p.vendingStock,p.vendingOrders]);g.purchaseVending(p,6);
  assert.equal(JSON.stringify([p.coins,p.vendingStock,p.vendingOrders]),before);
  p.vendingOrders=[];p.coins=0;const stock=JSON.stringify(p.vendingStock);g.purchaseVending(p,0);assert.equal(JSON.stringify(p.vendingStock),stock);
  p.coins=100;p.vendingStock[0].qty=0;g.purchaseVending(p,0);assert.equal(p.coins,100);
});

test('Paid ready/pending orders survive character and expedition round trips; collected order never returns',()=>{
  const {g,p,ready}=setup();ready(1);g.purchaseVending(p,0);
  const profiles=new Profiles();profiles.data.heroes=[{id:p.profileId}];profiles.save=()=>{};profiles.capture(g);
  const q={};profiles.assign(q,profiles.data.heroes[0]);assert.deepEqual(q.vendingOrders,p.vendingOrders);
  const restored=restoreSession(JSON.parse(JSON.stringify(saveSession(g)))),buyer=restored.players[0];
  restored.openShop(buyer,'vending');assert.equal(restored.collectVending(buyer),true);assert.equal(count(buyer,'stamina_potion'),1);
  const twice=restoreSession(JSON.parse(JSON.stringify(saveSession(restored))));
  assert.equal(twice.players[0].vendingOrders.length,1);assert.equal(twice.players[0].vendingOrders[0].ready,false);
  assert.equal(count(twice.players[0],'stamina_potion'),1);
});

test('Vending control labels use live Xbox/Switch buttons, including collect and shoulder tabs',()=>{
  const original=Object.getOwnPropertyDescriptor(globalThis,'navigator');
  try{
    for(const [id,accept,collect,tabs]of [['Xbox Wireless Controller','A','Y','LB / RB'],['Nintendo Switch Pro Controller','B','X','L / R']]){
      Object.defineProperty(globalThis,'navigator',{configurable:true,value:{getGamepads:()=>[{id,index:0}]}});
      const keys=HeroUI.prototype.controllerText(null,{device:'pad:0',controllerFamily:'generic'});
      assert.equal(keys.accept,accept);assert.equal(keys.collect,collect);assert.equal(keys.tabs,tabs);
    }
    const keys=HeroUI.prototype.controllerText(null,{device:'keyboard'});assert.equal(keys.collect,'2');
  }finally{if(original)Object.defineProperty(globalThis,'navigator',original);else delete globalThis.navigator;}
});
