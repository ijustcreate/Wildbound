import {clearSlot,give} from './items.mjs';
import {shopServiceReach} from './diagon-shop-rooms.mjs';
import {alleyReceipt} from './diagon-alley.mjs';
import {BORGIN_HEART_PRICE,ownsStolenHeart,stolenHeartName} from './stolen-heart.mjs';

const shopId='borgin-burkes';
const browse={label:'Browse the antiques',action:'borgin:shop'};
const mirror={label:'Ask about the silver mirror',action:'borgin:mirror'};
const leave={label:'Leave the counter',action:'close'};

export function openBorginDialogue(p,shop,merchant){
 const {id,x,y}=shop;
 p.ui={shop:'npc-dialogue',alleyShop:id,borginHeart:{shop:{id,x,y},actor:{...merchant.visual,name:shop.owner,title:shop.name}},
  ownerDevice:p.device,index:0,node:'counter'};
 p.consumeInput=true;p.charge=0;
 return true;
}

export function validBorginDialogue(g,p){
 const u=p.ui;
 return !!u?.borginHeart&&u.ownerDevice===p.device&&g.trainTest?.design.activeRoom==='diagon'&&
  p.hp>0&&!p.room&&!p.trainRide&&!p.swimming&&u.borginHeart.shop.id===shopId&&shopServiceReach(u.borginHeart.shop,p);
}

export function borginDialogueView(g,p){
 const u=p.ui;
 if(!validBorginDialogue(g,p))return {text:'You have left Borgin’s counter.',choices:[leave]};
 const npc=u.borginHeart.actor,heart=p.inventory.find(item=>ownsStolenHeart(p,item));
 const choices=[browse,mirror,leave];
 let text='See anything you like? I stock pieces that polite shops would rather keep under a cloth.';
 if(u.node==='mirror'){
  text=heart?'That heart belongs to you. I could take it off your hands for fifty Dark Essence. Let’s keep this between us.':
   'The mirror remembers the faces that linger. If it ever takes something of yours, show it to me quietly. I only deal with the explorer it belongs to.';
  if(heart)choices.splice(1,1,{label:`Trade ${stolenHeartName(heart)} · Receive ${BORGIN_HEART_PRICE} Dark Essence`,action:'borgin:trade'});
 }
 return {npc,text,choices};
}

function changePage(u,node,notice=''){
 u.node=node;u.notice=notice;u.index=0;u.revision=(u.revision||0)+1;
}

function tradeHeart(g,p){
 const index=p.inventory.findIndex(item=>ownsStolenHeart(p,item)),u=p.ui;
 if(index<0){changePage(u,'mirror','Bring the heart that belongs to you.');return;}
 const heart=p.inventory[index],pack=p.inventory.map(item=>item?{...item}:item);
 clearSlot(pack,index);
 if(!give(pack,'dark_essence',BORGIN_HEART_PRICE)){
  changePage(u,'mirror','Make room for fifty Dark Essence. Your heart stays with you.');return;
 }
 p.inventory=pack;
 const t=g.trainTest,original=t.returnPlayers?.find(explorer=>explorer.id===p.id);
 if(!t.persistent&&original?.inventory.some(item=>ownsStolenHeart(original,item)&&item.stolenHeart.ownerKey===heart.stolenHeart.ownerKey)){
  const receipt=alleyReceipt(g,p),trades=receipt.borginHeartTrades??=[];
  if(!trades.includes(heart.stolenHeart.ownerKey))trades.push(heart.stolenHeart.ownerKey);
 }
 changePage(u,'mirror','Here is your fifty Dark Essence. We never had this conversation.');
 g.onSound?.('purchase',p);g.persist?.();
}

export function borginDialogueAction(g,p,action){
 const u=p.ui,{npc,choices}=borginDialogueView(g,p);
 if(!npc||action==='close'){p.ui=null;p.consumeInput=true;return true;}
 if(['next','prev','up','down'].includes(action)){
  u.index=(u.index+choices.length+(['next','down'].includes(action)?1:-1))%choices.length;return true;
 }
 if(action==='use')action=choices[u.index]?.action;
 if(action?.startsWith('choice:'))action=choices[Number(action.slice(7))]?.action;
 if(!choices.some(choice=>choice.action===action))return true;
 if(action==='close'){p.ui=null;p.consumeInput=true;}
 if(action==='borgin:shop'){
  const m=g.trainTest.alleyMerchants?.[shopId];
  if(m){p.ui={shop:'merchant',alleyShop:shopId,panel:'stock',index:0,page:0,notice:m.greeting};p.consumeInput=true;}
 }
 if(action==='borgin:mirror')changePage(u,'mirror');
 if(action==='borgin:trade')tradeHeart(g,p);
 return true;
}

export function transferBorginHeartTrades(original,receipt,pending){
 for(const key of receipt.borginHeartTrades||[]){
  const index=original.inventory.findIndex(item=>ownsStolenHeart(original,item)&&item.stolenHeart.ownerKey===key);
  if(index<0)continue;
  clearSlot(original.inventory,index);
  if(!give(original.inventory,'dark_essence',BORGIN_HEART_PRICE))pending.push({type:'dark_essence',qty:BORGIN_HEART_PRICE});
 }
}
