import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PNG} from 'pngjs';
import {TRAIL,boardPoint} from '../src/board.mjs';
import {DEFAULT_BOARD_SETTINGS} from '../src/board-settings.mjs';

const loaded=[];
const previousImage=globalThis.Image;
globalThis.Image=class {constructor(){this.complete=true;this.naturalWidth=1516;loaded.push(this);}};
const {BOARD_ART_ASSETS,boardArtBiome,drawBoardScene}=await import('../src/board-art.mjs?biome-background-test');
if(previousImage===undefined)delete globalThis.Image;else globalThis.Image=previousImage;
function render(environment){
 const images=[],geometry=[];
 const c=new Proxy({drawImage:(image,...args)=>images.push({src:image.src,args}),createRadialGradient:()=>({addColorStop(){}})},{get:(target,key)=>key in target?target[key]:(...args)=>geometry.push([key,...args]),set:(target,key,value)=>{target[key]=value;geometry.push([key,typeof value==='object'?'gradient':value]);return true;}});
 drawBoardScene(c,{generatedEnvironment:environment,players:[]},0,{settings:{...DEFAULT_BOARD_SETTINGS,particles:80,glow:0}},TRAIL,boardPoint);
 return {images,geometry};
}
test('Board art uses separate framed biome textures, never the scenic Beach backdrop',()=>{
 assert.ok(Object.isFrozen(BOARD_ART_ASSETS));assert.equal(loaded.length,6);
 for(const [environment,path]of Object.entries(BOARD_ART_ASSETS)){
  assert.equal(boardArtBiome({generatedEnvironment:environment,environment:'forest'}),environment);
  assert.equal(render(environment).images[0].src,new URL(path,new URL('../src/board-art.mjs',import.meta.url)).href);
  assert.ok(!path.includes('background'));
 }
 assert.equal(boardArtBiome({generatedEnvironment:'forest',environment:'temple'}),'forest');
 assert.equal(boardArtBiome({generatedEnvironment:'ice'}),'forest');
 assert.equal(boardArtBiome({environment:'random'}),'forest');
});
test('Beach, Temple and House use exactly the existing board magic and path geometry',()=>{
 const original=render('forest');
 for(const environment of ['desert','beach','temple','house']){
  const changed=render(environment);assert.deepEqual(changed.geometry,original.geometry,environment);
  assert.deepEqual(changed.images[0].args,[-140,-96,280,192]);
 }
 assert.equal(TRAIL.length,49);assert.deepEqual(boardPoint(48),{...TRAIL[48],hop:0});
});
test('An unavailable biome texture falls back to the original board without a second route',()=>{
 const image=loaded.find(image=>image.src.endsWith('board-beach-v1.png'));
 image.complete=false;
 try{assert.deepEqual(render('beach'),render('forest'));}finally{image.complete=true;}
});
test('Board images keep every calibrated pawn center on its visible stone surface',()=>{
 for(const environment of ['forest','desert','beach','temple','house']){
  const png=PNG.sync.read(readFileSync(new URL(BOARD_ART_ASSETS[environment],new URL('../src/board-art.mjs',import.meta.url))));
  assert.ok(Math.abs(png.width/png.height-1516/1038)<.02,environment+' framing');
  // Last entry stone is drawn natively; all 47 baked tile centers must be on stone.
  for(const [i,p]of TRAIL.slice(0,47).entries()){
   const x=Math.floor((p.x+140)/280*png.width),y=Math.floor((p.y+96)/192*png.height),offset=(y*png.width+x)*4;
   assert.ok(png.data[offset]>135&&png.data[offset+1]>125&&png.data[offset+2]>90,environment+' tile '+i+' remains beneath pawn');
  }
 }
});
