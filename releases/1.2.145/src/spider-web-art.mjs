import {pixelLine,pixelPolygon} from './pixel-shapes.mjs';

const cache=new Map();
export const WEB_RASTER_LIMIT=12;
const steppedRing=(cx,cy,rx,ry,seed=0,n=28)=>Array.from({length:n},(_,i)=>{
 const a=i*Math.PI*2/n,jitter=1+.055*Math.sin(a*3+seed)+.028*Math.sin(a*7-seed*1.7);
 return {x:Math.round(cx+Math.cos(a)*rx*jitter),y:Math.round(cy+Math.sin(a)*ry*jitter)};
});
const join=(c,points,color,width=1)=>{for(let i=0;i<points.length;i++)pixelLine(c,points[i],points[(i+1)%points.length],color,width);};

function paint(c,x,y,radius){
 const phase=(radius%13)*.31;
 c.save();c.translate(Math.round(x),Math.round(y));
 const edge=steppedRing(0,0,radius,radius*.72,phase,36);
 pixelPolygon(c,edge,'#40394e64');join(c,edge,'#28253f86',2);
 pixelPolygon(c,steppedRing(0,0,radius*.77,radius*.54,phase+.8,30),'#9789aa24');

 // Square mottles make the creeping silk mat feel grown into the ground.
 for(let i=0;i<17;i++){
  const a=i*2.399+phase,dist=radius*(.16+(i%5)*.125),cx=Math.round(Math.cos(a)*dist),cy=Math.round(Math.sin(a)*dist*.69),r=Math.round(radius*(.025+(i%3)*.012));
  pixelPolygon(c,steppedRing(cx,cy,r*1.8,r*.65,i*.7,8),'#aaa1b328');
  c.fillStyle=i%3?'#1f1e3524':'#d9d0e222';c.fillRect(cx-r,cy-r,2*r+1,2*r+1);
 }

 // Broken outer threads fray into little square-ended silk tails.
 for(let i=0;i<18;i++){
  const a=i*Math.PI*2/18+phase*.13,pt=edge[i*2],length=Math.round(radius*(.045+(i%4)*.012));
  const end={x:Math.round(pt.x+Math.cos(a)*length),y:Math.round(pt.y+Math.sin(a)*length*.72)};
  pixelLine(c,pt,end,i%3?'#d6d0df62':'#ddd6e278',1);
  if(i%3===0)c.fillRect(end.x,end.y,2,1);
 }

 // Irregular spokes and stepped cross threads make visible web silk without a
 // smooth vector overlay. The mask stays transparent so the floor reads through.
 const spokes=16;
 for(let i=0;i<spokes;i++){
  const a=i*Math.PI*2/spokes+phase*.09,pt=edge[(i*2+36)%36];
  pixelLine(c,{x:0,y:0},pt,i%3===0?'#e1dce875':'#d0cbd95b',i%4===0?2:1);
 }
 for(let band=1;band<=7;band++){
  const t=band/7,ring=steppedRing(0,0,radius*t,radius*.72*t,phase+band*.39,36);
  for(let i=0;i<ring.length;i++){
   const a=ring[i],b=ring[(i+1)%ring.length];
   if(i%3!==1)pixelLine(c,a,b,band%3===0?'#e1dce86e':'#d5d0df55',1);
  }
 }
 c.restore();
}

export function drawGroundWeb(c,w){
 if(!Number.isFinite(w.x)||!Number.isFinite(w.y)||!Number.isFinite(w.radius)||w.radius<=0)return;
 const radius=Math.min(220,Math.max(12,Math.round(w.radius/4)*4));
 if(typeof document==='undefined'){paint(c,w.x,w.y,radius);return;}
 let canvas=cache.get(radius);
 if(!canvas){canvas=document.createElement('canvas');canvas.width=radius*2+8;canvas.height=Math.ceil(radius*1.44)+8;paint(canvas.getContext('2d'),canvas.width/2,canvas.height/2,radius);if(cache.size>=WEB_RASTER_LIMIT)cache.delete(cache.keys().next().value);cache.set(radius,canvas);}
 c.drawImage(canvas,Math.round(w.x-canvas.width/2),Math.round(w.y-canvas.height/2));
}
export const webRasterStats=()=>({entries:cache.size,limit:WEB_RASTER_LIMIT});
