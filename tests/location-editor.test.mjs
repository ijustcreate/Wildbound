import test from 'node:test';
import assert from 'node:assert/strict';
import {locationTemplate} from '../src/location-editor.mjs';
import {EDITABLE_LOCATIONS,validateLocationDesign,saveLocationDesign,preserveLocationDraft,locationLibrary,activeLocationDesign,applyDungeonDesign,locationFloorBlocked,LOCATION_DESIGN_KEY} from '../src/location-designs.mjs';
const memory=new Map();globalThis.localStorage={getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,v)};
test('all location templates are reachable and drafts remain separate from active layouts and the house library',async()=>{
 memory.clear();let disk;globalThis.desktop={saveLocationDesigns:async d=>disk=structuredClone(d)};
 for(const {id}of EDITABLE_LOCATIONS){const d=await locationTemplate(id);assert.equal(validateLocationDesign(d),'',id);preserveLocationDraft(d);assert.equal(activeLocationDesign(id),null);await saveLocationDesign(d);assert.equal(activeLocationDesign(id).id,id);assert.ok(disk.layouts[id]);}
 assert.ok(locationLibrary().drafts.mausoleum);assert.equal(memory.size,1);assert.ok(memory.has(LOCATION_DESIGN_KEY));delete globalThis.desktop;
});
test('grid edits affect collision, reject unreachable rewards, and preserve live crypt progress at world scale',async()=>{
 memory.clear();const d=await locationTemplate('mausoleum'),exit=d.markers.find(m=>m.role==='exit'),chest=d.markers.find(m=>m.role==='chest');
 await saveLocationDesign(d);assert.equal(locationFloorBlocked('mausoleum',exit.x,exit.y),false);assert.equal(locationFloorBlocked('mausoleum',0,0),true);
 const bad=structuredClone(d),cx=Math.floor(chest.x/16),cy=Math.floor(chest.y/16);for(const i of[(cy-1)*d.width+cx,(cy+1)*d.width+cx,cy*d.width+cx-1,cy*d.width+cx+1])bad.tiles[i]=0;assert.ok(validateLocationDesign(bad));await assert.rejects(()=>saveLocationDesign(bad));
 const enemy={x:0,y:0,hp:17,kind:'skeleton'},room={worldVersion:1,tile:32,chest:{opened:true,items:[{type:'arrow',qty:5}]},enemies:[enemy],explored:[2,3]};applyDungeonDesign(room,'mausoleum',{preserveProgress:true});
 assert.equal(room.tile,32);assert.equal(room.exit.x,exit.x*2);assert.equal(room.chest.x,chest.x*2);assert.equal(room.chest.opened,true);assert.equal(room.chest.items[0].qty,5);assert.equal(room.enemies[0],enemy);assert.equal(enemy.hp,17);assert.equal(enemy.x,room.exit.x);assert.deepEqual(room.explored,[2,3]);
});
