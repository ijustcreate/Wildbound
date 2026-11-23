import {ENEMY_COMBAT_CATALOG,combatPhase} from './enemy-combat-catalog.mjs';
// Shared, serializable combat decisions. No renderer/navigation dependencies.
export const hostileEnemy=e=>e&&e.hp>0&&!e.practiceTarget&&!e.wildlife&&!e.pet&&!e.hunterPet&&!e.ownerKey&&!e.allyOwner&&!e.controlledBy&&!['ally','neutral'].includes(e.faction);
// Navigation goals only: attacks still aim at the real player and retain the
// shared turn budget. Role slots survive deaths/reordering and serialize as data.
export function enemyPursuitGoal(g,e,p){
 if(!hostileEnemy(e)||!g.players?.includes(p)||e.boss||e.cryptBoss||/boss|queen|dragon|reaper/.test(e.kind)||['windup','active'].includes(combatPhase(e)))return p;
 const peers=(g.enemies||[]).filter(a=>hostileEnemy(a)&&a.kind===e.kind&&(a.room??null)===(e.room??null)&&Math.abs((a.groundHeight||0)-(e.groundHeight||0))<16&&Math.hypot(a.x-e.x,a.y-e.y)<650&&(a.group===e.group||Math.hypot(a.x-e.x,a.y-e.y)<350));
 if(peers.length<2)return p;
 const used=new Set(peers.filter(a=>a.pursuitTactic?.kind===e.kind).map(a=>a.pursuitTactic.slot));
 for(const a of peers.slice().sort((a,b)=>String(a.id).localeCompare(String(b.id),undefined,{numeric:true}))){if(a.pursuitTactic?.kind===a.kind)continue;let slot=0;while(used.has(slot))slot++;a.pursuitTactic={kind:a.kind,slot};used.add(slot);}
 const slot=e.pursuitTactic.slot,role=['hunter','lead','intercept','flank'][slot%4];e.pursuitTactic.role=role;
 const now=g.time||0,m=p.enemyPursuitSample;
 if(!m)p.enemyPursuitSample={x:p.x,y:p.y,time:now,dx:0,dy:0};
 else if(now>m.time){const dt=now-m.time,dx=p.x-m.x,dy=p.y-m.y,d=Math.hypot(dx,dy);Object.assign(m,{x:p.x,y:p.y,time:now,dx:d>.05&&d/dt>5?dx/d:0,dy:d>.05&&d/dt>5?dy/d:0});}
 if(role==='hunter'||Math.hypot(p.x-e.x,p.y-e.y)<100)return p;
 const sample=p.enemyPursuitSample,dx=sample.dx,dy=sample.dy,side=slot%2?1:-1;
 const lead=role==='lead'?128:role==='intercept'?64:0,lateral=role==='lead'?0:role==='intercept'?72:104;
 // Stationary players get a readable side approach, not omniscient prediction.
 const fx=dx||dy?dx:p.faceX||1,fy=dx||dy?dy:p.faceY||0;
 return {x:p.x+dx*lead-fy*lateral*side,y:p.y+dy*lead+fx*lateral*side};
}
export function chooseEnemyTarget(g,e,targets){
  const valid=targets.filter(p=>p&&p.hp>0&&!p.room&&p!==e);if(!valid.length)return null;
  const now=g.time||0,m=e.enemyMind??={threat:[]};
  m.threat=(m.threat||[]).filter(t=>now-t.time<8&&valid.some(p=>p.id===t.id)).slice(-8);
  const score=p=>Math.hypot(p.x-e.x,p.y-e.y)-(p.id===m.targetId?65:0)-Math.min(220,m.threat.filter(t=>t.id===p.id).reduce((sum,t)=>sum+t.value*Math.max(0,1-(now-t.time)/8),0));
  const current=valid.find(p=>p.id===m.targetId);
  const best=valid.reduce((a,b)=>score(b)<score(a)?b:a);
  // Nearby bodies should not make a co-op enemy flick between players each frame.
  const picked=current&&now<(m.reconsiderAt||0)&&Math.hypot(current.x-e.x,current.y-e.y)<700?current:best;
  if(picked.id!==m.targetId){m.targetId=picked.id;m.reconsiderAt=now+.65;}
  return picked;
}
export function recordEnemyPressure(g,e,source,amount,{heavy=false,type='physical'}={}){
  if(!g||!hostileEnemy(e)||amount<=0)return;
  const now=g.time||0,m=e.enemyMind??={threat:[]};m.threat??=[];
  if(source?.id!=null){
    let threat=m.threat.find(t=>t.id===source.id);if(!threat){threat={id:source.id,value:0,time:now};m.threat.push(threat);}
    threat.value=Math.min(220,threat.value*Math.max(0,1-(now-threat.time)/8)+Math.min(100,amount*2+25));threat.time=now;
    m.threat=m.threat.slice(-8);m.reconsiderAt=0;
  }
  m.lastHitAt=now;
  // Custom bosses retain ownership of their phase transitions. Ordinary actors
  // pause briefly without replacing a charge, spell or authored state machine.
  if(e.combatRole||e.boss||e.cryptBoss||/boss|queen|dragon|reaper|captain|beholder/.test(e.kind||'')||type!=='physical'||e.state==='charge'||e.state==='snared')return;
  if(now<(m.resistUntil||0))return;
  m.poise=(now-(m.poiseAt??-99)>1.1?0:m.poise||0)+(heavy?.75:.28)*(ENEMY_COMBAT_CATALOG[e.kind]?.pressureWeight??1);m.poiseAt=now;
  if(m.poise>=1){m.poise=0;m.resistUntil=now+2.2;m.openUntil=now+.65;e.enemyFlinchUntil=now+.16;}
}
export function tickEnemyFlinch(g,e,dt){
  if(!hostileEnemy(e)||!(e.enemyFlinchUntil>g.time)||e.frozen>0||e.stun>0||e.sleeping>0)return false;
  e.moving=false;e.flash=Math.max(0,(e.flash||0)-dt);return true;
}
export function enemyOpeningDamage(g,e,amount){
  return !e.combatRole&&g&&e.enemyMind?.openUntil>g.time?Math.round(amount*1.15):amount;
}
export function crowdSteering(g,e,dx,dy,radius=8){
  if(!hostileEnemy(e)||!g.enemies?.includes(e))return {x:dx,y:dy};
  const step=Math.hypot(dx,dy);if(!step)return {x:dx,y:dy};
  let sx=0,sy=0,count=0;
  for(const other of g.enemies){
    if(other===e||!hostileEnemy(other)||Math.abs((other.groundHeight||0)-(e.groundHeight||0))>12)continue;
    const x=e.x-other.x,y=e.y-other.y,d=Math.hypot(x,y),spacing=radius+10;
    if(d>=spacing)continue;
    if(d>.01){const w=(spacing-d)/spacing;sx+=x/d*w;sy+=y/d*w;}
    else{const sign=String(e.id)<String(other.id)?1:-1;sx+=-dy/step*sign;sy+=dx/step*sign;}
    if(++count===8)break;
  }
  // Deflect, never accelerate. Native actor collision checks still own movement.
  const x=dx/step+sx*.85,y=dy/step+sy*.85,length=Math.hypot(x,y)||1;
  return {x:x/length*step,y:y/length*step};
}
export function allyInAttackLane(g,e,dx,dy,length,width=18){
  const mag=Math.hypot(dx,dy)||1;dx/=mag;dy/=mag;
  return g.enemies?.some(a=>a!==e&&a.hp>0&&a.faction!=='ally'&&Math.abs((a.groundHeight||0)-(e.groundHeight||0))<16&&
    (a.x-e.x)*dx+(a.y-e.y)*dy>12&&(a.x-e.x)*dx+(a.y-e.y)*dy<length&&Math.abs((a.x-e.x)*dy-(a.y-e.y)*dx)<width);
}
