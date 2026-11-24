import {drawTrainGangway} from './train-gangway-art.mjs';
import {boardActorDepth,boardTableDepth} from './board-table.mjs';
import {wildHomesteadBoardTable} from './wild-homestead-layout.mjs';
import {homesteadBoardSuction,homesteadBoardView} from './homestead-board.mjs';
import {drawHomesteadBoardPortal,drawHomesteadSuctionActor} from './homestead-board-art.mjs';
import {drawTickTockCrocodile} from './tick-tock-crocodile-art.mjs';
import {drawHollowStalactites} from './hollow-stalactites.mjs';
import {bayouGoblinHutSubjects,drawBayouGoblinHutGround,drawBayouGoblinHutLamp} from './bayou-goblin-hut-art.mjs';
import {drawTrainShadows} from './train-shadows.mjs';
import {sceneryBatches,drawSceneryBatch} from './scenery-batches.mjs';
import {drawTrainRiderLayer} from './train-rider-layer.mjs';
import {drawSwordCombatEffect} from './sword-charge-art.mjs';
import {paintSwordAfterimages} from './sword-charge-state.mjs';
import {inDiagon} from './diagon-alley.mjs';
import {drawDiagonAlley,drawAlleyGate} from './diagon-alley-art.mjs';
import {inQuidditch} from './quidditch-scene.mjs';
import {drawQuidditchScene} from './quidditch-scene-art.mjs';
import {inDiagonArena} from './diagon-arena-layout.mjs';
import {drawDiagonArena} from './diagon-arena-art.mjs';
import {drawSnowyOwl} from './snowy-owl-art.mjs';
import {snapPortalCamera,drawPortalFlash} from './portal-transition.mjs';
import {drawStoragePortals} from './storage-portals.mjs';
import {drawBowAim} from './bow-aim.mjs';
import {beginParticleFrame} from './particles.mjs';
import {trainConductor,drawConductorSpeech} from './train-conductor.mjs';
import {TRAIN_STUDENT_RENDER_SIZE,trainStudents,drawStudentSpeech} from './train-students.mjs';
import {escapedChocolateFrogs,drawChocolateFrog} from './chocolate-frogs.mjs';
import {trainTailor} from './train-tailor.mjs';
import {drawActorGameplayFx} from './gameplay-fx.mjs';
import {bridgeSupportAt,railSpanBroken,railwayBridgeState,drawTrainBridgeWater} from './train-bridges.mjs';
import {drawTrackBridgeDeck,drawTrackBridgeFascia,drawTrackBridgePiers,drawTrackBridgeRipples} from './train-bridge-art.mjs';
import {paintRailReflections} from './rail-reflections.mjs';
import {drawTideglassGround,drawTideglassLights,tideglassSubjects} from './tideglass-art.mjs';
import {drawBridgeReveal} from './bridges.mjs';
import {railwayStream,prepareRailwayView,railwayStarting,streamImage} from './railway-stream.mjs';
import {paintSwordCharge} from './sword-feel.mjs';
import {drawPixelTrainCloud} from './train-exhaust-art.mjs';
import {wildBuildingSubjects,drawWildBuildingSubject,drawWildHomesteadDetails} from './wild-landmark-buildings.mjs';
import {drawHogsmeadeGround,hogsmeadeSubjects} from './hogsmeade-art.mjs';
import {pirateCrewActors,pirateCrewSpeech} from './pirate-crew.mjs';
import {drawPirateCrewMember,drawPirateCrewSpeech} from './pirate-crew-art.mjs';
import {activePatronuses} from './patronus.mjs';
import {drawBedSleeper} from './house-living.mjs';
import {drawRiverCattails,drawRiverShallows,riverBankVegetation} from './wild-river-vegetation.mjs';
import {drawWildCoastalCritters} from './wild-coastal-critters.mjs';
import {drawMerlockCampFixture,drawMerlockCampGround,merlockCampSubjects,visibleMerlockCamps} from './wild-merlock-camp-art.mjs';
import {vegetationWindStrength} from './vegetation-motion.mjs';
import {overlookMazeFor} from './overlook-maze.mjs';
import {drawOverlookGarden,overlookSubjects,drawOverlookSubject,drawOverlookClippings} from './overlook-maze-art.mjs';
import {drawDestruction} from './structure-destruction.mjs';
import {drawTrackShoulder,trackRangesInView,trackSampleDistances} from './train-track-art.mjs';
import {trainActorDepth,trainCarDepth} from './train-visibility.mjs';
import {nearbyWildSite} from './wild-lands-content.mjs';
import {controlledUnit} from './controlled-unit.mjs';
import {hunterPets} from './hunter-pets.mjs';
import {drawHunterPet} from './hunter-pet-render.mjs';
import {drawWildLandsFloor,wildLandsProps,drawWildLandsLandmarks,drawWildLandsMap,drawWildLandsCrossings,drawFrozenExplorerCache,frozenExplorerCacheSubject} from './wild-lands-art.mjs';
import {drawVeilGlaiveChest,veilGlaiveChestSubject} from './wild-lands-art.mjs';
import {wildLandsGround} from './wild-lands-world.mjs';
import {GrassFieldRenderer} from './grass-field.mjs';
import {drawForestSunlight} from './forest-sunlight.mjs';
import {drawFallingLeaves} from './forest.mjs';
import {isOccluded} from './world.mjs';
import {daylight,lightSources} from './night-cycle.mjs';
import {drawNightEquipment} from './night-equipment.mjs';
import {drawHappySparkles} from './hot-chocolate.mjs';
import {drawWaterSurface} from './water-surface.mjs';
import {railwaySurface} from './railway-water.mjs';
import {railwayForestProps,drawRailwayForestFloor} from './railway-forest.mjs';
import {drawStationGround,stationSubjects,drawStationSubject,drawStationLights,railwayStations,syncStationAssets} from './railway-station.mjs';
import {drawSwimmer,drawBreath} from './swim-render.mjs';
import {drawTrainCar,trainViewIndex} from './train-art.mjs';
import {trainCars,trainWorld,trainLocal,sampleTrainRoute,railwayWater,railElevation,nearestTrainTrack,trainRiderWorld} from './train-track.mjs';
import {trainPrompt} from './train-test.mjs';
import {drawProp,drawTracks} from './environment.mjs';
import {PLAYER_RENDER_SIZE} from './render-settings.mjs';
import {TRAIN_SEAT_HEIGHT} from './train-surfaces.mjs';
import {TRAIN_SEATED_PELVIS_HEIGHT} from './train-clips.mjs';
import {PIRATE_SHIP_LAYOUT,pirateShip,pirateShipPoint} from './pirate-ship.mjs';
import {drawPirateShipGround,drawPirateShipForeground,drawPirateShipEffects,drawWreckTreasure} from './pirate-ship-art.mjs';
import {WILLY_CHAIR,WRECK_TREASURE_TABLE} from './pirate-wreck-treasure.mjs';
import {mysteryVisitors} from './mystery-inc.mjs';
import {drawMysteryDog} from './mystery-inc-art.mjs';
import {drawWildWeather} from './wild-weather-art.mjs';
import {HOLLOW_BOUNDS,HOLLOW_EXIT,HOLLOW_ROOM} from './wild-mountain-layout.mjs';
import {drawHollowMap,drawMountainForegroundActor,drawMountainLights,drawWildHollow,drawWildMountain,drawWildMountainUpper,mountainActorLift} from './wild-mountain-art.mjs';
import {actorContact} from './contact-shadow.mjs';
import {outdoorLightingFrame,drawOutdoorSunShadows} from './outdoor-lighting.mjs';
import {WorldLightRenderer} from './world-lighting.mjs';
import {observeRailwayTicketView} from './train-ticket-service.mjs';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
function polygon(c,points,color){c.fillStyle=color;c.beginPath();points.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.closePath();c.fill();}
function drawRailwayTrackNative(ctx,d,route,bounds,overview,ranges){
 const visible=q=>q.x>bounds.left-100&&q.x<bounds.right+100&&q.y>bounds.top-100&&q.y<bounds.bottom+150;
 const point=(q,side,z=0)=>({x:q.x-Math.sin(q.a)*side,y:q.y+Math.cos(q.a)*side-z});
 if(overview){ctx.strokeStyle='#35453d';ctx.lineWidth=d.gauge+20;ctx.beginPath();route.points.forEach((q,i)=>i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y));ctx.stroke();ctx.strokeStyle='#ac9a78';ctx.lineWidth=d.gauge*.6;ctx.stroke();return;}
 drawTrackShoulder(ctx,d,route,bounds,ranges);
 // Draw the piers and fascia below the shared route surface and rails.
 const samples=[];
 for(const s of trackSampleDistances(route,ranges,16)){
  const q=sampleTrainRoute(route,s);
  if(!visible(q)||railSpanBroken(d,route,s))continue;
  const z=railElevation(d,q);
  samples.push({s,q,z,bridge:railwayWater(d,q.x,q.y)||z>2});
 }
 for(const {s,q,z,bridge} of samples)if(bridge)drawTrackBridgePiers(ctx,d,q,z,s);
 for(const [i,{s,q,z,bridge}] of samples.entries())if(bridge){
  const previous=samples[i-1],next=samples[i+1];
  drawTrackBridgeFascia(ctx,d,q,z,{start:!previous?.bridge||previous.s!==s-16,end:!next?.bridge||next.s!==s+16});
 }
 for(const {s,q,z,bridge} of samples){
  if(bridge)drawTrackBridgeDeck(ctx,d,q,z);
  else{const a=point(q,-d.gauge/2-13),b=point(q,d.gauge/2+13),dx=Math.cos(q.a)*10,dy=Math.sin(q.a)*10;polygon(ctx,[{x:a.x-dx,y:a.y-dy},{x:b.x-dx,y:b.y-dy},{x:b.x+dx,y:b.y+dy},{x:a.x+dx,y:a.y+dy}],'#737363');}
  if(!bridge)for(let j=-3;j<=3;j++){const v=point(q,j*d.gauge/7);ctx.fillStyle=(Math.floor(s/16)+j)%3?'#65685a':'#92917a';ctx.fillRect(Math.round(v.x/3)*3,Math.round(v.y/3)*3,3,3);}
  const a=point(q,-d.gauge/2-7,z),b=point(q,d.gauge/2+7,z);ctx.strokeStyle='#513c31';ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();ctx.strokeStyle='#a08559';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(a.x,a.y-2);ctx.lineTo(b.x,b.y-2);ctx.stroke();
 }
 for(const side of [-1,1]){
  ctx.strokeStyle='#303b3d';ctx.lineWidth=5;ctx.beginPath();
  let previous=-Infinity;
  for(const s of trackSampleDistances(route,ranges,8,true)){
   const q=sampleTrainRoute(route,s);
   if(!visible(q)||railSpanBroken(d,route,s))continue;
   const p=point(q,side*d.gauge/2,railElevation(d,q));
   if(s===previous+8)ctx.lineTo(p.x,p.y);
   else ctx.moveTo(p.x,p.y);
   previous=s;
  }
  ctx.stroke();ctx.strokeStyle='#b6b9a0';ctx.lineWidth=2;ctx.stroke();
 }
}
// At distant camera scales retain native silhouettes as pixel sprites. Expensive
// leaf/wood animation resumes at normal play distance instead of repainting
// subpixel bark and thousands of foliage stamps on every overview frame.
function drawDistantProp(ctx,t,tree,g,biome){
 if(tree.falling||tree.depleted||tree.burning){drawProp(ctx,tree,t.time,g,{dynamicShadows:false});return;}if(railwayStream(t)){const key=['distant',biome,tree.kind,tree.treeType||'',tree.autumnAccent?1:0,tree.season||'',tree.variant||0,Math.round(tree.size/16)].join(':');const image=streamImage(t,'prop',key,{size:64,height:64,half:32,above:60,scale:.25,prop:{...tree,x:0,y:0,rootY:0,seed:42},phase:0,biome,sprite:g.spriteLibrary?.[tree.kind]},40);if(image){ctx.imageSmoothingEnabled=false;ctx.drawImage(image,tree.x-128,tree.y-240,256,256);}return;}
 t.distantProps??=new Map();const key=[biome,tree.kind,tree.variant||0,Math.round(tree.size/16)].join(':');let sprite=t.distantProps.get(key);
 if(!sprite){sprite=document.createElement('canvas');sprite.width=sprite.height=64;const pen=sprite.getContext('2d');pen.translate(32,60);pen.scale(.25,.25);drawProp(pen,{...tree,x:0,y:0,rootY:0},0,{...g,generatedEnvironment:biome==='jungle'?'temple':biome,environment:biome},{dynamicShadows:false});t.distantProps.set(key,sprite);}
 ctx.imageSmoothingEnabled=false;ctx.drawImage(sprite,tree.x-128,tree.y-240,256,256);
}
// Keep the real native artwork and its sampled wind poses at play distance.
// Reuse world-pixel rasters instead of rebuilding every leaf cluster per draw.
function paintNativeProp(image,o,g,biome,phase){
 const pen=image.canvas.getContext('2d');pen.clearRect(0,0,image.canvas.width,image.canvas.height);pen.save();pen.translate(image.half*image.scale,image.above*image.scale);pen.scale(image.scale,image.scale);image.local??={...o,x:0,y:0,rootY:(o.rootY??o.y)-o.y,seed:o.seed??o.x+o.y};if(!image.world){image.world=Object.create(g);image.world.generatedEnvironment=biome==='jungle'?'temple':biome;image.world.environment=biome;}drawProp(pen,image.local,phase/4,image.world,{dynamicShadows:true});pen.restore();image.phase=phase;
}
function refreshNativeProps(t){
 t.nativeDrawFrame=(t.nativeDrawFrame||0)+1;const queue=t.nativePropPending;if(!queue?.size)return;const start=performance.now();let count=0;
 while(queue.size&&count<2&&performance.now()-start<3.5){const [key,q]=queue.entries().next().value;queue.delete(key);if(t.nativePropRasters?.get(key)!==q.image||q.image.seen<t.nativeDrawFrame-3||q.o.falling||q.o.depleted||q.o.harvest)continue;paintNativeProp(q.image,q.o,q.g,q.biome,q.phase);count++;}
}
function drawNativePropCached(ctx,t,o,g,biome,still=false){
 if(o.falling||o.burning||o.harvest||o.depleted||!['tree','snow_tree','palm','leafless_tree','grave_forest_tree','rock','ice_rock','forest_ruin'].includes(o.kind)){
  drawProp(ctx,o,t.time,{...g,generatedEnvironment:biome==='jungle'?'temple':biome,environment:biome},{dynamicShadows:true,shaderGrass:!!t.shaderGrass});
  return;
 }
 t.nativePropRasters??=new Map();t.nativePropPending??=new Map();
 const stream=railwayStream(t),scale=(t.viewZoom||1)<.75?.5:1,animated=o.kind.includes('tree')||o.kind==='palm',distant=(t.viewZoom||1)<=.85;
 const phase=animated&&!distant?Math.floor((t.time+(o.x%7)*.17)*4)%12:0;
 const sprite=g.spriteLibrary?.[o.kind],key=[o.id,o.kind,o.size,o.width,o.height,biome,sprite?.revision||0,scale].join(':');
 const job=(width,height,half,above)=>({size:width,height,half:half*scale,above:above*scale,scale,prop:{...o,x:0,y:0,rootY:(o.rootY??o.y)-o.y,seed:o.seed??o.x+o.y},biome,sprite});
 let image=t.nativePropRasters.get(key);
 if(!image){
  const half=Math.ceil(Math.max(70,(o.size||90)*.85,(o.width||0)/2+16));
  const above=Math.ceil(Math.max(100,(o.size||90)*1.8,(o.height||0)+30)),below=Math.ceil(Math.max(40,(o.size||90)*.65,(o.depth||0)+20));
  const width=Math.ceil(half*2*scale),height=Math.ceil((above+below)*scale);
  const base=stream&&streamImage(t,'prop','prop:'+key+':base',{...job(width,height,half,above),phase:0},140);
  if(stream&&!base){
   if(t.streamCoverage)t.streamCoverage.propPending++;
   return;
  }
  const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
  image={canvas,half,above,worldHeight:above+below,scale,pixels:width*height};
  if(base){canvas.getContext('2d').drawImage(base,0,0);Object.assign(image,{bitmap:base,phase:0,ready:true});}
  else paintNativeProp(image,o,g,biome,phase);
  t.nativePropPixels=(t.nativePropPixels||0)+image.pixels;
 }else{
  t.nativePropRasters.delete(key);
  if(!stream&&image.phase!==phase)t.nativePropPending.set(key,{image,o,g,biome,phase});
 }
 t.nativePropRasters.set(key,image);
 while(t.nativePropPixels>16*1024*1024&&t.nativePropRasters.size>1){
  const [oldest,entry]=t.nativePropRasters.entries().next().value;
  t.nativePropPixels-=entry.pixels;t.nativePropRasters.delete(oldest);t.nativePropPending.delete(oldest);
 }
 if(stream&&image.phase!==phase){
  const target=streamImage(t,'prop','prop:'+key+':'+phase,{...job(image.canvas.width,image.canvas.height,image.half,image.above),phase,family:key},20);
  if(target&&target!==image.bitmap){
   const pen=image.canvas.getContext('2d');
   pen.clearRect(0,0,image.canvas.width,image.canvas.height);pen.drawImage(target,0,0);
   image.bitmap=target;image.phase=phase;
  }
 }
 image.seen=t.nativeDrawFrame;
 ctx.imageSmoothingEnabled=false;
 if(animated&&distant&&!still){
  ctx.save();ctx.translate(o.x,o.y);ctx.transform(1,0,Math.sin(t.time*1.4+(o.seed??o.x)*.017)*.003,1,0,0);
  ctx.drawImage(image.canvas,-image.half,-image.above,image.half*2,image.worldHeight);
  ctx.restore();
 }else ctx.drawImage(image.canvas,o.x-image.half,o.y-image.above,image.half*2,image.worldHeight);
}
function prepareSceneryPoses(t,g,bounds,viewId='shared'){
 const stream=t.terrainStream;if(!stream)return;const now=performance.now();stream.posePlans??=new Map();for(const [id,time]of stream.posePlans)if(time<now-1000)stream.posePlans.delete(id);if(stream.posePlans.get(viewId)>now)return;stream.posePlans.set(viewId,now+150);if(stream.prepareNearPoses&&stream.nearForecast)bounds=stream.nearForecast;
 const sources=t.design.wildLands?[...(t.wildNativeWorlds?.values()||[])].map(r=>r.accepted||[]):[...(t.forestChunks?.values()||[])];let prepared=0;
 for(const list of sources)for(let o of list){if(prepared>=80)return;const y=o.rootY??o.y;if(o.x<bounds.left-500||o.x>bounds.right+500||y<bounds.top-500||y>bounds.bottom+500||o.falling||o.depleted||!['tree','snow_tree','palm','leafless_tree','grave_forest_tree','rock','ice_rock','forest_ruin'].includes(o.kind))continue;
  const biome=o._biome||'forest';if((t.viewZoom||1)<.3){const key=['distant',biome,o.kind,o.treeType||'',o.autumnAccent?1:0,o.season||'',o.variant||0,Math.round(o.size/16)].join(':');if(!stream.ready.has(key)){streamImage(t,'prop',key,{size:64,height:64,half:32,above:60,scale:.25,prop:{...o,x:0,y:0,rootY:0,seed:42},phase:0,biome,sprite:g.spriteLibrary?.[o.kind]},90);prepared++;}if(!stream.prepareNearPoses)continue;}
  const scale=(t.viewZoom||1)<.75?.5:1,key=[o.id,o.kind,o.size,o.width,o.height,biome,g.spriteLibrary?.[o.kind]?.revision||0,scale].join(':'),id='prop:'+key+':base';if(stream.ready.has(id)||t.nativePropRasters?.get(key)?.ready)continue;
  const half=Math.ceil(Math.max(70,(o.size||90)*.85,(o.width||0)/2+16)),above=Math.ceil(Math.max(100,(o.size||90)*1.8,(o.height||0)+30)),below=Math.ceil(Math.max(40,(o.size||90)*.65,(o.depth||0)+20));streamImage(t,'prop',id,{size:Math.ceil(half*2*scale),height:Math.ceil((above+below)*scale),half:half*scale,above:above*scale,scale,prop:{...o,x:0,y:0,rootY:y-o.y,seed:o.seed??o.x+o.y},biome,phase:0,sprite:g.spriteLibrary?.[o.kind]},85);prepared++;
 }
}
function drawDistantStations(ctx,t,g,renderer,visible){
 t.distantStations??=new Map();for(const world of railwayStations(t.design)){const origin=world._stationContext||world.station;if(!visible(origin,900))continue;const a=origin.angle||0,inside=g.players.some(p=>{const dx=p.x-origin.x,dy=p.y-origin.y,x=origin.x+Math.cos(a)*dx+Math.sin(a)*dy,y=origin.y-Math.sin(a)*dx+Math.cos(a)*dy,s=world.station;return !p.trainRide&&Math.abs(x-s.x)<s.w/2&&Math.abs(y-s.y)<s.h/2;});const key=[world.station.name||'station',origin.x,origin.y,inside,g.house?.destructionRevision||0,Math.floor(Date.now()/60000)].join(':');let sprite=t.distantStations.get(key);
 if(railwayStream(t)&&!(g.house?.destructionRevision)){const image=streamImage(t,'station',key,{size:160,origin,inside,minute:Math.floor(Date.now()/60000)},50);if(image){ctx.imageSmoothingEnabled=false;ctx.drawImage(image,origin.x-800,origin.y-800,1600,1600);}continue;}
 if(!sprite){sprite=document.createElement('canvas');sprite.width=sprite.height=160;const pen=sprite.getContext('2d');pen.translate(80,80);pen.scale(.1,.1);pen.translate(-origin.x,-origin.y);drawStationGround(pen,world,t.time);for(const o of stationSubjects(world,t.time,t.stationCats))if(!o.stationCat)drawStationSubject(pen,world,o,t.time,renderer,g.players,g);if(t.distantStations.size>=32)t.distantStations.delete(t.distantStations.keys().next().value);t.distantStations.set(key,sprite);}
 ctx.imageSmoothingEnabled=false;ctx.drawImage(sprite,origin.x-800,origin.y-800,1600,1600);
 }
}
// Below this scale carriage details occupy subpixels. Preserve the native art
// as an exterior raster; live articulated artwork resumes at normal distance.
function drawDistantTrain(ctx,t,d,car,g,renderer){
 t.distantTrain??=new Map();const angle=Math.round(car.a/(Math.PI*2)*64),roof=Math.round((t.roof[car.id]??1)*4),key=[d.trackRevision||0,car.id,angle,roof,t.engine?1:0,Object.entries(t.doors).filter(([k])=>k.startsWith(car.id+':')).map(([k,v])=>k+'='+v).join(',')].join(':');let sprite=t.distantTrain.get(key);
 if(railwayStream(t)){const image=streamImage(t,'car','car:'+key,{size:160,car:{...car,x:0,y:0,z:0,a:angle/64*Math.PI*2},roof:roof/4,engine:t.engine,doors:t.doors,paint:d.paint,revision:d.trackRevision||0},50);if(image){ctx.imageSmoothingEnabled=false;ctx.drawImage(image,car.x-320,car.y-car.z-400,640,640);}return;}
 if(!sprite){sprite=document.createElement('canvas');sprite.width=sprite.height=160;const pen=sprite.getContext('2d');pen.translate(80,100);pen.scale(.25,.25);drawTrainCar(pen,d,{...car,x:0,y:0,z:0,a:angle/64*Math.PI*2},{time:0,distance:0,speed:0,engine:t.engine,doors:t.doors,roofAlpha:roof/4,staticArt:true});if(t.distantTrain.size>=64)t.distantTrain.delete(t.distantTrain.keys().next().value);t.distantTrain.set(key,sprite);}
 ctx.imageSmoothingEnabled=false;ctx.drawImage(sprite,car.x-320,car.y-car.z-400,640,640);

}
const trackRasters=new WeakMap();
const TRACK_TILE_SIZE=768;
const TRACK_CACHE_LIMIT=48;

export function drawRailwayTrack(ctx,d,route,bounds={left:0,top:0,right:d.width,bottom:d.height},overview=false){
 if(overview||typeof document==='undefined'){
  drawRailwayTrackNative(ctx,d,route,bounds,overview,overview?null:trackRangesInView(route,bounds));
  return;
 }
 // Rails and bridge gaps are part of the walkable ground. Rasterize the
 // visible sections immediately so the terrain worker cannot delay them.
 const {revision}=railwayBridgeState(d),room=d.activeRoom;
 let saved=trackRasters.get(route);
 if(!saved||saved.design!==d||saved.room!==room||saved.revision!==revision){
  saved={design:d,room,revision,chunks:new Map()};
  trackRasters.set(route,saved);
 }
 const size=TRACK_TILE_SIZE;
 const minX=Math.max(0,Math.floor(bounds.left/size)),maxX=Math.min(Math.ceil(d.width/size)-1,Math.floor(bounds.right/size));
 const minY=Math.max(0,Math.floor(bounds.top/size)),maxY=Math.min(Math.ceil(d.height/size)-1,Math.floor(bounds.bottom/size));
 ctx.imageSmoothingEnabled=false;
 for(let cy=minY;cy<=maxY;cy++)for(let cx=minX;cx<=maxX;cx++){
  const key=cx+':'+cy,x=cx*size,y=cy*size;
  let canvas=saved.chunks.get(key);
  if(canvas)saved.chunks.delete(key);
  else{
   const tile={left:x,top:y,right:x+size,bottom:y+size};
   const ranges=trackRangesInView(route,tile);
   if(!ranges.length)continue;
   canvas=document.createElement('canvas');
   canvas.width=canvas.height=size/3;
   const pen=canvas.getContext('2d');
   pen.scale(1/3,1/3);pen.translate(-x,-y);
   drawRailwayTrackNative(pen,d,route,tile,false,ranges);
  }
  saved.chunks.set(key,canvas);
  if(saved.chunks.size>TRACK_CACHE_LIMIT)saved.chunks.delete(saved.chunks.keys().next().value);
  ctx.drawImage(canvas,x,y,size,size);
 }
}

function drawRailwayTracks(ctx,t,bounds,overview,party){
 const draw=area=>{
  for(const route of [t.route,...(t.otherRoutes||[])])drawRailwayTrack(ctx,t.design,route,area,overview);
 };
 const below=party.filter(p=>p.underBridge&&p.hp>0&&!p.trainRide&&bridgeSupportAt(t,p.x,p.y));
 drawBridgeReveal(ctx,bounds,below,draw);
}
function trees(t){if(t.design.scenery)return t.design.scenery;if(t.trees)return t.trees;const d=t.design,list=[];for(let y=120;y<d.height-100;y+=190)for(let x=110;x<d.width-100;x+=180){const seed=Math.abs(Math.sin(x*7.32+y*2.17)),px=x+seed*100,py=y+Math.abs(Math.cos(x*3+y*7))*75;if(Math.abs(px-d.river.x)<d.river.width/2+65||nearestTrainTrack(t.route,px,py).distance<125)continue;list.push({id:'rail-tree-'+list.length,kind:'tree',x:px,y:py,size:86+seed*38,seed:Math.floor(px+py)});}t.trees=list;return list;}
function wrap(ctx,text,x,y,max){const words=text.split(' ');let line='';for(const word of words){if(ctx.measureText(line+word).width>max&&line){ctx.fillText(line,x,y);line='';y+=14;}line+=word+' ';}ctx.fillText(line,x,y);return y;}
function drawShipMapMarker(ctx,x,y,size){
 ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.scale(size,size);
 polygon(ctx,[{x:-5,y:1},{x:5,y:1},{x:3,y:3},{x:-3,y:3}],'#322624');
 polygon(ctx,[{x:-1,y:-5},{x:-1,y:0},{x:4,y:0}],'#f4d99c');
 ctx.fillStyle='#e4ac62';ctx.fillRect(-3,1,7,1);ctx.restore();
}
function pirateSceneOptions(renderer,party){
 const owners=renderer.cameraOwnerIds;
 const viewers=party.filter(p=>!owners?.length||owners.includes(p.id));
 const riders=viewers.filter(p=>p.pirateRide);
 const viewer=riders.find(p=>p.pirateRide.level==='hold')||riders.find(p=>p.pirateRide.level==='nest'||p.pirateRide.level==='rope')||riders[0];
 return viewer?{level:viewer.pirateRide.level,viewerX:viewer.pirateRide.x,viewerY:viewer.pirateRide.y,viewerZ:viewer.pirateVisualLift||0,
  mixedFloors:viewer.pirateRide.level==='hold'&&riders.some(p=>p.pirateRide.level!=='hold')}:{level:'shore'};
}
const visibleShipLevel=(p,options)=>options.mixedFloors||!p.pirateRide||(p.pirateRide.level==='hold')===(options.level==='hold');
const surfaceLift=(d,p)=>p.pirateVisualLift||p.trainGround||mountainActorLift(d,p);
const railActorSurface=(d,actor,cars)=>cars[actor.trainRide?.car]?20+trainRiderWorld(cars,actor.trainRide).z:surfaceLift(d,actor);
const PLAYER_SEAT_LIFT=TRAIN_SEAT_HEIGHT+2-TRAIN_SEATED_PELVIS_HEIGHT*PLAYER_RENDER_SIZE/48;

function drawRailPlayerContact(ctx,d,actor,size){
 if(actor.carriedBy||actor.swimming||actor.underBridge)return;
 if(!actor.trainRide&&!actor.trainDeck&&!actor.pirateRide&&railwaySurface(d,actor.x,actor.y+(actor.characterSurfaceLift||0))==='water')return;
 const {x,y,rx,ry,alpha}=actorContact(null,actor,size,true,0);
 ctx.fillStyle=`rgba(9,28,22,${alpha})`;
 ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill();
}

function railCharacterLighting(renderer,g,party,cars,props,visible){
 const d=g.trainTest.design,sun=d.activeRoom?0:daylight(g)*(!g.weather?1:.45);
 const surfaces=new Map(party.map(p=>['actor:'+p.id,railActorSurface(d,p,cars)]));
 const sources=lightSources(g).filter(source=>visible(source,source.radius)).map(source=>{
  const surface=surfaces.get(source.owner);
  return surface?{...source,height:(source.height??36)+surface}:source;
 });
 const actors=[...party,...(g.enemies||[])].filter(a=>visible(a,240));
 return outdoorLightingFrame(g,{view:renderer,sources,scenery:props,actors,active:renderer.dynamicShadows,sun});
}
export function drawTrainTestMap(renderer,g,w,h){
 const t=g.trainTest;if(!t?.design||t.wildLandsOverview||inDiagon(g))return;
 const d=t.design,ctx=renderer.ctx,hollow=d.activeRoom===HOLLOW_ROOM,ship=pirateShip(g),party=g.players.filter(p=>!p.room);
 const area=hollow?HOLLOW_BOUNDS:{left:0,top:0,right:d.width,bottom:d.height};
 const width=area.right-area.left,height=area.bottom-area.top,mw=Math.min(renderer.splitChild?55:100,w*.2),mh=mw*height/width;
 const mx=renderer.hudAnchor?.x??w-mw-10,my=renderer.hudAnchor?.y??Math.max(8,h-mh-50);
 const mapX=x=>mx+(x-area.left)*mw/width,mapY=y=>my+(y-area.top)*mh/height;
 ctx.fillStyle='#1a302be8';ctx.fillRect(mx-3,my-3,mw+6,mh+6);
 if(hollow)drawHollowMap(ctx,mx,my,mw,mh);
 else{
  ctx.save();ctx.translate(mx,my);ctx.scale(mw/d.width,mh/d.height);
  if(d.wildLands)drawWildLandsMap(ctx,t,0,0,d.width,d.height);
  else{ctx.fillStyle='#52754a';ctx.fillRect(0,0,d.width,d.height);ctx.fillStyle='#55a0a9';ctx.fillRect(d.river.x-d.river.width/2,0,d.river.width,d.height);}
  ctx.strokeStyle='#dac388';ctx.lineWidth=35;ctx.beginPath();t.route.points.forEach((q,i)=>i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y));ctx.stroke();
  for(const c of trainCars(t)){ctx.fillStyle='#e8ba76';ctx.fillRect(c.x-55,c.y-55,110,110);}ctx.restore();
 }
 if(ship)drawShipMapMarker(ctx,mapX(ship.x),mapY(ship.y),.7);
 ctx.fillStyle='#ffffff';for(const p of party)ctx.fillRect(mapX(p.x)-.5,mapY(p.y)-.5,hollow?1.5:1,hollow?1.5:1);
}
export function drawTrainTest(renderer,g,dt){
 renderer.worldLights??=new WorldLightRenderer();
 beginParticleFrame(renderer.ctx,{budget:384,maxPixelFx:12,quality:renderer.camera.zoom<.3?.4:1});
 const costs={},start=performance.now();let last=start;const mark=name=>{const now=performance.now();costs[name]=now-last;last=now;};
 syncStationAssets(g);
 const t=g.trainTest,d=t.design,{w,h}=renderer.resize(),ctx=renderer.ctx,hollow=d.activeRoom===HOLLOW_ROOM,pitch=inQuidditch(g),arena=inDiagonArena(g);
 const party=g.players.filter(p=>!p.room).map(p=>{const a=controlledUnit(g,p);return a?{...p,...a,x:p.x,y:p.y,trainRide:p.trainRide}:p;});
 const cs=hollow||pitch||arena?[]:trainCars(t),fallback=cs[0]||HOLLOW_EXIT,xs=party.length?party.map(p=>p.x):[fallback.x],ys=party.length?party.map(p=>p.y):[fallback.y];
 const focus={x:(Math.min(...xs)+Math.max(...xs))/2,y:(Math.min(...ys)+Math.max(...ys))/2};
 if(t.wildLandsOverview){focus.x=d.width/2;focus.y=d.height/2;}
 const alley=inDiagon(g),ship=alley||arena?null:pirateShip(g),shipView=pirateSceneOptions(renderer,party);
 if(renderer.cameraOverride)Object.assign(focus,renderer.cameraOverride);
 if(!t.wildLandsOverview){
  const localParty=party.filter(p=>!renderer.cameraOwnerIds?.length||renderer.cameraOwnerIds.includes(p.id));
  const averageLift=localParty.reduce((sum,p)=>{
   if(pitch)return sum+(p.jumpHeight||0)*.66;
   if(p.mountainDescent)return sum+(p.trainGround||0)+(p.jumpHeight||0);
   return sum+mountainActorLift(d,p);
  },0)/Math.max(1,localParty.length);
  focus.y-=shipView.viewerZ||averageLift;
  if(hollow&&!renderer.splitChild&&shipView.level==='shore')focus.y-=36*clamp((focus.y-5250)/300,0,1);
 }
 const zoomLimit=hollow?1.02:pitch?.84:arena?1.16:1.35;
 let zoom=t.wildLandsOverview?Math.min(w/d.width,h/d.height)*.92:clamp(Math.min(w/(Math.max(...xs)-Math.min(...xs)+260),h/(Math.max(...ys)-Math.min(...ys)+250),zoomLimit),.012,1.35),camera=renderer.camera;
 if(renderer.cameraOverride)zoom=hollow?Math.min(renderer.cameraOverride.zoom,zoomLimit):renderer.cameraOverride.zoom;
 if(renderer.trainScene!==t){camera.x=focus.x;camera.y=focus.y;camera.zoom=zoom;renderer.trainScene=t;}snapPortalCamera(renderer,g,{x:focus.x,y:focus.y,zoom});const k=1-Math.exp(-Math.max(.02,dt)*(renderer.cameraFollowSpeed||5));camera.x+=(focus.x-camera.x)*k;camera.y+=(focus.y-camera.y)*k;camera.zoom+=(zoom-camera.zoom)*k;if(renderer.cameraOverride)camera.zoom=Math.max(renderer.cameraZoomFloor||.25,camera.zoom);
 const bounds={left:camera.x-w/2/camera.zoom,top:camera.y-h/2/camera.zoom,right:camera.x+w/2/camera.zoom,bottom:camera.y+h/2/camera.zoom},visible=(q,r=150)=>q.x>bounds.left-r&&q.x<bounds.right+r&&q.y>bounds.top-r&&q.y<bounds.bottom+r;
 if(!d.activeRoom&&!t.wildLandsOverview)observeRailwayTicketView(t,bounds,renderer.cameraOwnerIds);
 const showShip=ship&&!t.wildLandsOverview&&visible(ship,490);
 ctx.fillStyle=d.wildLands?'#235765':'#31553b';ctx.fillRect(0,0,w,h);ctx.save();ctx.translate(w/2,h/2);ctx.scale(camera.zoom,camera.zoom);ctx.translate(-camera.x,-camera.y);
 if(inDiagon(g)){t.preparing=false;drawDiagonAlley(renderer,g,w,h);return;}
 if(arena){t.preparing=false;drawDiagonArena(renderer,g,w,h,bounds);return;}
 if(pitch){t.preparing=false;drawQuidditchScene(renderer,g,w,h,bounds);return;}
 t.grassSeed=g.seed||42;t.streamCoverage={groundPending:0,propPending:0,grassPending:0,grassHoles:0};t.viewZoom=camera.zoom;prepareRailwayView(t,bounds,party,renderer.splitChild?'split:'+renderer.cameraViewId:'shared');mark('setup');t.destructionRevision=g.house?.destructionRevision||0;t.damagedBuildings=(g.house?.walls||[]).filter(o=>o.destroyed||o.sectionDamage).map(o=>({id:o.id,destroyed:o.destroyed,sectionDamage:o.sectionDamage}));t.spriteLibrary=g.spriteLibrary;t.shaderGrass=false;refreshNativeProps(t);
 const starting=!!t.preparing;
 const forest=d.wildLands?(t.wildLandsOverview||hollow?[]:wildLandsProps(t,bounds)):railwayForestProps(t,bounds);
 if(!t.wildLandsOverview)g.scenery=forest;
 if(!starting)prepareSceneryPoses(t,g,bounds,renderer.splitChild?renderer.cameraViewId:'shared');
 mark('props');
 if(hollow){drawWildHollow(ctx,bounds,t.time);drawHollowStalactites(ctx,g,visible);t.streamCoverage.groundReady=true;}
 else if(d.wildLands){drawWildLandsFloor(ctx,t,bounds,t.wildLandsOverview,starting?null:g);if(!t.wildLandsOverview||d.activeRoom)drawWildLandsLandmarks(ctx,t,bounds,g);if(!starting&&camera.zoom>=.3&&!d.activeRoom){g.forestLandscape=t.forestPlan??={seed:42,routes:[],landmarks:[],cover:[],routeField:new Float32Array(10000).fill(200),paving:{cells:Array(576).fill(0)}};renderer.railwayGrass??=new GrassFieldRenderer();t.shaderGrass=renderer.railwayGrass.draw(ctx,g,camera,w,h,false,renderer.canvas);drawForestSunlight(ctx,g,bounds,daylight(g));}if(!d.activeRoom&&!t.wildLandsOverview){drawWildMountain(ctx,bounds,t.time,t,true);if(camera.zoom>=.26)drawHogsmeadeGround(ctx,g,bounds);}}
 else{
 drawRailwayForestFloor(ctx,t,bounds,t.time);
 if(!starting){const world=t.forestWorld??={};Object.assign(world,{...g,environment:'forest',generatedEnvironment:'forest',mapMode:'railway',bloom:3,seed:42,scenery:forest,house:null,forestLandscape:t.forestPlan??={seed:42,routes:[],landmarks:[],cover:[],routeField:new Float32Array(10000).fill(200),paving:{cells:Array(576).fill(0)}}});renderer.railwayGrass??=new GrassFieldRenderer();t.shaderGrass=renderer.railwayGrass.draw(ctx,world,camera,w,h,false,renderer.canvas);drawForestSunlight(ctx,world,bounds,daylight(g));
  for(let y=Math.floor(bounds.top/32)*32;y<bounds.bottom+32;y+=32)for(let x=Math.floor(bounds.left/32)*32;x<bounds.right+32;x+=32)if(railwaySurface(d,x+16,y+16)!=='grass')drawWaterSurface(ctx,g,x,y,32,32);
 }
 }
 if(d.wildLands&&!starting&&camera.zoom>=.6)drawTracks(ctx,g,p=>visible(p,28));
 const overlook=overlookMazeFor(g);
 drawOverlookGarden(ctx,overlook,visible,camera.zoom>=.28);
 if(overlook)drawOverlookClippings(ctx,g.effects,visible);
 mark('terrain');if(!hollow){if(camera.zoom<.3)drawDistantStations(ctx,t,g,renderer,visible);else drawStationGround(ctx,d,t.time,bounds);}renderer.drawWorldLoot(g,w,h);
 const paintWaterDonors=!hollow&&!d.activeRoom&&!t.wildLandsOverview&&!starting?(pen,view)=>paintRailReflections(pen,t,cs,view):null;
 renderer.drawCombatGround(g,w,h,{omitTelegraphs:true,paintWaterDonors});
 const showTideglass=d.wildLands&&!d.activeRoom&&!t.wildLandsOverview&&camera.zoom>=.35;
 if(showTideglass)drawTideglassGround(ctx,t,bounds);
 if(!starting&&camera.zoom>=.36)drawWildCoastalCritters(ctx,g,visible);
 const riverPlants=!hollow&&!starting&&!d.activeRoom&&!t.wildLandsOverview&&camera.zoom>=.4?riverBankVegetation(d,bounds):[];
 if(riverPlants.length)drawRiverShallows(ctx,g,riverPlants);
 const mountainViewer=party.find(p=>!renderer.cameraOwnerIds?.length||renderer.cameraOwnerIds.includes(p.id));
 const mountainForeground=d.wildLands&&!d.activeRoom&&!t.wildLandsOverview?
  drawWildMountainUpper(ctx,bounds,t.time,t,mountainViewer?mountainActorLift(d,mountainViewer):0,camera.zoom>=.4):null;
 const merlockCamps=!starting&&camera.zoom>=.34?visibleMerlockCamps(g,visible):[];
 for(const camp of merlockCamps)drawMerlockCampGround(ctx,camp);
 const shoreSubjects=[...riverPlants.filter(p=>p.kind==='cattail').map(p=>({...p,riverCattail:p,depth:p.y})),...merlockCampSubjects(merlockCamps)];
 const shoreWind=shoreSubjects.length?vegetationWindStrength(g):1;
 if(!t.wildLandsOverview)drawStoragePortals(ctx,g,visible);
 const visibleGrounding=d.wildLands&&!starting&&camera.zoom>=.3;
 const lightProps=visibleGrounding?forest.filter(p=>visible(p,184)):[];
 const playerLighting=visibleGrounding?railCharacterLighting(renderer,g,party,cs,lightProps,visible):null;
 const priorLighting=renderer.animator.lighting;
 renderer.animator.lighting=playerLighting;
 if(visibleGrounding&&!d.activeRoom&&renderer.dynamicShadows){
  const casters=[...party,...(g.enemies||[])].filter(a=>visible(a,80));
  drawOutdoorSunShadows(ctx,g,lightProps,casters,{strength:playerLighting.sun,
   underCover:a=>railwaySurface(d,a.x,a.y)==='water'});
 }
 if(playerLighting)renderer.worldLights.drawGround(ctx,playerLighting,visible);
 if(!hollow&&camera.zoom>=.18)for(const route of [t.route,...(t.otherRoutes||[])])drawTrackBridgeRipples(ctx,d,route,bounds,t.time);
 const below=party.filter(p=>p.underBridge&&!p.trainRide&&p.hp>0);
 for(const p of party){
  if(p.swimming&&!p.trainRide)drawMountainForegroundActor(ctx,mountainForeground,p,0,pen=>drawSwimmer(pen,p,g.time,actor=>renderer.animator.draw(pen,actor,g.time,PLAYER_RENDER_SIZE)));
  else if(below.includes(p))drawMountainForegroundActor(ctx,mountainForeground,p,0,pen=>renderer.animator.draw(pen,p,g.time,PLAYER_RENDER_SIZE));
 }
 if(!t.wildLandsOverview&&d.wildLands&&!d.activeRoom)drawBridgeReveal(ctx,bounds,below,area=>drawWildLandsCrossings(ctx,d,area));
 const coachLoot=new Map(),gangwayLoot=[],shipLoot=[];
 for(const item of g.loot||[]){
  const surface=item.railwaySurface;
  if(surface?.kind==='ship'){
   if(showShip&&surface.shipId===ship.id&&visibleShipLevel({pirateRide:surface},shipView))shipLoot.push(item);
  }else if(surface?.kind==='train'){
   if(surface.gangway)gangwayLoot.push(item);
   else {
    if(!coachLoot.has(surface.car))coachLoot.set(surface.car,[]);
    coachLoot.get(surface.car).push(item);
   }
  }
 }
 if(showShip){
  drawPirateShipGround(ctx,ship,shipView);
  if(shipLoot.length)renderer.drawAttachedLoot(g,w,h,shipLoot);
 }
 // Display other saved branches as real rails; only the selected itinerary drives the train.
 if(!hollow)drawRailwayTracks(ctx,t,bounds,camera.zoom<.18,party);
 if(!starting&&!t.wildLandsOverview)drawBayouGoblinHutGround(ctx,d,visible);
 // Ground warnings belong on the walkable rail surface, beneath cars and actors.
 renderer.drawCombatTelegraphs(g,w,h);
 for(const p of party){if(!visibleShipLevel(p,shipView))continue;const lift=p.trainVisualLift||surfaceLift(d,p);if(!p.trainRide)paintSwordCharge(ctx,p,g.time,lift);drawBowAim(ctx,p,1,g.time,g,lift);}
 for(let i=1;!t.derailed&&i<cs.length;i++)drawTrainGangway(ctx,cs[i],cs[i-1]);
 if(!t.derailed&&gangwayLoot.length)renderer.drawAttachedLoot(g,w,h,gangwayLoot);
 if(!hollow)drawAlleyGate(ctx,g);
 drawDestruction(ctx,g,p=>visible(p,100),{groundOnly:true});
 mark('ground-stations-track');
 const students=hollow?[]:[...trainStudents(g,cs),trainTailor(g,cs),trainConductor(g,cs)].filter(Boolean);
 const ridersFor=car=>party.filter(p=>p.trainRide&&(p.trainRide.car===car.index||p.trainRide.gangway?.to===car.index))
  .map(p=>({...p.trainRide,...trainLocal(car,p),height:p.jumpHeight||p.groundHeight||0}));
 const passengers=[];
 for(const n of students){
  if(camera.zoom<.18||!visible(n.actor,90))continue;
  const {car}=n,ride=n.ride||{car:car.index,...n.local,seat:n.seatId,facing:0};
  // A closed native roof covers a seated passenger completely. Custom roofs
  // may have differently placed cutouts and still use the geometry masks.
  if(n.seatId&&(t.roof[car.id]??1)>=.995&&!d.art?.[car.kind+':roof:'+trainViewIndex(car.a)])continue;
  const anchor=trainRiderWorld(cs,ride);
  const player={...n.actor,y:n.actor.y+20+anchor.z,trainStudent:n.id!=='conductor',trainMaskPoint:anchor,trainRide:ride};
  passengers.push({depth:trainActorDepth({...player,y:anchor.y},cs),player});
 }
 const frameCarOptions=new Map(),carOptions=car=>{let options=frameCarOptions.get(car.index);if(!options){options={time:t.time,distance:t.distance,speed:t.speed,engine:t.engine,doors:t.doors,riders:ridersFor(car),wallVisibility:new Map(),occlusionFrame:{parts:new Map()},cocoaTaken:t.cocoaTaken,world:{time:g.time,scenery:forest},roofAlpha:t.roof[car.id]??1};frameCarOptions.set(car.index,options);}return options;};
 drawTrainShadows(ctx,cs.filter(car=>visible(car,car.length+car.width)));
 const shipSubjects=showShip?[{shipForeground:true,depth:Math.max(...PIRATE_SHIP_LAYOUT.hull.map(p=>pirateShipPoint(ship,p.x,p.y).y))}]:[];
 if(showShip&&hollow&&shipView.level==='hold'){
  for(const [part,fixture] of [['chair',WILLY_CHAIR],['table',WRECK_TREASURE_TABLE]]){
   const point=pirateShipPoint(ship,fixture.x-fixture.width*.32,fixture.y+fixture.depth/2);
   shipSubjects.push({wreckTreasure:part,depth:point.y});
  }
 }
 const shipCrew=showShip?pirateCrewActors(g).filter(p=>visibleShipLevel(p,shipView)&&
  (p.hp>0||p.pirateHostile&&(p.deathTimer||0)<3.5)&&visible({x:p.x,y:p.y-p.pirateVisualLift},105)):[];
 for(const actor of shipCrew)shipSubjects.push({pirateActor:actor,depth:actor.y});
 const enemies=[];
 for(const actor of [...(g.enemies||[]),...(g.ghosts||[]),...(g.villageFollowers||[]),...hunterPets(g),...activePatronuses(g)]){
  if(actor.controlledBy||actor.pirateRole)continue;
  const lift=mountainActorLift(d,actor);
  const enemy=lift?{...actor,y:actor.y-lift}:actor;
  if(visible(enemy,actor.tickTockCrocodile?240:undefined))enemies.push({depth:trainActorDepth(actor,cs),enemy,lift});
 }
 const cacheSubject=camera.zoom>=.3?frozenExplorerCacheSubject(t,visible):null;
 const objects=[...shoreSubjects,...(camera.zoom>=.26?hogsmeadeSubjects(g,visible):[]),...(cacheSubject?[cacheSubject]:[]),...(camera.zoom>=.28?overlookSubjects(overlook,visible,g).map(subject=>({overlookSubject:subject,depth:subject.depth})):[]),...(hollow?[]:g.stationOwls||[]).filter(a=>!a.hidden&&visible(a)).map(owl=>({owl,depth:owl.y})),...(hollow?[]:escapedChocolateFrogs(g)).filter(a=>!a.room).map(frog=>({frog,depth:trainActorDepth(frog,cs)})),...(hollow||camera.zoom<.3?[]:wildBuildingSubjects(d)).filter(q=>visible(q,200)),...forest.filter(q=>visible(q)).map(tree=>({depth:tree.rootY??tree.y,tree})),...(hollow?[]:stationSubjects(d,t.time,t.stationCats,bounds)).filter(q=>(camera.zoom>=.3||q.stationCat&&camera.zoom>=.18)&&visible(q,500)).map(subject=>({depth:subject.depth,subject})),...cs.filter(q=>{const hx=Math.abs(Math.cos(q.a))*q.length/2+Math.abs(Math.sin(q.a))*q.width/2+24,hy=Math.abs(Math.sin(q.a))*q.length/2+Math.abs(Math.cos(q.a))*q.width/2+24;return q.x+hx>bounds.left&&q.x-hx<bounds.right&&q.y+hy>bounds.top&&q.y-hy-q.z-116<bounds.bottom;}).map(car=>({depth:trainCarDepth(car),car})),...enemies,...g.players.filter(p=>!p.room&&p.controlledFollowerId&&p.controlPetPosition).map(p=>({player:{...p,...p.controlPetPosition,...(p.controlMainLoadout||{}),controlledFollowerId:null,trainRide:null,moving:!!p.controlPetPosition.moving,walking:true,attack:0,charge:0,dashTime:0,animationAction:null},depth:p.controlPetPosition.y})),...passengers,...shipSubjects,...party.filter(p=>!p.swimming&&!below.includes(p)&&visibleShipLevel(p,shipView)&&visible({x:p.x,y:p.y-surfaceLift(d,p)-(p.jumpHeight||p.groundHeight||0)},180)).map(player=>({depth:trainActorDepth(player,cs),player}))].sort((a,b)=>a.depth-b.depth);
 const visitors=camera.zoom>=.3?mysteryVisitors(g).filter(npc=>visible(npc,60)):[];
 const veilChest=camera.zoom>=.3?veilGlaiveChestSubject(t,visible):null;
 if(veilChest)objects.push(veilChest);
 for(const npc of visitors)objects.push({mysteryVisitor:npc,depth:npc.y});
 const eastern=showTideglass?tideglassSubjects(t,bounds):[];
 if(visitors.length||eastern.length||veilChest){objects.push(...eastern);objects.sort((a,b)=>a.depth-b.depth);}
 const sageHut=!starting&&!t.wildLandsOverview?bayouGoblinHutSubjects(g,party,visible):[];
 if(sageHut.length){objects.push(...sageHut.map(o=>({depth:o.depth,sageHut:o})));objects.sort((a,b)=>a.depth-b.depth);}
 const homeBoard=wildHomesteadBoardTable(d),boardPortal=homesteadBoardSuction(g);
 if(homeBoard&&visible(homeBoard,80)){
  const depth=boardTableDepth(homeBoard);
  for(const o of objects)if(o.player)o.depth=boardActorDepth(g,o.player,o.depth);
  objects.push({homeBoard,depth});objects.sort((a,b)=>a.depth-b.depth);
 }
 const queued=sceneryBatches(renderer,g,t,objects,(pen,tree)=>{const biome=tree._biome||(d.wildLands?wildLandsGround(d,tree.x,tree.y):'forest');if(camera.zoom<.3||camera.zoom<.6&&!['tree','snow_tree','palm','leafless_tree','grave_forest_tree','rock','ice_rock','forest_ruin'].includes(tree.kind))drawDistantProp(pen,t,tree,g,biome);else drawNativePropCached(pen,t,tree,g,biome,true);});const paintedCars=new Set();for(const o of queued){
 if(o.wreckTreasure){drawWreckTreasure(ctx,ship,o.wreckTreasure);continue;}
 if(o.merlockCamp){drawMerlockCampFixture(ctx,o,t.time);continue;}
 if(o.sageHut){
  const {npc,paint}=o.sageHut;
  if(npc){drawRailPlayerContact(ctx,d,npc,48);renderer.animator.draw(ctx,npc,g.time,48);}
  else paint(ctx);
  continue;
 }
 if(o.veilGlaiveChest){drawVeilGlaiveChest(ctx,t);continue;}
 if(o.mysteryVisitor){
  const npc=o.mysteryVisitor;
  drawRailPlayerContact(ctx,d,npc,npc.dog?38:PLAYER_RENDER_SIZE);
  if(npc.dog)drawMysteryDog(ctx,npc,g.time,45);
  else renderer.animator.draw(ctx,npc,g.time,PLAYER_RENDER_SIZE);
  continue;
 }
 if(o.homeBoard){const view=homesteadBoardView(g);renderer.boardBase(ctx,{...view,openingBoard:true},o.homeBoard);renderer.boardTop(ctx,view,o.homeBoard);if(boardPortal)drawHomesteadBoardPortal(ctx,boardPortal,g.time);continue;}if(o.tideglass){const {paint,actor}=o.tideglass;if(actor)renderer.animator.draw(ctx,actor,g.time,PLAYER_RENDER_SIZE);else paint(ctx);continue;}if(o.riverCattail){drawRiverCattails(ctx,o.riverCattail,g.time,shoreWind);continue;}if(o.hogsmeade){const {npc,paint}=o.hogsmeade;if(npc)renderer.animator.draw(ctx,npc,g.time,npc.id==='hagrid'?57:(npc.renderSize??48));else paint(ctx);continue;}if(o.frozenExplorerCache){drawFrozenExplorerCache(ctx,t);continue;}if(o.shipForeground){drawPirateShipForeground(ctx,ship,shipView);continue;}if(o.pirateActor){drawPirateCrewMember(renderer,g,o.pirateActor);continue;}if(o.overlookSubject){drawOverlookSubject(ctx,o.overlookSubject);continue;}if(o.sceneryBatch){drawSceneryBatch(ctx,o.sceneryBatch);continue;}if(o.owl){drawSnowyOwl(ctx,o.owl,g.time);continue;}if(o.frog){const a=o.frog,lift=a.trainRide?20+(cs[a.trainRide.car]?.z||0):0;drawChocolateFrog(ctx,{...a,y:a.y-lift},g.time);continue;}if(o.wildBuildingAsset){drawWildBuildingSubject(ctx,g,o);continue;}if(o.enemy){drawMountainForegroundActor(ctx,mountainForeground,o.enemy,o.lift,pen=>{drawActorGameplayFx(pen,g,o.enemy,43,'back');if(o.enemy.hunterPet&&o.enemy.owlVariant)drawHunterPet(pen,o.enemy,g.players.find(p=>p.id===o.enemy.owner)||{},g.time);else if(o.enemy.tickTockCrocodile)drawTickTockCrocodile(pen,renderer.animator,o.enemy,g.time,43);else renderer.animator.draw(pen,o.enemy,g.time,43);drawActorGameplayFx(pen,g,o.enemy,43,'front');});continue;}if(o.subject){drawStationSubject(ctx,d,o.subject,t.time,renderer,party,g);continue;}if(o.tree){ctx.save();if(party.some(p=>isOccluded(o.tree,g.spriteLibrary?.[o.tree.kind],p)))ctx.globalAlpha=.4;const biome=o.tree._biome||(d.wildLands?wildLandsGround(d,o.tree.x,o.tree.y):'forest');if(camera.zoom<.3||camera.zoom<.6&&!['tree','snow_tree','palm','leafless_tree','grave_forest_tree','rock','ice_rock','forest_ruin'].includes(o.tree.kind))drawDistantProp(ctx,t,o.tree,g,biome);else drawNativePropCached(ctx,t,o.tree,g,biome);ctx.restore();continue;}if(o.player){const p=o.player;if(p.vehicleId||drawBedSleeper(ctx,p,g.time,renderer.animator))continue;const studentSize=p.trainStudent?TRAIN_STUDENT_RENDER_SIZE:PLAYER_RENDER_SIZE,r=p.trainRide,seat=r?.seat;
 if(boardPortal?.playerId===p.id){drawHomesteadSuctionActor(ctx,renderer,p,boardPortal,g.time,studentSize);continue;}
 const rideAnchor=r?trainRiderWorld(cs,r):null;
 const maskPoint=p.trainMaskPoint||(seat?rideAnchor:p);
 // Keep the matte at the physical seat while lifting the native seated pose onto its cushion.
 const lift=r?20+rideAnchor.z+(seat&&!p.trainMaskPoint?PLAYER_SEAT_LIFT:0):surfaceLift(d,p);
 const actor={...p,y:p.y-lift,animationAction:seat?'train_sit':p.animationAction};
 if(r)paintSwordCharge(ctx,p,g.time);for(const fx of g.effects||[])if(fx.owner===p.id&&fx.trainCar!=null&&fx.swordPolish&&fx.swordPolish!=='impact'){const car=cs[fx.trainCar];if(car){const q=trainWorld(car,fx.trainX,fx.trainY);drawSwordCombatEffect(ctx,{...fx,x:q.x,y:q.y-20-(car.z||0)});}}paintSwordAfterimages(ctx,actor,g.time,studentSize,(c,a,time,size)=>renderer.animator.draw(c,a,time,size),lift);
 const foreground=camera.zoom<.18?[]:cs.filter(car=>paintedCars.has(car.index)&&Math.abs(maskPoint.x-car.x)<Math.abs(Math.cos(car.a))*car.length/2+Math.abs(Math.sin(car.a))*car.width/2+100&&Math.abs(maskPoint.y-car.y)<Math.abs(Math.sin(car.a))*car.length/2+Math.abs(Math.cos(car.a))*car.width/2+150).sort((a,b)=>trainCarDepth(a)-trainCarDepth(b)).map(car=>({car,rider:{...trainLocal(car,maskPoint),height:p.jumpHeight||p.groundHeight||0,floor:r?20:(p.trainGround||0)-car.z,seatCushionId:r?.car===car.index&&seat?.startsWith(car.id+':')?seat.slice(car.id.length+1):null},options:{...carOptions(car),design:d}}));
 actor.characterSurfaceLift=lift;
 drawMountainForegroundActor(ctx,mountainForeground,actor,lift,mountainPen=>drawTrainRiderLayer(mountainPen,renderer,actor,foreground,pen=>{
  if(visibleGrounding)drawRailPlayerContact(pen,d,actor,studentSize);
  drawActorGameplayFx(pen,g,actor,studentSize,'back');
  renderer.animator.draw(pen,actor,g.time,studentSize);
  drawActorGameplayFx(pen,g,actor,studentSize,'front');drawHappySparkles(pen,actor,g.time);
 }));continue;}const car=o.car;if(t.derailed&&car.sink>=1)continue;ctx.save();if(t.derailed){ctx.globalAlpha=Math.max(0,1-car.sink*.85);const waterY=car.y+12;ctx.beginPath();ctx.rect(car.x-car.length-200,waterY-car.length-400,car.length*2+400,car.length+400);ctx.clip();}
  if(camera.zoom<.18){drawDistantTrain(ctx,t,d,car,g,renderer);ctx.restore();paintedCars.add(car.index);continue;}
  const items=coachLoot.get(car.index),options=carOptions(car);
  const paintLoot=items?.length&&options.roofAlpha<.995?()=>{
   ctx.save();ctx.translate(-car.x,-car.y+car.z);
   renderer.drawAttachedLoot(g,w,h,items);
   ctx.restore();
  }:undefined;
  drawTrainCar(ctx,d,car,options,paintLoot);ctx.restore();paintedCars.add(car.index);
 }
 renderer.animator.lighting=priorLighting;
 mark('subjects');if(!hollow)drawTrainBridgeWater(ctx,t);drawNightEquipment(ctx,g);renderer.drawCombatProjectiles(g,w,h,shot=>!shot.pirateRide||showShip&&visibleShipLevel(shot,shipView));renderer.drawCombatEffects(g);drawDestruction(ctx,g,p=>visible(p,100),{airOnly:true});
 if(d.wildLands&&!d.activeRoom&&!starting&&camera.zoom>=.6)drawFallingLeaves(ctx,g,p=>visible(p,30),forest);
 if(!hollow&&camera.zoom>=.3)drawWildHomesteadDetails(ctx,g,visible);
 if(showShip){
  drawPirateShipEffects(ctx,ship,shipView);
  const line=pirateCrewSpeech(g),speaker=line&&shipCrew.find(actor=>actor.id===line.actorId&&actor.hp>0);
  if(speaker)drawPirateCrewSpeech(ctx,speaker,line.text);
 }
 if(!starting&&camera.zoom>=.36)drawWildCoastalCritters(ctx,g,visible,renderer.animator);
 for(const p of hollow?[]:t.particles){const f=p.life/p.max,age=1-f;ctx.save();ctx.globalAlpha=(p.kind==='smoke'?.52:.8)*Math.min(1,f*2,age*9);const size=p.size,x=Math.round(p.x/2)*2,y=Math.round(p.y/2)*2;if(p.kind==='smoke'||p.kind==='steam')drawPixelTrainCloud(ctx,p,x,y);else{ctx.fillStyle=p.kind==='spark'?'#ffe79d':'#f5aa4f';ctx.fillRect(x,y,size,size);}ctx.restore();}
 const dark=1-daylight(g);if(!hollow&&dark>0){ctx.fillStyle=`rgba(9,20,39,${dark*.48})`;ctx.fillRect(bounds.left,bounds.top,bounds.right-bounds.left,bounds.bottom-bounds.top);}
 if(hollow||d.wildLands&&!d.activeRoom)drawMountainLights(ctx,bounds,t.time,hollow,dark);
 if(showTideglass)drawTideglassLights(ctx,t,bounds,dark);
 if(!hollow)drawStationLights(ctx,d,t.time,dark>.3);
 if(!t.wildLandsOverview)drawBayouGoblinHutLamp(ctx,d,visible,dark);
 if(!hollow&&camera.zoom>=.3)drawWildHomesteadDetails(ctx,g,visible,true);
 if(dark>.15&&!t.derailed&&cs.length){const engine=cs[0],q=trainWorld(engine,engine.length*.48,0,38),a=engine.a;ctx.save();ctx.translate(q.x,q.y);ctx.rotate(a);ctx.globalCompositeOperation='screen';const light=ctx.createLinearGradient(0,0,420,0);light.addColorStop(0,'#ffe9a090');light.addColorStop(1,'#ffe9a000');ctx.fillStyle=light;ctx.beginPath();ctx.moveTo(0,-8);ctx.lineTo(420,-125);ctx.lineTo(420,125);ctx.lineTo(0,8);ctx.closePath();ctx.fill();ctx.fillStyle='#fff1c2';ctx.fillRect(-3,-5,9,10);ctx.restore();}
 if(!t.wildLandsOverview)for(const p of party)if(visibleShipLevel(p,shipView))drawBreath(ctx,p);
 ctx.restore();
 if(d.wildLands&&!d.activeRoom&&!t.wildLandsOverview)drawWildWeather(ctx,g,renderer,camera,w,h,dt);
 if(ship&&t.wildLandsOverview)drawShipMapMarker(ctx,w/2+(ship.x-camera.x)*camera.zoom,h/2+(ship.y-camera.y)*camera.zoom,1.2);
 if(!hollow){drawStudentSpeech(ctx,g,cs,camera,w,h,students.map(n=>n.actor));drawConductorSpeech(ctx,g,cs,camera,w,h,students.map(n=>n.actor));}
 // The same outlined, display-resolution typography as the lobby prop captions.
 const shownSites=new Set();
 for(const p of party){
  if(t.wildLandsOverview||p.ui||!visibleShipLevel(p,shipView))continue;
  let text=trainPrompt(g,p);
  if(!text)continue;
  const site=nearbyWildSite(g,p);
  if(site&&text.endsWith(' · SUPPLIES')){
   if(shownSites.has(site.id))continue;
   shownSites.add(site.id);
   text=party.filter(q=>nearbyWildSite(g,q)?.id===site.id).map(q=>trainPrompt(g,q)).filter(prompt=>prompt.endsWith(' · SUPPLIES')).map(prompt=>prompt.split(' · ')[0]).join(' / ')+' · SUPPLIES';
  }
  const driving=!!p.trainRide?.driving;
  const parts=driving?text.split(' · '):null;
  const lines=parts?[parts[0],parts[1],parts.slice(2).join(' · ')]:[text];
  const spacing=14,x=driving?Math.round(w/2):Math.round(w/2+(p.x-camera.x)*camera.zoom);
  const belowActor=text.includes('TALK TO')||text.includes('TICKET OFFICE')||text.includes('INSPECT ONE-EYED WILLY');
  const rawY=h/2+(p.y-surfaceLift(d,p)-camera.y+(belowActor?18:-(p.trainRide?68:52)))*camera.zoom;
  const belowY=h/2+(p.y-camera.y+18)*camera.zoom;
  const y=Math.round(driving?Math.max(52,Math.min(90,h*.19)):
   Math.max(64,Math.min(h-(t.noticeUntil>t.time?62:18),rawY<64?belowY:rawY)));
  ctx.save();ctx.font='650 12px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineWidth=3;ctx.strokeStyle='#10231fe8';ctx.fillStyle=p.color||'#ffe7a9';
  for(const [index,line] of lines.entries()){
   const yy=y+index*spacing;
   if(driving){ctx.strokeText(line,x,yy,w-20);ctx.fillText(line,x,yy,w-20);}
   else{ctx.strokeText(line,x,yy);ctx.fillText(line,x,yy);}
  }
  ctx.restore();
 }
 if(!renderer.splitChild&&t.noticeUntil>t.time){
  ctx.fillStyle='#172b2ce8';ctx.fillRect(8,h-52,w-16,44);
  ctx.fillStyle='#ecd8a4';ctx.font='9px monospace';wrap(ctx,t.notice,15,h-38,w-32);
 }
 // A compact map makes the large dev world navigable without adding a normal destination.
 if(!renderer.splitChild&&!starting)drawTrainTestMap(renderer,g,w,h);
 mark('effects-hud');t.drawCosts=costs;drawPortalFlash(ctx,g,w,h,renderer.cameraOwnerIds);
 if(railwayStarting(t,t.streamCoverage.groundReady||t.wildLandsOverview)&&!renderer.splitChild){
  ctx.save();ctx.font='600 12px system-ui';ctx.textAlign='center';ctx.lineWidth=3;ctx.strokeStyle='#12261e';ctx.fillStyle='#ead7a6';
  const message='Loading nearby terrain…';ctx.strokeText(message,w/2,h-18);ctx.fillText(message,w/2,h-18);ctx.restore();
 }
}
