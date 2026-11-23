import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/core.mjs';
import {realmWorld,realmFootprint} from '../src/realm-world.mjs';
import {SHADOW_FOREST_PROPS,dressShadowForest,shadowPathDistance} from '../src/shadow-forest-layout.mjs';
import {createBoundlessChunk} from '../src/boundless-world.mjs';
import {ensureShadowExit,interactShadowPassage} from '../src/shadow-passages.mjs';
import {tickHouseWorldTravel} from '../src/house-worlds.mjs';
import {saveSession,restoreSession} from '../src/session.mjs';
import {createLocalWorld,saveLocalWorld,restoreLocalWorld} from '../src/world-instances.mjs';
import {BUILTIN_PACKS} from '../src/world-simulation.mjs';
const setup=()=>{const g=new Game(()=>.5);g.environment='shadow';g.seed=42;g.addPlayer('keyboard','One');g.addPlayer('pad:0','Two');g.start();g.openingBoard=false;g.persist=()=>{};g.onSound=()=>{};return g;};
const finish=g=>{for(let i=0;i<70&&g.worldTravel;i++)tickHouseWorldTravel(g,.05,{});assert.equal(g.worldTravel,null);};
function cross(g){const d=g.generatedEnvironment==='shadow'?ensureShadowExit(g):g.portals.find(d=>d.shadowPassage);Object.assign(g.players[0],{x:d.x,y:d.y});assert.equal(interactShadowPassage(g,g.players[0]),true);finish(g);}

test('seven new props have four small and three medium silhouettes, placed by stable rules',()=>{
 assert.equal(Object.values(SHADOW_FOREST_PROPS).filter(p=>p.scale==='small').length,4);assert.equal(Object.values(SHADOW_FOREST_PROPS).filter(p=>p.scale==='medium').length,3);
 for(const seed of [1,42,917]){const w=realmWorld(seed,'shadow');assert.deepEqual(w,realmWorld(seed,'shadow'));assert.equal(w.realmState.enchantedPOIs.length,3);assert.equal(w.realmState.enchantedPaths.length,3);assert.ok(w.scenery.length<=430);
  for(const kind of Object.keys(SHADOW_FOREST_PROPS))assert.ok(w.scenery.some(p=>p.kind===kind),seed+': '+kind);
  for(const p of w.scenery.filter(p=>p.enchantedRule)){assert.equal(w.terrain[Math.floor(p.rootY/32)*50+Math.floor(p.x/32)],'shadow_soil');if(p.enchantedRule==='canopy-fringe')assert.ok(shadowPathDistance(w.realmState,p.x,p.rootY)>=65);}
 }
});
test('additive forest upgrades preserve old scenery and terrain and run only once',()=>{
 const g=setup();g.scenery=g.scenery.filter(p=>!p.enchantedRule);delete g.realmState.enchantedForestVersion;const before=structuredClone(g.scenery),terrain=[...g.terrain];dressShadowForest(g);assert.deepEqual(g.scenery.slice(0,before.length),before);assert.deepEqual(g.terrain,terrain);const count=g.scenery.length;assert.equal(dressShadowForest(g),0);assert.equal(g.scenery.length,count);
});
test('streamed POIs, branch paths and exits move together into signed regions',()=>{
 const g=setup();g.mapMode='boundless';const chunk=createBoundlessChunk(g,-2,3),s=chunk.realmState;assert.equal(s.originX,-3200);assert.equal(s.originY,4800);
 for(const p of [...s.enchantedPOIs,...s.enchantedPaths.flat(),s.enchantedExit]){assert.ok(p.x>=-3200&&p.x< -1600);assert.ok(p.y>=4800&&p.y<6400);}
});
test('two-way passage selects a safe surface landing, preserves both maps and survives reload',()=>{
 let g=setup();g.players[0].inventory[0]={item:'stone',qty:7};const before=structuredClone(g.scenery),terrain=[...g.terrain];cross(g);assert.equal(g.generatedEnvironment,'forest');const portal=g.portals.find(d=>d.shadowPassage);assert.ok(portal);assert.ok(Math.hypot(portal.x-800,portal.y-816)>300);for(const p of g.players)assert.equal(g.blocked(p.x,p.y,14,false,false,false,0),false);
 const surfaceTree=g.scenery.find(p=>p.kind==='tree');surfaceTree.portalTestMark=true;const position={x:portal.x,y:portal.y};g=restoreSession(JSON.parse(JSON.stringify(saveSession(g))));g.persist=()=>{};cross(g);assert.equal(g.generatedEnvironment,'shadow');assert.deepEqual(g.terrain,terrain);assert.deepEqual(g.scenery,before);assert.equal(g.players[0].inventory[0].qty,7);cross(g);assert.ok(g.scenery.find(p=>p.id===surfaceTree.id).portalTestMark);const again=g.portals.find(d=>d.shadowPassage);assert.deepEqual({x:again.x,y:again.y},position);
});
test('persistent local-world saves retain the active surface map and the return link',()=>{
 const party=setup().players,pack=BUILTIN_PACKS.find(p=>p.environment==='shadow');let g=createLocalWorld({id:'shadow-passage-save',name:'Shadow passage',seed:42,pack,party,now:1000});g.persist=()=>{};cross(g);assert.equal(g.generatedEnvironment,'forest');const terrain=[...g.terrain],portal=g.portals.find(d=>d.shadowPassage),record=JSON.parse(JSON.stringify(saveLocalWorld(g,1000)));assert.equal(record.shadowPassageSnapshot,true);g=restoreLocalWorld(record,1000);g.persist=()=>{};assert.equal(g.generatedEnvironment,'forest');assert.deepEqual(g.terrain,terrain);assert.ok(g.portals.some(d=>d.id===portal.id));cross(g);assert.equal(g.generatedEnvironment,'shadow');assert.equal(g.localWorld.id,'shadow-passage-save');
});
test('a fully obstructed far side cancels travel without replacing the current map',()=>{
 const g=setup(),door=ensureShadowExit(g);const blank=setup();blank.environment=blank.generatedEnvironment='forest';blank.terrain=Array(2500).fill('water');const state=saveSession(blank).state;delete state.players;delete state.houseWorlds;g.houseWorlds={version:2,seed:42,worlds:{forest:state}};const terrain=g.terrain,props=g.scenery;Object.assign(g.players[0],{x:door.x,y:door.y});assert.equal(interactShadowPassage(g,g.players[0]),true);finish(g);assert.equal(g.generatedEnvironment,'shadow');assert.equal(g.terrain,terrain);assert.equal(g.scenery,props);
});
