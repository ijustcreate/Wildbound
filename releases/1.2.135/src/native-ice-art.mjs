import {pixelPolygon} from './pixel-shapes.mjs';

const snowTones=['#b9ced7','#c5d9e0','#d0e2e7','#dcebee','#e8f2f3'];
const outline=(c,points,color)=>pixelPolygon(c,points.map(([x,y])=>({x,y})),color);

// One field in world coordinates keeps mottle sizes stable across streamed chunks.
export function drawNativeSnow(c,x,y,worldX,worldY){
 const xTone=Array.from({length:8},(_,i)=>Math.sin((worldX+i*4)*.041));
 for(let row=0;row<32;row+=4){
  const wy=worldY+row,v=Math.sin(wy*.037),coarse=Math.cos(wy*.012);
  let start=0,last=-1;
  for(let col=0;col<=8;col++){
   const wx=worldX+col*4;
   const tone=col===8?-1:Math.max(0,Math.min(4,Math.floor(2.5+Math.sin(wx*.02+wy*.013)*1.05+xTone[col]*v*.82+coarse*.47+Math.sin(wx*.083-wy*.094)*.32)));
   if(tone===last)continue;
   if(last>=0){c.fillStyle=snowTones[last];c.fillRect(x+start*4,y+row,(col-start)*4,4);}
   start=col;last=tone;
  }
 }
 const motif=(Math.imul(worldX,73244475)^Math.imul(worldY,59243))>>>0;
 const dx=4+(motif>>>5)%21,dy=5+(motif>>>12)%22;
 c.fillStyle='#f1fafa';c.fillRect(x+dx,y+dy,4,1);c.fillRect(x+dx+1,y+dy-1,2,1);
 if(motif%3===0){c.fillStyle='#b0c9d13e';c.fillRect(x+dx+3,y+dy+2,5,1);}
}

// Edges [north,east,south,west]. The roughness is sampled along the world edge
// so adjacent 32-pixel ground tiles make a continuous snow shelf.
export function drawIceSnowShelf(c,x,y,worldX,worldY,snowEdges){
 const enclosed=snowEdges.filter(Boolean).length>=3;
 for(let side=0;side<4;side++){
  if(!snowEdges[side])continue;
  const horizontal=side%2===0,flipped=side===1||side===2;
  const along=horizontal?worldX:worldY;
  for(let i=0;i<32;i+=4){
   const t=along+i,rough=2+Math.round((1+Math.sin(t*.089))*1.25+(1+Math.sin(t*.39))*.65);
   const depth=enclosed?rough+3+Math.round(Math.sin(t*.17)*2):rough;
   const draw=(inset,size,color)=>{
    const cross=flipped?32-inset-size:inset;
    c.fillStyle=color;
    if(horizontal)c.fillRect(x+i,y+cross,4,size);else c.fillRect(x+cross,y+i,size,4);
   };
   draw(0,depth+2,'#4b819d80');draw(0,depth+1,'#9fbdcb');
   draw(0,depth,'#c9dfe7');draw(0,Math.max(1,depth-2),'#e4eff2');
  }
 }
 // Round off convex ice corners with a longer stepped snow drift. Long banks
 // stay narrow and keep crystals, ice and snow in the same depth plane.
 for(let corner=0;corner<4;corner++){
  const next=(corner+1)%4;
  if(!snowEdges[corner]||!snowEdges[next])continue;
  const east=corner===0||corner===1,south=corner===1||corner===2;
  const widths=enclosed?[12,11,8,5,2]:[9,7,4,2];
  for(let row=0;row<widths.length;row++){
   const width=widths[row],py=south?y+30-row*2:y+row*2;
   c.fillStyle='#a5c4d080';c.fillRect(east?x+30-width:x,py,width+2,2);
   c.fillStyle='#d4e7ee';c.fillRect(east?x+32-width:x,py,width,2);
  }
 }
}

const bit=(p,m=0)=>((Math.imul(Math.round(p.seed??p.x),2654435761)^Math.imul(Math.round(p.y),1597334677)^m)>>>0);

export function drawFrozenLog(c,p){
 const kind=bit(p,23)%5,slope=[-.28,-.13,0,.14,.28][kind],flip=kind%2===1;
 const xy=([x,y])=>[flip?-x:x,y+Math.round(x*slope)];
 const shape=(points,color)=>outline(c,points.map(xy),color);
 shape([[-29,3],[-23,0],[21,-1],[29,2],[22,5],[-21,5]],'#7096a283');
 shape([[-29,-8],[-25,-13],[22,-14],[29,-10],[29,-3],[24,1],[-23,1],[-29,-2]],'#403d39');
 shape([[-27,-9],[-23,-12],[22,-12],[26,-9],[23,-2],[-23,-1],[-27,-3]],'#7d6856');
 shape([[-26,-6],[-17,-6],[-7,-8],[5,-7],[14,-9],[24,-8],[23,-6],[9,-5],[-2,-6],[-11,-4],[-24,-4]],'#a1876c');
 shape([[-23,-2],[15,-3],[23,-5],[23,-2],[-22,0]],'#584c42');
 shape([[22,-13],[27,-12],[29,-9],[28,-3],[24,0],[21,-3],[21,-9]],'#a38b70');
 shape([[23,-11],[27,-10],[27,-5],[24,-2],[23,-4]],'#c1a782');
 shape([[24,-9],[26,-9],[26,-6],[24,-5]],'#886d59');
 shape([[-27,-12],[-24,-15],[-17,-16],[-8,-15],[-3,-17],[6,-16],[12,-14],[20,-16],[25,-14],[27,-12],[19,-11],[12,-12],[6,-10],[-2,-11],[-8,-10],[-18,-12],[-26,-10]],'#aeced5');
 shape([[-26,-13],[-22,-15],[-16,-15],[-9,-14],[-3,-16],[6,-15],[12,-13],[20,-15],[24,-14],[24,-12],[18,-12],[12,-13],[5,-12],[-2,-13],[-8,-11],[-19,-13],[-25,-11]],'#e8f3f4');
 for(const [x,y,n]of [[-15,-12,5],[4,-12,4],[18,-12,4]]){
  const [px,py]=xy([x,y]);c.fillStyle='#aacbd5';c.fillRect(px,py,1,n);
 }
}

const clusters=[
 [[-17,14,26,-4],[6,13,48,-7],[21,7,28,3]],
 [[-18,10,38,-6],[0,14,54,5],[17,10,24,2]],
 [[-21,8,25,-4],[-6,13,42,-3],[12,11,45,6],[23,6,23,3]],
];
export function drawIceCrystals(c,p){
 const cluster=p.kind==='ice_spire'?clusters[bit(p,47)%clusters.length]:[[0,24,24,4]];
 outline(c,[[-30,2],[-23,-3],[-17,-2],[-10,-5],[1,-4],[10,-5],[16,-1],[24,-2],[29,1],[27,4],[-18,5]],'#8db2bd88');
 for(const [x,w,h,lean]of cluster){
  outline(c,[[x-w,-3],[x-w+2,-h+12],[x+lean,-h],[x+w-2,-h+16],[x+w,0],[x+1,2]],'#3c7288');
  outline(c,[[x-w+2,-3],[x-w+3,-h+13],[x+lean,-h+1],[x+2,-h+13],[x+1,0]],'#a0cadd');
  outline(c,[[x+1,0],[x+2,-h+13],[x+lean,-h+1],[x+w-3,-h+16],[x+w-1,-2]],'#659ab1');
  outline(c,[[x-w+4,-h+13],[x+lean,-h+1],[x+2,-h+13],[x+4,-h+20]],'#d3eaf2');
  outline(c,[[x-w+3,-6],[x-5,-h*.48],[x-2,-h*.42],[x-w+4,-3]],'#b7deeb');
  outline(c,[[x+3,-10],[x+w-4,-h*.52],[x+w-3,-h*.44],[x+5,-6]],'#7fadc2');
 }
 outline(c,[[-28,2],[-25,-2],[-21,-2],[-18,0],[-14,-2],[-9,-1],[-8,2],[-2,2],[3,-2],[8,-2],[12,0],[17,-1],[22,0],[26,-1],[28,2],[16,3],[8,3],[1,4],[-10,3],[-20,4]],'#d2e5eb');
 outline(c,[[-24,0],[-20,-1],[-17,1],[-12,0],[-10,2],[-17,2],[-22,3],[-25,2]],'#ecf7f7');
 outline(c,[[3,0],[8,-1],[10,1],[16,1],[17,2],[9,3],[3,2]],'#f2fafa');
}

const propRasters=new Map();
export function drawNativeIceScenery(c,p){
 const log=p.kind==='frozen_log',variant=log?bit(p,23)%5:p.kind==='ice_spire'?bit(p,47)%clusters.length:0;
 const painter=log?drawFrozenLog:drawIceCrystals;
 if(!c.drawImage||typeof OffscreenCanvas==='undefined')return painter(c,p);
 const key=p.kind+':'+variant;
 let tile=propRasters.get(key);
 if(!tile){
  tile=new OffscreenCanvas(64,70);
  const pen=tile.getContext('2d');pen.translate(32,58);painter(pen,p);
  propRasters.set(key,tile);
 }
 c.imageSmoothingEnabled=false;c.drawImage(tile,-32,-58);
}
