import {waterAt} from './environment.mjs';
const wet=k=>['water','shallow','bridge','floodbridge'].includes(k);
export function riverCorners(terrain,tx,ty){
  const at=(dx,dy)=>typeof terrain==='function'?terrain(tx+dx,ty+dy):tx+dx<0||tx+dx>=50||ty+dy<0||ty+dy>=50?'grass':terrain[(ty+dy)*50+tx+dx];
  return [[-1,-1],[1,-1],[1,1],[-1,1]].map(([dx,dy])=>({dx,dy,a:at(dx,0),b:at(0,dy),diagonal:at(dx,dy)}));
}
export function bankCut(u,v,corner){
  if(!wet(corner.a)&&!wet(corner.b))return u<12&&v<12&&(u-12)**2+(v-12)**2>144;
  if(wet(corner.a)&&wet(corner.b)&&!wet(corner.diagonal))return u*u+v*v<64;
  return false;
}
// Two-pixel corner variants retain the chunky art while joining diagonal banks.
// Join adjacent two-pixel cells into row runs once per shoreline variant.
const runCache=new Map(),pathCache=new Map();
export function riverTileRuns(corners){
 const key=corners.map(k=>[k.a,k.b,k.diagonal].map(v=>wet(v)?1:0).join('')).join('');let runs=runCache.get(key);if(runs)return {key,runs};runs=[];
 for(let py=0;py<32;py+=2){let start=-1;for(let px=0;px<=32;px+=2){const inside=px<32&&!corners.some(k=>bankCut(k.dx<0?px+1:31-px,k.dy<0?py+1:31-py,k));if(inside&&start<0)start=px;if(!inside&&start>=0){runs.push([start,py,px-start,2]);start=-1;}}}
 if(runCache.size>=256)runCache.delete(runCache.keys().next().value);runCache.set(key,runs);return {key,runs};
}
export function clipRiverTile(c,g,x,y){
 const corners=riverCorners((tx,ty)=>waterAt(g,tx*32+16,ty*32+16),x/32,y/32),{key,runs}=riverTileRuns(corners);
 if(typeof Path2D!=='undefined'){const id=x+':'+y+':'+key;let path=pathCache.get(id);if(!path){path=new Path2D();for(const [px,py,w,h]of runs)path.rect(x+px,y+py,w,h);if(pathCache.size>=2048)pathCache.delete(pathCache.keys().next().value);pathCache.set(id,path);}c.clip(path);}
 else{c.beginPath();for(const [px,py,w,h]of runs)c.rect(x+px,y+py,w,h);c.clip();}
}
export function drawDepthCorners(c,g,x,y){
  for(const k of riverCorners((tx,ty)=>waterAt(g,tx*32+16,ty*32+16),x/32,y/32)){
    if(k.a!=='shallow'||k.b!=='shallow')continue;
    for(let v=0;v<14;v+=2)for(let u=0;u<14;u+=2){const d=Math.hypot(u+1,v+1);if(d>14)continue;
      c.fillStyle=d>11?'#8fe5c536':'#8fe5c58c';c.fillRect(x+(k.dx<0?u:30-u),y+(k.dy<0?v:30-v),2,2);
    }
  }
}
