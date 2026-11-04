import {railSpanBroken,railwayBridgeState,drawTrainBridgeWater} from './train-bridges.mjs';
import {railwayStream,prepareRailwayView,streamImage} from './railway-stream.mjs';
import {paintSwordCharge} from './sword-feel.mjs';
import {drawPixelTrainCloud} from './train-exhaust-art.mjs';
import {wildBuildingSubjects,drawWildBuildingSubject} from './wild-landmark-buildings.mjs';
import {drawDestruction} from './structure-destruction.mjs';
import {drawTrackShoulder} from './train-track-art.mjs';
import {trainActorDepth,trainCarDepth} from './train-visibility.mjs';
import {nearbyWildSite} from './wild-lands-content.mjs';
import {controlledUnit} from './controlled-unit.mjs';
import {hunterPets} from './hunter-pets.mjs';
import {drawWildLandsFloor,wildLandsProps,drawWildLandsLandmarks,drawWildLandsMap} from './wild-lands-art.mjs';
import {wildLandsGround} from './wild-lands-world.mjs';
import {GrassFieldRenderer} from './grass-field.mjs';
import {drawForestSunlight} from './forest-sunlight.mjs';
import {isOccluded} from './world.mjs';
import {daylight} from './night-cycle.mjs';
import {drawNightEquipment} from './night-equipment.mjs';
import {drawHappySparkles} from './hot-chocolate.mjs';
import {drawWaterSurface} from './water-surface.mjs';
import {railwaySurface} from './railway-water.mjs';
import {railwayForestProps,drawRailwayForestFloor} from './railway-forest.mjs';
import {drawStationGround,stationSubjects,drawStationSubject,drawStationLights,railwayStations,syncStationAssets} from './railway-station.mjs';
import {drawSwimmer} from './swim-render.mjs';
import {drawTrainCar,drawTrainForeground} from './train-art.mjs';
import {trainCars,trainWorld,trainLocal,sampleTrainRoute,railwayWater,railElevation,nearestTrainTrack,trainRiderWorld} from './train-track.mjs';
import {trainPrompt} from './train-test.mjs';
import {drawProp} from './environment.mjs';
import {PLAYER_RENDER_SIZE} from './render-settings.mjs';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
function polygon(c,points,color){c.fillStyle=color;c.beginPath();points.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.closePath();c.fill();}
function drawRailwayTrackNative(ctx,d,route,bounds={left:0,top:0,right:d.width,bottom:d.height},overview=false){
 const visible=q=>q.x>bounds.left-100&&q.x<bounds.right+100&&q.y>bounds.top-100&&q.y<bounds.bottom+150;
 const point=(q,side,z=0)=>({x:q.x-Math.sin(q.a)*side,y:q.y+Math.cos(q.a)*side-z});
 if(overview){ctx.strokeStyle='#35453d';ctx.lineWidth=d.gauge+20;ctx.beginPath();route.points.forEach((q,i)=>i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y));ctx.stroke();ctx.strokeStyle='#ac9a78';ctx.lineWidth=d.gauge*.6;ctx.stroke();return;}
 drawTrackShoulder(ctx,d,route,bounds);
 // Ballast follows the same sampled route as train bogies and physics.
 for(let s=0;s<route.length;s+=16){const q=sampleTrainRoute(route,s);if(!visible(q)||railSpanBroken(d,route,s))continue;const z=railElevation(d,q),bridge=railwayWater(d,q.x,q.y)||z>2;
  if(bridge){const a=point(q,-d.gauge/2-17,z-2),b=point(q,d.gauge/2+17,z-2),front={x:Math.cos(q.a)*10,y:Math.sin(q.a)*10};polygon(ctx,[{x:a.x-front.x,y:a.y-front.y},{x:b.x-front.x,y:b.y-front.y},{x:b.x+front.x,y:b.y+front.y},{x:a.x+front.x,y:a.y+front.y}],'#4b413b');ctx.strokeStyle='#b49062';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();if(Math.round(s/16)%6===0){for(const side of[-1,1]){const p=point(q,side*(d.gauge/2+10),z);ctx.fillStyle='#514d48';ctx.fillRect(p.x-5,p.y,10,z+17);ctx.fillStyle='#8b7b61';ctx.fillRect(p.x-3,p.y,3,z+15);}}}
  else{const a=point(q,-d.gauge/2-13),b=point(q,d.gauge/2+13),dx=Math.cos(q.a)*10,dy=Math.sin(q.a)*10;polygon(ctx,[{x:a.x-dx,y:a.y-dy},{x:b.x-dx,y:b.y-dy},{x:b.x+dx,y:b.y+dy},{x:a.x+dx,y:a.y+dy}],'#737363');}
  if(!bridge)for(let j=-3;j<=3;j++){const v=point(q,j*d.gauge/7);ctx.fillStyle=(Math.floor(s/16)+j)%3?'#65685a':'#92917a';ctx.fillRect(Math.round(v.x/3)*3,Math.round(v.y/3)*3,3,3);}
  const a=point(q,-d.gauge/2-7,z),b=point(q,d.gauge/2+7,z);ctx.strokeStyle='#513c31';ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();ctx.strokeStyle='#a08559';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(a.x,a.y-2);ctx.lineTo(b.x,b.y-2);ctx.stroke();
 }
 for(const side of[-1,1]){ctx.strokeStyle='#303b3d';ctx.lineWidth=5;ctx.beginPath();let active=false;for(let s=0;s<=route.length;s+=8){const q=sampleTrainRoute(route,s),p=point(q,side*d.gauge/2,railElevation(d,q));if(visible(q)&&!railSpanBroken(d,route,s)){active?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y);active=true;}else active=false;}ctx.stroke();ctx.strokeStyle='#b6b9a0';ctx.lineWidth=2;ctx.stroke();}
}
// At distant camera scales retain native silhouettes as pixel sprites. Expensive
// leaf/wood animation resumes at normal play distance instead of repainting
// subpixel bark and thousands of foliage stamps on every overview frame.
function drawDistantProp(ctx,t,tree,g,biome){
 if(railwayStream(t)){const key=['distant',biome,tree.kind,tree.variant||0,Math.round(tree.size/16)].join(':');const image=streamImage(t,'prop',key,{size:64,height:64,half:32,above:60,scale:.25,prop:{...tree,x:0,y:0,rootY:0,seed:42},phase:0,biome,sprite:g.spriteLibrary?.[tree.kind]},40);if(image){ctx.imageSmoothingEnabled=false;ctx.drawImage(image,tree.x-128,tree.y-240,256,256);}return;}
 t.distantProps??=new Map();const key=[biome,tree.kind,tree.variant||0,Math.round(tree.size/16)].join(':');let sprite=t.distantProps.get(key);
 if(!sprite){sprite=document.createElement('canvas');sprite.width=sprite.height=64;const pen=sprite.getContext('2d');pen.translate(32,60);pen.scale(.25,.25);drawProp(pen,{...tree,x:0,y:0,rootY:0},0,{...g,generatedEnvironment:biome==='jungle'?'temple':biome,environment:biome},{dynamicShadows:false});t.distantProps.set(key,sprite);}
 ctx.imageSmoothingEnabled=false;ctx.drawImage(sprite,tree.x-128,tree.y-240,256,256);
}
// Keep the real native artwork and its sampled wind poses at play distance.
// Reuse world-pixel rasters instead of rebuilding every leaf cluster per draw.
function paintNativeProp(image,o,g,biome,phase){
 const pen=image.canvas.getContext('2d');pen.clearRect(0,0,image.canvas.width,image.canvas.height);pen.save();pen.translate(image.half,image.above);image.local??={...o,x:0,y:0,rootY:(o.rootY??o.y)-o.y,seed:o.seed??o.x+o.y};if(!image.world){image.world=Object.create(g);image.world.generatedEnvironment=biome==='jungle'?'temple':biome;image.world.environment=biome;}drawProp(pen,image.local,phase/4,image.world,{dynamicShadows:true});pen.restore();image.phase=phase;
}
function refreshNativeProps(t){
 t.nativeDrawFrame=(t.nativeDrawFrame||0)+1;const queue=t.nativePropPending;if(!queue?.size)return;const start=performance.now();let count=0;
 while(queue.size&&count<2&&performance.now()-start<3.5){const [key,q]=queue.entries().next().value;queue.delete(key);if(t.nativePropRasters?.get(key)!==q.image||q.image.seen<t.nativeDrawFrame-3||q.o.falling||q.o.depleted||q.o.harvest)continue;paintNativeProp(q.image,q.o,q.g,q.biome,q.phase);count++;}
}
function drawNativePropCached(ctx,t,o,g,biome){
 if(o.falling||o.burning||o.harvest||o.depleted||!['tree','snow_tree','palm','leafless_tree','grave_forest_tree','rock','ice_rock','forest_ruin'].includes(o.kind)){drawProp(ctx,o,t.time,{...g,generatedEnvironment:biome==='jungle'?'temple':biome,environment:biome},{dynamicShadows:true,shaderGrass:!!t.shaderGrass});return;}
 t.nativePropRasters??=new Map();t.nativePropPending??=new Map();const animated=o.kind.includes('tree')||o.kind==='palm',phase=animated?Math.floor((t.time+(o.x%7)*.17)*4)%12:0,key=[o.id,o.kind,o.size,o.width,o.height,biome,g.spriteLibrary?.[o.kind]?.revision||0].join(':');let image=t.nativePropRasters.get(key);
 if(!image){const half=Math.ceil(Math.max(70,(o.size||90)*.85,(o.width||0)/2+16)),above=Math.ceil(Math.max(100,(o.size||90)*1.8,(o.height||0)+30)),below=Math.ceil(Math.max(40,(o.size||90)*.65,(o.depth||0)+20)),canvas=document.createElement('canvas');canvas.width=half*2;canvas.height=above+below;image={canvas,half,above,pixels:canvas.width*canvas.height};if(!railwayStream(t))paintNativeProp(image,o,g,biome,phase);t.nativePropRasters.set(key,image);t.nativePropPixels=(t.nativePropPixels||0)+image.pixels;while(t.nativePropPixels>16*1024*1024&&t.nativePropRasters.size>1){const oldest=t.nativePropRasters.keys().next().value,entry=t.nativePropRasters.get(oldest);t.nativePropPixels-=entry.pixels;t.nativePropRasters.delete(oldest);t.nativePropPending.delete(oldest);}}
 else{t.nativePropRasters.delete(key);t.nativePropRasters.set(key,image);if((!railwayStream(t))&&image.phase!==phase)t.nativePropPending.set(key,{image,o,g,biome,phase});}
 if(railwayStream(t)){const target=streamImage(t,'prop','prop:'+key+':'+phase,{size:image.canvas.width,height:image.canvas.height,half:image.half,above:image.above,prop:{...o,x:0,y:0,rootY:(o.rootY??o.y)-o.y,seed:o.seed??o.x+o.y},biome,phase,family:key,sprite:g.spriteLibrary?.[o.kind]},55);if(target){image.bitmap=target;image.phase=phase;}if(image.bitmap){ctx.imageSmoothingEnabled=false;try{ctx.drawImage(image.bitmap,o.x-image.half,o.y-image.above);}catch{} }return;}image.seen=t.nativeDrawFrame;ctx.imageSmoothingEnabled=false;ctx.drawImage(image.canvas,o.x-image.half,o.y-image.above);
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
export function drawRailwayTrack(ctx,d,route,bounds={left:0,top:0,right:d.width,bottom:d.height},overview=false,runtime=null){
 if(runtime&&railwayStream(runtime)&&!overview){if(route!==runtime.route)return;const size=768,revision=railwayBridgeState(d).revision;for(let cy=Math.max(0,Math.floor(bounds.top/size));cy<=Math.min(Math.ceil(d.height/size)-1,Math.floor(bounds.bottom/size));cy++)for(let cx=Math.max(0,Math.floor(bounds.left/size));cx<=Math.min(Math.ceil(d.width/size)-1,Math.floor(bounds.right/size));cx++){const image=streamImage(runtime,'track',`track:${revision}:${cx}:${cy}`,{x:cx*size,y:cy*size,span:size,broken:[...railwayBridgeState(d).broken],revision},75);if(image){ctx.imageSmoothingEnabled=false;ctx.drawImage(image,cx*size,cy*size,size,size);}}return;}
 if(overview||typeof document==='undefined'){drawRailwayTrackNative(ctx,d,route,bounds,overview);return;}
 let saved=trackRasters.get(route);if(!saved||saved.design!==d||saved.revision!==railwayBridgeState(d).revision){saved={design:d,revision:railwayBridgeState(d).revision,chunks:new Map()};trackRasters.set(route,saved);}const size=768;
 for(let cy=Math.max(0,Math.floor(bounds.top/size));cy<=Math.min(Math.ceil(d.height/size)-1,Math.floor(bounds.bottom/size));cy++)for(let cx=Math.max(0,Math.floor(bounds.left/size));cx<=Math.min(Math.ceil(d.width/size)-1,Math.floor(bounds.right/size));cx++){const key=cx+':'+cy;let canvas=saved.chunks.get(key);if(!canvas){canvas=document.createElement('canvas');canvas.width=canvas.height=size/3;const pen=canvas.getContext('2d');pen.scale(1/3,1/3);pen.translate(-cx*size,-cy*size);drawRailwayTrackNative(pen,d,route,{left:cx*size,top:cy*size,right:(cx+1)*size,bottom:(cy+1)*size});if(saved.chunks.size>=48)saved.chunks.delete(saved.chunks.keys().next().value);saved.chunks.set(key,canvas);}ctx.imageSmoothingEnabled=false;ctx.drawImage(canvas,cx*size,cy*size,size,size);}
}
function trees(t){if(t.design.scenery)return t.design.scenery;if(t.trees)return t.trees;const d=t.design,list=[];for(let y=120;y<d.height-100;y+=190)for(let x=110;x<d.width-100;x+=180){const seed=Math.abs(Math.sin(x*7.32+y*2.17)),px=x+seed*100,py=y+Math.abs(Math.cos(x*3+y*7))*75;if(Math.abs(px-d.river.x)<d.river.width/2+65||nearestTrainTrack(t.route,px,py).distance<125)continue;list.push({id:'rail-tree-'+list.length,kind:'tree',x:px,y:py,size:86+seed*38,seed:Math.floor(px+py)});}t.trees=list;return list;}
function wrap(ctx,text,x,y,max){const words=text.split(' ');let line='';for(const word of words){if(ctx.measureText(line+word).width>max&&line){ctx.fillText(line,x,y);line='';y+=14;}line+=word+' ';}ctx.fillText(line,x,y);return y;}
export function drawTrainTest(renderer,g,dt){
 const costs={},start=performance.now();let last=start;const mark=name=>{const now=performance.now();costs[name]=now-last;last=now;};
 syncStationAssets(g);
 const t=g.trainTest,d=t.design,{w,h}=renderer.resize(),ctx=renderer.ctx,party=g.players.map(p=>{const a=controlledUnit(g,p);return a?{...p,...a,x:p.x,y:p.y,trainRide:p.trainRide}:p;}),cs=trainCars(t),xs=party.length?party.map(p=>p.x):[cs[0].x],ys=party.length?party.map(p=>p.y):[cs[0].y],focus={x:(Math.min(...xs)+Math.max(...xs))/2,y:(Math.min(...ys)+Math.max(...ys))/2};
 if(t.wildLandsOverview){focus.x=d.width/2;focus.y=d.height/2;}
 const zoom=t.wildLandsOverview?Math.min(w/d.width,h/d.height)*.92:clamp(Math.min(w/(Math.max(...xs)-Math.min(...xs)+260),h/(Math.max(...ys)-Math.min(...ys)+250),1.35),.012,1.35),camera=renderer.camera;if(renderer.trainScene!==t){camera.x=focus.x;camera.y=focus.y;camera.zoom=zoom;renderer.trainScene=t;}const k=1-Math.exp(-Math.max(.02,dt)*5);camera.x+=(focus.x-camera.x)*k;camera.y+=(focus.y-camera.y)*k;camera.zoom+=(zoom-camera.zoom)*k;
 const bounds={left:camera.x-w/2/camera.zoom,top:camera.y-h/2/camera.zoom,right:camera.x+w/2/camera.zoom,bottom:camera.y+h/2/camera.zoom},visible=(q,r=150)=>q.x>bounds.left-r&&q.x<bounds.right+r&&q.y>bounds.top-r&&q.y<bounds.bottom+r;
 ctx.fillStyle=d.wildLands?'#235765':'#31553b';ctx.fillRect(0,0,w,h);ctx.save();ctx.translate(w/2,h/2);ctx.scale(camera.zoom,camera.zoom);ctx.translate(-camera.x,-camera.y);
 prepareRailwayView(t,bounds,party);mark('setup');t.destructionRevision=g.house?.destructionRevision||0;t.damagedBuildings=(g.house?.walls||[]).filter(o=>o.destroyed||o.sectionDamage).map(o=>({id:o.id,destroyed:o.destroyed,sectionDamage:o.sectionDamage}));t.viewZoom=camera.zoom;t.spriteLibrary=g.spriteLibrary;t.shaderGrass=false;refreshNativeProps(t);
 const forest=d.wildLands?(t.wildLandsOverview?[]:wildLandsProps(t,bounds)):railwayForestProps(t,bounds);
 if(!t.wildLandsOverview)g.scenery=forest;mark('props');
 if(d.wildLands){drawWildLandsFloor(ctx,t,bounds,t.wildLandsOverview,g);if(!t.wildLandsOverview||d.activeRoom)drawWildLandsLandmarks(ctx,t,bounds);if(camera.zoom>=.3&&!d.activeRoom){g.forestLandscape=t.forestPlan??={seed:42,routes:[],landmarks:[],cover:[],routeField:new Float32Array(10000).fill(200),paving:{cells:Array(576).fill(0)}};renderer.railwayGrass??=new GrassFieldRenderer();t.shaderGrass=renderer.railwayGrass.draw(ctx,g,camera,w,h);drawForestSunlight(ctx,g,bounds,daylight(g));}}
 else{
 drawRailwayForestFloor(ctx,t,bounds,t.time);const world=t.forestWorld??={};Object.assign(world,{...g,environment:'forest',generatedEnvironment:'forest',mapMode:'railway',bloom:3,seed:42,scenery:forest,house:null,forestLandscape:t.forestPlan??={seed:42,routes:[],landmarks:[],cover:[],routeField:new Float32Array(10000).fill(200),paving:{cells:Array(576).fill(0)}}});renderer.railwayGrass??=new GrassFieldRenderer();const shaderGrass=t.shaderGrass=renderer.railwayGrass.draw(ctx,world,camera,w,h);drawForestSunlight(ctx,world,bounds,daylight(g));
 for(let y=Math.floor(bounds.top/32)*32;y<bounds.bottom+32;y+=32)for(let x=Math.floor(bounds.left/32)*32;x<bounds.right+32;x+=32)if(railwaySurface(d,x+16,y+16)!=='grass')drawWaterSurface(ctx,g,x,y,32,32);
 }
 mark('terrain');if(camera.zoom<.3)drawDistantStations(ctx,t,g,renderer,visible);else drawStationGround(ctx,d,t.time);renderer.drawWorldLoot(g,w,h);renderer.drawCombatGround(g,w,h);
 for(const p of party)paintSwordCharge(ctx,p,g.time);
 for(const p of party.filter(p=>p.swimming&&!p.trainRide))drawSwimmer(ctx,p,g.time,actor=>renderer.animator.draw(ctx,actor,g.time,PLAYER_RENDER_SIZE));
 drawRailwayTrack(ctx,d,t.route,bounds,camera.zoom<.18,t);
 // Display other saved branches as real rails; only the selected itinerary drives the train.
 for(const route of t.otherRoutes||[])drawRailwayTrack(ctx,d,route,bounds,camera.zoom<.18,t);
 for(let i=1;!t.derailed&&i<cs.length;i++){const a=cs[i],b=cs[i-1],points=[trainWorld(a,a.length/2-4,-12,20),trainWorld(b,-b.length/2+4,-12,20),trainWorld(b,-b.length/2+4,12,20),trainWorld(a,a.length/2-4,12,20)].map(p=>({x:p.x,y:p.y-p.z}));polygon(ctx,points,'#69756b');ctx.strokeStyle='#bcb394';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(points[0].x,points[0].y);ctx.lineTo(points[1].x,points[1].y);ctx.moveTo(points[2].x,points[2].y);ctx.lineTo(points[3].x,points[3].y);ctx.stroke();}
 mark('ground-stations-track');const ridersFor=car=>party.filter(p=>p.trainRide&&(p.trainRide.car===car.index||p.trainRide.gangway?.to===car.index)).map(p=>({...p.trainRide,...trainLocal(car,p),height:p.jumpHeight||0}));
 const carOptions=car=>({time:t.time,distance:t.distance,speed:t.speed,engine:t.engine,doors:t.doors,riders:ridersFor(car),cocoaTaken:t.cocoaTaken,world:{time:g.time,scenery:forest},roofAlpha:t.roof[car.id]??1});
 const objects=[...(camera.zoom<.3?[]:wildBuildingSubjects(d)).filter(q=>visible(q,200)),...forest.filter(q=>visible(q)).map(tree=>({depth:tree.rootY??tree.y,tree})),...stationSubjects(d,t.time,t.stationCats).filter(q=>(camera.zoom>=.3||q.stationCat&&camera.zoom>=.18)&&visible(q,500)).map(subject=>({depth:subject.depth,subject})),...cs.filter(q=>{const hx=Math.abs(Math.cos(q.a))*q.length/2+Math.abs(Math.sin(q.a))*q.width/2+24,hy=Math.abs(Math.sin(q.a))*q.length/2+Math.abs(Math.cos(q.a))*q.width/2+24;return q.x+hx>bounds.left&&q.x-hx<bounds.right&&q.y+hy>bounds.top&&q.y-hy-q.z-116<bounds.bottom;}).map(car=>({depth:trainCarDepth(car),car})),...[...(g.enemies||[]),...(g.ghosts||[]),...(g.villageFollowers||[]),...hunterPets(g)].filter(e=>!e.controlledBy&&visible(e)).map(enemy=>({depth:trainActorDepth(enemy,cs),enemy})),...g.players.filter(p=>p.controlledFollowerId&&p.controlPetPosition).map(p=>({player:{...p,...p.controlPetPosition,...(p.controlMainLoadout||{}),controlledFollowerId:null,trainRide:null,moving:!!p.controlPetPosition.moving,walking:true,attack:0,charge:0,dashTime:0,animationAction:null},depth:p.controlPetPosition.y})),...party.filter(p=>!p.swimming).map(player=>({depth:trainActorDepth(player,cs),player}))].sort((a,b)=>a.depth-b.depth);
 for(const o of objects){if(o.wildBuildingAsset){drawWildBuildingSubject(ctx,g,o);continue;}if(o.enemy){renderer.animator.draw(ctx,o.enemy,g.time,43);continue;}if(o.subject){drawStationSubject(ctx,d,o.subject,t.time,renderer,party,g);continue;}if(o.tree){ctx.save();if(party.some(p=>isOccluded(o.tree,g.spriteLibrary?.[o.tree.kind],p)))ctx.globalAlpha=.4;const biome=o.tree._biome||(d.wildLands?wildLandsGround(d,o.tree.x,o.tree.y):'forest');if(camera.zoom<.3)drawDistantProp(ctx,t,o.tree,g,biome);else drawNativePropCached(ctx,t,o.tree,g,biome);ctx.restore();continue;}if(o.player){const p=o.player,r=p.trainRide,lift=r?20+trainRiderWorld(cs,r).z:(p.trainGround||0),actor={...p,y:p.y-lift,animationAction:r?.seat?'train_sit':p.animationAction};renderer.animator.draw(ctx,actor,g.time,PLAYER_RENDER_SIZE);drawHappySparkles(ctx,actor,g.time);if(r&&camera.zoom>=.18){ctx.save();ctx.beginPath();ctx.rect(p.x-40,actor.y-(p.jumpHeight||0)-65,80,70);ctx.clip();for(const car of cs.filter(c=>c.index===r.car||c.index===r.gangway?.to))drawTrainForeground(ctx,d,car,carOptions(car));ctx.restore();}continue;}const car=o.car;if(t.derailed&&car.sink>=1)continue;ctx.save();if(t.derailed){ctx.globalAlpha=Math.max(0,1-car.sink*.85);const waterY=car.y+12;ctx.beginPath();ctx.rect(car.x-car.length-200,waterY-car.length-400,car.length*2+400,car.length+400);ctx.clip();}ctx.fillStyle='#172b2b44';ctx.beginPath();ctx.ellipse(car.x+5,car.y+7,Math.abs(Math.cos(car.a))*car.length/2+Math.abs(Math.sin(car.a))*car.width/2,Math.abs(Math.sin(car.a))*car.length/2+Math.abs(Math.cos(car.a))*car.width/2,0,0,Math.PI*2);ctx.fill();
  if(camera.zoom<.18){drawDistantTrain(ctx,t,d,car,g,renderer);ctx.restore();continue;}
  drawTrainCar(ctx,d,car,carOptions(car));ctx.restore();
 }
 mark('subjects');drawTrainBridgeWater(ctx,t);drawNightEquipment(ctx,g);renderer.drawCombatProjectiles(g,w,h);renderer.drawCombatEffects(g);drawDestruction(ctx,g,p=>visible(p,100));
 for(const p of t.particles){const f=p.life/p.max,age=1-f;ctx.save();ctx.globalAlpha=(p.kind==='smoke'?.52:.8)*Math.min(1,f*2,age*9);const size=p.size,x=Math.round(p.x/2)*2,y=Math.round(p.y/2)*2;if(p.kind==='smoke'||p.kind==='steam')drawPixelTrainCloud(ctx,p,x,y);else{ctx.fillStyle=p.kind==='spark'?'#ffe79d':'#f5aa4f';ctx.fillRect(x,y,size,size);}ctx.restore();}
 const dark=1-daylight(g);if(dark>0){ctx.fillStyle=`rgba(9,20,39,${dark*.48})`;ctx.fillRect(bounds.left,bounds.top,bounds.right-bounds.left,bounds.bottom-bounds.top);}
 drawStationLights(ctx,d,t.time,dark>.3);
 if(dark>.15&&!t.derailed){const engine=cs[0],q=trainWorld(engine,engine.length*.48,0,38),a=engine.a;ctx.save();ctx.translate(q.x,q.y);ctx.rotate(a);ctx.globalCompositeOperation='screen';const light=ctx.createLinearGradient(0,0,420,0);light.addColorStop(0,'#ffe9a090');light.addColorStop(1,'#ffe9a000');ctx.fillStyle=light;ctx.beginPath();ctx.moveTo(0,-8);ctx.lineTo(420,-125);ctx.lineTo(420,125);ctx.lineTo(0,8);ctx.closePath();ctx.fill();ctx.fillStyle='#fff1c2';ctx.fillRect(-3,-5,9,10);ctx.restore();}
 ctx.restore();
 // The same outlined, display-resolution typography as the lobby prop captions.
 const shownSites=new Set();for(const p of party){if(p.ui)continue;const site=nearbyWildSite(g,p);let text=trainPrompt(g,p);if(site&&text){if(shownSites.has(site.id))continue;shownSites.add(site.id);text=party.filter(q=>nearbyWildSite(g,q)?.id===site.id).map(q=>trainPrompt(g,q).split(' · ')[0]).join(' / ')+' · SUPPLIES';}if(!text)continue;const x=Math.round(w/2+(p.x-camera.x)*camera.zoom),y=Math.round(h/2+(p.y-camera.y-(p.trainRide?68:52))*camera.zoom);ctx.save();ctx.font='650 12px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineWidth=3;ctx.strokeStyle='#10231fe8';ctx.strokeText(text,x,y);ctx.fillStyle=p.color||'#ffe7a9';ctx.fillText(text,x,y);ctx.restore();}
 const boxW=Math.min(w-16,380);ctx.fillStyle='#172b2ce8';ctx.fillRect(8,8,boxW,46);ctx.fillStyle='#f0dca5';ctx.font='11px monospace';ctx.fillText(`${d.wildLands?'THE WILD LANDS':'DEV RAILWAY'} · ${t.engine?'STEAM ON':'PARKED'} · ${Math.round(t.speed)} px/s`,15,23);ctx.font='9px monospace';ctx.fillText(`Throttle ${Math.round(t.throttle*100)}%  |  ${d.routes.find(r=>r.id===d.activeRoute)?.name||'Main line'}`,15,38);if(t.noticeUntil>t.time){ctx.fillStyle='#172b2ce8';ctx.fillRect(8,h-52,w-16,44);ctx.fillStyle='#ecd8a4';wrap(ctx,t.notice,15,h-38,w-32);}
 // A compact map makes the large dev world navigable without adding a normal destination.
 const mw=Math.min(100,w*.2),mh=mw*d.height/d.width,mx=w-mw-10,my=63;ctx.fillStyle='#1a302be8';ctx.fillRect(mx-3,my-3,mw+6,mh+6);ctx.save();ctx.translate(mx,my);ctx.scale(mw/d.width,mh/d.height);if(d.wildLands)drawWildLandsMap(ctx,t,0,0,d.width,d.height);else{ctx.fillStyle='#52754a';ctx.fillRect(0,0,d.width,d.height);ctx.fillStyle='#55a0a9';ctx.fillRect(d.river.x-d.river.width/2,0,d.river.width,d.height);}ctx.strokeStyle='#dac388';ctx.lineWidth=35;ctx.beginPath();t.route.points.forEach((q,i)=>i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y));ctx.stroke();for(const c of cs){ctx.fillStyle='#e8ba76';ctx.fillRect(c.x-55,c.y-55,110,110);}for(const p of party){ctx.fillStyle='#ffffff';ctx.fillRect(p.x-45,p.y-45,90,90);}ctx.restore();mark('effects-hud');t.drawCosts=costs;const stream=t.terrainStream;if(t.preparing&&stream){const pending=[...stream.queue.values()].some(j=>j.priority>=40);if(!stream.failed&&!pending&&!stream.busy)t.preparing=false;else{ctx.fillStyle='#142a29';ctx.fillRect(0,0,w,h);ctx.textAlign='center';ctx.fillStyle='#ead7a6';ctx.font='16px system-ui';ctx.fillText(stream.failed?'Terrain preparation failed. Return to the menu and retry.':'Preparing woodland railway…',w/2,h/2);ctx.textAlign='start';}}
}
