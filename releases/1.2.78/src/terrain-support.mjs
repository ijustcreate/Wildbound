import {realmFootprint,realmTerrainAt} from './realm-world.mjs';
import {nearbyScenery} from './performance.mjs';
export const VICTORY_CHEST={x:776,y:905,w:48,h:22,height:20};
export const supplyChestShape=chest=>({x:chest.x-14,y:chest.y-7,w:28,h:14,height:14});
export function supplyChestBlocked(g,x,y,radius,elevation,from){
 return (g?.supplyChests||[]).some(chest=>raisedSurfaceBlocked(supplyChestShape(chest),x,y,radius,from,0)&&elevation<supplyChestShape(chest).height);
}
// A falling actor's feet can leave a top before its collision circle clears
// the side. Let it move out (or slide along), but never deeper into that side.
// Only movement supplies `from`; stationary queries and projectiles stay solid.
export function raisedSurfaceBlocked(rect,x,y,radius,from=null,offset=0){
  const distance=(px,py)=>Math.hypot(px-Math.max(rect.x,Math.min(px,rect.x+rect.w)),py-Math.max(rect.y,Math.min(py,rect.y+rect.h)));
  const next=distance(x,y);
  if(next>=radius)return false;
  if(from){
    const previous=distance(from.x,from.y+offset);
    const outside=(px,py)=>px<=rect.x||px>=rect.x+rect.w||py<=rect.y||py>=rect.y+rect.h;
    if(previous<radius&&next>=previous&&outside(from.x,from.y+offset)&&outside(x,y))return false;
  }
  return true;
}
export function stumpShape(p){
  if(p.realm&&p.fallen)return realmFootprint(p);
  if(!p.fallen||!['tree','snow_tree','palm'].includes(p.kind))return null;
  const scale=(p.size||64)/64,base=p.rootY??p.y+(p.size||64)*(p.kind==='palm'?.19:.35);
  const top=p.procedural&&p.kind!=='palm'?-6:-4;
  return {x:p.x-7*scale,y:base+top*scale,w:14*scale,h:7*scale,height:6*scale};
}
export function rockSurface(p){
  if(p?.realm){const b=realmFootprint(p);return b&&b.height<999?b:null;}
  if(!p?.procedural||p.kind!=='rock'||p.falling||p.depleted)return null;
  const scale=(p.size||64)/64,w=Math.max(10,25-(p.chipped||0)*3)*scale;
  return {x:p.x-w/2,y:p.y-24*scale,w,h:20*scale,height:12*scale};
}
export function bridgeAt(g,x,y){
  if(g?.phase==='won')return false;
  const tx=Math.floor(x/32),ty=Math.floor(y/32);
  if(g?.mapMode==='boundless'){const tile=realmTerrainAt(g,tx,ty);return tile==='bridge'||tile==='wood'&&(g.generatedEnvironment||g.environment)==='beach';}
  if(tx<0||ty<0||tx>=50||ty>=50)return false;
  const tile=g?.terrain?.[ty*50+tx];return tile==='bridge'||tile==='wood'&&(g.generatedEnvironment||g.environment)==='beach';
}
export function terrainSupport(g,a,offset=0){
  let height=bridgeAt(g,a.x,a.y)&&!a.underBridge&&!a.swimming?10:0;
  const feet=a.y+(a.kind?offset:0);
  const chest=VICTORY_CHEST;
  if(g?.victoryChest&&a.x>=chest.x&&a.x<=chest.x+chest.w&&feet>=chest.y&&feet<=chest.y+chest.h)height=Math.max(height,chest.height);
  for(const prop of g?.supplyChests||[]){const s=supplyChestShape(prop);if(a.x>=s.x&&a.x<=s.x+s.w&&feet>=s.y&&feet<=s.y+s.h)height=Math.max(height,s.height);}
  for(const p of g?.mapMode==='boundless'?nearbyScenery(g.scenery||[],a.x,feet,32):g?.scenery||[]){const s=stumpShape(p)||rockSurface(p);if(s&&a.x>=s.x&&a.x<=s.x+s.w&&feet>=s.y&&feet<=s.y+s.h)height=Math.max(height,s.height);}
  return height;
}
export function terrainActorDepth(g,a,depth=a.y){
  for(const p of g.mapMode==='boundless'?nearbyScenery(g.scenery||[],a.x,a.y,32):g.scenery||[]){const s=stumpShape(p)||rockSurface(p);if(s&&(a.jumpHeight||a.groundHeight||0)>=s.height&&a.x>=s.x&&a.x<=s.x+s.w&&a.y>=s.y-14&&a.y<=s.y+s.h)depth=Math.max(depth,s.y+s.h+.1);}
  const chest=VICTORY_CHEST;
  if(g.victoryChest&&(a.jumpHeight||a.groundHeight||0)>=chest.height&&a.x>=chest.x&&a.x<=chest.x+chest.w&&a.y>=chest.y&&a.y<=chest.y+chest.h)depth=Math.max(depth,chest.y+chest.h+.1);
  for(const prop of g.supplyChests||[]){const s=supplyChestShape(prop);if((a.jumpHeight||a.groundHeight||0)>=s.height&&a.x>=s.x&&a.x<=s.x+s.w&&a.y>=s.y&&a.y<=s.y+s.h)depth=Math.max(depth,s.y+s.h+.1);}
  return depth;
}
