import test from 'node:test';
import assert from 'node:assert/strict';
import { startFollowerAttack } from '../src/follower-attacks.mjs';
import { defaultNightMotion, nightAction, nightMotions, replaceNightMotion } from '../src/night-rigs.mjs';
import { poseAt } from '../src/player-motion.mjs';

test('controlled werewolf attack selects its pounce clip',()=>{
  const owner={id:1,faceX:1,faceY:0},follower={id:2,kind:'werewolf',x:100,y:100,hp:100,allyOwner:1,cooldown:0};
  assert.equal(startFollowerAttack({onSound(){}},owner,follower),true);
  assert.equal(follower.controlledAttack.nativeAction,'pounce');
  assert.equal(follower.animationAction,'pounce');
  assert.equal(nightAction('werewolf',follower,nightMotions.werewolf),'pounce');
});

test('werewolf has an articulated tail with clip motion and migration preserves custom poses',()=>{
  const model=defaultNightMotion('werewolf');
  assert.deepEqual([model.joints.tailBase.parent,model.joints.tailMid.parent,model.joints.tailTip.parent],['pelvis','tailBase','tailMid']);
  for(const clip of ['idle','walk','run','pounce','howl']){
    const a=poseAt(model,clip,0),b=poseAt(model,clip,Math.max(1,model.clips[clip].length/2));
    assert.notDeepEqual(a.tailTip,b.tailTip,`${clip} animates the tail tip`);
  }
  const old=structuredClone(model);delete old.articulatedTailRevision;delete old.joints.tailBase;delete old.joints.tailMid;delete old.joints.tailTip;
  for(const clip of Object.values(old.clips))for(const key of clip.keys)for(const name of ['tailBase','tailMid','tailTip'])delete key.joints[name];
  old.joints.head.position=[2,33,37];old.clips.idle.keys[0].joints.head=[3,0,0];
  replaceNightMotion('werewolf',old);
  assert.ok(nightMotions.werewolf.joints.tailMid);
  assert.deepEqual(nightMotions.werewolf.joints.head.position,[2,33,37]);
  assert.deepEqual(nightMotions.werewolf.clips.idle.keys[0].joints.head,[3,0,0]);
});
