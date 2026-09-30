import test from 'node:test';import assert from 'node:assert/strict';
import {defaultPlayerMotion,playerPose,poseAt,playerFrame,playerAction,playerLayers,playerJointAngle,upgradePlayerMotion,validatePlayerMotion} from '../src/player-motion.mjs';
import {Game} from '../src/core.mjs';
const airborne={hp:100,jumpHeight:20,jumpVelocity:1,jumpAge:.2,attack:.17,attackDuration:.34,equipment:{hand1:'sword'}};
test('airborne attack preserves every lower joint and uses independent combat clock',()=>{
 const m=defaultPlayerMotion(),p=playerPose(airborne,.15,m),base=poseAt(m,'jump_air',playerFrame(airborne,.15,m));
 for(const name of ['pelvis','hipL','hipR','kneeL','kneeR','footL','footR'])assert.deepEqual(p[name],base[name]);
 assert.notDeepEqual(p.handR,base.handR);assert.equal(playerLayers(airborne,.15,m)[0].overlay,'slash');
 assert.notDeepEqual(playerPose({...airborne,attack:.05},.15,m).handR,p.handR);
});
test('jump attacks work for actual game melee, bow and wand',()=>{
 for(const type of ['sword','bow','wand']){const g=new Game(()=>.5),p=g.addPlayer('keyboard');g.start();g.openingBoard=false;Object.assign(p,{x:600,y:600,...airborne,equipment:{hand1:type},attack:0,inventory:[{type:'arrow',qty:5}]});
  g.attack(p);assert.ok(p.attack>0);assert.match(playerAction(p),/^jump/);assert.equal(playerLayers(p,g.time)[0].joints.includes('footR'),false);
  if(type==='bow')assert.ok(g.arrows.length);if(type==='wand')assert.ok(g.spells.length);
 }
});
test('manual masks, weight, disabled rules and JSON round trip',()=>{
 const m=defaultPlayerMotion();m.animationLayers[0]={...m.animationLayers[0],overlay:'punch',joints:['handL'],weight:.5};
 assert.ok(validatePlayerMotion(JSON.parse(JSON.stringify(m))));const p=playerPose(airborne,0,m),base=poseAt(m,'jump_air',0);assert.deepEqual(p.handR,base.handR);assert.notDeepEqual(p.handL,base.handL);
 m.animationLayers[0].enabled=false;assert.deepEqual(playerPose(airborne,0,m),base);
 m.animationLayers=[];assert.deepEqual(upgradePlayerMotion(m).animationLayers,[]);delete m.animationLayers;assert.equal(upgradePlayerMotion(m).animationLayers.length,1);
 m.animationLayers=[{...defaultPlayerMotion().animationLayers[0],joints:['bad']}];assert.equal(validatePlayerMotion(m),false);
});
test('masked weapon angles blend and jump foot angles stay intact',()=>{
 const m=defaultPlayerMotion();m.clips.slash.keys=[{frame:0,joints:{},angles:{0:{handR:90,footR:100}}}];m.clips.jump_air.keys=[{frame:0,joints:{},angles:{0:{footR:25}}}];
 assert.equal(playerJointAngle(airborne,0,m,0,'handR'),90);assert.equal(playerJointAngle(airborne,0,m,0,'footR'),25);
 m.animationLayers[0].weight=.5;assert.equal(playerJointAngle(airborne,0,m,0,'handR'),45);
});
test('noncombat jumping, death and explicit clip previews do not mix accidentally',()=>{
 const m=defaultPlayerMotion();for(const a of [{...airborne,attack:0},{...airborne,hp:0},{...airborne,animationAction:'slash'}])assert.deepEqual(playerPose(a,0,m),poseAt(m,playerAction(a),playerFrame(a,0,m)));
});
