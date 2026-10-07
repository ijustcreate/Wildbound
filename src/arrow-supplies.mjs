import {ARROW_TYPES} from './quiver.mjs';
export {ARROW_TYPES,quiverType,loadQuiver,consumeQuiver} from './quiver.mjs';
import {footprintHit} from './world.mjs';
import {navigateEnemy} from './navigation.mjs';

export function arrowDrop(g,a,qty=1,source='Recovered arrows'){
 const type='arrow';
 const nearby=g.loot.find(l=>l.type===type&&!!l.surfaceEmbedded===!!a.surfaceEmbedded&&Math.abs((l.z||0)-(a.z||0))<8&&Math.hypot(l.x-a.x,l.y-a.y)<24);
 if(nearby){nearby.qty+=qty;if(Number.isFinite(a.impactTime))nearby.impactTime=a.impactTime;return nearby;}
 const item={id:g.nextId++,x:a.x,y:a.y,z:a.z||0,type,qty,source,manualPickup:true,embedded:true,
  angle:a.angle??0,shaftLength:a.shaftLength||24,embedDepth:a.embedDepth||5,...(Number.isFinite(a.impactTime)?{impactTime:a.impactTime}:{}),...(a.surfaceEmbedded?{surfaceEmbedded:true}:{})};
 g.loot.push(item);return item;
}
export function arrowScenery(g,x,y){
 return g.scenery.find(s=>!s.depleted&&!s.falling&&footprintHit(s,g.spriteLibrary?.[s.kind],x,y+(g.house?0:14),2));
}
export function compactArrowDrops(g){
 const bins=new Map(),removed=new Set();
 for(const l of g.loot){
  if(!ARROW_TYPES.includes(l.type))continue;
  const x=Math.floor(l.x/24),y=Math.floor(l.y/24);let found;
  for(let dx=-1;dx<=1&&!found;dx++)for(let dy=-1;dy<=1&&!found;dy++){
   found=(bins.get(`${x+dx},${y+dy}`)||[]).find(a=>a.type===l.type&&!!a.surfaceEmbedded===!!l.surfaceEmbedded&&Math.abs((a.z||0)-(l.z||0))<8&&Math.hypot(a.x-l.x,a.y-l.y)<24);
  }
  if(found){found.qty+=l.qty;removed.add(l);}
  else {const key=`${x},${y}`;if(!bins.has(key))bins.set(key,[]);bins.get(key).push(l);}
 }
 if(removed.size)g.loot=g.loot.filter(l=>!removed.has(l));
}
export function enemyQuiver(e){
 e.startingArrows??=36;e.arrowsLeft??=e.startingArrows;return e.arrowsLeft;
}
export function retrieveEnemyArrows(g,e,dt){
 enemyQuiver(e);
 if(e.arrowsLeft>=e.startingArrows/2&&!e.retrievingArrows)return false;
 if(e.arrowsLeft>=e.startingArrows){e.retrievingArrows=false;return false;}
 const loot=g.loot.filter(l=>ARROW_TYPES.includes(l.type)&&Math.hypot(l.x-e.x,l.y-e.y)<550)
  .sort((a,b)=>Math.hypot(a.x-e.x,a.y-e.y)-Math.hypot(b.x-e.x,b.y-e.y))[0];
 if(!loot){e.retrievingArrows=false;return false;}
 e.retrievingArrows=true;
 const d=Math.hypot(loot.x-e.x,loot.y-e.y);
 if(d<30){const qty=Math.min(loot.qty,e.startingArrows-e.arrowsLeft);e.arrowsLeft+=qty;loot.qty-=qty;if(!loot.qty)g.loot=g.loot.filter(l=>l!==loot);}
 else navigateEnemy(g,e,loot,dt);
 return true;
}
// Compatibility for old arrow-impact call sites/snapshots; arrows have no element.
export function frostImpact(){}
export function tickArrowIce(g){if(g.arrowIcePatches?.length)g.arrowIcePatches=[];}
