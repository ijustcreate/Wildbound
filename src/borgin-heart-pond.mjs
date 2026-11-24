import {clearSlot} from './items.mjs';
import {inGardenPond} from './diagon-garden-ward.mjs';
import {emitGameplayFx} from './gameplay-fx.mjs';
import {STOLEN_HEART,stolenHeartOwnerKey} from './stolen-heart.mjs';
import {restoreBorginHeart} from './borgin-mirror.mjs';

const airborne=new WeakSet();

export function tickBorginHeartPond(g){
 const t=g.trainTest;
 let changed=false;
 for(const p of g.players){
  const key=stolenHeartOwnerKey(p);
  if(!p.disconnected&&t?.borginMirrorReturns?.[key]){
   delete t.borginMirrorReturns[key];
   restoreBorginHeart(g,p);
   changed=true;
  }
  if(t?.design.activeRoom!=='diagon'||p.disconnected||p.hp<=0||p.room||p.broomMount||p.wingHover||p.trainRide||p.pirateRide||p.vehicleId){
   airborne.delete(p);continue;
  }
  if(p.jumpHeight>0){airborne.add(p);continue;}
  const landed=airborne.delete(p);
  if(!landed||!p.landTime||!inGardenPond(p))continue;
  const returned=new Map();
  for(let i=p.inventory.length-1;i>=0;i--){
   const item=p.inventory[i],heart=item?.stolenHeart;
   if(item?.type!==STOLEN_HEART||!heart?.ownerKey)continue;
   returned.set(heart.ownerKey,heart.ownerName);
   clearSlot(p.inventory,i);
  }
  if(!returned.size)continue;
  for(const [owner,name] of returned){
   const hero=g.players.find(player=>!player.disconnected&&stolenHeartOwnerKey(player)===owner);
   if(t.borginMirrorClaims)delete t.borginMirrorClaims[owner];
   if(hero)restoreBorginHeart(g,hero);
   else (t.borginMirrorReturns??={})[owner]=true;
   g.message?.(owner===key?'The garden pond returned your Stolen Heart.':`The garden pond returned ${name}’s Stolen Heart.`);
  }
  emitGameplayFx(g,'rain-splash',p,{life:.55,scale:.8});
  g.onSound?.('magic',p);
  g.uiRevision=(g.uiRevision||0)+1;
  changed=true;
 }
 if(changed)g.persist?.();
}
