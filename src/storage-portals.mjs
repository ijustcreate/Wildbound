import {isCharmed} from './succubus-charm.mjs';
import {tickStorageRoom} from './storage-room.mjs';
import {drawPortal} from './portal-art.mjs';

export const privateStoragePortal=d=>!d.temple&&!d.oldWell&&!d.shadowPassage&&!d.forestTravel;

export function railwayStorageScene(g){
 return g.trainTest?(g.trainTest.design.activeRoom||'railway-outdoors'):undefined;
}

export function storagePortalsInScene(g){
 const scene=railwayStorageScene(g);
 return g.portals.filter(d=>privateStoragePortal(d)&&!d.bankVault&&d.railwayScene===scene);
}

export function drawStoragePortals(c,g,visible){
 for(const door of storagePortalsInScene(g)){
  if(visible(door))drawPortal(c,door,g.time,'PRIVATE STORAGE');
 }
}

export function tickPortalClosures(g,dt,portals=g.portals){
 for(const d of portals){
  if(d.shadowPassage||!Number.isFinite(d.closing))continue;
  d.closing-=dt;
  if(d.closing>0)continue;
  for(const p of g.players)if(p.room===d.id)g.leaveRoom(p,true);
  g.portals=g.portals.filter(q=>q!==d);
 }
}

export function walkIntoPortal(g,p,portals=g.portals){
 for(const door of portals){
  if(door.autoEnter===false||door.oldWell)continue;
  door.entryReady??=[];
  const distance=Math.hypot(p.x-door.x,p.y-door.y),ready=door.entryReady.includes(p.id);
  if(distance>34&&!ready)door.entryReady.push(p.id);
  if(distance<=26&&ready&&g.enterRoom(p,door))return true;
 }
 return false;
}

export function tickRailwayStoragePlayer(g,p,input,old,dt){
 if(p.ui||p.hp<=0||p.stun>0||p.frozen>0||p.sleeping>0||isCharmed(p))return !!p.room;
 const pressed=input.portal&&!old.portal;
 if(p.room){
  p.consumeInput=true;p.moving=false;p.charge=0;
  if(pressed)g.portal(p);
  else tickStorageRoom(g,p,input,dt,input.interact&&!old.interact,input.loot&&!old.loot);
  p.previousInput={...input};
  return true;
 }
 if(p.trainRide||p.pirateRide||p.vehicleId||p.broomMount||p.wingHover||p.gardenBench||p.swimming||p.jumpHeight>0)return false;
 if(walkIntoPortal(g,p,storagePortalsInScene(g)))return true;
 if(pressed)g.portal(p);
 return !!p.room;
}
