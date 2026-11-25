import {collectRoomLoot,drawRoomLootItem,nearbyRoomLoot,roomLootPrompt} from './room-loot.mjs';
export {dropTempleLoot} from './temple-loot-data.mjs';
export function nearbyTempleLoot(g,p){return nearbyRoomLoot(g.templeLoot||[],p,26,item=>item.room===p.room);}
export function collectTempleLoot(g,p){
 const item=nearbyTempleLoot(g,p);
 return item?collectRoomLoot(g,p,g.templeLoot,item):false;
}
export function drawTempleLoot(c,g,p){
 for(const item of g.templeLoot||[])if(item.room===p.room)drawRoomLootItem(c,item);
 const prompt=roomLootPrompt(g,p,nearbyTempleLoot(g,p));
 if(prompt){c.save();c.font='7px sans-serif';c.textAlign='center';c.fillStyle='#fff0bd';c.fillText(prompt,160,226);c.restore();}
}
