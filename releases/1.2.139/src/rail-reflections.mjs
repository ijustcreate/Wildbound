import {drawTrackBridgeReflection} from './train-bridge-art.mjs';
import {drawTrainCar} from './train-art.mjs';
import {railwayWater,trainWorld} from './train-track.mjs';
import {drawWildLandsCrossing} from './wild-lands-art.mjs';
import {WILD_BRIDGES} from './wild-lands-geography.mjs';

export function paintRailReflections(c,t,cars,bounds){
 const d=t.design;
 let bridge=0,train=0,footbridge=0;
 for(const route of [t.route,...(t.otherRoutes||[])])if(route)bridge+=drawTrackBridgeReflection(c,d,route,bounds);
 if(d.wildLands)for(const crossing of WILD_BRIDGES){
  const {x,y,w,h}=crossing,front=y+h/2-8;
  if(x+w/2<bounds.left||x-w/2>bounds.right||front>bounds.bottom||front+h*.46<bounds.top)continue;
  c.save();c.translate(0,front*1.46);c.scale(1,-.46);
  drawWildLandsCrossing(c,crossing);
  c.restore();
  footbridge++;
 }
 for(const car of cars){
  if(car.sink>=1)continue;
  const cos=Math.cos(car.a),sin=Math.sin(car.a);
  const halfX=Math.abs(cos)*car.length/2+Math.abs(sin)*car.width/2+28;
  const halfY=Math.abs(sin)*car.length/2+Math.abs(cos)*car.width/2+28;
  if(car.x+halfX<bounds.left||car.x-halfX>bounds.right||car.y-halfY>bounds.bottom||car.y+halfY+125<bounds.top)continue;
  const overWater=[-.44,0,.44].some(along=>[-.48,0,.48].some(across=>{
   const contact=trainWorld(car,along*car.length,across*car.width);
   return railwayWater(d,contact.x,contact.y);
  }));
  if(!overWater)continue;
  // A slight shear keeps the compression aligned with the local axis on diagonals.
  const shear=Math.max(-.60,Math.min(.60,sin*cos*1.5)),surfaceY=car.y+5,vertical=-.58;
  c.save();
  c.transform(1,shear,0,vertical,0,surfaceY*(1-vertical)-car.x*shear);
  drawTrainCar(c,d,car,{time:t.time,distance:t.distance,speed:t.speed,engine:t.engine,doors:t.doors,
   roofAlpha:t.roof[car.id]??1,cocoaTaken:t.cocoaTaken,staticArt:true});
  c.restore();
  train++;
 }
 return {bridge,train,footbridge};
}
