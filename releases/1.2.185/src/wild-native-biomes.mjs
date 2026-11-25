import {railwayStream,streamRegion} from './railway-stream.mjs';
import {inWildLandmark} from './wild-landmark-buildings.mjs';
import {generateWorld,footprintHit} from './world.mjs';
import {forestNoise,forestHash} from './forest-landscape.mjs';
import {drawBiomeTile} from './biome-art.mjs';
import {drawWinterTile,iceMotion,interactIce,iceBase} from './ice-world.mjs';
import {drawNativeSnow,drawIceSnowShelf} from './native-ice-art.mjs';
import {drawRealmGround} from './realm-art.mjs';
import {caveFloorEdges,drawCaveFloorCell} from './cave-floor-art.mjs';
import {drawGraveyardGround} from './graveyard-art.mjs';
import {chipGravestone,nearestGravestone} from './graveyard-world.mjs';
import {WILD_LANDS_SITES} from './wild-lands-content.mjs';
import {wildLandsGround,wildLandsSurface,WILD_LANDS_STOPS,WILD_LANDS_GATES} from './wild-lands-world.mjs';
import {coastalSiteGround} from './wild-coastal-sites.mjs';
import {wildLandsPaintedBiome,wildLandsPathAt,mossbellPathAt,moonveilPathAt} from './wild-lands-geography.mjs';
import {HOLLOW_ROOM,mountainLand,mountainTrail} from './wild-mountain-layout.mjs';
import {nearestTrainTrack} from './train-track.mjs';
import {PIRATE_SHIP_BERTH,PIRATE_SHIP_LAYOUT,pirateShipLocal} from './pirate-ship.mjs';
import {wildHomestead,wildHomesteadYardAt} from './wild-homestead-layout.mjs';
import {tideglassGround} from './tideglass-layout.mjs';
import {wildWheatFieldAt,wildWheatProps} from './wild-wheat-fields.mjs';
import {WILD_SLIME_HOLLOW,mossbellScenery,mossbellClearsScenery,mossbellCheckpointBlocked} from './wild-slime-hollow-site.mjs';
import {moonveilClearsScenery} from './wild-runic-sanctuary-site.mjs';

const cemeteryScale=.8,graveSite=WILD_LANDS_SITES.find(site=>site.kind==='graves');
const cemeteryBrushes=new Set(['gravestone','mausoleum','grave_candles']);
const cemeteryTrees=new Set(['leafless_tree','grave_forest_tree']);
function fitNativeCemeteryProp(p){
 if(!p.graveyard||!cemeteryBrushes.has(p.kind)&&!cemeteryTrees.has(p.kind))return p;
 const size=Math.round(p.size*cemeteryScale),root=p.rootY??p.y,foot=p.graveyardFootprint;
 const fit=(center,value)=>Math.round(center+(value-center)*cemeteryScale);
 const graveyardFootprint=foot?{x:fit(p.x,foot.x),y:fit(root,foot.y),w:Math.round(foot.w*cemeteryScale),h:Math.round(foot.h*cemeteryScale)}:undefined;
 return {...p,size,graveyardFootprint,...(cemeteryBrushes.has(p.kind)?{wildCemeteryScale:cemeteryScale}:{})};
}

function cemeterySiteProps(t){
 return t.cemeterySiteProps??=Array.from({length:7},(_,i)=>{
  const a=i*Math.PI*2/7,x=Math.round(graveSite.x+Math.cos(a)*190),y=Math.round(graveSite.y+Math.sin(a)*150);
  return fitNativeCemeteryProp({id:graveSite.id+':gravestone:'+i,kind:'gravestone',x,y,rootY:y,size:44,
   _biome:'graveyard',nativeSource:'graveyard',graveyard:true,procedural:true,variant:i%4,hp:48,maxHp:48,
   graveyardFootprint:{x:x-16,y:y-8,w:32,h:12}});
 });
}
export function nativeWildBiome(d,x,y){
 const center=wildLandsGround(d,x,y);
 // Frostmere's blended borders can soften the edge from the outside, while
 // the terrain, props, snow overlays and movement agree inside the estate.
 if(d.activeRoom||center==='mountain'||center==='house'||coastalSiteGround(x,y)||tideglassGround(x,y)||wildLandsPaintedBiome(x,y)===center)return center;
 const weights=new Map([[center,2]]);for(const r of [48,112,192,256])for(const [dx,dy]of [[r,0],[-r,0],[0,r],[0,-r]]){const kind=wildLandsGround(d,x+dx,y+dy);if(!['mountain','tideglass'].includes(kind))weights.set(kind,(weights.get(kind)||0)+Math.exp(-r/200));}let value=(forestNoise(x/76,y/76,731)*.8+forestHash(Math.floor(x/12),Math.floor(y/12))*.2)*[...weights.values()].reduce((a,b)=>a+b,0);for(const [kind,w]of weights){value-=w;if(value<=0)return kind;}return center;
}
export function nativeWildWorld(t,x,y,biome=nativeWildBiome(t.design,x,y)){
 if(t.design.activeRoom===HOLLOW_ROOM||biome==='mountain'||biome==='tideglass')return null;
 const cx=Math.floor(x/1600),cy=Math.floor(y/1600),env=biome==='jungle'?'temple':biome==='house'?'forest':biome,key=[t.design.activeRoom||'surface',biome,env,cx,cy].join(':');t.wildNativeWorlds??=new Map();let record=t.wildNativeWorlds.get(key);if(record)return record;if(railwayStream(t)){streamRegion(t,x,y);return null;}
 const seed=42+cx*71+cy*179,world=generateWorld(seed,env,{authored:false,featuredTrees:false});Object.assign(world,{seed,environment:env,generatedEnvironment:env,mapMode:'classic',phase:'play',bloom:3,time:0,players:[],enemies:[],spriteLibrary:{}});
 // The large world's river/coast stays authoritative; native dry ground fills its land.
 if(env==='beach')world.terrain=world.terrain.map(k=>['water','shallow','wood','bridge'].includes(k)?'sand':k);
 if(env==='swamp')world.terrain=world.terrain.map(k=>['water','shallow','bridge'].includes(k)?'mud':k);
 if(t.design.activeRoom)world.terrain=world.terrain.map((kind,i)=>{const x=cx*1600+i%50*32+16,y=cy*1600+Math.floor(i/50)*32+16;return Math.abs(x-8000)<250&&y>5320&&y<5700?(env==='shadow'?'shadow_soil':'cave_floor'):kind;});
 record={world,cx,cy,biome,props:world.scenery.map(o=>fitNativeCemeteryProp({...o,id:'wild-native:'+key+':'+o.id,x:o.x+cx*1600,y:o.y+cy*1600,rootY:(o.rootY??o.y+o.size*(o.kind==='snow_tree'||o.kind==='tree'?.35:.19))+cy*1600,_biome:biome,nativeSource:env,...(o.graveyardFootprint?{graveyardFootprint:{...o.graveyardFootprint,x:o.graveyardFootprint.x+cx*1600,y:o.graveyardFootprint.y+cy*1600}}:{})}))};t.wildNativeWorlds.set(key,record);return record;
}
export function nativeWildTile(t,x,y){const r=nativeWildWorld(t,x,y);if(!r)return 'snow';const tx=Math.max(0,Math.min(49,Math.floor(x/32)-r.cx*50)),ty=Math.max(0,Math.min(49,Math.floor(y/32)-r.cy*50));return r.world.terrain[ty*50+tx];}
function nativeCaveFloorOpen(t,r,tx,ty){
 if(tx>=0&&ty>=0&&tx<50&&ty<50)return r.world.terrain[ty*50+tx]!=='cave_void';
 const x=(r.cx*50+tx)*32+16,y=(r.cy*50+ty)*32+16;
 if(x<0||y<0||x>=t.design.width||y>=t.design.height)return false;
 if(!t.design.activeRoom&&nativeWildBiome(t.design,x,y)!=='caverns')return true;
 const adjacent=nativeWildWorld(t,x,y,'caverns');
 if(!adjacent)return true;
 const ax=Math.floor(x/32)-adjacent.cx*50,ay=Math.floor(y/32)-adjacent.cy*50;
 return adjacent.world.terrain[ay*50+ax]!=='cave_void';
}
const iceCardinal=[[0,-1],[1,0],[0,1],[-1,0]];
function nativeSnowNeighbor(t,r,x,y,tx,ty,dx,dy){
 const localX=tx+dx,localY=ty+dy;
 if(localX>=0&&localX<50&&localY>=0&&localY<50)return r.world.terrain[localY*50+localX]==='snow';
 const wx=x+dx*32,wy=y+dy*32;
 const next=nativeWildWorld(t,wx+16,wy+16,'ice');
 if(!next)return false;
 return next.world.terrain[(wy/32-next.cy*50)*50+wx/32-next.cx*50]==='snow';
}
export function nativeIceSnowEdges(t,x,y,record=nativeWildWorld(t,x+16,y+16,'ice')){
 if(!record)return [false,false,false,false];
 const tx=x/32-record.cx*50,ty=y/32-record.cy*50;
 return iceCardinal.map(([dx,dy])=>nativeSnowNeighbor(t,record,x,y,tx,ty,dx,dy));
}
export function drawNativeWildTile(c,t,x,y,originX,originY,scale){
 const biome=nativeWildBiome(t.design,x+16,y+16);if(t.design.activeRoom===HOLLOW_ROOM||['mountain','forest','house','jungle','beach'].includes(biome)||!t.design.activeRoom&&wildLandsPathAt(x+16,y+16)||wildLandsSurface(t.design,x+16,y+16)!=='grass')return;
 const r=nativeWildWorld(t,x+16,y+16,biome);if(!r)return;const lx=x-r.cx*1600,ly=y-r.cy*1600,tx=Math.floor(lx/32),ty=Math.floor(ly/32),kind=r.world.terrain[ty*50+tx];c.save();c.scale(1/scale,1/scale);c.translate(x-originX-lx,y-originY-ly);c.beginPath();c.rect(lx,ly,32,32);c.clip();
 if(biome==='caverns'&&kind==='cave_floor'){
  const edges=caveFloorEdges(tx,ty,(nx,ny)=>nativeCaveFloorOpen(t,r,nx,ny));
  // The stone field spans region boundaries, including the walkable portal approach.
  drawCaveFloorCell(c,lx,ly,32,42,r.cx*50+tx,r.cy*50+ty,edges);
 }else if(biome==='shadow'){
  // Sample one continuous stone field while keeping local Shadow geometry.
  const shadowFloorMaterial={x:r.cx*1600,y:r.cy*1600,seed:42};
  drawRealmGround(c,r.world,{sx:tx,sy:ty,ex:tx,ey:ty,shadowFloorMaterial});
 }else if(biome==='ice'){
  if(kind==='snow')drawNativeSnow(c,lx,ly,x,y);
  else{
   if(!drawBiomeTile(c,r.world,kind,lx,ly))drawWinterTile(c,kind,lx,ly);
   if(kind==='ice')drawIceSnowShelf(c,lx,ly,x,y,nativeIceSnowEdges(t,x,y,r));
  }
 }else if(['swamp','caverns'].includes(biome))drawRealmGround(c,r.world,{sx:tx,sy:ty,ex:tx,ey:ty});
 else if(biome==='graveyard')drawGraveyardGround(c,r.world,{sx:tx,sy:ty,ex:tx+1,ey:ty+1},cemeteryScale,{x:r.cx*1600,y:r.cy*1600});
 c.restore();
}
function collisionLayer(t){const layer=t.design.activeRoom||'surface';if(t.nativeCollisionRoom!==layer){t.nativeCollisionRoom=layer;t.nativeCollision=new Map();t.nativePopulated=new Set();t.nativeCollisionAreas=new Set();delete t.nativeWheatCleared;delete t.nativeClearingProps;}}
const nativeBucket=p=>Math.floor(p.x/256)+':'+Math.floor((p.rootY??p.y)/256);
function applyNativePropPosition(prop,position){
 const dx=position.x-prop.x,dy=position.y-prop.y;
 prop.x=position.x;prop.y=position.y;
 if(Number.isFinite(prop.rootY))prop.rootY+=dy;
 if(prop.graveyardFootprint){prop.graveyardFootprint.x+=dx;prop.graveyardFootprint.y+=dy;}
}
export function updateNativePropPlacement(t,prop,position){
 (t.liveEditNativePlacements??={})[prop.id]=position;
 const oldKey=nativeBucket(prop),oldList=t.nativeCollision?.get(oldKey),index=oldList?.indexOf(prop)??-1;
 applyNativePropPosition(prop,position);
 if(index>=0&&nativeBucket(prop)!==oldKey){
  oldList.splice(index,1);
  if(!oldList.length)t.nativeCollision.delete(oldKey);
  indexNativeProps(t,[prop]);
 }
 if(t.nativeWheatCleared?.delete(prop)||t.nativeClearingProps?.delete(prop))indexNativeProps(t,[prop]);
 delete t.nativeFarView;
}
function indexNativeProps(t,props){
 for(const p of props){
  if(p.kind==='gravestone'){
   const damage=t.nativeGravestoneDamage?.[p.id];
   if(Number.isFinite(damage)&&damage>0){p.hp=Math.max(0,p.maxHp-damage);p.harvest=p.maxHp-p.hp;p.depleted=p.hp===0;}
  }
  const bucket=nativeBucket(p);
  if(!t.nativeCollision.has(bucket))t.nativeCollision.set(bucket,[]);
  t.nativeCollision.get(bucket).push(p);
 }
}
function piratePlankApproach(x,y){
 if(Math.abs(x-PIRATE_SHIP_BERTH.x)>380||Math.abs(y-PIRATE_SHIP_BERTH.y)>440)return false;
 const {plank}=PIRATE_SHIP_LAYOUT,local=pirateShipLocal(PIRATE_SHIP_BERTH,{x,y});
 return Math.abs(local.x-plank.x)<plank.width/2+35&&local.y>plank.farY-27&&local.y<plank.farY+105;
}
export function nativeWildProps(t,bounds){collisionLayer(t);if(t.design.activeRoom===HOLLOW_ROOM)return t.visibleForest=[];const farView=(t.viewZoom||1)<.3,farKey=farView?[t.design.activeRoom||'surface',(t.viewZoom||1)<.12?256:128,t.terrainStream?.generation||0,...['left','top','right','bottom'].map(k=>Math.floor(bounds[k]/128))].join(':'):null;if(farKey&&t.nativeFarView?.key===farKey){t.visibleForest=t.nativeFarView.props;return t.visibleForest;}
 const site=t.design.wildLands&&!t.design.activeRoom?cemeterySiteProps(t):[];
 const result=[...wildPortalRuins(t.design),...site].filter(o=>o.x>bounds.left-160&&o.x<bounds.right+160&&o.y>bounds.top-160&&o.y<bounds.bottom+160),far=(t.viewZoom||1)<.3;t.nativeCollision??=new Map();t.nativePopulated??=new Set();
 if(!far)result.push(...wildWheatProps(t.design,bounds));
 if(site.length&&!t.nativePopulated.has(graveSite.id)){
  indexNativeProps(t,site);t.nativePopulated.add(graveSite.id);
 }
 if(t.design.wildLands&&!t.design.activeRoom){
  const mossbell=t.mossbellScenery??=mossbellScenery();
  if(!t.nativePopulated.has(WILD_SLIME_HOLLOW.id)){
   indexNativeProps(t,mossbell);t.nativePopulated.add(WILD_SLIME_HOLLOW.id);
  }
  result.push(...mossbell.filter(p=>p.x>bounds.left-220&&p.x<bounds.right+220&&p.rootY>bounds.top-220&&p.rootY<bounds.bottom+300));
 }
 const columns=Math.ceil(t.design.width/1600),rows=Math.ceil(t.design.height/1600);
 for(let cy=Math.max(0,Math.floor((bounds.top-220)/1600));cy<=Math.min(rows-1,Math.floor((bounds.bottom+220)/1600));cy++)for(let cx=Math.max(0,Math.floor((bounds.left-220)/1600));cx<=Math.min(columns-1,Math.floor((bounds.right+220)/1600));cx++){
 t.nativeKinds??=new Map();const kindKey=[t.design.activeRoom||'surface',cx,cy].join(':');let kinds=t.nativeKinds.get(kindKey);if(!kinds){
  kinds=new Set();
  for(const dx of [50,350,650,950,1250,1550])for(const dy of [50,350,650,950,1250,1550]){
   const x=cx*1600+dx,y=cy*1600+dy;
   if(wildLandsSurface(t.design,x,y)==='grass')kinds.add(nativeWildBiome(t.design,x,y));
  }
  t.nativeKinds.set(kindKey,kinds);
 }
 for(const kind of kinds){const record=nativeWildWorld(t,cx*1600+800,cy*1600+800,kind),key=[t.design.activeRoom||'surface',kind,cx,cy].join(':');if(!record)continue;if(!t.nativePopulated.has(key)){
 record.accepted??=record.props.filter(o=>{const y=o.rootY??o.y;if(wildHomesteadYardAt(t.design,o.x,y)||inWildLandmark(t.design,o.x,y,45)||nativeWildBiome(t.design,o.x,y)!==kind||wildLandsSurface(t.design,o.x,y)!=='grass')return false;if(t.design.activeRoom)return Math.hypot(o.x-8000,y-5490)>150;return !mountainLand(o.x,y)&&!mountainTrail(o.x,y,-36)&&!piratePlankApproach(o.x,y)&&(!wildLandsPathAt(o.x,y)||mossbellPathAt(o.x,y))&&!WILD_LANDS_STOPS.some(s=>Math.hypot(s.x-o.x,s.y-y)<700)&&!WILD_LANDS_GATES.some(s=>Math.hypot(s.x-o.x,s.y-y)<240)&&nearestTrainTrack(t.route,o.x,y).distance>Math.max(65,o.kind.includes('tree')?95:65);});
 const surface=t.design.wildLands&&!t.design.activeRoom;
 const scenery=record.accepted.filter(prop=>{
  const edit=t.liveEditNativePlacements?.[prop.id];
  if(edit){applyNativePropPosition(prop,edit);return true;}
  if(surface&&(coastalSiteGround(prop.x,prop.rootY??prop.y)||mossbellClearsScenery(prop)||moonveilClearsScenery(prop)||mossbellPathAt(prop.x,prop.rootY??prop.y)||moonveilPathAt(prop.x,prop.rootY??prop.y))){
   (t.nativeClearingProps??=new WeakSet()).add(prop);
   return false;
  }
  const tree=prop.kind.includes('tree');
  if(surface&&prop.kind!=='forest_ruin'&&wildWheatFieldAt(prop.x,prop.rootY??prop.y,tree?36:12,tree?28:10)){
   // The cultivated ground stays open. Keep the source props available for
   // existing local placement overrides, including those loaded after a visit.
   (t.nativeWheatCleared??=new WeakSet()).add(prop);
   return false;
  }
  return true;
 });
 indexNativeProps(t,scenery);t.nativePopulated.add(key);}
 for(const o of record.accepted||[])if(o.x>bounds.left-220&&o.x<bounds.right+220&&o.y>bounds.top-220&&o.y<bounds.bottom+300&&(!far||o.size>=70&&forestHash(o.x,o.y)<.55)&&!t.nativeWheatCleared?.has(o)&&!t.nativeClearingProps?.has(o))result.push(o);
 }}if(far){const spacing=(t.viewZoom||1)<.12?256:128,groups=new Map();for(const o of result){const key=Math.floor(o.x/spacing)+':'+Math.floor((o.rootY??o.y)/spacing),old=groups.get(key);if(!old||(o.size||0)>(old.size||0))groups.set(key,o);}const lod=[...groups.values()];t.visibleForest=lod;if(farKey)t.nativeFarView={key:farKey,props:lod};return lod;}t.visibleForest=result;return result;
}
// Check accepted world props independently of the current camera. The doorway
// responds only in front of its ground contact.
export function nearbyNativeBayouShrine(t,x,y){
 if(t.nativeCollisionRoom!=='surface'||!t.nativeCollision)return null;
 let shrine=null,closest=Infinity;
 for(let cy=Math.floor((y-64)/256);cy<=Math.floor(y/256);cy++){
  for(let cx=Math.floor((x-44)/256);cx<=Math.floor((x+44)/256);cx++){
   for(const prop of t.nativeCollision.get(cx+':'+cy)||[]){
    if(prop.kind!=='bayou_shrine'||prop.depleted||prop.falling)continue;
    const depth=y-(prop.rootY??prop.y+prop.size*.19),offset=Math.abs(x-prop.x);
    if(depth<5||depth>64||offset>Math.min(44,prop.size*.21))continue;
    const distance=Math.hypot(offset,depth-26);
    if(distance<closest){shrine=prop;closest=distance;}
   }
  }
 }
 return shrine;
}

export function nativeWildBlocked(t,x,y,r=8,from=null){if(!streamRegion(t,x,y,100))return true;collisionLayer(t);if(wildPortalRuins(t.design).some(o=>!o.overhead&&footprintHit(o,null,x,y,r)))return true;
 if(t.design.wildLands&&!t.design.activeRoom&&mossbellCheckpointBlocked(x,y,r))return true;
 if(wildHomesteadYardAt(t.design,x,y,180)&&wildHomestead(t.design).trees.some(o=>!o.depleted&&!o.falling&&footprintHit(o,t.spriteLibrary?.[o.kind],x,y,r,from)))return true;
 const area=Math.floor(x/1600)+':'+Math.floor(y/1600);t.nativeCollisionAreas??=new Set();if(!t.nativeCollisionAreas.has(area)){const visible=t.visibleForest;nativeWildProps(t,{left:x-200,top:y-200,right:x+200,bottom:y+200});t.visibleForest=visible;t.nativeCollisionAreas.add(area);}for(let cy=Math.floor((y-100)/256);cy<=Math.floor((y+100)/256);cy++)for(let cx=Math.floor((x-160)/256);cx<=Math.floor((x+160)/256);cx++)for(const p of t.nativeCollision.get(cx+':'+cy)||[]){if(p.depleted||p.falling)continue;if(p.graveyardFootprint){const b=p.graveyardFootprint;if(Math.hypot(x-Math.max(b.x,Math.min(x,b.x+b.w)),y-Math.max(b.y,Math.min(y,b.y+b.h)))<r)return true;}else if(footprintHit(p,t.spriteLibrary?.[p.kind],x,y,r,from))return true;}return false;
}

export function harvestNativeGravestone(g,p,damage,range){
 const t=g.trainTest;
 if(!t?.design.wildLands||t.design.activeRoom||g.phase!=='play'||g.paused||p.room||p.ui||p.trainRide||p.hp<=0||damage<=0||range<=0)return false;
 const x=p.x,y=p.y,nearSite=Math.hypot(x-graveSite.x,y-graveSite.y)<190+range;
 if(!nearSite&&nativeWildBiome(t.design,x,y)!=='graveyard')return false;
 nativeWildBlocked(t,x,y,0);
 const candidates=[];
 for(let cy=Math.floor((y-range)/256);cy<=Math.floor((y+range)/256);cy++){
  for(let cx=Math.floor((x-range)/256);cx<=Math.floor((x+range)/256);cx++){
   for(const prop of t.nativeCollision?.get(cx+':'+cy)||[])if(prop.wildCemeteryScale&&prop.kind==='gravestone')candidates.push(prop);
  }
 }
 const stone=nearestGravestone(candidates,p,range,0);
 if(!stone)return false;
 chipGravestone(g,p,stone,damage,t.time);
 (t.nativeGravestoneDamage??={})[stone.id]=stone.harvest;
 g.persist?.();return true;
}

export function nativeWildIceMotion(g,p,mx,my,speed,dt){const t=g.trainTest;if(!t.design.wildLands||nativeWildBiome(t.design,p.x,p.y)!=='ice'||p.dashTime||p.jumpHeight>0||p.wingHover){p.slideX=p.slideY=0;return {dx:mx*speed*dt,dy:my*speed*dt};}const tile=nativeWildTile(t,p.x,p.y),index=Math.floor(p.y/32)*50+Math.floor(p.x/32);return iceMotion({generatedEnvironment:'ice',terrain:{[index]:tile},snowDepth:0},p,mx,my,speed,dt);}
export function nearbyNativeIce(g,p){return g.trainTest?.design.wildLands&&(g.scenery||[]).find(o=>o._biome==='ice'&&!o.used&&['winter_cache','frost_shrub'].includes(o.kind)&&Math.hypot(p.x-iceBase(o).x,p.y+14-iceBase(o).y)<48);}
export function interactNativeIce(g,p){if(!nearbyNativeIce(g,p))return false;const view=g.trainTest.iceInteractionView??=Object.create(g);view.generatedEnvironment='ice';return interactIce(view,p);}

const portalRuins=new WeakMap();
export function wildPortalRuins(d){if(!d.wildLands||d.activeRoom)return [];let props=portalRuins.get(d);if(!props){props=WILD_LANDS_GATES.filter(gate=>gate.id!==HOLLOW_ROOM).flatMap(gate=>[[-105,52,82],[105,52,96],[0,252,28]].map(([dx,width,height],i)=>({id:gate.id+':portal-ruin:'+i,kind:'forest_ruin',x:gate.x+dx,y:gate.y-(dx===0?112:0),rootY:gate.y-(dx===0?112:0),width,depth:28,height,size:100,seed:31+dx,procedural:true,grassCap:dx!==0,overhead:dx===0,_biome:'forest'})));portalRuins.set(d,props);}return props;}
