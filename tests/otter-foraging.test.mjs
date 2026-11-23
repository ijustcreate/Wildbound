import test from 'node:test';
import assert from 'node:assert/strict';
import {tickOtterForage,OTTER_FORAGE_STAGES} from '../src/otter-foraging.mjs';
import {defaultOtterMotion,validateOtterMotion} from '../src/otter-motion.mjs';
import {poseAt} from '../src/player-motion.mjs';
const otter=()=>({id:20,kind:'river_otter',hp:44,swimming:true,otterForage:{stage:0,wait:0,age:0}});
test('otter forages through a submerged dive, returns with a clam and holds it on its belly before swimming away',()=>{
 const e=otter(),seen=new Set();let wet=false,held=false;
 for(let i=0;i<1100;i++){tickOtterForage(e,1/60);seen.add(e.animationAction);if(e.animationAction==='underwater'){assert.equal(e.otterDiveDepth,1);assert.equal(e.otterFind,undefined);wet=true;}if(e.animationAction==='belly_float'){assert.equal(e.otterFind,'clam');assert.equal(e.otterDiveDepth,0);held=true;}}
 for(const {action}of OTTER_FORAGE_STAGES)assert.ok(seen.has(action),action);assert.ok(wet&&held);assert.equal(e.otterForage.stage,0);assert.equal(e.otterFind,undefined);assert.equal(e.animationAction,'swim');
});
test('a saved mid-dive resumes identically and different frame rates preserve forage timing',()=>{
 const e=otter();for(let i=0;i<65;i++)tickOtterForage(e,1/60);const restored=JSON.parse(JSON.stringify(e));for(let i=0;i<500;i++){tickOtterForage(e,1/60);tickOtterForage(restored,1/60);}assert.deepEqual(restored,e);
 const variants=[30,60,120].map(fps=>{const a=otter();for(let i=0;i<10*fps;i++)tickOtterForage(a,1/fps);return a;});for(const a of variants){assert.equal(a.animationAction,'belly_float');assert.ok(Math.abs(a.otterForage.age-variants[0].otterForage.age)<1e-6);}
});
test('freeze pauses the dive; threats, leaving water and death clear finds and submerged state',()=>{
 const e=otter();for(let i=0;i<100;i++)tickOtterForage(e,1/60);e.frozen=2;const frozen=JSON.stringify(e.otterForage);tickOtterForage(e,1);assert.equal(JSON.stringify(e.otterForage),frozen);e.frozen=0;
 for(const changes of [{swimming:false},{hp:0},{}]){const a={...otter(),otterFind:'clam',otterDiveDepth:1,...changes};assert.equal(tickOtterForage(a,.1,{threatened:!Object.keys(changes).length}),false);assert.equal(a.otterFind,undefined);assert.equal(a.otterDiveDepth,undefined);}
});
test('editable otter rig exposes tail, face, paws and find with distinct articulated swimming and back-floating clips',()=>{
 const m=defaultOtterMotion();assert.ok(validateOtterMotion(m));for(const name of ['tailBase','tailMid','tailTip','tailEnd','muzzle','eyeL','eyeR','frontPawL','frontPawR','find'])assert.ok(m.joints[name]);
 const swim=poseAt(m,'swim',0),stroke=poseAt(m,'swim',8),floating=poseAt(m,'belly_float',0);assert.notDeepEqual(swim.tailTip,stroke.tailTip);assert.notDeepEqual(swim.frontPawL,stroke.frontPawL);assert.ok(floating.belly[2]>floating.chest[2]);assert.ok(Math.abs(floating.frontPawL[1]-floating.find[1])<4);assert.ok(Math.abs(floating.frontPawR[1]-floating.find[1])<4);
 const custom=structuredClone(m);custom.clips.swim.keys[5].joints.tailTip[0]+=4;assert.ok(validateOtterMotion(custom));
});
