import test from 'node:test';
import assert from 'node:assert/strict';
import {CREATURE_PACK,WILDLIFE_DONOR_NOTES} from '../../src/creature-packs/wildlife.mjs';
import {poseAt} from '../../src/player-motion.mjs';
import {creaturePackVisualActor} from '../../src/creature-pack-animation-routing.mjs';
import {BOUNCER_WOW_MOTION} from '../../src/bouncer-wow-motion-data.mjs';

test('Bouncer donor gait drives editable joints while native pounce and no-web behavior remain',()=>{
 const model=CREATURE_PACK.subjects.jumping_spider.defaults(),defaults=CREATURE_PACK.defaults.jumping_spider;
 assert.deepEqual([BOUNCER_WOW_MOTION.provenance.npc,BOUNCER_WOW_MOTION.provenance.displayId,BOUNCER_WOW_MOTION.provenance.fileDataId],[222532,119179,5752188]);
 assert.equal(model.motionSource.displayId,119179);
 for(const action of ['idle','walk','run'])assert.ok(model.clips[action].keys.some(key=>Object.values(key.joints).some(delta=>Math.hypot(...delta)>.1)),`${action} has donor joint motion`);
 assert.ok(model.clips.pounce&&!model.clips.pounce.loop,'native pounce remains available');
 assert.ok(model.clips.windup&&model.clips.recover&&model.clips.bite,'native attack telegraph, bite and recovery remain');
 assert.equal(defaults.behaviors.webs,false);
 assert.equal(WILDLIFE_DONOR_NOTES.jumping_spider.verifiedForRequestedDonor,true);
 const walking=creaturePackVisualActor({kind:'jumping_spider',hp:20,moving:true,walking:true,state:'move'});
 const running=creaturePackVisualActor({kind:'jumping_spider',hp:20,moving:true,walking:false,state:'move'});
 assert.equal(walking.animationAction,'walk');assert.equal(running.animationAction,'run');
});

test('Bouncer donor feet stay above the native ground plane across all gait phases',()=>{
 const model=CREATURE_PACK.subjects.jumping_spider.defaults();
 for(const action of ['idle','walk','run'])for(let frame=0;frame<model.clips[action].length;frame++){
  const pose=poseAt(model,action,frame);
  for(const side of ['L','R'])for(let leg=0;leg<4;leg++){
   const foot=`foot${leg}${side}`;
   assert.ok(pose[foot][2]>=0,`${action} frame ${frame} ${foot} dips below floor: ${pose[foot][2]}`);
  }
 }
});

test('Bouncer donor assembles finite pixel poses at all eight facings',()=>{
 const subject=CREATURE_PACK.subjects.jumping_spider,model=subject.defaults();
 for(let facing=0;facing<8;facing++)for(const action of ['idle','walk','run']){
  const pixels=[],frame=Math.round(model.clips[action].length*.37),actor={kind:'jumping_spider',state:action,moving:action!=='idle',animationAction:action,playerFrame:frame,faceX:Math.sin(facing*Math.PI/4),faceY:-Math.cos(facing*Math.PI/4)};
  const ctx={fillStyle:'#000',save(){},restore(){},scale(){},fillRect(x,y,w,h){pixels.push([x,y,w,h])}};
  subject.draw(ctx,actor,0,model);
  assert.ok(pixels.length>20,`${action} facing ${facing} renders its assembled rig`);
  assert.ok(pixels.flat().every(Number.isFinite),`${action} facing ${facing} has finite pixels`);
 }
});
