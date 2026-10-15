import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {defaultBeastMotion,validateBeastMotion,nativeBoarMotion} from '../src/beast-motion.mjs';
import {defaultNightMotion,validateNightMotion,legacyNightMotion} from '../src/night-rigs.mjs';
import {defaultSpiderMotion} from '../src/spider-motion.mjs';
import {upgradeWowCreatureMotion} from '../src/wow-creature-transfer.mjs';
import {poseAt} from '../src/player-motion.mjs';

const specs=[['spider',35985,defaultBeastMotion,validateBeastMotion,['idle','walk','run','attack','hurt','death']],
 ['boar',193,defaultBeastMotion,validateBeastMotion,['idle','walk','run','charge','attack','hurt','death']],
 ['elephant',61148,defaultNightMotion,validateNightMotion,['idle','walk','run','charge','trumpet','death']]];
test('WoW reference motion remains native editable clips for all three Wildbound creatures',()=>{
 const authored=JSON.parse(fs.readFileSync(new URL('../authored/rigs.json',import.meta.url)));
 for(const [kind,display,factory,validate,actions] of specs){
  const model=factory(kind),stored=authored[kind==='elephant'?'nightMotions':'beastMotions'][kind];
  assert.equal(model.motionSource.displayId,display);
  assert.equal(stored.motionSource.displayId,display);
  assert.ok(validate(kind,model));assert.ok(validate(kind,stored));
  for(const action of actions){const clip=stored.clips[action];assert.ok(clip,kind+' '+action);
   const first=poseAt(stored,action,0),middle=poseAt(stored,action,(clip.length-1)/2);
   for(const pose of [first,middle])for(const p of Object.values(pose))assert.ok(p.every(Number.isFinite));
  }
 }
 assert.equal(defaultSpiderMotion('tarantula').motionSource,undefined);
});
test('stored art and custom clips survive migration onto the boar and elephant donors',()=>{
 for(const [kind,previous,fresh] of [['boar',nativeBoarMotion(),defaultBeastMotion('boar')],['elephant',legacyNightMotion('elephant'),defaultNightMotion('elephant')]]){
  const saved=structuredClone(previous);saved.palette.body='#123456';saved.clips.walk.keys[0].joints.pelvis=[1,2,3];saved.boneSprites={Custom:{0:{width:1,height:1,x:0,y:0,palette:['transparent','#ffffff'],pixels:[1]}}};
  const result=upgradeWowCreatureMotion(saved,previous,fresh);
  assert.equal(result.palette.body,'#123456');assert.deepEqual(result.clips.walk,saved.clips.walk);assert.deepEqual(result.boneSprites,saved.boneSprites);
  assert.equal(result.motionSource.displayId,fresh.motionSource.displayId);
 }
});
test('elephant profiles show the near eye and hide the far eye',()=>{
 const m=defaultNightMotion('elephant');
 assert.equal(m.visibility.eyeR[2],true);assert.equal(m.visibility.eyeL[2],false);
 assert.equal(m.visibility.eyeL[6],true);assert.equal(m.visibility.eyeR[6],false);
 assert.ok(m.joints.earR.position[1]<m.joints.head.position[1]);
 assert.ok(m.joints.eyeR.position[2]>m.joints.head.position[2]);
});
