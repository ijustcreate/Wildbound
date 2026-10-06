import {roomBlocked,ROOM_STATIONS} from './shops.mjs';

// The expedition and lobby use the same room movement and station interactions.
export function tickStorageRoom(game,p,input,dt,interact=false){
  const beforeX=p.roomX,beforeY=p.roomY;
  const nx=Math.max(25,Math.min(295,p.roomX+(input.x||0)*90*dt));
  const ny=Math.max(45,Math.min(218,p.roomY+(input.y||0)*90*dt));
  if(!roomBlocked(nx,p.roomY))p.roomX=nx;
  if(!roomBlocked(p.roomX,ny))p.roomY=ny;
  const dx=p.roomX-beforeX,dy=p.roomY-beforeY,distance=Math.hypot(dx,dy);
  p.roomMoving=distance>.001;p.roomStep=(p.roomStep||0)+distance*.13;
  if(p.roomMoving){p.faceX=dx/distance;p.faceY=dy/distance;}
  if(Math.hypot(p.roomX-160,p.roomY-214)<18){game.leaveRoom(p);return;}
  if(!interact)return;
  if(p.roomY>192&&Math.abs(p.roomX-160)<40)game.leaveRoom(p);
  else if(Math.hypot(p.roomX-ROOM_STATIONS.robot.x,p.roomY-ROOM_STATIONS.robot.y)<35)game.openShop(p,'robot');
  else if(Math.hypot(p.roomX-255,p.roomY-158)<35)game.openShop(p,'vending');
  else{
    const n=[60,160,260].findIndex(x=>Math.hypot(x-p.roomX,80-p.roomY)<50);
    if(n>=0)game.openInventory(p,n);
  }
}
