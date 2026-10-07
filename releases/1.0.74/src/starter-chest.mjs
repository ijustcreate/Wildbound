import {ITEMS,give} from './items.mjs';

// Include every starter equipment option, not rare gear or the NPC costumes.
export const STARTER_GEAR=Object.freeze(Object.keys(ITEMS).filter(id=>id.startsWith('starter_')&&ITEMS[id].slot));
export const STARTER_SUPPLIES=Object.freeze([...STARTER_GEAR.map(type=>Object.freeze({type,qty:1})),Object.freeze({type:'arrow',qty:8})]);

export function restockStarterChest(player){
  if(!Array.isArray(player.starterChest))player.starterChest=[];
  const chest=player.starterChest;
  for(const {type,qty} of STARTER_SUPPLIES){
    const available=chest.reduce((total,item)=>total+(item?.type===type?item.qty:0),0);
    // Top up, never erase deposited equipment, sockets, bags or extra stacks.
    // If all 24 slots are occupied, normal chest pagination holds the refill.
    if(available<qty)give(chest,type,qty-available,Infinity);
  }
  return chest;
}

export function starterChestFor(game,player){
  const prepared=game.starterStockPrepared||=Object.create(null),key=player.profileId||'player:'+player.id;
  if(!Array.isArray(player.starterChest)||game.phase==='lobby'&&!Object.hasOwn(prepared,key)){
    restockStarterChest(player);prepared[key]=true;
  }
  return player.starterChest;
}

export function restockStarterChests(game){
  const prepared=game.starterStockPrepared||=Object.create(null);
  for(const player of game.players){restockStarterChest(player);prepared[player.profileId||'player:'+player.id]=true;}
}

// Pixel-native wood, curved lid, metal hoops, rivets and lock. No text on the prop.
export function drawStarterChest(c,o,openness=0){
  c.save();c.translate(Math.round(o.x),Math.round(o.y));
  const r=(x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(x,y,w,h);};
  r(-55,-15,110,37,'#2d2724');r(-51,-12,102,30,'#78452c');
  r(-48,-10,86,25,'#986039');r(39,-10,10,27,'#593c2b');
  for(let y=-8;y<15;y+=8){r(-46,y,82,2,'#bc8248');r(-46,y+5,82,2,'#633c29');}
  r(-37,-8,12,2,'#8b512f');r(2,0,17,2,'#8b512f');r(-14,9,11,2,'#d39751');
  for(const x of [-42,28]){
    r(x,-14,10,34,'#453b31');r(x+2,-14,6,31,'#a88c52');r(x+2,-12,2,28,'#e4c980');
    for(const y of [-8,9]){r(x+3,y,3,3,'#51412c');r(x+3,y,2,1,'#f2dca0');}
  }
  r(-51,15,102,3,'#b98b4a');r(-48,18,14,4,'#38312b');r(34,18,14,4,'#38312b');
  r(-50,-17,99,5,'#241e20');
  const lift=Math.round(Math.max(0,Math.min(1,openness))*18),y=-36-lift;
  if(lift){
    r(-46,-25,92,12,'#241e20');r(-44,-22,88,7,'#46342a');r(-46,-17,92,3,'#d7b46b');
    for(const x of [-42,30]){r(x,-17-lift,5,lift+4,'#78613d');r(x+1,-17-lift,2,lift+3,'#bf9c58');}
  }
  r(-56,y+9,112,17,'#302724');r(-53,y+5,106,20,'#68412c');r(-48,y+1,96,21,'#976039');
  r(-40,y-2,80,22,'#a6703d');r(-38,y,76,3,'#d7a55c');r(-48,y+9,96,2,'#c18b4e');
  r(-52,y+19,104,4,'#583526');r(-52,y+23,104,2,'#d5ac62');
  for(const x of [-42,28]){r(x,y+1,10,24,'#695335');r(x+2,y+1,6,23,'#c5a15d');r(x+2,y+2,2,20,'#efcf84');r(x+3,y+15,3,3,'#51412c');}
  r(-7,y+18,14,13,'#483428');r(-5,y+19,10,11,'#d9b96b');r(-3,y+21,6,7,'#f0d795');r(-1,y+22,2,4,'#4c3a28');
  c.restore();
}
