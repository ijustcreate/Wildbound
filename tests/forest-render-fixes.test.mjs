import test from 'node:test';
import assert from 'node:assert/strict';
import {connectForestBridgeBanks} from '../src/forest-bridges.mjs';
import {bridgeAt,terrainSupport} from '../src/terrain-support.mjs';
import {worldLightField,groundShadowPolygon} from '../src/world-lighting.mjs';
import {BOARD_TABLE} from '../src/board-table-geometry.mjs';
import {drawGrassProp} from '../src/tall-grass.mjs';
import {emptyShadowMaps,makeShadowCanvas} from '../src/realtime-shadows.mjs';
import {waterAt} from '../src/environment.mjs';

test('old bridge banks become supported deck without bridging unrelated water',()=>{
 const terrain=Array(2500).fill('grass'),at=20*50;
 terrain[at+10]='shallow';terrain[at+11]='bridge';terrain[at+12]='bridge';terrain[at+13]='shallow';terrain[at+15]='water';
 connectForestBridgeBanks(terrain);
 const g={terrain,players:[],phase:'play',scenery:[]};
 for(const x of [10,11,12,13]){assert.ok(bridgeAt(g,x*32+16,656));assert.equal(terrainSupport(g,{x:x*32+16,y:656}),10);}
 assert.equal(terrain[at+15],'water');const copy=terrain.slice();connectForestBridgeBanks(terrain);assert.deepEqual(terrain,copy);
 g.weather={type:'monsoon'};assert.equal(waterAt(g,9*32+16,656),'grass','rain preserves dry bridge landing');
});

test('board casts a square shadow which follows the light and invalidates on removal',()=>{
 const b=BOARD_TABLE,g={phase:'play',scenery:[],players:[]};
 const source={x:b.x-40,y:b.y-40,height:50,radius:200};
 const field=worldLightField(g,[source]),box=field.volumes.find(v=>v.owner.startsWith('board:'));
 assert.equal(box.shape,'box');assert.equal(box.rx,Math.max(b.w,b.h)/2);assert.equal(box.ry,box.rx);
 assert.notDeepEqual(groundShadowPolygon(source,box),groundShadowPolygon({...source,x:b.x+100},box));
 g.openingBoard=true;assert.ok(!worldLightField(g,[source]).volumes.some(v=>v.owner.startsWith('board:')));
});

test('warm grass frames reuse raster, edits invalidate it, and cut grass disappears',()=>{
 const old=globalThis.document;let allocations=0,blits=0,paint=0;
 const pen={translate(){},fillRect(){paint++;}};
 globalThis.document={createElement(){allocations++;return {getContext:()=>pen};}};
 const c={save(){},restore(){},translate(){},transform(){},drawImage(){blits++;}};
 try{
  const p={kind:'tall_grass',x:100,y:100,size:80,tuftSeed:17};
  drawGrassProp(c,p,1,'forest');const cold=paint;
  for(let i=0;i<60;i++)drawGrassProp(c,p,2+i/60,'forest');
  assert.equal(allocations,1);assert.equal(blits,61);assert.equal(paint,cold);
  p.grassTint='#ccaa44';drawGrassProp(c,p,3,'forest');assert.equal(allocations,2);
  p.cut=true;drawGrassProp(c,p,4,'forest');assert.equal(blits,62);
 }finally{globalThis.document=old;}
});

test('incremental moving sun shadows match full field rendering without trails or doubled overlap',()=>{
 const old=globalThis.document;
 globalThis.document={createElement(){const canvas={};canvas.getContext=()=>({createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),putImageData:p=>canvas.pixels=p.data});return canvas;}};
 try{
  const m=emptyShadowMaps(64,64);m.cellSize=25;m.raySteps=24;
  const tree={x:800,y:800,shadowShape:'tree',shadowHeight:150,radiusX:100,radiusY:80};
  for(const azimuth of [0,45,130,225,315])for(const jump of [0,35,90])for(const x of [780,825,875]){
   const actor={x,y:820,shadowShape:'actor',shadowHeight:52,shadowLift:jump,radiusX:11,radiusY:16};
   const optimized=makeShadowCanvas(m,{azimuth,casters:[tree,{...actor,shadowDynamic:true}]}).pixels;
   const reference=makeShadowCanvas({...m},{azimuth,casters:[tree,actor]}).pixels;
   assert.deepEqual(optimized,reference,`heading ${azimuth}, jump ${jump}, x ${x}`);
  }
 }finally{globalThis.document=old;}
});

test('forest soft actor silhouettes move without trails and union with static shadows once',()=>{
 const old=globalThis.document;
 globalThis.document={createElement(){const canvas={};canvas.getContext=()=>({createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),putImageData:p=>canvas.pixels=p.data.slice()});return canvas;}};
 try{
  const m=emptyShadowMaps(64,64);m.cellSize=25;
  const tree={x:800,y:800,shadowShape:'tree',shadowHeight:150,radiusX:100,radiusY:80},actor={x:825,y:820,shadowShape:'actor',shadowHeight:52,radiusX:11,radiusY:16,shadowDynamic:true};
  const draw=casters=>makeShadowCanvas(m,{azimuth:45,casters,softActors:true}).pixels;
  const fixed=draw([tree]),moving=draw([actor]),combined=draw([tree,actor]);
  assert.ok(moving.some(Boolean));for(let i=3;i<combined.length;i+=4)assert.equal(combined[i],Math.max(fixed[i],moving[i]));
  const shifted=draw([{...actor,x:950}]);assert.notDeepEqual(shifted,moving);assert.deepEqual(draw([actor]),moving);
 }finally{globalThis.document=old;}
});
