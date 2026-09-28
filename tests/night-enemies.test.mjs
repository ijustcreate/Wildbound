import test from 'node:test';
import assert from 'node:assert/strict';
import { NIGHT_EVENTS, startNightEvent, tickNightEnemy, tickNightEnemies, hitNightEnemyVines, nightEnemyOpacity, drawNightEnemyEffects } from '../src/night-enemies.mjs';
import { snapshot } from '../src/rooms.mjs';
import { nightAction } from '../src/night-rigs.mjs';
import { ITEMS } from '../src/items.mjs';
import { creatures } from '../src/definitions.mjs';
const player=(id=1,x=150,y=100)=>({id,x,y,hp:100,maxHp:100,invuln:0,equipment:{}});
function setup(kind='hunter',x=100,y=100){
  const e={...NIGHT_EVENTS.find(e=>e.kind===kind),id:10,x,y,maxHp:200,state:'hunt',timer:0};
  const g={phase:'play',time:0,sky:{elapsed:350},players:[player()],enemies:[e],traps:[],explored:new Set(),
    projectileBlocked:()=>false,blocked:()=>false,
    moveActor(a,dx,dy){a.moving=false;if(!this.projectileBlocked(a.x+dx,a.y+dy)){a.x+=dx;a.y+=dy;a.moving=Math.hypot(dx,dy)>.01;}},
    shieldBlocks:()=>false,hurt(p,d){if(p.invuln<=0&&!p.room){p.hp-=d;p.invuln=.75;}}};
  startNightEvent(g,e,[e]);return {g,e,p:g.players[0]};
}
const tick=(g,e,dt=.05,p=g.players[0])=>tickNightEnemy(g,e,p,dt);

test('public contract, event restrictions and nullable targets',()=>{
  assert.equal(NIGHT_EVENTS.length,10);
  for(const event of NIGHT_EVENTS){const {g,e}=setup(event.kind);assert.equal(tick(g,e,.05,null),true);assert.ok(event.kind==='hunter'||event.environments.length);}
  assert.equal(NIGHT_EVENTS.find(e=>e.kind==='hunter').environments,undefined);
  assert.ok(NIGHT_EVENTS.find(e=>e.kind==='burrower').environments.includes('desert'));
  assert.ok(NIGHT_EVENTS.filter(e=>['elephant','zebra','pelican'].includes(e.kind)).every(e=>e.weight===0));
  const {g}=setup();assert.equal(tickNightEnemy(g,{kind:'wolf'},null,.1),false);
  assert.deepEqual(NIGHT_EVENTS[0].times,['night','dusk']);
});
test('hunter locks a visible aim, fires after warning and uses swept hits',()=>{
  const {g,e,p}=setup();p.x=350;tick(g,e);assert.equal(e.night.phase,'aim');
  tick(g,e,.5);assert.equal(g.nightEnemies.shots.length,0);
  tick(g,e,.7);assert.equal(g.nightEnemies.shots.length,1);
  tickNightEnemies(g,.6);assert.ok(p.hp<100);assert.equal(g.nightEnemies.shots.length,0);
});
test('hunter aims at the telegraphed point rather than tracking dodges',()=>{
  const {g,e,p}=setup();p.x=350;tick(g,e);p.y=220;tick(g,e,1.2);
  assert.equal(g.nightEnemies.shots[0].vy,0);tickNightEnemies(g,1);assert.equal(p.hp,100);
});
test('survival is 120 simulation seconds; pause and JSON snapshot preserve progress',()=>{
  const {g,e}=setup();tickNightEnemies(g,60);g.paused=true;tickNightEnemies(g,90);tick(g,e,90);
  assert.equal(e.night.objective.elapsed,60);
  const restored=JSON.parse(JSON.stringify(snapshot(g)));Object.assign(g,restored);g.explored=new Set(restored.explored);g.paused=false;
  tickNightEnemies(g,59.9);assert.equal(g.nightEnemies.objectives.length,0);
  tickNightEnemies(g,.1);assert.equal(g.nightEnemies.objectives[0].status,'survived');assert.equal(g.enemies[0].escaped,true);
  tickNightEnemies(g,1);assert.equal(g.nightEnemies.objectives.length,1);
});
test('hunter death wins once and clears owned bullets and traps',()=>{
  const {g,e}=setup();g.nightEnemies.traps.push({ownerId:e.id});g.nightEnemies.shots.push({ownerId:e.id});e.hp=0;
  tickNightEnemies(g,.1);tickNightEnemies(g,.1);assert.equal(g.nightEnemies.objectives.length,1);
  assert.equal(g.nightEnemies.objectives[0].status,'killed');assert.equal(g.nightEnemies.traps.length,0);
});
test('walls, rooms, shields and invulnerability block shots and trap side effects',()=>{
  for(const mode of ['wall','room','shield','invuln']){
    const {g,p}=setup('poison_pod');p.x=140;
    if(mode==='wall')g.projectileBlocked=x=>x>=120;
    if(mode==='room')p.room='shop';if(mode==='shield')g.shieldBlocks=()=>true;if(mode==='invuln')p.invuln=1;
    g.nightEnemies.shots.push({x:100,y:100,vx:480,vy:0,remaining:160,life:1,damage:10,kind:'barb'});
    g.nightEnemies.traps.push({x:140,y:100,life:5,arm:0,damage:10});
    if(mode==='wall')g.nightEnemies.traps[0].x=110;
    tickNightEnemies(g,.2);assert.equal(p.hp,100,mode);assert.equal(p.poison,undefined);assert.equal(p.stun,undefined);
  }
});
test('barbs have a hard 160 pixel travel cap, even on long frames',()=>{
  const {g,e,p}=setup('poison_pod');p.x=250;tick(g,e);tick(g,e,.8);
  assert.equal(g.nightEnemies.shots[0].remaining,160);p.x=290;
  tickNightEnemies(g,10);assert.equal(p.hp,100);assert.equal(g.nightEnemies.shots.length,0);
});
test('stationary plants honor capture, interrupt and slow player traps',()=>{
  for(const kind of ['poison_pod','mimic_vine','carnivorous_flower']){
    const {g,e}=setup(kind);g.traps.push({x:e.x,y:e.y,life:10,capture:2});tick(g,e);
    assert.equal(e.state,'snared');assert.equal(e.timer,4);tick(g,e,4);assert.equal(e.hp,0);
  }
  for(const variant of ['interrupt','slow']){const {g,e}=setup('poison_pod');g.traps.push({x:e.x,y:e.y,life:10,variant});tick(g,e);assert.notEqual(e.state,'snared');assert.ok(e.hp>0);}
});
function grab(){const s=setup('carnivorous_flower');s.p.x=190;tick(s.g,s.e);tick(s.g,s.e,.9);assert.equal(s.e.night.captiveId,s.p.id);return s;}
test('flower rescue via flower damage, vine hit, solo timeout or room change',()=>{
  for(const mode of ['damage','vine','solo','room','wall']){
    const {g,e,p}=grab();
    if(mode==='damage')e.hp-=1;
    if(mode==='vine')assert.equal(hitNightEnemyVines(g,player(2,150),10),1);
    if(mode==='room')p.room='shop';if(mode==='wall')g.projectileBlocked=()=>true;
    tick(g,e,mode==='solo'?3.1:.05);assert.equal(e.night.captiveId,undefined,mode);
  }
});
test('flower cannot grab invulnerable players or attack through walls',()=>{
  for(const mode of ['invuln','wall']){const {g,e,p}=setup('carnivorous_flower');if(mode==='wall')g.projectileBlocked=()=>true;else p.invuln=1;tick(g,e);tick(g,e,1);assert.equal(e.night.captiveId,undefined);assert.equal(p.hp,100);}
});
test('burrow emergence warning precedes bite and reburrow',()=>{
  const {g,e,p}=setup('burrower');p.x=125;tick(g,e);tick(g,e,1.6);assert.equal(e.night.phase,'emerge');assert.equal(p.hp,100);
  tick(g,e,.9);assert.ok(p.hp<100);assert.equal(e.night.phase,'exposed');tick(g,e,1.1);assert.equal(e.night.phase,'burrow');
});
test('stalker is mostly invisible in darkness and investigates actual noise records',()=>{
  const {g,e}=setup('night_stalker');g.noises=[{x:220,y:100,sourceId:2,kind:'step',radius:200,age:0}];
  tick(g,e,.1,null);assert.ok(e.x>100);assert.ok(e.night.trail.length);assert.ok(nightEnemyOpacity(g,e)<.15);
  g.sky.elapsed=0;assert.ok(nightEnemyOpacity(g,e)>.5);
});
test('carrion follows wounded then downed players without damaging downed targets',()=>{
  const {g,e,p}=setup('carrion_pack');g.players.push(player(2,240));g.players[1].hp=10;tick(g,e);assert.equal(e.night.targetId,2);
  p.hp=0;tick(g,e);assert.equal(e.night.preyId,1);assert.equal(e.night.targetId,2);assert.equal(p.hp,0);
});
test('drawing is read only and paused hooks leave serialized state unchanged',()=>{
  const {g,e}=setup();tick(g,e);g.paused=true;const before=JSON.stringify(snapshot(g));tick(g,e,1);tickNightEnemies(g,1);
  const ctx=new Proxy({}, {get:()=>()=>{},set:()=>true});drawNightEnemyEffects(ctx,g);assert.equal(JSON.stringify(snapshot(g)),before);
});
test('hunter equipment is two handed, room timer pauses and aim/reload use rig clips',()=>{
  const {g,e,p}=setup();assert.equal(e.equipment.head,'safari_hat');assert.equal(e.equipment.hand1,'rifle');assert.equal(e.equipment.hand2,'occupied');
  p.room='shop';tickNightEnemies(g,120);assert.equal(e.night.objective.elapsed,0);delete p.room;
  p.x=350;tick(g,e);assert.equal(nightAction(e.kind,e),'aim');tick(g,e,1.2);assert.equal(nightAction(e.kind,e),'shoot');
  tick(g,e,.3);assert.equal(nightAction(e.kind,e),'reload');
});
test('stalker retreats away from carried/fire light, leaves readable tracks and plays steps',()=>{
  const {g,e,p}=setup('night_stalker');g.firePatches=[{x:84,y:84,life:5}];const sounds=[];g.onSound=(cue)=>sounds.push(cue);
  const before=Math.hypot(e.x-100,e.y-100);tick(g,e,.1);assert.equal(e.night.phase,'recover');assert.ok(Math.hypot(e.x-100,e.y-100)>before);
  assert.equal(nightAction(e.kind,e),'retreat');assert.ok(sounds.includes('grass'));assert.ok(e.night.trail.length);
});
test('burrow rig phases, interrupt recovery and peaceful stampede ownership',()=>{
  const {g,e}=setup('burrower');tick(g,e);assert.equal(nightAction(e.kind,e),'underground');
  g.traps.push({x:e.x,y:e.y,life:3,variant:'interrupt'});tick(g,e);tick(g,e,2);tick(g,e);assert.equal(e.night.phase,'burrow');
  for(const kind of ['elephant','zebra','pelican']){const s=setup(kind);s.e.state='stampede';tick(s.g,s.e);assert.equal(s.e.state,'stampede');}
});
test('hunter backs away and deploys visible traps with an arming delay',()=>{
  const {g,e,p}=setup();const old=e.x;tick(g,e,.1);assert.ok(e.x<old);tick(g,e,4.1);
  const trap=g.nightEnemies.traps[0];assert.ok(trap.arm>0);p.x=trap.x;p.y=trap.y;
  g.nightEnemies.shots=[];
  tickNightEnemies(g,.5);assert.equal(p.hp,100);tickNightEnemies(g,.6);assert.ok(p.hp<100);assert.equal(p.stun,.8);
});
test('burrower approaches prey 300px away beyond the underground timer and emerges',()=>{
  const {g,e,p}=setup('burrower');p.x=400;
  for(let i=0;i<40;i++)tick(g,e,.05);
  assert.equal(e.night.phase,'burrow');assert.ok(e.night.timer<0);
  const x=e.x;
  for(let i=0;i<100&&e.night.phase==='burrow';i++)tick(g,e,.05);
  assert.ok(e.x>x);assert.equal(e.night.phase,'emerge');assert.ok(Math.hypot(e.x-p.x,e.y-p.y)<80);
  assert.equal(p.hp,100);assert.ok(e.night.timer>0);
});
test('burrower resumes a distant approach after losing and reacquiring prey',()=>{
  const {g,e,p}=setup('burrower');p.x=400;tick(g,e);tick(g,e,2,null);const x=e.x;
  tick(g,e,.05);assert.ok(e.x>x);assert.equal(e.night.phase,'burrow');
});
test('hunter shares rifle ballistics and plays its sound only when firing',()=>{
  const {g,e,p}=setup();p.x=350;const sounds=[];g.onSound=(cue)=>sounds.push(cue);
  tick(g,e);assert.equal(sounds.length,0);tick(g,e,1.2);
  const b=g.nightEnemies.shots[0];assert.equal(Math.hypot(b.vx,b.vy),ITEMS.rifle.shot.speed);
  assert.equal(b.remaining,ITEMS.rifle.shot.range);assert.equal(e.night.timer,ITEMS.rifle.shot.cooldown);assert.deepEqual(sounds,['rifle']);
});
test('mimic conceals at rest, reveals its grab, and conceals again after recovery',()=>{
  const {g,e,p}=setup('mimic_vine');p.x=400;assert.equal(nightEnemyOpacity(g,e),.15);
  tick(g,e);assert.equal(nightEnemyOpacity(g,e),.15);p.x=190;tick(g,e);assert.equal(nightEnemyOpacity(g,e),1);
  p.x=400;tick(g,e,1);tick(g,e,2.1);assert.equal(nightEnemyOpacity(g,e),.15);
  e.flash=.1;assert.equal(nightEnemyOpacity(g,e),1);
});
test('live editable hunt/melee flags gate movement and contact attacks',()=>{
  const {g,e,p}=setup('burrower');const original=creatures.burrower.behaviors.hunt;
  try {
    creatures.burrower.behaviors.hunt=false;p.x=400;tick(g,e,2);assert.equal(e.x,100);
    creatures.burrower.behaviors.hunt=true;tick(g,e,.1);assert.ok(e.x>100);
  } finally {creatures.burrower.behaviors.hunt=original;}
  for(const kind of ['carrion_pack','carnivorous_flower','mimic_vine','burrower','night_stalker']){
    const s=setup(kind);s.p.x=120;tick(s.g,s.e);s.e.behaviors={melee:false};
    for(let i=0;i<100;i++)tick(s.g,s.e,.05);
    assert.equal(s.p.hp,100,kind);assert.equal(s.e.night.captiveId,undefined,kind);
  }
});
