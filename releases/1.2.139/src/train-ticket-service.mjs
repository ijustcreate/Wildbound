import {cancelConductorDestination,finishUnattendedStop,trainRouteStations} from './train-autostop.mjs';
import {railSpanBroken,railwayBridgeState} from './train-bridges.mjs';
import {trainCars} from './train-track.mjs';

export const TRAIN_TICKET_ARRIVAL_SECONDS=10;
const duration=TRAIN_TICKET_ARRIVAL_SECONDS,views=new WeakMap();
const wrap=(n,length)=>((n%length)+length)%length;
const visibleIn=(q,view,r)=>q.x+r>view.left&&q.x-r<view.right&&q.y+r>view.top&&q.y-r<view.bottom;
const occupied=g=>g.players.some(p=>p.trainRide);

export function observeRailwayTicketView(t,bounds,owners){
 const key=owners?.length?owners.join('|'):'shared';
 let store=views.get(t);
 if(!store){store=new Map();views.set(t,store);}
 store.set(key,{bounds,owners,time:t.time});
}

function buyerView(t,p){
 let exact;
 for(const view of views.get(t)?.values()||[]){
  if(view.time>=t.time-.35&&(view.owners?.includes(p.id)||!view.owners?.length)&&(!exact||view.time>=exact.time))exact=view;
 }
 return exact?.bounds||{left:p.x-850,right:p.x+850,top:p.y-650,bottom:p.y+650};
}

export function railwayTicketStatus(g,stationId){
 const t=g.trainTest;
 if(!t?.route)return {available:false};
 const stops=trainRouteStations(t),index=stops.findIndex(s=>s.id===stationId);
 if(index<0)return {available:false};
 const routeOffset=t.routeSegments?.at(-1)?.offset||0,length=t.route.length,s=wrap(t.distance+routeOffset,length);
 const platform=stops.find(stop=>Math.min(wrap(stop.s-s,length),wrap(s-stop.s,length))<3);
 const pending=t.railwayTicket,atPlatform=!!platform&&t.speed<.001&&!t.derailed&&!pending;
 const last=atPlatform?stops.indexOf(platform):stops.findLastIndex(stop=>stop.s<=s+.001),lastIndex=last<0?stops.length-1:last;
 const station={...stops[index],number:index+1},lastPassed={...stops[lastIndex],number:lastIndex+1};
 const ahead=wrap(lastIndex-index,stops.length),behind=wrap(index-lastIndex,stops.length);
 const angle=Math.atan2(lastPassed.x-station.x,station.y-lastPassed.y),compass=['north','northeast','east','southeast','south','southwest','west','northwest'];
 return {available:!t.design.activeRoom&&!t.derailed,occupied:occupied(g),station,lastPassed,stopsAway:Math.min(ahead,behind),
  direction:ahead===0?'here':ahead<=behind?'ahead':'behind',compass:ahead===0?null:compass[wrap(Math.round(angle/(Math.PI/4)),8)],
  atPlatform,atRequestedPlatform:atPlatform&&platform.id===stationId,platformId:atPlatform?platform.id:null,
  pending:pending?{stationId:pending.stationId,payerId:pending.payerId,name:stops.find(s=>s.id===pending.stationId)?.name||pending.stationId}:null,
  etaSeconds:pending?Math.max(0,duration-pending.elapsed):null};
}

// Integrate the minimum braking and maximum reachable velocity envelopes.
// Every blend accelerates and brakes smoothly and ends at the exact marker.
function ticketRun(distance,v0,design,cap=design.maxSpeed){
 const a=design.acceleration,b=design.brakePower;
 if(v0>b*duration||v0>cap)return null;
 const points=[0,duration,v0/b,(cap-v0)/a,duration-cap/b,(b*duration-v0)/(a+b)]
  .filter(t=>t>=0&&t<=duration).sort((x,y)=>x-y).filter((t,i,times)=>!i||t>times[i-1]);
 const limits=points.map(time=>({time,low:Math.max(0,v0-b*time),high:Math.min(v0+a*time,cap,b*(duration-time))}));
 let low=0,high=0;
 for(let i=1;i<limits.length;i++){
  const before=limits[i-1],part=limits[i],half=(part.time-before.time)/2;
  low+=(before.low+part.low)*half;high+=(before.high+part.high)*half;
 }
 if(distance<low-.001||distance>high+.001)return null;
 const blend=high>low?Math.min(1,Math.max(0,(distance-low)/(high-low))):0;
 let traveled=0;
 return limits.map((part,i,all)=>{
  const speed=part.low+(part.high-part.low)*blend,before=all[i-1];
  if(before){const v=before.low+(before.high-before.low)*blend;traveled+=(speed+v)*(part.time-before.time)/2;}
  return {time:part.time,speed,traveled};
 });
}

function ticketPosition(parts,elapsed){
 const i=parts.findIndex(part=>part.time>=elapsed),after=parts[i],before=parts[i-1];
 if(!before)return {speed:after.speed,traveled:after.traveled};
 const dt=elapsed-before.time,speed=before.speed+(after.speed-before.speed)*dt/(after.time-before.time);
 return {speed,traveled:before.traveled+(before.speed+speed)*dt/2};
}

function hasBrokenTrack(t,start,end,offset){
 if(!railwayBridgeState(t.design).broken.size)return false;
 for(let s=start;s<=end+32;s+=32){
  if(railSpanBroken(t.design,t.route,s+offset+t.design.cars[0].length*.32))return true;
 }
 return false;
}

function approach(p,t,station){
 const {length}=t.route,offset=t.routeSegments?.at(-1)?.offset||0;
 const nearDistance=wrap(station.s-t.distance-offset,length);
 const ordinary=ticketRun(nearDistance,t.speed,t.design);
 if(ordinary&&!hasBrokenTrack(t,t.distance,t.distance+nearDistance,offset))return {from:t.distance,to:t.distance+nearDistance,parts:ordinary,offset};
 const safeView=buyerView(t,p),stagingLimit=Math.min(1550,t.design.maxSpeed*6),v0=Math.min(t.design.maxSpeed,t.design.brakePower*duration*.72);
 let wideViewFallback;
 // Stage on the same route, before the requested platform. Keep the whole
 // unoccupied consist behind the buyer's view before running the approach.
 for(let distance=stagingLimit;distance>=400;distance-=35){
  const parts=ticketRun(distance,v0,t.design);
  if(!parts)continue;
  let to=t.distance+nearDistance;
  if(to-distance<t.distance)to+=length;
  const from=to-distance;
  if(hasBrokenTrack(t,from,to,offset))continue;
  const plan={from,to,parts,offset,staged:true};
  wideViewFallback??=plan;
  const cars=trainCars({...t,distance:from,routeSegments:[{at:-Infinity,route:t.route,offset}]});
  if(!cars.some(car=>visibleIn(car,safeView,Math.hypot(car.length,car.width)*.5+16)))return plan;
 }
 // A full-region overview may include every staging point. Run the farthest
 // possible approach and clearly announce the empty express train's move.
 return wideViewFallback||null;
}

function decline(reason,message){return {ok:false,reason,message};}

export function requestRailwayTicket(g,p,stationId,price){
 const t=g.trainTest,status=railwayTicketStatus(g,stationId);
 if(!status.available||!g.players.includes(p)||p.hp<=0||p.room)return decline('unavailable','This station has no active railway service.');
 if(t.railwayTicket)return decline('pending','An express call is already on the line.');
 if(occupied(g))return decline('occupied','The train has passengers aboard.');
 if(status.atRequestedPlatform)return decline('at-platform','The train is already waiting at this platform.');
 if(!Number.isSafeInteger(price)||price<0||!(p.coins>=price))return decline('funds','You do not have enough coins for an express ticket.');
 const plan=approach(p,t,status.station);
 if(!plan)return decline('track','The approach track is currently blocked.');
 p.coins-=price;
 cancelConductorDestination(t);
 t.railwayTicket={...plan,stationId,payerId:p.id,price,routeId:t.route.id,elapsed:0};
 if(plan.staged){
  t.distance=plan.from;t.speed=plan.parts[0].speed;
  t.routeSegments=[{at:-Infinity,route:t.route,offset:plan.offset}];
  g.message?.('The empty express train has been dispatched toward '+status.station.name+'.');
 }
 t.engine=true;t.throttle=Math.max(t.throttle,.5);delete t.emergencyBrake;delete t.autoStationStop;delete t.requestedStop;
 t.notice='Express train for '+status.station.name+' in 10 seconds.';t.noticeUntil=t.time+5;
 g.persist?.();
 return {ok:true,station:status.station,etaSeconds:duration,message:t.notice};
}

export function cancelRailwayTicket(g,reason){
 const t=g.trainTest,call=t?.railwayTicket;
 if(!call)return false;
 delete t.railwayTicket;
 const p=g.players.find(player=>player.id===call.payerId);
 if(p)p.coins=(p.coins||0)+call.price;
 t.notice=reason+(p&&call.price?' Your ticket was refunded.':'');t.noticeUntil=t.time+6;
 g.message?.(t.notice);g.persist?.();
 return true;
}

export function advanceRailwayTicket(g,dt){
 const t=g.trainTest,call=t.railwayTicket;
 if(!call)return false;
 if(occupied(g)||t.derailed||t.route.id!==call.routeId){
  cancelRailwayTicket(g,occupied(g)?'A passenger boarded before the express stop.':'The express approach is unavailable.');
  return false;
 }
 call.elapsed=Math.min(duration,call.elapsed+dt);
 if(duration-call.elapsed<1e-8)call.elapsed=duration;
 const {speed,traveled}=ticketPosition(call.parts,call.elapsed);
 t.distance=call.from+traveled;t.speed=speed;
 return true;
}

export function finishRailwayTicket(g){
 const t=g.trainTest,call=t.railwayTicket;
 if(!call)return;
 if(occupied(g)||t.derailed||t.route.id!==call.routeId){
  cancelRailwayTicket(g,occupied(g)?'A passenger boarded before the express stop.':'The express approach is unavailable.');
  return;
 }
 if(call.elapsed<duration)return;
 const stop=trainRouteStations(t).find(s=>s.id===call.stationId);
 if(!stop){cancelRailwayTicket(g,'The express platform is unavailable.');return;}
 t.distance=call.to;t.autoStationStop={...stop,route:t.route,distance:call.to,requested:true};
 finishUnattendedStop(g);delete t.railwayTicket;g.persist?.();
}
