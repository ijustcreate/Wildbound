import assert from 'node:assert/strict';
import test from 'node:test';
import {alleyBlocked} from '../src/diagon-alley.mjs';
import {interactGardenBench} from '../src/diagon-garden-benches.mjs';
import {clearGardenCats,gardenCatsFor,tickGardenCats} from '../src/diagon-garden-cats.mjs';
import {GARDEN_BENCHES,gardenBenchSeatPoint} from '../src/diagon-garden-layout.mjs';

const dt=.05;
const span=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function scene(time,random=()=>.5){
 return {time,random,trainTest:{design:{activeRoom:'diagon',wildLands:true}},players:[]};
}
function advance(g,blocked){
 g.time+=dt;
 tickGardenCats(g,dt,blocked);
 return gardenCatsFor(g);
}

test('a garden cat walks to either end of every bench, sits by the player and walks back',()=>{
 for(const bench of GARDEN_BENCHES)for(const side of [-1,1])for(const time of [0,37.5]){
  const name=bench.id+' '+side+' at '+time;
  const g=scene(time),p={id:1,hp:20,...gardenBenchSeatPoint(bench,side)};
  g.players.push(p);
  const blocked=(x,y,r)=>alleyBlocked(g,x,y,r);
  assert.ok(interactGardenBench(g,p,blocked),name);
  let before=gardenCatsFor(g),sitter;
  const moved=new Set();
  for(let step=0;step<520&&!sitter;step++){
   const cats=advance(g,blocked);
   for(const [index,cat] of cats.entries())if(cat.gardenVisit){
    assert.ok(!blocked(cat.x,cat.y,4),name+' clears the garden props');
    assert.ok(span(cat,before[index])<=3,name+' approaches continuously');
    if(cat.moving&&span(cat,before[index])>0)moved.add(cat.id);
   }
   sitter=cats.find(cat=>cat.gardenVisit&&cat.idle==='sit');
   before=cats.map(({x,y})=>({x,y}));
  }
  assert.ok(sitter&&moved.has(sitter.id),name+' reaches a seated pose after walking');
  assert.ok((sitter.x-p.x)*side>0&&span(sitter,p)<30,name+' sits next to the occupied bench end');
  const {x,y}=sitter;
  const rest=advance(g,blocked).find(cat=>cat.id===sitter.id);
  assert.equal(rest.idle,'sit');
  assert.equal(span({x,y},rest),0);
  assert.ok(interactGardenBench(g,p,blocked));
  assert.equal(advance(g,blocked).find(cat=>cat.id===sitter.id).moving,true);
  let returned=false;
  for(let step=0;step<420&&!returned;step++){
   const cat=advance(g,blocked).find(cat=>cat.id===sitter.id);
   if(cat.gardenVisit)assert.ok(!blocked(cat.x,cat.y,4),name+' clears the props on departure');
   returned=!cat.gardenVisit;
  }
  assert.ok(returned,name+' returns to its normal route');
 }
});

test('cat visits vary, support two bench occupants, and reset on leaving the garden',()=>{
 const g=scene(0,()=>.95),bench=GARDEN_BENCHES[1];
 const blocked=(x,y,r)=>alleyBlocked(g,x,y,r);
 assert.deepEqual(gardenCatsFor(g).map(cat=>cat.catCoat),['calico','silver-tabby','black','seal-point']);
 for(const side of [-1,1]){
  const p={id:side,hp:20,...gardenBenchSeatPoint(bench,side)};
  g.players.push(p);
  assert.ok(interactGardenBench(g,p,blocked));
 }
 for(let step=0;step<300;step++)assert.ok(!advance(g,blocked).some(cat=>cat.gardenVisit));
 g.random=()=>.5;
 let pair;
 for(let step=0;step<900;step++){
  const cats=advance(g,blocked).filter(cat=>cat.gardenVisit&&cat.idle==='sit');
  if(cats.length===2){pair=cats;break;}
 }
 assert.ok(pair);
 for(const p of g.players)assert.equal(pair.filter(cat=>(cat.x-p.x)*p.gardenBench.seat>0&&span(cat,p)<30).length,1);
 clearGardenCats(g);
 assert.ok(!gardenCatsFor(g).some(cat=>cat.gardenVisit));
});
