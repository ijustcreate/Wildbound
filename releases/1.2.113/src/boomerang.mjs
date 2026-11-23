import {rangedLaunchOrigin,rangedRenderSize} from './ranged-launch.mjs';
import {weaponHitContext} from './dark-essence.mjs';
import {ITEMS,stat} from './items.mjs';
import {damageEnemy} from './enemy-damage.mjs';
import {clearShot} from './navigation.mjs';
import {charmShot,playerCombatTargets} from './succubus-charm.mjs';
import {BOOMERANG_SWEEP_STEP,boomerangContact,boomerangDirection} from './boomerang-flight.mjs';
import {combatTuning} from './combat-workshop-settings.mjs';
import {emitGameplayFx} from './gameplay-fx.mjs';
import {recordWeaponCombo} from './weapon-combo-discovery.mjs';

const HIT_RADIUS = 22;
const CATCH_RADIUS = 16;
const BLADE_HEIGHT = 16;
const MAX_AGE = 5;
const RETURN_COLOR = '#ffe7ab';

export function throwBoomerang(g,p){
 const id=p.equipment?.hand1,weapon=ITEMS[id];
 if(!weapon?.boomerang)return false;
 const active=(g.boomerangs||=[]);
 if(active.some(b=>b.owner===p.id))return true;
 const origin=rangedLaunchOrigin(p,g.time,'boomerang',{size:rangedRenderSize(g)});
 const direction=boomerangDirection(p.faceX??0,p.faceY??1);
 active.push({...charmShot(p),...weaponHitContext(p),owner:p.id,type:id,x:origin.x,y:origin.y,vx:direction.x*weapon.speed,vy:direction.y*weapon.speed,age:0,travel:0,returning:false,hits:[],guardedHits:[],damage:weapon.damage+stat(p,'damageBonus')});
 p.attack=p.attackDuration=.34;p.attackClip='ranged';g.onSound?.('attack',p);
 return true;
}

function guardingFromRear(target, blade) {
 const speed=Math.hypot(blade.vx,blade.vy);
 return blade.returning && target.combatRole==='shield' &&
  (target.tactics?.phase==='approach'||target.tactics?.phase==='windup') &&
  blade.vx*(target.faceX||0)+blade.vy*(target.faceY||0)>speed*.35;
}

function hitAlongPath(g,p,b,targets,from,to) {
 const guarded=b.guardedHits??=[];
 for(const target of targets){
  if(target.hp<=0||target.room||b.hits.includes(target.id))continue;
  const rear=guardingFromRear(target,b);
  // A blocked hit counts as one chip. A rear return can still land the blade's clean hit.
  if(guarded.includes(target.id)&&!rear)continue;
  const point=boomerangContact(from,to,target,HIT_RADIUS);
  if(!point||g.projectileBlocked(point.x,point.y,1)||!clearShot(g,point,target))continue;
  if(g.players.includes(target)){
   b.hits.push(target.id);
   g.hurt(target,b.damage,b);
  }else{
   const dealt=damageEnemy(target,b.damage,'physical',{g,p,shot:b});
   if(target.tacticalBlocked){
    guarded.push(target.id);
    emitGameplayFx(g,'block',{x:point.x,y:point.y-BLADE_HEIGHT},{scale:.5,life:.22});
   }else{
    b.hits.push(target.id);
    if(b.returning&&dealt>0){
     emitGameplayFx(g,rear?'parry':'hit',{x:point.x,y:point.y-BLADE_HEIGHT},{scale:rear?.75:.42,life:.22});
     if(rear)recordWeaponCombo(g,p,'return_flank');
    }
   }
   target.killedBy=p.id;target.ritualKill=false;target.aggro=true;target.flash=.2;
  }
  g.onSound?.('hit',target);
 }
}

function beginReturn(b) {
 b.returning=true;
 b.turnRemaining=combatTuning.boomerangTurnTime;
 b.vx=b.vy=0;
}

function catchBoomerang(g,b,hand) {
 b.remove=true;
 emitGameplayFx(g,'salvage',{x:hand.x,y:hand.y-BLADE_HEIGHT},{scale:.4,life:.23});
}

export function tickBoomerangs(g,dt){
 if(!Number.isFinite(dt)||dt<=0)return;
 const active=g.boomerangs||=[];
 for(const b of active){
  const p=g.players.find(p=>p.id===b.owner),weapon=ITEMS[b.type];
  if(!p||p.hp<=0||p.room||!weapon?.boomerang){b.remove=true;continue;}
  b.age+=dt;if(b.age>MAX_AGE){b.remove=true;continue;}
  const hand=rangedLaunchOrigin(p,g.time,'boomerang',{size:rangedRenderSize(g)});
  const targets=playerCombatTargets(g,b);
  b.returnHand=hand;
  let remaining=dt;
  while(remaining>1e-6&&!b.remove){
   if(b.returning&&b.turnRemaining>0){
    const pause=Math.min(b.turnRemaining,remaining);
    b.turnRemaining-=pause;remaining-=pause;
    continue;
   }
   const from={x:b.x,y:b.y};
   const toHand=Math.hypot(hand.x-b.x,hand.y-b.y);
   if(b.returning&&toHand<=CATCH_RADIUS){catchBoomerang(g,b,hand);break;}
   const rangeLeft=b.returning?toHand-CATCH_RADIUS:weapon.range-b.travel;
   if(rangeLeft<1e-6){
    if(b.returning)catchBoomerang(g,b,hand);else beginReturn(b);
    continue;
   }
   const speed=weapon.speed*(b.returning?combatTuning.boomerangReturnSpeed:1);
   const direction=b.returning?boomerangDirection(hand.x-b.x,hand.y-b.y):boomerangDirection(b.vx,b.vy);
   b.vx=direction.x*speed;b.vy=direction.y*speed;
   const distance=Math.min(rangeLeft,BOOMERANG_SWEEP_STEP,remaining*speed);
   const next={x:from.x+direction.x*distance,y:from.y+direction.y*distance};
   remaining-=distance/speed;
   if(!b.returning&&g.projectileBlocked(next.x,next.y,1,true)){
    beginReturn(b);
    continue;
   }
   // The blade can still get home around a blocked throw. Each contact checks cover independently.
   hitAlongPath(g,p,b,targets,from,next);
   b.x=next.x;b.y=next.y;
   if(b.returning){
    if(distance>=rangeLeft-1e-6)catchBoomerang(g,b,hand);
   }else{
    b.travel+=distance;
    if(distance>=rangeLeft-1e-6)beginReturn(b);
   }
  }
  const trail=b.trail??=[];
  const last=trail.at(-1);
  if(!last||Math.hypot(b.x-last.x,b.y-last.y)>=8){trail.push({x:b.x,y:b.y});if(trail.length>5)trail.shift();}
 }
 g.boomerangs=active.filter(b=>!b.remove);
}

export function drawBoomerangReturnGuide(c,from,hand,{height=BLADE_HEIGHT,color=RETURN_COLOR,alpha=.5}={}){
 const dx=hand.x-from.x,dy=hand.y-from.y,distance=Math.hypot(dx,dy);
 const step=Math.max(15,distance/22);
 c.save();c.globalAlpha*=alpha;c.fillStyle=color;
 for(let offset=step;offset<distance-CATCH_RADIUS;offset+=step){
  const ratio=offset/distance,x=Math.round(from.x+dx*ratio),y=Math.round(from.y+dy*ratio-height);
  c.fillRect(x-1,y-1,2,2);
 }
 c.strokeStyle=color;c.lineWidth=1;
 if(distance>60){
  const ux=dx/distance,uy=dy/distance,offset=Math.min(distance*.56,112);
  const x=Math.round(from.x+ux*offset),y=Math.round(from.y+uy*offset-height);
  c.beginPath();c.moveTo(x-ux*5-uy*3,y-uy*5+ux*3);c.lineTo(x,y);
  c.lineTo(x-ux*5+uy*3,y-uy*5-ux*3);c.stroke();
 }
 c.strokeRect(Math.round(hand.x)-3,Math.round(hand.y-height)-3,6,6);
 c.restore();
}

export function drawBoomerang(c,b,time,showGuide=true){
 const color=ITEMS[b.type]?.artColor||'#c29151';
 if(b.returning&&b.returnHand&&showGuide&&combatTuning.boomerangGuide){
  drawBoomerangReturnGuide(c,b,b.returnHand);
 }
 c.save();
 for(const [index,point] of (b.trail||[]).entries()){
  if(point.x===b.x&&point.y===b.y)continue;
  c.fillStyle=b.returning?RETURN_COLOR:color;c.globalAlpha=.10+index*.055;
  c.fillRect(Math.round(point.x)-1,Math.round(point.y-BLADE_HEIGHT)-1,2,2);
 }
 c.restore();
 c.save();c.translate(b.x,b.y-BLADE_HEIGHT);c.rotate(time*(b.returning?24:19));c.lineJoin='round';c.lineWidth=7;c.strokeStyle='#32271d';
 const shape=()=>{c.beginPath();c.moveTo(-12,7);c.lineTo(0,-7);c.lineTo(12,7);c.stroke();};shape();
 c.lineWidth=4;c.strokeStyle=color;shape();
 if(b.returning){c.fillStyle=RETURN_COLOR;c.fillRect(-1,-8,2,3);}
 c.restore();
}
