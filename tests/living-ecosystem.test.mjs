import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/core.mjs';
import {generateWorld} from '../src/world.mjs';
import {saveSession,restoreSession} from '../src/session.mjs';
import {initLivingEcosystem,updateLivingEcosystem,drawLivingEcosystem,
  livingEcosystemBlocked,cutLivingVines,livingAnimals,livingAttractions,LIVING_LIMITS} from '../src/living-ecosystem.mjs';

function setup(environment='forest') {
  const g=new Game(()=>.2);g.addPlayer('keyboard');g.start();
  g.environment=environment;g.generatedEnvironment=environment;
  Object.assign(g,generateWorld(g.seed,environment));
  initLivingEcosystem(g);return g;
}
function advance(g,seconds) {for(let i=0;i<seconds;i++)updateLivingEcosystem(g,1);}

test('deterministic bounded sites protect escape corridors, entrances and actors',()=>{
  for(const environment of ['forest','temple']) {
    const g=setup(environment),s=g.livingEcosystem;
    assert.ok(s.vines.length>0&&s.vines.length<=LIVING_LIMITS.vines);
    assert.deepEqual(s,setup(environment).livingEcosystem);
    for(const v of s.vines) {
      assert.ok(Math.abs(v.x-800)>=96);
      assert.ok([272,784,1296].every(y=>Math.abs(v.y-y)>=64));
      if(environment==='temple')assert.ok(Math.hypot(v.x-1040,v.y-590)>=100);
    }
    const v=s.vines[0];Object.assign(g.players[0],{x:v.x,y:v.y-14});
    advance(g,140);assert.equal(v.stage,0);
    g.players[0].x=800;g.players[0].y=800;
    advance(g,3600);
    assert.equal(s.vines.length,24);
    assert.ok(s.vines.every(v=>v.stage===3));
  }
});

test('mature vines block the existing footprint and free facing cuts permanently open it',()=>{
  const g=setup(),v=g.livingEcosystem.vines[0];v.stage=1;
  assert.equal(livingEcosystemBlocked(g,v.x,v.y-14),false);
  v.stage=2;
  assert.equal(livingEcosystemBlocked(g,v.x,v.y-14),true);
  assert.equal(livingEcosystemBlocked(g,v.x,v.y,8,false,0),true);
  assert.equal(livingEcosystemBlocked(g,v.x,v.y-14,8,true),false);
  const p=g.players[0];Object.assign(p,{x:v.x-40,y:v.y-14,faceX:-1,faceY:0});
  assert.equal(cutLivingVines(g,p),false);
  p.faceX=1;assert.equal(cutLivingVines(g,p),true);
  assert.equal(livingEcosystemBlocked(g,v.x,v.y-14),false);
  advance(g,3600);assert.equal(v.cut,true);assert.equal(v.stage,0);
});

test('cut state and growth survive actual session snapshot/restore, corrupted fields are sanitized',()=>{
  const g=setup(),v=g.livingEcosystem.vines[0];v.cut=true;v.stage=0;
  g.livingEcosystem.growth=23;
  const restored=restoreSession(JSON.parse(JSON.stringify(saveSession(g))));
  initLivingEcosystem(restored);
  assert.deepEqual(restored.livingEcosystem,g.livingEcosystem);
  restored.livingEcosystem.vines[0].x=NaN;
  restored.livingEcosystem.vines[1].stage=Infinity;
  restored.livingEcosystem.growth=Infinity;
  initLivingEcosystem(restored);
  assert.equal(restored.livingEcosystem.vines[0].x,v.x);
  assert.equal(restored.livingEcosystem.vines[1].stage,0);
  assert.equal(restored.livingEcosystem.growth,0);
});

test('invalid dt, pauses, delayed frames, biome and seed changes cannot burst growth',()=>{
  const g=setup(),before=JSON.stringify(g.livingEcosystem);
  for(const dt of [NaN,Infinity,-1,0])assert.equal(updateLivingEcosystem(g,dt),false);
  assert.equal(JSON.stringify(g.livingEcosystem),before);
  g.phase='lobby';advance(g,100);assert.equal(JSON.stringify(g.livingEcosystem),before);
  g.phase='play';updateLivingEcosystem(g,1e9);assert.equal(g.livingEcosystem.growth,1);
  g.generatedEnvironment='ice';updateLivingEcosystem(g,1);
  assert.equal(g.livingEcosystem.vines.length,0);
  assert.deepEqual(new Set(livingAnimals(g).map(a=>a.kind)),new Set(['white_mouse','fairy']));
  g.seed++;updateLivingEcosystem(g,1);assert.equal(g.livingEcosystem.seed,g.seed);
});

test('ambient populations stay bounded, outside the house, and never alter core actors or loot',()=>{
  for(const environment of ['forest','house','ice','desert']) {
    const g=setup(environment),actors=JSON.stringify([g.enemies,g.loot,g.scenery]);
    advance(g,120);
    const animals=livingAnimals(g);
    assert.ok(animals.length<=18);
    assert.equal(JSON.stringify([g.enemies,g.loot,g.scenery]),actors);
    assert.ok(animals.length>0);
    if(environment==='house')for(const a of animals)assert.ok(!g.house.floors.some(r=>a.x>=r.x&&a.x<=r.x+r.w&&a.y>=r.y&&a.y<=r.y+r.h));
    if(environment==='forest'||environment==='house')assert.ok(animals.some(a=>a.kind==='dragonfly')&&animals.some(a=>a.kind==='frog'));
  }
});

test('plants attract insects and food/carrion attract scavengers without consumption',()=>{
  const g=setup(),animals=livingAnimals(g),insect=animals.find(a=>a.kind==='dragonfly'),scavenger=animals.find(a=>a.kind==='scavenger');
  g.scenery=[{kind:'flower',x:insect.x+20,y:insect.y-6,size:32,procedural:true}];
  g.enemies=[{kind:'rat',hp:0,x:scavenger.x+20,y:scavenger.y}];
  g.loot=[{type:'meat',x:scavenger.x+25,y:scavenger.y,qty:1}];
  const attractions=livingAttractions(g);
  assert.equal(attractions.plants.length,1);assert.equal(attractions.carrion.length,1);
  updateLivingEcosystem(g,1);
  assert.equal(livingAnimals(g).find(a=>a.id===insect.id).targetKind,'plant');
  assert.equal(livingAnimals(g).find(a=>a.id===scavenger.id).targetKind,'rat');
  assert.equal(g.loot[0].qty,1);assert.equal(g.enemies[0].hp,0);
});

test('pixel renderer is read-only, balanced and layer-selective for every habitat',()=>{
  for(const environment of ['forest','ice']) {
    const g=setup(environment);g.livingEcosystem.vines.forEach(v=>v.stage=3);
    const before=JSON.stringify(g.livingEcosystem);let depth=0,rectangles=0;
    const c={save(){depth++;},restore(){depth--;},fillRect(...args){assert.ok(args.every(Number.isFinite));rectangles++;}};
    drawLivingEcosystem(c,g,'ground');assert.equal(depth,0);assert.ok(rectangles>0);
    rectangles=0;drawLivingEcosystem(c,g,'air');assert.equal(depth,0);assert.ok(rectangles>0);
    assert.equal(JSON.stringify(g.livingEcosystem),before);
  }
});
