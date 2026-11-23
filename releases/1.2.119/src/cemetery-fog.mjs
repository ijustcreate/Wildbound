import {propLightGeometry} from './world-lighting.mjs';
import {pointLightVisibility} from './realtime-shadows.mjs';
import {nearbyScenery} from './performance.mjs';
import {BOARD_TABLE,boardLightVolumes} from './board-table-geometry.mjs';

// One 320x180 surface per layer at most. Three analytic height slices, not a
// volume texture or a screen-resolution ray march. The second half of the same
// render target holds the veil above actors; the first sits below tall scenery.
export const CEMETERY_FOG_LIMITS=Object.freeze({width:320,height:180,lights:4,bearings:32,rings:8,hz:24});
export const CEMETERY_FOG_FRAGMENT=`precision highp float;
varying vec2 uv;
uniform vec2 origin,span;
uniform float time,ambient;
uniform sampler2D shadows,noiseField;
uniform vec4 lights[4];
uniform vec3 colors[4];
uniform vec2 shadowOrigins[4];
float density(vec2 p,float z){
 vec2 drift=vec2(time*3.2,time*.85);
 // Hardware-filtered, seeded 64x64 noise removes dozens of sin/hash operations
 // per fragment. Two independent channels, advected in opposite directions.
 float broad=texture2D(noiseField,(p-drift+z*vec2(1.8,.5))*(.008/64.)).r;
 float curl=texture2D(noiseField,(p+drift*.6+vec2(broad*42.,z*2.))*(.024/64.)).g;
 // A lower threshold keeps broad, readable banks visible between the trees.
 // The previous high cutoff left most of the low-resolution field transparent.
 return smoothstep(.25,.72,broad*.72+curl*.28)*exp(-z*.027);
}
vec3 scatter(vec2 p,float z){
 vec3 light=vec3(.13,.20,.29)*( .65+ambient*.35);
 for(int i=0;i<4;i++){
  vec4 s=lights[i];vec2 delta=p-s.xy;float dist=length(vec3(delta,z-s.w));
  float fall=max(0.,1.-dist/max(1.,s.z));
  vec2 cachedDelta=p-shadowOrigins[i];
  float angle=atan(cachedDelta.y,cachedDelta.x)/6.2831853+.5;
  float ring=clamp(length(cachedDelta)/max(1.,s.z)*8.-.5,0.,7.);
  vec2 visibility=texture2D(shadows,vec2(angle,(float(i)*8.+ring+.5)/32.)).rg;
  float visible=mix(visibility.r,visibility.g,clamp((z-10.)/30.,0.,1.));
  // A mild forward-scattering lobe makes raised lanterns reveal rolling banks.
  float phase=.65+.35*clamp((s.w-z)/max(16.,dist)+.4,0.,1.);
  light+=colors[i]*fall*fall*visible*phase*2.1;
 }
 return light;
}
void main(){
 bool upper=uv.y>.5;vec2 screen=vec2(uv.x,1.-fract(uv.y*2.));
 vec2 p=origin+screen*span;
 float alpha=0.;vec3 sum=vec3(0.);
 for(int k=0;k<3;k++){
  float z=upper?24.+float(k)*12.:4.+float(k)*8.;
  vec2 q=p+vec2(0.,z);float d=density(q,z)*(upper?.17:.38);
  sum+=(1.-alpha)*d*scatter(q,z);alpha+=(1.-alpha)*d;
 }
 // Restrained palette steps; no temporal random dithering or subpixel shimmer.
 vec3 tint=floor(clamp(sum/max(.001,alpha),0.,1.)*31.+.5)/31.;
 gl_FragColor=vec4(tint,min(upper?.30:.62,alpha));
}`;

export function cemeteryFogActive(g){return g?.generatedEnvironment==='graveyard'&&!!g.graveyard&&g.phase==='play'&&!g.openingBoard&&(g.players||[]).some(p=>!p.room&&p.hp>0);}
export function cemeteryFogLights(g,camera,frame){
 const candles=(g.scenery||[]).filter(p=>p.graveyard&&!p.depleted&&(['grave_candles','mausoleum'].includes(p.kind)||p.kind==='cemetery_gate'&&!p.small)).flatMap(p=>{
  const offsets=p.kind==='cemetery_gate'?[-101,101]:p.kind==='mausoleum'?[-35,33]:p.variant?[-5,4]:[-5];
  return offsets.map((dx,i)=>({x:p.x+dx,y:(p.rootY??p.y)+(p.kind==='grave_candles'&&i?-2:0),height:p.kind==='cemetery_gate'?74:p.kind==='mausoleum'?20:15,
   radius:p.kind==='mausoleum'?100:78,intensity:.65,color:'#ffc47c',owner:'cemetery-flame:'+p.id+':'+i}));
 });
 const sources=[...(frame?.sources||[]).filter(s=>!s.room),...candles];
 return sources.filter(s=>Number.isFinite(s.x)&&Number.isFinite(s.y)&&s.radius>0).map(s=>({...s,
  score:Math.max(0,1-Math.hypot(s.x-camera.x,s.y-camera.y)/(s.radius+600))*(s.inventoryLight?3:s.intensity??1)
 })).filter(s=>s.score>0).sort((a,b)=>b.score-a.score).slice(0,4);
}

// A light-local 32-bearing x 8-distance cache at TWO actual heights. The small
// texture travels with the source, so camera motion needs no shadow recompute.
// Only one light is refreshed per frame. Static scenery uses the native volume
// intersection routine; fog cannot illuminate through crypt walls or trunks.
const bearings=Array.from({length:32},(_,a)=>{const angle=((a+.5)/32-.5)*Math.PI*2;return [Math.cos(angle),Math.sin(angle)];});
export function cemeteryFogShadowSlice(source,volumes,target=new Uint8Array(32*8*4)){
 const radius=source.radius,sourceHeight=source.height??30;
 // Reject unreachable/overhead geometry once, rather than in every polar ray.
 const field={volumes:volumes.filter(v=>v.minZ<=Math.max(sourceHeight,40)&&v.maxZ>=Math.min(sourceHeight,10)&&Math.hypot(source.x-v.x,source.y-v.y)<=radius+Math.max(v.rx,v.ry))},p={x:0,y:0,z:10};
 for(let r=0;r<8;r++)for(let a=0;a<32;a++){
  const d=(r+.5)/8*radius;
  p.x=source.x+bearings[a][0]*d;p.y=source.y+bearings[a][1]*d;
  const index=(r*32+a)*4;
  p.z=10;target[index]=Math.round(255*pointLightVisibility(field,source,p));
  p.z=40;target[index+1]=Math.round(255*pointLightVisibility(field,source,p));
  target[index+2]=0;target[index+3]=255;
 }
 return target;
}
const clock=()=>globalThis.performance?.now?.()??Date.now();
const sourceIdentity=s=>s.owner??[s.color,s.radius,s.x,s.y].join(':');
export class CemeteryFogRenderer{
 constructor(){this.surface=null;this.failed=false;this.error=null;this.frames=0;this.shadowUpdates=0;this.cpuMs=0;this.maxCpuMs=0;this.slots=[];this.lastTime=-Infinity;}
 initialize(){
  if(this.surface||this.failed||typeof document==='undefined')return this.surface;
  try{
   const canvas=typeof OffscreenCanvas!=='undefined'?new OffscreenCanvas(1,1):document.createElement('canvas'),gl=canvas.getContext('webgl',{alpha:true,antialias:false,premultipliedAlpha:false,preserveDrawingBuffer:true,depth:false,stencil:false});
   if(!gl)throw Error('WebGL unavailable');
   const program=gl.createProgram();
   for(const [type,source]of [[gl.VERTEX_SHADER,'attribute vec2 position;varying vec2 uv;void main(){uv=position*.5+.5;gl_Position=vec4(position,0.,1.);}'],[gl.FRAGMENT_SHADER,CEMETERY_FOG_FRAGMENT]]){
    const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(shader));gl.attachShader(program,shader);gl.deleteShader(shader);
   }
   gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));gl.useProgram(program);
   const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
   const attr=gl.getAttribLocation(program,'position');gl.enableVertexAttribArray(attr);gl.vertexAttribPointer(attr,2,gl.FLOAT,false,0,0);
   const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.REPEAT);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
   const white=new Uint8Array(32*32*4);white.fill(255);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,32,32,0,gl.RGBA,gl.UNSIGNED_BYTE,white);
   const noiseTexture=gl.createTexture();gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,noiseTexture);
   gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.REPEAT);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.REPEAT);
   gl.uniform1i(gl.getUniformLocation(program,'noiseField'),1);gl.activeTexture(gl.TEXTURE0);
   const uniforms=Object.fromEntries(['origin','span','time','ambient','lights[0]','colors[0]','shadowOrigins[0]'].map(n=>[n,gl.getUniformLocation(program,n)]));
   canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();this.surface=null;this.failed=true;this.error='WebGL context lost';});
   canvas.addEventListener('webglcontextrestored',()=>{this.failed=false;this.error=null;this.slots=[];this.lastTime=-Infinity;});
   const atlas=document.createElement('canvas'),atlasContext=atlas.getContext('2d');
   this.surface={canvas,gl,uniforms,texture,noiseTexture,atlas,atlasContext};return this.surface;
  }catch(error){this.failed=true;this.error=String(error.message);return null;}
 }
 prepare(g,camera,w,h,frame){
  this.active=cemeteryFogActive(g);if(!this.active)return false;
  const s=this.initialize();if(!s||s.gl.isContextLost())return false;
  if(this.game!==g||this.scenery!==g.scenery||this.seed!==g.graveyard.seed){this.game=g;this.scenery=g.scenery;this.seed=g.graveyard.seed;this.slots=[];this.lastTime=-Infinity;}
  const now=clock(),time=g.time||0,viewKey=[camera.x,camera.y,camera.zoom,w,h].join(':');
  const closeView=this.renderCamera&&Math.abs(camera.x-this.renderCamera.x)<16&&Math.abs(camera.y-this.renderCamera.y)<16&&Math.abs(camera.zoom/this.renderCamera.zoom-1)<.03;
  if(time>=this.lastTime&&time-this.lastTime<1/24&&this.outputW===w&&this.outputH===h&&closeView)return true;
  const start=clock(),width=Math.max(1,Math.min(320,Math.ceil(w/4))),height=Math.max(1,Math.min(180,Math.ceil(h/4))),{gl,canvas,uniforms:u}=s;
  if(s.noiseSeed!==g.graveyard.seed){
   let state=((g.graveyard.seed||0)^0x51f15e)|0;const bytes=new Uint8Array(64*64*4);
   for(let i=0;i<bytes.length;i+=4){state^=state<<13;state^=state>>>17;state^=state<<5;bytes[i]=state&255;bytes[i+1]=(state>>>16)&255;bytes[i+3]=255;}
   gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,s.noiseTexture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,64,64,0,gl.RGBA,gl.UNSIGNED_BYTE,bytes);gl.activeTexture(gl.TEXTURE0);s.noiseSeed=g.graveyard.seed;
  }
  if(canvas.width!==width||canvas.height!==height*2){canvas.width=width;canvas.height=height*2;gl.viewport(0,0,width,height*2);}
  const selected=cemeteryFogLights(g,camera,frame),claimed=new Set();
  const sources=Array.from({length:4},(_,i)=>{const light=selected.find(s=>sourceIdentity(s)===this.slots[i]?.identity);if(light)claimed.add(light);return light;});
  for(let i=0;i<4;i++)if(!sources[i]){sources[i]=selected.find(s=>!claimed.has(s));if(sources[i])claimed.add(sources[i]);}
  const positions=new Float32Array(16),colors=new Float32Array(12),origins=new Float32Array(8);
  let updated=false;
  for(let i=0;i<4;i++){
   const light=sources[i];if(!light){this.slots[i]=null;continue;}
   const slot=this.slots[i],identity=sourceIdentity(light),changed=!slot||slot.identity!==identity||slot.radius!==light.radius;
   if(!updated&&(changed||now-(slot?.at??0)>120)){
    const props=nearbyScenery(g.scenery||[],light.x,light.y,light.radius+180);
    const geometryKey=props.map(p=>[p.id,p.x,p.y,p.rootY,p.size,p.width,p.depth,p.height,p.lightHeight,p.depleted,p.falling,p.fallen,p.lightOpacity,p.lightBlocker].join(',')).join(';');
    const moved=changed||Math.hypot(light.x-slot.x,light.y-slot.y)>2||Math.abs((light.height??30)-slot.height)>2;
    if(moved||slot.geometryKey!==geometryKey){
    const volumes=props.flatMap(p=>{
     if(p.depleted||p.falling)return [];
     if(p.kind==='mausoleum')return [{owner:'prop:'+p.id,x:p.x,y:(p.rootY??p.y)-32,rx:70,ry:32,minZ:0,maxZ:p.height||120,shape:'box'}];
     return propLightGeometry(p).volumes;
    });
    if(!g.openingBoard)volumes.push(...boardLightVolumes(BOARD_TABLE));
    const data=cemeteryFogShadowSlice(light,volumes);
    gl.texSubImage2D(gl.TEXTURE_2D,0,0,i*8,32,8,gl.RGBA,gl.UNSIGNED_BYTE,data);
    this.slots[i]={identity,radius:light.radius,x:light.x,y:light.y,height:light.height??30,geometryKey,at:now};this.shadowUpdates++;updated=true;
    }else slot.at=now;
   }
   const rgb=/^#[\da-f]{6}$/i.test(light.color||'')?light.color:'#ffbd70';
   positions.set([light.x,light.y,light.radius,light.height??30],i*4);
   colors.set([1,3,5].map(n=>parseInt(rgb.slice(n,n+2),16)/255*(light.intensity??1)*(this.slots[i]?.identity===identity?1:0)),i*3);
   origins.set([this.slots[i]?.x??light.x,this.slots[i]?.y??light.y],i*2);
  }
  this.bounds={x:camera.x-w/(2*camera.zoom)-32,y:camera.y-h/(2*camera.zoom)-32,w:w/camera.zoom+64,h:h/camera.zoom+64};
  gl.uniform2f(u.origin,this.bounds.x,this.bounds.y);gl.uniform2f(u.span,this.bounds.w,this.bounds.h);
  gl.uniform1f(u.time,time%4096);gl.uniform1f(u.ambient,frame?.ambient??1);
  gl.uniform4fv(u['lights[0]'],positions);gl.uniform3fv(u['colors[0]'],colors);gl.uniform2fv(u['shadowOrigins[0]'],origins);gl.drawArrays(gl.TRIANGLES,0,6);
  // Transfer ownership of the small GPU atlas instead of synchronously copying
  // a WebGL canvas twice into the scene. Close the previous bitmap immediately;
  // at most one displayed bitmap plus the next render target is retained.
  if(canvas.transferToImageBitmap){const next=canvas.transferToImageBitmap();s.bitmap?.close();s.bitmap=next;}
  else{
   if(s.atlas.width!==width||s.atlas.height!==height*2){s.atlas.width=width;s.atlas.height=height*2;}
   s.atlasContext.clearRect(0,0,width,height*2);s.atlasContext.drawImage(canvas,0,0);
  }
  this.lastTime=time;this.viewKey=viewKey;this.outputW=w;this.outputH=h;this.renderCamera={...camera};this.frames++;this.cpuMs=clock()-start;this.maxCpuMs=Math.max(this.maxCpuMs,this.cpuMs);return true;
 }
 draw(ctx,camera,w,h,upper=false,worldSpace=false){
  if(!this.active)return false;
  const s=this.surface;if(!s||this.failed)return false;
  const half=s.canvas.height/2;
  ctx.save();ctx.imageSmoothingEnabled=false;
  // WebGL's upper half appears at the TOP of the copied canvas.
  const y=upper?0:half;
  const b=this.bounds;
  const image=s.bitmap||s.atlas;
  if(worldSpace)ctx.drawImage(image,0,y,s.canvas.width,half,b.x,b.y,b.w,b.h);
  else ctx.drawImage(image,0,y,s.canvas.width,half,w/2+(b.x-camera.x)*camera.zoom,h/2+(b.y-camera.y)*camera.zoom,b.w*camera.zoom,b.h*camera.zoom);
  ctx.restore();return true;
 }
 status(){return {ready:!!this.surface,failed:this.failed,error:this.error,gpuBitmap:!!this.surface?.bitmap,width:this.surface?.canvas.width||0,height:(this.surface?.canvas.height||0)/2,frames:this.frames,shadowUpdates:this.shadowUpdates,cpuMs:this.cpuMs,maxCpuMs:this.maxCpuMs,lights:this.slots.filter(Boolean).length};}
}
