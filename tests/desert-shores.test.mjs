import test from 'node:test';
import assert from 'node:assert/strict';
import {generateWorld} from '../src/world.mjs';
import {waterAt,isShallow} from '../src/environment.mjs';
import {palmStructure} from '../src/forest.mjs';
test('Natural sand-water borders become walkable mud, but pools do not',()=>{
 const g={terrain:Array(2500).fill('sand')};g.terrain[10*50+10]='water';assert.equal(waterAt(g,9*32+16,10*32+16),'mud');assert.ok(isShallow('mud'));assert.equal(waterAt(g,8*32+16,10*32+16),'sand');
 g.house={pools:[{x:320,y:320,w:32,h:32}]};assert.equal(waterAt(g,9*32+16,10*32+16),'sand');assert.equal(waterAt(g,336,336),'water');
});
test('Palms have stable seeded variation',()=>{const a={x:1,y:2},b={x:3,y:4};assert.deepEqual(palmStructure(a),palmStructure(a));assert.notDeepEqual(palmStructure(a),palmStructure(b));});
test('Desert quicksand forms a few large connected patches, not single tiles',()=>{
 for(const seed of [1,42,999]){const {terrain}=generateWorld(seed,'desert'),seen=new Set(),sizes=[];
 for(let i=0;i<2500;i++){if(terrain[i]!=='quicksand'||seen.has(i))continue;const queue=[i];seen.add(i);let size=0;while(queue.length){const id=queue.pop();size++;for(const n of [id-1,id+1,id-50,id+50])if(n>=0&&n<2500&&Math.abs(n%50-id%50)<=1&&terrain[n]==='quicksand'&&!seen.has(n)){seen.add(n);queue.push(n);}}sizes.push(size);}
 assert.equal(sizes.length,4);assert.ok(sizes.every(n=>n>=20),String(sizes));assert.equal(terrain[25*50+25],'sand');}
});
