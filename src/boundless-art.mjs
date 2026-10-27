import {boundlessMap,boundlessPavingAt,boundlessRegionPlan,regionRouteDistance} from './boundless-generation.mjs';
import {forestNoise} from './forest-landscape.mjs';
const greens=['#304f3b','#3b5940','#466344','#52704a','#627d4e'];
/** World-coordinate clusters, not empty/default tiles beyond the old board. */
export function drawBoundlessGrass(c,g,x,y,offsetX=0,offsetY=0){
 for(let dy=0;dy<32;dy+=4)for(let dx=0;dx<32;dx+=4){const n=forestNoise((x+dx)/180,(y+dy)/180,g.seed||0);c.fillStyle=greens[Math.min(4,Math.floor(n*5))];c.fillRect(x+dx-offsetX,y+dy-offsetY,4,4);}
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
  const cell=boundlessPavingAt(g,tx,ty);
  if(biome==='ice'){c.fillStyle='#afc8d0';c.fillRect(x-9,y-1,7,3);c.fillRect(x+4,y+6,7,3);}
  else if(biome==='beach'||biome==='desert'){c.fillStyle=biome==='beach'?'#c7a77788':'#9f7e5377';c.fillRect(x-9,y-1,8,2);c.fillRect(x+3,y+6,9,2);}
  else if(cell){c.fillStyle=biome==='graveyard'?'#999887':cell===2?'#a4ac87':'#879775';c.fillRect(x-7,y-4,13,7);c.fillStyle=biome==='graveyard'?'#b5b19c':'#bbc09a';c.fillRect(x-7,y-4,11,1);}
 }
}
