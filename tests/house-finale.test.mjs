import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/core.mjs';
import {waterAt} from '../src/environment.mjs';
import {houseKeepsWorld,recalledEnemy} from '../src/house-victory.mjs';
import {defaultHouse,validateHouse,activeHouse,HOUSE_KEY,contains} from '../src/house-design.mjs';
import {saveSession,restoreSession} from '../src/session.mjs';

function setup(env='house'){
 const g=new Game(()=>.5);g.environment=env;const p=g.addPlayer('keyboard');g.start();g.openingBoard=false;g.bloom=3;p.x=800;p.y=850;p.progress=48;
 return {g,p};
}
test('House victory recalls hostiles only and preserves exact scenery, terrain, furniture, trees and custom door state',()=>{
 const {g,p}=setup();g.house.doors[0].open=true;
 const before=JSON.stringify({house:g.house,scenery:g.scenery,terrain:g.terrain});
 const ally={id:901,kind:'lion',faction:'ally',allyOwner:p.id,hp:80,x:600,y:850},ambient={id:902,kind:'pig',faction:'neutral',wildlife:true,hp:40,x:500,y:1200},enemy={id:903,kind:'lion',hp:100,x:1000,y:850};
 g.enemies=[ally,ambient,enemy];g.ghosts=[{id:904,faction:'hostile',kind:'tiger'},{id:905,spiritGhost:true,faction:'ally',kind:'tiger'}];
 g.beginSeal(p);while(g.phase==='sealing')g.update(.05,{});
 assert.equal(g.phase,'won');assert.equal(JSON.stringify({house:g.house,scenery:g.scenery,terrain:g.terrain}),before);
 assert.deepEqual(g.enemies.map(e=>e.id),[901,902]);assert.deepEqual(g.ghosts.map(e=>e.id),[905]);assert.ok(g.victoryRewards.length);
 const restored=restoreSession(JSON.parse(JSON.stringify(saveSession(g))));assert.equal(restored.phase,'won');assert.equal(restored.scenery.length,g.scenery.length);assert.equal(restored.house.doors[0].open,true);
});
test('A house pool still supports swimming, diving, splashes and shore exit after victory',()=>{
 const {g,p}=setup();g.completeVictory();const pool=g.house.pools[0];p.x=pool.x+pool.w/2;p.y=pool.y+pool.h/2;p.jumpHeight=p.groundHeight=0;p.consumeInput=false;
 assert.equal(waterAt(g,p.x,p.y),'water');g.update(.05,{});assert.equal(p.swimming,true);
 for(let n=0;n<15;n++)g.update(.05,{keyboard:{attack:true}});assert.ok(p.diveDepth>0);assert.ok(p.breath<20);assert.ok(g.effects.some(e=>e.particle==='bubbles'));
 p.x=pool.x-24;g.update(.05,{});assert.equal(p.swimming,false);assert.equal(p.diveDepth,0);
 assert.equal(g.blocked(pool.x+32,pool.y+32,8,false,false,false,0),true,'non-swimming creatures still respect pool water');
});
test('Non-house levels retain the original whole-world recall, and friendly/ambient actors are never house recall targets',()=>{
 const {g}=setup('forest');g.completeVictory();assert.equal(g.scenery.length,0);assert.equal(waterAt(g,0,0),'grass');assert.equal(houseKeepsWorld(g),false);
 for(const actor of [{faction:'ally'},{faction:'neutral'},{hunterPet:true},{spiritGhost:true}])assert.equal(recalledEnemy(actor),false);
 assert.equal(recalledEnemy({kind:'lion'}),true);assert.equal(recalledEnemy({faction:'hostile'}),true);
});
test('New default floorplan has an open central gallery, six rooms, wider doors and preserves saved custom layouts',()=>{
 const h=defaultHouse();assert.ok(validateHouse(h));assert.equal(h.floorplanVersion,2);assert.equal(h.rooms.length,6);
 assert.ok(h.doors.every(d=>Math.max(d.w,d.h)>=96));
 for(let y=504;y<1104;y+=8)assert.ok(!h.walls.some(r=>contains(r,800,y))&&!h.furniture.filter(f=>!['rug','plant'].includes(f.kind)).some(r=>contains(r,800,y)),'central gallery is clear at '+y);
 assert.ok(h.doors.some(d=>d.x===1104&&d.w===16),'bedroom has an outdoor side exit');
 const previous=globalThis.localStorage,custom=structuredClone(h);custom.name='User custom house';custom.rooms[0].name='My room';custom.doors[0].open=true;
 globalThis.localStorage={getItem:k=>k===HOUSE_KEY?JSON.stringify({active:'my-house',designs:[{id:'my-house',house:custom}]}):null};
 try{assert.deepEqual(activeHouse(),custom);}finally{if(previous===undefined)delete globalThis.localStorage;else globalThis.localStorage=previous;}
});
