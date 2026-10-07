import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,EVENTS} from '../src/core.mjs';
import {creatures,applyDefinitions} from '../src/definitions.mjs';
import {ITEMS} from '../src/items.mjs';
import {IMP_EVENT,initializeImp,tickImp,tickImpHazards,explodeImpBomb,IMP_BOMB_LIMIT,IMP_FIRE_LIMIT,IMP_FIRE_SECONDS} from '../src/imps.mjs';
import {defaultImpMotion,validateImpMotion,drawImp} from '../src/imp-motion.mjs';
import {ZOMBIE_EVENT,ZOMBIE_VARIANTS,initializeZombie,zombieCanSee,tickZombie} from '../src/zombies.mjs';
import {defaultZombieMotion,validateZombieMotion,drawZombie,zombieVisualActor} from '../src/zombie-motion.mjs';
import {defaultPlayerMotion} from '../src/player-motion.mjs';
import {PIG_KINDS,WILD_FAUNA_LIMIT} from '../src/wild-fauna-data.mjs';
import {seedWildFauna,tickWildFauna} from '../src/wild-fauna.mjs';
import {pigPose,drawPig} from '../src/pig-art.mjs';
import {rigSubject} from '../src/rig-subjects.mjs';
import {rigPack} from '../src/project-rigs.mjs';
import {befriendCreature} from '../src/friendly-creatures.mjs';
import {saveSession,restoreSession} from '../src/session.mjs';
import {collisionOffset,usesDoors} from '../src/navigation.mjs';
import {actorContact} from '../src/contact-shadow.mjs';
function field(){const g=new Game(()=>.5),p=g.addPlayer('keyboard','Tester');g.phase='play';g.openingBoard=false;g.scenery=[];g.house=null;g.terrain.fill('grass');g.enemies=[];g.traps=[];Object.assign(p,{x:650,y:600,equipment:{},hp:100,invuln:0});return {g,p};}
function actor(g,kind,extra={}){const cfg=creatures[kind],e={id:g.nextId++,kind,x:500,y:600,faceX:1,faceY:0,hp:cfg.stats.hp,maxHp:cfg.stats.hp,speed:cfg.stats.speed,damage:cfg.stats.damage,faction:cfg.faction,state:'hunt',step:0,moving:false,flash:0,frozen:0,cooldown:0,tacticTime:1,attack:0,...extra};if(kind==='imp')initializeImp(e);if(kind==='zombie')initializeZombie(e);g.enemies.push(e);return e;}
function advance(g,e,fn,time){for(let n=0;n<Math.ceil(time/.05);n++){e.cooldown-=.05;fn(g,e,g.players,.05,creatures[e.kind].stats,creatures[e.kind].behaviors);g.time+=.05;}}
const canvas=()=>({pixels:[],save(){},restore(){},translate(){},scale(){},rotate(){},beginPath(){},moveTo(){},lineTo(){},arc(){},closePath(){},stroke(){},fillRect(x,y,w,h){assert.ok([x,y,w,h].every(Number.isFinite));this.pixels.push([x,y,w,h,this.fillStyle]);}});
const bomb=(g,extra={})=>({id:g.nextId++,owner:444,x:500,y:600,originX:500,originY:600,targetX:650,targetY:600,age:0,duration:1,z:32,damage:14,...extra});
test('Imp and zombie events append without changing the banshee/succubus indices; old packs retain them',()=>{
 assert.equal(EVENTS[54].kind,'banshee_queen');assert.equal(EVENTS[55].kind,'succubus');assert.equal(EVENTS[56].name,IMP_EVENT.name);assert.equal(EVENTS[57].name,ZOMBIE_EVENT.name);
 const imported=structuredClone(EVENTS);applyDefinitions({version:1,events:EVENTS.slice(0,56)},imported,{});assert.deepEqual(imported.map(e=>e.name),EVENTS.map(e=>e.name));
 for(const [kind,count]of [['imp',3],['zombie',3]]){const {g}=field();g.spawnEvent(EVENTS.findIndex(e=>e.kind===kind));assert.equal(g.eventSpawnCount,count);assert.equal(g.enemies.length,count);assert.equal(creatures[kind].rig.type,'humanoid');assert.equal(collisionOffset(g,g.enemies[0]),0);assert.ok(usesDoors(g.enemies[0]));if(kind==='zombie')assert.deepEqual(g.enemies.map(e=>e.zombieVariant),ZOMBIE_VARIANTS);}
});
test('Imp/zombie motion packs validate and do not add wings/tails to ordinary humanoids',()=>{
 const pack=rigPack(EVENTS,ITEMS);assert.ok(validateImpMotion(pack.imp));assert.ok(validateZombieMotion(pack.zombie));assert.ok(rigSubject('imp'));assert.ok(rigSubject('zombie'));
 assert.ok(!defaultPlayerMotion().joints.wingTipL&&!defaultZombieMotion().joints.wingTipL);assert.ok(defaultImpMotion().joints.wingTipL);const bad=defaultZombieMotion();bad.type='player';assert.ok(!validateZombieMotion(bad));
});
test('Flying imp shadow stays on ground, with smaller footprint and independent visual separation',()=>{const {g}=field(),e=actor(g,'imp');const shadow=actorContact(g,e,47,true),normal=actorContact(g,{...e,kind:'zombie'},47,true);assert.equal(shadow.y,normal.y);assert.equal(shadow.surface,normal.surface);assert.equal(shadow.separation,20);assert.ok(shadow.rx<normal.rx);assert.equal(actorContact(g,{...e,hp:0},47,true).separation,0);});
test('Custom humanoid routes capture and interrupt on real traps, cancel windups, and honor recovery/freeze',()=>{
 for(const kind of ['succubus','imp','zombie'])for(const variant of ['capture','interrupt','slow']){
  const {g}=field(),e=actor(g,kind);e.succubusAttack='kiss';e.succubusWindup=e.impWindup=e.zombieWindup=1;g.traps=[{x:e.x,y:e.y,life:3,variant}];g.update(.05,{});
  if(variant==='slow'){assert.ok(e.rooted>0);assert.ok(g.traps[0].life>0);continue;}
  assert.equal(e.state,variant==='interrupt'?'recover':'snared');assert.equal(e.impWindup,0);assert.equal(e.zombieWindup,0);assert.equal(e.succubusAttack,null);assert.equal(g.traps.length,0);
  if(variant==='interrupt'){const timer=e.timer;e.frozen=1;g.update(.05,{});assert.equal(e.timer,timer);e.frozen=0;for(let n=0;n<10;n++)g.update(.05,{});assert.equal(e.state,'recover');assert.ok(!g.impBombs.length&&!g.succubusKisses?.length);}
  else{e.timer=.01;g.update(.05,{});assert.ok(e.defeated);const cleared=g.cleared;g.update(.05,{});assert.equal(g.cleared,cleared);}
 }
});
test('All new native art/poses render finitely in eight directions with distinct variants',()=>{
 for(const [draw,kind,variants]of [[drawImp,'imp',['imp']],[drawZombie,'zombie',ZOMBIE_VARIANTS],[drawPig,'pig',PIG_KINDS]]){
  const hashes=new Set();for(const variant of variants)for(let d=0;d<8;d++){const c=canvas();draw(c,{kind:kind==='pig'?variant:kind,zombieVariant:variant,x:0,y:0,hp:80,moving:true,step:2,faceX:-Math.sin(d*Math.PI/4),faceY:Math.cos(d*Math.PI/4)},1);assert.ok(c.pixels.length>50);hashes.add(JSON.stringify(c.pixels));}assert.ok(hashes.size>=variants.length*6);
 }
 assert.equal(zombieVisualActor({zombieVariant:'one_arm'}).missingArm,'L');assert.equal(zombieVisualActor({zombieVariant:'broken_jaw'}).missingArm,null);
 const one=canvas(),two=canvas();drawZombie(one,{hp:80,faceX:0,faceY:1,zombieVariant:'one_arm'},1);drawZombie(two,{hp:80,faceX:0,faceY:1,zombieVariant:'shambler'},1);assert.ok(one.pixels.length<two.pixels.length);
});
test('Imp warns before throwing, locks its aim, and lob height follows a real arc',()=>{
 const {g,p}=field(),e=actor(g,'imp',{cooldown:0});e.cooldown=0;tickImp(g,e,[p],.01,{},{});assert.ok(e.impWindup>0);assert.equal(g.impBombs?.length||0,0);const target={...e.impAim};p.y+=150;advance(g,e,tickImp,1);assert.equal(g.impBombs.length,1);const b=g.impBombs[0];assert.equal(b.targetY,target.y);tickImpHazards(g,.2);const z=b.z;assert.ok(z>32);tickImpHazards(g,.2);assert.ok(b.z>z);
});
test('Imp landing hurts once, burns a round circle, clears at expiry and is saveable mid-flight',()=>{
 const {g,p}=field();g.impBombs=[bomb(g)];const restored=restoreSession(JSON.parse(JSON.stringify(saveSession(g))));assert.deepEqual(restored.impBombs,g.impBombs);
 tickImpHazards(g,1);assert.equal(g.impBombs.length,0);assert.equal(g.impFireCircles.length,1);assert.ok(p.hp<100);const hp=p.hp,f=g.impFireCircles[0];assert.equal(f.radius,30);assert.ok(!explodeImpBomb(g,{...bomb(g),exploded:true}));assert.equal(p.hp,hp);
 Object.assign(p,{x:f.x+31,y:f.y,invuln:0,burning:0});tickImpHazards(g,.5);assert.equal(p.hp,hp);tickImpHazards(g,IMP_FIRE_SECONDS);assert.equal(g.impFireCircles.length,0);
});
test('Imp fire respects air clearance, walls, water, zero-damage editing and friendship',()=>{
 for(const patch of [{jumpHeight:40},{invuln:1}]){const {g,p}=field();Object.assign(p,patch);const b=bomb(g,{x:p.x,y:p.y});explodeImpBomb(g,b);assert.equal(p.hp,100);assert.ok(!p.burning);}
 const {g,p}=field();const b=bomb(g,{x:p.x,y:p.y,damage:0});explodeImpBomb(g,b);tickImpHazards(g,.5);assert.equal(p.hp,100);
 g.impFireCircles=[];g.terrain.fill('water');assert.equal(explodeImpBomb(g,bomb(g,{x:p.x,y:p.y})),false);assert.equal(g.impFireCircles.length,0);
 g.terrain.fill('grass');g.projectileBlocked=(x)=>x>=570;g.impBombs=[bomb(g)];tickImpHazards(g,1);assert.equal(g.impBombs.length,0);assert.ok(g.impFireCircles[0].x<570);assert.equal(p.hp,100);
 const e=actor(g,'imp');g.impBombs=[bomb(g,{owner:e.id})];g.impFireCircles=[{id:4,owner:e.id,x:p.x,y:p.y,life:3,age:0,tick:0,radius:30,damage:4}];e.impWindup=1;befriendCreature(e,p.id);tickImpHazards(g,.05);assert.equal(e.impWindup,0);assert.equal(g.impBombs.length,0);assert.equal(g.impFireCircles.length,0);assert.equal(p.hp,100);
});
test('Imp hazard arrays and transient effects have hard ceilings; defeated owner does not duplicate them',()=>{
 const {g}=field();g.impBombs=Array.from({length:100},()=>bomb(g,{targetX:700}));tickImpHazards(g,.1);assert.equal(g.impBombs.length,IMP_BOMB_LIMIT);g.impFireCircles=[];for(let n=0;n<100;n++)explodeImpBomb(g,bomb(g,{x:700}));assert.equal(g.impFireCircles.length,IMP_FIRE_LIMIT);assert.ok(g.effects.filter(f=>f.particle).length<=48);
 const e=actor(g,'imp');e.hp=0;g.update(.05,{});const xp=g.xpOrbs.length;g.update(.05,{});assert.equal(g.xpOrbs.length,xp);assert.ok(e.defeated);
});
test('Pig variants are peaceful, approach-safe unarmed, flee weapons/injury and freeze correctly',()=>{
 for(const kind of PIG_KINDS){const {g,p}=field(),e=actor(g,kind,{x:690,homeX:690,homeY:600,state:'graze',wildLastHp:48,wanderIn:2});assert.equal(creatures[kind].stats.damage,0);assert.equal(creatures[kind].behaviors.melee,false);tickWildFauna(g,e,.05,[p]);assert.notEqual(e.state,'flee');p.equipment.hand1='sword';const x=e.x;tickWildFauna(g,e,.05,[p]);assert.equal(e.state,'flee');assert.ok(e.x>x);assert.equal(p.hp,100);e.frozen=1;const frozen=e.x;tickWildFauna(g,e,.05,[p]);assert.equal(e.x,frozen);assert.equal(pigPose(e,3).stride,0);p.equipment={};e.frozen=0;e.hp--;tickWildFauna(g,e,.05,[p]);assert.equal(e.state,'flee');}
});
test('Pigs seed on dry ground only in forest/jungle/beach, stay bounded and never duplicate after reload',()=>{
 for(const env of ['forest','temple','beach','desert','ice','house']){const g=new Game(()=>.5);g.seed=1234;g.environment=env;g.addPlayer('keyboard','Pig viewer');g.start();g.openingBoard=false;seedWildFauna(g,true);const pigs=g.enemies.filter(e=>PIG_KINDS.includes(e.kind));assert.equal(pigs.length,['forest','temple','beach'].includes(env)?2:0);assert.ok(g.enemies.length<=WILD_FAUNA_LIMIT);for(const p of pigs)assert.ok(!g.blocked(p.x,p.y,14,false,false,false,0));const copy=restoreSession(JSON.parse(JSON.stringify(saveSession(g))));assert.equal(seedWildFauna(copy,true),0);assert.equal(copy.enemies.filter(e=>PIG_KINDS.includes(e.kind)).length,pigs.length);}
});
test('Pig snuffling/trot/flee/death have distinct deterministic poses and respect held freeze',()=>{
 const p={kind:'pig',hp:48,step:2,faceX:0,faceY:1};assert.equal(pigPose(p,1).action,'snuffle');assert.equal(pigPose({...p,moving:true},1).action,'walk');assert.equal(pigPose({...p,moving:true,state:'flee'},1).action,'flee');assert.notEqual(pigPose({...p,moving:true},1).stride,pigPose({...p,moving:true,state:'flee'},1).stride);assert.equal(pigPose({...p,hp:0},1).action,'death');assert.deepEqual(pigPose({...p,frozen:1},1),pigPose({...p,frozen:1},8));
});
test('Zombie has front-only vision; human movement extends range, with no omniscient rear reaction',()=>{
 const {g,p}=field(),e=actor(g,'zombie');assert.ok(zombieCanSee(g,e,p));p.x=400;p.moving=true;assert.ok(!zombieCanSee(g,e,p));advance(g,e,tickZombie,1);assert.equal(e.x,500);assert.equal(e.faceX,1);assert.equal(p.hp,100);
 p.x=760;p.moving=false;assert.ok(!zombieCanSee(g,e,p));p.moving=true;assert.ok(zombieCanSee(g,e,p));g.projectileBlocked=()=>true;assert.ok(!zombieCanSee(g,e,p));g.projectileBlocked=()=>false;assert.ok(!zombieCanSee(g,e,{...p,hunterPet:true}));
});
test('Zombie shambling is slow; claw has locked warning, recovery, dodge and rear escape',()=>{
 const {g,p}=field(),e=actor(g,'zombie');advance(g,e,tickZombie,.5);assert.ok(e.x>500&&e.x<=516.01);p.x=e.x+45;advance(g,e,tickZombie,.05);assert.ok(e.zombieWindup>0);assert.equal(p.hp,100);advance(g,e,tickZombie,.7);assert.ok(p.hp<100);const hp=p.hp;advance(g,e,tickZombie,.1);assert.equal(p.hp,hp);
 for(const change of [{jumpHeight:30},{x:480},{invuln:1}]){const {g,p}=field(),e=actor(g,'zombie');p.x=545;advance(g,e,tickZombie,.05);Object.assign(p,change);advance(g,e,tickZombie,.7);assert.equal(p.hp,100);}
});
test('Zombie freeze/snare/friendship preserve variants and once-only saveable damage/rewards',()=>{
 const {g,p}=field(),e=actor(g,'zombie',{zombieVariant:'one_arm',frozen:1});const x=e.x;tickZombie(g,e,[p],.1);assert.equal(e.x,x);e.frozen=0;e.state='snared';e.timer=.05;tickZombie(g,e,[p],.1);assert.equal(e.hp,0);g.update(.05,{});const xp=g.xpOrbs.length;g.update(.05,{});assert.equal(g.xpOrbs.length,xp);
 const ally=actor(g,'zombie',{zombieVariant:'broken_jaw',zombieWindup:1});befriendCreature(ally,p.id);assert.equal(ally.zombieWindup,0);const copy=restoreSession(JSON.parse(JSON.stringify(saveSession(g))));assert.equal(copy.enemies.find(e=>e.id===ally.id).zombieVariant,'broken_jaw');assert.equal(copy.enemies.find(e=>e.id===ally.id).faction,'ally');
});
