import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/core.mjs';
import {defaultHouse,validateHouse} from '../src/house-design.mjs';
import {enterOrExitHouseVehicle,vehicleMotion,tickVehicleEffects} from '../src/house-vehicles.mjs';
import {vehiclePadInput} from '../src/controls.mjs';

function driveFixture(){
 const g=new Game(()=>.5);Object.assign(g,{house:defaultHouse(),generatedEnvironment:'house',environment:'house',phase:'play',openingBoard:false,enemies:[],scenery:[],portals:[]});
 const p=g.addPlayer('pad:0');const v=g.house.vehicles[0];Object.assign(p,{x:v.x,y:v.y,hp:100,inventory:[{type:'car_key',qty:1}]});
 enterOrExitHouseVehicle(g,p);v.enginePartInstalled=true;return {g,p,v};
}

test('physical bottom and left pedals work independently of stick throttle and combat bindings',()=>{
 const {g,p,v}=driveFixture();
 const pad={axes:[0,-1],buttons:Array.from({length:16},()=>({pressed:false,value:0}))};
 vehicleMotion(g,p,{x:0,y:-1,...vehiclePadInput(pad)},.1);assert.equal(v.speed,0);assert.ok(!v.engineOn);
 pad.buttons[0]={pressed:true,value:.7};vehicleMotion(g,p,{x:0,...vehiclePadInput(pad)},.2);assert.ok(v.speed>0);assert.ok(v.engineOn);
 pad.buttons[2]={pressed:true,value:1};
 for(let i=0;i<30;i++)vehicleMotion(g,p,{x:0,...vehiclePadInput(pad)},1/60);
 assert.equal(v.speed,0,'brake wins over gas and cannot become reverse');
 pad.buttons[2]={pressed:false,value:0};pad.axes[1]=1;
 vehicleMotion(g,p,{x:0,...vehiclePadInput(pad)},.1);assert.ok(v.speed<0,'down plus gas explicitly selects reverse');
 pad.buttons[0]={pressed:false,value:0};pad.buttons[2]={pressed:true,value:1};
 for(let i=0;i<30;i++)vehicleMotion(g,p,vehiclePadInput(pad),1/60);
 assert.equal(v.speed,0,'brake stops reverse too');
});

test('front steering turns only while moving, reverses correctly, and settles independently of frame rate',()=>{
 const {g,p,v}=driveFixture();
 for(let i=0;i<60;i++)vehicleMotion(g,p,{x:1},1/60);
 assert.equal(v.heading,0,'parked steering cannot spin the body');assert.ok(v.wheelAngle>0);
 v.speed=100;const motion=vehicleMotion(g,p,{x:1,vehicleGas:1},1/60);
 assert.ok(v.heading>0);assert.ok(motion.dx>0&&motion.dy<0);
 const forwardHeading=v.heading;v.speed=-60;vehicleMotion(g,p,{x:1,vehicleGas:1,vehicleReverse:true},1/60);assert.ok(v.heading<forwardHeading);
 const simulate=hz=>{const {g,p,v}=driveFixture();for(let i=0;i<hz*2;i++)vehicleMotion(g,p,{x:.7,vehicleGas:1},1/hz);return v.heading;};
 assert.ok(Math.abs(simulate(30)-simulate(120))<.04);
});

test('driver pedals do not jump, dash, charge attacks, or block car motion in the real game update',()=>{
 const {g,p,v}=driveFixture();g.blocked=()=>false;
 for(let i=0;i<12;i++)g.update(1/60,{'pad:0':{vehicleGas:1,jump:true,attack:true,dodge:true,block:true,trap:true}});
 assert.ok(v.speed>0);assert.equal(p.jumpHeight||0,0);assert.equal(p.dashTime||0,0);assert.equal(p.charge||0,0);assert.equal(p.bowAiming,false);
 g.update(1/60,{'pad:0':{vehicleBrake:1}});assert.equal(p.attack||0,0);
 const passenger=g.addPlayer('pad:1');Object.assign(passenger,{x:v.x,y:v.y});enterOrExitHouseVehicle(g,passenger);
 const speed=v.speed;assert.deepEqual(vehicleMotion(g,passenger,{vehicleGas:1,x:1},.1),{dx:0,dy:0});assert.equal(v.speed,speed);
});

test('garden villa has a valid editable car and it can be entered, driven and exited',()=>{
 const h=defaultHouse();assert.equal(h.name,'The Garden Villa');assert.ok(validateHouse(h));assert.equal(h.vehicles.length,1);
 const g=new Game(()=>.5);g.house=h;g.generatedEnvironment='house';g.environment='house';g.phase='play';g.openingBoard=false;g.enemies=[];g.scenery=[];const p=g.addPlayer('keyboard');Object.assign(p,{x:400,y:1168,hp:100,inventory:[{type:'car_key',qty:1}]});
 assert.equal(enterOrExitHouseVehicle(g,p),true);assert.equal(p.vehicleId,'villa-car');assert.equal(h.vehicles[0].occupiedBy,p.id);
 const passenger=g.addPlayer('pad:0','Passenger');Object.assign(passenger,{x:400,y:1168,hp:100});assert.equal(enterOrExitHouseVehicle(g,passenger),true);assert.equal(passenger.vehicleSeat,'front');
 const v=h.vehicles[0];v.enginePartInstalled=true;const before=v.speed??0;const motion=vehicleMotion(g,p,{x:0,y:-1},.2);assert.ok(motion.dx||motion.dy);assert.ok(v.speed>before);tickVehicleEffects(g,v,.2);assert.ok(Array.isArray(v.effects.tracks));
 v.speed=0;p.x=440;p.y=1168;p.faceX=1;p.faceY=0;assert.equal(enterOrExitHouseVehicle(g,p),true);assert.equal(p.vehicleId,null);assert.notEqual(p.y,1168);
});
