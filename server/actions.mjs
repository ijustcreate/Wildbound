import {canAccess,protectedItem,craft} from '../src/field-systems.mjs';
import {trainSkill} from '../src/field-skills.mjs';
import {take} from '../src/items.mjs';
import {tamePet,feedPet,renamePet} from '../src/hunter-pets.mjs';
import {storeInBag,takeFromBag} from '../src/inventory-containers.mjs';
import {wellForPlayer} from '../src/old-well.mjs';
import {openForestPortal} from '../src/forest-portal-event.mjs';

function accessibleStorage(g,p,storage) {
  if(storage==null)return true;
  if(p.ui?.storage===storage)return true;
  if(Number.isInteger(storage)||storage==='shared')return !!g.portals.find(d=>d.id===p.room&&!d.oldWell);
  if(storage==='old-well')return !!wellForPlayer(g,p);
  if(storage==='temple')return !!g.templeChest&&Math.hypot(p.x-800,p.y-1060)<100;
  if(storage==='victory')return !!g.victoryChest&&Math.hypot(p.x-800,p.y-914)<60;
  return false; // Starter chest is opened by the authoritative interaction tick.
}
export function performAction(g,p,action,arg) {
  if(p.hp<=0&&action!=='leaveRoom')return {ok:false,message:'Your explorer is down.'};
  if(action==='openForestPassage')return openForestPortal(g,p.id);
  if(action==='craft')return {message:craft(p,arg)};
  if(action==='trainSkill')return {message:trainSkill(p,arg)};
  if(action==='trapMode'){
    if(!['snare','slow','lure','interrupt'].includes(arg))return {message:'Unknown trap mode.'};
    p.field.trap=arg;return {message:'Trap mode changed.'};
  }
  if(action==='tamePet')return {message:tamePet(g,p)?'Companion tamed.':'Approach a wild animal with the Ranger set equipped.'};
  if(action==='feedPet')return {message:feedPet(g,p)?'Companion fed.':'Stand beside your pet with its food in your bag.'};
  if(action==='renamePet')return {message:renamePet(g,p,arg.name,arg.collar)?'Companion updated.':'Enter a companion name.'};
  if(action==='deployBarricade'){
    if(p.room||g.openingBoard)return {message:'Deploy in an active expedition.'};
    const x=p.x+p.faceX*60,y=p.y+p.faceY*60;
    if(g.blocked(x,y,24)||g.players.some(q=>Math.hypot(q.x-x,q.y-y)<40))return {message:'Find clear ground in front of you.'};
    if(!take(p.inventory,'barricade'))return {message:'Craft a barricade first.'};
    (g.barricades||=[]).push({x,y,life:30});return {message:'Barricade placed.'};
  }
  if(action==='openInventory'){
    if(!accessibleStorage(g,p,arg))return {ok:false,message:'Move to that storage first.'};
    g.openInventory(p,arg);return;
  }
  if(action==='moveInventoryItem'){g.moveInventoryItem(p,arg.from,arg.to);return;}
  if(action==='bagTransfer'){
    const u=p.ui,s=u?.bag;
    if(!s)return;
    if(arg.operation==='close'){delete u.bag;return;}
    const list=s.mode==='chest'?g.storageFor(p):p.inventory,bag=list?.[s.index];
    if(!bag || (s.mode==='chest'&&!canAccess(g,p,arg.operation==='take')))return;
    if(arg.operation==='take')takeFromBag(bag,arg.index,p.inventory);
    else {
      const from=arg.mode==='chest'?g.storageFor(p):p.inventory;
      if((arg.mode!=='chest'||canAccess(g,p,true))&&!protectedItem(p,from?.[arg.index]?.type))storeInBag(from,bag,arg.index);
    }
    g.persist();return;
  }
  g[action](p,arg);
}
