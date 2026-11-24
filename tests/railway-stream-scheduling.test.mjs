import test from 'node:test';
import assert from 'node:assert/strict';
import {RAILWAY_READY_BUDGET,railwayStream,stopRailwayStream,prepareRailwayView,railwayStarting} from '../src/railway-stream.mjs';
function setup(fn){const original=globalThis.Worker;class FakeWorker{messages=[];postMessage(message){this.messages.push(message);}terminate(){this.terminated=true;}}globalThis.Worker=FakeWorker;const t={design:{width:16000,height:9600,wildLands:true},viewZoom:1.35};try{const s=railwayStream(t);return fn(t,s);}finally{stopRailwayStream(t);if(original===undefined)delete globalThis.Worker;else globalThis.Worker=original;}}
test('a visible request promotes an already queued look-ahead job',()=>setup((t,s)=>{s.request('region','busy',{},220);s.request('floor','ahead',{},5);s.request('prop','wind',{},20);s.request('floor','ahead',{},180);assert.equal(s.queue.get('ahead').priority,180);assert.equal(s.queue.size,2);s.worker.onmessage({data:{key:'busy'}});assert.equal(s.active,'ahead');}));
test('stale views do not keep old background jobs ahead of the current camera',()=>setup((t,s)=>{s.request('region','busy',{},220);s.request('prop','old-tree',{},140);s.queue.get('old-tree').seen-=2000;s.request('floor','current',{},180);s.worker.onmessage({data:{key:'busy'}});assert.equal(s.active,'current');assert.ok(!s.queue.has('old-tree'));}));
test('startup waits for the active party collision regions and playable ground, then ignores distant jobs',()=>setup((t,s)=>{
 const bounds={left:600,top:600,right:1000,bottom:1000};
 prepareRailwayView(t,bounds,[{x:800,y:800},{x:2480,y:800}]);
 s.request('floor','ahead',{},105);
 assert.ok(railwayStarting(t,false,0));
 assert.ok(railwayStarting(t,true,50));
 s.worker.onmessage({data:{key:'region:surface:0:0'}});
 assert.ok(railwayStarting(t,true,60));
 s.worker.onmessage({data:{key:'region:surface:1:0'}});
 assert.ok(railwayStarting(t,false,70));
 assert.equal(railwayStarting(t,true,80),false);
 assert.equal(t.preparing,false);
 assert.equal(s.active,'ahead');
}));
test('startup uses native fallback if a terrain worker stalls',()=>setup((t,s)=>{assert.ok(railwayStarting(t,false,0));assert.equal(railwayStarting(t,false,15001),false);assert.equal(t.streamDisabled,true);assert.equal(s.worker.terminated,true); }));
test('startup omits forecasts and admits at most two background world tiles after play starts',()=>setup((t,s)=>{
 const bounds={left:6000,top:3000,right:7400,bottom:4000},players=[{x:6500,y:3500}];
 prepareRailwayView(t,bounds,players);
 assert.equal(s.active,'region:surface:4:2');
 assert.equal(s.queue.size,0);
 assert.equal(s.baseline.size,0);
 s.worker.onmessage({data:{key:s.active}});
 assert.equal(railwayStarting(t,true),false);
 prepareRailwayView(t,bounds,players);
 assert.equal(s.baseline.size,0);
 assert.ok([...s.queue.values()].some(j=>j.kind==='floor'&&!j.args.far&&j.args.x>7400));
 s.startedAt-=1000;s.views.get('shared').nextPlan=0;
 prepareRailwayView(t,bounds,players);
 assert.equal(s.baseline.size,40);
 const admitted=[...s.queue.values()].filter(j=>s.baseline.has(j.key));
 assert.equal(admitted.length,2);
 assert.ok(admitted.every(j=>j.priority===40));
}));
test('immutable collision data does not replace an already harvested runtime record',()=>setup((t,s)=>{const existing={props:[{depleted:true}]};t.wildNativeWorlds=new Map([['region',existing]]);s.worker.onmessage({data:{key:'new',worlds:[['region',{props:[{depleted:false}]}]]}});assert.equal(t.wildNativeWorlds.get('region'),existing);}));
test('leaving a world terminates preparation and releases owned image bitmaps',()=>setup((t,s)=>{let closed=0;s.ready.set('image',{width:8,height:8,close(){closed++;}});stopRailwayStream(t);assert.equal(closed,1);assert.equal(s.worker.terminated,true);assert.equal(t.preparing,undefined);}));

test('split views retain independent predictions and prefetch both distant cameras without the gap',()=>setup((t,s)=>{railwayStarting(t,true);const a={left:300,top:300,right:700,bottom:700},b={left:14300,top:7500,right:14700,bottom:7900};prepareRailwayView(t,a,[],'one');prepareRailwayView(t,b,[],'two');assert.equal(s.views.size,2);assert.equal(s.views.get('one').lastView.vx,0);assert.equal(s.views.get('two').lastView.vx,0);const near=[...s.queue.values()].filter(j=>j.kind==='floor'&&!j.args.far);assert.ok(near.some(j=>j.args.x<2000));assert.ok(near.some(j=>j.args.x>13000));assert.ok(!near.some(j=>j.args.x>5000&&j.args.x<10000));for(const v of s.views.values())for(const key of v.pinned)assert.ok(s.pinned.has(key));}));
test('obsolete split views release queued prefetch and pinning after departure',()=>setup((t,s)=>{railwayStarting(t,true);prepareRailwayView(t,{left:300,top:300,right:700,bottom:700},[],'left');prepareRailwayView(t,{left:14300,top:7500,right:14700,bottom:7900},[],'right');s.views.get('right').seen-=2000;s.views.get('left').nextPlan=0;prepareRailwayView(t,{left:300,top:300,right:700,bottom:700},[],'left');assert.equal(s.views.size,1);assert.ok(![...s.queue.values()].some(j=>j.args.prefetch&&!j.args.far&&j.args.x>13000));}));

test('worker failure after entering play switches to synchronous collision',()=>setup((t,s)=>{
 railwayStarting(t,true);
 s.failed=true;
 assert.equal(railwayStream(t),null);
 assert.equal(t.streamDisabled,true);
 assert.equal(t.preparing,undefined);
 assert.equal(s.worker.terminated,true);
}));

test('a playable locally primed view gives the cold worker time for its first reply only',()=>setup((t,s)=>{
 const bounds={left:600,top:600,right:1000,bottom:1000},players=[{x:800,y:800}];
 prepareRailwayView(t,bounds,players);
 const region=s.active;
 s.ready.set(region,true); // The renderer primed a safe local region while the worker was still starting.
 assert.equal(railwayStarting(t,true),false);
 s.activeAt=performance.now()-19000;
 prepareRailwayView(t,bounds,players);
 assert.equal(railwayStream(t),s);
 assert.equal(s.worker.terminated,undefined);
 s.worker.onmessage({data:{key:region}});
 s.activeAt=performance.now()-16000;
 prepareRailwayView(t,bounds,players);
 assert.equal(t.streamDisabled,true);
}));

test('a locally playable view still falls back if the worker never replies',()=>setup((t,s)=>{
 const bounds={left:600,top:600,right:1000,bottom:1000};
 prepareRailwayView(t,bounds,[{x:800,y:800}]);
 s.ready.set(s.active,true);
 assert.equal(railwayStarting(t,true),false);
 s.activeAt=performance.now()-31000;
 prepareRailwayView(t,bounds,[]);
 assert.equal(t.streamDisabled,true);
 assert.equal(s.worker.terminated,true);
}));

test('a stream plan serves the current floor before adjacent region lookahead',()=>setup((t,s)=>{
 railwayStarting(t,true);
 const p={x:6450,y:3250},bounds={left:6200,top:3000,right:6700,bottom:3500};
 s.ready.set('region:surface:4:2',true);
 prepareRailwayView(t,bounds,[p]);
 assert.match(s.active,/^floor:surface:512:/);
 const center=s.active;
 s.worker.onmessage({data:{key:center}});
 assert.match(s.active,/^region:surface:/);
 assert.ok(!s.queue.has(center));
 assert.ok([...s.queue.values()].some(j=>j.kind==='region'&&j.priority===130));
 assert.ok([...s.queue.values()].some(j=>j.kind==='water'&&j.priority===175));
 assert.ok(s.pinned.size>0);
 assert.ok(s.pinned.size<[...s.queue.values()].filter(j=>j.kind==='floor').length);
}));

test('closing in from the far view prepares closer scenery',()=>setup((t,s)=>{
 railwayStarting(t,true);t.viewZoom=.24;
 prepareRailwayView(t,{left:3000,top:2000,right:8700,bottom:5600});
 const view=s.views.get('shared');
 view.lastView.time-=100;view.nextPlan=0;
 prepareRailwayView(t,{left:3400,top:2250,right:8300,bottom:5350});
 assert.equal(s.prepareNearPoses,true);
 assert.ok([...s.queue.values()].some(j=>j.kind==='floor'&&!j.args.far&&j.priority===115));
}));

test('geometry-only stream entries consume cache budget and can be evicted',()=>setup((t,s)=>{
 const mb=1024*1024;
 s.pinned.add('visible');
 s.baseline.add('baseline');
 const reply=(key,value)=>s.worker.onmessage({data:{key,value}});
 reply('baseline',{width:4096,height:2048});
 reply('visible',{data:{byteLength:50*mb}});
 reply('old-grass',{data:{byteLength:45*mb}});
 assert.equal(s.readyBytes,127*mb);
 reply('current-grass',{data:{byteLength:8*mb}});
 assert.ok(s.readyBytes<=RAILWAY_READY_BUDGET);
 assert.ok(!s.ready.has('old-grass'));
 assert.ok(['baseline','visible','current-grass'].every(key=>s.ready.has(key)));
}));
