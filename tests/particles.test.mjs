import test from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULT_EFFECTS,validEffect,particleSamples,saveEffect,effects} from '../src/particles.mjs';
test('particle presets remain bounded, repeatable and finite after long sessions',()=>{
 for(const effect of Object.values(DEFAULT_EFFECTS)){
  assert.ok(validEffect(effect));
  for(const t of [0,.3,100000]){const p=particleSamples(effect,t,19);assert.equal(p.length,effect.count);assert.deepEqual(p,particleSamples(effect,t,19));assert.ok(p.every(v=>Object.values(v).every(Number.isFinite)&&v.alpha>=0&&v.alpha<=1));}
 }
});
test('invalid imported effects cannot replace gameplay effects',()=>{
 const before=structuredClone(effects.torch);
 for(const patch of [{count:100000},{life:0},{size:NaN},{start:'red'},{shape:'script'},{name:''}]){
  assert.equal(validEffect({...before,...patch}),false);assert.throws(()=>saveEffect('torch',{...before,...patch}));assert.deepEqual(effects.torch,before);
 }
});
test('saving a particle preset persists it without modifying other presets',()=>{
 let data;const previous=globalThis.localStorage;globalThis.localStorage={setItem:(key,value)=>data=JSON.parse(value)};
 try{saveEffect('test-effect',{...DEFAULT_EFFECTS.torch,name:'Test fire',size:6});assert.equal(data['test-effect'].size,6);assert.deepEqual(effects.rain,DEFAULT_EFFECTS.rain);}finally{globalThis.localStorage=previous;delete effects['test-effect'];}
});
