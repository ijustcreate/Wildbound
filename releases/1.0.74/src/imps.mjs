import {clearShot,navigateEnemy} from './navigation.mjs';
import {waterAt} from './environment.mjs';
import {ignite} from './hazards.mjs';
import {isCharmed} from './succubus-charm.mjs';
import {spawnParticleEffect} from './particles.mjs';
export const IMP_BOMB_LIMIT=24,IMP_FIRE_LIMIT=16,IMP_FIRE_SECONDS=3.2,IMP_FIRE_RADIUS=30;
export const IMP_EVENT=Object.freeze({name:'Three sparks of trouble',kind:'imp',count:3,hp:60,speed:70,damage:14,weight:6,verse:'Three little devils skim the air.\nTheir falling embers scorch the square.',tip:'The imps lob fire toward marked circles. Move before impact; burning circles fade after 3 seconds. Interrupt a glowing hand to stop a throw.'});
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export function initializeImp(e){e.equipment={head:'imp_horns',shoulders:'imp_wings',...e.equipment};e.impFlightHeight??=20;e.cooldown=Math.max(e.cooldown||0,.6+(e.id%3)*.55);}
function cancel(e){e.impWindup=0;e.impAim=null;}
export function tickImp(g,e,targets,dt,stats={},behaviors={}){
 if(e.hp<=0||e.faction==='ally'){cancel(e);return;}if(e.frozen>0){e.moving=false;return;}
 if(e.state==='snared'){cancel(e);e.timer-=dt;if(e.timer<=0)e.hp=0;return;}
 if(e.flash>0){cancel(e);e.cooldown=Math.max(e.cooldown,.8);return;}
 const p=targets.filter(p=>!isCharmed(p)&&distance(e,p)<=(stats.detection||500)).reduce((a,b)=>!a||distance(e,b)<distance(e,a)?b:a,null);
 if(!p){cancel(e);e.moving=false;return;}
 if(e.impWindup>0){
  e.impWindup=Math.max(0,e.impWindup-dt);e.moving=false;if(e.impWindup>0)return;
  const aim=e.impAim;cancel(e);e.cooldown=stats.rangedCooldown||3;e.attack=.4;
  if(aim&&behaviors.ranged!==false&&clearShot(g,e,aim)){
   const bombs=(g.impBombs||=[]);if(bombs.length<IMP_BOMB_LIMIT){const d=distance(e,aim),duration=Math.max(.65,Math.min(1.25,d/220));bombs.push({id:g.nextId++,owner:e.id,x:e.x,y:e.y,originX:e.x,originY:e.y,targetX:aim.x,targetY:aim.y,age:0,duration,z:32,damage:e.damage});}
  }return;
 }
 const d=distance(e,p)||1;e.faceX=(p.x-e.x)/d;e.faceY=(p.y-e.y)/d;
 if(e.cooldown<=0&&behaviors.ranged!==false&&d<=(stats.rangedRange||330)&&clearShot(g,e,p)){
  e.impWindup=e.impWindupDuration=Math.max(.6,stats.windup||.9);e.impAim={x:p.x,y:p.y};e.moving=false;return;
 }
 if(behaviors.hunt===false)return;
 const speed=e.speed*(e.rooted>0?.45:1);
 if(d>230){const step=Math.min(d-230,speed*dt),moved=g.moveActor(e,e.faceX*step,e.faceY*step);if(moved<step*.3)navigateEnemy(g,e,p,dt);}
 else if(d<110)g.moveActor(e,-e.faceX*speed*dt,-e.faceY*speed*dt);
}
function hitCircle(g,patch,amount,initial=false){
 if(!(amount>0))return;
 for(const p of g.players)if(p.hp>0&&!p.room&&!isCharmed(p)&&(p.jumpHeight||0)<(initial?28:10)&&distance(p,patch)<=patch.radius&&clearShot(g,patch,p,1)){
  const hp=p.hp;g.hurt(p,amount,initial?patch:undefined);if(p.hp<hp)ignite(p,.8,2);
 }
}
export function explodeImpBomb(g,b){
 if(b.exploded)return false;b.exploded=true;
 const wet=['water','shallow','floodbridge'].includes(waterAt(g,b.x,b.y));
 spawnParticleEffect(g,wet?'arrow-splash':'px-fire-burst',b.x,b.y,b.id||0);if(wet)return false;
 const fires=(g.impFireCircles||=[]);if(fires.length>=IMP_FIRE_LIMIT)return false;
 const patch={id:g.nextId++,owner:b.owner,x:b.x,y:b.y,radius:IMP_FIRE_RADIUS,life:IMP_FIRE_SECONDS,age:0,tick:.45,damage:b.damage>0?4:0};fires.push(patch);
 hitCircle(g,patch,Math.max(0,b.damage||0),true);return true;
}
export function tickImpHazards(g,dt){
 const bombs=(g.impBombs||[]).slice(-IMP_BOMB_LIMIT);
 for(const b of bombs){
  if(![b.x,b.y,b.originX,b.originY,b.targetX,b.targetY,b.age,b.duration].every(Number.isFinite)||b.duration<=0){b.exploded=true;continue;}
  if(b.exploded)continue;const owner=g.enemies.find(e=>e.id===b.owner);if(owner?.faction==='ally'){b.exploded=true;continue;}
  const old=b.age,next=Math.min(b.duration,b.age+dt),d=Math.hypot(b.targetX-b.originX,b.targetY-b.originY),steps=Math.max(1,Math.ceil(d*(next-old)/b.duration/4));
  for(let n=1;n<=steps&&!b.exploded;n++){
   const age=old+(next-old)*n/steps,u=Math.min(1,age/b.duration),x=b.originX+(b.targetX-b.originX)*u,y=b.originY+(b.targetY-b.originY)*u;
   if(g.projectileBlocked(x,y,2,true)){explodeImpBomb(g,b);break;}
   b.x=x;b.y=y;b.age=age;b.z=32*(1-u)+72*Math.sin(Math.PI*u);
   if(u>=1){b.z=0;explodeImpBomb(g,b);}
  }
 }
 g.impBombs=bombs.filter(b=>!b.exploded);
 const fires=(g.impFireCircles||[]).slice(-IMP_FIRE_LIMIT);
 for(const f of fires){f.life-=dt;f.age=(f.age||0)+dt;f.tick-=dt;if(g.enemies.find(e=>e.id===f.owner)?.faction==='ally'){f.life=0;continue;}if(f.life>0&&f.tick<=0){f.tick=.45;hitCircle(g,f,f.damage);}}
 g.impFireCircles=fires.filter(f=>f.life>0);
}
function pixel(c,x,y,w,h,color){c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,h);}
export function drawImpGround(c,g){
 c.save();
 const circles=[...(g.impFireCircles||[]).slice(-IMP_FIRE_LIMIT),...(g.impBombs||[]).slice(-IMP_BOMB_LIMIT).map(b=>({x:b.targetX,y:b.targetY,radius:IMP_FIRE_RADIUS,warning:true})),...g.enemies.filter(e=>e.kind==='imp'&&e.hp>0&&e.impWindup>0&&e.impAim).slice(-IMP_BOMB_LIMIT).map(e=>({...e.impAim,radius:IMP_FIRE_RADIUS,warning:true}))];
 for(const f of circles){
  if(f.warning){c.globalAlpha=.7;c.strokeStyle='#ffbc72';c.lineWidth=1;c.beginPath();c.arc(f.x,f.y,f.radius,0,Math.PI*2);c.stroke();pixel(c,f.x-3,f.y-1,7,2,'#ffbe80');pixel(c,f.x-1,f.y-3,2,7,'#ffbe80');continue;}
  c.globalAlpha=Math.min(.85,f.life/.7);
  for(let y=-f.radius;y<=f.radius;y+=3)for(let x=-f.radius;x<=f.radius;x+=3){const r=Math.hypot(x,y);if(r>f.radius)continue;const wave=Math.sin(r*.7-f.age*11+Math.atan2(y,x)*3);pixel(c,f.x+x,f.y+y,3,3,r>f.radius-4?'#f6b23c':wave>.6?'#db662e':wave<-.4?'#73312b':'#a93f27');}
  for(let n=0;n<14;n++){const a=n*Math.PI*2/14+f.id*.2,x=f.x+Math.cos(a)*f.radius*.85,y=f.y+Math.sin(a)*f.radius*.85,lift=3+Math.floor((Math.sin(f.age*12+n)+1)*3);pixel(c,x-1,y-lift,3,lift,'#ec8130');pixel(c,x,y-lift,1,Math.max(2,lift-2),'#ffe296');}
 }c.restore();
}
export function drawImpBombs(c,g){
 c.save();for(const b of (g.impBombs||[]).slice(-IMP_BOMB_LIMIT)){
  c.globalAlpha=.3;c.fillStyle='#321d29';c.beginPath();c.ellipse(b.x,b.y,7,3,0,0,Math.PI*2);c.fill();c.globalAlpha=1;
  pixel(c,b.x-5,b.y-b.z-5,10,10,'#8e3526');pixel(c,b.x-4,b.y-b.z-5,8,8,'#ef882e');pixel(c,b.x-2,b.y-b.z-5,4,6,'#fff0a3');
  for(let i=0;i<3;i++)pixel(c,b.x-(b.targetX-b.originX)/b.duration*.015*i-1,b.y-b.z-8-i*3,2,3,i?'#dd5b26':'#ffcc58');
 }c.restore();
}
