import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,EVENTS} from '../src/core.mjs';
import {initializeTacticalEnemy,tacticalPhase} from '../src/combat-tactics-state.mjs';
import {damageEnemy} from '../src/enemy-damage.mjs';
import {saveSession,restoreSession} from '../src/session.mjs';
const setup=()=>{
  const g=new Game(()=>.5),p=g.addPlayer('keyboard');g.start();
  Object.assign(g,{openingBoard:false,scenery:[],weather:null,event:null,enemies:[],traps:[],house:null});g.terrain.fill('grass');g.persist=()=>{};g.onSound=()=>{};g.time=20;
  Object.assign(p,{x:600,y:600,faceX:1,faceY:0,equipment:{hand1:'sword'},invincible:true});return {g,p};
};
const actor=(g,role,x=700,y=600)=>{
  const e={id:g.nextId++,combatRole:role,kind:role==='shield'?'skeleton':role==='charger'?'lion':'archer',x,y,hp:1000,maxHp:1000,speed:60,damage:15,faceX:-1,faceY:0};initializeTacticalEnemy(e);e.cooldown=0;g.enemies.push(e);return e;
};
const ai=(g,n=1)=>{for(let k=0;k<n;k++){g.time+=.02;g.tickCombatActors(.02);}};
const input=(g,value={},n=1)=>{for(let k=0;k<n;k++)g.update(.02,{keyboard:value});};
test('Crossfire is a playable mixed group with shield, charger and finite-quiver archer',()=>{
  const {g}=setup(),index=EVENTS.findIndex(event=>event.name==='Crossfire patrol');assert.ok(index>=0);g.spawnEvent(index,{force:true});
  const group=g.enemies.filter(e=>e.combatRole);assert.deepEqual(group.map(e=>e.combatRole),['shield','charger','archer']);
  assert.equal(group[0].equipment.hand2,'shield');assert.ok(!group[0].lanternBearer);assert.equal(group[2].arrowsLeft,12);
  assert.ok(Math.hypot(group[0].x-group[2].x,group[0].y-group[2].y)<150);
});
test('shield chips frontal physical hits, takes flank damage and exposes a heavy windup break',()=>{
  const {g,p}=setup(),e=actor(g,'shield');
  assert.equal(damageEnemy(e,100,'physical',{g,p}),20);assert.ok(e.tacticalBlocked);
  p.x=800;assert.equal(damageEnemy(e,100,'physical',{g,p}),100);assert.ok(!e.tacticalBlocked);
  p.x=600;tacticalPhase(e,'windup',.62);damageEnemy(e,100,'physical',{g,p,heavy:true});assert.equal(e.tactics.phase,'stagger');
  assert.equal(damageEnemy(e,100,'physical',{g,p}),130);
});
test('incoming projectile direction determines shield guard and magic bypasses it',()=>{
  const {g,p}=setup(),e=actor(g,'shield');assert.equal(damageEnemy(e,100,'physical',{g,shot:{x:700,y:600,vx:270,vy:0}}),20);
  p.x=800;assert.equal(damageEnemy(e,100,'physical',{g,p,shot:{x:700,y:600,vx:270,vy:0}}),20,'moving the shooter does not reverse an airborne arrow');
  assert.equal(damageEnemy(e,100,'magic',{g,shot:{x:700,y:600,vx:270,vy:0}}),100);
});
test('actual light sword contact cannot shove a guard, while the connected finisher breaks its windup',()=>{
  const {g,p}=setup(),e=actor(g,'shield',645);e.speed=0;e.cooldown=99;
  g.attack(p);input(g,{},17);assert.equal(e.x,645);assert.ok(e.tacticalBlocked);assert.ok(e.hp<1000);
  p.comboIndex=1;p.comboUntil=g.time+2;tacticalPhase(e,'windup',.62);e.swordHitPause=0;
  g.attack(p);input(g,{},13);assert.equal(p.attackClip,'swipe_big');assert.equal(e.tactics.phase,'stagger');assert.ok(!e.tacticalBlocked);
  assert.equal(damageEnemy(e,17,'physical',{g,p}),22,'opening bonus keeps damage integral');
});
test('charger locks its tell, misses a sidestep and leaves a generous punish window',()=>{
  const {g,p}=setup(),e=actor(g,'charger');let hits=0;g.hurt=()=>hits++;
  ai(g);assert.equal(e.tactics.phase,'windup');ai(g,24);const face=[e.faceX,e.faceY];p.y=720;ai(g,13);
  assert.deepEqual([e.faceX,e.faceY],face);ai(g,29);assert.equal(hits,0);assert.equal(e.tactics.phase,'recover');assert.ok(e.tactics.remaining>.9);
});
test('charger sweeps walls and each target is hit once per rush',()=>{
  const {g,p}=setup(),e=actor(g,'charger');let hits=0;g.hurt=()=>hits++;p.x=665;
  tacticalPhase(e,'active',.55);ai(g,15);assert.equal(hits,1);
  const x=e.x;g.moveActor=()=>{};ai(g);assert.equal(e.x,x);assert.equal(e.tactics.phase,'recover');
});
test('melee and ranged roles share one clear offensive tell against the same player',()=>{
  const {g}=setup();actor(g,'shield',645);actor(g,'charger',740);actor(g,'archer',840,740);ai(g);
  assert.equal(g.enemies.filter(e=>e.combatRole!=='archer'&&e.tactics.phase==='windup').length,1);
  assert.equal(g.enemies.filter(e=>e.tactics.phase==='windup').length,1);assert.notEqual(g.enemies[2].tactics.phase,'windup');
});
test('archer commits its aim, consumes one arrow and can be interrupted during draw',()=>{
  const {g,p}=setup(),e=actor(g,'archer',820);ai(g,24);const dx=e.tactics.dx,dy=e.tactics.dy;p.y=740;ai(g,13);
  assert.equal(g.arrows.length,1);assert.equal(e.arrowsLeft,11);assert.equal(g.arrows[0].vx,dx*270);assert.equal(g.arrows[0].vy,dy*270);assert.equal(e.tactics.phase,'recover');
  tacticalPhase(e,'windup',.7);damageEnemy(e,10,'physical',{g,p});ai(g,20);assert.equal(g.arrows.length,1);assert.equal(e.tactics.phase,'stagger');
});
test('an empty quiver cannot create free arrows',()=>{
  const {g}=setup(),e=actor(g,'archer',820);e.arrowsLeft=0;ai(g,160);assert.equal(g.arrows.length,0);assert.equal(e.arrowsLeft,0);
});
test('freeze cancels committed attacks, traps work and absent targets cancel stale windups',()=>{
  const {g,p}=setup(),e=actor(g,'charger');tacticalPhase(e,'active',.55);e.frozen=.2;const x=e.x;ai(g,6);assert.equal(e.x,x);assert.equal(e.tactics.phase,'stagger');
  e.frozen=0;g.traps=[{x:e.x,y:e.y,life:10}];ai(g);assert.equal(e.state,'snared');ai(g,101);assert.equal(e.hp,0);
  const archer=actor(g,'archer',800);tacticalPhase(archer,'windup',.7);p.room={};ai(g,40);assert.equal(g.arrows.length,0);assert.equal(archer.tactics.phase,'approach');
});
test('sword recovery dodge preserves the next combo step and queues it until reposition finishes',()=>{
  const {g,p}=setup();g.attack(p);assert.equal(p.comboIndex,0);
  g.playerDashMotion(p,{dodge:true},.02,0,1);assert.equal(p.dashTime||0,0,'startup cannot cancel before contact');
  g.playerDashMotion(p,{dodge:false},.02,0,1);input(g,{},8);assert.ok(!p.swordStrike);
  g.playerDashMotion(p,{dodge:true},.02,0,1);assert.ok(p.dashTime>0);assert.equal(p.attack,0);
  g.attack(p);assert.ok(p.queuedAttack);assert.equal(p.comboIndex,0);input(g,{},18);
  assert.equal(p.comboIndex,1);assert.equal(p.attackClip,'swipe_two');
});
test('dodging cannot revive an expired sword combo',()=>{
  const {g,p}=setup();g.attack(p);input(g,{},80);assert.ok(g.time>p.comboUntil);
  g.playerDashMotion(p,{dodge:true},.02,0,1);g.attack(p);input(g,{},18);assert.equal(p.comboIndex,0);
});
test('buffered heavy follow-up survives the whole finisher and saves retain enemy commitments safely',()=>{
  const {g,p}=setup();g.attack(p);input(g,{},17);g.attack(p);input(g,{},17);g.attack(p);assert.equal(p.attackClip,'swipe_big');g.attack(p);input(g,{},27);assert.equal(p.comboIndex,0);
  const e=actor(g,'archer',820);tacticalPhase(e,'windup',.7);e.tactics.targetId=p.id;
  const restored=restoreSession(JSON.parse(JSON.stringify(saveSession(g))));assert.equal(restored.enemies[0].tactics.phase,'windup');assert.equal(restored.enemies[0].arrowsLeft,12);
});
