import {ITEMS,take} from './items.mjs';
export const essenceWeapon=type=>!!ITEMS[type]?.slot&&['sword','dagger','bow','wand','staff','boomerang','rifle','scythe'].includes(ITEMS[type].base||type);
export function weaponHitContext(p,slot='hand1'){
  return {slot,weapon:p.equipment?.[slot],darkCharged:!!p.equipmentSockets?.[slot]?.includes('dark_essence')};
}
export function consumeLifeSteal(g,p,target,damage,shot){
  if(!p||!g.players?.includes(p)||p.hp<=0||p.hp>=p.maxHp||damage<=0||target.practiceTarget||target.faction==='ally'||target.faction==='neutral'||g.players.includes(target)||!shot?.darkCharged||p.equipment?.[shot.slot]!==shot.weapon)return 0;
  const sockets=p.equipmentSockets?.[shot.slot],index=sockets?.indexOf('dark_essence')??-1;
  if(index<0)return 0;
  const healing=Math.min(8,damage*.2,p.maxHp-p.hp);if(healing<=0)return 0;
  sockets.splice(index,1);p.hp+=healing;
  if(take(p.inventory||[],'dark_essence',1))sockets.splice(index,0,'dark_essence');
  g.effects?.push({x:p.x,y:p.y,life:.6,radius:12,color:'#b996ed',text:'+'+(Math.round(healing*10)/10)});
  return healing;
}
