import test from 'node:test';
import assert from 'node:assert/strict';
import {graveyardWorld,graveyardBlocked,harvestGravestone,tickGraveyard,graveyardTrailDistance,
  GRAVEYARD_SCENERY_LIMIT,GRAVE_BREAK_SPAWN_CHANCE,GRAVE_EMERGENCE_SECONDS} from '../src/graveyard-world.mjs';
import {Game} from '../src/core.mjs';
import {harvest,tickEnvironment,propBase} from '../src/environment.mjs';

const setup=(seed=75,random=()=>.5)=>({...graveyardWorld(seed),seed,generatedEnvironment:'graveyard',phase:'play',
  time:0,nextId:40,enemies:[],random});
const stoneOf=g=>g.scenery.find(p=>p.kind==='gravestone'&&!p.depleted);
const attacker=s=>({id:1,x:s.x,y:s.rootY+24,hp:100,faceX:0,faceY:-1});

test('cemetery generation is deterministic, varied, bounded and JSON serializable',()=>{
  assert.deepEqual(graveyardWorld(75),graveyardWorld(75));
  assert.notDeepEqual(graveyardWorld(75),graveyardWorld(76));
  for(let seed=0;seed<24;seed++) {
    const g=setup(seed),stones=g.scenery.filter(p=>p.kind==='gravestone');
    assert.equal(g.terrain.length,2500);assert.ok(g.scenery.length<=GRAVEYARD_SCENERY_LIMIT);
    assert.equal(stones.length,30);assert.equal(g.graveyard.plots.length,30);
    assert.ok([2,3].includes(g.graveyard.mausoleums.length));
    assert.ok(g.scenery.filter(p=>p.kind==='leafless_tree').length>=6);
    assert.equal(new Set(g.scenery.map(p=>p.id)).size,g.scenery.length);
    for(const plot of g.graveyard.plots) {
      const s=stones.find(s=>s.id===plot.stoneId);
      assert.equal(s.plotId,plot.id);assert.equal(s.x,plot.x+plot.w/2);assert.equal(s.rootY+2,plot.y);
      assert.ok(s.hp>0);assert.equal(s.rootY,s.y);
    }
    const trees=g.scenery.filter(p=>p.kind==='grave_forest_tree');
    assert.ok(trees.length>=130);
    for(const direction of [t=>t.x<352,t=>t.x>1248,t=>t.y<288,t=>t.y>1216])assert.ok(trees.filter(direction).length>=15);
    assert.deepEqual(JSON.parse(JSON.stringify(g.graveyard)),g.graveyard);
    assert.ok(new Set(g.terrain).size>=3);
  }
});

test('the entire protected board/spawn rectangle is clear with player radius',()=>{
  for(const seed of [0,1,17,75,991]) {
    const g=setup(seed);
    for(let y=700;y<=878;y+=2)for(let x=700;x<=900;x+=4)assert.equal(graveyardBlocked(g,x,y,10),false,`${seed}:${x},${y}`);
    assert.deepEqual(g.graveyard.board,{x:800,y:800});
  }
});

test('gate has a large walkable gap, connected winding trail and solid perimeter',()=>{
  for(const seed of [0,75,991]) {
    const g=setup(seed),trail=g.graveyard.trail;
    assert.ok(g.graveyard.gate.w>=160);
    for(let x=724;x<=876;x+=4)for(let y=1180;y<=1280;y+=4)assert.equal(graveyardBlocked(g,x,y,16),false);
    for(let i=1;i<trail.length;i++)for(let n=0;n<=30;n++) {
      const x=trail[i-1].x+(trail[i].x-trail[i-1].x)*n/30,y=trail[i-1].y+(trail[i].y-trail[i-1].y)*n/30;
      assert.ok(graveyardTrailDistance(g.graveyard,x,y)<.001);
      assert.equal(graveyardBlocked(g,x,y,20),false,`trail ${x},${y}`);
    }
    for(const [x,y] of [[352,500],[1248,750],[600,288],[600,1216],[704,1216]]) {
      assert.equal(graveyardBlocked(g,x,y,0),true);
      assert.equal(graveyardBlocked(g,x,y,10,true),false);
    }
    // BFS verifies navigation through the opening, rather than only isolated samples.
    const queue=[{x:800,y:912}],visited=new Set(['800:912']);let reached=false;
    for(let i=0;i<queue.length;i++) {
      const p=queue[i];if(p.y>=1504){reached=true;break;}
      for(const [dx,dy] of [[16,0],[-16,0],[0,16],[0,-16]]) {
        const x=p.x+dx,y=p.y+dy,key=x+':'+y;
        if(x<400||x>1200||y<880||y>1520||visited.has(key)||graveyardBlocked(g,x,y,10))continue;
        visited.add(key);queue.push({x,y});
      }
    }
    assert.ok(reached,'cemetery interior reaches the outer forest exit');
  }
});

test('gravestones, mausoleums and tree trunks block feet; plots and open gate do not',()=>{
  const g=setup();
  for(const kind of ['gravestone','mausoleum','leafless_tree','grave_forest_tree']) {
    const p=g.scenery.find(p=>p.kind===kind),r=p.graveyardFootprint;
    assert.equal(graveyardBlocked(g,r.x+r.w/2,r.y+r.h/2,0),true,kind);
    assert.equal(graveyardBlocked(g,r.x-11,r.y+r.h/2,10),false,kind);
  }
  const plot=g.graveyard.plots[0];assert.equal(graveyardBlocked(g,plot.x+22,plot.y+40,8),false);
  g.generatedEnvironment='forest';assert.equal(graveyardBlocked(g,352,500,8),false);
  g.generatedEnvironment='graveyard';g.phase='won';assert.equal(graveyardBlocked(g,352,500,8),false);
});

test('melee harvest checks range, direction and actor state; partial damage never rolls',()=>{
  let rolls=0;const g=setup(75,()=>{rolls++;return 0;}),s=stoneOf(g),p=attacker(s);
  p.faceY=1;assert.equal(harvestGravestone(g,p,12,64),false);assert.equal(s.hp,48);
  p.faceY=-1;assert.equal(harvestGravestone(g,p,12,12),false);
  for(const patch of [{room:'crypt'},{ui:{}},{hp:0}])assert.equal(harvestGravestone(g,{...p,...patch},20,78),false);
  for(const damage of [0,-1,NaN,Infinity])assert.equal(harvestGravestone(g,p,damage,78),false);
  assert.equal(harvestGravestone(g,p,12,78),true);assert.equal(s.hp,36);assert.equal(rolls,0);
  assert.equal(g.enemies.length,0);assert.equal(p.gatherAction,'mine');
});

test('each broken stone has exactly one independent strict 20 percent roll',()=>{
  assert.equal(GRAVE_BREAK_SPAWN_CHANCE,.2);
  let calls=0;
  // A uniform discrete sweep gives 200 / 1000 hits, with the .2 boundary excluded.
  let spawns=0,skeletons=0,zombies=0;
  for(let n=0;n<1000;n++) {
    const g=setup(75,()=>{calls++;return n/1000;}),s=stoneOf(g),p=attacker(s);
    assert.equal(harvestGravestone(g,p,48,78),true);
    assert.equal(harvestGravestone(g,p,48,78),false);
    assert.equal(g.graveyard.breakCount,1);assert.equal(s.breakRoll,n/1000);
    spawns+=g.enemies.length;
    skeletons+=g.enemies.filter(e=>e.kind==='skeleton').length;zombies+=g.enemies.filter(e=>e.kind==='zombie').length;
  }
  assert.equal(calls,1000);assert.equal(spawns,200);assert.equal(skeletons,100);assert.equal(zombies,100);
  const rolls=[.01,.9,.02,.95,.18],g=setup(0,()=>rolls.shift());
  for(let n=0;n<5;n++){const s=stoneOf(g);assert.equal(harvestGravestone(g,attacker(s),48,78),true);}
  assert.equal(g.enemies.length,3,'no global quota or shared per-frame roll');assert.equal(rolls.length,0);
});

test('breaking detaches collision, preserves plot/rubble and anchors undead to that grave',()=>{
  const g=setup(75,()=>.15),s=stoneOf(g),plot=g.graveyard.plots.find(p=>p.id===s.plotId);
  assert.equal(harvestGravestone(g,attacker(s),100,78),true);
  assert.ok(s.depleted);assert.ok(plot.broken);assert.equal(graveyardBlocked(g,s.x,s.rootY,8),false);
  const e=g.enemies[0];assert.equal(e.kind,'zombie');assert.equal(e.state,'emerging');assert.ok(e.zombieVariant);
  assert.equal(e.graveEmergence.origin.plotId,plot.id);assert.equal(e.x,plot.x+plot.w/2);
  assert.ok(e.y+14>=plot.y&&e.y+14<=plot.y+plot.h);assert.equal(e.ambientGraveSpawn,true);
  assert.equal(e.graveEmergence.duration,GRAVE_EMERGENCE_SECONDS);
  assert.deepEqual(JSON.parse(JSON.stringify(g.graveyard)),g.graveyard);
});

test('emergence freezes location/action, pauses, survives JSON, and hands AI back once done',()=>{
  const g=setup(75,()=>0),s=stoneOf(g);harvestGravestone(g,attacker(s),48,78);
  const e=g.enemies[0],origin=structuredClone(e.graveEmergence.origin);
  Object.assign(e,{x:1400,y:1400,moving:true,attack:10});tickGraveyard(g,.4);
  assert.equal(e.x,origin.x);assert.equal(e.y,origin.y);assert.equal(e.moving,false);assert.equal(e.attack,0);
  assert.equal(e.graveEmergence.elapsed,.4);
  for(const dt of [0,-1,NaN,Infinity])assert.equal(tickGraveyard(g,dt),false);
  g.paused=true;tickGraveyard(g,1);assert.equal(e.graveEmergence.elapsed,.4);g.paused=false;
  const restored=JSON.parse(JSON.stringify(g));tickGraveyard(restored,100);
  assert.equal(restored.enemies[0].graveEmergence.elapsed,1.4,'bounded delayed frame');
  assert.equal(tickGraveyard(restored,1),true);assert.equal(restored.enemies[0].graveEmergence,undefined);
  assert.equal(restored.enemies[0].state,'hunt');assert.equal(tickGraveyard(restored,1),false);
  e.hp=0;assert.equal(tickGraveyard(g,.1),true);assert.equal(e.graveEmergence,undefined);
});

test('real shared tree harvest/tick keeps cemetery root and stump, with exactly one log drop',()=>{
  const g=new Game(()=>.5);g.environment='graveyard';const p=g.addPlayer('keyboard');g.start();
  g.openingBoard=false;g.enemies=[];
  const tree=g.scenery.find(p=>p.kind==='leafless_tree'),root=propBase(tree);
  g.scenery=[tree];Object.assign(p,{x:tree.x,y:tree.rootY+24,faceX:0,faceY:-1});
  assert.equal(harvest(g,p,200,78),true);assert.ok(tree.falling);assert.deepEqual(propBase(tree),root);
  tickEnvironment(g,1.2);assert.ok(tree.depleted);assert.deepEqual(propBase(tree),root);
  assert.equal(g.loot.filter(i=>i.type==='log').length,1);
  tickEnvironment(g,.4);assert.equal(tree.fallen,true);assert.equal(tree.falling,0);
  assert.ok(g.scenery.includes(tree));assert.deepEqual(propBase(tree),root);
  tickEnvironment(g,2);assert.equal(g.loot.filter(i=>i.type==='log').length,1);
});
