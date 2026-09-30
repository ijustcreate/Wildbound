import test from 'node:test';
import assert from 'node:assert/strict';
import {LobbyTelevision} from '../src/lobby-tv.mjs';
import {LobbyState,PlayableLobby} from '../src/playable-lobby.mjs';
import {Game} from '../src/core.mjs';

test('the lobby TV accepts two players and pauses when both walk away',()=>{
  const tv=new LobbyTelevision();
  assert.equal(tv.join('one'),true);assert.equal(tv.join('two'),true);assert.equal(tv.join('three'),false);
  tv.step(.05,{'one':{right:true},'two':{}});
  assert.ok(tv.players.get('one').x>28);
  tv.leave('one');tv.leave('two');
  const time=tv.time;tv.step(.05,{});assert.equal(tv.time,time);
  assert.equal(tv.started,true);
});

test('A at the TV takes input from practice and walking away releases it',()=>{
  const game=new Game(),player=game.addPlayer('pad:0');
  const lobby=Object.create(PlayableLobby.prototype),state=new LobbyState(),television=new LobbyTelevision();
  state.sync(game.players);Object.assign(state.members.get(player.id),{spawned:true,panel:null,x:785,y:165});
  let practiceInput;
  Object.assign(lobby,{getGame:()=>game,state,television,practice:{stepPractice(_dt,_players,members,inputs){practiceInput=inputs['pad:0'];members.get(player.id).x+=(practiceInput.walkX||practiceInput.x||0)*120;}},sync(){},draw(){},area:{querySelector:()=>({textContent:''})}});
  lobby.update(.05,{'pad:0':{tvA:true,attack:true}});
  assert.equal(television.players.has(player.id),true);
  assert.deepEqual(practiceInput,{x:0,y:0});
  lobby.update(.05,{'pad:0':{tvA:false,walkX:1}});
  assert.equal(television.players.has(player.id),false);
});

test('endless terrain, breakable bricks, enemies and respawn remain available',()=>{
  const tv=new LobbyTelevision();tv.join('one');
  assert.equal(tv.terrain(13),null);
  assert.equal(tv.terrain(28+13),null);
  assert.ok(tv.blocks(0,2000).some(b=>b.kind==='brick'));
  const brick=tv.blocks(0,200).find(b=>b.kind==='brick');
  const player=tv.players.get('one');
  Object.assign(player,{x:brick.x+2,y:brick.y+brick.h+1,vy:-120});
  tv.move(player,.02,true);
  assert.equal(tv.broken.has(brick.key),true);
  tv.die(player);assert.equal(player.alive,false);
  for(let i=0;i<24;i++)tv.step(.05,{});
  assert.equal(player.alive,true);
  assert.ok(tv.enemies.size>0);
});
