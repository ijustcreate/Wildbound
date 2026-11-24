import test from 'node:test';
import assert from 'node:assert/strict';
import {defaultTrainDesign} from '../src/train-design.mjs';
import {buildTrainRoute,sampleTrainRoute,trainCars} from '../src/train-track.mjs';
import {railwaySurface} from '../src/railway-water.mjs';
import {bridgeSupportAt,railSpanBroken,railwayBridgeState,damageRailwayBridge,tickTrainBridgeWater,resetRailwayBridges} from '../src/train-bridges.mjs';
import {drawTrackBridgeReflection,drawTrackBridgeRipples,trackBridgePiers} from '../src/train-bridge-art.mjs';
import {damageStructureMelee} from '../src/structure-destruction.mjs';
import {updateTrainWater} from '../src/train-test.mjs';
function setup(){const d=defaultTrainDesign(),route=buildTrainRoute(d),t={design:d,route,otherRoutes:[],distance:0,speed:90,engine:true,throttle:1,time:0,particles:[]};let q;for(let s=24;s<route.length;s+=48){const p=sampleTrainRoute(route,s);if(railwaySurface(d,p.x,p.y)==='water'){q=p;break;}}assert.ok(q);const p={x:q.x,y:q.y,faceX:Math.cos(q.a),faceY:Math.sin(q.a),hp:100};const sounds=[],g={trainTest:t,players:[p],effects:[],onSound:event=>sounds.push(event)};return {g,t,p,q,sounds};}
function breakSpan(g,p,q){p.x=q.x;p.y=q.y;for(let i=0;i<4;i++)assert.equal(damageStructureMelee(g,p,50,35,true),true);}
test('ordinary sword destruction removes the bridge support and deck, including under a walker',()=>{const {g,t,p,q}=setup();assert.ok(bridgeSupportAt(t,q.x,q.y));p.trainDeck=true;updateTrainWater(t,p);assert.equal(p.swimming,false);breakSpan(g,p,q);assert.ok(railSpanBroken(t.design,t.route,q.s));assert.equal(bridgeSupportAt(t,q.x,q.y),false);updateTrainWater(t,p);assert.equal(p.trainDeck,false);assert.equal(p.trainGround,0);assert.equal(p.swimming,true);assert.equal(p.underBridge,false);});
test('swimming below a deck and distant sword strikes cannot destroy it',()=>{const {g,t,p,q}=setup();p.underBridge=true;assert.equal(damageRailwayBridge(g,p,100,50,true),false);p.underBridge=false;p.x+=500;assert.equal(damageRailwayBridge(g,p,100,35,true),false);assert.equal(railSpanBroken(t.design,t.route,q.s),false);});
test('a moving train detects a broken span between frames, ejects riders and splashes carriages as they reach water',()=>{const {g,t,p,q,sounds}=setup();breakSpan(g,p,q);p.trainRide={car:0,x:-60,y:20};const before=q.s-t.design.cars[0].length*.32-25;t.distance=before+50;tickTrainBridgeWater(g,.05,before);assert.ok(t.derailed);assert.equal(p.trainRide,undefined);assert.equal(t.engine,false);assert.equal(t.speed,0);assert.ok(t.derailed.cars.some(c=>c.splashed));assert.ok(t.derailed.cars.some(c=>!c.splashed),'coaches on the bank do not sink through the land');for(let i=0;i<400;i++)tickTrainBridgeWater(g,.05,t.distance);assert.ok(trainCars(t).every(c=>c.sink===1));assert.equal(sounds.filter(s=>s==='splash').length,5);assert.ok(trainCars(t).every(c=>railwaySurface(t.design,c.x,c.y)==='water'));assert.ok(trainCars(t).every(c=>(c.effects.waterParticles||[]).length<=120));});
test('intact bridges support a moving train; repair restores destroyed support with a new visual revision',()=>{const {g,t,q}=setup();t.distance=q.s-60;tickTrainBridgeWater(g,.05,t.distance-8);assert.equal(t.derailed,undefined);const state=railwayBridgeState(t.design);state.broken.add(t.route.id+':'+Math.floor(q.s/48));state.revision++;const revision=state.revision;resetRailwayBridges(t.design);assert.ok(bridgeSupportAt(t,q.x,q.y));assert.ok(state.revision>revision);assert.equal(state.broken.size,0);});

test('support ripples animate at wet feet and disappear with the broken span',()=>{
 const {t}=setup(),{design:d,route}=t;
 const pier=Array.from({length:Math.floor(route.length/96)},(_,i)=>sampleTrainRoute(route,i*96))
  .find(q=>trackBridgePiers(d,q,10).every(p=>p.wet));
 assert.ok(pier);
 const bounds={left:pier.x-44,right:pier.x+44,top:pier.y-60,bottom:pier.y+60};
 const feet=trackBridgePiers(d,pier,10).map(p=>p.foot);
 const collect=time=>{
  const marks=[];
  const c={globalAlpha:1,save(){},restore(){},fillRect(x,y,w,h){
   if(feet.some(p=>Math.hypot(p.x-x,p.y-y)<30))marks.push({x,y,w,h,alpha:this.globalAlpha});
  }};
  drawTrackBridgeRipples(c,d,route,bounds,time);
  return marks;
 };
 const early=collect(.3),later=collect(.65);
 assert.ok(early.length>0&&later.length>0);
 assert.notDeepEqual(early,later);
 assert.ok(early.every(({x,y,w})=>railwaySurface(d,x,y)!=='grass'&&railwaySurface(d,x+w,y)!=='grass'));
 railwayBridgeState(d).broken.add(route.id+':'+Math.floor(pier.s/48));
 assert.deepEqual(collect(.3),[]);
});

test('the rail bridge donor starts at wet pier feet and omits dry and broken spans',()=>{
 const d=defaultTrainDesign(),riverX=d.river.x,y=1600;
 const routeAt=(id,x,z)=>({id,length:48,points:[{x,y,z,s:0},{x:x+48,y,z,s:48}]});
 const collect=(route,left)=>{
  const marks=[],faces=[];
  const c={save(){},restore(){},fillRect(x,y,w,h){marks.push({x,y,w,h});},beginPath(){faces.push([]);},moveTo(x,y){faces.at(-1).push({x,y});},lineTo(x,y){faces.at(-1).push({x,y});},closePath(){},fill(){}};
  const pieces=drawTrackBridgeReflection(c,d,route,{left:left-60,right:left+100,top:y-65,bottom:y+100});
  return {pieces,marks,faces};
 };
 const route=routeAt('wet-reflection',riverX,0),pier=sampleTrainRoute(route,0);
 const wet=collect(route,riverX);
 assert.ok(wet.pieces>0&&wet.faces.length>0);
 for(const {foot} of trackBridgePiers(d,pier,10)){
  const shadow=wet.marks.find(m=>m.x===foot.x-5&&m.y===foot.y&&m.w===10);
  assert.ok(shadow&&shadow.h>0&&shadow.h<24);
 }
 assert.ok(wet.faces.flat().every(p=>p.y>y+43));
 assert.equal(collect(routeAt('dry-reflection',100,24),100).pieces,0);
 railwayBridgeState(d).broken.add(route.id+':0');
 assert.equal(collect(route,riverX).pieces,0);
});
