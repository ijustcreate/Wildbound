import {ITEMS,stat} from './items.mjs';
import {damageEnemy} from './enemy-damage.mjs';
import {clearShot} from './navigation.mjs';

export function throwBoomerang(g,p){
 const id=p.equipment?.hand1,weapon=ITEMS[id];
 if(!weapon?.boomerang)return false;
 const active=(g.boomerangs||=[]);
 if(active.some(b=>b.owner===p.id))return true;
 const length=Math.hypot(p.faceX||0,p.faceY||0)||1;
 active.push({owner:p.id,type:id,x:p.x,y:p.y,vx:(p.faceX??0)/length*weapon.speed,vy:(p.faceY??1)/length*weapon.speed,age:0,travel:0,returning:false,hits:[],damage:weapon.damage+stat(p,'damageBonus')});
 p.attack=p.attackDuration=.34;p.attackClip='ranged';g.onSound?.('attack',p);
 return true;
}
export function tickBoomerangs(g,dt){
 const active=g.boomerangs||=[];
 for(const b of active){
  const p=g.players.find(p=>p.id===b.owner),weapon=ITEMS[b.type];
  if(!p||p.hp<=0||p.room){b.remove=true;continue;}
  b.age+=dt;if(b.age>5){b.remove=true;continue;}
  const steps=Math.max(1,Math.ceil(weapon.speed*dt/6));
  for(let i=0;i<steps&&!b.remove;i++){
   const s=dt/steps;
   if(b.returning){const dx=p.x-b.x,dy=p.y-b.y,d=Math.hypot(dx,dy);if(d<16){b.remove=true;break;}b.vx=dx/d*weapon.speed;b.vy=dy/d*weapon.speed;}
   const x=b.x+b.vx*s,y=b.y+b.vy*s;
   if(!b.returning&&g.projectileBlocked(x,y,1,true)){b.returning=true;continue;}
   b.x=x;b.y=y;b.travel+=weapon.speed*s;
   if(b.travel>=weapon.range)b.returning=true;
   for(const e of g.enemies||[]){
    if(e.hp<=0||e.room||b.hits.includes(e.id)||Math.hypot(e.x-b.x,e.y-b.y)>22||!clearShot(g,b,e))continue;
    b.hits.push(e.id);damageEnemy(e,b.damage,'physical');e.killedBy=p.id;e.ritualKill=false;e.aggro=true;e.flash=.2;g.onSound?.('hit',e);
   }
  }
 }
 g.boomerangs=active.filter(b=>!b.remove);
}
export function drawBoomerang(c,b,time){
 c.save();c.translate(b.x,b.y-16);c.rotate(time*19);c.lineJoin='round';c.lineWidth=7;c.strokeStyle='#32271d';
 const shape=()=>{c.beginPath();c.moveTo(-12,7);c.lineTo(0,-7);c.lineTo(12,7);c.stroke();};shape();
 c.lineWidth=4;c.strokeStyle=ITEMS[b.type]?.artColor||'#c29151';shape();c.restore();
}
