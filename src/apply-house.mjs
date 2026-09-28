import {generateWorld} from './world.mjs';
import {collisionOffset,actorRadius} from './navigation.mjs';
import {activeHouse} from './house-design.mjs';
const layoutKey=h=>JSON.stringify(h&&{...h,walls:h.walls.map(({broken,...w})=>w),doors:h.doors.map(d=>({...d,open:false}))});
export function applyChangedHouse(game){
 if(game.generatedEnvironment!=='house'||layoutKey(game.house)===layoutKey(activeHouse()))return false;
 return applyActiveHouse(game);
}

// Apply architecture without resetting progress, inventory, enemies or the board.
export function applyActiveHouse(game){
 if(game.generatedEnvironment!=='house')return false;
 const world=generateWorld(game.seed,'house');
 game.house=world.house;game.terrain=world.terrain;game.scenery=world.scenery;
 const relocate=(a,r=8,offset=0)=>{
  if(!game.blocked(a.x,a.y,r,false,false,false,offset))return;
  const ox=a.x,oy=a.y;
  for(let radius=16;radius<=1600;radius+=16){
   const steps=Math.max(8,Math.ceil(radius/8));
   for(let i=0;i<steps;i++){const angle=i*Math.PI*2/steps,x=ox+Math.cos(angle)*radius,y=oy+Math.sin(angle)*radius;
    if(x<24||y<24||x>1576||y>1576||game.blocked(x,y,r,false,false,false,offset))continue;
    a.x=x;a.y=y;return;
   }
  }
 };
 for(const a of [...game.players,...game.enemies,...(game.ghosts||[])])if(!a.room)relocate(a,actorRadius(a),collisionOffset(game,a));
 for(const a of [...(game.loot||[]),...(game.xpOrbs||[]),...(game.portals||[])])relocate(a,6);
 game.uiRevision=(game.uiRevision||0)+1;
 game.message('House updated: '+game.house.name);game.persist();return true;
}
