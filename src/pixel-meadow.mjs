import {forestHash,forestNoise,routeDistance,clearingDistance,forestPavingAt} from './forest-landscape.mjs';
import {boundlessRegionPlan,regionRouteDistance} from './boundless-generation.mjs';
export const MEADOW_CHUNK=256;
export function meadowTerrain(g,x,y){
 const tx=Math.floor(x/32),ty=Math.floor(y/32);
 if(tx>=0&&ty>=0&&tx<50&&ty<50)return g.terrain[ty*50+tx];
 if(g.mapMode!=='boundless')return null;
 const p=boundlessRegionPlan(g,Math.floor(tx/50),Math.floor(ty/50));
 return p.terrain[((ty%50+50)%50)*50+(tx%50+50)%50];
}
export function meadowAllowed(g,x,y,margin=0){
 if(meadowTerrain(g,x,y)!=='grass')return false;
 if(x>=0&&x<1600&&y>=0&&y<1600){
  if(routeDistance(g.forestLandscape,x,y)<29+margin||clearingDistance(x,y,g.seed)<.97||forestPavingAt(g.forestLandscape,x,y))return false;
  if(g.forestLandscape.landmarks?.some(l=>Math.hypot((x-l.x)/130,(y-l.y)/100)<.86))return false;
 }else if(g.mapMode==='boundless'){
  const p=boundlessRegionPlan(g,Math.floor(x/1600),Math.floor(y/1600));
  if(regionRouteDistance(p,x,y)<56+margin)return false;
 }
 return true;
}
export function meadowTerrainKey(g,x,y){
 let key='';for(let ty=y/32;ty<(y+256)/32;ty++)for(let tx=x/32;tx<(x+256)/32;tx++)key+=meadowTerrain(g,tx*32+16,ty*32+16)+',';
 return key;
}
export function paintPixelMeadow(g,x,y){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=128;
 const c=canvas.getContext('2d'),colors=['#45672f','#537535','#62813c','#718f46'];
 for(let dy=0;dy<256;dy+=4)for(let dx=0;dx<256;dx+=4){
  const wx=x+dx,wy=y+dy;
  if(!meadowAllowed(g,wx+2,wy+2))continue;
  const n=forestNoise(wx/130,wy/130,g.seed)*.82+forestNoise(wx/23,wy/23,g.seed+91)*.18;
  const index=Math.min(3,Math.floor(n*4));c.fillStyle=colors[index];c.fillRect(dx/2,dy/2,2,2);
  // Grouped edge teeth share the patch color, rather than peppering every cell.
  if(forestHash(wx,g.seed+wy)>.88&&meadowAllowed(g,wx+2,wy-2))c.fillRect(dx/2,dy/2-1,2,1);
 }
 return canvas;
}
