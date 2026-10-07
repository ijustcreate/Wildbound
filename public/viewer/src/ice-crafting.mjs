import {clearSlot} from './items.mjs';
// Old chest callers are harmless, but no removed ammunition/recipe can spawn.
export function dropIceRecipe(){return false;}
export function learnIceRecipe(){return false;}
export function tickMeltingIce(g,dt,environment=g.generatedEnvironment){
 if(environment==='ice')return;
 let changed=false;
 const melt=list=>{for(let i=0;i<(list||[]).length;i++){
  const item=list[i];if(!item)continue;
  if(item.contents)melt(item.contents);
  if(item.type!=='raw_ice')continue;
  item.meltRemaining=(item.meltRemaining??300)-dt;
  if(item.meltRemaining<=0){clearSlot(list,i);changed=true;}
 }};
 for(const p of g.players){melt(p.inventory);for(const chest of p.chests||[])melt(chest);melt(p.field?.overflow);}
 melt(g.sharedStash);
 for(const l of [...g.loot])if(l.type==='raw_ice'){l.meltRemaining=(l.meltRemaining??300)-dt;if(l.meltRemaining<=0){g.loot=g.loot.filter(v=>v!==l);changed=true;}}
 if(changed){g.message('The remaining raw ice melted.');g.persist();}
}
