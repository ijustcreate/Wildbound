import {sketchSurfaceAt} from './wild-lands-geography.mjs';
import {HOLLOW_ROOM,hollowSurface} from './wild-mountain-layout.mjs';
import {interactPirateCrew,pirateCrewPrompt,tickPirateCrew} from './pirate-crew.mjs';
import {inspectWreckTreasure,wreckTreasureBlocked,wreckTreasurePrompt} from './pirate-wreck-treasure.mjs';

export const PIRATE_SHIP_BERTH=Object.freeze({id:'portal-island',x:14900,y:7970,a:-.42});
export const PIRATE_CAVE_BERTH=Object.freeze({id:HOLLOW_ROOM,x:8050,y:5050,a:-.42});
export const PIRATE_SHIP_LAYOUT=Object.freeze({
 hull:[{x:-340,y:-106},{x:-294,y:-124},{x:160,y:-124},{x:278,y:-80},{x:350,y:0},{x:278,y:80},{x:160,y:124},{x:-294,y:124},{x:-340,y:106}],
 deckZ:28,
 holdZ:5,
 plank:{x:-220,nearY:109,farY:205,width:34},
 hatch:{x:-173,y:30,w:42,h:34},
 nests:[{id:'aft',x:-174,y:0,z:115,radius:25,ropeY:-21},{id:'main',x:18,y:0,z:165,radius:29,ropeY:18},{id:'fore',x:169,y:0,z:130,radius:23,ropeY:18}],
 cannons:[-1,1].flatMap(side=>[-93,46,162].map((x,i)=>({id:(side<0?'north':'south')+'-'+i,x,y:side*100,side}))),
 hold:{left:-278,right:138,top:-83,bottom:83,partitionX:-110,passageHalf:25},
});

const layout=PIRATE_SHIP_LAYOUT;
const PLAYER_RADIUS=7,RELOAD_TIME=2.4;
const deckFixtures=[[-282,0,14,17],[-264,-54,15,15],[-265,57,15,15],[218,-39,15,15],[227,40,15,15]];
const holdFixtures=[[-259,-68,17,13],[-238,-69,17,13],[117,-69,17,13],[119,71,17,13]];
const clamp=(value,lo,hi)=>Math.max(lo,Math.min(hi,value));
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const canBoard=p=>p.hp>0&&!p.room&&!p.trainRide&&!p.vehicleId&&!p.broomMount&&!p.swimming&&!p.wingHover&&(p.jumpHeight||0)<2;
const touchesFixture=(fixtures,x,y,r)=>fixtures.some(([fx,fy,w,h])=>Math.abs(x-fx)<w/2+r&&Math.abs(y-fy)<h/2+r);

export function pirateShip(g){
 const t=g.trainTest;
 if(!t?.design.wildLands)return null;
 const room=t.design.activeRoom;
 const berth=!room?PIRATE_SHIP_BERTH:room===PIRATE_CAVE_BERTH.id?PIRATE_CAVE_BERTH:null;
 if(!berth)return null;
 const ships=t.pirateShips??={};
 return ships[berth.id]??={...berth,z:0,time:t.time||0,cooldowns:{},shots:[],nextShot:1};
}

export function pirateShipPoint(ship,x,y,z=0){
 const c=Math.cos(ship.a),s=Math.sin(ship.a);
 return {x:ship.x+x*c-y*s,y:ship.y+x*s+y*c,z:z+(ship.z||0)};
}

export function pirateShipLocal(ship,point){
 const c=Math.cos(ship.a),s=Math.sin(ship.a),dx=point.x-ship.x,dy=point.y-ship.y;
 return {x:dx*c+dy*s,y:-dx*s+dy*c};
}

export function piratePlankHeight(ship,y){
 const {nearY,farY}=layout.plank;
 return (layout.deckZ+(ship.z||0))*(1-clamp((y-nearY)/(farY-nearY),0,1));
}

function insideHull(x,y,radius=0){
 const hull=layout.hull;
 return hull.every((b,i)=>{
  const a=hull[(i+hull.length-1)%hull.length],dx=b.x-a.x,dy=b.y-a.y;
  return dx*(y-a.y)-dy*(x-a.x)>=radius*Math.hypot(dx,dy);
 });
}

function insidePlank(x,y,radius){
 const {plank}=layout;
 return Math.abs(x-plank.x)<=plank.width/2-radius&&y>=plank.nearY&&y<=plank.farY+14;
}

function insideHold(x,y,radius){
 const {left,right,top,bottom,partitionX,passageHalf}=layout.hold;
 return x>=left+radius&&x<=right-radius&&y>=top+radius&&y<=bottom-radius&&
  (Math.abs(x-partitionX)>5+radius||Math.abs(y)<=passageHalf-radius);
}

function surfaceBlocked(ride,x,y,radius=PLAYER_RADIUS){
 if(ride.level==='hold')return !insideHold(x,y,radius)||touchesFixture(holdFixtures,x,y,radius)||
  ride.shipId===PIRATE_CAVE_BERTH.id&&wreckTreasureBlocked(x,y,radius);
 if(ride.level==='nest'){
  const nest=layout.nests.find(n=>n.id===ride.nest);
  return !nest||distance(nest,{x,y})>nest.radius-radius||distance(nest,{x,y})<5+radius;
 }
 if(ride.level==='rope')return true;
 if(insidePlank(x,y,radius))return false;
 return !insideHull(x,y,radius)||layout.nests.some(n=>distance(n,{x,y})<7+radius)||
  touchesFixture(deckFixtures,x,y,radius)||layout.cannons.some(c=>Math.abs(x-c.x)<13+radius&&Math.abs(y-c.y)<12+radius);
}

export function pirateShipBlocked(g,x,y,radius,from,height=0){
 const ship=pirateShip(g);
 if(!ship||Math.abs(x-ship.x)>430||Math.abs(y-ship.y)>410)return false;
 const local=pirateShipLocal(ship,{x,y});
 if(from?.pirateRide)return surfaceBlocked(from.pirateRide,local.x,local.y,radius);
 return height<61&&insideHull(local.x,local.y,-radius);
}

function resetRiderPose(p){
 p.swimming=false;p.underBridge=false;p.trainDeck=false;p.trainGround=0;p.trainVisualLift=0;
 p.groundHeight=p.jumpHeight=p.jumpVelocity=p.diveDepth=0;p.jumpHeld=false;
 p.dashTime=p.dashRecovery=p.charge=0;p.moving=false;
}

export function syncPirateShipPlayer(g,p){
 const r=p.pirateRide;
 if(!r)return;
 const ship=pirateShip(g);
 if(!ship||p.room||p.trainRide||p.vehicleId||(r.shipId&&r.shipId!==ship.id)||!Number.isFinite(r.x)||!Number.isFinite(r.y)){
  clearPirateRide(p);
  return;
 }
 const nest=layout.nests.find(n=>n.id===r.nest);
 if(!['plank','deck','hold','rope','nest'].includes(r.level)||(['rope','nest'].includes(r.level)&&!nest)){
  // Compatibility with checkpoints from earlier layouts.
  p.pirateRide={shipId:ship.id,level:'deck',x:layout.hatch.x,y:layout.hatch.y+20};
  syncPirateShipPlayer(g,p);
  return;
 }
 const point=pirateShipPoint(ship,r.x,r.y);
 r.shipId=ship.id;
 let lift=(r.level==='hold'?layout.holdZ:layout.deckZ)+ship.z;
 if(r.level==='plank')lift=piratePlankHeight(ship,r.y);
 if(r.level==='nest')lift=nest.z+ship.z;
 if(r.level==='rope')lift=clamp(r.height??layout.deckZ,layout.deckZ,nest.z)+ship.z;
 p.x=point.x;p.y=point.y;p.pirateVisualLift=lift;
}

export function clearPirateRide(p){
 if(!p.pirateRide&&p.pirateVisualLift===undefined)return;
 delete p.pirateRide;delete p.pirateVisualLift;
}

function boardable(p,ship,reach){
 if(!ship||!canBoard(p))return null;
 const {plank}=layout;
 if(Math.abs(p.x-ship.x)>480||Math.abs(p.y-ship.y)>480)return null;
 const q=pirateShipLocal(ship,p);
 return Math.abs(q.x-plank.x)<=reach&&q.y>=plank.farY-8&&q.y<=plank.farY+reach?q:null;
}

function board(g,p,ship,q){
 const {plank}=layout;
 resetRiderPose(p);
 p.pirateRide={shipId:ship.id,level:'plank',x:clamp(q.x,plank.x-8,plank.x+8),y:plank.farY-5};
 syncPirateShipPlayer(g,p);
}

export function stepOntoPiratePlank(g,p,previous){
 if(p.pirateRide)return true;
 const ship=pirateShip(g),q=boardable(p,ship,layout.plank.width/2-PLAYER_RADIUS);
 if(!q||q.y>layout.plank.farY+3||pirateShipLocal(ship,previous).y<=q.y)return false;
 board(g,p,ship,q);
 return true;
}

function nearAction(ship,ride){
 if(ride.level==='hold')return distance(ride,layout.hatch)<=34?{kind:'deck'}:null;
 if(ride.level==='nest')return {kind:'down'};
 if(ride.level==='rope')return {kind:'reverse'};
 if(ride.level!=='deck')return null;
 const cannon=layout.cannons.find(c=>distance(ride,c)<=37);
 if(cannon)return {kind:ship.time<(ship.cooldowns[cannon.id]||0)?'reloading':'cannon',cannon};
 if(distance(ride,layout.hatch)<=34)return {kind:'hold'};
 const nest=layout.nests.find(n=>distance(ride,{x:n.x,y:n.ropeY})<=29);
 return nest?{kind:'up',nest}:null;
}

export function pirateShipPrompt(g,p){
 const ship=pirateShip(g),r=p.pirateRide;
 if(!ship||p.hp<=0||p.ui)return '';
 if(!r)return boardable(p,ship,32)?'BOARD PIRATE SHIP':'';
 if(r.level==='plank')return '';
 const treasure=wreckTreasurePrompt(g,p);
 if(treasure)return treasure;
 const action=nearAction(ship,r);
 if(!['deck','hold','cannon','up','reverse'].includes(action?.kind)){
  const crew=pirateCrewPrompt(g,p);if(crew)return crew;
 }
 return ({deck:'RETURN TO MAIN DECK',hold:'GO BELOW DECK',up:'CLIMB ROPE',down:'CLIMB DOWN',reverse:'REVERSE CLIMB',cannon:'FIRE CANNON',reloading:'CANNON RELOADING'})[action?.kind]||'';
}

export function interactPirateShip(g,p){
 const ship=pirateShip(g),r=p.pirateRide;
 if(!ship||p.hp<=0||p.ui)return false;
 if(!r){
  const point=boardable(p,ship,32);
  if(!point)return false;
  board(g,p,ship,point);
  return true;
 }
 if(inspectWreckTreasure(g,p))return true;
 const action=nearAction(ship,r);
 if(!['deck','hold','cannon','up','reverse'].includes(action?.kind)&&interactPirateCrew(g,p))return true;
 if(!action)return true;
 if(action.kind==='cannon'){
  const c=action.cannon;
  ship.cooldowns[c.id]=ship.time+RELOAD_TIME;
  ship.shots.push({id:ship.nextShot++,cannonId:c.id,x:c.x,y:c.y+c.side*25,z:layout.deckZ+14,side:c.side,age:0});
  g.onSound?.('pirateCannon',p);
 }else if(action.kind==='hold'||action.kind==='deck'){
  resetRiderPose(p);
  p.pirateRide={shipId:ship.id,level:action.kind,x:layout.hatch.x,y:layout.hatch.y+17};
  g.onSound?.('doorOpen',p);
 }else if(action.kind==='up'||action.kind==='down'){
  const nest=action.nest||layout.nests.find(n=>n.id===r.nest);
  if(!nest)return true;
  resetRiderPose(p);
  const up=action.kind==='up';
  p.pirateRide={shipId:ship.id,level:'rope',nest:nest.id,x:nest.x,y:nest.ropeY,height:up?layout.deckZ:nest.z,up};
  g.onSound?.('climb',p);
 }else if(action.kind==='reverse')r.up=!r.up;
 syncPirateShipPlayer(g,p);
 return true;
}

function walkRider(g,p,ship,dx,dy){
 const r=p.pirateRide,{plank}=layout;
 const steps=Math.max(1,Math.ceil(Math.hypot(dx,dy)/3));
 for(let i=0;i<steps;i++){
  if(!surfaceBlocked(r,r.x+dx/steps,r.y))r.x+=dx/steps;
  if(!surfaceBlocked(r,r.x,r.y+dy/steps))r.y+=dy/steps;
  if(r.level==='hold'||r.level==='nest')continue;
  if(r.level==='deck'&&insidePlank(r.x,r.y,PLAYER_RADIUS)&&r.y>plank.nearY+3)r.level='plank';
  if(r.level==='plank'&&r.y<plank.nearY+2)r.level='deck';
  if(r.level==='plank'&&r.y>=plank.farY+5){
   const landing=pirateShipPoint(ship,r.x,r.y);
   p.x=landing.x;p.y=landing.y;clearPirateRide(p);
   return;
  }
 }
 syncPirateShipPlayer(g,p);
}

export function movePirateShipPlayer(g,p,dx,dy){
 const ship=pirateShip(g),r=p.pirateRide;
 if(!ship||!r||r.level==='rope')return 0;
 const x=r.x,y=r.y,c=Math.cos(ship.a),s=Math.sin(ship.a);
 walkRider(g,p,ship,dx*c+dy*s,-dx*s+dy*c);
 return Math.hypot(r.x-x,r.y-y);
}

export function tickPirateShipPlayer(g,p,motion,dt,interact){
 const ship=pirateShip(g),initial=p.pirateRide;
 if(!ship||!initial)return false;
 if(interact)interactPirateShip(g,p);
 const r=p.pirateRide;
 if(r.level==='rope'){
  const nest=layout.nests.find(n=>n.id===r.nest);
  r.height=clamp(r.height+(r.up?72:-72)*dt,layout.deckZ,nest.z);
  if(r.height>=nest.z||r.height<=layout.deckZ){
   p.pirateRide=r.up?{shipId:ship.id,level:'nest',nest:nest.id,x:nest.x,y:nest.y+Math.sign(nest.ropeY)*(nest.radius-8)}:
    {shipId:ship.id,level:'deck',x:nest.x,y:nest.ropeY};
  }
  p.moving=p.pirateRide.level==='rope';p.movementGait=p.moving?'walk':'idle';
  p.faceX=Math.sin(ship.a)*Math.sign(nest.ropeY);p.faceY=-Math.cos(ship.a)*Math.sign(nest.ropeY);p.moveSpeed=p.moving?72:0;
  p.step=(p.step||0)+(p.moving?9*dt:0);
  syncPirateShipPlayer(g,p);
  return true;
 }
 const travel=movePirateShipPlayer(g,p,motion.x*dt,motion.y*dt);
 p.moving=travel>.02;p.moveSpeed=dt>0?travel/dt:0;
 if(p.moving){const d=Math.hypot(motion.x,motion.y);p.faceX=motion.x/d;p.faceY=motion.y/d;}
 p.step=(p.step||0)+travel*.13;p.movementGait=p.moving?(p.walking?'walk':'run'):'idle';
 p.locomotionTransition=null;delete p.playerFrame;delete p.poseTime;
 return true;
}

export function tickPirateShip(g,dt){
 const ship=pirateShip(g);
 if(!ship){for(const p of g.players)clearPirateRide(p);return;}
 ship.time=g.trainTest.time;ship.z=2.7*Math.sin(ship.time*1.35)+1.1*Math.sin(ship.time*2.45);
 ship.shots=ship.shots.filter(shot=>{
  shot.age+=dt;
  if(shot.impactAge!==undefined){shot.impactAge+=dt;return shot.impactAge<.65;}
  shot.y+=shot.side*310*dt;
  shot.z=layout.deckZ+14+shot.age*78-shot.age*shot.age*139;
  if(shot.z>0)return true;
  const point=pirateShipPoint(ship,shot.x,shot.y);
  const surface=ship.id===HOLLOW_ROOM?hollowSurface(point.x,point.y):sketchSurfaceAt(point.x,point.y);
  shot.z=-ship.z;shot.impactAge=0;shot.impactWater=surface==='water'||surface==='shallow';
  g.onSound?.(shot.impactWater?'splash':'rockBreak',point);
  return true;
 });
 for(const p of g.players)syncPirateShipPlayer(g,p);
 tickPirateCrew(g,ship,dt);
 ship.openHold=g.players.some(p=>p.pirateRide?.shipId===ship.id&&p.pirateRide.level==='hold');
}
