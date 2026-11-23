import test from 'node:test';
import assert from 'node:assert/strict';
import {shadeCarPixels} from '../src/car-pixel-shader.mjs';
import {carRoofGeometry} from '../src/car-roof.mjs';
import {carCabinWindows} from '../src/car-interior.mjs';
import {carWheelArchPoints,carProject,CAR_BODY_CLEARANCE} from '../src/car-art.mjs';

test('car pixel shading removes translucent polygon fringes while preserving distinct material hues',()=>{
 const pixels=new Uint8ClampedArray([79,115,101,255,234,181,137,200,90,120,80,127,11,22,33,0]);
 shadeCarPixels(pixels);
 assert.deepEqual([...pixels.slice(0,4)],[80,112,104,255]);
 assert.deepEqual([...pixels.slice(4,8)],[232,184,136,255]);
 assert.equal(pixels[11],0);assert.equal(pixels[15],0);
 const once=[...pixels];shadeCarPixels(pixels);assert.deepEqual([...pixels],once);
});

test('chamfered roof and both windscreens share their attachment points across car sizes',()=>{
 for(const [w,h]of [[80,128],[96,144],[120,180]]){
  const v={w,h,heading:0},roof=carRoofGeometry(v),windows=carCabinWindows(v);
  assert.equal(roof.base.length,8);assert.equal(roof.crown.length,8);
  assert.deepEqual(windows[0].corners[2],roof.base[1]);assert.deepEqual(windows[0].corners[3],roof.base[0]);
  assert.deepEqual(windows[1].corners[0],roof.base[5]);assert.deepEqual(windows[1].corners[1],roof.base[4]);
  for(let i=0;i<8;i++){assert.ok(roof.crown[i][2]>roof.base[i][2]);assert.ok(Math.abs(roof.crown[i][0])<Math.abs(roof.base[i][0]));}
 }
});


test('roof crown spans the passenger cabin and wheel surrounds end on a curved sill opening',()=>{
 const v={x:0,y:0,w:80,h:128,heading:Math.PI/2},roof=carRoofGeometry(v);
 const xs=roof.crown.map(p=>p[0]),ys=roof.crown.map(p=>p[1]);
 assert.ok(CAR_BODY_CLEARANCE>=8,'body has a visible ground gap');
 assert.ok(Math.max(...xs)-Math.min(...xs)>50,'wide roof crown');
 assert.ok(Math.max(...ys)-Math.min(...ys)>34,'long roof crown');
 for(const side of[-1,1])for(const axle of[-1,1]){
  const points=carWheelArchPoints(v,side,axle),y=axle<0?-v.h*.3:v.h*.28;
  const a=carProject(v,side*v.w*.47,y-Math.sqrt(144-(CAR_BODY_CLEARANCE-10)**2),CAR_BODY_CLEARANCE),b=carProject(v,side*v.w*.47,y+Math.sqrt(144-(CAR_BODY_CLEARANCE-10)**2),CAR_BODY_CLEARANCE);
  assert.ok(Math.hypot(points[0].x-a.x,points[0].y-a.y)<1e-7);
  assert.ok(Math.hypot(points.at(-1).x-b.x,points.at(-1).y-b.y)<1e-7);
  for(let i=1;i<points.length-1;i++)assert.ok(points[i].y<points[0].y,'rounded opening rises from both sill ends');
 }
});
