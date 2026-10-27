// Lobby heroes can leave items on the shared ground and pick them back up.
// A TV session is an expedition for its participants, not for other lobby heroes.
import {dropTempleLoot} from './temple-loot.mjs';
export const canDropInventoryItem=(game,p)=>(!p.room||p.room==='temple-upper')&&(game.phase==='play'||game.phase==='lobby'||game.tvWorld?.players.has(p.id));
export function dropInventoryItem(game,p,type,qty=1,metadata={}){
  if(p.room==='temple-upper')return dropTempleLoot(game,p,type,qty,metadata);
  if(game.tvWorld?.players.has(p.id))game.tvWorld.dropItem(p.id,type,qty,metadata);
  else if(game.phase==='lobby'&&game.dropLobbyItem)game.dropLobbyItem(p,type,qty,metadata);
  else game.dropLoot(p.x,p.y,type,qty,p.name+' dropped',true,metadata);
}
