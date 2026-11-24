import {generateWorld} from './world.mjs';
import {collisionOffset,actorRadius} from './navigation.mjs';
import {activeHouse} from './house-design.mjs';
import {overlookNorth} from './overlook-maze-layout.mjs';
const authoredRect=({surpriseType,applianceOn,waterLevel,broken,sectionDamage,destructionRevision,destructionGroup,destroyed,opened,loot,chestId,debris,breakDamage,breakLootDropped,speed,heading,seats,occupiedBy,occupants,hoodOpen,enginePartInstalled,engineOn,engineStart,engineSoundTimer,engineWarning,keyWarning,sink,damage,effects,...r})=>r;
const layoutKey=h=>{if(!h)return JSON.stringify(h);const {destructionRevision,overlookMaze,...design}=h;return JSON.stringify({...design,walls:h.walls.map(authoredRect),doors:h.doors.map(d=>({...authoredRect(d),open:false})),furniture:(h.furniture||[]).map(authoredRect),vehicles:(h.vehicles||[]).map(authoredRect)});};
export function applyChangedHouse(game){
 if(game.generatedEnvironment!=='house'||layoutKey(game.house)===layoutKey(activeHouse()))return false;
 return applyActiveHouse(game);
}

// Apply architecture without resetting progress, inventory, enemies or the board.
export function applyActiveHouse(game){
 if(game.generatedEnvironment!=='house')return false;
 const overlookMaze=game.house?.overlookMaze;
 const world=generateWorld(game.seed,'house');
 game.house=world.house;game.terrain=world.terrain;game.scenery=world.scenery;
 if(overlookMaze)game.house.overlookMaze=overlookMaze;
 const north=overlookNorth(game);
 const relocate=(a,r=8,offset=0)=>{
  if(a.y>=north+24&&!game.blocked(a.x,a.y,r,false,false,false,offset))return;
  const ox=a.x,oy=Math.max(a.y,north+24);
  for(let radius=16;radius<=1600;radius+=16){
   const steps=Math.max(8,Math.ceil(radius/8));
   for(let i=0;i<steps;i++){const angle=i*Math.PI*2/steps,x=ox+Math.cos(angle)*radius,y=oy+Math.sin(angle)*radius;
    if(x<24||y<north+24||x>1576||y>1576||game.blocked(x,y,r,false,false,false,offset))continue;
    a.x=x;a.y=y;return;
   }
  }
 };
 for(const a of [...game.players,...game.enemies,...(game.ghosts||[])])if(!a.room)relocate(a,actorRadius(a),collisionOffset(game,a));
 for(const a of [...(game.loot||[]),...(game.xpOrbs||[]),...(game.portals||[])])relocate(a,6);
 game.uiRevision=(game.uiRevision||0)+1;
 game.message('House updated: '+game.house.name);game.persist();return true;
}
