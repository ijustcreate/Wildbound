import test from 'node:test';
import assert from 'node:assert/strict';
import {wildLandsDesign} from '../src/wild-lands.mjs';
import {wildLandsBiome,wildLandsGround,wildLandsSurface,wildLandsBlocked} from '../src/wild-lands-world.mjs';
import {buildTrainRoute,trainCars} from '../src/train-track.mjs';
import {WILD_RIVERS,WILD_BRIDGES,wildLandsBridgeDeck,wildLandsPathAt} from '../src/wild-lands-geography.mjs';
import {WILD_LANDS_SITES,interactWildLandsSite,tickWildLandsContent} from '../src/wild-lands-content.mjs';
import {updateTrainWater} from '../src/train-test.mjs';
import {railwayStations} from '../src/railway-station.mjs';
test('Wild Lands follows the sketch and keeps each surface territory larger than Classic',()=>{
 const d=wildLandsDesign(),area={};
 for(let y=100;y<d.height;y+=100)for(let x=100;x<d.width;x+=100){if(wildLandsSurface(d,x,y)!=='grass')continue;const b=wildLandsGround(d,x,y);area[b]=(area[b]||0)+10000;}
 for(const biome of ['jungle','forest','swamp','ice','graveyard','house','beach'])assert.ok(area[biome]>1600*1600,biome+' dry footprint '+area[biome]);
 assert.equal(wildLandsBiome(3000,2000),'jungle');assert.equal(wildLandsBiome(13000,1800),'swamp');assert.equal(wildLandsBiome(8200,4700),'ice');assert.equal(wildLandsBiome(3300,6000),'graveyard');
 assert.equal(wildLandsSurface(d,0,0),'water');assert.equal(wildLandsSurface(d,14600,8500),'grass');
});
test('sketch river branches connect to a southwest mouth and footbridges preserve swimming beneath',()=>{
 const d=wildLandsDesign(),route=buildTrainRoute(d);assert.ok(WILD_RIVERS[0].at(-1)[0]<7000);
 const b=WILD_BRIDGES[0],t={design:d,route},walker={x:b.x,y:b.y,jumpHeight:0};
 assert.equal(wildLandsSurface(d,b.x,b.y),'water');assert.equal(wildLandsBridgeDeck(d,b.x,b.y),10);
 updateTrainWater(t,walker,{x:b.x-b.w/2-20,y:b.y});assert.equal(walker.trainDeck,true);assert.equal(walker.swimming,false);
 const swimmer={x:b.x,y:b.y,swimming:true,jumpHeight:0};updateTrainWater(t,swimmer);assert.equal(swimmer.trainDeck,false);assert.equal(swimmer.underBridge,true);assert.equal(swimmer.swimming,true);
});
test('exploration supplies are session-only, grant once per site, and rooms stay separate',()=>{
 const d=wildLandsDesign(),site=WILD_LANDS_SITES[0],p={x:site.x,y:site.y,hp:50,maxHp:100},drops=[];
 const g={players:[p],trainTest:{design:d,time:1},dropLoot:(...args)=>drops.push(args)};
 tickWildLandsContent(g);assert.ok(g.trainTest.wildExploration.discovered.has(site.id));
 assert.equal(interactWildLandsSite(g,p),true);assert.equal(drops.length,1);interactWildLandsSite(g,p);assert.equal(drops.length,1);
 d.activeRoom='shadow';assert.equal(interactWildLandsSite(g,p),false);
 const interior=WILD_LANDS_SITES.find(s=>s.room==='shadow');Object.assign(p,{x:interior.x,y:interior.y});assert.equal(interactWildLandsSite(g,p),true);assert.equal(drops.length,2);
});
test('station geometry cache follows replaced stop layouts and explicit editor revisions',()=>{
 const d=wildLandsDesign();d.wildStops=[{id:'test',name:'Test',x:3000,y:1800}];
 const first=railwayStations(d);assert.equal(railwayStations(d),first);
 d.wildStops=[{...d.wildStops[0],x:4000}];assert.notEqual(railwayStations(d),first);assert.equal(railwayStations(d)[0].station.x,4000);
 d.wildStops[0].x=4500;d.wildStopsRevision=1;assert.equal(railwayStations(d)[0].station.x,4500);
 d.activeRoom='caverns';assert.deepEqual(railwayStations(d),[]);
});
test('the single closed circuit carries all five native train parts at every position',()=>{
 const design=wildLandsDesign(),route=buildTrainRoute(design);assert.equal(design.routes.length,1);assert.ok(route.length>30000);
 for(let i=0;i<100;i++){const cars=trainCars({design,route,distance:i/100*route.length});assert.equal(cars.length,5);for(const c of cars)assert.ok(Number.isFinite(c.x+c.y+c.a+c.z));}
});
test('underground and shadow are enclosed rooms rather than surface biomes',()=>{
 const d=wildLandsDesign();for(const activeRoom of ['caverns','shadow']){d.activeRoom=activeRoom;assert.equal(wildLandsGround(d,8000,4800),activeRoom);assert.equal(wildLandsSurface(d,8000,4800),'grass');assert.equal(wildLandsBlocked(d,10000,4800),true);assert.equal(wildLandsBlocked(d,8000,4800),false);}
});
