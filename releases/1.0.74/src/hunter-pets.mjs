import {hasSetSkill,take} from './items.mjs';
import {creatures} from './definitions.mjs';
import {navigateEnemy,clearShot,collisionOffset} from './navigation.mjs';
import {tickJump} from './jumping.mjs';
import {damageEnemy} from './enemy-damage.mjs';
import {nearbyRoost,moveBatToRoost} from './bat-roost.mjs';
import {companionMovement} from './companion-locomotion.mjs';

export const TAMABLE_KINDS=['lion','wolf','bat','panther','tiger'];
export const hunterPets=g=>g.players.filter(p=>!p.room).flatMap(p=>[p.hunterPet,p.ritualPet]).filter(Boolean);
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export function petRecord(pet){
 if(!pet||!TAMABLE_KINDS.includes(pet.kind))return null;
 return Object.fromEntries(['kind','name','collar','hp','maxHp','damage','speed','downedRemaining'].map(k=>[k,pet[k]]));
}
export function restoreHunterPet(record){
 if(!record||!TAMABLE_KINDS.includes(record.kind))return null;
 const cfg=creatures[record.kind]?.stats||{};
 const maxHp=Math.max(100,Math.round((cfg.hp||60)*1.5));
 return {kind:record.kind,name:String(record.name||record.kind).slice(0,24),collar:/^#[0-9a-f]{6}$/i.test(record.collar)?record.collar:'#77bc87',
  maxHp,hp:Math.max(0,Math.min(maxHp,Number.isFinite(record.hp)?record.hp:maxHp)),damage:Math.max(16,Math.round((cfg.damage||10)*1.4)),speed:Math.max(145,(cfg.speed||80)*1.2),
  downedRemaining:record.hp<=0?Math.max(0,Math.min(60,record.downedRemaining??60)):undefined,
  hunterPet:true,faction:'ally',equipment:{},inventory:[],state:'idle',step:0,faceX:0,faceY:1,cooldown:0};
}
export function nearestTamable(g,p){
 const spirit=(g.ghosts||[]).filter(a=>a.ritualTiger&&a.wildTiger&&a.hp>0&&((p.room&&a.room===p.room)?Math.hypot(a.roomX-p.roomX,a.roomY-p.roomY):(!p.room&&!a.room?distance(a,p):Infinity))<=90).sort((a,b)=>((p.room&&a.room===p.room)?Math.hypot(a.roomX-p.roomX,a.roomY-p.roomY):distance(a,p))-((p.room&&b.room===p.room)?Math.hypot(b.roomX-p.roomX,b.roomY-p.roomY):distance(b,p)))[0];
 const animal=p.room?null:g.enemies.filter(e=>e.hp>0&&!e.defeated&&creatures[e.kind]?.tamable&&distance(e,p)<=90&&clearShot(g,p,e)).sort((a,b)=>distance(a,p)-distance(b,p))[0];
 return spirit&&(!animal||((p.room&&spirit.room===p.room)?Math.hypot(spirit.roomX-p.roomX,spirit.roomY-p.roomY):distance(spirit,p))<distance(animal,p))?spirit:animal;
}
export function tamePet(g,p,target=nearestTamable(g,p)){
 if(!hasSetSkill(p,'tame_pet')){g.message('Equip all five Ranger pieces to use Tame.');return false;}
 if(p.hp<=0)return false;
 if(p.hunterPet){g.message('This hero already has a companion.');return false;}
 if(target?.ritualTiger&&target.wildTiger&&g.ghosts?.includes(target)){
  const d=p.room&&target.room===p.room?Math.hypot(target.roomX-p.roomX,target.roomY-p.roomY):!p.room&&!target.room?distance(p,target):Infinity;
  if(d>90){g.message('Get closer to the ghost tiger to tame it.');return false;}
  const pet=restoreHunterPet({kind:'tiger',name:'Ghost Tiger',collar:p.color});
  Object.assign(pet,{id:g.nextId++,owner:p.id,x:target.x,y:target.y,hp:pet.maxHp,spiritGhost:true,ghost:true,room:target.room,roomX:target.roomX,roomY:target.roomY});
  g.ghosts=g.ghosts.filter(a=>a!==target);p.hunterPet=pet;g.message('The ghost tiger accepts your call and becomes your companion.');g.onSound('magic',pet);g.persist();return true;
 }
 if(p.room)return false;
 if(!target||!g.enemies.includes(target)||!creatures[target.kind]?.tamable||target.hp<=0||distance(p,target)>90||!clearShot(g,p,target)){g.message('Approach a living lion, wolf, bat, panther, or tiger to tame it.');return false;}
 const pet=restoreHunterPet({kind:target.kind,name:target.kind[0].toUpperCase()+target.kind.slice(1),collar:p.color});
 Object.assign(pet,{id:g.nextId++,owner:p.id,x:target.x,y:target.y,hp:pet.maxHp});
 p.hunterPet=pet;g.enemies=g.enemies.filter(e=>e!==target);
 // Transfer embedded arrows without awarding a kill or any loot.
 for(const arrow of g.arrows||[])if(arrow.enemy===target.id)arrow.remove=true;
 g.message(`${pet.name} is your companion. Use Companion care to name and feed it.`);g.onSound('heal',pet);g.persist();return true;
}
export function renamePet(g,p,name,collar){
 if(!p.hunterPet)return false;
 const clean=String(name).trim().replace(/[\x00-\x1f]/g,'').slice(0,24);if(!clean)return false;
 p.hunterPet.name=clean;
 if(/^#[0-9a-f]{6}$/i.test(collar))p.hunterPet.collar=collar;
 g.persist();return true;
}
export function feedPet(g,p){
 const pet=p.hunterPet;if(!pet||pet.hp<=0||p.hp<=0||distance(p,pet)>80)return false;
 const food=pet.kind==='bat'?'fruit':'meat';
 if(!(g.onPetFeed?g.onPetFeed(p,food):take(p.inventory,food))){g.message(`${pet.name} needs ${food}${food==='fruit'?' bait':''}.`);return false;}
 pet.hp=Math.min(pet.maxHp,pet.hp+pet.maxHp*.35);pet.heartTime=2;
 g.effects.push({x:pet.x,y:pet.y-35,text:'♥',color:'#ff9eaf',life:2});g.onSound('heal',pet);g.persist();return true;
}
export function petPvPEvent(g,victim,source){
 if(!g.pvp||victim.hunterPet===true||source?.hunterPet===true)return;
 const attacker=g.players.find(p=>p===source||p.id===source?.owner);
 if(!attacker||attacker===victim||!g.players.includes(victim))return;
 if(victim.hunterPet)victim.hunterPet.pvpTarget=attacker.id;
 if(attacker.hunterPet)attacker.hunterPet.pvpTarget=victim.id;
}
export function hurtPet(g,pet,amount){
 if(pet.hp<=0||pet.invuln>0)return;
 pet.hp=Math.max(0,pet.hp-Math.max(1,amount));pet.invuln=.5;pet.hit=.2;pet.lastFight=g.time;
 if(!pet.hp){pet.moving=false;pet.animationAction=null;pet.roostHeight=0;pet.revive=0;pet.downedRemaining=60;g.message(`${pet.name} is down! Hold Interact nearby within 60 seconds to revive.`);g.persist();}
}
function placeNearOwner(g,p,pet){
 for(let n=0;n<16;n++){const a=n*Math.PI/8,x=p.x+Math.cos(a)*35,y=p.y+Math.sin(a)*35;
  if(!g.blocked(x,y,8,pet.kind==='bat',false,false,collisionOffset(g,pet))){pet.x=x;pet.y=y;return;}}
 pet.x=p.x;pet.y=p.y;
}
export function tickHunterPets(g,dt,inputs={}){
 tickRitualPets(g,dt);
 for(const p of g.players){
  const pet=p.hunterPet;if(!pet)continue;
  pet.hunterPet=true;pet.owner=p.id;pet.id??=g.nextId++;pet.equipment??={};pet.inventory??=[];
  if(!Number.isFinite(pet.x)||!Number.isFinite(pet.y))placeNearOwner(g,p,pet);
  const finish=companionMovement(pet,dt);
  try{
  pet.invuln=Math.max(0,(pet.invuln||0)-dt);pet.hit=Math.max(0,(pet.hit||0)-dt);pet.attack=Math.max(0,(pet.attack||0)-dt);pet.cooldown=Math.max(0,(pet.cooldown||0)-dt);pet.heartTime=Math.max(0,(pet.heartTime||0)-dt);
  if(pet.hp<=0){
   pet.downedRemaining=Math.max(0,(pet.downedRemaining??60)-dt);
   if(pet.downedRemaining===0){g.message(`${pet.name} was lost. Equip the Ranger set to tame a new companion.`);p.hunterPet=null;g.persist();continue;}
   pet.animationAction=null;pet.moving=false;
   const helper=g.players.find(q=>q.hp>0&&!q.room&&distance(q,pet)<55&&inputs[q.device]?.interact&&!q.ui);
   pet.revive=helper?(pet.revive||0)+dt:Math.max(0,(pet.revive||0)-dt);
   if(helper)helper.reviveAnimation=.15;
   if(pet.revive>=1.6){pet.hp=Math.ceil(pet.maxHp*.4);pet.downedRemaining=undefined;pet.revive=0;pet.invuln=2;pet.heartTime=2;g.onSound('heal',pet);g.persist();}
   continue;
  }
  if(p.room){if(pet.spiritGhost&&p.room==='temple-upper'){const tx=p.roomX-(p.faceX||0)*25,ty=p.roomY-(p.faceY||1)*10,dx=tx-(pet.roomX??tx),dy=ty-(pet.roomY??ty),d=Math.hypot(dx,dy)||1;pet.room=p.room;pet.moving=d>4;if(pet.moving){pet.roomX+=(dx/d)*Math.min(d,pet.speed*dt);pet.roomY+=(dy/d)*Math.min(d,pet.speed*dt);}}pet.moving=pet.spiritGhost?pet.moving:false;pet.pvpTarget=null;continue;}
  const moved=pet.ownerX===undefined?0:Math.hypot(p.x-pet.ownerX,p.y-pet.ownerY);
  pet.ownerIdle=moved>.1||p.attack>0||p.charge>0?0:(pet.ownerIdle||0)+dt;pet.ownerX=p.x;pet.ownerY=p.y;
  if(distance(p,pet)>320){placeNearOwner(g,p,pet);pet.pvpTarget=null;}
  const rival=g.players.find(q=>q.id===pet.pvpTarget);
  if(!g.pvp||!rival||rival.hp<=0||rival.room||distance(p,rival)>220||p.hp<=0)pet.pvpTarget=null;
  const hostile=g.enemies.filter(e=>e.hp>0&&!e.practiceTarget&&e.faction!=='ally'&&e.faction!=='neutral'&&creatures[e.kind]?.faction!=='neutral'&&distance(p,e)<180);
  const target=p.hp>0?(pet.pvpTarget?rival:hostile.sort((a,b)=>distance(pet,a)-distance(pet,b))[0]):null;
  pet.animationAction=null;pet.roostHeight=0;pet.moving=false;
  if(target&&distance(pet,p)<220){
   pet.lastFight=g.time;pet.ownerIdle=0;
   const d=distance(pet,target)||1;pet.faceX=(target.x-pet.x)/d;pet.faceY=(target.y-pet.y)/d;
   if(d>28){if(pet.kind==='bat')g.moveActor(pet,pet.faceX*pet.speed*dt,pet.faceY*pet.speed*dt,true);else navigateEnemy(g,pet,target,dt);}
   if(d<42&&pet.cooldown===0&&clearShot(g,pet,target)){
    if(g.players.includes(target))g.hurt(target,pet.damage,pet);
    else {damageEnemy(target,pet.damage);target.killedBy=p.id;target.aggro=true;}
    pet.cooldown=.85;pet.attack=.34;pet.animationAction=pet.kind==='bat'?'dive':'bite';g.onSound('hit',target);
   }
  }else{
   if((g.time||0)-(pet.lastFight??-10)>5)pet.hp=Math.min(pet.maxHp,pet.hp+pet.maxHp*.01*dt);
   const idle=pet.ownerIdle>=30,angle=(pet.id||0)*1.7+Math.floor((g.time||0)/6)*.9;
   const spot=pet.kind==='bat'?{x:p.x-(p.faceX||0)*18+12,y:p.y-(p.faceY||1)*18}:{x:p.x+(idle?28:Math.cos(angle)*42),y:p.y+(idle?6:Math.sin(angle)*28)};
   if(pet.kind==='bat'&&idle){
    pet.roostScan=(pet.roostScan||0)-dt;
    if(pet.roostScan<=0){pet.roostPoint=nearbyRoost(g,p,120);pet.roostScan=.5;}
    if(pet.roostPoint){moveBatToRoost(g,pet,pet.roostPoint,dt);continue;}
   }
   const d=distance(pet,spot);
   if(d>7){
    if(pet.kind==='bat'){pet.faceX=(spot.x-pet.x)/d;pet.faceY=(spot.y-pet.y)/d;g.moveActor(pet,pet.faceX*Math.min(d,pet.speed*dt),pet.faceY*Math.min(d,pet.speed*dt),true);}
    else navigateEnemy(g,pet,spot,dt);
   }else{pet.faceX=p.x-pet.x;pet.faceY=p.y-pet.y;pet.animationAction=idle&&pet.kind!=='bat'?'sit':null;}
   pet.happyClock=(pet.happyClock||0)+dt;
   if(pet.happyClock>=9){pet.happyClock=0;g.effects.push({x:pet.x,y:pet.y-36,text:'☺',color:'#ffe9a1',life:1.5});}
  }
  if(pet.kind!=='bat')tickJump(pet,dt,g,collisionOffset(g,pet));
  }finally{finish();}
 }
}
export function tickRitualPets(g,dt){
 for(const p of g.players){
  if(![p.equipment?.hand1,p.equipment?.hand2].includes('ritual_dagger')||p.hp<=0){delete p.ritualPet;continue;}
  const pet=p.ritualPet??=Object.assign(restoreHunterPet({kind:'tiger',name:'Ghost Tiger',collar:p.color}),{id:g.nextId++,owner:p.id,spiritGhost:true,ritualPet:true,x:p.x,y:p.y});
  const finish=companionMovement(pet,dt);
  try{
  pet.attack=Math.max(0,(pet.attack||0)-dt);pet.cooldown=Math.max(0,(pet.cooldown||0)-dt);
  pet.room=p.room||null;
  if(p.room){
   pet.roomX=p.roomX+24;pet.roomY=p.roomY+10;pet.faceX=p.faceX;pet.faceY=p.faceY;pet.moving=!!p.roomMoving;pet.step=(pet.step||0)+(pet.moving?dt*12:0);
   const foe=(g.ghosts||[]).find(a=>a.wildTiger&&a.hp>0&&a.room===p.room&&(a.killedBy===p.id||a.attack>0)&&Math.hypot(a.roomX-p.roomX,a.roomY-p.roomY)<80);
   if(foe&&pet.cooldown<=0){damageEnemy(foe,pet.damage,'spectral');pet.attack=.34;pet.cooldown=.85;}
   pet.state='hunt';pet.animationAction=pet.attack>0?'bite':null;continue;
  }
  if(distance(p,pet)>240)placeNearOwner(g,p,pet);
  const target=g.enemies.filter(e=>e.hp>0&&!e.defeated&&e.faction!=='ally'&&e.faction!=='neutral'&&distance(p,e)<200&&(e.killedBy===p.id||e.id===p.ritualAttackerId)).sort((a,b)=>distance(pet,a)-distance(pet,b))[0];
  const goal=target||{x:p.x-(p.faceX||0)*40,y:p.y-(p.faceY||1)*40},d=distance(pet,goal)||1;
  pet.moving=false;pet.faceX=(goal.x-pet.x)/d;pet.faceY=(goal.y-pet.y)/d;
  if(d>(target?30:8))navigateEnemy(g,pet,goal,dt);
  if(target&&d<45&&pet.cooldown<=0&&clearShot(g,pet,target)){damageEnemy(target,pet.damage,'spectral');target.killedBy=p.id;pet.attack=.34;pet.cooldown=.85;g.onSound('hit',target);}
  pet.state='hunt';pet.timer=pet.attack;pet.animationAction=pet.attack>0?'bite':null;
  }finally{finish();}
 }
}
