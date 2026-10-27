import test from 'node:test';
import assert from 'node:assert/strict';
import {nearbyStorageChest,tickStorageRoom} from '../src/storage-room.mjs';
test('Storage chest prompt and interaction share the same proximity and grounded checks',()=>{
 for(let i=0;i<3;i++){
  const p={hp:100,roomX:[60,160,260][i],roomY:120,roomJumpHeight:0},opened=[];
  const g={players:[p],portals:[],onSound(){},openInventory:(p,n)=>opened.push(n),leaveRoom(){},message(){}};
  assert.equal(nearbyStorageChest(p),i);tickStorageRoom(g,p,{},0,true);assert.deepEqual(opened,[i]);
  p.roomY=131;assert.equal(nearbyStorageChest(p),-1);p.roomY=120;p.roomJumpHeight=1;assert.equal(nearbyStorageChest(p),-1);p.roomJumpHeight=0;p.ui={};assert.equal(nearbyStorageChest(p),-1);
 }
});
