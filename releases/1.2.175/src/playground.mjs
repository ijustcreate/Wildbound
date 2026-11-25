import {waterAt} from './environment.mjs';
import {give,take} from './items.mjs';
import {creatures} from './definitions.mjs';
import {initializeImp} from './imps.mjs';
import {onPlayShape} from './playground-geometry.mjs';

export const PLAY_PROP_LIMIT=64,LOOSE_APPLE_LIMIT=32;
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const wet=(g,x,y)=>['water','shallow'].includes(waterAt(g,x,y));
const outdoors=(g,x,y)=>!(g.house?.floors||[]).some(r=>x>r.x-22&&x<r.x+r.w+22&&y>r.y-22&&y<r.y+r.h+22);
const active=p=>p.hp>0&&!p.room&&!p.ui&&!p.vehicleId&&!p.broomMount&&!p.controlledFollowerId;
const facing=(p,o,range,spin=false)=>distance(p,o)<=range&&(spin||distance(p,o)<3||((o.x-p.x)*(p.faceX||0)+(o.y-p.y)*(p.faceY||0))/Math.max(1,distance(p,o))>.3);
function sight(g,p,o){const d=distance(p,o),steps=Math.ceil(d/4),end=o.kind==='apple_tree'?12:3;for(let i=1;i<steps&&i*d/steps<d-end;i++)if(g.blocked?.(p.x+(o.x-p.x)*i/steps,p.y+(o.y-p.y)*i/steps,1,false,true,false,0,Math.max(20,p.jumpHeight||p.groundHeight||0),true))return false;return true;}
function clear(g,x,y,r=18){return x>55&&y>55&&x<1545&&y<1545&&!wet(g,x,y)&&!g.blocked?.(x,y,r,false,false,false,0)&&Math.hypot(x-800,y-800)>140;}

// Lazy, additive scene upgrade. Existing trees, house drafts and terrain stay intact.
export function ensurePlayground(g){
 if(g.trainTest||g.interiorWorld||!['play','won'].includes(g.phase))return null;
 const env=g.generatedEnvironment||g.environment,key=`${g.seed}:${env}`;
 if(g.playground?.key===key)return g.playground;
 const s=g.playground={key,version:1,props:[],apples:[],frogs:[],coins:[],serial:0};
 const add=(kind,x,y,extra={})=>{const o={id:`play:${key}:${s.serial++}`,kind,x,y,...extra};s.props.push(o);return o;};
 const sites=[];
 for(let ring=180;ring<730;ring+=72)for(let i=0;i<24;i++){const a=i*Math.PI/12+(g.seed%11)*.07,x=Math.round(800+Math.cos(a)*ring),y=Math.round(800+Math.sin(a)*ring);if(clear(g,x,y)&&outdoors(g,x,y))sites.push({x,y});}
 const reserved=[];
 const find=(r=32)=>sites.find(p=>clear(g,p.x,p.y,r)&&reserved.every(o=>distance(o,p)>100));
 const reserve=p=>{reserved.push(p);return p;};
 if(['forest','house','temple'].includes(env))for(let i=0;i<3;i++){const p=find(35);if(p){reserve(p);add('apple_tree',p.x,p.y,{fruit:5,shake:0});}}
 for(let i=0;i<7;i++){const p=find(15);if(p){reserve(p);add('pot',p.x,p.y,{broken:false});}}
 const ball=find(24);if(ball){reserve(ball);add('ball',ball.x,ball.y,{homeX:ball.x,homeY:ball.y,vx:0,vy:0,z:0,vz:0,roll:0});}
 // Three broad stepping surfaces fit an ordinary jump, with open ground beside them.
 for(let route=0;route<2;route++){
  const p=sites.find(p=>reserved.every(o=>distance(o,p)>130)&&[-35,0,35].every(d=>[0,50,100,150].every(x=>clear(g,p.x+x,p.y+d,20))));
  if(!p)continue;reserve(p);reserved.push({x:p.x+150,y:p.y});
  for(let i=0;i<3;i++)add('step',p.x+i*50,p.y,{height:8+i*5,style:i%2?'rock':'stump',route});
  add('bell',p.x+150,p.y,{route,rung:false});
 }
 // Find real shorelines rather than inventing a river or changing a saved map.
 for(let y=96;y<1500&&s.props.filter(o=>o.kind==='log').length<4;y+=32)for(let x=96;x<1500;x+=32){
  if(!wet(g,x,y)||![-28,0,28].every(d=>wet(g,x+d,y)))continue;
  if(![[0,32],[0,-32],[-48,0],[48,0]].some(([dx,dy])=>clear(g,x+dx,y+dy,8)))continue;
  if(s.props.some(o=>o.kind==='log'&&distance(o,{x,y})<240))continue;
  add('log',x,y,{homeX:x,homeY:y,flowX:.7,flowY:.3});if(s.props.filter(o=>o.kind==='log').length>=4)break;
 }
 return s;
}
export function shakeAppleTree(g,p,tree){
 const s=g.playground;if(!s||tree.shake>.15)return true;tree.shake=.65;
 if(tree.fruit<=0){g.message?.('This apple tree has been picked clean for now.');return true;}
 const count=Math.min(tree.fruit,2,LOOSE_APPLE_LIMIT-s.apples.length);if(!count)return true;
 tree.fruit-=count;
 for(let i=0;i<count;i++)s.apples.push({id:`apple:${s.key}:${s.serial++}`,x:tree.x+(i?16:-16),y:tree.y+8,z:48+i*7,vz:12,vx:(i?1:-1)*18,vy:10,age:0});
 g.onSound?.('harvest',tree);g.persist?.();return true;
}
export function useApple(g,p){if(p.hp<=0||p.hp>=p.maxHp||!take(p.inventory,'apple'))return false;p.hp=Math.min(p.maxHp,p.hp+12);g.onSound?.('heal',p);g.persist?.();return true;}
export function throwPlayApple(g,p){
 const a=g.playground?.apples.find(a=>a.heldBy===p.id);if(!a||!active(p))return false;
 const n=Math.hypot(p.faceX,p.faceY)||1,dx=(p.faceX||0)/n,dy=(p.faceY??1)/n;
 Object.assign(a,{heldBy:null,x:p.x+dx*15,y:p.y+dy*15,z:25+(p.jumpHeight||p.groundHeight||0),vx:dx*180,vy:dy*180,vz:75,age:0});
 p.attack=p.attackDuration=.3;p.attackClip='punch';g.onSound?.('swing',p);g.persist?.();return true;
}
export function interactPlayground(g,p){
 if(!active(p)||p.heldChickenId||g.trainTest)return false;const s=ensurePlayground(g);if(!s)return false;
 const held=s.apples.find(a=>a.heldBy===p.id);
 if(held){if(p.hp<p.maxHp){p.hp=Math.min(p.maxHp,p.hp+12);g.onSound?.('heal',p);}else if(!give(p.inventory,'apple',1)){g.message?.('Your backpack is full. Attack to throw the apple.');return true;}s.apples.splice(s.apples.indexOf(held),1);g.persist?.();return true;}
 const targets=[...s.apples.filter(a=>!a.heldBy&&a.z<60),...s.props.filter(o=>o.kind==='apple_tree'||o.kind==='bell')].filter(o=>facing(p,o,45)&&sight(g,p,o)).sort((a,b)=>distance(a,p)-distance(b,p));
 const o=targets[0];if(!o)return false;
 if(o.kind==='apple_tree')return shakeAppleTree(g,p,o);
 if(o.kind==='bell'){ringPlayBell(g,p,o);return true;}
 Object.assign(o,{heldBy:p.id,vx:0,vy:0,vz:0});g.message?.('Apple caught! Interact: eat or pack. Attack: throw.');g.onSound?.('pickup',p);g.persist?.();return true;
}
function spawnSurprise(g,pot,kind,count){
 let made=0;for(let i=0;i<count&&g.enemies.length<160;i++){
  const a=i*2.4;let pos=null;for(let r=24;r<=80;r+=14){const x=pot.x+Math.cos(a)*r,y=pot.y+Math.sin(a)*r;if(x>30&&x<1570&&y>30&&y<1570&&!wet(g,x,y)&&!g.blocked?.(x,y,7,false,false,false,0)){pos={x,y};break;}}if(!pos)continue;
  const cfg=creatures[kind];if(!cfg)continue;
  const e={...pos,id:g.nextId++,kind,skin:kind,wildlife:kind==='chicken',faction:kind==='imp'?'hostile':cfg.faction,hp:cfg.stats.hp,maxHp:cfg.stats.hp,speed:cfg.stats.speed,damage:cfg.stats.damage,state:kind==='imp'?'hunt':'graze',timer:0,cooldown:1,flash:0,attack:0,step:0,faceX:0,faceY:1,homeX:pos.x,homeY:pos.y,wildLastHp:cfg.stats.hp,wanderIn:0,eventBound:false};
  if(kind==='imp')initializeImp(e);g.enemies.push(e);made++;
 }return made;
}
export function breakPlayPot(g,pot){
 if(pot.broken)return false;pot.broken=true;pot.brokenAt=g.time||0;const s=g.playground,r=g.random();
 if(r>=.35&&r<.7){for(let i=0;i<3;i++)s.coins.push({x:pot.x+(i-1)*9,y:pot.y+10,value:1});g.message?.('A few forgotten coins!');}
 else if(r>=.7&&r<.82&&s.frogs.length<16){s.frogs.push({id:s.serial++,x:pot.x,y:pot.y+8,homeX:pot.x,homeY:pot.y+8,wait:.2,age:0});g.message?.('There was a frog in there!');}
 else if(r>=.82&&r<.9){spawnSurprise(g,pot,'imp',1);g.message?.('An angry imp pops out!');}
 else if(r>=.9){spawnSurprise(g,pot,'chicken',6);g.message?.('How did all those chickens fit?!');}
 g.onSound?.('wallBreak',pot);g.persist?.();return true;
}
export function ringPlayBell(g,p,bell){
 if(bell.cooldown>0)return;bell.cooldown=.8;
 if(!bell.rung){bell.rung=true;g.playground.coins.push({x:bell.x,y:bell.y+12,value:3});g.message?.('Ding! Little jump trail complete.');g.persist?.();}g.onSound?.('loot',bell);
}
export function hitPlayground(g,p,range,spin=false){
 if(!active(p)||g.trainTest)return false;const s=ensurePlayground(g);if(!s)return false;
 const o=s.props.filter(o=>['pot','apple_tree','ball','bell'].includes(o.kind)&&!o.broken&&facing(p,o,range,spin)&&sight(g,p,o)).sort((a,b)=>distance(a,p)-distance(b,p))[0];if(!o)return false;
 if(o.kind==='pot')return breakPlayPot(g,o);
 if(o.kind==='apple_tree')return shakeAppleTree(g,p,o);
 if(o.kind==='bell'){ringPlayBell(g,p,o);return true;}
 const n=Math.hypot(p.faceX,p.faceY)||1;Object.assign(o,{vx:p.faceX/n*250,vy:p.faceY/n*250,vz:90,z:Math.max(1,o.z||0)});g.onSound?.('hit',o);return true;
}
function moveLoose(g,o,dt,r=5){
 const steps=Math.max(1,Math.ceil(Math.hypot(o.vx||0,o.vy||0)*dt/5)),step=dt/steps;
 for(let i=0;i<steps;i++){
  const from={x:o.x,y:o.y},nx=o.x+(o.vx||0)*step,ny=o.y+(o.vy||0)*step;
  const blocked=(x,y)=>x<20||x>1580||y<20||y>1580||g.blocked?.(x,y,r,false,true,false,0,o.z||0,false,from);
  if(blocked(nx,o.y))o.vx*= -.65;else o.x=nx;
  if(blocked(o.x,ny))o.vy*= -.65;else o.y=ny;
 }
}
export function foragePlayApple(g,e,dt){
 if(!['chicken','pig','pig_spotted','mother_deer','baby_deer','stag'].includes(e.kind)||e.carriedBy||e.fleeTime>0||e.hp<e.wildLastHp||e.frozen>0||e.state==='snared')return false;
 const apple=g.playground?.apples.find(a=>!a.heldBy&&a.z<=1&&distance(e,a)<120);if(!apple)return false;
 const d=distance(e,apple);if(d<10){g.playground.apples.splice(g.playground.apples.indexOf(apple),1);e.wanderIn=2;g.onSound?.('pickup',e);return true;}
 e.faceX=(apple.x-e.x)/d;e.faceY=(apple.y-e.y)/d;e.moving=true;g.moveActor(e,e.faceX*Math.min(d,e.speed*dt*.65),e.faceY*Math.min(d,e.speed*dt*.65));return true;
}
export function tickPlayground(g,dt,inputs={}){
 const s=ensurePlayground(g);if(!s)return;dt=Math.min(.05,Math.max(0,dt));
 for(const p of g.players)delete p.playLogId;
 for(const o of s.props){o.shake=Math.max(0,(o.shake||0)-dt);o.cooldown=Math.max(0,(o.cooldown||0)-dt);
  if(o.kind==='ball'){
   for(const p of g.players.filter(active))if(!(p.jumpHeight>12)&&distance(p,o)<21&&sight(g,p,o)){
    const d=distance(p,o)||1,dx=(o.x-p.x)/d,dy=(o.y-p.y)/d;const speed=p.moving?130:30;
    o.vx=(o.vx||0)+dx*speed*dt*12;o.vy=(o.vy||0)+dy*speed*dt*12;
   }
   const v=Math.hypot(o.vx,o.vy);if(v>300){o.vx*=300/v;o.vy*=300/v;}moveLoose(g,o,dt,7);
   if(v>65){const bell=s.props.find(b=>b.kind==='bell'&&!b.rung&&distance(o,b)<22);if(bell)ringPlayBell(g,null,bell);}
   o.z=Math.max(0,(o.z||0)+(o.vz||0)*dt);o.vz=(o.vz||0)-300*dt;if(!o.z){o.vz=Math.abs(o.vz)>15?Math.abs(o.vz)*.45:0;}
   o.roll+=(Math.hypot(o.vx,o.vy)*dt)/9;o.water=waterAt(g,o.x,o.y);const water=wet(g,o.x,o.y),drag=Math.exp(-(water?1.6:2.3)*dt);o.vx*=drag;o.vy*=drag;
   if(water){o.vx+=4*dt;o.vy+=2*dt;}
  }
  if(o.kind==='log'){
   const riders=g.players.filter(p=>active(p)&&!p.wingHover&&!(p.jumpHeight>0)&&onPlayShape(o,p.x,p.y));
   let dx=o.flowX*9*dt,dy=o.flowY*9*dt;
   for(const p of riders){const input=inputs[p.device]||{};dx+=(input.x||0)*16*dt/riders.length;dy+=(input.y||0)*16*dt/riders.length;}
   const old={x:o.x,y:o.y};
   const valid=(x,y)=>x>50&&x<1550&&y>50&&y<1550&&[-28,0,28].every(d=>wet(g,x+d,y)&&!g.blocked?.(x+d,y,3,false,true,false,0,6));
   if(valid(o.x+dx,o.y+dy)){o.x+=dx;o.y+=dy;}else if(valid(o.x-dy,o.y+dx)){o.x-=dy;o.y+=dx;}else{o.flowX=-o.flowX;o.flowY=-o.flowY;}
   for(const p of riders){p.x+=o.x-old.x;p.y+=o.y-old.y;p.groundHeight=6;p.swimming=false;p.diveDepth=0;p.playLogId=o.id;}
  }
  if(o.kind==='bell'&&!o.rung){const p=g.players.find(p=>active(p)&&p.landTime>0&&p.jumpPeakHeight>=14&&distance(p,o)<22);if(p)ringPlayBell(g,p,o);}
 }
 for(const a of s.apples){
  a.age+=dt;
  if(a.heldBy){const p=g.players.find(p=>p.id===a.heldBy);if(p&&active(p)){a.x=p.x+(p.faceX||0)*10;a.y=p.y+(p.faceY||0)*8;a.z=24+(p.jumpHeight||p.groundHeight||0);continue;}a.heldBy=null;a.vx=a.vy=0;a.vz=0;}
  moveLoose(g,a,dt,3);a.z=Math.max(0,a.z+a.vz*dt);a.vz-=260*dt;if(!a.z){a.vz=Math.abs(a.vz)>25?Math.abs(a.vz)*.25:0;const drag=Math.exp(-5*dt);a.vx*=drag;a.vy*=drag;}
 }
 s.apples=s.apples.filter(a=>a.heldBy||a.age<180);
 for(const a of s.frogs){a.age+=dt;a.wait-=dt;if(a.hop){const h=a.hop;h.t=Math.min(1,h.t+dt/.4);a.x=h.x+(h.tx-h.x)*h.t;a.y=h.y+(h.ty-h.y)*h.t;a.hopHeight=Math.sin(h.t*Math.PI)*10;if(h.t===1){a.hop=null;a.wait=.8;}}
  else if(a.wait<=0){const t=a.id*2.4+a.age,tx=a.x+Math.cos(t)*24,ty=a.y+Math.sin(t)*20;if(!g.blocked?.(tx,ty,3,false,true,false,0))a.hop={x:a.x,y:a.y,tx,ty,t:0};else a.wait=.5;}}
 for(const coin of s.coins){const p=g.players.find(p=>active(p)&&!(p.jumpHeight>12)&&distance(p,coin)<19&&sight(g,p,coin));if(p){p.coins=(p.coins||0)+coin.value;coin.used=true;g.onSound?.('coin',p);g.persist?.();}}
 s.coins=s.coins.filter(c=>!c.used);
}
