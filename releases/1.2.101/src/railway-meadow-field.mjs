// Exact route-segment distances at the same 16 px cell centers used by meadow
// placement. Prepare once in the worker instead of searching the railway for
// every ground speck across a large world.
export function buildRailwayMeadowField(d,routes){
 const width=Math.ceil(d.width/16),height=Math.ceil(d.height/16),distance=new Float32Array(width*height);distance.fill(Infinity);const radius=96;
 for(const route of routes)for(let i=1;i<route.points.length;i++){
  const a=route.points[i-1],b=route.points[i],dx=b.x-a.x,dy=b.y-a.y,length=dx*dx+dy*dy;if(!length)continue;
  const x0=Math.max(0,Math.floor((Math.min(a.x,b.x)-radius)/16)),x1=Math.min(width-1,Math.floor((Math.max(a.x,b.x)+radius)/16)),y0=Math.max(0,Math.floor((Math.min(a.y,b.y)-radius)/16)),y1=Math.min(height-1,Math.floor((Math.max(a.y,b.y)+radius)/16));
  for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const px=x*16+8,py=y*16+8,t=Math.max(0,Math.min(1,((px-a.x)*dx+(py-a.y)*dy)/length)),q=(px-a.x-dx*t)**2+(py-a.y-dy*t)**2,index=y*width+x;if(q<radius*radius&&q<distance[index])distance[index]=q;}
 }
 for(let i=0;i<distance.length;i++)distance[i]=Math.sqrt(distance[i]);return {width,height,distance};
}
export function railwayMeadowDistance(field,x,y){const tx=Math.floor(x/16),ty=Math.floor(y/16);return tx<0||ty<0||tx>=field.width||ty>=field.height?Infinity:field.distance[ty*field.width+tx];}
