import {railwayStream,streamImage} from './railway-stream.mjs';
import {drawWildBuildingGround} from './wild-landmark-buildings.mjs';
import {wildHomestead} from './wild-homestead-layout.mjs';
import {nativeWildProps,drawNativeWildTile,nativeWildBiome} from './wild-native-biomes.mjs';
import {drawPortal} from './portal-art.mjs';
import {drawProp} from './environment.mjs';
import {sketchBiome,sketchUniformSurfaceTile,wildLandsPathAt,WILD_BRIDGES,REGION_SHAPES} from './wild-lands-geography.mjs';
import {WILD_LANDS_SITES,wildSiteVisible} from './wild-lands-content.mjs';
import {drawStarterChest} from './starter-chest.mjs';
import {drawIceChest} from './ice-chest-art.mjs';
import {forestGroundTone} from './forest-art.mjs';
import {drawWaterSurface} from './water-surface.mjs';
import {drawWildSandTile,wildSandTone} from './wild-sand-art.mjs';
import {drawRailwayFloorFallback} from './railway-floor-fallback.mjs';
import {wildHash,wildLandsGround,wildLandsSurface,wildLandsSurfaceAt,WILD_LANDS_STOPS,WILD_LANDS_GATES,WILD_LANDS_EXIT} from './wild-lands-world.mjs';
import {nearestTrainTrack} from './train-track.mjs';
import {HOLLOW_ROOM,MOUNTAIN_BOUNDS} from './wild-mountain-layout.mjs';
import {GREYWAKE_SHORE_BOUNDS} from './wild-mountain-shore.mjs';
import {drawMountainMap} from './wild-mountain-art.mjs';
import {tideglassEdge,tideglassIntersects} from './tideglass-layout.mjs';
import {drawTideglassGroundTile,drawTideglassMapMarks,tideglassGroundTone} from './tideglass-ground-art.mjs';
const COLORS={forest:['#4a663c','#4b673d','#4c683e'],jungle:['#3d6339','#3e643a','#3f653b'],ice:['#bccfd0','#c4d6d5','#b3c9cd'],graveyard:['#354b43','#394e47','#3d5148'],house:['#526f40','#587645','#5e7947'],beach:['#b9a57b','#c5b188','#cdb992'],swamp:['#465c42','#4c6145','#40573e'],caverns:['#35434c','#3c4a53','#414e56'],mountain:['#48594c','#4b5d50','#536255'],shadow:['#343547','#393a50','#3e3c54'],water:['#235765','#265e6c','#2b6470'],shallow:['#59918e','#629e98','#6ba49b']};
const rect=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,h);};
const nativePlan={seed:42,routes:[],landmarks:[],routeField:new Float32Array(10000).fill(200),paving:{cells:Array(576).fill(0)}};
const waterMasks=new WeakMap();
const coastDirections=[[-1,0],[1,0],[0,-1],[0,1]];
export function nativeWaterRuns(d,x,y){
 const mountain=x+32>MOUNTAIN_BOUNDS.left&&x<MOUNTAIN_BOUNDS.right&&y+32>MOUNTAIN_BOUNDS.top&&y<MOUNTAIN_BOUNDS.bottom;
 const tideglass=!d.activeRoom&&tideglassIntersects(x,y,x+32,y+32)?tideglassEdge(x+16,y+16):-Infinity;
 if(tideglass>42&&!mountain)return {x,y,wet:[],shallow:[],shore:[]};
 const greywake=x+32>GREYWAKE_SHORE_BOUNDS.left&&x<GREYWAKE_SHORE_BOUNDS.right&&y+32>GREYWAKE_SHORE_BOUNDS.top&&y<GREYWAKE_SHORE_BOUNDS.bottom;
 if(!d.activeRoom&&!mountain&&!greywake&&tideglass<-132&&!d.wildStops?.some(s=>Math.abs(x+16-s.x)<612&&y+32>s.y-390&&y<s.y+100)){
  const uniform=sketchUniformSurfaceTile(x,y);
  if(uniform)return {x,y,wet:uniform==='grass'?[]:[[x,y,32,32]],shallow:uniform==='shallow'?[[x,y,32,32]]:[],shore:[]};
 }
 const wet=[],shallow=[],shore=[],cells=[];
 for(let row=-1;row<=16;row++){
  const line=[];
  for(let col=-1;col<=16;col++)line.push(wildLandsSurfaceAt(d,x+col*2+1,y+row*2+1));
  cells.push(line);
 }
 for(let row=0;row<16;row++){
  let wetStart=-1,shallowStart=-1;
  for(let col=0;col<=16;col++){
   const py=y+row*2,px=x+col*2,kind=col<16?cells[row+1][col+1]:'grass';
   if(kind!=='grass'&&wetStart<0)wetStart=col;
   if(kind==='grass'&&wetStart>=0){wet.push([x+2*wetStart,py,2*(col-wetStart),2]);wetStart=-1;}
   if(kind==='shallow'&&shallowStart<0)shallowStart=col;
   if(kind!=='shallow'&&shallowStart>=0){shallow.push([x+2*shallowStart,py,2*(col-shallowStart),2]);shallowStart=-1;}
   if(kind==='grass')continue;
   for(const [dx,dy] of coastDirections)if(cells[row+1-dy][col+1-dx]==='grass')shore.push([px,py,dx,dy]);
  }
 }
 return {x,y,wet,shallow,shore};
}

function drawWildShoreCrests(c,tiles,time){
 for(const shore of tiles)for(const [x,y,dx,dy] of shore){
  const along=dx?y:x;
  const phase=(time*.52+x*.013+y*.009)%1;
  const swell=Math.sin(along*.146+time*.85)+.46*Math.sin(along*.29-time*1.1);
  if(swell<.05)continue;
  const width=dx?1:2,height=dy?1:2,inset=2+Math.floor(phase*5);
  c.fillStyle=phase<.54?'#a5d9bd80':'#8fc4ac54';
  c.fillRect(x+dx*inset,y+dy*inset,width,height);
  if(swell>.97){
   c.fillStyle='#8eccb23e';
   c.fillRect(x+dx*(inset+5),y+dy*(inset+5),width,height);
  }
 }
}
export function wildWaterTileMask(x,y,d,t,requestedChunks){
 if(typeof Path2D==='undefined')return null;
 let cache=waterMasks.get(d);
 if(!cache)waterMasks.set(d,cache=new Map());
 const room=d.activeRoom||'surface',tx=Math.floor(x/32),ty=Math.floor(y/32),key=`${room}:${tx}:${ty}`;
 if(cache.has(key))return cache.get(key);
 let tile;
 if(t&&railwayStream(t)){
  const cx=Math.floor(x/512)*512,cy=Math.floor(y/512)*512,chunkKey=`water:${room}:${cx}:${cy}`;
  // A visible 512-unit block can supply 256 tiles. Request it once per view
  // and construct only the water masks this frame actually needs.
  let data=requestedChunks?.get(chunkKey);
  if(!requestedChunks?.has(chunkKey)){
   data=streamImage(t,'water',chunkKey,{x:cx,y:cy},170);
   requestedChunks?.set(chunkKey,data);
  }
  tile=data?.tiles[(ty-cy/32)*16+tx-cx/32];
  if(!tile)return null;
 }else tile=nativeWaterRuns(d,x,y);
 let mask=null;
 if(tile.wet.length){
  mask={wet:new Path2D(),shallow:new Path2D(),hasWet:true,hasShallow:!!tile.shallow.length,shore:tile.shore};
  for(const run of tile.wet)mask.wet.rect(...run);
  for(const run of tile.shallow)mask.shallow.rect(...run);
 }
 if(cache.size>=6000)cache.delete(cache.keys().next().value);
 cache.set(key,mask);return mask;
}
function floorColor(d,x,y,detail=false){
 const water=wildLandsSurface(d,x,y);
 if(water==='grass'&&!d.activeRoom){
  const eastern=tideglassGroundTone(x,y);
  if(eastern)return eastern;
 }
 if(water==='grass'&&!d.activeRoom&&wildLandsPathAt(x,y))return '#94876c';
 if(water==='grass'&&!detail&&wildLandsGround(d,x,y)==='beach')return wildSandTone(x,y);
 const biome=water==='grass'?nativeWildBiome(d,x,y):water,kind=biome==='beach'?sketchBiome(x,y):biome;
 return ['forest','jungle','house'].includes(kind)?forestGroundTone(nativePlan,x,y):COLORS[kind][Math.floor(wildHash(x/32,y/32)*3)];
}
function drawWildFloorFallback(c,d,x,y,span){
 const room=d.activeRoom||'surface';
 drawRailwayFloorFallback(c,d,x,y,span,span===512?32:64,(wx,wy)=>{
  const surface=wildLandsSurface(d,wx,wy);
  if(surface==='grass'&&!d.activeRoom){const eastern=tideglassGroundTone(wx,wy);if(eastern)return eastern;}
  if(surface==='grass'&&!d.activeRoom&&wildLandsPathAt(wx,wy))return '#94876c';
  const kind=surface==='grass'?wildLandsGround(d,wx,wy):surface;
  if(kind==='beach')return wildSandTone(wx,wy);
  const palette=COLORS[kind]||COLORS.forest;
  return palette[Math.floor(wildHash(wx/32,wy/32)*3)];
 },room);
}
function miniLayer(t){
 if(t.wildMap)return t.wildMap;if(railwayStream(t))return streamImage(t,'map','map',{size:320,height:192},40);const canvas=document.createElement('canvas');canvas.width=320;canvas.height=192;const pen=canvas.getContext('2d'),d={...t.design,activeRoom:null};
 for(let y=0;y<canvas.height;y+=2)for(let x=0;x<canvas.width;x+=2)rect(pen,x,y,2,2,floorColor(d,(x+1)*d.width/canvas.width,(y+1)*d.height/canvas.height));
 pen.save();pen.scale(canvas.width/d.width,canvas.height/d.height);drawMountainMap(pen);drawTideglassMapMarks(pen);pen.restore();t.wildMap=canvas;return canvas;
}
function overviewLayer(t){
 const revision=t.wildExploration?.opened.size||0;if(t.wildOverview&&t.wildOverviewRevision===revision)return t.wildOverview;const canvas=document.createElement('canvas');canvas.width=1200;canvas.height=720;const pen=canvas.getContext('2d'),d={...t.design,activeRoom:null};pen.scale(canvas.width/d.width,canvas.height/d.height);
 pen.imageSmoothingEnabled=false;pen.drawImage(miniLayer(t),0,0,d.width,d.height);
 const savedVisible=t.visibleForest,all=wildLandsProps(t,{left:0,top:0,right:d.width,bottom:d.height});t.visibleForest=savedVisible;
 for(const prop of all){const x=prop.x,y=prop.rootY||prop.y;if(prop.kind==='gravestone'){rect(pen,x-14,y-30,28,30,'#9caaa0');continue;}rect(pen,x-5,y-15,10,18,'#69533f');const winter=prop.kind==='snow_tree';rect(pen,x-38,y-90,76,66,winter?'#466868':'#294d36');rect(pen,x-28,y-105,56,60,winter?'#c5d5ce':'#47713b');}
 drawWildLandsLandmarks(pen,{...t,design:d,viewZoom:.05},{left:0,top:0,right:d.width,bottom:d.height});t.wildOverview=canvas;t.wildOverviewRevision=revision;return canvas;
}
export function drawWildLandsFloor(c,t,bounds,overview=false,g=null){
 const d=t.design,step=overview?96:32;
 // Small cached native-resolution tile chunks; never rasterize the entire world at play scale.
 if(overview&&!d.activeRoom){c.imageSmoothingEnabled=false;if(railwayStream(t)){const image=streamImage(t,'overview','overview:'+(t.wildExploration?.opened.size||0),{size:1200,height:720,opened:[...(t.wildExploration?.opened||[])]},10)||miniLayer(t);if(image)c.drawImage(image,0,0,d.width,d.height);}else c.drawImage(overviewLayer(t),0,0,d.width,d.height);return;}

 const far=(t.viewZoom||1)<.3,chunkSize=far?2048:512,tile=far?32:16,scale=chunkSize/256;
 t.wildFloorChunks??=new Map();
 const stream=railwayStream(t);
 if(stream){
  const tiles=[];for(let cy=Math.max(0,Math.floor(bounds.top/chunkSize));cy<=Math.min(Math.ceil(d.height/chunkSize)-1,Math.floor(bounds.bottom/chunkSize));cy++)for(let cx=Math.max(0,Math.floor(bounds.left/chunkSize));cx<=Math.min(Math.ceil(d.width/chunkSize)-1,Math.floor(bounds.right/chunkSize));cx++){const key='floor:'+ [d.activeRoom||'surface',chunkSize,cx,cy].join(':');stream.pinned.add(key);tiles.push({cx,cy,image:streamImage(t,'floor',key,{x:cx*chunkSize,y:cy*chunkSize,span:chunkSize,far,seed:t.grassSeed||42},180)});}
  const missing=tiles.filter(q=>!q.image).length;if(t.streamCoverage){t.streamCoverage.groundPending+=missing;t.streamCoverage.groundReady=true;}
  let lod=t.floorLod;if(!lod||lod.room!==(d.activeRoom||'surface'))lod=t.floorLod={room:d.activeRoom||'surface',far,transition:false};if(!far&&lod.far){lod.transition=true;delete lod.start;}lod.far=far;
  let alpha=1;if(!far&&lod.transition){if(!missing)lod.start??=performance.now();alpha=lod.start===undefined?0:Math.min(1,(performance.now()-lod.start)/300);if(alpha===1)lod.transition=false;}lod.detailAlpha=far?0:alpha;
  if(missing||alpha<1){
   const lowerTiles=new Set(),room=d.activeRoom||'surface';
   for(const q of tiles){
    if(q.image&&alpha===1)continue;
    const x=q.cx*chunkSize,y=q.cy*chunkSize,cx=Math.floor(x/2048),cy=Math.floor(y/2048);
    const key=`floor:${room}:2048:${cx}:${cy}`;
    if(lowerTiles.has(key))continue;
    const base=far?null:stream.ready.get(key);
    if(base){c.imageSmoothingEnabled=false;c.drawImage(base,cx*2048,cy*2048,2048,2048);lowerTiles.add(key);}
    else drawWildFloorFallback(c,d,x,y,chunkSize);
   }
  }
  if(alpha>0){c.save();c.globalAlpha*=alpha;c.imageSmoothingEnabled=false;for(const q of tiles)if(q.image)c.drawImage(q.image,q.cx*chunkSize,q.cy*chunkSize,chunkSize,chunkSize);c.restore();}
 }else{
 for(let cy=Math.max(0,Math.floor(bounds.top/chunkSize));cy<=Math.min(Math.ceil(d.height/chunkSize)-1,Math.floor(bounds.bottom/chunkSize));cy++)for(let cx=Math.max(0,Math.floor(bounds.left/chunkSize));cx<=Math.min(Math.ceil(d.width/chunkSize)-1,Math.floor(bounds.right/chunkSize));cx++){
  const key=[d.activeRoom||'surface',chunkSize,cx,cy].join(':');let canvas=t.wildFloorChunks.get(key);
  if(!canvas){canvas=document.createElement('canvas');canvas.width=canvas.height=256;const pen=canvas.getContext('2d');
   for(let y=0;y<chunkSize;y+=tile)for(let x=0;x<chunkSize;x+=tile){const wx=cx*chunkSize+x,wy=cy*chunkSize+y,color=floorColor(d,wx+tile/2,wy+tile/2,!far);rect(pen,x/scale,y/scale,tile/scale,tile/scale,color);const n=wildHash(wx,wy);pen.globalAlpha=.18;for(let i=0;i<(far?2:1);i++)rect(pen,x/scale+Math.floor(wildHash(wx+i,wy)*Math.max(1,tile/scale-2)),y/scale+Math.floor(wildHash(wx,wy+i)*Math.max(1,tile/scale-2)),2,1,n>.5?'#ced29e':'#152d31');pen.globalAlpha=1;}
   if(!far)for(let y=0;y<chunkSize;y+=32)for(let x=0;x<chunkSize;x+=32){
    const x0=cx*chunkSize,y0=cy*chunkSize;
    drawNativeWildTile(pen,t,x0+x,y0+y,x0,y0,scale);
    drawWildSandTile(pen,d,x0+x,y0+y,x0,y0,scale);
    if(!d.activeRoom&&tideglassIntersects(x0+x,y0+y,x0+x+32,y0+y+32))drawTideglassGroundTile(pen,x0+x,y0+y,x0,y0,scale);
   }
   if(t.wildFloorChunks.size>=80)t.wildFloorChunks.delete(t.wildFloorChunks.keys().next().value);t.wildFloorChunks.set(key,canvas);
  }
  c.imageSmoothingEnabled=false;c.drawImage(canvas,cx*chunkSize,cy*chunkSize,chunkSize,chunkSize);
 }
 }
 if(g&&!far&&!d.activeRoom){
  const requestedChunks=new Map(),shoreTiles=[];
  const left=Math.floor(bounds.left/32)*32,top=Math.floor(bounds.top/32)*32;
  const width=Math.ceil(bounds.right/32)*32-left,height=Math.ceil(bounds.bottom/32)*32-top;
  const wet=new Path2D(),shallows=new Path2D();
  let hasWet=false,hasShallows=false;
  for(let y=top;y<bounds.bottom;y+=32)for(let x=left;x<bounds.right;x+=32){
   const mask=wildWaterTileMask(x,y,d,t,requestedChunks);
   if(!mask)continue;
   wet.addPath(mask.wet);hasWet=true;
   if(mask.hasShallow){shallows.addPath(mask.shallow);hasShallows=true;}
   if(mask.shore.length)shoreTiles.push(mask.shore);
  }
  // One continuous shader fill keeps adjacent tiles from independently anti-aliasing.
  if(hasWet){c.save();c.clip(wet);drawWaterSurface(c,g,left,top,width,height,{shallow:false,shoreRipples:false});c.restore();}
  if(hasShallows){c.fillStyle='#79c6a188';c.fill(shallows);}
  drawWildShoreCrests(c,shoreTiles,g.time||0);
 }
}
export function wildLandsProps(t,bounds){
 const native=nativeWildProps(t,bounds),home=!t.design.activeRoom&&wildHomestead(t.design);
 return home?[...native,...home.trees.filter(t=>visiblePoint(bounds,t,t.size+80))]:native;
}
function visiblePoint(bounds,p,r=500){return p.x>bounds.left-r&&p.x<bounds.right+r&&p.y>bounds.top-r&&p.y<bounds.bottom+r;}
export function drawWildLandsCrossings(c,d,bounds){
 if(!d.wildLands||d.activeRoom)return;
 for(const b of WILD_BRIDGES){
  if(!visiblePoint(bounds,b,Math.max(b.w,b.h)/2+12))continue;
  drawWildLandsCrossing(c,b);
 }
}
export function drawWildLandsCrossing(c,b){
 const x=b.x-b.w/2,y=b.y-b.h/2-10,across=b.w>b.h;
 rect(c,x,y,b.w,b.h,'#5d5140');
 for(let z=0;z<(across?b.w:b.h);z+=18)rect(c,x+(across?z:0),y+(across?0:z),across?3:b.w,across?b.h:3,'#aa8c60');
 for(const side of[-1,1])rect(c,x+(across||side<0?0:b.w-5),y+(across&&side>0?b.h-5:0),across?b.w:5,across?5:b.h,'#c4ae7e');
}
function drawCemeteryFence(c,bounds){
 const points=REGION_SHAPES.graveyard.map(([x,y])=>({x:x*16000,y:y*9600}));
 for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length],length=Math.hypot(a.x-b.x,a.y-b.y);for(let z=0;z<length;z+=55){if(Math.abs(z-length/2)<150)continue;const x=a.x+(b.x-a.x)*z/length,y=a.y+(b.y-a.y)*z/length;if(!visiblePoint(bounds,{x,y},120))continue;rect(c,x-3,y-50,6,50,'#273c3a');rect(c,x-5,y-53,10,5,'#697b67');c.strokeStyle='#526957';c.lineWidth=3;c.beginPath();c.moveTo(x,y-38);c.lineTo(x+(b.x-a.x)*Math.min(55,length-z)/length,y+(b.y-a.y)*Math.min(55,length-z)/length-38);c.stroke();}}
}
const frozenExplorerCache=WILD_LANDS_SITES.find(s=>s.id==='frost-cache');
export function frozenExplorerCacheSubject(t,visible){
 if(!t.design.wildLands||t.wildLandsOverview||!wildSiteVisible(t.design,frozenExplorerCache)||!visible(frozenExplorerCache,140))return null;
 return {frozenExplorerCache:true,depth:frozenExplorerCache.y+6};
}
export function drawFrozenExplorerCache(c,t){
 const {x,y,name,id}=frozenExplorerCache;
 drawIceChest(c,x,y,t.wildExploration?.opened.has(id),.9);
 if((t.viewZoom||1)>.25){c.fillStyle='#ded5b2';c.font='11px system-ui';c.textAlign='center';c.fillText(name,x,y-100);c.textAlign='left';}
}
function drawExplorationSites(c,t,bounds,depthSortedCache=false){
 for(const site of WILD_LANDS_SITES){if(!wildSiteVisible(t.design,site)||!visiblePoint(bounds,site,500))continue;const x=site.x,y=site.y;
  if(site.kind==='boardwalk'){rect(c,x-220,y-160,440,320,'#716448');for(let i=-210;i<220;i+=20)rect(c,x+i,y-156,3,312,'#a38b61');}
  if(site.kind==='stones')for(let i=0;i<7;i++){const a=i*Math.PI*2/7,px=x+Math.cos(a)*190,py=y+Math.sin(a)*150;const kind=site.room==='shadow'?'veil_stone':site.room?'limestone_shelf':'ice_rock';drawProp(c,{kind,x:px,y:py,rootY:py,size:55,...(site.room?{realm:site.room}:{}),variant:i%4,procedural:true},t.time,{environment:'ice',generatedEnvironment:'ice',phase:'play',scenery:[]},{dynamicShadows:true});}
  if(site.kind==='camp'){rect(c,x-110,y-85,80,55,'#4d6041');for(let i=0;i<4;i++)rect(c,x-105+i*18,y-90-i%2*8,20,12,'#a49970');rect(c,x+100,y-15,100,18,'#6f553b');rect(c,x+112,y-12,85,3,'#ad8b59');}
  if(site===frozenExplorerCache){if(!depthSortedCache)drawFrozenExplorerCache(c,t);continue;}
  const opened=t.wildExploration?.opened.has(site.id);c.save();c.translate(x,y);c.scale(.35,.35);drawStarterChest(c,{x:0,y:0},opened?1:0);c.restore();
  if((t.viewZoom||1)>.25){c.fillStyle='#ded5b2';c.font='11px system-ui';c.textAlign='center';c.fillText(site.name,x,y-100);c.textAlign='left';}
 }
}
export function drawWildLandsLandmarks(c,t,bounds,g=null){
 const d=t.design;if(!d.activeRoom){if(!g)drawWildLandsCrossings(c,d,bounds);drawCemeteryFence(c,bounds);}if(d.activeRoom){
  drawPortal(c,{...WILD_LANDS_EXIT,color:d.activeRoom==='shadow'?'#aa55ff':'#66c6d7'},t.time,'');drawExplorationSites(c,t,bounds);return;
 }
 if((t.viewZoom||1)<.3&&railwayStream(t)){const image=streamImage(t,'landmarks','landmarks:'+(t.destructionRevision||0),{size:1200,height:720,span:d.width,x:0,y:0,damaged:t.damagedBuildings||[]},40);if(image)c.drawImage(image,0,0,d.width,d.height);}else drawWildBuildingGround(c,d,bounds,g);
 drawExplorationSites(c,t,bounds,!!g&&(t.viewZoom||1)>=.3&&!t.wildLandsOverview);
 for(const gate of WILD_LANDS_GATES){if(gate.id===HOLLOW_ROOM||gate.x<bounds.left-200||gate.x>bounds.right+200||gate.y<bounds.top-200||gate.y>bounds.bottom+200)continue;
  c.save();c.translate(gate.x,gate.y);c.scale(1.55,1.55);drawPortal(c,{x:0,y:0,color:gate.id==='shadow'?'#aa55ff':'#66c6d7',closing:null},t.time,'');c.restore();
  c.save();c.font='14px system-ui';c.fillStyle='#ead9b0';c.textAlign='center';c.fillText(gate.name,gate.x,gate.y+30);c.restore();
 }
}
export function drawWildLandsMap(c,t,x,y,w,h){c.imageSmoothingEnabled=false;const image=miniLayer(t);if(image)c.drawImage(image,x,y,w,h);}
