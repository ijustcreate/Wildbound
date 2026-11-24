import assert from 'node:assert/strict';
import test from 'node:test';
import {footstepMaterial} from '../src/audio.mjs';
import {MultiplayerCamera} from '../src/multiplayer-camera.mjs';
import {
 PIRATE_CAVE_BERTH,PIRATE_SHIP_BERTH,PIRATE_SHIP_LAYOUT,interactPirateShip,movePirateShipPlayer,
 piratePlankHeight,pirateShip,pirateShipBlocked,pirateShipPoint,pirateShipPrompt,stepOntoPiratePlank,
 syncPirateShipPlayer,tickPirateShip,tickPirateShipPlayer,
} from '../src/pirate-ship.mjs';

const layout=PIRATE_SHIP_LAYOUT;
function fixture(room){
 const player={hp:10,x:0,y:0};
 const g={players:[player],trainTest:{time:0,design:{wildLands:true,activeRoom:room}}};
 const ship=pirateShip(g);
 const put=(x,y)=>Object.assign(player,pirateShipPoint(ship,x,y));
 const walk=(x,y)=>movePirateShipPlayer(g,player,x*Math.cos(ship.a)-y*Math.sin(ship.a),x*Math.sin(ship.a)+y*Math.cos(ship.a));
 const advance=(seconds)=>{for(let i=0;i<Math.ceil(seconds/.05);i++){
  g.trainTest.time+=.05;
  tickPirateShip(g,.05);
  tickPirateShipPlayer(g,player,{x:0,y:0},.05,false);
 }};
 return {g,player,ship,put,walk,advance};
}

test('dry approach boards the connected plank at both moorings and hull cannot be crossed from water',()=>{
 for(const room of [undefined,PIRATE_CAVE_BERTH.id]){
  const {g,player,ship,put,walk}=fixture(room),p=layout.plank;
  assert.equal(ship.id,room||PIRATE_SHIP_BERTH.id);
  const previous=pirateShipPoint(ship,p.x,p.farY+8);
  put(p.x,p.farY+2);
  assert.equal(pirateShipPrompt(g,player),'BOARD PIRATE SHIP');
  player.swimming=true;
  assert.equal(stepOntoPiratePlank(g,player,previous),false);
  player.swimming=false;
  assert.equal(stepOntoPiratePlank(g,player,previous),true);
  assert.equal(player.pirateRide.level,'plank');
  assert.ok(player.pirateVisualLift>0&&player.pirateVisualLift<3);
  assert.equal(footstepMaterial(g,player),'wood');
  assert.equal(piratePlankHeight(ship,p.farY),0);
  walk(0,-105);
  assert.equal(player.pirateRide.level,'deck');
  const outside=pirateShipPoint(ship,0,-200),inside=pirateShipPoint(ship,0,-38);
  assert.equal(pirateShipBlocked(g,outside.x,outside.y,7),false);
  assert.equal(pirateShipBlocked(g,inside.x,inside.y,7),true);
  assert.equal(pirateShipBlocked(g,inside.x,inside.y,7,player),false);
  walk(0,133);
  assert.equal(player.pirateRide,undefined);
  assert.equal(player.pirateVisualLift,undefined);
 }
});

test('main deck leads to the connected hold rooms, all three vertical perches and the reloadable guns',()=>{
 const {g,player,ship,put,walk,advance}=fixture(),p=layout.plank,hatch=layout.hatch;
 put(p.x,p.farY+18);assert.ok(interactPirateShip(g,player));
 walk(0,-145);walk(47,0);
 assert.equal(pirateShipPrompt(g,player),'GO BELOW DECK');
 interactPirateShip(g,player);
 assert.equal(player.pirateRide.level,'hold');
 assert.ok(walk(160,0)<65,'hold partition blocks outside the doorway');
 walk(0,-47);walk(160,0);
 assert.ok(player.pirateRide.x>layout.hold.partitionX,'central passage connects both hold rooms');
 walk(-212,0);walk(0,30);
 assert.equal(pirateShipPrompt(g,player),'RETURN TO MAIN DECK');
 interactPirateShip(g,player);
 assert.equal(player.pirateRide.level,'deck');
 for(const nest of layout.nests){
  Object.assign(player.pirateRide,{x:nest.x,y:nest.ropeY});syncPirateShipPlayer(g,player);
  assert.equal(pirateShipPrompt(g,player),'CLIMB ROPE');
  interactPirateShip(g,player);assert.equal(player.pirateRide.level,'rope');
  advance(2.1);
  assert.equal(player.pirateRide.level,'nest');
  assert.ok(Math.abs(player.pirateVisualLift-(nest.z+ship.z))<.001);
  assert.ok(walk(0,80)<nest.radius*2,'perch railing blocks walking off the side');
  assert.equal(pirateShipPrompt(g,player),'CLIMB DOWN');
  interactPirateShip(g,player);advance(2.1);
  assert.equal(player.pirateRide.level,'deck');
 }
 assert.ok(hatch.x<layout.hold.partitionX);
 const cannon=layout.cannons[0];
 Object.assign(player.pirateRide,{x:cannon.x,y:cannon.y+25});syncPirateShipPlayer(g,player);
 assert.equal(pirateShipPrompt(g,player),'FIRE CANNON');
 interactPirateShip(g,player);interactPirateShip(g,player);
 assert.equal(ship.shots.length,1);
 assert.equal(pirateShipPrompt(g,player),'CANNON RELOADING');
 const [shot]=ship.shots,muzzle=shot.y;
 advance(.25);assert.ok(shot.y<muzzle&&shot.z>0);
 advance(.8);assert.ok(shot.impactAge>=0);
 advance(1.45);assert.equal(ship.shots.length,0);
 assert.equal(pirateShipPrompt(g,player),'FIRE CANNON');
});

test('room change clears stale rides and valid saved rides use their own berth',()=>{
 const {g,player,ship}=fixture(PIRATE_CAVE_BERTH.id);
 player.pirateRide=JSON.parse(JSON.stringify({shipId:ship.id,level:'hold',x:-190,y:44}));
 tickPirateShip(g,.05);
 assert.equal(player.pirateRide.shipId,PIRATE_CAVE_BERTH.id);
 assert.equal(player.pirateVisualLift,layout.holdZ);
 assert.ok(player.x<ship.x&&player.y>ship.y);
 g.trainTest.design.activeRoom=undefined;
 Object.assign(player,{x:7000,y:5500});tickPirateShip(g,.05);
 assert.deepEqual([player.x,player.y,player.pirateRide],[7000,5500,undefined]);
 g.trainTest.design.activeRoom='diagon';
 assert.equal(pirateShip(g),null);
});

test('co-op camera keeps distinct ship floors visible and rejoins after returning to deck',()=>{
 const deck={id:1,x:100,y:100,pirateRide:{level:'deck'}},hold={id:2,x:103,y:100,pirateRide:{level:'hold'}};
 const players=[deck,hold],camera=new MultiplayerCamera();
 for(let frame=0;frame<20;frame++)assert.equal(camera.update(players,1280,850,.1).length,2);
 hold.pirateRide.level='deck';
 for(let frame=0;frame<15;frame++)camera.update(players,1280,850,.1);
 assert.equal(camera.groups.length,1);
});
