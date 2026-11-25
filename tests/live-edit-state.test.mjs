import test from 'node:test';
import assert from 'node:assert/strict';
import {LiveEditState,liveEditScene,normalizeLiveEdits} from '../src/live-edit-state.mjs';

const scene = 'wilds:outdoors';
const change = {kind:'placement',id:'chair',before:{x:10,y:20},after:{x:45,y:52}};

test('a grouped edit can be undone and redone without losing the prior saved overlay',async()=>{
  let saved;
  const desktop = {loadLiveEdits:async()=>saved,saveLiveEdits:async value=>{saved=value;}};
  const editor = new LiveEditState({desktop});
  await editor.load();
  assert.equal(editor.dirty,false);
  assert.equal(editor.remember(scene,[change,{kind:'terrain',id:'0,0',before:null,after:'sand'}]),true);
  assert.equal(editor.dirty,true);
  await editor.save();
  assert.equal(editor.dirty,false);
  assert.equal(editor.step(true,()=>false),false);
  assert.equal(editor.records(scene,'terrain')['0,0'],'sand');
  assert.equal(editor.step(true,()=>true),true);
  assert.equal(editor.records(scene,'placement'),undefined);
  assert.equal(editor.records(scene,'terrain'),undefined);
  assert.equal(editor.dirty,true);
  assert.equal(editor.step(false,()=>true),true);
  assert.deepEqual(editor.records(scene,'placement').chair,change.after);
  assert.equal(editor.dirty,false);
  const reloaded = new LiveEditState({desktop});
  await reloaded.load();
  assert.deepEqual(reloaded.records(scene,'placement').chair,change.after);
  assert.equal(reloaded.records(scene,'terrain')['0,0'],'sand');
});

test('save leaves newer draft edits dirty while its disk write is in flight',async()=>{
  let finish;
  const desktop = {saveLiveEdits:()=>new Promise(resolve=>{finish=resolve;})};
  const editor = new LiveEditState({desktop});
  editor.remember(scene,[change]);
  const save = editor.save();
  editor.remember(scene,[{...change,before:change.after,after:{x:70,y:90}}]);
  finish();
  await save;
  assert.equal(editor.dirty,true);
  assert.deepEqual(editor.records(scene,'placement').chair,{x:70,y:90});
});

test('scene keys survive changes to display names and deserialize only recognized edit records',()=>{
  assert.equal(liveEditScene({trainTest:{design:{wildLands:true,name:'Willow'}},seed:3}),scene);
  assert.equal(liveEditScene({trainTest:{design:{wildLands:true,activeRoom:'diagon'}}}),'wilds:diagon');
  const loaded = normalizeLiveEdits({version:1,scenes:{[scene]:{terrain:{valid:'stone',malformed:42},placement:{bad:{x:null,y:5}},unknown:{x:0}}}});
  assert.equal(loaded.scenes[scene].terrain.valid,'stone');
  assert.deepEqual(Object.keys(loaded.scenes[scene].terrain),['valid']);
  assert.equal(Object.hasOwn(loaded.scenes[scene],'placement'),false);
  assert.equal(Object.hasOwn(loaded.scenes[scene],'unknown'),false);
});
