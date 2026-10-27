import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,EVENTS} from '../src/core.mjs';
import {REALMS,REALM_ASSETS,realmContexts,tickRealmHazards} from '../src/realm-world.mjs';
import {tickRealmLife,tickRealmEvent,REALM_FAUNA} from '../src/realm-life.mjs';
import {boundlessRegionPlan,regionPortals,clearBoundlessGeneration} from '../src/boundless-generation.mjs';
import {updateBoundlessWorld,createBoundlessChunk,boundlessTerrainAt} from '../src/boundless-world.mjs';
import {saveSession,restoreSession} from '../src/session.mjs';
const game=env=>{const g=new Game(()=>.5);g.environment=env;g.mapMode='boundless';g.seed=42;g.addPlayer('keyboard');g.start();g.openingBoard=false;g.bloom=3;return g;};
const travel=(g,cx,cy)=>{Object.assign(g.players[0],{x:cx*1600+800,y:cy*1600+800});for(let n=0;n<12;n++)updateBoundlessWorld(g,.016);tickRealmLife(g,.016);return g.boundlessLoadedChunks.find(e=>e.key===`${cx},${cy}`);};
const blocked=k=>['water','cave_void','shadow_void'].includes(k);
test('shared entrances and all chambers connect in positive and negative realm regions',()=>{
 for(const env of REALMS)for(const seed of [1,42,917]){const g={generatedEnvironment:env,seed};for(const [cx,cy]of [[-2,-1],[0,0],[1,0],[2,3]]){
  const p=boundlessRegionPlan(g,cx,cy),seen=new Set(),queue=[25*50+25];seen.add(queue[0]);
  for(let head=0;head<queue.length;head++){const i=queue[head],x=i%50,y=Math.floor(i/50);for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,n=ny*50+nx;if(nx<0||ny<0||nx>=50||ny>=50||seen.has(n)||blocked(p.terrain[n]))continue;seen.add(n);queue.push(n);}}
  for(const point of [...Object.values(p.portals),...(p.realmState?.chambers||[]).map(q=>({x:q.x+cx*1600,y:q.y+cy*1600}))]){const tx=Math.max(0,Math.min(49,Math.floor((point.x-cx*1600)/32))),ty=Math.max(0,Math.min(49,Math.floor((point.y-cy*1600)/32)));const atPortal=Object.values(p.portals).includes(point);assert.ok(atPortal?seen.has(ty*50+tx):[...seen].some(i=>Math.hypot(i%50-tx,Math.floor(i/50)-ty)<4),`${env} ${seed} ${cx},${cy} ${tx},${ty}`);}
  assert.deepEqual(p.portals.east,regionPortals(g,cx+1,cy).west);assert.deepEqual(p.portals.south,regionPortals(g,cx,cy+1).north);
  for(const point of Object.values(p.portals)){assert.ok(!blocked(boundlessTerrainAt(g,Math.floor((point.x-16)/32),Math.floor((point.y-16)/32))));assert.ok(!blocked(boundlessTerrainAt(g,Math.floor((point.x+16)/32),Math.floor((point.y+16)/32))));}
 }}
});
test('outer regions retain native assets and wildlife, and scenery stays bounded while travelling',()=>{for(const env of REALMS){const g=game(env),found=new Set();for(const [cx,cy]of [[1,0],[-2,1],[4,-3]]){const entry=travel(g,cx,cy);assert.ok(entry?.realmState);for(const p of entry.scenery){assert.ok(REALM_ASSETS[env][p.kind]);found.add(p.kind);assert.ok(p.x>=cx*1600&&p.rootY>=cy*1600);}
 for(const kind of REALM_FAUNA[env])assert.ok(entry.realmState.animals.some(a=>a.kind===kind),`${env}: ${kind}`);assert.ok(g.boundlessLoadedChunks.length<=9);assert.ok(g.scenery.length<1700);}
 for(const kind of Object.keys(REALM_ASSETS[env]))assert.ok(found.has(kind),`${env} missing ${kind}`);
}});
test('harvest, one-shot ceiling hazards and wildlife survive unload, reload and session restore',()=>{for(const env of REALMS){const g=game(env),entry=travel(g,2,-1),prop=entry.scenery.find(p=>p.kind!=='ceiling_stalactite');prop.depleted=true;const animal=entry.realmState.animals[0];animal.phase=123;const hazard=entry.scenery.find(p=>p.kind==='ceiling_stalactite');if(hazard){Object.assign(g.players[0],{x:hazard.x,y:hazard.rootY});let damage=0;g.hurt=(_p,n)=>damage+=n;for(let i=0;i<22;i++)tickRealmHazards(g,.1);assert.equal(hazard.hazardState,'spent');assert.equal(damage,5);}
 const saved=JSON.parse(JSON.stringify(saveSession(g))),restored=restoreSession(saved),reload=travel(restored,2,-1);assert.ok(reload.scenery.find(p=>p.id===prop.id).depleted);assert.equal(reload.realmState.animals[0].phase,123);if(hazard)assert.equal(reload.scenery.find(p=>p.id===hazard.id).hazardState,'spent');travel(restored,-4,3);const again=travel(restored,2,-1);assert.ok(again.scenery.find(p=>p.id===prop.id).depleted);assert.equal(again.realmState.animals[0].phase,123);
}});
test('six events spawn in the explored region with local objectives, rewards and no duplicate completion',()=>{for(const env of REALMS){const g=game(env);travel(g,-2,1);for(const event of EVENTS.filter(e=>e.environment===env)){const before=g.enemies.length;g.spawnEvent(EVENTS.indexOf(event));if(event.type==='realm_expedition'){const state=realmContexts(g).find(c=>c.realmState.key==='-2,1').realmState;assert.ok(state.event);for(const n of state.event.nodes){assert.ok(n.x<0&&n.y>=1600);assert.equal(g.blocked(n.x,n.y,16),false);Object.assign(g.players[0],n);tickRealmEvent(g,2.1);}assert.ok(state.event.done);const reward=g.loot.find(l=>l.x<0&&l.y>1600);assert.ok(reward);const count=g.loot.length;tickRealmEvent(g,1);assert.equal(g.loot.length,count);}else{const spawned=g.enemies.slice(before);assert.equal(spawned.length,event.count);for(const e of spawned){assert.ok(e.x<0&&e.y>=1600);assert.equal(g.blocked(e.x,e.y,16),false);}}}}});
test('void collision works beyond the board for walkers, flyers and projectiles',()=>{for(const env of ['caverns','shadow']){const g=game(env);travel(g,-1,-1);const p=boundlessRegionPlan(g,-1,-1),i=p.terrain.findIndex(k=>k.endsWith('_void')),x=-1600+i%50*32+16,y=-1600+Math.floor(i/50)*32+16;assert.ok(g.blocked(x,y,8,true,true,false,0));const portal=p.portals.east;assert.equal(g.blocked(portal.x,portal.y,12,false,false,false,0),false);}});

test('persistent local Worlds packs save the new region ecology and partially completed events',async()=>{
 const {BUILTIN_PACKS}=await import('../src/world-simulation.mjs'),{createLocalWorld,saveLocalWorld,restoreLocalWorld}=await import('../src/world-instances.mjs');
 for(const env of REALMS){const lobby=new Game();lobby.addPlayer('keyboard');const g=createLocalWorld({id:'realm-'+env,name:env,seed:83,pack:BUILTIN_PACKS.find(p=>p.environment===env),party:lobby.players,now:1000});const entry=travel(g,1,-2),event=EVENTS.find(e=>e.environment===env&&e.type==='realm_expedition');g.spawnEvent(EVENTS.indexOf(event));Object.assign(g.players[0],entry.realmState.event.nodes[0]);tickRealmEvent(g,2.1);assert.equal(entry.realmState.event.nodes[0].done,true);const saved=saveLocalWorld(g,2000),r=restoreLocalWorld(JSON.parse(JSON.stringify(saved)),2000),again=travel(r,1,-2);assert.equal(again.realmState.event.nodes[0].done,true);assert.equal(again.realmState.animals.length,entry.realmState.animals.length);assert.equal(r.generatedEnvironment,env);}
});
