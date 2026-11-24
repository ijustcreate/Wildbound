export function dropTempleLoot(g,p,type,qty=1,metadata={}){
 const item={...structuredClone(metadata),id:g.nextId++,room:p.room,x:p.roomX,y:p.roomY,type,qty,manualPickup:true};
 (g.templeLoot??=[]).push(item);g.onSound?.('drop',p);return item;
}
