import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/core.mjs';
import {npcDialogueView} from '../src/npc-quests.mjs';
import {saveSession,restoreSession} from '../src/session.mjs';
import {CONDUCTOR_THROTTLE,requestConductorDestination,trainRouteStations} from '../src/train-autostop.mjs';
import {trainConductor} from '../src/train-conductor.mjs';
import {trainInterior} from '../src/train-design.mjs';
import {trainInteraction} from '../src/train-test.mjs';
import {requestRailwayTicket} from '../src/train-ticket-service.mjs';
import {trainCars,trainWorld} from '../src/train-track.mjs';
import {enterWildLands} from '../src/wild-lands.mjs';

function fixture(){
 const g=new Game(()=>.5),p=g.addPlayer('keyboard','Passenger'),friend=g.addPlayer('pad:0','Cab explorer');
 g.start();g.openingBoard=false;g.onSound=()=>{};g.persist=()=>{};
 assert.ok(enterWildLands(g,{persistent:true}).ok);
 return {g,p,friend,t:g.trainTest};
}

function atConductor(g,p){
 const cars=trainCars(g.trainTest),conductor=trainConductor(g,cars);
 p.trainRide={...conductor.ride};
 Object.assign(p,trainWorld(conductor.car,p.trainRide.x,p.trainRide.y));
 return cars;
}

function openChoices(g,p){
 assert.ok(trainInteraction(g,p,atConductor(g,p)));
 assert.equal(npcDialogueView(g,p).choices[0].label,'Which station?');
 g.inventoryAction(p,'use');
 return npcDialogueView(g,p).choices;
}

test('the conductor lists all active stations, accelerates from park and stops at the exact selected marker',()=>{
 const {g,p,t}=fixture(),stops=trainRouteStations(t),station=stops[1];
 t.distance=station.s-460;
 const before=t.distance,choices=openChoices(g,p);
 assert.equal(stops.length,8);assert.deepEqual(choices.slice(0,stops.length).map(choice=>choice.label),stops.map(stop=>stop.name));
 g.inventoryAction(p,'choice:1');
 assert.equal(p.ui,null);assert.equal(p.npcQuests.train_students.received.conductor,true);
 assert.equal(t.distance,before);assert.equal(t.speed,0);assert.equal(t.throttle,CONDUCTOR_THROTTLE);
 assert.equal(t.conductorDestination.stationId,station.id);
 let seenCruise=false,seenBrake=false;
 for(let i=0;i<450&&t.engine;i++){
  const x=t.distance,v=t.speed;
  g.update(.05,{});
  assert.ok(t.distance>=x&&t.distance<=station.s);
  assert.ok(t.speed-v<=t.design.acceleration*.05+.005);
  assert.ok(v-t.speed<=t.design.brakePower*.05+.005);
  seenCruise||=Math.abs(t.speed-CONDUCTOR_THROTTLE*t.design.maxSpeed)<.001;
  seenBrake||=t.speed<v-.005;
 }
 assert.ok(seenCruise&&seenBrake);assert.equal(t.distance,station.s);assert.equal(t.speed,0);assert.equal(t.engine,false);
 assert.equal(t.lastStationStop.id,station.id);assert.equal(t.conductorDestination,undefined);
 const first=t.time;
 assert.equal(t.conductorWhistles.remaining,2);
 for(let i=0;i<35;i++)g.update(.05,{});
 assert.equal(t.conductorWhistles.remaining,2);
 for(let i=0;i<3&&t.conductorWhistles.remaining===2;i++)g.update(.05,{});
 assert.equal(t.conductorWhistles.remaining,1);
 assert.ok(t.time-first>=1.79&&t.time-first<1.9);
 const second=t.time;
 for(let i=0;i<39&&t.conductorWhistles;i++)g.update(.05,{});
 assert.equal(t.conductorWhistles,undefined);
 assert.ok(t.time-second>=1.75&&t.time-second<1.9);
});

test('a moving train retains speed on selection, its exact destination survives save, and manual takeover clears it',()=>{
 const {g,p,t}=fixture(),station=trainRouteStations(t)[3];
 Object.assign(t,{distance:station.s-600,engine:true,speed:130,throttle:.85});
 const choices=openChoices(g,p),choice=choices.findIndex(c=>c.action==='station:'+station.id);
 g.inventoryAction(p,'choice:'+choice);
 assert.equal(t.speed,130);assert.equal(t.distance,station.s-600);assert.equal(t.throttle,CONDUCTOR_THROTTLE);
 g.update(.05,{});assert.equal(t.speed,128);
 const restored=restoreSession(JSON.parse(JSON.stringify(saveSession(g)))),r=restored.trainTest;
 assert.equal(r.conductorDestination.stationId,station.id);assert.equal(r.conductorDestination.distance,station.s);
 const cab=trainCars(r)[0],console=trainInterior(r.design,cab).find(item=>item.kind==='console'),driver=restored.players[1];
 driver.trainRide={car:cab.index,x:console.x,y:console.y};
 const distance=r.distance,speed=r.speed;
 assert.ok(trainInteraction(restored,driver));
 assert.equal(r.conductorDestination,undefined);assert.equal(r.autoStationStop,undefined);
 assert.equal(r.driver,driver.id);assert.equal(driver.trainRide.driving,true);
 assert.equal(r.distance,distance);assert.equal(r.speed,speed);assert.equal(r.engine,true);
 assert.equal(requestConductorDestination(restored,restored.players[0],station.id).ok,false);
});

test('a station too close for the current speed is scheduled for its next safe pass and an empty paid call still works',()=>{
 const {g,p,friend,t}=fixture(),stops=trainRouteStations(t),station=stops[1];
 Object.assign(t,{distance:station.s-10,engine:true,speed:120,throttle:.7});
 atConductor(g,p);assert.ok(requestConductorDestination(g,p,station.id).ok);
 assert.ok(Math.abs(t.conductorDestination.distance-station.s-t.route.length)<1e-8);
 const blocked=requestRailwayTicket(g,friend,stops[4].id,5);
 assert.equal(blocked.reason,'occupied');
 assert.equal(t.conductorDestination.stationId,station.id);
 delete p.trainRide;friend.coins=20;
 assert.ok(requestRailwayTicket(g,friend,stops[4].id,5).ok);
 assert.equal(friend.coins,15);assert.ok(t.railwayTicket);assert.equal(t.conductorDestination,undefined);
});
