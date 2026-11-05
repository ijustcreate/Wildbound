import test from 'node:test';
import assert from 'node:assert/strict';
import {sortTrainFurniturePieces,trainFurniturePainter} from '../src/train-furniture-order.mjs';
const seat={id:'seat',bounds:{x0:4.5,x1:26.5,y0:-39,y1:-5,z0:20,z1:27}};
const top={id:'top',bounds:{x0:-7,x1:7,y0:-36,y1:-14,z0:31,z1:34}};
for(let view=0;view<8;view++)test('raised tabletop covers the overlapping lower seat at heading '+view,()=>{const sorted=sortTrainFurniturePieces([top,seat],view*Math.PI/4);assert.deepEqual(sorted.map(p=>p.id),['seat','top']);});
test('near and far upright furniture keep their physical depth',()=>{const back={id:'wall',bounds:{x0:-40,x1:40,y0:-49,y1:-43,z0:20,z1:57}};assert.deepEqual(sortTrainFurniturePieces([seat,back],0).map(p=>p.id),['wall','seat']);assert.deepEqual(sortTrainFurniturePieces([seat,back],Math.PI).map(p=>p.id),['seat','wall']);});
test('intersecting custom pieces render exactly once in a stable order',()=>{const pieces=Array.from({length:15},(_,i)=>({id:i,bounds:{x0:i-20,x1:i+20,y0:-30+i,y1:30-i,z0:i,z1:60-i}})),first=sortTrainFurniturePieces(pieces,.7);assert.equal(new Set(first).size,pieces.length);assert.deepEqual(first,sortTrainFurniturePieces(pieces,.7));});
test('native primitive calls are replayed with their original colors and dimensions',()=>{const calls=[],p={box(...args){calls.push(args);}},q=trainFurniturePainter(p,{a:0});q.box(0,-25,31,14,22,3,'#ad8055',true);q.box(15.5,-22,20,22,34,7,'#a44250',true);q.flush();assert.equal(calls.length,2);assert.equal(calls[0][6],'#a44250');assert.equal(calls[1][6],'#ad8055');assert.deepEqual(calls[1].slice(0,6),[0,-25,31,14,22,3]);});
