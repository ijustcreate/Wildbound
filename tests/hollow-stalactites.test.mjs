import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/core.mjs';
import {enterWildLands} from '../src/wild-lands.mjs';
import {switchWildLandsLayer} from '../src/wild-lands-world.mjs';
import {HOLLOW_ROOM,hollowSurface,mountainTerrainBlocked} from '../src/wild-mountain-layout.mjs';
import {pirateShipBlocked} from '../src/pirate-ship.mjs';
import {restoreSession,saveSession} from '../src/session.mjs';

const step=(g,n)=>{for(let i=0;i<n;i++)g.update(.05,{});};
test('Smugglers’ Hollow one-shot ceiling hazards are dry, telegraphed, avoidable and resumable',()=>{
 const g=new Game(()=>.5,{deferWorld:true}),p=g.addPlayer('keyboard','Explorer');
 g.persist=()=>{};g.onSound=()=>{};
 assert.ok(enterWildLands(g,{persistent:true,homeStart:true}).ok);
 step(g,2);assert.equal(g.trainTest.hollowStalactites,undefined);
 switchWildLandsLayer(g,HOLLOW_ROOM);Object.assign(p,{x:8110,y:5564});step(g,2);
 const t=g.trainTest,hazards=t.hollowStalactites;
 assert.equal(hazards.length,5);
 for(const h of hazards){
  assert.equal(h.hazardState,'idle');
  assert.equal(hollowSurface(h.x,h.rootY),'grass');
  assert.equal(mountainTerrainBlocked(t.design,h.x,h.rootY,28),false);
  assert.equal(pirateShipBlocked(g,h.x,h.rootY,28,null),false);
 }
 const [dodged,hit]=hazards;
 Object.assign(p,{x:dodged.x,y:dodged.rootY});step(g,20);
 assert.equal(dodged.hazardState,'warning');assert.equal(p.hp,p.maxHp);
 Object.assign(p,{x:8110,y:5564});step(g,30);
 assert.equal(dodged.hazardState,'spent');assert.equal(p.hp,p.maxHp);

 Object.assign(p,{x:hit.x,y:hit.rootY});step(g,20);
 assert.equal(hit.hazardState,'warning');assert.equal(p.hp,p.maxHp);
 const restored=restoreSession(JSON.parse(JSON.stringify(saveSession(g)))),hero=restored.players[0],q=restored.trainTest;
 restored.persist=()=>{};restored.onSound=()=>{};
 assert.equal(q.hollowStalactites[1].hazardTime,hit.hazardTime);
 step(restored,32);
 assert.equal(q.hollowStalactites[1].hazardState,'spent');assert.ok(hero.hp<hero.maxHp);
 const hp=hero.hp;step(restored,24);assert.equal(hero.hp,hp);
 switchWildLandsLayer(restored,null);step(restored,2);
 assert.equal(q.hollowStalactites[1].hazardState,'spent');
 switchWildLandsLayer(restored,HOLLOW_ROOM);step(restored,3);
 assert.equal(q.hollowStalactites[0].hazardState,'spent');assert.equal(hero.hp,hp);
});
