import {boundlessMap,boundlessPavingAt,boundlessRegionPlan,regionRouteDistance} from './boundless-generation.mjs';
import {forestNoise} from './forest-landscape.mjs';
const greens=['#365744','#426344','#557346','#668348','#7e944e','#94a358'];
/** World-coordinate clusters, not empty/default tiles beyond the old board. */
export function drawBoundlessGrass(c,g,x,y,offsetX=0,offsetY=0){
 const forest=boundlessMap(g)==='forest',plan=forest?boundlessRegionPlan(g,Math.floor(x/1600),Math.floor(y/1600)):null,step=forest?8:4;
 for(let dy=0;dy<32;dy+=step)for(let dx=0;dx<32;dx+=step){
  const px=x+dx,py=y+dy,large=forestNoise(px/235,py/235,g.seed||0),detail=forestNoise(px/45,py/45,(g.seed||0)+23),clear=plan?Math.hypot((px-plan.hub.x)/175,(py-plan.hub.y)/136):2;
  const n=large*.75+detail*.25+Math.max(0,1-clear)*.28;
  let color=greens[Math.min(5,Math.floor(n*6))];
  if(plan){const path=regionRouteDistance(plan,px,py),edge=27+forestNoise(px/70,py/70,g.seed||0)*16;
   if(path<edge||clear<.92)color=['#89975d','#929d64','#9ca56d'][Math.min(2,Math.floor(detail*3))];
   if(path<edge-10&&clear>1)color=['#8a9270','#969b78','#a4a481'][Math.min(2,Math.floor(detail*3))];
  }
  c.fillStyle=color;c.fillRect(px-offsetX,py-offsetY,step,step);
 }
 const tx=Math.floor(x/32),ty=Math.floor(y/32),seed=(g.seed||0)>>>0;
 const sample=(salt)=>{let n=Math.imul(tx+salt,0x45d9f3b)^Math.imul(ty-salt,0x119de1f3)^seed;n=Math.imul(n^(n>>>16),0x45d9f3b);return((n^(n>>>16))>>>0)/4294967296;};
 // A restrained layer of readable grass tufts, leaf litter and moss breaks up
 // the endless checker of repeated ground tiles without overwhelming actors.
 for(let i=0;i<4;i++){
  const px=2+Math.floor(sample(i*3+1)*27),py=3+Math.floor(sample(i*5+2)*25),tone=sample(i*7+4);
  c.fillStyle=tone>.76?'#74894d':tone<.18?'#293f32':'#5b7445';
  c.fillRect(x+px-offsetX,y+py-offsetY,2+Math.floor(tone*3),2);
  if(i%2===0){c.fillStyle='#87925a';c.fillRect(x+px+2-offsetX,y+py-2-offsetY,1,2);}
 }
}
export function drawBoundlessRoutes(c,g,b){
 if(g.mapMode!=='boundless')return;
 const biome=boundlessMap(g);
 for(let ty=b.sy;ty<b.ey;ty++)for(let tx=b.sx;tx<b.ex;tx++){
  const p=boundlessRegionPlan(g,Math.floor(tx/50),Math.floor(ty/50)),x=tx*32+16,y=ty*32+16;
  if(regionRouteDistance(p,x,y)>28)continue;
  const kind=p.terrain[((ty%50+50)%50)*50+((tx%50+50)%50)];
  if(['water','shallow','quicksand','wood','bridge'].includes(kind))continue;
  if(biome==='forest'&&Math.hypot(x-p.hub.x,y-p.hub.y)>145)continue;
  const cell=boundlessPavingAt(g,tx,ty);
  if(biome==='ice'){c.fillStyle='#afc8d0';c.fillRect(x-9,y-1,7,3);c.fillRect(x+4,y+6,7,3);}
  else if(biome==='beach'||biome==='desert'){c.fillStyle=biome==='beach'?'#c7a77788':'#9f7e5377';c.fillRect(x-9,y-1,8,2);c.fillRect(x+3,y+6,9,2);}
  else if(cell){const jx=Math.round((forestNoise(tx*.73,ty*.83,g.seed)-.5)*10),jy=Math.round((forestNoise(tx*.59,ty*.67,g.seed+17)-.5)*8);c.save();c.translate(jx,jy);c.fillStyle=biome==='graveyard'?'#999887':cell===2?'#a4ac87':'#879775';c.fillRect(x-7,y-4,13,7);c.fillStyle=biome==='graveyard'?'#b5b19c':'#bbc09a';c.fillRect(x-7,y-4,11,1);c.restore();}
 }
}
