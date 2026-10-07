import {clearShot,navigateEnemy} from './navigation.mjs';
export const ZOMBIE_VARIANTS=Object.freeze(['shambler','one_arm','broken_jaw']);
export const ZOMBIE_EVENT=Object.freeze({name:'Footsteps without a heartbeat',kind:'zombie',count:3,hp:80,speed:32,damage:14,weight:6,verse:'Three ragged shadows drag their feet.\nThey follow footsteps, not a beat.',tip:'Zombies only see in front. Movement draws them from farther away; approach quietly from behind. Dodge their slow, sweeping claws.'});
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export function initializeZombie(e,member=0){e.zombieVariant??=ZOMBIE_VARIANTS[member%3];e.equipment??={};}
export function zombieCanSee(g,e,p,stats={}){
 if(!g.players.includes(p)||p.hp<=0||p.room)return false;
 const d=distance(e,p),f=Math.hypot(e.faceX??0,e.faceY??1)||1,fx=(e.faceX??0)/f,fy=(e.faceY??1)/f;
 // No hearing-through-the-back exception: rear approaches never acquire a target.
 if(d>1&&((p.x-e.x)*fx+(p.y-e.y)*fy)/d<.5)return false;
 const range=p.moving||p.walking?stats.detection||360:Math.min(180,stats.detection||360);
 return d<=range&&clearShot(g,e,p);
}
function cancel(e){e.zombieWindup=0;e.zombieAim=null;e.zombieTarget=null;}
export function tickZombie(g,e,targets,dt,stats={},behaviors={}){
 if(e.hp<=0||e.faction==='ally'){cancel(e);return;}if(e.frozen>0){e.moving=false;return;}
 if(e.state==='snared'){cancel(e);e.timer-=dt;if(e.timer<=0)e.hp=0;return;}
 if(e.flash>0){cancel(e);e.cooldown=Math.max(e.cooldown,.5);return;}
 const visible=targets.filter(p=>zombieCanSee(g,e,p,stats)),p=visible.reduce((a,b)=>!a||distance(e,b)<distance(e,a)?b:a,null);
 if(e.zombieWindup>0){
  e.zombieWindup=Math.max(0,e.zombieWindup-dt);e.moving=false;
  if(!visible.some(p=>p.id===e.zombieTarget)){cancel(e);e.cooldown=.5;return;}
  if(e.zombieWindup>0)return;const aim=e.zombieAim;cancel(e);e.attack=.4;e.cooldown=stats.recovery||1.25;
  if(behaviors.melee!==false&&e.damage>0)for(const q of visible){const d=distance(e,q)||1;if(d<=(stats.attackRange||54)+6&&((q.x-e.x)*aim.x+(q.y-e.y)*aim.y)/d>.55&&(q.jumpHeight||0)<22&&clearShot(g,e,q))g.hurt(q,e.damage,e);}
  return;
 }
 if(!p){e.state='idle';e.moving=false;return;}
 const d=distance(e,p)||1;e.faceX=(p.x-e.x)/d;e.faceY=(p.y-e.y)/d;e.state='hunt';
 if(behaviors.melee!==false&&d<=(stats.attackRange||54)&&e.cooldown<=0){e.zombieWindup=e.zombieWindupDuration=Math.max(.5,stats.windup||.65);e.zombieAim={x:e.faceX,y:e.faceY};e.zombieTarget=p.id;e.moving=false;return;}
 if(behaviors.hunt!==false&&d>38){const step=Math.min(d-38,e.speed*(e.rooted>0?.45:1)*dt),travel=g.moveActor(e,e.faceX*step,e.faceY*step);if(travel<step*.3)navigateEnemy(g,e,p,dt);}
}
export function drawZombieTells(c,g){
 c.save();for(const e of g.enemies)if(e.kind==='zombie'&&e.hp>0&&e.zombieWindup>0&&e.zombieAim){
  c.save();c.translate(e.x,e.y);c.rotate(Math.atan2(e.zombieAim.y,e.zombieAim.x));c.fillStyle='#b5ce7950';c.strokeStyle=e.frozen>0?'#b0e8f8':'#d0d994';c.beginPath();c.moveTo(0,0);c.arc(0,0,60,-.96,.96);c.closePath();c.fill();c.stroke();c.restore();
 }c.restore();
}
