import {drawTrainPart,drawTrainCoalFallback,trainPartPhase,trainViewIndex} from './train-art.mjs';
import {drawTenderCoal} from './train-coal.mjs';

const caches=new WeakMap(),MAX_VERTICES=50000,MAX_ENTRIES=64;
const pixel=n=>Math.round(n);
function clipped(points,depth,line=false){
 const out=[];
 if(line){for(let i=1;i<points.length;i++){let a=points[i-1],b=points[i];const da=a[2]-depth,db=b[2]-depth;if(da<0&&db<0)continue;if((da>=0)!==(db>=0)){const u=da/(da-db),edge=a.map((v,j)=>v+(b[j]-v)*u);if(da<0)a=edge;else b=edge;}out.push([a,b]);}return out;}
 for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length],da=a[2]-depth,db=b[2]-depth;if(da>=-1e-7)out.push(a);if((da>=0)!==(db>=0)){const u=da/(da-db);out.push(a.map((v,j)=>v+(b[j]-v)*u));}}return out;
}
export function trainOcclusionCacheStats(d){const c=caches.get(d);return {entries:c?.meshes.size||0,vertices:c?.vertices||0,vertexLimit:MAX_VERTICES,entryLimit:MAX_ENTRIES};}
// Capture the real artist's primitives once, independently of any rider plane.
// A mesh is reusable while its pose, material, doors and fade decisions match.
export function trainOcclusionGeometry(ctx,d,car,part,options){
 if(d.art?.[car.kind+':'+part+':'+trainViewIndex(car.a)])return null;
 const frame=options.occlusionFrame,frameKey=part+':'+car.a+':'+(options.omitFurnitureId||'');
 if(frame?.parts.has(frameKey))return frame.parts.get(frameKey);
 let cache=caches.get(d);if(!cache){cache={meshes:new Map(),vertices:0};caches.set(d,cache);}
 const bits=[];if(part==='body'||part==='furniture')drawTrainPart(ctx,d,car,part,{...options,signatureOnly:true,occlusionOnly:true,visibilityBits:bits});
 const phase=trainPartPhase(car,part,options.time||0);
 const doors=part==='furniture'?Object.entries(options.doors||{}).filter(([k])=>k.startsWith(car.id+':')):[];
 const cups=part==='furniture'?[...(options.cocoaTaken||[])].filter(k=>k.startsWith(car.id+':')):[];
 const key=JSON.stringify([d.trackRevision||0,car.id,car.kind,car.a,car.length,car.width,part,phase,options.engine||false,options.omitFurnitureId||null,d.paint,d.interiors?.[car.id],doors,cups,bits]);
 let mesh=cache.meshes.get(key);
 if(mesh){cache.meshes.delete(key);cache.meshes.set(key,mesh);}
 else {
  mesh={primitives:[],vertices:0};const ca=Math.cos(car.a),sa=Math.sin(car.a);
  ctx.save();ctx.globalAlpha=1;
  drawTrainPart(ctx,d,car,part,{...options,painted:false,staticArt:part==='wheels',occlusionCapture:true,primitiveSink:p=>{
   if(p.kind==='coal'){mesh.primitives.push(p);return;}
   const points=p.points.map(([x,y,z=0])=>[ca*x-sa*y,sa*x+ca*y-z,sa*x+ca*y]),pad=(p.width||0)/2+1.5;
   const colorAlpha=/^#[a-f0-9]{8}$/i.test(p.color)?parseInt(p.color.slice(7,9),16)/255:1;
   mesh.primitives.push({...p,points,pixels:points.map(([x,y])=>[pixel(x),pixel(y)]),opacity:p.alpha*colorAlpha,left:Math.min(...points.map(v=>v[0]))-pad,right:Math.max(...points.map(v=>v[0]))+pad,top:Math.min(...points.map(v=>v[1]))-pad,bottom:Math.max(...points.map(v=>v[1]))+pad,depth:Math.max(...points.map(v=>v[2])),minDepth:Math.min(...points.map(v=>v[2]))});mesh.vertices+=points.length;
  }});ctx.restore();
  if(mesh.vertices<=MAX_VERTICES){while(cache.meshes.size&&(cache.meshes.size>=MAX_ENTRIES||cache.vertices+mesh.vertices>MAX_VERTICES)){const k=cache.meshes.keys().next().value;cache.vertices-=cache.meshes.get(k).vertices;cache.meshes.delete(k);}cache.meshes.set(key,mesh);cache.vertices+=mesh.vertices;}
 }
 frame?.parts.set(frameKey,mesh);return mesh;
}
export function paintTrainOcclusionGeometry(ctx,raster,mesh,car,rider,options,faces,lines,maskPath,composite='source-atop'){
 const transform=ctx.getTransform(),depth=Math.sin(car.a)*rider.x+Math.cos(car.a)*rider.y,partAlpha=ctx.globalAlpha;
 const left=-transform.e-1,right=ctx.canvas.width-transform.e+1,top=-transform.f-1,bottom=ctx.canvas.height-transform.f+1;
 const moved=points=>points.map(([x,y])=>[transform.a*x+transform.c*y+transform.e,transform.b*x+transform.d*y+transform.f]);
 for(const p of mesh.primitives){
  if(p.kind==='coal'){
   const ca=Math.abs(Math.cos(car.a)),sa=Math.abs(Math.sin(car.a)),hw=Math.max(15,(car.length-44)/2),hh=Math.max(14,(car.width-44)/2);
   const xReach=ca*hw+sa*hh+8,yReach=sa*hw+ca*hh+8;
   if(xReach<left||-xReach>right||yReach-25<top||-yReach-58>bottom)continue;
   if(!drawTenderCoal(raster,car,options.time,options.speed,rider))drawTrainCoalFallback(ctx,car,options.time,options.speed,{riderClip:rider,actorMask:true,opaqueFaces:faces,opaqueLines:lines});
   continue;
  }
  if(p.seatCushionId&&p.seatCushionId===rider.seatCushionId||p.depth<depth-1e-6||p.right<left||p.left>right||p.bottom<top||p.top>bottom)continue;
  const alpha=partAlpha*p.alpha,opaque=partAlpha*p.opacity>=.999,fullyInFront=p.minDepth>=depth;
  if(opaque&&fullyInFront&&p.kind==='poly'&&maskPath){
   if(!p.maskPath){
    const area=p.pixels.reduce((sum,[x,y],i)=>{const b=p.pixels[(i+1)%p.pixels.length];return sum+x*b[1]-y*b[0];},0);
    const points=area<0?p.pixels.slice().reverse():p.pixels;
    p.maskPath=new Path2D();
    points.forEach(([x,y],i)=>i?p.maskPath.lineTo(x,y):p.maskPath.moveTo(x,y));
    p.maskPath.closePath();
   }
   maskPath.path.addPath(p.maskPath,transform);maskPath.count++;
   continue;
  }
  const paths=fullyInFront&&p.kind!=='line'?[p.pixels]:p.kind==='line'?clipped(p.points,depth,true):[clipped(p.points,depth)];
  for(const path of paths){if(path.length<(p.kind==='line'?2:3))continue;const points=path===p.pixels?path:path.map(([x,y])=>[pixel(x),pixel(y)]);
   if(opaque){if(p.kind==='line'){let group=lines.get(p.width);if(!group){group=[];lines.set(p.width,group);}for(let i=1;i<points.length;i++)group.push(moved([points[i-1],points[i]]));}else faces.push(moved(points));continue;}
   ctx.globalAlpha=alpha;ctx.globalCompositeOperation=composite;ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));
   if(p.kind==='line'){ctx.strokeStyle=p.color;ctx.lineWidth=p.width;ctx.lineJoin='round';ctx.stroke();}else{ctx.closePath();ctx.fillStyle=p.color;ctx.fill();}
  }
 }
 ctx.globalAlpha=partAlpha;
}
