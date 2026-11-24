import {take} from './items.mjs';
import {wildHomesteadHearth} from './wild-homestead-layout.mjs';
export {HOMESTEAD_HEARTH} from './wild-homestead-layout.mjs';

function reachableHearth(g,p,shop){
 const train=g.trainTest;
 if(!shop||!train?.design.wildLands||p.hp<=0||p.trainRide||p.pirateRide||p.room||p.vehicleId||p.broomMount||p.jumpHeight>2)return;
 const room=train.design.activeRoom;
 const hearth=room==='diagon'?shop:!room?wildHomesteadHearth(train.design):null;
 if(hearth&&Math.abs(p.x-hearth.x)<=11&&p.y>=hearth.y-13&&p.y<=hearth.y+1)return hearth;
}

export function hearthBlocks(hearth,x,y,radius){
 if(!hearth)return false;
 const dx=Math.abs(x-hearth.x),dy=y-hearth.y;
 if(dx>=24+radius||dy<=-36-radius||dy>=1+radius)return false;
 // Solid rear wall and jambs leave the opening clear for a standing explorer.
 return dy<-22+radius||dx>17-radius;
}

function hasPowder(p){return p.inventory?.some(item=>item?.type==='floo_powder'&&item.qty>0);}

export function flooPrompt(g,p,shop){
 const hearth=reachableHearth(g,p,shop);
 if(!hearth)return null;
 if(!hasPowder(p)||g.trainTest.flooTransfer)return '';
 return hearth.room?'FLOO TO THE HOMESTEAD':'FLOO TO DIAGON ALLEY';
}

export function startFlooTravel(g,p,shop){
 const from=reachableHearth(g,p,shop);
 if(!from||!hasPowder(p))return false;
 const t=g.trainTest;
 if(t.flooTransfer)return true;
 if(g.players.some(q=>q.trainRide||q.pirateRide||q.room||q.vehicleId||q.broomMount)){
  g.message?.('Gather the party on foot before using the hearth.');return true;
 }
 t.flooTransfer={player:p.id,from,to:from.room?wildHomesteadHearth(t.design):shop,at:t.time+.28};
 g.onSound?.('magic',p);
 return true;
}

export function tickFlooTravel(g,shop,complete){
 const t=g.trainTest,transfer=t?.flooTransfer;
 if(!transfer||t.time<transfer.at)return false;
 delete t.flooTransfer;
 const player=g.players.find(p=>p.id===transfer.player);
 if(!player||reachableHearth(g,player,shop)?.id!==transfer.from.id||player.ui||
   g.players.some(p=>p.trainRide||p.pirateRide||p.room||p.vehicleId||p.broomMount)||!take(player.inventory,'floo_powder',1))return false;
 t.flooGlow={id:transfer.to.id,until:t.time+.85};
 complete(transfer.to,player);
 return true;
}

export function flooFireGreen(g,id){
 const t=g?.trainTest;
 return !!t&&(t.flooTransfer?.from.id===id||t.flooGlow?.id===id&&t.flooGlow.until>t.time);
}
