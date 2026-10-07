import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,EVENTS} from '../src/core.mjs';
import {creatures,applyDefinitions} from '../src/definitions.mjs';
import {ANACONDA_EVENT,tickAnaconda} from '../src/anaconda.mjs';
import {ANACONDA_SEGMENTS,ANACONDA_TRAIL_LIMIT,ANACONDA_CLEARANCE,initializeAnaconda,anacondaBody,updateAnacondaBody,anacondaContact,anacondaBounds,anacondaProjectileHit} from '../src/anaconda-body.mjs';
import {anacondaRenderParts,ANACONDA_ART_CACHE_LIMIT} from '../src/anaconda-art.mjs';
import {meleeCanHit} from '../src/melee-geometry.mjs';
import {startJump,tickJump} from '../src/jumping.mjs';
import {footprintHit} from '../src/world.mjs';
import {saveSession,restoreSession} from '../src/session.mjs';
import {befriendCreature} from '../src/friendly-creatures.mjs';

function field(){
  const g=new Game(()=>.42);g.phase='play';g.openingBoard=false;g.terrain.fill('grass');g.scenery=[];g.house=null;g.enemies=[];
  const p=g.addPlayer('keyboard','Jump tester');Object.assign(p,{x:580,y:500,hp:999,maxHp:999});return g;
}
function snake(g,extra={}){
  const e={kind:'anaconda',id:30,x:500,y:500,hp:380,maxHp:380,speed:46,damage:26,faceX:1,faceY:0,orbit:1,state:'hunt',cooldown:0,flash:0,tacticTime:1,...extra};
  g.enemies.push(e);initializeAnaconda(e,g);return e;
}
function advance(g,e,count){for(let i=0;i<count;i++){g.time+=.05;tickAnaconda(g,e,g.players,.05,creatures.anaconda.stats);}}

test('new forest event is appended, old snake indices and definitions are intact, old design packs keep the new event',()=>{
  assert.equal(EVENTS[0].kind,'lion');assert.equal(EVENTS[1].kind,'bat');assert.equal(EVENTS[2].kind,'snake');assert.equal(EVENTS[3].kind,'crocodile');
  assert.equal(EVENTS.filter(e=>e.kind==='anaconda').length,1);assert.ok(EVENTS.findIndex(e=>e.kind==='anaconda')>EVENTS.findIndex(e=>e.spiderNest));
  assert.equal(creatures.anaconda.rig.type,'serpent');assert.equal(creatures.anaconda.aiKind,'anaconda');assert.equal(creatures.anaconda.stats.hp,380);
  assert.equal(creatures.snake.stats.hp,36);assert.equal(creatures.snake.rig.tailLength,34);assert.equal(creatures.snake.behaviors.dash,true);
  const oldEvents=EVENTS.filter(e=>e.kind!=='anaconda'),imported=EVENTS.slice(),indices=oldEvents.map(e=>e.name);applyDefinitions({version:1,events:oldEvents},imported,{});
  assert.deepEqual(imported.slice(0,indices.length).map(e=>e.name),indices);assert.equal(imported.at(-1).kind,'anaconda');
  const g=field();g.spawnEvent(EVENTS.findIndex(e=>e.kind==='anaconda'));assert.equal(g.enemies.length,1);assert.equal(g.enemies[0].anacondaBody.segments.length,40);
  assert.equal(g.event.name,ANACONDA_EVENT.name);assert.equal(g.eventSpawnCount,1);
});

test('world-space body follows a bounded trail, stays still at rest and avoids map-wide teleport ribbons',()=>{
  const g=field(),e=snake(g);let body=anacondaBody(e);assert.equal(body.trail.length,160);assert.equal(body.segments.length,40);
  for(let i=0;i<3000;i++){
    e.x=500+Math.cos(i/130)*100;e.y=500+Math.sin(i/130)*100;body=updateAnacondaBody(g,e);
    assert.ok(body.trail.length<=ANACONDA_TRAIL_LIMIT);assert.equal(body.segments.length,ANACONDA_SEGMENTS);
    assert.ok(body.segments.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)&&p.radius<=16));
    for(let j=1;j<body.segments.length;j++)assert.ok(Math.hypot(body.segments[j].x-body.segments[j-1].x,body.segments[j].y-body.segments[j-1].y)<=10.00001);
  }
  const stopped=JSON.stringify(body);for(let i=0;i<20;i++)updateAnacondaBody(g,e);assert.equal(JSON.stringify(body),stopped);
  e.x=1400;e.y=1300;body=updateAnacondaBody(g,e);assert.ok(body.segments.every(p=>Math.hypot(p.x-e.x,p.y-e.y)<430));
  const bounds=anacondaBounds(e);assert.ok(bounds.right>bounds.left);assert.equal([...anacondaRenderParts(e)].length,40);assert.equal(ANACONDA_ART_CACHE_LIMIT,128);
});

test('tree route winds the head and tail around live roots without crossing their footprint, in both directions',()=>{
  for(const orbit of [-1,1]){
    const g=field(),tree={kind:'tree',id:7,procedural:true,x:700,y:720,size:80,rootY:748};g.scenery=[tree];
    Object.assign(g.players[0],{x:940,y:748});const e=snake(g,{x:646,y:748,orbit,cooldown:999});let routeSeen=false,maxSweep=0;
    for(let i=0;i<105;i++){
      advance(g,e,1);routeSeen ||= !!e.anacondaTree;
      const a=Math.atan2(e.y-748,e.x-700);maxSweep=Math.max(maxSweep,Math.abs(Math.atan2(Math.sin(a-Math.PI),Math.cos(a-Math.PI))));
      for(const p of anacondaBody(e).segments)assert.equal(footprintHit(tree,null,p.x,p.y,Math.max(1,p.radius-1)),false);
    }
    assert.ok(routeSeen);assert.ok(maxSweep>1.3,'head must visibly wind around root');
    const prior=e.anacondaTree;tree.fallen=true;advance(g,e,1);assert.equal(e.anacondaTree,null);assert.ok(prior||e.anacondaTreeCooldown>0);
  }
});

test('grounded players are stopped by a coil, jump clearance passes it, and already-overlapped players can escape',()=>{
  const g=field(),e=snake(g),p=g.players[0],coil=anacondaBody(e).segments[18];
  Object.assign(p,{x:coil.x,y:coil.y+40});
  g.moveActor(p,0,-80);assert.ok(p.y>coil.y+12);
  Object.assign(p,{x:coil.x,y:coil.y+40,jumpHeight:ANACONDA_CLEARANCE});g.moveActor(p,0,-80);assert.ok(p.y<coil.y-20);
  p.jumpHeight=0;p.groundHeight=0;p.x=coil.x;p.y=coil.y;const y=p.y;g.moveActor(p,0,45);assert.ok(p.y>y+25);
  Object.assign(p,{x:coil.x,y:coil.y+40,jumpHeight:0});assert.ok(startJump(p));let peak=0;
  for(let i=0;i<30;i++){tickJump(p,.025,g,0);peak=Math.max(peak,p.jumpHeight);}assert.ok(peak>ANACONDA_CLEARANCE);
  e.hp=0;assert.equal(g.blocked(coil.x,coil.y,8,false,false,false,0,0,false,p),false);
});

test('bite has a locked warning, strikes each victim once and recovers; sidesteps evade the bite',()=>{
  const g=field(),e=snake(g),hits=[];g.hurt=(p,amount)=>hits.push({id:p.id,amount});
  advance(g,e,1);assert.equal(e.state,'windup');assert.equal(hits.length,0);const dx=e.dx,dy=e.dy;
  advance(g,e,15);assert.equal(e.state,'windup');assert.equal(hits.length,0);assert.equal(e.dx,dx);assert.equal(e.dy,dy);
  advance(g,e,18);assert.equal(e.state,'recover');assert.equal(hits.filter(h=>h.amount===26).length,1);assert.ok(e.cooldown>0);
  const other=field(),miss=snake(other),missHits=[];other.hurt=(p,amount)=>missHits.push(amount);advance(other,miss,1);
  other.players[0].y+=120;advance(other,miss,33);assert.equal(miss.state,'recover');assert.equal(missHits.length,0);
});

test('body contact respects airborne height, and one update cannot deal one hit for every overlapping section',()=>{
  const g=field(),e=snake(g,{cooldown:999,speed:0}),p=g.players[0],coil=anacondaBody(e).segments[17],hits=[];
  g.hurt=(p,amount)=>hits.push(amount);Object.assign(p,{x:coil.x,y:coil.y,jumpHeight:ANACONDA_CLEARANCE});advance(g,e,3);assert.equal(hits.length,0);
  p.jumpHeight=0;advance(g,e,1);assert.deepEqual(hits,[7]);advance(g,e,10);assert.deepEqual(hits,[7]);assert.ok(e.anacondaContacts.length<=16);
});

test('melee hits a distant coil once, local visibility does not depend on the head, projectiles have a bounded body predicate',()=>{
  const g=field(),e=snake(g,{cooldown:999}),p=g.players[0],coil=anacondaBody(e).segments[27];
  Object.assign(p,{x:coil.x,y:coil.y+30,faceX:0,faceY:-1});p.equipment.hand1='sword';const hp=e.hp;g.attack(p);
  assert.ok(e.hp<hp);assert.ok(hp-e.hp<60);assert.ok(Math.hypot(p.x-e.x,p.y-e.y)>200);
  assert.ok(meleeCanHit(p,e,{range:76,arc:90},point=>Math.hypot(point.x-p.x,point.y-p.y)<90));
  assert.equal(meleeCanHit(p,e,{range:76,arc:90},()=>false),false);
  const section=anacondaBody(e).segments[25];assert.ok(anacondaProjectileHit(g,e,section,3,12));
  assert.equal(anacondaProjectileHit(g,e,section,3,20),false);
  assert.equal(anacondaProjectileHit(g,e,section,3,40),false);g.projectileBlocked=()=>true;assert.equal(anacondaProjectileHit(g,e,section),false);
});

test('freezing and hidden targets stop geometry and bite timers; friendship keeps the tail and makes it harmless',()=>{
  const g=field(),e=snake(g,{frozen:1,state:'windup',timer:.8,dx:1,dy:0}),p=g.players[0];const before=JSON.stringify(e.anacondaBody);
  g.update(.05,{});assert.equal(JSON.stringify(e.anacondaBody),before);assert.equal(e.timer,.8);assert.equal(e.moving,false);
  e.frozen=0;p.room='storage';g.update(.05,{});assert.equal(JSON.stringify(e.anacondaBody),before);assert.equal(e.timer,.8);
  p.room=null;assert.ok(befriendCreature(e,p.id));assert.equal(e.state,'idle');
  const coil=anacondaBody(e).segments[25];assert.equal(g.blocked(coil.x,coil.y,8,false,false,false,0,0,false,p),false);
  const hp=p.hp;for(let i=0;i<20;i++)g.update(.05,{});assert.equal(p.hp,hp);assert.equal(e.faction,'ally');assert.equal(e.anacondaBody.segments.length,40);
});

test('real magic and arrows strike distant body sections and lodged arrows follow their section',()=>{
 const g=field(),e=snake(g,{cooldown:999,speed:0}),p=g.players[0],coil=anacondaBody(e).segments[27];
 Object.assign(p,{x:coil.x,y:coil.y+60});const hp=e.hp;
 g.spells=[{x:coil.x,y:coil.y,vx:1,vy:0,owner:p.id,damage:12,life:1,size:6}];g.tickAdventure(.01,{});assert.ok(e.hp<hp);assert.equal(g.spells.length,0);
 const hp2=e.hp,a={x:coil.x,y:coil.y,vx:1,vy:0,z:8,vz:0,gravity:0,owner:p.id,damage:12};g.arrows=[a];g.tickAdventure(.01,{});assert.ok(e.hp<hp2);assert.equal(a.enemy,e.id);assert.ok(Number.isInteger(a.anacondaSection));
 const part=anacondaBody(e).segments[a.anacondaSection];part.x+=7;part.y+=5;g.tickAdventure(.01,{});assert.equal(a.x,part.x+a.sectionOffsetX);assert.equal(a.y,part.y+a.sectionOffsetY);
});

test('body and pending attack survive session reload; death awards only one enemy reward and clears the body obstacle',()=>{
  const g=field(),e=snake(g);advance(g,e,4);
  const saved=JSON.parse(JSON.stringify(saveSession(g))),restored=restoreSession(saved),back=restored.enemies.find(q=>q.id===e.id);
  assert.equal(back.state,e.state);assert.equal(back.timer,e.timer);assert.deepEqual(anacondaBody(back).segments,e.anacondaBody.segments);
  let rewards=0;restored.enemyLoot=()=>rewards++;back.hp=0;restored.update(.05,{});assert.equal(rewards,1);assert.equal(restored.killedCreatures.anaconda,1);assert.equal(restored.cleared,1);assert.equal(back.state,'death');
  restored.update(.05,{});assert.equal(rewards,1);const dead=restoreSession(JSON.parse(JSON.stringify(saveSession(restored))));dead.enemyLoot=()=>rewards++;dead.update(.05,{});assert.equal(rewards,1);assert.equal(dead.cleared,1);
  for(let i=0;i<75;i++)dead.update(.05,{});assert.ok(!dead.enemies.some(q=>q.id===e.id));
});

test('snare on the tail captures the owning enemy once; friendly death gives no kill or loot reward',()=>{
  const g=field(),e=snake(g,{cooldown:999}),coil=anacondaBody(e).segments[28];g.traps=[{x:coil.x,y:coil.y,life:10,variant:'snare'}];advance(g,e,1);
  assert.equal(e.state,'snared');assert.equal(g.traps[0].life,0);advance(g,e,41);assert.ok(e.hp<=0);
  const allyGame=field(),ally=snake(allyGame);befriendCreature(ally,allyGame.players[0].id);let rewards=0;allyGame.enemyLoot=()=>rewards++;ally.hp=0;allyGame.update(.05,{});
  assert.equal(rewards,0);assert.equal(allyGame.cleared,0);assert.equal(allyGame.killedCreatures?.anaconda,undefined);
});

test('reload clamps oversized trails and rebuilds invalid geometry safely',()=>{
  const g=field(),e=snake(g);e.anacondaBody=JSON.parse(JSON.stringify(e.anacondaBody));e.anacondaBody.trail.push(...Array.from({length:1000},()=>({x:100,y:100})));
  assert.equal(anacondaBody(e).trail.length,160);e.anacondaBody={version:1,trail:[{x:NaN,y:0}],segments:[]};assert.equal(anacondaBody(e,g).segments.length,40);
});

test('editor hunt/melee switches and zero damage are honored by the custom AI',()=>{
  const g=field(),e=snake(g,{damage:0,speed:0,cooldown:999}),p=g.players[0],coil=anacondaBody(e).segments[20],hits=[];
  g.hurt=(p,amount)=>hits.push(amount);Object.assign(p,{x:coil.x,y:coil.y});advance(g,e,1);assert.equal(hits.length,0);
  Object.assign(e,{damage:26,speed:46,cooldown:0,state:'windup',timer:.1});const x=e.x,y=e.y;
  tickAnaconda(g,e,[p],.05,creatures.anaconda.stats,{hunt:false,melee:false});assert.equal(e.state,'hunt');assert.equal(e.x,x);assert.equal(e.y,y);assert.equal(hits.length,0);
});
