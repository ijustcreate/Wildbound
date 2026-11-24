// Intersect individual physical faces with the vertical plane through the actor.
// Keeping this in train-local coordinates also handles rotated coaches/gangways.
export function trainViewDepth(point,angle){return Math.sin(angle)*point[0]+Math.cos(angle)*point[1];}
export function clipTrainFace(points,angle,rider){
 const depth=trainViewDepth([rider.x,rider.y],angle),out=[];
 for(let i=0;i<points.length;i++){
  const a=points[i],b=points[(i+1)%points.length],da=trainViewDepth(a,angle)-depth,db=trainViewDepth(b,angle)-depth;
  if(da>=-1e-7)out.push(a);
  if((da>=0)!==(db>=0)){const u=da/(da-db);out.push(a.map((v,j)=>v+(b[j]-v)*u));}
 }
 return out;
}
export function clipTrainLine(points,angle,rider){
 const depth=trainViewDepth([rider.x,rider.y],angle),segments=[];
 for(let i=1;i<points.length;i++){
  let a=points[i-1],b=points[i];const da=trainViewDepth(a,angle)-depth,db=trainViewDepth(b,angle)-depth;
  if(da<0&&db<0)continue;
  if((da>=0)!==(db>=0)){const u=da/(da-db),edge=a.map((v,j)=>v+(b[j]-v)*u);if(da<0)a=edge;else b=edge;}
  segments.push([a,b]);
 }
 return segments;
}
