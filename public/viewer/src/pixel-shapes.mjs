import {projectPoint} from './player-motion.mjs';
export function pixelLine(c,a,b,color,width=1){c.fillStyle=color;const w=Math.max(1,Math.round(width)),n=Math.ceil(Math.hypot(b.x-a.x,b.y-a.y));for(let i=0;i<=n;i++)c.fillRect(Math.round(a.x+(b.x-a.x)*i/Math.max(1,n)-w/2),Math.round(a.y+(b.y-a.y)*i/Math.max(1,n)-w/2),w,w);}
export function pixelPolygon(c,points,color){
 if(points.length<3)return;c.fillStyle=color;
 const min=Math.ceil(Math.min(...points.map(p=>p.y))),max=Math.floor(Math.max(...points.map(p=>p.y)));
 for(let y=min;y<=max;y++){
  const hits=[];for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length];if((a.y<=y+.5&&b.y>y+.5)||(b.y<=y+.5&&a.y>y+.5))hits.push(a.x+(y+.5-a.y)*(b.x-a.x)/(b.y-a.y));}
  hits.sort((a,b)=>a-b);for(let i=0;i+1<hits.length;i+=2){const x=Math.ceil(hits[i]),right=Math.floor(hits[i+1]);if(right>=x)c.fillRect(x,y,right-x+1,1);}
 }
}
const volumes=new Map();export const PIXEL_VOLUME_CACHE_LIMIT=256;
export function pixelVolume(c,center,rx,ry,rz,d,pal){
 rx=Math.max(.5,rx);ry=Math.max(.5,ry);rz=Math.max(.5,rz);
 const key=[rx,ry,rz,d,pal.body,pal.shade,pal.light,pal.outline].join(':');let spans=volumes.get(key);
 if(!spans){
  spans=[];const a=d*Math.PI/4,co=Math.cos(a),si=Math.sin(a),lim=Math.ceil(Math.max(rx,ry)+rz+1);
  for(let y=-lim;y<=lim;y++)for(let x=-lim;x<=lim;x++){
   const bx=x*co,by=-x*si,bz=-y,A=si*si/rx**2+co*co/ry**2+.25/rz**2,B=2*(bx*si/rx**2+by*co/ry**2+bz*.5/rz**2),C=bx*bx/rx**2+by*by/ry**2+bz*bz/rz**2-1,disc=B*B-4*A*C;if(disc<0)continue;
   const depth=(-B+Math.sqrt(disc))/(2*A),nx=(bx+si*depth)/rx**2,ny=(by+co*depth)/ry**2,nz=(bz+.5*depth)/rz**2,light=(-.45*nx-.3*ny+.82*nz)/Math.hypot(nx,ny,nz);
   const color=Math.sqrt(disc)/A<1.3?pal.outline||pal.shade:light>.72?pal.light:light>.08?pal.body:pal.shade,last=spans.at(-1);
   if(last&&last[1]===y&&last[3]===color&&last[0]+last[2]===x)last[2]++;else spans.push([x,y,1,color]);
  }
  if(volumes.size>=PIXEL_VOLUME_CACHE_LIMIT)volumes.delete(volumes.keys().next().value);volumes.set(key,spans);
 }
 const p=projectPoint(center,d),x=Math.round(p.x),y=Math.round(p.y);for(const [xx,yy,w,color]of spans){c.fillStyle=color;c.fillRect(x+xx,y+yy,w,1);}
}
