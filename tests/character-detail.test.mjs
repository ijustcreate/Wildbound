import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {drawHumanHead,skinPalette} from '../src/human-head.mjs';
import {drawHair,DEFAULT_APPEARANCE,HAIR_STYLES} from '../src/appearance.mjs';
import {drawPlayer,directionVector,projectPoint,playerPose,stabilizeSculptedEyes,alignWorkKnees} from '../src/player-motion.mjs';
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
test('Profile noses stay small and ears survive the hair pass',()=>{
  for(const d of [2,6]){
    const p=Object.fromEntries(Object.entries(model.joints).map(([key,value])=>[key,projectPoint(value.position,d)]));
    const c=raster(),visible=n=>model.visibility[n]?.[d]!==false;
    drawHumanHead(c,p,d,DEFAULT_APPEARANCE.skin,DEFAULT_APPEARANCE,visible);
    drawHair(c,p.head,DEFAULT_APPEARANCE,d);
    drawHumanHead(c,p,d,DEFAULT_APPEARANCE.skin,DEFAULT_APPEARANCE,visible,true);
    const sign=d===2?-1:1,pal=skinPalette(DEFAULT_APPEARANCE.skin);
    assert.equal(c.pixels.get(`${Math.round(p.head.x)+sign*4},${Math.round(p.head.y)}`),pal.light);
    assert.equal(c.pixels.get(`${Math.round(p.head.x)-sign},${Math.round(p.head.y)}`),pal.blush);
  }
});
test('Sculpted eyes remain on the face when old animation tracks drift',()=>{
  for(const d of [0,1,2,6,7]){
    const points=Object.fromEntries(Object.entries(model.joints).map(([key,value])=>[key,projectPoint(value.position,d)]));
    const drifted=structuredClone(points),visible=n=>model.visibility[n]?.[d]!==false;
    for(const name of ['eyeL','eyeR']){drifted[name].x+=4;drifted[name].y-=5;}
    const a=raster(),b=raster();
    stabilizeSculptedEyes(points,model,d);stabilizeSculptedEyes(drifted,model,d);
    drawHumanHead(a,points,d,DEFAULT_APPEARANCE.skin,DEFAULT_APPEARANCE,visible,true);
    drawHumanHead(b,drifted,d,DEFAULT_APPEARANCE.skin,DEFAULT_APPEARANCE,visible,true);
    assert.deepEqual(a.pixels,b.pixels,`facing ${d}`);
  }
});
test('Mining and woodcutting knees stay aligned between hips and feet',()=>{
  for(const action of ['mine','woodcut'])for(let frame=0;frame<model.clips[action].length;frame++)for(let d=0;d<8;d++){
    const [faceX,faceY]=directionVector(d);
    const pose=playerPose({animationAction:action,playerFrame:frame,faceX,faceY,equipment:{}},0,model);
    const points=Object.fromEntries(Object.entries(pose).map(([name,value])=>[name,projectPoint(value,d)]));
    alignWorkKnees(points,action);
    for(const side of ['L','R']){
      const hip=points['hip'+side].x,knee=points['knee'+side].x,foot=points['foot'+side].x;
      assert.ok(Math.abs(knee-(hip+foot)/2)<1.1,`${action} frame ${frame} facing ${d} leg ${side}`);
    }
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

test('Diagonal ears remain behind the cheek and covered styles do not paint skin over rear hair',()=>{
  for(const [d,earX] of [[1,3],[3,-4],[5,4],[7,-3]]){
    const p=Object.fromEntries(Object.entries(model.joints).map(([key,value])=>[key,projectPoint(value.position,d)]));
    const visible=n=>model.visibility[n]?.[d]!==false,c=raster();
    drawHumanHead(c,p,d,DEFAULT_APPEARANCE.skin,{...DEFAULT_APPEARANCE,hair:'none'},visible,true);
    assert.equal(c.pixels.get(`${Math.round(p.head.x)+earX},${Math.round(p.head.y)}`),skinPalette(DEFAULT_APPEARANCE.skin).blush);
    if(d===3||d===5)for(const hair of ['bob','long','curls']){
      const covered=raster();drawHumanHead(covered,p,d,DEFAULT_APPEARANCE.skin,{...DEFAULT_APPEARANCE,hair},visible,true);
      assert.equal(covered.pixels.size,0);
    }
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

test('Elf ears add pointed pixels beyond hair in every facing',()=>{
 for(let d=0;d<8;d++){
  const p=Object.fromEntries(Object.entries(model.joints).map(([key,value])=>[key,projectPoint(value.position,d)]));
  const visible=n=>model.visibility[n]?.[d]!==false;
  for(const hair of ['crop','long']){
   const normal=raster(),elf=raster();
   drawHumanHead(normal,p,d,DEFAULT_APPEARANCE.skin,{...DEFAULT_APPEARANCE,hair},visible,true);
   drawHumanHead(elf,p,d,DEFAULT_APPEARANCE.skin,{...DEFAULT_APPEARANCE,hair,face:'elf'},visible,true);
   assert.notDeepEqual(elf.pixels,normal.pixels,`facing ${d}, ${hair}`);
  }
 }
});

test('Every face-facing angle retains light eye whites and dark pupils after the nose pass',()=>{
 for(const d of [0,1,2,6,7]){
  const p=Object.fromEntries(Object.entries(model.joints).map(([key,value])=>[key,projectPoint(value.position,d)]));
  const c=raster(),visible=n=>model.visibility[n]?.[d]!==false;
  drawHumanHead(c,p,d,DEFAULT_APPEARANCE.skin,DEFAULT_APPEARANCE,visible,true);
  assert.ok([...c.pixels.values()].includes('#fff3df'));
  assert.ok([...c.pixels.values()].includes('#302b2b'));
  if(d===2||d===6){const sign=d===2?-1:1;assert.equal(c.pixels.get((sign*4)+','+(Math.round(p.head.y)-1)),'#302b2b');}
 }
});
