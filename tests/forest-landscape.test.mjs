import test from 'node:test';
import assert from 'node:assert/strict';
import {generateWorld,footprintHit} from '../src/world.mjs';
import {forestWind,restoreForestLandscape} from '../src/forest-landscape.mjs';
import {saveSession,restoreSession} from '../src/session.mjs';
import {Game} from '../src/core.mjs';

test('Forest routes reach every destination and remain clear after all scenery is placed',()=>{
  for(const seed of [0,1,2,7,42,87,103,999,12345,987654]){
    const g=generateWorld(seed),plan=g.forestLandscape;
    assert.equal(plan.routes.length,10);
    assert.equal(plan.landmarks.length,4);
    assert.ok(g.scenery.filter(p=>p.kind==='forest_ruin').length>=6,`Missing ruins at ${seed}`);
    for(const route of plan.routes){
      assert.ok(route.length>2);
      const samples=[];
      for(let i=1;i<route.length;i++){
        const a=route[i-1],b=route[i],steps=Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/4);
        for(let n=0;n<=steps;n++)samples.push({x:a.x+(b.x-a.x)*n/steps,y:a.y+(b.y-a.y)*n/steps});
      }
      for(const point of samples){
        assert.notEqual(g.terrain[Math.floor(point.y/32)*50+Math.floor(point.x/32)],'water');
        for(const prop of g.scenery)assert.equal(footprintHit(prop,null,point.x,point.y,12),false,`${seed}: ${prop.id} blocks trail ${point.x},${point.y}`);
      }
    }
  }
});

test('Seeded scenery and WFC paving reproduce and vary across seeds',()=>{
  const a=generateWorld(55),b=generateWorld(55),c=generateWorld(56);
  assert.deepEqual(a,b);
  assert.notDeepEqual(a.scenery,c.scenery);
  assert.ok(a.forestLandscape.paving.resolved);
  assert.ok(new Set(a.forestLandscape.paving.cells).size>1);
  assert.ok(a.scenery.some(p=>p.kind==='tree'&&p.x%32!==16));
  assert.ok(a.forestLandscape.cover.length>100);
  assert.notEqual(forestWind(300,300,1),forestWind(300,300,2));
});

test('Solid terraces and pillars share their rendered ground footprint',()=>{
  const p={kind:'forest_ruin',x:100,y:200,width:60,depth:40,height:80};
  assert.equal(footprintHit(p,null,100,180,8),true);
  assert.equal(footprintHit(p,null,100,100,8),false);
  assert.equal(footprintHit(p,null,140,180,8),false);
});

test('Forest save and network reconstruction keep harvested scenery and compact snapshots',()=>{
  const g=new Game();g.environment='forest';g.addPlayer('keyboard');g.start();
  const tree=g.scenery.find(p=>p.kind==='tree');tree.fallen=true;tree.depleted=true;
  const saved=JSON.parse(JSON.stringify(saveSession(g)));
  assert.equal(saved.state.forestLandscape,undefined);
  const restored=restoreSession(saved);
  assert.deepEqual(restored.forestLandscape.routes,g.forestLandscape.routes);
  assert.deepEqual(restored.forestLandscape.paving,g.forestLandscape.paving);
  assert.ok(restored.scenery.find(p=>p.id===tree.id).fallen);
  const plan=restored.forestLandscape;restoreForestLandscape(restored);
  assert.equal(restored.forestLandscape,plan);
  delete saved.state.forestLandscapeVersion;
  assert.equal(restoreSession(JSON.parse(JSON.stringify(saved))).forestLandscape,null);
  for(const environment of ['desert','temple','house','ice'])assert.equal(generateWorld(2,environment).forestLandscape,null);
});
