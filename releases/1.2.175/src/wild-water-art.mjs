import {drawWaterSurface} from './water-surface.mjs';
import {EAST_WOODLAND_LAKE_BOUNDS,eastWoodlandLakeDepth,wildLandsCoastDistance,wildLandsOpenOcean} from './wild-lands-geography.mjs';
import {tideglassEdge,tideglassLagoonAt} from './tideglass-layout.mjs';
import {greywakeShoreDepth} from './wild-mountain-shore.mjs';
import {wildHash} from './wild-lands-world.mjs';
import {MERMAID_LAGOON_BOUNDS,mermaidLagoonWaterOpacity,mermaidLagoonWaterTone} from './wild-mermaid-lagoon.mjs';
import {skullRockShoreDepth} from './wild-skull-rock.mjs';

const shelfColors=['#f2d7a0e8','#e4d4a4b8','#c1d7ac93','#96c6ac69','#82bbaa42','#75b5aa22'];
const oceanTint='#6ba9a375';
const cellSize=8;
const causticPatterns=new WeakMap();
const waterBottoms=new WeakMap();
let causticTexture;

export function wildOceanAt(x,y){
 // The rendered edge has up to nine pixels of coastal scalloping.
 return wildLandsOpenOcean(x,y)&&!tideglassLagoonAt(x,y,10);
}

function coastalDepth(x,y){
 const skull=skullRockShoreDepth(x,y);
 if(skull!==null)return skull;
 const greywake=greywakeShoreDepth(x,y);
 if(greywake!==null)return greywake;
 const eastern=-tideglassEdge(x,y);
 const coast=wildLandsCoastDistance(x,y)/110;
 return eastern>=-24?Math.min(coast,eastern/90):coast;
}

// The shallow mask supplied by the native terrain painter clips these tint bands.
export function wildCoastShelf(x,y){
 const bands=new Array(shelfColors.length);
 for(let py=y;py<y+32;py+=cellSize)for(let px=x;px<x+32;px+=cellSize){
  const cx=px+cellSize/2,cy=py+cellSize/2;
  const grain=(wildHash(px,py)-.5)*.075+Math.sin(cx*.077+cy*.125)*.037;
  const index=Math.max(0,Math.min(bands.length-1,Math.floor((coastalDepth(cx,cy)+grain)*bands.length)));
  const band=bands[index]??=new Path2D();
  band.rect(px,py,cellSize,cellSize);
 }
 return bands;
}

function createCausticTexture(){
 const size=120,cells=12;
 const canvas=document.createElement('canvas');
 canvas.width=canvas.height=size;
 const c=canvas.getContext('2d'),pixels=c.createImageData(size,size);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const u=x/size,v=y/size;
  const xx=u*cells+.23*Math.sin(v*Math.PI*4)+.12*Math.cos((u+v)*Math.PI*6);
  const yy=v*cells+.16*Math.cos(u*Math.PI*4)+.15*Math.sin((u-v)*Math.PI*8);
  const col=Math.floor(xx),row=Math.floor(yy);
  let first=Infinity,second=Infinity;
  for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
   const cx=col+dx,cy=row+dy,hx=(cx+cells)%cells,hy=(cy+cells)%cells;
   const rx=cx+.17+wildHash(hx+15,hy+13)*.66-xx;
   const ry=cy+.17+wildHash(hx+37,hy+51)*.66-yy;
   const range=rx*rx+ry*ry;
   if(range<first){second=first;first=range;}
   else second=Math.min(second,range);
  }
  const ridge=Math.max(0,1-(second-first)/.23);
  const i=(y*size+x)*4;
  pixels.data[i]=255;
  pixels.data[i+1]=248;
  pixels.data[i+2]=198;
  pixels.data[i+3]=Math.round(ridge*ridge*(57+45*wildHash(x,y)));
 }
 c.putImageData(pixels,0,0);
 return canvas;
}

function drawCoastalCaustics(c,area,time){
 causticTexture??=createCausticTexture();
 let pattern=causticPatterns.get(c);
 if(!pattern){pattern=c.createPattern(causticTexture,'repeat');causticPatterns.set(c,pattern);}
 const {left,top,width,height}=area;
 c.imageSmoothingEnabled=false;
 c.fillStyle=pattern;
 c.globalAlpha*=.8+.2*Math.sin(time*.96);
 pattern.setTransform({a:2,d:2,e:Math.floor(time*2.1)%240,f:Math.floor(time*1.2)%240});
 c.fillRect(left,top,width,height);
}

function drawWaterGlints(c,area,wet,time,ocean){
 const {left,top,width,height}=area,path=new Path2D();
 const spacing=ocean?40:53;
 for(let y=Math.floor(top/spacing)*spacing;y<top+height;y+=spacing){
  for(let x=Math.floor(left/spacing)*spacing;x<left+width;x+=spacing){
   const seed=wildHash(x,y),swell=Math.sin(time*(ocean?.78:1.14)+seed*24);
   if(swell<(ocean?.54:.67))continue;
   const px=Math.round(x+seed*30+Math.sin(time*.68+seed*25)*3);
   const py=Math.round(y+wildHash(x+3,y+9)*36+Math.sin(time*.52+seed*13)*2);
   const length=Math.round((ocean?16:12)*swell*seed+4);
   path.rect(px,py,length,1);
   if(seed>.86)path.rect(px+4,py-1,Math.max(2,Math.round(length*.48)),1);
  }
 }
 c.save();
 c.clip(wet);
 c.fillStyle=ocean?'#f2f6d56c':'#eeead083';
 c.fill(path);
 c.restore();
}

function shoreStrip(path,x,y,nx,ny,from,to,length=1.9){
 const tx=-ny*length,ty=nx*length;
 const ax=x+nx*from,ay=y+ny*from,bx=x+nx*to,by=y+ny*to;
 path.moveTo(Math.round(ax-tx),Math.round(ay-ty));
 path.lineTo(Math.round(bx-tx),Math.round(by-ty));
 path.lineTo(Math.round(bx+tx),Math.round(by+ty));
 path.lineTo(Math.round(ax+tx),Math.round(ay+ty));
 path.closePath();
}

function fillStrips(c,paths,colors){
 paths.forEach((path,i)=>{
  c.fillStyle=colors[i];
  c.fill(path);
 });
}

function drawOceanWash(c,tiles,time){
 const damp=new Path2D(),wash=new Path2D(),backwash=new Path2D(),foam=new Path2D(),lace=new Path2D();
 for(const shore of tiles)for(const [x,y,nx,ny] of shore){
  const phase=time*.91+Math.sin(x*.013+y*.008)*.30+Math.cos(y*.018-x*.009)*.24;
  const swell=(1+Math.sin(phase))*.5;
   const curl=Math.sin(x*.023+y*.017-time*.7)*3.1+
    Math.sin(x*.063+y*.075+time*.9)*2.1+Math.sin(x*.151-y*.133-time*.54)*.8;
  const front=15-24*swell*swell*(3-2*swell)+curl;
  const grain=wildHash(x,y),cluster=Math.sin(x*.107+y*.088+time*1.2)+.44*Math.sin(y*.263-x*.219);
  shoreStrip(damp,x,y,nx,ny,-15+curl,-4+curl);
  shoreStrip(wash,x,y,nx,ny,Math.min(0,front),Math.max(0,front)+3);
  if(cluster>-.55||grain>.69)shoreStrip(foam,x,y,nx,ny,front,front+2.2+swell*2.3+Math.max(0,cluster));
  if(cluster>.25||grain>.91)shoreStrip(lace,x,y,nx,ny,front+5+grain*3,front+7+grain*3,1.04);
  const outer=34-swell*13+curl*1.5;
  if(cluster>-.04&&grain>.15)shoreStrip(backwash,x,y,nx,ny,outer,outer+1.5,1.45);
 }
 fillStrips(c,[damp,wash,backwash,foam,lace],['#95785046','#e4d9ae70','#c5e2cf87','#fff6d9e6','#fbf5d2b3']);
}

function drawFreshwaterBanks(c,tiles,time){
 const earth=new Path2D(),shade=new Path2D(),moss=new Path2D(),
  nearBank=new Path2D(),rim=new Path2D(),ripples=new Path2D();
 for(const shore of tiles)for(const [x,y,nx,ny] of shore){
  const broken=Math.sin(x*.195+y*.151)+.48*Math.sin(x*.435-y*.289);
  const slope=Math.sin(x*.048+y*.069);
  const width=5+Math.round(slope*3+Math.max(0,ny)*2)+Math.max(0,Math.round(broken*2));
  const slip=Math.round(Math.sin(time*1.8+x*.161-y*.13));
  shoreStrip(earth,x,y,nx,ny,-width,-.8);
  shoreStrip(nearBank,x,y,nx,ny,.6,7+broken*2+slope*2);
  shoreStrip(shade,x,y,nx,ny,-.9,2.4);
  if(broken>-.39)shoreStrip(moss,x,y,nx,ny,-width-2.2,-width+.9);
  if(broken>-.79)shoreStrip(rim,x,y,nx,ny,.8+slip,2+slip);
  if(broken>.6&&Math.sin(time*1.35+x*.14+y*.091)>.31)shoreStrip(ripples,x,y,nx,ny,5+slip,6+slip);
 }
 fillStrips(c,[earth,moss,nearBank,shade,rim,ripples],
  ['#b49a68d9','#8a945ec2','#344c372e','#415940a3','#eeebc5c1','#dde7bc7e']);
}

const woodlandLakeColors=['#a4c5ad','#91c1b4','#7cb9b8','#6aafb6','#59a3ae','#4d96a4','#438a98','#3b7f8e','#347386','#306a80'];
function woodlandLakeTone(x,y,col,row){
 const depth=eastWoodlandLakeDepth(x,y);
 const mottling=.43*Math.sin(x*.031-y*.039)+.24*Math.sin(x*.108+y*.066)+(wildHash(col,row)-.5)*.24;
 const index=Math.round(Math.min(9,Math.max(0,Math.sqrt(Math.max(0,depth)/172)*8.5+mottling)));
 return woodlandLakeColors[index];
}
function lagoonTone(x,y){
 const color=mermaidLagoonWaterTone(x,y);
 if(!color)return null;
 const alpha=Math.round(255*mermaidLagoonWaterOpacity(x));
 return alpha===255?color:color+alpha.toString(16).padStart(2,'0');
}

function drawWaterBottom(c,mask,bounds,tone){
 const {left,top,right,bottom}=bounds;
 const step=4;
 let raster=waterBottoms.get(bounds);
 if(!raster){
  raster=document.createElement('canvas');
  raster.width=Math.ceil((right-left)/step);raster.height=Math.ceil((bottom-top)/step);
  const pen=raster.getContext('2d');
  for(let row=0;row<raster.height;row++)for(let col=0;col<raster.width;col++){
   const x=left+col*step+step/2,y=top+row*step+step/2;
   const color=tone(x,y,col,row);
   if(color){pen.fillStyle=color;pen.fillRect(col,row,1,1);}
  }
  waterBottoms.set(bounds,raster);
 }
 c.save();c.clip(mask);c.imageSmoothingEnabled=false;
 c.drawImage(raster,left,top,raster.width*step,raster.height*step);
 c.restore();
}

export function drawWildWater(c,g,area,{wet,ocean,inland,lake,lagoon,coastalShallows,freshShallows,shelf,coastalBanks,freshBanks}){
 const {left,top,width,height}=area,time=g.time||0;
 c.save();
 c.clip(wet);
 drawWaterSurface(c,g,left,top,width,height,{shallow:false,shoreRipples:false});
 c.restore();
 if(ocean){
  c.fillStyle=oceanTint;
  c.fill(ocean);
  drawWaterGlints(c,area,ocean,time,true);
 }
 if(inland){
  c.fillStyle='#6e805fce';
  c.fill(inland);
  c.fillStyle='#9aa77c3b';
  c.fill(freshShallows);
  drawWaterGlints(c,area,inland,time,false);
 }
 if(lake){
  drawWaterBottom(c,lake,EAST_WOODLAND_LAKE_BOUNDS,woodlandLakeTone);
  drawWaterGlints(c,area,lake,time,false);
 }
 if(lagoon){
  c.fillStyle=oceanTint;
  c.fill(lagoon);
  drawWaterBottom(c,lagoon,MERMAID_LAGOON_BOUNDS,lagoonTone);
  drawWaterGlints(c,area,lagoon,time,false);
 }
 if(coastalShallows){
  c.save();
  c.clip(coastalShallows);
  fillStrips(c,shelf,shelfColors);
  drawCoastalCaustics(c,area,time);
  c.restore();
 }
 if(!freshBanks.length&&!coastalBanks.length)return;
 return ()=>{
  if(freshBanks.length)drawFreshwaterBanks(c,freshBanks,time);
  if(coastalBanks.length)drawOceanWash(c,coastalBanks,time);
 };
}
