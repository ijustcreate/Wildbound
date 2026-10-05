import test from 'node:test';
import assert from 'node:assert/strict';
import {LobbyTelevision} from '../src/lobby-tv.mjs';
import {TV_CAVERN_SCENES,TV_SCENES_PER_LEVEL,TV_SECTION_TILES} from '../src/lobby-tv-levels.mjs';
import {TvWildbound,TV_WILDBOUND_GOAL,TV_WILDBOUND_WIDTH,TV_BOARD_X} from '../src/tv-wildbound.mjs';
import {Game} from '../src/core.mjs';
import {LobbyState,PlayableLobby} from '../src/playable-lobby.mjs';

test('TV level 2 has its own scenes and its castle transfers the party',()=>{
  const tv=new LobbyTelevision(42);tv.join('one');tv.join('two');
  tv.nextLevel();assert.equal(tv.level,2);
  assert.equal(tv.scene(0),TV_CAVERN_SCENES[0]);
  const p=tv.players.get('one'),flag=TV_SCENES_PER_LEVEL*TV_SECTION_TILES*16+17*16;
  tv.camera=flag-180;Object.assign(p,{x:flag-60,y:80,grounded:false,invulnerable:10});
  tv.step(.016,{one:{right:true}});assert.equal(tv.completed,false);
  Object.assign(p,{x:flag-12,y:80,vy:0,grounded:false});tv.step(.05,{one:{right:true}});
  assert.ok(tv.finishTimer>0);
  for(let i=0;i<121;i++)tv.step(.05,{});
  assert.equal(tv.level,2);assert.equal(tv.completed,true);assert.equal(tv.players.size,2);
  const time=tv.time;tv.step(.05,{});assert.equal(tv.time,time);
});

test('2D board rolls on a fresh hit and remains isolated from the normal game',()=>{
  const hero={id:'one',name:'Scout',appearance:{},equipment:{}};
  const mode=new TvWildbound([hero],7),p=mode.players.get('one');
  mode.step(2.8);assert.equal(mode.ready,false,'intro advances with bounded frame time');
  for(let i=0;i<56;i++)mode.step(.05);
  assert.equal(mode.ready,true);
  p.x=TV_BOARD_X;mode.step(.016,{one:{attack:true}});
  assert.ok(mode.progress>=1&&mode.progress<=6);const progress=mode.progress;
  mode.step(.016,{one:{attack:true}});assert.equal(mode.progress,progress,'holding hit does not reroll');
  for(let i=0;i<90;i++)mode.step(.05,{one:{attack:false}});
  mode.step(.016,{one:{attack:true}});
  assert.ok(mode.progress>progress);
  assert.deepEqual(new Set(mode.enemies.map(e=>e.kind)),new Set(['goomba','skeleton','skeleton_unarmed','archer','lion','tiger','bat']));
  assert.equal(hero.progress,undefined);
});

test('2D movement scrolls, goombas stomp, and the exit requires board progress',()=>{
  const mode=new TvWildbound([{id:'one',name:'Scout'}],12),p=mode.players.get('one');
  for(let i=0;i<57;i++)mode.step(.05);
  const goomba=mode.enemies.find(e=>e.kind==='goomba');
  Object.assign(p,{x:goomba.x,y:goomba.y-31,vy:250,grounded:false,invulnerable:0});
  mode.step(.03);assert.equal(goomba.alive,false);assert.ok(p.vy<0);
  Object.assign(p,{x:1700,y:437,vy:0});mode.step(.016,{one:{right:true}});assert.ok(mode.camera>0);
  Object.assign(p,{x:TV_WILDBOUND_WIDTH-101,y:437,vy:0});mode.step(.05,{one:{right:true}});
  assert.equal(mode.won,false);
  mode.progress=TV_WILDBOUND_GOAL;mode.step(.05,{one:{right:true}});
  assert.equal(mode.won,true);
});

test('side-view archer fires, cats chase, and bats swoop through the player lane',()=>{
  const mode=new TvWildbound([{id:'one',name:'Scout'}],5),p=mode.players.get('one');
  for(let i=0;i<57;i++)mode.step(.05);
  const archer=mode.enemies.find(e=>e.kind==='archer');
  Object.assign(p,{x:archer.x-100,y:437,invulnerable:10});mode.camera=archer.x-350;archer.cooldown=0;
  mode.step(.016);assert.equal(mode.projectiles.length,1);assert.ok(mode.projectiles[0].vx<0);
  const lion=mode.enemies.find(e=>e.kind==='lion');
  Object.assign(p,{x:lion.x-90,y:437});const before=lion.x;
  mode.step(.05);assert.ok(lion.x<before,'lion turns and charges toward the player');
  const bat=mode.enemies.find(e=>e.kind==='bat');
  const heights=[];for(let i=0;i<90;i++){mode.step(.05);heights.push(bat.y);}
  assert.ok(Math.max(...heights)>390,'bat reaches the grounded player lane');
});

test('lobby switches to the TV world without starting or mutating its regular game',()=>{
  const game=new Game(),hero=game.addPlayer('keyboard','Scout');
  const state=new LobbyState(),television=new LobbyTelevision(7);
  state.sync(game.players);Object.assign(state.members.get(hero.id),{spawned:true,panel:null,x:785,y:165});
  television.join(hero.id);television.completed=true;
  const lobby=Object.create(PlayableLobby.prototype);
  Object.assign(lobby,{getGame:()=>game,state,television,practice:{stepPractice(){}},sync(){},draw(){},panels:{replaceChildren(){}},area:{querySelector:()=>({textContent:''})},root:{querySelector:()=>({textContent:''})}});
  lobby.update(.016,{});
  assert.ok(lobby.tvWildbound instanceof TvWildbound);
  assert.equal(game.phase,'lobby');assert.equal(game.players[0],hero);
  assert.equal(hero.progress,0);
});
