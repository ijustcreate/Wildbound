import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/core.mjs';
import {alleyGate,interactAlley} from '../src/diagon-alley.mjs';
import {LOCKSMITH_DOOR_ROW,LOCKSMITH_SHOP} from '../src/diagon-locksmith.mjs';
import {pirateShip,pirateShipBlocked} from '../src/pirate-ship.mjs';
import {enterWildLands} from '../src/wild-lands.mjs';
import {HOLLOW_ROOM,mountainTrail} from '../src/wild-mountain-layout.mjs';
import {railwayStations} from '../src/railway-station.mjs';
import {trainCars,trainRiderWorld} from '../src/train-track.mjs';
import {trainInteriorBlocked,trainWorldBlocked} from '../src/train-test.mjs';
import {saveSession,restoreSession} from '../src/session.mjs';
import {travelThroughWrongTurn,WRONG_TURN_DESTINATIONS} from '../src/wrong-turn-travel.mjs';

function fixture(two=true){
 const g=new Game(()=>.55,{deferWorld:true});
 const p=g.addPlayer('keyboard','Door traveler'),q=two?g.addPlayer('pad:0','Companion'):null;
 assert.ok(enterWildLands(g,{persistent:true}).ok);
 g.persist=()=>{};g.onSound=()=>{};g.openingBoard=false;
 const t=g.trainTest;t.streamDisabled=true;t.preparing=false;
 return {g,t,p,q};
}

function enterAlley({g,t,p}){
 const gate=alleyGate(g);
 Object.assign(p,{x:gate.x,y:gate.y});
 t.alleyOpened=true;t.alleyOpenedAt=t.time-1;
 assert.ok(interactAlley(g,p));
 assert.equal(t.design.activeRoom,'diagon');
}

function through(g,p,category,stationRoll=.01){
 const at=WRONG_TURN_DESTINATIONS.indexOf(category),rolls=[(at+.5)/WRONG_TURN_DESTINATIONS.length,stationRoll];
 return travelThroughWrongTurn(g,p,()=>rolls.shift());
}

function checkGround(g,p,label){
 assert.equal(trainWorldBlocked(g,p.x,p.y,8,false,false,0,false,p),false,label);
}

test('all thirteen Wrong Turn outcomes are native safe landings from Diagon Alley',()=>{
 assert.equal(WRONG_TURN_DESTINATIONS.length,13);
 for(const category of WRONG_TURN_DESTINATIONS){
  const state=fixture(),{g,t,p,q}=state,groundLoot=[{id:'world-loot',x:5100,y:3900}];
  g.loot=groundLoot;enterAlley(state);const p2Before={x:q.x,y:q.y};
  const outcome=through(g,p,category);
  assert.ok(outcome.ok,category+' · '+outcome.message);
  assert.equal(outcome.category,category);
  const expectedRoom=category==='nocturne'?'diagon':category==='shadow'?'shadow':category==='hollow'?HOLLOW_ROOM:null;
  assert.equal(t.design.activeRoom||null,expectedRoom,category);
  assert.equal(g.portalTransition.effect,'portkey',category);
  if(category==='nocturne'){
   assert.deepEqual({x:q.x,y:q.y},p2Before);
   assert.deepEqual(g.portalTransition.ids,[p.id]);
   assert.ok(p.x>9000&&p.y<5100,'inside the Curios room');
   checkGround(g,p,category);
  }else{
   assert.notDeepEqual({x:q.x,y:q.y},p2Before,category);
   assert.deepEqual(g.portalTransition.ids,[p.id,q.id]);
  }
  if(!expectedRoom)assert.equal(g.loot,groundLoot,'restore the surface actor layer');
  if(category==='summit')assert.ok(mountainTrail(p.x,p.y)?.height>=445,'Greywake summit and trail are immediately walkable');
  if(category==='homestead-bed')assert.ok(p.bedRest&&p.sleeping,'use the real authored homestead bed');
  if(category==='pirate-deck'){
   assert.equal(p.pirateRide?.level,'deck');
   assert.equal(q.pirateRide?.level,'deck');
   assert.equal(p.pirateRide.shipId,pirateShip(g).id);
   assert.equal(pirateShipBlocked(g,p.x,p.y,8,p),false);
  }else if(category==='coach'){
   assert.ok(p.trainRide&&q.trainRide);
   assert.ok(t.engine&&t.speed>0,'propel a safely parked train once boarded');
   assert.equal(trainInteriorBlocked(t,trainCars(t)[p.trainRide.car],p.trainRide.x,p.trainRide.y),false);
  }else if(category!=='homestead-bed'){
   checkGround(g,p,category);
   checkGround(g,q,category+' companion');
  }
  if(category==='shadow'||category==='hollow'){
   assert.equal(t.wildLandsReturn.entryPoints.length,2);
   assert.equal(t.wildLandsReturn.id,expectedRoom);
  }
 }
});

test('the station category draws all eight native stations and keeps a surface companion in place',()=>{
 const {g,t,p,q}=fixture();
 const stations=railwayStations(t.design).map(w=>w.station);
 assert.equal(stations.length,8);
 const other={x:q.x,y:q.y};
 for(const [index,station]of stations.entries()){
  const outcome=through(g,p,'station',(index+.5)/stations.length);
  assert.ok(outcome.ok,station.name);
  assert.equal(outcome.stationId,station.visualId);
  assert.ok(Math.hypot(p.x-station.x,p.y-station.y)<=305,station.name);
  assert.deepEqual({x:q.x,y:q.y},other);
  checkGround(g,p,station.name);
 }
});

test('Wrong Turn enters a moving real coach and restores its native rider after a checkpoint',()=>{
 const {g,t,p,q}=fixture();
 t.speed=85;t.engine=true;t.throttle=.65;
 const outcome=through(g,p,'coach');
 assert.ok(outcome.ok);
 assert.equal(q.trainRide,undefined);
 const before={x:p.x,y:p.y};
 g.update(.05,{});
 assert.ok(p.trainRide);
 assert.ok(Math.hypot(p.x-before.x,p.y-before.y)>2);
 const rebound=trainRiderWorld(trainCars(t),p.trainRide);
 assert.deepEqual({x:p.x,y:p.y},{x:rebound.x,y:rebound.y});
 const restored=restoreSession(JSON.parse(JSON.stringify(saveSession(g))));
 assert.deepEqual(restored.players[0].trainRide,p.trainRide);
 assert.equal(restored.trainTest.engine,true);
});

test('a blocked destination leaves room, characters and undoable threshold attempt unchanged',()=>{
 const state=fixture(),{g,t,p,q}=state;enterAlley(state);
 q.room='storage-fixture';
 const before=g.players.map(({x,y,room})=>({x,y,room}));
 const outcomes=[through(g,p,'coach'),through(g,p,'shadow')];
 assert.ok(outcomes.every(o=>o.ok===false));
 assert.equal(t.design.activeRoom,'diagon');
 assert.deepEqual(g.players.map(({x,y,room})=>({x,y,room})),before);
});

test('a real doorway walk reaches a bed without the held approach input waking the explorer',()=>{
 const state=fixture(false),{g,t,p}=state;enterAlley(state);
 const x=LOCKSMITH_SHOP.x+LOCKSMITH_DOOR_ROW.x,y=LOCKSMITH_SHOP.y+LOCKSMITH_DOOR_ROW.y;
 Object.assign(p,{x,y:y+23,inventory:[{type:'wrong_turn_key',qty:1}]});
 assert.ok(interactAlley(g,p));
 assert.equal(t.wrongTurnDoors.green,true);
 assert.equal(p.inventory.some(i=>i?.type==='wrong_turn_key'),false);
 // This fixture's .55 random roll chooses the bed outcome.
 for(let i=0;i<20&&t.design.activeRoom==='diagon';i++)g.update(.04,{keyboard:{y:-1}});
 assert.equal(t.design.activeRoom,undefined);
 assert.ok(p.bedRest&&p.sleeping);
 g.update(.04,{keyboard:{y:-1}});
 assert.ok(p.bedRest,'Holding the doorway approach still keeps the real bed pose');
 g.update(.04,{keyboard:{}});
 assert.ok(p.bedRest,'Releasing input keeps the explorer asleep');
 g.update(.04,{keyboard:{y:1}});
 assert.equal(p.bedRest,undefined,'The next deliberate movement wakes the explorer');
});

test('an emergency-braked train is never started by a door',()=>{
 const {g,t,p}=fixture(false);
 t.engine=false;t.throttle=0;t.speed=0;t.emergencyBrake=true;
 const before={x:p.x,y:p.y};
 assert.equal(through(g,p,'coach').ok,false);
 assert.deepEqual({x:p.x,y:p.y},before);
 assert.equal(t.engine,false);
 assert.equal(t.emergencyBrake,true);
});
