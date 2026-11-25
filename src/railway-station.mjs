import {drawCagedSnowyOwl,drawOwlCage} from './snowy-owl-art.mjs';
import {railwayStream,streamImage} from './railway-stream.mjs';
import {wildLandmarkBuildings} from './wild-landmark-buildings.mjs';
import {drawStationCargo,STATION_LANTERN_GLASS} from './station-prop-art.mjs';
import {buildTrainRoute,nearestTrainTrack,sampleTrainRoute} from './train-track.mjs';
import {
 drawStationBackwall, drawStationBuilding, drawStationFloorDetails, drawStationForecourt,
 drawStationFurniture, drawStationLightPool, drawStationPlatform, drawStationWallBase, stationEntranceLights,
 stationVisualTheme,
} from './station-polish.mjs';
import {stationAssetHouse,stationEntrance} from './station-building.mjs';
import {sectionBlocked,drawBreakable} from './structure-destruction.mjs';
import {furnitureHeight} from './house-design.mjs';
import {wildLandsBridgeDeck} from './wild-lands-geography.mjs';
import {railwaySurface} from './railway-water.mjs';
import {drawMountedClock,drawPostClock} from './wall-clock.mjs';
import {drawHouseFloor} from './house-architecture-art.mjs';
import {drawFurniture} from './house-render.mjs';
import {drawStationTicketBooth,makeStationTicketBooth,ticketBoothFootprint} from './station-ticket-booth.mjs';
// Shared editable station layout and thirteen native environmental subjects.
export const STATION_FLAVOR=Object.freeze([
 {kind:'clock',name:'Ticking station clock',animated:true},{kind:'pennants',name:'Wind-tossed pennants',animated:true},{kind:'weathercock',name:'Turning weathercock',animated:true},{kind:'newspaper',name:'Fluttering newspaper',animated:true},{kind:'luggage_cart',name:'Rocking luggage cart',animated:true},
 {kind:'lantern',name:'Amber platform lantern',light:true},{kind:'brazier',name:'Coal brazier and sparks',light:true},{kind:'fireflies',name:'Lakeside fireflies',light:true},{kind:'steam_vent',name:'Hissing steam valve',light:true},
 {kind:'trunks',name:'Stacked travel trunks'},{kind:'parcels',name:'Twine-wrapped parcels'},{kind:'owl_crate',name:'Owl carrier crate'},{kind:'flower_tub',name:'Flower-filled barrel'}
]);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function defaultRailwayStation(d){const top=Math.min(...d.nodes.map(n=>n.y)),x=clamp(d.river.x+370,350,d.width-350),y=Math.max(240,top-230);return {x,y,w:420,h:170,platformX:d.river.x+100,platformY:top-92,platformLength:1080,platformWidth:92,floorHeight:10,lake:{x:d.river.x-330,y:Math.max(240,top-320),rx:310,ry:220},props:stationArrangement('lakewood',x,y,0,true),cats:[{id:'station-cat-1',x:x-65,y:y+40},{id:'station-cat-2',x:x+105,y:y+25},{id:'station-cat-3',x:x-220,y:y+150}]};}
const stationThemes=[['clock','pennants','owl_crate','trunks','luggage_cart','lantern','flower_tub','fireflies','parcels'],['clock','brazier','trunks','trunks','lantern','steam_vent','parcels','luggage_cart','weathercock'],['clock','fireflies','steam_vent','flower_tub','parcels','lantern','trunks','newspaper'],['clock','flower_tub','flower_tub','luggage_cart','trunks','lantern','pennants','newspaper'],['clock','pennants','weathercock','parcels','luggage_cart','lantern','flower_tub','trunks'],['clock','flower_tub','parcels','newspaper','trunks','lantern','owl_crate','luggage_cart'],['clock','lantern','lantern','brazier','trunks','owl_crate','newspaper','parcels'],['clock','weathercock','pennants','luggage_cart','trunks','steam_vent','flower_tub','parcels']];
function stationArrangement(id,x,y,index=0,all=false){const points=[[-225,45],[-105,130],[165,130],[212,155],[-300,155],[300,150],[-150,-115],[160,-115],[-245,-60],[245,-45],[345,110],[-355,85],[290,-80]];return (all?STATION_FLAVOR.map(f=>f.kind):stationThemes[index%stationThemes.length]).map((kind,i)=>({id:id+'-'+kind+'-'+i,kind,x:x+points[(i+index*2)%points.length][0],y:y+points[(i+index*2)%points.length][1]}));}
const stationRoutes=new WeakMap(),platformCache=new WeakMap();
function stationRoute(d){let saved=stationRoutes.get(d);if(!saved||saved.revision!==(d.trackRevision||0)){saved={revision:d.trackRevision||0,route:buildTrainRoute(d)};stationRoutes.set(d,saved);}return saved.route;}
export function platformSamples(d){const s=d.station,key=[d.trackRevision||0,s.platformLength,s.platformWidth,d.gauge,s.x,s.y,d._stationContext?.x,d._stationContext?.y].join(':');const cached=platformCache.get(d);if(cached?.key===key)return cached.points;const route=stationRoute(d),origin=d._stationContext?{x:d._stationContext.x,y:d._stationContext.y}:s,at=nearestTrainTrack(route,origin.x,origin.y),side=Math.sign(-(stationPoint(d,{x:s.x,y:s.y}).x-at.x)*Math.sin(at.a)+(stationPoint(d,{x:s.x,y:s.y}).y-at.y)*Math.cos(at.a))||-1,result=[];for(let z=-s.platformLength/2;z<=s.platformLength/2;z+=24){const q=sampleTrainRoute(route,at.s+z),normal={x:-Math.sin(q.a)*side,y:Math.cos(q.a)*side},near=d.gauge/2+38;result.push({near:{x:q.x+normal.x*near,y:q.y+normal.y*near},far:{x:q.x+normal.x*(near+s.platformWidth),y:q.y+normal.y*(near+s.platformWidth)}});}platformCache.set(d,{key,points:result});return result;}
const houses=new WeakMap();
export function stationHouse(d){const s=d.station;let h=houses.get(s);const key=[s.x,s.y,s.w,s.h,s.layoutVariant||0,s.doorSide||'south'].join(':');if(h?.key===key)return h;const x=s.x-s.w/2,y=s.y-s.h/2;h={key,name:'Lakewood waiting room',floors:[{x,y,w:s.w,h:s.h}],floorZones:[{x:s.x-20,y:y+8,w:40,h:s.h-16,material:'checker'},{x:x+16,y:y+20,w:135,h:100,material:'carpet'}],furniture:[{kind:'sofa',x:x+22,y:y+36,w:38,h:70},{kind:'sofa',x:x+104,y:y+36,w:38,h:70},{kind:'table',x:x+65,y:y+50,w:34,h:40},{kind:'counter',x:s.x+75,y:s.y-15,w:80,h:24},{kind:'bookcase',x:s.x+130,y:y+12,w:60,h:26},{kind:'plant',x:x+15,y:y+125,w:24,h:24},{kind:'plant',x:x+s.w-40,y:y+125,w:24,h:24}]};const variant=s.layoutVariant||0;if(variant&2){for(const [i,f]of h.furniture.entries())if(f.kind==='sofa')Object.assign(f,{kind:'bench',x:x+22,y:y+36+(i?78:0),w:120,h:24});const table=h.furniture.find(f=>f.kind==='table');table.y=y+70;table.h=28;}if(variant&4){const counter=h.furniture.find(f=>f.kind==='counter');counter.x=s.x+58;counter.y=s.y+39;counter.w=94;h.furniture.push({kind:'chair',x:s.x+96,y:s.y+10,w:24,h:24});}if(variant&1){for(const f of [...h.furniture,...h.floorZones.filter(z=>z.material==='carpet')])f.x=s.x*2-f.x-f.w;}if(['west','east'].includes(s.doorSide)){
 const v=s.layoutVariant||0,shift=(v&1)?20:0;
 h.floorZones=[{x:x+12,y:s.y-22,w:s.w-24,h:44,material:'checker'}];
 h.furniture=[{kind:'bench',x:x+35+shift,y:y+23,w:110,h:24},{kind:'bench',x:x+35,y:y+s.h-47,w:110+(v&2?18:0),h:24},{kind:'counter',x:x+s.w-126,y:y+27,w:90,h:24},{kind:'table',x:x+166,y:y+(v&4?s.h-56:23),w:40,h:30},{kind:'plant',x:x+s.w-45,y:y+s.h-43,w:24,h:24}];
 if(v&4)h.furniture.push({kind:'chair',x:x+230,y:y+s.h-43,w:24,h:24});
 }
 houses.set(s,h);return h;}
function baseStationDeckAt(d,x,y){const s=d.station;if(!s)return 0;return Math.abs(x-s.x)<s.w/2&&Math.abs(y-s.y)<s.h/2+25||Math.abs(x-s.platformX)<s.platformLength/2&&Math.abs(y-s.platformY)<s.platformWidth/2?s.floorHeight:0;}
export function stationInside(d,p){const s=d.station;return !!s&&Math.abs(p.x-s.x)<s.w/2-10&&Math.abs(p.y-s.y)<s.h/2-8;}
function stationCutaway(d,player){
 if(player.trainRide)return false;
 if(stationInside(d,player))return true;
 const entry=stationEntrance(d.station),dx=player.x-entry.x,dy=player.y-entry.y;
 const approach=dx*entry.nx+dy*entry.ny,across=dx*entry.ny-dy*entry.nx;
 // Select the low art layer before the player would pass behind its jamb.
 // This condition does not participate in doorway collision.
 return Math.abs(across)<32&&approach>-17&&approach<(entry.side==='north'?47:22);
}
function baseStationBlocked(d,x,y,r=7){const s=d.station;if(!s)return false;const left=s.x-s.w/2,right=s.x+s.w/2,top=s.y-s.h/2,bottom=s.y+s.h/2;const boxes=[{x:left,y:top,w:s.w,h:9},{x:left,y:top,w:9,h:s.h},{x:right-9,y:top,w:9,h:s.h},{x:left,y:bottom-9,w:s.w/2-38,h:9},{x:s.x+38,y:bottom-9,w:s.w/2-38,h:9},{x:s.x+75,y:s.y-15,w:80,h:24}];return [...boxes,...stationHouse(d).furniture.filter(f=>f.kind!=='rug')].some(b=>x>b.x-r&&x<b.x+b.w+r&&y>b.y-r&&y<b.y+b.h+r);}
const catRandom=a=>{a.randomState=(Math.imul(a.randomState,1664525)+1013904223)>>>0;return a.randomState/4294967296;};
function catBlocked(d,x,y){const water=stationPoint(d,{x,y});return nearestTrainTrack(stationRoute(d),water.x,water.y).distance<d.gauge/2+29||stationBlocked(d,x,y,5)||(railwaySurface(d,water.x,water.y)!=='grass'&&!stationDeckAt(d,x,y))||d.station.props.some(p=>['trunks','parcels','flower_tub','brazier','luggage_cart'].includes(p.kind)&&Math.abs(x-p.x)<22&&y>p.y-14&&y<p.y+8);}
function catWaypoints(d){const s=d.station,platform=platformSamples(d).filter((_,i)=>i%5===0).map(q=>stationPoint(d,{x:(q.near.x+q.far.x)/2,y:(q.near.y+q.far.y)/2},true));return [...platform,{x:s.x,y:s.y-25},{x:s.x,y:s.y+35},{x:s.x-60,y:s.y+50},{x:s.x+70,y:s.y+55},{x:s.x+s.w/2-26,y:s.y+48},{x:s.x,y:s.y+s.h/2+25},{x:s.x-70,y:s.platformY-12},{x:s.platformX+100,y:s.platformY+12},{x:s.platformX-250,y:s.platformY+12},{x:s.platformX+370,y:s.platformY+12}].filter(p=>!catBlocked(d,p.x,p.y));}
function catClear(d,a,b){const length=Math.hypot(b.x-a.x,b.y-a.y),n=Math.max(1,Math.ceil(length/6));for(let i=1;i<=n;i++)if(catBlocked(d,a.x+(b.x-a.x)*i/n,a.y+(b.y-a.y)*i/n))return false;return true;}
export function stationCatPath(design,id,actor,choice){
 const d=railwayStations(design).find(world=>world.station.cats.some(cat=>cat.id===id));
 if(!d)return [];
 const search=createCatSearch(d,actor,()=>choice);
 if(!search)return [];
 let result=search.next();
 while(!result.done)result=search.next();
 return result.value;
}
function createCatSearch(d,actor,getChoice){
 const waypoints=catWaypoints(d),spots=waypoints.filter(p=>Math.hypot(p.x-actor.x,p.y-actor.y)>35);
 return spots.length?catRoute(d,{x:actor.x,y:actor.y},spots[Math.floor(getChoice()*spots.length)],waypoints):null;
}
function* catRoute(d,a,target,spots){
 const points=[a,...spots,target],goal=points.length-1,queue=[0],parent=new Map([[0,-1]]);
 for(let i=0;i<queue.length;i++){
  const at=queue[i];
  for(let j=1;j<points.length;j++){
   if(parent.has(j))continue;
   const clear=catClear(d,points[at],points[j]);
   if(clear){
    parent.set(j,at);
    if(j===goal){
     const path=[];
     for(let next=goal;next>0;next=parent.get(next))path.unshift({...points[next]});
     return path;
    }
    queue.push(j);
   }
   yield;
  }
 }
 return [];
}
const localCatSearch=new WeakMap();
function applyCatPath(actor,path){
 actor.path=path;actor.walkSpeed=18+catRandom(actor)*9;actor.wait=path.length?0:2;
}
function tickLocalCatPath(d,actor){
 let search=localCatSearch.get(actor);
 if(!search){
  const request=actor.pathRequest;
  search=createCatSearch(d,request?.actor||actor,()=>request?.choice??catRandom(actor));
  delete actor.pathRequest;
  if(!search){actor.wait=3;return;}
  localCatSearch.set(actor,search);
 }
 const deadline=performance.now()+.75;
 for(let i=0;i<8;i++){
  const result=search.next();
  if(result.done){localCatSearch.delete(actor);applyCatPath(actor,result.value);return;}
  if(performance.now()>=deadline)return;
 }
}
function baseTickStationCats(t,dt){const d=t.design,s=d.station;if(!s)return;t.stationCats??=new Map();for(const [i,home]of s.cats.entries()){let a=t.stationCats.get(home.id);if(!a){a={...home,kind:'graveyard_cat',hp:20,faceX:i%2?1:-1,faceY:0,step:0,moving:false,idle:'idle',wait:1.4+i*1.7,speed:0,randomState:Math.imul(i+1,179317)};t.stationCats.set(a.id,a);}a.moving=false;
 if(a.path?.length){const goal=a.path[0],dx=goal.x-a.x,dy=goal.y-a.y,distance=Math.hypot(dx,dy);if(distance<2){a.path.shift();if(!a.path.length){a.wait=2+catRandom(a)*5;a.idle=catRandom(a)<.25?'sleep':catRandom(a)<.5?'sit':'idle';a.speed=0;}continue;}const targetSpeed=(a.walkSpeed||22)*Math.min(1,distance/14);a.speed+=(targetSpeed-a.speed)*(1-Math.exp(-dt*6));const travel=Math.min(distance,a.speed*dt),x=a.x+dx/distance*travel,y=a.y+dy/distance*travel;if(catBlocked(d,x,y)){a.path=[];a.wait=1;a.speed=0;continue;}a.x=x;a.y=y;a.step+=travel*.13;a.moving=travel>.01;a.idle='idle';const angle=Math.atan2(dy,dx),old=Math.atan2(a.faceY,a.faceX),turn=Math.atan2(Math.sin(angle-old),Math.cos(angle-old)),heading=old+turn*Math.min(1,dt*7);a.faceX=Math.cos(heading);a.faceY=Math.sin(heading);}
 else{a.wait-=dt;if(a.wait<=0){if(t.streamRuntime&&railwayStream(t.streamRuntime)){a.pathRequest??={key:'cat-path:'+a.id+':'+(a.routeSerial=(a.routeSerial||0)+1),choice:catRandom(a),actor:{x:a.x,y:a.y}};const request=a.pathRequest,result=streamImage(t.streamRuntime,'cat-path',request.key,{id:a.id,actor:request.actor,choice:request.choice},30);if(result){t.streamRuntime.terrainStream.ready.delete(request.key);applyCatPath(a,result.path);delete a.pathRequest;}continue;}tickLocalCatPath(d,a);}}
 }}
const rect=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));};
const platformFixtures=new WeakMap();
function platformLanterns(d) {
 const s=d.station,samples=platformSamples(d);
 let lamps=platformFixtures.get(samples);
 if(lamps)return lamps;
 const landing=s.platformLanding||{x:s.x,y:s.platformY};
 lamps=[];
 for(const fraction of [.11,.3,.64,.85]){
  const p=samples[Math.floor((samples.length-1)*fraction)]?.far;
  if(!p||Math.hypot(p.x-landing.x,p.y-landing.y)<70)continue;
  const local=stationPoint(d,p,true);
  lamps.push({x:local.x,y:local.y,kind:'lantern',r:74,raise:31});
 }
 platformFixtures.set(samples,lamps);
 return lamps;
}
function baseStationLamps(d,time){
 const s=d.station;
 if(!s)return [];
 const lights=[...stationEntranceLights(s),...platformLanterns(d)];
 for(const p of s.props) {
  if(p.kind==='lantern')lights.push({x:p.x,y:p.y,kind:p.kind,r:72,raise:31});
  if(p.kind==='brazier')lights.push({x:p.x,y:p.y,r:61,raise:21});
 }
 return lights.map((l,i)=>({...l,gain:.65+Math.sin(time*4+i)*.05}));
}
function outdoorClockAnchor(d,p){
 const s=d.station;
 const roofOverlaps=(x,y)=>Math.abs(x-s.x)<s.w/2+36&&y-48<s.y+s.h/2+18&&y>s.y-s.h/2-84;
 if(!roofOverlaps(p.x,p.y))return p;
 const entry=stationEntrance(s),aim=s.platformLanding||{x:s.x,y:s.platformY};
 let best=p,distance=Infinity;
 for(const sample of platformSamples(d)){
  const x=sample.near.x+(sample.far.x-sample.near.x)*.81,y=sample.near.y+(sample.far.y-sample.near.y)*.81;
  const local=stationPoint(d,{x,y},true);
  if(roofOverlaps(local.x,local.y)||Math.hypot(local.x-entry.x,local.y-entry.y)<72||Math.hypot(local.x-aim.x,local.y-aim.y)<72)continue;
  const offset=Math.hypot(local.x-p.x,local.y-p.y);
  if(offset>=distance||s.props.some(o=>o!==p&&Math.hypot(local.x-o.x,local.y-o.y)<36))continue;
  best={...p,...local};distance=offset;
 }
 return best;
}
function baseStationSubjects(d,t,cats){
 const s=d.station;
 if(!s)return [];
 const h=stationAssetHouse(d,stationHouse(d)),back=s.y-s.h/2-2;
 return [
  {stationBackwall:true,x:s.x,y:back,depth:back},
  {stationBuilding:true,x:s.x,y:s.y+s.h/2,depth:s.y+s.h/2},
  ...platformLanterns(d).map(p=>({...p,stationProp:true,depth:p.y})),
  ...s.props.filter(p=>!h.furniture.some(f=>f.stationDecor?.id===p.id)).map(p=>{
   const subject=p.kind==='clock'?outdoorClockAnchor(d,p):p;
   return {...subject,stationProp:true,depth:subject.y};
  }),
  ...s.cats.map(p=>({...cats?.get(p.id)||p,stationCat:true,depth:(cats?.get(p.id)||p).y})),
 ];
}
function baseDrawStationSubject(c,d,o,time,renderer,players){const s=d.station;
 if(o.stationBuilding||o.stationBackwall){
  const inside=players.some(p=>stationCutaway(d,p));
  const house=stationAssetHouse(d,stationHouse(d));
  if(o.stationBuilding)drawStationBuilding(c,s,inside,house);
  else if(inside)drawStationBackwall(c,s,house);
  return;
 }
 if(o.stationCat){renderer.animator.draw(c,{...o,stationCatId:o.id,kind:'graveyard_cat',hp:20,idle:o.idle||'idle',moving:!!o.moving,step:o.step||0},time,34);return;}
 const x=o.x,y=o.y;
 if(o.kind==='clock'){drawPostClock(c,x,y);return;}
 const a=Math.sin(time*2+o.x),shadow=(w=28)=>rect(c,x-w/2+5,y+3,w,8,'#263a2d44');shadow();if(drawStationCargo(c,o.kind,x,y,time))return;
 if(o.kind==='pennants'){rect(c,x-34,y-58,68,3,'#8d7654');for(let i=0;i<5;i++){c.fillStyle=i%2?'#a44b4d':'#c5a45d';c.beginPath();c.moveTo(x-28+i*13,y-56);c.lineTo(x-17+i*13,y-56);c.lineTo(x-22+i*13+a*3,y-39);c.fill();}}
 if(o.kind==='weathercock'){rect(c,x-2,y-60,4,60,'#5e6a54');rect(c,x-15-a*6,y-64,30+a*12,5,'#c2a15c');rect(c,x+8+a*5,y-72,10,13,'#d9ba70');}
 if(o.kind==='newspaper'){rect(c,x-18,y-8+a*2,36,12,'#e5d9b3');for(let i=0;i<3;i++)rect(c,x-14,y-5+i*3+a*2,24-i*5,1,'#737c69');}
 if(o.kind==='luggage_cart'){rect(c,x-25,y-8,50,5,'#38443b');rect(c,x+23,y-31+a,4,28,'#997c4f');for(const dx of[-18,18]){rect(c,x+dx-5,y-3,10,10,'#283a35');rect(c,x+dx-2,y,4,4,'#b3b69a');}rect(c,x-18,y-27+a,25,18,'#865440');rect(c,x-12,y-24+a,4,14,'#c3a067');}
 if(o.kind==='lantern'){rect(c,x-3,y-42,6,42,'#35483c');rect(c,x-11,y-57,22,18,'#735736');rect(c,x-8,y-54,16,12,'#f5c675');rect(c,x-7,y-53,3,9,'#fff0b6');}
 if(o.kind==='brazier'){rect(c,x-14,y-16,28,16,'#34453b');for(let i=0;i<5;i++)rect(c,x-10+i*5,y-22-Math.sin(time*9+i)*7,5,10,'#ffc573');for(let i=0;i<4;i++){const f=(time*.7+i*.23)%1;rect(c,x+Math.sin(i+time)*10,y-24-f*34,2,2,'#ffe5a0');}}
 if(o.kind==='fireflies')for(let i=0;i<7;i++){c.globalAlpha=.35+Math.sin(time*2+i)*.3;rect(c,x+Math.sin(time*.7+i*2)*24,y-12+Math.cos(time*.9+i)*17,2,2,'#e6f4a1');c.globalAlpha=1;}
 if(o.kind==='steam_vent'){rect(c,x-11,y-6,22,8,'#5d6d61');for(let i=0;i<5;i++){const f=(time*.6+i*.17)%1;c.globalAlpha=(1-f)*.35;c.fillStyle='#d3e0d2';c.beginPath();c.ellipse(x+Math.sin(time+i)*5,y-8-f*35,4+f*8,3+f*7,0,0,Math.PI*2);c.fill();}c.globalAlpha=1;}
 drawStationCargo(c,o.kind,x,y,time);

}
export function drawStationLights(c,d,time,night){
 const m=c.getTransform?.();
 const view=m&&m.a>0&&m.d>0&&!m.b&&!m.c?{
  left:-m.e/m.a,top:-m.f/m.d,right:(c.canvas.width-m.e)/m.a,bottom:(c.canvas.height-m.f)/m.d,
 }:null;
 for(const world of railwayStations(d)){
  if(!stationInView(world,view))continue;
  for(const local of baseStationLamps(world,time)) {
   const l=stationPoint(world,local);
   if(view&&(l.x+l.r<view.left||l.x-l.r>view.right||l.y+l.r<view.top||l.y-l.r>view.bottom))continue;
   if(local.kind==='lantern')l.glass=stationPoint(world,{x:local.x+STATION_LANTERN_GLASS.x,y:local.y+STATION_LANTERN_GLASS.y});
   drawStationLightPool(c,l,night);
  }
 }
}

const stationSets=new WeakMap();
export function railwayStations(d){
 if(d._stationContext||!d.wildLands)return d.station?[d]:[];
 if(d.activeRoom)return [];
 const stops=d.wildStops||[];let saved=stationSets.get(d);if(saved?.stops===stops&&saved.revision===(d.wildStopsRevision||0))return saved.worlds;
 const worlds=stops.map((stop,index)=>{
 const angle=stop.a||0,nx=Math.sin(angle),ny=-Math.cos(angle),setback=Math.abs(nx)*210+Math.abs(ny)*85+d.gauge/2+38+92+36;
 const x=stop.x+nx*setback,y=stop.y+ny*setback,toX=stop.x-x,toY=stop.y-y,doorSide=Math.abs(toX)>Math.abs(toY)?(toX<0?'west':'east'):(toY<0?'north':'south');
 const station={name:stop.name,visualId:stop.id,layoutVariant:index,x,y,doorSide,w:420,h:170,platformX:stop.x,platformY:stop.y-82,platformLength:1080,platformWidth:92,floorHeight:10,lake:{x:stop.x,y:stop.y-500,rx:100,ry:80},props:stationArrangement(stop.id,x,y,index),cats:[{id:stop.id+'-cat-1',x:x-65,y:y+40},{id:stop.id+'-cat-2',x:x+105,y:y+25}]};
 const world={...d,_stationContext:{x:stop.x,y:stop.y,angle:0,upright:true},station},entry=stationEntrance(station);
 const samples=platformSamples(world);station.platformLanding=samples.map(p=>p.far).reduce((a,b)=>Math.hypot(a.x-entry.x,a.y-entry.y)<Math.hypot(b.x-entry.x,b.y-entry.y)?a:b);
 const land=station.platformLanding,dx=land.x-entry.x,dy=land.y-entry.y,len=Math.hypot(dx,dy)||1;
 for(const p of station.props){for(let attempt=0;attempt<20;attempt++){
   const q=stationPoint(world,p),t=Math.max(0,Math.min(1,((q.x-entry.x)*dx+(q.y-entry.y)*dy)/(len*len))),aisle=Math.hypot(q.x-entry.x-dx*t,q.y-entry.y-dy*t)<48;
   if(nearestTrainTrack(stationRoute(world),q.x,q.y).distance>d.gauge/2+65&&!aisle)break;
   if(aisle){p.x-=dy/len*24;p.y+=dx/len*24;}else p.y-=18;
 }}return world;});stationSets.set(d,{stops,revision:d.wildStopsRevision||0,worlds});return worlds;
}
export function stationPoint(d,p,inverse=false){const t=d._stationContext;if(!t)return {...p};const a=t.angle*(inverse?-1:1),dx=p.x-t.x,dy=p.y-t.y;return {...p,x:t.x+Math.cos(a)*dx-Math.sin(a)*dy,y:t.y+Math.sin(a)*dx+Math.cos(a)*dy};}
function stationCanvas(c,d,paint){const t=d._stationContext;c.save();if(t){c.translate(t.x,t.y);c.rotate(t.angle);c.translate(-t.x,-t.y);}paint();c.restore();}
const stationBooths=new WeakMap();

function stationTicketBooth(world,house=stationAssetHouse(world,stationHouse(world))){
 const route=stationRoute(world),cached=stationBooths.get(house);
 if(cached?.route===route)return cached.booth;
 const station=world.station,entry=house.entrance,nearNorth=entry.side==='north';
 const solid=[...house.walls,...house.furniture.filter(f=>!f.wallMounted)];
 const preferred=entry.nx||1,signs=[preferred,-preferred];
 const setbacks=entry.nx?[45,60,31,72]:[31,45,58,72];
 const alternatives=nearNorth?[{inside:true,along:[76,89,102,118,146],setback:[-48,-60,-36,-72]},
  {inside:false,along:[83,104,126],setback:[60,72,45]}]:[
  {inside:false,along:entry.nx?[83,104,126,146]:[104,83,126,146],setback:setbacks},
  {inside:true,along:entry.nx?[47,56,65]:[76,89,102,118],setback:[-48,-60,-36,-72]},
 ];
 const locate=(side,along,setback)=>({x:Math.round(entry.x+entry.nx*setback-entry.ny*along*side),
  y:Math.round(entry.y+entry.ny*setback+entry.nx*along*side)});
 const usable=(x,y,inside)=>{
  const {x:left,y:top,w,h}=ticketBoothFootprint(x,y),right=left+w,bottom=top+h;
  if(solid.some(s=>s.x<right+3&&s.x+s.w>left-3&&s.y<bottom+3&&s.y+s.h>top-3))return false;
  for(const [dx,dy]of [[0,0],[-26,-15],[26,-15],[-26,4],[26,4],[0,20],[0,30],[-15,30],[15,30]]){
   const q={x:x+dx,y:y+dy};
   const supported=inside&&dy<20&&house.floors.some(f=>q.x>=f.x&&q.x<=f.x+f.w&&q.y>=f.y&&q.y<=f.y+f.h);
   if(q.x<12||q.y<12||q.x>world.width-12||q.y>world.height-12||
    solid.some(s=>sectionBlocked(s,q.x,q.y,7))||!supported&&railwaySurface(world,q.x,q.y)==='water'||
    !inside&&nearestTrainTrack(route,q.x,q.y).distance<world.gauge/2+43)return false;
  }
  return true;
 };
 for(const {inside,along,setback}of alternatives)for(const depth of setback)for(const distance of along)for(const side of signs){
  const {x,y}=locate(side,distance,depth);
  if(!usable(x,y,inside))continue;
  const booth=makeStationTicketBooth(station,x,y,inside);stationBooths.set(house,{route,booth});return booth;
 }
 const {x,y}=locate(preferred,100,nearNorth?-48:44);
 const booth=makeStationTicketBooth(station,x,y,nearNorth);stationBooths.set(house,{route,booth});return booth;
}

export function stationTicketBooths(d){
 return d?.activeRoom||!d?[]:railwayStations(d).map(world=>stationTicketBooth(world));
}

export function stationDeckAt(d,x,y){if(d._stationContext){const p=stationPoint(d,{x,y});x=p.x;y=p.y;}let height=wildLandsBridgeDeck(d,x,y);for(const world of railwayStations(d)){const h=stationAssetHouse(world,stationHouse(world)),s=world.station;if(h.floors.some(f=>x>=f.x&&x<=f.x+f.w&&y>=f.y&&y<=f.y+f.h))height=Math.max(height,s.floorHeight);const samples=platformSamples(world);for(let i=1;i<samples.length;i++){const a=samples[i-1],b=samples[i],cross=(p,q)=>(q.x-p.x)*(y-p.y)-(q.y-p.y)*(x-p.x),v=[cross(a.near,b.near),cross(b.near,b.far),cross(b.far,a.far),cross(a.far,a.near)];if(v.every(n=>n>=-1)||v.every(n=>n<=1)){height=Math.max(height,s.floorHeight);break;}}}return height;}
const stationCollisionBounds=new WeakMap();
export function stationBlocked(d,x,y,r=7,elevation=0){
 if(d._stationContext){const p=stationPoint(d,{x,y});x=p.x;y=p.y;}
 for(const world of railwayStations(d)){
  const s=world.station,h=stationAssetHouse(world,stationHouse(world));
  if(elevation<58&&Math.abs(x-s.x)<s.w/2+180+r&&Math.abs(y-s.y)<s.h/2+180+r&&
   sectionBlocked(stationTicketBooth(world,h).footprint,x,y,r))return true;
  let bounds=stationCollisionBounds.get(h);
  if(!bounds){
   bounds={left:Infinity,right:-Infinity,top:Infinity,bottom:-Infinity};
   for(const b of [...h.walls,...h.furniture]){
    bounds.left=Math.min(bounds.left,b.x);bounds.right=Math.max(bounds.right,b.x+b.w);
    bounds.top=Math.min(bounds.top,b.y);bounds.bottom=Math.max(bounds.bottom,b.y+b.h);
   }
   stationCollisionBounds.set(h,bounds);
  }
  if(x+r<bounds.left||x-r>bounds.right||y+r<bounds.top||y-r>bounds.bottom)continue;
  if(h.walls.some(b=>sectionBlocked(b,x,y,r)))return true;
  if(h.furniture.some(f=>{
   if(f.wallMounted||!sectionBlocked(f,x,y,r))return false;
   const height=furnitureHeight(f);
   return !height||elevation<height;
  }))return true;
 }
 return false;
}
export function syncStationAssets(g){
 const t=g.trainTest,worlds=railwayStations(t.design),room=t.design.activeRoom||null;
 if(t.stationAssetRoom===room&&t.stationAssetWorlds?.length===worlds.length&&worlds.every((w,i)=>t.stationAssetWorlds[i]===w))return;
 t.stationAssetWorlds=worlds;t.stationAssetRoom=room;
 const landmarks=wildLandmarkBuildings(t.design),home=landmarks.find(h=>h.id==='homestead');
 const houses=[...worlds.map(w=>stationAssetHouse(w,stationHouse(w))),...landmarks];
 g.house={name:home?.name||'Railway stations',floors:home?.floors||[],paths:home?.paths||[],pools:home?.pools||[],
  rooms:home?.rooms||[],vehicles:home?.vehicles||[],walls:houses.flatMap(h=>h.walls),
  doors:houses.flatMap(h=>h.doors),furniture:houses.flatMap(h=>h.furniture)};
}
export function tickStationCats(t,dt,players){
 for(const world of railwayStations(t.design)){
  const station=world._stationContext||world.station;
  if(players&&!players.some(p=>p.hp>0&&!p.room&&
     Math.abs(p.x-station.x)<1750&&Math.abs(p.y-station.y)<1750))continue;
  const local={design:world,stationCats:t.stationCats,streamRuntime:t};
  baseTickStationCats(local,dt);t.stationCats=local.stationCats;
 }
}
export function stationLamps(d,time){return railwayStations(d).flatMap(world=>baseStationLamps(world,time).map(p=>stationPoint(world,p)));}
// Conservative bounds include the curved platform, rotated forecourt and all props.
const stationViewBounds=new WeakMap();
export function stationInView(world,bounds){
 if(!bounds)return true;const points=platformSamples(world);let box=stationViewBounds.get(world);
 if(!box||box.points!==points){const s=world.station,house=stationAssetHouse(world,stationHouse(world)),samples=points.flatMap(p=>[p.near,p.far]);for(const f of [...house.floors,...house.walls,...house.furniture])for(const [x,y]of [[f.x,f.y],[f.x+f.w,f.y+f.h]])samples.push({x,y},stationPoint(world,{x,y}));for(const p of s.props||[])samples.push(stationPoint(world,p));box={points,left:Math.min(...samples.map(p=>p.x))-220,top:Math.min(...samples.map(p=>p.y))-300,right:Math.max(...samples.map(p=>p.x))+220,bottom:Math.max(...samples.map(p=>p.y))+160};stationViewBounds.set(world,box);}
 return box.right>=bounds.left&&box.left<=bounds.right&&box.bottom>=bounds.top&&box.top<=bounds.bottom;
}
const visualFloors=new WeakMap();
function stationVisualFloor(house) {
 let saved=visualFloors.get(house);
 if(!saved){
  // The approach is still a physical floor in the live house. Its visible
  // masonry follows the landing vector instead of the old cement rectangle.
  saved={
   floors:house.floors.slice(0,-1),
   floorZones:house.floorZones.filter(zone=>zone.material!=='checker'&&zone.material!=='cement'),
  };
  visualFloors.set(house,saved);
 }
 return saved;
}
export function drawStationGround(c,d,time,bounds=null){
 for(const world of railwayStations(d)){
  if(!stationInView(world,bounds))continue;
  const house=stationAssetHouse(world,stationHouse(world));
  stationCanvas(c,world,()=>drawStationForecourt(c,world.station));
  drawStationPlatform(c,world.station,platformSamples(world),bounds);
  drawHouseFloor(c,stationVisualFloor(house));
  stationCanvas(c,world,()=>drawStationFloorDetails(c,world.station));
 }
}
export function stationSubjects(d,time,cats,bounds=null){
 return railwayStations(d).filter(world=>stationInView(world,bounds)).flatMap(world=>{
  const house=stationAssetHouse(world,stationHouse(world));
  const booth=stationTicketBooth(world,house);
  const assets=[...house.walls,...house.furniture].map(asset=>({
   stationAsset:asset,x:asset.x+asset.w/2,y:asset.y+asset.h,depth:asset.clockDepth??asset.y+asset.h,stationWorld:world,
  }));
  const figures=baseStationSubjects(world,time,cats).map(local=>{
   const p=stationPoint(world,local);
   return {...p,depth:p.y,stationWorld:world,stationLocal:local};
  });
  return [...assets,...figures,{x:booth.x,y:booth.y,depth:booth.y+6,stationWorld:world,stationTicketBooth:booth}];
 });
}

export function drawStationSubject(c,d,o,time,renderer,players,game={}){
 const world=o.stationWorld||d;
 if(o.stationTicketBooth){
  const booth=o.stationTicketBooth;
  if(!booth.inside||players.some(p=>stationCutaway(world,stationPoint(world,p,true))))drawStationTicketBooth(c,booth,time,renderer);
  return;
 }
 if(o.stationAsset) {
  const b=o.stationAsset;
  if(b.destroyed)return;
  if(b.kind==='wall_clock'){
   if(!players.some(p=>stationCutaway(world,stationPoint(world,p,true))))return;
   const x=b.x+b.w/2,y=b.y+b.h/2;
   if(!b.clockWallId){drawPostClock(c,x,b.y+b.h);return;}
   const wall=stationAssetHouse(world,stationHouse(world)).walls.find(w=>w.id===b.clockWallId);
   if(wall&&sectionBlocked(wall,x,wall.y+wall.h/2,1))drawMountedClock(c,x,y);
   return;
  }
  if(b.stationDecor?.kind==='owl_crate'){
   const p=stationPoint(world,b.stationDecor),open=game.trainTest?.openOwlCages?.has(b.stationDecor.id);
   drawOwlCage(c,p,open,'back');
   if(!open)drawCagedSnowyOwl(c,p,time);
   drawOwlCage(c,p,open);
   return;
  }
  const decor=b.stationDecor?.kind;
  const animated=decor&&(STATION_FLAVOR.find(f=>f.kind===decor)?.animated||decor==='brazier'||decor==='steam_vent');
  const frame=animated?Math.floor(time*8):0;
  const wall=['window','wall','fence'].includes(b.kind);
  const inside=wall&&players.some(p=>stationCutaway(world,stationPoint(world,p,true)));
  drawBreakable(c,game,b,(pen,asset)=>{
   if(asset.stationDecor) {
    stationCanvas(pen,world,()=>baseDrawStationSubject(pen,world,asset.stationDecor,time,renderer,players));
   } else if (wall) {
    drawStationWallBase(pen,asset,world.station,inside);
   } else if(!drawStationFurniture(pen,asset,world.station)) {
    drawFurniture(pen,asset,{});
   }
  },'railway-native:'+stationVisualTheme(world.station).id+':'+frame+':'+(inside?'lined':'plain'));
  return;
 }
 const local=o.stationLocal||o;
 if(local.stationBuilding) {
  const h=stationAssetHouse(world,stationHouse(world));
  if(h.walls.filter(b=>b.destroyed).length>h.walls.length/2)return;
 }
 if(local.stationCat) {
  const a=world._stationContext?.angle||0,p=stationPoint(world,local);
  p.faceX=Math.cos(a)*(local.faceX||0)-Math.sin(a)*(local.faceY||0);
  p.faceY=Math.sin(a)*(local.faceX||0)+Math.cos(a)*(local.faceY||0);
  baseDrawStationSubject(c,world,p,time,renderer,players);
  return;
 }
 stationCanvas(c,world,()=>baseDrawStationSubject(c,world,local,time,renderer,players.map(p=>stationPoint(world,p,true))));
}

export {platformSamples as stationPlatformSamples};
