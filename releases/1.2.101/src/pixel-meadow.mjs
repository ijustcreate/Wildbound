import {railwayMeadowDistance} from './railway-meadow-field.mjs';
import {inWildLandmark} from './wild-landmark-buildings.mjs';
import {wildLandsPathAt} from './wild-lands-geography.mjs';
import {WILD_LANDS_SITES} from './wild-lands-content.mjs';
import {WILD_LANDS_STOPS,wildLandsGround} from './wild-lands-world.mjs';
import {railwaySurface} from './railway-water.mjs';
import {nearestTrainTrack} from './train-track.mjs';
import {forestHash,forestNoise,routeDistance,clearingDistance,forestPavingAt} from './forest-landscape.mjs';
import {boundlessRegionPlan,regionRouteDistance} from './boundless-generation.mjs';
export const MEADOW_CHUNK=256;
export function meadowTerrain(g,x,y){
 if(g.trainTest)return x>=0&&y>=0&&x<g.trainTest.design.width&&y<g.trainTest.design.height?railwaySurface(g.trainTest.design,x,y):null;
 const tx=Math.floor(x/32),ty=Math.floor(y/32);
 if(tx>=0&&ty>=0&&tx<50&&ty<50)return g.terrain[ty*50+tx];
 if(g.mapMode!=='boundless')return null;
 const p=boundlessRegionPlan(g,Math.floor(tx/50),Math.floor(ty/50));
 return p.terrain[((ty%50+50)%50)*50+(tx%50+50)%50];
}
export function meadowAllowed(g,x,y,margin=0){
 if(g.trainTest){const t=g.trainTest,d=t.design;if(d.wildLands&&(inWildLandmark(d,x,y,margin+12)||wildLandsPathAt(x,y)||WILD_LANDS_SITES.some(s=>!s.room&&Math.hypot(s.x-x,s.y-y)<300)||WILD_LANDS_STOPS.some(s=>Math.hypot(s.x-x,s.y-y)<550)||!['forest','jungle','house'].includes(wildLandsGround(d,x,y))||d.activeRoom))return false;if(meadowTerrain(g,x,y)!=='grass')return false;const s=d.station;if(s&&(Math.abs(x-s.x)<s.w/2+44+margin&&Math.abs(y-s.y)<s.h/2+100+margin||Math.abs(x-s.platformX)<s.platformLength/2+20+margin&&Math.abs(y-s.platformY)<s.platformWidth/2+30+margin))return false;if(t.meadowRailField&&margin<=32)return railwayMeadowDistance(t.meadowRailField,x,y)>d.gauge/2+26+margin;t.meadowMask??=new Map();const key=Math.floor(x/16)+':'+Math.floor(y/16);let distance=t.meadowMask.get(key);if(distance===undefined){distance=Math.min(...[t.route,...(t.otherRoutes||[])].map(r=>nearestTrainTrack(r,Math.floor(x/16)*16+8,Math.floor(y/16)*16+8).distance));if(t.meadowMask.size>=16000)t.meadowMask.delete(t.meadowMask.keys().next().value);t.meadowMask.set(key,distance);}return distance>d.gauge/2+26+margin;}

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
 if(g.trainTest)return [g.trainTest.design.width,g.trainTest.design.height,g.trainTest.design.river.x,g.trainTest.design.river.width,JSON.stringify(g.trainTest.design.station),x,y].join(':');
 let key='';const plans=new Map();
 for(let ty=y/32;ty<(y+256)/32;ty++)for(let tx=x/32;tx<(x+256)/32;tx++){
  let terrain=null;
  if(tx>=0&&tx<50&&ty>=0&&ty<50)terrain=g.terrain[ty*50+tx];
  else if(g.mapMode==='boundless'){const cx=Math.floor(tx/50),cy=Math.floor(ty/50),id=cx+','+cy;let plan=plans.get(id);if(!plan){plan=boundlessRegionPlan(g,cx,cy);plans.set(id,plan);}terrain=plan.terrain[((ty%50+50)%50)*50+(tx%50+50)%50];}
  key+=terrain+',';
 }
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

export function paintCoarseMeadow(c,g,bounds){
 const colors=['#45672f','#537535','#62813c','#718f46'];
 for(let y=bounds.top;y<bounds.bottom;y+=16)for(let x=bounds.left;x<bounds.right;x+=16){if(!meadowAllowed(g,x+2,y+2))continue;const n=forestNoise(x/130,y/130,g.seed)*.82+forestNoise(x/23,y/23,g.seed+91)*.18;c.fillStyle=colors[Math.min(3,Math.floor(n*4))];c.fillRect(x,y,16,16);}
}
