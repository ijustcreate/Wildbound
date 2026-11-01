// Shared world-space breeze: grass and tree crowns feel the same passing gust.
export function vegetationWind(x,y,time=0,strength=1){
 const t=Math.floor(time*12)/12,front=t*1.2-x*.007-y*.003;
 return (Math.sin(front)*(.65+.25*Math.sin(t*.37+y*.002))+.12*Math.sin(front*1.7+.8))*strength;
}
export const vegetationWindGLSL=`float vegetationWind(vec2 p,float time,float strength){
 float t=floor(time*12.)/12.,f=t*1.2-p.x*.007-p.y*.003;
 return (sin(f)*(.65+.25*sin(t*.37+p.y*.002))+.12*sin(f*1.7+.8))*strength;
}`;
export function vegetationWindStrength(g={}){
 const w=g.weather;if(!w||!['monsoon','thunderstorm','sandstorm','blizzard'].includes(w.type))return 1;
 const intensity=Math.max(0,Math.min(2,w.intensity??1));
 const onset=Number.isFinite(w.duration)&&Number.isFinite(w.life)?Math.min(1,Math.max(0,w.duration-w.life)/2):1;
 const end=Number.isFinite(w.life)?Math.min(1,Math.max(0,w.life)/2):1;
 return 1+2.4*intensity*onset*end;
}

// Broad leaf fans turn at slightly different times in the same passing gust.
// Two-pixel steps match the crown artwork, rather than warping the whole tree.
export function leafClusterMotion(x,y,time,index,strength=1){
 const t=Math.floor(time*12)/12,phase=index*1.73+x*.013+y*.007;
 const breeze=vegetationWind(x,y,time,strength),flutter=Math.sin(t*3.1+phase);
 const amplitude=Math.min(3.5,Math.max(1,strength));
 return {x:Math.round((breeze*1.5+flutter*.85*amplitude)/2)*2,
  y:Math.round((Math.sin(t*2.2+phase)*.9*amplitude+breeze*.35)/2)*2};
}

// Transient, bounded footprints. Never touch scenery, saves or the actor itself.
export class GrassWake{
 constructor(){this.points=[];this.previous=new Map();this.time=null;this.revision=0;}
 update(actors,time){
  if(this.time===time)return;
  if(this.time!==null&&(time<this.time||time-this.time>10)){this.points=[];this.previous.clear();}
  this.time=time;this.points=this.points.filter(p=>time-p.time<4);
  const alive=new Set();
  for(const a of actors){
   const id=a.id??a;alive.add(id);
   if(a.room||a.hp<=0||a.swimming||a.jumpHeight>6){this.previous.delete(id);continue;}
   const x=a.x,y=a.y+(a.kind?14:1),old=this.previous.get(id);
   if(a.moving){
    const d=old?Math.hypot(x-old.x,y-old.y):0,steps=old&&d<100?Math.min(16,Math.max(1,Math.ceil(d/5))):1;
    if(!old||d>=4||time-old.time>.1){
     for(let i=1;i<=steps;i++){const t=i/steps;this.points.push({x:steps>1?old.x+(x-old.x)*t:x,y:steps>1?old.y+(y-old.y)*t:y,time,radius:a.kind?15:21});}
     this.previous.set(id,{x,y,time});
    }
   }else this.previous.set(id,{x,y,time});
  }
  for(const id of this.previous.keys())if(!alive.has(id))this.previous.delete(id);
  if(this.points.length>256)this.points.splice(0,this.points.length-256);
  this.revision++;
 }
 raster(originX,originY,span,size=128){
  const data=this.data?.length===size*size*4?this.data:new Uint8Array(size*size*4);data.fill(0);this.data=data;
  const scale=size/span;
  for(const p of this.points){
   const fade=Math.exp(-Math.max(0,this.time-p.time-.2)*.9)*Math.min(1,(4-(this.time-p.time))*2);
   const cx=(p.x-originX)*scale,cy=(p.y-originY)*scale,r=p.radius*scale;
   for(let y=Math.max(0,Math.floor(cy-r));y<=Math.min(size-1,Math.ceil(cy+r));y++)for(let x=Math.max(0,Math.floor(cx-r));x<=Math.min(size-1,Math.ceil(cx+r));x++){
    const dx=(x+.5-cx)/r,dy=(y+.5-cy)/r,d=Math.hypot(dx,dy);if(d>=1)continue;
    const pressure=Math.round((1-d*d)*fade*225),i=(y*size+x)*4;
    if(pressure>data[i]){data[i]=pressure;data[i+1]=Math.round((.5+.5*dx/Math.max(.2,d))*255);data[i+3]=255;}
   }
  }
  return data;
 }
}
