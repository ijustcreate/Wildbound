// Runtime-only character rasters. Never persist an actor, mask or animation in presets/saves.
let paint, preview;
const cache=new Map();
let canvas,pen;
export function setPixelFxActorRenderer(renderer){paint=renderer;cache.clear();}
export function setPixelFxPreviewActor(actor,time=0,size=43){preview={actor,time,size};}
export function pixelFxActorStats(){return {surfaces:cache.size,limit:32};}
export function actorFromRgba(bytes,w,h,x,y){
 const data=new Uint8Array(w*h),pixels=new Uint32Array(w*h);let hash=2166136261;
 for(let i=0;i<data.length;i++){const j=i*4;if(bytes[j+3]>80){data[i]=1;pixels[i]=(255<<24)|(bytes[j+2]<<16)|(bytes[j+1]<<8)|bytes[j];}hash=Math.imul(hash^pixels[i],16777619);}
 return {mask:{w,h,data},pixels,w,h,x,y,k:2,head:[0,y],chest:[0,y+h*.42],eyes:[[Math.floor(w*.4),Math.floor(h*.16)],[Math.floor(w*.6),Math.floor(h*.16)]],signature:(hash>>>0).toString(36)};
}
export function pixelFxActor(context){
 const request=context||preview;if(!paint||!request?.actor||typeof document==='undefined')return null;
 const {actor,time=0,size=43}=request;
 // At most one capture per character/pose/30Hz sample, shared by all its effects.
 const key=JSON.stringify([actor.id,actor.kind,actor.sprite,Math.floor(time*30),size,actor.faceX,actor.faceY,actor.step,actor.attack,actor.charge,actor.equipment,actor.appearance,actor.color,actor.jumpHeight,actor.groundHeight,actor.sleeping]);
 let result=cache.get(key);if(result){cache.delete(key);cache.set(key,result);return result;}
 if(!canvas){canvas=document.createElement('canvas');pen=canvas.getContext('2d',{willReadFrequently:true});}
 const extent=Math.min(768,Math.max(160,Math.ceil(size*2.5))),ox=Math.floor(extent/2),oy=Math.floor(extent*.72);
 if(canvas.width!==extent)canvas.width=canvas.height=extent;
 pen.clearRect(0,0,extent,extent);pen.save();pen.translate(ox,oy);paint(pen,{...actor,x:0,y:0,roomX:0,roomY:0,jumpHeight:0,groundHeight:0},time,size);pen.restore();
 const image=pen.getImageData(0,0,extent,extent);let left=extent,top=extent,right=-1,bottom=-1;
 for(let y=0;y<extent;y++)for(let x=0;x<extent;x++)if(image.data[(y*extent+x)*4+3]>80){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
 if(right<left)return null;
 const w=right-left+1,h=bottom-top+1,bytes=new Uint8ClampedArray(w*h*4);
 for(let y=0;y<h;y++)bytes.set(image.data.subarray(((top+y)*extent+left)*4,((top+y)*extent+left+w)*4),y*w*4);
 result=actorFromRgba(bytes,w,h,left-ox,top-oy);cache.set(key,result);if(cache.size>32)cache.delete(cache.keys().next().value);return result;
}
