import {enemyCanSeeTarget} from './enemy-sight.mjs';
import {clearShot} from './navigation.mjs';
export const BEE_HIVE_CAP=8;
export const BEE_HIVE_INTERVAL=3.5;
export function beeEvent(event){return event?.beeHive===true||event?.kind==='bee'||event?.name==='A thousand little wings'&&event?.kind==='wasp';}
export function migrateBeeEvent(event){return event?.name==='A thousand little wings'&&event.kind==='wasp'?{...event,kind:'bee',beeHive:true,tip:'Break the hive to stop reinforcements. At most eight bees can fly from each hive.'}:event;}
export function hivePlacement(g,anchor){
 let tree=null,best=160;
 for(const q of g.scenery||[]){
  if(q.fallen||q.depleted||!['tree','snow_tree','palm','forest_tree'].includes(q.kind))continue;
  const root=q.rootY??q.y+(q.size||64)*.35,d=Math.hypot(q.x-anchor.x,root-anchor.y);
  if(d<best){best=d;tree=q;}
 }
 if(tree){
  const sign=(anchor.id||0)%2?-1:1,root=tree.rootY??tree.y+(tree.size||64)*.35;
  return {x:tree.x+sign*Math.max(18,(tree.size||64)*.2),y:root+6,hiveLift:Math.min(28,Math.max(16,(tree.size||64)*.25)),hiveTreeId:tree.id??null,hiveTreeX:tree.x,hiveTreeY:tree.y};
 }
 return null;
}
export function startBeeHive(g,group,bees){
 if(!bees.length||g.enemies.some(e=>e.kind==='bee_hive'&&e.group===group))return null;
 const first=bees[0];let spot={x:first.x,y:first.y};
 for(let i=0;i<16;i++){const a=i*Math.PI/8,x=Math.max(40,Math.min(1560,first.x+Math.cos(a)*55)),y=Math.max(40,Math.min(1560,first.y+Math.sin(a)*55));if(!g.blocked(x,y,16,false,true)){spot={x,y};break;}}
 const hive={id:g.nextId++,kind:'bee_hive',group,...(hivePlacement(g,first)||{...spot,hiveLift:0}),hp:160,maxHp:160,speed:0,damage:0,faceX:0,faceY:1,state:'idle',spawnTimer:BEE_HIVE_INTERVAL,flash:0,step:0,
  beeStats:{hp:first.maxHp??first.hp??27,speed:first.speed??90,damage:first.damage??7}};
 // Store the actual encounter's scaled stats; reinforcements must not double
 // apply difficulty or forget a designer's event/stat overrides.
 for(const bee of bees.slice(0,BEE_HIVE_CAP)){bee.kind='bee';delete bee.sprite;bee.hiveId=hive.id;bee.state='hunt';bee.attack=0;bee.timer=0;}
 g.enemies.push(hive);return hive;
}
export function tickBeeHive(g,hive,dt){
 hive.flash=Math.max(0,(hive.flash||0)-dt);hive.moving=false;
 if(hive.hp<=0||g.phase!=='play'||g.openingBoard)return;
 if(hive.hiveLift>0){const tree=(g.scenery||[]).find(q=>hive.hiveTreeId!=null?q.id===hive.hiveTreeId:q.x===hive.hiveTreeX&&q.y===hive.hiveTreeY);if(!tree||tree.fallen||tree.depleted)hive.hiveLift=0;}
 hive.spawnTimer=Math.max(0,(hive.spawnTimer??BEE_HIVE_INTERVAL)-Math.min(.2,dt));
 if(hive.spawnTimer>0||g.enemies.filter(e=>e.kind==='bee'&&e.hiveId===hive.id&&e.hp>0).length>=BEE_HIVE_CAP)return;
 const n=g.nextId,a=(n*.61803398875%1)*Math.PI*2,stats=hive.beeStats||{hp:27,speed:90,damage:7};
 const bee={id:g.nextId++,kind:'bee',group:hive.group,hiveId:hive.id,x:Math.max(24,Math.min(1576,hive.x+Math.cos(a)*24)),y:Math.max(24,Math.min(1576,hive.y+Math.sin(a)*16)),
  hp:stats.hp,maxHp:stats.hp,speed:stats.speed,damage:stats.damage,state:'hunt',step:0,faceX:Math.cos(a),faceY:Math.sin(a),cooldown:1,attack:0,flash:0,moving:false};
 g.enemies.push(bee);hive.spawnTimer=BEE_HIVE_INTERVAL;
}
export function tickBee(g,e,dt,targets){
 if(e.kind!=='bee')return false;
 for(const n of ['flash','hit','attack','cooldown','frozen'])e[n]=Math.max(0,(e[n]||0)-dt);
 e.moving=false;
 if(e.state==='snared'){e.timer-=dt;if(e.timer<=0)e.hp=0;return true;}
 const trap=g.traps.find(t=>t.life>0&&t.variant!=='slow'&&Math.hypot(t.x-e.x,t.y-e.y)<26);
 if(trap){trap.life=0;e.state='snared';e.timer=2;return true;}
 e.state=e.attack>0?'sting':'hunt'; // Old saved windup/charge states migrate here.
 if(e.frozen>0)return true;
 // Preserve the insect/spider rivalry without returning to the old dash AI.
 // Pick without temporary target arrays; only nearby, unobstructed spiders win.
 let target=null,best=300;
 for(const q of g.enemies){
  if(q.hp<=0||!['spider','baby_spider'].includes(q.kind))continue;
  const distance=Math.hypot(q.x-e.x,q.y-e.y);
  if(distance<best&&clearShot(g,e,q)){target=q;best=distance;}
 }
 if(!target){best=Infinity;for(const q of targets){
  if(!enemyCanSeeTarget(e,q))continue;
  const distance=Math.hypot(q.x-e.x,q.y-e.y);
  if(distance<best){target=q;best=distance;}
 }}
 if(!target){e.buzzVX=e.buzzVY=0;e.aggro=false;e.attack=0;e.state='hunt';return true;}
 e.aggro=true;const dx=target.x-e.x,dy=target.y-e.y,d=Math.hypot(dx,dy)||1,phase=(g.time||0)*3+(e.id||0)*2.399963;
 // A continuous little buzzing arc, never a telegraphed high-speed dash.
 const sideways=Math.sin(phase)*.32,forward=d>25?1:d<17?-.45:.15;
 let vx=dx/d*forward-dy/d*sideways,vy=dy/d*forward+dx/d*sideways,norm=Math.max(1,Math.hypot(vx,vy));
 const speed=Math.max(0,e.speed??90),blend=1-Math.exp(-dt*9);
 e.buzzVX=(e.buzzVX||0)+(vx/norm*speed-(e.buzzVX||0))*blend;e.buzzVY=(e.buzzVY||0)+(vy/norm*speed-(e.buzzVY||0))*blend;
 const moved=g.moveActor(e,e.buzzVX*dt,e.buzzVY*dt,true);e.moving=moved>.01;
 if(e.moving){const len=Math.hypot(e.buzzVX,e.buzzVY)||1;e.faceX=e.buzzVX/len;e.faceY=e.buzzVY/len;}
 if(d<32&&e.cooldown<=0&&clearShot(g,e,target)){
  if(g.players.includes(target)||target.hunterPet||target.pet)g.hurt(target,e.damage,e);else {target.hp-=e.damage;target.flash=.2;}
  e.cooldown=1.05;e.attack=.22;e.state='sting';
 }
 return true;
}
