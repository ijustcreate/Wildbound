import test from 'node:test';
import assert from 'node:assert/strict';
import {wildLandsDesign} from '../src/wild-lands.mjs';
import {wildLandsBiome,wildLandsGround,wildLandsSurface,wildLandsBlocked} from '../src/wild-lands-world.mjs';
import {buildTrainRoute,trainCars} from '../src/train-track.mjs';
test('Wild Lands follows the sketch and keeps each surface territory larger than Classic',()=>{
 const d=wildLandsDesign(),area={};
 for(let y=100;y<d.height;y+=100)for(let x=100;x<d.width;x+=100){if(wildLandsSurface(d,x,y)!=='grass')continue;const b=wildLandsGround(d,x,y);area[b]=(area[b]||0)+10000;}
 for(const biome of ['jungle','forest','swamp','ice','graveyard','house','beach'])assert.ok(area[biome]>1600*1600,biome+' dry footprint '+area[biome]);
 assert.equal(wildLandsBiome(3000,2000),'jungle');assert.equal(wildLandsBiome(13000,1800),'swamp');assert.equal(wildLandsBiome(8200,4700),'ice');assert.equal(wildLandsBiome(3300,6000),'graveyard');
 assert.equal(wildLandsSurface(d,0,0),'water');assert.equal(wildLandsSurface(d,14600,8500),'grass');
});
test('the single closed circuit carries all four native train parts at every position',()=>{
 const design=wildLandsDesign(),route=buildTrainRoute(design);assert.equal(design.routes.length,1);assert.ok(route.length>30000);
 for(let i=0;i<100;i++){const cars=trainCars({design,route,distance:i/100*route.length});assert.equal(cars.length,4);for(const c of cars)assert.ok(Number.isFinite(c.x+c.y+c.a+c.z));}
});
test('underground and shadow are enclosed rooms rather than surface biomes',()=>{
 const d=wildLandsDesign();for(const activeRoom of ['caverns','shadow']){d.activeRoom=activeRoom;assert.equal(wildLandsGround(d,8000,4800),activeRoom);assert.equal(wildLandsSurface(d,8000,4800),'grass');assert.equal(wildLandsBlocked(d,10000,4800),true);assert.equal(wildLandsBlocked(d,8000,4800),false);}
});
