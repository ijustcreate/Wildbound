import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/core.mjs';
import {enterWildLands} from '../src/wild-lands.mjs';
import {PIRATE_SHIP_BERTH,pirateShip,pirateShipBlocked,pirateShipPoint} from '../src/pirate-ship.mjs';
import {wildLandsSurfaceAt,switchWildLandsLayer} from '../src/wild-lands-world.mjs';
import {HOLLOW_ROOM} from '../src/wild-mountain-layout.mjs';
import {actorRadius} from '../src/navigation.mjs';
import {meleeBodyRadius} from '../src/melee-geometry.mjs';
import {SPECIES_ATTACKS} from '../src/enemy-species-combat.mjs';
import {saveSession,restoreSession} from '../src/session.mjs';
import {CUES} from '../src/sound-bank.mjs';

const local=(x,y)=>pirateShipPoint(PIRATE_SHIP_BERTH,x,y);
const find=g=>g.enemies.find(e=>e.tickTockCrocodile);
const tick=(g,n)=>{for(let i=0;i<n;i++)g.update(.05,{});};
function setup(){
 const g=new Game(()=>.5,{deferWorld:true}),p=g.addPlayer('keyboard'),audio=[];
 g.persist=()=>{};g.onSound=(name,actor)=>{if(name.startsWith('crocodile'))audio.push([name,actor?.id,g.time]);};
 assert.ok(enterWildLands(g,{persistent:true,homeStart:true}).ok);
 return {g,p,audio};
}

test('Tick-Tock warms only by the ocean ship and uses positional alternating clock foley',()=>{
 const {g,p,audio}=setup(),d=g.trainTest.design;
 tick(g,16);assert.equal(find(g),undefined);assert.equal(audio.length,0);
 Object.assign(p,local(-130,-245),{swimming:true});tick(g,32);
 const e=find(g);
 assert.equal(e.name,'Tick-Tock');assert.equal(e.swimming,true);
 assert.equal(wildLandsSurfaceAt(d,e.x,e.y),'water');
 assert.equal(g.enemies.filter(a=>a.tickTockCrocodile).length,1);
 assert.deepEqual(audio.slice(0,3).map(a=>[a[0],a[1]]),[['crocodileTick',e.id],['crocodileTock',e.id],['crocodileTick',e.id]]);
 assert.ok(audio[1][2]-audio[0][2]>=.55);
 assert.equal(CUES.crocodileTick.distance,580);
 assert.notEqual(CUES.crocodileTick.files[0],CUES.crocodileTock.files[0]);
 const count=audio.length;
 Object.assign(p,{x:8200,y:7040,swimming:false});tick(g,18);
 assert.equal(audio.length,count);assert.equal(e.tickTockSleeping,true);
 switchWildLandsLayer(g,HOLLOW_ROOM);tick(g,18);
 assert.equal(find(g),undefined);assert.equal(audio.length,count);
 switchWildLandsLayer(g,null);
 assert.equal(find(g),e,'Surface actor survives a cave visit');
});

test('The giant uses a native telegraphed rush, existing damage, and a larger body without biting deck riders',()=>{
 const {g,p}=setup(),deck=g.addPlayer('pad:0');
 Object.assign(p,local(-130,-245),{swimming:true});
 deck.pirateRide={shipId:'portal-island',level:'deck',x:-220,y:-80};
 tick(g,21);
 const e=find(g),normal={kind:'crocodile'};
 assert.equal(actorRadius(e),actorRadius(normal)*3);
 assert.equal(meleeBodyRadius(e),meleeBodyRadius(normal)*3);
 assert.equal(e.speciesCombat.phase,'windup');
 assert.equal(e.speciesCombat.width,SPECIES_ATTACKS.crocodile.width*2*3);
 assert.ok(e.speciesCombat.reach>SPECIES_ATTACKS.crocodile.range*2.9);
 assert.equal(p.hp,p.maxHp);
 tick(g,46);
 assert.ok(p.hp<p.maxHp);
 assert.equal(deck.hp,deck.maxHp);
 assert.equal(wildLandsSurfaceAt(g.trainTest.design,e.x,e.y),'water');
 const ship=pirateShip(g),to=local(-130,0);
 g.moveActor(e,to.x-e.x,to.y-e.y);
 assert.equal(pirateShipBlocked(g,e.x,e.y,actorRadius(e),null),false);
 assert.equal(wildLandsSurfaceAt(g.trainTest.design,e.x,e.y),'water');
 e.hp=0;g.enemyLoot(e);
 const fresh=restoreSession(JSON.parse(JSON.stringify(saveSession(g))));
 assert.equal(fresh.trainTest.tickTockDefeated,true);
 tick(fresh,24);
 assert.equal(fresh.enemies.filter(a=>a.tickTockCrocodile&&a.hp>0).length,0);
});
