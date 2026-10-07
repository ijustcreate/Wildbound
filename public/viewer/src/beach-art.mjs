import {beachShore,BEACH_PIER} from './beach-world.mjs';
import {waterAt} from './environment.mjs';
import {drawNativeBeachProp} from './beach-props.mjs';
const hash=(x,y)=>{const n=Math.sin(x*127.1+y*311.7)*43758.5453;return n-Math.floor(n);};
const load=path=>{if(typeof Image==='undefined')return null;const i=new Image();i.src=new URL(path,import.meta.url).href;return i;};
export const beachBackdrop=load('../assets/beach-background-v1.png');
export const BEACH_GROUND_CACHE_LIMIT=40;
const caches=new WeakMap();
export const beachCacheSize=g=>caches.get(g)?.chunks.size||0;
const rect=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,h);};
// Static terrain is cached in viewport-sized chunks; animation is a separate
// bounded pass, never saved particle actors or a full-world image allocation.
export function drawBeachGround(c,g,{sx,sy,ex,ey}){
 let cache=caches.get(g);if(!cache||cache.terrain!==g.terrain||cache.seed!==g.seed){cache={terrain:g.terrain,seed:g.seed,chunks:new Map()};caches.set(g,cache);}
 for(let cy=Math.floor(sy/8);cy<Math.ceil(ey/8);cy++)for(let cx=Math.floor(sx/8);cx<Math.ceil(ex/8);cx++){
  const key=cx+':'+cy;let canvas=cache.chunks.get(key);
  if(!canvas){canvas=document.createElement('canvas');canvas.width=canvas.height=256;const cc=canvas.getContext('2d');
   for(let yy=0;yy<256;yy+=4)for(let xx=0;xx<256;xx+=4){
    const x=cx*256+xx,y=cy*256+yy,kind=waterAt(g,x+2,y+2),n=(Math.sin(x*.006)+Math.cos(y*.009)+Math.sin((x+y)*.023)+3)/6;
    const near=y<beachShore(x,g.seed)+70;
    const colors=kind==='water'?['#17677e','#217a8d','#248b99','#309ead']:kind==='shallow'?['#59b9b2','#73c7bc','#8bd5c7','#a5dfcd']:kind==='wood'?['#85634c','#9b7858','#ab8963','#b9976d']:kind==='grass'?['#47694d','#527955','#658553','#78945b']:near?['#c9b88c','#d2c59b','#dfd3aa','#e8ddb5']:['#e2bd82','#e9c68e','#f0d29c','#f5dcad'];
    rect(cc,xx,yy,4,4,colors[Math.min(3,Math.floor(n*4))]);
    const r=hash(x+g.seed,y);if(r>.966&&kind==='sand')rect(cc,xx,yy,2,1,'#fff0ca');
    if(kind==='wood'&&(y%16===0||x%32===0))rect(cc,xx,yy,4,1,'#5d4838');
   }
   if(cache.chunks.size>=BEACH_GROUND_CACHE_LIMIT)cache.chunks.delete(cache.chunks.keys().next().value);cache.chunks.set(key,canvas);
  }
  c.drawImage(canvas,cx*256,cy*256);
 }
 const t=g.time||0;
 for(let y=sy;y<ey;y++)for(let x=sx;x<ex;x++){
  const wx=x*32,wy=y*32,kind=waterAt(g,wx+16,wy+16);
  if(g.phase==='won'||g.bloom<3&&Math.hypot(wx+16-800,wy+16-800)>g.bloom*430){rect(c,wx,wy,32.5,32.5,'#888a8e');continue;}
  if(!['water','shallow'].includes(kind))continue;
  const shimmer=Math.sin(t*1.4+x*.8+y*.6);
  rect(c,wx+4+(shimmer+1)*3,wy+10,10+hash(x,y)*9,1,kind==='water'?'#a0e8e455':'#eeffdf80');
  rect(c,wx+15,wy+25,9,1,'#b9f0e63b');
  // White surf advances inside shallow water, never masks the walkable beach.
  if(kind==='shallow'){
   if(waterAt(g,wx+16,wy+48)==='sand'){const off=4+((t*7+x*2)%23);rect(c,wx,wy+off,32,3,'#f6f7dcbb');rect(c,wx+3,wy+off-3,25,1,'#d5f8e7aa');}
   if(waterAt(g,wx+48,wy+16)==='sand')rect(c,wx+26+Math.sin(t+x)*2,wy+3,2,24,'#fff8db99');
  }
 }
 // Continuous coherent wave crests, with pixel steps instead of tile borders.
 for(let row=0;row<4;row++)for(let x=Math.max(0,sx*32);x<Math.min(1600,ex*32);x+=4){
  const y=beachShore(x,g.seed)-42-row*70+Math.sin(x*.022+t*.9+row)*5+Math.sin(t*.6+row)*8;
  if(y<sy*32||y>ey*32||waterAt(g,x,y)==='wood'||g.bloom<3&&Math.hypot(x-800,y-800)>g.bloom*430)continue;
  rect(c,x,y,4,row===0?3:1,row===0?'#f8f5d9cc':'#a5e8de66');
 }
 const p=BEACH_PIER;
 // Rails and piling caps leave the center lane entirely walkable.
 if(ex*32>p.x-12&&sx*32<p.x+p.w+12&&sy*32<p.y+p.h&&ey*32>p.y){
  for(const x of [p.x-5,p.x+p.w+1])for(let y=p.y+16;y<p.y+p.h-16;y+=48){rect(c,x,y-12,5,15,'#5d4937');rect(c,x-1,y-14,7,3,'#d9b77d');}
  rect(c,p.x-4,p.y-8,p.w+8,3,'#dfc194');
 }
}
export function drawBeachProp(c,p,time,g){
 return drawNativeBeachProp(c,p,time);
}
export function drawBeachGulls(c,g,visible){
 if(g.generatedEnvironment!=='beach'||g.phase==='won')return;
 const t=g.time||0;
 for(let i=0;i<7;i++){const x=140+((i*231+t*(i%2?11:16))%1310),y=190+Math.sin(t*.24+i)*54+i%3*55,p={x,y};
  if(!visible(p)||g.bloom<3&&Math.hypot(x-800,y-800)>g.bloom*430)continue;
  const flap=Math.round(Math.sin(t*4+i)*3);rect(c,x-5,y-flap,4,1,'#fff8e4');rect(c,x-2,y,4,2,'#f5f4df');rect(c,x+3,y-flap,4,1,'#fff8e4');rect(c,x,y+2,2,1,'#6d94a0');
 }
}
