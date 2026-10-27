import test from 'node:test';
import assert from 'node:assert/strict';
import {WorldLightRenderer} from '../src/world-lighting.mjs';
import {shadeCharacterSurface} from '../src/character-lighting.mjs';

function canvas(){
 const pen={save(){},restore(){},setTransform(){},scale(){},translate(){},clearRect(){},fillRect(){},drawImage(){},
  createLinearGradient(){return {addColorStop(){}};},
  getImageData(){throw Error('Lighting must not read back sprite pixels');},putImageData(){throw Error('Lighting must not upload CPU sprite pixels');}};
 return {width:192,height:192,getContext:()=>pen};
}
function withCanvas(run){const previous=globalThis.document;globalThis.document={createElement:()=>canvas()};try{run();}finally{globalThis.document=previous;}}

test('moving-light prop updates are bounded and FIFO does not starve later props',()=>withCanvas(()=>{
 const renderer=new WorldLightRenderer(),ctx=canvas().getContext('2d'),props=Array.from({length:20},(_,id)=>({id,kind:'rock',x:id*3,y:40,size:50}));
 const field={revision:1,staticRevision:1,volumes:[]},source={x:0,y:0,height:30,radius:500};
 for(let f=0;f<8;f++){
  source.x=f*12;const frame={sources:[source],field,time:f/60};
  for(const p of props)renderer.drawProp(ctx,p,c=>c.fillRect(p.x,p.y,20,20),frame);
  assert.ok(renderer.propUpdates<=6,'at most six expensive refreshes per frame');
  if(f===0)assert.ok([...renderer.props.values()].filter(e=>e.lightKey).length<=6,'cold entry also respects budget');
 }
 assert.ok([...renderer.props.values()].every(e=>e.lightKey),'all props eventually receive shading while the source keeps moving');
 assert.ok(renderer.bytes<=renderer.limit);
}));

test('stationary solid props reuse their image; geometry revisions refresh it',()=>withCanvas(()=>{
 const renderer=new WorldLightRenderer(),ctx=canvas().getContext('2d'),p={id:1,kind:'rock',x:40,y:40,size:50},source={x:0,y:0,height:30,radius:200};
 const field={revision:1,staticRevision:1,volumes:[]};let paints=0;const paint=()=>paints++;
 renderer.drawProp(ctx,p,paint,{sources:[source],field,time:0});const entry=renderer.props.get('prop:1'),first=entry.lightKey;
 renderer.drawProp(ctx,p,paint,{sources:[source],field,time:1/60});assert.equal(renderer.propUpdates,0);assert.equal(paints,1);
 field.staticRevision=2;renderer.drawProp(ctx,p,paint,{sources:[source],field,time:2/60});assert.notEqual(entry.lightKey,first);
}));

test('character tint and rim use canvas alpha masks, never pixel readback',()=>withCanvas(()=>{
 shadeCharacterSurface(canvas(),{bodyHeight:22,lights:[{dx:-60,dy:-30,strength:.8,color:'#ffc76f'}]},{pixelsPerWorld:3});
}));
