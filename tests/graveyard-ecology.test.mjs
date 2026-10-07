import test from 'node:test';
import assert from 'node:assert/strict';
import {graveyardWorld} from '../src/graveyard-world.mjs';
import {seedGraveyardCritters,spawnSurfaceEcology,tickSurfaceEcology,tickGraveyardCritter,graveyardHabitat,
  catchGraveyardCritter,releaseGraveyardCritter,GRAVEYARD_CRITTER_ITEMS,GRAVEYARD_ECOLOGY_LIMITS} from '../src/graveyard-ecology.mjs';
import {ITEMS,give,count} from '../src/items.mjs';

// Simulate the registry hook owned by main/gear, using the REAL give/take APIs.
Object.assign(ITEMS,GRAVEYARD_CRITTER_ITEMS);
const setup=(seed=75)=>({...graveyardWorld(seed),seed,generatedEnvironment:'graveyard',phase:'play',players:[],enemies:[],message(){},persist(){}});
const catcher=a=>({id:7,x:a.x-18,y:a.y,hp:100,faceX:1,faceY:0,inventory:[],equipment:{hand1:'critter_net'}});
const pick=(g,kind='grave_moth')=>spawnSurfaceEcology(g).find(a=>a.kind===kind);

test('exclusive cemetery ecology seeds exactly 8 moths, 6 beetles, 1 neutral cat',()=>{
  for(const seed of [0,1,75,991]) {
    const g=setup(seed),animals=spawnSurfaceEcology(g);
    assert.equal(animals.length,15);assert.deepEqual(seedGraveyardCritters(g),seedGraveyardCritters(g));
    for(const kind of ['grave_moth','crypt_beetle','graveyard_cat'])assert.equal(animals.filter(a=>a.kind===kind).length,GRAVEYARD_ECOLOGY_LIMITS[kind]);
    for(const a of animals){assert.ok(graveyardHabitat(g,a.kind,a.x,a.y));assert.equal(a.faction,'neutral');}
    assert.equal(pick(g,'graveyard_cat').catchable,false);assert.equal(g.enemies.length,0);
    assert.equal(seedGraveyardCritters(g,4).length,4);assert.equal(seedGraveyardCritters(g,Infinity).length,0);
    assert.deepEqual(JSON.parse(JSON.stringify(g.graveyard)),g.graveyard);
    g.generatedEnvironment='forest';assert.deepEqual(seedGraveyardCritters(g),[]);assert.deepEqual(spawnSurfaceEcology(g),[]);
    assert.equal(tickSurfaceEcology(g,.1),false);
  }
});

test('init/JSON restore is idempotent, population caps hold and catches never refill',()=>{
  const g=setup(),a=pick(g),p=catcher(a);give(p.inventory,'empty_jar',1);
  assert.ok(catchGraveyardCritter(g,p));assert.equal(count(p,'caught_grave_moth'),1);
  for(let n=0;n<30;n++)spawnSurfaceEcology(g);
  assert.equal(g.graveyard.surfaceEcology.animals.length,14);
  const copy=JSON.parse(JSON.stringify(g));spawnSurfaceEcology(copy);
  assert.equal(copy.graveyard.surfaceEcology.animals.length,14);assert.deepEqual(copy.graveyard.surfaceEcology.caught,[a.id]);
  const cat=pick(copy,'graveyard_cat');copy.graveyard.surfaceEcology.animals.push({...cat,id:999},{...cat,id:1000},{...cat});
  spawnSurfaceEcology(copy);assert.equal(copy.graveyard.surfaceEcology.animals.filter(a=>a.kind==='graveyard_cat').length,1);
});

test('moths/beetles wander on valid surface, while the neutral cat mostly idles',()=>{
  const g=setup(),animals=spawnSurfaceEcology(g),cat=animals.find(a=>a.kind==='graveyard_cat');
  const start=animals.map(a=>({...a}));let idle=0;
  for(let n=0;n<600;n++) {
    tickSurfaceEcology(g,.1);
    const live=g.graveyard.surfaceEcology.animals;
    assert.equal(live.length,15);
    for(const a of live)assert.ok(graveyardHabitat(g,a.kind,a.x,a.y));
    if(!cat.moving)idle++;
  }
  assert.ok(idle>420);assert.equal(cat.catchable,false);assert.equal(cat.faction,'neutral');assert.equal(g.enemies.length,0);
  assert.ok(g.graveyard.surfaceEcology.animals.some((a,i)=>a.x!==start[i].x));
  const before=structuredClone(g.graveyard);g.paused=true;
  assert.equal(tickSurfaceEcology(g,1),false);assert.deepEqual(g.graveyard,before);
  g.paused=false;for(const dt of [NaN,Infinity,0,-1])assert.equal(tickGraveyardCritter(g,cat,dt,10),false);
});

test('net catches respect hand, range, facing, actor state and never catch the cat',()=>{
  const g=setup(),a=pick(g),p=catcher(a);give(p.inventory,'empty_jar',2);
  p.equipment={};assert.equal(catchGraveyardCritter(g,p),false);
  p.equipment={hand2:'critter_net'};p.faceX=-1;assert.equal(catchGraveyardCritter(g,p,20),false);
  p.faceX=1;assert.equal(catchGraveyardCritter(g,p,12),false);
  for(const patch of [{room:'x'},{ui:{}},{hp:0}])assert.equal(catchGraveyardCritter(g,{...p,...patch}),false);
  assert.equal(catchGraveyardCritter(g,p),true);assert.equal(count(p,'empty_jar'),1);
  assert.equal(p.inventory.find(i=>i.type==='caught_grave_moth').captureContainer,'empty_jar');
  g.graveyard.surfaceEcology.animals=[pick(g,'graveyard_cat')];const cat=g.graveyard.surfaceEcology.animals[0];
  Object.assign(p,{x:cat.x,y:cat.y});assert.equal(catchGraveyardCritter(g,p),false);
});

test('catch transaction consumes containers from nested bags and migrates legacy bottles',()=>{
  const g=setup(),p=catcher(pick(g,'crypt_beetle'));
  p.inventory=[{type:'relic_bag',qty:1,contents:[{type:'relic_bag',qty:1,contents:[{type:'empty_jar',qty:2}]}]}];
  assert.equal(catchGraveyardCritter(g,p),true);
  assert.equal(p.inventory[0].contents[0].contents[0].qty,1);assert.equal(count(p,'caught_crypt_beetle'),1);
  const g2=setup(),p2=catcher(pick(g2));p2.inventory=[{type:'empty_bottle',qty:1}];
  assert.equal(catchGraveyardCritter(g2,p2),true);assert.equal(count(p2,'caught_grave_moth'),1);
  assert.equal(p2.inventory.find(i=>i.type==='caught_grave_moth').captureContainer,'empty_jar');
});

test('cage fallback preserves the exact used container on capture and release',()=>{
  const g=setup(),p=catcher(pick(g));give(p.inventory,'critter_cage');
  assert.equal(catchGraveyardCritter(g,p),true);const i=p.inventory.findIndex(i=>i.type==='caught_grave_moth');
  assert.equal(p.inventory[i].captureContainer,'critter_cage');
  p.ui={};assert.equal(releaseGraveyardCritter(g,p,i),true);assert.equal(count(p,'critter_cage'),1);assert.equal(count(p,'caught_grave_moth'),0);
  assert.ok(g.graveyard.surfaceEcology.animals.find(a=>a.releasedOwner===p.id));
});

test('full/missing/unregistered catch failures are handled and atomic, including nested bags',()=>{
  const g=setup(),p=catcher(pick(g));const initial=structuredClone(p.inventory);
  assert.equal(catchGraveyardCritter(g,p),true);assert.deepEqual(p.inventory,initial);assert.equal(spawnSurfaceEcology(g).length,15);
  p.inventory=Array.from({length:24},()=>({type:'sword',qty:1}));
  p.inventory[0]={type:'relic_bag',qty:1,contents:[{type:'empty_jar',qty:1}]};
  const before=structuredClone(p.inventory);assert.equal(catchGraveyardCritter(g,p),true);
  assert.deepEqual(p.inventory,before);assert.equal(spawnSurfaceEcology(g).length,15);
  const definition=ITEMS.caught_grave_moth;delete ITEMS.caught_grave_moth;
  try{assert.equal(catchGraveyardCritter(g,p),true);assert.deepEqual(p.inventory,before);}finally{ITEMS.caught_grave_moth=definition;}
});

test('release is transactional, honors limits and returns true on full inventory',()=>{
  const g=setup(),a=pick(g),p=catcher(a);give(p.inventory,'empty_jar');catchGraveyardCritter(g,p);
  let i=p.inventory.findIndex(i=>i.type==='caught_grave_moth');
  const captured=structuredClone(p.inventory);
  p.room='crypt';assert.equal(releaseGraveyardCritter(g,p,i),false);p.room=null;
  p.inventory=Array.from({length:24},()=>({type:'sword',qty:1}));
  p.inventory[0]={...captured.find(i=>i.type==='caught_grave_moth'),qty:2};
  const full=structuredClone(p.inventory);p.ui={};assert.equal(releaseGraveyardCritter(g,p,0),true);
  assert.deepEqual(p.inventory,full);assert.match(p.ui.notice,/room/i);
  p.inventory=captured;i=p.inventory.findIndex(i=>i.type==='caught_grave_moth');
  assert.equal(releaseGraveyardCritter(g,p,i),true);assert.equal(count(p,'empty_jar'),1);
  const released=g.graveyard.surfaceEcology.animals.find(a=>a.releasedOwner===p.id);assert.ok(released);
  give(p.inventory,'caught_grave_moth',1,24,{captureContainer:'empty_jar'});
  const capped=structuredClone(p.inventory);i=p.inventory.findIndex(i=>i.type==='caught_grave_moth');
  assert.equal(releaseGraveyardCritter(g,p,i),true);assert.deepEqual(p.inventory,capped);
  // Recapture removes the released animal without adding a second native caught ID.
  p.ui=null;Object.assign(p,{x:released.x-12,y:released.y,faceX:1,faceY:0});
  assert.equal(catchGraveyardCritter(g,p),true);assert.deepEqual(g.graveyard.surfaceEcology.caught,[a.id]);
});
