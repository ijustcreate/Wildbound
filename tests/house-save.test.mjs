import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/core.mjs';
import {defaultHouse,saveHouseVersion,preserveHouseDraft,flushHouseStorage,loadHouseStorage,activeHouse,houseDraft,HOUSE_KEY,HOUSE_STATE_KEY} from '../src/house-design.mjs';
import {applyActiveHouse,applyChangedHouse} from '../src/apply-house.mjs';

test('House library and unfinished draft recover from desktop storage after browser storage changes',async()=>{
 const oldStorage=globalThis.localStorage,oldDesktop=globalThis.desktop,data=new Map();let disk;
 globalThis.localStorage={getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)};
 globalThis.desktop={saveHouseDesigns:async s=>{disk=structuredClone(s);},loadHouseDesigns:async()=>disk};
 try{const house=defaultHouse();house.name='My saved house';const id=saveHouseVersion(house);house.furniture[0].x+=16;preserveHouseDraft(house,id);await flushHouseStorage();data.clear();await loadHouseStorage();assert.equal(activeHouse().name,'My saved house');assert.equal(houseDraft().house.furniture[0].x,house.furniture[0].x);assert.ok(data.has(HOUSE_KEY)&&data.has(HOUSE_STATE_KEY));}
 finally{globalThis.localStorage=oldStorage;globalThis.desktop=oldDesktop;}
});

test('Live house application relocates blocked actors while preserving progress and inventory',()=>{
 const oldStorage=globalThis.localStorage,data=new Map();globalThis.localStorage={getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)};
 try{const g=new Game();g.environment='house';const p=g.addPlayer('keyboard');g.start();g.house.doors[0].open=true;assert.equal(applyChangedHouse(g),false);assert.equal(g.house.doors[0].open,true);p.x=600;p.y=600;p.progress=13;const inventory=JSON.stringify(p.inventory),house=defaultHouse();house.furniture.push({kind:'sofa',x:576,y:576,w:64,h:64});saveHouseVersion(house);assert.equal(applyChangedHouse(g),true);assert.equal(g.blocked(p.x,p.y,8,false,false,false,0),false);assert.equal(p.progress,13);assert.equal(JSON.stringify(p.inventory),inventory);g.generatedEnvironment='temple';assert.equal(applyActiveHouse(g),false);}
 finally{globalThis.localStorage=oldStorage;}
});
