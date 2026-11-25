import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/core.mjs';
import {saveSession,restoreSession} from '../src/session.mjs';
import {enterWildLands} from '../src/wild-lands.mjs';
import {trainPrompt} from '../src/train-test.mjs';
import {wildHomesteadAt,wildHomesteadBoardTable} from '../src/wild-homestead-layout.mjs';
import {dismissHomesteadBoardResult,homesteadBoardSuction,homesteadBoardView} from '../src/homestead-board.mjs';
import {wildLandsSurfaceAt} from '../src/wild-lands-world.mjs';
import {boardTableSupport} from '../src/board-table.mjs';

function setup(){
 const g=new Game(()=>.1,{deferWorld:true}),p=g.addPlayer('keyboard','Rowan'),q=g.addPlayer('pad:0','Rook');
 g.persist=()=>{};g.onSound=()=>{};
 assert.ok(enterWildLands(g,{persistent:true,homeStart:true}).ok);
 const b=wildHomesteadBoardTable(g.trainTest.design),approach={x:b.x+32,y:b.y+56};
 Object.assign(p,approach);Object.assign(q,{x:b.x+106,y:b.y+56});
 g.eventDuration=1;
 return {g,p,q,b,approach};
}
function roll(g,device,d1,d2){
 const seed=[(d1-.5)/6,(d2-.5)/6,.2,.15,.1,.16,.1,.1];
 g.random=()=>seed.shift()??.1;
 g.update(.05,{[device]:{interact:true}});
 g.update(.05,{});
}
function step(g,n,inputs={}){for(let i=0;i<n;i++)g.update(.05,inputs);}
const position=({x,y})=>({x,y});

test('Physical Homestead table uses Classic dice with independent pawn state and roller-only portal across a mid-suction save',()=>{
 const {g,p,q,b,approach}=setup();
 assert.match(trainPrompt(g,p),/PLAY WILDBOUND/);
 assert.equal(boardTableSupport(g,b.x+32,b.y+16),16);
 assert.equal(g.blocked(b.x+32,b.y+16,8),true);
 assert.equal(g.blocked(approach.x,approach.y,8),false);
 const other=position(q);
 roll(g,p.device,1,4);
 assert.equal(homesteadBoardView(g,true).roll.total,5);
 assert.equal(g.roll,null);
 step(g,54,{keyboard:{x:1}});
 const rail=g.trainTest,s=rail.homesteadBoard;
 assert.equal(s.pawns[0].progress,5);
 assert.equal(p.progress,0);
 assert.deepEqual(position(p),approach);
 assert.deepEqual(position(q),other);
 assert.equal(homesteadBoardView(g,true),null);
 const suction=homesteadBoardSuction(g);
 assert.equal(suction.playerId,p.id);
 assert.ok(suction.actorY<p.y&&suction.scale<.95);
 assert.equal(s.portal.encounter,true);

 const serialized=JSON.parse(JSON.stringify(saveSession(g))),live=restoreSession(serialized);
 const hero=live.players[0],friend=live.players[1],t=live.trainTest,home=t.homesteadBoard;
 live.random=()=>.1;live.persist=()=>{};live.onSound=()=>{};
 const {x,y}=s.portal;
 assert.deepEqual(position(home.portal),{x,y});
 step(live,12);
 assert.equal(home.portal,null);
 assert.deepEqual(position(hero),{x,y});
 assert.deepEqual(position(friend),other);
 assert.equal(wildLandsSurfaceAt(t.design,x,y),'grass');
 assert.equal(hero.swimming,false);
 assert.deepEqual(live.portalTransition.ids,[hero.id]);
 const serial=live.portalTransition.serial;
 step(live,36);
 assert.deepEqual(position(hero),{x,y});
 assert.equal(live.portalTransition.serial,serial);
 assert.ok(home.encounter);
 assert.equal(wildHomesteadAt(t.design,home.encounter.x,home.encounter.y,115),false);
 assert.equal(live.enemies.filter(e=>e.wildSpawnKey==='homestead-board-encounter'&&e.hp>0).length,1);
 assert.equal(home.roll,null);
 roll(live,hero.device,1,2);
 assert.equal(home.roll,null,'The teleported hero cannot roll remotely');
 Object.assign(friend,{x:b.x+32,y:b.y+56});
 roll(live,friend.device,1,2);
 assert.equal(home.roll.playerId,friend.id);
 step(live,88);
 assert.equal(home.roll,null);
 assert.match(trainPrompt(live,friend),/ROWAN’S TURN/);
 Object.assign(hero,approach);
 roll(live,hero.device,1,2);
 assert.equal(home.roll.playerId,hero.id);
});

test('A pawn at the center calls Wildbound at the table and may start a fresh local board',()=>{
 const {g,p}=setup(),t=g.trainTest;
 roll(g,p.device,1,2);step(g,90);
 const s=t.homesteadBoard;
 Object.assign(s.pawns[0],{progress:47,boardProgress:47});
 s.locked=true;s.turn=0;s.turnOrder=[p.id,s.pawns[1].id];
 roll(g,p.device,1,2);step(g,85);
 assert.equal(s.pawns[0].progress,48);
 assert.match(trainPrompt(g,p),/CALL WILDBOUND/);
 const before=position(p);
 roll(g,p.device,1,2);
 assert.equal(s.winnerId,p.id);
 assert.deepEqual(position(p),before);
 assert.equal(g.phase,'play');
 assert.equal(g.trainTest,t);
 assert.match(trainPrompt(g,p),/PLAY WILDBOUND/);
 roll(g,p.device,1,2);
 assert.notEqual(t.homesteadBoard,s);
 assert.equal(t.homesteadBoard.roll.startProgress,0);
 assert.equal(g.roll,null);
});

function trail35(){
 const fixture=setup(),{g,p,q,b}=fixture;
 roll(g,p.device,1,2);
 step(g,88);
 const s=g.trainTest.homesteadBoard;
 Object.assign(s.pawns[0],{progress:26,boardProgress:26});
 Object.assign(s,{locked:true,turn:0,turnOrder:[p.id,q.id]});
 g.eventDuration=20;
 Object.assign(q,{x:b.x+90,y:b.y+56});
 roll(g,p.device,4,5);
 return {...fixture,s};
}

test('a saved Trail 35 result dismisses from the reassigned roller controller and the next explorer can roll',()=>{
 const {g,p,q,b,s}=trail35();
 assert.equal(s.roll.total,9);
 assert.equal(dismissHomesteadBoardResult(g),false,'dice and pawn movement cannot be skipped');
 step(g,73);
 assert.deepEqual(s.event,{name:'TRAIL 35',tip:'9 rolled'});
 assert.equal(s.roll.resolved,true);

 const restored=restoreSession(JSON.parse(JSON.stringify(saveSession(g))));
 const board=restored.trainTest.homesteadBoard;
 const roller=restored.players.find(player=>player.id===p.id),next=restored.players.find(player=>player.id===q.id);
 roller.device='pad:1';
 restored.update(.05,{[next.device]:{use:true}});
 assert.ok(homesteadBoardView(restored,true).roll,'other explorers cannot confirm the roller’s result');
 step(restored,4,{[roller.device]:{use:true,jump:true}});
 assert.equal(homesteadBoardView(restored,true),null);
 assert.equal(roller.jumpHeight,0,'the dismiss button is not also a jump');
 assert.equal(board.pawns[0].progress,35);
 assert.equal(board.turnOrder[board.turn],next.id);
 assert.equal(board.portal,undefined);
 Object.assign(next,{x:b.x+32,y:b.y+56});
 step(restored,27);
 roll(restored,next.device,1,2);
 assert.equal(board.roll.playerId,next.id);
});

test('holding Interact through a roll leaves the result visible until a fresh interaction or Close',()=>{
 const {g,p,s}=trail35();
 step(g,74,{[p.device]:{interact:true}});
 assert.ok(s.roll.resolved);
 step(g,1);
 step(g,1,{[p.device]:{interact:true}});
 assert.equal(s.roll,null);
 assert.equal(s.pawns[0].progress,35);

 const close=trail35();
 step(close.g,74);
 assert.equal(dismissHomesteadBoardResult(close.g),true);
 assert.equal(dismissHomesteadBoardResult(close.g),false);
 assert.equal(close.s.pawns[0].progress,35);
});
