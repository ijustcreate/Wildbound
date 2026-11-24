import {BACKPACK_SLOTS,ITEMS,sellStack,sellValue,transfer} from './items.mjs';
import {robotOnline} from './storage-repair.mjs';

export const robotBuybackIndices=owner=>(owner?.robotStock||[]).flatMap((item,index)=>item?[index]:[]).reverse();
export const robotBuying=u=>u.robotView==='buyback'||u.robotView==='stock';
export const ROBOT_COLUMNS=6;
const backpackRows=Math.ceil(BACKPACK_SLOTS/ROBOT_COLUMNS);
function packSlot(row,column){return Math.min(BACKPACK_SLOTS-1,row*ROBOT_COLUMNS+column);}
export function buybackStack(p,owner,index){
  const item=owner?.robotStock?.[index];
  if(!item||!ITEMS[item.type])return 'Select a sold item to buy back.';
  const price=sellValue(item.type)*item.qty;
  if((p.coins||0)<price)return 'Not enough gold to buy this stack back.';
  // transfer checks capacity before any mutation and preserves sockets/container contents.
  if(!transfer(owner.robotStock,p.inventory,index,BACKPACK_SLOTS))return 'Backpack full. Free a slot before buying back.';
  p.coins-=price;
  return 'Bought back '+ITEMS[item.type].name+' for '+price+' gold.';
}
export function robotShopAction(g,p,action){
  const u=p.ui;
  if(u?.shop!=='robot'||u.split)return false;
  const owner=g.shopOwner(p),indices=robotBuybackIndices(owner);
  if(!robotOnline(owner)&&action!=='close'){u.notice='Repair SCRAP-9 in the storage room first.';return true;}
  const changeView=view=>{u.robotView=view==='stock'?'buyback':view;u.panel='pack';u.notice='';if(robotBuying(u)&&!indices.includes(u.robotIndex))u.robotIndex=indices[0]??0;};
  if(action==='panel'||action.startsWith('robotView:')){
    changeView(action==='panel'?(robotBuying(u)?'sell':'buyback'):action.slice(10));return true;
  }
  if(action.startsWith('robotSelect:')){
    const [,view,raw]=action.split(':'),index=Number(raw);
    if(!Number.isInteger(index)||index<0)return true;
    if(view==='buyback'&&indices.includes(index)){changeView(view);u.robotIndex=index;}
    else if(view==='sell'&&index<BACKPACK_SLOTS){changeView(view);u.index=index;}
    return true;
  }
  if(action.startsWith('robotPage:')){
    const page=Math.floor(Math.max(0,indices.indexOf(u.robotIndex))/ROBOT_COLUMNS),pages=Math.max(1,Math.ceil(indices.length/ROBOT_COLUMNS));
    changeView('buyback');u.robotIndex=indices[((page+(action.endsWith('next')?1:-1)+pages)%pages)*ROBOT_COLUMNS]??0;return true;
  }
  if(['next','prev','down','up'].includes(action)){
    if(robotBuying(u)){
      const at=Math.max(0,indices.indexOf(u.robotIndex));
      if(action==='down'){changeView('sell');u.index=at%ROBOT_COLUMNS;}
      else if(action==='up'){changeView('sell');u.index=packSlot(backpackRows-1,at%ROBOT_COLUMNS);}
      else u.robotIndex=indices[(at+(action==='next'?1:-1)+indices.length)%indices.length]??0;
    }else if(action==='up'&&u.index<ROBOT_COLUMNS&&indices.length){
      const column=u.index;changeView('buyback');u.robotIndex=indices[Math.min(column,indices.length-1)];
    }else if(action==='up'||action==='down'){
      const row=Math.floor(u.index/ROBOT_COLUMNS)+(action==='down'?1:-1);
      u.index=packSlot((row+backpackRows)%backpackRows,u.index%ROBOT_COLUMNS);
    }else u.index=(u.index+(action==='next'?1:-1)+BACKPACK_SLOTS)%BACKPACK_SLOTS;
    return true;
  }
  if(action==='offhand'){
    if(!robotBuying(u))g.inventoryAction(p,'split');return true;
  }
  if(action==='use'||action==='robotSell'||action==='robotBuyback'){
    const buying=action==='robotBuyback'||action==='use'&&robotBuying(u);
    if(buying){
      u.notice=buybackStack(p,owner,u.robotIndex);
      const remaining=robotBuybackIndices(owner);if(!remaining.includes(u.robotIndex))u.robotIndex=remaining[0]??0;
    }else{
      const selected=p.inventory[u.index];
      u.notice=sellStack(p,u.index,(owner.robotStock||=[]))?'Sold for gold.':selected&&p.field?.favorites?.includes(selected.type)?'Unlock this favorite in Field Kit before selling.':'Select an item to sell, or make room in the robot stock.';
      // Leave the cursor in the same visible slot, including after selling the last item.
    }
    g.persist();g.uiRevision=(g.uiRevision||0)+1;return true;
  }
  if(robotBuying(u)&&action!=='close')return true;
  return false;
}
