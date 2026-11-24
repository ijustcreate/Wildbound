import {ALLEY_SHOPS,alleyGate,switchAlleyLayer} from './diagon-alley.mjs';
import {mirroredShopPoint} from './diagon-shop-rooms.mjs';
import {houseLivingTarget,interactHouseLiving,wakeFromBed} from './house-living.mjs';
import {clearPirateRide,pirateShip,pirateShipBlocked,pirateShipPoint,syncPirateShipPlayer} from './pirate-ship.mjs';
import {spellTransition} from './portal-transition.mjs';
import {railwayStations,syncStationAssets} from './railway-station.mjs';
import {railwaySurface} from './railway-water.mjs';
import {stationEntrance} from './station-building.mjs';
import {clearSwordPolish} from './sword-charge-state.mjs';
import {railSpanBroken} from './train-bridges.mjs';
import {trainCars,trainWorld} from './train-track.mjs';
import {WILD_LANDS_SITES} from './wild-lands-content.mjs';
import {WILD_LANDS_GATES,switchWildLandsLayer} from './wild-lands-world.mjs';
import {HOLLOW_ARRIVAL,HOLLOW_ROOM,mountainHeight} from './wild-mountain-layout.mjs';
import {wildHomestead,wildHomesteadHearth} from './wild-homestead-layout.mjs';

const supportedRooms=[null,'diagon','shadow','caverns',HOLLOW_ROOM];

export const WRONG_TURN_DESTINATIONS=Object.freeze([
 'station','summit','pirate-deck','shadow','nocturne','forest','graveyard',
 'homestead-bed','coach','jade-court','frost-cache','bayou-camp','hollow',
]);

const siteFor=id=>WILD_LANDS_SITES.find(site=>site.id===id);
const gateFor=id=>WILD_LANDS_GATES.find(gate=>gate.id===id);
const roomOf=t=>t.design.activeRoom||null;
const near=(a,b,r)=>Math.hypot(a.x-b.x,a.y-b.y)<r;
const refused=message=>({ok:false,message});
function pick(list,roll){
 const value=roll();
 return list[Math.max(0,Math.min(list.length-1,Math.floor((Number.isFinite(value)?value:0)*list.length)))];
}

function landingWorld(g,room){
 const live=g.trainTest;
 const view=Object.create(g);
 view.trainTest={...live,design:{...live.design,activeRoom:room||undefined},
  streamDisabled:true,terrainStream:null,nativeCollisionRoom:undefined,
  wildNativeWorlds:new Map(live.wildNativeWorlds),nativeKinds:new Map(live.nativeKinds),stationAssetRoom:undefined};
 if(room!==roomOf(live)){
  view.enemies=room==='diagon'?[]:room===HOLLOW_ROOM?live.hollowActors?.enemies:
   room?live.wildBiomeRoomActors?.[room]?.enemies:
    roomOf(live)==='diagon'?live.alleyActors?.enemies:
     roomOf(live)===HOLLOW_ROOM?live.hollowSurfaceActors?.enemies:live.wildBiomeRoomActors?.surface?.enemies;
 }
 if(room) view.house=null;
 else syncStationAssets(view);
 return view;
}

function ringPoints(anchor,limit=120){
 const result=[anchor];
 for(let radius=24;radius<=limit;radius+=24){
  for(let i=0;i<12;i++)result.push({x:anchor.x+Math.round(radius*Math.cos(i*Math.PI/6)),
   y:anchor.y+Math.round(radius*Math.sin(i*Math.PI/6))});
 }
 return result;
}

function clearGround(view,point,reserved){
 const {x,y}=point,t=view.trainTest,room=roomOf(t);
 if(reserved.some(other=>near(point,other,20)))return false;
 if(room!=='diagon'&&railwaySurface(t.design,x,y)!=='grass')return false;
 if((view.enemies||[]).some(enemy=>enemy.hp>0&&!enemy.friendly&&!enemy.neutral&&!enemy.owner&&near(point,enemy,40)))return false;
 return !view.blocked(x,y,9,false,false,false,0,0,false,{x,y});
}

function groundLandings(view,anchor,travellers,reserved=[],firstPoint){
 const points=ringPoints(anchor),used=[...reserved],placements=[];
 for(const [i] of travellers.entries()){
  const position=i===0&&firstPoint?firstPoint:points.find(point=>clearGround(view,point,used));
  if(!position)return null;
  placements.push({position});used.push(position);
 }
 return placements;
}

function coachCanReceive(t){
 if(t.derailed||t.speed<1&&(t.emergencyBrake||t.driver!=null))return false;
 const nose=t.distance+t.design.cars[0].length*.32;
 for(let distance=nose;distance<=nose+96;distance+=24){
  const segment=t.routeSegments?.findLast(s=>s.at<=distance);
  if(railSpanBroken(t.design,segment?.route||t.route,distance+(segment?.offset||0)))return false;
 }
 return true;
}

function riderLandings(view,travellers,kind,party){
 const t=view.trainTest,placed=[];
 if(kind==='pirate-deck'){
  const ship=pirateShip(view);
  if(!ship)return null;
  const occupied=party.filter(p=>p.pirateRide?.shipId===ship.id&&p.pirateRide.level==='deck').map(p=>p.pirateRide);
  for(const local of ringPoints({x:82,y:34},72)){
   if(occupied.some(p=>near(local,p,20)))continue;
   const position=pirateShipPoint(ship,local.x,local.y),pirateRide={shipId:ship.id,level:'deck',x:local.x,y:local.y};
   if(pirateShipBlocked(view,position.x,position.y,9,{pirateRide}))continue;
   placed.push({position,pirateRide});occupied.push(local);
   if(placed.length===travellers.length)return placed;
  }
 }else{
  const cars=trainCars(t),coach=cars.find(c=>c.kind==='seats')||cars.find(c=>c.kind==='compartments');
  if(!coach)return null;
  const occupied=party.filter(p=>p.trainRide?.car===coach.index).map(p=>p.trainRide);
  for(const local of ringPoints({x:0,y:0},120)){
   const position=trainWorld(coach,local.x,local.y),trainRide={car:coach.index,x:local.x,y:local.y};
   if(occupied.some(p=>near(local,p,20))||view.blocked(position.x,position.y,9,false,true,false,0,0,false,{trainRide}))continue;
   placed.push({position,trainRide});occupied.push(local);
   if(placed.length===travellers.length)return placed;
  }
 }
 return null;
}

function bedLanding(view,player,reserved){
 const home=wildHomestead(view.trainTest.design);
 for(const bed of home?.furniture||[]){
  if(bed.kind!=='bed'||bed.destroyed||reserved.some(p=>p.bedRest?.x===bed.x&&p.bedRest?.y===bed.y))continue;
  const approach=[
   {x:bed.x+bed.w/2,y:bed.y+bed.h+24},{x:bed.x-24,y:bed.y+bed.h*.67},
   {x:bed.x+bed.w+24,y:bed.y+bed.h*.67},{x:bed.x+bed.w/2,y:bed.y-24},
  ];
  const point=approach.find(point=>clearGround(view,point,reserved)&&
   houseLivingTarget(view,{...player,...point,ui:null,room:null})?.id===bed.id);
  if(point)return point;
 }
 return null;
}

function siteLanding(id,label){
 const site=siteFor(id);
 return {name:label||site.name,anchor:{x:site.x,y:site.y+58}};
}

function destination(id,surface,roll){
 const d=surface.trainTest.design;
 switch(id){
  case 'station':{
   const station=pick(railwayStations(d),roll)?.station;
   if(!station)return null;
   const entry=stationEntrance(station);
   return {name:station.name+' station',stationId:station.visualId,anchor:{x:entry.x+entry.nx*45,y:entry.y+entry.ny*45}};
  }
  case 'summit':return {name:'Greywake Mountain summit',anchor:{x:17910,y:6480}};
  case 'pirate-deck':return {name:'the pirate ship deck'};
  case 'shadow':return {name:'the Shadow Realm',room:'shadow',anchor:{x:8000,y:5450}};
  case 'nocturne':{
   const shop=ALLEY_SHOPS.find(shop=>shop.id==='nocturne-curios');
   return shop&&{name:shop.name,room:'diagon',anchor:mirroredShopPoint(shop,{x:72,y:18})};
  }
  case 'forest':return {name:'a clearing deep in the forest',anchor:{x:4600,y:3725}};
  case 'graveyard':return siteLanding('cemetery-cache');
  case 'homestead-bed':{
   const hearth=wildHomesteadHearth(d);
   return {name:'the Wild Homestead',anchor:{x:hearth.x,y:hearth.y+45}};
  }
  case 'coach':return {name:'a passenger coach'};
  case 'hollow':return {name:'Smugglers’ Hollow',room:HOLLOW_ROOM,anchor:HOLLOW_ARRIVAL};
  default:return siteLanding(id);
 }
}

function returnLandings(surface,room,travellers){
 const gate=gateFor(room);
 if(!gate)return null;
 const anchor={x:gate.x,y:gate.y+(room===HOLLOW_ROOM?-35:110)};
 const spots=groundLandings(surface,anchor,travellers);
 return spots&&{...gate,entryPoints:spots.map(({position},i)=>({...position,id:travellers[i].id}))};
}

function placeTraveler(g,p,{position,trainRide,pirateRide}){
 const t=g.trainTest;
 if(t.driver===p.id)t.driver=null;
 wakeFromBed(p);clearPirateRide(p);clearSwordPolish(p);
 for(const key of ['trainRide','gardenBench','mountainDescent','swordDash','swordStrike','swordFacing','swordDashRequested'])delete p[key];
 const height=roomOf(t)?0:mountainHeight(t.design,position.x,position.y);
 Object.assign(p,{x:position.x,y:position.y,ui:null,room:null,consumeInput:true,moving:false,moveSpeed:0,
  swimming:false,underBridge:false,trainDeck:false,trainGround:height,trainVisualLift:height,groundHeight:0,
  jumpHeight:0,jumpVelocity:0,jumpHeld:false,wingHover:false,diveDepth:0,slideX:0,slideY:0,
  charge:0,attack:0,dashTime:0,dashRecovery:0,sleeping:0});
 if(trainRide){p.trainRide=trainRide;p.trainVisualLift=20+position.z;}
 if(pirateRide){p.pirateRide=pirateRide;syncPirateShipPlayer(g,p);}
}

export function travelThroughWrongTurn(g,p,roll=g.random){
 const t=g.trainTest,source=t&&roomOf(t);
 if(!t?.design.wildLands||!supportedRooms.includes(source)||!g.players.includes(p)||!(p.hp>0)){
  return refused('The door cannot find this explorer’s way through.');
 }
 const category=pick(WRONG_TURN_DESTINATIONS,roll);
 if(category==='coach'&&!coachCanReceive(t))return refused('The door cannot reach a coach while the railway is stopped for safety.');
 const surface=landingWorld(g,null),spec=destination(category,surface,roll);
 if(!spec)return refused('The door cannot find a clear landing.');
 const target=spec.room||null,crossing=source!==target;
 const travellers=crossing?[p,...g.players.filter(q=>q!==p)]:[p];
 if(travellers.some(q=>q.room||q.vehicleId||q.broomMount||q.controlledFollowerId||q.ui?.carry)){
  return refused('Gather the travelers on foot and put away any held inventory items.');
 }
 const bystanders=g.players.filter(q=>!travellers.includes(q));
 const view=target?landingWorld(g,target):surface;
 const bed=category==='homestead-bed'&&bedLanding(view,p,bystanders);
 const placements=category==='pirate-deck'||category==='coach'?riderLandings(view,travellers,category,bystanders):
  groundLandings(view,bed||spec.anchor,travellers,bystanders,bed||null);
 if(!placements)return refused('The door found no safe landing. Try the threshold again.');
 const outside=crossing&&target&&target!=='diagon'?returnLandings(surface,target,travellers):null;
 if(crossing&&target&&target!=='diagon'&&!outside)return refused('The door found no safe way back from that destination.');
 const alleyReturn=crossing&&target==='diagon'&&!t.alleyReturn?alleyGate(surface):null;
 const alleyExit=alleyReturn&&groundLandings(surface,{x:alleyReturn.x,y:alleyReturn.y+61},travellers);
 if(alleyReturn&&!alleyExit)return refused('The door found no safe way back from the alley.');

 if(crossing){
  if(source==='diagon')switchAlleyLayer(g,null);
  else if(source)switchWildLandsLayer(g,null);
  if(target==='diagon'){
   if(alleyExit)t.alleyReturn={...alleyExit[0].position,arrivals:alleyExit.map(placement=>placement.position)};
   switchAlleyLayer(g,target);
  }else if(target){
   t.wildLandsReturn=outside;
   switchWildLandsLayer(g,target);
  }
  syncStationAssets(g);
 }
 t.wildLandsOverview=false;
 for(const [index,traveler] of travellers.entries())placeTraveler(g,traveler,placements[index]);
 if(category==='coach'&&t.speed<1){
  t.engine=true;t.throttle=.18;t.speed=Math.min(18,t.design.maxSpeed*t.throttle);
 }
 let name=spec.name;
 if(bed&&interactHouseLiving(g,p)&&p.bedRest){
  p.bedRest.wakeAfterRelease=true;
  name='a bed at the Wild Homestead';
 }
 spellTransition(g,travellers,{effect:'portkey'});
 const message='The Wrong Turn Door led to '+name+'.';
 t.notice=message;t.noticeUntil=t.time+4;g.persist?.();
 return {ok:true,category,destination:name,...(spec.stationId?{stationId:spec.stationId}:{}),message};
}
