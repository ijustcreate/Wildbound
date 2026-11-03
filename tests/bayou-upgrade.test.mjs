import test from 'node:test';
import assert from 'node:assert/strict';
import {realmWorld,realmProp,realmFootprint} from '../src/realm-world.mjs';
import {makeBayouLandmarkSprite} from '../src/bayou-detail.mjs';
import {validateSprite} from '../src/pixels.mjs';
import {terrainSupport} from '../src/terrain-support.mjs';
import {lightSources} from '../src/night-cycle.mjs';

test('short bayou crossings supply real bridge support and preserve authored tile edits',()=>{
 for(const seed of [1,42,75,917]){
  const w=realmWorld(seed,'swamp',{authored:false});const bridges=w.terrain.flatMap((t,i)=>t==='bridge'?[i]:[]);
  assert.ok(bridges.length>0&&bridges.length<=9);
  const g={...w,generatedEnvironment:'swamp',phase:'play'};
  for(const i of bridges)assert.equal(terrainSupport(g,{x:i%50*32+16,y:Math.floor(i/50)*32+16}),10);
  const tiles=Object.fromEntries(bridges.map(i=>[i,'shallow']));
  const edited=realmWorld(seed,'swamp',{layout:{tiles}});for(const i of bridges)assert.equal(edited.terrain[i],'shallow');
 }
});
test('new scenery is editable indexed art with safe open footprints; saved layouts remain exact',()=>{
 for(const kind of ['bayou_shrine','bayou_ruin','bayou_snag','bayou_landing']){
  const sprite=makeBayouLandmarkSprite(kind);assert.ok(validateSprite(sprite));assert.ok(sprite.pixels.filter(Boolean).length>100);
  assert.equal(realmFootprint(realmProp(kind,500,500)),null);
 }
 const custom=[realmProp('mangrove',600,600,0,{treeVariantSeed:971})];
 const w=realmWorld(75,'swamp',{layout:{scenery:custom}});assert.deepEqual(w.scenery,custom);
 const fresh=realmWorld(75,'swamp',{authored:false});assert.ok(fresh.scenery.some(p=>p.kind==='bayou_shrine'));assert.ok(fresh.scenery.filter(p=>p.treeVariantSeed!==undefined).length>10);
});
test('shrine lamps enter the existing world lighting system at their visible locations',()=>{
 const shrine=realmProp('bayou_shrine',900,600),g={scenery:[shrine],players:[],generatedEnvironment:'swamp',phase:'play',time:0,sky:{elapsed:320}};
 const lights=lightSources(g).filter(s=>s.owner==='prop:'+shrine.id);assert.equal(lights.length,2);assert.ok(lights.every(s=>s.radius===115&&s.height>0&&s.y<600));
});
