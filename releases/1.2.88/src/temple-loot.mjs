import {give,ITEMS} from './items.mjs';
import {drawItem} from './item-art.mjs';
export {dropTempleLoot} from './temple-loot-data.mjs';
export function nearbyTempleLoot(g,p){return (g.templeLoot||[]).filter(l=>l.room===p.room&&Math.hypot(l.x-p.roomX,l.y-p.roomY)<26).sort((a,b)=>Math.hypot(a.x-p.roomX,a.y-p.roomY)-Math.hypot(b.x-p.roomX,b.y-p.roomY))[0];}
export function collectTempleLoot(g,p){
 const item=nearbyTempleLoot(g,p);if(!item)return false;
 if(!give(p.inventory,item.type,item.qty,24,item)){g.inventoryFullNotice?.(p,item.id);return true;}
 g.templeLoot=g.templeLoot.filter(l=>l!==item);p.pickupTime=.42;p.pickupItem=item.type;g.onSound?.('loot',p);g.persist?.();return true;
}
export function drawTempleLoot(c,g,p){
 for(const item of g.templeLoot||[]){if(item.room!==p.room)continue;c.save();c.fillStyle='#0a211c80';c.beginPath();c.ellipse(item.x,item.y+2,7,2.5,0,0,Math.PI*2);c.fill();drawItem(c,item.type,item.x,item.y-3,12);c.restore();}
 const near=nearbyTempleLoot(g,p);if(near&&!p.ui){c.save();c.font='7px sans-serif';c.textAlign='center';c.fillStyle='#fff0bd';c.fillText('Interact · '+(ITEMS[near.type]?.name||near.type),160,226);c.restore();}
}
