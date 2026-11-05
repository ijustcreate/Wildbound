import {railwayStream,streamRegion} from './railway-stream.mjs';
import {inWildLandmark} from './wild-landmark-buildings.mjs';
import {generateWorld,footprintHit} from './world.mjs';
import {forestNoise,forestHash} from './forest-landscape.mjs';
import {drawBiomeTile} from './biome-art.mjs';
import {drawWinterTile,iceMotion,interactIce,iceBase} from './ice-world.mjs';
import {drawRealmGround} from './realm-art.mjs';
import {drawBeachGround} from './beach-art.mjs';
import {drawGraveyardGround} from './graveyard-art.mjs';
import {wildLandsGround,wildLandsSurface,WILD_LANDS_STOPS,WILD_LANDS_GATES} from './wild-lands-world.mjs';
import {wildLandsPathAt} from './wild-lands-geography.mjs';
import {nearestTrainTrack} from './train-track.mjs';
export function nativeWildBiome(d,x,y){
 const center=wildLandsGround(d,x,y);if(d.activeRoom)return center;const weights=new Map([[center,2]]);for(const r of [48,112,192,256])for(const [dx,dy]of [[r,0],[-r,0],[0,r],[0,-r]]){const kind=wildLandsGround(d,x+dx,y+dy);weights.set(kind,(weights.get(kind)||0)+Math.exp(-r/200));}let value=(forestNoise(x/76,y/76,731)*.8+forestHash(Math.floor(x/12),Math.floor(y/12))*.2)*[...weights.values()].reduce((a,b)=>a+b,0);for(const [kind,w]of weights){value-=w;if(value<=0)return kind;}return center;
}
export function nativeWildWorld(t,x,y,biome=nativeWildBiome(t.design,x,y)){
 const cx=Math.floor(x/1600),cy=Math.floor(y/1600),env=biome==='jungle'?'temple':biome==='house'?'forest':biome,key=[t.design.activeRoom||'surface',biome,env,cx,cy].join(':');t.wildNativeWorlds??=new Map();let record=t.wildNativeWorlds.get(key);if(record)return record;if(railwayStream(t)){streamRegion(t,x,y);return null;}
 const seed=42+cx*71+cy*179,world=generateWorld(seed,env,{authored:false});Object.assign(world,{seed,environment:env,generatedEnvironment:env,mapMode:'classic',phase:'play',bloom:3,time:0,players:[],enemies:[],spriteLibrary:{}});
 // The large world's river/coast stays authoritative; native dry ground fills its land.
 if(env==='beach')world.terrain=world.terrain.map(k=>['water','shallow','wood','bridge'].includes(k)?'sand':k);
 if(env==='swamp')world.terrain=world.terrain.map(k=>['water','shallow','bridge'].includes(k)?'mud':k);
 if(t.design.activeRoom)world.terrain=world.terrain.map((kind,i)=>{const x=cx*1600+i%50*32+16,y=cy*1600+Math.floor(i/50)*32+16;return Math.abs(x-8000)<250&&y>5320&&y<5700?(env==='shadow'?'shadow_soil':'cave_floor'):kind;});
 record={world,cx,cy,biome,props:world.scenery.map(o=>({...o,id:'wild-native:'+key+':'+o.id,x:o.x+cx*1600,y:o.y+cy*1600,rootY:(o.rootY??o.y+o.size*(o.kind==='snow_tree'||o.kind==='tree'?.35:.19))+cy*1600,_biome:biome,nativeSource:env,...(o.graveyardFootprint?{graveyardFootprint:{...o.graveyardFootprint,x:o.graveyardFootprint.x+cx*1600,y:o.graveyardFootprint.y+cy*1600}}:{})}))};t.wildNativeWorlds.set(key,record);return record;
}
export function nativeWildTile(t,x,y){const r=nativeWildWorld(t,x,y);if(!r)return 'snow';const tx=Math.max(0,Math.min(49,Math.floor(x/32)-r.cx*50)),ty=Math.max(0,Math.min(49,Math.floor(y/32)-r.cy*50));return r.world.terrain[ty*50+tx];}
export function drawNativeWildTile(c,t,x,y,originX,originY,scale){
 const biome=nativeWildBiome(t.design,x+16,y+16);if(['forest','house','jungle'].includes(biome)||!t.design.activeRoom&&wildLandsPathAt(x+16,y+16)||wildLandsSurface(t.design,x+16,y+16)!=='grass')return;
 const r=nativeWildWorld(t,x+16,y+16,biome);if(!r)return;const lx=x-r.cx*1600,ly=y-r.cy*1600,tx=Math.floor(lx/32),ty=Math.floor(ly/32),kind=r.world.terrain[ty*50+tx];c.save();c.scale(1/scale,1/scale);c.translate(x-originX-lx,y-originY-ly);c.beginPath();c.rect(lx,ly,32,32);c.clip();
 if(biome==='ice'){if(!drawBiomeTile(c,r.world,kind,lx,ly))drawWinterTile(c,kind,lx,ly);}else if(['swamp','caverns','shadow'].includes(biome))drawRealmGround(c,r.world,{sx:tx,sy:ty,ex:tx,ey:ty});else if(biome==='beach')drawBeachGround(c,r.world,{sx:tx,sy:ty,ex:tx+1,ey:ty+1});else if(biome==='graveyard')drawGraveyardGround(c,r.world,{sx:tx,sy:ty,ex:tx+1,ey:ty+1});c.restore();
}
function collisionLayer(t){const layer=t.design.activeRoom||'surface';if(t.nativeCollisionRoom!==layer){t.nativeCollisionRoom=layer;t.nativeCollision=new Map();t.nativePopulated=new Set();t.nativeCollisionAreas=new Set();}}
export function nativeWildProps(t,bounds){collisionLayer(t);const farView=(t.viewZoom||1)<.3,farKey=farView?[t.design.activeRoom||'surface',(t.viewZoom||1)<.12?256:128,t.terrainStream?.generation||0,...['left','top','right','bottom'].map(k=>Math.floor(bounds[k]/128))].join(':'):null;if(farKey&&t.nativeFarView?.key===farKey){t.visibleForest=t.nativeFarView.props;return t.visibleForest;}
 const result=wildPortalRuins(t.design).filter(o=>o.x>bounds.left-160&&o.x<bounds.right+160&&o.y>bounds.top-160&&o.y<bounds.bottom+160),far=(t.viewZoom||1)<.3;t.nativeCollision??=new Map();t.nativePopulated??=new Set();
 for(let cy=Math.max(0,Math.floor((bounds.top-220)/1600));cy<=Math.min(5,Math.floor((bounds.bottom+220)/1600));cy++)for(let cx=Math.max(0,Math.floor((bounds.left-220)/1600));cx<=Math.min(9,Math.floor((bounds.right+220)/1600));cx++){
 t.nativeKinds??=new Map();const kindKey=[t.design.activeRoom||'surface',cx,cy].join(':');let kinds=t.nativeKinds.get(kindKey);if(!kinds){kinds=new Set();for(const dx of[50,800,1550])for(const dy of[50,800,1550])kinds.add(nativeWildBiome(t.design,cx*1600+dx,cy*1600+dy));t.nativeKinds.set(kindKey,kinds);}
 for(const kind of kinds){const record=nativeWildWorld(t,cx*1600+800,cy*1600+800,kind),key=[t.design.activeRoom||'surface',kind,cx,cy].join(':');if(!record)continue;if(!t.nativePopulated.has(key)){
 record.accepted??=record.props.filter(o=>{const y=o.rootY??o.y;if(inWildLandmark(t.design,o.x,y,45)||nativeWildBiome(t.design,o.x,y)!==kind||wildLandsSurface(t.design,o.x,y)!=='grass')return false;if(t.design.activeRoom)return Math.hypot(o.x-8000,y-5490)>150;return !wildLandsPathAt(o.x,y)&&!WILD_LANDS_STOPS.some(s=>Math.hypot(s.x-o.x,s.y-y)<700)&&!WILD_LANDS_GATES.some(s=>Math.hypot(s.x-o.x,s.y-y)<240)&&nearestTrainTrack(t.route,o.x,y).distance>Math.max(65,o.kind.includes('tree')?95:65);});
 for(const o of record.accepted){const bucket=Math.floor(o.x/256)+':'+Math.floor((o.rootY??o.y)/256);if(!t.nativeCollision.has(bucket))t.nativeCollision.set(bucket,[]);t.nativeCollision.get(bucket).push(o);}t.nativePopulated.add(key);}
 for(const o of record.accepted||[])if(o.x>bounds.left-220&&o.x<bounds.right+220&&o.y>bounds.top-220&&o.y<bounds.bottom+300&&(!far||o.size>=70&&forestHash(o.x,o.y)<.55))result.push(o);
 }}if(far){const spacing=(t.viewZoom||1)<.12?256:128,groups=new Map();for(const o of result){const key=Math.floor(o.x/spacing)+':'+Math.floor((o.rootY??o.y)/spacing),old=groups.get(key);if(!old||(o.size||0)>(old.size||0))groups.set(key,o);}const lod=[...groups.values()];t.visibleForest=lod;if(farKey)t.nativeFarView={key:farKey,props:lod};return lod;}t.visibleForest=result;return result;
}
export function nativeWildBlocked(t,x,y,r=8){if(!streamRegion(t,x,y,100))return true;collisionLayer(t);if(wildPortalRuins(t.design).some(o=>!o.overhead&&footprintHit(o,null,x,y,r)))return true;
 const area=Math.floor(x/1600)+':'+Math.floor(y/1600);t.nativeCollisionAreas??=new Set();if(!t.nativeCollisionAreas.has(area)){const visible=t.visibleForest;nativeWildProps(t,{left:x-200,top:y-200,right:x+200,bottom:y+200});t.visibleForest=visible;t.nativeCollisionAreas.add(area);}for(let cy=Math.floor((y-100)/256);cy<=Math.floor((y+100)/256);cy++)for(let cx=Math.floor((x-160)/256);cx<=Math.floor((x+160)/256);cx++)for(const p of t.nativeCollision.get(cx+':'+cy)||[]){if(p.depleted||p.falling)continue;if(p.graveyardFootprint){const b=p.graveyardFootprint;if(Math.hypot(x-Math.max(b.x,Math.min(x,b.x+b.w)),y-Math.max(b.y,Math.min(y,b.y+b.h)))<r)return true;}else if(footprintHit(p,t.spriteLibrary?.[p.kind],x,y,r))return true;}return false;
}

export function nativeWildIceMotion(g,p,mx,my,speed,dt){const t=g.trainTest;if(!t.design.wildLands||nativeWildBiome(t.design,p.x,p.y)!=='ice'||p.dashTime||p.jumpHeight>0||p.wingHover){p.slideX=p.slideY=0;return {dx:mx*speed*dt,dy:my*speed*dt};}const tile=nativeWildTile(t,p.x,p.y),index=Math.floor(p.y/32)*50+Math.floor(p.x/32);return iceMotion({generatedEnvironment:'ice',terrain:{[index]:tile},snowDepth:0},p,mx,my,speed,dt);}
export function nearbyNativeIce(g,p){return g.trainTest?.design.wildLands&&(g.scenery||[]).find(o=>o._biome==='ice'&&!o.used&&['winter_cache','frost_shrub'].includes(o.kind)&&Math.hypot(p.x-iceBase(o).x,p.y+14-iceBase(o).y)<48);}
export function interactNativeIce(g,p){if(!nearbyNativeIce(g,p))return false;const view=g.trainTest.iceInteractionView??=Object.create(g);view.generatedEnvironment='ice';return interactIce(view,p);}

const portalRuins=new WeakMap();
export function wildPortalRuins(d){if(!d.wildLands||d.activeRoom)return [];let props=portalRuins.get(d);if(!props){props=WILD_LANDS_GATES.flatMap(gate=>[[-105,52,82],[105,52,96],[0,252,28]].map(([dx,width,height],i)=>({id:gate.id+':portal-ruin:'+i,kind:'forest_ruin',x:gate.x+dx,y:gate.y-(dx===0?112:0),rootY:gate.y-(dx===0?112:0),width,depth:28,height,size:100,seed:31+dx,procedural:true,overhead:dx===0,_biome:'forest'})));portalRuins.set(d,props);}return props;}
