import {daylight} from './night-cycle.mjs';
import {runtimeSun} from './realtime-shadows.mjs';
import {propLightGeometry,worldLightField} from './world-lighting.mjs';

const RADIANS = Math.PI / 180;
const pixel = value => Math.round(value / 2) * 2;
const lightScenes=new WeakMap();

export function outdoorLightingFrame(game,{view,sources,scenery,actors,active=true,sun=daylight(game)}){
 let scene=lightScenes.get(view);
 if(!scene){scene={scenery:[]};lightScenes.set(view,scene);}
 if(scene.scenery.length!==scenery.length||scenery.some((p,i)=>p!==scene.scenery[i]))scene.scenery=scenery;
 scene.time=game.time;scene.players=actors;
 return {time:game.time,ambient:daylight(game),sun,room:null,sources,
  field:active?worldLightField(scene,sources):null};
}

// Project all casters into a single path, so intersecting silhouettes do not
// darken twice. The camera owns the caster cull and the ground draw order.
export function drawOutdoorSunShadows(c,game,props,actors,{strength=daylight(game),underCover=()=>false}={}){
 if(strength<=.025)return;
 const sun=runtimeSun(game,206,54);
 const angle=sun.azimuth*RADIANS;
 const reach=Math.min(1.24,1/Math.tan(sun.elevation*RADIANS));
 const dx=-Math.cos(angle)*reach,dy=-Math.sin(angle)*reach*.69;
 c.save();c.beginPath();
 for(const prop of props){
  const geometry=propLightGeometry(prop);
  for(const v of geometry.volumes){
   if(v.maxZ<=3)continue;
   addSilhouette(c,v,dx,dy);
  }
 }
 for(const actor of actors){
  if(actor.hp<=0||actor.room||actor.carriedBy||actor.swimming||actor.underBridge||actor.trainRide||actor.trainDeck||actor.pirateRide||actor.vehicleId||underCover(actor))continue;
  const lift=actor.jumpHeight||0,pet=actor.kind&&actor.kind!=='player';
  const radius=actor.radius??(pet?7:6);
  const body={x:actor.x,y:actor.y,rx:radius*.84,ry:radius*.53,minZ:lift+2,maxZ:lift+(actor.height??(pet?19:30))};
  addSilhouette(c,body,dx,dy);
 }
 c.fillStyle=`rgba(15,30,44,${.25*strength})`;c.fill();c.restore();
}

function addSilhouette(c,{x,y,rx,ry,minZ,maxZ,shape},dx,dy){
 const a=pixel(x+minZ*dx),b=pixel(y+minZ*dy),u=pixel(x+maxZ*dx),v=pixel(y+maxZ*dy);
 if(shape==='box'){
  const sx=dx<0?-rx:rx,sy=dy<0?-ry:ry;
  const points=[[a-sx,b-sy],[a+sx,b-sy],[u+sx,v-sy],[u+sx,v+sy],[u-sx,v+sy],[a-sx,b+sy]];
  if(sx*sy<0)points.reverse();
  c.moveTo(...points[0]);
  for(let i=1;i<points.length;i++)c.lineTo(...points[i]);
  c.closePath();
  return;
 }
 const width=Math.max(2,pixel(rx)),depth=Math.max(2,pixel(ry));
 const back=Math.atan2(dy/depth,dx/width)+Math.PI/2;
 for(let cap=0;cap<2;cap++)for(let i=0;i<=4;i++){
  const angle=back+cap*Math.PI+i*Math.PI/4;
  const px=(cap?u:a)+pixel(Math.cos(angle)*width);
  const py=(cap?v:b)+pixel(Math.sin(angle)*depth);
  if(!cap&&!i)c.moveTo(px,py);else c.lineTo(px,py);
 }
 c.closePath();
}
