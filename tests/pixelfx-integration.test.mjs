import test from 'node:test';
import assert from 'node:assert/strict';
import {PIXELFX_MODULES,PIXELFX_EFFECTS,validPixelOptions} from '../src/pixelfx-runtime.mjs';
import {DEFAULT_EFFECTS,validEffect,saveEffect,effects,beginParticleFrame,drawParticleEffect,particleFrameStats} from '../src/particles.mjs';
import {createFx,createFrame,composite} from '../src/vendor/pixelfx/src/core/fx.js';

test('all 244 pinned effects render real color/light pixels with their native defaults',()=>{
 assert.equal(Object.keys(PIXELFX_MODULES).length,244);
 for(const [id,mod] of Object.entries(PIXELFX_MODULES)){
  assert.ok(validEffect(PIXELFX_EFFECTS['pfx-'+id.replaceAll('/','-')]),id);
  const {size:[w,h],origin:[x,y],duration}=mod.meta,frame=createFrame(w,h,-x,-y),fx=createFx(mod);
  fx.update(duration*.4);fx.draw(frame);const bytes=composite(frame,new Uint8ClampedArray(w*h*4));
  assert.ok(bytes.some(v=>v!==0),id+' produces visible content');
 }
});
test('PixelFX JSON rejects unknown modules and executable or malformed options',()=>{
 const e=DEFAULT_EFFECTS['storage-portal'];assert.ok(validEffect(e));
 for(const patch of [{pixelfx:'missing/effect'},{pxScale:100},{pxAngle:Infinity},{pxOptions:{actor:'script'}},{pxOptions:{palette:['red']}},{pxOptions:{width:NaN}},{pxOptions:{width:0}},{pxOptions:{width:4096}}])assert.equal(validEffect({...e,...patch}),false,JSON.stringify(patch));
 assert.equal(validPixelOptions('transitions/iris',{focus:[50,40]}),true);
 assert.equal(validPixelOptions('transitions/iris',{focus:['50',40]}),false);
});
test('storage binding persists the actual effect without altering other defaults',()=>{
 const previous=globalThis.localStorage,original=structuredClone(effects['storage-portal']);let data;
 globalThis.localStorage={setItem:(k,v)=>data=JSON.parse(v)};
 try{saveEffect('storage-portal',{...original,pxOptions:{width:19,height:34},pxFlip:true});assert.equal(data['storage-portal'].pixelfx,'arcane/portal');assert.equal(data['storage-portal'].pxOptions.width,19);assert.deepEqual(effects.torch,DEFAULT_EFFECTS.torch);}
 finally{effects['storage-portal']=original;globalThis.localStorage=previous;}
});

test('native rasters have a separate emitter ceiling within the shared particle budget',()=>{
 const c={globalAlpha:1,save(){},restore(){},translate(){}};
 beginParticleFrame(c,{budget:100,maxPixelFx:3});
 for(let i=0;i<20;i++)drawParticleEffect(c,'pfx-arcane-portal',0,0,.5,i);
 assert.equal(particleFrameStats(c).pixelFxEmitters,3);
 assert.equal(particleFrameStats(c).emitters,3);
 assert.equal(particleFrameStats(c).draws,3);
});
