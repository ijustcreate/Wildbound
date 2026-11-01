import {railwayWaterDepth} from './railway-water.mjs';
// Closed, editable Catmull-Rom routes with distance lookup, elevation and bridge queries.
export function buildTrainRoute(design,routeId=design.activeRoute){
 const r=design.routes.find(r=>r.id===routeId);if(!r)throw Error('Missing railway route.');const nodes=r.nodes.map(id=>design.nodes.find(n=>n.id===id));if(nodes.some(n=>!n))throw Error('Route refers to a missing track point.');
 const points=[];let length=0;const n=nodes.length;
 for(let i=0;i<n;i++){const p0=nodes[(i+n-1)%n],p1=nodes[i],p2=nodes[(i+1)%n],p3=nodes[(i+2)%n],steps=Math.max(12,Math.ceil(Math.hypot(p2.x-p1.x,p2.y-p1.y)/9));
  if(Math.hypot(p2.x-p1.x,p2.y-p1.y)<75)throw Error('Track control points need at least 75 pixels between them.');
  for(let j=0;j<steps;j++){const t=j/steps,q={edge:i};for(const k of['x','y','z'])q[k]=.5*((2*p1[k])+(-p0[k]+p2[k])*t+(2*p0[k]-5*p1[k]+4*p2[k]-p3[k])*t*t+(-p0[k]+3*p1[k]-3*p2[k]+p3[k])*t*t*t);q.z=Math.max(0,q.z);if(q.x<30||q.y<30||q.x>design.width-30||q.y>design.height-30)throw Error('Track curve goes outside the map bounds.');if(points.length){const prev=points.at(-1),ds=Math.hypot(q.x-prev.x,q.y-prev.y);if(ds<.05)throw Error('Track folds back on itself.');if(Math.abs(q.z-prev.z)/ds>.14)throw Error('Track grade is too steep; spread the elevation change over more track.');length+=ds;}points.push({...q,s:length});}
 }
 const first=points[0],last=points.at(-1);length+=Math.hypot(first.x-last.x,first.y-last.y);points.push({...first,s:length});
 for(let i=1;i<points.length-1;i++){const a=points[i-1],b=points[i],c=points[i+1],turn=Math.atan2((b.x-a.x)*(c.y-b.y)-(b.y-a.y)*(c.x-b.x),(b.x-a.x)*(c.x-b.x)+(b.y-a.y)*(c.y-b.y));if(Math.abs(turn)>.19)throw Error('Curve is too tight for long coaches. Move the control points farther apart.');}
 if(design.cars&&length<design.cars.reduce((n,c)=>n+c.length+20,160))throw Error('The closed route is too short for this train.');
 return {points,length,id:r.id};
}
export function sampleTrainRoute(route,distance){const s=((distance%route.length)+route.length)%route.length,p=route.points;let lo=0,hi=p.length-1;while(hi-lo>1){const m=(lo+hi)>>1;if(p[m].s<=s)lo=m;else hi=m;}const a=p[lo],b=p[hi],t=(s-a.s)/(b.s-a.s);return {x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,z:a.z+(b.z-a.z)*t,a:Math.atan2(b.y-a.y,b.x-a.x),edge:a.edge,s};}
export function nearestTrainTrack(route,x,y){let best={distance:Infinity};for(let i=1;i<route.points.length;i++){const a=route.points[i-1],b=route.points[i],dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((x-a.x)*dx+(y-a.y)*dy)/(dx*dx+dy*dy))),px=a.x+dx*t,py=a.y+dy*t,distance=Math.hypot(x-px,y-py);if(distance<best.distance)best={distance,x:px,y:py,s:a.s+(b.s-a.s)*t,z:a.z+(b.z-a.z)*t,edge:a.edge,a:Math.atan2(dy,dx)};}return best;}
export function railwayWater(d,x,y){return railwayWaterDepth(d,x,y);}
export function railElevation(d,q){const edge=d.river.width/2+120-Math.abs(q.x-d.river.x),ramp=Math.max(0,Math.min(1,edge/120));return q.z+10*ramp*ramp*(3-2*ramp);}
export function sampleTrainTrail(t,distance){const segment=t.routeSegments?.findLast(s=>s.at<=distance)||t.routeSegments?.[0];return sampleTrainRoute(segment?.route||t.route,distance+(segment?.offset||0));}
export function trainCars(t){let offset=0;return t.design.cars.map((def,index)=>{if(index)offset+=(t.design.cars[index-1].length+def.length)/2+20;const q=sampleTrainTrail(t,t.distance-offset),front=sampleTrainTrail(t,t.distance-offset+def.length*.32),rear=sampleTrainTrail(t,t.distance-offset-def.length*.32);return {...q,...def,index,a:Math.atan2(front.y-rear.y,front.x-rear.x),z:railElevation(t.design,q),front,rear};});}
export function trainWorld(c,x,y,z=0){return{x:c.x+Math.cos(c.a)*x-Math.sin(c.a)*y,y:c.y+Math.sin(c.a)*x+Math.cos(c.a)*y,z:c.z+z};}
export function trainLocal(c,p){const x=p.x-c.x,y=p.y-c.y;return{x:Math.cos(c.a)*x+Math.sin(c.a)*y,y:-Math.sin(c.a)*x+Math.cos(c.a)*y};}
