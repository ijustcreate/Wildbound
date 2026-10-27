import {clearShot,navigateEnemy} from './navigation.mjs';
import {rules} from './definitions.mjs';
import {shoreGoblinMotion} from './shore-goblin-motion.mjs';
import {interruptShoreGoblin} from './shore-goblin-state.mjs';
export const SHORE_GOBLIN_EVENT=Object.freeze({name:'The kelpguard shore goblins',kind:'shore_goblin',environment:'beach',requiredStartArea:'sand',count:3,hp:72,speed:65,damage:11,weight:6,enemies:[{kind:'shore_goblin',count:1,shoreRole:'melee',shoreColor:0},{kind:'shore_goblin',count:1,shoreRole:'spear',shoreColor:1},{kind:'shore_goblin',count:1,shoreRole:'healer',shoreColor:2}],verse:'Three bright fins rise where breakers foam.\nThey guard the tide that calls them home.',tip:'The club and spear guard the violet healer. Interrupt its glowing staff, then dodge the spear line.'});
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const allies=(g,e)=>g.enemies.filter(q=>q.kind==='shore_goblin'&&q.group===e.group&&q.hp>0&&q.faction!=='ally');
function move(g,e,p,dt){const speed=e.speed;try{if(e.rooted>0)e.speed*=.45;return navigateEnemy(g,e,p,dt);}finally{e.speed=speed;}}
function face(e,p){const d=dist(e,p)||1;e.faceX=(p.x-e.x)/d;e.faceY=(p.y-e.y)/d;}
function begin(e,action,target){e.shoreAction=action;e.shoreAge=0;e.animationAction=action;e.poseTime=0;e.shoreResolved=false;e.state='windup';if(action==='cast')e.shoreHealTarget=target.id;else e.shoreAim={x:target.x,y:target.y};face(e,target);}
function recover(e,seconds=.8){e.shoreAction=null;e.shoreRecovery=seconds;e.shoreHealTarget=null;e.shoreAim=null;e.poseTime=null;e.state='recover';e.animationAction='guard';}
export function tickShoreGoblin(g,e,targets,dt,stats={}){
 if(e.hp<=0||e.faction==='ally')return;e.shoreRole??='melee';e.shoreColor??=e.shoreRole==='healer'?2:e.shoreRole==='spear'?1:0;e.moving=false;
 if(e.frozen>0){interruptShoreGoblin(e);return;}e.rooted=Math.max(0,(e.rooted||0)-dt);e.shoreHealCooldown=Math.max(0,(e.shoreHealCooldown??2)-dt);
 if(e.state==='snared'){e.animationAction='cower';e.shoreAction=null;e.poseTime=null;e.timer-=dt;if(e.timer<=0)e.hp=0;return;}
 const trap=g.traps?.find(t=>t.life>0&&dist(e,t)<30);if(trap?.variant==='slow')e.rooted=.5;else if(trap){trap.life=0;interruptShoreGoblin(e);if(trap.variant==='interrupt')e.shoreRecovery=1.8;else{e.state='snared';e.timer=rules.captureTime*(trap.capture||1);}g.onSound?.('trap',e);return;}
 if(e.stun>0){e.stun=Math.max(0,e.stun-dt);interruptShoreGoblin(e);return;}
 if(e.shoreRecovery>0){e.shoreRecovery=Math.max(0,e.shoreRecovery-dt);e.animationAction=e.shoreRecovery>.4?'hurt':'guard';e.poseTime=null;if(!e.shoreRecovery)e.state='hunt';return;}
 const squad=allies(g,e),visible=targets.filter(p=>p.hp>0&&!p.room),healer=squad.find(q=>q.shoreRole==='healer'),anchor=healer||e;
 const target=visible.reduce((a,b)=>!a||dist(anchor,b)<dist(anchor,a)?b:a,null);
 if(e.shoreAction){const action=e.shoreAction,clip=shoreGoblinMotion.clips[action],duration=(clip.length-1)/clip.fps;const from=e.shoreAge;e.shoreAge+=dt;e.poseTime=Math.min(1,e.shoreAge/duration);e.animationAction=action;
  const impact=action==='cast'?duration*.75:duration*.6;
  if(!e.shoreResolved&&from<impact&&e.shoreAge>=impact){e.shoreResolved=true;if(action==='cast'){const q=squad.find(q=>q.id===e.shoreHealTarget);if(q&&q.hp>0&&dist(e,q)<=190&&clearShot(g,e,q)&&q.hp<q.maxHp){const amount=Math.min(22,q.maxHp-q.hp);q.hp+=amount;q.healEffect=.7;e.healEffect=.7;g.onSound?.('heal',e);}e.shoreHealCooldown=4.5;}else{const reach=action==='spear'?86:52;for(const p of visible){const d=dist(e,p)||1,dot=((p.x-e.x)*e.faceX+(p.y-e.y)*e.faceY)/d,lateral=Math.abs((p.x-e.x)*e.faceY-(p.y-e.y)*e.faceX);if(d<=reach&&dot>(action==='spear'?.78:.35)&&(action!=='spear'||lateral<19)&&(p.jumpHeight||0)<22&&clearShot(g,e,p))g.hurt(p,e.damage*(action==='spear'?1.1:1),e);}g.onSound?.('swing',e);}}
  if(e.shoreAge>=duration)recover(e,action==='cast'?1.1:.85);return;
 }
 if(e.shoreRole==='healer'){
  const injured=squad.filter(q=>q.hp<q.maxHp-8&&dist(e,q)<190&&clearShot(g,e,q)).sort((a,b)=>a.hp/a.maxHp-b.hp/b.maxHp)[0];
  if(injured&&!e.shoreHealCooldown){begin(e,'cast',injured);return;}
  if(target&&dist(e,target)<120){const d=dist(e,target)||1,goal={x:e.x+(e.x-target.x)/d*85,y:e.y+(e.y-target.y)/d*85};e.moving=move(g,e,goal,dt);}
  else{const guard=squad.find(q=>q.shoreRole!=='healer');if(guard&&dist(e,guard)>145)e.moving=move(g,e,guard,dt);}
  e.animationAction=e.moving?'run':'spell_prepare';e.poseTime=null;return;
 }
 if(!target){e.animationAction='idle';e.poseTime=null;return;}
 const reach=e.shoreRole==='spear'?86:52;
 // Screen the approach to the healer; do not chase a distant player away from it.
 e.shoreProtecting=!!healer;e.shoreGuardTarget=healer?.id??null;
 if(healer&&dist(target,healer)>190){const d=dist(target,healer)||1,side=e.shoreRole==='spear'?1:-1;const goal={x:healer.x+(target.x-healer.x)/d*65-(target.y-healer.y)/d*side*25,y:healer.y+(target.y-healer.y)/d*65+(target.x-healer.x)/d*side*25};if(dist(e,goal)>12)e.moving=move(g,e,goal,dt);else face(e,target);}
 else if(dist(e,target)<=reach&&clearShot(g,e,target)){begin(e,e.shoreRole==='spear'?'spear':'attack',target);return;}
 else e.moving=move(g,e,target,dt);
 e.animationAction=e.moving?'run':'guard';e.poseTime=null;
}
export function drawShoreGoblinTells(c,g){for(const e of g.enemies){if(e.kind!=='shore_goblin'||e.hp<=0||!e.shoreAction||e.shoreResolved)continue;c.save();c.strokeStyle=e.shoreAction==='cast'?'#8ce6bd':'#f2cf75';c.lineWidth=2;c.setLineDash([5,4]);if(e.shoreAction==='cast'){const q=g.enemies.find(q=>q.id===e.shoreHealTarget&&q.hp>0);if(q){c.beginPath();c.moveTo(e.x,e.y);c.lineTo(q.x,q.y);c.stroke();c.beginPath();c.arc(q.x,q.y,20,0,Math.PI*2);c.stroke();}}else{const reach=e.shoreAction==='spear'?86:52;c.beginPath();c.moveTo(e.x,e.y);c.lineTo(e.x+e.faceX*reach,e.y+e.faceY*reach);c.stroke();c.beginPath();c.arc(e.x,e.y,reach,Math.atan2(e.faceY,e.faceX)-.45,Math.atan2(e.faceY,e.faceX)+.45);c.stroke();}c.restore();}}
