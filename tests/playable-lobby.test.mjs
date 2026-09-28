import test from 'node:test';
import assert from 'node:assert/strict';
import {LobbyState,moveLobbyCharacter} from '../src/playable-lobby.mjs';
import {playerFrame,defaultPlayerMotion} from '../src/player-motion.mjs';

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
  const s=lobby.members.get(1);s.x=510;s.y=280;assert.equal(lobby.nearest(p),null);
  s.spawned=true;assert.equal(lobby.nearest(p).id,'board');assert.equal(p.x,1000);
  s.x=60;s.y=560;assert.equal(lobby.nearest(p),undefined);
});
