import {ARENA_FLOOR,ARENA_WIDTH,moveArenaBody} from './tv-arena-level.mjs';
// Native Wildbound art and rigs, with feet-based side-view physics and bounded telegraphs.
export const TV_NEW_ENEMIES=Object.freeze({
 slime:{name:'Slime',role:'hopper',w:32,h:24,hp:2,speed:42,size:40,footOffset:3,color:'#a5cf83'},
 bat:{name:'Cave bat',role:'swooper',w:28,h:26,hp:1,speed:95,size:38,footOffset:-16,color:'#cab3d9'},
 spider:{name:'Root spider',role:'skitterer',w:36,h:22,hp:2,speed:80,size:36,footOffset:8,color:'#c7ab88'},
 beetle:{name:'Ruin beetle',role:'armored',w:34,h:25,hp:3,speed:38,size:42,footOffset:8,color:'#bed078'},
 frog:{name:'Marsh frog',role:'leaper',w:32,h:26,hp:2,speed:56,size:42,color:'#abd18a'},
 boar:{name:'Bramble boar',role:'charger',w:46,h:30,hp:3,speed:60,size:43,footOffset:2,color:'#d4af83'},
 snake:{name:'Vine snake',role:'venom',w:48,h:12,hp:2,speed:48,size:39,centerOffset:8,color:'#b7d293'},
 imp:{name:'Ember imp',role:'flying-caster',w:22,h:32,hp:2,speed:72,size:48,color:'#f1ac78'},
 skeleton:{name:'Ruin skeleton',role:'swordsman',w:28,h:48,hp:3,speed:52,size:57,footOffset:1,color:'#e4d3ab'},
 archer:{name:'Bone archer',role:'archer',w:28,h:48,hp:2,speed:35,size:57,footOffset:2,color:'#e5c18d'},
});
export const TV_ENEMY_THEMES=Object.freeze([
 {name:'Rootbound ruins',roster:['bramblecap','mossback','slime','beetle']},
 {name:'Canopy hunt',roster:['bramblecap','bat','spider','thornwing']},
 {name:'Marsh crossing',roster:['mossback','frog','snake','boar']},
 {name:'Forgotten crypt',roster:['skeleton','archer','bat','sporecap']},
 {name:'Ember burrows',roster:['imp','beetle','boar','sporecap']},
]);
export function arenaRosterTheme(cleared){
 if(cleared<2)return {name:cleared?'Spore awakening':'Mossroot welcome',roster:cleared?['bramblecap','mossback','sporecap']:['bramblecap','mossback']};
 return TV_ENEMY_THEMES[(cleared-2)%TV_ENEMY_THEMES.length];
}
export function newArenaEnemyStats(kind){const d=TV_NEW_ENEMIES[kind];return d?{w:d.w,h:d.h,hp:d.hp,speed:d.speed,visualSize:d.size,arenaProfile:true,ammo:kind==='archer'?6:0}:null;}
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const angle=(e,p)=>{const dx=p.x-e.x,dy=p.y-(p.bodyHeight||58)*.76-(e.y-e.h*(e.kind==='archer'?.82:.6)),l=Math.hypot(dx,dy)||1;return {dx:dx/l,dy:dy/l};};
function warn(e,p,kind,duration){e.intent={kind,time:0,duration,...angle(e,p),x:p.x,y:p.y-22};e.attackTime=duration;}
function fire(m,e,kind,speed,color){const a=e.intent;m.projectiles.push({friendly:false,kind,x:e.x+a.dx*18,y:e.y-e.h*(e.kind==='archer'?.82:.6),vx:a.dx*speed,vy:a.dy*speed,life:2.8,damage:1,color});}
export function resolveTvFlyingSolids(m,e,old){
 let blocked=false;const half=e.w/2;
 for(const s of m.solids)if(!s.oneWay&&e.x+half>s.x&&e.x-half<s.x+s.w&&e.y>s.y&&e.y-e.h<s.y+s.h){
  blocked=true;
  if(old.x+half<=s.x+.5)e.x=s.x-half;
  else if(old.x-half>=s.x+s.w-.5)e.x=s.x+s.w+half;
  else if(old.y<=s.y+.5)e.y=s.y;
  else if(old.y-e.h>=s.y+s.h-.5)e.y=s.y+s.h+e.h;
  else{const edges=[{d:Math.abs(e.x+half-s.x),x:s.x-half},{d:Math.abs(s.x+s.w-e.x+half),x:s.x+s.w+half},{d:Math.abs(e.y-s.y),y:s.y},{d:Math.abs(s.y+s.h-e.y+e.h),y:s.y+s.h+e.h}].sort((a,b)=>a.d-b.d);if(edges[0].x!==undefined)e.x=edges[0].x;else e.y=edges[0].y;}
 }
 if(blocked){e.intent=null;e.recovery=.3;e.cooldown=Math.max(e.cooldown||0,1);e.vx=e.vy=0;}return blocked;
}
export function moveTvRosterEnemy(m,e,dt,target){
 const def=TV_NEW_ENEMIES[e.kind];if(!def)return null;
 e.brainAge=(e.brainAge||0)+dt;e.cooldown=Math.max(0,(e.cooldown||0)-dt);e.recovery=Math.max(0,(e.recovery||0)-dt);
 if(target)e.face=Math.sign(target.x-e.x)||e.face;
 const dx=target?Math.abs(target.x-e.x):999,dy=target?Math.abs(target.y-e.y):999;
 if(e.kind==='bat'||e.kind==='imp'){
  const before={x:e.x,y:e.y};
  e.flying=true;e.impFlightHeight=0;e.roostHeight=0;e.grounded=false;e.vy=0;
  if(target&&!e.intent&&e.cooldown<=0&&dx<480){warn(e,target,e.kind==='bat'?'swoop':'ember',e.kind==='bat'?.55:.8);e.cooldown=e.kind==='bat'?3.3:3.6;}
  if(e.intent){
   e.intent.time+=dt;
   if(e.intent.time>=e.intent.duration){
    if(e.kind==='imp'){fire(m,e,'ember',230,'#f1ac78');e.intent=null;e.recovery=.4;}
    else{const l=Math.hypot(e.intent.x-e.x,e.intent.y-e.y)||1;e.vx=(e.intent.x-e.x)/l*220;e.vy=(e.intent.y-e.y)/l*220;e.x+=e.vx*dt;e.y+=e.vy*dt;if(e.intent.time>1.35){e.intent=null;e.recovery=.4;}}
   }
  }else if(target){e.vx=clamp(target.x-e.x,-def.speed,def.speed);e.x+=e.vx*dt;e.y+=(clamp(target.y-105-e.y,-62,62)+Math.sin(m.time*3+e.phase)*13)*dt;}
  e.x=clamp(e.x,42,ARENA_WIDTH-42);e.y=clamp(e.y,105,ARENA_FLOOR-12);resolveTvFlyingSolids(m,e,before);return false;
 }
 e.vx=e.recovery>0?0:e.face*e.speed;
 if(e.kind==='slime'||e.kind==='frog'){
  if(e.grounded&&e.cooldown<=0&&target&&dx<620){warn(e,target,'hop',e.kind==='frog'?.38:.28);e.cooldown=e.kind==='frog'?2.2:1.6;}
  if(e.intent){e.vx=0;e.intent.time+=dt;if(e.intent.time>=e.intent.duration){e.vy=e.kind==='frog'?-610:-420;e.vx=e.face*(e.kind==='frog'?165:95);e.hopVelocity=e.vx;e.intent=null;e.grounded=false;}}
  if(!e.grounded&&e.hopVelocity)e.vx=e.hopVelocity;
 }
 if(e.kind==='boar'){
  if(!e.intent&&e.cooldown<=0&&dx<420&&dy<75&&target){warn(e,target,'charge',.7);e.cooldown=3.2;e.chargeFace=e.face;}
  if(e.intent){e.intent.time+=dt;e.vx=e.intent.time<e.intent.duration?0:e.chargeFace*310;if(e.intent.time>1.55){e.intent=null;e.recovery=.65;}}
 }
 if(e.kind==='spider'&&target&&dx<200&&dy<70&&e.cooldown<=0){warn(e,target,'pounce',.4);e.cooldown=2.5;}
 if(e.kind==='spider'&&e.intent){e.intent.time+=dt;e.vx=0;if(e.intent.time>=e.intent.duration){e.vx=e.face*240;e.vy=-230;e.intent=null;e.recovery=.3;}}
 if(e.kind==='snake'&&target&&dx<360&&dy<160&&e.cooldown<=0&&!e.intent){warn(e,target,'venom',.8);e.cooldown=3.2;}
 if(e.kind==='snake'&&e.intent){e.vx=0;e.intent.time+=dt;if(e.intent.time>=e.intent.duration){fire(m,e,'venom',220,'#b9d680');e.intent=null;e.recovery=.5;}}
 if(e.kind==='skeleton'){
  if(!e.intent&&e.cooldown<=0&&target&&dx<100&&dy<60){warn(e,target,'slash',.55);e.cooldown=1.7;}
  if(e.intent){e.vx=0;e.intent.time+=dt;if(e.intent.time>=e.intent.duration&&!e.intent.hit){e.intent.hit=true;e.attackTime=.3;for(const p of m.players.values())if(!p.menuPaused&&!p.tubeTransit&&Math.abs(p.x-e.x)<95&&Math.abs(p.y-e.y)<60&&Math.sign(p.x-e.x)===e.face)m.hurt(p);}
   if(e.intent.time>e.intent.duration+.2){e.intent=null;e.recovery=.45;}}
 }
 if(e.kind==='archer'){
  if(target&&e.ammo>0){e.vx=dx<135?-e.face*e.speed:dx>330?e.face*e.speed:0;
   if(!e.intent&&e.cooldown<=0&&dx<590&&dy<230){warn(e,target,'arrow',.95);e.cooldown=2.5;}
   if(e.intent){e.vx=0;e.intent.time+=dt;if(e.intent.time>=e.intent.duration){fire(m,e,'enemy-arrow',360,'#e7d4a5');e.ammo--;e.intent=null;e.recovery=.3;}}
  }else if(e.ammo<=0){
   const drop=m.supplyDrops.find(d=>d.kind==='arrow'&&d.life>0&&Math.abs(d.y-(e.y-24))<45&&Math.abs(d.x-e.x)<170);
   if(drop){e.vx=Math.sign(drop.x-e.x)*e.speed;if(Math.abs(drop.x-e.x)<24){drop.life=0;e.ammo++;}}
  }
 }
 const blocked=moveArenaBody(e,dt,m.solids,ARENA_WIDTH,{half:e.w/2,height:e.h});
 if(blocked){e.hopVelocity=0;if(e.kind==='boar'){e.intent=null;e.recovery=.65;}}
 return blocked;
}
export function tvEnemyAnimation(e){
 if(!TV_NEW_ENEMIES[e.kind])return null;
 if(!e.alive)return 'death';if(e.emerging>0)return 'emerge';if(e.hit>0)return 'hurt';
 if(e.kind==='bat')return e.intent?(e.intent.time<e.intent.duration?'windup':'dive'):e.recovery>0?'recover':'fly';if(e.kind==='imp')return e.intent?'cast':'fly';
 if(e.kind==='snake')return e.intent?'coil':Math.abs(e.vx)>1?'slither':'idle';
 if(e.kind==='boar'&&e.intent)return e.intent.time<e.intent.duration?'windup':'charge';
 if(e.kind==='archer')return e.intent?'draw':e.vx?'walk':'idle';
 if(e.kind==='skeleton')return e.intent&&e.intent.hit?'slash':e.vx?'walk':'idle';
 if(e.intent)return e.intent.kind==='hop'||e.intent.kind==='pounce'?'idle':'attack';
 if(!e.grounded&&['slime','spider'].includes(e.kind))return 'run';if(!e.grounded&&e.kind==='frog')return 'jump';return Math.abs(e.vx)>1?'walk':'idle';
}

// Bind non-looping native clips to the same timers that drive arena attacks.
export function tvEnemyPoseTime(e){
 const unit=n=>clamp(n,0,1);
 if(!e.alive)return unit((e.deathAge||0)/.4);
 if(e.hit>0)return unit(1-e.hit/.25);
 const intent=e.intent;
 if(!intent)return undefined;
 if(e.kind==='skeleton')return intent.hit?unit((intent.time-intent.duration)/.2):undefined;
 if(e.kind==='boar'&&intent.time>=intent.duration)return unit((intent.time-intent.duration)/.85);
 if(e.kind==='bat'&&intent.time>=intent.duration)return unit((intent.time-intent.duration)/.8);
 if(['archer','imp','snake','boar','bat'].includes(e.kind))return unit(intent.time/intent.duration);
 return undefined;
}
