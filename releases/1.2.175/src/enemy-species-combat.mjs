import {rangedFootwork} from './ranged-footwork.mjs';
import {requestEnemyGroupTurn,enemyGroupBusy,enemyGroupPosition} from './enemy-group-combat.mjs';
import {creatures} from './definitions.mjs';
import {chooseEnemyTarget,allyInAttackLane} from './enemy-systems.mjs';
import {navigateEnemy,clearShot,collisionOffset} from './navigation.mjs';
import {tickJump,startJump} from './jumping.mjs';
import {enemyQuiver,retrieveEnemyArrows} from './arrow-supplies.mjs';
import {nearbyEnemyTrap,triggerEnemyTrap} from './enemy-traps.mjs';
import {tickBananaAttack} from './enemy-banana.mjs';
import {chargeRecoveryTime,openChargeCounter} from './counterattack.mjs';
import {forgetHiddenTarget} from './enemy-sight.mjs';
import {patrolTickTock,TICK_TOCK_SCALE,tickTockTargets} from './tick-tock-crocodile.mjs';
// Only the old shared-contact/charge routes are replaced. Bespoke bosses,
// wildlife, pack roles and user-edited AI retain their own controllers.
export const SPECIES_ATTACKS=Object.freeze({
 lion:{style:'rush',windup:.65,active:.46,recover:.9,range:165,speed:310,width:27},
 tiger:{style:'rush',windup:.72,active:.42,recover:1.05,range:175,speed:330,width:30},
 white_lion:{style:'rush',windup:.8,active:.55,recover:1.15,range:205,speed:300,width:30},
 boar:{style:'rush',windup:.56,active:.58,recover:1.15,range:210,speed:295,width:25},
 crocodile:{style:'rush',windup:.82,active:.28,recover:1.35,range:105,speed:260,width:31},
 snake:{style:'rush',windup:.88,active:.22,recover:.8,range:92,speed:300,width:19},
 bat:{style:'rush',windup:.46,active:.38,recover:.65,range:170,speed:290,width:22,fly:true},
 wasp:{style:'rush',windup:.52,active:.32,recover:.9,range:155,speed:345,width:20,fly:true},
 tsetse:{style:'rush',windup:.75,active:.24,recover:1.15,range:120,speed:330,width:19,fly:true},
 beetle:{style:'melee',windup:.56,active:.18,recover:.95,range:41,arc:.55},
 monkey:{style:'melee',windup:.44,active:.16,recover:.65,range:44,arc:.35},
 skeleton:{style:'combo',windup:.56,active:.2,recover:.72,range:57,arc:.2},
 skeleton_unarmed:{style:'combo',windup:.36,active:.16,recover:.55,range:39,arc:.3},
 skeleton_boss:{style:'combo',windup:.72,active:.26,recover:1.1,range:74,arc:.05},
 krampus:{style:'melee',windup:.78,active:.2,recover:1.05,range:100,arc:.7},
 archer:{style:'ranged',windup:.74,active:.12,recover:.75,range:350},
 fire_elemental:{style:'spell',windup:.65,active:.12,recover:.8,range:320},
 water_elemental:{style:'spell',windup:.95,active:.12,recover:1.1,range:285},
 skeleton_caster:{style:'support',windup:.65,active:.2,recover:1,range:65,arc:.3},
 necromancer:{style:'support',windup:.8,active:.2,recover:1.1,range:72,arc:.3},
 skeleton_wizard:{style:'support',windup:.8,active:.12,recover:.95,range:420,arc:.3},
});
const crocRush=SPECIES_ATTACKS.crocodile;
const TICK_TOCK_RUSH={...crocRush,windup:1.2,active:.56,recover:1.75,speed:390,
 range:crocRush.range*TICK_TOCK_SCALE,width:crocRush.width*TICK_TOCK_SCALE};
export function speciesPhase(e,phase,duration){
 const old=e.speciesCombat||{};
 e.speciesCombat={phase,remaining:duration,duration,index:old.index||0,bowBash:old.bowBash,targetId:old.targetId,dx:e.faceX??0,dy:e.faceY??1,hits:[],interruptedUntil:old.interruptedUntil||0};
 e.state=phase==='active'?'charge':phase==='approach'?'hunt':phase;e.timer=e.motionDuration=duration;e.moving=false;
 return e.speciesCombat;
}
export function tickSpeciesCombat(g,e,dt,targets){
 let base=SPECIES_ATTACKS[e.kind];const cfg=creatures[e.kind];
 if(!base||e.combatRole||cfg?.edited&&!e.tickTockCrocodile||e.faction==='ally'||e.controlledBy||e.hunterPet||e.pet)return false;
 if(e.hp<=0)return true;
 if(e.tickTockCrocodile){
  if(e.tickTockSleeping||!g.trainTest?.design.wildLands||g.trainTest.design.activeRoom)return true;
  base=TICK_TOCK_RUSH;targets=tickTockTargets(g,e,targets);
 }
 tickJump(e,dt,g,collisionOffset(g,e));
 // Existing restraint and disable behavior remains authoritative.
 if(e.state==='snared'){e.timer-=dt;if(e.timer<=0)e.hp=0;return true;}
 let disabled=false;for(const name of ['stun','frozen','sleeping'])if(e[name]>0){e[name]=Math.max(0,e[name]-dt);disabled=true;}
 e.flash=Math.max(0,(e.flash||0)-dt);e.attack=Math.max(0,(e.attack||0)-dt);e.cooldown=Math.max(0,(e.cooldown||0)-dt);e.moving=false;
 e.tacticTime=Math.max(0,(e.tacticTime||0)-dt);
 e.fireballsAttack=Math.max(0,(e.fireballsAttack||0)-dt);e.healEffect=Math.max(0,(e.healEffect||0)-dt);e.guardFlash=Math.max(0,(e.guardFlash||0)-dt);
 if(e.maxMana)e.mana=Math.min(e.maxMana,(e.mana??e.maxMana)+dt*(e.manaRegen??5));
 e.healCooldown=Math.max(0,(e.healCooldown??2)-dt);e.summonCooldown=Math.max(0,(e.summonCooldown??2)-dt);
 if(disabled){if(['windup','active'].includes(e.speciesCombat?.phase))speciesPhase(e,'recover',.8);e.pendingBanana=null;e.throwTime=0;return true;}
 const trap=nearbyEnemyTrap(g,e);
 if(trap){
  if(triggerEnemyTrap(g,e,trap))speciesPhase(e,'recover',e.timer);
  e.pendingBanana=null;e.throwTime=0;
  return true;
 }
 if(e.spawnReadyAt>g.time)return true;
 // Preserve saved/externally interrupted legacy attacks on first adoption.
 if(!e.speciesCombat){
  const oldState=e.state,remaining=e.timer,faceX=e.faceX,faceY=e.faceY;
  const phase=oldState==='charge'?'active':['windup','recover'].includes(oldState)?oldState:'approach';
  const initial=speciesPhase(e,phase,phase==='approach'?0:Math.max(.05,Number(remaining)||base.windup));
  if(Number.isFinite(faceX))initial.dx=faceX;if(Number.isFinite(faceY))initial.dy=faceY;
  initial.style=base.style;initial.reach=base.range;initial.width=(base.width||13)*2;
 }
 if(e.kind==='archer'&&base.style==='ranged'&&enemyQuiver(e)<=0){
  const nearest=targets.filter(p=>p.hp>0&&!p.room).sort((a,b)=>Math.hypot(a.x-e.x,a.y-e.y)-Math.hypot(b.x-e.x,b.y-e.y))[0];
  if((!e.speciesCombat||e.speciesCombat.phase==='approach')&&nearest&&retrieveEnemyArrows(g,e,dt,{target:nearest}))return true;
  if(enemyQuiver(e)<=0)base={...base,style:'melee',windup:.55,active:.18,recover:.95,range:48,arc:.45};
 }
 const s=e.speciesCombat;
 // A snake abandons its bite when the target disappears beneath the surface.
 if(e.kind==='snake'&&(!targets.length||
   (s.phase==='windup'||s.phase==='active')&&s.targetId!=null&&!targets.some(p=>p.id===s.targetId))){
  forgetHiddenTarget(e);
  speciesPhase(e,'approach',0).targetId=undefined;
  e.dx=e.dy=0;
  return true;
 }
 if(s.phase==='recover'){
  s.remaining-=dt;e.timer=s.remaining;
  if(s.remaining<=0){const next=speciesPhase(e,'approach',0);next.index=(s.index+1)%3;e.cooldown=Math.max(e.cooldown||0,.28);}
  return true;
 }
 const locked=s.phase==='windup'||s.phase==='active'||!!e.pendingBanana;
 const targetId=e.pendingBanana?.targetId??s.targetId;
 const p=locked&&targetId!=null?targets.find(t=>t.id===targetId&&t.hp>0&&!t.room):chooseEnemyTarget(g,e,targets);
 if(!p){
  speciesPhase(e,locked?'recover':'approach',locked?base.recover:0);
  if(e.tickTockCrocodile&&!locked)patrolTickTock(g,e,dt);
  e.pendingBanana=null;e.throwTime=0;
  return true;
 }
 const d=Math.hypot(p.x-e.x,p.y-e.y)||1,dx=(p.x-e.x)/d,dy=(p.y-e.y)/d,beh=cfg?.behaviors||{};
 const finisher=base.style==='combo'&&s.index%3===2,attack={...base,windup:base.windup*(finisher?1.4:1),recover:base.recover*(finisher?1.35:1),range:base.range*(finisher?1.18:1)};
 if(beh.banana&&tickBananaAttack(g,e,p,dt,s.phase==='approach',cfg.stats))return true;
 if(s.phase==='retreat'){
  if(beh.hunt!==false){g.moveActor(e,-s.dx*e.speed*dt,-s.dy*e.speed*dt,base.fly);e.moving=true;}
  s.remaining-=dt;e.timer=s.remaining;if(s.remaining<=0)speciesPhase(e,'recover',.5);return true;
 }
 if(s.phase==='windup'){
  if(s.remaining>s.duration*.5){e.faceX=s.dx=dx;e.faceY=s.dy=dy;}
  s.remaining-=dt;e.timer=s.remaining;
  if(s.remaining<=0){
   if(s.support){
    if(s.support==='heal'){
     const ally=g.enemies.find(a=>a.id===s.supportTarget&&a.hp>0&&a.group===e.group);
     if(ally&&Math.hypot(ally.x-e.x,ally.y-e.y)<390&&clearShot(g,e,ally)&&(e.mana??12)>=12){
      const heal=e.kind==='skeleton_wizard'?Math.max(18,ally.maxHp*.28):e.kind==='necromancer'?34:22;
      ally.hp=Math.min(ally.maxHp,ally.hp+heal);if(e.maxMana)e.mana-=12;e.healCooldown=e.kind==='skeleton_wizard'?20:6;e.healEffect=.8;
      g.effects?.push({x:ally.x,y:ally.y-28,text:'+',color:'#d4edaf',life:.6});
     }
    }else if(s.support==='summon'){g.summonNecromancerMinions?.(e);e.summonCooldown=Math.max(e.summonCooldown||0,4);}
    else if(s.support==='bolt'&&clearShot(g,e,{x:e.x+s.dx*d,y:e.y+s.dy*d})){
     g.arrows.push({id:g.nextId++,x:e.x,y:e.y,z:20,vx:s.dx*210,vy:s.dy*210,vz:0,damage:Math.max(1,e.damage-4),hostile:true,ice:true});e.cooldown=2.8;
    }
    speciesPhase(e,'recover',base.recover);
   }else if(base.style==='spell'){
    if(clearShot(g,e,{x:e.x+s.dx*d,y:e.y+s.dy*d})){
     const water=e.kind==='water_elemental',angles=water?[-.2,0,.2]:[0],angle=Math.atan2(s.dy,s.dx);g.fireballs??=[];
     for(const offset of angles)g.fireballs.push({x:e.x,y:e.y,vx:Math.cos(angle+offset)*(water?150:190),vy:Math.sin(angle+offset)*(water?150:190),life:3.1,trail:0,damage:e.damage,burnDamage:cfg.stats.burnDamage,water,ice:water});
     e.fireballsAttack=.45;
    }
    speciesPhase(e,'recover',base.recover);e.cooldown=cfg.stats.fireCooldown||2.4;
   }else if(base.style==='ranged'){
    const lane={x:e.x+s.dx*d,y:e.y+s.dy*d};
    if(enemyQuiver(e)>0&&d<attack.range&&clearShot(g,e,p)&&clearShot(g,e,lane)&&!allyInAttackLane(g,e,s.dx,s.dy,d,16)){
     g.arrows.push({id:g.nextId++,ammoType:'arrow',shaftLength:24,x:e.x,y:e.y,z:20,vx:s.dx*270,vy:s.dy*270,vz:45,damage:e.damage,hostile:true});e.arrowsLeft--;e.attack=.3;
    }
    speciesPhase(e,'recover',base.recover);
   }else{const active=speciesPhase(e,'active',base.active);active.rushContact=false;if(beh.jump&&base.style==='rush'&&!e.tickTockCrocodile)startJump(e);}
  }return true;
 }
 if(s.phase==='active'){
  let blocker;
  if(base.style==='rush'){
   const distance=base.speed*dt,steps=Math.max(1,Math.ceil(distance/4));let wall=false;
   s.rushContact??=s.hits.length>0;
   for(let k=0;k<steps&&!blocker;k++){
    const x=e.x,y=e.y;g.moveActor(e,s.dx*distance/steps,s.dy*distance/steps,base.fly);
    if(Math.hypot(e.x-x,e.y-y)<distance/steps*.3){wall=!(beh.jump&&e.jumpHeight>0&&e.jumpVelocity>0);break;}
    for(const q of targets)if(!s.hits.includes(q.id)&&Math.hypot(q.x-e.x,q.y-e.y)<base.width&&clearShot(g,e,q)){
     s.hits.push(q.id);const hp=q.hp,impact=g.hurt(q,e.damage,e,{charge:true});
     if(impact==='caught'){blocker=q;break;}
     if(impact==='hit'||impact==='blocked')s.rushContact=true;
     if(e.kind==='tsetse'&&q.hp<hp&&q.hp>0)q.sleeping=Math.max(q.sleeping||0,2);
    }
   }
   e.moving=true;if(wall)s.remaining=0;
   if(wall)e.speciesWallMiss=true;
  }else if(!s.struck&&1-s.remaining/Math.max(.01,s.duration)>=.3){
   s.struck=true;e.attack=base.active;
   for(const q of targets){const x=q.x-e.x,y=q.y-e.y,r=Math.hypot(x,y);if(r>attack.range||(x*s.dx+y*s.dy)/Math.max(1,r)<(base.arc??.3)||!clearShot(g,e,q))continue;
    const hp=q.hp;g.hurt(q,e.damage*(finisher?1.25:1),e);
    if(e.kind==='monkey'&&beh.steal!==false&&q.hp<hp&&q.traps>0){q.traps--;e.speciesStolen=true;}
   }
  }
  s.remaining-=dt;e.timer=s.remaining;
  if(s.remaining<=0||blocker){
   const opening=blocker?'caught':base.style==='rush'&&!s.rushContact?'missed':null;
   const recovery=attack.recover+(e.speciesWallMiss?.35:0);
   speciesPhase(e,e.speciesStolen?'retreat':'recover',e.speciesStolen?.75:chargeRecoveryTime(opening,recovery));
   if(opening)openChargeCounter(g,e,blocker||p,opening);
   e.speciesWallMiss=false;e.speciesStolen=false;if(beh.circle)e.tacticTime=1.2;
  }
  return true;
 }
 e.faceX=dx;e.faceY=dy;
 if(beh.jump&&base.style!=='rush'&&d>65&&d<180&&!e.jumpHeight)startJump(e);
 if(base.style==='support'){
  const ally=g.enemies.filter(a=>a!==e&&a.hp>0&&a.group===e.group&&a.hp<a.maxHp&&Math.hypot(a.x-e.x,a.y-e.y)<390).sort((a,b)=>a.hp/a.maxHp-b.hp/b.maxHp)[0];
  const support=ally&&e.healCooldown<=0&&(e.mana??12)>=12?'heal':e.kind==='necromancer'&&e.summonCooldown<=0?'summon':e.kind==='skeleton_wizard'&&d<420&&e.cooldown<=0?'bolt':null;
  if(support&&(support==='summon'||clearShot(g,e,support==='heal'?ally:p))&&requestEnemyGroupTurn(g,e,p,{mode:support==='bolt'?'attack':'support',flightSpeed:support==='bolt'?210:0})){
   const next=speciesPhase(e,'windup',support==='summon'?1:base.windup);next.targetId=p.id;next.support=support;next.supportTarget=ally?.id;next.style='ranged';return true;
  }
 }
 if(base.style==='ranged'){
  const arrows=enemyQuiver(e);
  if(beh.hunt!==false&&(arrows<=0||d>=105)&&retrieveEnemyArrows(g,e,dt,{target:p}))return true;
  if(arrows<=0)return true;
 }
 const enabled=e.tickTockCrocodile||(base.style==='ranged'?beh.ranged!==false:base.style==='spell'?beh.fireball!==false:base.style==='rush'?beh.dash!==false:beh.melee!==false);
 // A healer without an escort has no long-range attack. Stop using the caster
 // retreat band once its group is gone, so cleanup becomes a fair staff duel.
 const backline=['ranged','spell'].includes(base.style)||base.style==='support'&&(e.kind!=='skeleton_caster'||g.enemies.some(a=>a!==e&&a.hp>0&&a.group===e.group));
 const occupied=enemyGroupBusy(g,e,p),footwork=backline?rangedFootwork(g,e,p):null;
 const circling=base.style==='rush'&&beh.circle&&d<220&&e.tacticTime>0;
 if(enabled&&!circling&&e.cooldown<=0&&d<(base.style==='support'?65:attack.range)&&clearShot(g,e,p)&&requestEnemyGroupTurn(g,e,p,{rush:base.style==='rush',flightSpeed:base.style==='ranged'?270:base.style==='spell'?(e.kind==='water_elemental'?150:190):0})){
  const next=speciesPhase(e,'windup',attack.windup);next.targetId=p.id;next.bowBash=e.kind==='archer'&&base.style==='melee';next.style=base.style==='spell'?'ranged':base.style;next.reach=base.style==='rush'?base.speed*base.active+(base.width||0):attack.range;next.width=(base.width||13)*2;next.arc=Math.acos(base.arc??.3);return true;
 }
 if(e.tickTockCrocodile){
  if(d>attack.range*.65&&!g.moveActor(e,dx*e.speed*dt,dy*e.speed*dt))patrolTickTock(g,e,dt);
  return true;
 }
 const before={x:e.x,y:e.y};if(beh.hunt!==false){
  if(backline&&!clearShot(g,e,p))navigateEnemy(g,e,p,dt);
  else if(occupied){if(!backline||d>180)navigateEnemy(g,e,enemyGroupPosition(g,e,p,{backline,range:attack.range}),dt);}
  else if(circling){
   const side=e.orbit||((Number(e.id)||0)%2?1:-1),radial=d<100?-.65:d>155?.5:0;
   const mx=dx*radial-dy*side,my=dy*radial+dx*side,length=Math.hypot(mx,my)||1;
   g.moveActor(e,mx/length*e.speed*dt,my/length*e.speed*dt,base.fly);
   e.moving=Math.hypot(e.x-before.x,e.y-before.y)>.01;
   if(!e.moving)navigateEnemy(g,e,p,dt);
  }
  else if(backline&&!footwork.plant&&(d<145||allyInAttackLane(g,e,dx,dy,d,16))){const side=(Number(e.id)||0)%2?1:-1;navigateEnemy(g,e,{x:e.x-dx*55-dy*side*60,y:e.y-dy*55+dx*side*60},dt);}
  else if(d>(backline?260:occupied?80:attack.range*.8))navigateEnemy(g,e,p,dt);
 }
 if(e.kind==='fire_elemental'&&beh.fireTrail&&Math.hypot(e.x-before.x,e.y-before.y)>.01&&g.time>=(e.speciesTrailAt||0)){
  g.firePatches??=[];if(g.firePatches.length<60)g.firePatches.push({x:Math.floor(e.x/32)*32,y:Math.floor(e.y/32)*32,life:1.6,damage:cfg.stats.burnDamage||3,tick:0});e.speciesTrailAt=g.time+.44;
 }
 return true;
}
