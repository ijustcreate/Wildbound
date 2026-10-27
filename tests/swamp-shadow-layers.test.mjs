import test from 'node:test';
import assert from 'node:assert/strict';
import {drawProp} from '../src/environment.mjs';
import {drawRealmProp} from '../src/realm-art.mjs';
import {makeSwampTreeSprite,swampTreeStructure} from '../src/swamp-art.mjs';

function pen(){return {fillStyle:'',arcs:[],images:[],gradients:0,save(){},restore(){},translate(){},rotate(){},beginPath(){},fill(){},fillRect(){},ellipse(...a){this.arcs.push(a);},drawImage(...a){this.images.push(a);},createRadialGradient(){this.gradients++;return {addColorStop(){}};}};}
function withCanvas(run){const old=globalThis.document;globalThis.document={createElement:()=>({width:128,height:128,getContext:()=>pen()})};try{run();}finally{globalThis.document=old;}}

test('realm prop path owns exactly one blob shadow only in fallback mode',()=>withCanvas(()=>{
 for(const kind of ['old_cypress','mangrove','peat_boulder'])for(const dynamicShadows of [false,true]){
  const c=pen();drawProp(c,{kind,x:200,y:300,rootY:300,size:180},0,{}, {dynamicShadows});
  assert.equal(c.arcs.length,dynamicShadows?0:1,kind);
 }
}));

test('dynamic crystals emit through the shared point-light pass, not a second unoccluded glow disc',()=>withCanvas(()=>{
 for(const kind of ['cave_crystal','amber_crystal','shadow_obsidian'])for(const dynamicShadows of [false,true]){
  const c=pen();drawRealmProp(c,{kind,x:100,y:100,size:50},0,{}, {dynamicShadows});
  assert.equal(c.gradients,dynamicShadows?0:1);
 }
}));

test('native swamp artwork has no broad baked ground ellipse',()=>{
 for(const kind of ['old_cypress','mangrove']){
  const s=makeSwampTreeSprite(kind);assert.equal(s.palette.includes('#3e563e'),false);
  assert.equal(s.nativeSwampTree,true);
  const body=makeSwampTreeSprite(kind,{part:'body'}),moss=makeSwampTreeSprite(kind,{part:'moss'});
  assert.ok(body.pixels.some(Boolean)&&moss.pixels.some(Boolean));
  assert.ok(!body.palette.includes('#94a080'));
 }
});

test('moss changes phase while the body draw stays registered; authored sprites bypass procedural layers',()=>withCanvas(()=>{
 const p={kind:'old_cypress',x:200,y:300,rootY:300,size:200},a=pen(),b=pen();
 drawRealmProp(a,p,0,{}, {dynamicShadows:true});drawRealmProp(b,p,1,{}, {dynamicShadows:true});
 assert.deepEqual(a.images[0],b.images[0]);assert.notDeepEqual(a.images.slice(1),b.images.slice(1));
 const custom={width:1,height:1,palette:['transparent','#ffffff'],pixels:[1]},c=pen();
 drawRealmProp(c,p,1,{}, {dynamicShadows:true,spriteLibrary:{old_cypress:custom}});
 assert.equal(c.images.length,1,'custom painted tree remains the actual rendered sprite');
}));

test('review-only seeded structure varies branches and crowns deterministically without changing saved props',()=>{
 for(const type of ['cypress','mangrove']){
  assert.deepEqual(swampTreeStructure(type,7),swampTreeStructure(type,7));
  assert.notDeepEqual(swampTreeStructure(type,7),swampTreeStructure(type,19));
  const p=swampTreeStructure(type,7);assert.ok(p.clusters.every(([x,y,rx,ry])=>x-rx>=-58&&x+rx<=58&&y-ry>=-119));
 }
});
