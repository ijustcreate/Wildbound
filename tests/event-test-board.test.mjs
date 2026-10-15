import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,EVENTS} from '../src/core.mjs';
import {spawnEventTestBoard,canHitEventTestBoard} from '../src/event-test-board.mjs';
import {BOARD_TABLE,boardTableSupport,boardTableBlocked,boardActorDepth,boardTableDepth} from '../src/board-table.mjs';
import {saveSession,restoreSession} from '../src/session.mjs';

function field(env='forest'){
 const g=new Game(()=>.45);g.environment=env;const p=g.addPlayer('keyboard'),q=g.addPlayer('pad:0');g.start();
 g.scenery=[];g.terrain.fill('grass');g.livingEcosystem.vines=[];
 Object.assign(p,{x:1050,y:1050,faceX:0,faceY:1,invincible:true});
 Object.assign(q,{x:1100,y:1100,invincible:true});return {g,p,q};
}
const turnState=g=>JSON.stringify({players:g.players.map(p=>({progress:p.progress,boardProgress:p.boardProgress,rolls:p.rolls,coins:p.coins,choice:p.field.choice})),turn:g.turn,round:g.round,locked:g.locked,order:g.turnOrder,repeat:g.repeatTurnPlayerId,roll:g.roll,deck:g.deck,director:g.eventDirector});

test('Dev spawn belongs to the opener, stays at the summon point, and replaces only the test board',()=>{
 const {g,p,q}=field(),regular={...BOARD_TABLE};
 assert.equal(spawnEventTestBoard(g,q.id).ok,true);const b=g.eventTestBoard;
 assert.deepEqual([b.x+b.w/2,b.y+b.h/2],[q.x,q.y]);assert.equal(b.nextEvent,0);assert.equal(g.openingBoard,false);
 q.x+=120;assert.equal(b.x+b.w/2,1100);assert.deepEqual(BOARD_TABLE,regular);
 assert.equal(spawnEventTestBoard(g,p.id).ok,true);assert.notEqual(g.eventTestBoard,b);assert.equal(g.eventTestBoard.nextEvent,0);
 assert.equal(boardTableSupport(g,p.x,p.y),16);assert.equal(boardTableSupport(g,800,800),16);
 assert.equal(boardTableBlocked(g,p.x,p.y,8,0),true);assert.equal(boardTableBlocked(g,p.x,p.y,8,20),false);
 assert.ok(boardActorDepth(g,p)>boardTableDepth(g.eventTestBoard));
});

test('One hit per attack, shared sequence, no turn or pawn advance, and no simultaneous normal roll',()=>{
 const {g,p,q}=field();Object.assign(p,{x:800,y:800});spawnEventTestBoard(g,p.id);const before=turnState(g);
 assert.equal(g.attack(p),true);assert.equal(g.event.name,EVENTS[0].name);assert.equal(g.eventTestBoard.nextEvent,1);
 assert.equal(g.attack(p),false);assert.equal(g.eventTestBoard.nextEvent,1);
 Object.assign(q,{x:800,y:835,faceX:0,faceY:-1});assert.equal(g.attack(q),true);
 assert.equal(g.event.name,EVENTS[1].name);assert.equal(g.eventTestBoard.nextEvent,2);assert.equal(turnState(g),before);
 g.eventTestBoard=null;p.attack=0;assert.equal(g.attack(p),true);assert.ok(g.roll);
});

test('Actual attack input hold/release spawns once and never repeats while held',()=>{
 const {g,p}=field();spawnEventTestBoard(g,p.id);
 for(let n=0;n<30;n++)g.update(.05,{keyboard:{attack:true}});
 assert.equal(g.eventTestBoard.nextEvent,0);
 g.update(.05,{keyboard:{attack:false}});assert.equal(g.eventTestBoard.nextEvent,1);
 for(let n=0;n<20;n++)g.update(.05,{});assert.equal(g.eventTestBoard.nextEvent,1);
 for(let n=0;n<30;n++)g.update(.05,{keyboard:{attack:true}});
 assert.equal(g.eventTestBoard.nextEvent,1);g.update(.05,{});assert.equal(g.eventTestBoard.nextEvent,2);
});

test('The complete event list spawns in order, including biome, water, disabled, well and crypt cards',()=>{
 for(const env of ['forest','graveyard']){
  const {g,p}=field(env);spawnEventTestBoard(g,p.id);const before=turnState(g);
  for(let i=0;i<EVENTS.length;i++){
   g.enemies=[];p.attack=0;
   assert.equal(g.attack(p),true,env+' hit '+(i+1));assert.equal(g.eventTestBoard.nextEvent,i+1,env+' cursor '+EVENTS[i].name);
   assert.equal(g.event.name,EVENTS[i].name);
   if(EVENTS[i].count>0)assert.ok(g.enemies.length||g.mystery?.object,'spawn '+EVENTS[i].name);
   if(EVENTS[i].type==='old_well')assert.ok(g.portals.some(d=>d.oldWell&&!d.mausoleum));
   if(EVENTS[i].type==='mausoleum')assert.ok(g.portals.some(d=>d.mausoleum));
   if(EVENTS[i].type==='friendly_npc')assert.ok(g.questNpcs.length);
   if(['blizzard','monsoon','sandstorm','thunderstorm'].includes(EVENTS[i].type))assert.equal(g.weather.type,EVENTS[i].type);
   assert.equal(turnState(g),before,'turn state after '+EVENTS[i].name);
  }
  const last=g.event;p.attack=0;g.attack(p);assert.equal(g.event,last);assert.equal(g.eventTestBoard.nextEvent,EVENTS.length);
  assert.match(g.log[0],/complete/);spawnEventTestBoard(g,p.id);p.attack=0;g.attack(p);assert.equal(g.event.name,EVENTS[0].name);
 }
});

test('Range, facing, player state and rolling block test-board hits',()=>{
 const {g,p}=field();spawnEventTestBoard(g,p.id);
 p.x=1200;assert.equal(canHitEventTestBoard(g,p),false);
 Object.assign(p,{x:1100,faceX:1,faceY:0});assert.equal(canHitEventTestBoard(g,p),false);
 p.faceX=-1;assert.equal(canHitEventTestBoard(g,p),true);
 for(const state of [{hp:0},{room:'storage'},{ui:{}},{succubusCharm:{remaining:10}}]){
  const before={hp:p.hp,room:p.room,ui:p.ui,succubusCharm:p.succubusCharm};Object.assign(p,state);
  assert.equal(canHitEventTestBoard(g,p),false);Object.assign(p,before);
 }
 g.roll={};assert.equal(g.attack(p),false);assert.equal(g.eventTestBoard.nextEvent,0);
 assert.equal(spawnEventTestBoard(g,p.id).ok,false);g.roll=null;
 g.phase='lobby';assert.equal(spawnEventTestBoard(g,p.id).ok,false);
});

test('Save/reload resumes the next event and a fresh expedition removes the test board',()=>{
 const {g,p}=field();spawnEventTestBoard(g,p.id);g.attack(p);
 const restored=restoreSession(JSON.parse(JSON.stringify(saveSession(g)))),hero=restored.players[0];hero.attack=0;
 assert.deepEqual(restored.eventTestBoard,g.eventTestBoard);restored.attack(hero);assert.equal(restored.event.name,EVENTS[1].name);
 restored.newExpedition();assert.equal(restored.eventTestBoard,null);
});

test('Normal event spawning retains biome and starting-area restrictions',()=>{
 const {g}=field();assert.equal(g.spawnEvent(EVENTS.findIndex(e=>e.environment==='ice')),false);
 assert.equal(g.spawnEvent(EVENTS.findIndex(e=>e.kind==='crocodile')),false);assert.equal(g.enemies.length,0);
});
