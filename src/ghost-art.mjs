import {pixelLine,pixelPolygon} from './pixel-shapes.mjs';
const rect=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.max(1,Math.round(w)),Math.max(1,Math.round(h)));};
const poly=(c,points,color)=>pixelPolygon(c,points.map(([x,y])=>({x,y})),color);
export const SPECTRAL_CLOTH=Object.freeze({ink:'#365c56',dark:'#719e8b',base:'#b8d9c4',light:'#e4f2dc',trim:'#b4ecd3'});
export function drawGhostHood(c,h,d){
 const side=d===2||d===6,back=d>=3&&d<=5,x=h.x,y=h.y,w=side?5:7;
 const shell=[[-w,3],[-w-1,-3],[-w+2,-8],[0,-11],[w-2,-8],[w+1,-3],[w,4],[3,6],[-3,6]].map(([a,b])=>[x+a,y+b]);
 poly(c,shell,SPECTRAL_CLOTH.ink);
 poly(c,[[-w+1,2],[-w,-3],[-w+3,-7],[0,-9],[w-3,-7],[w,-2],[w-1,3],[2,5],[-2,5]].map(([a,b])=>[x+a,y+b]),SPECTRAL_CLOTH.base);
 pixelLine(c,{x:x-w+2,y:y-4},{x,y:y-9},SPECTRAL_CLOTH.light,2);
 if(back){pixelLine(c,{x,y:y-7},{x:x+2,y:y+3},SPECTRAL_CLOTH.dark,2);return true;}
 const turn=d===2?1:d===6?-1:0;
 poly(c,[[-4+turn,-3],[turn,-6],[4+turn,-2],[3+turn,4],[-2+turn,5],[-4+turn,1]].map(([a,b])=>[x+a,y+b]),'#142a29');
 pixelLine(c,{x:x-w+1,y:y-2},{x:x-3,y:y+5},SPECTRAL_CLOTH.light,1);
 pixelLine(c,{x:x+w-1,y:y-2},{x:x+3,y:y+5},SPECTRAL_CLOTH.dark,1);
 return true;
}
export function drawGhostRobe(c,p,d){
 const top=p.chest,b=p.pelvis,side=d===2||d===6,w=side?4:6;
 poly(c,[[top.x-w-1,top.y-2],[top.x+w+1,top.y-2],[b.x+w,b.y+4],[b.x+3,b.y+7],[b.x,b.y+4],[b.x-3,b.y+8],[b.x-w,b.y+3]],SPECTRAL_CLOTH.ink);
 poly(c,[[top.x-w,top.y-2],[top.x+w,top.y-2],[b.x+w-1,b.y+3],[b.x+2,b.y+5],[b.x,b.y+2],[b.x-2,b.y+6],[b.x-w+1,b.y+2]],SPECTRAL_CLOTH.base);
 pixelLine(c,{x:top.x-w+1,y:top.y},{x:b.x-3,y:b.y+4},SPECTRAL_CLOTH.light,2);
 pixelLine(c,{x:top.x+1,y:top.y+2},{x:b.x+2,y:b.y+3},SPECTRAL_CLOTH.dark,2);
}
export function drawGhostClaws(c,h,elbow,d,side){
 rect(c,h.x-2,h.y-2,4,4,SPECTRAL_CLOTH.dark);rect(c,h.x-1,h.y-2,3,3,SPECTRAL_CLOTH.light);
 const profile=d===2||d===6,s=profile?(d===2?1:-1):(side==='L'?-1:1);
 for(let n=0;n<3;n++){
  const root={x:h.x+s*(n-1),y:h.y+1},bend={x:h.x+s*(n-1)*2,y:h.y+3+n%2},tip={x:bend.x-s,y:bend.y+3};
  pixelLine(c,root,bend,SPECTRAL_CLOTH.ink,2);pixelLine(c,bend,tip,SPECTRAL_CLOTH.ink,2);
  pixelLine(c,root,bend,SPECTRAL_CLOTH.light,1);pixelLine(c,bend,tip,'#b9e4d0',1);
 }
}
export function drawGhostGloves(c,h,d,side){
 const profile=d===2||d===6,sign=profile?(d===2?1:-1):(side==='L'?-1:1),x=h.x,y=h.y+1;
 poly(c,[[x-3,y-2],[x+2,y-2],[x+3,y+1],[x+2,y+4],[x-2,y+4],[x-4,y+1]],SPECTRAL_CLOTH.ink);
 poly(c,[[x-2,y-1],[x+1,y-1],[x+2,y+1],[x+1,y+3],[x-2,y+3],[x-3,y+1]],SPECTRAL_CLOTH.base);
 pixelLine(c,{x:x-1,y},{x,y:y+2},SPECTRAL_CLOTH.light,1);
 for(let i=0;i<4;i++){const fx=x+sign*(i-1.5),tip={x:fx+sign*(i-1.5)*.25,y:y-(i===0||i===3?3:4)};pixelLine(c,{x:fx,y:y-1},tip,SPECTRAL_CLOTH.ink,2);pixelLine(c,{x:fx-sign*.3,y:y-1},{x:tip.x-sign*.3,y:tip.y+1},SPECTRAL_CLOTH.light,1);rect(c,tip.x-sign*.25,tip.y,1,1,SPECTRAL_CLOTH.trim);}
}
export function drawGhostMist(c,p,time,actor={}){
 const phase=actor.frozen>0?0:time*3+(Number(actor.id)||0),b=p.pelvis;
 for(let strand=0;strand<3;strand++){
  let last={x:b.x+(strand-1)*3,y:b.y+3};
  for(let n=1;n<10;n++){
   const point={x:b.x+(strand-1)*3+Math.sin(phase+n*.5+strand)*n*.24,y:b.y+3+n*1.4};
   if(n<5||n%3!==strand%3)pixelLine(c,last,point,n<4?SPECTRAL_CLOTH.base:n<7?SPECTRAL_CLOTH.dark:'#699b8b',n<4?2:1);
   last=point;
  }
 }
 for(let n=0;n<7;n++){
  const t=((phase*.18+n*.157)%1+1)%1,x=b.x+Math.sin(n*2.1+phase*.4)*(4+t*4),y=b.y+8+t*16;
  rect(c,x,y,1,1,n%3===0?'#e1ffe8':'#7dbda6');
 }
}
export function drawGhostEyes(c,p,d,time,actor={},visible=()=>true){
 if(d===4||actor.hp<=0)return;
 const eyes=['eyeL','eyeR'].filter(n=>visible(n));
 for(const name of eyes){
  const q=p[name];if(!q)continue;
  // Tiny luminous eyes in the hood's dark opening, not a pair of mint blocks
  // over the wearer's cheeks. Keep the existing joint-following trail.
  rect(c,q.x,q.y-2,1,2,'#ddffe2');rect(c,q.x,q.y-2,1,1,'#ffffff');
  if(actor.moving&&actor.hp>0&&!(actor.frozen>0))for(let n=0;n<3;n++){
   const trail=actor.ghostEyeTrail?.[n],dx=trail?trail.x-(actor.x||0):-(actor.faceX||0)*(n+1)*1.5,dy=trail?trail.y-(actor.y||0):-(actor.faceY||0)*(n+1)*1.5;
   rect(c,q.x+dx,q.y-2+dy+Math.sin(time*9+n)*.5,1,1,n===0?'#baffd9':'#6eb99c');
  }
 }
}
export function paintGhostItem(c,id){
 if(id==='ghost_hood')return drawGhostHood(c,{x:12,y:13},0);
 if(id==='ghost_claws'){drawGhostClaws(c,{x:8,y:10},null,0,'L');drawGhostClaws(c,{x:17,y:10},null,0,'R');return true;}
 if(id==='ghost_gloves'){drawGhostGloves(c,{x:8,y:10},0,'L');drawGhostGloves(c,{x:17,y:10},0,'R');return true;}
 if(id==='ghost_robe'){drawGhostRobe(c,{chest:{x:12,y:6},pelvis:{x:12,y:15}},0);return true;}
 if(id==='ghost_mist'){drawGhostMist(c,{pelvis:{x:12,y:-1}},0,{id:0});return true;}
 if(id==='ghost_cape'){poly(c,[[7,3],[17,3],[20,20],[16,17],[14,23],[11,19],[6,22],[4,18]],SPECTRAL_CLOTH.dark);poly(c,[[8,4],[16,4],[18,18],[14,17],[12,21],[10,18],[6,20]],SPECTRAL_CLOTH.base);pixelLine(c,{x:9,y:5},{x:7,y:18},SPECTRAL_CLOTH.light,2);return true;}
 return false;
}
