import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/core.mjs';
import {BOARD_TABLE,boardTableBlocked,boardActorDepth,boardTableDepth} from '../src/board-table.mjs';
import {startJump,tickJump,supportHeight} from '../src/jumping.mjs';
import {actorContact} from '../src/contact-shadow.mjs';
test('Walking across the back half stays supported and above the tabletop; walking off falls',()=>{
 const g=new Game();g.phase='play';g.openingBoard=false;g.generatedEnvironment='house';g.house={walls:[],doors:[],furniture:[],pools:[],rooms:[]};g.scenery=[];g.terrain.fill('grass');
 const p=g.addPlayer('keyboard');Object.assign(p,{x:800,y:812,groundHeight:16,jumpHeight:0});
 for(let i=0;i<26;i++){g.moveActor(p,0,-1);tickJump(p,.02,g);assert.equal(p.groundHeight,16);assert.equal(p.jumpHeight,0);assert.ok(boardActorDepth(g,p)>boardTableDepth());assert.equal(actorContact(g,p,43).surface,16);}
 assert.equal(p.y,786);g.moveActor(p,0,-25);for(let i=0;i<50;i++)tickJump(p,.02,g);assert.equal(p.groundHeight,0);assert.equal(p.jumpHeight,0);assert.ok(boardActorDepth(g,p)<boardTableDepth());
});
test('Height, not facing or screen Y, separates tabletop occupants from actors behind it',()=>{
 const g={generatedEnvironment:'house'},a={x:800,y:790,groundHeight:16};
 for(const faceY of [-1,1])assert.ok(boardActorDepth(g,{...a,faceY})>boardTableDepth());
 assert.ok(boardActorDepth(g,{...a,groundHeight:0,jumpHeight:20})>boardTableDepth());
 assert.ok(boardActorDepth(g,{...a,groundHeight:0,jumpHeight:0})<boardTableDepth());
 assert.ok(boardActorDepth(g,{...a,y:760,groundHeight:0})<boardTableDepth());
 assert.equal(boardActorDepth(g,{...a,x:900}),790);
});
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
