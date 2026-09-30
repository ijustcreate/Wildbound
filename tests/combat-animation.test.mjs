import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildCombatPass,combatWeaponVector,SWING_ACTIONS} from '../src/combat-animation.mjs';
import {buildHeroGeneration} from '../src/hero-generation.mjs';
import {loadoutKind} from '../src/combat-combos.mjs';
import {defaultPlayerMotion,validatePlayerMotion,playerPose,playerFrame,playerEquipmentAction,projectPoint} from '../src/player-motion.mjs';
const old=buildHeroGeneration(defaultPlayerMotion()),model=buildCombatPass(old);
const distance=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));
test('Combat revision stays editable, preserves noncombat clips, and retains gameplay clip durations',()=>{
  assert.ok(validatePlayerMotion(model));
  assert.notEqual(old.combatRevision,4);
  for(const name of ['idle','run','walk','death','get_up','sleep','swim','mine'])assert.deepEqual(model.clips[name],old.clips[name]);
  for(const [name,clip] of Object.entries(model.clips))assert.ok(Math.abs(clip.length/clip.fps-old.clips[name].length/old.clips[name].fps)<1e-9,name);
  assert.deepEqual(model.animationLayers,old.animationLayers);
});
test('Every attack and loadout retains finite fixed-length limbs at fractional frames',()=>{
  const loadouts=[{}, {hand1:'sword'}, {hand1:'dagger'}, {hand1:'dagger',hand2:'sword'}, {hand1:'sword',hand2:'sword'}, {hand1:'wand',hand2:'wand'}, {hand1:'rifle'}, {hand1:'bow'}];
  for(const action of [...SWING_ACTIONS,'punch','punch_left','punch_right','uppercut','cast','draw','ranged','shield','parry'])for(const equipment of loadouts){
    for(let frame=0;frame<model.clips[action].length;frame+=.5){
      const p=playerPose({animationAction:action,playerFrame:frame,equipment},0,model);
      for(const value of Object.values(p))assert.ok(value.every(Number.isFinite));
      for(const {root,mid,end} of Object.values(model.ik))for(const [a,b] of [[root,mid],[mid,end]])assert.ok(Math.abs(distance(p[a],p[b])-distance(model.joints[a].position,model.joints[b].position))<1e-5,action);
    }
  }
});
test('Blade arcs retain visible travel in every direction, including side views',()=>{
  for(const action of SWING_ACTIONS)for(const kind of ['sword','dagger'])for(let d=0;d<8;d++){
    const points=Array.from({length:21},(_,i)=>projectPoint(combatWeaponVector(action,i/20,kind),d));
    assert.ok(points.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)));
    const span=Math.hypot(Math.max(...points.map(p=>p.x))-Math.min(...points.map(p=>p.x)),Math.max(...points.map(p=>p.y))-Math.min(...points.map(p=>p.y)));
    assert.ok(span>(kind==='dagger'?6:12),`${action}/${kind}/${d}`);
  }
});
test('Combo starts and ends in guard, while its strikes have distinct hand paths',()=>{
  const pose=(action,t,equipment={})=>playerPose({animationAction:action,poseTime:t,equipment},0,model);
  assert.deepEqual(pose('sword_combo',0),pose('sword_combo',1));
  assert.ok(distance(pose('sword_combo',.18).handR,pose('sword_combo',.55).handR)>8);
  const equipment={hand1:'sword',hand2:'sword'};
  assert.notDeepEqual(pose('swipe_two',.43,equipment).handL,pose('swipe_two',.43).handL);
});
test('Bow draw samples the entire revised clip at full charge',()=>{
  assert.equal(playerFrame({charge:1},0,model,'draw'),model.clips.draw.length-1);
  assert.equal(playerFrame({charge:0},0,model,'draw'),0);
});
test('Rifle recoil starts at its own timer and airborne weapons follow the combat layer',()=>{
  assert.equal(playerFrame({attack:.25,attackDuration:.25},0,model,'ranged'),0);
  const actor={jumpHeight:8,jumpAge:.2,jumpVelocity:2,attack:.17,attackDuration:.34,attackClip:'swipe_one',equipment:{hand1:'sword'}};
  const result=playerEquipmentAction(actor,100,model);
  assert.equal(result.action,'swipe_one');assert.equal(result.frame,(model.clips.swipe_one.length-1)*.5);
});
test('Authored shipping data contains the combat revision',()=>{
  const rig=JSON.parse(fs.readFileSync(new URL('../authored/rigs.json',import.meta.url))).player;
  assert.equal(rig.combatRevision,4);assert.ok(validatePlayerMotion(rig));
});
test('Named blades and whip select weapon combos using item metadata',()=>{
  assert.equal(loadoutKind({equipment:{hand1:'krampus_whip'}}),'sword');
  assert.equal(loadoutKind({equipment:{hand1:'moon_blade',hand2:'iron_sword'}}),'dual_sword');
  assert.equal(loadoutKind({equipment:{hand1:'sun_blade',hand2:'moon_shield'}}),'sword_shield');
});
