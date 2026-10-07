// Visual projection only: terrain ownership, sinking and breath stay in quicksand.mjs.
// One tiny topology upload per terrain change, one visible-region pass per frame.
export const QUICKSAND_LIMITS = Object.freeze({tiles:50,tile:32,pixel:2,width:800,height:800,maskBytes:10000,fallbackPatches:16,rings:4,points:32});
const N=50,T=32,W=1600,PIXEL=2,TAU=Math.PI*2;
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const smooth=(a,b,v)=>{const t=clamp((v-a)/(b-a));return t*t*(3-2*t);};
const hash=(x,y)=>{const v=Math.sin(x*127.1+y*311.7)*43758.5453;return v-Math.floor(v);};
const present=(terrain,x,y)=>x>=0&&y>=0&&x<N&&y<N&&terrain?.[y*N+x]==='quicksand';
export function quicksandVisible(g,x,y){
 return g.phase!=='won'&&(g.bloom>=3||Math.hypot(x*T+16-800,y*T+16-800)<=g.bloom*430)&&
  !g.house?.pools?.some(p=>x*T+16>=p.x&&y*T+16>=p.y&&x*T+16<p.x+p.w&&y*T+16<p.y+p.h);
}
export function quicksandBounds(bounds={sx:0,sy:0,ex:N,ey:N}){
 return {sx:clamp(Math.floor(bounds.sx),0,N),sy:clamp(Math.floor(bounds.sy),0,N),ex:clamp(Math.ceil(bounds.ex),0,N),ey:clamp(Math.ceil(bounds.ey),0,N)};
}
// Four-neighbour connected components supply one shared whirlpool center per
// patch. Encoded centers/radii are identical on both sides of every tile edge.
export function buildQuicksandTopology(terrain){
 const data=new Uint8Array(N*N*4),labels=new Int16Array(N*N).fill(-1),patches=[];
 for(let i=0;i<N*N;i++){
  if(terrain?.[i]!=='quicksand'||labels[i]>=0)continue;
  const ids=[i],label=patches.length;labels[i]=label;let sumX=0,sumY=0;
  for(let at=0;at<ids.length;at++){
   const id=ids[at],x=id%N,y=Math.floor(id/N);sumX+=x*T+16;sumY+=y*T+16;
   for(const [dx,dy]of [[-1,0],[1,0],[0,-1],[0,1]]){
    const nx=x+dx,ny=y+dy,next=ny*N+nx;
    if(present(terrain,nx,ny)&&labels[next]<0){labels[next]=label;ids.push(next);}
   }
  }
  const cx=Math.round(sumX/ids.length/W*255),cy=Math.round(sumY/ids.length/W*255);
  const radius=Math.min(800,Math.max(24,Math.sqrt(ids.length)*T*.6)),r=Math.round(radius/800*255);
  patches.push({x:cx/255*W,y:cy/255*W,radius:r/255*800,tiles:ids.length});
  for(const id of ids)data.set([255,cx,cy,r],id*4);
 }
 return {data,labels,patches};
}
// Distance to the union's outer edge, not to the current tile's sides. The
// 3x3 neighbourhood covers the entire narrow shore transition, including corners.
export function quicksandEdge(topology,x,y){
 const tx=Math.floor(x/T),ty=Math.floor(y/T);
 if(tx<0||ty<0||tx>=N||ty>=N||!topology.data[(ty*N+tx)*4])return 0;
 let distance=T;
 for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
  const nx=tx+dx,ny=ty+dy;
  if(nx>=0&&ny>=0&&nx<N&&ny<N&&topology.data[(ny*N+nx)*4])continue;
  distance=Math.min(distance,Math.hypot(Math.max(Math.abs(x-(nx*T+16))-16,0),Math.max(Math.abs(y-(ny*T+16))-16,0)));
 }
 return distance;
}
export function quicksandCoverage(topology,x,y){
 const edge=quicksandEdge(topology,x,y),ragged=3+Math.sin(x*.071+Math.sin(y*.047)*1.7)*1.3+Math.sin(y*.113+x*.023)*.8;
 return Math.round(smooth(ragged-1,ragged+2,edge)*4)/4;
}
const vertex=`attribute vec2 position;varying vec2 uv;void main(){uv=position*.5+.5;gl_Position=vec4(position,0.,1.);}`;
const fragment=`precision highp float;
uniform sampler2D topology;uniform vec2 origin;uniform vec2 extent;uniform float time;uniform float seed;varying vec2 uv;
vec4 cell(vec2 tile){if(tile.x<0.||tile.y<0.||tile.x>=50.||tile.y>=50.)return vec4(0.);return texture2D(topology,(tile+.5)/50.);}
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
void main(){
 vec2 p=floor((origin+vec2(uv.x,1.-uv.y)*extent)/2.)*2.+1.,tile=floor(p/32.);vec4 patch=cell(tile);
 if(patch.r<.5){gl_FragColor=vec4(0.);return;}
 float edge=32.;
 for(int y=-1;y<=1;y++)for(int x=-1;x<=1;x++){
  vec2 near=tile+vec2(float(x),float(y));
  if(cell(near).r<.5)edge=min(edge,length(max(abs(p-(near*32.+16.))-16.,0.)));
 }
 float ragged=3.+sin(p.x*.071+sin(p.y*.047)*1.7)*1.3+sin(p.y*.113+p.x*.023)*.8;
 float alpha=floor(smoothstep(ragged-1.,ragged+2.,edge)*4.+.5)/4.;
 vec2 delta=p-patch.gb*1600.;float radius=max(24.,patch.a*800.),r=length(delta),angle=atan(delta.y,delta.x);
 // Inward travelling rings and differential angular motion create a sinking
 // spiral. Low contrast keeps the hazard legible behind actors and sandstorms.
 float flow=r*.14+angle*2.+time*.85+sin(angle*3.+r*.028-time*.22)*.65+seed;
 float ripple=pow(max(0.,sin(flow)),10.)*.12;
 float curl=sin(angle*3.+r*.043-time*(.24+.38*exp(-r/radius)))*.035;
 float grain=hash(floor(p/4.))*.025,depth=exp(-r/(radius*.48))*.07;
 vec3 color=vec3(.55,.385,.215)+curl+grain-depth;
 color+=ripple*vec3(.75,.59,.33);
 float rim=1.-smoothstep(5.,16.,edge);color=mix(color,vec3(.69,.51,.30),rim*.7);
 gl_FragColor=vec4(floor(color*32.+.5)/32.,alpha);
}`;
function initializeGPU(canvas){
 const gl=canvas.getContext('webgl',{alpha:true,premultipliedAlpha:false,antialias:false,depth:false,stencil:false,preserveDrawingBuffer:true});
 if(!gl)return null;
 const program=gl.createProgram(),shaders=[];let buffer,texture;
 try{
  for(const [type,source]of [[gl.VERTEX_SHADER,vertex],[gl.FRAGMENT_SHADER,fragment]]){
   const shader=gl.createShader(type);shaders.push(shader);gl.shaderSource(shader,source);gl.compileShader(shader);
   if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(shader));gl.attachShader(program,shader);
  }
  gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));gl.useProgram(program);
  buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
  const at=gl.getAttribLocation(program,'position');gl.enableVertexAttribArray(at);gl.vertexAttribPointer(at,2,gl.FLOAT,false,0,0);
  texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);
  for(const axis of [gl.TEXTURE_WRAP_S,gl.TEXTURE_WRAP_T])gl.texParameteri(gl.TEXTURE_2D,axis,gl.CLAMP_TO_EDGE);
  for(const filter of [gl.TEXTURE_MIN_FILTER,gl.TEXTURE_MAG_FILTER])gl.texParameteri(gl.TEXTURE_2D,filter,gl.NEAREST);
  gl.uniform1i(gl.getUniformLocation(program,'topology'),0);
  return {gl,canvas,program,buffer,texture,uniforms:Object.fromEntries(['origin','extent','time','seed'].map(n=>[n,gl.getUniformLocation(program,n)])),uploaded:null};
 }catch(error){
  if(texture)gl.deleteTexture(texture);if(buffer)gl.deleteBuffer(buffer);gl.deleteProgram(program);console.warn('Quicksand shader fallback:',error.message);return null;
 }finally{for(const shader of shaders)gl.deleteShader(shader);}
}
export class QuicksandSurface {
 constructor({backend='auto'}={}){
  this.preference=backend;this.backend='canvas';this.stats={topologyBuilds:0,textureUploads:0,maskBuilds:0,shaderPasses:0,canvasPasses:0,contextLosses:0,width:0,height:0,visibleTiles:0};
 }
 prepare(){
  if(this.tried||this.preference==='canvas')return;this.tried=true;
  try{
   if(!this.gpuCanvas){
    this.gpuCanvas=document.createElement('canvas');
    this.gpuCanvas.addEventListener('webglcontextlost',event=>{event.preventDefault();this.lost=true;this.backend='canvas';this.frameKey=null;this.stats.contextLosses++;});
    this.gpuCanvas.addEventListener('webglcontextrestored',()=>{this.gpu=null;this.lost=false;this.tried=false;});
   }
   this.gpu=initializeGPU(this.gpuCanvas);if(this.gpu)this.backend='webgl';
  }catch{this.gpu=null;}
 }
 rebuild(g){
  this.terrain=g.terrain;this.seed=g.seed;this.revision=g.quicksandVisualRevision;
  this.topology=buildQuicksandTopology(g.terrain);this.stats.topologyBuilds++;
  if(this.mask){this.mask.width=this.mask.height=1;this.mask=null;}
  this.frameKey=null;
 }
 ensureMask(){
  if(this.mask)return;
  const mask=this.mask=document.createElement('canvas');mask.width=mask.height=W/PIXEL;
  const ctx=mask.getContext('2d'),image=ctx.createImageData(mask.width,mask.height),data=image.data;
  for(let ty=0;ty<N;ty++)for(let tx=0;tx<N;tx++){
   const label=this.topology.labels[ty*N+tx];if(label<0)continue;const patch=this.topology.patches[label];
   for(let y=ty*T;y<(ty+1)*T;y+=PIXEL)for(let x=tx*T;x<(tx+1)*T;x+=PIXEL){
    const px=x+1,py=y+1,alpha=quicksandCoverage(this.topology,px,py);if(!alpha)continue;
    const edge=quicksandEdge(this.topology,px,py),r=Math.hypot(px-patch.x,py-patch.y),rim=(1-smooth(5,16,edge))*.7;
    const grain=hash(Math.floor(px/4),Math.floor(py/4))*.025-depthAt(r,patch.radius);
    const offset=((y/PIXEL)*mask.width+x/PIXEL)*4;
    for(let channel=0;channel<3;channel++)data[offset+channel]=Math.round((([.55,.385,.215][channel]+grain)*(1-rim)+[.69,.51,.30][channel]*rim)*255);
    data[offset+3]=Math.round(alpha*255);
   }
  }
  ctx.putImageData(image,0,0);this.stats.maskBuilds++;
 }
 draw(ctx,g,bounds){
  const b=quicksandBounds(bounds);let left=N,top=N,right=0,bottom=0,count=0,changed=!this.topology||this.terrain!==g.terrain||this.seed!==g.seed||this.revision!==g.quicksandVisualRevision;
  // Only compare the already-visible tile range. In-place terrain changes are
  // detected as they enter the camera; hidden editor changes can explicitly bump
  // quicksandVisualRevision. No full-resolution CPU sampling on animated frames.
  for(let y=b.sy;y<b.ey;y++)for(let x=b.sx;x<b.ex;x++){
   const sand=present(g.terrain,x,y);
   if(this.topology&&Boolean(this.topology.data[(y*N+x)*4])!==sand)changed=true;
   if(!sand||!quicksandVisible(g,x,y))continue;
   left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x+1);bottom=Math.max(bottom,y+1);count++;
  }
  this.stats.visibleTiles=count;
  if(!count){if(this.topology&&(this.terrain!==g.terrain||this.seed!==g.seed||g.phase==='won'))this.clear();return false;}
  if(changed)this.rebuild(g);this.prepare();
  const x=left*T,y=top*T,w=(right-left)*T,h=(bottom-top)*T;
  this.stats.width=w/PIXEL;this.stats.height=h/PIXEL;
  // Match the floor's tile-center bloom boundary exactly, including co-op's
  // wider shared camera. A hidden neighbour can shape a shore but cannot reveal it.
  ctx.save();ctx.beginPath();
  for(let ty=top;ty<bottom;ty++){
   let run=-1;
   for(let tx=left;tx<=right;tx++){
    const visible=tx<right&&present(g.terrain,tx,ty)&&quicksandVisible(g,tx,ty);
    if(visible&&run<0)run=tx;
    if(!visible&&run>=0){ctx.rect(run*T,ty*T,(tx-run)*T,T);run=-1;}
   }
  }
  ctx.clip();ctx.imageSmoothingEnabled=false;
  const time=Math.floor((g.time||0)*24)/24,key=`${x}:${y}:${w}:${h}:${time}`;
  if(this.gpu&&!this.lost){
   const {gl,canvas,uniforms:u}=this.gpu;
   if(canvas.width!==w/PIXEL||canvas.height!==h/PIXEL){canvas.width=w/PIXEL;canvas.height=h/PIXEL;gl.viewport(0,0,canvas.width,canvas.height);this.frameKey=null;}
   if(this.gpu.uploaded!==this.topology){
    gl.bindTexture(gl.TEXTURE_2D,this.gpu.texture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,N,N,0,gl.RGBA,gl.UNSIGNED_BYTE,this.topology.data);
    this.gpu.uploaded=this.topology;this.stats.textureUploads++;this.frameKey=null;
   }
   if(this.frameKey!==key){gl.uniform2f(u.origin,x,y);gl.uniform2f(u.extent,w,h);gl.uniform1f(u.time,time);gl.uniform1f(u.seed,(g.seed||0)%997*.013);gl.drawArrays(gl.TRIANGLE_STRIP,0,4);this.stats.shaderPasses++;this.frameKey=key;}
   this.backend='webgl';ctx.drawImage(canvas,x,y,w,h);
  }else{
   this.backend='canvas';this.ensureMask();
   this.stage ||= document.createElement('canvas');const stage=this.stage;
   if(stage.width!==w/PIXEL||stage.height!==h/PIXEL){stage.width=w/PIXEL;stage.height=h/PIXEL;this.frameKey=null;}
   if(this.frameKey!==key){
    const c=stage.getContext('2d');c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,stage.width,stage.height);c.imageSmoothingEnabled=false;
    c.drawImage(this.mask,x/PIXEL,y/PIXEL,w/PIXEL,h/PIXEL,0,0,w/PIXEL,h/PIXEL);c.setTransform(1/PIXEL,0,0,1/PIXEL,-x/PIXEL,-y/PIXEL);
    c.strokeStyle='#c3995b';c.lineWidth=PIXEL;c.globalAlpha=.33;c.globalCompositeOperation='source-atop';
    let patches=0;
    for(const p of this.topology.patches){
     if(p.x+p.radius<x||p.y+p.radius<y||p.x-p.radius>x+w||p.y-p.radius>y+h)continue;
     if(patches++>=QUICKSAND_LIMITS.fallbackPatches)break;
     for(let ring=0;ring<QUICKSAND_LIMITS.rings;ring++){
      c.beginPath();
      for(let i=0;i<=QUICKSAND_LIMITS.points;i++){
       const a=i/QUICKSAND_LIMITS.points*TAU,r=(.2+((ring*.22-time*.025)%1+1)%1)*p.radius;
       const angle=a+time*.14,radius=r+Math.sin(a*2+time*.2)*3+i/QUICKSAND_LIMITS.points*8;
       const px=Math.round((p.x+Math.cos(angle)*radius)/PIXEL)*PIXEL,py=Math.round((p.y+Math.sin(angle)*radius*.85)/PIXEL)*PIXEL;
       i?c.lineTo(px,py):c.moveTo(px,py);
      }c.stroke();
     }
    }
    c.setTransform(1,0,0,1,0,0);c.globalAlpha=1;c.globalCompositeOperation='source-over';
    this.stats.canvasPasses++;this.frameKey=key;
   }
   ctx.drawImage(stage,x,y,w,h);
  }
  ctx.restore();return true;
 }
 clear(){
  if(this.gpu&&!this.lost){const {gl,program,buffer,texture}=this.gpu;gl.deleteTexture(texture);gl.deleteBuffer(buffer);gl.deleteProgram(program);}
  for(const canvas of [this.mask,this.stage,this.gpuCanvas])if(canvas)canvas.width=canvas.height=1;
  this.gpu=null;this.mask=null;this.topology=null;this.terrain=null;this.frameKey=null;this.tried=this.lost||false;
  this.backend='canvas';this.stats.width=this.stats.height=this.stats.visibleTiles=0;
 }
}
function depthAt(r,radius){return Math.exp(-r/(Math.max(24,radius)*.48))*.07;}
