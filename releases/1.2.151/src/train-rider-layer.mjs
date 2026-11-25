import {trainOcclusionGeometry,paintTrainOcclusionGeometry} from './train-occlusion-geometry.mjs';
import {drawTrainPart,trainPartPhase,trainViewIndex,trainVisualPartCar} from './train-art.mjs';
import {TRAIN_PARTS} from './train-design.mjs';

const surfaces=new WeakMap();
const masks=new WeakMap(),MASK_BUDGET=8*1024*1024;
function matteKey(actor,occluders,left,top){
 if(!actor.trainRide?.seat&&!actor.trainRide?.driving)return null;
 const parts=[];
 for(const {car,rider,options} of occluders){
  const d=options.design,view=trainViewIndex(car.a),alpha=options.roofAlpha??1;
  if(car.kind==='tender'||alpha>.025&&alpha<.995||TRAIN_PARTS.some(part=>d.art?.[car.kind+':'+part+':'+view]))return null;
  parts.push([car.id,Math.round(car.a*128/Math.PI),Math.round(car.x-left),Math.round(car.y-car.z-top),
   car.length,car.width,Math.round(rider.x),Math.round(rider.y),Math.round(rider.height||0),rider.seatCushionId,
   alpha>.995,trainPartPhase(car,'body',options.time),trainPartPhase(car,'furniture',options.time),options.engine,
   (options.riders||[]).map(p=>[Math.round(p.x),Math.round(p.y),Math.round(p.height||0)]),
   Object.entries(options.doors||{}).filter(([id])=>id.startsWith(car.id+':')),
   [...(options.cocoaTaken||[])].filter(id=>id.startsWith(car.id+':'))]);
 }
 const d=occluders[0].options.design;
 return JSON.stringify([d.trackRevision,d.paint,parts]);
}
function makeSurface(size){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=size;
 return canvas;
}
function maskCache(renderer,design){
 let cache=masks.get(renderer);
 if(!cache||cache.design!==design){cache={design,images:new Map(),probes:new Map(),bytes:0};masks.set(renderer,cache);}
 return cache;
}
function riderMatte(cache,key,size,maker){
 const cached=cache.images.get(key);
 if(cached){cache.images.delete(key);cache.images.set(key,cached);return cached;}
 if(!cache.probes.delete(key)){
  if(cache.probes.size>=128)cache.probes.delete(cache.probes.keys().next().value);
  cache.probes.set(key,true);
  return null;
 }
 const tint=makeSurface(size),mask=makeSurface(size),bytes=size*size*8;
 maker(tint.getContext('2d'),mask.getContext('2d'));
 while(cache.images.size&&cache.bytes+bytes>MASK_BUDGET){const id=cache.images.keys().next().value;cache.bytes-=cache.images.get(id).bytes;cache.images.delete(id);}
 const image={tint,mask,bytes};cache.images.set(key,image);cache.bytes+=bytes;
 return image;
}
function paintRiderOcclusion(c,m,occluders,left,top,composite){
 const opaqueFaces=[],opaqueLines=new Map(),maskPath={path:new Path2D(),count:0};
 m.save();m.translate(-left,-top);c.save();c.translate(-left,-top);
 for(const {car,rider,options}of occluders){
  c.save();c.translate(car.x,car.y-car.z);m.save();m.translate(car.x,car.y-car.z);
  for(const part of TRAIN_PARTS){
   const alpha=part==='roof'?(options.roofAlpha<.025?0:options.roofAlpha??1):1;
   if(!alpha||part==='roof'&&car.kind==='tender')continue;
   const nativeWheels=part==='wheels'&&!options.design.art?.[car.kind+':wheels:'+trainViewIndex(car.a)];
   const posed=trainVisualPartCar(options.design,car,nativeWheels?'chassis':part),delta=car.a-posed.a;
   const clip={...rider,x:Math.cos(delta)*rider.x-Math.sin(delta)*rider.y,y:Math.sin(delta)*rider.x+Math.cos(delta)*rider.y};
   c.globalAlpha=alpha;c.globalCompositeOperation=composite;
   const mesh=trainOcclusionGeometry(c,options.design,posed,part,options);
   if(mesh)paintTrainOcclusionGeometry(c,m,mesh,posed,clip,options,opaqueFaces,opaqueLines,maskPath,composite);
   else drawTrainPart(c,options.design,posed,part,{...options,riderClip:clip,actorMask:true,opaqueFaces,opaqueLines,opaqueRaster:m});
  }
  c.restore();m.restore();
 }
 m.restore();c.restore();
 for(const face of opaqueFaces){
  const area=face.reduce((sum,[x,y],i)=>{const b=face[(i+1)%face.length];return sum+x*b[1]-y*b[0];},0);
  if(area<0)face.reverse();
  face.forEach(([x,y],i)=>i?maskPath.path.lineTo(x,y):maskPath.path.moveTo(x,y));maskPath.path.closePath();
 }
 m.fillStyle='#ffffff';m.fill(maskPath.path);m.strokeStyle='#ffffff';m.lineCap='butt';m.lineJoin='round';
 for(const [width,segments]of opaqueLines){m.beginPath();for(const [a,b]of segments){m.moveTo(a[0],a[1]);m.lineTo(b[0],b[1]);}m.lineWidth=width;m.stroke();}
 return opaqueFaces.length+maskPath.count;
}
// Composite foreground faces onto this actor alone. Repainting a region of the
// world after each rider could otherwise cover an already drawn neighbour.
export function drawTrainRiderLayer(ctx,renderer,actor,occluders,paint){
 if(!occluders.length||typeof document==='undefined'){paint(ctx);return;}
 const metrics=renderer.trainLayerMetrics,started=metrics?performance.now():0;
 // The seated NPC pose has no combat equipment or trails. Its tighter crop
 // lets the geometry pass discard the rest of the nearby carriage earlier.
 const size=actor.trainStudent?120:192,above=actor.trainStudent?84:128;
 let layers=surfaces.get(renderer);
 if(!layers){layers=new Map();surfaces.set(renderer,layers);}
 let layer=layers.get(size);
 if(!layer){const canvas=makeSurface(size),mask=makeSurface(size);layer={canvas,ctx:canvas.getContext('2d'),mask,maskCtx:mask.getContext('2d')};layers.set(size,layer);}
 const c=layer.ctx,m=layer.maskCtx,elevation=actor.jumpHeight||actor.groundHeight||0,left=Math.floor(actor.x)-size/2,top=Math.floor(actor.y-elevation)-above;
 c.setTransform(1,0,0,1,0,0);c.globalAlpha=1;c.globalCompositeOperation='source-over';c.clearRect(0,0,size,size);c.imageSmoothingEnabled=false;
 c.save();c.translate(-left,-top);paint(c);c.restore();
 const painted=metrics?performance.now():0,key=matteKey(actor,occluders,left,top);
 const cached=key?riderMatte(maskCache(renderer,occluders[0].options.design),size+':'+key,size,
  (tint,mask)=>paintRiderOcclusion(tint,mask,occluders,left,top,'source-over')):null;
 let faces=0;
 if(cached){c.globalCompositeOperation='source-atop';c.drawImage(cached.tint,0,0);}
 else {
  m.setTransform(1,0,0,1,0,0);m.globalAlpha=1;m.globalCompositeOperation='source-over';m.clearRect(0,0,size,size);
  faces=paintRiderOcclusion(c,m,occluders,left,top,'source-atop');
 }
 c.globalAlpha=1;c.globalCompositeOperation='destination-out';c.drawImage(cached?.mask||layer.mask,0,0);
 const masked=metrics?performance.now():0;
 ctx.drawImage(layer.canvas,left,top);
 if(metrics){metrics.calls=(metrics.calls||0)+1;metrics.cached=(metrics.cached||0)+Number(!!cached);metrics.paintMs=(metrics.paintMs||0)+painted-started;metrics.maskMs=(metrics.maskMs||0)+masked-painted;metrics.copyMs=(metrics.copyMs||0)+performance.now()-masked;metrics.faces=(metrics.faces||0)+faces;}
}
export function trainRiderLayerSize(){return {width:192,height:192};}
