import {beachShore,BEACH_PIER} from './beach-world.mjs';
import {waterAt} from './environment.mjs';
import {drawNativeBeachProp} from './beach-props.mjs';
import {createBeachSurfChunk,paintBeachSurfChunk} from './beach-surf.mjs';
const load=path=>{if(typeof Image==='undefined')return null;const i=new Image();i.src=new URL(path,import.meta.url).href;return i;};
export const beachBackdrop=load('../assets/beach-background-v1.png');
export const BEACH_GROUND_CACHE_LIMIT=40;
const caches=new WeakMap();
export const beachCacheSize=g=>caches.get(g)?.chunks.size||0;
const rect=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,h);};

// Sample the same stable shoreline and depth field that the ground raster uses.
// The advancing foam is decorative and does not change the water beneath actors.
export function beachVisualWaterDepth(g,x,y){
 const chunk=caches.get(g)?.chunks.get(Math.floor(x/256)+':'+Math.floor(y/256));
 if(!chunk)return null;
 if(!chunk.surface)return 0;
 const col=Math.floor((x-chunk.x0)/2),row=Math.floor((y-chunk.y0)/2);
 const index=row*chunk.surface.width+col;
 const cover=Math.max(0,Math.min(1,-chunk.coastDistance[index]/13));
 return cover*Math.min(1,.12+chunk.oceanDepth[index]*1.25);
}

function beachBedAt(g,x,y){
 const kind=waterAt(g,x,y);
 if(kind!=='bridge'&&kind!=='floodbridge'&&kind!=='wood')return kind;
 const shore=beachShore(x,g.seed);
 return y<shore-62?'water':y<shore+18?'shallow':'sand';
}

function drawRockWash(c,g,left,top,right,bottom){
 const time=g.time||0;
 for(const rock of g.scenery||[]){
  if(rock.kind!=='rock'||!rock.coastal||rock.depleted)continue;
  const x=rock.x,y=rock.rootY??rock.y+rock.size*.19;
  if(x<left-40||x>right+40||y<top-20||y>bottom+20)continue;
  const kind=waterAt(g,x,y);
  if(kind!=='shallow'&&kind!=='water')continue;
  const tide=(1+Math.sin(time*.91+x*.068+y*.012))*.5;
  const rx=(rock.beachFootprint?.[0]??rock.size*.24)+4+tide*7;
  const ry=(rock.beachFootprint?.[1]??rock.size*.10)+3+tide*4;
  for(let i=0;i<38;i++){
   const angle=i*Math.PI/19+Math.sin(time*.62)*.11;
   const crest=Math.sin(angle*7+x)+Math.sin(angle*4-time*1.1);
   if(crest<-.42-tide*.85)continue;
   const wx=x+Math.cos(angle)*(rx+crest),wy=y+Math.sin(angle)*(ry+crest*.7);
   const water=waterAt(g,wx,wy);
   if(water!=='shallow'&&water!=='water')continue;
   rect(c,wx,wy,crest>.7?5:3,tide>.62?2:1,crest>.45?'#fff7d5b5':'#f5efbe70');
  }
 }
}

// The ground and sampled depth stay cached, while the tide advances on a
// separate low-resolution layer shared by every viewport looking at the beach.
export function drawBeachGround(c,g,{sx,sy,ex,ey}){
 let cache=caches.get(g);
 if(!cache||cache.terrain!==g.terrain||cache.seed!==g.seed||cache.mapMode!==g.mapMode||cache.weather!==g.weather?.type){
  cache={terrain:g.terrain,seed:g.seed,mapMode:g.mapMode,weather:g.weather?.type,chunks:new Map()};
  caches.set(g,cache);
 }
 const time=g.time||0;
 const nativeCoast=g.mapMode==='boundless'?null:x=>x>=16&&x<=1584?beachShore(x,g.seed)+18:NaN;
 for(let cy=Math.floor(sy/8);cy<Math.ceil(ey/8);cy++)for(let cx=Math.floor(sx/8);cx<Math.ceil(ex/8);cx++){
  const key=cx+':'+cy;
  let chunk=cache.chunks.get(key);
  if(!chunk){
   chunk=createBeachSurfChunk(cx*256,cy*256,256,(x,y)=>beachBedAt(g,x,y),g.seed,nativeCoast);
   if(cache.chunks.size>=BEACH_GROUND_CACHE_LIMIT)cache.chunks.delete(cache.chunks.keys().next().value);
  }else{
   cache.chunks.delete(key);
  }
  cache.chunks.set(key,chunk);
  c.drawImage(chunk.ground,chunk.x0,chunk.y0);
  if(chunk.surface){
   paintBeachSurfChunk(chunk,time);
   c.drawImage(chunk.surface,chunk.x0,chunk.y0,256,256);
  }
 }
 drawRockWash(c,g,sx*32,sy*32,ex*32,ey*32);
 if(g.phase==='won'||g.mapMode!=='boundless'&&g.bloom<3){
  for(let y=sy;y<ey;y++)for(let x=sx;x<ex;x++){
   const wx=x*32,wy=y*32;
   if(g.phase==='won'||Math.hypot(wx+16-800,wy+16-800)>g.bloom*430)rect(c,wx,wy,32.5,32.5,'#888a8e');
  }
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
  if(!visible(p)||g.mapMode!=='boundless'&&g.bloom<3&&Math.hypot(x-800,y-800)>g.bloom*430)continue;
  drawBeachGull(c,p,t,i);
 }
}
export function drawBeachGull(c,{x,y},time,phase=0){
 const flap=Math.round(Math.sin(time*4+phase)*3);rect(c,x-5,y-flap,4,1,'#fff8e4');rect(c,x-2,y,4,2,'#f5f4df');rect(c,x+3,y-flap,4,1,'#fff8e4');rect(c,x,y+2,2,1,'#6d94a0');
}
