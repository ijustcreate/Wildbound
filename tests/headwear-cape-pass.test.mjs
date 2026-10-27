import test from 'node:test';
import assert from 'node:assert/strict';
import {defaultNativePlayerMotion,playerPose,projectPoint,validatePlayerMotion} from '../src/player-motion.mjs';
import {balanceLocomotionHead,retargetHumanoidClip} from '../src/native-humanoid-base.mjs';
import captain from '../src/oathless-captain-data.mjs';
import {CapeInertia} from '../src/cape-inertia.mjs';
import {capeRows} from '../src/cape-motion.mjs';
test('default locomotion keeps the head level across the complete eight-view walk and run cycles',()=>{
 const model=defaultNativePlayerMotion();assert.equal(model.headBalanceRevision,1);assert.ok(validatePlayerMotion(model));
 for(const action of ['walk','run'])for(let f=0;f<model.clips[action].length;f+=.25)for(let d=0;d<8;d++){
  const p=playerPose({animationAction:action,playerFrame:f,equipment:{}},0,model),a=projectPoint(p.head,d),b=projectPoint(p.chest,d);
  assert.ok(Math.abs(Math.atan2(a.x-b.x,b.y-a.y))<7*Math.PI/180,action+' '+f+' '+d);
 }
});
test('head balance migration preserves edited locomotion and all combat keys',()=>{
 const model=defaultNativePlayerMotion();delete model.headBalanceRevision;
 model.clips.walk=retargetHumanoidClip(captain,model,captain.clips.walk);
 model.clips.run=retargetHumanoidClip(captain,model,captain.clips.run);model.clips.run.keys[0].joints.head[0]+=.2;
 const before=structuredClone(model),next=balanceLocomotionHead(model);
 assert.deepEqual(model,before);assert.deepEqual(next.clips.run,before.clips.run);assert.deepEqual(next.clips.slash,before.clips.slash);
 assert.notDeepEqual(next.clips.walk,before.clips.walk);assert.deepEqual(balanceLocomotionHead(next),next);
});
test('cape inertia samples real travel, ignores duplicate draws, settles and resets teleports',()=>{
 const history=new CapeInertia(),a={id:1,kind:'player',x:0,y:0};history.sample(a,0);
 a.x=10;const moving=history.sample(a,.1);assert.ok(moving.vx>0);assert.equal(history.sample(a,.1),moving);
 const stopped=history.sample(a,.2);assert.ok(stopped.vx>0&&stopped.vx<moving.vx);
 assert.equal(history.sample({...a,x:8},.18),stopped);
 a.x=1000;const reset=history.sample(a,.3);assert.equal(reset.vx,0);assert.equal(reset.vy,0);
 assert.equal(history.sample({x:0,y:0},.4),undefined);
 for(let id=0;id<400;id++)history.sample({id,x:0,y:0},0);assert.ok(history.samples.size<=256);
});
test('capes lift more when running and trail actual sideways travel without unpinning shoulders',()=>{
 const top=[0,0,24],bottom=[0,0,14],pins={left:[-5,0,24],right:[5,0,24]};
 const walk=capeRows(top,bottom,{moving:true,walking:true},.2,'',pins),run=capeRows(top,bottom,{moving:true},.2,'',pins);
 assert.deepEqual(walk[0].left,run[0].left);assert.deepEqual(walk[0].right,run[0].right);assert.ok(run.at(-1).left[1]<walk.at(-1).left[1]);
 // Compare mean lift, not a single flutter phase (a running hem can dip on
 // its downstroke while a slower walking hem is on its upstroke).
 const meanLift=actor=>Array.from({length:200},(_,i)=>{const row=capeRows(top,bottom,actor,i*.01,'',pins).at(-1);return (row.left[2]+row.right[2])/2;}).reduce((a,b)=>a+b,0)/200;
 assert.ok(meanLift({moving:true})>meanLift({moving:true,walking:true})+.5);
 const actor={moving:true,capeMotion:{vx:130,vy:0}};
 const side=capeRows(top,bottom,actor,.2,'',pins,{direction:0}),reverse=capeRows(top,bottom,{...actor,capeMotion:{vx:-130,vy:0}},.2,'',pins,{direction:0});
 assert.deepEqual(side[0],reverse[0]);
 const lateral=reverse.at(-1).left[0]-side.at(-1).left[0];assert.ok(lateral>1&&lateral<5,'cloth trails sideways without becoming a rigid extended paddle');
 const up=capeRows(top,bottom,{jumpHeight:30,jumpVelocity:100},.2,'',pins),down=capeRows(top,bottom,{jumpHeight:30,jumpVelocity:-100},.2,'',pins);
 assert.deepEqual(up[0],down[0]);assert.ok(up.at(-1).left[2]<down.at(-1).left[2]);
});
