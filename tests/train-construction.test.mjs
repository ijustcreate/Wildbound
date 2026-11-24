import test from 'node:test';
import assert from 'node:assert/strict';
import {trainEngineProfile} from '../src/train-construction.mjs';
import {trainShadowPolygons,drawTrainShadows} from '../src/train-shadows.mjs';

const car={kind:'engine',length:240,width:96,x:500,y:300,z:0,a:0};
test('narrower boiler keeps its base and chimney seated on the engine',()=>{
 const p=trainEngineProfile(car);
 assert.equal(p.radius,car.width*.34);
 assert.ok(p.centerZ-p.radius<20);
 assert.equal(p.stackTop-p.top,26);
});
test('train shadows project finite pixel silhouettes at eight headings and bridge heights',()=>{
 for(let i=0;i<8;i++)for(const kind of['engine','tender','seats','compartments','caboose']){
  const c={...car,kind,a:i*Math.PI/4},ground=trainShadowPolygons(c),raised=trainShadowPolygons({...c,z:60});
  assert.ok(ground.length>=2);
  for(const poly of raised){assert.ok(poly.length>=4);assert.ok(poly.every(p=>Number.isInteger(p.x)&&Number.isInteger(p.y)));}
  assert.ok(Math.max(...raised.flat().map(p=>p.x))>Math.max(...ground.flat().map(p=>p.x)));
 }
 assert.deepEqual(trainShadowPolygons({...car,sink:1}),[]);
});
test('overlapping train shadow silhouettes use one fill without ellipses',()=>{
 let fills=0,polygons=0;
 const c={globalAlpha:1,save(){},restore(){},beginPath(){},moveTo(){polygons++;},lineTo(){},closePath(){},fill(){fills++;}};
 drawTrainShadows(c,[car,{...car,x:650,kind:'caboose'}]);
 assert.equal(fills,1);assert.ok(polygons>=7);
});
