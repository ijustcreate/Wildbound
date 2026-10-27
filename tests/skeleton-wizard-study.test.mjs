import test from 'node:test';
import assert from 'node:assert/strict';
import {SKELETON_KINDS,defaultSkeletonMotion,skeletonMotions} from '../src/skeleton-motion.mjs';
import {playerPose} from '../src/player-motion.mjs';

test('wizard study uses the compact humanoid skeleton rig and an editable staff-cast clip',()=>{
 assert.ok(SKELETON_KINDS.includes('skeleton_wizard'));
 const model=defaultSkeletonMotion('skeleton_wizard');
 assert.equal(model.nativeSkeletonRevision,2);assert.equal(model.skeleton,true);
 assert.equal(model.clips.cast.loop,false);assert.equal(model.clips.cast.length,9);
 const start=playerPose({animationAction:'cast',playerFrame:0},0,model),raised=playerPose({animationAction:'cast',playerFrame:4},0,model);
 assert.ok(Math.hypot(...start.handR.map((v,i)=>v-raised.handR[i]))>5,'staff hand lifts during the cast');
 assert.equal(skeletonMotions.skeleton_wizard.type,'skeleton_wizard');
});

test('skeleton rigs expose a two-handed long-axe swing with coordinated grips',()=>{
 const model=defaultSkeletonMotion('skeleton'),clip=model.clips.long_axe_swing;
 assert.ok(clip&&!clip.loop);assert.ok(clip.keys.some(k=>k.joints.handR&&k.joints.handL));
 const start=playerPose({animationAction:'long_axe_swing',playerFrame:0},0,model),hit=playerPose({animationAction:'long_axe_swing',playerFrame:Math.floor(clip.length*.5)},0,model);
 assert.ok(Math.hypot(...start.handR.map((v,i)=>v-hit.handR[i]))>3,'axe handle hand follows the swing');
 assert.ok(Math.hypot(...start.handL.map((v,i)=>v-hit.handL[i]))>3,'off hand stays on the two-handed handle');
});
