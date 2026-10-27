import {forestHash} from './forest-landscape.mjs';
import {nearbyScenery} from './performance.mjs';
import {MEADOW_CHUNK,meadowAllowed,meadowTerrainKey,paintPixelMeadow} from './pixel-meadow.mjs';

const vertex=`#version 300 es
precision highp float;
layout(location=0) in vec2 segment;
layout(location=1) in vec4 blade;
layout(location=2) in vec4 variation;
uniform vec2 camera,view;
uniform float zoom,time,bloom,front;
uniform vec4 actors[8];
uniform sampler2D patchStates;
out vec3 color;
float hash21(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float valueNoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash21(i),hash21(i+vec2(1.,0.)),f.x),mix(hash21(i+vec2(0.,1.)),hash21(i+vec2(1.,1.)),f.x),f.y);}
void main(){
 vec2 root=blade.xy;float t=segment.y,height=blade.z;
 color=vec3(0.);gl_Position=vec4(2.,2.,0.,1.);
 vec2 rootScreen=(root-camera)*zoom;
 if(any(greaterThan(abs(rootScreen),view*.5+vec2(height*zoom+12.))))return;
 if(front>.5&&variation.w<.5)return;
 if(bloom<3.&&distance(root,vec2(800.))>bloom*430.)return;
 int patchIndex=int(variation.z)-1;
 vec4 patchProperties=vec4(0.);
 if(patchIndex>=0)patchProperties=texelFetch(patchStates,ivec2(patchIndex%1024,patchIndex/1024),0);
 if(patchProperties.r>.5)return;
 float pressure=0.,push=0.,inFront=0.;
 for(int i=0;i<8;i++){
  vec2 delta=root-actors[i].xy;float d=length(delta);
  float weight=(1.-smoothstep(5.,actors[i].w,d))*actors[i].z;
  pressure=max(pressure,weight);push+=delta.x/max(4.,d)*weight;
  if(actors[i].z>0.&&abs(delta.x)<12.&&delta.y>=0.&&delta.y<12.)inFront=1.;
 }
 float wave=sin(time*1.65+root.x*.026+root.y*.018)+.4*sin(time*.85-root.x*.014+root.y*.031);
 float curve=variation.x+wave*height*.13+push*height*.85;
 float width=blade.w*(1.-t*.93);
 vec2 p=root+vec2(curve*t*t+segment.x*width,-height*t*(1.-pressure*.55));
 p=floor(p*0.5)*2.;
 vec2 screen=(p-camera)*zoom;
 gl_Position=vec4(screen.x/(view.x*.5),-screen.y/(view.y*.5),0.,1.);
 if(front>.5&&inFront<.5)gl_Position=vec4(2.,2.,0.,1.);
 vec3 low=vec3(.24,.38,.21),mid=vec3(.36,.50,.25),tip=vec3(.52,.61,.33);
 color=t<.34?low:t<.82?mid:tip;
 float patches=valueNoise(root*.018),accent=step(.94,hash21(floor(root/3.)));
 color*=.88+floor(patches*3.)*.09;
 color=mix(color,vec3(.58,.64,.35),accent*.28);
 if(dot(patchProperties.gba,vec3(1.))>0.)color=mix(color,patchProperties.gba,.26);
}`;
const fragment=`#version 300 es
precision highp float;
in vec3 color;out vec4 pixel;
void main(){pixel=vec4(color,1.);}`;

export function grassFieldInstances(g,bounds={sx:0,sy:0,ex:1600,ey:1600},patches=(g.scenery||[]).filter(p=>p.kind==='tall_grass'),slot=p=>patches.indexOf(p)+1){
 const rows=[],{sx,sy,ex,ey}=bounds;
 const add=(x,y,h,w,lean,shade,tall,patch=0)=>{if(x>=sx&&x<ex&&y>=sy&&y<ey)rows.push([x,y,h,w,lean,shade,patch,tall]);};
 for(let y=Math.ceil(sy/24)*24;y<ey;y+=24)for(let x=Math.ceil(sx/24)*24;x<ex;x+=24){
  const n=forestHash(x+g.seed,y);if(n>.27)continue;
  for(let i=0;i<3;i++){
   const px=x+(n-.5)*12+i*2,py=y+forestHash(y+i,x)*7;
   if(!meadowAllowed(g,px,py,2))continue;
   add(px,py,3+forestHash(x+i,y)*5,1.5+forestHash(y,x+i),i-1,.9,0);
  }
 }
 for(const p of patches){
  const scale=p.size/80,root=p.rootY??p.y+p.size*.4,index=slot(p);
  for(let y=-9;y<=9;y+=6)for(let x=-36;x<=36;x+=6){
   const n=forestHash(x+(p.tuftSeed||p.x),y+p.y);
   if((x/39)**2+(y/12)**2>1+n*.12)continue;
   const px=p.x+(x+n*3)*scale,py=root+(y+forestHash(y,x)*2)*scale;
   if(!meadowAllowed(g,px,py))continue;
   add(px,py,(14+n*12)*scale,(1.8+n*.9)*scale,(n-.5)*8*scale,p.grassShade||1,1,index);
  }
 }
 rows.sort((a,b)=>a[1]-b[1]);return new Float32Array(rows.flat());
}

export class GrassFieldRenderer{
 constructor(){this.failed=false;this.active=false;this.instances=0;}
 init(){
  if(this.gl)return true;if(this.failed||typeof document==='undefined')return false;
  const canvas=document.createElement('canvas'),gl=canvas.getContext('webgl2',{alpha:true,antialias:false,premultipliedAlpha:true,preserveDrawingBuffer:true});
  if(!gl){this.failed=true;return false;}
  try{
   const program=gl.createProgram();for(const [type,source]of [[gl.VERTEX_SHADER,vertex],[gl.FRAGMENT_SHADER,fragment]]){
    const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);
    if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(shader));
    gl.attachShader(program,shader);gl.deleteShader(shader);
   }
   gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));
   this.canvas=canvas;this.gl=gl;this.program=program;this.vao=gl.createVertexArray();gl.bindVertexArray(this.vao);
   const mesh=[];for(let i=0;i<3;i++){const a=i/3,b=(i+1)/3;mesh.push(-1,a,1,a,-1,b,-1,b,1,a,1,b);}
   this.mesh=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,this.mesh);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(mesh),gl.STATIC_DRAW);
   gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,2,gl.FLOAT,false,0,0);
   this.buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,this.buffer);
   for(let i=1;i<=2;i++){gl.enableVertexAttribArray(i);gl.vertexAttribPointer(i,4,gl.FLOAT,false,32,(i-1)*16);gl.vertexAttribDivisor(i,1);}
   this.uniforms=Object.fromEntries(['camera','view','zoom','time','bloom','front','actors','patchStates'].map(k=>[k,gl.getUniformLocation(program,k)]));
   this.stateTexture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,this.stateTexture);
   gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);
   gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
   canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();this.active=false;this.failed=true;});
   canvas.addEventListener('webglcontextrestored',()=>{this.gl=null;this.failed=false;this.key=null;this.stateKey=null;this.game=null;});
   return true;
  }catch(error){console.warn('Grass field unavailable:',error.message);this.failed=true;return false;}
 }
 draw(c,g,camera,w,h,front=false){
  // Overview cameras use the existing cached prop fallback. Never evict GPU
  // buffers still referenced by an exceptionally wide visible batch list.
  const columns=Math.ceil((w/camera.zoom+180)/256)+2,rows=Math.ceil((h/camera.zoom+220)/256)+2;
  if(columns*rows>128){this.active=false;return false;}
  if((g.generatedEnvironment||g.environment)!=='forest'||!g.forestLandscape||g.phase==='won'||!this.init()||this.failed){this.active=false;return false;}
  const gl=this.gl,u=this.uniforms;
  if(this.game!==g||this.seed!==g.seed||this.plan!==g.forestLandscape){
   for(const b of this.chunks?.values()||[])gl.deleteBuffer(b.buffer);
   this.game=g;this.seed=g.seed;this.plan=g.forestLandscape;this.chunks=new Map();this.patchSlots=new Map();this.nextSlot=0;
   this.stateRevision=0;this.geometryRevision=0;this.backRaster=null;this.frontRaster=null;this.states=new Uint8Array(1024*8*4);gl.bindTexture(gl.TEXTURE_2D,this.stateTexture);
   gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA8,1024,8,0,gl.RGBA,gl.UNSIGNED_BYTE,this.states);
  }
  if(!front){
   const halfX=w/(2*camera.zoom)+90,halfY=h/(2*camera.zoom)+110;
   const nearby=nearbyScenery(g.scenery||[],camera.x,camera.y,Math.hypot(halfX,halfY));
   const patches=nearby.filter(p=>p.kind==='tall_grass'&&Math.abs(p.x-camera.x)<halfX+80&&Math.abs((p.rootY??p.y)-camera.y)<halfY+40);
   if(this.nextSlot+patches.length>=8192){for(const b of this.chunks.values())gl.deleteBuffer(b.buffer);this.chunks.clear();this.patchSlots.clear();this.nextSlot=0;}
   this.visiblePatches=patches;
   const slot=p=>{let i=this.patchSlots.get(p.id??p);if(i===undefined){i=this.nextSlot++;this.patchSlots.set(p.id??p,i);}return i+1;};
   for(const p of patches){
    const i=slot(p)-1,state=[p.cut||p.charred?255:0,0,0,0];
    if(/^#[\da-f]{6}$/i.test(p.grassTint||''))for(let k=0;k<3;k++)state[k+1]=Math.max(1,parseInt(p.grassTint.slice(1+k*2,3+k*2),16));
    if(state.some((v,k)=>v!==this.states[i*4+k])){this.stateRevision++;this.states.set(state,i*4);gl.bindTexture(gl.TEXTURE_2D,this.stateTexture);gl.texSubImage2D(gl.TEXTURE_2D,0,i%1024,Math.floor(i/1024),1,1,gl.RGBA,gl.UNSIGNED_BYTE,Uint8Array.from(state));}
   }
   this.visibleBatches=[];this.instances=0;
   for(let cy=Math.floor((camera.y-halfY)/256);cy<=Math.floor((camera.y+halfY)/256);cy++)for(let cx=Math.floor((camera.x-halfX)/256);cx<=Math.floor((camera.x+halfX)/256);cx++){
    const x=cx*256,y=cy*256;if(g.mapMode!=='boundless'&&(x>=1600||y>=1600||x+256<=0||y+256<=0))continue;
    const key=cx+','+cy,local=patches.filter(p=>Math.abs(p.x-x-128)<180&&Math.abs((p.rootY??p.y)-y-128)<160);
    const terrainKey=meadowTerrainKey(g,x,y),geometryKey=local.map(p=>[slot(p),p.x,p.y,p.rootY,p.size,p.tuftSeed,p.grassShade].join(',')).join(';');
    let entry=this.chunks.get(key);
    if(!entry||entry.terrainKey!==terrainKey||entry.geometryKey!==geometryKey){
     this.geometryRevision++;const data=grassFieldInstances(g,{sx:x,sy:y,ex:x+256,ey:y+256},local,slot);
     if(entry)gl.deleteBuffer(entry.buffer);
     const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,data,gl.STATIC_DRAW);
     entry={x,y,buffer,count:data.length/8,terrainKey,geometryKey,ground:entry?.terrainKey===terrainKey?entry.ground:paintPixelMeadow(g,x,y)};
    }
    this.chunks.delete(key);this.chunks.set(key,entry);this.visibleBatches.push(entry);this.instances+=entry.count;
    c.save();c.imageSmoothingEnabled=false;
    if(g.mapMode!=='boundless'&&g.bloom<3){c.beginPath();c.arc(800,800,g.bloom*430,0,Math.PI*2);c.clip();}
    c.drawImage(entry.ground,x,y,256,256);c.restore();
   }
   while(this.chunks.size>128){const key=this.chunks.keys().next().value;gl.deleteBuffer(this.chunks.get(key).buffer);this.chunks.delete(key);}
  }
  const activeActors=[...(g.players||[]),...(g.enemies||[])].filter(a=>!a.room&&a.hp>0&&!a.swimming&&!(a.jumpHeight>8));
  if(front&&!(this.visiblePatches||[]).some(p=>!p.cut&&!p.charred&&activeActors.some(a=>Math.abs(p.x-a.x)<65&&Math.abs((p.rootY??p.y)-a.y)<50))){this.active=true;return true;}
  const pixelStep=2**Math.max(1,Math.ceil(Math.log2(Math.max(w/camera.zoom/1200,h/camera.zoom/800))));
  const width=Math.ceil((w/camera.zoom+128)/pixelStep),height=Math.ceil((h/camera.zoom+128)/pixelStep);
  const rasterCamera={x:Math.round(camera.x/32)*32,y:Math.round(camera.y/32)*32,zoom:camera.zoom};
  const viewW=width*pixelStep*camera.zoom,viewH=height*pixelStep*camera.zoom;
  const actorKey=activeActors.filter(a=>Math.abs(a.x-camera.x)<w/camera.zoom&&Math.abs(a.y-camera.y)<h/camera.zoom&&meadowAllowed(g,a.x,a.y+(a.kind?14:1))).slice(0,8).map(a=>Math.round(a.x/2)+','+Math.round(a.y/2)).join(';');
  const rasterKey=[rasterCamera.x,rasterCamera.y,width,height,pixelStep,Math.floor((g.time||0)*20),this.stateRevision,this.geometryRevision,actorKey,g.bloom].join(':');
  const slotName=front?'frontRaster':'backRaster';let raster=this[slotName];
  const composite=()=>{c.save();c.imageSmoothingEnabled=false;c.drawImage(raster.canvas,rasterCamera.x-width*pixelStep/2,rasterCamera.y-height*pixelStep/2,width*pixelStep,height*pixelStep);c.restore();};
  if(raster?.key===rasterKey){composite();this.active=true;return true;}
  if(this.canvas.width!==width||this.canvas.height!==height){this.canvas.width=width;this.canvas.height=height;}
  gl.viewport(0,0,width,height);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);gl.useProgram(this.program);gl.bindVertexArray(this.vao);
  gl.uniform2f(u.camera,rasterCamera.x,rasterCamera.y);gl.uniform2f(u.view,viewW,viewH);gl.uniform1f(u.zoom,camera.zoom);
  gl.uniform1f(u.time,Math.floor((g.time||0)*20)/20);gl.uniform1f(u.bloom,g.mapMode==='boundless'?3:g.bloom??3);gl.uniform1f(u.front,front?1:0);
  const actors=new Float32Array(32),active=[];let count=0;
  for(const a of [...(g.players||[]),...(g.enemies||[])]){
   if(count===8)break;if(a.room||a.hp<=0||a.swimming||a.jumpHeight>8||Math.abs(a.x-camera.x)>w/camera.zoom||Math.abs(a.y-camera.y)>h/camera.zoom)continue;
   actors.set([a.x,a.y+(a.kind?14:1),1,a.kind?24:34],count++*4);active.push(a);
  }
  for(let i=count;i<8;i++)actors[i*4+3]=34;
  gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,this.stateTexture);gl.uniform1i(u.patchStates,0);gl.uniform4fv(u.actors,actors);
  this.submittedInstances=0;
  for(const b of this.visibleBatches||[]){
   if(front&&!active.some(a=>a.x>=b.x-45&&a.x<b.x+301&&a.y>=b.y-45&&a.y<b.y+301))continue;
   gl.bindBuffer(gl.ARRAY_BUFFER,b.buffer);
   for(let i=1;i<=2;i++)gl.vertexAttribPointer(i,4,gl.FLOAT,false,32,(i-1)*16);
   gl.drawArraysInstanced(gl.TRIANGLES,0,18,b.count);this.submittedInstances+=b.count;
  }
  if(!raster){const canvas=document.createElement('canvas');raster={canvas,key:null};this[slotName]=raster;}
  if(raster.canvas.width!==width||raster.canvas.height!==height){raster.canvas.width=width;raster.canvas.height=height;}
  const pen=raster.canvas.getContext('2d');pen.clearRect(0,0,width,height);pen.drawImage(this.canvas,0,0);raster.key=rasterKey;composite();
  this.active=true;return true;
 }
 dispose(){if(!this.gl)return;const gl=this.gl;for(const b of this.chunks?.values()||[])gl.deleteBuffer(b.buffer);gl.deleteTexture(this.stateTexture);gl.deleteBuffer(this.mesh);gl.deleteBuffer(this.buffer);gl.deleteVertexArray(this.vao);gl.deleteProgram(this.program);this.gl=null;this.game=null;this.key=null;}
}
