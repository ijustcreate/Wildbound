import {railwayStream,streamImage} from './railway-stream.mjs';
import {drawWildBuildingGround} from './wild-landmark-buildings.mjs';
import {nativeWildProps,drawNativeWildTile,nativeWildBiome} from './wild-native-biomes.mjs';
import {drawPortal} from './portal-art.mjs';
import {drawProp} from './environment.mjs';
import {sketchUniformSurfaceTile,wildLandsPathAt,WILD_BRIDGES,REGION_SHAPES} from './wild-lands-geography.mjs';
import {WILD_LANDS_SITES,wildSiteVisible} from './wild-lands-content.mjs';
import {drawStarterChest} from './starter-chest.mjs';
import {forestGroundTone} from './forest-art.mjs';
import {drawWaterSurface} from './water-surface.mjs';
import {wildHash,wildLandsGround,wildLandsSurface,wildLandsSurfaceAt,WILD_LANDS_STOPS,WILD_LANDS_GATES} from './wild-lands-world.mjs';
import {nearestTrainTrack} from './train-track.mjs';
const COLORS={forest:['#4a663c','#4b673d','#4c683e'],jungle:['#3d6339','#3e643a','#3f653b'],ice:['#bccfd0','#c4d6d5','#b3c9cd'],graveyard:['#354b43','#394e47','#3d5148'],house:['#526f40','#587645','#5e7947'],beach:['#b9a57b','#c5b188','#cdb992'],swamp:['#465c42','#4c6145','#40573e'],caverns:['#35434c','#3c4a53','#414e56'],shadow:['#343547','#393a50','#3e3c54'],water:['#235765','#265e6c','#2b6470'],shallow:['#59918e','#629e98','#6ba49b']};
const rect=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,h);};
const nativePlan={seed:42,routes:[],landmarks:[],routeField:new Float32Array(10000).fill(200),paving:{cells:Array(576).fill(0)}};
const waterMasks=new Map();
export function nativeWaterRuns(d,x,y){if(!d.activeRoom&&!d.wildStops?.some(s=>Math.abs(x+16-s.x)<612&&y+32>s.y-390&&y<s.y+100)){const uniform=sketchUniformSurfaceTile(x,y);if(uniform)return {x,y,wet:uniform==='grass'?[]:[[x,y,32,32]],shallow:uniform==='shallow'?[[x,y,32,32]]:[]};}const wet=[],shallow=[];for(let py=0;py<32;py+=2){let start=-1,ss=-1;for(let px=0;px<=32;px+=2){const kind=px<32?wildLandsSurfaceAt(d,x+px+1,y+py+1):'grass';if(kind!=='grass'&&start<0)start=px;if(kind==='grass'&&start>=0){wet.push([x+start,y+py,px-start,2]);start=-1;}if(kind==='shallow'&&ss<0)ss=px;if(kind!=='shallow'&&ss>=0){shallow.push([x+ss,y+py,px-ss,2]);ss=-1;}}}return {x,y,wet,shallow};}
function waterMask(x,y,d,t){
 if(t&&railwayStream(t)){const cx=Math.floor(x/512)*512,cy=Math.floor(y/512)*512,data=streamImage(t,'water',`water:${d.activeRoom||'surface'}:${cx}:${cy}`,{x:cx,y:cy},170);if(data&&!data.installed){for(const tile of data.tiles){const key=`${d.activeRoom||'surface'}:${Math.floor(tile.x/32)}:${Math.floor(tile.y/32)}`;if(!tile.wet.length){waterMasks.set(key,null);continue;}const mask={wet:new Path2D(),shallow:new Path2D(),hasWet:true,hasShallow:!!tile.shallow.length};for(const run of tile.wet)mask.wet.rect(...run);for(const run of tile.shallow)mask.shallow.rect(...run);waterMasks.set(key,mask);}data.installed=true;}return waterMasks.get(`${d.activeRoom||'surface'}:${Math.floor(x/32)}:${Math.floor(y/32)}`)||null;}
 if(typeof Path2D==='undefined')return null;
 const key=`${d.activeRoom||'surface'}:${Math.floor(x/32)}:${Math.floor(y/32)}`;
 let mask=waterMasks.get(key);if(waterMasks.has(key))return mask;if(!d.activeRoom&&!d.wildStops?.some(s=>Math.abs(x+16-s.x)<612&&y+32>s.y-390&&y<s.y+100)&&sketchUniformSurfaceTile(x,y)==='grass'){if(waterMasks.size>=6000)waterMasks.delete(waterMasks.keys().next().value);waterMasks.set(key,null);return null;}
 mask={wet:new Path2D(),shallow:new Path2D(),hasWet:false,hasShallow:false};
 for(let py=0;py<32;py+=2)for(let px=0;px<32;px+=2){
  const surface=wildLandsSurfaceAt(d,x+px+1,y+py+1);if(surface==='grass')continue;
  mask.wet.rect(x+px,y+py,2,2);mask.hasWet=true;
  if(surface==='shallow'){mask.shallow.rect(x+px,y+py,2,2);mask.hasShallow=true;}
 }
 if(!mask.hasWet){if(waterMasks.size>=6000)waterMasks.delete(waterMasks.keys().next().value);waterMasks.set(key,null);return null;}
 if(waterMasks.size>=6000)waterMasks.delete(waterMasks.keys().next().value);
 waterMasks.set(key,mask);return mask;
}
function floorColor(d,x,y){
 const water=wildLandsSurface(d,x,y),kind=water==='grass'?nativeWildBiome(d,x,y):water;
 if(water==='grass'&&!d.activeRoom&&wildLandsPathAt(x,y))return '#94876c';
 return ['forest','jungle','house'].includes(kind)?forestGroundTone(nativePlan,x,y):COLORS[kind][Math.floor(wildHash(x/32,y/32)*3)];
}
function miniLayer(t){
 if(t.wildMap)return t.wildMap;if(railwayStream(t))return streamImage(t,'map','map',{size:320,height:192},40);const canvas=document.createElement('canvas');canvas.width=320;canvas.height=192;const pen=canvas.getContext('2d'),d={...t.design,activeRoom:null};
 for(let y=0;y<192;y+=2)for(let x=0;x<320;x+=2)rect(pen,x,y,2,2,floorColor(d,x*50+50,y*50+50));t.wildMap=canvas;return canvas;
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
  const missing=tiles.filter(q=>!q.image).length;if(t.streamCoverage)t.streamCoverage.groundPending+=missing;
  let lod=t.floorLod;if(!lod||lod.room!==(d.activeRoom||'surface'))lod=t.floorLod={room:d.activeRoom||'surface',far,transition:false};if(!far&&lod.far){lod.transition=true;delete lod.start;}lod.far=far;
  let alpha=1;if(!far&&lod.transition){if(!missing)lod.start??=performance.now();alpha=lod.start===undefined?0:Math.min(1,(performance.now()-lod.start)/300);if(alpha===1)lod.transition=false;}lod.detailAlpha=far?0:alpha;
  if(!far&&(missing||alpha<1)){for(let cy=Math.max(0,Math.floor(bounds.top/2048));cy<=Math.min(Math.ceil(d.height/2048)-1,Math.floor(bounds.bottom/2048));cy++)for(let cx=Math.max(0,Math.floor(bounds.left/2048));cx<=Math.min(Math.ceil(d.width/2048)-1,Math.floor(bounds.right/2048));cx++){const key='floor:'+ [d.activeRoom||'surface',2048,cx,cy].join(':');stream.pinned.add(key);const image=streamImage(t,'floor',key,{x:cx*2048,y:cy*2048,span:2048,far:true,seed:t.grassSeed||42},175);if(image)c.drawImage(image,cx*2048,cy*2048,2048,2048);}}
  if(alpha>0){c.save();c.globalAlpha*=alpha;c.imageSmoothingEnabled=false;for(const q of tiles)if(q.image)c.drawImage(q.image,q.cx*chunkSize,q.cy*chunkSize,chunkSize,chunkSize);c.restore();}
 }else{
 for(let cy=Math.max(0,Math.floor(bounds.top/chunkSize));cy<=Math.min(Math.ceil(d.height/chunkSize)-1,Math.floor(bounds.bottom/chunkSize));cy++)for(let cx=Math.max(0,Math.floor(bounds.left/chunkSize));cx<=Math.min(Math.ceil(d.width/chunkSize)-1,Math.floor(bounds.right/chunkSize));cx++){
  const key=[d.activeRoom||'surface',chunkSize,cx,cy].join(':');let canvas=t.wildFloorChunks.get(key);
  if(!canvas){canvas=document.createElement('canvas');canvas.width=canvas.height=256;const pen=canvas.getContext('2d');
   for(let y=0;y<chunkSize;y+=tile)for(let x=0;x<chunkSize;x+=tile){const wx=cx*chunkSize+x,wy=cy*chunkSize+y,color=floorColor(d,wx+tile/2,wy+tile/2);rect(pen,x/scale,y/scale,tile/scale,tile/scale,color);const n=wildHash(wx,wy);pen.globalAlpha=.18;for(let i=0;i<(far?2:1);i++)rect(pen,x/scale+Math.floor(wildHash(wx+i,wy)*Math.max(1,tile/scale-2)),y/scale+Math.floor(wildHash(wx,wy+i)*Math.max(1,tile/scale-2)),2,1,n>.5?'#ced29e':'#152d31');pen.globalAlpha=1;}
   if(!far)for(let y=0;y<chunkSize;y+=32)for(let x=0;x<chunkSize;x+=32)drawNativeWildTile(pen,t,cx*chunkSize+x,cy*chunkSize+y,cx*chunkSize,cy*chunkSize,scale);
   if(t.wildFloorChunks.size>=80)t.wildFloorChunks.delete(t.wildFloorChunks.keys().next().value);t.wildFloorChunks.set(key,canvas);
  }
  c.imageSmoothingEnabled=false;c.drawImage(canvas,cx*chunkSize,cy*chunkSize,chunkSize,chunkSize);
 }
 }
 if(g&&!far&&!d.activeRoom)for(let y=Math.floor(bounds.top/32)*32;y<bounds.bottom;y+=32)for(let x=Math.floor(bounds.left/32)*32;x<bounds.right;x+=32){
  const mask=waterMask(x,y,d,t);if(typeof Path2D==='undefined'&&wildLandsSurface(d,x+16,y+16)==='grass'||typeof Path2D!=='undefined'&&!mask)continue;
  c.save();if(mask)c.clip(mask.wet);drawWaterSurface(c,g,x,y,32,32,mask?{shallow:false}:{});c.restore();
  if(mask?.hasShallow){c.save();c.clip(mask.shallow);c.fillStyle='#79c6a188';c.fillRect(x,y,32,32);c.restore();}
 }
}
export function wildLandsProps(t,bounds){return nativeWildProps(t,bounds);}
function visiblePoint(bounds,p,r=500){return p.x>bounds.left-r&&p.x<bounds.right+r&&p.y>bounds.top-r&&p.y<bounds.bottom+r;}
function drawCrossings(c,d,bounds){
 for(const b of WILD_BRIDGES){if(!visiblePoint(bounds,b,900))continue;rect(c,b.x-b.w/2,b.y-b.h/2,b.w,b.h,'#5d5140');const across=b.w>b.h;
  for(let z=0;z<(across?b.w:b.h);z+=18)rect(c,b.x-b.w/2+(across?z:0),b.y-b.h/2+(across?0:z),across?3:b.w,across?b.h:3,'#aa8c60');
  for(const side of[-1,1]){rect(c,b.x-b.w/2+(across?0:side>0?b.w-5:0),b.y-b.h/2+(across&&side>0?b.h-5:0),across?b.w:5,across?5:b.h,'#c4ae7e');}
 }
}
function drawCemeteryFence(c,bounds){
 const points=REGION_SHAPES.graveyard.map(([x,y])=>({x:x*16000,y:y*9600}));
 for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length],length=Math.hypot(a.x-b.x,a.y-b.y);for(let z=0;z<length;z+=55){if(Math.abs(z-length/2)<150)continue;const x=a.x+(b.x-a.x)*z/length,y=a.y+(b.y-a.y)*z/length;if(!visiblePoint(bounds,{x,y},120))continue;rect(c,x-3,y-50,6,50,'#273c3a');rect(c,x-5,y-53,10,5,'#697b67');c.strokeStyle='#526957';c.lineWidth=3;c.beginPath();c.moveTo(x,y-38);c.lineTo(x+(b.x-a.x)*Math.min(55,length-z)/length,y+(b.y-a.y)*Math.min(55,length-z)/length-38);c.stroke();}}
}
function drawExplorationSites(c,t,bounds){
 for(const site of WILD_LANDS_SITES){if(!wildSiteVisible(t.design,site)||!visiblePoint(bounds,site,500))continue;const x=site.x,y=site.y;
  if(site.kind==='boardwalk'){rect(c,x-220,y-160,440,320,'#716448');for(let i=-210;i<220;i+=20)rect(c,x+i,y-156,3,312,'#a38b61');}
  if(site.kind==='stones'||site.kind==='graves')for(let i=0;i<7;i++){const a=i*Math.PI*2/7,px=x+Math.cos(a)*190,py=y+Math.sin(a)*150;const kind=site.kind==='graves'?'gravestone':site.room==='shadow'?'veil_stone':site.room?'limestone_shelf':'ice_rock';drawProp(c,{kind,x:px,y:py,rootY:py,size:55,...(site.room?{realm:site.room}:{}),graveyard:kind==='gravestone',variant:i%4,procedural:true},t.time,{environment:kind==='gravestone'?'graveyard':'ice',generatedEnvironment:kind==='gravestone'?'graveyard':'ice',phase:'play',scenery:[]},{dynamicShadows:true});}
  if(site.kind==='camp'){rect(c,x-110,y-85,80,55,'#4d6041');for(let i=0;i<4;i++)rect(c,x-105+i*18,y-90-i%2*8,20,12,'#a49970');rect(c,x+100,y-15,100,18,'#6f553b');rect(c,x+112,y-12,85,3,'#ad8b59');}
  const opened=t.wildExploration?.opened.has(site.id);c.save();c.translate(x,y);c.scale(.35,.35);drawStarterChest(c,{x:0,y:0},opened?1:0);c.restore();
  if((t.viewZoom||1)>.25){c.fillStyle='#ded5b2';c.font='11px system-ui';c.textAlign='center';c.fillText(site.name,x,y-100);c.textAlign='left';}
 }
}
export function drawWildLandsLandmarks(c,t,bounds){
 const d=t.design;if(!d.activeRoom){drawCrossings(c,d,bounds);drawCemeteryFence(c,bounds);}if(d.activeRoom){
  drawPortal(c,{x:8000,y:5600,color:d.activeRoom==='shadow'?'#aa55ff':'#66c6d7'},t.time,'');c.fillStyle='#e9d9ac';c.font='16px system-ui';c.fillText('Interact to return',7930,5680);drawExplorationSites(c,t,bounds);return;
 }
 if((t.viewZoom||1)<.3&&railwayStream(t)){const image=streamImage(t,'landmarks','landmarks:'+(t.destructionRevision||0),{size:1200,height:720,span:d.width,x:0,y:0,damaged:t.damagedBuildings||[]},40);if(image)c.drawImage(image,0,0,d.width,d.height);}else drawWildBuildingGround(c,d,bounds);
 drawExplorationSites(c,t,bounds);
 for(const gate of WILD_LANDS_GATES){if(gate.x<bounds.left-200||gate.x>bounds.right+200||gate.y<bounds.top-200||gate.y>bounds.bottom+200)continue;
  c.save();c.translate(gate.x,gate.y);c.scale(1.55,1.55);drawPortal(c,{x:0,y:0,color:gate.id==='shadow'?'#aa55ff':'#66c6d7',closing:null},t.time,'');c.restore();
  c.font='14px system-ui';c.fillStyle='#ead9b0';c.fillText('Interact · '+gate.name,gate.x-75,gate.y+30);
 }
}
export function drawWildLandsMap(c,t,x,y,w,h){c.imageSmoothingEnabled=false;const image=miniLayer(t);if(image)c.drawImage(image,x,y,w,h);}
