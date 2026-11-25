import test from 'node:test';
import assert from 'node:assert/strict';
import {grassFieldInstances} from '../src/grass-field.mjs';
import {generateWorld} from '../src/world.mjs';
import {routeDistance,clearingDistance,forestPavingAt} from '../src/forest-landscape.mjs';
import {meadowAllowed} from '../src/pixel-meadow.mjs';
import {realmWorld} from '../src/realm-layout.mjs';
import {wildLandsDesign} from '../src/wild-lands.mjs';
import {buildTrainRoute} from '../src/train-track.mjs';
import {wildLandsGround,wildLandsSurfaceAt} from '../src/wild-lands-world.mjs';
import {wildLandsPathAt} from '../src/wild-lands-geography.mjs';
import {WHEAT_HEAD,WHEAT_STEM} from '../src/wheat-grass.mjs';

test('shadow grass is dense and tall while leaving the clearing and void uncovered',()=>{
 const g={...realmWorld(42,'shadow'),seed:42,generatedEnvironment:'shadow'};
 const data=grassFieldInstances(g,{sx:0,sy:0,ex:1600,ey:1600},[]);assert.ok(data.length/8>15000);
 for(let i=0;i<data.length;i+=8){assert.equal(meadowAllowed(g,data[i],data[i+1],2),true);assert.ok(data[i+2]>=15&&data[i+2]<=30);assert.equal(data[i+7],1);}
 assert.equal(meadowAllowed(g,800,816),false);assert.equal(meadowAllowed({...g,terrain:Array(2500).fill('shadow_void')},400,400),false);
});

test('short meadow carpet respects water, paths, paving and the starting clearing',()=>{
 const g={...generateWorld(42,'forest'),seed:42};
 const data=grassFieldInstances(g);let short=0,tall=0;
 for(let i=0;i<data.length;i+=8){
  if(data[i+7]){tall++;assert.ok(data[i+2]>=12);continue;}
  short++;
  // Generation jitters each root by at most one world pixel.
  const x=data[i],y=data[i+1];
  assert.equal(g.terrain[Math.floor(y/32)*50+Math.floor(x/32)],'grass');
  assert.ok(routeDistance(g.forestLandscape,x,y)>=25);
  assert.ok(clearingDistance(x,y,g.seed)>=.95);
  assert.equal(forestPavingAt(g.forestLandscape,data[i],data[i+1]),false,`shader blades leave authored mosaic stones visible at ${data[i]},${data[i+1]}`);
 }
 assert.ok(short>10000&&short<65000,'visible-region low grass has continuous clustered coverage within a bounded density');
 assert.ok(tall>1000&&tall<15000,'cuttable tall patches use fewer, wider blades');
});

test('streamed meadow batches cover signed coordinates without exceeding their bounds',()=>{
 const g={...generateWorld(42,'forest'),seed:42,mapMode:'boundless',environment:'forest',generatedEnvironment:'forest'};
 for(const [sx,sy]of [[-768,512],[2304,512],[8704,-768]]){
  const data=grassFieldInstances(g,{sx,sy,ex:sx+256,ey:sy+256},[]);
  for(let i=0;i<data.length;i+=8){assert.ok(data[i]>=sx&&data[i]<sx+256&&data[i+1]>=sy&&data[i+1]<sy+256);assert.ok(meadowAllowed(g,data[i],data[i+1]));}
 }
});

test('mosaic stone footprints and their soft edge remain free of shader grass',()=>{
 const cells=new Array(24*24).fill(0);cells[12*24+12]=1;
 const plan={seed:9,paving:{cells},landmarks:[]};
 assert.equal(forestPavingAt(plan,800,816),true);
 assert.equal(forestPavingAt(plan,798,816),true,'mosaic footprint covers the painted tile');
 assert.equal(forestPavingAt(plan,795,816),false,'ground immediately beyond the edge stays natural');
 assert.equal(forestPavingAt({seed:9,landmarks:[{x:400,y:500,seed:10}],paving:{cells}},400,500),true);
});

test('cutting changes patch state while keeping shader geometry stable',()=>{
 const g={seed:42,terrain:Array(2500).fill('water'),forestLandscape:{routeField:new Float32Array(10000).fill(200)},scenery:[{id:'patch',kind:'tall_grass',x:500,y:468,rootY:500,size:80,tuftSeed:17}]};
 for(let y=14;y<=17;y++)for(let x=14;x<=17;x++)g.terrain[y*50+x]='grass';
 const before=grassFieldInstances(g);assert.ok(before.length>0);
 g.scenery[0].cut=true;g.scenery[0].charred=true;
 assert.deepEqual(grassFieldInstances(g),before);
 assert.ok(before.every((v,i)=>i%8!==6||v===0||v===1),'blades reference a stable patch state slot');
});

test('wheat stalks and ears share their roots and cut state across streamed chunks',()=>{
 const p={id:'wheat',kind:'tall_grass',grassVariant:'wheat',x:512,y:480,rootY:512,size:80,tuftSeed:17};
 const g={seed:42,terrain:Array(2500).fill('grass'),forestLandscape:{routeField:new Float32Array(10000).fill(200)},scenery:[p]};
 for(const sx of [256,512]){
  const bounds={sx,sy:480,ex:sx+256,ey:544};
  const geometry=grassFieldInstances(g,bounds,[p],()=>5),stalks=[];
  for(let i=0;i<geometry.length;i+=8)if(geometry[i+6]===5)stalks.push(geometry.slice(i,i+8));
  assert.ok(stalks.length>=30);
  for(let i=0;i<stalks.length;i+=2){
   const [stem,ear]=stalks.slice(i,i+2);
   assert.deepEqual(stem.slice(0,7),ear.slice(0,7));
   assert.equal(stem[7],WHEAT_STEM);
   assert.equal(ear[7],WHEAT_HEAD);
   assert.ok(stem[2]>=35&&stem[2]<=56&&stem[0]>=sx&&stem[0]<bounds.ex);
  }
  p.cut=true;
  assert.deepEqual(grassFieldInstances(g,bounds,[p],()=>5),geometry);
  p.cut=false;
 }
});

test('Bayou blades are short, dense and rooted on dry ground while the original floor mask stays intact',()=>{
 const design=wildLandsDesign(),g={seed:75,trainTest:{design,route:buildTrainRoute(design)}};
 const data=grassFieldInstances(g,{sx:11776,sy:1280,ex:12544,ey:1792},[]);
 let count=0;
 for(let i=0;i<data.length;i+=8){
  if(data[i+7]!==-1)continue;
  const [x,y,height]=data.subarray(i,i+3);count++;
  assert.ok(height>=5&&height<10);
  assert.equal(wildLandsGround(design,x,y),'swamp');
  assert.equal(wildLandsPathAt(x,y),false);
  assert.ok([[x,y],[x-4,y],[x+4,y],[x,y-4],[x,y+4]].every(([px,py])=>wildLandsSurfaceAt(design,px,py)==='grass'));
  assert.equal(meadowAllowed(g,x,y),false,'cached Bayou coloring stays beneath the live grass');
 }
 assert.ok(count>1500&&count<10000,'dense Bayou grass remains bounded by the existing instance grid');
});
