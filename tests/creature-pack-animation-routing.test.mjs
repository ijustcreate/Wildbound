import test from 'node:test';
import assert from 'node:assert/strict';
import { CREATURE_PACK_SUBJECTS } from '../src/creature-packs/index.mjs';
import { creaturePackVisualActor } from '../src/creature-pack-animation-routing.mjs';
import { poseAt } from '../src/player-motion.mjs';
import { startFollowerAttack } from '../src/follower-attacks.mjs';
import { turkeyWowClip } from '../src/turkey-wow-motion.mjs';

test('pack creatures choose their registered gait clips for ordinary idle and movement',()=>{
  const cases=[
    ['snail','walk','crawl'],['llama','walk','walk'],['penguin','walk','waddle'],['crab','walk','scuttle'],
    ['golden_retriever','walk','walk'],['triceratops','walk','wowhead-walk'],['squirrel','walk','walk'],
    ['baby_triceratops','walk','quick-walk'],['turkey','walk','strut'],
  ];
  for(const[kind,source,expected]of cases){
    const model=CREATURE_PACK_SUBJECTS[kind].data;
    assert.ok(model.clips[expected],`${kind} native clip exists`);
    assert.equal(creaturePackVisualActor({kind,hp:10,moving:true,walking:true,animationAction:source},).animationAction,expected);
    assert.notDeepEqual(poseAt(model,expected,0),poseAt(model,expected,Math.max(1,model.clips[expected].length/2)),`${kind} gait changes its rig pose`);
  }
  const squirrel=CREATURE_PACK_SUBJECTS.squirrel.data;
  assert.equal(creaturePackVisualActor({kind:'squirrel',hp:10,moving:false,animationAction:null}).animationAction,'freeze');
  assert.equal(creaturePackVisualActor({kind:'squirrel',hp:10,moving:true,walking:false,animationAction:'run'}).animationAction,'scamper');
  assert.equal(creaturePackVisualActor({kind:'squirrel',hp:10,jumpHeight:12,moving:false,animationAction:null}).animationAction,'leap');
  assert.notDeepEqual(poseAt(squirrel,'scamper',0).tailTip,poseAt(squirrel,'scamper',3).tailTip);
});

test('adult and baby triceratops telegraph and attack through registered clips',()=>{
  const adult=CREATURE_PACK_SUBJECTS.triceratops.data,baby=CREATURE_PACK_SUBJECTS.baby_triceratops.data;
  assert.ok(adult.clips.warn&&adult.clips.charge&&adult.clips['heavy-walk']);
  assert.ok(baby.clips['call-for-parent']&&baby.clips['short-charge']&&baby.clips['quick-walk']);
  assert.notDeepEqual(poseAt(adult,'charge',0),poseAt(adult,'charge',4));
  assert.notDeepEqual(poseAt(baby,'short-charge',0),poseAt(baby,'short-charge',4));
});

test('Jammer routes its exact Wowhead idle, walk, run and attack into editable native joints',()=>{
  const model=CREATURE_PACK_SUBJECTS.triceratops.data;
  assert.equal(model.motionDonorRevision,1);
  assert.equal(model.provenance.donor,'Wowhead NPC 142151 Jammer / triceratops, FileDataID 660332');
  for(const action of ['idle','walk','run','attack']){
    const clip=model.clips[`wowhead-${action}`];
    assert.ok(clip,`donor ${action} is present`);
    assert.ok(clip.keys.length>=2);
    assert.ok(clip.keys.every(key=>Object.values(key.joints).flat().every(Number.isFinite)));
    assert.notDeepEqual(poseAt(model,`wowhead-${action}`,0),poseAt(model,`wowhead-${action}`,Math.max(1,clip.length/2)),`${action} moves the rig`);
  }
  assert.equal(creaturePackVisualActor({kind:'triceratops',hp:20,state:'idle',moving:false,animationAction:'idle'}).animationAction,'wowhead-idle');
  assert.equal(creaturePackVisualActor({kind:'triceratops',hp:20,moving:true,walking:false,animationAction:'run'}).animationAction,'wowhead-run');
  assert.equal(creaturePackVisualActor({kind:'triceratops',hp:20,state:'attack',moving:false,animationAction:'attack'}).animationAction,'wowhead-attack');
  for(const action of ['warn','charge','headbutt'])assert.ok(model.clips[action],`native ${action} remains available`);
  for(const key of model.clips['wowhead-walk'].keys){
    for(const name of ['frontPawL','frontPawR','rearPawL','rearPawR'])
      assert.ok(model.joints[name].position[2]+(key.joints[name]?.[2]||0)>=0,`${name} stays above floor`);
  }
});

test('Amethyst Softshell foot rests on ground while its shell remains elevated',()=>{
  const snail=CREATURE_PACK_SUBJECTS.snail.data;
  assert.equal(snail.runtimeGroundAnchorRevision,1);
  assert.equal(snail.joints.pelvis.position[2],3);
  assert.equal(snail.joints.shell.position[2],10);
  assert.equal(snail.shape.bodyHeight,4);
  assert.equal(snail.joints.pelvis.position[2]-3,0,'the native soft-foot volume reaches ground level');
  assert.equal(snail.joints.shell.position[2]-snail.shape.shellHeight,2,'the shell stays above the floor');
});

test('Great Owl and Blinky use valid idle, flight, and attack clips in runtime drawing',()=>{
  for(const [kind,flight,attack] of [['great_owl','glide','swoop'],['butterfly_dragon','fly','breath']]){
    const model=CREATURE_PACK_SUBJECTS[kind].data;
    const idle=creaturePackVisualActor({kind,hp:50,state:'idle',moving:false});
    const flying=creaturePackVisualActor({kind,hp:50,state:'hunt',moving:true});
    const attacking=creaturePackVisualActor({kind,hp:50,state:'windup',moving:false});
    assert.equal(idle.animationAction,'idle');
    assert.equal(flying.animationAction,flight);assert.ok(model.clips[flight]);
    assert.equal(attacking.animationAction,attack);assert.ok(model.clips[attack]);
    assert.notDeepEqual(poseAt(model,flight,0),poseAt(model,flight,Math.max(1,model.clips[flight].length/2)),`${kind} flight changes native pose`);
  }
});

test('Turkey uses donor Stand, falls back to native strut for grounded walking, and prioritizes flap attack',()=>{
  const model=CREATURE_PACK_SUBJECTS.turkey.data;
  assert.ok(model.clips['flap-attack'],'turkey has a dedicated wing-flapping attack clip');
  const owner={id:1,faceX:0,faceY:1},turkey={id:2,kind:'turkey',x:0,y:0,hp:32,speed:82,allyOwner:1,faction:'ally',cooldown:0};
  const game={onSound(){}};
  assert.deepEqual(model.clips.idle,turkeyWowClip('stand'),'donor Stand supplies the runtime idle clip');
  assert.deepEqual(model.clips['wowhead-walk'],turkeyWowClip('walk'),'donor Walk remains available for review');
  const donorFloor=Math.min(...Array.from({length:model.clips['wowhead-walk'].length},(_,frame)=>{
    const pose=poseAt(model,'wowhead-walk',frame);return Math.min(pose.footL[2],pose.footR[2]);
  }));
  assert.ok(donorFloor<0,'donor foot pivots cross below the game floor baseline, so it is not routed for gameplay');
  for(const native of ['strut','peck','flap-run','flap-attack','hurt','death'])assert.ok(model.clips[native],`${native} native clip remains available`);
  assert.equal(creaturePackVisualActor({...turkey,moving:false,animationAction:'peck'}).animationAction,'peck','native peck action is not rewritten');
  assert.equal(creaturePackVisualActor({...turkey,moving:false}).animationAction,'idle');
  assert.equal(creaturePackVisualActor({...turkey,moving:true,walking:true}).animationAction,'strut','native strut is the grounded locomotion fallback');
  assert.equal(creaturePackVisualActor({...turkey,moving:true,walking:false}).animationAction,'flap-run');
  assert.equal(startFollowerAttack(game,owner,turkey),true);
  assert.equal(creaturePackVisualActor(turkey).animationAction,'flap-attack');
  assert.equal(creaturePackVisualActor({...turkey,state:'attack',moving:true,walking:true,animationAction:'walk'}).animationAction,'flap-attack','attack state overrides donor walk routing');
  assert.ok(model.clips['flap-run']);
  assert.notDeepEqual(poseAt(model,'flap-attack',0),poseAt(model,'flap-attack',3),'attack flap visibly articulates wings and body');
});
