import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/core.mjs';
import {defaultHouse} from '../src/house-design.mjs';
import {interactHouseLiving,tickHouseLiving} from '../src/house-living.mjs';
import {houseLightSources,toggleHouseLight} from '../src/house-lights.mjs';
import {toggleDoor} from '../src/expansion.mjs';
import {saveSession,restoreSession} from '../src/session.mjs';
import {meadowAllowed} from '../src/pixel-meadow.mjs';
import {grassFieldInstances} from '../src/grass-field.mjs';
const setup=()=>{const g=new Game(()=>.5);Object.assign(g,{house:defaultHouse(),generatedEnvironment:'house',environment:'house',phase:'play',openingBoard:false,enemies:[],scenery:[],portals:[]});g.terrain.fill('grass');g.persist=()=>{};g.onSound=()=>{};return {g,p:g.addPlayer('keyboard')};};
test('appliances toggle independently, sink fills and caps, and runtime state survives session restore',()=>{
 const {g,p}=setup(),stove=g.house.furniture.find(f=>f.kind==='stove'),sink=g.house.furniture.find(f=>f.kind==='sink');
 Object.assign(p,{x:stove.x+24,y:stove.y+48});interactHouseLiving(g,p);assert.equal(stove.applianceOn,true);assert.ok(houseLightSources(g).some(s=>s.color==='#ffb66b'));
 Object.assign(p,{x:sink.x+20,y:sink.y+48});interactHouseLiving(g,p);tickHouseLiving(g,3,{});assert.ok(sink.waterLevel>.5&&sink.waterLevel<1);tickHouseLiving(g,10,{});assert.equal(sink.waterLevel,1);interactHouseLiving(g,p);tickHouseLiving(g,2,{});assert.ok(sink.waterLevel>0&&sink.waterLevel<1);assert.equal(stove.applianceOn,true);
 const restored=restoreSession(JSON.parse(JSON.stringify(saveSession(g))));assert.equal(restored.house.furniture.find(f=>f.kind==='stove').applianceOn,true);assert.equal(restored.house.furniture.find(f=>f.kind==='sink').applianceOn,false);
});
test('bed sleep heals rapidly, stays capped, and movement or jump wakes through real Game.update',()=>{
 const {g,p}=setup(),bed=g.house.furniture.find(f=>f.kind==='bed');Object.assign(p,{x:bed.x-24,y:bed.y+50,hp:20,maxHp:100});assert.ok(interactHouseLiving(g,p));
 for(let i=0;i<40;i++)g.update(.05,{keyboard:{}});assert.ok(p.bedRest&&p.sleeping>0);assert.ok(p.hp>=51&&p.hp<=55);
 g.update(.05,{keyboard:{x:-1}});assert.equal(p.bedRest,undefined);assert.equal(p.sleeping,0);assert.ok(p.x<bed.x);
 Object.assign(p,{x:bed.x-24,y:bed.y+50,hp:99});interactHouseLiving(g,p);for(let i=0;i<5;i++)g.update(.05,{keyboard:{}});assert.equal(p.hp,100);g.update(.05,{keyboard:{jump:true}});assert.equal(p.bedRest,undefined);assert.ok(p.jumpHeight>0);
});
test('damage and removed beds stop rest; a world change never teleports a player back to house coordinates',()=>{
 const {g,p}=setup(),bed=g.house.furniture.find(f=>f.kind==='bed');Object.assign(p,{x:bed.x-24,y:bed.y+50,hp:50});interactHouseLiving(g,p);p.hit=.2;tickHouseLiving(g,.05,{});assert.equal(p.bedRest,undefined);p.hit=0;interactHouseLiving(g,p);g.seed++;p.x=100;p.y=200;tickHouseLiving(g,.05,{});assert.equal(p.bedRest,undefined);assert.equal(p.x,100);assert.equal(p.y,200);
});
test('lights and doors stay interactive and forest meadow excludes the house, paths, pools and furniture',()=>{
 const {g,p}=setup(),lamp=g.house.furniture.find(f=>f.kind==='lamp'),door=g.house.doors[0];p.x=lamp.x+lamp.w/2;p.y=lamp.y+lamp.h/2;assert.ok(toggleHouseLight(g,p));assert.equal(lamp.lightMode,'on');
 p.x=door.x+door.w/2+35;p.y=door.y+door.h/2;assert.ok(toggleDoor(g,p));assert.equal(door.open,true);
 const data=grassFieldInstances(g,{sx:256,sy:256,ex:1280,ey:1280},[]);assert.ok(data.length>100);for(let i=0;i<data.length;i+=8){assert.ok(meadowAllowed(g,data[i],data[i+1]));assert.ok(!g.house.floors.some(f=>data[i]>=f.x&&data[i]<f.x+f.w&&data[i+1]>=f.y&&data[i+1]<f.y+f.h));}
});

test('bed interaction wins over nearby wildlife and holding Interact does not immediately wake the sleeper',()=>{
 const {g,p}=setup(),bed=g.house.furniture.find(f=>f.kind==='bed');Object.assign(p,{x:bed.x-24,y:bed.y+50,hp:50});const chicken={id:901,kind:'chicken',hp:22,x:p.x+10,y:p.y};g.enemies=[chicken];
 g.update(.05,{keyboard:{interact:true}});g.update(.05,{keyboard:{interact:true}});g.update(.05,{keyboard:{}});assert.ok(p.bedRest);assert.equal(p.heldChickenId,undefined);assert.equal(chicken.carriedBy,undefined);
});

test('a closer bedroom doorway opens instead of triggering the nearby bed',()=>{
 const {g,p}=setup(),door=g.house.doors.find(d=>d.x===928&&d.y===672);Object.assign(p,{x:976,y:650});g.update(.05,{keyboard:{interact:true}});g.update(.05,{keyboard:{}});assert.equal(door.open,true);assert.equal(p.bedRest,undefined);
});
