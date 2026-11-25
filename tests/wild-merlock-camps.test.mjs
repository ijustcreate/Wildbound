import assert from 'node:assert/strict';
import test from 'node:test';
import {Game} from '../src/core.mjs';
import {enterWildLands} from '../src/wild-lands.mjs';
import {MERLOCK_CAMPS,MERLOCK_CAMP_AGGRO,merlockCampGround} from '../src/wild-merlock-camps.mjs';
import {tickWildBiomeSpawns,wildBiomeTargets,tickWildBiomeLeash} from '../src/wild-biome-spawns.mjs';
import {nearestTrainTrack} from '../src/train-track.mjs';
import {restoreSession,saveSession} from '../src/session.mjs';

test('beach camps use dry land and the shared spawn, leash, and checkpoint system',()=>{
 const g=new Game(()=>.5,{deferWorld:true}),p=g.addPlayer('keyboard','Beach explorer');
 g.phase='play';g.persist=()=>{};
 assert.ok(enterWildLands(g,{persistent:true}).ok);
 const t=g.trainTest,camp=MERLOCK_CAMPS.find(entry=>entry.key.endsWith('emberbank'));
 t.preparing=false;
 assert.ok(MERLOCK_CAMPS.every(entry=>entry.members.length>=2&&entry.members.length<=5&&
  merlockCampGround(t.design,entry)&&nearestTrainTrack(t.route,entry.x,entry.y).distance>=200));
 Object.assign(p,{x:camp.x,y:camp.y-280});
 for(let i=0;i<5;i++){t.time+=.36;tickWildBiomeSpawns(g);}
 const live=g.enemies.filter(e=>e.wildSpawnKey&&e.hp>0),patrol=live.filter(e=>e.merlockCamp===camp.key);
 assert.equal(patrol.length,5);
 assert.ok(live.length<=24);
 assert.ok(live.filter(e=>Math.hypot(e.x-camp.x,e.y-camp.y)<940).length<=12);
 assert.deepEqual(new Set(patrol.map(e=>e.shoreRole)),new Set(['melee','spear','healer']));
 assert.ok(patrol.every(e=>e.group===camp.key&&e.kind==='shore_goblin'&&e.name==='Merlock'));
 const enemy=patrol[0];
 const near={...p,x:camp.x,y:camp.y-58},far={...p,x:camp.x,y:camp.y-MERLOCK_CAMP_AGGRO-35};
 assert.deepEqual(wildBiomeTargets(g,enemy,[near,far,{...near,swimming:true}]),[near]);
 Object.assign(enemy,{x:camp.x,y:camp.y+MERLOCK_CAMP_AGGRO+25});
 assert.ok(tickWildBiomeLeash(g,enemy,.05,[near]));
 assert.equal(enemy.returningToWildSpawn,true);
 const restored=restoreSession(JSON.parse(JSON.stringify(saveSession(g))));
 assert.equal(restored.enemies.filter(e=>e.merlockCamp===camp.key&&e.hp>0).length,5);
});

test('East Flotsam hibernated guards use the current beach posts and preserve health and regrowth',()=>{
 const g=new Game(()=>.5,{deferWorld:true});
 g.addPlayer('keyboard','Beach explorer');
 g.phase='play';g.persist=()=>{};
 assert.ok(enterWildLands(g,{persistent:true}).ok);
 const camp=MERLOCK_CAMPS.find(entry=>entry.key.endsWith('east-flotsam'));
 const [guard,defeated]=camp.members;
 g.trainTest.time=25;
 g.trainTest.wildBiomeSpawns={
  [guard.key]:{home:{x:15033,y:4951},hp:19},
  [defeated.key]:{defeatedAt:24},
 };
 const restored=restoreSession(JSON.parse(JSON.stringify(saveSession(g))));
 const t=restored.trainTest,p=restored.players[0];
 t.preparing=false;
 Object.assign(p,{x:camp.x-265,y:camp.y});
 for(let i=0;i<5;i++){t.time+=.36;tickWildBiomeSpawns(restored);}
 const awake=restored.enemies.find(e=>e.wildSpawnKey===guard.key);
 assert.deepEqual({x:awake.homeX,y:awake.homeY,hp:awake.hp},{x:guard.x,y:guard.y,hp:19});
 assert.equal(t.wildBiomeSpawns[defeated.key].defeatedAt,24);
 assert.ok(!restored.enemies.some(e=>e.wildSpawnKey===defeated.key));
 t.time+=480;
 tickWildBiomeSpawns(restored);
 const regrown=restored.enemies.find(e=>e.wildSpawnKey===defeated.key);
 assert.deepEqual({x:regrown.homeX,y:regrown.homeY},{x:defeated.x,y:defeated.y});
});

test('legacy East Flotsam active guards relocate while edited posts persist',()=>{
 const g=new Game(()=>.5,{deferWorld:true});
 g.addPlayer('keyboard','Beach explorer');
 g.phase='play';g.persist=()=>{};
 assert.ok(enterWildLands(g,{persistent:true}).ok);
 const camp=MERLOCK_CAMPS.find(entry=>entry.key.endsWith('east-flotsam'));
 const [guard,override]=camp.members;
 const original={id:70,kind:'shore_goblin',faction:'enemy',hp:19,x:15036,y:4953,
  homeX:15033,homeY:4951,merlockCamp:camp.key,merlockPost:0,wildSpawnKey:guard.key};
 const edited={...original,id:71,x:15131,y:4955,homeX:15131,homeY:4955,
  merlockPost:1,wildSpawnKey:override.key,wildSpawnLayout:'15131,4955'};
 g.enemies.push(original,edited);
 const snapshot=JSON.parse(JSON.stringify(saveSession(g)));
 const archived=structuredClone(snapshot);
 archived.wilds.progress.wildBiomeRoomActors={surface:{enemies:archived.state.enemies}};
 archived.state.enemies=[];
 for(const [saved,surfaceArchived] of [[snapshot,false],[archived,true]]){
  const restored=restoreSession(saved);
  const enemies=surfaceArchived?restored.trainTest.wildBiomeRoomActors.surface.enemies:restored.enemies;
  assert.deepEqual(enemies.find(e=>e.id===original.id),{
   ...original,x:guard.x,y:guard.y,homeX:guard.x,homeY:guard.y,
   merlockCampCenter:{x:camp.x,y:camp.y},wildSpawnLayout:guard.layout,
  });
  assert.deepEqual(enemies.find(e=>e.id===edited.id),edited);
 }
});
