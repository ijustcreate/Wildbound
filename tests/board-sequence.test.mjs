import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/core.mjs';
import {boardDicePose,BOARD_REVEAL_SECONDS} from '../src/board-sequence.mjs';
test('Board roll freezes the world, progresses the piece, reveals the event and resumes',()=>{
 const g=new Game(()=>.5),p=g.addPlayer('keyboard');g.start();g.openingBoard=false;g.spawnEvent(0);p.breath=10;
 const before={time:g.time,x:p.x,y:p.y,hp:p.hp,enemies:JSON.stringify(g.enemies),breath:p.breath};
 assert.ok(g.hitTable(p));const landing=g.roll.landingAt;
 for(let i=0;i<35;i++)g.update(.05,{keyboard:{x:1,attack:true,jump:true}});
 assert.equal(g.time,before.time);assert.equal(p.x,before.x);assert.equal(p.hp,before.hp);assert.equal(p.breath,before.breath);assert.equal(JSON.stringify(g.enemies),before.enemies);assert.ok(p.boardProgress>0);assert.equal(p.progress,0);
 while(!g.roll.resolved)g.update(.05,{});assert.equal(p.progress,8);assert.equal(g.eventOnBoard,true);const enemies=JSON.stringify(g.enemies);
 for(let i=0;i<70;i++)g.update(.05,{});assert.ok(g.roll);assert.equal(JSON.stringify(g.enemies),enemies);assert.equal(g.time,before.time);
 while(g.roll)g.update(.05,{});assert.equal(g.eventTime,0);assert.equal(g.time,before.time);g.update(.05,{});assert.ok(g.time>before.time);assert.ok(landing+BOARD_REVEAL_SECONDS>6);
});
test('One or two tumbling dice remain within the board surface',()=>{
 for(const dice of [[6],[2,5]])for(let t=0;t<5;t+=.01)for(let i=0;i<dice.length;i++){
  const d=boardDicePose({dice,elapsed:t},i),radius=d.size*Math.sqrt(3);
  assert.ok(Math.abs(d.x)+radius<85);assert.ok(d.y+radius<69);assert.ok(d.y-radius>-69);
 }
});
test('Dice finish flat and remain motionless on their rolled result',()=>{for(let seed=0;seed<1;seed+=.1)for(let i=0;i<2;i++){const r={dice:[2,6],tossSeed:seed,elapsed:1.6},a=boardDicePose(r,i);assert.equal(a.angle,0);assert.equal(a.value,r.dice[i]);r.elapsed=8;assert.deepEqual(boardDicePose(r,i),a);}});
