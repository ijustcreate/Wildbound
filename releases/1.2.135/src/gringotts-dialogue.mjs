const offer={label:'Exchange 5 Dark Essence · Receive 50 gold',action:'exchange'};
const account={label:'How does the exchange work?',action:'account'};
const leave={label:'Leave the counter',action:'close'};

export function gringottsView(g,p){
 const ui=p.ui;
 if(g.trainTest?.design.activeRoom!=='diagon'||ui.ownerDevice!==p.device)return {text:'The exchange counter is closed.',choices:[leave]};
 return {npc:ui.gringotts,text:ui.notice||'Good day. Place the essence on the scale. I’ll count the gold where you can see it.',choices:[offer,account,leave]};
}

export function gringottsAction(g,p,action,take){
 const ui=p.ui,{npc,choices}=gringottsView(g,p);
 if(!npc||action==='close'){p.ui=null;p.consumeInput=true;return true;}
 if(['next','prev','up','down'].includes(action)){
  ui.index=(ui.index+choices.length+(['next','down'].includes(action)?1:-1))%choices.length;return true;
 }
 if(action==='use')action=choices[ui.index]?.action;
 if(action?.startsWith('choice:'))action=choices[Number(action.slice(7))]?.action;
 if(action==='close'){p.ui=null;p.consumeInput=true;return true;}
 if(action==='account'){ui.notice='Five portions of Dark Essence buy fifty gold. You need the full five before the scale will balance.';return true;}
 if(action!=='exchange')return true;
 const t=g.trainTest,original=t.returnPlayers?.find(explorer=>explorer.id===p.id);
 const receipt=t.persistent?null:((t.alleyPurchases??={})[p.id]??={spent:0,gold:0,items:[],delta:{}});
 const reserved=-(receipt?.delta.dark_essence||0);
 if(receipt){
  const durable=original?.inventory.reduce((sum,item)=>sum+(item?.type==='dark_essence'?item.qty:0),0)||0;
  if(durable<reserved+5){ui.notice='Bring five portions of Dark Essence from your expedition for a lasting exchange.';return true;}
 }
 if(!take(p.inventory,'dark_essence',5)){ui.notice='The scale is short. Come back with five portions of Dark Essence.';return true;}
 p.coins=(p.coins||0)+50;
 if(receipt){receipt.gold+=50;receipt.delta.dark_essence=-reserved-5;}
 ui.notice='Five portions received. Fifty gold, as agreed.';
 g.onSound?.('purchase',p);g.persist?.();return true;
}
