import test from 'node:test';import assert from 'node:assert/strict';
import {PIXEL_EFFECTS} from '../src/pixel-fx-presets.mjs';
import {validEffect} from '../src/particles.mjs';
import {drawPixelFX} from '../src/pixel-fx-render.mjs';
test('37 original pixel recipes validate and draw finite bounded compositions at every phase',()=>{
 assert.equal(Object.keys(PIXEL_EFFECTS).length,37);
 for(const e of Object.values(PIXEL_EFFECTS)){assert.ok(validEffect(e),e.name);for(const u of [0,.001,.25,.5,.99,1,1.01]){let count=0;drawPixelFX({},e,e.life*u,42,(_sprite,...values)=>{count++;assert.ok(values.every(Number.isFinite),e.name);},e.count);assert.ok(count<=e.count+3,e.name);if(u>1)assert.equal(count,0);}}
});
test('pixel render count falls with low-detail particle limit',()=>{const e=PIXEL_EFFECTS['px-fire-burst'];let full=0,low=0;drawPixelFX({},e,.3,0,()=>full++,e.count);drawPixelFX({},e,.3,0,()=>low++,5);assert.ok(low<full);});
