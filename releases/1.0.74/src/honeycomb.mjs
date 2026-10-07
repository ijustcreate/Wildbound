import {take} from './items.mjs';

export const HONEYCOMB_HEAL=25;
// Called by the normal death/loot pipeline; the marker also survives save/reload.
export function dropHiveHoney(g,hive){
  if(hive?.kind!=='bee_hive'||hive.hp>0||hive.honeyDropped)return false;
  hive.honeyDropped=true;
  g.dropLoot(hive.x,hive.y+12,'honeycomb',3,'Broken beehive',true);
  return true;
}
export function useHoneycomb(g,p){
  if(!p||p.hp<=0||!Number.isFinite(p.maxHp)||p.hp>=p.maxHp||!take(p.inventory,'honeycomb'))return false;
  const healed=Math.min(HONEYCOMB_HEAL,p.maxHp-p.hp);p.hp+=healed;
  g.effects.push({x:p.room?p.roomX:p.x,y:(p.room?p.roomY:p.y)-30,room:p.room||null,text:'+'+healed,color:'#7ee89b',life:1});
  if(p.ui)p.ui.notice='Honeycomb restored '+healed+' health.';
  g.onSound('heal',p);g.persist();return true;
}
