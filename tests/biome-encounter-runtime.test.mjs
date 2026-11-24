import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,EVENTS} from '../src/core.mjs';
import {BIOME_MIXED_EVENTS as cards,encounterContext} from '../src/biome-encounters.mjs';
import {creatures} from '../src/definitions.mjs';
import {eventAvailable} from '../src/night-cycle.mjs';
import {selectEvent,rememberEvent} from '../src/event-director.mjs';
import {combatPhase} from '../src/enemy-combat-catalog.mjs';
import {saveSession,restoreSession} from '../src/session.mjs';
function setup(zone='forest',n=1){
 const g=new Game(()=>.5);g.environment=zone;for(let i=0;i<n;i++)g.addPlayer(i?'pad:'+i:'keyboard');g.start();
 Object.assign(g,{time:20,openingBoard:false,enemies:[],weather:null,event:null});g.onSound=()=>{};g.persist=()=>{};
 for(const [i,p]of g.players.entries())Object.assign(p,{hp:100,maxHp:100,progress:20,ui:null,x:800+i*24,y:900});
 return g;
}
test('new normal cards append after the saved roster and keep valid native species',()=>{
 const index=EVENTS.findIndex(e=>e.biomeMixed);assert.equal(index,EVENTS.length-cards.length);assert.equal(EVENTS[75].kind,'shore_goblin');assert.ok(EVENTS.findIndex(e=>e.name==='Crossfire patrol')<index);
 for(const e of cards)for(const u of e.enemies)assert.ok(creatures[u.kind],u.kind);
});
test('normal random selection naturally reaches a biome mixed patrol by the fourth combat card',()=>{
 const g=setup();g.eventDirector=null;const plain={name:'Ordinary test patrol',kind:'skeleton',count:1,weight:10};
 const mix=EVENTS.filter(e=>e.biomeMixed&&e.environment==='forest'),pool=[plain,...mix];g.random=()=>0;
 for(let i=0;i<3;i++)rememberEvent(g,plain,0);
 const chosen=selectEvent(g,pool,eventAvailable);assert.ok(pool[chosen].biomeMixed);rememberEvent(g,pool[chosen],chosen);
 assert.equal(selectEvent(g,pool,eventAvailable),0,'an ordinary card separates mixed patrols');
 const restored=restoreSession(JSON.parse(JSON.stringify(saveSession(g))));assert.deepEqual(restored.eventDirector,g.eventDirector);
});
test('older coverage saves introduce new mixed cards without back-to-back patrols',()=>{
 const g=setup();const pool=[{name:'Old card',kind:'skeleton',count:1,weight:1},...EVENTS.filter(e=>e.biomeMixed&&e.environment==='forest')];g.encounteredEvents={'Old card':true};g.eventDirector=null;g.random=()=>0;
 const first=selectEvent(g,pool,eventAvailable);assert.ok(pool[first].biomeMixed);rememberEvent(g,pool[first],first);assert.equal(selectEvent(g,pool,eventAvailable),0);
});
test('each biome can naturally select and spawn its own two mixed profiles',()=>{
 for(const zone of new Set(cards.map(e=>e.environment))){
  const g=setup(zone);const expected=EVENTS.filter(e=>e.biomeMixed&&e.environment===zone);
  for(const event of expected){
   const index=EVENTS.indexOf(event);g.enemies=[];g.event=null;g.localWorld={pack:{events:[index]}};
   assert.ok(eventAvailable(encounterContext(g),event),event.name+' available');g.spawnEvent();
   assert.equal(g.event?.name,event.name);assert.equal(g.enemies.length,3,event.name+' full mid-run solo trio');
   assert.equal(new Set(g.enemies.map(e=>e.group)).size,1);assert.ok(g.enemies.every(e=>e.biomeMixed&&e.hp===e.maxHp&&e.spawnReadyAt>=g.time+1));
   if(event.name==='Shellbreakers on the strand'){assert.equal(g.enemies.find(e=>e.kind==='crab').wildlifePackKind,'crab');assert.equal(g.enemies.find(e=>e.kind==='skeleton_deckhand').wildlifePackKind,undefined);}
  }
 }
});
test('failed placement consumes no card, spawns no fragments and changes no floor scenery',()=>{
 const g=setup(),event=EVENTS.find(e=>e.biomeMixed&&e.environment==='forest'),before=JSON.stringify(g.scenery),draws=g.eventDirector?.draws||0;
 g.blocked=()=>true;assert.equal(g.spawnEvent(EVENTS.indexOf(event)),false);assert.equal(g.enemies.length,0);assert.equal(g.eventDirector?.draws||0,draws);assert.equal(JSON.stringify(g.scenery),before);
});
test('all members get a safe arrival delay, including native pack casters',()=>{
 const g=setup('caverns'),event=EVENTS.find(e=>e.name==='The crystal sentries');g.spawnEvent(EVENTS.indexOf(event));assert.equal(g.enemies.length,3);
 for(let i=0;i<10;i++){g.time+=.05;g.tickCombatActors(.05);assert.ok(g.enemies.every(e=>!['windup','active'].includes(combatPhase(e))));}
});


test('normal Wild Lands rolls use the actual ice and swamp regions, including local crocodile water',async()=>{
 const {enterWildLands}=await import('../src/wild-lands.mjs'),{waterAt}=await import('../src/environment.mjs');
 const g=setup();assert.ok(enterWildLands(g).ok);g.enemies=[];
 for(const [x,y,name]of [[9050,5380,'Hunters of the white drift'],[13200,2900,'Hunters of the reedbank']]){
  const p=g.players[0];delete p.trainRide;Object.assign(p,{x,y,ui:null,progress:20,trainGround:0,groundHeight:0});g.enemies=[];g.event=null;g.roll={playerId:p.id,resolved:true};
  const index=EVENTS.findIndex(e=>e.name===name);g.localWorld={pack:{events:[index]}};g.spawnEvent();g.localWorld=null;g.roll=null;
  assert.equal(g.event?.name,name);assert.equal(g.enemies.length,3);assert.equal(g.generatedEnvironment,'forest','the world itself is not rewritten');
  assert.ok(g.enemies.every(e=>Math.hypot(e.x-p.x,e.y-p.y)<650),JSON.stringify({name,p:[p.x,p.y],units:g.enemies.map(e=>({kind:e.kind,x:e.x,y:e.y}))}));
  const croc=g.enemies.find(e=>e.kind==='crocodile');if(croc)assert.equal(waterAt(g,croc.x,croc.y),'water');
 }
});


test('older saved definitions gain missing native biome groups without replacing edited cards',async()=>{
 const {applyDefinitions}=await import('../src/definitions.mjs');const current=structuredClone(EVENTS),legacy=current.filter(e=>!e.biomeMixed);legacy[0].hp=321;
 applyDefinitions({version:1,events:legacy},current,{});
 assert.equal(current.filter(e=>e.biomeMixed).length,20);assert.equal(current[0].hp,321);assert.deepEqual(current.slice(0,legacy.length).map(e=>e.name),legacy.map(e=>e.name));
});
