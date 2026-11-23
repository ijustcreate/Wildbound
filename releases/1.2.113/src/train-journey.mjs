import {nextTrainStation} from './train-autostop.mjs';
import {playTrainAudio} from './train-audio.mjs';
export function trainCarName(car,short=false){return (short?{engine:'Cab',tender:'Tender',compartments:'Rooms',seats:'Seating',caboose:'Caboose'}:{engine:'Locomotive',tender:'Coal tender',compartments:'Compartment coach',seats:'Seating coach',caboose:'Caboose'})[car?.kind]||'Carriage';}
export function emergencyTrainBrake(g,p,car){
 const t=g.trainTest;if(!t||!p.trainRide?.driving||t.driver!==p.id)return false;
 t.engine=false;t.throttle=0;t.emergencyBrake=true;delete t.autoStationStop;delete t.requestedStop;
 t.notice='Emergency brake applied. Restart the engine at the console to release it.';t.noticeUntil=t.time+6;playTrainAudio(g.trainAudio,'brake',car||p,t.speed);return true;
}
export function trainBrakingPower(t){return t.design.brakePower*(t.emergencyBrake?3:1);}
export function tickTrainJourney(g,dt,previousDistance,previousRoute,engine){
 const t=g.trainTest;if(t.derailed||previousRoute!==t.route||t.distance<=previousDistance)return;
 const stop=nextTrainStation(t,previousDistance,0);if(!stop||previousDistance>=stop.distance||t.distance<stop.distance-.001)return;
 const key=t.route.id+':'+stop.id+':'+Math.round(stop.distance*10);if(t.lastArrivalKey===key)return;
 t.lastArrivalKey=key;t.arrivalBellCount=(t.arrivalBellCount||0)+1;t.stationCallout={name:stop.name,until:t.time+5};playTrainAudio(g.trainAudio,'bell',engine,t.speed);
}
export function tickTrainRest(g,dt,cs){
 const t=g.trainTest;t.passengerRest??={};
 for(const p of g.players){const r=p.trainRide,input=t.previous.get(p.id)||{},c=r&&cs[r.car],old=t.passengerRest[p.id],damaged=old&&p.hp<old.hp-.001;
  if(!r?.seat||!c||!['seats','compartments','caboose'].includes(c.kind)||p.hp<=0||p.hit>0||p.attack>0||!p.ui&&(input.attack||input.dodge||input.trap)||damaged){delete t.passengerRest[p.id];continue;}
  const state=t.passengerRest[p.id]??={seat:r.seat,elapsed:0,clock:0,hp:p.hp};if(state.seat!==r.seat){delete t.passengerRest[p.id];continue;}
  state.elapsed+=dt;if(state.elapsed>=3){state.resting=true;state.clock+=dt;if(state.clock>=2){state.clock-=2;if(p.hp<p.maxHp){p.hp=Math.min(p.maxHp,p.hp+1);g.effects??=[];g.effects.push({x:p.x,y:p.y-20-c.z-35,text:'+1',color:'#bbdea2',life:.8});}}}state.hp=p.hp;
 }
}
export function trainJourneyText(t,maxName=20){
 if(t.emergencyBrake)return 'EMERGENCY BRAKE · Restart at the cab console';
 if(!t.engine&&t.speed<1&&t.lastStationStop&&Math.abs(t.distance-t.lastStationStop.distance)<3)return 'At '+t.lastStationStop.name+' · Ready to depart';
 if(t.stationCallout?.until>t.time)return 'Arriving at '+t.stationCallout.name;
 const stop=t.autoStationStop||nextTrainStation(t);if(!stop)return 'No station on this line';
 const remaining=Math.max(0,stop.distance-t.distance),seconds=t.speed>2?Math.ceil(remaining/t.speed+(t.autoStationStop?t.speed/(2*trainBrakingPower(t)):0)):null,eta=seconds===null?'--':seconds>=60?Math.floor(seconds/60)+'m '+seconds%60+'s':seconds+'s',distance=remaining>=1000?(remaining/1000).toFixed(1)+'k px':Math.ceil(remaining)+' px',name=stop.name.length>maxName?stop.name.slice(0,maxName-1)+'…':stop.name;
 return (stop.requested?'Stop: ':'Next: ')+name+' · '+distance+' · '+(seconds===null?'--':'~'+eta);
}
export function resetTrainJourney(t){for(const key of ['stationStopCache','requestedStop','emergencyBrake','lastStationStop','lastArrivalKey','arrivalBellCount','stationCallout','passengerRest'])delete t[key];}
