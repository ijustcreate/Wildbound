import {combatPhase} from './enemy-combat-catalog.mjs';

// Attack admission is shared; movement, damage and authored tells stay with each AI.
// Only ids/numbers are retained so an expedition can be saved during a turn.
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const valid=e=>e&&e.hp>0&&!e.practiceTarget&&!e.controlledBy&&e.ownerKey==null&&e.allyOwner==null&&!e.pet&&!e.hunterPet&&!e.wildlife&&!['ally','neutral'].includes(e.faction);
const disabled=e=>e.frozen>0||e.stun>0||e.sleeping>0||e.state==='snared';
const sameFloor=(a,b)=>(a.room??null)===(b.room??null)&&Math.abs((a.groundHeight||a.trainGround||0)-(b.groundHeight||b.trainGround||0))<16;
function active(e){
 if(e.wildlifeBehaviorPhase==='recover')return false;
 if(['spider','tarantula','baby_spider'].includes(e.kind)&&e.attack>0)return true;
 const p=combatPhase(e);
 return p==='windup'||p==='active'||['specialWindup','dive','feint'].includes(e.constructAI?.phase)||['aim','fire','barbs','grab','pounce','dash','emerge'].includes(e.night?.phase)||e.captainAction||e.dreadAction&&['roar','claw_left','claw_right','cower','pounce'].includes(e.dreadAction)||e.kind==='golem'&&e.boulderReady||e.bansheeDashLeft>0||e.zombieWindup>0||e.kind==='zombie'&&e.attack>0||e.reaperAttack||e.shoreAction||e.pantherContactPending||e.pendingBanana||e.bansheeDrawLeft>0;
}
function state(g){return g.enemyGroupCombat??={targets:[]};}
function targetState(g,p){
 const s=state(g);let t=s.targets.find(t=>t.id===p.id);
 if(!t){t={id:p.id,quietUntil:0,supportUntil:0};s.targets.push(t);}return t;
}
// Players sharing a dodge space share pressure. Separated co-op lanes can still
// act independently; never redirect or cancel a tell when players move together.
const sharedSpace=(a,b)=>a&&b&&sameFloor(a,b)&&(a.id===b.id||distance(a,b)<120);
const turnTarget=(g,a)=>(g.players||[]).find(p=>p.id===a.groupTurn?.targetId&&p.hp>0);
export function maintainEnemyGroupCombat(g){
 const now=g.time||0,actors=g.enemies||[],players=g.players||[];
 const s=state(g);s.targets=s.targets.filter(t=>players.some(p=>p.id===t.id&&p.hp>0&&!p.room));
 for(const e of actors){
  // A pre-existing tell from an older save must also block fresh attacks.
  if(!e.groupTurn&&e.groupLastAttackAt==null&&valid(e)&&!disabled(e)&&active(e)&&!['bee_hive','spider_egg'].includes(e.kind)){
   const id=e.tactics?.targetId??e.speciesCombat?.targetId??e.night?.targetId??e.packTargetId;
   const candidates=players.filter(p=>p.hp>0&&!p.room&&sameFloor(e,p)&&distance(e,p)<750);
   const p=candidates.find(p=>p.id===id)||candidates.sort((a,b)=>distance(e,a)-distance(e,b))[0];
   if(p)e.groupTurn={targetId:p.id,mode:e.speciesCombat?.support&&e.speciesCombat.support!=='bolt'?'support':'attack',startedAt:now,expiresAt:now+8,committed:true};
  }
  const turn=e.groupTurn;if(!turn)continue;
  const p=players.find(p=>p.id===turn.targetId&&p.hp>0&&!p.room);
  const canceled=!valid(e)||disabled(e)||!p||!sameFloor(e,p)||distance(e,p)>750;
  const attacking=!canceled&&!!active(e);
  if(attacking)turn.committed=true;
  // A granted turn must actually start its tell. Abandoned reservations expire.
  if(!canceled&&now<turn.expiresAt&&(attacking||!turn.committed&&now-turn.startedAt<.16))continue;
  if(p){
   const t=targetState(g,p);
   if(turn.mode==='support')t.supportUntil=Math.max(t.supportUntil,now+(canceled?.4:2.4));
   else{
    const gap=canceled?.28:turn.flightSpeed?Math.max(.48,Math.min(1.8,distance(e,p)/turn.flightSpeed+.12)):turn.rush?.52:.38;
    t.quietUntil=Math.max(t.quietUntil,now+gap);
   }
  }
  e.groupLastAttackAt=now;delete e.groupTurn;
 }
}
function peers(g,e,p,mode){
 return (g.enemies||[]).filter(a=>a!==e&&valid(a)&&sameFloor(a,e)&&distance(a,p)<750&&a.groupTurn?.mode===mode&&sharedSpace(turnTarget(g,a),p));
}
export function enemyGroupBusy(g,e,p,mode='attack'){
 if(!valid(e)||!p||!(g.enemies||[]).includes(e))return false;
 targetState(g,p);const now=g.time||0;
 const quiet=state(g).targets.some(t=>sharedSpace((g.players||[]).find(q=>q.id===t.id&&q.hp>0),p)&&(mode==='support'?t.supportUntil:t.quietUntil)>now);
 // Offset fresh tells within the encounter, even when teammates spread apart.
 const stagger=mode==='attack'&&(g.enemies||[]).some(a=>a!==e&&valid(a)&&sameFloor(a,e)&&distance(a,p)<750&&a.groupTurn?.mode==='attack'&&now-a.groupTurn.startedAt<.28);
 return quiet||stagger||peers(g,e,p,mode).length>0;
}
export function requestEnemyGroupTurn(g,e,p,{mode='attack',rush=false,flightSpeed=0}={}){
 if(!valid(e)||!p||!(g.enemies||[]).includes(e)||!(g.players||[]).some(a=>a.id===p.id))return true;
 maintainEnemyGroupCombat(g);
 if(disabled(e))return false;
 if(e.groupTurn)return e.groupTurn.targetId===p.id&&e.groupTurn.mode===mode;
 const now=g.time||0;
 if(e.groupWait?.targetId!==p.id||e.groupWait?.mode!==mode||now-e.groupWait.seenAt>.22)e.groupWait={targetId:p.id,mode,since:now,seenAt:now};
 e.groupWait.seenAt=now;
 const waiting=(g.enemies||[]).filter(a=>valid(a)&&!disabled(a)&&sameFloor(a,e)&&distance(a,p)<750&&a.groupWait?.mode===mode&&sharedSpace((g.players||[]).find(q=>q.id===a.groupWait.targetId&&q.hp>0),p)&&now-a.groupWait.seenAt<=.22&&!a.groupTurn);
 waiting.sort((a,b)=>a.groupWait.since-b.groupWait.since||(a.groupLastAttackAt??-1)-(b.groupLastAttackAt??-1)||String(a.id).localeCompare(String(b.id)));
 if(enemyGroupBusy(g,e,p,mode)||waiting[0]!==e){e.groupWaitingUntil=now+.12;return false;}
 e.groupTurn={targetId:p.id,mode,rush,flightSpeed,startedAt:now,expiresAt:now+8,committed:false};
 delete e.groupWait;e.groupWaitingUntil=0;return true;
}

// Waiting units make readable space rather than body-piling on the target.
// This returns a navigation goal, never a teleport, buff or extra floor effect.
export function enemyGroupPosition(g,e,p,{backline=false,range=160}={}){
 const now=g.time||0;
 if(e.groupPosition?.targetId===p.id&&e.groupPosition.until>now)return e.groupPosition;
 const members=(g.enemies||[]).filter(a=>valid(a)&&sameFloor(a,e)&&distance(a,p)<650).sort((a,b)=>String(a.id).localeCompare(String(b.id)));
 const index=Math.max(0,members.indexOf(e)),side=index%2?1:-1;
 const shield=backline&&members.find(a=>a.combatRole==='shield'&&a.group===e.group);
 const origin=shield||e;
 if(e.groupFormation?.targetId!==p.id||distance(e.groupFormation,p)>150)e.groupFormation={targetId:p.id,x:p.x,y:p.y,angle:Math.atan2(origin.y-p.y,origin.x-p.x)};
 const angle=e.groupFormation.angle+side*(shield?.6:.55+index%3*.18),radius=backline?220+index%3*22:Math.min(95+index%3*18,Math.max(30,range*.78));
 e.groupPosition={targetId:p.id,x:p.x+Math.cos(angle)*radius,y:p.y+Math.sin(angle)*radius,until:now+.5};return e.groupPosition;
}
