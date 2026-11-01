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
import {drawStationGround,stationSubjects,drawStationSubject,drawStationLights,railwayStations} from './railway-station.mjs';
import {drawSwimmer} from './swim-render.mjs';
import {drawTrainCar} from './train-art.mjs';
import {trainCars,trainWorld,sampleTrainRoute,railwayWater,railElevation,nearestTrainTrack,trainRiderWorld} from './train-track.mjs';
import {trainPrompt} from './train-test.mjs';
import {drawProp} from './environment.mjs';
import {PLAYER_RENDER_SIZE} from './render-settings.mjs';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
function polygon(c,points,color){c.fillStyle=color;c.beginPath();points.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.closePath();c.fill();}
export function drawRailwayTrack(ctx,d,route,bounds={left:0,top:0,right:d.width,bottom:d.height},overview=false){
 const visible=q=>q.x>bounds.left-100&&q.x<bounds.right+100&&q.y>bounds.top-100&&q.y<bounds.bottom+150;
 const point=(q,side,z=0)=>({x:q.x-Math.sin(q.a)*side,y:q.y+Math.cos(q.a)*side-z});
 if(overview){ctx.strokeStyle='#ad9b70';ctx.lineWidth=8;ctx.beginPath();route.points.forEach((q,i)=>i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y));ctx.stroke();return;}
 // Ballast follows the same sampled route as train bogies and physics.
 for(let s=0;s<route.length;s+=16){const q=sampleTrainRoute(route,s);if(!visible(q))continue;const z=railElevation(d,q),bridge=railwayWater(d,q.x,q.y)||z>2;
  if(bridge){const a=point(q,-d.gauge/2-17,z-2),b=point(q,d.gauge/2+17,z-2),front={x:Math.cos(q.a)*10,y:Math.sin(q.a)*10};polygon(ctx,[{x:a.x-front.x,y:a.y-front.y},{x:b.x-front.x,y:b.y-front.y},{x:b.x+front.x,y:b.y+front.y},{x:a.x+front.x,y:a.y+front.y}],'#4b413b');ctx.strokeStyle='#b49062';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();if(Math.round(s/16)%6===0){for(const side of[-1,1]){const p=point(q,side*(d.gauge/2+10),z);ctx.fillStyle='#514d48';ctx.fillRect(p.x-5,p.y,10,z+17);ctx.fillStyle='#8b7b61';ctx.fillRect(p.x-3,p.y,3,z+15);}}}
  else{const a=point(q,-d.gauge/2-13),b=point(q,d.gauge/2+13),dx=Math.cos(q.a)*10,dy=Math.sin(q.a)*10;polygon(ctx,[{x:a.x-dx,y:a.y-dy},{x:b.x-dx,y:b.y-dy},{x:b.x+dx,y:b.y+dy},{x:a.x+dx,y:a.y+dy}],'#737363');}
  const a=point(q,-d.gauge/2-7,z),b=point(q,d.gauge/2+7,z);ctx.strokeStyle='#513c31';ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();ctx.strokeStyle='#a08559';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(a.x,a.y-2);ctx.lineTo(b.x,b.y-2);ctx.stroke();
 }
 for(const side of[-1,1]){ctx.strokeStyle='#303b3d';ctx.lineWidth=5;ctx.beginPath();let active=false;for(let s=0;s<=route.length;s+=8){const q=sampleTrainRoute(route,s),p=point(q,side*d.gauge/2,railElevation(d,q));if(visible(q)){active?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y);active=true;}else active=false;}ctx.stroke();ctx.strokeStyle='#b6b9a0';ctx.lineWidth=2;ctx.stroke();}
}
// At distant camera scales retain native silhouettes as pixel sprites. Expensive
// leaf/wood animation resumes at normal play distance instead of repainting
// subpixel bark and thousands of foliage stamps on every overview frame.
function drawDistantProp(ctx,t,tree,g,biome){
 t.distantProps??=new Map();const key=[biome,tree.kind,tree.variant||0,Math.round(tree.size/16)].join(':');let sprite=t.distantProps.get(key);
 if(!sprite){sprite=document.createElement('canvas');sprite.width=sprite.height=64;const pen=sprite.getContext('2d');pen.translate(32,60);pen.scale(.25,.25);drawProp(pen,{...tree,x:0,y:0,rootY:0},0,{...g,generatedEnvironment:biome==='jungle'?'temple':biome,environment:biome},{dynamicShadows:false});t.distantProps.set(key,sprite);}
 ctx.imageSmoothingEnabled=false;ctx.drawImage(sprite,tree.x-128,tree.y-240,256,256);
}
function drawDistantStations(ctx,t,g,renderer,visible){
 t.distantStations??=new Map();for(const world of railwayStations(t.design)){const origin=world._stationContext||world.station;if(!visible(origin,900))continue;const a=origin.angle||0,inside=g.players.some(p=>{const dx=p.x-origin.x,dy=p.y-origin.y,x=origin.x+Math.cos(a)*dx+Math.sin(a)*dy,y=origin.y-Math.sin(a)*dx+Math.cos(a)*dy,s=world.station;return !p.trainRide&&Math.abs(x-s.x)<s.w/2&&Math.abs(y-s.y)<s.h/2;});const key=[world.station.name||'station',origin.x,origin.y,inside,Math.floor(Date.now()/60000)].join(':');let sprite=t.distantStations.get(key);
 if(!sprite){sprite=document.createElement('canvas');sprite.width=sprite.height=160;const pen=sprite.getContext('2d');pen.translate(80,80);pen.scale(.1,.1);pen.translate(-origin.x,-origin.y);drawStationGround(pen,world,t.time);for(const o of stationSubjects(world,t.time,t.stationCats))if(!o.stationCat)drawStationSubject(pen,world,o,t.time,renderer,g.players);if(t.distantStations.size>=32)t.distantStations.delete(t.distantStations.keys().next().value);t.distantStations.set(key,sprite);}
 ctx.imageSmoothingEnabled=false;ctx.drawImage(sprite,origin.x-800,origin.y-800,1600,1600);
 }
}
function trees(t){if(t.design.scenery)return t.design.scenery;if(t.trees)return t.trees;const d=t.design,list=[];for(let y=120;y<d.height-100;y+=190)for(let x=110;x<d.width-100;x+=180){const seed=Math.abs(Math.sin(x*7.32+y*2.17)),px=x+seed*100,py=y+Math.abs(Math.cos(x*3+y*7))*75;if(Math.abs(px-d.river.x)<d.river.width/2+65||nearestTrainTrack(t.route,px,py).distance<125)continue;list.push({id:'rail-tree-'+list.length,kind:'tree',x:px,y:py,size:86+seed*38,seed:Math.floor(px+py)});}t.trees=list;return list;}
function wrap(ctx,text,x,y,max){const words=text.split(' ');let line='';for(const word of words){if(ctx.measureText(line+word).width>max&&line){ctx.fillText(line,x,y);line='';y+=14;}line+=word+' ';}ctx.fillText(line,x,y);return y;}
export function drawTrainTest(renderer,g,dt){
 const t=g.trainTest,d=t.design,{w,h}=renderer.resize(),ctx=renderer.ctx,party=g.players.map(p=>{const a=controlledUnit(g,p);return a?{...p,...a,x:p.x,y:p.y,trainRide:p.trainRide}:p;}),cs=trainCars(t),xs=party.length?party.map(p=>p.x):[cs[0].x],ys=party.length?party.map(p=>p.y):[cs[0].y],focus={x:(Math.min(...xs)+Math.max(...xs))/2,y:(Math.min(...ys)+Math.max(...ys))/2};
 if(t.wildLandsOverview){focus.x=d.width/2;focus.y=d.height/2;}
 const zoom=t.wildLandsOverview?Math.min(w/d.width,h/d.height)*.92:clamp(Math.min(w/(Math.max(...xs)-Math.min(...xs)+260),h/(Math.max(...ys)-Math.min(...ys)+250),1.35),.012,1.35),camera=renderer.camera;if(renderer.trainScene!==t){camera.x=focus.x;camera.y=focus.y;camera.zoom=zoom;renderer.trainScene=t;}const k=1-Math.exp(-Math.max(.02,dt)*5);camera.x+=(focus.x-camera.x)*k;camera.y+=(focus.y-camera.y)*k;camera.zoom+=(zoom-camera.zoom)*k;
 const bounds={left:camera.x-w/2/camera.zoom,top:camera.y-h/2/camera.zoom,right:camera.x+w/2/camera.zoom,bottom:camera.y+h/2/camera.zoom},visible=(q,r=150)=>q.x>bounds.left-r&&q.x<bounds.right+r&&q.y>bounds.top-r&&q.y<bounds.bottom+r;
 ctx.fillStyle=d.wildLands?'#235765':'#31553b';ctx.fillRect(0,0,w,h);ctx.save();ctx.translate(w/2,h/2);ctx.scale(camera.zoom,camera.zoom);ctx.translate(-camera.x,-camera.y);
 t.viewZoom=camera.zoom;
 const forest=d.wildLands?(t.wildLandsOverview?[]:wildLandsProps(t,bounds)):railwayForestProps(t,bounds);
 g.scenery=forest;
 if(d.wildLands){drawWildLandsFloor(ctx,t,bounds,t.wildLandsOverview,g);drawWildLandsLandmarks(ctx,t,bounds);if(camera.zoom>=.3&&!d.activeRoom){g.forestLandscape=t.forestPlan??={seed:42,routes:[],landmarks:[],cover:[],routeField:new Float32Array(10000).fill(200),paving:{cells:Array(576).fill(0)}};renderer.railwayGrass??=new GrassFieldRenderer();renderer.railwayGrass.draw(ctx,g,camera,w,h);drawForestSunlight(ctx,g,bounds,daylight(g));}}
 else{
 drawRailwayForestFloor(ctx,t,bounds,t.time);const world=t.forestWorld??={};Object.assign(world,{...g,environment:'forest',generatedEnvironment:'forest',mapMode:'railway',bloom:3,seed:42,scenery:forest,house:null,forestLandscape:t.forestPlan??={seed:42,routes:[],landmarks:[],cover:[],routeField:new Float32Array(10000).fill(200),paving:{cells:Array(576).fill(0)}}});renderer.railwayGrass??=new GrassFieldRenderer();const shaderGrass=renderer.railwayGrass.draw(ctx,world,camera,w,h);drawForestSunlight(ctx,world,bounds,daylight(g));
 for(let y=Math.floor(bounds.top/32)*32;y<bounds.bottom+32;y+=32)for(let x=Math.floor(bounds.left/32)*32;x<bounds.right+32;x+=32)if(railwaySurface(d,x+16,y+16)!=='grass')drawWaterSurface(ctx,g,x,y,32,32);
 }
 if(camera.zoom<.3)drawDistantStations(ctx,t,g,renderer,visible);else drawStationGround(ctx,d,t.time);renderer.drawWorldLoot(g,w,h);renderer.drawCombatGround(g,w,h);
 for(const p of party.filter(p=>p.swimming&&!p.trainRide))drawSwimmer(ctx,p,g.time,actor=>renderer.animator.draw(ctx,actor,g.time,PLAYER_RENDER_SIZE));
 drawRailwayTrack(ctx,d,t.route,bounds,camera.zoom<.18);
 // Display other saved branches as real rails; only the selected itinerary drives the train.
 for(const route of t.otherRoutes||[])drawRailwayTrack(ctx,d,route,bounds,camera.zoom<.18);
 for(let i=1;i<cs.length;i++){const a=cs[i],b=cs[i-1],points=[trainWorld(a,a.length/2-4,-12,20),trainWorld(b,-b.length/2+4,-12,20),trainWorld(b,-b.length/2+4,12,20),trainWorld(a,a.length/2-4,12,20)].map(p=>({x:p.x,y:p.y-p.z}));polygon(ctx,points,'#69756b');ctx.strokeStyle='#bcb394';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(points[0].x,points[0].y);ctx.lineTo(points[1].x,points[1].y);ctx.moveTo(points[2].x,points[2].y);ctx.lineTo(points[3].x,points[3].y);ctx.stroke();}
 const objects=[...forest.filter(q=>visible(q)).map(tree=>({depth:tree.rootY??tree.y,tree})),...stationSubjects(d,t.time,t.stationCats).filter(q=>(camera.zoom>=.3||q.stationCat)&&visible(q,500)).map(subject=>({depth:subject.depth,subject})),...cs.filter(q=>visible(q,450)).map(car=>({depth:car.y+Math.abs(Math.cos(car.a))*car.width/2,car})),...[...(g.enemies||[]),...(g.ghosts||[]),...(g.villageFollowers||[]),...hunterPets(g)].filter(e=>!e.controlledBy&&visible(e)).map(enemy=>({depth:enemy.y,enemy})),...g.players.filter(p=>p.controlledFollowerId&&p.controlPetPosition).map(p=>({player:{...p,...p.controlPetPosition,...(p.controlMainLoadout||{}),controlledFollowerId:null,trainRide:null,moving:!!p.controlPetPosition.moving,walking:true,attack:0,charge:0,dashTime:0,animationAction:null},depth:p.controlPetPosition.y})),...party.filter(p=>(!p.trainRide||p.trainRide.gangway)&&!p.swimming).map(player=>({depth:player.y,player}))].sort((a,b)=>a.depth-b.depth);
 for(const o of objects){if(o.enemy){renderer.animator.draw(ctx,o.enemy,g.time,43);continue;}if(o.subject){drawStationSubject(ctx,d,o.subject,t.time,renderer,party);continue;}if(o.tree){ctx.save();if(party.some(p=>isOccluded(o.tree,g.spriteLibrary?.[o.tree.kind],p)))ctx.globalAlpha=.4;const biome=d.wildLands?wildLandsGround(d,o.tree.x,o.tree.y):'forest';if(camera.zoom<.3)drawDistantProp(ctx,t,o.tree,g,biome);else drawProp(ctx,o.tree,t.time,{...g,generatedEnvironment:biome==='jungle'?'temple':biome,environment:biome},{dynamicShadows:true});ctx.restore();continue;}if(o.player){renderer.animator.draw(ctx,{...o.player,y:o.player.y-(o.player.trainRide?.gangway?20+trainRiderWorld(cs,o.player.trainRide).z:(o.player.trainGround||0))},g.time,PLAYER_RENDER_SIZE);drawHappySparkles(ctx,o.player,g.time);continue;}const car=o.car;ctx.fillStyle='#172b2b44';ctx.beginPath();ctx.ellipse(car.x+5,car.y+7,Math.abs(Math.cos(car.a))*car.length/2+Math.abs(Math.sin(car.a))*car.width/2,Math.abs(Math.sin(car.a))*car.length/2+Math.abs(Math.cos(car.a))*car.width/2,0,0,Math.PI*2);ctx.fill();
  drawTrainCar(ctx,d,car,{time:t.time,distance:t.distance,speed:t.speed,engine:t.engine,doors:t.doors,riders:party.filter(p=>p.trainRide?.car===car.index).map(p=>p.trainRide),cocoaTaken:t.cocoaTaken,world:{time:g.time,scenery:forest},roofAlpha:t.roof[car.id]??1},()=>{for(const p of party.filter(p=>p.trainRide?.car===car.index&&!p.trainRide.gangway)){const r=p.trainRide,q=trainWorld({...car,x:0,y:0,z:0},r.x,r.y),actor={...p,x:q.x,y:q.y-20,animationAction:r.seat?'train_sit':undefined};renderer.animator.draw(ctx,actor,g.time,PLAYER_RENDER_SIZE);drawHappySparkles(ctx,actor,g.time);}});
 }
 drawNightEquipment(ctx,g);renderer.drawCombatProjectiles(g,w,h);renderer.drawCombatEffects(g);
 for(const p of t.particles){const f=p.life/p.max,age=1-f;ctx.save();ctx.globalAlpha=(p.kind==='smoke'?.52:.8)*Math.min(1,f*2,age*9);const size=p.size,x=Math.round(p.x/2)*2,y=Math.round(p.y/2)*2;if(p.kind==='smoke'||p.kind==='steam'){const shades=p.kind==='smoke'?['#42494c','#68706e','#858b80']:['#b7c4ba','#d1d9c9','#e0e4d6'];for(let i=0;i<5;i++){const a=i*2.4+(p.seed||0),r=size*(.32+(i%2)*.1),cx=x+Math.cos(a)*size*.25,cy=y+Math.sin(a)*size*.2;ctx.fillStyle=shades[i%3];for(let row=-r;row<=r;row+=2){const half=Math.sqrt(Math.max(0,r*r-row*row));ctx.fillRect(Math.round((cx-half)/2)*2,Math.round((cy+row)/2)*2,Math.ceil(half)*2,2);}}}else{ctx.fillStyle=p.kind==='spark'?'#ffe79d':'#f5aa4f';ctx.fillRect(x,y,size,size);}ctx.restore();}
 const dark=1-daylight(g);if(dark>0){ctx.fillStyle=`rgba(9,20,39,${dark*.48})`;ctx.fillRect(bounds.left,bounds.top,bounds.right-bounds.left,bounds.bottom-bounds.top);}
 drawStationLights(ctx,d,t.time,dark>.3);
 if(dark>.15){const engine=cs[0],q=trainWorld(engine,engine.length*.48,0,38),a=engine.a;ctx.save();ctx.translate(q.x,q.y);ctx.rotate(a);ctx.globalCompositeOperation='screen';const light=ctx.createLinearGradient(0,0,420,0);light.addColorStop(0,'#ffe9a090');light.addColorStop(1,'#ffe9a000');ctx.fillStyle=light;ctx.beginPath();ctx.moveTo(0,-8);ctx.lineTo(420,-125);ctx.lineTo(420,125);ctx.lineTo(0,8);ctx.closePath();ctx.fill();ctx.fillStyle='#fff1c2';ctx.fillRect(-3,-5,9,10);ctx.restore();}
 ctx.restore();
 // The same outlined, display-resolution typography as the lobby prop captions.
 for(const p of party){if(p.ui)continue;const text=trainPrompt(g,p);if(!text)continue;const x=Math.round(w/2+(p.x-camera.x)*camera.zoom),y=Math.round(h/2+(p.y-camera.y-(p.trainRide?68:52))*camera.zoom);ctx.save();ctx.font='650 12px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineWidth=3;ctx.strokeStyle='#10231fe8';ctx.strokeText(text,x,y);ctx.fillStyle=p.color||'#ffe7a9';ctx.fillText(text,x,y);ctx.restore();}
 const boxW=Math.min(w-16,380);ctx.fillStyle='#172b2ce8';ctx.fillRect(8,8,boxW,46);ctx.fillStyle='#f0dca5';ctx.font='11px monospace';ctx.fillText(`${d.wildLands?'THE WILD LANDS':'DEV RAILWAY'} · ${t.engine?'STEAM ON':'PARKED'} · ${Math.round(t.speed)} px/s`,15,23);ctx.font='9px monospace';ctx.fillText(`Throttle ${Math.round(t.throttle*100)}%  |  ${d.routes.find(r=>r.id===d.activeRoute)?.name||'Main line'}`,15,38);if(t.noticeUntil>t.time){ctx.fillStyle='#172b2ce8';ctx.fillRect(8,h-52,w-16,44);ctx.fillStyle='#ecd8a4';wrap(ctx,t.notice,15,h-38,w-32);}
 // A compact map makes the large dev world navigable without adding a normal destination.
 const mw=Math.min(100,w*.2),mh=mw*d.height/d.width,mx=w-mw-10,my=63;ctx.fillStyle='#1a302be8';ctx.fillRect(mx-3,my-3,mw+6,mh+6);ctx.save();ctx.translate(mx,my);ctx.scale(mw/d.width,mh/d.height);if(d.wildLands)drawWildLandsMap(ctx,t,0,0,d.width,d.height);else{ctx.fillStyle='#52754a';ctx.fillRect(0,0,d.width,d.height);ctx.fillStyle='#55a0a9';ctx.fillRect(d.river.x-d.river.width/2,0,d.river.width,d.height);}ctx.strokeStyle='#dac388';ctx.lineWidth=35;ctx.beginPath();t.route.points.forEach((q,i)=>i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y));ctx.stroke();for(const c of cs){ctx.fillStyle='#e8ba76';ctx.fillRect(c.x-55,c.y-55,110,110);}for(const p of party){ctx.fillStyle='#ffffff';ctx.fillRect(p.x-45,p.y-45,90,90);}ctx.restore();
}
