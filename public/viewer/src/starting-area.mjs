import {creatures} from './definitions.mjs';
import {waterAt} from './environment.mjs';
export const START_AREAS=['any','deep_water','shallow_water','land','ice','snow','sand','temple_stone','wood'];
export const START_AREA_LABELS={any:'Any area',deep_water:'Deep water',shallow_water:'Shallow water',land:'Dry ground',ice:'Ice',snow:'Snow',sand:'Sand',temple_stone:'Temple stone',wood:'Wood floor'};
export function unitStartingArea(kind){const def=creatures[kind];return def?.behaviors?.requiredStartArea?(def.startArea||'deep_water'):'any';}
export function eventUnitKinds(event){return [...new Set(event.enemies?.length?event.enemies.filter(e=>e.count>0).map(e=>e.kind):event.squad?.length?event.squad:[event.kind])].filter(Boolean);}
export function startingAreaSpots(g,area){
  if(area==='any')return [];if(!START_AREAS.includes(area))return [];
  const spots=[];for(let y=1;y<49;y++)for(let x=1;x<49;x++){
    const px=x*32+16,py=y*32+16,kind=waterAt(g,px,py);
    const match=area==='deep_water'?kind==='water':area==='shallow_water'?kind==='shallow':area==='land'?!['water','shallow','floodbridge','quicksand','mud'].includes(kind):kind===area;
    if(match&&(!g.blocked||!g.blocked(px,py,8,false,true,false,0)))spots.push({x:px,y:py});
  }return spots;
}
export function eventStartingAreas(event){return [...new Set([event.requiredStartArea||'any',...eventUnitKinds(event).map(unitStartingArea)])].filter(a=>a!=='any');}
export function eventHasStartingAreas(g,event){return eventStartingAreas(event).every(area=>startingAreaSpots(g,area).length>0);}
export function requiredSpawnSpot(g,kind,preferred){
  const area=unitStartingArea(kind);if(area==='any')return preferred;
  const spots=startingAreaSpots(g,area);let best=null,score=Infinity;
  for(const p of spots){const crowded=(g.enemies||[]).some(e=>Math.hypot(e.x-p.x,e.y-p.y)<30);const d=Math.hypot(p.x-preferred.x,p.y-preferred.y)+(crowded?500:0);if(d<score){best=p;score=d;}}
  return best;
}
