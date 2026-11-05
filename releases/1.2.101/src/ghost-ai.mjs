import {clearShot,navigateEnemy} from './navigation.mjs';
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export function interruptGhost(e){e.ghostWindup=0;e.ghostAim=null;e.ghostTarget=null;}
export function tickGhostTrail(e,dt){
 const moved=Number.isFinite(e.ghostLastX)&&Math.hypot(e.x-e.ghostLastX,e.y-e.ghostLastY)>.01;
 e.ghostLastX=e.x;e.ghostLastY=e.y;
 e.ghostEyeTrail=(e.ghostEyeTrail||[]).map(p=>({...p,age:p.age+dt})).filter(p=>p.age<.24).slice(0,4);
 if((e.moving||moved)&&e.hp>0&&!(e.frozen>0)){
  e.ghostTrailClock=(e.ghostTrailClock||0)+dt;
  if(e.ghostTrailClock>=.05){e.ghostTrailClock%=.05;e.ghostEyeTrail.unshift({x:e.x,y:e.y,age:0});e.ghostEyeTrail.length=Math.min(4,e.ghostEyeTrail.length);}
 }
}
export function tickGhost(g,e,targets,dt,stats={},behaviors={}){
 tickGhostTrail(e,dt);
 if(e.hp<=0||e.faction==='ally'){interruptGhost(e);return;}
 if(e.frozen>0){interruptGhost(e);e.moving=false;return;}
 if(e.state==='snared'){interruptGhost(e);e.moving=false;e.timer-=dt;if(e.timer<=0)e.hp=0;return;}
 if(e.flash>0||e.hit>0){interruptGhost(e);e.moving=false;e.cooldown=Math.max(e.cooldown||0,.5);return;}
 const p=targets.filter(p=>p.hp>0&&!p.room&&distance(e,p)<(stats.detection||380)).sort((a,b)=>distance(e,a)-distance(e,b))[0];
 if(!p){interruptGhost(e);e.moving=false;e.state='idle';return;}
 if(e.ghostWindup>0){
  e.moving=false;e.ghostWindup=Math.max(0,e.ghostWindup-dt);
  if(e.ghostWindup>0)return;
  const aim=e.ghostAim;interruptGhost(e);e.attack=.4;e.cooldown=stats.recovery||1.2;
  for(const q of targets){const d=distance(e,q)||1;if(q.hp>0&&!q.room&&behaviors.melee!==false&&d<=(stats.attackRange||56)+5&&((q.x-e.x)*aim.x+(q.y-e.y)*aim.y)/d>.5&&(q.jumpHeight||0)<22&&clearShot(g,e,q))g.hurt(q,e.damage,e);}
  g.onSound?.('swing',e);return;
 }
 const d=distance(e,p)||1;e.faceX=(p.x-e.x)/d;e.faceY=(p.y-e.y)/d;e.state='hunt';
 if(behaviors.melee!==false&&d<=(stats.attackRange||56)&&(e.cooldown||0)<=0&&clearShot(g,e,p)){
  e.ghostWindup=e.ghostWindupDuration=Math.max(.5,stats.windup||.6);e.ghostAim={x:e.faceX,y:e.faceY};e.ghostTarget=p.id;e.moving=false;return;
 }
 if(behaviors.hunt!==false&&d>35)navigateEnemy(g,e,p,dt*(e.rooted>0?.45:1));
}
