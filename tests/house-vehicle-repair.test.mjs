import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/core.mjs';
import {defaultHouse} from '../src/house-design.mjs';
import {interactHouseVehicle,tryInstallVehiclePart,vehicleMotion} from '../src/house-vehicles.mjs';
test('unrepaired car enters from the hood and drives immediately with an empty bag',()=>{
 const g=new Game(()=>.5);Object.assign(g,{house:defaultHouse(),generatedEnvironment:'house',environment:'house',phase:'play',openingBoard:false,enemies:[],scenery:[]});
 const p=g.addPlayer('keyboard'),v=g.house.vehicles[0];Object.assign(p,{x:v.x,y:v.y-80,hp:100,inventory:[]});v.enginePartInstalled=false;v.hoodOpen=true;
 assert.equal(interactHouseVehicle(g,p),true);assert.equal(p.vehicleSeat,'driver');assert.equal(v.hoodOpen,false);assert.equal(v.engineOn,true);
 assert.ok(vehicleMotion(g,p,{y:-1},.1).dy<0);assert.deepEqual(p.inventory,[]);
 v.engineOn=false;assert.ok(vehicleMotion(g,p,{y:-1},.1).dy<0);assert.equal(v.engineOn,true);
});
test('legacy optional spare installation preserves its inventory transaction',()=>{
 const g=new Game(()=>.5);g.house=defaultHouse();const p=g.addPlayer('keyboard'),v=g.house.vehicles[0];Object.assign(p,{x:v.x,y:v.y,inventory:[{type:'car_engine_part',qty:1}]});v.hoodOpen=true;v.enginePartInstalled=false;
 assert.equal(tryInstallVehiclePart(g,p,0),true);assert.equal(v.enginePartInstalled,true);assert.equal(p.inventory[0],null);
});
