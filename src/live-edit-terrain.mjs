import {drawBiomeTile} from './biome-art.mjs';
import {wildLandsBridgeDeck} from './wild-lands-geography.mjs';
import {inWildLandmark} from './wild-landmark-buildings.mjs';
import {wildHash,wildLandsGround,wildLandsSurface,wildLandsSurfaceAt} from './wild-lands-world.mjs';
import {wildSandTone} from './wild-sand-art.mjs';

const cellSize=32,chunkSize=512;
const brushOptions=[
 {id:'grass',label:'Grass'},{id:'earth',label:'Packed earth'},{id:'sand',label:'Sand'},
 {id:'stone',label:'Stone tiles'},{id:'snow',label:'Snow'},
];
const brushIds=new Set(brushOptions.map(option=>option.id));
const paintedGround=new WeakMap();
const groundColors={
 grass:['#516a41','#819460','#384e32'],
 earth:['#8d775b','#ab9170','#6b5947'],
 sand:['#c1aa7d','#e2cc9c','#947e5c'],
};

function wildSurface(game){
 const train=game?.trainTest;
 return train?.design?.wildLands&&!train.design.activeRoom?train:null;
}

function chunkKey(x,y){
 return Math.floor(x/chunkSize)+','+Math.floor(y/chunkSize);
}

function readCell(train,id){
 if(typeof id!=='string'||!/^\d+,\d+$/.test(id))return null;
 const [col,row]=id.split(',').map(Number);
 const x=col*cellSize,y=row*cellSize,d=train.design;
 if(x+cellSize>d.width||y+cellSize>d.height)return null;
 return {id:col+','+row,x,y,size:cellSize};
}

function dryCell(design,cell){
 const {x,y}=cell,center=cellSize/2;
 if(wildLandsGround(design,x+center,y+center)==='mountain'||inWildLandmark(design,x+center,y+center,center))return false;
 // Respect the fine shoreline geometry along with the simulation's tile.
 for(const dx of [1,center,cellSize-1])for(const dy of [1,center,cellSize-1]){
  if(wildLandsSurface(design,x+dx,y+dy)!=='grass'||wildLandsSurfaceAt(design,x+dx,y+dy)!=='grass'||
   wildLandsBridgeDeck(design,x+dx,y+dy))return false;
 }
 return true;
}

export function terrainBrushes(game){
 const train=wildSurface(game);
 return train&&!train.wildLandsOverview?brushOptions:[];
}

export function terrainCellAt(game,point){
 const train=wildSurface(game);
 if(!train||train.wildLandsOverview||!Number.isFinite(point?.x)||!Number.isFinite(point?.y))return null;
 const cell=readCell(train,Math.floor(point.x/cellSize)+','+Math.floor(point.y/cellSize));
 if(!cell||!dryCell(train.design,cell))return null;
 const brush=paintedGround.get(train)?.get(chunkKey(cell.x,cell.y))?.get(cell.id)?.brush??null;
 return {...cell,brush};
}

export function applyTerrainCell(game,id,brush){
 const train=wildSurface(game),cell=train&&readCell(train,id);
 if(!cell||brush!==null&&(!brushIds.has(brush)||!dryCell(train.design,cell)))return false;
 let chunks=paintedGround.get(train);
 const key=chunkKey(cell.x,cell.y);
 if(brush===null){
  const chunk=chunks?.get(key);
  chunk?.delete(cell.id);
  if(!chunk?.size)chunks?.delete(key);
  return true;
 }
 if(!chunks){chunks=new Map();paintedGround.set(train,chunks);}
 let chunk=chunks.get(key);
 if(!chunk){chunk=new Map();chunks.set(key,chunk);}
 chunk.set(cell.id,{...cell,brush});
 return true;
}

function paintCell(ctx,cell,seed){
 const {x,y,brush}=cell;
 if(brush==='stone'){
  drawBiomeTile(ctx,{generatedEnvironment:'temple',seed},'temple_stone',x,y);
  return;
 }
 if(brush==='snow'){
  ctx.save();
  ctx.beginPath();ctx.rect(x,y,cellSize,cellSize);ctx.clip();
  drawBiomeTile(ctx,{generatedEnvironment:'ice',seed},'snow',x,y);
  ctx.restore();
  return;
 }
 const [base,light,shade]=groundColors[brush];
 ctx.fillStyle=brush==='sand'?wildSandTone(x+16,y+16):base;
 ctx.fillRect(x,y,cellSize,cellSize);
 for(let i=0;i<12;i++){
  const dx=1+Math.floor(wildHash(x+i*31+seed,y)*28);
  const dy=1+Math.floor(wildHash(x,y+i*47-seed)*29);
  ctx.fillStyle=i%3===0?shade:light;
  ctx.fillRect(x+dx,y+dy,brush==='grass'?1:2,brush==='grass'?2:1);
 }
}

// Paint atop the streamed ground and grass. The brushes change material only.
// Existing liquids, walkable surfaces and structures remain authoritative.
export function drawLiveTerrain(ctx,game,bounds){
 const train=wildSurface(game),chunks=train&&paintedGround.get(train);
 if(!chunks?.size||train.wildLandsOverview)return;
 const firstX=Math.floor(bounds.left/chunkSize),lastX=Math.floor(bounds.right/chunkSize);
 const firstY=Math.floor(bounds.top/chunkSize),lastY=Math.floor(bounds.bottom/chunkSize);
 const seed=game.seed||42;
 ctx.save();
 for(let cy=firstY;cy<=lastY;cy++)for(let cx=firstX;cx<=lastX;cx++){
  const chunk=chunks.get(cx+','+cy);
  if(!chunk)continue;
  for(const cell of chunk.values())if(cell.x+cellSize>bounds.left&&cell.x<bounds.right&&
    cell.y+cellSize>bounds.top&&cell.y<bounds.bottom)paintCell(ctx,cell,seed);
 }
 ctx.restore();
}
