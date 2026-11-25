import {WILD_BRIDGES,WILD_RIVERS} from './wild-lands-geography.mjs';
import {wildLandsGround,wildLandsSurfaceAt} from './wild-lands-world.mjs';
import {vegetationWind,vegetationWindStrength} from './vegetation-motion.mjs';

const CELL=256,SPACING=44,cache=new WeakMap();
const bareBanks=new Set(['ice','beach','mountain','caverns','shadow']);
const jitter=(seed,n)=>((Math.imul(seed+n*131,2654435761)>>>16)&255)/256;
const pixel=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(x,y,w,h);};

function bankRoot(design,x,y,nx,ny,distance){
 for(const amount of [distance,distance+4,distance-4]){
  const px=Math.round(x+nx*amount),py=Math.round(y+ny*amount);
  if(px<12||py<12||px>design.width-12||py>design.height-12||bareBanks.has(wildLandsGround(design,px,py)))continue;
  if(WILD_BRIDGES.some(b=>Math.abs(px-b.x)<b.w/2+18&&Math.abs(py-b.y)<b.h/2+18))continue;
  if(wildLandsSurfaceAt(design,px,py)!=='shallow')continue;
  // The root lies in river shallows with a genuine land bank behind it.
  if(wildLandsSurfaceAt(design,Math.round(px+nx*29),Math.round(py+ny*29))!=='grass')continue;
  return {x:px,y:py};
 }
 return null;
}

function buildRiverPlants(design){
 const grid=new Map();
 function add(plant){
  const key=Math.floor(plant.x/CELL)+':'+Math.floor(plant.y/CELL);
  if(!grid.has(key))grid.set(key,[]);
  grid.get(key).push(plant);
 }
 for(const [river,points] of WILD_RIVERS.entries()){
  let next=24,index=0;
  for(let i=1;i<points.length;i++){
   const [x,y]=points[i-1],dx=points[i][0]-x,dy=points[i][1]-y,len=Math.hypot(dx,dy);
   if(len<.001)continue;
   const nx=-dy/len,ny=dx/len;
   for(;next<len;next+=SPACING,index++){
    const at=next/len,centerX=x+dx*at,centerY=y+dy*at,seed=7919*(river+1)+index*47;
    if(jitter(seed,1)<.13)continue;
    function pair(kind,depth,along=0){
     const cx=centerX+dx*along/len,cy=centerY+dy*along/len;
     const left=bankRoot(design,cx,cy,nx,ny,depth),right=bankRoot(design,cx,cy,-nx,-ny,depth);
     if(!left||!right)return;
     add({...left,kind,seed,side:1});add({...right,kind,seed,side:-1});
    }
    pair('grass',164+Math.round(jitter(seed,3)*5));
    if(jitter(seed,2)>.34)pair('grass',150+Math.round(jitter(seed,5)*7),12);
    if(jitter(seed,8)>.63)pair('cattail',163,-12);
   }
   next-=len;
  }
 }
 return grid;
}

export function riverBankVegetation(design,bounds){
 if(!design?.wildLands||design.activeRoom)return [];
 let grid=cache.get(design);
 if(!grid){grid=buildRiverPlants(design);cache.set(design,grid);}
 const {left,top,right,bottom}=bounds,plants=[];
 for(let cy=Math.floor((top-12)/CELL);cy<=Math.floor((bottom+40)/CELL);cy++){
  for(let cx=Math.floor((left-20)/CELL);cx<=Math.floor((right+20)/CELL);cx++){
   for(const p of grid.get(cx+':'+cy)||[]){
    if(p.x>=left-20&&p.x<=right+20&&p.y>=top-12&&p.y<=bottom+40)plants.push(p);
   }
  }
 }
 return plants;
}

function blade(c,x,y,height,lean,width,color){
 for(let h=0;h<height;h+=2){
  const t=h/height,xx=x+Math.round(lean*t*t);
  pixel(c,xx,y-h,width,Math.min(2,height-h),color);
 }
 return x+Math.round(lean);
}

export function drawRiverBankGrass(c,p,time,strength=1){
 const {x,y,seed,side}=p,wind=vegetationWind(x,y,time,strength);
 pixel(c,x-6,y,13,2,'#385d4c80');
 pixel(c,x-4,y-1,9,2,'#52754d');
 for(let i=0;i<5;i++){
  const base=x-5+i*2,root=y+(i%2),n=jitter(seed,i+14),height=6+Math.round(n*6);
  const lean=side*(i-2)*1.65+wind*1.4;
  blade(c,base,root,height,lean,i%2?1:2,i%2?'#789755':'#476d4f');
  if(i%2)pixel(c,base,root,1,1,'#537b53');
 }
}

export function drawRiverCattails(c,p,time,strength=1){
 const {x,y,seed,side}=p,wind=vegetationWind(x,y,time,strength);
 pixel(c,x-10,y+1,21,3,'#395f4e70');
 pixel(c,x-8,y,17,2,'#4b6d4d');
 for(let i=0;i<4;i++){
  const root=x+(i-2)*3,height=11+Math.round(jitter(seed,i+21)*10);
  blade(c,root,y,height,side*(i<2?-5:7)+wind*1.8,2,i%2?'#789858':'#4f744e');
 }
 const count=jitter(seed,32)>.64?3:2;
 for(let i=0;i<count;i++){
  const root=x+(i-1)*6+(count===2?3:0),height=18+Math.round(jitter(seed,i+37)*12);
  const lean=side*(i-1)*1.2+wind*(2+jitter(seed,i+48));
  const tip=blade(c,root,y,height,lean,1,'#879951'),top=y-height-6;
  pixel(c,tip-1,top-1,2,1,'#71513c');
  pixel(c,tip-2,top,4,7,'#694532');
  pixel(c,tip-1,top,2,5,'#a27349');
  pixel(c,tip-1,top,1,3,'#c28e5a');
  pixel(c,tip-1,top+7,2,1,'#513e33');
 }
}

export function drawRiverShallows(c,g,plants){
 const strength=vegetationWindStrength(g);
 for(const plant of plants)if(plant.kind==='grass')drawRiverBankGrass(c,plant,g.time,strength);
}
