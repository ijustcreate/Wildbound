import {projectPoint,facingIndex} from './player-motion.mjs';
import {pixelVolume,pixelLine,pixelPolygon} from './pixel-shapes.mjs';
import {DEER_KINDS} from './wild-fauna-data.mjs';
import {drawPig} from './pig-art.mjs';
const deerPal={body:'#b88352',shade:'#78503c',light:'#dfb37a',outline:'#48382f'},fur={body:'#e5eef0',shade:'#a3b8c7',light:'#fff9e9',outline:'#5d7589'},shell={body:'#b0783d',shade:'#674932',light:'#e6bc70',outline:'#46352b'};
// Articulated anatomical pixel volumes: legs/tail/head move independently,
// eight true facings, with a stable foot origin. No rotating overhead sprite.
export function drawWildFauna(c,e,time,size=47){
 if(e.kind==='pig'||e.kind==='pig_spotted')return drawPig(c,e,time,size);
 const deer=DEER_KINDS.includes(e.kind),scorpion=e.kind==='scorpion',pal=scorpion?shell:deer?deerPal:fur,d=facingIndex(e.faceX,e.faceY),frozen=e.frozen>0||e.state==='snared',moving=e.moving&&!frozen;
 const t=frozen?0:(e.step||time*3),stride=moving?Math.sin(t*1.3)*4:0,bob=frozen?0:moving?Math.abs(Math.sin(t*1.3))*1.5:Math.sin(time*1.6)*.35,parts=[];
 c.save();c.translate(Math.round(e.x),Math.round(e.y));const s=size/47*(e.kind==='baby_deer'?.64:scorpion?.82:deer?1.18:1);c.scale(s,s);c.imageSmoothingEnabled=false;
 const vol=(center,rx,ry,rz,p=pal)=>{parts.push({depth:projectPoint(center,d).depth,paint:()=>pixelVolume(c,center,rx,ry,rz,d,p)});};
 const line=(a,b,color,width=2)=>{parts.push({depth:(projectPoint(a,d).depth+projectPoint(b,d).depth)/2,paint:()=>pixelLine(c,projectPoint(a,d),projectPoint(b,d),color,width)});};
 const poly=(points,color)=>{parts.push({depth:points.reduce((n,v)=>n+projectPoint(v,d).depth,0)/points.length,paint:()=>pixelPolygon(c,points.map(v=>projectPoint(v,d)),color)});};
 if(scorpion){
  for(const side of [-1,1])for(let i=0;i<4;i++){const yy=-8+i*5,step=moving?Math.sin(t*2+i*Math.PI/2+side)*2:0;line([side*4,yy,3],[side*13,yy+step-3,2],pal.shade,2);line([side*13,yy+step-3,2],[side*19,yy+step+4,1],pal.light,1);}
  vol([0,-3,4],6,12,4);for(let i=0;i<4;i++)vol([0,-10+i*5,6],5.6,2.3,1.5,{...pal,light:'#d0a05d'});
  for(const side of [-1,1]){line([side*4,8,4],[side*11,15,5],pal.body,3);vol([side*13,20,5],5,6,3);poly([[side*11,23,5],[side*11,29,5],[side*14,25,5]],pal.light);}
  const raised=e.state==='sting',tail=raised?26:19;
  line([0,-13,4],[0,-18,12],pal.shade,5);line([0,-18,12],[0,-12,tail],pal.body,4);line([0,-12,tail],[0,1,tail+2],pal.light,3);vol([0,2,tail],3,4,3,{...pal,body:'#693a32',light:'#c47353'});
  vol([-2,9,7],1,1,1,{...pal,body:'#292729',light:'#292729'});vol([2,9,7],1,1,1,{...pal,body:'#292729',light:'#292729'});
 }else{
  const fox=!deer,leg=deer?17:9,body=leg+6+bob,head=deer?body+11:body+4;
  for(const side of [-1,1])for(const end of [-1,1]){const x=side*5,y=end*(deer?10:11),swing=stride*(side===end?1:-1),knee=[x,y+swing*.6,leg*.5+Math.max(0,swing)*.4],foot=[x,y+swing,1];line([x,y,body-3],knee,pal.shade,deer?3:4);line(knee,foot,pal.body,2);vol(foot,2.3,2.8,1.6,{...pal,body:deer?'#42382f':'#b5c8d3',light:deer?'#84725a':'#f7f5e7'});}
  vol([0,-1,body],fox?7:7.5,fox?17:15,fox?7.5:8);
  vol([0,4,body-3],fox?5.5:5,10,3,{...pal,body:fox?'#fff6e6':'#ead0a2',light:'#fff6df'});
  if(fox){const sway=frozen?0:Math.sin(time*2+e.id)*2;line([0,-15,body],[sway,-27,body-3],pal.shade,7);vol([sway,-24,body-1],5.5,10,5.8);vol([sway,-31,body-2],4,5,4,{...pal,body:'#f8f5df',light:'#ffffff'});}
  else{vol([0,-17,body+2],3,4,3,{...pal,body:'#eee3c0',light:'#fff6df'});line([0,8,body],[0,12,head-1],pal.body,7);}
  vol([0,fox?15:13,head],fox?6:5.5,fox?7:6,fox?5.5:6);
  vol([0,fox?22:19,head-2],fox?3.8:3,5,3,{...pal,body:fox?'#f8f6e7':'#dfc39a'});vol([0,fox?26:23,head-1],2,1.5,1.5,{...pal,body:'#2a353c',light:'#4a5155'});
  for(const side of [-1,1]){poly([[side*3,12,head+3],[side*(fox?6:10),fox?12:8,head+12],[side*8,15,head+4]],pal.body);poly([[side*4,12,head+5],[side*(fox?5:8),10,head+10],[side*6,14,head+5]],fox?'#c99599':'#65463e');vol([side*4.7,17,head+1],1,1.2,1.2,{...pal,body:'#182a31',light:'#182a31'});}
  if(e.kind==='baby_deer')for(const side of [-1,1])for(let i=0;i<4;i++)vol([side*5.8,-8+i*5,body+5],1,1,1,{...pal,body:'#ffefcc',light:'#fff6df'});
  if(e.kind==='stag')for(const side of [-1,1]){line([side*3,11,head+5],[side*8,9,head+17],'#684d3a',3);line([side*8,9,head+17],[side*13,5,head+25],'#e1c69b',2);line([side*7,9,head+14],[side*15,11,head+20],'#bca27a',2);line([side*9,8,head+19],[side*7,15,head+25],'#efdab2',2);}
 }
 parts.sort((a,b)=>a.depth-b.depth);for(const p of parts)p.paint();c.restore();
}
