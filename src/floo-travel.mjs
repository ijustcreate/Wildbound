import {take} from './items.mjs';
import {wildHomesteadHearth} from './wild-homestead-layout.mjs';
import {HOGSMEADE_BUILDINGS,HOGSMEADE_PROPS} from './hogsmeade-layout.mjs';
import {carriesInnWand} from './hogsmeade.mjs';
import {GREYHAVEN_HEARTH} from './wild-castle.mjs';
export {HOMESTEAD_HEARTH} from './wild-homestead-layout.mjs';

const inn=HOGSMEADE_BUILDINGS.find(site=>site.id==='three-broomsticks');
const fireplace=HOGSMEADE_PROPS.find(prop=>prop.id==='stone-hearth');
export const THREE_BROOMSTICKS_HEARTH=Object.freeze({id:inn.id,room:null,x:inn.x+fireplace.x,y:inn.y+fireplace.y});
const names={'three-broomsticks':'The Three Broomsticks','homestead':'Wilds Homestead','nocturne-curios':'Nocturne Alley'};
const cancel={label:'Stay here',action:'close'};

function network(g,shop){return [wildHomesteadHearth(g.trainTest.design),shop,THREE_BROOMSTICKS_HEARTH,GREYHAVEN_HEARTH];}
const hearthName=hearth=>hearth.name||names[hearth.id];

function reachableHearth(g,p,shop,nearby=false){
 const train=g.trainTest;
 if(!shop||!train?.design.wildLands||p.hp<=0||p.trainRide||p.pirateRide||p.room||p.vehicleId||p.broomMount||
   p.swimming||p.controlledFollowerId||p.bedRest||p.jumpHeight>2)return;
 const room=train.design.activeRoom||null;
 return network(g,shop).find(hearth=>{
  const {x,y}=hearth.approach||hearth;
  return hearth.room===room&&Math.abs(p.x-x)<=(nearby?32:11)&&p.y>=y-13&&p.y<=y+(nearby?38:1);
 });
}

export function hearthBlocks(hearth,x,y,radius){
 if(!hearth)return false;
 const dx=Math.abs(x-hearth.x),dy=y-hearth.y;
 if(dx>=24+radius||dy<=-36-radius||dy>=1+radius)return false;
 // Solid rear wall and jambs leave the opening clear for a standing explorer.
 return dy<-22+radius||dx>17-radius;
}

function hasPowder(p){return p.inventory?.some(item=>item?.type==='floo_powder'&&item.qty>0);}
const canBringParty=g=>!g.players.some(p=>p.trainRide||p.pirateRide||p.room||p.vehicleId||p.broomMount||p.controlledFollowerId||p.ui?.carry);
const needsWand=(dest,p)=>dest.id===THREE_BROOMSTICKS_HEARTH.id&&!carriesInnWand(p);

export function flooPrompt(g,p,shop){
 const hearth=reachableHearth(g,p,shop);
 if(!hearth)return null;
 if(!hasPowder(p)||g.trainTest.flooTransfer)return '';
 return 'USE FLOO POWDER';
}

export function startFlooTravel(g,p,shop,fromPack=false){
 if(p.ui&&!fromPack)return false;
 const from=reachableHearth(g,p,shop,fromPack);
 if(!from||!hasPowder(p)){
  if(fromPack&&p.ui)p.ui.notice='Use Floo Powder beside a linked fireplace.';
  return fromPack;
 }
 const t=g.trainTest;
 if(t.flooTransfer){
  if(fromPack&&p.ui)p.ui.notice='The fireplace is already carrying a traveller.';
  return true;
 }
 p.ui={shop:'npc-dialogue',npcId:'floo-network',flooHearth:from.id,flooFromPack:fromPack,ownerDevice:p.device,node:'destinations',index:0};
 p.consumeInput=true;p.interactUsed=true;p.charge=0;p.moving=false;
 g.onSound?.('ui',p);
 return true;
}

export function flooDialogueView(g,p,shop){
 const ui=p.ui,from=reachableHearth(g,p,shop,ui?.flooFromPack);
 const hearth=from?.id===ui?.flooHearth&&ui?.ownerDevice===p.device?from:null;
 const title=hearth&&hearthName(hearth);
 const choices=hearth?network(g,shop).filter(dest=>dest.id!==hearth.id).map(dest=>({
  label:hearthName(dest),action:'floo:'+dest.id,disabled:needsWand(dest,p),
  detail:needsWand(dest,p)?'Carry a wand to visit the inn.':hearth.room!==dest.room?'The party travels together.':'Only you travel.',
 })): [];
 return {hearth,npc:{name:'Floo Powder',title},text:hearth?'Which fireplace do you want to go to? Each journey uses one pinch.':
  'Step back beside a linked fireplace to choose a destination.',choices:[...choices,cancel]};
}

export function flooDialogueAction(g,p,shop,action){
 const ui=p.ui,{hearth,choices}=flooDialogueView(g,p,shop);
 if(action==='use')action=choices[ui.index]?.action;
 if(action?.startsWith('choice:'))action=choices[Number(action.slice(7))]?.action;
 if(!hearth||action==='close'){p.ui=null;p.consumeInput=true;return true;}
 if(['next','down','prev','up'].includes(action)){
  const step=action==='next'||action==='down'?1:-1;
  ui.index=(ui.index+choices.length+step)%choices.length;
  return true;
 }
 if(!choices.some(choice=>choice.action===action&&!choice.disabled))return true;
 const t=g.trainTest,to=network(g,shop).find(dest=>'floo:'+dest.id===action);
 if(!to||t.flooTransfer||!hasPowder(p))return true;
 if(to.room!==hearth.room&&!canBringParty(g)){
  ui.notice='Everyone needs to be on foot before the party can use the Floo network.';
  return true;
 }
 t.flooTransfer={player:p.id,from:hearth,to,nearby:ui.flooFromPack,at:t.time+.28};
 p.ui=null;p.consumeInput=true;
 g.onSound?.('magic',p);
 return true;
}

export function tickFlooTravel(g,shop,plan,complete){
 const t=g.trainTest,transfer=t?.flooTransfer;
 if(!transfer||t.time<transfer.at)return false;
 delete t.flooTransfer;
 const player=g.players.find(p=>p.id===transfer.player);
 const crossing=transfer.from.room!==transfer.to.room;
 if(!player||reachableHearth(g,player,shop,transfer.nearby)?.id!==transfer.from.id||player.ui||
   crossing&&!canBringParty(g)||!hasPowder(player)||needsWand(transfer.to,player))return false;
 const travellers=crossing?[player,...g.players.filter(p=>p!==player)]:[player];
 const landing=plan(transfer.to,travellers);
 if(!landing){
  g.message?.('The destination hearth has no clear landing. Your Floo Powder is still in your backpack.');
  return false;
 }
 if(!take(player.inventory,'floo_powder',1))return false;
 t.flooGlow={id:transfer.to.id,until:t.time+.85};
 complete(transfer.to,player,travellers,landing);
 return true;
}

export function flooFireGreen(g,id){
 const t=g?.trainTest;
 return !!t&&(t.flooTransfer?.from.id===id||t.flooGlow?.id===id&&t.flooGlow.until>t.time);
}
