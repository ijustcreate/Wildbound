import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/core.mjs';
import {defaultHouse} from '../src/house-design.mjs';
import {interactHouseVehicle,openHouseChest,tryInstallVehiclePart,vehicleMotion} from '../src/house-vehicles.mjs';

test('house car requires the garage part and key, then starts after hood repair',()=>{
 const h=defaultHouse(),g=new Game(()=>.5);Object.assign(g,{house:h,generatedEnvironment:'house',environment:'house',phase:'play',openingBoard:false,enemies:[],scenery:[],loot:[]});
 const p=g.addPlayer('keyboard');Object.assign(p,{x:352,y:1228,hp:100,inventory:[]});
 assert.equal(openHouseChest(g,p),true);assert.equal(g.loot[0].type,'car_engine_part');p.inventory=[{type:'car_engine_part',qty:1}];
 const v=h.vehicles[0];p.x=v.x;p.y=v.y-80;assert.equal(interactHouseVehicle(g,p),true);assert.equal(v.hoodOpen,true);assert.equal(tryInstallVehiclePart(g,p,0),true);assert.equal(v.enginePartInstalled,true);assert.equal(p.inventory[0],null);p.x=v.x;p.y=v.y;assert.equal(interactHouseVehicle(g,p),true);
 assert.deepEqual(vehicleMotion(g,p,{x:0,y:-1},.1),{dx:0,dy:0});assert.match(g.log[0],/key/i);p.inventory=[{type:'car_key',qty:1}];const motion=vehicleMotion(g,p,{x:0,y:-1},.1);assert.ok(Math.hypot(motion.dx,motion.dy)>0);assert.equal(v.engineOn,true);
});
