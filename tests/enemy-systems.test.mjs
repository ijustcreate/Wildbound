import test from 'node:test';
import assert from 'node:assert/strict';
import {chooseEnemyTarget,recordEnemyPressure,tickEnemyFlinch,enemyOpeningDamage,crowdSteering} from '../src/enemy-systems.mjs';
import {tacticalPhase,initializeTacticalEnemy} from '../src/combat-tactics-state.mjs';
import {tickTacticalEnemy} from '../src/combat-tactics.mjs';
import {tacticalHumanoidAnimation,tacticalHumanoidPose} from '../src/tactical-motion.mjs';
import {skeletonMotions} from '../src/skeleton-motion.mjs';
import {lionMotion,lionFrame} from '../src/lion-motion.mjs';
import {damageEnemy} from '../src/enemy-damage.mjs';
const body=(id,x=100,y=100)=>({id,x,y,hp:100,maxHp:100,kind:'skeleton',faceX:1,faceY:0,state:'hunt',damage:10,speed:50});
test('shared targeting retains a target through tiny distance changes but reacts to an attacker',()=>{
 const e=body(9),a=body(1,180),b=body(2,190),g={time:1};assert.equal(chooseEnemyTarget(g,e,[a,b]),a);
 a.x=185;b.x=180;g.time=1.1;assert.equal(chooseEnemyTarget(g,e,[a,b]),a);
 recordEnemyPressure(g,e,b,40);assert.equal(chooseEnemyTarget(g,e,[a,b]),b);
 b.hp=0;assert.equal(chooseEnemyTarget(g,e,[a,b]),a);a.room={};assert.equal(chooseEnemyTarget(g,e,[a,b]),null);
});
test('threat history is bounded, decays and survives JSON without retaining actors',()=>{
 const e=body(9),g={time:1};for(let id=1;id<30;id++)recordEnemyPressure(g,e,body(id),10);assert.ok(e.enemyMind.threat.length<=8);
 const copy=JSON.parse(JSON.stringify(e));g.time=12;chooseEnemyTarget(g,copy,[body(1,120)]);assert.equal(copy.enemyMind.threat.length,0);
});
test('sustained pressure makes a brief opening, then resistance prevents a permanent stun loop',()=>{
 const e=body(9),g={time:1},p=body(1);for(let k=0;k<4;k++)recordEnemyPressure(g,e,p,5);
 assert.ok(tickEnemyFlinch(g,e,.02));assert.equal(enemyOpeningDamage(g,e,20),23);
 g.time=1.3;assert.ok(!tickEnemyFlinch(g,e,.02));for(let k=0;k<20;k++)recordEnemyPressure(g,e,p,5,{heavy:true});assert.equal(e.enemyFlinchUntil,1.16);
 g.time=3.3;recordEnemyPressure(g,e,p,5,{heavy:true});recordEnemyPressure(g,e,p,5);assert.ok(tickEnemyFlinch(g,e,.02));
});
test('damage integration records the actual shooter and exposes ordinary enemies',()=>{
 const e=body(9),p=body(1),g={time:1,players:[p],effects:[],enemies:[e]};for(let k=0;k<4;k++)damageEnemy(e,3,'physical',{g,shot:{owner:p.id}});
 assert.equal(e.enemyMind.threat[0].id,p.id);assert.ok(e.enemyMind.openUntil>g.time);
});
test('bosses, allies, practice targets and active charges retain their state ownership',()=>{
 for(const props of [{boss:true},{kind:'skeleton_boss'},{faction:'ally'},{practiceTarget:true},{state:'charge'},{combatRole:'shield'}]){
  const e=Object.assign(body(9),props),g={time:1};for(let k=0;k<12;k++)recordEnemyPressure(g,e,body(1),15,{heavy:true});assert.ok(!e.enemyFlinchUntil);
 }
});
test('crowd steering separates pursuit directions without adding speed or moving pets',()=>{
 const a=body(1),b=body(2),g={enemies:[a,b]};const av=crowdSteering(g,a,3,0),bv=crowdSteering(g,b,3,0);
 assert.ok(av.y*bv.y<0);assert.ok(Math.abs(Math.hypot(av.x,av.y)-3)<1e-8);a.faction='ally';assert.deepEqual(crowdSteering(g,a,3,0),{x:3,y:0});
});
const role=(kind,x=100,y=100)=>{const e=body(9,x,y);e.kind=kind==='archer'?'archer':kind==='charger'?'lion':'skeleton';e.combatRole=kind;initializeTacticalEnemy(e);e.cooldown=0;return e;};
const world=e=>({time:10,enemies:[e],traps:[],arrows:[],loot:[],nextId:20,blocked:()=>false,projectileBlocked:()=>false,moveActor(a,x,y){a.x+=x;a.y+=y;return Math.hypot(x,y);},hurt(){}});
test('shield turning has a readable flank window and repeated frontal hits break its guard',()=>{
 const e=role('shield'),g=world(e),p=body(1,0,100);e.speed=0;tickTacticalEnemy(g,e,.02,[p]);assert.ok(e.faceX>.95,'cannot snap around');
 e.faceX=-1;e.faceY=0;for(let k=0;k<6;k++)damageEnemy(e,1,'physical',{g,p});assert.equal(e.tactics.phase,'stagger');assert.equal(e.roleMind.guard,0);
});
test('shield interposes toward a pressured squad archer instead of chasing blindly',()=>{
 const e=role('shield'),g=world(e),p=body(1,300,150),bow=role('archer',200,100);e.group=bow.group=3;g.enemies.push(bow);
 tickTacticalEnemy(g,e,.02,[p]);assert.ok(e.x>100);assert.ok(e.roleMind.moveX>0);assert.ok(e.roleMind.moveY>0);
});
test('charger makes space at point blank and will not rush through a squad mate',()=>{
 const e=role('charger'),g=world(e),p=body(1,130);tickTacticalEnemy(g,e,.02,[p]);assert.equal(e.tactics.phase,'approach');assert.ok(e.x<100);
 Object.assign(e,{x:100,y:100});p.x=280;g.enemies.push(role('shield',190));tickTacticalEnemy(g,e,.02,[p]);assert.equal(e.tactics.phase,'approach');assert.ok(e.y!==100);
});
test('archer repositions when an ally blocks the shot and aborts a newly obstructed release',()=>{
 const e=role('archer'),g=world(e),p=body(1,350);g.enemies.push(role('shield',220));tickTacticalEnemy(g,e,.02,[p]);assert.equal(e.tactics.phase,'approach');assert.ok(e.y!==100);
 e.x=100;e.y=100;e.faceX=1;e.faceY=0;tacticalPhase(e,'windup',.7);e.tactics.remaining=.01;tickTacticalEnemy(g,e,.02,[p]);assert.equal(g.arrows.length,0);assert.equal(e.arrowsLeft,12);
});
test('archer evasions have a cooldown instead of continuously retreating from every charge',()=>{
 const e=role('archer'),g=world(e),p=body(1,160);tickTacticalEnemy(g,e,.02,[p]);const x=e.x,y=e.y;
 g.time=10.5;tickTacticalEnemy(g,e,.02,[p]);assert.equal(e.x,x);assert.equal(e.y,y);assert.ok(e.roleMind.nextEvasionAt>g.time);
});
test('role animation samples the full bow draw and continuous sword follow-through without editing clips',()=>{
 const model=skeletonMotions.archer,hash=JSON.stringify(model.clips),e=role('archer');tacticalPhase(e,'windup',.7);e.tactics.remaining=.1;
 const a=tacticalHumanoidAnimation(e,model);assert.equal(a.animationAction,'draw');assert.equal(a.playerFrame,model.clips.draw.length-1);
 for(const roleName of ['shield','archer'])for(const phase of ['approach','windup','active','recover','stagger'])for(let k=0;k<=10;k++){
  const e=role(roleName);tacticalPhase(e,phase,.8);e.tactics.remaining=.8*(1-k/10);e.moving=phase==='approach';e.roleMind.moveX=1;e.roleMind.moveY=1;
  const m=skeletonMotions[e.kind],a=tacticalHumanoidAnimation(e,m),pose=tacticalHumanoidPose(a,1,m);
  assert.ok(Object.values(pose).flat().every(Number.isFinite));
 }
 assert.equal(JSON.stringify(model.clips),hash);
});
test('charger anticipation reaches a held coil and recovery stays low before standing',()=>{
 const e=role('charger');tacticalPhase(e,'windup',.75);e.timer=.1;assert.equal(lionFrame(e,1),lionMotion.clips.windup.length-1);
 tacticalPhase(e,'recover',1.4);e.timer=.9;assert.equal(lionFrame(e,1),0);e.timer=0;assert.equal(lionFrame(e,1),lionMotion.clips.recover.length-1);
});
