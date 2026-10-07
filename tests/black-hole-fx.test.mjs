import test from 'node:test';import assert from 'node:assert/strict';
import {effects,validEffect,drawParticleEffect,beginParticleFrame,particleFrameStats,spawnParticleEffect,saveEffect} from '../src/particles.mjs';
import {PIXEL_EFFECTS} from '../src/pixel-fx-presets.mjs';
import {drawBlackHoleFX,blackHoleTexture,blackHoleTextureStats,BLACK_HOLE_CACHE_LIMIT} from '../src/black-hole-fx.mjs';
const recipe=PIXEL_EFFECTS['px-black-hole'];
const context=()=>({globalAlpha:1,save(){},restore(){},translate(){},rotate(){},fillRect(){}});
test('Black-hole preset validates, loops with an opaque dark core blend, and is save/export compatible',()=>{assert.ok(validEffect(recipe));assert.equal(recipe.fx,'pixel-black-hole');assert.equal(recipe.blend,'source-over');assert.equal(recipe.loop,true);saveEffect('black-hole-test',recipe);assert.deepEqual(effects['black-hole-test'],recipe);delete effects['black-hole-test'];});
test('Time sampled black hole is deterministic, finite, and quality bounded with one core stamp',()=>{
 const sample=t=>{const stamps=[];drawBlackHoleFX({},recipe,t,4,(_,...v)=>stamps.push(v),recipe.count);return stamps;};assert.deepEqual(sample(.7),sample(.7));assert.notDeepEqual(sample(.7),sample(1));for(const phase of [0,.1,1,2.4]){const stamps=sample(phase);assert.equal(stamps.length,recipe.count+1);assert.ok(stamps.every(v=>v.every(Number.isFinite)));}
 let count=0;drawBlackHoleFX({},recipe,.7,0,()=>count++,4);assert.equal(count,5);count=0;drawBlackHoleFX({},recipe,2.5,0,()=>count++,16);assert.equal(count,0);
});
test('Shared particle budget limits black-hole emitters and reduced motion freezes the internal vortex',()=>{
 const c=context();beginParticleFrame(c,{budget:6});drawParticleEffect(c,'px-black-hole',0,0,100,4);assert.equal(particleFrameStats(c).draws,6);
 const samples=[];c.translate=(x,y)=>samples.push([x,y]);c.fillRect=(...v)=>samples.push([c.globalAlpha,...v]);c.globalAlpha=1;beginParticleFrame(c,{reducedMotion:true});drawParticleEffect(c,'px-black-hole',0,0,.3,4);const first=structuredClone(samples);samples.length=0;c.globalAlpha=1;beginParticleFrame(c,{reducedMotion:true});drawParticleEffect(c,'px-black-hole',0,0,1.4,4);assert.deepEqual(samples,first);
 const g={};for(let n=0;n<100;n++)spawnParticleEffect(g,'px-black-hole',0,0,n);assert.equal(g.effects.length,48);
});
test('Native vortex texture cache is bounded across phase, seed and edited palette changes',()=>{
 const old=globalThis.document;globalThis.document={createElement:()=>({getContext:()=>({fillRect(){}})})};try{for(let n=0;n<200;n++)blackHoleTexture({...recipe,start:'#'+n.toString(16).padStart(6,'0')},n/16,n);const stats=blackHoleTextureStats();assert.equal(stats.textures,BLACK_HOLE_CACHE_LIMIT);assert.ok(stats.bytes<=64*64*64*4);assert.equal(blackHoleTexture(recipe,.4,2),blackHoleTexture(recipe,.4,2));}finally{globalThis.document=old;}
});
