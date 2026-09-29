import test from 'node:test';
import assert from 'node:assert/strict';
import {solveTwoBone,ikChain} from '../src/ik.mjs';
import {capeRows} from '../src/cape-motion.mjs';
import {ITEMS,itemKind} from '../src/items.mjs';
import {defaultPlayerMotion,poseAt,setJointKey,validatePlayerMotion} from '../src/player-motion.mjs';
const distance=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));
test('IK preserves segment lengths, bends either way and clamps unreachable targets',()=>{
 for(const target of [[5,0,-5],[100,0,0],[0,0,0]])for(const bend of [-1,1]){
  const r=solveTwoBone([0,0,0],[0,3,-4],[0,0,-8],target,[5,5],bend);
  assert.ok(Math.abs(distance([0,0,0],r.mid)-5)<1e-5);
  assert.ok(Math.abs(distance(r.mid,r.end)-5)<1e-5);
  assert.ok(r.end.every(Number.isFinite));
 }
});
test('Saved IK chains solve interpolated runtime poses without mutating keys',()=>{
 const m=defaultPlayerMotion();m.ik={footR:ikChain(m,'footR')};
 setJointKey(m,'run',2,'footR',[7,9,4]);const before=JSON.stringify(m);
 assert.ok(validatePlayerMotion(m));
 const a=distance(m.joints.hipR.position,m.joints.kneeR.position),b=distance(m.joints.kneeR.position,m.joints.footR.position);
 for(let f=0;f<8;f+=.25){const p=poseAt(m,'run',f);assert.ok(Math.abs(distance(p.hipR,p.kneeR)-a)<1e-5);assert.ok(Math.abs(distance(p.kneeR,p.footR)-b)<1e-5);}
 assert.equal(JSON.stringify(m),before);m.ik.footR.root='missing';assert.equal(validatePlayerMotion(m),false);
});
test('Cape shoulders stay pinned while running hem trails, curls and changes with time',()=>{
 const top=[0,0,23],bottom=[0,0,15];
 const idle=capeRows(top,bottom,{},0),run=capeRows(top,bottom,{moving:true},0),later=capeRows(top,bottom,{moving:true},.4);
 assert.deepEqual(idle[0],run[0]);assert.deepEqual(run[0].left,later[0].left);
 assert.notDeepEqual(run.at(-1),later.at(-1));
 assert.ok(run.at(-1).left[1]<idle.at(-1).left[1]);
 assert.ok(run.flatMap(r=>[...r.left,...r.right]).every(Number.isFinite));
});
test('New cape silhouettes have distinct lengths, ragged hems and pointed tips',()=>{
 const top=[0,0,23],bottom=[0,0,15];
 const standard=capeRows(top,bottom,{},0),short=capeRows(top,bottom,{},0,'short'),long=capeRows(top,bottom,{},0,'tattered'),pointed=capeRows(top,bottom,{},0,'pointed');
 assert.ok(long.at(-1).left[2]<standard.at(-1).left[2]);assert.ok(short.at(-1).left[2]>standard.at(-1).left[2]+8);
 assert.ok(pointed.at(-1).right[0]-pointed.at(-1).left[0]<1);
 assert.ok(long.at(-1).segments.length<10);assert.ok(long.some(r=>r.segments.some(s=>s.hem)));
 for(const id of ['tattered_cape','short_cape','pointed_cape']){assert.equal(itemKind(id),'cape');assert.equal(ITEMS[id].slot,'cape');}
 const run=capeRows(top,bottom,{moving:true},0);assert.ok(run.at(-1).left[2]>standard.at(-1).left[2]+4);
});
