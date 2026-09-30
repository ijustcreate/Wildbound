import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildHeroGeneration } from '../src/hero-generation.mjs';
import { defaultPlayerMotion, validatePlayerMotion, playerPose, playerAction, playerFrame, poseAt } from '../src/player-motion.mjs';

const source=defaultPlayerMotion(), model=buildHeroGeneration(source);
const distance=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));

test('Hero generation preserves editor extensions and clip durations without mutating its source',()=>{
  const custom=structuredClone(source);
  custom.wearableOverrides={head:{pixels:[[1,2,'#fff']]}};
  const before=structuredClone(custom),result=buildHeroGeneration(custom);
  assert.deepEqual(custom,before);
  assert.deepEqual(result.wearableOverrides,custom.wearableOverrides);
  assert.deepEqual(result.animationLayers,custom.animationLayers);
  assert.ok(validatePlayerMotion(result));
  assert.equal(Object.keys(result.clips).length,36);
  for(const [name,clip] of Object.entries(result.clips).filter(([name])=>name!=='sleep'))
    assert.equal(clip.length/clip.fps,source.clips[name].length/source.clips[name].fps,name);
});

test('Every hero clip keeps finite joints and fixed limb lengths between authored frames',()=>{
  for(const [action,clip] of Object.entries(model.clips))for(let frame=0;frame<clip.length;frame+=.5){
    const p=playerPose({animationAction:action,playerFrame:frame},0,model);
    for(const point of Object.values(p))assert.ok(point.every(Number.isFinite),action);
    for(const chain of Object.values(model.ik))for(const [a,b] of [[chain.root,chain.mid],[chain.mid,chain.end]])
      assert.ok(Math.abs(distance(p[a],p[b])-distance(model.joints[a].position,model.joints[b].position))<1e-5,`${action}/${frame}/${a}/${b}`);
  }
});

test('Walk is a distinct clip and grounded actions lie down before returning to standing',()=>{
  assert.equal(playerAction({animationAction:'walk'}),'walk');
  assert.notDeepEqual(model.clips.walk.keys,model.clips.run.keys);
  for(const action of ['death','sleep']){
    const p=poseAt(model,action,model.clips[action].length-1);
    assert.ok(p.head[2]<6&&p.pelvis[2]<6,action);
    assert.ok(Math.abs(p.head[0]-p.pelvis[0])>12,action);
  }
  const up=poseAt(model,'get_up',model.clips.get_up.length-1);
  assert.ok(up.head[2]>30&&up.pelvis[2]>13);
  assert.notEqual(poseAt(model,'sleep',0).chest[2],poseAt(model,'sleep',1).chest[2]);
  assert.equal(model.clips.sleep.length/model.clips.sleep.fps,2);
});

test('Utility actions sample their own elapsed timer rather than global animation time',()=>{
  for(const [action,key,duration] of [['pickup','pickupTime',.42],['found_unique','foundUnique',1.1],['mine','gatherTime',.55],['parry','parry',.32],['dash','dashTime',.28]]){
    const actor={animationAction:action,[key]:duration*.5};
    assert.equal(playerFrame(actor,1,model),playerFrame(actor,901,model));
    assert.equal(playerFrame(actor,1,model),(model.clips[action].length-1)*.5);
  }
});

test('Rifle grip separates the support hand from the trigger hand without stretching limbs',()=>{
  for(const action of ['draw','ranged'])for(let frame=0;frame<model.clips[action].length;frame+=.5){
    const p=playerPose({animationAction:action,playerFrame:frame,equipment:{hand1:'rifle'}},0,model);
    assert.ok(distance(p.handL,p.handR)>4);
    assert.ok(distance(p.handR,p.shoulderR)<6);
  }
});

test('Shipping authored player uses the new generation and every supported action',()=>{
  const shipping=JSON.parse(readFileSync(new URL('../authored/rigs.json',import.meta.url))).player;
  assert.equal(shipping.artGeneration,3);
  assert.ok(validatePlayerMotion(shipping));
  assert.deepEqual(Object.keys(shipping.clips).sort(),Object.keys(model.clips).sort());
});
