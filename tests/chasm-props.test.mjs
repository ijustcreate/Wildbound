import test from 'node:test';
import assert from 'node:assert/strict';
import {translateRegionProps} from '../src/boundless-generation.mjs';

test('only distant underworld buttresses survive shadow chasm translation',()=>{
 const sourceProps=[
  {id:'backdrop',kind:'underworld_buttress',distant:true,realm:true,x:200,y:180,rootY:200},
  {id:'ordinary',kind:'root_arch',realm:true,x:400,y:380,rootY:400},
  {id:'unmarked',kind:'underworld_buttress',realm:true,x:600,y:580,rootY:600},
 ];
 const plan={cx:-1,cy:2,key:'-1,2',featureOffset:{x:0,y:0},routes:[],sourceProps};
 for(const tile of ['shadow_void','cave_void','water','shadow_soil']){
  const {props}=translateRegionProps({...plan,terrain:Array(2500).fill(tile)});
  assert.equal(props.length,tile==='shadow_void'?1:tile==='shadow_soil'?3:0,tile);
  if(tile==='shadow_void'){assert.equal(props[0].id,'boundless:-1:2:backdrop');assert.equal(props[0].x,-1400);assert.equal(props[0].rootY,3400);}
 }
 assert.equal(sourceProps[0].x,200,'source layout remains unchanged');
});
