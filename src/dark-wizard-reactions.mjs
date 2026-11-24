import {DEATH_EATER_MASKS} from './death-eater-masks.mjs';

export const DARK_WIZARD_WARNING='Oh no, dark wizards!';
const NOTICE_RANGE=104,RETREAT_RANGE=148,RUN_SPEED=87,SPEECH_TIME=2.3;
const RETREAT_TAIL=.65,SCAN_INTERVAL=.16;
const TURN_OPTIONS=[0,30,-30,60,-60,90,-90].map(degrees=>{
 const angle=degrees*Math.PI/180;
 return [Math.cos(angle),Math.sin(angle)];
});

export function maskWearers(players){
 return players.filter(p=>p.hp>0&&!p.room&&!p.trainRide&&!p.controlledFollowerId&&
  (p.jumpHeight||0)+(p.groundHeight||0)<35&&Object.hasOwn(DEATH_EATER_MASKS,p.equipment?.head));
}

function nearest(point,wearers,range,canSee){
 let found=null,closest=range*range;
 for(const player of wearers){
  const distance=(point.x-player.x)**2+(point.y-player.y)**2;
  if(distance<closest&&(!canSee||canSee(player))){found=player;closest=distance;}
 }
 return found;
}

function retreatHeading(actor,threat,blocked,radius){
 let x=actor.x-threat.x,y=actor.y-threat.y;
 if(Math.abs(x)+Math.abs(y)<.001){x=-(threat.faceX||0);y=-(threat.faceY||0);if(!x&&!y)y=1;}
 const length=Math.hypot(x,y),awayX=x/length,awayY=y/length;
 let nearbyExit=null;
 for(const [cos,sin]of TURN_OPTIONS){
  const dx=awayX*cos-awayY*sin,dy=awayX*sin+awayY*cos;
  if(blocked(actor.x+dx*5,actor.y+dy*5,radius))continue;
  const heading={dx,dy};
  if(!blocked(actor.x+dx*14,actor.y+dy*14,radius)&&!blocked(actor.x+dx*24,actor.y+dy*24,radius))return heading;
  nearbyExit??=heading;
 }
 return nearbyExit;
}

export function tickDarkWizardAlarm(actor,wearers,time,dt,blocked,radius,hasSight){
 let alarm=actor.darkWizardAlarm;
 if(!alarm){
  if(!wearers.length||time<(actor.nextDarkWizardScan||0))return false;
  const threat=nearest(actor,wearers,NOTICE_RANGE,hasSight);
  actor.nextDarkWizardScan=time+SCAN_INTERVAL;
  if(!threat)return false;
  alarm=actor.darkWizardAlarm={origin:{x:actor.x,y:actor.y},lastThreat:threat,lastSeen:time,warningUntil:time+SPEECH_TIME};
  actor.path.length=0;
  actor.place=null;
  actor.retryAt=0;
  actor.socialUntil=0;
  actor.lastSocialAt=time;
  actor.activityUntil=0;
 }

 const close=nearest(actor,wearers,RETREAT_RANGE);
 const holding=close||nearest(alarm.origin,wearers,NOTICE_RANGE);
 if(holding)alarm.lastSeen=time;
 else if(time-alarm.lastSeen>=RETREAT_TAIL){
  delete actor.darkWizardAlarm;
  return false;
 }
 // Once a resident has escaped, wait for their original spot to clear.
 // The warning should never drive a loop of returning to the same threat.
 if(!close)return true;
 const threat=close;
 if(threat!==alarm.lastThreat||time>=(alarm.repathAt??0)){
  alarm.heading=retreatHeading(actor,threat,blocked,radius);
  alarm.lastThreat=threat;
  alarm.repathAt=time+SCAN_INTERVAL;
 }
 const {heading}=alarm;
 if(!heading)return true;
 const travel=RUN_SPEED*dt,x=actor.x+heading.dx*travel,y=actor.y+heading.dy*travel;
 if(blocked(x,y,radius)){alarm.heading=null;alarm.repathAt=time+.1;return true;}
 Object.assign(actor,{x,y,faceX:heading.dx,faceY:heading.dy,moving:travel>0,
  walking:false,moveSpeed:RUN_SPEED,movementGait:'run',step:actor.step+travel*.13});
 return true;
}

const fixedAlarms=new WeakMap();

export function tickStationaryWizardAlarms(railway,wearers,time,nearStationaryWizard){
 let previous=fixedAlarms.get(railway);
 if(!wearers.length){if(previous)fixedAlarms.delete(railway);return;}
 if(!nearStationaryWizard||previous&&time<previous.nextCheck)return;
 const next=new Map();
 for(const player of wearers){
  const actor=nearStationaryWizard(player);
  if(!actor||next.has(actor.id))continue;
  const old=previous?.speakers.get(actor.id);
  const alarm=old&&time-previous.nextCheck<.4?old:{actor,until:time+SPEECH_TIME};
  next.set(actor.id,alarm);
 }
 fixedAlarms.set(railway,{speakers:next,nextCheck:time+SCAN_INTERVAL});
}

export function stationaryWizardWarning(railway,time,visible){
 const speakers=fixedAlarms.get(railway)?.speakers;
 if(!speakers)return null;
 for(const {actor,until}of speakers.values())if(time<until&&visible(actor.x,actor.y,80,100))return actor;
 return null;
}
