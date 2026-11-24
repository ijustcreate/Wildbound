import assert from 'node:assert/strict';
import test from 'node:test';
import {Game} from '../src/core.mjs';
import {saveSession,restoreSession} from '../src/session.mjs';
import {trainRouteStations} from '../src/train-autostop.mjs';
import {railwayBridgeState} from '../src/train-bridges.mjs';
import {advanceRailwayTicket,finishRailwayTicket,observeRailwayTicketView,railwayTicketStatus,requestRailwayTicket} from '../src/train-ticket-service.mjs';
import {repairTrain} from '../src/train-test.mjs';
import {trainCars} from '../src/train-track.mjs';
import {enterWildLands} from '../src/wild-lands.mjs';

const fare=5,dt=.05;

function fixture(){
 const g=new Game(()=>.5),buyer=g.addPlayer('keyboard','Ticket buyer'),friend=g.addPlayer('pad:0','Ticket friend');
 g.start();g.openingBoard=false;g.persist=()=>{};g.onSound=()=>{};
 assert.ok(enterWildLands(g,{persistent:true}).ok);
 buyer.coins=20;friend.coins=20;
 const t=g.trainTest,stops=trainRouteStations(t);
 return {g,buyer,friend,t,stops};
}

function moveNear(p,stop){Object.assign(p,{x:stop.x,y:stop.y-380});}

test('buying a nearby train uses its current position and brakes at exactly ten seconds',()=>{
 const {g,buyer,friend,t,stops}=fixture(),stop=stops[1];
 moveNear(buyer,stop);moveNear(friend,stop);t.distance=stop.s-310;
 const before=t.distance,started=t.time;
 assert.ok(requestRailwayTicket(g,buyer,stop.id,fare).ok);
 assert.equal(t.distance,before);assert.equal(buyer.coins,15);assert.equal(t.railwayTicket.staged,undefined);
 assert.equal(railwayTicketStatus(g,stop.id).pending.name,stop.name);
 assert.equal(requestRailwayTicket(g,friend,stops[2].id,fare).reason,'pending');
 let prior=t.distance,speed=t.speed;
 for(let i=0;i<199;i++){
  g.update(dt,{});
  assert.ok(t.distance>=prior&&t.distance<stop.s);
  assert.ok(t.speed-speed<=t.design.acceleration*dt+.0001&&speed-t.speed<=t.design.brakePower*dt+.0001);
  prior=t.distance;speed=t.speed;
 }
 assert.ok(t.railwayTicket);assert.equal(railwayTicketStatus(g,stop.id).atRequestedPlatform,false);
 g.update(dt,{});
 assert.ok(Math.abs(t.time-started-10)<1e-8);assert.ok(t.lastStationStop);assert.equal(t.lastStationStop.id,stop.id);
 assert.equal(t.distance,stop.s);assert.equal(t.speed,0);assert.equal(t.engine,false);assert.equal(t.railwayTicket,undefined);
 assert.equal(railwayTicketStatus(g,stop.id).atRequestedPlatform,true);
 assert.equal(requestRailwayTicket(g,buyer,stop.id,fare).reason,'at-platform');assert.equal(buyer.coins,15);
});

test('all eight active markers support a distant off-camera approach with unchanged co-op positions',()=>{
 const {g,buyer,friend,t,stops}=fixture();
 assert.equal(stops.length,8);
 for(const [index,stop] of stops.entries()){
  const far=stops[(index+4)%stops.length];
  t.distance=far.s;t.speed=0;
  moveNear(buyer,stop);moveNear(friend,far);
  const oldFriend=[friend.x,friend.y],view={left:buyer.x-470,top:buyer.y-340,right:buyer.x+470,bottom:buyer.y+340};
  observeRailwayTicketView(t,view,[buyer.id]);
  assert.ok(requestRailwayTicket(g,buyer,stop.id,0).ok,stop.name);
  assert.equal(t.railwayTicket.staged,true,stop.name);
  assert.deepEqual([friend.x,friend.y],oldFriend);
  assert.ok(trainCars(t).every(car=>{
   const radius=Math.hypot(car.length,car.width)*.5;
   return car.x+radius<view.left||car.x-radius>view.right||car.y+radius<view.top||car.y-radius>view.bottom;
  }),stop.name+' hidden staging');
  for(let i=0;i<200;i++){assert.ok(advanceRailwayTicket(g,dt));finishRailwayTicket(g);}
  assert.equal(t.speed,0);assert.equal(t.lastStationStop.id,stop.id);assert.equal(t.railwayTicket,undefined);
 }
});

test('seat occupation vetoes payment and a new rider refunds one saved pending payment',()=>{
 const {g,buyer,friend,t,stops}=fixture(),station=stops[5];
 t.distance=stops[1].s;moveNear(buyer,station);moveNear(friend,stops[1]);
 friend.trainRide={car:2,x:0,y:0};
 assert.equal(requestRailwayTicket(g,buyer,station.id,fare).reason,'occupied');
 assert.equal(buyer.coins,20);assert.equal(t.distance,stops[1].s);
 delete friend.trainRide;
 assert.ok(requestRailwayTicket(g,buyer,station.id,fare).ok);
 for(let i=0;i<51;i++)g.update(dt,{});
 const restored=restoreSession(JSON.parse(JSON.stringify(saveSession(g)))),copy=restored.players[0],other=restored.players[1],r=restored.trainTest;
 let saves=0;restored.persist=()=>saves++;restored.onSound=()=>{};
 assert.equal(copy.coins,15);assert.ok(Math.abs(r.railwayTicket.elapsed-2.55)<1e-8);
 const before=r.distance;
 other.trainRide={car:2,x:0,y:0};restored.update(dt,{});
 assert.equal(copy.coins,20);assert.equal(r.railwayTicket,undefined);
 assert.ok(r.distance>=before&&r.distance-before<r.design.maxSpeed*dt+1,'a passenger prevented any relocation');
 assert.equal(saves,1);restored.update(dt,{});assert.equal(copy.coins,20);assert.equal(saves,1);
});

test('relative train location is derived from the active loop and a reset refunds the caller',()=>{
 const {g,buyer,t,stops}=fixture(),first=stops[0],last=stops.at(-1);
 t.distance=first.s-10;t.speed=40;
 const relative=railwayTicketStatus(g,first.id);
 assert.equal(relative.lastPassed.id,last.id);assert.equal(relative.lastPassed.number,8);
 assert.equal(relative.stopsAway,1);assert.equal(relative.direction,'behind');assert.ok(relative.compass);
 assert.equal(railwayTicketStatus(g,last.id).direction,'here');
 assert.equal(requestRailwayTicket(g,buyer,'inactive-station',fare).reason,'unavailable');
 assert.equal(requestRailwayTicket(g,buyer,first.id,25).reason,'funds');
 moveNear(buyer,first);assert.ok(requestRailwayTicket(g,buyer,first.id,fare).ok);
 repairTrain(g);assert.equal(buyer.coins,20);assert.equal(t.railwayTicket,undefined);
 const state=railwayBridgeState(t.design);
 for(let i=0;i<Math.ceil(t.route.length/48);i++)state.broken.add(t.route.id+':'+i);
 assert.equal(requestRailwayTicket(g,buyer,first.id,fare).reason,'track');assert.equal(buyer.coins,20);
});
