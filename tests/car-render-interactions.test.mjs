import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/core.mjs';
import {defaultHouse} from '../src/house-design.mjs';
import {VEHICLE_SEATS,vehicleDoorPoint,houseVehicleEntry,enterOrExitHouseVehicle} from '../src/house-vehicles.mjs';
import {carWheelArchPoints,carWheelGeometry} from '../src/car-art.mjs';
import {carInteractionPrompt} from '../src/car-prompts.mjs';

function fixture(){const g=new Game(()=>.5);Object.assign(g,{house:defaultHouse(),generatedEnvironment:'house',environment:'house',phase:'play',openingBoard:false,enemies:[],scenery:[],portals:[]});g.blocked=()=>false;const p=g.addPlayer('pad:0'),v=g.house.vehicles[0];return {g,p,v};}

test('body openings remain fixed while front tyres steer and roll in every view',()=>{
 for(let d=0;d<32;d++)for(const side of[-1,1])for(const axle of[-1,1]){
  const v={x:0,y:0,w:80,h:128,heading:d*Math.PI/16};
  const arch=carWheelArchPoints(v,side,axle),tyre=carWheelGeometry(v,side,axle).point(3.5,8,10);
  v.wheelAngle=.58;v.wheelRotation=4;
  assert.deepEqual(carWheelArchPoints(v,side,axle),arch);
  if(axle<0)assert.notDeepEqual(carWheelGeometry(v,side,axle).point(3.5,8,10),tyre);
  const wheel=carWheelGeometry(v,side,axle);assert.ok(Math.abs(wheel.center.x)+wheel.halfWidth<v.w*.47);
 }
});

test('each door prompt and entry select the same free seat across eight headings',()=>{
 const {g,p,v}=fixture();
 for(let d=0;d<8;d++)for(const seat of VEHICLE_SEATS){v.heading=d*Math.PI/4;v.seats={};v.occupiedBy=null;Object.assign(p,vehicleDoorPoint(v,seat),{vehicleId:null,vehicleSeat:null});
  assert.equal(houseVehicleEntry(g,p).seat.id,seat.id);assert.ok(carInteractionPrompt(g,p).text.includes(seat.label));
  assert.ok(enterOrExitHouseVehicle(g,p));assert.equal(p.vehicleSeat,seat.id);
 }
});

test('driver and passenger stay outside after press, hold and release; a new tap re-enters',()=>{
 for(const seat of VEHICLE_SEATS){const {g,p,v}=fixture();Object.assign(p,vehicleDoorPoint(v,seat));enterOrExitHouseVehicle(g,p);
  const step=interact=>g.update(.05,{'pad:0':{interact}});step(false);step(true);
  assert.equal(p.vehicleId,null);for(let i=0;i<5;i++)step(true);step(false);step(false);assert.equal(p.vehicleId,null);
  const a=v.heading||0,localX=Math.cos(a)*(p.x-v.x)+Math.sin(a)*(p.y-v.y);assert.equal(Math.sign(localX),seat.side==='left'?-1:1);
  step(true);step(false);assert.equal(p.vehicleId,v.id);
 }
});

test('door hints respect controller family, full seats and sunken vehicles',()=>{
 const {g,p,v}=fixture();Object.assign(p,vehicleDoorPoint(v,VEHICLE_SEATS[0]));
 for(const [family,key]of [['xbox','Y'],['switch','X'],['playstation','Triangle']]){p.controllerFamily=family;assert.ok(carInteractionPrompt(g,p).text.startsWith(key+' ·'));}
 p.device='keyboard';assert.ok(carInteractionPrompt(g,p).text.startsWith('E ·'));
 v.seats=Object.fromEntries(VEHICLE_SEATS.map((s,i)=>[s.id,100+i]));assert.equal(carInteractionPrompt(g,p),null);
 v.seats={};v.submerging=true;assert.equal(carInteractionPrompt(g,p),null);
});
