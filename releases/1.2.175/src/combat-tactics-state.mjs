import {ENEMY_COMBAT_CATALOG,combatPhase} from './enemy-combat-catalog.mjs';
import {counterOpeningForView} from './counterattack.mjs';
// Dependency-free so damage, animation and AI can share the same openings.
export const CROSSFIRE_EVENT={name:'Crossfire patrol',kind:'skeleton',environment:'forest',weight:8,count:3,hp:95,speed:65,damage:14,
  verse:'A shield advances. A bowstring sings.\nA hungry shadow waits in the wings.',
  tip:'Flank the shield and interrupt the archer. Sidestep or catch the lion’s rush with a fresh block, then hit the opening.',
  enemies:[{kind:'skeleton',combatRole:'shield',count:1,hp:110,speed:58,damage:15},{kind:'lion',combatRole:'charger',count:1,hp:100,speed:85,damage:18},{kind:'archer',combatRole:'archer',count:1,hp:65,speed:62,damage:12}]};
export function tacticalPhase(e,phase,duration){
  e.tactics={phase,remaining:duration,duration,dx:e.faceX??0,dy:e.faceY??1,hitIds:[]};
  e.state=phase==='active'?'charge':phase==='stagger'?'recover':phase==='approach'?'hunt':phase;
  e.timer=duration;e.motionDuration=duration;e.moving=false;
  return e.tactics;
}
export function initializeTacticalEnemy(e){
  if(!e.combatRole)return;
  tacticalPhase(e,'approach',0);e.cooldown=.5;
  e.roleMind={guard:100,side:(Number(e.id)||0)%2?1:-1,nextEvasionAt:0};
  if(e.combatRole==='shield'){e.equipment={...e.equipment,hand1:'sword',hand2:'shield'};delete e.lanternBearer;}
  if(e.combatRole==='archer'){e.startingArrows=12;e.arrowsLeft=12;}
}
export function tacticalDamage(e,amount,type,context){
  if(!e.combatRole||!e.tactics||e.hp<=0)return amount;
  const source=context?.p||context?.shot,phase=e.tactics.phase;
  const mind=e.roleMind??={guard:100,side:1,nextEvasionAt:0};mind.lastHitAt=context?.g?.time||0;
  e.tacticalBlocked=false;
  const shot=context?.shot,projectile=Number.isFinite(shot?.vx)&&Number.isFinite(shot?.vy);
  const dx=projectile?-shot.vx:(source?.x??e.x)-e.x;
  const dy=projectile?-shot.vy:(source?.y??e.y)-e.y,d=Math.hypot(dx,dy);
  const frontal=d>0&&(dx*(e.faceX||0)+dy*(e.faceY||0))/d>.35;
  const heavy=!!context?.heavy;
  if(e.combatRole==='shield'&&type==='physical'&&frontal&&['approach','windup'].includes(phase)){
    if(heavy&&phase==='windup'){mind.guard=0;tacticalPhase(e,'stagger',1.1);e.cooldown=1.5;return Math.round(amount*1.25);}
    mind.guard=Math.max(0,(mind.guard??100)-(heavy?42:18));
    if(mind.guard===0){tacticalPhase(e,'stagger',1.2);e.cooldown=1.6;return Math.round(amount*.6);}
    e.tacticalBlocked=true;e.guardFlash=.18;return Math.max(1,Math.round(amount*.2));
  }
  if(['recover','stagger'].includes(phase))return Math.round(amount*1.3);
  if(phase==='windup'&&(e.combatRole==='archer'||heavy)){
    tacticalPhase(e,'stagger',e.combatRole==='archer'?.8:1);e.cooldown=1.4;
  }
  return amount;
}
export function swordCanDodge(p,isSword){
  return !isSword||!(p.attack>0)||(!p.swordStrike&&!p.swordDash&&1-p.attack/(p.attackDuration||.34)>=.45);
}
export function drawTacticalTell(c,e,time,size=48){
  const counter=counterOpeningForView(e,time);
  const speciesPhase=!e.combatRole&&ENEMY_COMBAT_CATALOG[e.kind]?combatPhase(e):null;
  const pressureOpening=!e.combatRole&&(e.enemyMind?.openUntil>time||speciesPhase==='recover');
  if(e.hp<=0||!counter&&!pressureOpening&&speciesPhase!=='windup'&&!(e.guardFlash>0)&&(!e.combatRole||!e.tactics))return;
  const phase=pressureOpening?'recover':speciesPhase||e.tactics?.phase||'guard',open=phase==='recover'||phase==='stagger';
  if(!counter&&!open&&phase!=='windup'&&!(e.guardFlash>0))return;
  const x=Math.round(e.x),y=Math.round(e.y-size*(e.combatRole==='charger'?.75:1.03));
  if(counter){
    const remaining=(counter.expiresAt-time)/(counter.expiresAt-counter.startedAt);
    c.save();
    c.fillStyle='#263139';c.fillRect(x-7,y-5,15,7);
    c.fillStyle=counter.kind==='caught'?'#a2f0ff':'#ffe4a0';
    c.fillRect(x-5,y-2,Math.ceil(11*remaining),2);
    c.fillRect(x-1,y-5,3,2);
    c.restore();
    return;
  }
  c.save();c.globalAlpha*=open?.85+.15*Math.sin(time*10):1;
  c.fillStyle='#263139';c.fillRect(x-3,y-2,7,5);
  c.fillStyle=e.guardFlash>0?'#b8dce6':open?'#ffe4a0':'#f3b17b';
  if(phase==='windup'&&!(e.guardFlash>0)){c.fillRect(x,y-2,1,2);c.fillRect(x,y+1,1,1);}
  else c.fillRect(x-2,y,5,1);
  c.restore();
}
