import {trainLocal} from './train-track.mjs';
import {trainCarDepth} from './train-visibility.mjs';

// Cars are painted before the upright world. Subjects retain their true ground
// depth; physical foreground faces are removed from each subject's own layer.
export const trainSceneDepth=p=>p.trainDepthY??p.rootY??p.y;
export function trainLayerBounds(kind,p){
 if(kind==='tree'){const s=p.size||90;return {halfWidth:Math.max(80,s*.9,(p.width||0)/2+20),above:Math.max(115,s*1.9,(p.height||0)+50),below:Math.max(50,s*.7,(p.depth||0)+30)};}
 if(kind==='building'||p.stationBuilding||p.stationBackwall)return {halfWidth:500,above:650,below:180};
 if(kind==='station')return {halfWidth:Math.max(130,((p.stationAsset?.w||p.w||120)+(p.stationAsset?.h||0))/2+80),above:Math.max(220,(p.stationAsset?.height||p.height||150)+(p.stationAsset?.h||0)+90),below:100};
 return {halfWidth:96,above:128,below:64};
}
export function trainSceneOccluders(point,actor,cars,optionsFor,bounds=trainLayerBounds('actor',actor)){
 const lift=actor.jumpHeight||actor.groundHeight||0,left=actor.x-bounds.halfWidth,right=actor.x+bounds.halfWidth,top=actor.y-lift-bounds.above,bottom=actor.y-lift+bounds.below;
 return cars.filter(c=>{
  const hx=Math.abs(Math.cos(c.a))*c.length/2+Math.abs(Math.sin(c.a))*c.width/2+24,hy=Math.abs(Math.sin(c.a))*c.length/2+Math.abs(Math.cos(c.a))*c.width/2+24;
  return c.x+hx>left&&c.x-hx<right&&c.y+hy-c.z>top&&c.y-hy-c.z-116<bottom;
 }).sort((a,b)=>trainCarDepth(a)-trainCarDepth(b)).map(car=>({car,rider:{...trainLocal(car,point),height:lift,floor:point.trainRide?20:(point.trainGround||0)-car.z},options:optionsFor(car)}));
}
