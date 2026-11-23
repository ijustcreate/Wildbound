import test from 'node:test';
import assert from 'node:assert/strict';
import {realmWorld} from '../src/realm-layout.mjs';
import {dressShadowForest,shadowPathDistance} from '../src/shadow-forest-layout.mjs';
import {SHADOW_THICKET_BUDGET} from '../src/shadow-thickets.mjs';

test('dense root beds are deterministic, layered, bounded and leave their full silhouettes off routes',()=>{
 for(const seed of [1,22,42,917,3001]){
  const w=realmWorld(seed,'shadow'),s=w.realmState,plants=w.scenery.filter(p=>p.shadowThicket);assert.deepEqual(w,realmWorld(seed,'shadow'));
  assert.ok(plants.length>=100&&plants.length<=SHADOW_THICKET_BUDGET,seed+': '+plants.length);assert.ok(w.scenery.length<=206+SHADOW_THICKET_BUDGET);
  const groups=new Map();
  for(const p of plants){
   const radius=p.size*.38;assert.ok(shadowPathDistance(s,p.x,p.rootY)>=44+radius);assert.equal(w.terrain[Math.floor(p.rootY/32)*50+Math.floor(p.x/32)],'shadow_soil');
   assert.ok(Math.hypot(p.x-800,(p.rootY-816)*1.1)>=230+radius);
   assert.ok(s.enchantedPOIs.every(q=>Math.hypot(p.x-q.x,(p.rootY-q.y)*1.15)>=q.radius+radius));assert.ok(Math.hypot(p.x-s.enchantedExit.x,p.rootY-s.enchantedExit.y)>=84+radius);
   assert.equal(p.collisionWidth,0);assert.equal(p.collisionDepth,0);
   const host=w.scenery.find(q=>q.id===p.thicketHost);assert.ok(host);assert.ok(Math.hypot(p.x-host.x,p.rootY-host.rootY)<100);
   if(!groups.has(p.thicketHost))groups.set(p.thicketHost,[]);groups.get(p.thicketHost).push(p);
  }
  assert.ok([...groups.values()].filter(a=>a.length>=4&&new Set(a.map(p=>p.thicketLayer)).size>=2).length>=8);
 }
});
test('older expeditions gain plants once without moving old props or restoring removed plants',()=>{
 const w=realmWorld(42,'shadow');w.scenery=w.scenery.filter(p=>!p.shadowThicket);delete w.realmState.shadowThicketVersion;const before=structuredClone(w.scenery),terrain=[...w.terrain];
 assert.ok(dressShadowForest(w)>100);assert.deepEqual(w.scenery.slice(0,before.length),before);assert.deepEqual(w.terrain,terrain);w.scenery.pop();const count=w.scenery.length;assert.equal(dressShadowForest(w),0);assert.equal(w.scenery.length,count);
});
test('authored layouts opt out of automatic dense planting',()=>{
 const w=realmWorld(42,'shadow');w.scenery=w.scenery.filter(p=>!p.shadowThicket);delete w.realmState.shadowThicketVersion;w.realmState.underworldAuthored=true;const before=structuredClone(w);assert.equal(dressShadowForest(w),0);assert.deepEqual(w,before);
});
