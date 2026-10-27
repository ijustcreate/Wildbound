// One tiny reusable shader surface, composited into the normal Canvas renderer.
// Initialization failure retains the native analytic portal on non-WebGL devices.
let surface=null,failed=false,lastKey='';
export const PORTAL_FRAGMENT_SHADER=`precision mediump float;
varying vec2 uv;uniform float time;uniform vec3 tint;
void main(){
 vec2 p=(uv-.5)*vec2(48.,88.);vec2 e=p/vec2(19.,40.);float r=length(e);
 if(r>1.0)discard;
 float angle=atan(e.y,e.x);
 float curl=angle-time*.65+(1.-r)*3.6;
 float cloud=sin(curl*2.+sin(angle*3.+r*8.-time*.8)*.65);
 float wisps=smoothstep(.22,.96,cloud)*smoothstep(.16,.95,r);
 float mist=(.5+.5*sin(curl*3.-r*9.+sin(angle*2.+time*.4)))*.045;
 float edge=pow(r,18.)*(.55+.25*sin(angle*3.-time*1.4)+.2*sin(angle*7.+time));
 vec3 color=mix(vec3(.012,.025,.04),tint*.12,r);
 color+=tint*(wisps*.22+mist)+mix(tint,vec3(.72,.96,.88),.28)*edge*.46;
 // A deep quiet center gives the moving rim somewhere to flow into.
 color*=.45+.55*smoothstep(.08,.5,r);
 gl_FragColor=vec4(color,1.);
}`;
function initialize(){
 if(surface||failed||typeof document==='undefined')return surface;
 try{
  const canvas=document.createElement('canvas');canvas.width=48;canvas.height=88;
  const gl=canvas.getContext('webgl',{alpha:true,antialias:false,premultipliedAlpha:false,preserveDrawingBuffer:true});if(!gl)throw Error('No WebGL');
  const program=gl.createProgram();
  for(const [type,source]of [[gl.VERTEX_SHADER,'attribute vec2 position;varying vec2 uv;void main(){uv=position*.5+.5;gl_Position=vec4(position,0.,1.);}'],[gl.FRAGMENT_SHADER,PORTAL_FRAGMENT_SHADER]]){
   const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(shader));gl.attachShader(program,shader);gl.deleteShader(shader);
  }
  gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error('Portal shader link failed');gl.useProgram(program);
  const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
  const position=gl.getAttribLocation(program,'position');gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);gl.viewport(0,0,48,88);
  surface={canvas,gl,time:gl.getUniformLocation(program,'time'),tint:gl.getUniformLocation(program,'tint')};
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();surface=null;failed=true;});return surface;
 }catch{failed=true;return null;}
}
export function drawPortalSurface(ctx,color,time,scale=1){
 const s=initialize();if(!s||s.gl.isContextLost())return false;
 const frame=Math.floor(time*30),key=color+':'+frame;
 if(lastKey!==key){s.gl.clearColor(0,0,0,0);s.gl.clear(s.gl.COLOR_BUFFER_BIT);s.gl.uniform1f(s.time,frame/30);s.gl.uniform3f(s.tint,...[1,3,5].map(i=>parseInt(color.slice(i,i+2),16)/255));s.gl.drawArrays(s.gl.TRIANGLES,0,6);lastKey=key;}
 ctx.save();ctx.imageSmoothingEnabled=false;ctx.drawImage(s.canvas,-24*scale,-73,48*scale,88);ctx.restore();return true;
}
export const portalShaderStatus=()=>({ready:!!surface,failed,width:48,height:88});
