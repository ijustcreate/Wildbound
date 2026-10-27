import test from 'node:test';import assert from 'node:assert/strict';
import {buildCutoutMesh} from '../src/cutout-art.mjs';
const paint=(data,width,x,y,color)=>data.set(color,(y*width+x)*4);
test('Cutout retains material colors, touching regions and the source transparency topology',()=>{
 const data=new Uint8ClampedArray(12*12*4),colors=[[40,80,130,255],[180,140,90,255]];
 for(let y=2;y<10;y++)for(let x=2;x<10;x++)paint(data,12,x,y,colors[x<6?0:1]);
 const mesh=buildCutoutMesh(data,12,12);
 assert.equal(mesh.regions.length,2);assert.deepEqual(mesh.regions.map(r=>r.color).sort(),colors.sort());
 for(let i=0;i<144;i++)assert.equal(mesh.labels[i]>=0,data[i*4+3]>0);
 for(const region of mesh.regions)for(const cell of region.cells){
  const n=Math.floor(cell/12)*13+cell%12,points=[n,n+1,n+14,n+13];let area=0;
  for(let i=0;i<4;i++){const a=points[i]*2,b=points[(i+1)%4]*2;area+=mesh.vertices[a]*mesh.vertices[b+1]-mesh.vertices[b]*mesh.vertices[a+1];}
  assert.ok(area>0,'A shared cell must not invert or open a crack');
 }
});
test('Cutout keeps small eye details while limiting their contour movement',()=>{
 const data=new Uint8ClampedArray(8*8*4);
 for(let y=0;y<8;y++)for(let x=0;x<8;x++)paint(data,8,x,y,x<4?[210,170,110,255]:[50,95,140,255]);
 paint(data,8,2,3,[250,248,230,255]);
 const mesh=buildCutoutMesh(data,8,8),eye=mesh.regions.find(r=>r.color[0]===250);
 assert.equal(eye.cells.length,1);
 const n=3*9+2;for(const p of [n,n+1,n+10,n+9]){assert.ok(Math.abs(mesh.vertices[p*2]-p%9)<=.251);assert.ok(Math.abs(mesh.vertices[p*2+1]-Math.floor(p/9))<=.251);}
});
