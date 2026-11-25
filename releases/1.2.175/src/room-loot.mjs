import {ITEMS} from './items.mjs';
import {givePickup} from './inventory-containers.mjs';
import {actionInputLabel} from './action-prompts.mjs';
import {drawItem} from './item-art.mjs';
import {stolenHeartName} from './stolen-heart.mjs';

export function nearbyRoomLoot(items,p,reach=26,eligible=()=>true) {
  let nearest;
  let distance=reach;
  for(const item of items){
    const next=Math.hypot(item.x-p.roomX,item.y-p.roomY);
    if(next<distance&&eligible(item)){nearest=item;distance=next;}
  }
  return nearest;
}

export function collectRoomLoot(game,p,items,item) {
  const index=items.indexOf(item);
  if(index<0||p.hp<=0)return false;
  if(!givePickup(p,item)){game.inventoryFullNotice?.(p,item.id??item.type);return true;}
  items.splice(index,1);
  p.pickupTime=.42;
  p.pickupItem=item.type;
  game.onSound?.('loot',p);
  game.persist?.();
  return true;
}

export function roomLootPrompt(game,p,item) {
  if(!item||p.ui||p.hp<=0)return '';
  if(game.time<(p.inventoryFullNoticeUntil||0)&&p.inventoryFullNoticeKey===(item.id??item.type))return 'Bag full · make space to collect';
  return `${actionInputLabel(game,p,'interact')} · Collect ${stolenHeartName(item)||ITEMS[item.type]?.name||item.type}`;
}

export function drawRoomLootItem(c,item,size=12) {
  c.save();
  c.fillStyle='#0a211c80';
  c.beginPath();
  c.ellipse(item.x,item.y+2,size*.55,size*.2,0,0,Math.PI*2);
  c.fill();
  drawItem(c,item.type,item.x,item.y-3,size);
  c.restore();
}
