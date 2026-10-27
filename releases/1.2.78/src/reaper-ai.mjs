import {clearShot,navigateEnemy} from './navigation.mjs';
import {REAPER_EQUIPMENT} from './items.mjs';
import {livingDrainTargets,drainLivingAnimal} from './living-ecosystem.mjs';
import {damageEnemy} from './enemy-damage.mjs';
import {reaperBeamAnchors} from './reaper-effects.mjs';
import {interruptReaper,REAPER_DRAIN_SECONDS,REAPER_DRAIN_COOLDOWN} from './reaper-state.mjs';
export {interruptReaper,REAPER_DRAIN_SECONDS,REAPER_DRAIN_COOLDOWN};
export const REAPER_EVENT=Object.freeze({name:'The last harvest',kind:'grim_reaper',count:1,hp:220,speed:54,damage:22,weight:2,verse:'A hooded shadow lifts its blade.\nFive heartbeats left to break the shade.',tip:'At half health the Reaper drains any nearby life. Hit it before five seconds pass!'});
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export function initializeReaper(e){e.equipment??={...REAPER_EQUIPMENT};e.reaperCooldown??=0;}
function candidates(g,e){return [...(g.players||[]).map(a=>({a,key:'player:'+a.id})),...(g.enemies||[]).map(a=>({a,key:'enemy:'+a.id})),...livingDrainTargets(g).map(a=>({a,key:'critter:'+a.id,critter:true})),...(g.graveyard?.surfaceEcology?.animals||[]).map(a=>({a,key:'grave:'+a.id,critter:true,grave:true}))].filter(({a,critter})=>a!==e&&!a.room&&!a.practiceTarget&&!a.invincible&&!a.defeated&&!a.dead&&(critter||a.hp>0));}
function drainCritter(g,t,amount,execute){
 if(!t.grave)return drainLivingAnimal(g,t.a.id,amount,execute);
 const a=t.a,s=g.graveyard.surfaceEcology;a.hp??=12;const taken=execute?a.hp:Math.min(amount,Math.max(0,a.hp));a.hp-=taken;
 if(execute||a.hp<=0){a.dead=true;if(Number.isInteger(a.id)&&!s.caught.includes(a.id))s.caught.push(a.id);s.animals=s.animals.filter(b=>b!==a);g.persist?.();}return taken;
}
function valid(g,e,t,range){return t&&distance(e,t.a)<=range&&clearShot(g,e,t.a);}
export function reaperDrainTarget(g,e){return e.reaperDrain&&candidates(g,e).find(t=>t.key===e.reaperDrain.target);}
function finish(e){delete e.reaperDrain;e.reaperRecovery=.65;e.reaperCooldown=REAPER_DRAIN_COOLDOWN;e.animationAction='idle';e.poseTime=null;e.state='recover';}
export function tickReaper(g,e,players,dt,stats={},beh={}){
 initializeReaper(e);e.moving=false;
 e.reaperCooldown=Math.max(0,e.reaperCooldown-dt);
 if(e.hp<=0){interruptReaper(e);return;}
 if(e.frozen>0||e.stun>0||e.flash>0){interruptReaper(e);e.stun=Math.max(0,(e.stun||0)-dt);return;}
 if(e.state==='snared'){interruptReaper(e);e.timer-=dt;if(e.timer<=0)e.hp=0;return;}
 const trap=g.traps?.find(t=>t.life>0&&distance(t,e)<30);
 if(trap&&trap.variant!=='slow'){interruptReaper(e);trap.life=0;e.state=trap.variant==='interrupt'?'recover':'snared';e.timer=3*(trap.capture||1);e.reaperRecovery=1.8;e.animationAction='hurt';e.poseTime=null;return;}
 e.rooted=trap?.variant==='slow'?.5:Math.max(0,(e.rooted||0)-dt);
 if(e.reaperRecovery>0){e.reaperRecovery-=dt;e.poseTime=null;return;}
 const range=stats.drainRange||240;
 if(e.reaperDrain){
  const drain=e.reaperDrain,t=reaperDrainTarget(g,e);
  if(e.hp<drain.lastHp||!valid(g,e,t,range)){interruptReaper(e);return;}
  const d=distance(e,t.a)||1;e.faceX=(t.a.x-e.x)/d;e.faceY=(t.a.y-e.y)/d;
  const before=drain.age;drain.age=Math.min(REAPER_DRAIN_SECONDS,drain.age+dt);
  e.animationAction=drain.age<.625?'reaper_raise':'reaper_channel';e.poseTime=drain.age<.625?drain.age/.625:null;
  // Fixed half-second ticks, independent of frame rate. A tick steals 5% of
  // the victim's maximum health; the caster receives only health really lost.
  const ticks=Math.floor((drain.age+1e-8)/.5)-Math.floor((before+1e-8)/.5);
  for(let i=0;i<ticks;i++){
   const amount=drain.targetHp*.05;
   const taken=t.critter?drainCritter(g,t,amount,false):Math.min(amount,Math.max(0,t.a.hp));
   if(!t.critter)damageEnemy(t.a,taken,'spectral');
   e.hp=Math.min(e.maxHp,e.hp+taken);
   if(t.a.hp<=0&&drain.age<REAPER_DRAIN_SECONDS){finish(e);return;}
  }
  drain.lastHp=e.hp;
  if(drain.age>=REAPER_DRAIN_SECONDS){
   if(t.critter)drainCritter(g,t,Infinity,true);
   else{damageEnemy(t.a,t.a.hp,'spectral');t.a.hp=0;t.a.hit=.2;if(g.players?.includes(t.a))g.message?.(t.a.name+' was reaped! Stand nearby and hold Interact to revive.');}
   e.hp=e.maxHp;finish(e);g.onSound?.('heal',e);
  }
  return;
 }
 // Health gates starting a cast, not finishing one after its first healing tick.
 if(e.hp<=e.maxHp*.5&&e.reaperCooldown<=0&&beh.drain!==false){
  const target=candidates(g,e).filter(t=>valid(g,e,t,range)).sort((a,b)=>distance(e,a.a)-distance(e,b.a))[0];
  if(target){e.reaperDrain={target:target.key,age:0,targetHp:target.a.maxHp??(target.critter?12:target.a.hp),lastHp:e.hp};e.reaperCooldown=REAPER_DRAIN_COOLDOWN;e.reaperAttack=null;e.state='channel';e.animationAction='reaper_raise';e.poseTime=0;return;}
 }
 const targets=players.filter(p=>p.hp>0&&!p.room),target=targets.sort((a,b)=>distance(e,a)-distance(e,b))[0];
 if(e.reaperAttack){
  const a=e.reaperAttack,before=a.age;a.age+=dt;e.poseTime=Math.min(1,a.age/.8);
  if(before<.43&&a.age>=.43&&beh.melee!==false)for(const p of targets){const d=distance(e,p)||1;if(d<88&&((p.x-e.x)*e.faceX+(p.y-e.y)*e.faceY)/d>-.25&&clearShot(g,e,p))g.hurt(p,e.damage,e);}
  if(a.age>=.8){e.reaperAttack=null;e.cooldown=1.2;e.poseTime=null;e.animationAction='idle';}return;
 }
 e.poseTime=null;
 if(!target){e.animationAction='idle';e.state='idle';return;}
 const d=distance(e,target)||1;e.faceX=(target.x-e.x)/d;e.faceY=(target.y-e.y)/d;
 if(d<82&&e.cooldown<=0&&clearShot(g,e,target)&&beh.melee!==false){e.reaperCombo=(e.reaperCombo||0)+1;e.animationAction=e.reaperCombo%2?'scythe_sweep':'scythe_reap';e.reaperAttack={age:0};e.poseTime=0;return;}
 e.animationAction='idle';e.state='hunt';
 if(d>60&&beh.hunt!==false){navigateEnemy(g,e,target,dt);e.moving=true;e.animationAction='walk';}
}
export function drawReaperDrain(c,g){
 for(const e of g.enemies){if(e.kind!=='grim_reaper'||e.hp<=0||!e.reaperDrain)continue;const t=reaperDrainTarget(g,e);if(!t)continue;
  const {source:a,target:b}=reaperBeamAnchors(e,t,g.time||0),age=e.reaperDrain.age;
  c.save();c.strokeStyle='#567d7870';c.lineWidth=8;c.beginPath();c.moveTo(a.x,a.y);c.lineTo(b.x,b.y);c.stroke();
  for(let strand=0;strand<2;strand++){c.strokeStyle=strand?'#c4ffe0':'#6ccbad';c.lineWidth=2;c.beginPath();for(let i=0;i<=24;i++){const f=i/24,w=Math.sin(f*Math.PI)*Math.sin(f*15-age*8+strand*Math.PI)*5,x=a.x+(b.x-a.x)*f,y=a.y+(b.y-a.y)*f+w;i?c.lineTo(x,y):c.moveTo(x,y);}c.stroke();}
  for(let i=0;i<12;i++){const f=(i/12+age*.6)%1,x=b.x+(a.x-b.x)*f,y=b.y+(a.y-b.y)*f+Math.sin(f*Math.PI)*Math.sin(f*15-age*8)*3;
   c.fillStyle='#5dc1a766';c.fillRect(Math.round(x)-2,Math.round(y)-2,4,4);c.fillStyle='#dcffe3';c.fillRect(Math.round(x)-1,Math.round(y)-1,2,2);
  }
  // Palm and chest emit separate orbiting soul motes, with a pulse per tick.
  for(const [point,offset]of [[a,0],[b,Math.PI]]){
   const pulse=1-(age*2%1);c.fillStyle='#64d8b844';c.fillRect(point.x-3-pulse,point.y-3-pulse,6+pulse*2,6+pulse*2);
   for(let i=0;i<6;i++){const angle=age*4+i*Math.PI/3+offset,r=4+(i%2)*2;c.fillStyle=i%2?'#a8f5d7':'#62bbab';c.fillRect(Math.round(point.x+Math.cos(angle)*r),Math.round(point.y+Math.sin(angle)*r),1.5,1.5);}
   c.fillStyle='#efffe4';c.fillRect(point.x-1,point.y-1,2,2);
  }
  c.fillStyle='#101a20';c.fillRect(e.x-22,e.y-53,44,5);c.fillStyle='#8fe4bc';c.fillRect(e.x-21,e.y-52,42*age/5,3);
  c.font='10px sans-serif';c.textAlign='center';c.fillStyle='#d4ffe2';c.fillText('REAP '+Math.max(0,5-age).toFixed(1)+'s',e.x,e.y-57);c.restore();
 }
}

