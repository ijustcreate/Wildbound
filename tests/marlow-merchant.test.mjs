import test from 'node:test';
import assert from 'node:assert/strict';
import {ITEMS,MARLOW_EQUIPMENT} from '../src/items.mjs';
import {marlowVisual} from '../src/traveling-merchant.mjs';

test('Marlow renders as a human-rig actor wearing his own fitted gear',()=>{
 const m={x:400,y:500,faceX:0,faceY:1,name:'Marlow Moss'},actor=marlowVisual(m);
 assert.equal(actor.sprite,'player');assert.equal(actor.kind,'player');assert.equal(actor.equipment,MARLOW_EQUIPMENT);
 for(const [slot,id] of Object.entries(actor.equipment)){assert.equal(ITEMS[id].slot,slot);assert.equal(ITEMS[id].npcOnly,true);}
});
