import {pixelLine,pixelPolygon} from './pixel-shapes.mjs';

export function drawTreeWeb(c,p){
 if(!p.webbed)return;
 const size=Math.max(18,p.size||40),cx=p.x,top=p.y-size*.56;
 c.save();c.globalAlpha*=.72;
 if(!['tree','palm','snow_tree','mangrove','old_cypress','grave_forest_tree','leafless_tree'].includes(p.kind)){
  const width=Math.max(14,p.width||size*.72),depth=Math.max(12,p.depth||size*.45),y=p.kind==='mausoleum'?p.y-size*.34:p.y-size*.14;
  const bounds=[{x:cx-width*.53,y:y-depth*.28},{x:cx-width*.42,y:y-depth*.48},{x:cx+width*.37,y:y-depth*.45},{x:cx+width*.53,y:y-depth*.13},{x:cx+width*.42,y:y+depth*.35},{x:cx-width*.38,y:y+depth*.46},{x:cx-width*.53,y:y+depth*.12}];
  pixelPolygon(c,bounds,'#c8c4d116');
  for(let i=0;i<9;i++){
   const t=i/8,x=cx-width*.48+t*width*.96;
   pixelLine(c,{x:cx,y:y-depth*.44},{x:Math.round(x+Math.sin(i*2.2)*depth*.25),y:y+depth*.43},i%3?'#dcdae19b':'#f0edf0b5',1);
  }
  for(let i=1;i<=4;i++){
   const yy=y-depth*.44+i*depth*.17,rx=width*(.12+i*.09),arc=[];
   for(let n=0;n<=10;n++){const a=Math.PI*.08+n*Math.PI*.084;arc.push({x:Math.round(cx+Math.cos(a)*rx),y:Math.round(yy+Math.sin(a)*depth*.06)});}
   for(let n=0;n<arc.length-1;n++)pixelLine(c,arc[n],arc[n+1],'#d6d4de83',1);
  }
  c.restore();return;
 }
 const fans=[
  {x:cx-size*.13,y:top+size*.24,rx:size*.2,ry:size*.22,start:-.95,end:.92},
  {x:cx+size*.13,y:top+size*.23,rx:size*.2,ry:size*.21,start:2.19,end:4.08},
 ];
 for(let f=0;f<fans.length;f++){
  const fan=fans[f],count=5,edges=[];
  for(let i=0;i<=count;i++){
   const a=fan.start+(fan.end-fan.start)*i/count;
   edges.push({x:Math.round(fan.x+Math.cos(a)*fan.rx),y:Math.round(fan.y+Math.sin(a)*fan.ry)});
  }
  pixelPolygon(c,[{x:fan.x,y:fan.y},...edges],'#d9dce514');
  for(let i=0;i<edges.length;i++){
   const edge=edges[i],a=fan.start+(fan.end-fan.start)*i/count;
   const mid={x:Math.round((fan.x+edge.x)*.5+Math.sin(a)*size*.025),y:Math.round((fan.y+edge.y)*.5+size*.025)};
   const color=i%3===0?'#f0edf0bc':'#d8d9e19a';pixelLine(c,{x:fan.x,y:fan.y},mid,color,1);pixelLine(c,mid,edge,color,1);
  }
  for(let ring=1;ring<=3;ring++){
   const t=ring/4,arc=[];
   for(let i=0;i<=8;i++){
    const q=i/8,a=fan.start+(fan.end-fan.start)*q;
    arc.push({x:Math.round(fan.x+Math.cos(a)*fan.rx*t),y:Math.round(fan.y+Math.sin(a)*fan.ry*t+Math.sin(q*Math.PI)*size*.025)});
   }
   for(let i=0;i<arc.length-1;i++)pixelLine(c,arc[i],arc[i+1],ring===4?'#dfe0e39b':'#d4d4df70',1);
  }
 }
 for(let strand=0;strand<3;strand++){
  const sx=cx-size*.2+strand*size*.2,ex=sx+Math.sin(strand*2.1)*size*.13,color=strand%2?'#dfe0e39a':'#f0edf09c';
  pixelLine(c,{x:Math.round(sx),y:Math.round(top+size*.22)},{x:Math.round(sx+size*.1),y:Math.round(top+size*.56)},color,1);
  pixelLine(c,{x:Math.round(sx+size*.1),y:Math.round(top+size*.56)},{x:Math.round(ex-size*.08),y:Math.round(p.y-size*.05)},color,1);
  pixelLine(c,{x:Math.round(ex-size*.08),y:Math.round(p.y-size*.05)},{x:Math.round(ex),y:Math.round(p.y+size*.25)},color,1);
 }
 c.restore();
}
