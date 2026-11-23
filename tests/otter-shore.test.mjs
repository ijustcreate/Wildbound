import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/core.mjs';
import {seedWildFauna,tickWildFauna} from '../src/wild-fauna.mjs';
import {waterAt} from '../src/environment.mjs';

test('Bayou otters seed on a bank without depending on penguin-local shoreline state',()=>{
 const g=new Game(()=>.5);g.environment='swamp';g.seed=1234;g.addPlayer('keyboard','Otter');g.start();g.openingBoard=false;
 seedWildFauna(g,true);const otters=g.enemies.filter(e=>e.kind==='river_otter');assert.equal(otters.length,2);
 for(const e of otters){assert.notEqual(waterAt(g,e.x,e.y),'water');assert.ok([[32,0],[-32,0],[0,32],[0,-32]].some(([dx,dy])=>['water','shallow'].includes(waterAt(g,e.x+dx,e.y+dy))));}
 const e=otters[0],index=g.terrain.indexOf('water');assert.ok(index>=0);Object.assign(e,{x:(index%50)*32+16,y:Math.floor(index/50)*32+16,wanderIn:99});
 tickWildFauna(g,e,0);assert.equal(e.swimming,true);assert.equal(e.animationAction,'swim');
});
