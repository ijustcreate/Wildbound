import test from 'node:test';
import assert from 'node:assert/strict';
import {drawMagicBolt,visitMagicTrail,MAGIC_TRAIL_LIMIT,MAGIC_TRAIL_SECONDS} from '../src/magic-bolt-render.mjs';
import {drawMagicBurst} from '../src/magic-bolt-effects.mjs';
function canvas(){const calls=[];return {calls,globalAlpha:1,save(){},restore(){},fillRect(x,y,w,h){assert.ok([x,y,w,h].every(Number.isInteger));calls.push([x,y,w,h,this.fillStyle]);},createRadialGradient(){throw Error('Blurred glow forbidden');},ellipse(){throw Error('Smooth orb forbidden');},stroke(){throw Error('Antialiased streak forbidden');}};}
test('magic trail is dense, deterministic, finite, and bounded without live particle actors',()=>{
 for(const age of [0,.001,.02,.1,.5,3,9999]){
  const b={x:100,y:60,vx:260,vy:-75,age,visualSeed:123},a=[],z=[];const count=visitMagicTrail(b,(...p)=>a.push(p));visitMagicTrail(b,(...p)=>z.push(p));
  assert.deepEqual(a,z);assert.equal(count,a.length);assert.ok(count<=MAGIC_TRAIL_LIMIT);if(age>.5)assert.ok(count>=25);
  for(const p of a){assert.ok(p.slice(0,3).every(Number.isFinite));assert.ok(p[2]>0&&p[2]<=1);assert.ok(Math.hypot(p[0]-b.x,p[1]-(b.y-16))<=Math.hypot(b.vx,b.vy)*MAGIC_TRAIL_SECONDS+18);}
  if(age===0)assert.equal(count,0);
 }
});
test('pixel projectiles preserve saturated wand colour and use only whole square blocks',()=>{
 for(const [vx,vy]of [[260,0],[0,260],[184,184],[-260,0]])for(const type of ['basic','fire','ice']){
  const c=canvas();drawMagicBolt(c,{x:100,y:60,vx,vy,color:'#b36de0',age:.5,size:8,fire:type==='fire',ice:type==='ice'});
  assert.ok(c.calls.length>35&&c.calls.length<150);assert.ok(c.calls.some(p=>p[4]==='#b36de0'));assert.ok(c.calls.every(p=>p[2]===p[3]&&p[2]<=3));assert.equal(c.globalCompositeOperation,'source-over');
 }
});
test('newborn bolts cannot draw pre-emission particles and zero range cannot draw',()=>{
 const c=canvas();drawMagicBolt(c,{x:100,y:60,vx:260,vy:0,age:0,color:'#a0cfff'});assert.ok(c.calls.every(p=>p[0]>=94&&p[0]<=104));
 const dead=canvas();drawMagicBolt(dead,{x:100,y:60,remaining:0});assert.equal(dead.calls.length,0);
});
test('spell impact uses small pixel chips rather than smooth lines',()=>{
 const c=canvas();drawMagicBurst(c,{x:90,y:70,color:'#ff7938',life:.2,duration:.32,hit:true});assert.ok(c.calls.length>=13&&c.calls.length<=20);assert.ok(c.calls.every(p=>p[2]===p[3]&&p[4]==='#ff7938'));
});
