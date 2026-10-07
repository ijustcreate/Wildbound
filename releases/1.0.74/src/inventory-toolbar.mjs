import {ITEMS,SLOTS,socketCount} from './items.mjs';
import {protectedItem} from './field-systems.mjs';
import {salvageReason} from './salvage.mjs';
import {canDropInventoryItem} from './inventory-world.mjs';

// Stable controls: selection changes availability, never the layout or button count.
export function inventoryToolbar(game,p,pad){
  const u=p.ui,gear=u.panel==='gear',pack=u.panel==='pack';
  const slot=gear?SLOTS[u.index]:null,occupied=gear&&p.equipment[slot]==='occupied';
  const type=gear?p.equipment[occupied?'hand1':slot]:p.inventory[u.index]?.type;
  const item=gear?{type,qty:1}:p.inventory[u.index],def=ITEMS[type];
  const keyboard=p.device==='keyboard',carrying=!!u.carry,empty='Select an item first.';
  const canUse=def&&(def.slot||def.bag||def.recipe||type.startsWith('caught_')||['potion','stamina_potion','coconut','honeycomb','trap'].includes(type));
  const dropReason=!def?empty:!pack&&!gear?'Select an item in your bag or equipment.':!canDropInventoryItem(game,p)?'Items can only be dropped during an expedition.':protectedItem(p,type)?'Unlock this item in Field Kit first.':'';
  const option=(id,label,key,action,reason='')=>({id,label,key,action,reason:carrying&&id!=='move-item'?'Place or cancel the held item first.':reason});
  return {item,def,gear,options:[
    option('use',gear?'Unequip':def?.bag?'Open bag':def?.recipe?'Learn recipe':def?.slot?'Equip':'Use',keyboard?'Enter':pad[0],gear?'use':'equip',!def?empty:!gear&&!canUse?type==='arrow'?'Arrows are used automatically when you fire a bow.':'This item has no direct use yet.':''),
    option('offhand','Hand 2',keyboard?'2':pad[3],'equipOffhand',!pack||def?.slot!=='hand1'||def?.twoHanded?'Select a one-handed weapon.':item.qty>1?'Split this stack first; the top face button splits stacks.':''),
    option('sockets-'+u.panel,'Sockets',keyboard?'T':pad[6]+'+'+pad[3],'sockets',!def||!socketCount(type)||occupied?'Select equipment with trinket sockets.':''),
    option('salvage-hold','Salvage',keyboard?'V':pad[7],'salvage',salvageReason(p)),
    option('move-item',carrying?'Place':'Move',keyboard?'M':'LS','pick',carrying?'':!def||occupied?'Select an item to move.':''),
    option('split','Split',keyboard?'2':pad[3],'split',!pack||!(item?.qty>1)?'Select a stack of at least two items.':''),
    option('dropOne','Drop one',keyboard?'Shift+Del':pad[6]+'+'+pad[2],'dropOne',!pack?'Select an item in your backpack.':dropReason),
    option('drop',gear?'Drop gear':'Drop stack',keyboard?'Del':pad[2],'drop',dropReason),
  ]};
}
