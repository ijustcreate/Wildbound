import test from 'node:test';
import assert from 'node:assert/strict';
import {defaultHouse} from '../src/house-design.mjs';
import {vegetationBlocked,houseFloorZones,furnishSurface,interactHouseSurface} from '../src/house-surfaces.mjs';
import {houseLightSources} from '../src/house-lights.mjs';
import {worldGridSettings,setWorldGridSettings,drawWorldGrid} from '../src/world-grid.mjs';
import {Game} from '../src/core.mjs';
import {saveSession,restoreSession} from '../src/session.mjs';

test('grid is an independent opt-in layer with persistent bounded style and opacity',()=>{
 const old=globalThis.localStorage,data=new Map();globalThis.localStorage={setItem:(k,v)=>data.set(k,v)};
 try{
  setWorldGridSettings({enabled:false});let strokes=0;const c={save(){},restore(){},beginPath(){},moveTo(){},lineTo(){},stroke(){strokes++;},setLineDash(value){this.dashes=value;}};
  drawWorldGrid(c,{x:200,y:200,zoom:1},320,240);assert.equal(strokes,0);
  setWorldGridSettings({enabled:true,style:'dotted',opacity:2});drawWorldGrid(c,{x:200,y:200,zoom:1},320,240);
  assert.equal(strokes,1);assert.deepEqual(c.dashes,[1,4]);assert.equal(worldGridSettings().opacity,1);assert.equal(JSON.parse(data.get('wildbound-world-grid')).style,'dotted');
  setWorldGridSettings({style:'solid',opacity:.25});drawWorldGrid(c,{x:200,y:200,zoom:2},320,240);assert.deepEqual(c.dashes,[]);assert.equal(c.globalAlpha,.25);
 }finally{setWorldGridSettings({enabled:false,style:'solid',opacity:.18});globalThis.localStorage=old;}
});

test('room finishes preserve custom houses and ground vegetation cannot occupy solid furniture',()=>{
 const house=defaultHouse();assert.equal(houseFloorZones(house).filter(r=>r.material==='carpet').length,2);assert.ok(houseFloorZones(house).some(r=>r.material==='checker'));
 assert.deepEqual(houseFloorZones({...house,name:'My custom plan'}),[]);
 const g={house:{furniture:[{kind:'table',x:100,y:100,w:80,h:48}],floors:[]}};
 assert.ok(vegetationBlocked(g,140,125));assert.ok(!vegetationBlocked(g,200,190));g.house.furniture[0].destroyed=true;assert.ok(!vegetationBlocked(g,140,125));
});

test('kitchen props support a saved one-time cooking reward, repeat healing and non-destructive ingredient checks',()=>{
 const kettle={kind:'stove',x:100,y:100,w:48,h:32},book={kind:'desk',x:300,y:100,w:100,h:40};
 const messages=[],g={house:{furniture:[kettle,book]},message:t=>messages.push(t),persist(){},onSound(){}};
 const p={x:126,y:114,hp:20,maxHp:100,coins:0,inventory:[{type:'meat',qty:2},{type:'fruit',qty:1}]};
 assert.ok(interactHouseSurface(g,p));assert.equal(p.hp,75);assert.equal(p.coins,15);assert.ok(kettle.kitchenQuestComplete);
 const reloaded=JSON.parse(JSON.stringify(g.house));g.house=reloaded;p.inventory=[{type:'meat',qty:1},{type:'fruit',qty:1}];
 assert.ok(interactHouseSurface(g,p));assert.equal(p.hp,100);assert.equal(p.coins,15,'quest cannot pay again after reload');
 p.inventory=[{type:'meat',qty:1}];assert.ok(interactHouseSurface(g,p));assert.equal(p.inventory[0].qty,1,'missing ingredients consume nothing');
 p.x=340;p.y=120;interactHouseSurface(g,p);assert.match(messages.at(-1),/completed/);
});

test('surface candles preserve edited positions and actually feed the house lighting system',()=>{
 const f={kind:'table',x:100,y:100,w:80,h:48,surfaceItems:[{kind:'candle',u:.7,v:.4}]},g={house:{furniture:[f]},sky:{elapsed:320},message(){},persist(){}},p={x:156,y:119};
 assert.ok(interactHouseSurface(g,p));assert.equal(f.surfaceItems[0].lit,true);const source=houseLightSources(g)[0];assert.equal(source.x,156);assert.equal(source.houseFixture,true);
 const saved=JSON.parse(JSON.stringify(f));assert.deepEqual(furnishSurface(saved),f.surfaceItems);interactHouseSurface(g,p);assert.equal(houseLightSources(g).length,0);
});

test('normal Interact reaches the kitchen task and session restore retains its reward flag',()=>{
 const g=new Game(()=>.5);Object.assign(g,{house:defaultHouse(),generatedEnvironment:'house',environment:'house',phase:'play',openingBoard:false,enemies:[],scenery:[],portals:[]});
 const p=g.addPlayer('keyboard'),stove=g.house.furniture.find(f=>f.kind==='stove');Object.assign(p,{x:stove.x+stove.w*.55,y:stove.y+stove.h*.42+24,hp:50,inventory:[{type:'meat',qty:1},{type:'fruit',qty:1}]});
 const coins=p.coins;g.update(.05,{keyboard:{interact:true}});g.update(.05,{keyboard:{}});
 assert.equal(p.coins,coins+15);assert.ok(stove.kitchenQuestComplete);
 const restored=restoreSession(JSON.parse(JSON.stringify(saveSession(g))));assert.ok(restored.house.furniture.some(f=>f.kind==='stove'&&f.kitchenQuestComplete));
});
