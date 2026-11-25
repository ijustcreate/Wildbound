import {waterAt,drawProp,propBase} from './environment.mjs';
import {actorRenderSize} from './render-settings.mjs';
import {drawFurniture,drawHouseCar} from './house-render.mjs';
import {drawHouseWall} from './house-architecture-art.mjs';
import {DecorationCache} from './render-lod.mjs';
import {drawBankReeds,forestDecor,waterBodyAt} from './forest.mjs';
import {wildWaterTileMask} from './wild-lands-art.mjs';
import {wildLandsSurfaceAt} from './wild-lands-world.mjs';
import {wildLandsPathAt} from './wild-lands-geography.mjs';
import {nativeWildBiome,nativeWildTile,nativeIceSnowEdges} from './wild-native-biomes.mjs';
import {drawIceSnowShelf} from './native-ice-art.mjs';
import {bridgeAt} from './terrain-support.mjs';
import {snowAt} from './ice-world.mjs';

const RIPPLE_LIMIT=8,RIPPLE_SECONDS=.92,STEP_DISTANCE=30,ICE_SHELF_CACHE_LIMIT=768;

const wet=(g,x,y)=>{
 const d=g.trainTest?.design;
 if(d?.wildLands&&!d.activeRoom)return wildLandsSurfaceAt(d,x,y)!=='grass';
 return ['water','shallow','floodbridge'].includes(waterAt(g,x,y));
};
const surfaceKey=(x,y,step)=>Math.floor(y/step)*32768+Math.floor(x/step);
export function bareIceAt(g,x,y){
 const t=g.trainTest,d=t?.design;
 if(!t)return waterAt(g,x,y)==='ice'&&snowAt(g,x,y)<.2;
 return !!(d?.wildLands&&!d.activeRoom&&nativeWildBiome(d,x,y)==='ice'&&wildLandsSurfaceAt(d,x,y)==='grass'&&
  !wildLandsPathAt(x,y)&&nativeWildTile(t,x,y)==='ice');
}
function iceShelfInterior(t,x,y,cache){
 const key=surfaceKey(x,y,32);
 if(cache.has(key))return cache.get(key);
 const edges=nativeIceSnowEdges(t,x,y);
 let interior=null;
 if(edges.some(Boolean)){
  const covered=new Uint8Array(32*32);
  // Reuse the exact static snow painter so the mirror cannot cross its irregular rim.
  drawIceSnowShelf({fillRect(px,py,w,h){
   const left=Math.max(0,px),right=Math.min(32,px+w);
   for(let row=Math.max(0,py);row<Math.min(32,py+h);row++)covered.fill(1,row*32+left,row*32+right);
  }},0,0,x,y,edges);
  interior=new Path2D();
  for(let row=0;row<32;row++){
   if(row%8===7)continue;
   let start=-1;
   for(let col=0;col<=32;col++){
    if(col<32&&!covered[row*32+col]){if(start<0)start=col;}
    else if(start>=0){interior.rect(x+start,y+row,col-start,1);start=-1;}
   }
  }
 }
 if(cache.size>=ICE_SHELF_CACHE_LIMIT)cache.delete(cache.keys().next().value);
 cache.set(key,interior);
 return interior;
}
function reflectionMasks(g,left,top,ww,hh,iceShelves){
 const path=new Path2D(),iceCells=new Set(),t=g.trainTest,pools=g.house?.pools||[];
 const wilds=t?.design.wildLands&&!t.design.activeRoom;
 const step=(g.generatedEnvironment||g.environment)==='swamp'&&!t?8:32;
 let hasWater=false,ice=null;
 for(let y=Math.floor(top/step)*step;y<top+hh;y+=step)for(let x=Math.floor(left/step)*step;x<left+ww;x+=step){
  const centerX=x+step/2,centerY=y+step/2;
  const material=wilds?null:waterAt(g,centerX,centerY);
  if(wilds){
   const tile=wildWaterTileMask(x,y,t.design,t);
   if(tile){path.addPath(tile.wet);hasWater=true;}
  }else if(['water','shallow','floodbridge'].includes(material)&&
   !pools.some(p=>x+step>p.x&&x<p.x+p.w&&y+step>p.y&&y<p.y+p.h)){
   path.rect(x,y,step,step);hasWater=true;
  }
  if(wilds?bareIceAt(g,centerX,centerY):!t&&material==='ice'&&snowAt(g,centerX,centerY)<.2){
   ice??=new Path2D();
   // Thin, fixed gaps break the reflection like frost in the lake's finish.
   const interior=wilds?iceShelfInterior(t,x,y,iceShelves):null;
   if(interior)ice.addPath(interior);
   else for(let stripe=0;stripe<step;stripe+=8)ice.rect(x,y+stripe,step,Math.min(7,step-stripe));
   iceCells.add(surfaceKey(centerX,centerY,step));
  }
 }
 for(const p of pools)if(p.x+p.w>left&&p.x<left+ww&&p.y+p.h>top&&p.y<top+hh){path.rect(p.x,p.y,p.w,p.h);hasWater=true;}
 const dry=ice&&hasWater?new Path2D():null;
 if(dry){dry.rect(left,top,ww,hh);dry.addPath(path);}
 return {water:hasWater?path:null,ice,dry,iceCells,step};
}
const fragment=`precision highp float;
varying vec2 uv;uniform sampler2D reflection;uniform float time;
uniform vec4 view;uniform vec4 swimmers[8];uniform vec4 headings[8];
uniform vec4 impacts[8];
void main(){
 vec2 world=view.xy+vec2(uv.x,1.-uv.y)*view.zw;
 vec2 q=floor(world/1.5)*1.5;
 float phase=q.y*.29+sin(q.x*.08+time*1.6)*1.2-time*2.8;
 vec2 shift=vec2(sin(phase)*1.6,-sin(q.x*.12+time*2.)*.6);
 float crest=0.,trough=0.;
 for(int i=0;i<8;i++){
  vec4 hit=impacts[i];if(hit.w<=0.)continue;
  float age=hit.z,energy=hit.w;
  float radius=4.+age*(22.+energy*25.);
  vec2 d=q-hit.xy;
  if(abs(d.x)>radius+7.||abs(d.y)>(radius+7.)*.58)continue;
  d.y/=.58;
  float r=length(d),edge=r-radius;
  float decay=(1.-age/.92)*energy;decay*=.65+decay*.35;
  float front=1.-smoothstep(.45,2.3,abs(edge));
  float back=1.-smoothstep(.55,2.6,abs(edge+3.2));
  shift+=vec2(d.x,d.y*.58)/max(r,1.)*(front-back)*decay*8.;
  crest=max(crest,front*decay*.38);
  trough=max(trough,back*decay*.22);
 }
 for(int i=0;i<8;i++){
  vec4 a=swimmers[i];if(a.z<.5)continue;
  vec2 d=q-a.xy;if(abs(d.x)>51.||abs(d.y)>31.)continue;
  d.y/=.55;float radius=length(d);
  float ringPhase=mod(time*10.+a.w,14.);
  float ring=abs(radius-(9.+ringPhase));
  float strength=(1.-ringPhase/14.)*.55;
  crest=max(crest,(1.-smoothstep(.45,1.4,ring))*strength);
  trough=max(trough,(1.-smoothstep(.3,1.3,abs(radius-10.5-ringPhase)))*strength*.5);
  vec2 dir=headings[i].xy;float behind=-dot(d,dir),cross=d.x*dir.y-d.y*dir.x,side=abs(cross);
  float moving=headings[i].z;
  float wedge=abs(side-(7.+behind*.36));
  float tail=smoothstep(0.,5.,behind)*(1.-smoothstep(18.,46.,behind));
  float wake=(1.-smoothstep(.6,2.2,wedge))*tail;
  float inner=(1.-smoothstep(.5,1.8,abs(side-5.-behind*.36)))*tail;
  float broken=.65+.35*step(.1,sin(behind*.7-time*7.));
  crest=max(crest,wake*moving*broken*.7);
  trough=max(trough,inner*moving*.45);
  shift+=vec2(dir.y,-dir.x*.55)*sign(cross)*(wake-inner)*moving*4.;
 }
 vec2 offset=clamp(shift,vec2(-10.),vec2(10.))*vec2(1.,-1.)/view.zw;
 vec4 reflected=texture2D(reflection,uv+offset);
 float bands=.72+.28*step(.2,sin(phase*1.8));
 vec3 color=mix(reflected.rgb,vec3(.12,.43,.48),.25);float alpha=reflected.a*.32*bands;
 if(trough>alpha){color=vec3(.04,.25,.32);alpha=trough;}
 if(crest>alpha){color=mix(vec3(.26,.66,.69),vec3(.71,.91,.85),step(.45,crest));alpha=crest;}
 gl_FragColor=vec4(color,alpha);
}`;

export class WaterInteractionRenderer{
 constructor(){
  this.frame=-1;this.failed=false;this.props=new DecorationCache(4*1024*1024);
  this.contacts=new WeakMap();this.impactSlots=new Float64Array(RIPPLE_LIMIT*4);this.impactUniforms=new Float32Array(RIPPLE_LIMIT*4);
  this.impactIndex=0;this.swimmerPositions=new Float32Array(32);this.swimmerHeadings=new Float32Array(32);
  this.iceShelves=new Map();
  this.stats={mode:'uninitialized',donors:0,swimmers:0};
 }
 addImpact(x,y,time,strength){
  const index=this.impactIndex*4,slots=this.impactSlots;
  slots[index]=x;slots[index+1]=y;slots[index+2]=time;slots[index+3]=strength;
  this.impactIndex=(this.impactIndex+1)%RIPPLE_LIMIT;
 }
 collectImpacts(g,visible){
  const now=g.time||0;
  for(const a of g.players||[]){
   let previous=this.contacts.get(a);
   const offFoot=a.room||a.hp<=0||a.vehicleId||a.trainRide||a.trainDeck||a.pirateRide||a.playLogId||a.broomMount||a.wingHover||
    a.groundHeight>0||a.trainGround>0||!g.trainTest&&bridgeAt(g,a.x,a.y)&&!a.underBridge;
   const grounded=!offFoot&&!(a.jumpHeight>0),wading=grounded&&!a.swimming;
   const landTime=a.landTime||0;
   const landing=grounded&&(a.diveDepth||0)<=.12&&landTime>0&&(!previous||landTime>previous.landTime);
   if(landing&&visible(a,58,34)){
    const splash=(g.effects||[]).findLast(p=>p.particle==='jump-splash'&&p.seed===(a.id||0)&&p.life>.72&&
     Math.hypot(p.x-a.x,p.y-a.y)<20);
    const x=splash?.x??a.x,y=splash?.y??a.y;
    if(wet(g,x,y))this.addImpact(x,y,now-(splash?1-splash.life:Math.max(0,.22-landTime)),1);
   }
   let distance=0,side=previous?.side??1;
   if(wading&&previous?.wading&&!landing&&now-previous.time<.24){
    const dx=a.x-previous.x,dy=a.y-previous.y,travel=Math.hypot(dx,dy);
    if(travel<80){
     distance=previous.distance+travel;
     if(distance>=STEP_DISTANCE&&travel){
      const fraction=(STEP_DISTANCE-previous.distance)/travel;
      const x=previous.x+dx*fraction-dy/travel*side*2,y=previous.y+dy*fraction+dx/travel*side*2;
      if(visible({x,y},58,34)&&wet(g,x,y)&&(g.trainTest||!bridgeAt(g,x,y)))this.addImpact(x,y,now,.54);
      distance%=STEP_DISTANCE;side=-side;
     }
    }
   }
   if(!previous){previous={};this.contacts.set(a,previous);}
   previous.x=a.x;previous.y=a.y;previous.time=now;previous.wading=wading;previous.landTime=landTime;previous.distance=distance;previous.side=side;
  }
  let landings=0,steps=0;
  const uniforms=this.impactUniforms,slots=this.impactSlots;
  uniforms.fill(0);
  for(let i=0,next=0;i<slots.length;i+=4){
   const age=now-slots[i+2],strength=slots[i+3];
   if(!strength||age<0||age>=RIPPLE_SECONDS)continue;
   uniforms[next++]=slots[i];uniforms[next++]=slots[i+1];uniforms[next++]=age;uniforms[next++]=strength;
   if(strength===1)landings++;else steps++;
  }
  return {landings,steps};
 }
 initSource(){
  this.source=document.createElement('canvas');this.source.width=512;this.source.height=384;this.pen=this.source.getContext('2d');
 }
 init(){
  const canvas=this.canvas=document.createElement('canvas');canvas.width=512;canvas.height=384;
  const gl=this.gl=canvas.getContext('webgl',{alpha:true,antialias:false,premultipliedAlpha:false,preserveDrawingBuffer:true});if(!gl)throw Error('Water interactions WebGL unavailable');
  const program=gl.createProgram();for(const [type,source]of [[gl.VERTEX_SHADER,'attribute vec2 position;varying vec2 uv;void main(){uv=(position+1.)*.5;gl_Position=vec4(position,0,1);}'],[gl.FRAGMENT_SHADER,fragment]]){const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(shader));gl.attachShader(program,shader);gl.deleteShader(shader);}
  gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));gl.useProgram(program);this.program=program;
  gl.bindBuffer(gl.ARRAY_BUFFER,gl.createBuffer());gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);const pos=gl.getAttribLocation(program,'position');gl.enableVertexAttribArray(pos);gl.vertexAttribPointer(pos,2,gl.FLOAT,false,0,0);
  const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);for(const key of [gl.TEXTURE_MIN_FILTER,gl.TEXTURE_MAG_FILTER])gl.texParameteri(gl.TEXTURE_2D,key,gl.NEAREST);for(const key of [gl.TEXTURE_WRAP_S,gl.TEXTURE_WRAP_T])gl.texParameteri(gl.TEXTURE_2D,key,gl.CLAMP_TO_EDGE);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
  this.uniforms=Object.fromEntries(['time','view','swimmers[0]','headings[0]','impacts[0]'].map(key=>[key,gl.getUniformLocation(program,key)]));
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();this.failed=true;this.stats.mode='fallback';});
  this.stats.mode='webgl';
 }
 draw(c,g,renderer,w,h,paintWaterDonors){
  const cam=renderer.camera,ww=w/cam.zoom,hh=h/cam.zoom,left=cam.x-ww/2,top=cam.y-hh/2;
  if(cam.zoom<.4)return;
  // One shared low-resolution reflection/wake surface, at most 24 refreshes/sec.
  const design=g.trainTest?.design;
  if(this.world!==g||this.design!==design||this.terrain!==g.terrain||this.room!==design?.activeRoom){
   this.world=g;this.design=design;this.terrain=g.terrain;this.room=design?.activeRoom;this.frame=-1;this.props=new DecorationCache(4*1024*1024);
   this.contacts=new WeakMap();this.impactSlots.fill(0);this.impactIndex=0;
   this.iceShelves.clear();
  }
  const key=[Math.floor((g.time||0)*24),Math.floor(cam.x/64),Math.floor(cam.y/64),cam.zoom,w,h,g.seed,g.generatedEnvironment,design?.activeRoom,Math.round((g.snowDepth||0)*32)].join(':');
  if(key!==this.frame){
   const masks=reflectionMasks(g,left,top,ww,hh,this.iceShelves);
   this.mask=masks.water;this.iceMask=masks.ice;this.dryMask=masks.dry;
   if(!this.mask&&!this.iceMask){this.frame=key;this.stats={mode:'off',donors:0,swimmers:0,landings:0,steps:0,iceTiles:0};return;}
   if(this.mask&&!this.gl&&!this.failed)try{this.init();}catch(error){this.failed=true;this.stats.mode='fallback';console.warn(error.message);}
   const water=!!this.mask,waterShader=water&&this.gl&&!this.failed;
   if(!this.source)this.initSource();
   const pc=this.pen;pc.setTransform(1,0,0,1,0,0);pc.clearRect(0,0,512,384);pc.setTransform(512/ww,0,0,384/hh,-left*512/ww,-top*384/hh);pc.imageSmoothingEnabled=false;
   const visible=({x,y},half,depth)=>x+half>left&&x-half<left+ww&&y+depth>top&&y-depth<top+hh;
   const waterSamples=new Map();
   const sampledSurface=(x,y)=>{
    if(this.iceMask&&masks.iceCells.has(surfaceKey(x,y,masks.step)))return true;
    if(!water)return false;
    const col=Math.floor(x/4),row=Math.floor(y/4),sample=row*32768+col;
    if(!waterSamples.has(sample))waterSamples.set(sample,wet(g,col*4+2,row*4+2));
    return waterSamples.get(sample);
   };
   const nearSurface=(a,half,depth,direction)=>[2,depth*.2,depth*.48,depth*.8].some(d=>[0,-.55,.55,-.9,.9].some(side=>sampledSurface(a.x+side*half,a.y+d*direction)));
   let donors=0;
   const kinds={};
   if(water&&paintWaterDonors){
    // Large moving structures use the same low-resolution source and shoreline clip.
    pc.save();pc.clip(this.mask);
    const painted=paintWaterDonors(pc,{left,top,right:left+ww,bottom:top+hh});
    pc.restore();
    for(const [kind,count] of Object.entries(painted)){
     if(count){kinds[kind]=count;donors++;}
    }
   }
   const mirror=(a,half,depth,kind,draw)=>{
    if(!visible(a,half,depth))return;
    const direction=nearSurface(a,half,depth,1)?1:kind!=='actor'&&nearSurface(a,half,depth,-1)?-1:0;
    if(!direction)return;
    // Cast from the prop's ground contact into water even on the near bank.
    const scale=-.6*direction;
    pc.save();pc.beginPath();pc.rect(a.x-half,direction>0?a.y:a.y-depth,half*2,depth);pc.clip();
    pc.translate(0,a.y*(1-scale));pc.scale(1,scale);draw(pc);pc.restore();
    donors++;kinds[kind]=(kinds[kind]||0)+1;
   };
   // The native art and the player share the same ripple texture and water mask.
   if(!g.trainTest&&(g.generatedEnvironment||g.environment)==='forest'){
    for(const p of forestDecor(g).banks){
     if(donors>=8)break;
     if(p.kind==='reeds'&&visible(p,25,25)&&waterBodyAt(g,p.x,p.y)==='natural')mirror(p,25,25,p.kind,pen=>drawBankReeds(pen,p,g.time,g));
    }
   }
   const scenery=g.trainTest?g.scenery:renderer.decor||g.scenery;
   const library=renderer.assets.library;
   for(const p of scenery||[]){
    if(donors>=32)break;
    if(p.depleted||p.destroyed||p.overhead||p.cut&&!p.charred)continue;
    const base=propBase(p),size=p.size||40,half=Math.min(160,Math.max(16,size*.65,(p.width||0)/2)),depth=Math.min(180,Math.max(12,size*.83));
    mirror(base,half,depth,p.kind,pen=>this.props.draw(pen,p,library?.[p.kind]?0:1,context=>{
     if(!drawProp(context,p,g.time,g,{dynamicShadows:true,spriteLibrary:library}))renderer.assets.draw(context,p.kind,p.x,p.y,p.size);
    }));
   }
   for(const f of g.house?.furniture||[])if(donors<32&&!f.destroyed)mirror({x:f.x+f.w/2,y:f.y+f.h},f.w/2+8,40,f.kind,pen=>drawFurniture(pen,f,g));
   for(const b of g.house?.walls||[])if(donors<32&&!b.destroyed&&b.kind!=='fence')mirror({x:b.x+b.w/2,y:b.y+b.h},b.w/2+8,30,'wall',pen=>drawHouseWall(pen,b));
   for(const v of g.house?.vehicles||[])if(donors<32)mirror(v,75,60,'vehicle',pen=>drawHouseCar(pen,v,g));
   const actors=[...(g.players||[]),...(g.enemies||[])].filter(a=>!a.room&&a.hp>0&&visible(a,60,68));
   for(const a of actors.slice(0,16))mirror(a,52,66,'actor',pen=>{const actor={...a,isPlayer:(g.players||[]).includes(a)},shown=a.swimming?{...actor,y:a.y+20,groundHeight:0,equipment:{...a.equipment,hand1:null,hand2:null,cape:null}}:actor;renderer.animator.draw(pen,shown,g.time,actorRenderSize(actor));});
   let swimmers=0,impacts={landings:0,steps:0};
   if(waterShader){
    const positions=this.swimmerPositions,headings=this.swimmerHeadings;
    positions.fill(0);headings.fill(0);
    for(const a of actors)if(a.swimming&&!a.trainRide&&!a.trainDeck&&!(a.jumpHeight>0)&&(a.diveDepth||0)<=.12&&wet(g,a.x,a.y)){
     const i=swimmers*4,dx=a.faceX||0,dy=(a.faceY??1)/.55,length=Math.hypot(dx,dy);
     positions[i]=a.x;positions[i+1]=a.y;positions[i+2]=1;positions[i+3]=(a.id||0)*2.3;
     headings[i]=length?dx/length:0;headings[i+1]=length?dy/length:1;headings[i+2]=a.moving?1:0;
     if(++swimmers===8)break;
    }
    impacts=this.collectImpacts(g,visible);
    const gl=this.gl,u=this.uniforms;gl.uniform1f(u.time,g.time||0);gl.uniform4f(u.view,left,top,ww,hh);gl.uniform4fv(u['swimmers[0]'],positions);gl.uniform4fv(u['headings[0]'],headings);gl.uniform4fv(u['impacts[0]'],this.impactUniforms);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,this.source);gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
   }
   this.frame=key;this.view={left,top,ww,hh};this.stats={mode:waterShader?'webgl':water?'fallback':'ice-canvas',donors,kinds,swimmers,...impacts,iceTiles:masks.iceCells.size,pixels:512*384};
  }
  if(!this.mask&&!this.iceMask)return;
  const v=this.view;
  if(this.mask){
   const shaded=this.gl&&!this.failed;
   c.save();c.clip(this.mask);c.imageSmoothingEnabled=false;
   if(!shaded)c.globalAlpha*=.22;
   c.drawImage(shaded?this.canvas:this.source,v.left,v.top,v.ww,v.hh);c.restore();
  }
  if(this.iceMask){
   c.save();c.clip(this.iceMask);if(this.dryMask)c.clip(this.dryMask,'evenodd');c.imageSmoothingEnabled=false;c.globalAlpha*=.17;
   c.drawImage(this.source,v.left,v.top,v.ww,v.hh);c.restore();
  }
 }
}
