import test from 'node:test';
import assert from 'node:assert/strict';
import {realmWorld,realmProp,realmFootprint} from '../src/realm-world.mjs';
import {drawBayouPlant,makeBayouLandmarkSprite,paintBayouHabitat} from '../src/bayou-detail.mjs';
import {validateSprite} from '../src/pixels.mjs';
import {terrainSupport} from '../src/terrain-support.mjs';
import {lightSources} from '../src/night-cycle.mjs';
import {footprintHit,isOccluded} from '../src/world.mjs';

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
test('Bayou scenery is editable indexed art and preserves authored layouts',()=>{
 for(const kind of ['bayou_shrine','bayou_ruin','bayou_snag','bayou_landing']){
  const sprite=makeBayouLandmarkSprite(kind);assert.ok(validateSprite(sprite));assert.ok(sprite.pixels.filter(Boolean).length>100);
  if(kind!=='bayou_shrine')assert.equal(realmFootprint(realmProp(kind,500,500)),null);
 }
 const custom=[realmProp('mangrove',600,600,0,{treeVariantSeed:971})];
 const w=realmWorld(75,'swamp',{layout:{scenery:custom}});assert.deepEqual(w.scenery,custom);
 const fresh=realmWorld(75,'swamp',{authored:false});assert.ok(fresh.scenery.some(p=>p.kind==='bayou_shrine'));assert.ok(fresh.scenery.filter(p=>p.treeVariantSeed!==undefined).length>10);
});
test('the shrine blocks its foundation, leaves the apron walkable, and lets an old save leave the base',()=>{
 const shrine=realmProp('bayou_shrine',500,500),sprite=makeBayouLandmarkSprite(shrine.kind);
 const base=realmFootprint(shrine),feet={x:shrine.x,y:shrine.rootY-4};
 assert.equal(base.h,20*shrine.size/128);
 assert.equal(sprite.footprint.filter(Boolean).length,76*20);
 for(const dx of [0,-48,48])assert.equal(footprintHit(shrine,sprite,shrine.x+dx,shrine.rootY-10),true);
 assert.equal(footprintHit(shrine,sprite,shrine.x,shrine.rootY+12),false);
 assert.equal(footprintHit(shrine,sprite,shrine.x-72,shrine.rootY-10),false);
 assert.equal(footprintHit(shrine,sprite,feet.x,feet.y+3,8,feet),false);
 assert.equal(footprintHit(shrine,sprite,feet.x,feet.y-3,8,feet),true);
 assert.equal(footprintHit(shrine,sprite,feet.x,shrine.rootY+5,8,{x:feet.x,y:shrine.rootY+2}),false);
 assert.equal(realmFootprint({...shrine,collisionWidth:0,collisionDepth:0}),null);
 assert.equal(isOccluded(shrine,sprite,{x:shrine.x,y:shrine.rootY-60}),true);
 assert.equal(isOccluded(shrine,sprite,{x:shrine.x+85,y:shrine.rootY-60}),false);
 assert.equal(isOccluded(shrine,sprite,{x:shrine.x,y:shrine.rootY+9}),false);
});
test('shrine lamps enter the existing world lighting system at their visible locations',()=>{
 const shrine=realmProp('bayou_shrine',900,600),g={scenery:[shrine],players:[],generatedEnvironment:'swamp',phase:'play',time:0,sky:{elapsed:320}};
 const lights=lightSources(g).filter(s=>s.owner==='prop:'+shrine.id);assert.equal(lights.length,2);assert.ok(lights.every(s=>s.radius===115&&s.height>0&&s.y<600));
});

test('bayou sedge and iris stay low and richer patches carry more small blooms',()=>{
 const collect=paint=>{
  const marks=[];
  paint({fillRect(x,y,w,h){marks.push({x,y,w,h,color:this.fillStyle});}});
  return marks;
 };
 for(const [kind,height] of [['sedge',9],['iris',16]]){
  for(const seed of [1,42,917]){
   const pixels=collect(c=>drawBayouPlant(c,kind,32,32,seed));
   assert.ok(pixels.length>0);
   assert.ok(Math.min(...pixels.map(p=>p.y))>=32-height);
   assert.ok(Math.max(...pixels.map(p=>p.y+p.h))<=33);
  }
 }
 let blooms=0;
 for(let y=0;y<768;y+=256)for(let x=0;x<768;x+=256){
  const marks=collect(c=>paintBayouHabitat(c,()=> 'marsh_grass',x,y));
  blooms+=marks.filter(p=>p.color==='#e1c883').length;
 }
 assert.ok(blooms>=30&&blooms<=40,'small blooms are denser without filling every grass patch');
 assert.deepEqual(collect(c=>paintBayouHabitat(c,()=> 'bridge',0,0)),[]);
});
