import test from 'node:test';
import assert from 'node:assert/strict';
import {LOBBY_OBJECTS,LobbyState,PlayableLobby,moveLobbyCharacter,lobbyCamera} from '../src/playable-lobby.mjs';
import {Game} from '../src/core.mjs';
import {LobbyPractice} from '../src/lobby-practice.mjs';
import {playerFrame,defaultPlayerMotion} from '../src/player-motion.mjs';
import {controllerButtonNames,controllerFamily} from '../src/controls.mjs';

test('Switch Pro controllers use Nintendo face-button labels',()=>{
  const pad={id:'Nintendo Co., Ltd. Pro Controller (057e/2009)',mapping:'standard'};
  assert.equal(controllerFamily(pad),'switch');
  assert.deepEqual([controllerButtonNames(pad)[0],controllerButtonNames(pad)[1]],['B','A']);
});

test('Lobby footsteps match gameplay distance and stop advancing against room boundaries',()=>{
  const s={x:300,y:300,step:0};moveLobbyCharacter(s,{x:1,y:0},88/180);
  assert.ok(Math.abs(s.step-88*.13)<1e-8);
  const model=defaultPlayerMotion();
  assert.ok(Math.abs(playerFrame({...s,animationAction:'run'},0,model)-model.clips.run.length)<1e-8);
  s.x=970;const step=s.step;moveLobbyCharacter(s,{x:1,y:0},1);
  assert.equal(s.step,step);assert.equal(s.moving,false);
});

test('Board requires every joined player to choose, spawn, and confirm before countdown',()=>{
  const lobby=new LobbyState(),players=[{id:1,profileId:'a'},{id:2}];lobby.sync(players);
  lobby.members.get(1).spawned=true;lobby.members.get(1).panel=null;players[0].ready=true;
  assert.equal(lobby.tick(4,players),false);assert.equal(lobby.countdown,null);
  players[1].profileId='b';players[1].ready=true;lobby.members.get(2).spawned=true;lobby.members.get(2).panel=null;
  assert.equal(lobby.tick(1,players),false);assert.equal(lobby.countdown,2);
  assert.equal(lobby.tick(2,players),true);assert.equal(lobby.tick(1,players),false);
});
test('Joining, settings changes, selection panels, and disconnection cancel the countdown',()=>{
  const lobby=new LobbyState(),players=[{id:1,profileId:'a'}];lobby.sync(players);
  const s=lobby.members.get(1);s.spawned=true;s.panel=null;players[0].ready=true;
  lobby.tick(1,players);lobby.invalidate(players);assert.equal(lobby.countdown,null);assert.equal(players[0].ready,false);
  players[0].ready=true;lobby.tick(1,players);s.panel='difficulty';lobby.tick(.1,players);assert.equal(lobby.countdown,null);
  s.panel=null;players[0].lobbyDisconnected=true;assert.equal(lobby.tick(4,players),false);
  players[0].lobbyDisconnected=false;players.push({id:2});lobby.sync(players);assert.equal(players[0].ready,false);
});
test('Interactions require a spawned character near an object; lobby positions do not move game spawn',()=>{
  const lobby=new LobbyState(),p={id:1,x:1000,y:1000};lobby.sync([p]);
  const s=lobby.members.get(1);s.x=770;s.y=420;assert.equal(lobby.nearest(p),null);
  s.spawned=true;assert.equal(lobby.nearest(p).id,'board');assert.equal(p.x,1000);
  s.x=60;s.y=560;assert.equal(lobby.nearest(p),undefined);
});

test('Explorer station occupies the former map position and opens with the lobby interact button',()=>{
  const lever=LOBBY_OBJECTS.find(o=>o.id==='target-lever'),station=LOBBY_OBJECTS.find(o=>o.id==='character-station');
  assert.equal(station.x,635);assert.equal(station.y,165);const map=LOBBY_OBJECTS.find(o=>o.id==='environment'),dice=LOBBY_OBJECTS.find(o=>o.id==='dice-count');assert.deepEqual([map.x,map.y],[625,548]);assert.deepEqual([dice.x,dice.y],[780,548]);
  const game=new Game(),p=game.addPlayer('keyboard');
  const lobby=Object.create(PlayableLobby.prototype);let opened=null;
  Object.assign(lobby,{getGame:()=>game,state:new LobbyState(),practice:new LobbyPractice(),sync(){},draw(){},area:{querySelector:()=>({textContent:''})},openCharacterStation(player){opened=player;}});
  lobby.state.sync(game.players);Object.assign(lobby.state.members.get(p.id),{spawned:true,panel:null,x:station.x,y:station.y});
  lobby.update(.01,{keyboard:{lobbyInteract:true}});
  assert.equal(opened,p);
});

test('Lobby inventory equips the saved hero, blocks practice input, and cancels readiness',()=>{
  const game=new Game(),p=game.addPlayer('keyboard'),q=game.addPlayer('pad:0');
  const lobby=Object.create(PlayableLobby.prototype);
  Object.assign(lobby,{getGame:()=>game,state:new LobbyState(),practice:new LobbyPractice(),sync(){},draw(){},area:{querySelector:()=>({textContent:''})}});
  lobby.state.sync(game.players);
  for(const player of game.players){player.profileId='hero-'+player.id;player.ready=true;Object.assign(lobby.state.members.get(player.id),{spawned:true,panel:null});}
  p.inventory=[{type:'sword',qty:1}];
  const tick=input=>lobby.update(.05,input);
  const s=lobby.state.members.get(p.id),x=s.x;
  tick({keyboard:{inventory:true,x:1,attack:true}});
  assert.equal(p.ui.panel,'pack');assert.equal(q.ui,null);assert.equal(p.ready,false);assert.equal(s.x,x);assert.equal(lobby.state.countdown,null);
  tick({});tick({keyboard:{use:true,attack:true}});
  assert.equal(p.equipment.hand1,'sword');assert.equal(lobby.practice.players.find(a=>a.id===p.id).equipment.hand1,'sword');assert.equal(s.x,x);
  tick({});tick({keyboard:{close:true,jump:true}});
  assert.equal(p.ui,null);assert.equal(lobby.practice.players.find(a=>a.id===p.id).jumpHeight||0,0);
  tick({});tick({'pad:0':{inventory:true}});assert.equal(q.ui.panel,'pack');assert.equal(p.ui,null);
  tick({});tick({'pad:0':{inventory:true}});assert.equal(q.ui,null);
  game.start();assert.equal(p.equipment.hand1,'sword');
});

test('Lobby camera fits the room and outer station labels at common viewport sizes',()=>{
  for(const [w,h] of [[1264,600],[1904,970],[784,470],[600,740]]){
    const camera=lobbyCamera(w,h);
    for(const [x,y] of [[0,6],[1024,614],...LOBBY_OBJECTS.map(o=>[o.x,o.y+58])]){
      const sx=w/2+(x-camera.x)*camera.zoom,sy=h/2+(y-camera.y)*camera.zoom;
      assert.ok(sx>=-.001&&sx<=w+.001&&sy>=-.001&&sy<=h+.001);
    }
  }
});
