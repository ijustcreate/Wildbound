import test from 'node:test';
import assert from 'node:assert/strict';
import {storagePanelBox,storageRoomCamera,storageRoomRepresentative} from '../src/storage-view.mjs';
test('storage stays narrow for part of a party and widens only when everyone shares its room',()=>{
 const p={id:1,room:9},q={id:2,room:null},g={players:[p,q],portals:[{id:9,owner:1}]},bounds={width:1600,height:900},rail={x:8,y:8,width:800,height:800,side:'left'};
 const narrow=storagePanelBox(g,p,bounds,rail);assert.equal(narrow.width,420);assert.equal(narrow.side,'left');
 q.room=10;assert.equal(storagePanelBox(g,p,bounds,rail).width,420);
 q.room=9;const shared=storagePanelBox(g,p,bounds,rail);assert.equal(shared.width,960);assert.equal(shared.side,'center');
 assert.equal(storageRoomRepresentative(g,p),true);assert.equal(storageRoomRepresentative(g,q),false);
 p.ui={panel:'pack'};assert.equal(storageRoomRepresentative(g,q),true);
});
test('storage camera preserves the main world zoom in both narrow and shared views',()=>{
 const p={id:1,room:9,roomX:160,roomY:150},g={players:[p]};
 for(const width of [100,200,460]){const c=storageRoomCamera(g,p,width,300,1.7);assert.equal(c.zoom,1.7);assert.ok(c.x>=0&&c.x<=320);assert.ok(c.y>=0&&c.y<=240);}
});
