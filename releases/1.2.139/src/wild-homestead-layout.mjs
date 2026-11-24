import {activeHouse} from './house-design.mjs';
import {houseFloorZones} from './house-surfaces.mjs';
import {WILD_HOMESTEAD} from './overlook-maze-layout.mjs';

const size=800;
export const HOMESTEAD_HEARTH=Object.freeze({
 id:'homestead',room:null,x:WILD_HOMESTEAD.x-100,y:WILD_HOMESTEAD.y-84,
});

const houses=new WeakMap();
const layouts=new WeakMap();
const collections=['walls','doors','furniture','vehicles','trees'];
const applianceState=['opened','open','lightMode','applianceOn','waterLevel','surfaceItems','falling','fallen','depleted','harvest','logCount','chunks','chipped'];
const vehicleState=['x','y','heading','damage','hoodOpen','enginePartInstalled','submerging','sink','occupiable','seats','occupiedBy'];
const contains=(r,x,y,pad=0)=>x>=r.x-pad&&x<r.x+r.w+pad&&y>=r.y-pad&&y<r.y+r.h+pad;

export function wildHomesteadSource(design){
 if(!design?.wildLands||design._stationContext)return null;
 let source=layouts.get(design);
 if(!source){source=design.wildHomesteadSource||activeHouse();layouts.set(design,source);}
 return source;
}

function chooseHearth(house){
 const structure=[...house.walls,...house.doors];
 const fixtures=house.furniture.filter(f=>!['rug','plant'].includes(f.kind));
 const blockedBy=(x,y,b,back)=>b.x<x+27&&b.x+b.w>x-27&&b.y<y+26&&b.y+b.h>y-back;
 const available=(x,y)=>house.floors.some(f=>x>=f.x+26&&x<f.x+f.w-26&&y>=f.y+47&&y<f.y+f.h-27)
  &&!structure.some(b=>blockedBy(x,y,b,24))&&!fixtures.some(b=>blockedBy(x,y,b,40));
 const {x,y}=HOMESTEAD_HEARTH;
 if(available(x,y))return HOMESTEAD_HEARTH;
 const candidates=house.floors.flatMap(f=>{
  const points=[];
  for(let py=f.y+50;py<f.y+f.h-28;py+=22)for(let px=f.x+27;px<f.x+f.w-26;px+=22)
   if(available(px,py))points.push({x:px,y:py});
  return points;
 });
 candidates.sort((a,b)=>Math.hypot(a.x-x,a.y-y)-Math.hypot(b.x-x,b.y-y));
 // Every valid layout reserves an unobstructed central player gallery.
 return {...HOMESTEAD_HEARTH,...(candidates[0]||WILD_HOMESTEAD)};
}

export function wildHomestead(design){
 const source=wildHomesteadSource(design);if(!source)return null;
 let house=houses.get(design);
 if(!house){
  const dx=WILD_HOMESTEAD.x-size,dy=WILD_HOMESTEAD.y-size;
  const move=(b,kind=b.kind)=>({...structuredClone(b),kind,x:b.x+dx,y:b.y+dy,
   id:'homestead:'+(b.id||kind||'asset')+':'+b.x+':'+b.y});
  house={...source,id:'homestead',destructionRevision:0,
   floors:source.floors.map(b=>move(b)),floorZones:houseFloorZones(source).map(b=>move(b)),
   walls:source.walls.map(b=>move(b,b.kind||'wall')),doors:source.doors.map(b=>move(b,b.kind||'door')),
   furniture:source.furniture.map(b=>move(b)),paths:source.paths.map(b=>move(b)),pools:source.pools.map(b=>move(b)),
   trees:source.trees.map(b=>({...move(b,'tree'),procedural:true})),vehicles:(source.vehicles||[]).map(b=>move(b)),
   rooms:source.rooms.map(b=>move(b)),
  };
  // The original bay is only clear on the door axis. Keep the save identity
  // derived from the authored position while placing this legacy parked car.
  const car=house.vehicles.find(v=>v.id==='homestead:villa-car:400:1168');
  const garage=house.doors.find(d=>d.kind==='garage'&&d.x===384+dx&&d.y===1344+dy);
  if(source.name==='The Garden Villa'&&car&&garage){
   car.x=garage.x+garage.w/2;
   car.y+=40;
  }
  house.hearth=chooseHearth(house);houses.set(design,house);
 }
 return house;
}

export function wildHomesteadAt(design,x,y,padding=0){
 if(!design?.wildLands||design.activeRoom||Math.abs(x-WILD_HOMESTEAD.x)>size+padding||Math.abs(y-WILD_HOMESTEAD.y)>size+padding)return false;
 const home=wildHomestead(design);
 return !!home&&[home.floors,home.paths,home.pools].some(shapes=>shapes.some(r=>contains(r,x,y,padding)));
}

export function wildHomesteadPoolAt(design,x,y){
 if(!design?.wildLands||design.activeRoom||Math.abs(x-WILD_HOMESTEAD.x)>size||Math.abs(y-WILD_HOMESTEAD.y)>size)return false;
 return wildHomestead(design)?.pools.some(r=>contains(r,x,y))||false;
}

export function wildHomesteadYardAt(design,x,y,padding=0){
 const localX=x-WILD_HOMESTEAD.x+size,localY=y-WILD_HOMESTEAD.y+size;
 return design?.wildLands&&!design.activeRoom&&localX>288-padding&&localX<1312+padding&&localY>112-padding&&localY<1520+padding;
}

export function wildHomesteadHearth(design){return wildHomestead(design)?.hearth||HOMESTEAD_HEARTH;}

export function snapshotWildHomestead(design){
 const home=wildHomestead(design);if(!home)return undefined;
 const records={};
 for(const collection of collections){
  const keys=collection==='vehicles'?vehicleState:applianceState;
  for(const asset of home[collection]){
   const state=Object.fromEntries(keys.filter(key=>Object.hasOwn(asset,key)).map(key=>[key,asset[key]]));
   if(Object.keys(state).length)records[asset.id]=state;
  }
 }
 return records;
}

export function restoreWildHomestead(design,records){
 if(!records||typeof records!=='object')return;
 const home=wildHomestead(design);if(!home)return;
 for(const collection of collections){
  const keys=collection==='vehicles'?vehicleState:applianceState;
  for(const asset of home[collection]){
   const state=records[asset.id];if(!state||typeof state!=='object')continue;
   for(const key of keys)if(Object.hasOwn(state,key))asset[key]=structuredClone(state[key]);
  }
 }
}
