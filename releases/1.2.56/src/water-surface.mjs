// Noise adapted from boona13/threejs-grass-water-shaders (MIT); see THIRD_PARTY_WATER.md.
import {waterAt} from './environment.mjs';
const fragment=`precision highp float;
uniform float time; varying vec2 uv;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p),u=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),u.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x),u.y);}
float wave(vec2 p){return noise(p+vec2(time*.16,time*.09))*.65+noise(p*2.1-vec2(time*.12,time*.07))*.25+noise(p*4.3+time*.1)*.1;}
void main(){vec2 p=uv*42.;float n=wave(p);vec2 slope=vec2(wave(p+vec2(.08,0))-n,wave(p+vec2(0,.08))-n)*8.;
float light=pow(max(0.,dot(normalize(vec3(-slope,1.)),normalize(vec3(.4,.6,1.)))),18.);
float foam=smoothstep(.74,.81,n)*.32;
float ripple=pow(max(0.,sin(p.y*9.+sin(p.x*3.+time)*1.4+time*1.4)),22.)*smoothstep(.46,.68,n);
vec3 color=mix(vec3(.035,.24,.32),vec3(.11,.52,.57),n);color+=light*vec3(.16,.24,.24)+foam+ripple*vec3(.13,.24,.23);gl_FragColor=vec4(color,1.);}`;
let renderer,failed=false;
export function waterShaderStatus(){return renderer?'webgl':failed?'fallback':'uninitialized';}
function init(){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=400;
 const gl=canvas.getContext('webgl',{alpha:false,antialias:false,preserveDrawingBuffer:true});if(!gl)throw Error('WebGL unavailable');
 const program=gl.createProgram();
 for(const [type,source] of [[gl.VERTEX_SHADER,'attribute vec2 position;varying vec2 uv;void main(){uv=(position+1.)*.5;gl_Position=vec4(position,0,1);}'],[gl.FRAGMENT_SHADER,fragment]]){
  const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(shader));gl.attachShader(program,shader);gl.deleteShader(shader);
 }
 gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));gl.useProgram(program);
 gl.bindBuffer(gl.ARRAY_BUFFER,gl.createBuffer());gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
 const location=gl.getAttribLocation(program,'position');gl.enableVertexAttribArray(location);gl.vertexAttribPointer(location,2,gl.FLOAT,false,0,0);
 canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();renderer=null;failed=true;});canvas.addEventListener('webglcontextrestored',()=>{failed=false;});
 return {canvas,gl,time:gl.getUniformLocation(program,'time'),frame:-1};
}
export function drawWaterSurface(c,g,x,y,w,h){
 if(!renderer&&!failed)try{renderer=init();}catch(e){failed=true;console.warn('Water shader fallback:',e.message);}
 const t=g.time||0;
 if(renderer){const r=renderer,frame=Math.floor(t*30);if(frame!==r.frame){r.gl.uniform1f(r.time,t);r.gl.drawArrays(r.gl.TRIANGLE_STRIP,0,4);r.frame=frame;}c.drawImage(r.canvas,x/4,y/4,w/4,h/4,x,y,w,h);}
 else{c.fillStyle='#246779';c.fillRect(x,y,w,h);c.save();c.beginPath();c.rect(x,y,w,h);c.clip();c.strokeStyle='#88d6d544';for(let row=Math.floor(y/12)*12;row<y+h;row+=12){c.beginPath();for(let px=x;px<=x+w;px+=4)c.lineTo(px,row+Math.sin(px*.08+t+row)*2);c.stroke();}c.restore();}
 const shallow=waterAt(g,x+w/2,y+h/2)==='shallow';
 c.save();c.fillStyle=shallow?'#8fe5c58c':'#062e4940';c.fillRect(x,y,w,h);
 const wet=kind=>['water','shallow','bridge','floodbridge'].includes(kind);
 c.beginPath();c.rect(x,y,w,h);c.clip();c.lineWidth=1;
 for(const [dx,dy] of [[-1,0],[1,0],[0,-1],[0,1]]){
   const neighbor=waterAt(g,x+w/2+dx*w,y+h/2+dy*h);
   if(wet(neighbor)&&(!shallow||neighbor!=='water'))continue;
   const pulse=(t*.8+(x+y)*.004)%1,inset=2+pulse*5;
   c.strokeStyle=`rgba(204,255,233,${(1-pulse)*.65})`;c.beginPath();
   for(let n=3;n<=29;n+=3){const wave=Math.sin(n*.35+t*2)*1.2;c.lineTo(dx?x+(dx<0?inset+wave:w-inset-wave):x+n,dy?y+(dy<0?inset+wave:h-inset-wave):y+n);}c.stroke();
 }
 c.restore();
}
