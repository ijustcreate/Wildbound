import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/core.mjs';
import {BOARD_TABLE,boardTableBlocked} from '../src/board-table.mjs';
import {startJump,tickJump,supportHeight} from '../src/jumping.mjs';
import {actorContact} from '../src/contact-shadow.mjs';
test('Open board is two tiles wide and supports jumping in every environment',()=>{
 assert.equal(BOARD_TABLE.w,64);assert.equal(BOARD_TABLE.h,32);
 for(const environment of ['forest','desert','ice','house','temple']){
 const g=new Game();g.generatedEnvironment=environment;g.house=null;g.scenery=[];g.terrain.fill('grass');const p=g.addPlayer('keyboard');Object.assign(p,{x:750,y:800,hp:100,groundHeight:0,jumpHeight:0});
 assert.equal(boardTableBlocked(g,780,800,8,0),true);assert.equal(boardTableBlocked(g,780,800,8,20),false);
 g.moveActor(p,35,0);assert.ok(p.x<768);startJump(p);for(let i=0;i<12;i++)tickJump(p,.02,g);g.moveActor(p,35,0);assert.ok(p.x>768);
 for(let i=0;i<50;i++)tickJump(p,.02,g);assert.equal(p.groundHeight,16);assert.equal(supportHeight(g,p),16);assert.equal(actorContact(g,p,32).surface,16);
 g.moveActor(p,90,0);for(let i=0;i<40;i++)tickJump(p,.02,g);assert.equal(p.groundHeight,0);
 }
});
