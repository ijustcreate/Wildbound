import {clearShot,navigateEnemy,actorRadius,flies} from './navigation.mjs';
import {creatures} from './definitions.mjs';
import {isCharmed} from './succubus-charm.mjs';
const kinds=new Set(['rhino','zebra','pelican']);
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const enabled=(e,key)=>(e.behaviors?.[key]??creatures[e.kind]?.behaviors?.[key])!==false;
const valid=(e,p)=>p?.hp>0&&!isCharmed(p)&&(p.room||null)===(e.room||null);
function face(e,p,reverse=false){const d=distance(e,p)||1,s=reverse?-1:1;e.faceX=(p.x-e.x)/d*s;e.faceY=(p.y-e.y)/d*s;}
function walk(g,e,p,dt,speed){
 if(!enabled(e,'hunt'))return;
 const old=e.speed;e.speed=speed;const x=e.x,y=e.y;navigateEnemy(g,e,p,dt);e.speed=old;e.moving=distance(e,{x,y})>.01;
}
function phase(e,s,name,time){s.phase=name;s.timer=time;e.state=name==='windup'?'windup':name==='charge'?'charge':name==='recover'?'recover':'hunt';e.attack=name==='windup'?time:0;}
function hit(g,e,s,targets,range,backward=false){
 for(const p of targets){const d=distance(e,p)||1;if(!valid(e,p)||(p.jumpHeight||0)>(e.kind==='pelican'?42:20)||d>range||s.hits.includes(p.id)||!clearShot(g,e,p)||g.shieldBlocks?.(p,e))continue;
  if(backward&&((p.x-e.x)*s.dx+(p.y-e.y)*s.dy)/d<.55)continue;
  s.hits.push(p.id);g.hurt(p,e.damage||9,e);
 }
}
function pass(g,e,s,targets,dt){
 const speed=e.kind==='rhino'?Math.max(180,Math.min(280,(e.speed||90)*1.6)):Math.max(150,Math.min(205,(e.speed||85)*1.9));
 const steps=Math.max(1,Math.ceil(speed*dt/4)),length=speed*dt/steps;
 for(let i=0;i<steps;i++){const x=e.x,y=e.y;g.moveActor(e,s.dx*length,s.dy*length,flies(e));e.moving=distance(e,{x,y})>.01;
  hit(g,e,s,targets,actorRadius(e)+15);
  if(distance(e,{x,y})<length*.35){phase(e,s,'recover',e.kind==='rhino'?1.15:.65);s.cooldown=1.5;break;}
 }
 e.faceX=s.dx;e.faceY=s.dy;
}
/** Peaceful crossings remain hazard-owned; only provoked animals use combat. */
export function tickProvokedFauna(g,e,target,dt){
 if(!kinds.has(e.kind))return false;
 if(!Number.isFinite(dt)||dt<=0||g.paused||!['play','won'].includes(g.phase??'play')||e.hp<=0)return true;
 if(!e.aggro)return true;
 const s=e.faunaCombat??={phase:'approach',timer:0,cooldown:0,hits:[],targetId:target?.id};e.moving=false;
 if(e.state==='snared'){e.timer-=dt;if(e.timer<=0)e.hp=0;return true;}
 if(e.frozen>0||e.stun>0){e.stun=Math.max(0,(e.stun||0)-dt);s.phase='recover';s.timer=.7;e.attack=0;return true;}
 const trap=(g.traps||[]).find(t=>t.life>0&&distance(e,t)<30);
 if(trap){e.attack=0;if(trap.variant==='slow'){e.rooted=Math.max(e.rooted||0,.5);phase(e,s,'recover',.4);return true;}trap.life=0;e.state=trap.variant==='interrupt'?'recover':'snared';e.timer=trap.variant==='interrupt'?1.2:2;s.phase='recover';s.timer=1.2;s.cooldown=1.5;g.onSound?.('trap',e);return true;}
 s.timer-=dt;s.cooldown=Math.max(0,s.cooldown-dt);
 const targets=(g.players||[]).filter(p=>valid(e,p));if(valid(e,target)&&!targets.includes(target))targets.push(target);
 const p=targets.find(p=>p.id===s.targetId&&distance(e,p)<800)||targets.reduce((a,b)=>!a||distance(e,b)<distance(e,a)?b:a,null);
 if(!p){phase(e,s,'recover',.5);s.targetId=null;return true;}
 if(s.targetId!==p.id){s.targetId=p.id;phase(e,s,'approach',0);s.cooldown=.4;}
 if(!enabled(e,'melee')){phase(e,s,'approach',0);if(distance(e,p)>70)walk(g,e,p,dt,e.speed||80);return true;}
 if(s.phase==='windup'){
  if(s.timer<=0){s.hits=[];if(e.kind==='zebra'){hit(g,e,s,targets,62,true);phase(e,s,'recover',.6);s.cooldown=1.6;}
   else phase(e,s,'charge',Math.max(.45,Math.min(1.3,(s.aimDistance+85)/(e.kind==='rhino'?230:175))));}
  return true;
 }
 if(s.phase==='charge'){
  if(!enabled(e,'hunt')){phase(e,s,'recover',.8);return true;}
  pass(g,e,s,targets,dt);if(s.phase==='charge'&&s.timer<=0){phase(e,s,e.kind==='pelican'?'peel':'recover',e.kind==='pelican'?.55:1);s.cooldown=e.kind==='pelican'?1.2:1.5;}return true;
 }
 if(s.phase==='peel'){if(s.timer>0)walk(g,e,{x:e.x+s.dx*80-s.dy*45,y:e.y+s.dy*80+s.dx*45},dt,e.speed||85);else phase(e,s,'approach',0);return true;}
 if(s.phase==='recover'){if(s.timer<=0)phase(e,s,e.kind==='zebra'?'retreat':'approach',e.kind==='zebra'?.65:0);return true;}
 if(s.phase==='retreat'){if(s.timer>0){face(e,p);walk(g,e,{x:e.x-e.faceX*90-e.faceY*30,y:e.y-e.faceY*90+e.faceX*30},dt,e.speed||110);}else phase(e,s,'approach',0);return true;}
 const d=distance(e,p),range=e.kind==='rhino'?270:e.kind==='pelican'?245:54;
 if(d<=range&&s.cooldown<=0&&clearShot(g,e,p)&&enabled(e,'hunt')){
  face(e,p);s.dx=e.faceX;s.dy=e.faceY;s.aimDistance=d;s.hits=[];phase(e,s,'windup',e.kind==='rhino'?.7:e.kind==='pelican'?.5:.55);
  if(e.kind==='zebra'){e.faceX=-s.dx;e.faceY=-s.dy;}return true;
 }
 if(e.kind==='pelican'&&d<135){const a=Math.atan2(e.y-p.y,e.x-p.x)+(e.id%2?1:-1)*.6;walk(g,e,{x:p.x+Math.cos(a)*130,y:p.y+Math.sin(a)*130},dt,e.speed||85);}
 else if(d>(e.kind==='zebra'?42:65))walk(g,e,p,dt,e.kind==='rhino'?Math.min(115,e.speed||90):e.speed||85);
 else face(e,p);
 return true;
}
export function drawProvokedFaunaTells(c,g){
 for(const e of g.enemies||[]){const s=e.faunaCombat;if(e.hp<=0||e.room||s?.phase!=='windup')continue;
  const reach=e.kind==='zebra'?60:e.kind==='rhino'?110:90;c.save();c.strokeStyle='#f1c979';c.fillStyle='#f1c97922';c.lineWidth=1.5;c.beginPath();c.moveTo(e.x,e.y);c.lineTo(e.x+s.dx*reach,e.y+s.dy*reach);c.stroke();c.beginPath();c.arc(e.x+s.dx*reach,e.y+s.dy*reach,10,0,Math.PI*2);c.stroke();c.restore();
 }
}
