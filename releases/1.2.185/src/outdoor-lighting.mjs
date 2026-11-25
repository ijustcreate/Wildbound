import {daylight} from './night-cycle.mjs';
import {runtimeSun} from './realtime-shadows.mjs';
import {propLightGeometry,worldLightField} from './world-lighting.mjs';
import {treeType} from './forest-tree-art.mjs';
import {addPixelShadowPolygon} from './pixel-shadow.mjs';

const RADIANS = Math.PI / 180;
const pixel = value => Math.round(value / 2) * 2;
const lightScenes=new WeakMap();
const sunMasks = new WeakMap();
const sunTint = 0xff2c1e0f; // ImageData bytes for rgba(15,30,44,255)
// Each lobe is positioned and scaled within the existing light blocker. The
// shadow can follow distinct leaf masses without adding point-light volumes.
const broadCrown = [
 [-.36,-.18,.58,.63,.08,.8], [.02,-.14,.68,.73,.17,1],
 [.43,.13,.55,.63,0,.84], [-.18,.34,.6,.53,.04,.72],
];
const coniferCrown = [
 [-.15,-.25,.41,.62,.41,1], [.23,.02,.56,.64,.15,.78],
 [-.3,.24,.63,.52,0,.59],
];
const shrubCrown = [
 [-.5,.15,.5,.68,0,.68], [-.09,-.13,.62,.79,0,1], [.46,.04,.52,.66,0,.82],
];

export function outdoorLightingFrame(game,{view,sources,scenery,actors,active=true,sun=daylight(game)}){
 let scene=lightScenes.get(view);
 if(!scene){scene={scenery:[]};lightScenes.set(view,scene);}
 if(scene.scenery.length!==scenery.length||scenery.some((p,i)=>p!==scene.scenery[i]))scene.scenery=scenery;
 scene.time=game.time;scene.players=actors;
 return {time:game.time,ambient:daylight(game),sun,room:null,sources,
  field:active?worldLightField(scene,sources):null};
}

// Large silhouettes overlap in a shared low-resolution mask. Use one upload
// per view and apply opacity on composition so each shaded cell darkens once.
class SunShadowMask {
 constructor(width,height){
  this.canvas=new OffscreenCanvas(width,height);
  this.context=this.canvas.getContext('2d');
  this.image=this.context.createImageData(width,height);
  this.pixels=new Uint32Array(this.image.data.buffer);
 }
 rect(x,y,width){
  const start=(y/this.step-this.top)*this.image.width+x/this.step-this.left;
  this.pixels.fill(sunTint,start,start+width/this.step);
 }
 draw(c,strength){
  this.context.putImageData(this.image,0,0,0,0,this.width,this.height);
  c.globalAlpha*=.25*strength;
  c.imageSmoothingEnabled=false;
  const {step,left,top,width,height}=this;
  c.drawImage(this.canvas,0,0,width,height,left*step,top*step,width*step,height*step);
 }
}

function resetSunShadowMask(view,bounds){
 if(!bounds||typeof OffscreenCanvas==='undefined')return null;
 const {left,top,right,bottom}=bounds;
 const area=(right-left)*(bottom-top);
 const step=area>4_000_000?4:2;
 const x=Math.floor(left/step),y=Math.floor(top/step);
 const width=Math.ceil(right/step)-x,height=Math.ceil(bottom/step)-y;
 if(!(width>0&&height>0))return null;
 const paddedWidth=Math.ceil(width/64)*64,paddedHeight=Math.ceil(height/64)*64;
 let mask=sunMasks.get(view);
 if(!mask||mask.image.width!==paddedWidth||mask.image.height!==paddedHeight){
  mask=new SunShadowMask(paddedWidth,paddedHeight);
  sunMasks.set(view,mask);
 }
 Object.assign(mask,{left:x,top:y,width,height,step});
 mask.pixels.fill(0);
 return mask;
}

export function drawOutdoorSunShadows(c,game,props,actors,{strength=daylight(game),underCover=()=>false,bounds,view=c}={}){
 if(strength<=.025)return;
 const sun=runtimeSun(game,206,54);
 const angle=sun.azimuth*RADIANS;
 const reach=Math.min(1.24,1/Math.tan(sun.elevation*RADIANS));
 const dx=-Math.cos(angle)*reach,dy=-Math.sin(angle)*reach*.69;
 const mask=resetSunShadowMask(view,bounds),raster=mask||c,step=mask?.step??2;
 c.save();
 if(!mask)c.beginPath();
 for(const prop of props){
  const geometry=propLightGeometry(prop);
  const crown=prop.lightGeometry?null:prop.kind==='tree'||prop.kind==='snow_tree'?
   (treeType(prop)==='pine'?coniferCrown:broadCrown):prop.kind==='bush'||prop.kind==='frost_shrub'?shrubCrown:null;
  for(const v of geometry.volumes){
   if(v.maxZ<=3)continue;
   if(crown&&(geometry.bush||v.minZ>0))addCrownSilhouette(raster,v,crown,dx,dy,step,bounds);
   else addSilhouette(raster,v,dx,dy,step,bounds);
  }
 }
 for(const actor of actors){
  if(actor.hp<=0||actor.room||actor.carriedBy||actor.swimming||actor.underBridge||actor.trainRide||actor.trainDeck||actor.pirateRide||actor.vehicleId||underCover(actor))continue;
  const lift=actor.jumpHeight||0,pet=actor.kind&&actor.kind!=='player';
  const radius=actor.radius??(pet?7:6);
  const body={x:actor.x,y:actor.y,rx:radius*.84,ry:radius*.53,minZ:lift+2,maxZ:lift+(actor.height??(pet?19:30))};
  addSilhouette(raster,body,dx,dy,step,bounds);
 }
 if(mask)mask.draw(c,strength);
 else {c.fillStyle=`rgba(15,30,44,${.25*strength})`;c.fill();}
 c.restore();
}

function addCrownSilhouette(c,{x,y,rx,ry,minZ,maxZ},lobes,dx,dy,step,bounds){
 const height=maxZ-minZ;
 for(const [offsetX,offsetY,width,depth,bottom,top] of lobes){
  addSilhouette(c,{x:x+offsetX*rx,y:y+offsetY*ry,rx:width*rx,ry:depth*ry,
   minZ:minZ+bottom*height,maxZ:minZ+top*height},dx,dy,step,bounds);
 }
}

function addSilhouette(c,{x,y,rx,ry,minZ,maxZ,shape},dx,dy,step,bounds){
 const a=pixel(x+minZ*dx),b=pixel(y+minZ*dy),u=pixel(x+maxZ*dx),v=pixel(y+maxZ*dy);
 if(shape==='box'){
  const sx=dx<0?-rx:rx,sy=dy<0?-ry:ry;
  const points=[[a-sx,b-sy],[a+sx,b-sy],[u+sx,v-sy],[u+sx,v+sy],[u-sx,v+sy],[a-sx,b+sy]];
  addPixelShadowPolygon(c,points,step,bounds);
  return;
 }
 const width=Math.max(2,pixel(rx)),depth=Math.max(2,pixel(ry));
 const back=Math.atan2(dy/depth,dx/width)+Math.PI/2;
 const points=[];
 for(let cap=0;cap<2;cap++)for(let i=0;i<=4;i++){
  const angle=back+cap*Math.PI+i*Math.PI/4;
  const px=(cap?u:a)+pixel(Math.cos(angle)*width);
  const py=(cap?v:b)+pixel(Math.sin(angle)*depth);
  points.push([px,py]);
 }
 addPixelShadowPolygon(c,points,step,bounds);
}
