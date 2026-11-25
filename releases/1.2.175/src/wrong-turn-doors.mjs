import {take} from './items.mjs';
import {isCharmed} from './succubus-charm.mjs';
import {LOCKSMITH_DOOR_ROW,LOCKSMITH_DOORS,LOCKSMITH_SHOP} from './diagon-locksmith.mjs';
import {WRONG_TURN_KEY} from './wrong-turn-key.mjs';

const rowX=LOCKSMITH_SHOP.x+LOCKSMITH_DOOR_ROW.x;
const rowY=LOCKSMITH_SHOP.y+LOCKSMITH_DOOR_ROW.y;
const previousPositions=new WeakMap();

const enabled=g=>g.trainTest?.design.activeRoom==='diagon';
const canApproach=p=>p.hp>0&&!p.room&&!p.ui&&!p.trainRide&&!p.vehicleId&&!p.broomMount&&!p.swimming&&
 !p.controlledFollowerId&&!(p.jumpHeight>0)&&!(p.stun>0)&&!(p.frozen>0)&&!isCharmed(p);
const centerX=door=>rowX+door.offset;
const insideDoor=(door,x,pad=0)=>Math.abs(x-centerX(door))<door.w/2-1-pad;
const hasKey=p=>p.inventory.some(item=>item?.type===WRONG_TURN_KEY&&item.qty>0);

function nearbyDoor(g,p){
 if(!enabled(g)||!canApproach(p)||p.y<rowY+8||p.y>rowY+31)return null;
 return LOCKSMITH_DOORS.find(door=>insideDoor(door,p.x))||null;
}

function note(g,text){
 const t=g.trainTest;t.notice=text;t.noticeUntil=t.time+4;
}

export function wrongTurnDoorPrompt(g,p){
 const door=nearbyDoor(g,p);
 if(!door)return '';
 if(g.trainTest.wrongTurnDoors?.[door.id])return 'WALK THROUGH THE '+door.name.toUpperCase();
 return hasKey(p)?'UNLOCK THE '+door.name.toUpperCase():'MYSTERY KEY REQUIRED · '+door.name.toUpperCase();
}

export function interactWrongTurnDoor(g,p,onSpend){
 const door=nearbyDoor(g,p);
 if(!door)return false;
 const t=g.trainTest,open=t.wrongTurnDoors??={};
 if(open[door.id])return true;
 if(!take(p.inventory,WRONG_TURN_KEY,1)){
  note(g,'A mystery key from Tamsin opens this lock.');
  return true;
 }
 onSpend?.();
 open[door.id]=true;
 const previous=previousPositions.get(t)||new Map();
 previous.set(p.id,{x:p.x,y:p.y});previousPositions.set(t,previous);
 g.onSound?.('door',p);
 note(g,'The '+door.name.toLowerCase()+' opens and the mystery key disappears.');
 g.persist?.();
 return true;
}

export function wrongTurnDoorBlocked(g,x,y,radius=7){
 if(Math.abs(x-rowX)>=LOCKSMITH_DOOR_ROW.halfWidth+radius||Math.abs(y-(rowY-4))>=4+radius)return false;
 const open=g.trainTest.wrongTurnDoors;
 return !LOCKSMITH_DOORS.some(door=>open?.[door.id]&&insideDoor(door,x,radius));
}

export function tickWrongTurnDoors(g,travel){
 const t=g.trainTest,open=t.wrongTurnDoors;
 if(!enabled(g)||!open||!LOCKSMITH_DOORS.some(door=>open[door.id])){previousPositions.delete(t);return false;}
 const previous=previousPositions.get(t)||new Map(),now=new Map();
 previousPositions.set(t,now);
 for(const p of g.players){
  if(!canApproach(p)||Math.abs(p.x-rowX)>90||Math.abs(p.y-rowY)>78)continue;
  now.set(p.id,{x:p.x,y:p.y});
  const last=previous.get(p.id);
  if(!last||last.y<=rowY||p.y>rowY||Math.hypot(last.x-p.x,last.y-p.y)>54)continue;
  const x=last.x+(p.x-last.x)*(last.y-rowY)/(last.y-p.y);
  const door=LOCKSMITH_DOORS.find(candidate=>open[candidate.id]&&insideDoor(candidate,x));
  if(!door)continue;
  delete open[door.id];
  let result;
  try{result=travel(g,p);}finally{if(!result?.ok)open[door.id]=true;}
  if(!result?.ok){note(g,result?.message||'The passage flickers. Step back and try again.');return false;}
  previousPositions.delete(t);
  g.persist?.();
  return true;
 }
 return false;
}
