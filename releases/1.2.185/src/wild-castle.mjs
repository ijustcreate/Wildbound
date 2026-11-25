import {spellTransition} from './portal-transition.mjs';
import {castleInteriorPlan,GREYHAVEN_KITCHEN_FIREPLACE} from './wild-castle-interior.mjs';
import {GREYHAVEN,castleDeckAt} from './wild-castle-site.mjs';
import {isCharmed} from './succubus-charm.mjs';

export const CASTLE_INTERIOR_ORIGIN={x:16000,y:5200};
const ROOM_PREFIX='castle-greyhaven-';
const storyNames=['Great Hall','Gallery','High Solar'];
const BRIDGE_TIME=1.25;

export function castleStory(room){
 const story=typeof room==='string'&&room.startsWith(ROOM_PREFIX)?Number(room.slice(ROOM_PREFIX.length)):0;
 return Number.isInteger(story)&&story>=1&&story<=3?story:0;
}

export const castleStoryName=story=>storyNames[story-1];
export const toCastleWorld=({x,y})=>({x:x+CASTLE_INTERIOR_ORIGIN.x,y:y+CASTLE_INTERIOR_ORIGIN.y});

function kitchenHearthPoint(approach=false){
 const f=GREYHAVEN_KITCHEN_FIREPLACE;
 return toCastleWorld({x:f.x+(approach?f.w+15:f.w/2),y:f.y+f.h+(approach?16:0)});
}
export const GREYHAVEN_HEARTH=Object.freeze({
 id:'castle-greyhaven',name:'Castle Greyhaven Kitchen',room:'castle-greyhaven-1',
 get x(){return kitchenHearthPoint().x;},
 get y(){return kitchenHearthPoint().y;},
 get approach(){return kitchenHearthPoint(true);},
 get landing(){return kitchenHearthPoint(true);},
});
const toLocal=({x,y})=>({x:x-CASTLE_INTERIOR_ORIGIN.x,y:y-CASTLE_INTERIOR_ORIGIN.y});
const inRect=(x,y,r,pad=0)=>x>=r.x-pad&&x<=r.x+r.w+pad&&y>=r.y-pad&&y<=r.y+r.h+pad;
const onFloor=(x,y,f)=>f.r!==undefined?(x-f.x)**2+(y-f.y)**2<=f.r**2:inRect(x,y,f);

export function castleInteriorBlocked(story,x,y,radius=0){
 const local=toLocal({x,y}),plan=castleInteriorPlan(story);
 const probes=radius>0?[[0,0],[-radius,0],[radius,0],[0,-radius],[0,radius]]:[[0,0]];
 if(!probes.every(([dx,dy])=>plan.floors.some(f=>onFloor(local.x+dx,local.y+dy,f))))return true;
 if(plan.voids?.some(item=>inRect(local.x,local.y,item,radius)))return true;
 if(plan.walls.some(item=>inRect(local.x,local.y,item,radius)))return true;
 return plan.furniture.some(item=>item.blocking!==false&&inRect(local.x,local.y,item,radius));
}

function canTakeCastleSeat(p){
 return p.hp>0&&!p.trainRide&&!p.pirateRide&&!p.vehicleId&&!p.room&&!p.swimming&&!p.broomMount&&!p.wingHover&&
  !(p.jumpHeight>0)&&!(p.jumpVelocity>0)&&!(p.dashTime>0)&&!(p.stun>0)&&!(p.frozen>0)&&!(p.sleeping>0)&&
  !isCharmed(p)&&!p.controlledFollowerId;
}

function castleSeats(g,story,create=false){
 const t=g.trainTest;
 if(!t?.design?.wildLands)return null;
 if(t.greyhavenSeats&&t.greyhavenSeats.story!==story)delete t.greyhavenSeats;
 if(create&&!t.greyhavenSeats)t.greyhavenSeats={story,occupants:new Map()};
 const seats=t.greyhavenSeats?.occupants;
 if(!seats)return null;
 for(const [id,{player,park}] of seats){
  if(!g.players.includes(player)||!canTakeCastleSeat(player)||Math.hypot(player.x-park.x,player.y-park.y)>2)seats.delete(id);
 }
 return seats;
}

export function castleSeatFor(g,p){
 const story=castleStory(g.trainTest?.design.activeRoom),occupants=castleSeats(g,story);
 if(!story||!occupants?.size)return null;
 return castleInteriorPlan(story).seats?.find(seat=>occupants.get(seat.id)?.player===p)||null;
}

function seatAction(g,p,story,x,y){
 if(p.ui||!canTakeCastleSeat(p))return null;
 const seats=castleSeats(g,story);
 let action=null;
 for(const seat of castleInteriorPlan(story).seats||[]){
  if(seats?.get(seat.id)?.player===p)return {kind:'standSeat',seat,prompt:'STAND UP',reach:1,distance:0};
  const distance=Math.min(Math.hypot(x-seat.seat.x,y-seat.seat.y),Math.hypot(x-seat.stand.x,y-seat.stand.y));
  const reach=29;
  if(distance>reach||action&&action.distance<=distance)continue;
  const park=toCastleWorld(seat.stand),steps=Math.max(1,Math.ceil(Math.hypot(park.x-p.x,park.y-p.y)/6));
  let clear=true;
  for(let i=1;i<=steps;i++){
   const u=i/steps;
   if(castleInteriorBlocked(story,p.x+(park.x-p.x)*u,p.y+(park.y-p.y)*u,7)){clear=false;break;}
  }
  if(!clear)continue;
  const label=seat.label||(seat.kind==='throne'?'Throne':'Chair');
  if(seats?.has(seat.id))action={kind:'seatBusy',seat,prompt:'SEAT OCCUPIED',distance,reach};
  else if(g.players.some(q=>q!==p&&q.hp>0&&!q.room&&!q.trainRide&&!q.pirateRide&&
   Math.hypot(q.x-park.x,q.y-park.y)<24))action={kind:'seatApproachBusy',prompt:'CLEAR SPACE TO SIT',distance,reach};
  else action={kind:'takeSeat',seat,park,prompt:`SIT ON ${label.toUpperCase()}`,distance,reach};
 }
 return action;
}

function freezeSeatPlayer(p,seat){
 Object.assign(p,{faceX:seat.faceX,faceY:seat.faceY,charge:0,bowAiming:false,blocking:false,
  moving:false,walking:false,moveSpeed:0,movementGait:'idle',locomotionTransition:null,
  bowVisualAngle:null,locomotionVisualDirection:null,locomotionHeadDirection:null});
 delete p.playerFrame;
 delete p.poseTime;
}

export function recoverCastleSeatLanding(g,p){
 const story=castleStory(g.trainTest?.design.activeRoom);
 if(!story||!canTakeCastleSeat(p))return false;
 const {x,y}=toLocal(p);
 const chair=castleInteriorPlan(story).seats?.find(seat=>seat.blocking!==false&&inRect(x,y,seat));
 if(!chair||!castleInteriorBlocked(story,p.x,p.y))return false;
 const stand=toCastleWorld(chair.stand);
 if(castleInteriorBlocked(story,stand.x,stand.y,9))return false;
 Object.assign(p,stand,{moving:false,walking:false,moveSpeed:0,movementGait:'idle',locomotionTransition:null});
 g.persist?.();
 return true;
}

export function tickCastleSeat(g,p,input={},old={}){
 const seat=castleSeatFor(g,p);
 if(!seat)return recoverCastleSeatLanding(g,p);
 if(input.interact&&!old.interact||input.jump&&!old.jump){
  castleSeats(g,castleStory(g.trainTest.design.activeRoom))?.delete(seat.id);
  return true;
 }
 freezeSeatPlayer(p,seat);
 return true;
}

const targetRaised=t=>t.greyhavenBridgeRaised===true;
export function castleBridgeProgress(t){
 const motion=t.greyhavenBridgeMotion;
 if(!motion)return targetRaised(t)?1:0;
 const a=Math.min(1,Math.max(0,(t.time-motion.at)/BRIDGE_TIME));
 return motion.from+((targetRaised(t)?1:0)-motion.from)*a*a*(3-2*a);
}

// A moving span cannot support an actor until it is flat on the stone landing.
export const castleBridgeIsRaised=t=>targetRaised(t)||castleBridgeProgress(t)>.005;

function castleAction(g,p){
 const t=g.trainTest,d=t?.design;
 if(!d?.wildLands||p.hp<=0||p.trainRide||p.pirateRide||p.broomMount||p.wingHover||p.swimming||p.underBridge||p.vehicleId)return null;
 const story=castleStory(d.activeRoom);
 if(!story){
  if(d.activeRoom||Math.hypot(p.x-GREYHAVEN.entry.x,p.y-GREYHAVEN.entry.y)>44)return null;
  return {kind:'enter',prompt:'ENTER CASTLE GREYHAVEN'};
 }
 const plan=castleInteriorPlan(story),{x,y}=toLocal(p);
 const actions=[];
 const sitting=seatAction(g,p,story,x,y);
 if(sitting?.kind==='standSeat')return sitting;
 if(sitting)actions.push(sitting);
 if(plan.lever)actions.push({kind:'lever',distance:Math.hypot(x-plan.lever.x,y-plan.lever.y),reach:33,prompt:targetRaised(t)?'LOWER DRAWBRIDGE':'RAISE DRAWBRIDGE'});
 if(plan.entrance)actions.push({kind:'exit',distance:Math.hypot(x-plan.entrance.x,y-plan.entrance.y),reach:40,prompt:'STEP OUTSIDE'});
 for(const stair of plan.stairs){
  const up=stair.direction==='up'||stair.direction===1;
  const next=story+(up?1:-1);
  if(next<1||next>3)continue;
  const distance=Math.hypot(x-stair.x-stair.w/2,y-stair.y-stair.h/2);
  actions.push({kind:'stairs',stair,next,distance,reach:Math.max(32,Math.hypot(stair.w,stair.h)*.5+12),prompt:`${up?'CLIMB TO':'DESCEND TO'} ${castleStoryName(next).toUpperCase()}`});
 }
 return actions.filter(a=>a.distance<=a.reach).sort((a,b)=>a.distance-b.distance)[0]||null;
}

export const castlePrompt=(g,p)=>castleAction(g,p)?.prompt||'';

function placeCastleParty(g,story,anchor){
 const occupied=[];
 const candidates=[anchor];
 for(let distance=24;distance<=96;distance+=24)for(const [x,y]of [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[1,-1],[-1,1],[1,1]])candidates.push({x:anchor.x+x*distance,y:anchor.y+y*distance});
 for(const p of g.players){
  const at=candidates.find(q=>occupied.every(a=>Math.hypot(a.x-q.x,a.y-q.y)>=22)&&
   (story?!castleInteriorBlocked(story,q.x,q.y,9):Math.abs(q.x-anchor.x)<48&&Math.abs(q.y-anchor.y)<36))||anchor;
  occupied.push(at);
  Object.assign(p,at,{room:null,swimming:false,underBridge:false,trainDeck:false,trainGround:0,trainVisualLift:0,diveDepth:0,
   jumpHeight:0,jumpVelocity:0,groundHeight:0,jumpHeld:false,dashTime:0,moving:false,wingHover:false,broomMount:null});
  if(p.controlPetPosition)Object.assign(p.controlPetPosition,at);
  for(const pet of [p.hunterPet,p.ritualPet])if(pet)Object.assign(pet,at,{room:null,swimming:false});
 }
}

function moveParty(g,story,anchor,switchRoom){
 delete g.trainTest.greyhavenSeats;
 switchRoom(g,story?`${ROOM_PREFIX}${story}`:null);
 g.scenery=[];
 placeCastleParty(g,story,anchor);
 spellTransition(g);
 g.persist?.();
}

export function interactCastle(g,p,switchRoom){
 const action=castleAction(g,p);
 if(!action)return false;
 const t=g.trainTest;
 if(action.kind==='takeSeat'){
  const occupants=castleSeats(g,castleStory(t.design.activeRoom),true);
  if(!occupants.has(action.seat.id)){
   // Park at the clear stand point. The render pose alone moves onto the
   // seat, so existing checkpoint formats always restore clear of furniture.
   occupants.set(action.seat.id,{player:p,park:action.park});
   Object.assign(p,action.park);
   freezeSeatPlayer(p,action.seat);
   g.persist?.();
  }
  return true;
 }
 if(action.kind==='standSeat'){
  castleSeats(g,castleStory(t.design.activeRoom))?.delete(action.seat.id);
  return true;
 }
 if(action.kind==='seatBusy'){
  t.notice='Someone is already sitting there.';
  t.noticeUntil=t.time+2;
  return true;
 }
 if(action.kind==='seatApproachBusy'){
  t.notice='Clear the space beside the seat to sit.';
  t.noticeUntil=t.time+2;
  return true;
 }
 if(action.kind==='lever'){
  const raised=!targetRaised(t),from=castleBridgeProgress(t);
  t.greyhavenBridgeRaised=raised;
  t.greyhavenBridgeMotion={at:t.time,from};
  t.notice=raised?'Greyhaven’s drawbridge is rising.':'Greyhaven’s drawbridge is lowering.';
  t.noticeUntil=t.time+3;
  g.onSound?.('door',p);
  g.persist?.();
  return true;
 }
 if(g.players.some(q=>q.trainRide||q.pirateRide||q.vehicleId)){
  t.notice='Gather the explorers on foot before changing floors.';
  t.noticeUntil=t.time+3;
  return true;
 }
 if(action.kind==='enter'){
  const doorway=castleInteriorPlan(1).entrance;
  moveParty(g,1,toCastleWorld(doorway.spawn??doorway),switchRoom);
 }else if(action.kind==='exit')moveParty(g,0,GREYHAVEN.entry,switchRoom);
 else{
  const other=castleInteriorPlan(action.next).stairs.find(stair=>stair.link===action.stair.link&&stair.direction===-action.stair.direction);
  const landing=other?.spawn??action.stair.spawn??{x:action.stair.x+action.stair.w/2,y:action.stair.y+action.stair.h/2};
  moveParty(g,action.next,toCastleWorld(landing),switchRoom);
 }
 return true;
}

export function castleBridgeSupport(t,x,y){
 const d=t?.design;
 return d?.wildLands&&!d.activeRoom?castleDeckAt(x,y,castleBridgeIsRaised(t)):0;
}
