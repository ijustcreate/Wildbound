import {forestHash} from './forest-landscape.mjs';

export const WHEAT_STEM=2,WHEAT_HEAD=3;

// Stagger narrow stalks across the grass footprint. The two renderers share
// their roots and silhouettes so the crop holds its shape at different zooms.
export function forEachWheatStalk(p,visit){
 const seed=p.tuftSeed??Math.floor(forestHash(p.x,p.y)*10000);
 for(let row=0;row<4;row++)for(let col=0;col<12;col++){
  const i=row*12+col,n=forestHash(seed,i),m=forestHash(i+31,seed);
  const x=-35+col*6+row%2*2+n*4,y=-10+row*6+m*3;
  if((x/39)**2+(y/13)**2>1+n*.15)continue;
  visit(x,y,35+n*16+m*5,(n-.45)*8,2.45+m*1.25,.84+forestHash(seed+67,i)*.24);
 }
}

export function paintWheatPatch(c,p,palette,isBurned){
 const scale=p.size/80,root=p.rootY??p.y+p.size*.4;
 forEachWheatStalk(p,(x,y,height,lean,width,tone)=>{
  if(isBurned(p,p.x+x*scale,root+y*scale))return;
  const earStart=height*.73;
  for(let h=0;h<earStart;h+=3){
   const t=h/height;
   c.fillStyle=palette[t<.25?0:t<.53||tone<.97?1:2];
   c.fillRect(Math.round(x+lean*t*t),Math.round(y-h),2,3);
  }
  for(let h=0;h<height*.27;h+=2){
   const t=(earStart+h)/height,px=Math.round(x+lean*t*t),py=Math.round(y-earStart-h);
   const rim=Math.max(1,Math.round(width*(1-Math.abs((t-.85)/.16)*.8)));
   c.fillStyle=palette[tone<.94?1:2];c.fillRect(px-rim,py,rim*2+1,2);
   c.fillStyle=palette[tone<.94?2:3];c.fillRect(px-(h%4===0?rim-1:0),py,rim,1);
  }
 });
}
