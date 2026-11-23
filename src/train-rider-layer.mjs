import {trainOcclusionGeometry,paintTrainOcclusionGeometry} from './train-occlusion-geometry.mjs';
import {drawTrainPart,trainVisualPartCar} from './train-art.mjs';
import {TRAIN_PARTS} from './train-design.mjs';

const surfaces=new WeakMap();
// Composite foreground faces onto this actor alone. Repainting a region of the
// world after each rider could otherwise cover an already drawn neighbour.
export function drawTrainRiderLayer(ctx,renderer,actor,occluders,paint){
 if(!occluders.length||typeof document==='undefined'){paint(ctx);return;}
 const metrics=renderer.trainLayerMetrics,started=metrics?performance.now():0;
 let layer=surfaces.get(renderer);
 if(!layer){const canvas=document.createElement('canvas');canvas.width=canvas.height=192;const mask=document.createElement('canvas');mask.width=mask.height=192;layer={canvas,ctx:canvas.getContext('2d'),mask,maskCtx:mask.getContext('2d')};surfaces.set(renderer,layer);}
 const c=layer.ctx,m=layer.maskCtx,opaqueFaces=[],opaqueLines=new Map(),elevation=actor.jumpHeight||actor.groundHeight||0,left=Math.floor(actor.x)-96,top=Math.floor(actor.y-elevation)-128;
 c.setTransform(1,0,0,1,0,0);c.globalAlpha=1;c.globalCompositeOperation='source-over';c.clearRect(0,0,192,192);c.imageSmoothingEnabled=false;
 m.setTransform(1,0,0,1,0,0);m.globalAlpha=1;m.globalCompositeOperation='source-over';m.clearRect(0,0,192,192);m.save();m.translate(-left,-top);c.save();c.translate(-left,-top);paint(c);const painted=metrics?performance.now():0;c.globalCompositeOperation='source-atop';
 for(const {car,rider,options}of occluders){
  c.save();c.translate(car.x,car.y-car.z);m.save();m.translate(car.x,car.y-car.z);
  for(const part of TRAIN_PARTS){
   const alpha=part==='roof'?(options.roofAlpha<.025?0:options.roofAlpha??1):1;
   if(!alpha||part==='roof'&&car.kind==='tender')continue;
   const posed=trainVisualPartCar(options.design,car,part),delta=car.a-posed.a,clip={...rider,x:Math.cos(delta)*rider.x-Math.sin(delta)*rider.y,y:Math.sin(delta)*rider.x+Math.cos(delta)*rider.y};
   c.globalAlpha=alpha;c.globalCompositeOperation='source-atop';const mesh=trainOcclusionGeometry(c,options.design,posed,part,options);if(mesh)paintTrainOcclusionGeometry(c,m,mesh,posed,clip,options,opaqueFaces,opaqueLines);else drawTrainPart(c,options.design,posed,part,{...options,riderClip:clip,actorMask:true,opaqueFaces,opaqueLines,opaqueRaster:m});
  }
  c.restore();m.restore();
 }
 m.restore();if(opaqueFaces.pathBatch){for(const face of opaqueFaces){const area=face.reduce((sum,[x,y],i)=>{const b=face[(i+1)%face.length];return sum+x*b[1]-y*b[0];},0);if(area<0)face.reverse();face.forEach(([x,y],i)=>i?opaqueFaces.pathBatch.lineTo(x,y):opaqueFaces.pathBatch.moveTo(x,y));opaqueFaces.pathBatch.closePath();}m.fillStyle='#ffffff';m.fill(opaqueFaces.pathBatch);}if(opaqueLines.pathBatch){for(const [width,segments]of opaqueLines){let path=opaqueLines.pathBatch.get(width);if(!path){path=new Path2D();opaqueLines.pathBatch.set(width,path);}for(const [a,b]of segments){path.moveTo(a[0],a[1]);path.lineTo(b[0],b[1]);}}m.strokeStyle='#ffffff';m.lineCap='butt';m.lineJoin='round';for(const [width,path]of opaqueLines.pathBatch){m.lineWidth=width;m.stroke(path);}}m.beginPath();for(const face of opaqueFaces.pathBatch?[]:opaqueFaces){const area=face.reduce((sum,[x,y],i)=>{const b=face[(i+1)%face.length];return sum+x*b[1]-y*b[0];},0);if(area<0)face.reverse();face.forEach(([x,y],i)=>i?m.lineTo(x,y):m.moveTo(x,y));m.closePath();}m.fillStyle='#ffffff';m.fill();m.strokeStyle='#ffffff';m.lineCap='butt';m.lineJoin='round';for(const [width,segments]of opaqueLines.pathBatch?[]:opaqueLines){m.beginPath();for(const [a,b]of segments){m.moveTo(a[0],a[1]);m.lineTo(b[0],b[1]);}m.lineWidth=width;m.stroke();}
 c.restore();c.save();c.setTransform(1,0,0,1,0,0);c.globalAlpha=1;c.globalCompositeOperation='destination-out';c.drawImage(layer.mask,0,0);c.restore();const masked=metrics?performance.now():0;ctx.drawImage(layer.canvas,left,top);if(metrics){metrics.calls=(metrics.calls||0)+1;metrics.paintMs=(metrics.paintMs||0)+painted-started;metrics.maskMs=(metrics.maskMs||0)+masked-painted;metrics.copyMs=(metrics.copyMs||0)+performance.now()-masked;metrics.faces=(metrics.faces||0)+opaqueFaces.length+(opaqueFaces.pathCount||0);}
}
export function trainRiderLayerSize(){return {width:192,height:192};}
