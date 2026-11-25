import {bellglassMushroomStrength} from './bellglass-mushroom-state.mjs';

const vertex=`
attribute vec2 vertex;
varying vec2 uv;
void main(){uv=vertex*.5+.5;gl_Position=vec4(vertex,0.,1.);}
`;
const fragment=`
precision mediump float;
uniform sampler2D scene;
uniform sampler2D lastFrame;
uniform vec2 texel;
uniform float time;
uniform float strength;
uniform float hasHistory;
varying vec2 uv;
float light(vec3 rgb){return max(rgb.r,max(rgb.g,rgb.b));}
vec3 spectrum(float hue){return .55+.45*cos(hue+vec3(0.,2.094,4.188));}
void main(){
 float wave=sin(uv.y*24.+uv.x*9.-time*2.3)+.51*sin(uv.x*38.-uv.y*17.+time*1.9);
 vec2 bend=vec2(wave,cos(uv.x*28.+uv.y*9.+time*2.05)+.48*sin(uv.y*34.-time*2.8));
 vec2 pos=clamp(uv+bend*(.0025*strength+.001*strength*strength),texel,1.-texel);
 vec3 base=texture2D(scene,pos).rgb;
 float luminance=dot(base,vec3(.28,.57,.15));
 float pulse=.83+.17*sin(time*4.+wave);
 float hue=time*1.55+uv.x*7.+uv.y*8.+wave*1.1+luminance*11.;
 vec3 rainbow=spectrum(hue);
 float vivid=min(1.,strength*.28)*pulse;
 vec3 outColor=mix(base,rainbow*(.2+luminance*.92)+luminance*.25,vivid);
 if(strength>.8){
  vec2 rimStep=texel*(1.+strength*.32);
  float rim=abs(light(base)-light(texture2D(scene,pos+vec2(rimStep.x,0.)).rgb))+
   abs(light(base)-light(texture2D(scene,pos+vec2(0.,rimStep.y)).rgb));
  float edge=smoothstep(.09,.44,rim)*min(1.,(strength-.8)*.55);
  outColor+=spectrum(hue+2.)*edge*.38*pulse;
  vec2 spread=texel*(2.+strength*2.6);
  float glow=(light(texture2D(scene,pos+vec2(spread.x,0.)).rgb)+
   light(texture2D(scene,pos-vec2(spread.x,0.)).rgb)+
   light(texture2D(scene,pos+vec2(0.,spread.y)).rgb)+
   light(texture2D(scene,pos-vec2(0.,spread.y)).rgb))*.25;
  float bloom=smoothstep(.48,.94,mix(glow,light(base),.35));
  outColor+=mix(rainbow,vec3(1.,.75,.98),.38)*bloom*strength*.19*pulse;
  vec3 ghost=texture2D(lastFrame,uv-bend*texel*1.5).rgb;
  float trail=smoothstep(.53,.94,light(ghost))*hasHistory;
  outColor+=max(vec3(0.),ghost-base*.94)*trail*.28*min(1.,strength-.75);
 }
 gl_FragColor=vec4(clamp(outColor,0.,1.),1.);
}
`;

function programFor(gl){
 const shader=(type,source)=>{
  const handle=gl.createShader(type);gl.shaderSource(handle,source);gl.compileShader(handle);
  if(!gl.getShaderParameter(handle,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(handle));
  return handle;
 };
 const program=gl.createProgram();
 for(const [type,source] of [[gl.VERTEX_SHADER,vertex],[gl.FRAGMENT_SHADER,fragment]])gl.attachShader(program,shader(type,source));
 gl.linkProgram(program);
 if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));
 return program;
}

function createWarp(){
 const canvas=document.createElement('canvas');
 const gl=canvas.getContext('webgl',{alpha:true,antialias:false,depth:false,stencil:false,preserveDrawingBuffer:true});
 if(!gl)throw Error('WebGL unavailable');
 const program=programFor(gl);
 gl.useProgram(program);
 const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
 gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
 const vertexLocation=gl.getAttribLocation(program,'vertex');
 gl.enableVertexAttribArray(vertexLocation);gl.vertexAttribPointer(vertexLocation,2,gl.FLOAT,false,0,0);
 const textures=[gl.createTexture(),gl.createTexture()];
 for(const [i,texture] of textures.entries()){
  gl.activeTexture(gl.TEXTURE0+i);gl.bindTexture(gl.TEXTURE_2D,texture);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
 }
 gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
 const uniform=Object.fromEntries(['scene','lastFrame','texel','time','strength','hasHistory'].map(name=>[name,gl.getUniformLocation(program,name)]));
 gl.uniform1i(uniform.scene,0);gl.uniform1i(uniform.lastFrame,1);
 return {canvas,gl,uniform};
}

export class BellglassScreenEffect{
 draw(ctx,g){
  const strength=bellglassMushroomStrength(g.players||[]);
  if(strength<.001){this.hasHistory=false;return;}
  if(this.warp===undefined){try{this.warp=createWarp();}catch(error){this.warp=null;this.shaderError=error.message;}}
  const scene=ctx.canvas;
  if(!scene.width||!scene.height)return;
  if(!this.warp||this.warp.gl.isContextLost()){this.fallback(ctx,g.time,strength);return;}
  const {canvas,gl,uniform}=this.warp;
  const scale=Math.min(1,1000/Math.max(scene.width,scene.height));
  const width=Math.max(1,Math.round(scene.width*scale)),height=Math.max(1,Math.round(scene.height*scale));
  if(canvas.width!==width||canvas.height!==height||!this.ready){
   canvas.width=width;canvas.height=height;this.ready=true;this.hasHistory=false;
   gl.viewport(0,0,width,height);
   gl.activeTexture(gl.TEXTURE1);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,width,height,0,gl.RGBA,gl.UNSIGNED_BYTE,null);
  }
  gl.activeTexture(gl.TEXTURE0);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,scene);
  gl.uniform2f(uniform.texel,1/scene.width,1/scene.height);
  gl.uniform1f(uniform.time,(g.time||0)%1000);gl.uniform1f(uniform.strength,strength);
  gl.uniform1f(uniform.hasHistory,this.hasHistory?1:0);gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
  if(strength>.8){gl.activeTexture(gl.TEXTURE1);gl.copyTexSubImage2D(gl.TEXTURE_2D,0,0,0,0,0,width,height);this.hasHistory=true;}
  ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.imageSmoothingEnabled=false;
  ctx.drawImage(canvas,0,0,scene.width,scene.height);ctx.restore();
 }

 fallback(ctx,time,strength){
  const scene=ctx.canvas,copy=this.copy??=document.createElement('canvas');
  if(copy.width!==scene.width||copy.height!==scene.height){copy.width=scene.width;copy.height=scene.height;}
  copy.getContext('2d').drawImage(scene,0,0);
  ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=Math.min(.85,strength*.29);
  ctx.filter=`hue-rotate(${Math.round((time||0)*60)%360}deg) saturate(${1+strength*.7})`;
  for(let y=0;y<scene.height;y+=12){const h=Math.min(12,scene.height-y),dx=Math.round(Math.sin(y*.043+(time||0)*2)*strength*3);ctx.drawImage(copy,0,y,scene.width,h,dx,y,scene.width,h);}
  ctx.restore();
 }
}
