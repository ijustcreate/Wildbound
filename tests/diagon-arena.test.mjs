import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/core.mjs';
import {enterWildLands} from '../src/wild-lands.mjs';
import {interactAlley} from '../src/diagon-alley.mjs';
import {arenaCanFight,arenaFighter,ARENA_COUNTER,ARENA_ENTRANCES,ARENA_FENCE_EDGES,ARENA_RING,ARENA_RING_GATE,ARENA_STAIRS,inDiagonArena} from '../src/diagon-arena-layout.mjs';
import {arenaBarView,diagonArenaGuests,interactDiagonArena} from '../src/diagon-arena.mjs';
import {drawArenaSpectators} from '../src/arena-spectators.mjs';
import {playerCombatTargets} from '../src/succubus-charm.mjs';
import {rangedLaunchOrigin} from '../src/ranged-launch.mjs';
import {saveSession,restoreSession} from '../src/session.mjs';

function setup(){
 const g=new Game(()=>.4);
 g.addPlayer('keyboard','Ada');g.addPlayer('gamepad-0','Ivo');g.start();
 assert.ok(enterWildLands(g,{persistent:true}).ok);
 g.trainTest.design.activeRoom='diagon';
 const [a,b]=g.players,door=ARENA_ENTRANCES['meridian-hall'];
 Object.assign(a,{x:door.x,y:door.y});
 return {g,a,b,door};
}

function enter(g,a){
 assert.equal(interactAlley(g,a),true);
 assert.ok(inDiagonArena(g));
}

const point=(dx=0,dy=0)=>({x:ARENA_RING.x+ARENA_RING.w/2+dx,y:ARENA_RING.y+ARENA_RING.h/2+dy});
function fighters(a,b){
 Object.assign(a,point(-26),{faceX:1,faceY:0,attack:0,invuln:0});
 Object.assign(b,point(0),{invuln:0});
}

test('the actual Meridian entrance moves the party into a safe gallery and saves an exact return',()=>{
 const {g,a,b,door}=setup(),alleyActor={id:'frozen-alley-encounter',x:7700,y:4400,hp:80};
 g.enemies=[alleyActor];g.pvp=true;
 enter(g,a);
 assert.equal(g.enemies.length,0);
 assert.equal(arenaFighter(g,a),false);
 assert.equal(arenaFighter(g,b),false);
 assert.equal(g.blocked(ARENA_COUNTER.x+16,ARENA_COUNTER.y+5,8),true);
 assert.equal(diagonArenaGuests().length,11);
 const barkeep=diagonArenaGuests().find(x=>x.role==='bartender');
 Object.assign(a,barkeep.interactAt);
 assert.equal(interactDiagonArena(g,a),true);
 assert.equal(arenaBarView(g,a).npc.name,barkeep.name);
 assert.equal(b.ui,null);
 const checkpoint=JSON.parse(JSON.stringify(saveSession(g)));
 const loaded=restoreSession(checkpoint);
 assert.ok(inDiagonArena(loaded));
 assert.equal(loaded.trainTest.arena.entranceId,'meridian-hall');
 Object.assign(loaded.players[0],ARENA_STAIRS);
 assert.equal(interactDiagonArena(loaded,loaded.players[0]),true);
 assert.equal(loaded.trainTest.design.activeRoom,'diagon');
 assert.equal(loaded.players[0].y,door.arrival.y);
 assert.equal(loaded.players[0].arenaVisit,undefined);
 assert.equal(loaded.enemies[0].id,alleyActor.id);
 assert.equal(loaded.pvp,true);
});

test('native melee enables player damage only while both fighters stand inside the marked ring',()=>{
 const {g,a,b}=setup();enter(g,a);fighters(a,b);
 g.pvp=false;a.equipment={hand1:'dagger'};b.equipment={};
 const start=b.hp;
 g.resolveMelee(a,0,{damage:1,arc:120,reach:1});
 assert.ok(b.hp<start);
 b.invuln=0;
 Object.assign(a,{x:ARENA_RING.x+ARENA_RING.w-8,y:point().y});
 Object.assign(b,{x:ARENA_RING.x+ARENA_RING.w+9,y:point().y});
 const safe=b.hp;
 g.pvp=true;
 assert.equal(playerCombatTargets(g,a).includes(b),false);
 g.resolveMelee(a,1.2,{damage:1,arc:360,reach:2});
 assert.equal(b.hp,safe);
 Object.assign(a,{x:b.x-3});
 assert.equal(g.attack(a,1.2),false);
 assert.equal(b.hp,safe);
});

for(const weapon of ['bow','wand']){
 test(weapon+' uses live local ring eligibility and keeps projectiles out of the gallery',()=>{
  const {g,a,b}=setup();enter(g,a);fighters(a,b);
  a.equipment={hand1:weapon};b.equipment={};a.inventory=[{type:'arrow',qty:100}];a.mana=100;
  const origin=rangedLaunchOrigin(a,g.time,weapon==='bow'?'bow':'magic');
  Object.assign(b,{x:origin.x+55,y:origin.y});
  const fire=()=>weapon==='bow'?g.fireArrow(a,0):g.fireSpell(a,0);
  assert.equal(fire(),true);
  const source=(weapon==='bow'?g.arrows:g.spells)[0],hp=b.hp;
  assert.ok(arenaCanFight(g,source,b));
  for(let i=0;i<24;i++){g.time+=.02;g.tickProjectiles(.02);}
  assert.ok(b.hp<hp,'real projectile damaged its ring opponent');
  a.mana=100;b.invuln=0;g.arrows=[];g.spells=[];
  assert.equal(fire(),true);
  const second=(weapon==='bow'?g.arrows:g.spells)[0];
  Object.assign(a,{x:ARENA_RING.x+ARENA_RING.w+10});
  const protectedHealth=b.hp;
  for(let i=0;i<24;i++){g.time+=.02;g.tickProjectiles(.02);}
  assert.equal(b.hp,protectedHealth,'a shot loses fighter eligibility when its owner steps out');
  Object.assign(a,point(-26));
  const unstamped={owner:a.id,x:b.x,y:b.y};
  assert.equal(arenaCanFight(g,unstamped,b),false);
  g.hurt(b,30,unstamped);
  assert.equal(b.hp,protectedHealth,'a delayed effect with no in-ring release cannot damage fighters');
  Object.assign(b,{x:ARENA_RING.x+ARENA_RING.w+10});
  g.hurt(b,30,second);
  assert.equal(b.hp,protectedHealth,'a valid projectile cannot harm the safe gallery');
 });
}

test('a knockout restores the explorer to the safe gallery without ending the expedition',()=>{
 const {g,a,b}=setup();const original=b.hp;enter(g,a);fighters(a,b);
 const inventory=JSON.stringify(b.inventory);
 g.hurt(b,999,a);
 assert.equal(b.hp,original);
 assert.equal(arenaFighter(g,b),false);
 assert.equal(g.phase,'play');
 assert.equal(JSON.stringify(b.inventory),inventory);
 assert.ok(arenaFighter(g,a));
});

test('the octagon has one walkable gate and the rest of the fence blocks actors and projectiles',()=>{
 const {g,a}=setup();enter(g,a);
 const gate=ARENA_RING_GATE;
 assert.equal(ARENA_FENCE_EDGES.length,9,'the east wall is split once');
 for(const {a:start,b:end}of ARENA_FENCE_EDGES){
  const x=(start.x+end.x)/2,y=(start.y+end.y)/2;
  assert.equal(g.blocked(x,y,8),true);
  assert.equal(g.projectileBlocked(x,y,1),true);
 }
 assert.equal(g.blocked(gate.x,gate.y,8),false);
 assert.equal(g.projectileBlocked(gate.x,gate.y,1),false);
 Object.assign(a,{x:gate.x+28,y:gate.y});
 assert.equal(arenaFighter(g,a),false);
 for(let i=0;i<10;i++)g.moveActor(a,-5,0);
 assert.ok(a.x<gate.x-15&&arenaFighter(g,a));
 for(let i=0;i<10;i++)g.moveActor(a,5,0);
 assert.ok(a.x>gate.x+15&&!arenaFighter(g,a));
 Object.assign(a,{x:point().x,y:ARENA_RING.y-27});
 for(let i=0;i<15;i++)g.moveActor(a,0,5);
 assert.ok(a.y<ARENA_RING.y&&!arenaFighter(g,a));
 Object.assign(a,{x:ARENA_RING.x+18,y:ARENA_RING.y+16});
 assert.equal(arenaFighter(g,a),false,'the corners cut from the bounding box stay safe');
 g.pvp=true;
 assert.equal(g.attack(a,1.2),false,'the clipped corner cannot wind up an attack');
});

test('live arrows stop at the octagonal fence and cannot hurt gallery players through its gate',()=>{
 const {g,a,b}=setup();enter(g,a);
 const gate=ARENA_RING_GATE;
 a.equipment={hand1:'bow'};a.inventory=[{type:'arrow',qty:100}];a.faceX=1;a.faceY=0;
 Object.assign(a,{x:gate.x-72,y:gate.top-34});
 const fencedOrigin=rangedLaunchOrigin(a,g.time,'bow');
 Object.assign(b,{x:gate.x+36,y:fencedOrigin.y});
 assert.equal(g.fireArrow(a,0),true);
 for(let i=0;i<36;i++){g.time+=.02;g.tickProjectiles(.02);}
 assert.equal(g.arrows.some(shot=>!shot.stuck&&shot.x>gate.x),false);
 Object.assign(a,{x:gate.x-72,y:gate.y});
 const gateOrigin=rangedLaunchOrigin(a,g.time,'bow');
 Object.assign(b,{x:gate.x+34,y:gateOrigin.y,invuln:0});
 const hp=b.hp;
 assert.equal(g.fireArrow(a,0),true);
 let crossed=false;
 for(let i=0;i<36;i++){
  g.time+=.02;g.tickProjectiles(.02);
  crossed ||= g.arrows.some(shot=>!shot.stuck&&shot.x>gate.x);
 }
 assert.ok(crossed,'the same arrow can physically leave through the open gate');
 assert.equal(b.hp,hp,'the safe gallery does not become a valid PvP target');
});

test('arena spectators sample visible rows only and briefly cheer an actual knockout',()=>{
 const {g,a,b}=setup();enter(g,a);fighters(a,b);
 const renderer={},outside={left:9000,top:9000,right:9100,bottom:9100};
 drawArenaSpectators(renderer,g,outside,[]);
 assert.deepEqual(renderer.arenaSpectatorStats,{benches:0,painted:0,samples:0,comparisons:0,cheering:0});
 g.hurt(b,999,a);
 assert.equal(g.trainTest.arena.combatEvents.at(-1).kind,'knockout');
 g.time+=.31;
 const stage={left:7410,top:4389,right:8384,bottom:5120},queue=[];
 drawArenaSpectators(renderer,g,stage,queue);
 assert.equal(renderer.arenaSpectatorStats.benches,3);
 assert.equal(queue.length,18);
 assert.ok(renderer.arenaSpectatorStats.cheering>0&&renderer.arenaSpectatorStats.cheering<18);
 drawArenaSpectators(renderer,g,stage,[]);
 assert.equal(renderer.arenaSpectatorStats.comparisons,0);
});
