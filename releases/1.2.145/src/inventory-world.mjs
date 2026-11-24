import {canDropRoomLoot,dropRoomLoot} from './room-loot-data.mjs';
import {railwayLootAnchor} from './railway-loot.mjs';

export const canDropInventoryItem=(game,p)=>(!p.room||canDropRoomLoot(game,p))&&
  (['play','won','lobby'].includes(game.phase)||game.tvWorld?.players.has(p.id));
export function dropInventoryItem(game,p,type,qty=1,metadata={}){
  if(p.room)return dropRoomLoot(game,p,type,qty,metadata);
  if(game.tvWorld?.players.has(p.id))return game.tvWorld.dropItem(p.id,type,qty,metadata);
  if(game.phase==='lobby'&&game.dropLobbyItem)return game.dropLobbyItem(p,type,qty,metadata);
  const anchor=railwayLootAnchor(game,p);
  return game.dropLoot(anchor?.x??p.x,anchor?.y??p.y,type,qty,p.name+' dropped',true,{...metadata,...anchor,playerDropped:true});
}

export function collectNearbyWorldLoot(game,p,onlyPlayerDrops=false){
  const loot=game.nearbyLoot?.(p);
  if(onlyPlayerDrops)return !!loot?.playerDropped&&game.collect(p,loot);
  if(loot){game.collect(p,loot);return true;}
  const arrow=game.nearbyArrow?.(p);
  if(arrow){game.collectArrow(p,arrow);return true;}
  return false;
}
