import {SLOTS,ITEMS} from './items.mjs';
import {inventoryCategory} from './inventory-containers.mjs';
const source=(g,p,from)=>from.mode==='gear'?p.equipment[from.slot]:from.mode==='pack'?p.inventory[from.index]:g.storageFor(p)?.[from.index];
export function inventoryCarryAction(g,p,action){
  const u=p.ui;if(!u||u.shop||u.socket||u.split||u.bag)return false;
  if(u.carry&&action==='close'){delete u.carry;u.notice='Move cancelled. Item stayed in its original slot.';return true;}
  if(action==='pick'||u.carry&&action==='use'){
    if(!['pack','gear','chest'].includes(u.panel)){u.notice='Choose an inventory or equipment slot.';return true;}
    const to={mode:u.panel,...(u.panel==='gear'?{slot:SLOTS[u.index]}:{index:u.index})};
    if(!u.carry){const item=source(g,p,to);const type=typeof item==='string'?item:item?.type;
      if(!item||type==='occupied'||u.panel==='pack'&&u.tab&&inventoryCategory(type)!==u.tab){u.notice='Choose an item to move.';return true;}
      u.carry={from:to,snapshot:JSON.stringify(item),name:ITEMS[type]?.name||type};u.notice='Moving '+u.carry.name+' · Select a slot, then place. B / Esc cancels.';
    }else{
      if(JSON.stringify(source(g,p,u.carry.from))!==u.carry.snapshot){delete u.carry;u.notice='The original item changed. Pick it up again.';return true;}
      if(g.moveInventoryItem(p,u.carry.from,to)){delete u.carry;}
    }return true;
  }
  if(u.carry&&!['next','prev','up','down','panel'].includes(action)&&!action.startsWith('select:')&&!action.startsWith('tab:')&&!action.startsWith('panel:')){u.notice='Place or cancel the held item first.';return true;}
  return false;
}
