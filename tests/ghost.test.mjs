import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,EVENTS} from '../src/core.mjs';
import {defaultGhostMotion,validateGhostMotion,ghostVisualActor} from '../src/ghost-motion.mjs';
import {GHOST_EQUIPMENT,ITEMS} from '../src/items.mjs';
import {tickGhost,tickGhostTrail} from '../src/ghost-ai.mjs';
import {graveyardWorld,harvestGravestone,tickGraveyard} from '../src/graveyard-world.mjs';
import {spawnSurfaceEcology,tickSurfaceEcology,graveyardHabitat} from '../src/graveyard-ecology.mjs';
import {fleeGhostCritter} from '../src/ghost-fear.mjs';
import {generateMausoleumCrypt,upgradeMausoleumGhosts,tickMausoleumCrypt} from '../src/mausoleum-crypt.mjs';
import {saveSession,restoreSession} from '../src/session.mjs';

const field=()=>{const g=new Game(()=>.4),p=g.addPlayer('keyboard');Object.assign(g,{phase:'play',openingBoard:false,scenery:[],enemies:[],house:null});g.terrain.fill('grass');Object.assign(p,{x:440,y:400,hp:100});return {g,p};};
const ghost=()=>({id:991,kind:'ghost',hp:76,x:400,y:400,speed:54,damage:12,cooldown:0,faceX:1,faceY:0});

test('Spectral outfit uses the editable humanoid joints and claws, with hidden legs and distinct gear',()=>{
 const m=defaultGhostMotion();assert.ok(validateGhostMotion(m));assert.ok(m.joints.head&&m.joints.handL&&m.joints.footR);assert.ok(m.clips.claw);
 m.clips.walk.keys[2].joints.handL[0]-=2;assert.ok(validateGhostMotion(m));
 const a=ghostVisualActor({...ghost(),moving:true});assert.deepEqual(a.equipment,GHOST_EQUIPMENT);assert.equal(a.animationAction,'walk');assert.equal(a.appearance.hair,'none');
 for(const [slot,id]of Object.entries(GHOST_EQUIPMENT))assert.equal(ITEMS[id].slot,slot);
 assert.ok(ITEMS.ghost_mist.spectralLegs&&ITEMS.ghost_claws.spectralClaws&&ITEMS.ghost_hood.spectralEyes);
});

test('Ghost melee telegraphs, hits once, and allows dodging, walls and freeze interruption',()=>{
 for(const mode of ['hit','dodge','wall','freeze']){
  const {g,p}=field(),e=ghost();let hits=0;g.hurt=()=>hits++;
  tickGhost(g,e,[p],.05);assert.ok(e.ghostWindup>=.5);assert.equal(hits,0);
  if(mode==='dodge')p.y+=90;
  if(mode==='wall')g.blocked=()=>true;
  if(mode==='freeze')e.frozen=2;
  tickGhost(g,e,[p],.7);assert.equal(hits,mode==='hit'?1:0,mode);
  tickGhost(g,e,[p],.05);assert.equal(hits,mode==='hit'?1:0,'No second damage during recovery');
 }
});

test('Ghost hunts from actual movement and eye histories remain bounded through JSON saves',()=>{
 const {g,p}=field(),e=ghost();p.x+=160;g.enemies.push(e);const start=e.x;
 for(let i=0;i<20;i++){g.time+=.05;e.moving=false;tickGhost(g,e,[p],.05);}
 assert.ok(e.x>start+30);assert.ok(e.ghostEyeTrail.length>0&&e.ghostEyeTrail.length<=4);
 const copy=JSON.parse(JSON.stringify(e));copy.frozen=1;tickGhostTrail(copy,.3);assert.equal(copy.ghostEyeTrail.length,0);
});

test('Actual world update cancels claws when frozen or when the last hero leaves the surface',()=>{
 for(const mode of ['freeze','room']){
  const {g,p}=field(),e=ghost();g.configureCreature(e,false);g.enemies.push(e);g.update(.05,{});assert.ok(e.ghostWindup>0);
  if(mode==='freeze')e.frozen=1;else p.room='crypt';
  g.update(.05,{});assert.equal(e.ghostWindup,0,mode);assert.equal(e.ghostAim,null);
 }
});

test('Cemetery event appends without shifting old save keys and restores its ghosts',()=>{
 const {g}=field();Object.assign(g,graveyardWorld(75),{environment:'graveyard',generatedEnvironment:'graveyard',seed:75});
 const index=EVENTS.findIndex(e=>e.kind==='ghost');assert.equal(index,76);g.spawnEvent(index);
 assert.equal(g.enemies.filter(e=>e.kind==='ghost').length,3);assert.ok(g.enemies.every(e=>e.graveEmergence));
 const copy=restoreSession(JSON.parse(JSON.stringify(saveSession(g))));assert.equal(copy.event.kind,'ghost');assert.equal(copy.enemies.filter(e=>e.kind==='ghost').length,3);
});

test('Broken tombstones roll skeleton, zombie or ghost once; ghosts emerge and pursue',()=>{
 for(const [roll,kind]of [[.01,'skeleton'],[.1,'zombie'],[.18,'ghost'],[.21,null]]){
  const {g,p}=field();Object.assign(g,graveyardWorld(75),{generatedEnvironment:'graveyard',seed:75});g.random=()=>roll;
  const s=g.scenery.find(s=>s.kind==='gravestone');Object.assign(p,{x:s.x,y:s.rootY+24,faceX:0,faceY:-1});
  assert.ok(harvestGravestone(g,p,100));assert.equal(g.enemies[0]?.kind||null,kind);const count=g.enemies.length;
  harvestGravestone(g,p,100);assert.equal(g.enemies.length,count);
  if(kind==='ghost'){const e=g.enemies[0],y=e.y;p.y=y+140;for(let n=0;n<3;n++)tickGraveyard(g,1);assert.ok(!e.graveEmergence);for(let n=0;n<120;n++)g.update(.05,{});assert.ok(Math.hypot(e.x-s.x,e.y-y)>45);}
 }
});

test('Cemetery cats, moths and beetles flee ghosts using habitat-safe movement and pause correctly',()=>{
 const g={...graveyardWorld(75),generatedEnvironment:'graveyard',phase:'play',players:[],enemies:[{...ghost(),x:760,y:1400}]};
 const actors=spawnSurfaceEcology(g);
 for(const kind of ['graveyard_cat','grave_moth','crypt_beetle']){
  const a=actors.find(a=>a.kind===kind);assert.ok(a,kind);Object.assign(a,{x:800,y:1400,homeX:800,homeY:1400});
  tickSurfaceEcology(g,.1);assert.ok(a.x>800&&a.moving,kind);assert.ok(graveyardHabitat(g,kind,a.x,a.y));
 }
 const a={id:7,kind:'frog',x:800,y:1400};g.paused=true;assert.equal(fleeGhostCritter(g,a,.1,()=>true),false);assert.equal(a.x,800);
 g.paused=false;assert.ok(fleeGhostCritter(g,a,2,(x)=>x<810));assert.ok(a.x<810,'No teleport through habitat boundary');
});

test('Crypt ghost migration adds enemies once and preserves cleared rooms, loot and explored tiles',()=>{
 const s=generateMausoleumCrypt(75);assert.equal(s.enemies.filter(e=>e.kind==='ghost').length,2);
 s.enemies=s.enemies.filter(e=>e.kind!=='ghost');delete s.ghostRosterVersion;s.drops.push({id:'kept',type:'bone_shard',qty:1,x:10,y:10});
 const floors=JSON.stringify(s.tiles);assert.ok(upgradeMausoleumGhosts(s));assert.equal(s.enemies.filter(e=>e.kind==='ghost').length,2);assert.equal(upgradeMausoleumGhosts(s),false);assert.equal(JSON.stringify(s.tiles),floors);assert.equal(s.drops[0].id,'kept');
 const cleared=generateMausoleumCrypt(75);delete cleared.ghostRosterVersion;cleared.enemies=[];cleared.coffin.defeated=true;assert.equal(upgradeMausoleumGhosts(cleared),false);assert.equal(cleared.enemies.length,0);
});

test('Underground ghosts use a melee windup with frozen interruption and persistent damage',()=>{
 const s=generateMausoleumCrypt(75),e=s.enemies.find(e=>e.kind==='ghost');s.enemies=[e];
 const d={id:'crypt',well:s},p={id:1,room:d.id,roomX:e.x+40,roomY:e.y,hp:100,equipment:{}};
 const g={players:[p],effects:[],difficulty:'normal'},helpers={sight:()=>true,blocked:()=>false,waypoint:(_s,_e,t)=>t,move:(_s,a,x,y)=>{a.x+=x;a.y+=y;return Math.hypot(x,y);}};
 tickMausoleumCrypt(g,d,[p],.05,helpers);assert.equal(e.state,'windup');tickMausoleumCrypt(g,d,[p],.7,helpers);assert.ok(p.hp<100);assert.equal(e.state,'recover');
 e.state='windup';e.timer=.1;e.frozen=1;p.invuln=0;const hp=p.hp;tickMausoleumCrypt(g,d,[p],.2,helpers);assert.equal(p.hp,hp);assert.notEqual(e.state,'windup');
});
