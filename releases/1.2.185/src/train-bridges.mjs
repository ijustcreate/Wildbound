import {railwaySurface} from './railway-water.mjs';
import {sampleTrainRoute,nearestTrainTrack,railwayWater,railElevation,trainCars,trainWorld} from './train-track.mjs';
import {startVehicleSplash,tickVehicleWaterParticles,drawVehicleWater} from './vehicle-water.mjs';
const states=new WeakMap(),SPAN=48;
export function railwayBridgeState(d){let state=states.get(d);if(!state){state={damage:new Map(),broken:new Set(),revision:0};states.set(d,state);}return state;}
export function resetRailwayBridges(d){const state=railwayBridgeState(d);state.broken.clear();state.damage.clear();state.revision++;}
const key=(route,s)=>route.id+':'+Math.floor((((s%route.length)+route.length)%route.length)/SPAN);
export function railSpanBroken(d,route,s){return railwayBridgeState(d).broken.has(key(route,s));}
export function bridgeSupportAt(t,x,y){for(const route of [t.route,...(t.otherRoutes||[])]){const q=nearestTrainTrack(route,x,y);if(q.distance<t.design.gauge/2+17&&(railwayWater(t.design,q.x,q.y)||railElevation(t.design,q)>2)&&!railSpanBroken(t.design,route,q.s))return true;}return false;}
// Sword damage uses the same world-space strike, reach and facing as props.
// Decks are a support layer, never an invisible solid barrier to swimmers.
export function damageRailwayBridge(g,p,damage,range,spin=false){
 const t=g.trainTest;if(!t||p.trainRide||p.underBridge||!(damage>0))return false;let best;
 for(const route of [t.route,...(t.otherRoutes||[])]){const hit=nearestTrainTrack(route,p.x,p.y),center=Math.floor(hit.s/SPAN)*SPAN+SPAN/2;
  for(let ds=-SPAN;ds<=SPAN;ds+=SPAN){const q=sampleTrainRoute(route,center+ds);if(!(railwayWater(t.design,q.x,q.y)||railElevation(t.design,q)>2)||railSpanBroken(t.design,route,q.s))continue;
   const dx=q.x-p.x,dy=q.y-p.y,along=dx*Math.cos(q.a)+dy*Math.sin(q.a),across=-dx*Math.sin(q.a)+dy*Math.cos(q.a),distance=Math.hypot(Math.max(0,Math.abs(along)-SPAN/2),Math.max(0,Math.abs(across)-t.design.gauge/2-17));
   if(distance>range||!spin&&Math.hypot(dx,dy)>12&&(dx*(p.faceX||0)+dy*(p.faceY||0))/Math.hypot(dx,dy)<.25)continue;if(!best||distance<best.distance)best={q,route,distance};
  }
 }
 if(!best)return false;const state=railwayBridgeState(t.design),id=key(best.route,best.q.s),value=(state.damage.get(id)||0)+20;state.damage.set(id,value);
 g.onSound?.(value>=80?'woodBreak':'hit',best.q);
 if(value>=80){state.broken.add(id);state.revision++;g.effects?.push({x:best.q.x,y:best.q.y,text:'BRIDGE BROKEN',color:'#dbba83',life:1});for(let i=0;i<14;i++){const a=i*2.39996;t.particles.push({kind:'splinter',x:best.q.x+Math.cos(a)*25,y:best.q.y-8+Math.sin(a)*15,vx:Math.cos(a)*40,vy:Math.sin(a)*30,life:.8,max:.8,size:3});}}
 return true;
}
function deepSplashPoint(d,route,q){for(let r=0;r<=256;r+=8)for(const sign of [-1,1]){const p=sampleTrainRoute(route,q.s+r*sign);if(railwaySurface(d,p.x,p.y)==='water')return p;}return null;}
export function tickTrainBridgeWater(g,dt,previousDistance){const t=g.trainTest;if(!t)return;
 if(!t.derailed){const travel=Math.max(0,t.distance-previousDistance),steps=Math.max(1,Math.ceil(travel/8));let hit;
  for(let i=0;i<=steps&&!hit;i++){const q=sampleTrainRoute(t.route,previousDistance+travel*i/steps+t.design.cars[0].length*.32);if(railSpanBroken(t.design,t.route,q.s)&&railwayWater(t.design,q.x,q.y)&&deepSplashPoint(t.design,t.route,q))hit=q;}
  if(hit){t.distance=hit.s-t.design.cars[0].length*.32;t.derailed={age:0,distance:t.distance,entrySpeed:Math.max(65,t.speed),cars:trainCars(t).map(c=>({...c,sinkAge:0,submerging:true,sink:0,effects:{}}))};t.speed=0;t.throttle=0;t.engine=false;t.driver=null;t.notice='Broken bridge! Train in the water. Use the railway workshop to repair and reset.';t.noticeUntil=t.time+9;
   for(const p of g.players){if(!p.trainRide)continue;const car=t.derailed.cars[p.trainRide.car],side=Math.sign(p.trainRide.y||1),q=trainWorld(car,p.trainRide.x,side*(car.width/2+30));delete p.trainRide;Object.assign(p,{x:q.x,y:q.y,trainGround:0,trainDeck:false,groundHeight:0,jumpHeight:0,jumpVelocity:0,underBridge:bridgeSupportAt(t,q.x,q.y),swimming:railwaySurface(t.design,q.x,q.y)==='water',trainBoardAfter:Infinity,moving:false});}
  }
 }
 if(!t.derailed)return;const wreck=t.derailed;wreck.age+=dt;wreck.distance+=wreck.entrySpeed*dt;const approaching=trainCars({...t,derailed:null,distance:wreck.distance});
 for(const car of wreck.cars){if(!car.splashed){const next=approaching[car.index],q=next.front;if(!railSpanBroken(t.design,t.route,q.s)||!railwayWater(t.design,q.x,q.y)){Object.assign(car,{x:next.x,y:next.y,a:next.a,z:next.z});continue;}const splash=deepSplashPoint(t.design,t.route,q)||q;Object.assign(car,{x:splash.x,y:splash.y,a:next.a,z:0,splashed:true});startVehicleSplash(car);g.onSound?.('splash',car);}car.sinkAge+=dt;car.sink=Math.min(1,car.sinkAge/3.2);car.z=-car.sink*135;tickVehicleWaterParticles(car,dt);}
}
export function drawTrainBridgeWater(c,t){for(const car of t.derailed?.cars||[])drawVehicleWater(c,car);}
