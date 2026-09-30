import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/core.mjs';
import {LobbyPractice,lobbyDiceOffsets} from '../src/lobby-practice.mjs';
import {LobbyState} from '../src/playable-lobby.mjs';
import {playerAction} from '../src/player-motion.mjs';
import {startJump,tickJump} from '../src/jumping.mjs';
const setup=()=>{const game=new Game(),p=game.addPlayer('keyboard'),lobby=new LobbyState(),practice=new LobbyPractice();lobby.sync([p]);Object.assign(lobby.members.get(p.id),{spawned:true,panel:null});const tick=input=>practice.stepPractice(.05,[p],lobby.members,{keyboard:input});return {p,practice,lobby,tick};};
test('Bow block input anchors movement, aims with either stick, and fires without moving',()=>{
 const {p,practice,lobby,tick}=setup();p.equipment.hand1='bow';p.inventory.push({type:'arrow',qty:10});tick({});const a=practice.players[0],x=a.x,y=a.y;
 Object.assign(a,{dashTime:.2,slideX:100,slideY:80});
 tick({block:true,x:1,dodge:true});assert.equal(a.x,x);assert.equal(a.y,y);assert.equal(a.bowAiming,true);assert.equal(a.blocking,false);assert.equal(a.slideX,0);assert.equal(a.dashTime,0);assert.equal(a.faceX,1);assert.equal(playerAction(a),'draw');
 tick({block:true,x:1,aimX:0,aimY:-1,attack:true});assert.equal(a.faceY,-1);assert.equal(a.faceX,0);
 tick({block:true,x:1,aimX:0,aimY:-1});assert.ok(practice.arrows.length>0);assert.equal(a.x,x);assert.equal(a.y,y);
 tick({x:1});assert.equal(a.bowAiming,false);assert.ok(a.x>x);
 tick({block:true});lobby.members.get(p.id).panel='board';tick({block:true,x:1});assert.equal(a.bowAiming,false);
});
test('Adventure uses the same bow aim lock and clears it when switching to shield',()=>{
 const g=new Game();g.phase='play';g.openingBoard=false;g.blocked=()=>false;g.terrain.fill('grass');const p=g.addPlayer('keyboard');Object.assign(p,{x:500,y:500});p.equipment.hand1='bow';
 g.update(.02,{keyboard:{block:true,x:1}});assert.equal(p.x,500);assert.equal(p.bowAiming,true);
 p.equipment.hand1=null;p.equipment.hand2='shield';g.update(.02,{keyboard:{block:true,x:1}});assert.equal(p.bowAiming,false);assert.equal(p.blocking,true);assert.ok(p.x>500);
});
test('Lobby tables block walking, support jumps and allow walking off; totem stays solid',()=>{
 const {practice,tick}=setup();tick({});const p=practice.players[0];
 for(const table of practice.house.furniture){Object.assign(p,{x:table.x-20,y:table.y+12,groundHeight:0,jumpHeight:0});practice.moveActor(p,35,0);assert.ok(p.x<table.x);startJump(p);for(let i=0;i<12;i++)tickJump(p,.02,practice);practice.moveActor(p,35,0);assert.ok(p.x>table.x);for(let i=0;i<50;i++)tickJump(p,.02,practice);assert.equal(p.groundHeight,table.surfaceHeight);practice.moveActor(p,-60,0);for(let i=0;i<30;i++)tickJump(p,.02,practice);assert.equal(p.groundHeight,0);}
 assert.equal(practice.blocked(925,165,8,false,false,false,0,40),true);
});
test('Target lever toggles motion; actual arrows and spells score without hurting saved heroes',()=>{
 const {practice,tick}=setup();tick({});const t=practice.targets[0],x=t.x;practice.updateTargets(1);assert.equal(t.x,x);practice.toggleTargets();practice.updateTargets(.5);assert.notEqual(t.x,x);practice.toggleTargets();const stopped=t.x;practice.updateTargets(1);assert.equal(t.x,stopped);
 practice.arrows.push({x:t.x,y:165,z:20,vz:0,vx:0,vy:-300,damage:12,owner:practice.players[0].id});for(let i=0;i<5;i++)tick({});assert.equal(t.hits,1);assert.equal(t.score,12);
 practice.spells.push({x:t.x,y:165,vx:0,vy:-300,life:1,remaining:200,size:6,damage:15});for(let i=0;i<5;i++)tick({});assert.equal(t.hits,2);assert.equal(practice.spells.length,0);
});
test('Tray contains exactly the selected number of centered dice',()=>{assert.deepEqual(lobbyDiceOffsets('1'),[-12]);assert.equal(lobbyDiceOffsets('2').length,2);});
test('Lobby uses real jumping, dodging, blocking and weapon attacks without changing the saved player',()=>{
 const {p,practice,tick}=setup();p.equipment.hand2='shield';const before=JSON.stringify(p);
 tick({jump:true});tick({});const a=practice.players[0];assert.ok(a.jumpHeight>0);assert.match(playerAction(a),/^jump/);
 for(let i=0;i<20;i++)tick({});tick({dodge:true,x:1});assert.ok(a.dashTime>0);
 tick({block:true});assert.equal(a.blocking,true);
 tick({attack:true});tick({});assert.ok(a.attack>0);assert.ok(a.attackClip);
 tick({trap:true});assert.equal(practice.traps.length,1);assert.equal(JSON.stringify(p),before);
});
test('Selection panels suppress attacks and movement, and pause freezes practice',()=>{
 const {p,practice,lobby,tick}=setup();tick({attack:true});const a=practice.players[0],s=lobby.members.get(p.id),x=a.x;
 s.panel='board';tick({x:1,attack:true,jump:true});assert.equal(a.x,x);assert.equal(a.attack,0);assert.equal(a.jumpHeight||0,0);
 const time=practice.time;practice.stepPractice(.05,[p],lobby.members,{},true);assert.equal(practice.time,time);
});
test('Equipped bows and wands fire actual practice projectiles without consuming saved ammunition',()=>{
 for(const weapon of ['bow','wand']){
   const {p,practice,tick}=setup();p.equipment.hand1=weapon;p.inventory.push({type:'arrow',qty:3});
   const before=JSON.stringify(p.inventory);tick({attack:true});tick({});
   assert.ok((weapon==='bow'?practice.arrows:practice.spells).length>0,weapon);
   assert.equal(JSON.stringify(p.inventory),before);
 }
});
