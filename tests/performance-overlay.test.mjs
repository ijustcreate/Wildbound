import test from 'node:test';
import assert from 'node:assert/strict';
import {FrameMetrics} from '../src/performance.mjs';
import {performanceLines} from '../src/performance-overlay.mjs';
test('profiling is opt-in, bounded, and resettable',()=>{
 const m=new FrameMetrics();m.record('frame',20);assert.equal(m.stats('frame'),null);
 m.enabled=true;for(let i=0;i<300;i++)m.record('frame',i);
 const s=m.stats('frame');assert.equal(s.count,240);assert.equal(s.max,299);assert.equal(s.p95,287);assert.equal(s.mean,179.5);
 m.reset();assert.equal(m.stats('frame'),null);
});
test('overlay reports actual cadence, spikes, CPU costs and scene pressure',()=>{
 const m=new FrameMetrics();m.enabled=true;for(let i=0;i<59;i++)m.record('frame',16);m.record('frame',100);
 m.record('simulation',3);m.record('world',5);
 const text=performanceLines(m,{game:{players:[{}],enemies:[{},{}],effects:[]},screen:'play',canvas:{width:640,height:480},errors:['Oops']}).join('\n');
 assert.match(text,/57 FPS/);assert.match(text,/max 100.0 ms · >33ms 1\/60/);assert.match(text,/Update: 3.0/);assert.match(text,/enemies 2/);assert.match(text,/640×480/);assert.match(text,/Renderer errors: 1 · Oops/);assert.doesNotMatch(text,/JS heap/);
});
test('disabled measurements execute normally without retained samples',()=>{
 const m=new FrameMetrics();assert.equal(m.measure('world',()=>42),42);assert.deepEqual(m.samples,{});
 assert.match(performanceLines(m).join('\n'),/collecting samples/);
});
