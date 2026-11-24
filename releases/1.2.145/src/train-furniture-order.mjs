import {trainSeatBack} from './train-surfaces.mjs';
// Sort physical pieces, rather than whole seats/tables by their floor centers.
// A raised tabletop must cover a lower cushion even when its center is farther
// from the camera. Separating axes retain the correct near/far wall ordering.
export function sortTrainFurniturePieces(pieces,angle){
 const sa=Math.sin(angle),ca=Math.cos(angle),prepared=pieces.map((piece,index)=>{
  const b=piece.bounds,xs=[],ys=[];
  for(const x of [b.x0,b.x1])for(const y of [b.y0,b.y1])for(const z of [b.z0,b.z1]){xs.push(ca*x-sa*y);ys.push(sa*x+ca*y-z);}
  return {...piece,index,left:Math.min(...xs),right:Math.max(...xs),top:Math.min(...ys),bottom:Math.max(...ys),depth:sa*(b.x0+b.x1)/2+ca*(b.y0+b.y1)/2+(b.z0+b.z1)/2};
 }),edges=prepared.map(()=>[]),incoming=prepared.map(()=>0);
 const separated=(a,b,axis,direction)=>direction>1e-6?a[axis+'1']<=b[axis+'0']+.001:direction< -1e-6?a[axis+'0']>=b[axis+'1']-.001:false;
 for(let i=0;i<prepared.length;i++)for(let j=i+1;j<prepared.length;j++){
  const a=prepared[i],b=prepared[j];if(a.right<b.left-1.5||b.right<a.left-1.5||a.bottom<b.top-1.5||b.bottom<a.top-1.5)continue;
  const ab=separated(a.bounds,b.bounds,'x',sa)||separated(a.bounds,b.bounds,'y',ca)||a.bounds.z1<=b.bounds.z0+.001,ba=separated(b.bounds,a.bounds,'x',sa)||separated(b.bounds,a.bounds,'y',ca)||b.bounds.z1<=a.bounds.z0+.001;
  if(ab===ba)continue;const from=ab?i:j,to=ab?j:i;edges[from].push(to);incoming[to]++;
 }
 const order=[],remaining=new Set(prepared.map((_,i)=>i));
 while(remaining.size){let next;for(const i of remaining)if(!incoming[i]&&(next===undefined||prepared[i].depth<prepared[next].depth||prepared[i].depth===prepared[next].depth&&i<next))next=i;
  // Intersecting custom furniture can have cyclic constraints. Resolve the
  // smallest remaining depth deterministically without losing any artwork.
  if(next===undefined)for(const i of remaining)if(next===undefined||prepared[i].depth<prepared[next].depth)next=i;
  remaining.delete(next);order.push(pieces[next]);for(const to of edges[next])incoming[to]--;
 }
 return order;
}
export function trainFurniturePainter(painter,car){
 const pieces=[],add=(method,args,bounds)=>pieces.push({method,args,bounds});
 const vertices=(method,points,args)=>{const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]),zs=points.map(p=>p[2]||0);add(method,args,{x0:Math.min(...xs),x1:Math.max(...xs),y0:Math.min(...ys),y1:Math.max(...ys),z0:Math.min(...zs),z1:Math.max(...zs)});};
 const box=method=>(x,y,z,w,h,depth,...args)=>add(method,[x,y,z,w,h,depth,...args],{x0:x-w/2,x1:x+w/2,y0:y-h/2,y1:y+h/2,z0:z,z1:z+depth});
 return {box:box('box'),wallBox:box('wallBox'),poly:(points,...args)=>vertices('poly',points,[points,...args]),line:(points,...args)=>vertices('line',points,[points,...args]),flush(){for(const piece of sortTrainFurniturePieces(pieces,car.a))painter[piece.method](...piece.args);}};
}

// Clip physical table faces to the part in front of this rider's vertical body plane.
// This preserves a near-side sitter in front and covers the legs of a far-side sitter.
export function trainTableForegroundFaces(table,angle,rider){
 return trainFurnitureForegroundFaces(table,angle,rider);
}
export function trainFurnitureForegroundFaces(table,angle,rider){
 const sa=Math.sin(angle),ca=Math.cos(angle),depth=sa*rider.x+ca*rider.y;
 const clip=points=>{const out=[];for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length],da=sa*a[0]+ca*a[1]-depth,db=sa*b[0]+ca*b[1]-depth;if(da>=0)out.push(a);if((da>=0)!==(db>=0)){const u=da/(da-db);out.push(a.map((v,j)=>v+(b[j]-v)*u));}}return out;};
 const {x,y}=table,faces=[],elevation=rider.height||rider.groundHeight||0;
 const box=(o,z,top)=>{if(elevation>=top-20-.01)return;const x0=o.x-o.w/2,x1=o.x+o.w/2,y0=o.y-o.h/2,y1=o.y+o.h/2;faces.push([[x0,y0,top],[x1,y0,top],[x1,y1,top],[x0,y1,top]],[[x0,y0,z],[x1,y0,z],[x1,y0,top],[x0,y0,top]],[[x0,y1,z],[x1,y1,z],[x1,y1,top],[x0,y1,top]],[[x0,y0,z],[x0,y1,z],[x0,y1,top],[x0,y0,top]],[[x1,y0,z],[x1,y1,z],[x1,y1,top],[x1,y0,top]]);};
 if(!table.kind||table.kind==='table'){box(table,31,34);box({...table,w:4,h:4},20,31);}
 if(table.kind==='seat'){box(table,20,28);box(trainSeatBack(table),25,39);}
 if(table.kind==='console')box(table,20,41);
 if(table.kind==='firebox')box(table,20,45);
 // The saucer/cup and its steam have their own raised occlusion footprint.
 if((!table.kind||table.kind==='table')&&elevation<30&&sa*x+ca*y>depth)faces.push([[x-9,y,34],[x+9,y,34],[x+9,y,50],[x-9,y,50]]);
 return faces.map(clip).filter(p=>p.length>=3);
}
