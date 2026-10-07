import {creatures} from './definitions.mjs';
import {ITEMS,stat,itemKind} from './items.mjs';
import {clearShot} from './navigation.mjs';
import {BOUNDLESS_SAFE_RADIUS} from './boundless-world.mjs';
import {PEACEFUL_FAUNA_KINDS,WILD_FAUNA_KINDS,WILD_FAUNA_LIMIT} from './wild-fauna-data.mjs';
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const hash=(x,y)=>{const n=Math.sin(x*127.1+y*311.7)*43758.5453;return n-Math.floor(n);};
export function holdsThreateningWeapon(p){return ['hand1','hand2'].some(slot=>{const id=p.equipment?.[slot];return id!=='occupied'&&!!ITEMS[id]&&(ITEMS[id].damage>0||['bow','gun','rifle','wand','staff','torch','whip'].includes(itemKind(id)));});}
const species=env=>['forest','temple'].includes(env)?['mother_deer','stag','baby_deer','mother_deer','baby_deer','pig','pig_spotted']:env==='beach'?['pig','pig_spotted']:env==='desert'?['scorpion','scorpion','scorpion','scorpion']:env==='ice'?['arctic_fox','arctic_fox','arctic_fox']:[];
/** Lazy generation on first exploration keeps the board's opening clear.
 * Seeded once per expedition, saved with normal actors. No respawn timer,
 * hidden per-frame population growth or dependence on rendering/camera depth.
 */
export function seedWildFauna(g,force=false){
 const env=g.generatedEnvironment,signature=env+':'+g.seed;
 if(g.wildFaunaState?.signature===signature&&g.wildFaunaState.seeded)return 0;
 if(!force&&(g.phase!=='play'||g.openingBoard||!(g.players||[]).some(p=>p.hp>0&&!p.room&&distance(p,{x:800,y:800})>360)))return 0;
 const kinds=species(env),old=g.enemies.filter(e=>e.wildlife&&WILD_FAUNA_KINDS.includes(e.kind));
 g.wildFaunaState={version:1,signature,seeded:true,ids:old.slice(0,WILD_FAUNA_LIMIT).map(e=>e.id)};
 if(old.length||!kinds.length)return 0;
 let family=null,mother=null,count=0;
 for(const [i,kind]of kinds.slice(0,WILD_FAUNA_LIMIT).entries()){
  let spot=null;
  for(let n=0;n<220;n++){
   const nearby=family&&(kind==='baby_deer'||i===1)&&n<16;
   const x=nearby?family.x+Math.cos(i*2+n)*38:80+hash(g.seed+n+i*149,44)*1440;
   const y=nearby?family.y+Math.sin(i*2+n)*38:80+hash(g.seed+n+i*149,91)*1440;
   const clearance=g.mapMode==='boundless'&&!PEACEFUL_FAUNA_KINDS.includes(kind)?BOUNDLESS_SAFE_RADIUS+36:420;
   if(distance({x,y},{x:800,y:800})<clearance||g.house?.floors?.some(r=>x>=r.x-35&&x<r.x+r.w+35&&y>=r.y-35&&y<r.y+r.h+35)||g.blocked(x,y,14,false,false,false,0))continue;
   if(g.enemies.some(e=>e.hp>0&&distance(e,{x,y})<26))continue;spot={x,y};break;
  }
  if(!spot)continue;
  const cfg=creatures[kind],e={...spot,id:g.nextId++,kind,skin:kind,wildlife:true,faction:cfg.faction,hp:cfg.stats.hp,maxHp:cfg.stats.hp,speed:cfg.stats.speed,damage:cfg.stats.damage,state:'graze',timer:0,cooldown:1,flash:0,frozen:0,attack:0,step:0,moving:false,faceX:0,faceY:1,homeX:spot.x,homeY:spot.y,wildLastHp:cfg.stats.hp,wanderIn:0};
  if(kind==='mother_deer'){mother=e;family=spot;}
  if(kind==='baby_deer')e.motherId=mother?.id;
  g.configureCreature(e,false);g.enemies.push(e);g.wildFaunaState.ids.push(e.id);count++;
 }
 return count;
}
function move(g,e,target,dt,speed){
 const dx=target.x-e.x,dy=target.y-e.y,d=Math.hypot(dx,dy);if(d<3)return;
 const length=Math.min(d,speed*dt),ox=e.x,oy=e.y;let travel=g.moveActor(e,dx/d*length,dy/d*length);
 // Short local steering avoids an expensive new path cache for each fawn.
 if(travel<length*.2){const side=(e.id%2?1:-1);travel+=g.moveActor(e,-dy/d*length*side,dx/d*length*side);}
 if(travel>0){const t=Math.hypot(e.x-ox,e.y-oy)||1;e.faceX=(e.x-ox)/t;e.faceY=(e.y-oy)/t;e.moving=true;}
}
function wander(g,e,dt,speed){
 e.homeX??=e.x;e.homeY??=e.y;e.wanderIn=(e.wanderIn||0)-dt;
 if(e.wanderIn<=0){const a=hash(e.id,(g.time||0)+13)*Math.PI*2;e.wanderX=e.homeX+Math.cos(a)*70;e.wanderY=e.homeY+Math.sin(a)*50;e.wanderIn=4+hash(e.id,g.time||0)*4;}
 if(e.wanderIn>2)move(g,e,{x:e.wanderX??e.x,y:e.wanderY??e.y},dt,speed);
}
export function tickWildFauna(g,e,dt,targets=[]){
 if(!WILD_FAUNA_KINDS.includes(e.kind))return false;
 if(e.hp<=0)return true;
 e.moving=false;e.attack=Math.max(0,(e.attack||0)-dt);e.flash=Math.max(0,(e.flash||0)-dt);e.frozen=Math.max(0,(e.frozen||0)-dt);e.cooldown=Math.max(0,(e.cooldown||0)-dt);
 const injured=e.hp<(e.wildLastHp??e.hp);e.wildLastHp=e.hp;
 if(e.frozen>0)return true;
 if(e.state==='snared'){e.timer-=dt;if(e.timer<=0)e.hp=0;return true;}
 const trap=g.traps.find(t=>t.life>0&&distance(t,e)<27);
 if(trap&&trap.variant!=='slow'){trap.life=0;e.state=trap.variant==='interrupt'?'recover':'snared';e.timer=2;e.attack=0;e.pendingSting=false;g.onSound('trap',e);return true;}
 if(e.state==='recover'){e.timer-=dt;if(e.timer<=0)e.state='graze';return true;}
 if(PEACEFUL_FAUNA_KINDS.includes(e.kind)){
  const armed=g.players.filter(p=>p.hp>0&&!p.room&&holdsThreateningWeapon(p)&&distance(e,p)<240).sort((a,b)=>distance(e,a)-distance(e,b))[0];
  if(armed||injured){e.fleeTime=3;e.fleeFromX=armed?.x??e.x-e.faceX*30;e.fleeFromY=armed?.y??e.y-e.faceY*30;}
  e.fleeTime=Math.max(0,(e.fleeTime||0)-dt);
  if(e.fleeTime>0){const dx=e.x-e.fleeFromX,dy=e.y-e.fleeFromY,d=Math.hypot(dx,dy)||1;e.state='flee';move(g,e,{x:e.x+dx/d*80,y:e.y+dy/d*80},dt,e.speed);return true;}
  e.state='graze';const mother=e.kind==='baby_deer'&&g.enemies.find(a=>a.id===e.motherId&&a.hp>0);
  if(mother&&distance(e,mother)>45)move(g,e,mother,dt,38);else wander(g,e,dt,13);
  return true;
 }
 const target=targets.filter(p=>p.hp>0&&!p.room).sort((a,b)=>distance(e,a)-distance(e,b))[0];
 const scorpion=e.kind==='scorpion',range=scorpion?44:40,d=target?distance(e,target):Infinity;
 if(injured)e.wildAggroUntil=(g.time||0)+5;
 if(e.state==='sting'||e.state==='bite'){
  e.timer-=dt;
  if(e.timer<=0){
   for(const p of targets){const dist=distance(e,p)||1;if(p.hp<=0||p.room||(p.jumpHeight||0)>18||dist>range||((p.x-e.x)*e.attackX+(p.y-e.y)*e.attackY)/dist<.3||!clearShot(g,e,p))continue;
    const hp=p.hp;g.hurt(p,e.damage,e);
    if(scorpion&&p.hp<hp&&p.hp>0){const resistance=Math.max(0,1-stat(p,'poisonResist'));p.poison=Math.max(p.poison||0,3*resistance);p.poisonDamage=1;p.poisonTick=1;}
   }
   e.attack=.22;e.state='recover';e.timer=scorpion?.7:.5;e.cooldown=scorpion?1.9:1.4;
  }return true;
 }
 if(target&&d<range&&e.cooldown<=0&&clearShot(g,e,target)){
  e.state=scorpion?'sting':'bite';e.timer=scorpion?.6:.45;e.attackX=(target.x-e.x)/(d||1);e.attackY=(target.y-e.y)/(d||1);e.faceX=e.attackX;e.faceY=e.attackY;return true;
 }
 const provoked=(e.wildAggroUntil||0)>(g.time||0);
 if(target&&d<(scorpion?150:provoked?240:85)&&distance(e,{x:e.homeX??e.x,y:e.homeY??e.y})<260){e.state='hunt';move(g,e,target,dt,e.speed);}
 else{e.state='graze';wander(g,e,dt,scorpion?9:19);}
 return true;
}
export function drawWildFaunaTells(c,g,visible){
 for(const e of g.enemies){if(e.hp<=0||!['sting','bite'].includes(e.state)||!WILD_FAUNA_KINDS.includes(e.kind)||!visible(e))continue;
  c.save();c.translate(e.x,e.y);c.rotate(Math.atan2(e.attackY,e.attackX));c.fillStyle='#ed865343';c.strokeStyle=e.frozen>0?'#b4efff':'#ffbd7a';c.lineWidth=1;c.beginPath();c.moveTo(0,0);c.arc(0,0,e.kind==='scorpion'?44:40,-.72,.72);c.closePath();c.fill();c.stroke();c.restore();
 }
}
