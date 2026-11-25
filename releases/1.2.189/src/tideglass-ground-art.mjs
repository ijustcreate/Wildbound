import {TIDEGLASS_LABELS,tideglassEdge,tideglassPathDistance} from './tideglass-layout.mjs';
import {castleSiteIntersects,castleSurface} from './wild-castle-site.mjs';
import {greyhavenGroundIntersects,greyhavenGroundSample} from './wild-castle-terrain.mjs';
import {eastWoodlandIntersects,eastWoodlandTerrain} from './wild-lands-geography.mjs';
import {mermaidLagoonIntersects,mermaidLagoonSurface} from './wild-mermaid-lagoon.mjs';

const seaGrass=['#3e6054','#4a6a57','#557459','#668163','#77906b'];
const saltStone=['#46575b','#52666a','#5e7071','#6f7e79','#869084'];
const coastSand=['#8b7c61','#9b8b6b','#ac9b78','#bdad85','#c8b78c'];
const saltMeadow=['#4a6050','#5b6c54','#6b7959','#7e8765','#929470'];
const beachGravel=['#626b61','#74796a','#828572','#92917a','#a2a085'];
const causeway=['#677372','#78827a','#8a8e80','#9b9884','#afaa90'];
const shelfShade=['#294847','#355650','#486558'];
const grit=['#273c3935','#283b3c44','#d4d6a947','#d0cdaa55'];
const box=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(x,y,w,h);};
function hash(x,y){
 let n=Math.imul(x|0,374761393)^Math.imul(y|0,668265263);
 n=Math.imul(n^(n>>>13),1274126177);
 return ((n^(n>>>16))>>>0)/4294967296;
}
const moatWater=['#285a68','#2b606e','#2e6472','#316977','#346d79'];
export function castleMoatTone(x,y){
 const broad=Math.sin(x*.018+y*.008)*.58+Math.sin(y*.031-x*.011)*.41;
 const grain=hash(Math.floor(x/9),Math.floor(y/9))-.5;
 return moatWater[Math.max(0,Math.min(4,Math.round(2+broad*1.28+grain*.46)))];
}
function landColor(x,y,edge,path){
 const relief=Math.sin(x*.008+y*.014)*.75+Math.sin(y*.032-x*.022)*.55+Math.sin(x*.045+y*.087)*.26;
 const index=Math.max(0,Math.min(4,Math.round(2+relief*1.2+hash(x>>2,y>>2)*.85-.4)));
 const worn=path<36+8*Math.sin(x*.058-y*.074);
 if(worn&&edge>27)return causeway[index];
 const rockLine=2650+340*Math.sin(x*.0037)+65*Math.sin(y*.027-x*.011);
 const sandLine=96+14*Math.sin(x*.041-y*.021)+10*Math.sin(y*.064+x*.018);
 if(y>2270){
  if(edge<sandLine)return coastSand[index];
  if(edge<sandLine+34+relief*14)return beachGravel[index];
 }
 if(edge<23)return shelfShade[Math.min(2,index)];
 if(y<rockLine||relief<-.8)return saltStone[index];
 if(edge<216+relief*27)return saltMeadow[index];
 return seaGrass[index];
}

function paintShoreCover(c,x,y,originX,originY,scale,edge){
 const chance=hash(x+17,y-9);
 const patch=Math.sin(x*.013-y*.018)+Math.sin(y*.035+x*.019)*.6;
 if(chance<.43-patch*.13)return;
 const px=x+4+(hash(x-61,y)*4|0)*2,py=y+11+(hash(x,y+29)*6|0)*2;
 const pixel=(dx,dy,w,h,color)=>box(c,(px-originX+dx)/scale,(py-originY+dy)/scale,w/scale,h/scale,color);
 if(edge<130||chance>.85){
  pixel(0,0,12,4,'#485650');
  pixel(2,-2,8,4,'#687675');
  pixel(4,-4,6,2,'#9c9d85');
  pixel(14,4,6,2,'#616b62');
  pixel(16,2,4,2,'#898e7d');
  return;
 }
 if(edge<171||chance>.73){
  pixel(-2,0,16,4,'#475746');
  pixel(0,-4,14,6,'#626f50');
  pixel(2,-8,10,4,'#73805a');
  pixel(8,-6,10,4,'#7f8760');
  pixel(5,-8,4,2,'#a7aa7a');
  pixel(14,-6,4,2,'#969772');
  return;
 }
 pixel(-2,0,14,4,'#415547');
 pixel(2,-4,4,6,'#526e4c');
 pixel(4,-8,4,6,'#6b8054');
 pixel(6,-10,6,2,'#a0a271');
 pixel(8,-5,4,5,'#6a8053');
 pixel(10,-8,6,3,'#8e9864');
 pixel(13,-8,4,2,'#a6a777');
}
export function tideglassGroundTone(x,y){
 if(eastWoodlandTerrain(x,y))return null;
 const edge=tideglassEdge(x,y);
 if(edge<0)return null;
 const path=tideglassPathDistance(x,y);
 return greyhavenGroundSample(x,y,edge,path)??landColor(x,y,edge,path);
}
export function drawTideglassGroundTile(c,x,y,originX,originY,scale){
 const center=tideglassEdge(x+16,y+16);
 if(center<-27)return;
 const centerPath=tideglassPathDistance(x+16,y+16);
 const nearTrail=centerPath<77;
 const castle=castleSiteIntersects(x,y,x+32,y+32);
 const woodland=eastWoodlandIntersects(x,y,x+32,y+32);
 const lagoon=mermaidLagoonIntersects(x,y,x+32,y+32);
 const greyhaven=greyhavenGroundIntersects(x,y,x+32,y+32);
 const coastLimit=greyhaven?270:258;
 for(let iy=0;iy<32;iy+=4)for(let ix=0;ix<32;ix+=4){
  const wx=x+ix,wy=y+iy,px=(wx-originX)/scale,py=(wy-originY)/scale;
  if(castle&&castleSurface(wx+2,wy+2)==='water'){box(c,px,py,4/scale,4/scale,castleMoatTone(wx+2,wy+2));continue;}
  if(woodland&&eastWoodlandTerrain(wx+2,wy+2))continue;
  if(lagoon&&mermaidLagoonSurface(wx+2,wy+2))continue;
  const edge=center>coastLimit?coastLimit:tideglassEdge(wx+2,wy+2);
  if(edge<0)continue;
  const path=nearTrail?tideglassPathDistance(wx+2,wy+2):Infinity;
  const local=greyhaven?greyhavenGroundSample(wx+2,wy+2,edge,path,true):null;
  if(local){
   const {tone,grain,flecks,glint,shade}=local;
   box(c,px,py,4/scale,4/scale,tone);
   if(grain>.81&&flecks>.36){
    box(c,px,py,2/scale,2/scale,glint);
    if(grain>.94)box(c,px+2/scale,py+2/scale,2/scale,2/scale,glint);
   }
   if(grain<.14&&flecks<.56)box(c,px,py+2/scale,4/scale,2/scale,shade);
   continue;
  }
  box(c,px,py,4/scale,4/scale,landColor(wx,wy,edge,path));
  const grain=hash(wx,wy);
  if(grain>.87){
   const cluster=hash(wx,wy-7);
   box(c,px+2/scale,py,2/scale,2/scale,grit[Math.min(3,Math.floor(cluster*4))]);
   if(cluster>.6)box(c,px,py+2/scale,4/scale,2/scale,grit[2]);
  }
  if(grain<.025&&edge>22)box(c,px,py+2/scale,4/scale,2/scale,'#364f4955');
 }
 if(!greyhaven&&!woodland&&!lagoon&&centerPath>58&&center>71&&center<255){
  paintShoreCover(c,x,y,originX,originY,scale,center);
 }
}
export function drawTideglassMapMarks(c){
 for(const {x,y} of TIDEGLASS_LABELS){
  box(c,x-16,y-16,32,32,'#2f4a45');
  box(c,x-8,y-8,16,16,'#e0b984');
 }
}
