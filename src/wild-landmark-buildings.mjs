import {drawBiomeTile} from './biome-art.mjs';
import {defaultHouse} from './house-design.mjs';
import {templeLayout} from './temple.mjs';
import {drawHouseFloor,drawHouseWall,drawHouseDoor} from './house-architecture-art.mjs';
import {drawFurniture,drawWindow} from './house-render.mjs';
import {drawBreakable} from './structure-destruction.mjs';
const cache=new WeakMap();
export function wildLandmarkBuildings(d){
 if(!d.wildLands||d.activeRoom)return [];let result=cache.get(d);if(result)return result;
 result=[{id:'homestead',x:8200,y:7050,source:defaultHouse()},{id:'jungle-temple',x:3300,y:2900,source:templeLayout({authored:false})}].map(site=>{
  const h=site.source,dx=site.x-800,dy=site.y-800,move=b=>({...structuredClone(b),x:b.x+dx,y:b.y+dy,id:site.id+':'+(b.id||b.kind||'asset')+':'+b.x+':'+b.y});
  return {...h,id:site.id,floors:h.floors.map(move),floorZones:(h.floorZones||[]).map(move),walls:h.walls.map(b=>move({kind:'wall',...b})),doors:h.doors.map(b=>move({kind:'door',...b})),furniture:h.furniture.map(move),paths:(h.paths||[]).map(move),pools:[],vehicles:[],trees:[],destructionRevision:0};
 });cache.set(d,result);return result;
}
export function inWildLandmark(d,x,y,padding=0){return wildLandmarkBuildings(d).some(h=>h.floors.some(f=>x>f.x-padding&&x<f.x+f.w+padding&&y>f.y-padding&&y<f.y+f.h+padding));}
const templeFloors=new WeakMap();
export function drawWildBuildingGround(c,d){for(const h of wildLandmarkBuildings(d)){if(!h.temple){drawHouseFloor(c,h);continue;}let cached=templeFloors.get(h);if(!cached){const f=h.floors[0],canvas=document.createElement('canvas');canvas.width=f.w;canvas.height=f.h;const pen=canvas.getContext('2d');pen.translate(-f.x,-f.y);for(let y=f.y;y<f.y+f.h;y+=32)for(let x=f.x;x<f.x+f.w;x+=32)drawBiomeTile(pen,{environment:'temple',generatedEnvironment:'temple',seed:42},'temple_stone',x,y);cached={canvas,x:f.x,y:f.y};templeFloors.set(h,cached);}c.drawImage(cached.canvas,cached.x,cached.y);}}
export function wildBuildingSubjects(d){return wildLandmarkBuildings(d).flatMap(h=>[...h.walls,...h.doors,...h.furniture].map(asset=>({wildBuildingAsset:asset,depth:asset.y+asset.h,x:asset.x+asset.w/2,y:asset.y+asset.h})));}
export function drawWildBuildingSubject(c,g,o){const b=o.wildBuildingAsset;if(b.destroyed)return;drawBreakable(c,g,b,(pen,asset)=>{if(asset.kind==='window')drawWindow(pen,asset);else if(['door','gate','garage'].includes(asset.kind))drawHouseDoor(pen,asset);else if(['wall','fence'].includes(asset.kind))drawHouseWall(pen,asset);else drawFurniture(pen,asset,{});},['door','gate','garage'].includes(b.kind)?'door:'+!!b.open:b.kind==='wall_clock'?'clock:'+Math.floor(Date.now()/60000):'wild-landmark');}
