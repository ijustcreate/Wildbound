import test from 'node:test';
import assert from 'node:assert/strict';
import {requestEnemyGroupTurn as request,maintainEnemyGroupCombat as maintain,enemyGroupPosition} from '../src/enemy-group-combat.mjs';
import {Game} from '../src/core.mjs';
import {initializeTacticalEnemy} from '../src/combat-tactics-state.mjs';
import {combatPhase} from '../src/enemy-combat-catalog.mjs';

function scene(){
 const p={id:1,x:600,y:600,hp:100,room:null};
 const a={id:2,kind:'skeleton',x:640,y:600,hp:100,state:'hunt'},b={id:3,kind:'archer',x:800,y:650,hp:100,state:'hunt'},c={id:4,kind:'necromancer',x:780,y:550,hp:100,state:'hunt'};
 return {g:{time:20,players:[p],enemies:[a,b,c],effects:[]},p,a,b,c};
}
test('different controllers share one offensive tell, with one separate support channel',()=>{
 const {g,p,a,b,c}=scene();assert.ok(request(g,a,p));a.state='windup';
 assert.equal(request(g,b,p,{flightSpeed:270}),false);
 assert.ok(request(g,c,p,{mode:'support'}));c.state='channel';
 const d={...c,id:5,state:'hunt'};g.enemies.push(d);assert.equal(request(g,d,p,{mode:'support'}),false);
 assert.equal(g.effects.length,0,'coordination adds no ground graphics');
});
test('a rush leaves a real punish window before the next full tell begins',()=>{
 const {g,p,a,b}=scene();request(g,a,p,{rush:true});a.state='windup';g.time+=.5;maintain(g);
 a.state='charge';g.time+=.5;assert.equal(request(g,b,p),false);
 a.state='recover';maintain(g);assert.equal(request(g,b,p),false);
 g.time+=.51;assert.equal(request(g,b,p),false);
 g.time+=.02;assert.ok(request(g,b,p));assert.equal(b.state,'hunt','admission never skips the owner AI tell');
});
test('slow projectiles reserve their travel window instead of handing off on release',()=>{
 const {g,p,a,b}=scene();b.x=840;b.y=600;request(g,b,p,{flightSpeed:150});b.state='windup';g.time+=.5;maintain(g);
 b.state='recover';maintain(g);g.time+=1;assert.equal(request(g,a,p),false);
 g.time+=.73;assert.ok(request(g,a,p));
});
test('ready waiters take turns instead of array-first attackers monopolizing the slot',()=>{
 const {g,p,a,b,c}=scene();request(g,a,p);a.state='windup';g.time+=.02;request(g,b,p);g.time+=.02;request(g,c,p);
 a.state='recover';maintain(g);
 for(let i=0;i<9;i++){g.time+=.04;request(g,b,p);request(g,c,p);}
 g.time+=.03;a.state='hunt';assert.equal(request(g,a,p),false);assert.ok(request(g,b,p));b.state='windup';assert.equal(request(g,c,p),false);
});
test('death, disabling, departed targets and abandoned reservations release their slots',()=>{
 for(const reason of ['dead','frozen','departed','abandoned']){
  const {g,p,a,b}=scene();request(g,a,p);a.state=reason==='abandoned'?'hunt':'windup';g.time+=.05;maintain(g);
  if(reason==='dead')a.hp=0;if(reason==='frozen')a.frozen=1;if(reason==='departed')p.room={};
  g.time+=.3;maintain(g);assert.equal(a.groupTurn,undefined,reason);
  if(reason!=='departed'){g.time+=.4;assert.ok(request(g,b,p),reason);}
 }
});
test('co-op targets have independent turns and restored claims contain no actor references',()=>{
 const {g,p,a,b}=scene(),q={...p,id:8,x:900};g.players.push(q);
 assert.ok(request(g,a,p));a.state='windup';assert.equal(request(g,b,q),false);g.time+=.29;assert.ok(request(g,b,q));b.state='windup';
 const copy=JSON.parse(JSON.stringify(g));maintain(copy);assert.equal(copy.enemies.filter(e=>e.groupTurn).length,2);
 assert.equal(typeof copy.enemies[0].groupTurn.targetId,'number');assert.equal(copy.enemies[0].groupTurn.target,undefined);
});

test('nearby co-op players share attack slots and projectile handoff space',()=>{
 const {g,p,a,b}=scene(),q={...p,id:8,x:680};g.players.push(q);
 assert.ok(request(g,a,p,{flightSpeed:150}));a.state='windup';g.time+=.5;
 assert.equal(request(g,b,q),false,'a second target cannot bypass a shared dodge space');
 a.state='recover';maintain(g);g.time+=.4;assert.equal(request(g,b,q),false,'travel time protects nearby teammates too');
 g.time+=.5;assert.ok(request(g,b,q));
});

test('moving together never cancels or redirects a committed co-op tell',()=>{
 const {g,p,a,b}=scene(),q={...p,id:8,x:900};g.players.push(q);
 request(g,a,p);a.state='windup';g.time+=.29;request(g,b,q);b.state='windup';q.x=p.x+10;
 maintain(g);assert.equal(a.groupTurn.targetId,p.id);assert.equal(b.groupTurn.targetId,q.id);
 const c={...a,id:9,state:'hunt',groupTurn:undefined};g.enemies.push(c);assert.equal(request(g,c,q),false);
});
test('support channels are spaced after resolution and interrupts do not cause a heal pile-on',()=>{
 const {g,p,a,c}=scene();request(g,c,p,{mode:'support'});c.state='channel';g.time+=.1;maintain(g);c.state='recover';maintain(g);
 assert.equal(request(g,a,p,{mode:'support'}),false);g.time+=2.41;assert.ok(request(g,a,p,{mode:'support'}));
});
test('waiting formations preserve melee reach, separate flanks and add no effects',()=>{
 const {g,p,a,b}=scene();const x=enemyGroupPosition(g,a,p,{range:57}),y=enemyGroupPosition(g,b,p,{backline:true});
 assert.ok(Math.hypot(x.x-p.x,x.y-p.y)<57);assert.ok(Math.hypot(y.x-p.x,y.y-p.y)>200);
 assert.deepEqual(enemyGroupPosition(g,a,p,{range:57}),x);assert.equal(a.x,640);assert.equal(g.effects.length,0);
});
test('allies and distant unrelated actors do not suppress a hostile encounter',()=>{
 for(const ownership of [{faction:'ally'},{ownerKey:1},{allyOwner:1},{pet:true}]){const {g,p,a,b}=scene();Object.assign(a,ownership);assert.ok(request(g,a,p));assert.equal(a.groupTurn,undefined);assert.ok(request(g,b,p));}
});

test('an in-progress tell restored from an older save keeps its turn and opening',()=>{
 const {g,p,a,b}=scene();a.state='windup';assert.equal(request(g,b,p),false);assert.equal(a.groupTurn.targetId,p.id);
 g.time+=.5;a.state='recover';maintain(g);assert.equal(request(g,b,p),false);
 g.time+=.39;assert.ok(request(g,b,p));
});

test('real mixed roles, ordinary melee and spellcaster rotate without overlapping offensive phases',()=>{
 const g=new Game(()=>.5),p=g.addPlayer('keyboard');g.start();
 Object.assign(g,{time:20,house:null,openingBoard:false,scenery:[],enemies:[],traps:[],weather:null,event:null});g.terrain.fill('grass');g.onSound=()=>{};g.persist=()=>{};
 Object.assign(p,{x:600,y:600,hp:9999,maxHp:9999,invincible:true});
 const kinds=[['skeleton',645,600,'shield'],['skeleton',570,600],['fire_elemental',700,760],['archer',800,690,'archer']];
 for(const [kind,x,y,role]of kinds){const e={id:g.nextId++,kind,x,y,hp:500,maxHp:500,speed:60,damage:0,state:'hunt',cooldown:0,faceX:(600-x)/(Math.hypot(600-x,600-y)||1),faceY:(600-y)/(Math.hypot(600-x,600-y)||1),group:3};g.configureCreature(e,false);if(role){e.combatRole=role;initializeTacticalEnemy(e);}e.cooldown=0;g.enemies.push(e);}
 const seen=new Set();let largest=0,quietFrames=0;
 for(let i=0;i<600;i++){
  g.time+=.05;g.tickCombatActors(.05);
  const threats=g.enemies.filter(e=>['windup','active'].includes(combatPhase(e)));
  largest=Math.max(largest,threats.length);if(!threats.length)quietFrames++;
  for(const e of threats)seen.add(e.id);
 }
 assert.equal(largest,1,'one full offensive tell/contact at a time against the solo target');
 assert.equal(seen.size,4,'each ready role gets a turn '+JSON.stringify(g.enemies.map(e=>({kind:e.kind,role:e.combatRole,seen:seen.has(e.id),x:e.x,y:e.y,state:e.state,phase:combatPhase(e),cooldown:e.cooldown,wait:e.groupWait,turn:e.groupTurn}))));assert.ok(quietFrames>15,'handoffs leave visible breathing room');
});


test('legacy contact attacks cannot bypass another enemy turn',()=>{
 const g=new Game(()=>.5),p=g.addPlayer('keyboard');g.start();Object.assign(g,{time:20,house:null,openingBoard:false,scenery:[],enemies:[],traps:[],weather:null});g.terrain.fill('grass');g.onSound=()=>{};g.persist=()=>{};Object.assign(p,{x:600,y:600,hp:1000});
 const guard={id:900,kind:'skeleton',combatRole:'shield',x:645,y:600,hp:500,maxHp:500,speed:0,damage:0,faceX:-1,faceY:0};initializeTacticalEnemy(guard);guard.tactics={phase:'windup',duration:1,remaining:1,dx:-1,dy:0,targetId:p.id};guard.state='windup';
 const spider={id:901,kind:'spider',x:610,y:600,hp:500,maxHp:500,speed:0,damage:8,state:'hunt',cooldown:0,faceX:-1,faceY:0};g.configureCreature(spider,false);g.enemies=[guard,spider];let hits=0,lastStack;g.hurt=(q,amount,source)=>{if(source===spider){hits++;lastStack=new Error().stack;}};
 g.time+=.05;g.tickCombatActors(.05);assert.equal(hits,0,JSON.stringify({wildlife:spider.wildlife,faction:spider.faction,guard:guard.groupTurn,spider:spider.groupTurn,room:p.room,ground:p.groundHeight,lastStack}));
 guard.hp=0;g.time+=.05;g.tickCombatActors(.05);g.time+=.5;g.tickCombatActors(.05);assert.equal(hits,1,'the contact attack resumes after the shared opening');
});


test('semantic active phases keep the entire swing reserved after its tell',()=>{
 const {g,p,a,b}=scene();request(g,a,p);a.speciesCombat={phase:'windup'};g.time+=.05;maintain(g);
 a.speciesCombat.phase='active';assert.equal(combatPhase(a),'active');g.time+=.8;assert.equal(request(g,b,p),false);
 a.speciesCombat.phase='recover';maintain(g);assert.equal(request(g,b,p),false);g.time+=.39;assert.ok(request(g,b,p));
});
