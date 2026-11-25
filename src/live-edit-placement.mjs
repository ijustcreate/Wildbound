import {wildLandmarkBuildings} from './wild-landmark-buildings.mjs';
import {updateNativePropPlacement} from './wild-native-biomes.mjs';

const nativePrefix='native:';
const templateGroups=['floors','floorZones','walls','doors','furniture','paths','pools','trees','vehicles','rooms'];
const fixedScenery=/mausoleum|shrine|ruin|portal|bridge|gravestone|ladder|hatch|campfire|rail/;
const isTree=prop=>/(^|_)(tree|palm)(_|$)/.test(prop.kind||'');
const labelFor=value=>String(value||'Object').replaceAll('_',' ').replace(/^[a-z]/,letter=>letter.toUpperCase());
const knownBounds=shape=>!!shape&&Number.isFinite(shape.x+shape.y+shape.w+shape.h)&&shape.w>0&&shape.h>0;

function propBounds(prop){
 const size=prop.size||48,root=prop.rootY??prop.y;
 const w=prop.width||size*.65;
 const h=prop.height||size*.8;
 return {x:prop.x-w/2,y:Math.min(prop.y-size*.5,root-h),w,h:Math.max(h,root-prop.y+size*.5)+8};
}

function houseBounds(house){
 const floors=house.floors.filter(knownBounds);
 const x=Math.min(...floors.map(floor=>floor.x)),y=Math.min(...floors.map(floor=>floor.y));
 return {x,y,w:Math.max(...floors.map(floor=>floor.x+floor.w))-x,h:Math.max(...floors.map(floor=>floor.y+floor.h))-y};
}

function entry(id,category,label,object,bounds,move,relativeTo=null){
 return {descriptor:{id,category,label,x:object.x,y:object.y,bounds},move,relativeTo};
}

function moveAsset(asset,to){
 const dx=to.x-asset.x,dy=to.y-asset.y;
 asset.x=to.x;asset.y=to.y;
 if(Number.isFinite(asset.rootY))asset.rootY+=dy;
 if(asset.graveyardFootprint){asset.graveyardFootprint.x+=dx;asset.graveyardFootprint.y+=dy;}
 if(asset.debris)for(const bit of asset.debris){if(Number.isFinite(bit.x+bit.y)&&!bit.local){bit.x+=dx;bit.y+=dy;}}
}

function moveBuilding(house,from,to){
 const dx=to.x-from.x,dy=to.y-from.y;
 const pieces=new Set(templateGroups.flatMap(group=>house[group]||[]));
 for(const item of pieces)moveAsset(item,{x:item.x+dx,y:item.y+dy});
 house.destructionRevision=(house.destructionRevision||0)+1;
}

function placementEntries(g,{category,point,id}={}){
 const results=[];
 const add=(candidate)=>{
  if((!category||category===candidate.descriptor.category)&&(!id||id===candidate.descriptor.id))results.push(candidate);
 };
 const t=g.trainTest,d=t?.design;
 if(!d?.wildLands)return results;
 const houses=!id||/^(building|furniture|house-tree):/.test(id)?wildLandmarkBuildings(d):[];
 for(const house of houses){
  const buildingId=house.temple&&house.floors?.length?`building:${house.id}`:null;
  if(category==='buildings'||!category){
   // The Homestead, station and shop footprints have separate gameplay anchors.
   // The Jungle Temple uses the same layout objects for paint and collision.
   if(buildingId){
    const bounds=houseBounds(house);
    add(entry(buildingId,'buildings',house.name||'Jungle Temple',bounds,bounds,to=>moveBuilding(house,bounds,to)));
   }
  }
  if(category==='props'||!category)for(const [i,item] of (house.furniture||[]).entries()){
   if(item.destroyed||!knownBounds(item))continue;
   const key=`furniture:${house.id}:${item.id??i}`;
   add(entry(key,'props',labelFor(item.kind),item,{x:item.x,y:item.y-Math.min(30,item.h*.6),w:item.w,h:item.h+Math.min(30,item.h*.6)},
    to=>moveAsset(item,to),buildingId));
  }
  if(category==='trees'||!category)for(const [i,item] of (house.trees||[]).entries()){
   if(item.depleted||item.falling)continue;
   add(entry(`house-tree:${house.id}:${item.id??i}`,'trees',labelFor(item.kind||'Tree'),item,propBounds(item),to=>moveAsset(item,to),buildingId));
  }
 }
 if((category==='props'||category==='trees'||!category)&&(!id||id.startsWith(nativePrefix))){
  const props=new Set();
  if(point){
   for(let y=Math.floor((point.y-160)/256);y<=Math.floor((point.y+200)/256);y++){
    for(let x=Math.floor((point.x-160)/256);x<=Math.floor((point.x+160)/256);x++){
     for(const prop of t.nativeCollision?.get(`${x}:${y}`)||[])props.add(prop);
    }
   }
   for(const prop of t.visibleForest||[])props.add(prop);
  }else if(id){
   const key=id.split(':').slice(2,7).join(':');
   for(const prop of t.wildNativeWorlds?.get(key)?.accepted||[])props.add(prop);
  }
  for(const item of props){
   if(!item.id?.startsWith(`wild-native:${d.activeRoom||'surface'}:`)||item.depleted||item.falling||fixedScenery.test(item.kind))continue;
   const group=isTree(item)?'trees':'props';
   add(entry(nativePrefix+item.id,group,labelFor(item.kind),item,propBounds(item),to=>updateNativePropPlacement(t,item,to)));
  }
 }
 return results;
}

export function placementTargets(game,point,category){
 if(!Number.isFinite(point?.x+point?.y))return [];
 const distance=({bounds:b})=>Math.hypot(point.x-Math.max(b.x,Math.min(point.x,b.x+b.w)),point.y-Math.max(b.y,Math.min(point.y,b.y+b.h)));
 return placementEntries(game,{point,category}).map(item=>item.descriptor).filter(item=>distance(item)<=12)
  .sort((a,b)=>distance(a)-distance(b)||((b.bounds.y+b.bounds.h)-(a.bounds.y+a.bounds.h)));
}

export function getPlacement(game,id){
 return placementEntries(game,{id})[0]?.descriptor??null;
}

function validDestination(game,id,point,bounds){
 const d=game.trainTest?.design;
 if(!d?.wildLands||!Number.isFinite(point?.x+point?.y))return false;
 if(point.x<0||point.y<0||point.x+(bounds?.w||0)>d.width||point.y+(bounds?.h||0)>d.height)return false;
 if(id.startsWith(nativePrefix)){
  const [, , , , ,cx,cy]=id.split(':');
  if(Math.floor(point.x/1600)!==Number(cx)||Math.floor(point.y/1600)!==Number(cy))return false;
 }
 return true;
}

export function applyPlacement(game,id,point){
 const target=placementEntries(game,{id})[0];
 if(!target||!validDestination(game,id,point,id.startsWith('building:')?target.descriptor.bounds:null))return false;
 if(target.descriptor.x===point.x&&target.descriptor.y===point.y)return true;
 target.move({x:point.x,y:point.y});
 game.boundlessSceneryRevision=(game.boundlessSceneryRevision||0)+1;
 if(game.house)game.house.destructionRevision=(game.house.destructionRevision||0)+1;
 return true;
}

export function placementOverride(game,id,point){
 const relativeTo=placementEntries(game,{id})[0]?.relativeTo;
 const parent=relativeTo?getPlacement(game,relativeTo):null;
 return parent?{x:point.x-parent.x,y:point.y-parent.y,relativeTo}:{x:point.x,y:point.y};
}

export function restorePlacementOverrides(game,edits){
 const t=game.trainTest;
 const ordered=Object.entries(edits||{}).sort(([a],[b])=>Number(b.startsWith('building:'))-Number(a.startsWith('building:')));
 for(const [id,edit] of ordered){
  const parent=edit.relativeTo?getPlacement(game,edit.relativeTo):null;
  if(edit.relativeTo&&!parent)continue;
  const point=parent?{x:parent.x+edit.x,y:parent.y+edit.y}:edit;
  if(applyPlacement(game,id,point))continue;
  if(t&&id.startsWith(nativePrefix)&&validDestination(game,id,point)){
   (t.liveEditNativePlacements??={})[id.slice(nativePrefix.length)]={x:point.x,y:point.y};
  }
 }
}
