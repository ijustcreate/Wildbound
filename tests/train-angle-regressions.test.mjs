import test from 'node:test';
import assert from 'node:assert/strict';
import {paintTrainMachinery} from '../src/train-craft.mjs';
import {drawTrainPart} from '../src/train-art.mjs';
import {defaultTrainDesign,trainInterior} from '../src/train-design.mjs';
import {trainOcclusionGeometry} from '../src/train-occlusion-geometry.mjs';

test('engine faces and fittings face the camera through eight headings',()=>{
 const d=defaultTrainDesign();
 for(let v=0;v<8;v++){
  const car={...d.cars[0],a:v*Math.PI/4},polys=[],all=[],p={poly(points,color){polys.push({points,color});all.push(points);},line(points){all.push(points);},box(x,y,z,w,h,depth){all.push([[x,y,z],[w,h,depth]]);}};
  paintTrainMachinery(p,car,d.paint);
  assert.ok(all.flat(2).every(Number.isFinite));
  assert.equal(polys.some(q=>q.color==='#405056'),Math.sin(car.a)>=-1e-6,'smokebox view '+v);
  assert.equal(polys.some(q=>q.points.length>=13&&q.points.every(p=>p[0]===-car.length*.02-.5)),Math.sin(car.a)<-1e-6,'closed rear boiler cap view '+v);
  const fittings=polys.filter(q=>q.color==='#ead09b'||q.color==='#080f15').map(q=>q.points.reduce((s,p)=>s+p[0],0)/q.points.length);
  assert.equal(fittings.length,3);
  if(Math.abs(Math.sin(car.a))>1e-6)for(let i=1;i<fittings.length;i++)assert.ok(Math.sin(car.a)*(fittings[i]-fittings[i-1])>=-1e-6,'fitting order view '+v);
  const faces=polys.filter(q=>q.points.length===4&&q.points.some(p=>p[0]===-car.length*.02)&&q.points.some(p=>p[0]===car.length*.42));
  assert.ok(faces.length>0);
  for(const face of faces){const y=(face.points[0][1]+face.points[2][1])/2,z=(face.points[0][2]+face.points[2][2])/2-40;assert.ok(Math.cos(car.a)*y+z>0,'hidden boiler face view '+v);}
 }
});
test('coal is drawn between the far and near bunker walls in eight headings',()=>{
 const d=defaultTrainDesign();
 for(let v=0;v<8;v++){
  const car={...d.cars[1],a:v*Math.PI/4},calls=[],ctx={globalAlpha:1,save(){},restore(){}};
  drawTrainPart(ctx,d,car,'body',{primitiveSink:p=>calls.push(p),occlusionCapture:true});
  const coal=calls.findIndex(p=>p.kind==='coal');assert.ok(coal>=0);
  const walls=calls.map((p,i)=>({p,i})).filter(({p})=>p.kind==='poly'&&p.color===d.paint.body&&p.points.every(q=>q[2]===41));
  assert.equal(walls.length,4);
  for(const {p,i}of walls){const x=p.points.reduce((s,p)=>s+p[0],0)/4,y=p.points.reduce((s,p)=>s+p[1],0)/4,near=Math.sin(car.a)*x+Math.cos(car.a)*y>=-1e-6;assert.equal(i>coal,near,'coal lip view '+v);}
 }
});
test('far handrails sit behind the chimney and near handrails stay in front',()=>{
 const d=defaultTrainDesign();
 for(const v of[1,3,5,7]){
  const car={...d.cars[0],a:v*Math.PI/4},calls=[],p={poly(points,color){calls.push({points,color,kind:'poly'});},line(points,color,width){calls.push({points,color,width,kind:'line'});},box(){}};
  paintTrainMachinery(p,car,d.paint);const mouth=calls.findIndex(c=>c.color==='#080f15');assert.ok(mouth>=0);
  const pipes=calls.map((c,i)=>({c,i})).filter(({c})=>c.kind==='line'&&c.width===2&&c.points.length===4);
  assert.equal(pipes.length,2);
  for(const {c,i}of pipes){const near=c.points[0][1]*Math.cos(car.a)>0;assert.equal(i>mouth,near,'pipe/chimney view '+v);}
 }
});
test('seated visitors keep their bench exception separate from other foreground masks',()=>{
 const d=defaultTrainDesign(),car={...d.cars[2],a:Math.PI/4,index:2},ctx={globalAlpha:1,save(){},restore(){}},options={time:0,riders:[],doors:{},occlusionFrame:{parts:new Map()}};
 const normal=trainOcclusionGeometry(ctx,d,car,'furniture',options),seat=trainInterior(d,car).find(o=>o.kind==='seat').id;
 const excluded=trainOcclusionGeometry(ctx,d,car,'furniture',{...options,omitFurnitureId:seat});
 assert.ok(excluded.vertices<normal.vertices);
 assert.equal(trainOcclusionGeometry(ctx,d,car,'furniture',options),normal);
 assert.equal(options.occlusionFrame.parts.size,2);
});
