import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {defaultNativePlayerMotion,upgradePlayerToNative,poseAt,playerFrame,playerPose,projectPoint} from '../src/player-motion.mjs';
import {jointAngle} from '../src/joint-angles.mjs';
import {LocomotionHistory} from '../src/native-locomotion.mjs';
import captain from '../src/oathless-captain-data.mjs';
import {scenePropCasters} from '../src/scene-casters.mjs';
import {createBoundlessChunk,createBoundlessChunkTask} from '../src/boundless-world.mjs';
import {generateWorld} from '../src/world.mjs';

test('the shipped player uses the imported forward walk and run with grounded, forward-bending knees',()=>{
 const authored=JSON.parse(readFileSync(new URL('../authored/rigs.json',import.meta.url),'utf8')).player;
 const model=upgradePlayerToNative(authored);
 assert.equal(model.locomotionRevision,2);
 for(const [action,stride] of [['walk',32],['run',59]]){
  const clip=model.clips[action],source=captain.clips[action];
  assert.equal(clip.length,source.length);
  assert.equal(clip.fps,source.fps);
  assert.equal(clip.loop,source.loop);
  assert.deepEqual(poseAt(model,action,clip.length),poseAt(model,action,0));
  assert.equal(playerFrame({moving:true,walking:action==='walk',step:stride*.13},0,model),clip.length);
  let hasContact=false,hasFlight=false;
  const ground=model.joints.footL.position[2];
  for(let frame=0;frame<clip.length;frame+=.125){
   const pose=playerPose({hp:100,moving:true,walking:action==='walk',playerFrame:frame},0,model);
   hasFlight||=Math.min(pose.footL[2],pose.footR[2])>ground+1;
   for(const side of ['L','R']){
    const foot='foot'+side,hip=pose['hip'+side],knee=pose['knee'+side],ankle=pose[foot];
    const forward=ankle[1]-hip[1],height=hip[2]-ankle[2];
    const bend=((knee[1]-hip[1])*height+(knee[2]-hip[2])*forward)/Math.hypot(forward,height);
    assert.ok(bend>.5,action+' knee bends forward at '+frame+' '+side);
    assert.ok(ankle[2]>=ground-.02,action+' ankle stays above the ground at '+frame);
    const contact=Number.isInteger(frame)&&ankle[2]<=ground+.02;
    hasContact||=contact;
    for(const direction of contact?[0,1,2,3,4,5,6,7]:Number.isInteger(frame)?[0,4]:[]){
     const a=projectPoint(ankle,direction),k=projectPoint(knee,direction);
     const shin=Math.atan2(k.x-a.x,a.y-k.y)*180/Math.PI;
     assert.ok(Math.abs(shin+jointAngle(model,action,frame,direction,foot))<1,action+' boot alignment '+direction);
    }
   }
  }
  assert.ok(hasContact,action+' includes a planted pose');
  assert.equal(hasFlight,action==='run');
 }
 const customRun=structuredClone(authored);
 customRun.clips.run.keys[0].joints.handR[0]+=.1;
 const customized=upgradePlayerToNative(customRun);
 assert.deepEqual(customized.nativeHumanoidSource.preservedClips.run,customRun.clips.run);
 assert.equal(customized.clips.run.stride,undefined);
});

test('locomotion migration preserves edited clips, custom geometry and all fitted art',()=>{
 const m=defaultNativePlayerMotion(),legacy=structuredClone(m);
 for(const name of ['idle','walk','run'])legacy.clips[name]=structuredClone(m.locomotionSource[name]);
 delete legacy.locomotionRevision;delete legacy.locomotionSource;
 legacy.clips.run.keys[0].joints.handR[0]+=.01;
 legacy.wearables.custom={2:{x:3,rotation:12,pixels:['#ffffff']}};
 const edited=structuredClone(legacy.clips.run),next=upgradePlayerToNative(legacy);
 assert.deepEqual(next.clips.run,edited);assert.deepEqual(next.wearables,legacy.wearables);
 assert.equal(playerFrame({moving:true,step:5},0,next),5/(.13*88)*next.clips.run.length,'custom run retains its original distance cadence');
 const custom=structuredClone(legacy);custom.joints.head.position[0]+=.1;
 assert.deepEqual(upgradePlayerToNative(custom).clips.idle,custom.clips.idle);
 assert.deepEqual(upgradePlayerToNative(next),next);
 const customWalk=structuredClone(m);
 customWalk.clips.walk.keys[0].angles[6].footL+=.5;
 assert.deepEqual(upgradePlayerToNative(customWalk).clips.walk,customWalk.clips.walk);
});

test('start/stop blends and staggered turns are bounded and do not mutate actors',()=>{
 const history=new LocomotionHistory(),a={id:1,x:0,y:0,faceX:0,faceY:1,hp:100},before=structuredClone(a);
 history.sample(a,1,'idle',0);const start=history.sample({...a,moving:true},1.016,'run',5);
 assert.equal(start.locomotionTransition.action,'idle');assert.equal(start.locomotionTransition.weight,0);
 const turn=history.sample({...a,faceX:1,faceY:0},1.032,'run',6);
 assert.ok(turn.locomotionTurning);assert.notEqual(turn.locomotionVisualDirection,turn.locomotionHeadDirection);
 assert.deepEqual(history.sample(a,1.032,'idle',0),turn,'same-time secondary renders preserve history');
 assert.equal(history.sample(a,1.048,'hurt',0).locomotionTransition,null,'combat reactions do not inherit a locomotion settle');
 history.sample(a,1.1,'run',7);
 const end=history.sample(a,1.2,'idle',0);assert.ok(end.locomotionTransition);
 const p=playerPose({...a,...start},1.016,defaultNativePlayerMotion());assert.ok(Object.values(p).flat().every(Number.isFinite));
 assert.deepEqual(a,before);
});

test('static shadow caster geometry reuses identity and invalidates on harvest and edits',()=>{
 const prop={kind:'tree',x:20,y:30,size:90},g={scenery:[prop]};
 const first=scenePropCasters(g),again=scenePropCasters(g);assert.equal(first.casters,again.casters);
 prop.x+=10;const moved=scenePropCasters(g);assert.notEqual(moved.revision,first.revision);assert.equal(moved.casters[0].x,30);
 prop.depleted=true;assert.equal(scenePropCasters(g).casters.length,0);
});

test('incremental forest generation publishes complete regions identical to synchronous generation',()=>{
 const g={...generateWorld(42,'forest'),seed:42,mapMode:'boundless',environment:'forest',generatedEnvironment:'forest'};
 const task=createBoundlessChunkTask(g,-2,1);let step=task.next(),yields=0;assert.equal(step.done,false);
 while(!step.done){assert.equal(step.value,undefined);yields++;step=task.next();}
 assert.ok(yields>50);assert.deepEqual(step.value,createBoundlessChunk(g,-2,1));
});
