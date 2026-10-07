import {waterAt} from './environment.mjs';
const wet=k=>['water','shallow','bridge','floodbridge'].includes(k);
export function riverCorners(terrain,tx,ty){
  const at=(dx,dy)=>tx+dx<0||tx+dx>=50||ty+dy<0||ty+dy>=50?'grass':typeof terrain==='function'?terrain(tx+dx,ty+dy):terrain[(ty+dy)*50+tx+dx];
  return [[-1,-1],[1,-1],[1,1],[-1,1]].map(([dx,dy])=>({dx,dy,a:at(dx,0),b:at(0,dy),diagonal:at(dx,dy)}));
}
export function bankCut(u,v,corner){
  if(!wet(corner.a)&&!wet(corner.b))return u<12&&v<12&&(u-12)**2+(v-12)**2>144;
  if(wet(corner.a)&&wet(corner.b)&&!wet(corner.diagonal))return u*u+v*v<64;
  return false;
}
// Two-pixel corner variants retain the chunky art while joining diagonal banks.
export function clipRiverTile(c,g,x,y){
  const corners=riverCorners((tx,ty)=>waterAt(g,tx*32+16,ty*32+16),x/32,y/32);c.beginPath();
  for(let py=0;py<32;py+=2)for(let px=0;px<32;px+=2){
    if(corners.some(k=>bankCut(k.dx<0?px+1:31-px,k.dy<0?py+1:31-py,k)))continue;
    c.rect(x+px,y+py,2,2);
  }c.clip();
}
export function drawDepthCorners(c,g,x,y){
  for(const k of riverCorners((tx,ty)=>waterAt(g,tx*32+16,ty*32+16),x/32,y/32)){
    if(k.a!=='shallow'||k.b!=='shallow')continue;
    for(let v=0;v<14;v+=2)for(let u=0;u<14;u+=2){const d=Math.hypot(u+1,v+1);if(d>14)continue;
      c.fillStyle=d>11?'#8fe5c536':'#8fe5c58c';c.fillRect(x+(k.dx<0?u:30-u),y+(k.dy<0?v:30-v),2,2);
    }
  }
}
