import {requestEnemyGroupTurn,enemyGroupBusy,enemyGroupPosition} from './enemy-group-combat.mjs';
import {navigateCreature as navigateEnemy} from './creature-navigation.mjs';
// Geometry and clocks shared by the eldritch rigs; each attack has a different
// physical footprint. No instantaneous homing damage at the end of a tell.
export const ELDRITCH_ATTACKS=Object.freeze({
 arcane_eye:{shape:'lane',windup:.72,range:300,width:15,recovery:.9,clip:'ray'},
 watcher:{shape:'lane',windup:.92,range:250,width:22,recovery:1.05,clip:'gaze',root:.7},
 great_owl:{shape:'dive',windup:.58,range:190,width:25,speed:280,duration:.45,recovery:.85,clip:'swoop',fly:true},
 flying_raptor:{shape:'dive',windup:.55,range:210,width:24,speed:340,duration:.42,recovery:1.05,clip:'dive',fly:true},
 cave_monster:{shape:'dive',windup:.7,range:130,width:33,speed:220,duration:.38,recovery:1.15,clip:'pounce'},
 evil_hand:{shape:'dive',windup:.54,range:100,width:21,speed:210,duration:.3,recovery:.8,clip:'grab',root:.35},
 butterfly_dragon:{shape:'cone',windup:.84,range:230,arc:.78,recovery:1.15,clip:'breath',burn:1.5,fly:true},
 eye_tentacle:{shape:'lane',windup:.64,range:210,width:20,recovery:.95,clip:'lash'},
 jade_tentacle:{shape:'lane',windup:.53,range:90,width:17,recovery:.65,clip:'lash'},
 archangel:{shape:'cone',windup:.76,range:90,arc:.35,recovery:1,clip:'strike',fly:true},
 tree_ent:{shape:'impact',windup:1,range:110,radius:53,recovery:1.35,clip:'slam'},
 spore:{shape:'burst',windup:.9,range:90,radius:78,recovery:1.3,clip:'burst',poison:2.2},
});
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function visible(g,a,b){if(!g.projectileBlocked)return true;const n=Math.ceil(distance(a,b)/5);for(let i=1;i<n;i++)if(g.projectileBlocked(a.x+(b.x-a.x)*i/n,a.y+(b.y-a.y)*i/n,2))return false;return true;}
function hit(g,e,q,s){
 const hp=q.hp;g.hurt?.(q,e.damage??e.stats?.damage??10,e);
 if(!(q.hp<hp))return;
 if(s.root)q.rooted=Math.max(q.rooted||0,s.root);
 if(s.burn)q.burning=Math.max(q.burning||0,s.burn);
 if(s.poison)q.poisoned=Math.max(q.poisoned||0,s.poison);
}
function footprint(e,q,s,aim){
 const x=q.x-e.x,y=q.y-e.y,d=Math.hypot(x,y),along=x*aim.dx+y*aim.dy;
 if(s.shape==='lane')return along>=0&&along<=s.range&&Math.abs(x*aim.dy-y*aim.dx)<=s.width;
 if(s.shape==='cone')return d<=s.range&&along/Math.max(1,d)>s.arc;
 if(s.shape==='impact')return Math.hypot(q.x-aim.x,q.y-aim.y)<=s.radius;
 return d<=s.radius;
}
export function tickEldritchAttack(g,e,target,dt,targets=[target],defaults={}){
 const base=ELDRITCH_ATTACKS[e.kind];if(!base)return;
 const stats={...defaults,...e.stats},s={...base,range:stats.attackRange||base.range},range=s.range;
 e.cooldown=Math.max(0,(e.cooldown||0)-dt);e.guard=Math.max(0,(e.guard||0)-dt);e.moving=false;
 if(e.eldritchDash){
  const dash=e.eldritchDash,step=s.speed*dt,n=Math.max(1,Math.ceil(step/4));e.animationAction=s.clip;e.state='attack';
  for(let i=0;i<n;i++){
   const x=e.x,y=e.y;g.moveActor?.(e,dash.dx*step/n,dash.dy*step/n,!!s.fly);
   if(distance(e,{x,y})<step/n*.3){dash.remaining=0;break;}
   for(const q of targets)if(!dash.hits.includes(q.id)&&distance(e,q)<=s.width&&visible(g,e,q)){dash.hits.push(q.id);hit(g,e,q,s);}
  }
  e.moving=true;dash.remaining-=dt;e.eldritchStrike=Math.max(0,dash.remaining);e.poseTime=Math.max(0,Math.min(1,1-dash.remaining/s.duration));
  if(dash.remaining<=0){delete e.eldritchDash;e.eldritchRecovery=s.recovery;e.state='recover';e.animationAction='recover';}
  return;
 }
 if(e.eldritchStrike>0){
  e.eldritchStrike=Math.max(0,e.eldritchStrike-dt);e.state='attack';e.animationAction=s.clip;
  const progress=1-e.eldritchStrike/.24;e.poseTime=.38+.62*Math.max(0,Math.min(1,progress));
  if(e.eldritchImpactPending&&progress>=.35){
   e.eldritchImpactPending=false;for(const q of targets)if(q.hp>0&&!q.room&&footprint(e,q,s,e.eldritchAim)&&visible(g,e,q))hit(g,e,q,s);
   if(e.kind==='archangel')e.guard=.9;
  }
  if(e.eldritchStrike===0){e.eldritchRecovery=e.eldritchRecoveryDuration=s.recovery;e.state='recover';e.animationAction='recover';e.poseTime=0;}
  return;
 }
 if(e.eldritchRecovery>0){e.eldritchRecovery=Math.max(0,e.eldritchRecovery-dt);e.state='recover';e.animationAction='recover';e.poseTime=1-e.eldritchRecovery/(e.eldritchRecoveryDuration||s.recovery);return;}
 if(e.eldritchWindup>0){
  const aim=e.eldritchAim;e.state='windup';e.animationAction=e.kind==='evil_hand'?'windup':s.clip;
  if(e.eldritchWindup>aim.duration*.5){const d=distance(e,target)||1;aim.dx=(target.x-e.x)/d;aim.dy=(target.y-e.y)/d;aim.x=target.x;aim.y=target.y;}
  e.faceX=aim.dx;e.faceY=aim.dy;e.eldritchWindup=Math.max(0,e.eldritchWindup-dt);e.poseTime=Math.min(.38,(1-e.eldritchWindup/aim.duration)*.48);
  if(e.eldritchWindup===0){
   if(s.shape==='dive'){
    const hits=[];for(const q of targets)if(distance(e,q)<=s.width&&visible(g,e,q)){hits.push(q.id);hit(g,e,q,s);}
    e.eldritchDash={dx:aim.dx,dy:aim.dy,remaining:s.duration,hits};e.eldritchStrike=s.duration;e.state='attack';e.poseTime=null;
   }
   else{e.eldritchStrike=.24;e.eldritchImpactPending=true;e.state='attack';e.poseTime=.38;}
   e.animationAction=s.clip;
  }
  return;
 }
 e.poseTime=null;const d=distance(e,target)||1;e.faceX=(target.x-e.x)/d;e.faceY=(target.y-e.y)/d;
 const rooted=['eye_tentacle','spore'].includes(e.kind),engage=s.shape==='dive'?Math.max(range,s.range):range;
 if(d>engage||e.kind==='watcher'&&!visible(g,e,target)){
  e.state='hunt';e.animationAction=rooted?'idle':e.kind==='evil_hand'?'crawl':s.fly?'fly':'move';
  if(!rooted){if(g.navigateEnemy){e.speed??=stats.speed??40;g.navigateEnemy(e,target,dt);}else g.moveActor?.(e,e.faceX*(e.speed??stats.speed??40)*dt,e.faceY*(e.speed??stats.speed??40)*dt,!!s.fly);e.moving=true;}return;
 }
 e.state='idle';e.animationAction='idle';
 if(enemyGroupBusy(g,e,target)&&!rooted&&d>160){const q=enemyGroupPosition(g,e,target,{backline:['lane','cone'].includes(s.shape)}),length=distance(e,q)||1;if(length>10){if(g.navigateEnemy)g.navigateEnemy(e,q,dt);else g.moveActor?.(e,(q.x-e.x)/length*(e.speed??40)*dt,(q.y-e.y)/length*(e.speed??40)*dt,!!s.fly);e.moving=true;}}
 if(e.cooldown<=0&&requestEnemyGroupTurn(g,e,target,{rush:s.shape==='dive'})){
  const duration=stats.windup||s.windup;e.eldritchWindup=duration;e.eldritchAim={targetId:target.id,x:target.x,y:target.y,dx:e.faceX,dy:e.faceY,duration,range:s.range,width:s.width};
  e.cooldown=(stats.strikeCooldown||stats.diveCooldown||stats.rayCooldown||stats.gazeCooldown||stats.breathCooldown||stats.slamCooldown||stats.pounceCooldown||stats.lashCooldown||stats.burstCooldown||2.5)+duration;
  e.state='windup';e.animationAction=e.kind==='evil_hand'?'windup':s.clip;e.poseTime=0;
 }
}
