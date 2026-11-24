import {nearestTrainTrack} from './train-track.mjs';

export const CONDUCTOR_THROTTLE=2/5;
const STATION_TOLERANCE=.005;

function distanceToStop(t,s,at,minAhead){
 const offset=t.routeSegments?.at(-1)?.offset||0,length=t.route.length;
 const lap=Math.ceil((at+offset+minAhead-s)/length);
 return s+lap*length-offset;
}

export function trainRouteStations(t){
 const d=t.design,key=[d.wildStopsRevision||0,d.trackRevision||0,d.station?.x,d.station?.y,d.station?.name].join(':'),markers=d.wildLands?(d.wildStops||[]):d.station?[{...d.station,...d._stationContext}]:[];
 let cached=t.stationStopCache;if(!cached||cached.route!==t.route||cached.design!==d||cached.markers!==(d.wildLands?d.wildStops:d.station)||cached.key!==key){
  const stops=markers.map((origin,i)=>{const q=nearestTrainTrack(t.route,origin.x,origin.y);return q.distance<=700?{id:origin.id||'station-'+i,name:origin.name||'Lakewood',s:q.s,x:q.x,y:q.y}:null;}).filter(Boolean).sort((a,b)=>a.s-b.s);
  cached={route:t.route,design:d,markers:d.wildLands?d.wildStops:d.station,key,stops};t.stationStopCache=cached;
 }
 return cached.stops;
}
export function nextTrainStation(t,at=t.distance,minAhead=4){
 const stops=trainRouteStations(t);
 return stops.map(stop=>({...stop,route:t.route,distance:distanceToStop(t,stop.s,at,minAhead)})).sort((a,b)=>a.distance-b.distance)[0]||null;
}
export function requestTrainStationStop(g){
 const t=g.trainTest;if(!t?.engine||t.derailed)return {ok:false,message:'The train is parked. We can arrange a stop once we are moving.'};
 const stop=t.autoStationStop?.route===t.route?t.autoStationStop:nextTrainStation(t);if(!stop)return {ok:false,message:'There is no reachable station on this line.'};
 t.requestedStop=true;t.autoStationStop={...stop,requested:true};return {ok:true,stop:t.autoStationStop,message:'Certainly. We will stop at '+stop.name+'.'};
}

export function cancelConductorDestination(t){
 if(!t?.conductorDestination&&!t?.autoStationStop?.conductor)return false;
 delete t.conductorDestination;delete t.autoStationStop;delete t.requestedStop;
 return true;
}

export function requestConductorDestination(g,p,stationId){
 const t=g.trainTest;
 if(!t?.route||t.derailed||!g.players.includes(p)||p.hp<=0||!p.trainRide)return {ok:false,message:'A passenger can request a platform from the train.'};
 if(t.driver||g.players.some(actor=>actor.trainRide?.driving))return {ok:false,message:'An explorer has the cab controls. Ask again after the controls are released.'};
 if(t.railwayTicket)return {ok:false,message:'The train is serving an express call from the ticket office.'};
 const stop=trainRouteStations(t).find(marker=>marker.id===stationId);
 if(!stop)return {ok:false,message:'That station is unavailable on the active line.'};
 const brakeDistance=t.speed*t.speed/(2*t.design.brakePower),distance=distanceToStop(t,stop.s,t.distance,Math.max(4,brakeDistance+1));
 t.conductorDestination={stationId,routeId:t.route.id,distance,offset:t.routeSegments?.at(-1)?.offset||0};
 t.autoStationStop={...stop,route:t.route,distance,requested:true,conductor:true};
 t.requestedStop=true;t.engine=true;t.throttle=CONDUCTOR_THROTTLE;
 delete t.emergencyBrake;delete t.conductorWhistles;
 t.notice='Conductor: '+stop.name+' · Speed setting 2';t.noticeUntil=t.time+6;
 g.persist?.();
 return {ok:true,message:'We will stop at '+stop.name+'. Speed setting 2.'};
}
// A station target belongs to the active route. Route switches replan it; a
// boarding player cancels only an unattended stop, not a passenger request.
export function unattendedTrainTarget(g){
 const t=g.trainTest;
 if(!t||!t.engine||t.derailed){if(t){cancelConductorDestination(t);delete t.autoStationStop;delete t.requestedStop;}return null;}
 const order=t.conductorDestination;
 if(order){
  const stop=order.routeId===t.route.id&&Number.isFinite(order.distance)&&trainRouteStations(t).find(marker=>marker.id===order.stationId);
  if(!stop||t.driver){cancelConductorDestination(t);}
  else{
   if(t.autoStationStop?.route!==t.route)t.autoStationStop={...stop,route:t.route,distance:order.distance,requested:true,conductor:true};
   return t.autoStationStop;
  }
 }
 if(!t.requestedStop&&g.players.some(p=>p.hp>0&&p.trainRide)){delete t.autoStationStop;return null;}
 if(t.autoStationStop?.route===t.route)return t.autoStationStop;
 // Use physical stop markers, including while the last explorer is in a cave
 // or portal room. The station renderer intentionally hides surface stations
 // in those rooms and must not decide whether the empty train can stop.
 const stop=nextTrainStation(t);t.autoStationStop=stop?{...stop,requested:!!t.requestedStop}:null;return t.autoStationStop;
}
export function unattendedTrainSpeed(g,dt=.05){
 const t=g.trainTest,stop=unattendedTrainTarget(g),normal=t.engine&&!t.derailed?t.throttle*t.design.maxSpeed:0;
 if(!stop)return normal;
 // Conservative braking envelope accounts for the next discrete simulation
 // step. Movement is also clamped at the stop marker, including a fast train
 // whose last rider leaves too late to brake over the remaining distance.
 const remaining=Math.max(0,stop.distance-t.distance);
 if(stop.conductor){
  const brake=t.design.brakePower,step=brake*dt;
  return Math.min(normal,Math.sqrt(step*step+2*brake*remaining)-step);
 }
 return Math.min(normal,Math.sqrt(2*t.design.brakePower*Math.max(0,remaining-2)));
}
export function finishUnattendedStop(g){
 const t=g.trainTest,stop=t.autoStationStop;if(!stop)return false;
 const tolerance=stop.conductor?STATION_TOLERANCE:2;
 if(t.distance<stop.distance-tolerance||stop.conductor&&t.speed>.05*t.design.brakePower)return false;
 t.distance=stop.distance;t.speed=0;t.throttle=0;t.engine=false;
 const driver=g.players.find(p=>p.id===t.driver&&p.hp>0&&p.trainRide?.driving);t.driver=driver?.id??null;
 for(const p of g.players)if(p!==driver&&p.trainRide?.driving)delete p.trainRide.driving;
 t.lastStationStop={...stop,at:t.time};t.notice='Stopped at '+stop.name+'. '+(stop.requested?'Your requested stop is complete. Restart at the cab when ready.':'The empty train will wait here.');t.noticeUntil=t.time+6;delete t.autoStationStop;delete t.requestedStop;
 if(stop.conductor){delete t.conductorDestination;t.conductorWhistles={remaining:3,next:t.time};g.persist?.();}
 return true;
}
