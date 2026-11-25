import {dropTempleLoot} from './temple-loot-data.mjs';

function lootRoom(game,p) {
  if(p.room==null)return null;
  const door=game.portals?.find(door=>door.id===p.room);
  if(!door||door.shadowPassage||door.forestTravel)return null;
  if(door.temple)return door;
  if(door.oldWell)return door.well?door:null;
  return door.owner!=null?door:null;
}

export function canDropRoomLoot(game,p) {
  return !!lootRoom(game,p)&&Number.isFinite(p.roomX)&&Number.isFinite(p.roomY)&&p.hp>0&&!p.cryptPitFall;
}

function storageRoomKey(door) {
  // Reopening the owner's portal creates a new door ID to the same storeroom.
  return `${door.lobby?'lobby':door.railwayScene||'expedition'}:${door.owner}`;
}

export function storageRoomLoot(game,door) {
  return game.storageRoomLoot?.[storageRoomKey(door)]||[];
}

export function dropRoomLoot(game,p,type,qty=1,metadata={}) {
  if(!canDropRoomLoot(game,p))return false;
  const door=lootRoom(game,p);
  if(door.temple)return dropTempleLoot(game,p,type,qty,metadata);
  const items=door.oldWell?(door.well.drops??=[]):((game.storageRoomLoot??={})[storageRoomKey(door)]??=[]);
  const item={...structuredClone(metadata),id:game.nextId++,x:p.roomX,y:p.roomY,type,qty,
    source:p.name+' dropped',manualPickup:true};
  items.push(item);
  game.onSound?.('drop',p);
  return item;
}
