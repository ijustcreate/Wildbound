import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/core.mjs';
import {defaultHouse,upgradeHouseFeatures,furnitureHeight} from '../src/house-design.mjs';
import {startJump,tickJump} from '../src/jumping.mjs';
import {clearShot,advanceShot} from '../src/navigation.mjs';
import {applyChangedHouse} from '../src/apply-house.mjs';
import {saveSession,restoreSession} from '../src/session.mjs';
const setup=()=>{const g=new Game();g.environment='house';g.addPlayer('keyboard');g.start();g.openingBoard=false;g.scenery=[];g.terrain.fill('grass');return g;};
test('Low furniture is tagged, tall furniture stays solid, window migration is idempotent',()=>{
 const h=defaultHouse();assert.ok(h.walls.some(w=>w.kind==='window'));
 assert.ok(h.furniture.find(f=>f.kind==='bed').jumpable);
 assert.equal(furnitureHeight({kind:'bookcase',jumpable:true}),0);
 const before=JSON.stringify(h);upgradeHouseFeatures(h);assert.equal(JSON.stringify(h),before);
});
test('Jump lands on table, stays supported, then falls when walking off; tall walls remain solid',()=>{
 const g=setup(),p=g.players[0];g.house={walls:[],doors:[],furniture:[{kind:'table',x:300,y:300,w:80,h:80}],pools:[]};
 Object.assign(p,{x:280,y:330});g.moveActor(p,35,0);assert.ok(p.x<300);
 assert.ok(startJump(p));for(let i=0;i<12;i++)tickJump(p,.02,g,0);
 g.moveActor(p,40,0);assert.ok(p.x>300);
 for(let i=0;i<70;i++)tickJump(p,.02,g,0);assert.equal(p.groundHeight,16);assert.equal(p.jumpHeight,0);
 g.moveActor(p,90,0);for(let i=0;i<50;i++)tickJump(p,.02,g,0);assert.equal(p.groundHeight,0);
 g.house.walls=[{x:430,y:280,w:16,h:120}];p.jumpHeight=25;g.moveActor(p,70,0);assert.ok(p.x<430);
});
test('First shot breaks glass and is consumed; subsequent shots pass but actors cannot',()=>{
 const g=setup();g.house={walls:[{kind:'window',x:400,y:200,w:16,h:120}],doors:[],furniture:[],pools:[]};
 const pane=g.house.walls[0];assert.equal(clearShot(g,{x:350,y:250},{x:450,y:250},2),false);assert.ok(!pane.broken);
 const shot=()=>({x:350,y:250,vx:2000,vy:0,life:2});
 const a=shot();assert.equal(advanceShot(g,a,.05,2),false);assert.equal(a.life,0);assert.equal(pane.broken,true);
 assert.equal(advanceShot(g,shot(),.05,2),true);
 assert.equal(g.blocked(408,250,8,false,false,false,0,30),true);
});
test('Broken panes survive session restore and do not count as house architecture edits',()=>{
 const g=setup();g.house.walls.find(w=>w.kind==='window').broken=true;
 const restored=restoreSession(JSON.parse(JSON.stringify(saveSession(g))));
 assert.ok(restored.house.walls.some(w=>w.broken));assert.equal(applyChangedHouse(restored),false);assert.ok(restored.house.walls.some(w=>w.broken));
});
