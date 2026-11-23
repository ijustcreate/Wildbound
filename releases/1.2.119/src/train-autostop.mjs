import {nearestTrainTrack} from './train-track.mjs';

export function nextTrainStation(t,at=t.distance,minAhead=4){
 const d=t.design,key=[d.wildStopsRevision||0,d.trackRevision||0,d.station?.x,d.station?.y,d.station?.name].join(':'),markers=d.wildLands?(d.wildStops||[]):d.station?[{...d.station,...d._stationContext}]:[];
 let cached=t.stationStopCache;if(!cached||cached.route!==t.route||cached.design!==d||cached.markers!==(d.wildLands?d.wildStops:d.station)||cached.key!==key){
  cached={route:t.route,design:d,markers:d.wildLands?d.wildStops:d.station,key,stops:markers.map((origin,i)=>{const q=nearestTrainTrack(t.route,origin.x,origin.y);return q.distance<=700?{id:origin.id||'station-'+i,name:origin.name||'Lakewood',s:q.s}:null;}).filter(Boolean)};t.stationStopCache=cached;
 }
 const offset=t.routeSegments?.at(-1)?.offset||0,length=t.route.length,s=((at+offset)%length+length)%length;
 return cached.stops.map(stop=>{let ahead=(stop.s-s+length)%length;if(ahead<minAhead)ahead+=length;return {...stop,route:t.route,distance:at+ahead};}).sort((a,b)=>a.distance-b.distance)[0]||null;
}
export function requestTrainStationStop(g){
 const t=g.trainTest;if(!t?.engine||t.derailed)return {ok:false,message:'The train is parked. We can arrange a stop once we are moving.'};
 const stop=t.autoStationStop?.route===t.route?t.autoStationStop:nextTrainStation(t);if(!stop)return {ok:false,message:'There is no reachable station on this line.'};
 t.requestedStop=true;t.autoStationStop={...stop,requested:true};return {ok:true,stop:t.autoStationStop,message:'Certainly. We will stop at '+stop.name+'.'};
}
// A station target belongs to the active route. Route switches replan it; a
// boarding player cancels only an unattended stop, not a passenger request.
export function unattendedTrainTarget(g){
 const t=g.trainTest;
 if(!t||!t.engine||t.derailed){if(t){delete t.autoStationStop;delete t.requestedStop;}return null;}
 if(!t.requestedStop&&g.players.some(p=>p.hp>0&&p.trainRide)){delete t.autoStationStop;return null;}
 if(t.autoStationStop?.route===t.route)return t.autoStationStop;
 // Use physical stop markers, including while the last explorer is in a cave
 // or portal room. The station renderer intentionally hides surface stations
 // in those rooms and must not decide whether the empty train can stop.
 const stop=nextTrainStation(t);t.autoStationStop=stop?{...stop,requested:!!t.requestedStop}:null;return t.autoStationStop;
}
export function unattendedTrainSpeed(g){
 const t=g.trainTest,stop=unattendedTrainTarget(g),normal=t.engine&&!t.derailed?t.throttle*t.design.maxSpeed:0;
 if(!stop)return normal;
 // Conservative braking envelope accounts for the next discrete simulation
 // step. Movement is also clamped at the stop marker, including a fast train
 // whose last rider leaves too late to brake over the remaining distance.
 const remaining=Math.max(0,stop.distance-t.distance);
 return Math.min(normal,Math.sqrt(2*t.design.brakePower*Math.max(0,remaining-2)));
}
export function finishUnattendedStop(g){
 const t=g.trainTest,stop=t.autoStationStop;if(!stop)return false;
 if(t.distance<stop.distance-2)return false;
 t.distance=stop.distance;t.speed=0;t.throttle=0;t.engine=false;
 const driver=g.players.find(p=>p.id===t.driver&&p.hp>0&&p.trainRide?.driving);t.driver=driver?.id??null;
 for(const p of g.players)if(p!==driver&&p.trainRide?.driving)delete p.trainRide.driving;
 t.lastStationStop={...stop,at:t.time};t.notice='Stopped at '+stop.name+'. '+(stop.requested?'Your requested stop is complete. Restart at the cab when ready.':'The empty train will wait here.');t.noticeUntil=t.time+6;delete t.autoStationStop;delete t.requestedStop;return true;
}
