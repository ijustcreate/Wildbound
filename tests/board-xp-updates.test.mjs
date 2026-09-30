import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/core.mjs';
import {tickBoardSequence,boardDicePose,EVENT_DURATIONS,eventDuration} from '../src/board-sequence.mjs';
import {TRAIL_EDGES} from '../src/board.mjs';
import {tickXPOrbs} from '../src/xp-orbs.mjs';
import {equipmentNeighbor} from '../src/equipment-navigation.mjs';
import {SLOTS} from '../src/items.mjs';

test('Equipment navigation reaches every slot and follows glove placement',()=>{
 assert.equal(equipmentNeighbor('hand1','down'),'gloves');assert.equal(equipmentNeighbor('feet','prev'),'gloves');
 const seen=new Set(['head']),queue=['head'];
 while(queue.length){const slot=queue.shift();for(const d of ['up','down','next','prev']){const next=equipmentNeighbor(slot,d);assert.ok(SLOTS.includes(next));if(!seen.has(next)){seen.add(next);queue.push(next);}}}
 assert.equal(seen.size,SLOTS.length);
 const g=new Game(),p=g.addPlayer('pad:0');g.start();g.openInventory(p);p.ui.panel='gear';p.ui.index=SLOTS.indexOf('hand1');g.inventoryAction(p,'down');assert.equal(SLOTS[p.ui.index],'gloves');
});

function rolling(){
 const g=new Game(()=>.5),p=g.addPlayer('pad:0');g.addPlayer('pad:1');g.start();
 g.openingBoard=false;assert.ok(g.hitTable(p));return g;
}
test('Only a fresh confirmation from the roller dismisses a resolved event',()=>{
 const g=rolling(),landing=g.roll.landingAt;
 tickBoardSequence(g,landing,{ 'pad:0':{use:true} });
 assert.ok(g.roll.resolved);
 tickBoardSequence(g,.1,{'pad:0':{use:true},'pad:1':{use:true}});assert.ok(g.roll);
 tickBoardSequence(g,.1,{'pad:1':{use:true}});assert.ok(g.roll);
 tickBoardSequence(g,.1,{'pad:0':{use:true}});assert.equal(g.roll,null);assert.equal(g.eventTime,0);
});
test('All event duration choices control board reveal time, defaulting to five',()=>{
 assert.equal(eventDuration(undefined),5);assert.equal(eventDuration(-1),5);
 for(const duration of EVENT_DURATIONS){const g=rolling();g.eventDuration=duration;tickBoardSequence(g,g.roll.landingAt,{});tickBoardSequence(g,duration-.01,{});assert.ok(g.roll);tickBoardSequence(g,.02,{});assert.equal(g.roll,null);}
});
test('Dice scatter across board quadrants and settle continuously',()=>{
 const points=[];
 for(let seed=0;seed<1;seed+=.05){const r={dice:[2,6],tossSeed:seed,elapsed:1.6};points.push(boardDicePose(r,0));for(let t=0;t<=1.61;t+=.01){r.elapsed=t;for(let i=0;i<2;i++){const p=boardDicePose(r,i);assert.ok(Math.abs(p.x)<76&&Math.abs(p.y)<59);}}r.elapsed=1.599;const before=boardDicePose(r,0);r.elapsed=1.6;assert.ok(Math.abs(before.angle-boardDicePose(r,0).angle)<.01);}
 assert.ok(points.some(p=>p.y<-25)&&points.some(p=>p.y>25));
 assert.equal(TRAIL_EDGES.length,49);assert.ok(TRAIL_EDGES.every(p=>Number.isFinite(p.left.x)&&Number.isFinite(p.right.y)));
});
test('XP bursts conserve value, scatter, and home to a living hero',()=>{
 const g=new Game(()=>.5),p=g.addPlayer('keyboard');g.start();p.x=400;p.y=400;
 g.dropXP(480,400,10);assert.equal(g.xpOrbs.length,5);assert.equal(g.xpOrbs.reduce((n,o)=>n+o.amount,0),10);
 const start=g.xpOrbs.map(o=>[o.x,o.y]);tickXPOrbs(g,.05);assert.ok(g.xpOrbs.some((o,i)=>o.x!==start[i][0]));assert.equal(p.xp,0);
 for(let i=0;i<100&&g.xpOrbs.length;i++){g.time+=.05;tickXPOrbs(g,.05);}
 assert.equal(g.xpOrbs.length,0);assert.equal(p.xp,10);
});
test('Tougher enemies drop more small orbs; dead heroes do not attract them',()=>{
 const g=new Game(()=>.5),p=g.addPlayer('keyboard');g.start();g.enemyLoot({kind:'skeleton',x:400,y:400});const count=g.xpOrbs.length;g.xpOrbs=[];
 g.enemyLoot({kind:'skeleton_boss',x:400,y:400,maxHp:500});assert.ok(g.xpOrbs.length>count);assert.ok(g.xpOrbs.every(o=>o.amount<10));
 p.hp=0;p.x=400;p.y=400;g.time=2;tickXPOrbs(g,.05);assert.ok(g.xpOrbs.every(o=>!o.attracted));
});
