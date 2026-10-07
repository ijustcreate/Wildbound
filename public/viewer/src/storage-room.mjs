import {roomBlocked,ROOM_STATIONS} from './shops.mjs';
import {tickRobotRepair,storageOwner,robotOnline,nearStorageRobot,openRobotIntroduction} from './storage-repair.mjs';

// Room-local height avoids ticking expedition physics twice, and also works
// in the lobby where the expedition clock is stopped. Floor coordinates stay
// unchanged for shadows, furniture collisions, depth sorting and stations.
export function resetStorageJump(p){
  p.roomJumpHeight=0;p.roomJumpVelocity=0;p.roomJumpAge=0;p.roomLandTime=0;p.roomJumpHeld=false;
}
export function storageVisualActor(p){
  return {...p,x:p.roomX,y:p.roomY,moving:!!p.roomMoving,step:p.roomStep||0,
    jumpHeight:p.roomJumpHeight||0,jumpVelocity:p.roomJumpVelocity||0,jumpAge:p.roomJumpAge||0,
    groundHeight:0,landTime:p.roomLandTime||0,swimming:false,wingHover:false};
}
function tickStorageJump(game,p,input,dt){
  p.roomLandTime=Math.max(0,(p.roomLandTime||0)-dt);
  if(p.hp<=0){resetStorageJump(p);return;}
  if(input.jump&&!p.roomJumpHeld&&!(p.roomJumpHeight>0)&&!(p.stun>0)&&!(p.rooted>0)&&p.state!=='snared'){
    p.roomJumpHeight=.01;p.roomJumpVelocity=125*(1+(p.field?.skills?.long_jump||0)*.15);p.roomJumpAge=0;p.roomLandTime=0;
    game.onSound?.('jump',p);
  }
  p.roomJumpHeld=!!input.jump;
  if(p.roomJumpHeight>0){
    p.roomJumpAge=(p.roomJumpAge||0)+dt;p.roomJumpVelocity-=360*dt;
    p.roomJumpHeight=Math.max(0,p.roomJumpHeight+p.roomJumpVelocity*dt);
    if(!p.roomJumpHeight){p.roomJumpVelocity=0;p.roomLandTime=.22;}
  }
}

// The expedition and lobby use the same room movement and station interactions.
export function tickStorageRoom(game,p,input,dt,interact=false){
  tickStorageJump(game,p,input,dt);
  const beforeX=p.roomX,beforeY=p.roomY;
  const nx=Math.max(25,Math.min(295,p.roomX+(input.x||0)*90*dt));
  const ny=Math.max(45,Math.min(218,p.roomY+(input.y||0)*90*dt));
  if(!roomBlocked(nx,p.roomY))p.roomX=nx;
  if(!roomBlocked(p.roomX,ny))p.roomY=ny;
  const dx=p.roomX-beforeX,dy=p.roomY-beforeY,distance=Math.hypot(dx,dy);
  p.roomMoving=distance>.001;p.roomStep=(p.roomStep||0)+distance*.13;
  if(p.roomMoving){p.faceX=dx/distance;p.faceY=dy/distance;}
  if(p.roomJumpHeight>0)return;
  if(interact&&nearStorageRobot(p)&&openRobotIntroduction(game,p))return;
  if(tickRobotRepair(game,p,!!(input.interact||input.lobbyInteract||p.robotRepairPointer),dt))return;
  if(Math.hypot(p.roomX-160,p.roomY-214)<18){game.leaveRoom(p);return;}
  if(!interact)return;
  if(p.roomY>192&&Math.abs(p.roomX-160)<40)game.leaveRoom(p);
  else if(Math.hypot(p.roomX-ROOM_STATIONS.robot.x,p.roomY-ROOM_STATIONS.robot.y)<35){
    if(robotOnline(storageOwner(game,p)))game.openShop(p,'robot');
    else game.message('SCRAP-9 is offline. Hold Interact nearby to repair it.');
  }
  else if(Math.hypot(p.roomX-255,p.roomY-158)<35)game.openShop(p,'vending');
  else{
    const n=[60,160,260].findIndex(x=>Math.hypot(x-p.roomX,80-p.roomY)<50);
    if(n>=0)game.openInventory(p,n);
  }
}
