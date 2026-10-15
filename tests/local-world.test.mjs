import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import os from 'node:os';import path from 'node:path';
import {createWorldState,advanceWorld,catchUpWorld,visitRegion,validatePack,simulationTier,BUILTIN_PACKS,WORLD_DAY} from '../src/world-simulation.mjs';
import {createLocalWorld,saveLocalWorld,restoreLocalWorld,worldAction} from '../src/world-instances.mjs';
import {tickLocalWorld} from '../src/world-runtime.mjs';
import {updateBoundlessWorld,checkpointBoundlessWorld} from '../src/boundless-world.mjs';
import {Game} from '../src/core.mjs';import {give} from '../src/items.mjs';
import storeModule from '../world-store.cjs';
import {previewInput} from '../src/rig-live-preview.mjs';
const state=()=>createWorldState({id:'test-world',name:'Test forest',seed:411,pack:BUILTIN_PACKS[0],now:1000});
const fresh=(pack=BUILTIN_PACKS[0])=>{const lobby=new Game();lobby.addPlayer('keyboard','Tester');return createLocalWorld({id:'world-one',name:'Test world',seed:411,pack,party:lobby.players,now:1000});};
test('seed and clock reproduce ecosystem statistics independent of update cadence',()=>{
 const a=state(),b=state();visitRegion(a,-2,4);visitRegion(b,-2,4);
 advanceWorld(a,WORLD_DAY*8);for(let i=0;i<8*24;i++)advanceWorld(b,3600);
 assert.deepEqual(a,b);assert.ok(a.events.length>0);assert.ok(a.events.length<=256);
 const discovered=visitRegion(a,10,10),early=state();visitRegion(early,10,10);advanceWorld(early,a.seconds);
 assert.deepEqual(discovered,early.regions['10,10']);
});
test('offline clock advances fully, ignores backwards wall clock, and bounds long catch-up',()=>{
 const s=state();assert.equal(catchUpWorld(s,61000),60);assert.equal(s.seconds,3600);assert.equal(catchUpWorld(s,1000),0);assert.equal(s.lastWall,61000);
 advanceWorld(s,WORLD_DAY*3650);assert.equal(s.seconds,WORLD_DAY*3650+3600);assert.ok(s.events.length<=256);assert.ok(Number.isFinite(s.regions['0,0'].prey));
 assert.throws(()=>advanceWorld(s,NaN));assert.throws(()=>advanceWorld(s,-1));
});
test('regions distinguish full nearby simulation, neighboring summaries and distant summaries',()=>{
 const s=state(),p=[{hp:100,x:800,y:800}];assert.equal(simulationTier(visitRegion(s,0,0),p),'active');assert.equal(simulationTier(visitRegion(s,1,0),p),'regional');assert.equal(simulationTier(visitRegion(s,5,0),p),'distant');assert.equal(Object.keys(s.regions).length,3);
});
test('world snapshots regenerate terrain and retain harvests, buildings, NPCs, events and items',()=>{
 const g=fresh(),old=g.scenery.find(p=>p.kind==='tree');assert.ok(old);old.fallen=true;old.localHarvestHour=0;
 g.scenery.push({id:'built-shelter',kind:'rock',x:300,y:300,size:20,damage:5});g.terrain[0]='bridge';g.questNpcs=[{id:'npc-test',name:'Wayfarer',relation:7}];g.encounteredEvents['Saved event']=true;give(g.players[0].inventory,'arrow',7);
 const s=saveLocalWorld(g,1000);assert.equal(s.session.state.scenery,undefined);assert.equal(s.session.state.terrain,undefined);assert.equal(s.delta.changed.length,1);
 const r=restoreLocalWorld(JSON.parse(JSON.stringify(s)),1000);
 assert.equal(r.seed,g.seed);assert.equal(r.scenery.find(p=>p.id===old.id).fallen,true);assert.equal(r.scenery.find(p=>p.id==='built-shelter').damage,5);assert.equal(r.terrain[0],'bridge');assert.equal(r.questNpcs[0].relation,7);assert.equal(r.encounteredEvents['Saved event'],true);assert.deepEqual(r.players[0].inventory,g.players[0].inventory);assert.equal(r.forestJourney,undefined);assert.equal(r.localWorld.id,'world-one');
});
test('streamed scenery changes and complete clearing persist after unload and reload',()=>{
 const g=fresh();g.players[0].x=3300;g.players[0].y=3300;updateBoundlessWorld(g,.05);
 const chunk=g.boundlessLoadedChunks[0];assert.ok(chunk);const prefix='boundless:'+chunk.key.replace(',',':')+':';
 g.scenery=g.scenery.filter(p=>!p.id?.startsWith(prefix));checkpointBoundlessWorld(g);
 assert.ok(g.boundlessChunkChanges[chunk.key].removed.length>0);
 const saved=saveLocalWorld(g,1000),r=restoreLocalWorld(JSON.parse(JSON.stringify(saved)),1000);updateBoundlessWorld(r,.05);
 assert.equal(r.scenery.filter(p=>p.id?.startsWith(prefix)).length,0);
});
test('unchanged scenery is not serialized after ordinary runtime decoration',()=>{
 const g=fresh();g.update(.05,{});const s=saveLocalWorld(g,1000);assert.ok(s.delta.changed.length<10);assert.ok(s.delta.changed.length<g.scenery.length);
});
test('nests and settlements change inventories atomically and survive reopen',()=>{
 const g=fresh(),r=g.localWorld.regions['0,0'];r.nests=1;r.merchant=true;r.settlement.supplies=30;
 const message=worldAction(g,'nest',give);assert.match(message,/3 arrows/);assert.equal(r.nests,0);assert.throws(()=>worldAction(g,'nest',give));
 worldAction(g,'trade',give);assert.equal(r.settlement.supplies,25);worldAction(g,'repair',give);assert.equal(r.settlement.supplies,15);
 const reopened=restoreLocalWorld(JSON.parse(JSON.stringify(saveLocalWorld(g,1000))),1000);assert.equal(reopened.localWorld.regions['0,0'].nests,0);assert.equal(reopened.localWorld.regions['0,0'].settlement.supplies,15);
 const before=structuredClone(r);assert.throws(()=>worldAction(g,'trade',()=>false));assert.deepEqual(r,before);
});
test('harvested plants regrow after world time and permanent structures retain damage',()=>{
 const g=fresh(),tree=g.scenery.find(p=>p.kind==='tree');tree.fallen=true;tree.depleted=true;tree.localHarvestHour=0;
 advanceWorld(g.localWorld,WORLD_DAY*4);tickLocalWorld(g,0);
 assert.equal(tree.fallen,undefined);assert.equal(tree.depleted,undefined);assert.ok(g.localWorld.events.some(e=>e.type==='plant-regrowth'));
});
test('all four native packs create and restore as independent offline worlds',()=>{
 for(const pack of BUILTIN_PACKS){const g=fresh(pack);assert.equal(g.generatedEnvironment,pack.environment);const r=restoreLocalWorld(JSON.parse(JSON.stringify(saveLocalWorld(g,1000))),1000);assert.equal(r.localWorld.pack.id,pack.id);assert.equal(r.mapMode,'boundless');assert.equal(r.remoteAuthoritative,false);}
});
test('harvest regrowth happens across closing and reopening without reviving damaged buildings',()=>{
 const g=fresh(),tree=g.scenery.find(p=>p.kind==='tree'),id=tree.id;tree.fallen=true;tree.depleted=true;
 const saved=saveLocalWorld(g,1000),r=restoreLocalWorld(JSON.parse(JSON.stringify(saved)),1000+WORLD_DAY*4/60*1000);
 assert.equal(r.scenery.find(p=>p.id===id).fallen,undefined);assert.equal(r.scenery.find(p=>p.id===id).depleted,undefined);assert.ok(r.localWorld.events.some(e=>e.type==='plant-regrowth'));
});
test('disk checkpoints are queued, recover from corrupt primary and keep separate world folders',async()=>{
 const root=await mkdtemp(path.join(os.tmpdir(),'wildbound-worlds-test-'));
 try{const disk=storeModule.createWorldStore(root),g=fresh(),first=saveLocalWorld(g,1000);await disk.save(first);g.players[0].inventory.push({type:'arrow',qty:2});await disk.save(saveLocalWorld(g,2000));
  assert.equal((await disk.list()).length,1);assert.ok(await readFile(path.join(root,g.localWorld.id,'ecology','regions.json'),'utf8'));
  await writeFile(path.join(root,g.localWorld.id,'save.snapshot'),'broken');const recovered=await disk.load(g.localWorld.id);assert.equal(recovered.savedAt,1000);assert.throws(()=>disk.save({...first,id:'../bad'}));
 }finally{await rm(root,{recursive:true,force:true});}
});
test('packs reject unsafe resource paths and bad manifests',()=>{
 assert.throws(()=>validatePack({...BUILTIN_PACKS[0],id:'../escape'}));assert.throws(()=>validatePack({...BUILTIN_PACKS[0],assets:{board:'assets/../bad.png'}}));assert.throws(()=>validatePack({...BUILTIN_PACKS[0],environment:'code'}));
 assert.equal(validatePack({...BUILTIN_PACKS[0],assets:{board:'assets/board.png'}}).id,'heartwood');
});
test('sandbox input normalizes keyboard and respects gamepad mapping',()=>{
 const k=previewInput(new Set(['KeyW','KeyD','Space','KeyJ']),null);assert.ok(Math.abs(Math.hypot(k.x,k.y)-1)<1e-9);assert.equal(k.jump,true);assert.equal(k.attack,true);
 const pad={axes:[-.8,0,0,.4],buttons:[{pressed:true},{pressed:false}]};assert.equal(previewInput(new Set(),pad).attack,true);assert.equal(previewInput(new Set(),null).attack,false);
});
