import test from 'node:test';
import assert from 'node:assert/strict';
import {actorContact} from '../src/contact-shadow.mjs';
test('Standing on furniture puts contact shadow on the support rather than floor',()=>{
 const s=actorContact({}, {x:100,y:200,groundHeight:14},43);
 assert.equal(s.y,187);assert.equal(s.separation,0);
});
test('Jumping leaves shadow on receiving surface and makes it broader and fainter',()=>{
 const g={house:{furniture:[{kind:'bed',x:80,y:180,w:60,h:80,surfaceHeight:14}]}};
 const rest=actorContact(g,{x:100,y:200,groundHeight:14},43);
 const air=actorContact(g,{x:100,y:200,jumpHeight:40},43);
 assert.equal(air.surface,14);assert.equal(air.y,rest.y);
 assert.ok(air.alpha<rest.alpha&&air.rx>rest.rx);
 const below=actorContact(g,{x:100,y:200,jumpHeight:3},43);assert.equal(below.surface,0);
});
test('a projected railway surface receives contact without subtracting its elevation again',()=>{
 const rest=actorContact(null,{x:100,y:180},43,true,0);
 const air=actorContact(null,{x:100,y:180,jumpHeight:32},43,true,0);
 assert.equal(rest.y,181);
 assert.equal(air.y,rest.y);
 assert.ok(air.alpha<rest.alpha&&air.rx>rest.rx);
});
