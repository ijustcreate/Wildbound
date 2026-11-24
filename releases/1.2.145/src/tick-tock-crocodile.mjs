import {PIRATE_SHIP_BERTH,pirateShip,pirateShipBlocked,pirateShipPoint} from './pirate-ship.mjs';
import {wildLandsSurfaceAt} from './wild-lands-world.mjs';
import {wildLandsOpenOcean} from './wild-lands-geography.mjs';

export const TICK_TOCK_SCALE=3;
export const TICK_TOCK_BODY=24;
const HEARING_DISTANCE=570,WAKE_DISTANCE=1160;
const PATROL=[[-306,-242],[-116,-251],[116,-256],[308,-239],[119,-212],[-112,-214]];
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const outside=g=>g.trainTest?.design.wildLands&&!g.trainTest.design.activeRoom;
const nearbyPlayer=p=>p.hp>0&&!p.spectator&&!p.room&&!p.disconnected&&!p.lobbyDisconnected&&!p.unavailable;
const phasedSound=new WeakMap();

function clearWater(g,x,y){
 const d=g.trainTest.design,r=TICK_TOCK_BODY;
 return x>r&&y>r&&x<d.width-r&&y<d.height-r&&!pirateShipBlocked(g,x,y,r,null)&&
  wildLandsSurfaceAt(d,x,y)==='water'&&wildLandsSurfaceAt(d,x-r,y)==='water'&&wildLandsSurfaceAt(d,x+r,y)==='water'&&
  wildLandsSurfaceAt(d,x,y-r)==='water'&&wildLandsSurfaceAt(d,x,y+r)==='water';
}

export function moveTickTock(g,e,dx,dy){
 if(!outside(g)||e.hp<=0||e.rooted>0)return 0;
 const x=e.x,y=e.y,steps=Math.max(1,Math.ceil(Math.hypot(dx,dy)/6));
 for(let i=0;i<steps;i++){
  const nx=e.x+dx/steps,ny=e.y+dy/steps;
  if(dx&&dy&&clearWater(g,nx,ny)){e.x=nx;e.y=ny;}
  else{
   if(dx&&clearWater(g,nx,e.y))e.x=nx;
   if(dy&&clearWater(g,e.x,ny))e.y=ny;
  }
 }
 const moved=Math.hypot(e.x-x,e.y-y);
 e.moving=moved>.01;e.step=(e.step||0)+moved*.052;e.swimming=true;
 return moved;
}

export function tickTockTargets(g,e,targets){
 return targets.filter(p=>p.device&&nearbyPlayer(p)&&p.swimming&&!p.pirateRide&&!p.trainRide&&!p.vehicleId&&
  !p.broomMount&&!p.wingHover&&distance(p,e)<480&&distance(p,PIRATE_SHIP_BERTH)<710);
}

export function patrolTickTock(g,e,dt){
 const ship=pirateShip(g);
 if(!ship)return;
 let index=e.patrolIndex||0,next=pirateShipPoint(ship,...PATROL[index]);
 if(distance(e,next)<14){index=(index+1)%PATROL.length;e.patrolIndex=index;next=pirateShipPoint(ship,...PATROL[index]);}
 const dx=next.x-e.x,dy=next.y-e.y,d=Math.hypot(dx,dy)||1;
 e.faceX=dx/d;e.faceY=dy/d;
 if(!moveTickTock(g,e,e.faceX*58*dt,e.faceY*58*dt))e.patrolIndex=(index+1)%PATROL.length;
}

export function tickTickTockCrocodile(g){
 const t=g.trainTest;
 if(!outside(g)||t.tickTockDefeated)return;
 const listeners=g.players.filter(nearbyPlayer);
 let e=g.enemies.find(actor=>actor.tickTockCrocodile);
 if(!listeners.some(p=>distance(p,PIRATE_SHIP_BERTH)<WAKE_DISTANCE)){
  if(e){e.tickTockSleeping=true;e.moving=false;}
  return;
 }
 if(!e){
  const ship=pirateShip(g);
  const anchor=PATROL.map(pair=>pirateShipPoint(ship,...pair)).find(p=>wildLandsOpenOcean(p.x,p.y)&&clearWater(g,p.x,p.y));
  if(!anchor)return;
  e={name:'Tick-Tock',kind:'crocodile',skin:'crocodile',id:g.nextId++,tickTockCrocodile:true,boss:true,
   x:anchor.x,y:anchor.y,hp:260,maxHp:260,faction:'enemy',speed:78,damage:19,swimming:true,hitRadius:42,
   state:'hunt',cooldown:.8,step:0,timer:0,flash:0,attack:0,faceX:1,faceY:0,patrolIndex:1};
  g.enemies.push(e);
 }
 if(e.hp<=0)return;
 e.tickTockSleeping=false;
 const audible=listeners.some(p=>!(p.diveDepth>15||p.pirateRide?.level==='hold')&&distance(p,e)<HEARING_DISTANCE);
 if(!audible){phasedSound.delete(e);return;}
 const beat=phasedSound.get(e)||{next:0,tock:false};
 if(t.time<beat.next)return;
 g.onSound?.(beat.tock?'crocodileTock':'crocodileTick',e);
 phasedSound.set(e,{next:t.time+.56,tock:!beat.tock});
}
