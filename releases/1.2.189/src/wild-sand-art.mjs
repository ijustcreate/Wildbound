import {sketchBeachMargin,sketchGround,sketchUniformSurfaceTile,wildLandsPathAt} from './wild-lands-geography.mjs';
import {wildHash,wildLandsGround,wildLandsSurface,wildLandsSurfaceAt} from './wild-lands-world.mjs';

const SAND=['#bca479','#c6ad80','#d0b68a','#d8bf93','#dfc89f'];
const sandEdge=(x,y)=>sketchBeachMargin(x,y)+7*Math.sin(x*.083-y*.091)+4*Math.sin(x*.149+y*.155);

export function wildSandTone(x,y){
 const dune=.66*Math.sin(x*.025+y*.037+Math.sin(y*.018))+.34*Math.sin(x*.053-y*.067);
 const grain=(wildHash(Math.floor(x/4),Math.floor(y/4))-.5)*.24;
 return SAND[Math.max(0,Math.min(SAND.length-1,Math.round(2+2*dune+grain)))];
}

export function drawWildSandTile(c,d,x,y,originX,originY,scale){
 const cx=x+16,cy=y+16,ground=wildLandsGround(d,cx,cy);
 if(d.activeRoom||ground==='house'||ground==='mountain'||wildLandsPathAt(cx,cy))return;
 // In the tile interior the cheap map grid can reject areas far from sand.
 const beachNearby=ground==='beach'||sketchGround(cx-32,cy)==='beach'||sketchGround(cx+32,cy)==='beach'||
  sketchGround(cx,cy-32)==='beach'||sketchGround(cx,cy+32)==='beach';
 if(!beachNearby)return;
 const margin=sketchBeachMargin(cx,cy);
 if(margin<-34)return;
 const uniform=sketchUniformSurfaceTile(x,y);
 if(uniform&&uniform!=='grass'&&wildLandsSurface(d,cx,cy)!=='grass')return;
 const fine=uniform!=='grass',step=fine?2:4;
 const sandy=(px,py)=>(margin>=34||sandEdge(px,py)>0)&&(!fine||wildLandsSurfaceAt(d,px,py)==='grass');
 const rect=(wx,wy,w,h,color)=>{c.fillStyle=color;c.fillRect((wx-originX)/scale,(wy-originY)/scale,w/scale,h/scale);};
 for(let yy=y;yy<y+32;yy+=step)for(let xx=x;xx<x+32;xx+=step){
  const px=xx+step/2,py=yy+step/2;
  if(sandy(px,py))rect(xx,yy,step,step,wildSandTone(px,py));
 }
 for(let i=0;i<5;i++){
  const xx=x+2+Math.floor(wildHash(x+i*31,y)*12)*2,yy=y+2+Math.floor(wildHash(x,y+i*17)*13)*2;
  if(!sandy(xx+1,yy+1)||!sandy(xx+3,yy+1))continue;
  rect(xx,yy,i===0?4:2,2,i%3?'#e9d5ac':'#a58c62');
 }
}
