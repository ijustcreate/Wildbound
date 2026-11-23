import {waterAt,drawProp,propBase} from './environment.mjs';
import {actorRenderSize} from './render-settings.mjs';
import {drawFurniture,drawHouseCar} from './house-render.mjs';
import {drawHouseWall} from './house-architecture-art.mjs';
import {DecorationCache} from './render-lod.mjs';

const wet=(g,x,y)=>['water','shallow','floodbridge'].includes(waterAt(g,x,y));
const fragment=`precision highp float;
varying vec2 uv;uniform sampler2D reflection;uniform float time;
uniform vec4 view;uniform vec4 swimmers[8];uniform vec4 headings[8];
void main(){
 vec2 world=view.xy+vec2(uv.x,1.-uv.y)*view.zw;
 vec2 q=floor(world/1.5)*1.5;
 float phase=q.y*.29+sin(q.x*.08+time*1.6)*1.2-time*2.8;
 vec2 offset=vec2(sin(phase)*1.6,sin(q.x*.12+time*2.)*.6)/view.zw;
 vec4 reflected=texture2D(reflection,uv+offset);
 float bands=.72+.28*step(.2,sin(phase*1.8));
 vec3 color=mix(reflected.rgb,vec3(.12,.43,.48),.25);float alpha=reflected.a*.32*bands;
 float crest=0.,trough=0.;
 for(int i=0;i<8;i++){
  vec4 a=swimmers[i];if(a.z<.5)continue;
  vec2 d=q-a.xy;d.y/=.55;float radius=length(d);
  float ringPhase=mod(time*10.+a.w,14.);
  float ring=abs(radius-(9.+ringPhase));
  float strength=(1.-ringPhase/14.)*.55;
  crest=max(crest,(1.-smoothstep(.45,1.4,ring))*strength);
  trough=max(trough,(1.-smoothstep(.3,1.3,abs(radius-10.5-ringPhase)))*strength*.5);
  vec2 dir=normalize(headings[i].xy+vec2(.0001));float behind=-dot(d,dir),side=abs(d.x*dir.y-d.y*dir.x);
  float moving=headings[i].z;
  float wedge=abs(side-(7.+behind*.36));
  float wake=(1.-smoothstep(.6,2.2,wedge))*smoothstep(0.,5.,behind)*(1.-smoothstep(18.,46.,behind));
  float broken=.65+.35*step(.1,sin(behind*.7-time*7.));
  crest=max(crest,wake*moving*broken*.7);
  trough=max(trough,(1.-smoothstep(.5,1.8,abs(side-5.-behind*.36)))*smoothstep(0.,5.,behind)*(1.-smoothstep(18.,46.,behind))*moving*.45);
 }
 if(trough>alpha){color=vec3(.04,.25,.32);alpha=trough;}
 if(crest>alpha){color=mix(vec3(.26,.66,.69),vec3(.71,.91,.85),step(.45,crest));alpha=crest;}
 gl_FragColor=vec4(color,alpha);
}`;

export class WaterInteractionRenderer{
 constructor(){this.frame=-1;this.failed=false;this.props=new DecorationCache(4*1024*1024);this.stats={mode:'uninitialized',donors:0,swimmers:0};}
 init(){
  const canvas=this.canvas=document.createElement('canvas');canvas.width=512;canvas.height=384;
  this.source=document.createElement('canvas');this.source.width=512;this.source.height=384;this.pen=this.source.getContext('2d');
  const gl=this.gl=canvas.getContext('webgl',{alpha:true,antialias:false,premultipliedAlpha:false,preserveDrawingBuffer:true});if(!gl)throw Error('Water interactions WebGL unavailable');
  const program=gl.createProgram();for(const [type,source]of [[gl.VERTEX_SHADER,'attribute vec2 position;varying vec2 uv;void main(){uv=(position+1.)*.5;gl_Position=vec4(position,0,1);}'],[gl.FRAGMENT_SHADER,fragment]]){const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(shader));gl.attachShader(program,shader);gl.deleteShader(shader);}
  gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));gl.useProgram(program);this.program=program;
  gl.bindBuffer(gl.ARRAY_BUFFER,gl.createBuffer());gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);const pos=gl.getAttribLocation(program,'position');gl.enableVertexAttribArray(pos);gl.vertexAttribPointer(pos,2,gl.FLOAT,false,0,0);
  const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);for(const key of [gl.TEXTURE_MIN_FILTER,gl.TEXTURE_MAG_FILTER])gl.texParameteri(gl.TEXTURE_2D,key,gl.NEAREST);for(const key of [gl.TEXTURE_WRAP_S,gl.TEXTURE_WRAP_T])gl.texParameteri(gl.TEXTURE_2D,key,gl.CLAMP_TO_EDGE);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
  this.uniforms=Object.fromEntries(['time','view','swimmers[0]','headings[0]'].map(key=>[key,gl.getUniformLocation(program,key)]));
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();this.failed=true;this.stats.mode='fallback';});
  this.stats.mode='webgl';
 }
 draw(c,g,renderer,w,h){
  const cam=renderer.camera,ww=w/cam.zoom,hh=h/cam.zoom,left=cam.x-ww/2,top=cam.y-hh/2;
  if(cam.zoom<.4)return;
  // One shared low-resolution reflection/wake surface, at most 24 refreshes/sec.
  const key=[Math.floor((g.time||0)*24),Math.floor(cam.x/64),Math.floor(cam.y/64),cam.zoom,w,h,g.seed].join(':');
  if(key!==this.frame){
   const pools=g.house?.pools||[],step=32,rects=[];
   for(let y=Math.floor(top/step)*step;y<top+hh;y+=step)for(let x=Math.floor(left/step)*step;x<left+ww;x+=step){
    if(pools.some(p=>x+step>p.x&&x<p.x+p.w&&y+step>p.y&&y<p.y+p.h))continue;
    if(wet(g,x+16,y+16))rects.push({x,y,w:step,h:step});
   }
   rects.push(...pools.filter(p=>p.x+p.w>left&&p.x<left+ww&&p.y+p.h>top&&p.y<top+hh));
   this.rects=rects;if(!rects.length){this.frame=key;return;}
   if(!this.gl&&!this.failed)try{this.init();}catch(error){this.failed=true;this.stats.mode='fallback';console.warn(error.message);}
   if(this.failed)return;
   const pc=this.pen;pc.setTransform(1,0,0,1,0,0);pc.clearRect(0,0,512,384);pc.setTransform(512/ww,0,0,384/hh,-left*512/ww,-top*384/hh);pc.imageSmoothingEnabled=false;
   const visible=a=>a.x>left-100&&a.x<left+ww+100&&a.y>top-100&&a.y<top+hh;
   const nearWater=a=>visible(a)&&[8,28,56].some(d=>[-1,0,1].some(side=>wet(g,a.x+side*d,a.y+d)));
   let donors=0,maxDonors=32;
   const mirror=(a,draw)=>{if(donors>=maxDonors||!nearWater(a))return;pc.save();pc.beginPath();pc.rect(a.x-120,a.y,240,115);pc.clip();pc.translate(0,a.y*1.6);pc.scale(1,-.6);draw(pc);pc.restore();donors++;};
   // Mirror the actual native artwork rather than recoloring a stock silhouette.
   for(const p of (renderer.decor||g.scenery||[]).filter(p=>!p.depleted&&!p.fallen).slice(0,256)){const base=propBase(p);mirror(base,pen=>this.props.draw(pen,p,2,context=>{if(!drawProp(context,p,0,g,{spriteLibrary:renderer.assets.library}))renderer.assets.draw(context,p.kind,p.x,p.y,p.size);}));if(donors>=32)break;}
   for(const f of g.house?.furniture||[])if(!f.destroyed)mirror({x:f.x+f.w/2,y:f.y+f.h},pen=>drawFurniture(pen,f,g));
   for(const b of g.house?.walls||[])if(!b.destroyed&&b.kind!=='fence')mirror({x:b.x+b.w/2,y:b.y+b.h},pen=>drawHouseWall(pen,b));
   for(const v of g.house?.vehicles||[])mirror(v,pen=>drawHouseCar(pen,v,g));
   const actors=[...(g.players||[]),...(g.enemies||[])].filter(a=>!a.room&&a.hp>0&&visible(a));
   // Reserve dynamic reflections even when the shoreline contains many props.
   maxDonors=48;
   for(const a of actors.slice(0,16))mirror(a,pen=>{const actor={...a,isPlayer:(g.players||[]).includes(a)},shown=a.swimming?{...actor,y:a.y+20,groundHeight:0,equipment:{...a.equipment,hand1:null,hand2:null,cape:null}}:actor;renderer.animator.draw(pen,shown,g.time,actorRenderSize(actor));});
   const swimmers=actors.filter(a=>a.swimming&&(a.diveDepth||0)<=.12).slice(0,8),positions=new Float32Array(32),headings=new Float32Array(32);
   swimmers.forEach((a,i)=>{positions.set([a.x,a.y,1,(a.id||0)*2.3],i*4);headings.set([a.faceX||0,(a.faceY??1)/.55,a.moving?1:0,0],i*4);});
   const gl=this.gl,u=this.uniforms;gl.uniform1f(u.time,g.time||0);gl.uniform4f(u.view,left,top,ww,hh);gl.uniform4fv(u['swimmers[0]'],positions);gl.uniform4fv(u['headings[0]'],headings);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,this.source);gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
   this.frame=key;this.view={left,top,ww,hh};this.stats={mode:'webgl',donors,swimmers:swimmers.length,pixels:512*384};
  }
  if(!this.gl||this.failed||!this.rects?.length)return;
  c.save();c.beginPath();for(const r of this.rects)c.rect(r.x,r.y,r.w,r.h);c.clip();c.imageSmoothingEnabled=false;const v=this.view;c.drawImage(this.canvas,v.left,v.top,v.ww,v.hh);c.restore();
 }
}
