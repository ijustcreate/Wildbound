import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/core.mjs';
import {graveyardWorld} from '../src/graveyard-world.mjs';
import {spawnSurfaceEcology,startleGraveyardCats,tickSurfaceEcology,graveyardHabitat} from '../src/graveyard-ecology.mjs';

function setup(seed=75){
  const g={...graveyardWorld(seed),generatedEnvironment:'graveyard',phase:'play',players:[],enemies:[]};
  const cat=spawnSurfaceEcology(g).find(a=>a.kind==='graveyard_cat');
  // Open ground outside the fenced grounds gives a deterministic unobstructed attack.
  Object.assign(cat,{x:800,y:1400,homeX:800,homeY:1400,phase:0,idle:'sit'});
  const p={id:1,x:756,y:1386,hp:100,faceX:1,faceY:0};g.players=[p];
  return {g,cat,p};
}

test('approaching cats does not frighten them; an aimed attack wakes and sends them away',()=>{
  const {g,cat,p}=setup();tickSurfaceEcology(g,.1);assert.equal(cat.idle,'sit');assert.equal(cat.flee,undefined);
  assert.equal(startleGraveyardCats(g,p),true);assert.equal(cat.idle,'run');
  tickSurfaceEcology(g,.5);assert.ok(cat.x>850);assert.ok(cat.moving);
  assert.equal(cat.catchable,false);assert.equal(cat.faction,'neutral');assert.equal(g.enemies.length,0);
  for(let i=0;i<25;i++)tickSurfaceEcology(g,.1);
  assert.equal(cat.flee,undefined);assert.ok(Math.hypot(cat.homeX-800,cat.homeY-1400)>100);
});

test('attack direction, distance, actor state and solid obstacles gate the response',()=>{
  const {g,cat,p}=setup();
  for(const patch of [{faceX:-1},{x:500},{hp:0},{room:'crypt'},{ui:{}},{x:NaN}])assert.equal(startleGraveyardCats(g,{...p,...patch}),false);
  g.paused=true;assert.equal(startleGraveyardCats(g,p),false);g.paused=false;
  g.generatedEnvironment='forest';assert.equal(startleGraveyardCats(g,p),false);g.generatedEnvironment='graveyard';
  const wall={kind:'mausoleum',graveyard:true,graveyardFootprint:{x:774,y:1370,w:10,h:70}};g.scenery.push(wall);
  assert.equal(startleGraveyardCats(g,p),false);assert.equal(cat.flee,undefined);
  g.scenery.pop();assert.equal(startleGraveyardCats(g,p),true);
});

test('fleeing survives JSON restore, pauses and repeated threats; delayed frames respect habitat',()=>{
  for(const seed of [0,1,75,991]){
    const {g,cat,p}=setup(seed);startleGraveyardCats(g,p);tickSurfaceEcology(g,.2);
    const restored=JSON.parse(JSON.stringify(g)),copy=spawnSurfaceEcology(restored).find(a=>a.kind==='graveyard_cat');
    assert.deepEqual(copy.flee,cat.flee);restored.paused=true;const before=structuredClone(copy);
    tickSurfaceEcology(restored,1);assert.deepEqual(copy,before);restored.paused=false;
    // A wide obstacle ahead forces a sideways route, rather than crossing its footprint.
    restored.scenery.push({kind:'mausoleum',graveyard:true,graveyardFootprint:{x:850,y:1350,w:40,h:100}});
    for(let i=0;i<40;i++){tickSurfaceEcology(restored,.2);assert.ok(graveyardHabitat(restored,copy.kind,copy.x,copy.y));}
    assert.equal(copy.flee,undefined);
    Object.assign(p,{x:cat.x-35,y:cat.y-14});assert.equal(startleGraveyardCats(g,p),true);assert.equal(cat.flee.remaining,2.5);
    tickSurfaceEcology(g,10);assert.ok(graveyardHabitat(g,cat.kind,cat.x,cat.y));assert.equal(cat.flee.remaining,1.5);
  }
});

test('the real attack entry point frightens cats for unarmed, melee, ranged and magic attempts',()=>{
  const g=new Game(()=>.5);g.environment='graveyard';const p=g.addPlayer('keyboard');g.start();g.openingBoard=false;
  const cat=spawnSurfaceEcology(g).find(a=>a.kind==='graveyard_cat');
  Object.assign(p,{x:756,y:1386,faceX:1,faceY:0});
  for(const weapon of [null,'sword','bow','fire_wand','boomerang','rifle']){
    Object.assign(cat,{x:800,y:1400,homeX:800,homeY:1400});delete cat.flee;
    p.attack=0;p.equipment.hand1=weapon;p.equipment.hand2=null;
    g.attack(p,1);assert.ok(cat.flee,weapon||'unarmed');
  }
});
