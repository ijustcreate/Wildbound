import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/core.mjs';
import {creatures} from '../src/definitions.mjs';
import {enterWildLands} from '../src/wild-lands.mjs';
import {WILD_LANDS_GATES,WILD_LANDS_EXIT,wildLandsInteract,wildLandsSurfaceAt} from '../src/wild-lands-world.mjs';
import {nearestTrainTrack} from '../src/train-track.mjs';
import {WILD_BIOME_GROUPS,tickWildBiomeSpawns,wildBiomeSafe,wildBiomeTargets} from '../src/wild-biome-spawns.mjs';
import {saveSession,restoreSession} from '../src/session.mjs';

function fixture(){
 const g=new Game(()=>.5),p=g.addPlayer('keyboard','Wilds explorer');
 g.start();g.openingBoard=false;g.persist=()=>{};
 assert.ok(enterWildLands(g,{persistent:true}).ok);
 g.trainTest.preparing=false;
 return {g,p,t:g.trainTest};
}
const active=g=>g.enemies.filter(e=>e.wildSpawnKey&&e.hp>0);
const update=(g,n=44)=>{for(let i=0;i<n;i++)g.update(.05,{keyboard:{}});};
const travel=(g,p,x,y,n)=>{Object.assign(p,{x,y,ui:null});update(g,n);};
const serialize=g=>JSON.parse(JSON.stringify(saveSession(g)));

test('surface habitat populations wake around explorers on valid ground, away from the railway and landmarks',()=>{
 const {g,p,t}=fixture();
 for(const [biome,x,y] of [['jungle',4100,2600],['forest',6000,4800],['ice',9050,5380],
  ['graveyard',4550,6600],['house',8800,8100],['beach',11200,8890],['swamp',12800,2600]]){
  travel(g,p,x,y);
  const local=active(g).filter(e=>Math.hypot(e.homeX-x,e.homeY-y)<1020&&e.wildSpawnBiome===biome);
  assert.ok(local.length,biome+' has active native monsters');
  for(const e of local){
   assert.ok(WILD_BIOME_GROUPS[biome].some(group=>group.includes(e.kind)));
   assert.equal(creatures[e.kind].faction,'enemy');
   assert.equal(wildLandsSurfaceAt(t.design,e.homeX,e.homeY),'grass');
   assert.ok(nearestTrainTrack(t.route,e.homeX,e.homeY).distance>=105);
   assert.ok(!wildBiomeSafe(t,e.homeX,e.homeY));
   assert.ok(!g.blocked(e.homeX,e.homeY,10));
  }
  assert.ok(active(g).length<=24);
 }
});

test('an occupied train does not wake packs and protected actors are outside the monsters’ target list',()=>{
 const {g,p,t}=fixture();
 Object.assign(p,{x:4100,y:2600,trainRide:{car:2,seat:'test'}});
 for(let i=0;i<20;i++){t.time+=.35;tickWildBiomeSpawns(g);}
 assert.deepEqual(active(g),[]);
 delete p.trainRide;
 update(g);
 const e=active(g)[0];
 assert.ok(e);
 const candidate={...p,x:e.homeX,y:e.homeY,hp:10};
 assert.deepEqual(wildBiomeTargets(g,e,[candidate,{...candidate,trainRide:{car:2}},{...candidate,pirateRide:{}}]),[candidate]);
 assert.deepEqual(wildBiomeTargets(g,e,[{...candidate,x:e.homeX+540}]),[]);
});

test('Bayou ambient elementals are occasional and recorded individuals still wake at their old home',()=>{
 const place=(seed)=>{
  const state=fixture(),{p,t}=state;
  t.design.seed=seed;
  t.streamDisabled=true;
  Object.assign(p,{x:12800,y:2600,ui:null});
  return state;
 };
 const wake=({g,t})=>{
  for(let i=0;i<20;i++){t.time+=.36;tickWildBiomeSpawns(g);}
  return active(g).filter(enemy=>enemy.wildSpawnBiome==='swamp'&&enemy.kind==='water_elemental');
 };
 const rare=place(1);
 assert.equal(wake(rare).length,1);
 assert.ok(active(rare.g).some(enemy=>enemy.wildSpawnBiome==='swamp'&&enemy.kind==='zombie'));

 const saved=place(7);
 assert.deepEqual(wake(saved),[]);
 const key='surface:23:4:1',home={x:12053,y:2224};
 (saved.t.wildBiomeSpawns??={})[key]={home,hp:43};
 const restored=wake(saved).find(enemy=>enemy.wildSpawnKey===key);
 assert.equal(restored?.kind,'water_elemental');
 assert.equal(restored.hp,43);
 assert.deepEqual({x:restored.homeX,y:restored.homeY},home);
});

test('hibernation preserves a wounded pack member and checkpointed defeats do not immediately respawn',()=>{
 const {g,p,t}=fixture();
 travel(g,p,4100,2600);
 const enemy=active(g).find(e=>e.wildSpawnBiome==='jungle');
 const origin={x:p.x,y:p.y},key=enemy.wildSpawnKey,hp=enemy.hp-11;
 enemy.hp=hp;
 travel(g,p,9050,5380,18);
 assert.ok(!active(g).some(e=>e.wildSpawnKey===key));
 assert.equal(t.wildBiomeSpawns[key].hp,hp);
 const saved=restoreSession(serialize(g)),hero=saved.players[0],restored=saved.trainTest;
 restored.preparing=false;
 travel(saved,hero,origin.x,origin.y,62);
 const same=active(saved).find(e=>e.wildSpawnKey===key);
 assert.equal(same?.hp,hp);assert.equal(same?.homeX,enemy.homeX);assert.equal(same?.homeY,enemy.homeY);
 same.hp=0;saved.tickCombatActors(.05);
 assert.equal(restored.wildBiomeSpawns[key].defeatedAt,restored.time);
 travel(saved,hero,origin.x,origin.y,45);
 assert.ok(!active(saved).some(e=>e.wildSpawnKey===key));
 assert.ok(serialize(saved).wilds.progress.wildBiomeSpawns[key].defeatedAt>0);
});

test('Caverns and Shadow Realm have their own packs and preserve surface actors and drops across travel',()=>{
 const {g,p,t}=fixture();
 travel(g,p,6000,4800);
 const surface=active(g)[0],outdoors={id:g.nextId++,x:6000,y:4800,type:'fruit',qty:1};
 g.loot.push(outdoors);
 for(const room of ['caverns','shadow']){
  const gate=WILD_LANDS_GATES.find(point=>point.id===room);
  Object.assign(p,{x:gate.x,y:gate.y});
  assert.ok(wildLandsInteract(g,p));
  assert.equal(t.design.activeRoom,room);
  assert.ok(!g.loot.includes(outdoors));
  update(g,66);
  const monsters=active(g);
  assert.ok(monsters.length>0);
  assert.ok(monsters.every(e=>e.wildSpawnRoom===room&&e.wildSpawnBiome===room));
  assert.ok(t.wildBiomeRoomActors.surface.enemies.includes(surface));
  const indoors={id:g.nextId++,x:8040,y:5380,type:'potion',qty:1};
  g.loot.push(indoors);
  Object.assign(p,WILD_LANDS_EXIT);assert.ok(wildLandsInteract(g,p));
  assert.ok(g.loot.includes(outdoors)&&!g.loot.includes(indoors));
  assert.ok(t.wildBiomeRoomActors[room].loot.includes(indoors));
  assert.ok(g.enemies.includes(surface));
 }
});
