import {PIXELFX_MODULES} from './pixelfx-catalog.mjs';
import {createFrame, clearFrame, createFx, composite,painterFor} from './vendor/pixelfx/src/core/fx.js';
import {pixelFxActor} from './pixelfx-actor.mjs';
import {actorAlphaOf} from './vendor/pixelfx/src/core/actor.js';

export {PIXELFX_MODULES};
export const PIXELFX_EFFECTS = Object.fromEntries(Object.entries(PIXELFX_MODULES).map(([id,{meta}])=>['pfx-'+id.replaceAll('/','-'),{
 name:meta.name,description:meta.desc,count:1,life:meta.duration,speedX:0,speedY:0,spread:0,gravity:0,size:1,orbit:0,shape:'square',blend:'source-over',start:'#ffffff',end:'#ffffff',
 pixelfx:id,pxOptions:{},pxScale:1,pxAngle:0,pxFlip:false,loop:meta.loop,
}]));

export function pixelOptionLimits(key,def){
 if(key==='seed')return [-999999,999999,1];
 if(['count','rays','shafts','lines','tendrils','coins','teeth'].includes(key))return [1,128,1];
 if(['width','height','radius','size','length','reach'].includes(key))return [1,512,1];
 if(['light','density','power'].includes(key))return [0,4,.05];
 return [def>0?0:-4096,4096,Number.isInteger(def)?1:.05];
}

// Imports contain data only. Options are restricted to the pinned effect's schema.
export function validPixelOptions(id,options={}) {
 const meta=PIXELFX_MODULES[id]?.meta;
 if(!meta||!options||typeof options!=='object'||Array.isArray(options))return false;
 const schema={...meta.options,light:1};
 return Object.entries(options).every(([key,value])=>{
  if(!Object.hasOwn(schema,key))return false;
  const def=schema[key];
  if(Array.isArray(def))return Array.isArray(value)&&value.length===def.length&&value.every((v,i)=>typeof def[i]==='number'?Number.isFinite(v)&&Math.abs(v)<=4096:typeof v==='string'&&/^#[0-9a-f]{3,8}$/i.test(v));
  if(typeof def==='number'){const [min,max,step]=pixelOptionLimits(key,def);return Number.isFinite(value)&&value>=min&&value<=max&&(step!==1||Number.isInteger(value));}
  return typeof def==='boolean'?typeof value==='boolean':typeof value==='string'&&value.length<100;
 });
}
export function validPixelEffect(e){
 return !!PIXELFX_MODULES[e.pixelfx]&&validPixelOptions(e.pixelfx,e.pxOptions)&&Number.isFinite(e.pxScale)&&e.pxScale>=.1&&e.pxScale<=4&&Number.isFinite(e.pxAngle)&&Math.abs(e.pxAngle)<=360&&typeof e.pxFlip==='boolean';
}

const cache=new Map();
const MAX_SURFACES=32;
export const pixelFxCacheStats=()=>({surfaces:cache.size,limit:MAX_SURFACES});
export function clearPixelFxCache(){cache.clear();}
export const pixelFxExtent=e=>Math.max(...PIXELFX_MODULES[e.pixelfx].meta.size)*e.pxScale;
// Reuse one small raster and simulation per configuration. The cache is bounded,
// time is quantized to the effect's own fps, and seeking rebuilds deterministically.
export function pixelFxSurface(effect,time,seed=0,quality=1,context){
 const mod=PIXELFX_MODULES[effect.pixelfx];if(!mod||typeof document==='undefined')return null;
 const {meta}=mod;
 let t=Math.max(0,Number.isFinite(time)?time:0)*meta.duration/effect.life;
 if(effect.loop)t%=meta.duration;else if(t>meta.duration)return null;
 const fps=meta.fps*Math.max(.2,Math.min(1,quality));
 t=Math.floor(t*fps+1e-6)/fps;
 const opts={...effect.pxOptions,gameplay:effect.gameplay===true,seed:(effect.pxOptions?.seed??(Number(seed)||meta.options?.seed||1)),x:0,y:0};
 if(effect.pixelfx==='shadow/life-steal'&&opts.target)opts.target=opts.target.map(v=>Math.max(-384,Math.min(384,v)));
 // A gameplay effect's scale changes its particles, while the body mask stays registered to the rendered actor.
 const actorContext=context?.actor?{...context,size:context.previewBody?context.size:(context.size||43)/(effect.pxScale||1)}:undefined;
 const actor=meta.actor?pixelFxActor(actorContext):null;
 const key=effect.pixelfx+':'+JSON.stringify(opts)+':'+(actor?actor.signature+':'+actor.x+':'+actor.y+':'+actor.w+':'+actor.h:'stock')+':'+(context?.layer||'both')+':'+!!context?.previewBody;
 if(actor)opts.actor=actor;
 let s=cache.get(key);
 if(!s){
  let [w,h]=meta.size;let [ox,oy]=meta.origin;
  if(actor){const left=Math.min(-ox,actor.x-24),top=Math.min(-oy,actor.y-24),right=Math.max(w-ox,actor.x+actor.w+24),bottom=Math.max(h-oy,actor.y+actor.h+16);ox=-left;oy=-top;w=right-left;h=bottom-top;}
  if(effect.pixelfx==='shadow/life-steal'&&opts.target){const [tx,ty]=opts.target,left=Math.floor(Math.min(-ox,tx-50)),top=Math.floor(Math.min(-oy,ty-80)),right=Math.ceil(Math.max(w-ox,tx+60)),bottom=Math.ceil(Math.max(h-oy,ty+40));ox=-left;oy=-top;w=right-left;h=bottom-top;}
  const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;canvas.pxOrigin=[ox,oy];
  s={canvas,c:canvas.getContext('2d'),frame:createFrame(w,h,-ox,-oy),image:null,instance:null,time:-1};s.image=s.c.createImageData(w,h);
 }
 cache.delete(key);cache.set(key,s);if(cache.size>MAX_SURFACES)cache.delete(cache.keys().next().value);
 if(s.time!==t){
  if(!s.instance||t<s.time){s.instance=createFx(mod,opts);s.time=0;}
  s.instance.update(Math.max(0,t-s.time));s.time=t;
  clearFrame(s.frame);
  if(actor&&context?.previewBody){s.instance.draw(s.frame,'back');const p=painterFor(s.frame),alpha=actorAlphaOf(mod,t,opts);if(alpha>0)for(let y=0;y<actor.h;y++)for(let x=0;x<actor.w;x++){const v=actor.pixels[y*actor.w+x];if(v)p.dot(actor.x+x,actor.y+y,v,alpha);}s.instance.draw(s.frame,'front');}
  else s.instance.draw(s.frame,context?.layer);
  composite(s.frame,s.image.data);s.c.putImageData(s.image,0,0);
 }
 return s.canvas;
}
export function drawPixelFx(c,e,time,seed=0,quality=1,context){
 const image=pixelFxSurface(e,time,seed,quality,context);if(!image)return false;
 const origin=image.pxOrigin||PIXELFX_MODULES[e.pixelfx].meta.origin;
 c.save();c.imageSmoothingEnabled=false;c.rotate((e.pxAngle||0)*Math.PI/180);c.scale((e.pxFlip?-1:1)*e.pxScale,e.pxScale);
 c.drawImage(image,-origin[0],-origin[1]);c.restore();return true;
}
