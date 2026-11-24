import test from 'node:test';
import assert from 'node:assert/strict';
import {wildLandsDesign} from '../src/wild-lands.mjs';
import {wildLandsBiome,wildLandsGround,wildLandsSurface,wildLandsSurfaceAt,wildLandsBlocked} from '../src/wild-lands-world.mjs';
import {buildTrainRoute,trainCars} from '../src/train-track.mjs';
import {WILD_RIVERS,WILD_BRIDGES,wildLandsBridgeDeck,wildLandsPathAt} from '../src/wild-lands-geography.mjs';
import {overlookBlocked,overlookMazeFor} from '../src/overlook-maze.mjs';
import {damageStructureVehicle} from '../src/structure-destruction.mjs';
import {WILD_LANDS_SITES,interactWildLandsSite,tickWildLandsContent} from '../src/wild-lands-content.mjs';
import {updateTrainWater} from '../src/train-test.mjs';
import {railwayStations} from '../src/railway-station.mjs';
import {drawRiverCattails,riverBankVegetation} from '../src/wild-river-vegetation.mjs';
test('Wild Lands follows the sketch and keeps each surface territory larger than Classic',()=>{
 const d=wildLandsDesign(),area={};
 for(let y=100;y<d.height;y+=100)for(let x=100;x<d.width;x+=100){if(wildLandsSurface(d,x,y)!=='grass')continue;const b=wildLandsGround(d,x,y);area[b]=(area[b]||0)+10000;}
 for(const biome of ['jungle','forest','swamp','ice','graveyard','house','beach'])assert.ok(area[biome]>1600*1600,biome+' dry footprint '+area[biome]);
 assert.equal(wildLandsBiome(3000,2000),'jungle');assert.equal(wildLandsBiome(13000,1800),'swamp');assert.equal(wildLandsBiome(8200,4700),'house');assert.equal(wildLandsBiome(9200,5712),'ice');assert.equal(wildLandsBiome(3300,6000),'graveyard');
 assert.equal(wildLandsSurface(d,0,0),'water');assert.equal(wildLandsSurface(d,14600,8500),'grass');
});
test('sketch river branches connect to a southwest mouth and footbridges preserve swimming beneath',()=>{
 const d=wildLandsDesign(),route=buildTrainRoute(d);assert.ok(WILD_RIVERS[0].at(-1)[0]<7000);
 const b=WILD_BRIDGES[0],t={design:d,route},walker={x:b.x,y:b.y,jumpHeight:0};
 assert.equal(wildLandsSurface(d,b.x,b.y),'water');assert.equal(wildLandsBridgeDeck(d,b.x,b.y),10);
 updateTrainWater(t,walker,{x:b.x-b.w/2-20,y:b.y});assert.equal(walker.trainDeck,true);assert.equal(walker.swimming,false);
 const swimmer={x:b.x,y:b.y,swimming:true,jumpHeight:0};updateTrainWater(t,swimmer);assert.equal(swimmer.trainDeck,false);assert.equal(swimmer.underBridge,true);assert.equal(swimmer.swimming,true);
});
test('river vegetation pairs shallow roots on both banks and sways cattail heads around fixed roots',()=>{
 const d=wildLandsDesign(),plants=riverBankVegetation(d,{left:0,top:0,right:d.width,bottom:d.height});
 const tally=(kind,side)=>plants.filter(p=>p.kind===kind&&p.side===side).length;
 assert.ok(tally('grass',1)>50&&tally('cattail',1)>10);
 for(const kind of ['grass','cattail'])assert.equal(tally(kind,1),tally(kind,-1));
 assert.ok(plants.every(p=>wildLandsSurfaceAt(d,p.x,p.y)==='shallow'));
 assert.ok(plants.every(p=>!WILD_BRIDGES.some(b=>Math.abs(p.x-b.x)<b.w/2&&Math.abs(p.y-b.y)<b.h/2)));
 const point=plants.find(p=>p.kind==='cattail');
 const draw=time=>{
  const calls=[],c={fillStyle:'',fillRect(x,y,w,h){
   assert.ok([x,y,w,h].every(Number.isInteger));calls.push([x,y,w,h,this.fillStyle]);
  }};
  drawRiverCattails(c,point,time);return calls;
 };
 const calm=draw(0),frames=[.8,1.6,2.4,3.2,4].map(draw);
 for(const frame of frames)assert.deepEqual(frame[0],calm[0]);
 const heads=frame=>frame.filter(p=>p[4]==='#694532');
 assert.ok(frames.some(frame=>JSON.stringify(heads(frame))!==JSON.stringify(heads(calm))));
});
test('an approaching jump keeps its height until it clears the footbridge deck',()=>{
 const design=wildLandsDesign(),t={design,route:buildTrainRoute(design)};
 const bridge=WILD_BRIDGES[0],edge=bridge.y-bridge.h/2;
 const player={x:bridge.x,y:edge+2,jumpHeight:6,jumpVelocity:85,swimming:true};
 updateTrainWater(t,player,{x:player.x,y:edge-3});
 assert.equal(player.underBridge,true);
 assert.equal(player.jumpHeight,6);
 player.jumpHeight=18;
 updateTrainWater(t,player);
 assert.equal(player.underBridge,false);
 assert.equal(player.trainDeck,true);
 assert.equal(player.jumpHeight+player.trainGround,18);
 player.y=edge-3;
 updateTrainWater(t,player);
 assert.equal(player.trainDeck,false);
 assert.equal(player.jumpHeight,18);
});
test('south hedge opening allows travel and car impacts clear only the contacted hedge',()=>{
 const g={trainTest:{design:wildLandsDesign()}},maze=overlookMazeFor(g);
 assert.equal(overlookBlocked(g,maze.southEntrance.x,maze.southOpening.y,10,0,false),false);
 const trim=maze.parts.find(p=>p.southEntryEnd==='left');
 const x=trim.x+trim.w/2,y=trim.y+trim.h/2;
 assert.equal(overlookBlocked(g,x,y,4,0,false),true);
 const bumper={x,y,faceX:0,faceY:-1};
 assert.equal(damageStructureVehicle(g,bumper,5,12),false);
 assert.equal(damageStructureVehicle(g,bumper,120,12),true);
 assert.equal(overlookBlocked(g,x,y,4,0,false),false);
 const far=maze.parts.find(p=>!p.entranceGap&&p.y<trim.y-200);
 assert.equal(maze.state.damage[far.id],undefined);
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
 d.wildStops=[{...d.wildStops[0],x:4000}];assert.notEqual(railwayStations(d),first);assert.equal(railwayStations(d)[0]._stationContext.x,4000);
 d.wildStops[0].x=4500;d.wildStopsRevision=1;assert.equal(railwayStations(d)[0]._stationContext.x,4500);
 d.activeRoom='caverns';assert.deepEqual(railwayStations(d),[]);
});
test('the single closed circuit carries all five native train parts at every position',()=>{
 const design=wildLandsDesign(),route=buildTrainRoute(design);assert.equal(design.routes.length,1);assert.ok(route.length>30000);
 for(let i=0;i<100;i++){const cars=trainCars({design,route,distance:i/100*route.length});assert.equal(cars.length,5);for(const c of cars)assert.ok(Number.isFinite(c.x+c.y+c.a+c.z));}
});
test('underground and shadow are enclosed rooms rather than surface biomes',()=>{
 const d=wildLandsDesign();for(const activeRoom of ['caverns','shadow']){d.activeRoom=activeRoom;assert.equal(wildLandsGround(d,8000,4800),activeRoom);assert.equal(wildLandsSurface(d,8000,4800),'grass');assert.equal(wildLandsBlocked(d,10000,4800),true);assert.equal(wildLandsBlocked(d,8000,4800),false);}
});
