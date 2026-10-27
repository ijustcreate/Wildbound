import {forestHash as hash,forestNoise as noise,makePaving} from './forest-landscape.mjs';
import {REALMS,realmWorld} from './realm-layout.mjs';
import {graveyardWorld} from './graveyard-world.mjs';

export const REGION_SIZE=1600,REGION_TILES=50,BOUNDLESS_GENERATION_VERSION=6;
export const REGION_CACHE_LIMIT=64;
// Destination identity is fixed for the expedition. These are generation rules,
// not a random biome bag. Coherent fields use absolute coordinates everywhere.
export const BOUNDLESS_MAP_RULES=Object.freeze({
 swamp:{ground:'marsh_grass',path:'mud',landmark:'bayou',description:'Old-growth islands and winding channels connected by muddy banks and boardwalks.'},
 caverns:{ground:'cave_floor',path:'cave_floor',landmark:'grotto',description:'Organic chambers and mineral grottoes joined by continuous tunnels.'},
 shadow:{ground:'shadow_soil',path:'shadow_soil',landmark:'veil',description:'Twisted clearings and root causeways crossing the dark void.'},
 forest:{ground:'grass',path:'path',landmark:'ruins',description:'River woodland, connected trails, clear crossings and scattered overgrown ruins.'},
 desert:{ground:'sand',path:'sand',landmark:'oasis',description:'Continuous dunes, clustered oases, off-route quicksand and caravan trails.'},
 ice:{ground:'snow',path:'snow',landmark:'glacier',description:'Snowfields, coherent frozen lakes, sheltered routes and glacial outcrops.'},
 temple:{ground:'grass',path:'temple_stone',landmark:'courtyard',description:'Jungle courtyards and ruins joined by stone causeways and river crossings.'},
 beach:{ground:'sand',path:'sand',landmark:'island',description:'One large irregular island, sandy coast, shallow surf, open ocean and smaller offshore islands.'},
 graveyard:{ground:'grass',path:'path',landmark:'cemetery',description:'Separate fenced burial grounds with real open gates, mausoleums and connected woodland paths.'},
 house:{ground:'grass',path:'path',landmark:'garden',description:'Keep the original house; extend estate gardens and woodland walks outside it.'},
});
const caches=new WeakMap();
export const boundlessMap=g=>BOUNDLESS_MAP_RULES[g.generatedEnvironment||g.environment]?g.generatedEnvironment||g.environment:'forest';
export const regionKey=(cx,cy)=>`${cx},${cy}`;
export const regionSeed=(seed,cx,cy)=>Math.floor(hash(seed+cx*73.19,cy*41.73+9.1)*2147483647);
const mod=(x,n)=>((x%n)+n)%n;
const distance=(x,y,a,b)=>{const dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((x-a.x)*dx+(y-a.y)*dy)/(dx*dx+dy*dy||1)));return Math.hypot(x-a.x-dx*t,y-a.y-dy*t);};
export const regionRouteDistance=(p,x,y)=>p.routes.reduce((best,line)=>{for(let i=1;i<line.length;i++)best=Math.min(best,distance(x,y,line[i-1],line[i]));return best;},Infinity);
function cacheFor(g){const signature=`${g.seed}:${boundlessMap(g)}:${g.boundlessGenerationVersion||0}`;let c=caches.get(g);if(!c||c.signature!==signature||c.terrain!==g.terrain){c={signature,terrain:g.terrain,plans:new Map(),paving:null};caches.set(g,c);}return c;}
export const boundlessCacheSize=g=>caches.get(g)?.plans.size||0;
export function clearBoundlessGeneration(g){caches.delete(g);}

/** Signed distance to the island coast, in world pixels; positive means land. */
export function islandCoastDistance(x,y,seed=0){
 const island=(cx,cy,rx,ry,s)=>{const dx=(x-cx)/rx,dy=(y-cy)/ry,a=Math.atan2(dy,dx);const edge=1+.055*Math.sin(a*5+s)+.035*Math.cos(a*9-s)+(noise(x/430,y/430,s)-.5)*.08;return (edge-Math.hypot(dx,dy))*Math.min(rx,ry);};
 let best=island(800,1800,3200,2050,seed*.013);
 const cell=6000,gx=Math.floor(x/cell),gy=Math.floor(y/cell);
 for(let cy=gy-1;cy<=gy+1;cy++)for(let cx=gx-1;cx<=gx+1;cx++){
  const s=regionSeed(seed+991,cx,cy);if(hash(s,8)>.42)continue;
  const ix=cx*cell+1800+hash(s,1)*2400,iy=cy*cell+1800+hash(s,2)*2400;
  if(Math.hypot((ix-800)/1.4,iy-1800)<4600)continue;
  best=Math.max(best,island(ix,iy,650+hash(s,3)*850,480+hash(s,4)*700,s*.001));
 }
 return best;
}
export function naturalBoundlessTile(g,tx,ty){
 const biome=boundlessMap(g),seed=g.seed||0,x=tx*32+16,y=ty*32+16;
 if(biome==='swamp'){
  const channel=Math.abs(Math.sin(x/370+Math.sin(y/640+seed)*1.4));
  return channel<.12?'water':noise(x/260,y/260,seed+83)>.56?'marsh_grass':'shallow';
 }
 if(biome==='caverns')return 'cave_void';
 if(biome==='shadow')return 'shadow_void';
 if(biome==='beach'){
  const coast=islandCoastDistance(x,y,seed);
  return coast< -96?'water':coast<20?'shallow':coast>380&&Math.hypot(x-800,y-800)>660&&noise(x/540,y/540,seed)>.6?'grass':'sand';
 }
 const wet=noise(tx/12,ty/12,seed+37),broad=noise(tx/35,ty/35,seed+119);
 if(biome==='desert')return wet>.79?'shallow':wet>.69&&broad<.3?'quicksand':'sand';
 if(biome==='ice')return wet>.6?'ice':'snow';
 if(biome==='graveyard')return wet>.52?'mud':'grass';
 if(biome==='house')return 'grass';
 // Continue the original pair of forest rivers into negative and distant rows.
 for(const side of [0,1]){
  const region=Math.floor(tx/50),away=region?1:Math.max(0,Math.min(1,(Math.abs(ty-24.5)-24.5)/32));
  const bend=(noise(ty/85,region*.47,seed+side*31)-.5)*8*away;
  const center=region*50+(side?38:11)+Math.sin(ty*.19+seed*.013+side)*2+bend,dx=Math.abs(tx-Math.round(center)),crossing=mod(ty-7,16)<3;
  // A deck spans both shallow banks and meets dry ground, not just the core.
  if(dx<=2&&crossing)return 'bridge';if(dx<=1)return 'water';if(dx<=2)return 'shallow';
 }
 return 'grass';
}
// Neighboring regions compute exactly the same shared edge portal, independent
// of discovery order. The two boundary tiles form one continuous walking lane.
export function regionPortals(g,cx,cy){
 const s=g.seed||0,biome=boundlessMap(g),v=(bx,by)=>by*REGION_SIZE+(12+Math.floor(hash(s+bx*57,by*91)*26))*32+16,h=(bx,by)=>bx*REGION_SIZE+(12+Math.floor(hash(s+by*57+13,bx*91)*26))*32+16;
 const centralV=(bx,by)=>by===0&&(bx===0||bx===1)?biome==='graveyard'?864:bx===0?800:752:v(bx,by);
 const centralH=(bx,by)=>bx===0&&(by===0||by===1)?biome==='graveyard'?by===0?944:800:800:h(bx,by);
 return {west:{x:cx*REGION_SIZE,y:centralV(cx,cy)},east:{x:(cx+1)*REGION_SIZE,y:centralV(cx+1,cy)},north:{x:centralH(cx,cy),y:cy*REGION_SIZE},south:{x:centralH(cx,cy+1),y:(cy+1)*REGION_SIZE}};
}
function routesFor(g,cx,cy,hub,ports,featureOffset){
 const biome=boundlessMap(g),ox=cx*REGION_SIZE+featureOffset.x,oy=cy*REGION_SIZE+featureOffset.y,routes=[];
 const gates=biome==='graveyard'?{west:{x:ox+352,y:oy+864},east:{x:ox+1248,y:oy+864},north:{x:ox+944,y:oy+288},south:{x:ox+800,y:oy+1216}}:null;
 for(const [edge,end]of Object.entries(ports)){
  const start=gates?.[edge]||hub;
  const exit=gates?{x:start.x+(edge==='west'?-96:edge==='east'?96:0),y:start.y+(edge==='north'?-96:edge==='south'?96:0)}:start;
  const line=biome==='swamp'?[start,...[.25,.5,.75].map(t=>{const dx=end.x-start.x,dy=end.y-start.y,l=Math.hypot(dx,dy),bend=Math.sin(t*Math.PI*2)*95;return {x:start.x+dx*t-dy/l*bend,y:start.y+dy*t+dx/l*bend};}),end]:[start,exit,{x:exit.x+(end.x-exit.x)*.45,y:exit.y+(end.y-exit.y)*.55},end];
  if(biome==='beach'&&line.some(p=>islandCoastDistance(p.x,p.y,g.seed)<80))continue;
  routes.push(line);
 }
 if(gates){
  const center={x:ox+800,y:oy+848};
  routes.push([gates.west,center,gates.east],[center,gates.south],
   [center,{x:ox+896,y:oy+848},{x:ox+896,y:oy+320},{x:ox+944,y:oy+320},gates.north]);
 }
 return routes;
}
export function boundlessRegionPlan(g,cx,cy){
 const cached=cacheFor(g).plans.get(regionKey(cx,cy));if(cached)return cached;
 const task=boundlessRegionPlanTask(g,cx,cy);let step;do{step=task.next();}while(!step.done);return step.value;
}
// Terrain rows can be prefetched over several frames without exposing a partial plan.
export function* boundlessRegionPlanTask(g,cx,cy){
 const c=cacheFor(g),key=regionKey(cx,cy);if(c.plans.has(key)){const p=c.plans.get(key);c.plans.delete(key);c.plans.set(key,p);return p;}
 const biome=boundlessMap(g),seed=regionSeed(g.seed||0,cx,cy),ox=cx*REGION_SIZE,oy=cy*REGION_SIZE,central=cx===0&&cy===0;
 const source=!central?(REALMS.includes(biome)?realmWorld(seed,biome,{streamed:true,layout:g.boundlessRealmLayouts?.[biome]??null}):biome==='graveyard'?graveyardWorld(seed):null):null;
 const featureOffset=central||REALMS.includes(biome)?{x:0,y:0}:{x:Math.round((hash(seed,23)-.5)*(biome==='graveyard'?192:384)/32)*32,y:Math.round((hash(seed,29)-.5)*(biome==='graveyard'?128:320)/32)*32};
 const hub={x:ox+800+featureOffset.x,y:oy+(biome==='graveyard'?848:800)+featureOffset.y},portals=regionPortals(g,cx,cy);
 const plan={key,cx,cy,biome,seed,hub,portals,featureOffset,routes:routesFor(g,cx,cy,hub,portals,featureOffset),terrain:[],routeField:[],cemetery:source?.graveyard||null,sourceProps:source?.scenery||null,realmState:source?.realmState||null};
 for(let cell=0;cell<2500;cell++){
  if(cell%50===0)yield;
  const ly=Math.floor(cell/50),lx=cell%50;
  const tx=cx*50+lx,ty=cy*50+ly,i=ly*50+lx,x=tx*32+16,y=ty*32+16;
  const sx=lx-featureOffset.x/32,sy=ly-featureOffset.y/32;
  let tile=central&&g.terrain?.[i]?g.terrain[i]:source&&sx>=0&&sx<50&&sy>=0&&sy<50?source.terrain[sy*50+sx]:naturalBoundlessTile(g,tx,ty);
  if(REALMS.includes(biome)&&(!central||biome==='swamp'&&!g.boundlessRealmLayouts?.swamp?.tiles)){
   const edge=Math.min(lx,ly,49-lx,49-ly)*32;
   if(edge<100+(noise(x/180,y/180,g.seed)-.5)*70)tile=naturalBoundlessTile(g,tx,ty);
  }
  // The old cemetery trail ended at its finite map border. Keep paths
  // inside the burial grounds, and let shared entrances own outer lanes.
  if(biome==='graveyard'&&tile==='path'){
   const bounds=source?.graveyard.bounds||g.graveyard?.bounds;
   if(bounds&&(lx*32+16-featureOffset.x<bounds.x||lx*32+16-featureOffset.x>bounds.x+bounds.w||ly*32+16-featureOffset.y<bounds.y||ly*32+16-featureOffset.y>bounds.y+bounds.h))tile=naturalBoundlessTile(g,tx,ty);
  }
  // Continue existing finite-map edge tiles for two rows before blending
  // into the destination's coherent fields. Beach uses one global coastline.
  if(!central&&biome!=='beach'&&biome!=='graveyard'&&!REALMS.includes(biome)&&g.terrain&&tx>=-2&&tx<52&&ty>=-2&&ty<52){
   const nx=Math.max(0,Math.min(49,tx)),ny=Math.max(0,Math.min(49,ty));tile=g.terrain[ny*50+nx]||tile;
  }
  const route=regionRouteDistance(plan,x,y);plan.routeField.push(route);
  // Keep home rooms/pools and the original pier. Roads never fill ocean.
  const home=central&&biome==='house'&&['wood','water'].includes(tile),pier=central&&biome==='beach'&&['wood','bridge'].includes(tile);
  if(route<52+(REALMS.includes(biome)?(noise(x/150,y/150,g.seed)-.5)*18:0)&&!home&&!pier){
   if(biome==='beach'){if(islandCoastDistance(x,y,g.seed)>40)tile='sand';}
   else if(biome==='swamp'){if(tile==='water')tile='shallow';}
   else if(['water','shallow','bridge'].includes(tile))tile='bridge';
   else tile=BOUNDLESS_MAP_RULES[biome].path;
  }
  if(biome==='temple'&&!central&&Math.hypot(x-hub.x,y-hub.y)<128&&!['water','shallow','bridge'].includes(tile))tile='temple_stone';
  plan.terrain.push(tile);
 }
 if(c.plans.size>=REGION_CACHE_LIMIT)c.plans.delete(c.plans.keys().next().value);
 c.plans.set(key,plan);return plan;
}
export function boundlessGeneratedTile(g,tx,ty){const p=boundlessRegionPlan(g,Math.floor(tx/50),Math.floor(ty/50));return p.terrain[mod(ty,50)*50+mod(tx,50)];}
export function boundlessPavingAt(g,tx,ty){if(boundlessMap(g)==='forest'){const v=hash(tx+(g.seed||0)*.13,ty+71),cluster=noise(tx/5,ty/5,(g.seed||0)+819);return cluster<.42||v<.45?0:v>.87?2:1;}const c=cacheFor(g);c.paving||=makePaving(g.seed||0);return c.paving.cells[mod(ty,24)*24+mod(tx,24)];}
export function translateRegionProps(plan){
 const ox=plan.cx*REGION_SIZE+plan.featureOffset.x,oy=plan.cy*REGION_SIZE+plan.featureOffset.y,prefix=`boundless:${plan.cx}:${plan.cy}:`,props=[];
 const translateRect=r=>({...r,x:r.x+ox,y:r.y+oy});
 for(const original of plan.sourceProps||[]){
  const p=structuredClone(original);p.x+=ox;p.y+=oy;if(Number.isFinite(p.rootY))p.rootY+=oy;p.id=prefix+p.id;p.boundlessRegion=plan.key;
  if(p.plotId)p.plotId=prefix+p.plotId;
  if(p.graveyardFootprint)p.graveyardFootprint=translateRect(p.graveyardFootprint);
  if(p.blockers)p.blockers=p.blockers.map(translateRect);
  // Keep complete fences/gates, but clear route shoulders of tall obstacles.
  if(!['cemetery_fence','cemetery_gate'].includes(p.kind)&&regionRouteDistance(plan,p.x,p.rootY??p.y)<90)continue;
  if(p.realm){const tx=Math.floor((p.x-plan.cx*1600)/32),ty=Math.floor(((p.rootY??p.y)-plan.cy*1600)/32),tile=plan.terrain[ty*50+tx];if(!tile||tile.endsWith('_void')||tile==='water'||tile==='bridge')continue;}
  props.push(p);
 }
 const stoneIds=new Set(props.filter(p=>p.kind==='gravestone').map(p=>p.id));
 const plots=(plan.cemetery?.plots||[]).map(p=>({...p,id:prefix+p.id,stoneId:prefix+p.stoneId,x:p.x+ox,y:p.y+oy,stoneX:p.stoneX+ox,stoneY:p.stoneY+oy,boundlessRegion:plan.key})).filter(p=>stoneIds.has(p.stoneId));
 const mausoleums=props.filter(p=>p.kind==='mausoleum').map(p=>({id:p.id,x:p.x,y:p.rootY,w:p.width,h:p.depth,boundlessRegion:plan.key}));
 return {props,plots,mausoleums};
}
