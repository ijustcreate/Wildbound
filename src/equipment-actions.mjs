import {ITEMS,SLOTS,unequip,refreshVitals} from './items.mjs';
import {protectedItem} from './field-systems.mjs';
export function equipmentAction(g,p,action){
 const u=p.ui;
 if(!u||u.panel!=='gear'||u.socket||u.bag||u.split||u.shop||!['use','equip','drop','store'].includes(action))return false;
 let slot=SLOTS[u.index%SLOTS.length];if(p.equipment[slot]==='occupied')slot='hand1';
 const type=p.equipment[slot],def=ITEMS[type];
 if(!def){u.notice='This equipment slot is empty.';return true;}
 if(action==='use'||action==='equip'){
  u.notice=unequip(p,slot)?def.name+' unequipped.':'Backpack full — free one slot to unequip'+(!p.room&&g.phase==='play'?', or choose Drop equipped.':'.');
 }else{
  if(p.room||g.phase!=='play'){u.notice='Free a backpack slot to unequip here. Equipped items can only be dropped during an expedition.';return true;}
  if(protectedItem(p,type)){u.notice='Unlock this item in Field Kit before dropping it.';return true;}
  g.dropLoot(p.x,p.y,type,1,p.name+' dropped',true,{sockets:[...(p.equipmentSockets?.[slot]||[])]});
  p.equipment[slot]=null;if(p.equipmentSockets)delete p.equipmentSockets[slot];
  if(def.twoHanded)p.equipment.hand2=null;
  refreshVitals(p);u.notice=def.name+' dropped on the ground.';
 }
 g.persist();g.uiRevision=(g.uiRevision||0)+1;return true;
}
