import test from 'node:test';
import assert from 'node:assert/strict';
import {SealVortex,SEAL_LIMITS,sealEnvelope,sealPoint,sealSurfaceSize} from '../src/seal-vortex.mjs';
import {Renderer} from '../src/render.mjs';
import {Game} from '../src/core.mjs';
import {rules} from '../src/definitions.mjs';
import {saveSession,restoreSession} from '../src/session.mjs';

const context=()=>{const calls={};return new Proxy({calls},{get(target,key){if(key in target)return target[key];return (...args)=>{calls[key]=(calls[key]||0)+1;if(key==='getImageData')throw Error('Runtime pixel readback');};},set(target,key,value){target[key]=value;return true;}});};
test('Call Wildbound has priority over nearby loose loot and arrows, even with a full inventory',()=>{
 for(const full of [false,true])for(const device of ['keyboard','pad:0']){
  const g=new Game(()=>.42),p=g.addPlayer(device);g.start();g.openingBoard=false;g.scenery=[];g.terrain.fill('grass');g.enemies=[];Object.assign(p,{x:800,y:850,progress:48});
  p.inventory=full?Array.from({length:24},()=>({type:'sword',qty:1})):[];
  const loot={id:999,x:p.x+5,y:p.y,type:'sword',qty:1,manualPickup:true};g.loot=[loot];
  let pickupAttempts=0;g.collect=()=>{pickupAttempts++;return false;};g.nearbyArrow=()=>({id:1000});
  for(let n=0;n<55&&g.phase==='play';n++)g.update(.05,{[device]:{interact:true}});
  assert.equal(g.phase,'sealing');assert.equal(pickupAttempts,0);assert.ok(g.loot.includes(loot));
 }
});
test('Loot interaction still works away from the finish table and partial calls do not pick up loot',()=>{
 const g=new Game(()=>.42),p=g.addPlayer('keyboard');g.start();g.openingBoard=false;g.scenery=[];g.terrain.fill('grass');Object.assign(p,{x:800,y:850,progress:48});
 const loot={id:999,x:p.x,y:p.y,type:'sword',qty:1,manualPickup:true};g.loot=[loot];
 for(let n=0;n<5;n++)g.update(.05,{keyboard:{interact:true}});g.update(.05,{});assert.equal(g.phase,'play');assert.equal(p.sealHold,0);assert.ok(g.loot.includes(loot));
 p.x=400;p.y=400;loot.x=400;loot.y=400;g.update(.05,{keyboard:{interact:true}});g.update(.05,{});assert.ok(!g.loot.includes(loot));
});
test('seal projection winds inward monotonically and ends at the board',()=>{
 const cx=320,cy=180,r=450;let last=Infinity;
 for(let i=0;i<=100;i++){const p=i/100,at=sealPoint(590,100,cx,cy,r,p),distance=Math.hypot(at.x-cx,at.y-cy);assert.ok(Number.isFinite(distance)&&distance<=last+1e-9);last=distance;}
 const start=sealPoint(590,100,cx,cy,r,0),mid=sealPoint(590,100,cx,cy,r,.4);assert.deepEqual(start,{x:590,y:100});assert.ok(Math.abs(Math.atan2(mid.y-cy,mid.x-cx)-Math.atan2(start.y-cy,start.x-cx))>.8);assert.ok(last<1);
 assert.deepEqual(sealPoint(cx,cy,cx,cy,r,.7),{x:cx,y:cy});
 assert.equal(sealEnvelope(-1).scale,1);assert.equal(sealEnvelope(10).progress,1);assert.equal(sealEnvelope(1).flash,0);
});
test('inner and outer layers rotate at different speeds for a true spiral',()=>{
 const a=sealPoint(10,0,0,0,100,.4),b=sealPoint(90,0,0,0,100,.4);
 assert.ok(Math.abs(Math.atan2(a.y,a.x)-Math.atan2(b.y,b.x))>.5);
});
test('snapshot memory, band and particle budgets do not scale with level size or DPI',()=>{
 for(const [w,h]of [[640,360],[3840,2160],[20000,10000],[200,10000]]){const s=sealSurfaceSize(w,h);assert.ok(s.width<=960&&s.height<=540&&s.width*s.height*4<=960*540*4);}
 const effect=new SealVortex({backend:'canvas'}),snapshot={width:960,height:540};effect.capture(snapshot,1920,1080,960,540);
 const ctx=context(),motes=effect.motes;
 for(let i=1;i<40;i++){effect.drawWorld(ctx,i/40);effect.drawAir(ctx,i/40);effect.drawAir(ctx,i/40,true);}
 assert.equal(effect.motes,motes);assert.equal(motes.length,SEAL_LIMITS.motes);
 assert.ok(effect.stats.rings<=20);assert.ok(effect.stats.motes<=112);assert.equal(effect.stats.textureUploads,0);assert.equal(effect.stats.captures,1);assert.equal(ctx.calls.getImageData,undefined);
 effect.clear();assert.equal(effect.snapshot,null);assert.equal(snapshot.width,1);assert.equal(snapshot.height,1);
});
test('sealing draw never visits world objects or repeats terrain rendering',()=>{
 const oldDocument=globalThis.document;globalThis.document={createElement:()=>({getContext:()=>context()})};
 const c=context(),canvas={getContext:()=>c,clientWidth:1280,clientHeight:720,width:1280,height:720};c.canvas=canvas;
 const assets={library:{}},renderer=new Renderer(canvas,assets),g=new Game(()=>.42),p=g.addPlayer('keyboard');
 g.phase='sealing';g.sealTime=1;g.reveal=null;g.players=[p];renderer.camera={x:800,y:800,zoom:.5};
 renderer.sealVortex=new SealVortex({backend:'canvas'});renderer.sealVortex.capture({width:640,height:360},640,360,320,180);renderer.sealGame=g;renderer.sealW=640;renderer.sealH=360;renderer.sealProgress=0;
 const forbidden=()=>{throw Error('Expensive world redraw during sealing');};renderer.floor=forbidden;renderer.minimap=forbidden;renderer.boardTop=()=>{};renderer.animator.draw=()=>{};
 Object.defineProperty(g,'scenery',{get:forbidden});Object.defineProperty(g,'enemies',{get:forbidden});
 try{for(let i=0;i<60;i++)renderer.draw(g,1/60);}finally{if(oldDocument===undefined)delete globalThis.document;else globalThis.document=oldDocument;}
 assert.equal(renderer.sealVortex.stats.captures,1);assert.equal(renderer.camera.zoom,.5);assert.equal(renderer.sealVortex.stats.textureUploads,0);
});
test('seal capture excludes the board and party without mutating the live game',()=>{
 const oldDocument=globalThis.document;globalThis.document={createElement:()=>({width:0,height:0,getContext:()=>context()})};
 const c=context(),canvas={getContext:()=>c,clientWidth:1280,clientHeight:720,width:1280,height:720};c.canvas=canvas;
 const renderer=new Renderer(canvas,{library:{}}),g=new Game(()=>.42),p=g.addPlayer('keyboard');g.start();g.openingBoard=false;g.bloom=3;p.progress=48;p.x=800;p.y=800;g.beginSeal(p);
 const before=JSON.stringify(saveSession(g));
 const original=Renderer.prototype.draw;let captures=0;
 Renderer.prototype.draw=function(game,dt,options){if(options?.sealCapture){captures++;assert.equal(game.phase,'play');assert.equal(game.openingBoard,false);assert.notEqual(game,g);return;}return original.call(this,game,dt,options);};
 renderer.sealVortex=new SealVortex({backend:'canvas'});renderer.boardTop=()=>{};renderer.animator.draw=()=>{};
 try{renderer.draw(g,0);renderer.draw(g,0);assert.equal(captures,1);assert.equal(JSON.stringify(saveSession(g)),before);
  canvas.clientWidth=1000;renderer.draw(g,0);assert.equal(captures,2);g.sealTime=.5;renderer.draw(g,0);g.sealTime=.1;renderer.draw(g,0);assert.equal(captures,3);
 }finally{Renderer.prototype.draw=original;if(oldDocument===undefined)delete globalThis.document;else globalThis.document=oldDocument;}
});
test('sealing save/reload finishes once, retains personal gear and awards shared treasure',()=>{
 const g=new Game(()=>.42),p=g.addPlayer('keyboard');g.start();g.openingBoard=false;Object.assign(p,{x:800,y:800,progress:48});
 p.inventory=[{type:'moon_blade',qty:1,sockets:['azure_bead']}];p.chests[0]=[{type:'potion',qty:999}];g.beginSeal(p);
 for(let i=0;i<25;i++)g.update(.05);const restored=restoreSession(JSON.parse(JSON.stringify(saveSession(g))));assert.equal(restored.phase,'sealing');
 for(let i=0;i<70;i++)restored.update(.05);
 assert.equal(restored.phase,'won');assert.ok(restored.victoryRewards.length);const reward=JSON.stringify(restored.victoryRewards);restored.completeVictory();assert.equal(JSON.stringify(restored.victoryRewards),reward);
 assert.deepEqual(restored.players[0].inventory,p.inventory);assert.deepEqual(restored.players[0].chests[0],p.chests[0]);assert.ok(restored.sealTime>=rules.sealDuration);
});
test('prepared finish frame is consumed without rendering or scanning the world again',()=>{
 const oldDocument=globalThis.document;globalThis.document={createElement:()=>({width:640,height:360,getContext:()=>context()})};
 try{
  const ctx=context(),canvas={getContext:()=>ctx,clientWidth:1280,clientHeight:720,width:1280,height:720},r=new Renderer(canvas,{library:{}}),g=new Game(()=>.42);g.addPlayer('keyboard');g.phase='sealing';g.sealTime=0;
  const prepared={width:640,height:360,getContext:()=>context()};r.sealReady={canvas:prepared,game:g,seed:g.seed,time:g.time,w:640,h:360,camera:{x:800,y:800,zoom:.5}};
  Object.defineProperty(g,'scenery',{get:()=>{throw Error('Warm entry scanned scenery');}});r.sealVortex=new SealVortex({backend:'canvas'});r.animator.draw=()=>{};r.boardTop=()=>{};
  r.draw(g,0);assert.equal(r.sealVortex.snapshot,prepared);assert.equal(r.sealReady,null);assert.equal(r.sealVortex.stats.captures,1);
 }finally{if(oldDocument===undefined)delete globalThis.document;else globalThis.document=oldDocument;}
});
