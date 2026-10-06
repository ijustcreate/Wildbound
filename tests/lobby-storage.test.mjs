import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/core.mjs';
import {PlayableLobby,LobbyState} from '../src/playable-lobby.mjs';
import {LobbyPractice} from '../src/lobby-practice.mjs';
import {count} from '../src/items.mjs';

function setup(){
  const game=new Game(),p=game.addPlayer('keyboard'),q=game.addPlayer('pad:0');
  const lobby=Object.create(PlayableLobby.prototype);
  Object.assign(lobby,{getGame:()=>game,state:new LobbyState(),practice:new LobbyPractice(),sync(){},draw(){},area:{querySelector:()=>({textContent:''})}});
  lobby.state.sync(game.players);
  for(const [i,player] of game.players.entries()){player.profileId='storage-'+i;Object.assign(lobby.state.members.get(player.id),{spawned:true,panel:null,x:300+i*200,y:350,faceX:0,faceY:-1});}
  const tick=(input={})=>lobby.update(.05,input);
  const enter=()=>{tick({keyboard:{portal:true}});const door=game.portals.find(d=>d.owner===p.id);assert.ok(door?.lobby);tick();Object.assign(lobby.state.members.get(p.id),{x:door.x,y:door.y});tick();assert.equal(p.room,door.id);return door;};
  return {game,p,q,lobby,tick,enter};
}
test('Lobby portal opens on a fresh owner input, enters, and returns without moving expedition coordinates',()=>{
  const {game,p,q,lobby,tick,enter}=setup(),original=[p.x,p.y];
  let saved=0;game.persist=()=>{saved++;assert.deepEqual([p.x,p.y],original);};
  const door=enter();assert.deepEqual([p.x,p.y],original);assert.equal(q.room,null);assert.equal(game.phase,'lobby');
  const s=lobby.state.members.get(p.id),position=[s.x,s.y];
  tick({keyboard:{x:1,attack:true}});assert.deepEqual([s.x,s.y],position);assert.ok(p.roomX>160);assert.equal(lobby.practice.players.find(a=>a.id===p.id).attack,0);
  tick();tick({keyboard:{portal:true}});assert.equal(p.room,null);assert.deepEqual([p.x,p.y],original);assert.deepEqual([s.x,s.y],[door.x,door.y]);assert.equal(game.portals.length,0);assert.ok(saved>=3);
  tick({keyboard:{portal:true}});assert.equal(game.portals.length,0,'holding return does not reopen');
  tick();tick({keyboard:{portal:true}});assert.equal(game.portals.length,1);
});
test('Lobby storage edits actual chest contents and dispensing completes without ticking the expedition',()=>{
  const {game,p,lobby,tick,enter}=setup();p.inventory=[];p.chests[0]=[{type:'potion',qty:4}];enter();
  Object.assign(p,{roomX:60,roomY:115});tick({keyboard:{interact:true,lobbyInteract:true,use:true}});assert.equal(p.ui.storage,0);assert.equal(game.storageFor(p),p.chests[0]);assert.equal(count(p,'potion'),0,'opening chest must not activate its first slot');
  game.inventoryAction(p,'panel:chest');game.inventoryAction(p,'select:0');tick();tick({keyboard:{use:true}});
  assert.equal(count(p,'potion'),4);assert.ok(!p.chests[0].some(Boolean));game.inventoryAction(p,'close');tick();
  Object.assign(p,{roomX:255,roomY:158,coins:100});tick({keyboard:{interact:true}});assert.equal(p.ui.shop,'vending');
  game.purchaseVending(p,0);for(let i=0;i<35;i++)tick();assert.equal(p.vendingOrders[0].ready,true);assert.ok(game.collectVending(p));assert.equal(count(p,'potion'),5);assert.equal(game.time,0);
});
test('Room Return UI restores the lobby position and storage access blocks ready countdown',()=>{
  const {game,p,q,lobby,tick,enter}=setup(),original=[p.x,p.y],door=enter();p.ready=q.ready=true;
  assert.equal(lobby.state.tick(4,game.players),false);
  game.leaveRoom(p);tick();assert.equal(p.room,null);assert.deepEqual([p.x,p.y],original);const s=lobby.state.members.get(p.id);assert.deepEqual([s.x,s.y],[door.x,door.y]);
});
test('Lobby portal is suppressed during inventory, pause, disconnected or unselected sessions',()=>{
  const {game,p,lobby,tick}=setup();game.openInventory(p);tick({keyboard:{portal:true}});assert.equal(game.portals.length,0);
  p.ui=null;tick();lobby.update(.05,{keyboard:{portal:true}},true);assert.equal(game.portals.length,0);
  tick();p.lobbyDisconnected=true;tick({keyboard:{portal:true}});assert.equal(game.portals.length,0);
});
