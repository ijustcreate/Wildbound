import {give} from './items.mjs';

export function recordTvDrop(owner,type,qty,metadata){
  owner.npcQuests??={};
  const recovery=owner.npcQuests.tvArena??={sequence:0,items:[]};
  const id=++recovery.sequence;
  recovery.items.push({...structuredClone(metadata),type,qty,id});
  return id;
}

export function collectTvDrop(owner,id){
  const items=owner?.npcQuests?.tvArena?.items;
  const index=items?.findIndex(item=>item.id===id)??-1;
  if(index>=0)items.splice(index,1);
}

export function recoverTvDrops(owner){
  const recovery=owner.npcQuests?.tvArena;
  if(!recovery?.items.length||!owner.inventory)return false;
  const remaining=recovery.items.filter(item=>!give(owner.inventory,item.type,item.qty,undefined,item));
  if(remaining.length===recovery.items.length)return false;
  recovery.items=remaining;
  return true;
}

export function deliverTvRecovery(game){
  let recovered=false;
  for(const owner of game.players){
    if(recoverTvDrops(owner)){
      recovered=true;
      game.message?.(owner.name+' recovered dropped TV arena items.');
    }
  }
  if(recovered)game.persist?.();
}
