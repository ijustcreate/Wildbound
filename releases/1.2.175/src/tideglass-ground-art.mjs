import {TIDEGLASS_LABELS,tideglassEdge,tideglassPathDistance} from './tideglass-layout.mjs';
import {castleSiteIntersects,castleSurface} from './wild-castle-site.mjs';
import {greyhavenGroundIntersects,greyhavenGroundSample} from './wild-castle-terrain.mjs';
import {eastWoodlandIntersects,eastWoodlandTerrain} from './wild-lands-geography.mjs';
import {mermaidLagoonIntersects,mermaidLagoonSurface} from './wild-mermaid-lagoon.mjs';

const seaGrass=['#3e6054','#4a6a57','#557459','#668163','#77906b'];
const saltStone=['#46575b','#52666a','#5e7071','#6f7e79','#869084'];
const coastSand=['#8b7c61','#9b8b6b','#ac9b78','#bdad85','#c8b78c'];
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
 if(edge<100&&y>2270)return coastSand[index];
 if(edge<23)return shelfShade[Math.min(2,index)];
 if(y<rockLine||relief<-.8)return saltStone[index];
 return seaGrass[index];
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
 const nearTrail=tideglassPathDistance(x+16,y+16)<77;
 const castle=castleSiteIntersects(x,y,x+32,y+32);
 const woodland=eastWoodlandIntersects(x,y,x+32,y+32);
 const lagoon=mermaidLagoonIntersects(x,y,x+32,y+32);
 const greyhaven=greyhavenGroundIntersects(x,y,x+32,y+32);
 const coastLimit=greyhaven?270:133;
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
}
export function drawTideglassMapMarks(c){
 for(const {x,y} of TIDEGLASS_LABELS){
  box(c,x-16,y-16,32,32,'#2f4a45');
  box(c,x-8,y-8,16,16,'#e0b984');
 }
}
