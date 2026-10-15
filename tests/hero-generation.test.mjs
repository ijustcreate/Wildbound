import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildHeroGeneration } from '../src/hero-generation.mjs';
import { defaultPlayerMotion, validatePlayerMotion, playerPose, playerAction, playerFrame, poseAt, upgradePlayerMotion } from '../src/player-motion.mjs';

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
  assert.deepEqual(Object.keys(result.clips).sort(),[...new Set([...Object.keys(source.clips),'wing_hover'])].sort());
  assert.ok(result.clips.wing_hover.loop&&result.clips.wing_hover.fps>0&&result.clips.wing_hover.length>0);
  for(const [name,clip] of Object.entries(result.clips).filter(([name])=>name!=='sleep'&&source.clips[name]))
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

test('Shipping authored player upgrades to every supported action without replacing authored clips',()=>{
  const authored=JSON.parse(readFileSync(new URL('../authored/rigs.json',import.meta.url))).player;
  const shipping=upgradePlayerMotion(authored);
  for(const [name,clip]of Object.entries(authored.clips))assert.deepEqual(shipping.clips[name],clip,name);
  assert.equal(shipping.artGeneration,3);
  assert.ok(validatePlayerMotion(shipping));
  assert.deepEqual(Object.keys(upgradePlayerMotion(shipping).clips).sort(),Object.keys(model.clips).sort());
});

test('Posture upgrade changes only untouched locomotion and preserves custom keys and rig edits',()=>{
  const old=buildHeroGeneration(source,{legacyPosture:true}),before=structuredClone(old);
  const next=upgradePlayerMotion(old);
  assert.deepEqual(old,before);
  assert.equal(next.postureRevision,1);
  assert.deepEqual(next.joints,old.joints);
  assert.deepEqual(next.ik,old.ik);
  for(const name of Object.keys(old.clips)){
    if(['idle','walk','run'].includes(name))assert.notDeepEqual(next.clips[name].keys,old.clips[name].keys);
    else assert.deepEqual(next.clips[name],old.clips[name]);
  }
  assert.deepEqual(upgradePlayerMotion(next),next);
  const edited=structuredClone(old);edited.clips.idle.keys[0].joints.kneeL[0]+=.1;
  edited.clips.walk.fps=5;edited.wearables={'hair:crop':{0:{custom:true}}};
  const result=upgradePlayerMotion(edited);
  assert.deepEqual(result.clips.idle,edited.clips.idle);
  assert.equal(result.clips.walk.fps,5);
  assert.deepEqual(result.wearables,edited.wearables);
  edited.joints.shoulderL.position[0]-=.25;
  assert.deepEqual(upgradePlayerMotion(edited).clips,edited.clips);
  const customIK=structuredClone(old);customIK.ik.handL.enabled=false;
  assert.deepEqual(upgradePlayerMotion(customIK).clips,customIK.clips);
});

test('Idle rests over planted feet with relaxed elbows and running arms stay in their swing planes',()=>{
  for(let frame=0;frame<8;frame+=.5){
    const idle=playerPose({animationAction:'idle',playerFrame:frame},0,model);
    for(const side of ['L','R']){
      const hip=idle['hip'+side],knee=idle['knee'+side],foot=idle['foot'+side];
      assert.ok(Math.abs(hip[1]-foot[1])<.15);
      assert.ok(Math.abs(foot[2]-1)<1e-5);
      assert.ok(Math.abs(knee[1])<1.2,'Standing knee should not crouch forward');
      const shoulder=idle['shoulder'+side],elbow=idle['elbow'+side],hand=idle['hand'+side];
      assert.ok(distance(shoulder,hand)<distance(shoulder,elbow)+distance(elbow,hand)-.2,'Elbow must not lock');
    }
    const run=playerPose({animationAction:'run',playerFrame:frame},0,model);
    const shoulderAxis=run.shoulderR.map((v,i)=>v-run.shoulderL[i]),width=Math.hypot(...shoulderAxis);
    for(const side of ['L','R']){
      const root=run['shoulder'+side],elbow=run['elbow'+side];
      const sideways=elbow.reduce((sum,v,i)=>sum+(v-root[i])*shoulderAxis[i]/width,0);
      assert.ok(Math.abs(sideways)<.2,'Running elbow should not jut sideways');
    }
  }
});
