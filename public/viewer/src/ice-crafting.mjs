import {take,clearSlot} from './items.mjs';
export function knowsIceRecipe(p){return !!p.field?.recipes?.ice_arrow;}
export function hasIceRecipe(p){
 const contains=list=>(list||[]).some(i=>i?.type==='ice_arrow_recipe'||(i?.contents&&contains(i.contents)));
 return knowsIceRecipe(p)||contains(p.inventory)||(p.chests||[]).some(contains)||contains(p.field?.overflow);
}
export function dropIceRecipe(g,p,x,y){
 if(g.generatedEnvironment!=='ice'||hasIceRecipe(p))return false;
 if(g.random()>=.2)return false;
 g.dropLoot(x,y,'ice_arrow_recipe',1,'Ice arrow recipe',true);return true;
}
export function learnIceRecipe(p){
 if(knowsIceRecipe(p)||!take(p.inventory,'ice_arrow_recipe'))return false;
 ((p.field||={}).recipes||={}).ice_arrow=true;return true;
}
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
