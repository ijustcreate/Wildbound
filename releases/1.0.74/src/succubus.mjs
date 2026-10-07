import {SUCCUBUS_EQUIPMENT} from './items.mjs';
import {clearShot,navigateEnemy} from './navigation.mjs';
import {CHARM_KISS_LIMIT,isCharmed,succubusTargets} from './succubus-charm.mjs';
export const SUCCUBUS_EVENT=Object.freeze({name:'A kiss with thorns',kind:'succubus',count:2,hp:180,speed:56,damage:18,weight:4,verse:'Two velvet wings eclipse the light.\nTheir sweetest promise hides a bite.',tip:'Dodge or shield the slow heart kisses. Charm lasts 5 seconds: your friend fights for them. Interrupt their windups and strike between whip lashes.'});
export function initializeSuccubus(e){
 e.equipment={...SUCCUBUS_EQUIPMENT,...e.equipment};e.succubusAggroRange=520;
 e.succubusKissCooldown??=1+(e.id%2)*1.4;e.succubusFlightTimer??=3+(e.id%2);e.succubusFlightHeight??=0;
}
function cancel(e){e.succubusAttack=null;e.succubusWindup=0;e.succubusAim=null;}
export function tickSuccubus(g,e,targets,dt,stats={},behaviors={}){
 if(Number.isFinite(stats.detection))e.succubusAggroRange=Math.max(32,Math.min(2000,stats.detection));
 if(e.hp<=0){cancel(e);e.succubusFlightHeight=0;return;}
 if(e.faction==='ally'){cancel(e);e.succubusFlightHeight=0;return;}
 if(e.frozen>0){e.moving=false;return;}
 if(e.state==='snared'){cancel(e);e.succubusFlightHeight=0;e.timer-=dt;if(e.timer<=0)e.hp=0;return;}
 if(e.flash>0){cancel(e);e.cooldown=Math.max(e.cooldown,.55);return;}
 const visible=succubusTargets(g,e,targets),p=visible.reduce((best,p)=>!best||Math.hypot(e.x-p.x,e.y-p.y)<Math.hypot(e.x-best.x,e.y-best.y)?p:best,null);
 e.succubusKissCooldown=Math.max(0,(e.succubusKissCooldown||0)-dt);e.succubusFlightTimer=(e.succubusFlightTimer??3)-dt;
 if(e.succubusFlightTimer<=0){e.succubusFlying=!e.succubusFlying;e.succubusFlightTimer=e.succubusFlying?2.4:4.2;}
 const height=e.succubusFlying?16:0;e.succubusFlightHeight+=(height-e.succubusFlightHeight)*Math.min(1,dt*5);
 if(!p){cancel(e);e.moving=false;return;}
 const d=Math.hypot(p.x-e.x,p.y-e.y)||1,fx=(p.x-e.x)/d,fy=(p.y-e.y)/d;
 if(e.succubusAttack){
  e.succubusWindup=Math.max(0,e.succubusWindup-dt);e.moving=false;
  const selected=visible.find(q=>q.id===e.succubusTarget);
  if(!selected){cancel(e);e.cooldown=.6;return;}
  if(e.succubusWindup>0)return;
  const action=e.succubusAttack,aim=e.succubusAim;cancel(e);e.attack=.45;e.cooldown=stats.recovery||1.6;
  if(action==='kiss'){
   e.succubusKissCooldown=8;
   if(clearShot(g,e,selected)&&!isCharmed(selected)){
    const kisses=(g.succubusKisses||=[]);if(kisses.length<CHARM_KISS_LIMIT)kisses.push({owner:e.id,x:e.x+aim.x*14,y:e.y+aim.y*14,vx:aim.x*165,vy:aim.y*165,life:2.1});
   }
  }else if(behaviors.melee!==false&&e.damage>0){
   for(const q of visible){const dx=q.x-e.x,dy=q.y-e.y,n=Math.hypot(dx,dy)||1;if(n<=(stats.attackRange||112)+8&&(dx*aim.x+dy*aim.y)/n>.76&&(q.jumpHeight||0)<24&&clearShot(g,e,q))g.hurt(q,e.damage,e);}
  }
  return;
 }
 e.faceX=fx;e.faceY=fy;
 const los=clearShot(g,e,p);
 if(e.cooldown<=0&&los){
  const kiss=behaviors.ranged!==false&&!isCharmed(p)&&!p.charmGrace&&d>=80&&d<=290&&e.succubusKissCooldown<=0,whip=behaviors.melee!==false&&e.damage>0&&d<=(stats.attackRange||112);
  if(kiss||whip){e.succubusAttack=kiss?'kiss':'whip';e.succubusWindup=e.succubusWindupDuration=kiss?1:Math.max(.5,stats.windup||.75);e.succubusAim={x:fx,y:fy};e.succubusTarget=p.id;e.moving=false;return;}
 }
 if(behaviors.hunt===false)return;
 if(d>85){const step=Math.min(d-85,e.speed*(e.succubusFlying?1.3:1)*(e.rooted>0?.45:1)*dt),moved=g.moveActor(e,fx*step,fy*step);if(moved<step*.3)navigateEnemy(g,e,p,dt);}
}
