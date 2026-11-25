import {rangedLaunchOrigin,rangedRenderSize} from './ranged-launch.mjs';
import {weaponHitContext} from './dark-essence.mjs';
import {ITEMS,stat} from './items.mjs';
import {damageEnemy} from './enemy-damage.mjs';
import {clearShot} from './navigation.mjs';
import {charmShot,playerCombatTargets} from './succubus-charm.mjs';
import {BOOMERANG_SWEEP_STEP,boomerangContact,boomerangDirection,boomerangRange,glaiveCharge} from './boomerang-flight.mjs';
import {combatTuning} from './combat-workshop-settings.mjs';
import {emitGameplayFx} from './gameplay-fx.mjs';
import {recordWeaponCombo} from './weapon-combo-discovery.mjs';
import {drawFlyingGlaive} from './glaive-art.mjs';
import {samePirateCombatFloor} from './pirate-combat-floor.mjs';
import {shrinkingScale} from './shrinking-candy.mjs';

const HIT_RADIUS = 22;
const CATCH_RADIUS = 16;
const BLADE_HEIGHT = 16;
const MAX_AGE = 5;
const RETURN_COLOR = '#ffe7ab';

export const glaiveInFlight=(g,p)=>(g.boomerangs||[]).some(b=>b.type==='glaive'&&b.owner===p.id&&!b.remove);

export function throwBoomerang(g,p,{slot='hand1',charge=0}={}){
 const id=p.equipment?.[slot],weapon=ITEMS[id];
 if(!weapon?.boomerang)return false;
 const active=(g.boomerangs||=[]);
 if(active.some(b=>b.owner===p.id&&(b.type==='glaive')===!!weapon.glaive))return true;
 const origin=rangedLaunchOrigin(p,g.time,'boomerang',{slot,size:rangedRenderSize(g)});
 const direction=boomerangDirection(p.faceX??0,p.faceY??1);
 const power=weapon.glaive?glaiveCharge(charge):0;
 const speed=weapon.speed*(1+.62*power),range=boomerangRange(weapon,charge);
 active.push({...charmShot(p),...weaponHitContext(p),owner:p.id,type:id,slot,x:origin.x,y:origin.y,
  vx:direction.x*speed,vy:direction.y*speed,age:0,travel:0,returning:false,hits:[],guardedHits:[],
  damage:(weapon.damage+stat(p,'damageBonus'))*shrinkingScale(p),...(weapon.glaive?{power,speed,range,maxTargets:3+Math.round(power*2),heading:direction}:{}),
 });
 if(weapon.glaive){p.glaiveInFlight=true;p.glaiveThrowSlot=slot;}
 else delete p.glaiveThrowSlot;
 p.attack=p.attackDuration=.34;p.attackClip='ranged';g.onSound?.('attack',p);
 return true;
}

function seekGlaiveTarget(g,b,targets){
 if(b.returning||b.travel<28)return null;
 if(b.seekAt>b.age){
  if(b.seekId==null)return null;
  const locked=targets.find(enemy=>enemy.id===b.seekId&&enemy.hp>0);
  if(locked&&!b.hits.includes(locked.id)&&!b.guardedHits.includes(locked.id))return locked;
 }
 b.seekAt=b.age+.075;
 let distance=(77+51*(b.power||0))**2,best=null;
 for(const enemy of targets){
  if(enemy.hp<=0||enemy.room||enemy.defeated||enemy.faction==='ally'||enemy.unattackable||
   b.hits.includes(enemy.id)||b.guardedHits.includes(enemy.id)||g.players.includes(enemy))continue;
  const dx=enemy.x-b.x,dy=enemy.y-b.y,squared=dx*dx+dy*dy;
  if(squared>=distance||squared>=(b.range-b.travel+HIT_RADIUS)**2)continue;
  if(b.hits.length===0&&dx*b.heading.x+dy*b.heading.y<-HIT_RADIUS)continue;
  if(!clearShot(g,b,enemy,1))continue;
  best=enemy;distance=squared;
 }
 b.seekId=best?.id??null;
 return best;
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
  if(b.maxTargets&&b.hits.length>=b.maxTargets)break;
  if(b.type==='glaive'&&(target.defeated||target.unattackable||target.faction==='ally'))continue;
  const rear=guardingFromRear(target,b);
  // A blocked hit counts as one chip. A rear return can still land the blade's clean hit.
  if(guarded.includes(target.id)&&!rear)continue;
  const point=boomerangContact(from,to,target,HIT_RADIUS);
  const contact=b.pirateRide&&point?{...point,pirateRide:b.pirateRide}:point;
  if(!point||g.projectileBlocked(point.x,point.y,1,false,b)||!clearShot(g,contact,target))continue;
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
    if(b.type==='glaive')emitGameplayFx(g,'hit',{x:point.x,y:point.y-BLADE_HEIGHT},{scale:.42+(b.power||0)*.22,life:.22});
    if(b.returning&&dealt>0&&b.type!=='glaive'){
     emitGameplayFx(g,rear?'parry':'hit',{x:point.x,y:point.y-BLADE_HEIGHT},{scale:rear?.75:.42,life:.22});
    }
    if(b.returning&&dealt>0&&rear)recordWeaponCombo(g,p,'return_flank');
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
  if(weapon.glaive&&!samePirateCombatFloor(b,p)){b.remove=true;continue;}
  b.age+=dt;if(b.age>MAX_AGE){b.remove=true;continue;}
  const hand=rangedLaunchOrigin(p,g.time,'boomerang',{slot:b.slot,size:rangedRenderSize(g)});
  const targets=playerCombatTargets(g,b);
  const aim=weapon.glaive&&b.heading?seekGlaiveTarget(g,b,targets):null;
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
   const rangeLeft=b.returning?toHand-CATCH_RADIUS:(b.range||weapon.range)-b.travel;
   if(rangeLeft<1e-6){
    if(b.returning)catchBoomerang(g,b,hand);else beginReturn(b);
    continue;
   }
   const speed=(b.speed||weapon.speed)*(b.returning?combatTuning.boomerangReturnSpeed:1);
   const chase=aim&&aim.hp>0&&!b.hits.includes(aim.id)&&!b.guardedHits.includes(aim.id)?aim:null;
   const direction=b.returning?boomerangDirection(hand.x-b.x,hand.y-b.y):
    chase?boomerangDirection(chase.x-b.x,chase.y-b.y):boomerangDirection(b.vx,b.vy);
   b.vx=direction.x*speed;b.vy=direction.y*speed;
   const distance=Math.min(rangeLeft,BOOMERANG_SWEEP_STEP,remaining*speed);
   const next={x:from.x+direction.x*distance,y:from.y+direction.y*distance};
   remaining-=distance/speed;
   if(!b.returning&&g.projectileBlocked(next.x,next.y,1,true,b)){
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
    if(distance>=rangeLeft-1e-6||b.maxTargets&&b.hits.length>=b.maxTargets)beginReturn(b);
   }
  }
  const trail=b.trail??=[];
  const last=trail.at(-1);
  const trailLength=weapon.glaive?7+Math.round((b.power||0)*5):5;
  if(!last||Math.hypot(b.x-last.x,b.y-last.y)>=8){trail.push({x:b.x,y:b.y});if(trail.length>trailLength)trail.shift();}
 }
 g.boomerangs=active.filter(b=>!b.remove);
 for(const p of g.players)if(p.glaiveInFlight&&!glaiveInFlight(g,p)){delete p.glaiveInFlight;delete p.glaiveThrowSlot;}
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
 if(b.type==='glaive'){
  const angle=b.age*(18+12*(b.power||0))+(b.returning?.5:0),z=BLADE_HEIGHT+(b.pirateVisualLift||0);
  c.save();
  const trail=b.trail||[],sparkles=3+Math.round((b.power||0)*5),alpha=c.globalAlpha;
  for(let i=0;i<sparkles&&i<trail.length;i++){
   const q=trail[trail.length-1-i],x=Math.round(q.x)+Math.round(Math.cos(angle*.66+i*2.4)*(4+i)),
    y=Math.round(q.y-z)+Math.round(Math.sin(angle*.66+i*2.4)*(4+i));
   c.globalAlpha=alpha*(1-i/sparkles)*.85;
   c.fillStyle=i%3===1?'#bce7a0':'#fff0b6';
   c.fillRect(x-2,y,5,1);c.fillRect(x,y-2,1,5);
  }
  c.restore();
  drawFlyingGlaive(c,b.x,b.y-z,angle);
  return;
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
