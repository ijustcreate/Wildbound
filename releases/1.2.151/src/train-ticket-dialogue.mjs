import {stationTicketBooths} from './railway-station.mjs';
import {railwayTicketStatus,requestRailwayTicket} from './train-ticket-service.mjs';

export const TRAIN_TICKET_PRICE=5;
const TALK_RANGE=52;
const EXIT={label:'Back to the platform',action:'close'};

function canSpeak(g,p){
 return Boolean(g.trainTest?.design&&!g.trainTest.design.activeRoom&&
  p.hp>0&&!p.trainRide&&!p.room&&!p.swimming&&!p.underBridge&&!p.vehicleId&&!p.broomMount);
}

export function nearbyTrainTicketBooth(g,p){
 if(!canSpeak(g,p)||p.ui)return null;
 let nearest=null,reach=TALK_RANGE;
 for(const booth of stationTicketBooths(g.trainTest.design)){
  const distance=Math.hypot(p.x-booth.approach.x,p.y-booth.approach.y);
  if(distance<=reach){nearest=booth;reach=distance;}
 }
 return nearest;
}

export function openTrainTicketDialogue(g,p){
 const booth=nearbyTrainTicketBooth(g,p);
 if(!booth)return false;
 p.ui={shop:'npc-dialogue',trainTicketStation:booth.stationId,npcId:booth.seller.id,
  ownerDevice:p.device,index:0,node:'tickets'};
 p.consumeInput=true;p.moving=false;p.charge=0;
 g.onSound?.('ui',p);
 return true;
}

function activeBooth(g,p){
 const ui=p.ui;
 if(!canSpeak(g,p)||ui?.shop!=='npc-dialogue'||ui.ownerDevice!==p.device)return null;
 const booth=stationTicketBooths(g.trainTest.design).find(b=>b.stationId===ui.trainTicketStation&&b.seller.id===ui.npcId);
 if(!booth||Math.hypot(p.x-booth.approach.x,p.y-booth.approach.y)>TALK_RANGE+15)return null;
 return booth;
}

function occupiedReport(status){
 const {lastPassed,stopsAway,direction,compass}=status;
 if(status.atRequestedPlatform)return 'The train is at this platform with explorers aboard.';
 if(!lastPassed)return 'The train has explorers aboard. It hasn’t passed a station on this run yet.';
 if(!stopsAway)return 'The train has explorers aboard and just passed this station.';
 const count=stopsAway===1?'one stop':stopsAway+' stops';
 const way=compass?compass+' along the line':direction==='behind'?'back along the line':'ahead along the line';
 const location=status.atPlatform?'It is stopped at ':'It last passed ';
 return 'The train has explorers aboard. '+location+lastPassed.name+', '+count+' '+way+' from here.';
}

export function trainTicketDialogueView(g,p){
 const booth=activeBooth(g,p);
 if(!booth)return {text:'The ticket office is out of reach.',choices:[EXIT]};
 const status=railwayTicketStatus(g,booth.stationId);
 let text,choices=[EXIT];
 if(status.occupied){
  text=occupiedReport(status);
 }else if(status.pending){
  text=status.etaSeconds>0
   ?'The train has a call for '+status.pending.name+'. It is due in '+Math.ceil(status.etaSeconds)+' seconds.'
   :'The train is pulling in.';
 }else if(status.atRequestedPlatform){
  text='The train is already at this platform. You can board from the doorway.';
 }else if(status.available){
  text='I can call the empty train to '+booth.stationName+'. It’ll stop here in ten seconds.';
  const poor=(p.coins||0)<TRAIN_TICKET_PRICE;
  choices=[{label:'Buy a ticket · '+TRAIN_TICKET_PRICE+' gold',action:'ticket:buy',
   disabled:poor,detail:poor?'You’re short '+(TRAIN_TICKET_PRICE-(p.coins||0))+' gold.':'The train will wait at the platform.'},EXIT];
 }else{
  text='There’s no train available on this line right now.';
 }
 return {npc:booth.seller,title:booth.stationName+' ticket office',text,choices,notice:p.ui.notice||''};
}

export function tickTrainTicketDialogue(g,p){
 const {npc,text,choices}=trainTicketDialogueView(g,p);
 if(!npc){p.ui=null;p.consumeInput=true;return;}
 p.ui.revision=text;
 if(p.ui.index>=choices.length)p.ui.index=0;
}

export function trainTicketDialogueAction(g,p,action){
 const booth=activeBooth(g,p),ui=p.ui;
 if(!booth||action==='close'){p.ui=null;p.consumeInput=true;return true;}
 const {choices}=trainTicketDialogueView(g,p);
 if(['next','prev','down','up'].includes(action)){
  const move=action==='next'||action==='down'?1:-1;
  ui.index=(ui.index+move+choices.length)%choices.length;return true;
 }
 if(action==='use')action=choices[ui.index]?.action;
 if(action?.startsWith('choice:'))action=choices[Number(action.slice(7))]?.action;
 if(action==='close'){p.ui=null;p.consumeInput=true;return true;}
 if(action!=='ticket:buy'||!choices.some(c=>c.action===action&&!c.disabled))return true;
 const sale=requestRailwayTicket(g,p,booth.stationId,TRAIN_TICKET_PRICE);
 if(!sale.ok){ui.notice=sale.message||'The ticket office is unavailable.';return true;}
 p.ui=null;p.consumeInput=true;
 g.onSound?.('purchase',p);
 return true;
}
