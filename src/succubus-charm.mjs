import {ITEMS,itemKind} from './items.mjs';
import {clearShot} from './navigation.mjs';
export const CHARM_SECONDS=5,CHARM_GRACE=2,CHARM_KISS_LIMIT=16;
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export const isCharmed=p=>Number.isFinite(p?.succubusCharm?.remaining)&&p.succubusCharm.remaining>0&&p.hp>0&&!p.room;
export function charmOwner(g,p){return (g.enemies||[]).find(e=>e.id===p.succubusCharm?.owner&&e.kind==='succubus'&&e.hp>0&&e.faction!=='ally');}
export function clearCharm(p,grace=true){
 if(!p.succubusCharm)return false;delete p.succubusCharm;
 if(grace)p.charmGrace=CHARM_GRACE;
 p.charge=0;p.blocking=false;p.bowAiming=false;p.moving=false;p.slideX=p.slideY=0;p.previousInput={};delete p.queuedAttack;
 return true;
}
export function applyCharm(g,p,owner){
 if(!g.players.includes(p)||p.hp<=0||p.room||p.invincible||p.invuln>0||p.charmGrace>0||isCharmed(p)||owner?.kind!=='succubus'||owner.hp<=0||owner.faction==='ally')return false;
 p.succubusCharm={owner:owner.id,remaining:CHARM_SECONDS,attackCooldown:.6};
 p.ui=null;p.consumeInput=false;p.charge=0;p.blocking=false;p.bowAiming=false;p.dashTime=0;p.slideX=p.slideY=0;p.previousInput={};delete p.queuedAttack;
 g.message?.(`${p.name} is charmed for 5 seconds! Dodge the hearts; defeat her to break the spell.`);return true;
}
export function tickCharmStatuses(g,dt){
 for(const p of g.players){p.charmGrace=Math.max(0,(p.charmGrace||0)-dt);if(!p.succubusCharm)continue;
  const c=p.succubusCharm;
  if(!Number.isFinite(c.remaining)||!charmOwner(g,p)||p.hp<=0||p.room||g.phase!=='play'){clearCharm(p);continue;}
  c.remaining=Math.max(0,Math.min(CHARM_SECONDS,c.remaining)-dt);c.attackCooldown=Math.max(0,(c.attackCooldown||0)-dt);
  if(c.remaining<1e-8)clearCharm(p);
 }
}
export function charmInputs(g,inputs){
 if(!g.players.some(isCharmed))return inputs;const out={...inputs};for(const p of g.players)if(isCharmed(p))out[p.device]={};return out;
}
export function succubusTargets(g,e,targets=g.players){
 const range=e.succubusAggroRange||520,near=targets.filter(p=>g.players.includes(p)&&p.hp>0&&!p.room&&distance(e,p)<=range),normal=near.filter(p=>!isCharmed(p));
 e.succubusPetFallback=!normal.length;return normal.length?normal:near;
}
// Existing friendly-fire/PvP rules are unchanged outside a charm. Shots retain
// their allegiance at release, so an in-flight heart-controlled arrow cannot flip.
export function charmCanTarget(g,source,target){
 const player=source?.charmShot!==undefined?null:(g.players||[]).find(p=>p===source||p.id===source?.owner);
 const controlled=source?.charmShot??isCharmed(player);
 if(controlled)return (g.players||[]).includes(target)&&target.id!==(source?.owner??player?.id)&&!isCharmed(target);
 if(isCharmed(target)&&(g.enemies||[]).includes(source))return source.kind==='succubus'&&source.succubusPetFallback===true;
 return true;
}
export function playerCombatTargets(g,source){
 const owner=source?.owner??source?.id;
 return [...(g.enemies||[]),...(g.players||[]).filter(p=>p.id!==owner&&!p.room&&(g.pvp||isCharmed(p)||source?.charmShot||isCharmed(source)))].filter(e=>charmCanTarget(g,source,e));
}
export const charmShot=p=>({charmShot:isCharmed(p)});
export function tickCharmedPlayer(g,p,dt){
 const owner=charmOwner(g,p);if(!owner){clearCharm(p);return;}
 p.bowAiming=false;p.blocking=false;p.charge=0;p.slideX=p.slideY=0;delete p.queuedAttack;
 if(p.hp<=0||p.stun>0||p.sleeping>0||p.frozen>0||g.openingBoard){p.moving=false;return;}
 const target=succubusTargets(g,owner,g.players).filter(q=>q!==p&&!isCharmed(q)).sort((a,b)=>distance(p,a)-distance(p,b))[0],goal=target||owner;
 const d=distance(p,goal)||1,fx=(goal.x-p.x)/d,fy=(goal.y-p.y)/d,def=ITEMS[p.equipment?.hand1],ranged=def?.ranged||def?.magic||itemKind(p.equipment?.hand1)==='bow';
 const reach=target?(ranged?190:Math.max(42,(def?.reach||54)*.75)):64;
 p.faceX=fx;p.faceY=fy;p.walking=true;p.moving=false;
 if(d>reach)g.moveActor(p,fx*Math.min(d-reach,95*dt),fy*Math.min(d-reach,95*dt));
 if(target&&d<=reach&&p.attack<=0&&p.succubusCharm.attackCooldown<=0&&clearShot(g,p,target)){
  p.succubusCharm.attackCooldown=ranged?1.35:1;g.attack(p,ranged?.75:0);
 }
}
export function tickSuccubusKisses(g,dt){
 const kisses=(g.succubusKisses||[]).slice(-CHARM_KISS_LIMIT);
 for(const k of kisses){const owner=(g.enemies||[]).find(e=>e.id===k.owner&&e.kind==='succubus'&&e.hp>0&&e.faction!=='ally');k.life-=dt;
  if(!owner){k.life=0;continue;}
  const steps=Math.max(1,Math.ceil(Math.hypot(k.vx,k.vy)*dt/4));
  for(let n=0;n<steps&&k.life>0;n++){
   k.x+=k.vx*dt/steps;k.y+=k.vy*dt/steps;
   if(g.projectileBlocked(k.x,k.y,3,true)){k.life=0;break;}
   const p=g.players.find(p=>p.hp>0&&!p.room&&!isCharmed(p)&&(p.jumpHeight||0)<20&&distance(k,p)<16&&clearShot(g,k,p));
   if(p){if(!g.shieldBlocks(p,k))applyCharm(g,p,owner);k.life=0;}
  }
 }
 g.succubusKisses=kisses.filter(k=>k.life>0);
}
export function drawCharmHeart(c,x,y,scale=1,color='#e982b4'){
 const rows=['0110110','1111111','1111111','0111110','0011100','0001000'];c.fillStyle=color;
 rows.forEach((r,j)=>{for(let i=0;i<r.length;i++)if(r[i]==='1')c.fillRect(Math.round(x+(i-3)*scale),Math.round(y+j*scale),scale,scale);});
 c.fillStyle='#ffe4ef';c.fillRect(Math.round(x-2*scale),Math.round(y+scale),scale,scale);
}
export function drawSuccubusEffects(c,g){
 c.save();
 for(const k of (g.succubusKisses||[]).slice(-CHARM_KISS_LIMIT)){drawCharmHeart(c,k.x,k.y-19,1.4);}
 for(const p of g.players)if(isCharmed(p)){
  const y=p.y-48-(p.jumpHeight||0)-(p.groundHeight||0);
  for(let i=0;i<3;i++)drawCharmHeart(c,p.x+(i-1)*10,y+Math.sin(g.time*4+i)*3,1);
  c.fillStyle='#efd0e5';c.font='6px monospace';c.textAlign='center';c.fillText(`CHARMED ${Math.ceil(p.succubusCharm.remaining)}s`,p.x,y-5);
 }
 for(const e of g.enemies)if(e.hp>0&&e.succubusAttack){
  const progress=1-e.succubusWindup/e.succubusWindupDuration;c.globalAlpha=.2+progress*.3;c.strokeStyle=e.succubusAttack==='kiss'?'#ec8abe':'#e3b777';c.lineWidth=2;
  const a=Math.atan2(e.faceY,e.faceX),r=e.succubusAttack==='kiss'?36:112,half=e.succubusAttack==='kiss'?.18:.7;
  c.beginPath();c.moveTo(e.x,e.y);c.arc(e.x,e.y,r,a-half,a+half);c.closePath();c.stroke();c.globalAlpha=1;
  if(e.succubusAttack==='kiss')drawCharmHeart(c,e.x,e.y-44-(e.succubusFlightHeight||0),1);
 }
 c.restore();
}
