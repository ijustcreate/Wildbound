import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/core.mjs';
import {ITEMS,count,freshCharacter} from '../src/items.mjs';
import {STARTER_GEAR,STARTER_SUPPLIES,starterChestFor,restockStarterChest,drawStarterChest} from '../src/starter-chest.mjs';
import {LobbyState,PlayableLobby} from '../src/playable-lobby.mjs';
import {LobbyPractice} from '../src/lobby-practice.mjs';
import {Profiles} from '../src/profiles.mjs';
import {saveSession,restoreSession} from '../src/session.mjs';

const setup=()=>{const g=new Game(()=>.5),p=g.addPlayer('pad:0'),q=g.addPlayer('pad:1');g.phase='lobby';p.inventory=[];q.inventory=[];return {g,p,q};};
test('starter chest includes every starter gear choice plus eight starter arrows',()=>{
  const {g,p}=setup(),chest=starterChestFor(g,p);
  assert.deepEqual(new Set(STARTER_GEAR),new Set(Object.keys(ITEMS).filter(id=>id.startsWith('starter_')&&ITEMS[id].slot)));
  assert.equal(STARTER_GEAR.length,7);assert.ok(STARTER_GEAR.includes('starter_wand'));assert.ok(STARTER_GEAR.includes('starter_boomerang'));
  assert.deepEqual(chest,STARTER_SUPPLIES);assert.equal(chest.find(i=>i.type==='arrow').qty,8);
});
test('regular starter chest withdraws and deposits, retaining equipment sockets and bag contents',()=>{
  const {g,p}=setup();g.openInventory(p,'starter');assert.equal(p.ui.panel,'chest');assert.equal(p.ui.loot,true);
  g.inventoryAction(p,'use');assert.equal(p.inventory[0].type,'starter_boomerang');
  p.inventory=[{type:'moon_blade',qty:1,sockets:['azure_bead']},{type:'armor_bag',qty:1,contents:[{type:'hat',qty:1}]}];
  g.inventoryAction(p,'panel:pack');g.inventoryAction(p,'lootAll');assert.equal(p.inventory.filter(Boolean).length,0);
  g.inventoryAction(p,'panel:chest');g.inventoryAction(p,'lootAll');
  assert.deepEqual(p.inventory.find(i=>i?.type==='moon_blade').sockets,['azure_bead']);
  assert.deepEqual(p.inventory.find(i=>i?.type==='armor_bag').contents,[{type:'hat',qty:1}]);assert.equal(p.starterChest.filter(Boolean).length,0);
  g.inventoryAction(p,'close');g.openInventory(p,'starter');assert.equal(g.storageFor(p).filter(Boolean).length,0);
});
test('starter chest empty slots, four-column navigation, full packs and favorites are safe',()=>{
  const {g,p}=setup();g.openInventory(p,'starter');g.inventoryAction(p,'down');assert.equal(p.ui.index,4);g.inventoryAction(p,'prev');assert.equal(p.ui.index,3);
  p.inventory=Array.from({length:24},()=>({type:'hat',qty:1}));const before=JSON.stringify(p.starterChest);g.inventoryAction(p,'use');assert.equal(JSON.stringify(p.starterChest),before);assert.match(p.ui.notice,/full/);
  g.inventoryAction(p,'panel:pack');p.field.favorites=['hat'];g.inventoryAction(p,'use');assert.match(p.ui.notice,/Unlock/);assert.equal(p.inventory.length,24);
  g.inventoryAction(p,'panel:chest');g.inventoryAction(p,'select:23');g.inventoryAction(p,'use');assert.equal(JSON.stringify(p.starterChest),before);
});
test('each player owns finite starter stock, with no free refill on close, reopen or session restore',()=>{
  const {g,p,q}=setup();g.openInventory(p,'starter');g.openInventory(q,'starter');g.inventoryAction(p,'lootAll');
  assert.equal(p.starterChest.filter(Boolean).length,0);assert.equal(q.starterChest.filter(Boolean).length,8);assert.equal(count(p,'arrow'),8);
  for(let i=0;i<4;i++){g.inventoryAction(p,'close');g.openInventory(p,'starter');assert.equal(g.storageFor(p).filter(Boolean).length,0);}
  const restored=restoreSession(JSON.parse(JSON.stringify(saveSession(g)))),r=restored.players[0];restored.openInventory(r,'starter');assert.equal(restored.storageFor(r).filter(Boolean).length,0);
});
test('new levels refill starter supplies without erasing deposits, extra arrows or overflowing a full chest',()=>{
  const {g,p,q}=setup();g.openInventory(p,'starter');g.inventoryAction(p,'lootAll');p.ui=null;
  const deposited={type:'moon_blade',qty:1,sockets:['azure_bead']};p.starterChest=Array.from({length:24},()=>structuredClone(deposited));q.starterChest=[{type:'arrow',qty:999}];
  g.start();assert.equal(p.starterChest.length,32);assert.deepEqual(p.starterChest.slice(0,24),Array.from({length:24},()=>deposited));
  assert.equal(q.starterChest.find(i=>i.type==='arrow').qty,999);for(const type of STARTER_GEAR)assert.ok(p.starterChest.some(i=>i?.type===type));
  const before=JSON.stringify(p.starterChest);restockStarterChest(p);assert.equal(JSON.stringify(p.starterChest),before);
  g.openInventory(p,'starter');g.inventoryAction(p,'select:24');g.inventoryAction(p,'use');assert.equal(count(p,'starter_boomerang'),2);
});
test('character profiles persist deposited starter chest items without touching private storage',()=>{
  const {g,p,q}=setup(),profiles=new Profiles();profiles.save=async()=>{};profiles.data.heroes=[freshCharacter('starter-test','Starter Tester')];profiles.assign(p,profiles.data.heroes[0]);
  const privateBefore=structuredClone(p.chests);g.openInventory(p,'starter');p.inventory=[{type:'moon_blade',qty:1,sockets:['azure_bead']}];g.inventoryAction(p,'panel:pack');g.inventoryAction(p,'use');profiles.capture(g);
  profiles.assign(q,profiles.data.heroes[0]);assert.deepEqual(q.starterChest,p.starterChest);assert.notEqual(q.starterChest,p.starterChest);assert.deepEqual(q.chests,privateBefore);
  q.starterChest.find(i=>i?.type==='moon_blade').sockets.push('jade_bead');assert.deepEqual(p.starterChest.find(i=>i?.type==='moon_blade').sockets,['azure_bead']);
});
test('lobby starter interaction opens the real chest, cancels readiness and renders a lid rather than a sign',()=>{
  const {g,p}=setup(),lobby=Object.create(PlayableLobby.prototype);Object.assign(lobby,{getGame:()=>g,state:new LobbyState()});lobby.state.sync(g.players);const s=lobby.state.members.get(p.id);Object.assign(s,{spawned:true,panel:null});p.ready=true;
  lobby.open(p,'starter-chest');assert.equal(p.ui.storage,'starter');assert.equal(s.panel,null);assert.equal(p.ready,false);assert.equal(s.inventoryRelease,true);assert.equal(p.inventory.length,0);
  const rects=[],c={save(){},restore(){},translate(){},fillRect(...r){rects.push(r)}};drawStarterChest(c,{x:950,y:520},0);const closed=JSON.stringify(rects);rects.length=0;drawStarterChest(c,{x:950,y:520},1);assert.notEqual(JSON.stringify(rects),closed);assert.ok(rects.length>40);
});
test('entering a new TV World level restocks starter selections without erasing custom deposits',()=>{
  const {g,p,q}=setup(),lobby=Object.create(PlayableLobby.prototype),television={players:new Set([p.id,q.id]),completed:true,seed:42,step(){},leave(){}};
  Object.assign(lobby,{getGame:()=>g,state:new LobbyState(),practice:new LobbyPractice(),television,sync(){},draw(){},root:{querySelector:()=>({textContent:''})},area:{querySelector:()=>({textContent:''})}});
  lobby.state.sync(g.players);for(const hero of g.players){Object.assign(lobby.state.members.get(hero.id),{spawned:true,panel:null,x:785,y:165});hero.starterChest=[];}
  p.starterChest.push({type:'moon_blade',qty:1,sockets:['azure_bead']});lobby.update(.05,{});
  assert.ok(lobby.tvWildbound);assert.equal(p.starterChest.filter(Boolean).length,9);assert.equal(q.starterChest.filter(Boolean).length,8);assert.deepEqual(p.starterChest[0].sockets,['azure_bead']);
});
