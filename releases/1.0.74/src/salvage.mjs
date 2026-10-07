import {ITEMS,clearSlot,refreshVitals,give} from './items.mjs';
import {critterContainer} from './critter-containers.mjs';
export const SALVAGE_SECONDS=1.25;
export function salvageYield(type,metadata={}){
 if(type?.startsWith('caught_')&&ITEMS[type])return [{type:'dark_essence',qty:1},{type:critterContainer(type,metadata),qty:1}];
 const item=ITEMS[type];if(!item||item.gmOnly||!(item.slot||item.relic))return [];
 const tier=item.rarity||'common',dust={common:1,rare:2,unique:4,legendary:8}[tier]||1;
 const result=[{type:'relic_dust',qty:dust}];
 if(tier==='legendary')result.push({type:'legendary_essence',qty:1});
 else if(item.magic||item.relic||tier!=='common')result.push({type:'magic_essence',qty:tier==='unique'?2:1});
 return result;
}
export function salvageReason(p){
 if(!p.ui||p.ui.panel!=='pack'||p.ui.shop||p.ui.socket)return 'Select gear in your backpack.';
 if(p.room)return 'Leave the storage room to salvage at your feet.';
 if(p.hp<=0||p.stun>0)return 'Cannot salvage while incapacitated.';
 const item=p.inventory[p.ui.index];
 if(!salvageYield(item?.type).length)return 'Only gear, relics and captured critters can be salvaged.';
 if(p.field?.favorites?.includes(item.type))return 'Unlock this item in Field Kit first.';
 return '';
}
// Requires a fresh hold for each item. Changing selection or performing another
// inventory action cancels the hold instead of destroying the next selected item.
export function tickSalvage(g,p,held,dt){
 if(!held){delete p.salvageHold;return;}
 if(p.salvageHold?.latched)return;
 const reason=salvageReason(p),item=p.inventory[p.ui?.index];
 if(reason){p.salvageHold={latched:true};return;}
 let hold=p.salvageHold;
 if(hold&&(hold.item!==item||hold.index!==p.ui.index||hold.type!==item.type||hold.qty!==item.qty)) {p.salvageHold={latched:true};return;}
 if(!hold)hold=p.salvageHold={item,index:p.ui.index,type:item.type,qty:item.qty,elapsed:0};
 hold.elapsed+=Math.max(0,Math.min(.1,dt));
 if(hold.elapsed+1e-8<SALVAGE_SECONDS)return;
 const drops=[...salvageYield(item.type,item),...(item.sockets||[]).map(type=>({type,qty:1}))];
 // The lobby has a separate practice simulation; world drops there would be
 // invisible and discarded on starting an expedition. Deliver atomically to
 // the real backpack, including returned socketed trinkets.
 let lobbyPack;
 if(g.phase==='lobby'){
  lobbyPack=structuredClone(p.inventory);
  if(--lobbyPack[hold.index].qty===0)clearSlot(lobbyPack,hold.index);
  else delete lobbyPack[hold.index].sockets;
  if(!drops.every(drop=>give(lobbyPack,drop.type,drop.qty))){
   p.salvageHold={latched:true};p.ui.salvagePointer=false;
   p.ui.notice='Free backpack space for the salvage materials. Nothing was consumed.';
   g.uiRevision=(g.uiRevision||0)+1;return;
  }
 }
 if(--item.qty===0)clearSlot(p.inventory,hold.index);
 else delete item.sockets;
 p.salvageHold={latched:true};p.ui.salvagePointer=false;p.salvageFinish=.3;
 if(lobbyPack)p.inventory=lobbyPack;
 else for(const [n,drop] of drops.entries()){
  const a=n*Math.PI*2/drops.length;
  g.dropLoot(p.x+Math.cos(a)*18,p.y+Math.sin(a)*12,drop.type,drop.qty,'Salvaged by '+p.name,true);
  const loot=g.loot.at(-1);if(loot)loot.salvageBorn=g.time;
 }
 refreshVitals(p);p.ui.notice=lobbyPack?'Salvaged. Materials and socketed trinkets added to your backpack. Release to salvage again.':'Salvaged. Materials and socketed trinkets are at your feet. Release to salvage again.';
 g.uiRevision=(g.uiRevision||0)+1;g.persist();
}
export function salvageProgress(p){return p.salvageHold?.latched?0:Math.min(1,(p.salvageHold?.elapsed||0)/SALVAGE_SECONDS);}
