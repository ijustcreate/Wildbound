import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/core.mjs';
import {LobbyPractice,LOBBY_FIXTURES,lobbyDiceOffsets} from '../src/lobby-practice.mjs';
import {LOBBY_OBJECTS,LobbyState} from '../src/playable-lobby.mjs';
import {playerAction} from '../src/player-motion.mjs';
import {startJump,tickJump} from '../src/jumping.mjs';
import {LOBBY_FLOOR,LOBBY_TV} from '../src/lobby-geometry.mjs';
import {lobbyActorDepth,lobbyPropDepth} from '../src/lobby-scene.mjs';
import {drawLobbyBackdrop} from '../src/lobby-backdrop.mjs';
const setup=()=>{const game=new Game(),p=game.addPlayer('keyboard'),lobby=new LobbyState(),practice=new LobbyPractice();lobby.sync([p]);Object.assign(lobby.members.get(p.id),{spawned:true,panel:null});const tick=input=>practice.stepPractice(.05,[p],lobby.members,{keyboard:input});return {p,practice,lobby,tick};};

test('lobby walking leaves fading floor footprints, not airborne steps',()=>{
 const {practice,tick}=setup();tick({});
 for(let i=0;i<8;i++)tick({x:1});
 assert.ok(practice.footprints.length>0);
 const a=practice.players[0];practice.footprints=[];delete a.trackImpulse;
 a.jumpHeight=100;a.jumpVelocity=0;a.groundHeight=0;
 tick({x:1});assert.equal(practice.footprints.length,0);
 practice.footprints=[{x:300,y:300,time:practice.time-19}];
 tick({});assert.equal(practice.footprints.length,0);
});

test('lobby feet can reach every visible floor edge without leaving the map',()=>{
 const {practice,tick}=setup();tick({});const a=practice.players[0],r=8;
 for(const [x,y,dx,dy,expectedX,expectedY]of [
  [30,400,-60,0,LOBBY_FLOOR.left+r,400],
  [1010,400,60,0,LOBBY_FLOOR.right-r,400],
  [600,80,0,-60,600,LOBBY_FLOOR.top+r],
  [600,606,0,60,600,LOBBY_FLOOR.bottom-r],
 ]){
  Object.assign(a,{x,y,jumpHeight:0,groundHeight:0});practice.moveActor(a,dx,dy);
  assert.ok(Math.abs(a.x-expectedX)<3);assert.ok(Math.abs(a.y-expectedY)<3);
  assert.equal(practice.blocked(expectedX,expectedY,r),false);
 }
});

test('right and bottom gray trim is flush with floor edges, not inset across tiles',()=>{
 const rects=[],c={fillStyle:'',fillRect(x,y,w,h){rects.push({color:this.fillStyle,x,y,w,h});}};
 drawLobbyBackdrop(c,{warm:true,pack:false});
 const trim=rects.filter(r=>r.color==='#343d40');
 assert.ok(trim.some(r=>r.x+r.w===LOBBY_FLOOR.right&&r.w===7));
 assert.ok(trim.some(r=>r.y+r.h===LOBBY_FLOOR.bottom&&r.h===12));
 assert.equal(trim.some(r=>r.x===1010||r.y===590),false);
});

test('TV has a reachable matching top and stable airborne depth at its edges',()=>{
 const {practice,tick}=setup();tick({});const a=practice.players[0],tv=practice.house.furniture.find(f=>f.id==='television'),o=LOBBY_OBJECTS.find(o=>o.id===tv.id);
 assert.equal(tv.surfaceHeight,LOBBY_TV.height);
 Object.assign(a,{x:785,y:210,jumpHeight:0,groundHeight:0});
 assert.ok(startJump(a));a.jumpHeld=true;for(let i=0;i<20;i++)tickJump(a,.01,practice);
 assert.ok(a.jumpHeight>tv.surfaceHeight,'ordinary held lobby jump clears the TV');
 practice.moveActor(a,0,-29);assert.ok(Math.abs(a.y-181)<.001);
 for(let i=0;i<120;i++)tickJump(a,.01,practice);
 assert.equal(a.groundHeight,tv.surfaceHeight,'feet land on the cabinet instead of passing through');
 for(const y of [tv.y-7,tv.y,tv.y+tv.h,tv.y+tv.h+7])assert.ok(lobbyActorDepth({...a,y},practice.house.furniture,LOBBY_OBJECTS)>lobbyPropDepth(o));
 practice.moveActor(a,0,-30);for(let i=0;i<120;i++)tickJump(a,.01,practice);
 assert.equal(a.groundHeight,0);assert.equal(a.jumpHeight,0);
});
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
 for(const table of practice.house.furniture){Object.assign(p,{x:table.x-20,y:table.y+table.h/2,groundHeight:0,jumpHeight:0});practice.moveActor(p,35,0);assert.ok(p.x<table.x);startJump(p);for(let i=0;i<14;i++)tickJump(p,.02,practice);practice.moveActor(p,35,0);assert.ok(p.x>table.x);for(let i=0;i<100;i++)tickJump(p,.02,practice);assert.equal(p.groundHeight,table.surfaceHeight);practice.moveActor(p,0,-65);for(let i=0;i<50;i++)tickJump(p,.02,practice);assert.equal(p.groundHeight,0);}
 assert.equal(practice.blocked(955,165,8,false,false,false,0,40),true);
});
test('Every lobby object has a solid visible footprint and remains reachable for interaction',()=>{
 const {practice,lobby,tick,p}=setup();tick({});const actor=practice.players[0];
 const solids=[...practice.house.furniture,...practice.house.walls];
 assert.deepEqual(solids.map(s=>s.id).sort(),LOBBY_OBJECTS.map(o=>o.id).sort());
 for(const solid of solids){
   const object=LOBBY_OBJECTS.find(o=>o.id===solid.id);
   const x=solid.x+solid.w/2;
   assert.equal(practice.blocked(x,solid.y+solid.h/2,8),true,`${solid.id} blocks movement`);
   assert.equal(practice.projectileBlocked(x,solid.y+solid.h/2),true,`${solid.id} blocks shots`);
   const fromBelow=solid.y<200;
   Object.assign(actor,{x,y:fromBelow?solid.y+solid.h+10:solid.y-10,groundHeight:0,jumpHeight:0});
   practice.moveActor(actor,0,fromBelow?-25:25);
   assert.ok(fromBelow?actor.y>=solid.y+solid.h+8:actor.y<=solid.y-8,`${solid.id} stops an approaching player`);
   const state=lobby.members.get(p.id);Object.assign(state,{x:actor.x,y:actor.y});
   if(solid.id==='television')Object.assign(state,{x:723,y:234});
   assert.equal(lobby.nearest(p)?.id,object.id,`${solid.id} remains usable from outside`);
 }
 for(const fixture of LOBBY_FIXTURES){
   const x=fixture.x+fixture.w/2,y=fixture.y+fixture.h/2;
   assert.equal(practice.blocked(x,y,8,false,false,false,0,50),true,`${fixture.id} cannot be jumped through`);
 }
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
