import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {drawHumanHead,skinPalette} from '../src/human-head.mjs';
import {drawHair,DEFAULT_APPEARANCE,HAIR_STYLES} from '../src/appearance.mjs';
import {drawPlayer,directionVector,projectPoint} from '../src/player-motion.mjs';
import {paintItem} from '../src/item-art.mjs';
import {ITEMS} from '../src/items.mjs';

const model=JSON.parse(fs.readFileSync(new URL('../authored/rigs.json',import.meta.url))).player;
function raster(){
  const pixels=new Map();
  return {pixels,save(){},restore(){},translate(){},rotate(){},scale(){},fillRect(x,y,w,h){
    assert.ok([x,y,w,h].every(Number.isFinite));assert.ok(w>=0&&h>=0);
    for(let yy=Math.round(y);yy<y+h;yy++)for(let xx=Math.round(x);xx<x+w;xx++)pixels.set(`${xx},${yy}`,this.fillStyle);
  }};
}
test('Profile noses protrude beyond the skull and ears survive the hair pass',()=>{
  for(const d of [2,6]){
    const p=Object.fromEntries(Object.entries(model.joints).map(([key,value])=>[key,projectPoint(value.position,d)]));
    const c=raster(),visible=n=>model.visibility[n]?.[d]!==false;
    drawHumanHead(c,p,d,DEFAULT_APPEARANCE.skin,DEFAULT_APPEARANCE,visible);
    drawHair(c,p.head,DEFAULT_APPEARANCE,d);
    drawHumanHead(c,p,d,DEFAULT_APPEARANCE.skin,DEFAULT_APPEARANCE,visible,true);
    const sign=d===2?-1:1,pal=skinPalette(DEFAULT_APPEARANCE.skin);
    assert.equal(c.pixels.get(`${Math.round(p.head.x)+sign*6},${Math.round(p.head.y)+1}`),pal.base);
    assert.equal(c.pixels.get(`${Math.round(p.head.x)-sign},${Math.round(p.head.y)}`),pal.blush);
  }
});
test('Long hair follows the frame clock, while static poses remain static',()=>{
  for(const hair of ['long','ponytail']){
    const a=raster(),b=raster(),look={...DEFAULT_APPEARANCE,hair};
    drawHair(a,{x:0,y:0},look,6,0,'run');drawHair(b,{x:0,y:0},look,6,2,'run');
    assert.notDeepEqual(a.pixels,b.pixels);
    const c=raster(),d=raster();
    drawHair(c,{x:0,y:0},look,6,0,'sleep');drawHair(d,{x:0,y:0},look,6,2,'sleep');
    assert.deepEqual(c.pixels,d.pixels);
  }
});
test('All authored clips and hairstyles render every facing without mutating the rig',()=>{
  const original=JSON.stringify(model);
  const c={save(){},restore(){},translate(){},rotate(){},scale(){},fillRect(...values){assert.ok(values.every(Number.isFinite));}};
  for(const action of Object.keys(model.clips))for(const hair of Object.keys(HAIR_STYLES))for(let d=0;d<8;d++){
    const [faceX,faceY]=directionVector(d);
    drawPlayer(c,{faceX,faceY,appearance:{...DEFAULT_APPEARANCE,hair},equipment:{hand1:'iron_sword',hand2:'moon_shield'},animationAction:action,playerFrame:model.clips[action].length/2},.1,model);
  }
  assert.equal(JSON.stringify(model),original);
});
test('Every equipment icon renders, including the whip detail helper',()=>{
  const c=raster();
  for(const [id,item] of Object.entries(ITEMS))if(item.slot)assert.doesNotThrow(()=>paintItem(c,id),id);
});
