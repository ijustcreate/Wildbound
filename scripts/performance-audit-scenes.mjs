import {Game} from '../src/core.mjs';
import {Assets} from '../src/assets.mjs';
import {Renderer} from '../src/render.mjs';
import {CAMERA_DEFAULTS,saveCameraSettings} from '../src/multiplayer-camera.mjs';
import {defaultTrainDesign,trainInterior} from '../src/train-design.mjs';
import {enterTrainTest} from '../src/train-test.mjs';
import {trainCars,trainWorld} from '../src/train-track.mjs';
import {stopRailwayStream} from '../src/railway-stream.mjs';
import {TvWildbound} from '../src/tv-wildbound.mjs';
import {initializeTacticalEnemy} from '../src/combat-tactics-state.mjs';

export const catalog=[
 {id:'forest-close',environment:'forest',count:1,zoom:1.1},
 {id:'forest-rain',environment:'forest',count:2,zoom:.65,rain:true},
 {id:'house-combat',environment:'house',count:4,zoom:.9,enemies:24},
 {id:'shadow',environment:'shadow',count:1,zoom:.8},
 {id:'caverns',environment:'caverns',count:1,zoom:.8},
 {id:'train-interior',environment:'forest',count:4,zoom:.9,train:true,interior:true},
 {id:'railway-split',environment:'forest',count:4,zoom:.35,train:true},
 {id:'tv-arena',environment:'house',count:4,zoom:1,tv:true}
];
const stats=a=>{const b=[...a].sort((x,y)=>x-y);return {mean:a.reduce((x,y)=>x+y,0)/a.length,p95:b[Math.ceil(b.length*.95)-1],p99:b[Math.ceil(b.length*.99)-1],max:b.at(-1)};};
export async function createAudit(options={}){
 const raf=window.requestAnimationFrame.bind(window);window.requestAnimationFrame=()=>0;
 const next=options.cpu?()=>new Promise(resolve=>setTimeout(()=>resolve(performance.now()),0)):()=>new Promise(raf);await next();
 const assets=new Assets();await assets.load();for(const e of document.body.children)e.style.display='none';
 const canvas=document.createElement('canvas');canvas.style.cssText='position:fixed;inset:0;width:100vw;height:100vh';document.body.append(canvas);
 const label=document.createElement('div');label.style.cssText='position:fixed;top:8px;left:8px;padding:8px;background:#102724ed;color:#d2e4db;font:13px monospace;pointer-events:none';document.body.append(label);
 const renderer=new Renderer(canvas,assets);let game,scene,tv,origins,time=0;
 function place(t){if(tv)return;game.players.forEach((p,i)=>{const o=origins[i];Object.assign(p,{x:o.x+Math.sin(t*.55+i)*22,y:o.y+Math.cos(t*.45+i)*16,hp:Math.max(100,p.maxHp||100),invulnerable:999,moving:true});});}
 function draw(dt){if(tv){renderer.resize();tv.draw(renderer.ctx,renderer.viewport.w,renderer.viewport.h,renderer.animator);}else renderer.draw(game,dt);}
 function update(dt){time+=dt;if(tv)tv.step(dt,{});else {game.update(dt,{});place(time);}}
 return {catalog,
 async prepare(id){
  if(game?.trainTest)stopRailwayStream(game.trainTest);renderer.clearSplitRenderers();scene=catalog.find(s=>s.id===id);if(!scene)throw Error('Unknown scene '+id);label.textContent='Preparing '+id;
  let seed=123;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  game=new Game(random);game.environment=scene.environment;game.seed=42;
  for(let i=0;i<scene.count;i++)game.addPlayer(i?'pad:'+i:'keyboard','P'+(i+1));
  game.start();Object.assign(game,{openingBoard:false,phase:'play',bloom:3,time:22,persist:()=>{},onSound:()=>{},spriteLibrary:assets.library,weather:scene.rain?{type:'monsoon',life:100}:null});
  saveCameraSettings({...CAMERA_DEFAULTS,minZoom:scene.zoom,maxZoom:scene.zoom});
  tv=null;time=0;
  if(scene.train){const design=defaultTrainDesign();if(scene.interior)design.nativeForest=false;design.scenery=[];if(!enterTrainTest(game,design).ok)throw Error('Native train entry failed');game.trainTest.noticeUntil=0;
   if(scene.interior){const car=trainCars(game.trainTest)[2],tables=trainInterior(design,car).filter(o=>o.kind==='table');for(const c of trainCars(game.trainTest))game.trainTest.roof[c.id]=0;game.players.forEach((p,i)=>{p.trainRide={car:2,x:tables[i%tables.length].x,y:12};Object.assign(p,trainWorld(car,p.trainRide.x,p.trainRide.y));});}
   else game.players.forEach((p,i)=>Object.assign(p,{x:[800,5300,800,5300][i],y:[800,3500,3500,800][i],trainRide:null}));
  }else if(scene.count>1)game.players.forEach((p,i)=>Object.assign(p,{x:760+(i%2)*80,y:820+Math.floor(i/2)*80}));
  if(scene.enemies){game.enemies=[];const kinds=['skeleton','archer','monkey','lion'];for(let i=0;i<scene.enemies;i++){const kind=kinds[i%kinds.length],e={id:1000+i,kind,sprite:kind,x:800+Math.cos(i*2.4)*260,y:800+Math.sin(i*2.4)*260,hp:200,maxHp:200,speed:55,damage:8,state:'hunt',timer:0,cooldown:i*.07,faceX:1,faceY:0,temperament:'bold',tacticTime:1};game.configureCreature(e,false);initializeTacticalEnemy(e);game.enemies.push(e);}}
  origins=game.players.map(p=>({x:p.x,y:p.y}));
  if(scene.tv){tv=new TvWildbound(game.players,42);tv.intro=3;tv.queueWave();}
  const start=performance.now();let frames=0;
  do {await next();update(1/60);draw(1/60);frames++;}while(frames<(options.cpu?60:30)||!options.cpu&&performance.now()-start<1200||game.trainTest?.preparing&&performance.now()-start<90000);
  if(game.trainTest?.preparing)throw Error(id+' terrain did not finish preparing');
  return {id,prepareMs:performance.now()-start,frames,scenery:game.scenery.length,enemies:game.enemies.length};
 },
 async measure(duration=6000){
  label.textContent=scene.id;const frame=[],simulation=[],painting=[],stages={};let previous=await next(),start=previous;
  while(options.cpu?frame.length<(options.frames||120):previous-start<duration){const now=await next(),dt=options.cpu?1/60:Math.min(.1,(now-previous)/1000);frame.push(now-previous);previous=now;let mark=performance.now();update(dt);simulation.push(performance.now()-mark);mark=performance.now();draw(dt);painting.push(performance.now()-mark);for(const [k,v]of Object.entries(game.trainTest?.drawCosts||{}))(stages[k]??=[]).push(v);}
  if(!options.cpu&&(frame.some(n=>n>5000)||stats(frame).mean>900))throw Error('Suspended/occluded run is invalid');
  return {id:scene.id,frames:frame.length,seconds:(previous-start)/1000,fps:options.cpu?null:frame.length/((previous-start)/1000),method:options.cpu?'CPU submit/update timings; task-driven, not FPS':'visible requestAnimationFrame delivery',frameMs:stats(frame),updateMs:stats(simulation),drawMs:stats(painting),stages:Object.fromEntries(Object.entries(stages).map(([k,a])=>[k,stats(a)])),hitches50:frame.filter(n=>n>50).length,hitches100:frame.filter(n=>n>100).length,players:game.players.length,enemies:game.enemies.length,props:game.scenery.length,canvas:[canvas.width,canvas.height],loading:!!game.trainTest?.preparing,image:canvas.toDataURL()};
 },dispose(){if(game?.trainTest)stopRailwayStream(game.trainTest);renderer.clearSplitRenderers();}};
}
