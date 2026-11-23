import {defaultHouse} from './house-design.mjs';
import {templeLayout} from './temple.mjs';
import {drawHouseFloor,drawHouseWall,drawHouseDoor} from './house-architecture-art.mjs';
import {drawHouseInteriorWalls,drawTempleWallFinish} from './house-interior-art.mjs';
import {paintInteriorMaterial} from './interior-materials.mjs';
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
function paintTempleLandmark(c,f){
 const slab=['#4f5c51','#687b68','#788977','#869781','#a9b69b','#5a7259'];
 paintInteriorMaterial(c,f,'cement',slab);
 c.fillStyle='#a8aa7d';
 for(const x of [f.x+22,f.x+f.w-23])c.fillRect(x,f.y+17,1,Math.max(1,f.h-34));
}
function drawTempleLandmarkFloor(c,h){
 let saved=templeFloors.get(h);
 const f=h.floors[0];
 if(!f)return;
 if(typeof document==='undefined'){paintTempleLandmark(c,f);return;}
 if(!saved){
  const canvas=document.createElement('canvas');
  canvas.width=f.w;canvas.height=f.h;
  const pen=canvas.getContext('2d');pen.translate(-f.x,-f.y);paintTempleLandmark(pen,f);
  saved={canvas,x:f.x,y:f.y};templeFloors.set(h,saved);
 }
 c.drawImage(saved.canvas,saved.x,saved.y);
}
export function drawWildBuildingGround(c,d,bounds=null){
 const visible=(p,margin)=>!bounds||(p.x+margin>bounds.left&&p.x-margin<bounds.right&&p.y+margin>bounds.top&&p.y-margin<bounds.bottom);
 for(const h of wildLandmarkBuildings(d)){
  if(!h.floors.some(f=>visible({x:f.x+f.w/2,y:f.y+f.h/2},Math.max(f.w,f.h)/2+40)))continue;
  if(h.temple)drawTempleLandmarkFloor(c,h);
  else drawHouseFloor(c,h);
  // The live view owns the projected faces so damaged wall gaps match the
  // current world objects. Distant overview landmarks keep their compact base.
  if(bounds)drawHouseInteriorWalls(c,h,[],visible,{always:true});
 }
}
export function wildBuildingSubjects(d){return wildLandmarkBuildings(d).flatMap(h=>[...h.walls,...h.doors,...h.furniture].map(asset=>({wildBuildingAsset:asset,wildBuildingTemple:h.temple,depth:asset.y+asset.h,x:asset.x+asset.w/2,y:asset.y+asset.h})));}
export function drawWildBuildingSubject(c,g,o){const b=o.wildBuildingAsset;if(b.destroyed)return;drawBreakable(c,g,b,(pen,asset)=>{if(asset.kind==='window')drawWindow(pen,asset);else if(['door','gate','garage'].includes(asset.kind))drawHouseDoor(pen,asset);else if(asset.kind==='wall'&&o.wildBuildingTemple)drawTempleWallFinish(pen,asset);else if(['wall','fence'].includes(asset.kind))drawHouseWall(pen,asset);else drawFurniture(pen,asset,{});},['door','gate','garage'].includes(b.kind)?'door:'+!!b.open:b.kind==='wall_clock'?'clock:'+Math.floor(Date.now()/60000):'wild-landmark');}
