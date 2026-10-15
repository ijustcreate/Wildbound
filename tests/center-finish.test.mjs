import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/core.mjs';
import {tickBoardSequence} from '../src/board-sequence.mjs';
import {finishBoardTurn} from '../src/board-turns.mjs';
import {saveSession,restoreSession} from '../src/session.mjs';
import {merchantAction,merchantRows} from '../src/traveling-merchant.mjs';
const setup=()=>{const g=new Game(()=>.42),p=g.addPlayer('keyboard'),q=g.addPlayer('pad:0');g.start();g.openingBoard=false;g.enemies=[];g.scenery=[];g.terrain.fill('grass');return {g,p,q};};
test('center landing preserves the existing event and never spawns or travels, including five/eight and doubles',()=>{
 for(const dice of [[2,3],[4,4],[6,6]]){
  const {g,p,q}=setup();g.houseWorldsEnabled=true;p.progress=47;g.locked=true;g.turnOrder=[p.id,q.id];g.turn=0;const event=g.event={name:'Still active',type:'enemy'};g.eventTime=2;
  g.spawnEvent=()=>{throw Error('Center spawned an event');};
  g.roll={playerId:p.id,dice,total:dice.reduce((a,b)=>a+b),startProgress:47,targetProgress:48,elapsed:0,landingAt:1.76};
  tickBoardSequence(g,1.8);assert.equal(g.roll.centerLanding,true);assert.equal(p.progress,48);assert.equal(g.event,event);assert.equal(g.houseWorlds?.pending,undefined);
  tickBoardSequence(g,21);assert.equal(g.roll,null);assert.ok(!g.worldTravel);assert.equal(g.event,event);assert.equal(g.eventTime,2);assert.equal(g.current,q);assert.equal(g.repeatTurnPlayerId,null);
 }
});
test('turns skip finished pieces on wrap, after restore, and when everyone reaches center',()=>{
 const {g,p,q}=setup(),r=g.addPlayer('pad:1');p.progress=48;g.locked=true;g.turnOrder=[p.id,r.id,q.id];g.turn=2;g.round=3;
 finishBoardTurn(g,{playerId:q.id,dice:[2,3]});assert.equal(g.current,r);assert.equal(g.turn,1);assert.equal(g.round,4);
 g.turn=0;const restored=restoreSession(JSON.parse(JSON.stringify(saveSession(g))));assert.equal(restored.current.id,r.id);assert.equal(restored.turn,1);
 p.progress=q.progress=r.progress=48;assert.equal(g.current,null);const round=g.round;assert.equal(g.current,null);assert.equal(g.round,round);
});
test('finished owner can call outside their turn; hold consumes loot aliases and cancels when interrupted',()=>{
 const {g,p,q}=setup();Object.assign(p,{progress:48,x:800,y:850});g.locked=true;g.turnOrder=[p.id,q.id];g.turn=1;
 g.nearbyLoot=()=>({type:'sword'});g.nearbyArrow=()=>({id:99});g.collect=g.collectArrow=()=>{throw Error('Finish hold looted');};
 for(let i=0;i<5;i++)g.update(.05,{keyboard:{interact:true,loot:true}});g.update(.05,{});assert.equal(p.sealHold,0);
 for(let i=0;i<55&&g.phase==='play';i++)g.update(.05,{keyboard:{interact:true,loot:true}});assert.equal(g.phase,'sealing');
});
test('merchant selection is separate from trading and sparse backpack navigation skips empty slots',()=>{
 const {g,p}=setup();g.merchant={x:p.x,y:p.y,stock:[{item:{type:'critter_net',qty:1},price:24},{item:{type:'empty_jar',qty:1},price:4}],revision:0};
 p.coins=100;p.inventory=[null,{type:'fruit',qty:2},null,{type:'sword',qty:1}];p.ui={shop:'merchant',panel:'stock',index:0};
 merchantAction(g,p,'select:1');assert.equal(p.coins,100);merchantAction(g,p,'use');assert.equal(p.coins,96);assert.equal(p.inventory[0].type,'empty_jar');
 merchantAction(g,p,'panel:pack');merchantAction(g,p,'down');assert.equal(p.ui.index,1);merchantAction(g,p,'down');assert.equal(p.ui.index,3);
 merchantAction(g,p,'use');const gold=p.coins;assert.equal(p.inventory[3],null);assert.equal(merchantRows(g,p).length,2);
 merchantAction(g,p,'panel:buyback');assert.equal(merchantRows(g,p).length,1);assert.equal(merchantRows(g,p)[0].item.type,'sword');merchantAction(g,p,'use');assert.ok(p.coins<gold);assert.equal(merchantRows(g,p).length,0);assert.equal(p.inventory[2].type,'sword');
});
test('buyback only exposes the original owner and unavailable trades do not lose items or gold',()=>{
 const {g,p,q}=setup();g.merchant={x:p.x,y:p.y,stock:[{item:{type:'sword',qty:1},price:20,seller:q.profileId||q.id},{item:{type:'critter_net',qty:1},price:24}],revision:0};
 p.ui={shop:'merchant',panel:'buyback',index:0};assert.equal(merchantRows(g,p).length,0);const gold=p.coins;merchantAction(g,p,'use');assert.equal(p.coins,gold);assert.match(p.ui.notice,/Reserved/);
 merchantAction(g,p,'panel:stock');p.coins=0;merchantAction(g,p,'use');assert.equal(p.coins,0);assert.match(p.ui.notice,/gold/);
 p.coins=100;p.inventory=Array.from({length:24},()=>({type:'sword',qty:1}));merchantAction(g,p,'use');assert.equal(p.coins,100);assert.match(p.ui.notice,/free backpack/);
});
