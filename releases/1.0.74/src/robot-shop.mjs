import {ITEMS,sellStack,sellValue,transfer} from './items.mjs';
import {robotOnline} from './storage-repair.mjs';

export const robotBuybackIndices=owner=>(owner?.robotStock||[]).flatMap((item,index)=>item?[index]:[]).reverse();
export const robotBuying=u=>u.robotView==='buyback'||u.robotView==='stock';
export function buybackStack(p,owner,index){
  const item=owner?.robotStock?.[index];
  if(!item||!ITEMS[item.type])return 'Select a sold item to buy back.';
  const price=sellValue(item.type)*item.qty;
  if((p.coins||0)<price)return 'Not enough gold to buy this stack back.';
  // transfer checks capacity before any mutation and preserves sockets/container contents.
  if(!transfer(owner.robotStock,p.inventory,index,24))return 'Backpack full. Free a slot before buying back.';
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
    else if(view==='sell'&&index<24){changeView(view);u.index=index;}
    return true;
  }
  if(action.startsWith('robotPage:')){
    const page=Math.floor(Math.max(0,indices.indexOf(u.robotIndex))/6),pages=Math.max(1,Math.ceil(indices.length/6));
    changeView('buyback');u.robotIndex=indices[((page+(action.endsWith('next')?1:-1)+pages)%pages)*6]??0;return true;
  }
  if(['next','prev','down','up'].includes(action)){
    if(robotBuying(u)){
      const at=Math.max(0,indices.indexOf(u.robotIndex));
      if(action==='down'){changeView('sell');u.index=at%6;}
      else if(action==='up'){changeView('sell');u.index=18+at%6;}
      else u.robotIndex=indices[(at+(action==='next'?1:-1)+indices.length)%indices.length]??0;
    }else if(action==='up'&&u.index<6&&indices.length){
      const column=u.index;changeView('buyback');u.robotIndex=indices[Math.min(column,indices.length-1)];
    }else u.index=(u.index+(action==='next'?1:action==='prev'?-1:action==='down'?6:-6)+24)%24;
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
