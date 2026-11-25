import {drawTrainPart,drawTrainCoalFallback,trainPartPhase,trainViewIndex} from './train-art.mjs';
import {drawTenderCoal} from './train-coal.mjs';

const caches=new WeakMap(),MAX_VERTICES=50000,MAX_ENTRIES=64;
const OCCLUSION_GROUP_SIZE=16;
const pixel=n=>Math.round(n);
function geometryGroups(primitives){
 const groups=[];
 let group;
 for(const p of primitives){
  if(p.kind==='coal'){
   groups.push({coal:true,primitives:[p]});
   group=null;
   continue;
  }
  if(!group||group.primitives.length===OCCLUSION_GROUP_SIZE){
   group={primitives:[],left:Infinity,right:-Infinity,top:Infinity,bottom:-Infinity,
    depth:-Infinity,minDepth:Infinity,maxLeft:-Infinity,minRight:Infinity,maxTop:-Infinity,minBottom:Infinity};
   groups.push(group);
  }
  group.primitives.push(p);
  group.left=Math.min(group.left,p.left);
  group.right=Math.max(group.right,p.right);
  group.top=Math.min(group.top,p.top);
  group.bottom=Math.max(group.bottom,p.bottom);
  group.depth=Math.max(group.depth,p.depth);
  group.minDepth=Math.min(group.minDepth,p.minDepth);
  group.maxLeft=Math.max(group.maxLeft,p.left);
  group.minRight=Math.min(group.minRight,p.right);
  group.maxTop=Math.max(group.maxTop,p.top);
  group.minBottom=Math.min(group.minBottom,p.bottom);
 }
 return groups;
}
function addOpaquePolygon(path,points){
 let area=0;
 for(let i=0;i<points.length;i++){
  const [x,y]=points[i],b=points[(i+1)%points.length];
  area+=x*b[1]-y*b[0];
 }
 const first=area<0?points.length-1:0,step=area<0?-1:1;
 path.moveTo(...points[first]);
 for(let i=1;i<points.length;i++)path.lineTo(...points[first+i*step]);
 path.closePath();
}
function fullGroupMask(group){
 if(group.fullMask)return group.fullMask;
 const path=new Path2D(),details=[];
 let count=0;
 for(const p of group.primitives){
  if(p.kind==='poly'&&p.opacity>=.999&&!p.seatCushionId){
   addOpaquePolygon(path,p.pixels);
   count++;
  }else details.push(p);
 }
 return group.fullMask={path,details,count};
}
function clipped(points,depth){
 const out=[];
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
  mesh={groups:[],vertices:0};const primitives=[],ca=Math.cos(car.a),sa=Math.sin(car.a);
  ctx.save();ctx.globalAlpha=1;
  drawTrainPart(ctx,d,car,part,{...options,painted:false,staticArt:part==='wheels',occlusionCapture:true,primitiveSink:p=>{
   if(p.kind==='coal'){primitives.push(p);return;}
   const points=[],pixels=[],pad=(p.width||0)/2+1.5;
   let left=Infinity,right=-Infinity,top=Infinity,bottom=-Infinity,depth=-Infinity,minDepth=Infinity;
   for(const [x,y,z=0]of p.points){
    const sx=ca*x-sa*y,sd=sa*x+ca*y,sy=sd-z;
    points.push([sx,sy,sd]);pixels.push([pixel(sx),pixel(sy)]);
    left=Math.min(left,sx);right=Math.max(right,sx);
    top=Math.min(top,sy);bottom=Math.max(bottom,sy);
    depth=Math.max(depth,sd);minDepth=Math.min(minDepth,sd);
   }
   const colorAlpha=/^#[a-f0-9]{8}$/i.test(p.color)?parseInt(p.color.slice(7,9),16)/255:1;
   primitives.push({...p,points,pixels,opacity:p.alpha*colorAlpha,left:left-pad,right:right+pad,top:top-pad,bottom:bottom+pad,depth,minDepth});mesh.vertices+=points.length;
  }});ctx.restore();
  mesh.groups=geometryGroups(primitives);
  if(mesh.vertices<=MAX_VERTICES){while(cache.meshes.size&&(cache.meshes.size>=MAX_ENTRIES||cache.vertices+mesh.vertices>MAX_VERTICES)){const k=cache.meshes.keys().next().value;cache.vertices-=cache.meshes.get(k).vertices;cache.meshes.delete(k);}cache.meshes.set(key,mesh);cache.vertices+=mesh.vertices;}
 }
 frame?.parts.set(frameKey,mesh);return mesh;
}
export function paintTrainOcclusionGeometry(ctx,raster,mesh,car,rider,options,faces,lines,maskPath,composite='source-atop'){
 const transform=ctx.getTransform(),depth=Math.sin(car.a)*rider.x+Math.cos(car.a)*rider.y,partAlpha=ctx.globalAlpha;
 const left=-transform.e-1,right=ctx.canvas.width-transform.e+1,top=-transform.f-1,bottom=ctx.canvas.height-transform.f+1;
 const moved=points=>points.map(([x,y])=>[transform.a*x+transform.c*y+transform.e,transform.b*x+transform.d*y+transform.f]);
 const misses=p=>p.depth<depth-1e-6||p.right<left||p.left>right||p.bottom<top||p.top>bottom;
 for(const group of mesh.groups){
  if(!group.coal&&misses(group))continue;
  let primitives=group.primitives;
  // Batch only when every member overlaps the crop and clears the rider plane.
  // Seat contact, translucency and crossing faces use the original tests.
  if(partAlpha===1&&group.minDepth>=depth&&group.minRight>=left&&group.maxLeft<=right&&group.minBottom>=top&&group.maxTop<=bottom){
   const full=fullGroupMask(group);
   if(full.count){maskPath.path.addPath(full.path,transform);maskPath.count+=full.count;}
   primitives=full.details;
  }
  for(const p of primitives){
   if(p.kind==='coal'){
    const ca=Math.abs(Math.cos(car.a)),sa=Math.abs(Math.sin(car.a)),hw=Math.max(15,(car.length-44)/2),hh=Math.max(14,(car.width-44)/2);
    const xReach=ca*hw+sa*hh+8,yReach=sa*hw+ca*hh+8;
    if(xReach<left||-xReach>right||yReach-25<top||-yReach-58>bottom)continue;
    if(!drawTenderCoal(raster,car,options.time,options.speed,rider))drawTrainCoalFallback(ctx,car,options.time,options.speed,{riderClip:rider,actorMask:true,opaqueFaces:faces,opaqueLines:lines});
    continue;
   }
   if(p.seatCushionId&&p.seatCushionId===rider.seatCushionId||misses(p))continue;
   const alpha=partAlpha*p.alpha,opaque=partAlpha*p.opacity>=.999,fullyInFront=p.minDepth>=depth;
   if(p.kind==='line'){
    for(let i=1;i<p.points.length;i++){
     const a=p.points[i-1],b=p.points[i],da=a[2]-depth,db=b[2]-depth;
     if(da<0&&db<0)continue;
     let x0=p.pixels[i-1][0],y0=p.pixels[i-1][1],x1=p.pixels[i][0],y1=p.pixels[i][1];
     if((da>=0)!==(db>=0)){
      const u=da/(da-db),x=pixel(a[0]+(b[0]-a[0])*u),y=pixel(a[1]+(b[1]-a[1])*u);
      if(da<0){x0=x;y0=y;}else{x1=x;y1=y;}
     }
     if(opaque){
      let outline=maskPath.lines.get(p.width);
      if(!outline){outline=new Path2D();maskPath.lines.set(p.width,outline);}
      const {a,b,c,d,e,f}=transform;
      outline.moveTo(a*x0+c*y0+e,b*x0+d*y0+f);
      outline.lineTo(a*x1+c*y1+e,b*x1+d*y1+f);
     }else{
      ctx.globalAlpha=alpha;ctx.globalCompositeOperation=composite;
      ctx.beginPath();ctx.moveTo(x0,y0);ctx.lineTo(x1,y1);
      ctx.strokeStyle=p.color;ctx.lineWidth=p.width;ctx.lineJoin='round';ctx.stroke();
     }
    }
    continue;
   }
   if(opaque&&fullyInFront){
    if(!p.maskPath){
     p.maskPath=new Path2D();
     addOpaquePolygon(p.maskPath,p.pixels);
    }
    maskPath.path.addPath(p.maskPath,transform);maskPath.count++;
    continue;
   }
   const path=fullyInFront?p.pixels:clipped(p.points,depth);
   if(path.length<3)continue;
   const points=fullyInFront?path:path.map(([x,y])=>[pixel(x),pixel(y)]);
   if(opaque){faces.push(moved(points));continue;}
   ctx.globalAlpha=alpha;ctx.globalCompositeOperation=composite;
   ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));
   ctx.closePath();ctx.fillStyle=p.color;ctx.fill();
  }
 }
 ctx.globalAlpha=partAlpha;
}
