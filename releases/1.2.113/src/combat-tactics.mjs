import {rangedFootwork} from './ranged-footwork.mjs';
import {requestEnemyGroupTurn,enemyGroupBusy,enemyGroupPosition} from './enemy-group-combat.mjs';
import {navigateEnemy,clearShot} from './navigation.mjs';
import {enemyQuiver,retrieveEnemyArrows} from './arrow-supplies.mjs';
import {creatures} from './definitions.mjs';
import {tacticalPhase} from './combat-tactics-state.mjs';
import {chooseEnemyTarget,allyInAttackLane} from './enemy-systems.mjs';
import {nearbyEnemyTrap,triggerEnemyTrap} from './enemy-traps.mjs';
import {chargeRecoveryTime,openChargeCounter} from './counterattack.mjs';

export function arrangeCrossfire(g,actors){
  const shield=actors.find(e=>e.combatRole==='shield');if(!shield)return;
  const target=g.players.find(p=>p.hp>0&&!p.room);if(!target)return;
  const d=Math.hypot(shield.x-target.x,shield.y-target.y)||1,dx=(shield.x-target.x)/d,dy=(shield.y-target.y)/d;
  for(const e of actors){
    if(!e.combatRole)continue;
    const rear=e.combatRole==='archer'?90:0,side=e.combatRole==='charger'?82:0;
    const x=shield.x+dx*rear-dy*side,y=shield.y+dy*rear+dx*side;
    if(!g.blocked(x,y,10,false,false,false,14))Object.assign(e,{x,y});
    e.faceX=-dx;e.faceY=-dy;
  }
}
const face=(e,p)=>{const d=Math.hypot(p.x-e.x,p.y-e.y)||1;e.faceX=(p.x-e.x)/d;e.faceY=(p.y-e.y)/d;return d;};
function track(e,p,dt){
  if(e.combatRole!=='shield')return face(e,p);
  const wanted=Math.atan2(p.y-e.y,p.x-e.x),old=Math.atan2(e.faceY||0,e.faceX||0),delta=Math.atan2(Math.sin(wanted-old),Math.cos(wanted-old));
  const angle=old+Math.max(-2.8*dt,Math.min(2.8*dt,delta));e.faceX=Math.cos(angle);e.faceY=Math.sin(angle);
}
function travel(g,e,point,dt,keepFacing=false){
  const x=e.faceX,y=e.faceY,ox=e.x,oy=e.y,result=navigateEnemy(g,e,point,dt);
  if(e.roleMind){e.roleMind.moveX=e.x-ox;e.roleMind.moveY=e.y-oy;}
  if(keepFacing){e.faceX=x;e.faceY=y;}return result;
}
function strafe(g,e,p,dt,away=0){
  const m=e.roleMind,dx=e.faceX,dy=e.faceY;
  for(const sign of [m.side,-m.side]){
    const point={x:e.x-dx*away-dy*sign*55,y:e.y-dy*away+dx*sign*55};
    if(!g.blocked(point.x,point.y,10,false,false,false,14)&&clearShot(g,e,point)){
      m.side=sign;return travel(g,e,point,dt,true);
    }
  }return false;
}
export function tickTacticalEnemy(g,e,dt,targets){
  if(!e.combatRole||e.faction==='ally'||creatures[e.kind]?.faction==='ally'||e.controlledBy)return false;
  if(e.hp<=0)return true;
  e.moving=false;e.flash=Math.max(0,(e.flash||0)-dt);e.guardFlash=Math.max(0,(e.guardFlash||0)-dt);
  e.attack=Math.max(0,(e.attack||0)-dt);e.cooldown=Math.max(0,(e.cooldown||0)-dt);
  let disabled=false;
  for(const key of ['frozen','stun','sleeping']){if(e[key]>0){e[key]=Math.max(0,e[key]-dt);disabled=true;}}
  if(disabled){if(['windup','active'].includes(e.tactics?.phase))tacticalPhase(e,'stagger',.8);return true;}
  if(e.state==='snared'){e.timer-=dt;if(e.timer<=0)e.hp=0;return true;}
   const trap=nearbyEnemyTrap(g,e);
  if(trap){if(triggerEnemyTrap(g,e,trap))tacticalPhase(e,'stagger',e.timer);return true;}
  if(e.spawnReadyAt>g.time)return true;
  const s=e.tactics||tacticalPhase(e,'approach',0);
  const m=e.roleMind??={guard:100,side:(Number(e.id)||0)%2?1:-1,nextEvasionAt:0};
  if(s.phase==='recover'||s.phase==='stagger'){
    s.remaining-=dt;e.timer=s.remaining;if(s.remaining<=0){if(m.guard<=0)m.guard=55;tacticalPhase(e,'approach',0);}return true;
  }
  const locked=s.phase==='windup'&&e.combatRole==='archer';
  const p=targets.find(p=>p.id===s.targetId)||(!locked&&chooseEnemyTarget(g,e,targets));
  if(!p){tacticalPhase(e,locked?'recover':'approach',locked?.45:0);return true;}
  const d=Math.hypot(p.x-e.x,p.y-e.y),beh=creatures[e.kind]?.behaviors||{};
  if(s.phase==='windup'){
    // Aim follows briefly, then commits. Sidestepping the final tell beats it.
    if(s.remaining>s.duration*.45){track(e,p,dt);s.dx=e.faceX;s.dy=e.faceY;}
    s.remaining-=dt;e.timer=s.remaining;
    if(s.remaining<=0){
      if(e.combatRole==='archer'&&!s.melee){
        const clear=d<340&&clearShot(g,e,p)&&clearShot(g,e,{x:e.x+s.dx*d,y:e.y+s.dy*d})&&!allyInAttackLane(g,e,s.dx,s.dy,d,16);
        if(enemyQuiver(e)>0&&clear){
          g.arrows.push({id:g.nextId++,ammoType:'arrow',shaftLength:24,x:e.x,y:e.y,z:20,vx:s.dx*270,vy:s.dy*270,vz:45,damage:e.damage,hostile:true});e.arrowsLeft--;e.attack=.34;
        }
        if(!clear){m.repositionUntil=g.time+.65;m.side*=-1;}
        tacticalPhase(e,'recover',clear?.7:.25);e.cooldown=clear?1.3:.35;
      }else{const a=tacticalPhase(e,'active',e.combatRole==='charger'?.55:.22);a.targetId=p.id;a.rushContact=false;a.melee=s.melee;}
    }return true;
  }
  if(s.phase==='active'){
    let blocker;
    if(e.combatRole==='charger'){
      const distance=340*dt,n=Math.ceil(distance/4);let blocked=false;
      s.rushContact??=s.hitIds.length>0;
      for(let k=0;k<n&&!blocker;k++){
        const x=e.x,y=e.y;g.moveActor(e,s.dx*distance/n,s.dy*distance/n);
        if(Math.hypot(e.x-x,e.y-y)<distance/n*.5){blocked=true;break;}
        for(const q of targets){
          if(s.hitIds.includes(q.id)||Math.hypot(q.x-e.x,q.y-e.y)>=28)continue;
          s.hitIds.push(q.id);
          const impact=g.hurt(q,e.damage,e,{charge:true});
          if(impact==='caught'){blocker=q;break;}
          if(impact==='hit'||impact==='blocked')s.rushContact=true;
        }
      }
      e.moving=!blocked;if(blocked){s.remaining=0;m.lastRush='wall';}
    }else if(!s.struck&&(!s.melee||1-s.remaining/s.duration>=.3)){
      s.struck=true;e.attack=.24;
      for(const q of targets){const x=q.x-e.x,y=q.y-e.y,r=Math.hypot(x,y);if(r<55&&(x*s.dx+y*s.dy)/Math.max(1,r)>.25)g.hurt(q,e.damage,e);}
    }
    s.remaining-=dt;e.timer=s.remaining;
    if(s.remaining<=0||blocker){
      if(e.combatRole==='charger'){
        m.lastRush=blocker?'caught':m.lastRush==='wall'?'wall':s.rushContact?'hit':'miss';m.side*=-1;
        const opening=blocker?'caught':!s.rushContact?'missed':null;
        tacticalPhase(e,'recover',chargeRecoveryTime(opening,m.lastRush==='wall'?1.4:1.15));
        if(opening)openChargeCounter(g,e,blocker||p,opening);
      }else tacticalPhase(e,'recover',.85);
      e.cooldown=1.5;
    }
    return true;
  }
  track(e,p,dt);
  const archer=e.combatRole==='archer',empty=archer&&enemyQuiver(e)<=0,footwork=archer?rangedFootwork(g,e,p):null;
  if(archer&&!empty&&!footwork.plant&&m.repositionUntil>g.time&&beh.hunt!==false){strafe(g,e,p,dt);return true;}
  if(e.combatRole==='shield'&&g.time-(m.lastHitAt??-99)>2)m.guard=Math.min(100,(m.guard??100)+dt*12);
  if(archer){
    const arrows=enemyQuiver(e);
    if(beh.hunt!==false&&(arrows<=0||d>=105)&&retrieveEnemyArrows(g,e,dt,{target:p}))return true;

  }
  const attackEnabled=archer?beh.ranged!==false:e.combatRole==='charger'?beh.dash!==false:beh.melee!==false;
  const range=empty?48:archer?340:e.combatRole==='charger'?225:57;
  const occupied=enemyGroupBusy(g,e,p);
  const laneBusy=(archer||e.combatRole==='charger')&&allyInAttackLane(g,e,p.x-e.x,p.y-e.y,d,archer?16:30);
  const aligned=(e.faceX*(p.x-e.x)+e.faceY*(p.y-e.y))/Math.max(1,d)>.75;
  const tooClose=archer&&!empty?d<105:e.combatRole==='charger'?d<82:false;
  if(attackEnabled&&e.cooldown<=0&&!laneBusy&&!tooClose&&aligned&&d<range&&clearShot(g,e,p)&&requestEnemyGroupTurn(g,e,p,{rush:e.combatRole==='charger',flightSpeed:archer&&!empty?270:0})){
    m.lastRush=null;const s=tacticalPhase(e,'windup',empty?.55:archer?.7:e.combatRole==='charger'?.75:.62);s.targetId=p.id;s.melee=empty;e.bowBash=empty;return true;
  }
  if(beh.hunt!==false){
    if(archer){
      if(empty){if(d>40)travel(g,e,p,dt);return true;}
      if(footwork.plant)return true;
      if(occupied){travel(g,e,enemyGroupPosition(g,e,p,{backline:true}),dt);return true;}
      const threatened=d<155||p.swordDash||p.charge>.35&&d<240;
      if(threatened){if(g.time>=m.nextEvasionAt){strafe(g,e,p,dt,75);m.evadingUntil=g.time+.4;m.nextEvasionAt=g.time+1.8;}else if(g.time<m.evadingUntil)strafe(g,e,p,dt,75);}
      else if(laneBusy||!clearShot(g,e,p)||e.cooldown>0&&d<290)strafe(g,e,p,dt);
      else if(d>300)travel(g,e,p,dt);
    }else if(e.combatRole==='charger'&&(tooClose||occupied||laneBusy||m.lastRush&&e.cooldown>0)){
      strafe(g,e,p,dt,tooClose?70:0);
    }else if(e.combatRole==='shield'){
      const bow=g.enemies.find(a=>(a.combatRole==='archer'||['support','ranged','spell'].includes(a.speciesCombat?.style)||['necromancer','skeleton_caster','skeleton_wizard'].includes(a.kind))&&a.hp>0&&a.group===e.group&&Math.hypot(a.x-p.x,a.y-p.y)<220);
      if(bow&&d>80){const length=Math.hypot(p.x-bow.x,p.y-bow.y)||1,dx=(p.x-bow.x)/length,dy=(p.y-bow.y)/length;travel(g,e,{x:bow.x+dx*55-dy*m.side*35,y:bow.y+dy*55+dx*m.side*35},dt,true);}
      else if(d>(occupied?50:45))travel(g,e,p,dt,true);
    }else if(d>(occupied?50:45))travel(g,e,p,dt);
  }
  return true;
}
