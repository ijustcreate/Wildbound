import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {defaultNativePlayerMotion,upgradePlayerToNative,validatePlayerMotion,poseAt,playerPose} from '../src/player-motion.mjs';
import {completeHumanoidActions} from '../src/native-humanoid-base.mjs';
import captain from '../src/oathless-captain-data.mjs';

test('native player retains a valid editable action library and fixed segment lengths',()=>{
 const m=defaultNativePlayerMotion();assert.equal(m.nativeHumanoidRevision,1);assert.ok(validatePlayerMotion(m));
 for(const action of Object.keys(m.clips))for(const frame of [0,Math.floor(m.clips[action].length/2),m.clips[action].length-1]){
  const p=playerPose({animationAction:action,playerFrame:frame,equipment:{}},0,m);
  assert.ok(Object.values(p).flat().every(Number.isFinite));
  for(const side of ['L','R'])for(const [a,b] of [['shoulder','elbow'],['elbow','hand'],['hip','knee'],['knee','foot']]){
   const len=(x,y)=>Math.hypot(...x.map((v,i)=>v-y[i]));
   assert.ok(Math.abs(len(p[a+side],p[b+side])-len(m.joints[a+side].position,m.joints[b+side].position))<.01,action+' '+a+side);
  }
 }
});
test('migration is idempotent and retains custom source keys and wearable overrides',()=>{
 const old=JSON.parse(readFileSync(new URL('../authored/rigs.json',import.meta.url))).player;
 old.clips.cast.keys[0].joints.handR[0]+=.1;
 old.wearables.test={2:{x:3,pixels:[null,'#ffffff']}};
 const before=structuredClone(old),m=upgradePlayerToNative(old);
 assert.deepEqual(old,before);assert.equal(m.nativeHumanoidRevision,1);
 assert.deepEqual(m.nativeHumanoidSource.preservedClips.cast,before.clips.cast);
 assert.deepEqual(m.wearables.test,before.wearables.test);
 assert.deepEqual(upgradePlayerToNative(m),m);
});
test('Captain gains every missing player action without replacing donor keys',()=>{
 const target=structuredClone(captain),idle=structuredClone(target.clips.idle),player=defaultNativePlayerMotion();
 completeHumanoidActions(target,player);
 assert.deepEqual(target.clips.idle,idle);
 for(const name of Object.keys(player.clips)){
  assert.ok(target.clips[name],name);assert.ok(Object.values(poseAt(target,name,1)).flat().every(Number.isFinite));
 }
});
