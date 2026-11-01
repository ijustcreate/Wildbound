// The finale is a visual projection, never a physics simulation. One bounded
// snapshot replaces repeated terrain/rig rendering; neither backend reads pixels.
export const SEAL_LIMITS = Object.freeze({width:960,height:540,rings:20,motes:112,arms:3,armPoints:32});
const TAU=Math.PI*2;
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const smooth=v=>{v=clamp(v);return v*v*(3-2*v);};
export function sealEnvelope(progress){
 const p=clamp(progress),collapse=smooth((p-.05)/.87);
 return {progress:p,scale:Math.max(.001,(1-collapse)**1.35),twist:Math.PI*3.7*smooth(p),energy:Math.sin(Math.PI*p)**.6,flash:Math.max(0,1-Math.abs(p-.9)/.045)*.24};
}
// Differential rotation makes a curved spiral, not a uniform shrinking picture.
export function sealPoint(x,y,cx,cy,radius,progress,out={}){
 const e=sealEnvelope(progress),dx=x-cx,dy=y-cy,r=Math.hypot(dx,dy);
 const angle=e.twist*(1.15-.72*clamp(r/radius)),c=Math.cos(angle),s=Math.sin(angle);
 out.x=cx+(dx*c-dy*s)*e.scale;out.y=cy+(dx*s+dy*c)*e.scale;
 return out;
}
export function sealSurfaceSize(w,h){
 const scale=Math.min(1,SEAL_LIMITS.width/w,SEAL_LIMITS.height/h);
 return {width:Math.max(1,Math.round(w*scale)),height:Math.max(1,Math.round(h*scale))};
}
const vertex=`attribute vec2 position;varying vec2 uv;void main(){uv=position*.5+.5;gl_Position=vec4(position,0.,1.);}`;
const fragment=`precision mediump float;
uniform sampler2D scene;uniform vec2 size;uniform vec2 center;uniform float radius;uniform float contraction;uniform float twist;
varying vec2 uv;
void main(){
 vec2 pixel=vec2(uv.x,1.-uv.y)*size,delta=(pixel-center)/contraction;
 float r=length(delta),angle=-twist*(1.15-.72*clamp(r/radius,0.,1.));
 float c=cos(angle),s=sin(angle);vec2 source=center+vec2(delta.x*c-delta.y*s,delta.x*s+delta.y*c);
 vec2 at=source/size;
 if(at.x<0.||at.y<0.||at.x>1.||at.y>1.){gl_FragColor=vec4(0.);return;}
 vec4 color=texture2D(scene,vec2(at.x,1.-at.y));
 float edge=min(min(source.x,size.x-source.x),min(source.y,size.y-source.y));
 color.a*=smoothstep(0.,2.,edge);gl_FragColor=color;
}`;
function makeGPU(){
 const canvas=document.createElement('canvas'),gl=canvas.getContext('webgl',{alpha:true,premultipliedAlpha:false,antialias:false,depth:false,stencil:false,preserveDrawingBuffer:true});
 if(!gl)return null;
 const program=gl.createProgram();
 for(const [type,source]of [[gl.VERTEX_SHADER,vertex],[gl.FRAGMENT_SHADER,fragment]]){
  const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);
  if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)){gl.deleteShader(shader);gl.deleteProgram(program);return null;}
  gl.attachShader(program,shader);gl.deleteShader(shader);
 }
 gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS)){gl.deleteProgram(program);return null;}
 gl.useProgram(program);gl.bindBuffer(gl.ARRAY_BUFFER,gl.createBuffer());gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
 const at=gl.getAttribLocation(program,'position');gl.enableVertexAttribArray(at);gl.vertexAttribPointer(at,2,gl.FLOAT,false,0,0);
 const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);
 for(const axis of [gl.TEXTURE_WRAP_S,gl.TEXTURE_WRAP_T])gl.texParameteri(gl.TEXTURE_2D,axis,gl.CLAMP_TO_EDGE);
 for(const filter of [gl.TEXTURE_MIN_FILTER,gl.TEXTURE_MAG_FILTER])gl.texParameteri(gl.TEXTURE_2D,filter,gl.NEAREST);
 gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
 const uniforms=Object.fromEntries(['size','center','radius','contraction','twist'].map(n=>[n,gl.getUniformLocation(program,n)]));
 const gpu={canvas,gl,uniforms,lost:false};
 canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();gpu.lost=true;});
 return gpu;
}
let warmedGPU;
// Called while the loading screen is still up, not on the victory frame.
// The first finale takes ownership of this precompiled, tiny GPU context.
export function warmSealVortex(){
 if(warmedGPU!==undefined)return;
 try{
  warmedGPU=makeGPU();if(!warmedGPU)return;
  const {gl,canvas,uniforms:u}=warmedGPU;canvas.width=canvas.height=1;gl.viewport(0,0,1,1);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array(4));
  gl.uniform2f(u.size,1,1);gl.uniform2f(u.center,.5,.5);gl.uniform1f(u.radius,1);gl.uniform1f(u.contraction,1);gl.uniform1f(u.twist,0);gl.drawArrays(gl.TRIANGLE_STRIP,0,4);gl.finish();
 }catch{warmedGPU=null;}
}
export class SealVortex {
 constructor({backend='auto'}={}){
  this.preference=backend;this.backend='canvas';this.snapshot=null;this.stats={captures:0,textureUploads:0,triangles:0,rings:0,motes:0};
  // Fixed deterministic streams: no emitter allocations, growing arrays or RNG
  // in the frame loop. Colors stay readable against pixel-art terrain.
  this.motes=Array.from({length:SEAL_LIMITS.motes},(_,i)=>({phase:((i*73)%113)/113,angle:i*2.39996323,lane:i%3,color:['#b7e8ba','#efd495','#7299a0','#75b8a1'][i%4]}));
 }
 prepare(){
  if(this.prepared)return;this.prepared=true;
  if(this.preference!=='canvas')try{this.gpu=warmedGPU===undefined?makeGPU():warmedGPU;warmedGPU=undefined;}catch{this.gpu=null;}
  if(this.gpu&&!this.gpu.lost)this.backend='webgl';
 }
 capture(snapshot,w,h,cx,cy){
  const started=performance.now();this.prepare();this.stats.prepareMs=performance.now()-started;this.snapshot=snapshot;this.w=w;this.h=h;this.cx=cx;this.cy=cy;
  this.radius=Math.max(Math.hypot(cx,cy),Math.hypot(w-cx,cy),Math.hypot(cx,h-cy),Math.hypot(w-cx,h-cy));
  this.stats.captures++;this.stats.triangles=0;this.stats.rings=0;
  if(this.gpu&&!this.gpu.lost){
   const {gl,canvas}=this.gpu;canvas.width=snapshot.width;canvas.height=snapshot.height;
   gl.viewport(0,0,canvas.width,canvas.height);const upload=performance.now();gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,snapshot);this.stats.uploadMs=performance.now()-upload;
   this.stats.textureUploads++;
  }
 }
 clear(){
  if(this.snapshot){this.snapshot.width=1;this.snapshot.height=1;this.snapshot=null;}
  // Keep at most one compiled program warm across renderer/lobby changes, but
  // release the scene texture. Context-loss handlers belong to the GPU object,
  // not retired renderer instances.
  if(this.gpu&&!this.gpu.lost){const {gl,canvas}=this.gpu;canvas.width=canvas.height=1;gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,null);if(!warmedGPU)warmedGPU=this.gpu;}
  this.gpu=null;this.prepared=false;this.backend='canvas';
 }
 drawWorld(ctx,progress){
  if(!this.snapshot)return;
  const e=sealEnvelope(progress);
  if(e.scale<.006)return;
  if(e.progress<.001){ctx.drawImage(this.snapshot,0,0,this.w,this.h);return;}
  if(this.gpu&&!this.gpu.lost){
   const {gl,canvas,uniforms:u}=this.gpu;
   gl.uniform2f(u.size,this.w,this.h);gl.uniform2f(u.center,this.cx,this.cy);gl.uniform1f(u.radius,this.radius);gl.uniform1f(u.contraction,e.scale);gl.uniform1f(u.twist,e.twist);
   gl.drawArrays(gl.TRIANGLE_STRIP,0,4);ctx.drawImage(canvas,0,0,this.w,this.h);this.stats.triangles=2;return;
  }
  this.backend='canvas';
  // A cheap concentric-band approximation for software renderers. Unlike a
  // clipped triangle mesh it has no diagonal cracks and only 20 image draws.
  const {w,h,snapshot:im,cx,cy,radius}=this,n=SEAL_LIMITS.rings;
  for(let i=n-1;i>=0;i--){
   const outer=(i+1)/n*radius*e.scale+.4,inner=Math.max(0,i/n*radius*e.scale-.4);
   ctx.save();ctx.translate(cx,cy);ctx.beginPath();ctx.arc(0,0,outer,0,TAU);if(inner>0){ctx.moveTo(inner,0);ctx.arc(0,0,inner,0,TAU,true);}ctx.clip('evenodd');
   ctx.rotate(e.twist*(1.15-.72*(i+.5)/n));ctx.scale(e.scale,e.scale);ctx.drawImage(im,-cx,-cy,w,h);ctx.restore();
  }
  this.stats.rings=n;
 }
 drawAir(ctx,progress,foreground=false){
  const e=sealEnvelope(progress),p=e.progress;if(p<=0||p>=1)return;
  const {cx,cy,radius}=this,extent=radius*(.35+.65*(1-p)),opacity=e.energy;
  ctx.save();ctx.globalAlpha=opacity;ctx.lineCap='round';
  // Three curved wind ribbons feed a tilted portal above the tabletop.
  for(let arm=0;arm<SEAL_LIMITS.arms;arm++){
   ctx.beginPath();
   for(let j=0;j<SEAL_LIMITS.armPoints;j++){
    const t=j/(SEAL_LIMITS.armPoints-1),r=10+t*extent,a=arm*TAU/3+p*TAU*1.8-t*5.8;
    const x=cx+Math.cos(a)*r,y=cy+Math.sin(a)*r*.73-5*(1-t);j?ctx.lineTo(x,y):ctx.moveTo(x,y);
   }
   ctx.strokeStyle=arm===1?'#e9cf8d':'#84cbb8';ctx.globalAlpha=opacity*(foreground?.23:.1);ctx.lineWidth=foreground?1:4;ctx.stroke();
  }
  if(!foreground){
   this.stats.motes=0;
   for(const m of this.motes){
    const t=(m.phase+p*2.2)%1,r=12+(1-t)**1.6*extent,a=m.angle+p*9+t*5.5;
    const x=cx+Math.cos(a)*r,y=cy+Math.sin(a)*r*.73-4;
    const oldT=Math.max(0,t-.012),oldR=12+(1-oldT)**1.6*extent,oldA=m.angle+p*9+oldT*5.5;
    ctx.globalAlpha=opacity*Math.min(1,t*8,(1-t)*6);ctx.strokeStyle=m.color;ctx.lineWidth=m.lane===0?1.8:1;
    ctx.beginPath();ctx.moveTo(cx+Math.cos(oldA)*oldR,cy+Math.sin(oldA)*oldR*.73-4);ctx.lineTo(x,y);ctx.stroke();
    ctx.fillStyle=m.color;ctx.fillRect(Math.round(x)-1,Math.round(y)-1,m.lane===0?3:2,2);this.stats.motes++;
   }
  }
  ctx.globalAlpha=opacity*(foreground?.9:.65);
  for(let i=0;i<3;i++){
   const r=(12+i*7)*(1-.4*smooth((p-.72)/.28));ctx.strokeStyle=i===0?'#f2df9e':i===1?'#93d7b9':'#497f76';ctx.lineWidth=i===0?1.5:1;
   ctx.beginPath();ctx.ellipse(cx,cy-5,r,r*.5,p*2+i*.25,0,TAU);ctx.stroke();
  }
  if(foreground&&e.flash){ctx.globalAlpha=e.flash;ctx.fillStyle='#fff4cd';ctx.fillRect(0,0,this.w,this.h);}
  ctx.restore();
 }
}
