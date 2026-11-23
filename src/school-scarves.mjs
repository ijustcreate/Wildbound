export class ScarfInertia{
 constructor(){this.samples=new Map();}
 sample(a,time){
  const key=a.id;if(key==null||!Number.isFinite(a.x)||!Number.isFinite(a.y))return null;
  const old=this.samples.get(key),dt=old?time-old.time:0;if(old&&dt<=0&&dt>-.25)return old.motion;
  const valid=old&&dt>0&&dt<=.25&&Math.hypot(a.x-old.x,a.y-old.y)<80;
  const vx=valid?(a.x-old.x)/dt:0,vy=valid?(a.y-old.y)/dt:0,tails=valid?old.tails.map(t=>({...t})):Array.from({length:2},()=>({x:0,y:0,z:0,vx:0,vy:0,vz:0}));
  const steps=Math.max(1,Math.ceil(Math.min(.1,Math.max(0,dt))/.016)),h=valid?Math.min(.1,dt)/steps:.016;
  for(let n=0;n<steps;n++)tails.forEach((t,i)=>{const phase=time*3.5+i*1.8,speed=Math.hypot(vx,vy),targets={x:Math.max(-6,Math.min(6,-vx*.022))+Math.sin(phase)*.6,y:Math.max(-6,Math.min(6,-vy*.022))+Math.cos(phase)*.5,z:Math.min(4,speed*.022)+Math.sin(phase+i)*.4};for(const axis of ['x','y','z']){const v='v'+axis;t[v]+=((targets[axis]-t[axis])*55-t[v]*11)*h;t[axis]+=t[v]*h;}});
  const motion={tails:tails.map(({x,y,z})=>({x,y,z}))};if(this.samples.size>=256&&!this.samples.has(key))this.samples.delete(this.samples.keys().next().value);this.samples.set(key,{x:a.x,y:a.y,time,tails,motion});return motion;
 }
}
const poly=(c,points,color)=>{const top=Math.floor(Math.min(...points.map(p=>p.y))),bottom=Math.ceil(Math.max(...points.map(p=>p.y)));c.fillStyle=color;for(let y=top;y<=bottom;y++){const hits=[];for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length];if((a.y<=y+.5&&b.y>y+.5)||(b.y<=y+.5&&a.y>y+.5))hits.push(a.x+(y+.5-a.y)*(b.x-a.x)/(b.y-a.y));}hits.sort((a,b)=>a-b);for(let i=0;i+1<hits.length;i+=2)c.fillRect(Math.floor(hits[i]),y,Math.max(1,Math.ceil(hits[i+1]-hits[i])),1);}};
export function drawScarfTails(c,positions,d,motion,colors,project){
 const neck=positions.neck||positions.chest,a=d*Math.PI/4,co=Math.cos(a),si=Math.sin(a),base=colors[0],trim=colors[1];
 for(const i of [0,1]){const m=motion?.tails?.[i]||{x:Math.sin(i)*.3,y:0,z:0},side=i?1:-1,dx=m.x*co+m.y*si,dy=-m.x*si+m.y*co;
  const root=[neck[0]+side*2.5,neck[1]-2,neck[2]-1],middle=[root[0]+dx*.5+side*.3,root[1]+dy*.5-1,root[2]-5+m.z*.4],tip=[root[0]+dx+side*.5,root[1]+dy-1.5,root[2]-(i?12:14)+m.z];
  const ribbon=(offset,width,color)=>poly(c,[project([root[0]-width,root[1],root[2]+offset],d),project([middle[0]-width,middle[1],middle[2]+offset],d),project([tip[0]-width,tip[1],tip[2]+offset],d),project([tip[0]+width,tip[1],tip[2]+offset],d),project([middle[0]+width,middle[1],middle[2]+offset],d),project([root[0]+width,root[1],root[2]+offset],d)],color);
  ribbon(0,1.7,'#312c32');ribbon(.3,1.15,base);
  for(const t of [.42,.78]){const center=root.map((v,k)=>v+(tip[k]-v)*t);poly(c,[project([center[0]-1.1,center[1],center[2]],d),project([center[0]+1.1,center[1],center[2]],d),project([center[0]+1.1,center[1],center[2]-.9],d),project([center[0]-1.1,center[1],center[2]-.9],d)],trim);}
 }
}
