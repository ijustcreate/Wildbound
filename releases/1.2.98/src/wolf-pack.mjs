import {navigateEnemy, clearShot} from './navigation.mjs';
import {creatureCue} from './sound-bank.mjs';

export function wolfPack(g,e) {
  const pack=g.enemies.filter(w=>w.kind==='wolf'&&w.hp>0&&w.group===e.group).sort((a,b)=>a.id-b.id);
  const alpha=pack.find(w=>w.alpha)||pack[0];
  for(const w of pack){w.alpha=w===alpha;w.alphaId=alpha.id;}
  return {pack,alpha};
}
export function tickWolf(g,e,alive,dt) {
  const {pack,alpha}=wolfPack(g,e);
  const target=alive.find(p=>p.id===alpha.packTargetId)||alive.reduce((a,p)=>!a||Math.hypot(alpha.x-p.x,alpha.y-p.y)<Math.hypot(alpha.x-a.x,alpha.y-a.y)?p:a,null);
  if(!target)return;
  alpha.packTargetId=target.id;e.packTargetId=target.id;
  if(e===alpha){e.howlCooldown=(e.howlCooldown??0)-dt;if(e.howlCooldown<=0){g.onSound(creatureCue('wolf','spawn'),e);e.howlCooldown=12;}}
  if(e.state==='snared'){e.timer-=dt;if(e.timer<=0)e.hp=0;return;}
  const trap=g.traps.find(t=>t.life>0&&Math.hypot(t.x-e.x,t.y-e.y)<30);
  if(trap){if(trap.variant==='slow')e.rooted=Math.max(e.rooted||0,.5);else {trap.life=0;e.state=trap.variant==='interrupt'?'recover':'snared';e.timer=2;g.onSound('trap',e);return;}}
  const d=Math.hypot(target.x-e.x,target.y-e.y)||1;
  e.faceX=(target.x-e.x)/d;e.faceY=(target.y-e.y)/d;
  if(e.state==='windup'){
    e.timer-=dt;
    if(e.timer<=0){if(d<57&&clearShot(g,e,target))g.hurt(target,e.damage,e);e.attack=.34;e.state='recover';e.timer=.75;e.cooldown=1.8;g.onSound(creatureCue('wolf','attack'),e);}
    return;
  }
  if(e.state==='recover'){e.timer-=dt;if(e.timer<=0)e.state='hunt';return;}
  // Only one wolf commits at a time; the others flank the same prey.
  const turn=Math.floor(g.time/1.5)%pack.length, attacker=pack[turn];
  if(e===attacker&&d<53&&e.cooldown<=0&&!pack.some(w=>w!==e&&w.state==='windup')&&clearShot(g,e,target)) {e.state='windup';e.timer=.42;return;}
  let goal=target;
  const leaderDistance=Math.hypot(alpha.x-target.x,alpha.y-target.y);
  if(e!==alpha&&leaderDistance>180){const i=pack.indexOf(e);goal={x:alpha.x-alpha.faceX*48+alpha.faceY*(i%2?40:-40),y:alpha.y-alpha.faceY*48-alpha.faceX*(i%2?40:-40)};e.packRole='follow';}
  else if(e!==attacker){const angle=Math.atan2(alpha.y-target.y,alpha.x-target.x)+pack.indexOf(e)*Math.PI*2/pack.length;goal={x:target.x+Math.cos(angle)*90,y:target.y+Math.sin(angle)*90};e.packRole=e.alpha?'lead':'flank';}
  else e.packRole='attack';
  if(Math.hypot(goal.x-e.x,goal.y-e.y)>12)navigateEnemy(g,e,goal,dt);
  for(const other of pack)if(other!==e){const dx=e.x-other.x,dy=e.y-other.y,r=Math.hypot(dx,dy);if(r>0&&r<28)g.moveActor(e,dx/r*25*dt,dy/r*25*dt);}
}
