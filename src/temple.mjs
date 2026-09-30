import {drawParticleEffect} from './particles.mjs';
import {clearShot,navigateEnemy} from './navigation.mjs';
import {damageEnemy} from './enemy-damage.mjs';
import {tickJump} from './jumping.mjs';
export const TEMPLE_STAIRS={x:1040,y:590};
export function templeLayout(){
 return {temple:true,floors:[{x:480,y:450,w:640,h:670}],paths:[],pools:[],trees:[],rooms:[{name:'THE JADE SANCTUM',x:800,y:510}],furniture:[],doors:[{x:752,y:1104,w:96,h:16,open:true}],walls:[{x:480,y:450,w:640,h:24},{x:480,y:450,w:24,h:670},{x:1096,y:450,w:24,h:670},{x:480,y:1104,w:272,h:16},{x:848,y:1104,w:272,h:16},...[[560,560],[984,560],[560,960],[984,960]].map(([x,y])=>({x,y,w:40,h:40}))]};
}
export function ensureTemple(g){
 if(g.generatedEnvironment!=='temple')return;
 g.templeChest??=[{type:'ritual_dagger',qty:1},...Array(23).fill(null)];
 if(!g.portals.some(d=>d.temple))g.portals.push({id:'temple-upper',temple:true,...TEMPLE_STAIRS,owner:null,closing:null,entryReady:[]});
}
export function templeRoomStep(g,p,i,dt){
 const d=g.portals.find(d=>d.id===p.room);if(!d?.temple)return false;
 const x=p.roomX,y=p.roomY;p.roomX=Math.max(28,Math.min(292,x+(i.x||0)*90*dt));p.roomY=Math.max(48,Math.min(214,y+(i.y||0)*90*dt));p.roomMoving=x!==p.roomX||y!==p.roomY;p.roomStep=(p.roomStep||0)+Math.hypot(p.roomX-x,p.roomY-y)*.13;
 if(p.roomMoving){const len=Math.hypot(p.roomX-x,p.roomY-y);p.faceX=(p.roomX-x)/len;p.faceY=(p.roomY-y)/len;}
 if(p.roomY>202&&Math.abs(p.roomX-160)<24){g.leaveRoom(p);return true;}
 const nearChest=Math.hypot(p.roomX-160,p.roomY-78)<68;
 if(i.interact&&!p.previousInput?.interact&&nearChest){g.openInventory(p,'temple');g.onSound('inventory',p);g.message('Ritual chest opened.');}
 return true;
}
export function summonGhost(g,e){
 const owner=g.players.find(p=>p.id===e.killedBy);if(!owner||!e.ritualKill||e.ghost)return;
 g.ghosts??=[];const owned=g.ghosts.filter(a=>a.owner===owner.id&&!a.pet);if(owned.length>=3)g.ghosts=g.ghosts.filter(a=>a!==owned[0]);
 g.ghosts.push({...e,id:g.nextId++,owner:owner.id,faction:'ally',ghost:true,hp:1,life:30,cooldown:0,damage:Math.min(30,Math.max(8,e.damage||10)),speed:100,state:'hunt',attack:0,defeated:false,deathTimer:0,frozen:0,burning:0,rooted:0,stun:0,sink:0,timer:0,step:0,moving:false,jumpHeight:0,jumpVelocity:0,animationAction:null});g.onSound('magic',e);
}
export function summonNecromancerPet(g,owner){
 if(!owner||owner.hp<=0||owner.room)return false;
 g.ghosts??=[];
 if(g.ghosts.some(a=>a.pet&&a.owner===owner.id&&a.hp>0)){g.message('Your skeleton is already beside you.');return false;}
 const faceX=owner.faceX||1,faceY=owner.faceY||0;
 const pet={id:g.nextId++,kind:'skeleton',owner:owner.id,pet:true,faction:'ally',ghost:true,hp:120,maxHp:120,life:Infinity,cooldown:0,damage:20,speed:78,state:'hunt',attack:0,x:owner.x-faceX*38,y:owner.y-faceY*38,faceX,faceY,equipment:{hand1:'sword'},moving:false,step:0};
 g.ghosts.push(pet);owner.necromancerCooldown=18;g.message('Raise Skeleton: your sword-wielding companion answers the call.');g.onSound('magic',pet);return true;
}
export function tickGhosts(g,dt){
 for(const a of g.ghosts||[]){a.life-=dt;a.cooldown=Math.max(0,a.cooldown-dt);a.attack=Math.max(0,(a.attack||0)-dt);tickJump(a,dt,g);const owner=g.players.find(p=>p.id===a.owner);if(!owner||owner.hp<=0||owner.room){a.moving=false;continue;}
 const candidates=g.enemies.filter(e=>e.hp>0&&e.faction!=="ally"&&e.faction!=="neutral"&&Math.hypot(e.x-owner.x,e.y-owner.y)<=(a.pet?180:260));
 const target=candidates.sort((x,y)=>Math.hypot(x.x-a.x,x.y-a.y)-Math.hypot(y.x-a.x,y.y-a.y))[0];
 const siblings=g.ghosts.filter(q=>q.owner===owner.id),index=siblings.indexOf(a),angle=index*Math.PI*2/Math.max(3,siblings.length);
 const goal=target||{x:owner.x+Math.cos(angle)*46,y:owner.y+Math.sin(angle)*46};
 const d=Math.hypot(goal.x-a.x,goal.y-a.y)||1;a.faceX=(goal.x-a.x)/d;a.faceY=(goal.y-a.y)/d;a.moving=false;
 if(d>(target?38:12)){
   if(clearShot(g,a,goal))g.moveActor(a,a.faceX*Math.min(d,a.speed*dt),a.faceY*Math.min(d,a.speed*dt));
   if(!a.moving)navigateEnemy(g,a,goal,dt);
 }
 if(target&&d<60&&a.cooldown<=0&&clearShot(g,a,target)){damageEnemy(target,a.damage,'spectral');target.ritualKill=false;target.killedBy=null;target.flash=.2;a.attack=.3;a.cooldown=1;g.onSound('magic',a);}
 a.state=a.attack>0?'charge':'hunt';a.timer=a.attack;a.animationAction=a.attack>0?'attack':a.moving?'walk':'idle';
 }g.ghosts=(g.ghosts||[]).filter(a=>a.life>0&&a.hp>0);
}
export function tickGorilla(g,e,dt){
 if(e.kind!=='gorilla')return false;e.cooldown=Math.max(0,(e.cooldown||0)-dt);e.attack=Math.max(0,(e.attack||0)-dt);e.flash=Math.max(0,(e.flash||0)-dt);
 const p=g.players.filter(p=>p.hp>0&&!p.room).sort((a,b)=>Math.hypot(a.x-e.x,a.y-e.y)-Math.hypot(b.x-e.x,b.y-e.y))[0];if(!p){e.moving=false;return true;}
 const d=Math.hypot(p.x-e.x,p.y-e.y)||1;e.faceX=(p.x-e.x)/d;e.faceY=(p.y-e.y)/d;
 if(e.state==='windup'){e.timer-=dt;if(e.timer<=0){e.attack=.5;for(const q of g.players)if(!q.room&&q.hp>0&&Math.hypot(q.x-e.x,q.y-e.y)<105&&clearShot(g,e,q))g.hurt(q,26,e);e.state='recover';e.timer=1.1;e.cooldown=2.5;g.onSound('hit',e);}return true;}
 if(e.state==='recover'){e.timer-=dt;if(e.timer<=0)e.state='hunt';return true;}
 if(d<100&&e.cooldown<=0&&clearShot(g,e,p)){e.state='windup';e.timer=.85;e.moving=false;return true;}navigateEnemy(g,e,p,dt);return true;
}
export function drawGorilla(c,a,time){c.save();c.translate(a.x,a.y);const swing=a.moving?Math.sin(time*8)*5:0;c.fillStyle='#202b28';c.fillRect(-25,-50,50,42);c.fillRect(-38,-42+swing,17,44);c.fillRect(21,-42-swing,17,44);c.fillRect(-22,-10,17,23);c.fillRect(5,-10,17,23);c.fillStyle='#68716b';c.fillRect(-17,-39,34,28);c.fillStyle='#303c34';c.fillRect(-20,-65,40,30);c.fillStyle='#999681';c.fillRect(-14,-55,28,20);c.fillStyle='#161e19';c.fillRect(-10,-51,6,4);c.fillRect(4,-51,6,4);c.fillRect(-6,-41,12,4);c.fillStyle='#d6b651';c.fillRect(-22,-65,44,5);for(let x=-18;x<=18;x+=9)c.fillRect(x,-72,5,9);if(a.state==='windup'){c.strokeStyle='#f7b362';c.lineWidth=3;c.beginPath();c.arc(0,0,100,0,Math.PI*2);c.stroke();}c.restore();}
export function drawTemple(c,g,animator){
 if(g.generatedEnvironment==='temple'){
  c.save();
  // Stepped stone borders and geometric jade inlays frame the temple halls.
  for(const wall of g.house.walls){c.fillStyle='#697859';c.fillRect(wall.x,wall.y,wall.w,wall.h);c.strokeStyle='#bbc392';c.lineWidth=2;for(let x=wall.x;x<wall.x+wall.w;x+=24)for(let y=wall.y;y<wall.y+wall.h;y+=16)c.strokeRect(x,y,Math.min(24,wall.x+wall.w-x),Math.min(16,wall.y+wall.h-y));}
  for(const x of [518,1082])for(let y=490;y<1100;y+=48){c.strokeStyle='#c5ae62';c.lineWidth=2;c.strokeRect(x-7,y,14,14);c.fillStyle='#5f956d';c.fillRect(x-3,y+4,6,6);}
  for(const [x,y] of [[528,520],[1072,520],[528,1060],[1072,1060]]){c.fillStyle='#463a2b';c.fillRect(x-6,y-8,12,20);drawParticleEffect(c,'torch',x,y-10,g.time,x+y);}
  for(let x=490;x<1110;x+=28){c.strokeStyle='#315d3b';c.lineWidth=3;c.beginPath();c.moveTo(x,455);c.lineTo(x+7,485+(x%4)*8);c.stroke();c.fillStyle='#4d7b41';c.fillRect(x+2,471,11,5);}
  c.restore();
 }
 if(g.generatedEnvironment==='temple'){const s=TEMPLE_STAIRS;c.fillStyle='#bcb18b';c.fillRect(s.x-32,s.y-32,64,64);for(let i=0;i<8;i++){c.fillStyle=i%2?'#6e7863':'#bcb18b';c.fillRect(s.x-30,s.y-30+i*8,60,4);}c.fillStyle='#ffe9ad';c.font='12px sans-serif';c.textAlign='center';c.fillText('STAIRS · UPPER SANCTUM',s.x,s.y-43);
 for(const [x,y] of [[536,640],[1064,640],[536,920],[1064,920]]){c.fillStyle='#455f44';c.fillRect(x-13,y-24,26,40);c.fillStyle='#d7b975';c.fillRect(x-8,y-19,5,6);c.fillRect(x+3,y-19,5,6);c.fillRect(x-6,y-5,12,4);}}
 for(const a of g.ghosts||[]){c.save();c.globalAlpha=a.pet?.82:Math.min(.7,a.life/4);c.filter=a.pet?'sepia(.8) saturate(1.6) hue-rotate(300deg)':'sepia(.6) hue-rotate(155deg) saturate(1.6)';animator.draw(c,{...a,y:a.y-(a.jumpHeight||a.groundHeight||0)},g.time,48);c.restore();}
}
export function drawTempleRoom(c,g,p,animator){c.fillStyle='#102821';c.fillRect(0,0,320,240);c.fillStyle='#6d7861';c.fillRect(16,32,288,192);c.strokeStyle='#3c5143';for(let y=32;y<224;y+=24)for(let x=16;x<304;x+=32)c.strokeRect(x,y,32,24);c.fillStyle='#d5ba6a';c.fillRect(142,66,36,23);c.fillStyle='#503e25';c.fillRect(144,74,32,5);c.fillStyle='#e8e6b5';c.font='11px sans-serif';c.textAlign='center';c.fillText('UPPER SANCTUM',160,20);c.fillText('Ritual chest · Interact',160,57);c.fillStyle='#203c32';c.fillRect(140,204,40,30);c.fillStyle='#f2d78e';c.fillText('↓ Return downstairs',160,236);for(const q of g.players.filter(q=>q.room===p.room))animator.draw(c,{...q,x:q.roomX,y:q.roomY,moving:q.roomMoving,step:q.roomStep},g.time,48);}
