import {ROOM_STATIONS} from './shops.mjs';
export const ROBOT_REPAIR_SECONDS=2.4;
export function storageOwner(game,p){const door=game.portals.find(d=>d.id===p.room&&!d.temple);return game.players.find(q=>q.id===door?.owner);}
export const robotOnline=owner=>owner?.robotRepaired===true;
export const nearStorageRobot=p=>Math.hypot((p.roomX??Infinity)-ROOM_STATIONS.robot.x,(p.roomY??Infinity)-ROOM_STATIONS.robot.y)<35;
export function cancelRobotRepair(p){delete p.robotRepair;p.robotRepairPointer=false;}
export function openRobotIntroduction(game,p){
 const owner=storageOwner(game,p);
 if(!owner||p.hp<=0||p.robotIntroduced||p.robotRepaired)return false;
 p.robotIntroduced=true;cancelRobotRepair(p);
 p.ui={ownerDevice:p.device,panel:'robot-intro',shop:'robot-intro',index:0,robotIntroBroken:!robotOnline(owner)};
 game.persist();return true;
}
export function tickRobotRepair(game,p,held,dt){
 const owner=storageOwner(game,p);
 if(!owner||robotOnline(owner)||p.ui||p.hp<=0||!nearStorageRobot(p)||!held){cancelRobotRepair(p);return false;}
 if(p.robotRepair?.owner!==owner.id||p.robotRepair?.room!==p.room)p.robotRepair={owner:owner.id,room:p.room,progress:0};
 p.robotRepair.progress=Math.min(ROBOT_REPAIR_SECONDS,p.robotRepair.progress+Math.max(0,Math.min(.1,dt)));
 p.roomMoving=false;p.faceX=ROOM_STATIONS.robot.x-p.roomX;p.faceY=ROOM_STATIONS.robot.y-p.roomY;
 if(p.robotRepair.progress>=ROBOT_REPAIR_SECONDS-1e-8){
  owner.robotRepaired=true;owner.robotIntroduced=true;cancelRobotRepair(p);game.uiRevision=(game.uiRevision||0)+1;
  game.message('SCRAP-9 repaired. Interact again to trade.');game.onSound('inventory',p);game.persist();
 }
 return true;
}
