import {drawFurniture,drawWindow} from './house-render.mjs';
import {boardTableBlocked} from './board-table.mjs';
import {drawWaterSurface} from './water-surface.mjs';
import {activeHouse, contains, furnitureHeight} from './house-design.mjs';
import {navigateEnemy} from './navigation.mjs';
export const ENVIRONMENTS=['forest','desert','ice','house','temple'];
export const resolveEnvironment=(choice,seed)=>choice==='random'?ENVIRONMENTS[Math.abs(seed)%ENVIRONMENTS.length]:choice;
export const insideHouse=(x,y,h=null)=>h?.floors?h.floors.some(r=>contains(r,x,y)):x>480&&x<1120&&y>480&&y<1120;
export const makeHouse=()=>activeHouse();
export function structureBlocked(g,x,y,r=8,canOpenDoors=false,footOffset=14,elevation=0,projectile=false){
 if(!projectile&&boardTableBlocked(g,x,y,r,elevation))return true;
 return [...(g.house?.walls||[]).filter(w=>!(w.kind==='window'&&w.broken&&(projectile||elevation>=10))),...(g.house?.doors||[]).filter(d=>!d.open&&!canOpenDoors),...(g.house?.furniture||[]).filter(f=>!['rug','plant'].includes(f.kind)&&!(furnitureHeight(f)>0&&elevation>=furnitureHeight(f)))].some(b=>Math.hypot(x-Math.max(b.x,Math.min(x,b.x+b.w)),y+footOffset-Math.max(b.y,Math.min(y+footOffset,b.y+b.h)))<r);
}
export function breakWindow(g,x,y,r=1){
 const pane=g.house?.walls.find(w=>w.kind==='window'&&!w.broken&&Math.hypot(x-Math.max(w.x,Math.min(x,w.x+w.w)),y-Math.max(w.y,Math.min(y,w.y+w.h)))<r);
 if(!pane)return false;pane.broken=true;g.onSound?.('hit',{x,y});g.message?.('Glass shattered. Shoot or jump through the opening.');return true;
}
export function toggleDoor(g,p){
  const d=g.house?.doors.find(d=>Math.hypot(p.x-d.x-d.w/2,p.y-d.y-d.h/2)<64);
  if(!d)return false;
  if(d.open&&[...g.players,...g.enemies].some(a=>a.hp>0&&Math.abs(a.x-d.x-d.w/2)<d.w/2+12&&Math.abs(a.y-d.y-d.h/2)<d.h/2+12)){g.message('Doorway occupied.');return true;}
  d.open=!d.open;g.onSound(d.open?'doorOpen':'doorClose',p);g.message(d.open?'Door opened.':'Door closed.');return true;
}
export const isSpider=e=>e.kind==='spider'||e.kind==='baby_spider';
export const webSlow=(g,a)=>!isSpider(a)&&g.webs?.some(w=>Math.hypot(a.x-w.x,a.y-w.y)<w.radius);
export function maintainSpiderWebs(g, dt = 0) {
  const adults = (g.enemies || []).filter(e => e.hp > 0 && isSpider(e) && e.kind === 'spider');
  if (!adults.length) {
    for (const tree of g.scenery || []) tree.webbed = false;
    g.webs = [];
    return;
  }
  for (const w of g.webs || []) {
    const nearby = adults.some(e => Math.hypot(e.x - w.x, e.y - w.y) < w.radius + 80);
    if (nearby) w.radius = Math.min(220, w.radius + dt * 0.8);
    for (const tree of g.scenery || [])
      if (['tree','palm','snow_tree'].includes(tree.kind) && Math.hypot(tree.x-w.x, tree.y-w.y) < w.radius) tree.webbed = true;
  }
}
function layWebEgg(g, adult, web) {
  const angle = Math.atan2(adult.y - web.y, adult.x - web.x) + Math.PI * 0.35;
  const x = web.x + Math.cos(angle) * (web.radius - 14), y = web.y + Math.sin(angle) * (web.radius - 14);
  g.enemies.push({id:g.nextId++,group:adult.group,kind:'spider_egg',x,y,hp:24,maxHp:24,speed:0,damage:0,hatchIn:20,faceX:0,faceY:1,state:'idle',cooldown:0});
  adult.webEggCooldown = 45;
  g.message('A spider lays an egg at the web edge.');
}
export function spawnSpot(g,a,d,interior=false){
  if(interior && g.house?.floors?.length){
    const candidates=[];
    for(const room of g.house.floors)for(let y=room.y+24;y<room.y+room.h-24;y+=16)for(let x=room.x+24;x<room.x+room.w-24;x+=16){
      if(!g.blocked(x,y,16,false,false,false,0)&&!g.blocked(x,y,16))candidates.push({x,y});
    }
    const players=g.players.filter(p=>p.hp>0);
    const distance=p=>Math.min(...players.map(q=>Math.hypot(p.x-q.x,p.y-q.y)),240);
    candidates.sort((p,q)=>Math.abs(distance(p)-180)-Math.abs(distance(q)-180));
    if(candidates.length)return candidates[0];
  }
  const radius=g.generatedEnvironment==='house'?Math.max(475,d):d;
  let x=800+Math.cos(a)*radius,y=800+Math.sin(a)*radius;
  for(let n=0;n<100;n++){
    if(!g.blocked(x,y)&&!(g.generatedEnvironment==='house'&&insideHouse(x,y,g.house)))return {x,y};
    const angle=a+n*2.4,range=radius+(n%5)*24;x=Math.max(60,Math.min(1540,800+Math.cos(angle)*range));y=Math.max(60,Math.min(1540,800+Math.sin(angle)*range));
  }
  return {x:800,y:1250};
}
export function spiderNest(g,anchor,group){
  g.webs ||= [];g.webs.push({x:anchor.x,y:anchor.y,radius:145,group});
  for(const tree of g.scenery)if(['tree','palm','snow_tree'].includes(tree.kind)&&Math.hypot(tree.x-anchor.x,tree.y-anchor.y)<180)tree.webbed=true;
  for(let i=0;i<3;i++){
    let spot={x:anchor.x+Math.cos(i*2.1)*42,y:anchor.y+Math.sin(i*2.1)*42};
    if(g.blocked(spot.x,spot.y)||(g.house&&insideHouse(spot.x,spot.y,g.house)))spot={x:anchor.x,y:anchor.y};
    g.enemies.push({id:g.nextId++,group,kind:'spider_egg',...spot,hp:24,maxHp:24,speed:0,damage:0,hatchIn:20,faceX:0,faceY:1,state:'idle',cooldown:0});
  }
}
const lineClear=(g,a,b)=>{const n=Math.ceil(Math.hypot(a.x-b.x,a.y-b.y)/12);for(let i=1;i<n;i++)if(structureBlocked(g,a.x+(b.x-a.x)*i/n,a.y+(b.y-a.y)*i/n,2))return false;return true;};
export function tickSpider(g,e,dt){
  if(e.kind==='spider_egg'){
    e.hatchIn-=dt;
    if(e.hatchIn<=0){Object.assign(e,{kind:'baby_spider',sprite:'spider',hp:28,maxHp:28,speed:95,damage:5,state:'hunt',timer:0,cooldown:.8,step:0});g.message('Spider eggs are hatching!');}
    return true;
  }
  const spider=isSpider(e),insect=['wasp','bee','beetle'].includes(e.kind);
  if(!spider&&!insect)return false;
  const opponents=g.enemies.filter(q=>q!==e&&q.hp>0&&(spider?['wasp','bee','beetle'].includes(q.kind):isSpider(q))&&Math.hypot(q.x-e.x,q.y-e.y)<300&&lineClear(g,e,q));
  const targets=opponents.length?opponents:spider?g.players.filter(p=>p.hp>0&&!p.room):[];
  if(!spider&&!targets.length)return false;
  e.cooldown=Math.max(0,(e.cooldown||0)-dt);e.flash=Math.max(0,(e.flash||0)-dt);e.attack=Math.max(0,(e.attack||0)-dt);e.moving=false;
  if(e.state==='snared'){e.timer-=dt;if(e.timer<=0)e.hp=0;return true;}
  const trap=g.traps.find(t=>t.life>0&&Math.hypot(t.x-e.x,t.y-e.y)<30);
  if(trap&&trap.variant!=='slow'){trap.life=0;e.state='snared';e.timer=2;return true;}
  const target=targets.sort((a,b)=>Math.hypot(a.x-e.x,a.y-e.y)-Math.hypot(b.x-e.x,b.y-e.y))[0];
  if(!target)return true;
  if (e.kind === 'spider') {
    const web = (g.webs || []).filter(w => w.group === e.group || Math.hypot(e.x-w.x,e.y-w.y)<w.radius+30).sort((a,b)=>Math.hypot(e.x-a.x,e.y-a.y)-Math.hypot(e.x-b.x,e.y-b.y))[0];
    if (web) {
      e.webEggCooldown = Math.max(0, (e.webEggCooldown ?? 45) - dt);
      const sameGroupEgg = g.enemies.some(q => q.hp > 0 && q.kind === 'spider_egg' && q.group === e.group);
      const lead = g.enemies.filter(q => q.hp > 0 && q.kind === 'spider' && q.group === e.group).sort((a,b)=>a.id-b.id)[0];
      if (lead === e && e.webEggCooldown <= 0 && !sameGroupEgg) layWebEgg(g,e,web);
      if (Math.hypot(e.x-web.x,e.y-web.y) > web.radius * 0.82) {
        const d = Math.hypot(web.x-e.x, web.y-e.y) || 1;
        g.moveActor(e, (web.x-e.x)/d*e.speed*dt, (web.y-e.y)/d*e.speed*dt);
      }
    }
  }
  const d=Math.hypot(target.x-e.x,target.y-e.y)||1;e.faceX=(target.x-e.x)/d;e.faceY=(target.y-e.y)/d;
  if(g.house&&!lineClear(g,e,target)){navigateEnemy(g,e,target,dt);return true;}
  if(d>28){const moved=g.moveActor(e,e.faceX*e.speed*dt,e.faceY*e.speed*dt,insect&&e.kind!=='beetle');if(moved<e.speed*dt*.2)g.moveActor(e,-e.faceY*e.speed*dt,e.faceX*e.speed*dt);}
  if(d<42&&e.cooldown<=0&&lineClear(g,e,target)){
    if(g.players.includes(target))g.hurt(target,e.damage,e);else {target.hp-=e.damage;target.flash=.2;}
    e.cooldown=spider?.9:1.2;e.attack=.25;
  }
  return true;
}
export function drawExpansion(c,g){
  for(const w of g.webs||[]){c.save();c.translate(w.x,w.y);c.strokeStyle='#dae6de80';c.lineWidth=1;
    for(let ring=1;ring<=5;ring++){c.beginPath();for(let j=0;j<=12;j++){const a=j*Math.PI/6,r=w.radius*ring/5;j?c.lineTo(Math.cos(a)*r,Math.sin(a)*r*.65):c.moveTo(Math.cos(a)*r,Math.sin(a)*r*.65);}c.stroke();}
    for(let j=0;j<12;j++){const a=j*Math.PI/6;c.beginPath();c.moveTo(0,0);c.lineTo(Math.cos(a)*w.radius,Math.sin(a)*w.radius*.65);c.stroke();}c.restore();
  }
  if(!g.house)return;
  for(const r of g.house.rooms){c.fillStyle='#e5d8bc70';c.font='10px sans-serif';c.textAlign='center';c.fillText(r.name,r.x,r.y);}
  for(const p of g.house.pools||[]){drawWaterSurface(c,g,p.x,p.y,p.w,p.h);c.strokeStyle='#bcece488';c.lineWidth=2;c.strokeRect(p.x+5,p.y+5,p.w-10,p.h-10);c.strokeStyle='#c1ccbc';c.lineWidth=8;c.strokeRect(p.x-4,p.y-4,p.w+8,p.h+8);c.strokeStyle='#416c75';c.lineWidth=2;c.strokeRect(p.x+3,p.y+3,p.w-6,p.h-6);}
  for(const f of g.house.furniture||[]){drawFurniture(c,f);if(furnitureHeight(f)&&g.players.some(p=>!p.room&&Math.hypot(p.x-f.x-f.w/2,p.y-f.y-f.h/2)<90)){c.fillStyle='#e7edce';c.font='9px sans-serif';c.textAlign='center';c.fillText('Jumpable · '+f.kind,f.x+f.w/2,f.y-7);}}
  for(const b of g.house.walls){if(b.kind==='window'){drawWindow(c,b);continue;}if(b.kind==='fence'){c.fillStyle='#876c49';c.fillRect(b.x,b.y,b.w,b.h);c.fillStyle='#b99a6a';for(let n=0;n<Math.max(b.w,b.h);n+=24)c.fillRect(b.x+(b.w>b.h?n:0),b.y+(b.h>b.w?n:0),12,20);continue;}c.fillStyle='#252d34';c.fillRect(b.x,b.y+5,b.w,b.h+8);c.fillStyle='#a9b6b4';c.fillRect(b.x,b.y,b.w,b.h);c.fillStyle='#d8d8c4';c.fillRect(b.x,b.y,b.w,3);}
  for(const d of g.house.doors){c.fillStyle=d.open?'#a1bb83':'#90643c';const horizontal=d.w>d.h;c.fillRect(d.x,d.y,d.open?(horizontal?7:48):d.w,d.open?(horizontal?48:7):d.h);c.fillStyle='#f3d58a';c.fillRect(d.x+(d.open?2:Math.max(3,d.w-10)),d.y+4,3,3);
    if(g.players.some(p=>!p.room&&Math.hypot(p.x-d.x-d.w/2,p.y-d.y)<65)){c.fillStyle='#fff3c5';c.font='9px sans-serif';c.textAlign='center';c.fillText(d.open?'Interact: close':'Interact: open',d.x+d.w/2,d.y-8);}}

}
export function drawTreeWeb(c,p){if(!p.webbed)return;c.save();c.strokeStyle='#f0f0dfbb';c.lineWidth=1;c.beginPath();for(let i=0;i<6;i++){c.moveTo(p.x-p.size*.3,p.y-p.size*.25+i*5);c.lineTo(p.x+p.size*.3,p.y-p.size*.1-i*4);}c.stroke();c.restore();}
