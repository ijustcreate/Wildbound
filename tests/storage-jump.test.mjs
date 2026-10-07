import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/core.mjs';
import {PlayableLobby,LobbyState} from '../src/playable-lobby.mjs';
import {LobbyPractice} from '../src/lobby-practice.mjs';
import {tickStorageRoom,storageVisualActor} from '../src/storage-room.mjs';
import {roomBlocked} from '../src/shops.mjs';

function expedition(){
  const g=new Game(()=>.5),p=g.addPlayer('keyboard'),q=g.addPlayer('pad:0');g.start();
  g.openingBoard=false;g.scenery=[];g.terrain.fill('grass');p.x=p.y=400;q.x=q.y=600;
  g.portal(p);const door=g.portals[0];p.x=door.x;p.y=door.y;g.enterRoom(p,door);
  return {g,p,q,door,tick:input=>g.update(.05,input||{})};
}
test('Storage jumps from actual expedition input, lands once, and never auto-repeats or moves the outside actor',()=>{
  const {g,p,q,tick}=expedition(),position=[p.x,p.y];
  tick({keyboard:{jump:true,x:1}});assert.ok(p.roomJumpHeight>0);assert.equal(p.roomJumpVelocity,107);
  assert.ok(p.roomMoving);assert.equal(q.roomJumpHeight,undefined);assert.equal(p.jumpHeight||0,0);
  const first=p.roomJumpHeight;tick({keyboard:{jump:true}});assert.ok(p.roomJumpHeight>first);
  for(let n=0;n<25;n++)tick({keyboard:{jump:true}});
  assert.equal(p.roomJumpHeight,0);assert.equal(p.roomJumpVelocity,0);assert.deepEqual([p.x,p.y],position);
  tick({keyboard:{jump:true}});assert.equal(p.roomJumpHeight,0,'held button must not bunny-hop');
  tick();tick({keyboard:{jump:true}});assert.ok(p.roomJumpHeight>0);
  g.leaveRoom(p);assert.equal(p.roomJumpHeight,0);assert.equal(p.roomJumpHeld,false);
});
test('Storage jump retains floor collision, station gating, floor shadow coordinates and exit reset',()=>{
  const {g,p}=expedition();Object.assign(p,{roomX:60,roomY:115});
  tickStorageRoom(g,p,{jump:true,interact:true,y:-1},.05,true);
  assert.ok(p.roomJumpHeight>0);assert.equal(p.ui,null,'cannot open a chest while airborne');
  for(let i=0;i<6;i++)tickStorageRoom(g,p,{y:-1},.05);
  assert.equal(roomBlocked(p.roomX,p.roomY),false,'jump does not let feet pass through furniture');
  const actor=storageVisualActor({...p,jumpHeight:999,groundHeight:999,swimming:true});
  assert.equal(actor.y,p.roomY);assert.equal(actor.jumpHeight,p.roomJumpHeight);assert.equal(actor.groundHeight,0);assert.equal(actor.swimming,false);
  Object.assign(p,{roomX:160,roomY:209});tickStorageRoom(g,p,{},.05);assert.ok(p.room,'automatic exit waits for landing');
  for(let i=0;i<25&&p.room;i++)tickStorageRoom(g,p,{},.05);
  assert.equal(p.room,null);assert.equal(p.roomJumpHeight,0);
});
test('Storage in the lobby accepts only its owner input and animates jumping with the expedition clock stopped',()=>{
  const g=new Game(),p=g.addPlayer('keyboard'),q=g.addPlayer('pad:0'),lobby=Object.create(PlayableLobby.prototype);
  Object.assign(lobby,{getGame:()=>g,state:new LobbyState(),practice:new LobbyPractice(),sync(){},draw(){},area:{querySelector:()=>({textContent:''})}});
  lobby.state.sync(g.players);
  for(const [i,hero]of g.players.entries()){hero.profileId='jump-'+i;Object.assign(lobby.state.members.get(hero.id),{spawned:true,panel:null,x:300+i*200,y:350});}
  const tick=input=>lobby.update(.05,input||{});tick({keyboard:{portal:true}});const d=g.portals[0];tick();Object.assign(lobby.state.members.get(p.id),{x:d.x,y:d.y});tick();assert.equal(p.room,d.id);
  tick({'pad:0':{jump:true}});assert.equal(p.roomJumpHeight,0);
  tick({keyboard:{jump:true}});assert.ok(p.roomJumpHeight>0);assert.equal(g.time,0);
  const height=p.roomJumpHeight;lobby.update(.05,{keyboard:{jump:true}},true);assert.equal(p.roomJumpHeight,height,'pause freezes room motion');
  for(let n=0;n<25;n++)tick({keyboard:{jump:true}});assert.equal(p.roomJumpHeight,0);assert.equal(g.time,0);
});
test('Storage jumps reject dead/rooted actors and survive save/reload without adding world height',()=>{
  const {g,p}=expedition();p.rooted=1;tickStorageRoom(g,p,{jump:true},.05);assert.equal(p.roomJumpHeight,0);
  p.rooted=0;tickStorageRoom(g,p,{},.05);tickStorageRoom(g,p,{jump:true},.05);assert.ok(p.roomJumpHeight>0);
  const clone=JSON.parse(JSON.stringify(p));for(let n=0;n<25;n++)tickStorageRoom(g,clone,{jump:true},.05);assert.equal(clone.roomJumpHeight,0);
  clone.hp=0;tickStorageRoom(g,clone,{jump:true},.05);assert.equal(clone.roomJumpHeight,0);assert.equal(clone.roomJumpVelocity,0);
});
