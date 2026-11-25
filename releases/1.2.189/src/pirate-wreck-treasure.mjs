import {give,ITEMS} from './items.mjs';
import {HOLLOW_ROOM} from './wild-mountain-layout.mjs';

export const WILLY_EYEPATCH='one_eyed_willy_eyepatch';
export const WRECK_TREASURE_TABLE={x:8,y:0,width:110,depth:49};
export const WILLY_CHAIR={x:87,y:0,width:22,depth:23};
const fittings=[WRECK_TREASURE_TABLE,WILLY_CHAIR];

export function wreckTreasureBlocked(x,y,radius){
 return fittings.some(f=>Math.abs(f.x-x)<f.width/2+radius&&Math.abs(f.y-y)<f.depth/2+radius);
}

export function wreckTreasurePrompt(g,p){
 const r=p.pirateRide;
 return g.trainTest?.design.activeRoom===HOLLOW_ROOM&&r?.shipId===HOLLOW_ROOM&&r.level==='hold'&&
  !p.ui&&p.hp>0&&Math.hypot(r.x-WILLY_CHAIR.x,r.y-WILLY_CHAIR.y)<=37?'INSPECT ONE-EYED WILLY':'';
}

export function inspectWreckTreasure(g,p){
 if(!wreckTreasurePrompt(g,p))return false;
 const state=(p.npcQuests??={}).willyTreasure??={};
 if(state.recovered){
  g.message?.('One-Eyed Willy keeps his silent watch over the treasure.');
  return true;
 }
 if(!ITEMS[WILLY_EYEPATCH]||!give(p.inventory,WILLY_EYEPATCH,1)){
  g.message?.('Free a backpack slot for One-Eyed Willy’s eyepatch.');
  return true;
 }
 state.recovered=true;
 g.message?.('Recovered One-Eyed Willy’s Eyepatch.');
 g.onSound?.('loot',p);
 g.uiRevision=(g.uiRevision||0)+1;
 g.persist?.();
 return true;
}
