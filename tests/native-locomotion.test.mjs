import test from 'node:test';
import assert from 'node:assert/strict';
import {defaultNativePlayerMotion,upgradePlayerToNative,poseAt,playerFrame,playerPose,projectPoint} from '../src/player-motion.mjs';
import {jointAngle} from '../src/joint-angles.mjs';
import {LocomotionHistory} from '../src/native-locomotion.mjs';
import {scenePropCasters} from '../src/scene-casters.mjs';
import {createBoundlessChunk,createBoundlessChunkTask} from '../src/boundless-world.mjs';
import {generateWorld} from '../src/world.mjs';

test('current native gait has planted, flat soles and fixed limb lengths in every view',()=>{
 const m=defaultNativePlayerMotion();assert.equal(m.locomotionRevision,1);
 for(const action of ['idle','walk','run'])for(let frame=0;frame<24;frame++){
  const p=poseAt(m,action,frame),stance=action==='run'?.38:action==='walk'?.6:1;
  for(const side of ['L','R']){
   const phase=(frame/24+(side==='R'?.5:0))%1,foot='foot'+side;
   if(phase<stance){
    assert.ok(Math.abs(p[foot][2]-m.joints[foot].position[2])<1e-5,action+' planted sole');
    for(let d=0;d<8;d++){
     const a=projectPoint(p[foot],d),k=projectPoint(p['knee'+side],d),boot=Math.atan2(k.x-a.x,a.y-k.y)*180/Math.PI;
     assert.ok(Math.abs(boot+jointAngle(m,action,frame,d,foot))<1,action+' flat contact '+d);
    }
   }
  }
  assert.ok(p.handR[2]<p.shoulderR[2]-6,'arm stays relaxed beside ribs');
  assert.ok(Math.abs(p.head[1]-p.pelvis[1])<1.5,'head balanced above pelvis');
 }
 const a={moving:true,step:5,equipment:{}};
 assert.equal(playerFrame(a,0,m),playerFrame(a,90,m),'distance drives stride');
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
