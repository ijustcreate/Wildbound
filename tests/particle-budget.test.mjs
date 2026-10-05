import test from 'node:test';import assert from 'node:assert/strict';
import {beginParticleFrame,drawParticleEffect,particleFrameStats,spawnParticleEffect} from '../src/particles.mjs';
const context=()=>({canvas:{width:800,height:600},globalAlpha:1,save(){},restore(){},translate(){},rotate(){},fillRect(){},getTransform(){return {a:1,b:0,c:0,d:1,e:0,f:0};}});
test('particle drawings obey shared budget, quality and emitter limits',()=>{const c=context();beginParticleFrame(c,{budget:10,maxEmitters:2});for(let i=0;i<100;i++)drawParticleEffect(c,'torch',300,200,.4,i);assert.equal(particleFrameStats(c).draws,10);assert.equal(particleFrameStats(c).emitters,1);
 beginParticleFrame(c,{quality:.25});drawParticleEffect(c,'torch',300,200,.4);assert.equal(particleFrameStats(c).draws,11);
});
test('offscreen emitters spend no draw budget and transient spawn count is capped',()=>{const c=context();beginParticleFrame(c);drawParticleEffect(c,'torch',100000,100000,.4);assert.equal(particleFrameStats(c).draws,0);assert.equal(particleFrameStats(c).culled,1);const g={};for(let i=0;i<100;i++)spawnParticleEffect(g,'fx-gold-impact',0,0);assert.equal(g.effects.length,48);});
