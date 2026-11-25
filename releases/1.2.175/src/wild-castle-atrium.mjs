import {startJump} from './jumping.mjs';
import {castleStory,toCastleWorld} from './wild-castle.mjs';
import {castleInteriorPlan} from './wild-castle-interior.mjs';
import {switchWildLandsLayer} from './wild-lands-world.mjs';
import {planWildGroundArrivals} from './wrong-turn-travel.mjs';

const greatHall='castle-greyhaven-1';
const overRailTime=.34,fallTime=.41;
const fallHeight=85;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));

export function beginCastleAtriumDrop(g,p,mx,my,jump){
 const t=g.trainTest;
 if(castleStory(t.design.activeRoom)!==2||t.greyhavenAtriumDrop||
    !jump&&(!(p.jumpHeight>=13)||p.jumpVelocity<=0||Math.hypot(mx,my)<.3))return false;
 const opening=castleInteriorPlan(2).voids[0],edge=toCastleWorld(opening);
 const right=edge.x+opening.w,bottom=edge.y+opening.h;
 const dx=clamp(p.x,edge.x,right)-p.x,dy=clamp(p.y,edge.y,bottom)-p.y;
 const distance=Math.hypot(dx,dy);
 if(distance<1||distance>34)return false;
 const steering=Math.hypot(mx,my)>.25;
 const lookX=steering?mx:p.faceX||0,lookY=steering?my:p.faceY||0;
 const look=Math.hypot(lookX,lookY);
 if(!look||lookX*dx+lookY*dy<distance*look*.44)return false;

 const travellers=[p,...g.players.filter(q=>q!==p)];
 if(travellers.some(q=>q.trainRide||q.pirateRide||q.vehicleId||q.room||q.broomMount||q.ui?.carry))return false;
 const over={x:clamp(p.x,edge.x+35,right-35),y:clamp(p.y,edge.y+35,bottom-35)};
 const arrivals=planWildGroundArrivals(g,greatHall,over,travellers,72);
 if(!arrivals||!(p.jumpHeight>0||startJump(p)))return false;
 t.greyhavenAtriumDrop={id:p.id,at:t.time,start:{x:p.x,y:p.y},over,air:p.jumpHeight,
  party:travellers.map((player,i)=>({id:player.id,position:arrivals[i]}))};
 p.faceX=dx/distance;p.faceY=dy/distance;
 p.moving=false;p.walking=false;p.charge=0;
 return true;
}

export function castleAtriumPose(actor,g){
 const t=g.trainTest,drop=t.greyhavenAtriumDrop;
 if(!drop||drop.id!==actor.id||drop.crossed)return actor;
 // Keep the checkpoint's upper-floor coordinates on the walkable gallery.
 const progress=Math.min(1,(t.time-drop.at)/overRailTime)**1.45;
 return {...actor,x:drop.start.x+(drop.over.x-drop.start.x)*progress,
  y:drop.start.y+(drop.over.y-drop.start.y)*progress};
}

export function tickCastleAtriumDrop(g){
 const t=g.trainTest,drop=t.greyhavenAtriumDrop;
 if(!drop)return false;
 const jumper=g.players.find(p=>p.id===drop.id);
 if(!jumper||jumper.hp<=0||t.design.activeRoom!==(drop.crossed?greatHall:'castle-greyhaven-2')){
  if(jumper)Object.assign(jumper,{jumpHeight:0,jumpVelocity:0,jumpHeld:false});
  delete t.greyhavenAtriumDrop;
  return false;
 }
 const age=t.time-drop.at;
 if(age<overRailTime){
  const phase=age/overRailTime;
  jumper.jumpAge=age;
  jumper.jumpHeight=drop.air*(1-phase)+25*Math.sin(phase*Math.PI*.79);
  jumper.jumpVelocity=25*Math.PI*.79/overRailTime*Math.cos(phase*Math.PI*.79);
  jumper.jumpPeakHeight=Math.max(jumper.jumpPeakHeight||0,jumper.jumpHeight);
  return true;
 }
 if(!drop.crossed){
  switchWildLandsLayer(g,greatHall);
  drop.crossed=true;
  for(const {id,position} of drop.party){
   const hero=g.players.find(p=>p.id===id);
   if(!hero)continue;
   Object.assign(hero,position,{ui:null,moving:false,walking:false,charge:0,dashTime:0,dashRecovery:0,
    jumpHeight:0,jumpVelocity:0,jumpHeld:false,groundHeight:0,trainGround:0,trainVisualLift:0});
   if(hero.controlPetPosition)Object.assign(hero.controlPetPosition,position);
   for(const pet of [hero.hunterPet,hero.ritualPet])if(pet)Object.assign(pet,position);
  }
 }
 const progress=Math.min(1,(age-overRailTime)/fallTime);
 jumper.jumpHeight=fallHeight*(1-progress**2);
 jumper.jumpVelocity=-fallHeight*2*progress/fallTime;
 jumper.jumpFallAge=progress*fallTime;
 jumper.jumpPeakHeight=fallHeight;
 if(progress===1){
  Object.assign(jumper,{jumpHeight:0,jumpVelocity:0,landTime:.22,jumpLandingVX:0,jumpLandingVY:0});
  delete t.greyhavenAtriumDrop;
  g.persist?.();
 }
 return true;
}
