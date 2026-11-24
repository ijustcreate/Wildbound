import {templeLayout} from './temple.mjs';
import {drawHouseFloor,drawHouseWall,drawHouseDoor} from './house-architecture-art.mjs';
import {drawHouseInteriorWalls,drawTempleWallFinish} from './house-interior-art.mjs';
import {paintInteriorMaterial} from './interior-materials.mjs';
import {drawFurniture,drawWindow,drawHouseCar,drawVehicleEffects} from './house-render.mjs';
import {drawHouseAppliances} from './house-living.mjs';
import {drawHouseLights,houseLightSources} from './house-lights.mjs';
import {drawHouseRoof,drawHouseRoofLights} from './house-roof.mjs';
import {drawPavingTile} from './house-paving.mjs';
import {visibleSurfaceItems} from './house-surfaces.mjs';
import {drawHousePool} from './expansion.mjs';
import {drawBreakable,drawStructureDebris,WALL_SECTION_SIZE} from './structure-destruction.mjs';
import {WILD_HOMESTEAD,WILDS_OVERLOOK,inOverlookGround} from './overlook-maze-layout.mjs';
import {flooFireGreen} from './floo-travel.mjs';
import {drawFlooHearth} from './floo-art.mjs';
import {wildHomestead,wildHomesteadAt} from './wild-homestead-layout.mjs';
import {inHogsmeade} from './hogsmeade-layout.mjs';
const cache=new WeakMap();
export function wildLandmarkBuildings(d){
 if(!d.wildLands||d.activeRoom)return [];let result=cache.get(d);if(result)return result;
 const temple=templeLayout({authored:false}),id='jungle-temple';
 const move=b=>({...b,x:b.x+2500,y:b.y+2100,id:id+':'+(b.id||b.kind||'asset')+':'+b.x+':'+b.y});
 const h={...temple,id,floors:temple.floors.map(move),floorZones:(temple.floorZones||[]).map(move),
  walls:temple.walls.map(b=>move({kind:'wall',...b})),doors:temple.doors.map(b=>move({kind:'door',...b})),
  furniture:temple.furniture.map(move),paths:(temple.paths||[]).map(move),pools:[],vehicles:[],trees:[],destructionRevision:0};
 result=[wildHomestead(d),h].filter(Boolean);cache.set(d,result);return result;
}
export function inWildLandmark(d,x,y,padding=0){return d.wildLands&&!d.activeRoom&&
 (inOverlookGround(WILDS_OVERLOOK,x,y,padding)||wildHomesteadAt(d,x,y,padding)||inHogsmeade(x,y,padding)||
  wildLandmarkBuildings(d).some(h=>h.temple&&h.floors.some(f=>x>f.x-padding&&x<f.x+f.w+padding&&y>f.y-padding&&y<f.y+f.h+padding)));
}
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
const paving=new WeakMap();
function drawHomesteadPaths(c,house){
 let yard=paving.get(house);
 if(!yard){
  const dx=WILD_HOMESTEAD.x-800,dy=WILD_HOMESTEAD.y-800,terrain=Array(2500).fill('grass'),tiles=[];
  for(let j=0;j<50;j++)for(let i=0;i<50;i++){
   const x=i*32,y=j*32,px=dx+x+16,py=dy+y+16;
   if(house.paths.some(r=>px>=r.x&&px<r.x+r.w&&py>=r.y&&py<r.y+r.h)){
    terrain[j*50+i]='path';tiles.push({x,y});
   }
  }
  yard={terrain,tiles,dx,dy};paving.set(house,yard);
 }
 c.save();c.translate(yard.dx,yard.dy);
 for(const {x,y} of yard.tiles)drawPavingTile(c,yard,x,y);
 c.restore();
}

function drawWallGroundShadow(c,wall){
 if(wall.destroyed||wall.kind==='window')return;
 c.fillStyle='#19232466';
 if(!wall.sectionDamage){c.fillRect(wall.x+3,wall.y+5,wall.w,wall.h+3);return;}
 const cell=WALL_SECTION_SIZE,columns=Math.ceil(wall.w/cell);
 for(let y=0;y<wall.h;y+=cell)for(let x=0;x<wall.w;x+=cell){
  const index=(y/cell)*columns+x/cell;
  if(!wall.sectionDamage[index]?.broken)c.fillRect(wall.x+x+3,wall.y+y+5,Math.min(cell,wall.w-x),Math.min(cell,wall.h+3-y));
 }
}

export function drawWildBuildingGround(c,d,bounds=null,g=null){
 const visible=(p,margin)=>!bounds||(p.x+margin>bounds.left&&p.x-margin<bounds.right&&p.y+margin>bounds.top&&p.y-margin<bounds.bottom);
 const assetVisible=(f,pad=0)=>visible({x:f.x+f.w/2,y:f.y+f.h/2},Math.max(f.w,f.h)/2+pad);
 for(const h of wildLandmarkBuildings(d)){
  if(![...h.floors,...h.paths,...h.pools].some(f=>visible({x:f.x+f.w/2,y:f.y+f.h/2},Math.max(f.w,f.h)/2+40)))continue;
  if(h.temple)drawTempleLandmarkFloor(c,h);
  else{
   drawHomesteadPaths(c,h);drawHouseFloor(c,h);
   for(const pool of h.pools)if(visible({x:pool.x+pool.w/2,y:pool.y+pool.h/2},Math.max(pool.w,pool.h)/2+18))drawHousePool(c,g||{},pool);
  }
  for(const rug of h.furniture||[])if(rug.kind==='rug'&&!rug.destroyed&&assetVisible(rug)){
   drawBreakable(c,g||{},rug,(pen,asset)=>drawFurniture(pen,asset,g||{}),'wild-floor-rug');
  }
  for(const wall of h.walls)if(!h.temple&&assetVisible(wall,8))drawWallGroundShadow(c,wall);
  for(const asset of [...h.walls,...h.doors,...h.furniture])if((asset.debris?.length||asset.sectionDamage)&&assetVisible(asset,24)){
   drawStructureDebris(c,{house:h},asset,{brokenCells:true});
  }
  if(!h.temple)for(const v of h.vehicles)if(visible(v,140))drawVehicleEffects(c,v);
  if(bounds)drawHouseInteriorWalls(c,h,g?.players||[],visible,{always:!!h.temple});
 }
}
export function wildBuildingSubjects(d){
 const subjects=[];
 for(const h of wildLandmarkBuildings(d)){
  for(const asset of [...h.walls,...h.doors,...h.furniture.filter(f=>f.kind!=='rug')])subjects.push({wildBuildingAsset:asset,wildBuildingTemple:h.temple,
   ...(asset.kind==='wall_clock'?{clockHouse:h}:{}),
   depth:asset.y+asset.h,x:asset.x+asset.w/2,y:asset.y+asset.h});
  for(const vehicle of h.vehicles)subjects.push({wildBuildingAsset:vehicle,wildBuildingVehicle:true,x:vehicle.x,y:vehicle.y,depth:vehicle.y});
  if(h.hearth){const {x,y}=h.hearth;subjects.push({wildBuildingAsset:{kind:'floo-hearth'},x,y,depth:y-16});}
 }
 return subjects;
}
export function drawWildBuildingSubject(c,g,o){
 const b=o.wildBuildingAsset;
 if(o.wildBuildingVehicle){
  drawHouseCar(c,b,g);return;
 }
 if(b.kind==='floo-hearth'){
  c.save();c.translate(o.x,o.y);
  drawFlooHearth(c,g.time,flooFireGreen(g,'homestead'));
  c.restore();return;
 }
 if(b.destroyed)return;
 if(b.kind==='wall_clock'){drawFurniture(c,b,{house:o.clockHouse,players:g.players});return;}
 const door=['door','gate','garage'].includes(b.kind),wall=['wall','fence','window'].includes(b.kind);
 const key=door?'door:'+!!b.open:wall?'wild-wall':
  'wild-furniture:'+JSON.stringify([b.opened,b.applianceOn,b.lightMode,visibleSurfaceItems(g,b)]);
 drawBreakable(c,g,b,(pen,asset)=>{
  if(asset.kind==='window')drawWindow(pen,asset);
  else if(door)drawHouseDoor(pen,asset);
  else if(asset.kind==='wall'&&o.wildBuildingTemple)drawTempleWallFinish(pen,asset);
  else if(wall)drawHouseWall(pen,asset,{groundShadow:false});
  else drawFurniture(pen,asset,g);
 },key,{debris:false});
}

export function drawWildHomesteadDetails(c,g,visible,lightPass=false){
 const d=g.trainTest?.design;if(d?.activeRoom)return;
 const home=wildHomestead(d);if(!home||!visible(WILD_HOMESTEAD,930))return;
 const view={house:home,players:g.players,sky:g.sky,time:g.time};
 if(!lightPass){drawHouseAppliances(c,view,false);drawHouseRoof(c,view,visible,false);return;}
 const occupied=home.floors.some(f=>g.players.some(p=>!p.room&&p.hp>0&&p.x>=f.x&&p.x<=f.x+f.w&&p.y>=f.y&&p.y<=f.y+f.h));
 if(occupied){
  for(const light of houseLightSources(view)){
   if(!visible(light,light.radius))continue;
   c.save();c.globalCompositeOperation='screen';c.fillStyle='#e6a76317';c.beginPath();c.ellipse(light.x,light.y,light.radius*.61,light.radius*.38,0,0,Math.PI*2);c.fill();c.restore();
  }
  drawHouseLights(c,view);
 }
 drawHouseRoofLights(c,view,visible);
}
