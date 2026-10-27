import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,EVENTS} from '../src/core.mjs';
import {playerMotion,defaultPlayerMotion,upgradePlayerMotion,validatePlayerMotion,wandTipWorld,directionVector,playerAction,poseAt} from '../src/player-motion.mjs';
import {combos,saveCombos,nextCombo,DEFAULT_COMBOS,loadoutKind} from '../src/combat-combos.mjs';
import {startJump,tickJump,releaseJump} from '../src/jumping.mjs';
import {creatures} from '../src/definitions.mjs';
import {cleanInput} from '../src/rooms.mjs';
import {restoreSession,saveSession} from '../src/session.mjs';
const setup=()=>{const g=new Game(()=>.5);g.environment='forest';const p=g.addPlayer('keyboard');g.start();g.openingBoard=false;g.scenery=[];g.terrain.fill('grass');Object.assign(p,{x:600,y:600,faceX:0,faceY:1,mana:100});return {g,p};};
test('dual wand spells originate at their own animated tip in all eight directions',()=>{
 for(let d=0;d<8;d++){
  const {g,p}=setup();[p.faceX,p.faceY]=directionVector(d);p.equipment={hand1:'fire_wand',hand2:'fire_wand'};g.attack(p);assert.equal(g.spells.length,2);
  for(const bolt of g.spells){const tip=wandTipWorld(p,bolt.slot,g.time);assert.equal(bolt.x,tip.x);assert.equal(bolt.y-16,tip.y);assert.equal(bolt.age,0);}
  assert.notDeepEqual([g.spells[0].x,g.spells[0].y],[g.spells[1].x,g.spells[1].y]);
 }
});
test('combo loadout profiles distinguish supported hand combinations',()=>{
 for(const [equipment,kind] of [
  [{},'unarmed'],[{hand1:'dagger'},'dagger'],[{hand1:'sword'},'sword'],
  [{hand1:'dagger',hand2:'shield'},'dagger_shield'],[{hand1:'sword',hand2:'shield'},'sword_shield'],
  [{hand1:'dagger',hand2:'dagger'},'dual_dagger'],[{hand1:'sword',hand2:'sword'},'dual_sword'],
  [{hand1:'dagger',hand2:'sword'},'dagger_sword'],[{hand1:'wand'},'wand'],
  [{hand1:'wand',hand2:'wand'},'dual_wand'],[{hand1:'dagger',hand2:'wand'},'dagger_wand'],
  [{hand1:'sword',hand2:'wand'},'sword_wand'],
 ]) assert.equal(loadoutKind({equipment}),kind);
});
test('wand origin follows fit, rotation, scaling and jump height',()=>{
 const {p}=setup();p.equipment.hand1='wand';p.attack=.34;p.attackClip='cast';const m=defaultPlayerMotion(),plain=wandTipWorld(p,'hand1',0,m);
 m.wearables.wand={0:{x:3,y:-2,rotation:90,scale:2}};const fitted=wandTipWorld(p,'hand1',0,m);assert.notDeepEqual(fitted,plain);
 p.jumpHeight=25;p.jumpAge=.2;p.jumpVelocity=1;const airborne=wandTipWorld(p,'hand1',0,m);
 const grounded=wandTipWorld({...p,jumpHeight:0,animationAction:'jump_air',layerPreview:{index:0,base:'jump_air',overlay:'cast'}},'hand1',0,m);assert.equal(airborne.y,grounded.y-25);
});
test('melee and unarmed combo orders, finisher strength and timeout reset',()=>{
 for(const [kind,expected]of [['melee',['swipe_one','swipe_two','swipe_big']],['unarmed',['punch_left','punch_right','punch_left','punch_right','uppercut']]]){
  const actor={};const steps=expected.map((_,i)=>nextCombo(actor,kind,i*.4));assert.deepEqual(steps.map(s=>s.clip),expected);assert.ok(steps.at(-1).damage>steps[0].damage);assert.equal(nextCombo(actor,kind,10).clip,expected[0]);
 }
});
test('removing all combos falls back safely and malformed configs are rejected',()=>{
 const before=structuredClone(combos);try{saveCombos([]);assert.equal(nextCombo({},'unarmed',0).clip,'punch');assert.throws(()=>saveCombos([{...DEFAULT_COMBOS[0],steps:[{clip:'bad'}]}]));}finally{saveCombos(before);}
});
test('combo finisher gains reach and an attack press can buffer during recovery',()=>{
 const {g,p}=setup();p.equipment.hand1='sword';const e={id:999,kind:'lion',x:600,y:690,hp:1000,state:'hunt',faceX:0,faceY:1};g.enemies=[e];
 for(let i=0;i<3;i++){p.attack=0;g.time=i*.4;g.attack(p);for(let tick=0;tick<10;tick++)g.update(.02,{});}assert.equal(p.attackClip,'swipe_big');assert.ok(e.hp<1000);g.attack(p);assert.ok(p.queuedAttack);
});
test('jump input is network-safe, lands, has a cooldown and cannot double jump',()=>{
 const a={hp:100};assert.equal(cleanInput({jump:true}).jump,true);assert.ok(startJump(a));assert.equal(startJump(a),false);for(let i=0;i<50;i++)tickJump(a,.02);assert.equal(a.jumpHeight,0);assert.ok(a.jumpCooldown>0);
 const {g,p}=setup();g.update(.02,{keyboard:{jump:true}});assert.ok(p.jumpHeight>0);assert.equal(playerAction(p),'jump_takeoff');
});
test('player jump arc has a quick, weighty landing and legacy saves receive it',()=>{
 const a={hp:100,jumpImpulse:230,jumpGravity:1200};assert.ok(startJump(a));let peak=0,air=0;
 for(let i=0;i<120&&a.jumpHeight>0;i++){tickJump(a,1/120);peak=Math.max(peak,a.jumpHeight);air+=1/120;}
 assert.ok(peak>=20&&peak<24,'enough height for low props without a floaty apex');assert.ok(air>=.32&&air<=.40,'short hang time');assert.equal(a.jumpHeight,0);
 const {g}=setup(),saved=JSON.parse(JSON.stringify(saveSession(g)));saved.state.players[0].jumpImpulse=180;saved.state.players[0].jumpGravity=720;
 const restored=restoreSession(saved).players[0];assert.equal(restored.jumpImpulse,230);assert.equal(restored.jumpGravity,1200);
});
test('a jump tap makes a short hop while holding jump makes a higher Mario-style leap',()=>{
 const arc=hold=>{const a={hp:100,jumpImpulse:230,jumpGravity:1200};startJump(a);a.jumpHeld=true;let peak=0;
  for(let i=0;i<120&&a.jumpHeight>0;i++){if(!hold&&i===2)releaseJump(a);tickJump(a,1/120);peak=Math.max(peak,a.jumpHeight);}return peak;};
 const tap=arc(false),held=arc(true);assert.ok(held>tap*1.35,`held jump (${held}) should rise clearly higher than tap (${tap})`);
});
test('jumping adds modest reach instead of doubling speed on held Jump',()=>{
 const grounded=setup(),airborne=setup();for(let i=0;i<4;i++)grounded.g.update(.05,{keyboard:{x:1}});
 airborne.g.update(.05,{keyboard:{x:1,jump:true}});const height=airborne.p.jumpHeight;
 for(let i=1;i<4;i++)airborne.g.update(.05,{keyboard:{x:1,jump:true}});
 const groundDistance=grounded.p.x-600,airDistance=airborne.p.x-600;
 assert.ok(height>0,'jump stays in its normal quick arc');
 assert.ok(airDistance>groundDistance*1.10&&airDistance<groundDistance*1.20,'airborne movement adds only modest reach');
 const released=setup();released.g.update(.05,{keyboard:{x:1,jump:true}});released.g.update(.05,{keyboard:{x:1}});
 assert.ok(Math.abs(released.p.x-600-airDistance*.5)<1,'releasing jump does not snap horizontal speed');
});
test('jump ability defaults and the temple tiger encounter',()=>{
 assert.equal(creatures.skeleton.behaviors.jump,false);assert.equal(creatures.monkey.behaviors.jump,true);assert.equal(creatures.lion.behaviors.jump,true);assert.equal(creatures.tiger.behaviors.jump,true);
 const g=new Game(()=>.5);g.environment='temple';g.addPlayer('keyboard');g.start();g.enemies=[];g.spawnEvent(EVENTS.findIndex(e=>e.kind==='tiger'&&e.environment==='temple'));assert.equal(g.event.kind,'tiger');assert.ok(g.enemies.every(e=>e.kind==='tiger'));assert.ok(EVENTS.find(e=>e.kind==='tiger'&&e.environment==='temple'));
});
test('legacy humanoid rigs gain new clips without losing edited poses',()=>{
 const m=defaultPlayerMotion();m.clips.run.keys[0].joints.handR=[1,2,3];for(const k of ['swipe_one','uppercut','cast','jump_air','death'])delete m.clips[k];const upgraded=upgradePlayerMotion(m);assert.ok(validatePlayerMotion(upgraded));assert.deepEqual(upgraded.clips.run.keys[0].joints.handR,[1,2,3]);assert.deepEqual(poseAt(playerMotion,'punch_left',5).handL,playerMotion.joints.handL.position);
});
test('enemy jump toggle controls runtime jumps, including skeleton opt-in',()=>{
 const {g,p}=setup();const e={id:901,kind:'skeleton',x:600,y:480,hp:100,maxHp:100,speed:20,damage:1,state:'hunt',timer:1,cooldown:1,flash:0,tacticTime:2};g.enemies=[e];const old=creatures.skeleton.behaviors.jump;
 try{g.update(.02,{});assert.equal(e.jumpHeight||0,0);creatures.skeleton.behaviors.jump=true;g.update(.02,{});assert.ok(e.jumpHeight>0);}finally{creatures.skeleton.behaviors.jump=old;}
});
test('actual attack input during recovery buffers the next combo step',()=>{
 const {g,p}=setup();p.equipment.hand1='sword';g.attack(p);assert.equal(p.attackClip,'swipe_one');g.update(.02,{keyboard:{attack:true}});g.update(.02,{keyboard:{attack:false}});assert.ok(p.queuedAttack);for(let i=0;i<17;i++)g.update(.02,{});assert.equal(p.attackClip,'swipe_two');
});
