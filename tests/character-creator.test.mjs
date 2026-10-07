import test from 'node:test';
import assert from 'node:assert/strict';
import {HAIR_STYLES,FACE_STYLES,DEFAULT_APPEARANCE,drawHair} from '../src/appearance.mjs';
import {creationButtonLabels,drawCreationPreview} from '../src/creation-preview.mjs';
import {drawHumanHead} from '../src/human-head.mjs';
const raster=()=>{const pixels=new Map();return {pixels,save(){},restore(){},clearRect(){},translate(){},scale(){},fillRect(x,y,w,h){assert.ok([x,y,w,h].every(Number.isFinite));for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)pixels.set(`${xx},${yy}`,this.fillStyle);}};};
test('Creator labels follow physical menu positions on Xbox, Switch and PlayStation',()=>{
 assert.equal(creationButtonLabels('xbox').choose,'A');assert.equal(creationButtonLabels('switch').choose,'B');
 assert.equal(creationButtonLabels('switch').back,'A');assert.equal(creationButtonLabels('switch').delete,'Y');
 assert.equal(creationButtonLabels('switch').shift,'X');assert.equal(creationButtonLabels('switch').done,'+');
 assert.equal(creationButtonLabels('playstation').choose,'Cross');
});
test('Nineteen hairstyles have distinct authored silhouettes and preserve legacy IDs',()=>{
 assert.equal(Object.keys(HAIR_STYLES).length,19);
 const signatures=Object.keys(HAIR_STYLES).map(hair=>{let all='';for(const direction of [0,2,4,6]){const c=raster();drawHair(c,{x:0,y:0},{...DEFAULT_APPEARANCE,hair},direction);all+=JSON.stringify([...c.pixels]);}return all;});
 assert.equal(new Set(signatures).size,19);
 for(const hair of ['none','crop','bob','long','ponytail','mohawk','curls'])assert.ok(HAIR_STYLES[hair]);
});
test('Close-up previews frame the head using integer pixel scaling',()=>{
 const a=drawCreationPreview(raster(),DEFAULT_APPEARANCE,{height:180});
 for(const mode of ['face','hair']){const b=drawCreationPreview(raster(),DEFAULT_APPEARANCE,{height:180,mode});assert.ok(b.scale>a.scale);assert.ok(Math.abs(b.headY-90)<10);assert.equal(b.scale,Math.round(b.scale));}
});
test('Additional face details are distinct without mutating appearance',()=>{
 const points={head:{x:0,y:0},earL:{x:-4,y:0},earR:{x:4,y:0},eyeL:{x:-2,y:-1},eyeR:{x:2,y:-1},nose:{x:0,y:1},mouth:{x:0,y:3}};
 const signatures=Object.keys(FACE_STYLES).map(face=>{const c=raster(),look={...DEFAULT_APPEARANCE,face};const before=JSON.stringify(look);drawHumanHead(c,points,0,look.skin,look,()=>true);drawHumanHead(c,points,0,look.skin,look,()=>true,true);assert.equal(JSON.stringify(look),before);return JSON.stringify([...c.pixels]);});
 assert.equal(new Set(signatures).size,Object.keys(FACE_STYLES).length);
});
