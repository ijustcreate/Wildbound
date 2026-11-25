import test from 'node:test';
import assert from 'node:assert/strict';
import {drawPalmFronds,drawPalmWood,palmStructure,palmTrunkPoint} from '../src/forest-palm-art.mjs';

test('seeded palms vary curved trunks and fronds while keeping their ground and collar anchors',()=>{
 const forms=[];
 for(let seed=1;seed<=40;seed++){
  const p={kind:'palm',x:150,y:200,size:85,seed};
  const form=palmStructure(p);
  assert.equal(palmStructure({...p,x:999,y:999}),form,'moving a seeded prop retains its form');
  assert.equal(Math.abs(palmTrunkPoint(form,0).x),0);
  assert.equal(Math.abs(palmTrunkPoint(form,0).y),0);
  assert.ok(Math.abs(palmTrunkPoint(form,9/form.height).x)<1.25,'the bend stays close to the cut pivot');
  assert.ok(form.trunkWidth>form.tipWidth);
  assert.equal(form.fronds.length,9);
  for(const frond of form.fronds){
   assert.deepEqual(frond.attachment,palmTrunkPoint(form,frond.collar));
   assert.ok(frond.collar>=.94&&frond.collar<=1);
   assert.ok(frond.length/form.spread>=24&&frond.length/form.spread<=37);
  }
  forms.push(form);
 }
 assert.ok(new Set(forms.map(form=>form.trunkWidth)).size>30);
 assert.ok(new Set(forms.map(form=>form.fronds[0].angle)).size>30);
 assert.ok(new Set(forms.map(form=>form.fronds[0].collar)).size>30);
});

test('palm wind moves frond rasters without repainting their leaves or the rooted trunk',()=>{
 const original=globalThis.OffscreenCanvas;
 let allocations=0,paintedPixels=0;
 globalThis.OffscreenCanvas=class {
  constructor(){allocations++;}
  getContext(){return {translate(){},setTransform(){},fillRect(){paintedPixels++;}};}
 };
 const moves=[];
 const c={save(){},restore(){},translate(){},fillRect(){},drawImage(){},transform(...matrix){moves.push(matrix);}};
 const p={kind:'palm',x:90,y:110,rootY:126,size:78,seed:9603,coconuts:2};
 const roots=pen=>pen.fillRect(0,0,1,1);
 try{
  drawPalmWood(c,p,roots);drawPalmFronds(c,p,0);
  const warmPaint=paintedPixels;
  assert.equal(allocations,2,'one trunk raster and one atlas for all nine fronds');
  assert.ok(warmPaint>0);
  const before=moves.slice();moves.length=0;
  for(let frame=1;frame<=48;frame++){
   drawPalmWood(c,p,roots);drawPalmFronds(c,p,frame/8);
  }
  assert.equal(allocations,2);
  assert.equal(paintedPixels,warmPaint);
  assert.notDeepEqual(moves.slice(0,9),before);
  assert.ok(moves.every(matrix=>matrix[4]===0&&matrix[5]===0),'wind stays pinned at each frond socket');
 }finally{
  if(original===undefined)delete globalThis.OffscreenCanvas;
  else globalThis.OffscreenCanvas=original;
 }
});
