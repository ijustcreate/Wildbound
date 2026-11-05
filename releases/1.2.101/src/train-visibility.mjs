// Scene ordering uses the carriage footprint at each actor, not its center.
export const trainCarDepth=c=>c.y+Math.abs(Math.cos(c.a))*c.width/2;
export function trainFootprintSlice(c,x){
 const ca=Math.cos(c.a),sa=Math.sin(c.a),points=[[-1,-1],[1,-1],[1,1],[-1,1]].map(([u,v])=>({x:c.x+ca*u*c.length/2-sa*v*c.width/2,y:c.y+sa*u*c.length/2+ca*v*c.width/2})),ys=[];
 for(let i=0;i<4;i++){const a=points[i],b=points[(i+1)%4];if(x<Math.min(a.x,b.x)-.001||x>Math.max(a.x,b.x)+.001)continue;if(Math.abs(b.x-a.x)<.001)ys.push(a.y,b.y);else ys.push(a.y+(b.y-a.y)*(x-a.x)/(b.x-a.x));}
 return ys.length?{back:Math.min(...ys),front:Math.max(...ys)}:null;
}
export function trainActorDepth(p,cars){
 const ride=p.trainRide,own=ride?[ride.car,...(ride.gangway?[ride.gangway.to]:[])]:[];let lower=-Infinity,upper=Infinity;
 for(const c of cars){const depth=trainCarDepth(c);if(own.includes(c.index)){lower=Math.max(lower,depth+.02);continue;}
 const dx=p.x-c.x,dy=p.y-c.y,ca=Math.cos(c.a),sa=Math.sin(c.a),x=ca*dx+sa*dy,y=-sa*dx+ca*dy;
 if(Math.abs(x)>c.length/2+45||Math.abs(y)>c.width/2+60)continue;
 if(Math.abs(y)>c.width/2&&Math.abs(ca)<.15&&Math.abs(x)<c.length/2+12){lower=Math.max(lower,depth+.01);continue;}
 const slice=trainFootprintSlice(c,p.x);if(!slice)continue;
 if(p.y>=slice.front-1)lower=Math.max(lower,depth+.01);else if(p.y<=slice.back+1)upper=Math.min(upper,depth-.01);
 }
 return lower>upper?lower:Math.max(lower,Math.min(upper,p.y));
}
// Test a wall's projected span and its near footprint edge against an actor.
export function trainWallOccludes(car,riders,x,y,z,w,h,height){
 const ca=Math.cos(car.a),sa=Math.sin(car.a),base={...car,x:ca*x-sa*y,y:sa*x+ca*y,length:w,width:h},corners=[];
 for(const dx of[-w/2,w/2])for(const dy of[-h/2,h/2])for(const dz of[z,z+height])corners.push({x:ca*(x+dx)-sa*(y+dy),y:sa*(x+dx)+ca*(y+dy)-dz});
 const left=Math.min(...corners.map(p=>p.x)),right=Math.max(...corners.map(p=>p.x)),top=Math.min(...corners.map(p=>p.y)),bottom=Math.max(...corners.map(p=>p.y));
 return riders.some(r=>{const px=ca*r.x-sa*r.y,ground=sa*r.x+ca*r.y,feet=ground-20-(r.height||0);if(px+12<left||px-12>right||feet<top||feet-54>bottom)return false;const sx=Math.max(left,Math.min(right,px)),slice=trainFootprintSlice(base,sx);return !!slice&&slice.front>=ground-3;});
}
