import {ITEMS,itemKind,stat,take} from './items.mjs';
import {damageEnemy} from './enemy-damage.mjs';
import {drawMagicBolt} from './magic-bolt-render.mjs';
import {createRoomHealingBolt,spellHealingTargets,spellHealingPoint,hitHealingBolt} from './healing-magic.mjs';

const targets=g=>(g.ghosts||[]).filter(a=>a.wildTiger&&a.faction==='hostile'&&a.hp>0&&a.room==='temple-upper');
function hit(g,p,e,damage){
  const dealt=damageEnemy(e,damage,'physical',{g,p});
  if(!dealt)return;
  e.killedBy=p.id;e.hit=.18;
  g.effects.push({room:e.room,x:e.roomX,y:e.roomY-18,text:String(Math.round(dealt)),color:'#f6dfaa',life:.5});
  g.onSound('hit',p);g.persist();
}
export function templeCombatInput(g,p,input,dt){
  p.templeAttackCooldown=Math.max(0,(p.templeAttackCooldown||0)-dt);
  const aimed=Math.hypot(input.aimX||0,input.aimY||0)>.25;
  if(aimed){const n=Math.hypot(input.aimX,input.aimY);p.faceX=input.aimX/n;p.faceY=input.aimY/n;}
  const slots=['hand1','hand2'].filter(slot=>ITEMS[p.equipment?.[slot]]?.magic),old=p.previousInput||{};
  const ranged=slots.length||ITEMS[p.equipment?.hand1]?.ranged||['bow','rifle'].includes(itemKind(p.equipment?.hand1));
  if(ranged&&input.attack)p.charge=Math.min(1.2,(p.charge||0)+dt);
  const fired=ranged?!input.attack&&old.attack:input.attack&&!old.attack;
  if(!fired||p.templeAttackCooldown>0)return;
  const charge=p.charge||0;p.charge=0;p.templeAttackCooldown=.38;
  const n=Math.hypot(p.faceX||0,p.faceY||0)||1,aim={x:(p.faceX||0)/n,y:(p.faceY||0)/n};
  for(const slot of slots.length?slots:['hand1']){
    const weapon=ITEMS[p.equipment?.[slot]];
    if(weapon?.utility||weapon?.friendship)continue;
    if(weapon?.healing){const bolt=createRoomHealingBolt(g,p,charge,slot,{aim});if(bolt)(g.templeBolts||=[]).push(bolt);continue;}
    const damage=Math.max(8,weapon?.damage||12)+stat(p,'damageBonus');
    if(weapon?.ranged||weapon?.magic||['bow','rifle'].includes(itemKind(p.equipment?.[slot]))){
      if(itemKind(p.equipment[slot])==='bow'&&!take(p.inventory,'arrow')){g.message('You need an arrow.');continue;}
      const cost=weapon.magic?(weapon.manaCost||8)*(1-Math.min(.75,stat(p,'manaDiscount'))):0;
      if((p.mana||0)<cost){g.message('Not enough mana.');continue;}p.mana-=cost;
      const bolt={room:p.room,owner:p.id,x:p.roomX,y:p.roomY,vx:aim.x*190,vy:aim.y*190,life:1.5,damage,magic:!!weapon.magic,color:weapon.color||'#c7abef',size:6,age:0};
      const list=g.templeBolts||=[];list.push(bolt);if(list.length>64)list.shift();
    }else for(const e of targets(g)){
      const dx=e.roomX-p.roomX,dy=e.roomY-p.roomY,d=Math.hypot(dx,dy);
      if(d<Math.min(68,Math.max(38,(weapon?.reach||54)*.75))&&(d<12||(dx*aim.x+dy*aim.y)/d>.1))hit(g,p,e,damage);
    }
    const kind=itemKind(p.equipment?.[slot]);
    p.attackClip=kind==='scythe'?((p.templeCombo=(p.templeCombo||0)+1)%2?'scythe_sweep':'scythe_reap'):weapon?.magic?'cast':weapon?.ranged||['bow','rifle'].includes(kind)?'ranged':weapon?'swipe_one':'punch';
    p.attack=p.attackDuration=kind==='scythe'?.8:.34;p.templeAttackCooldown=p.attackDuration;g.onSound(weapon?.magic?'magic':'swing',p);
  }
}
export function tickTempleBolts(g,dt){
  for(const b of g.templeBolts||[]){
    b.life-=dt;b.age=(b.age||0)+dt;const steps=Math.max(1,Math.ceil(Math.hypot(b.vx,b.vy)*dt/4));
    for(let i=0;i<steps&&b.life>0;i++){
      b.x+=b.vx*dt/steps;b.y+=b.vy*dt/steps;
      if(b.x<25||b.x>295||b.y<40||b.y>218){b.life=0;break;}
      if(b.healing){const a=spellHealingTargets(g,b).find(a=>a.room===b.room&&Math.hypot(spellHealingPoint(a).x-b.x,spellHealingPoint(a).y-b.y)<16);if(a&&hitHealingBolt(g,b,a))b.life=0;continue;}
      const e=targets(g).find(e=>Math.hypot(e.roomX-b.x,e.roomY-b.y)<15),p=g.players.find(p=>p.id===b.owner);
      if(e&&p){hit(g,p,e,b.damage);b.life=0;}
    }
  }
  g.templeBolts=(g.templeBolts||[]).filter(b=>b.life>0).slice(-64);
}
export function drawTempleBolts(c,g){
  for(const b of g.templeBolts||[]){if(b.magic)drawMagicBolt(c,b);else{c.save();c.strokeStyle='#ead2a2';c.lineWidth=1.5;c.beginPath();c.moveTo(b.x-b.vx*.035,b.y-b.vy*.035);c.lineTo(b.x,b.y);c.stroke();c.restore();}}
}
