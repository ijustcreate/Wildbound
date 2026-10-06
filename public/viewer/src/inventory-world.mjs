// A TV session is an expedition for its participants, not for other lobby heroes.
export const canDropInventoryItem=(game,p)=>!p.room&&(game.phase==='play'||game.tvWorld?.players.has(p.id));
export function dropInventoryItem(game,p,type,qty=1,metadata={}){
  if(game.tvWorld?.players.has(p.id))game.tvWorld.dropItem(p.id,type,qty,metadata);
  else game.dropLoot(p.x,p.y,type,qty,p.name+' dropped',true,metadata);
}
