import test from 'node:test';
import assert from 'node:assert/strict';
import { AnimationGraph } from '../src/animation-graph.mjs';

function fixture() {
  const clip={length:8,keys:[{frame:0,joints:{head:[0,0.123,3]}},{frame:7,joints:{head:[0,-5,4]}}]};
  const studio={model:{clips:{run:clip}},clip:'run',selected:'head',changed(){}};
  const graph=new AnimationGraph(studio);
  graph.canvas={width:960};graph.g=graph.geometry();graph.point=e=>e;
  return {graph,clip};
}

test('Every visible graph curve can be picked even when another axis is selected',()=>{
  const {graph}=fixture();
  const hit=graph.nearest(graph.xy(7,-5));
  assert.equal(hit.axis,1);assert.equal(hit.key.frame,7);
  assert.equal(graph.axis,0);
});

test('Shift dragging an endpoint preserves its frame and snaps exactly to the opposite value',()=>{
  const {graph,clip}=fixture();graph.axis=1;graph.drag={frame:7,g:graph.g};
  graph.move({...graph.xy(6,0.15),shiftKey:true});
  assert.equal(clip.keys[1].frame,7);
  assert.equal(clip.keys[1].joints.head[1],0.123);
  assert.deepEqual(clip.keys[1].joints.head.filter((_,i)=>i!==1),[0,4]);
});

test('Alt disables endpoint snapping and retiming does not overwrite an occupied key',()=>{
  const {graph,clip}=fixture();graph.axis=1;graph.drag={frame:7,g:graph.g};
  graph.move({...graph.xy(7,0.3),altKey:true});
  assert.equal(clip.keys[1].joints.head[1],0.3);
  graph.move(graph.xy(0,2));
  assert.equal(clip.keys[0].joints.head[1],0.123);
  assert.equal(clip.keys[1].frame,7);
});
