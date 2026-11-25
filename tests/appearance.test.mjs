import test from 'node:test';
import assert from 'node:assert/strict';
import { Profiles } from '../src/profiles.mjs';
import { DEFAULT_APPEARANCE, EXPLORER_PRESET, HAIR_STYLES } from '../src/appearance.mjs';
import { drawPlayer, defaultPlayerMotion, defaultNativePlayerMotion, directionVector, heldItemWorld, isDefaultExplorer, validatePlayerMotion,playerPose,playerRenderPose,projectPoint,quiverPose } from '../src/player-motion.mjs';
import { fitDefaultExplorerPose } from '../src/default-explorer-art.mjs';
import {renderLayers} from '../src/render-order.mjs';
import { RigStudio } from '../src/player-studio.mjs';
test('Stock explorer art recognizes new and legacy playable defaults', () => {
  const profiles=new Profiles();
  profiles.save=()=>{};
  for(const appearance of [EXPLORER_PRESET,DEFAULT_APPEARANCE,null]){
    const hero=profiles.create('Default '+profiles.data.heroes.length,appearance),player={};
    profiles.assign(player,hero);
    assert.equal(isDefaultExplorer(player),true);
    assert.equal(isDefaultExplorer({appearance:player.appearance,sprite:'player',isPlayer:true}),false);
  }
  const preview={appearance:EXPLORER_PRESET,stockExplorerPreview:true};
  assert.equal(isDefaultExplorer(preview),true);
  assert.equal(isDefaultExplorer({...preview,appearance:{...EXPLORER_PRESET,hair:'long'}}),false);
});
test('The stock explorer fit preserves foot contacts and visibly lengthens both arm segments', () => {
  const model=defaultPlayerMotion();
  const [faceX,faceY]=directionVector(7);
  const pose=playerPose({faceX,faceY,animationAction:'run',playerFrame:3.5},0,model);
  const original=structuredClone(pose);
  const points=Object.fromEntries(Object.entries(pose).map(([joint,point])=>[joint,projectPoint(point,7)]));
  const originalPoints=structuredClone(points);
  const fitted=fitDefaultExplorerPose(pose,points);

  assert.deepEqual(pose,original);
  for(const joint of ['footL','footR']){
    assert.deepEqual(fitted[joint],original[joint]);
    assert.deepEqual(points[joint],originalPoints[joint]);
  }
  assert.ok(points.pelvis.y>originalPoints.pelvis.y);
  const eyeOffset=posePoints=>posePoints.head.y-posePoints.eyeL.y;
  assert.ok(Math.abs(eyeOffset(points)-eyeOffset(originalPoints))<1e-9);
  assert.ok(Math.abs(points.handR.y-projectPoint(fitted.handR,7).y)<1e-9);
  const distance=(a,b)=>Math.hypot(...a.map((value,index)=>value-b[index]));
  for(const side of ['L','R']){
    const joints=['shoulder','elbow','hand'].map(joint=>joint+side);
    const previous=joints.map((joint,index)=>{
      const [x,y,z]=original[joint];
      return [x,y,z-[3.75,3.25,2.7][index]];
    });
    assert.deepEqual(fitted[joints[0]],previous[0]);
    for(let i=1;i<joints.length;i++){
      const length=distance(fitted[joints[i-1]],fitted[joints[i]]);
      assert.ok(Math.abs(length/distance(previous[i-1],previous[i])-1.1)<1e-9);
    }
  }
});
test('Custom native humanoids share the fitted pose and its held-item origin', () => {
  const model=defaultNativePlayerMotion();
  const actor={x:40,y:80,hp:100,faceX:0,faceY:1,animationAction:'idle',playerFrame:0,
    appearance:{...DEFAULT_APPEARANCE,hair:'long',shirt:'#5d4b81'},equipment:{hand1:'wand'}};
  const raw=playerPose(actor,0,model),fitted=playerRenderPose(actor,0,model);
  assert.deepEqual(fitted,fitDefaultExplorerPose(raw));
  assert.deepEqual(fitted.footL,raw.footL);
  const hand=projectPoint(fitted.handR,0);
  assert.deepEqual(heldItemWorld(actor,'hand1',0,model,48),{x:actor.x+hand.x,y:actor.y+hand.y});

  const hatted={...actor,equipment:{...actor.equipment,head:'hat'}};
  assert.deepEqual(playerRenderPose(hatted,0,model),playerPose(hatted,0,model));
  const separate={...model,type:'villager'};
  assert.deepEqual(playerRenderPose(actor,0,separate),playerPose(actor,0,separate));
  const painted={...model,boneSprites:{'Body and pelvis':{0:{}}}};
  assert.deepEqual(playerRenderPose(actor,0,painted),playerPose(actor,0,painted));
  painted.boneSprites['Body and pelvis'][0].humanoidBaseFit=true;
  assert.deepEqual(playerRenderPose(actor,0,painted),fitted);
});
test('Appearance persists with a character independently of stat-bearing gear', () => {
  const profiles = new Profiles(); profiles.save = () => {};
  const hero = profiles.create('Cosmetic test', DEFAULT_APPEARANCE), player = {};
  profiles.assign(player,hero);
  assert.deepEqual(player.appearance,DEFAULT_APPEARANCE);
  assert.equal(player.equipment.hair,undefined);
  player.appearance.hair = 'long';
  profiles.capture({players:[player],sharedStash:[]});
  assert.equal(hero.appearance.hair,'long');
});
test('All hairstyles render in eight directions and equipment adjustments round-trip', () => {
  const model=defaultPlayerMotion();
  model.wearables={hat:{0:{x:2,y:-1,scale:1.2,rotation:10,pixels:Array(256).fill('#ffffff')}}};
  assert.ok(validatePlayerMotion(JSON.parse(JSON.stringify(model))));
  let pixels=0;
  const c={save(){},restore(){},translate(){},rotate(){},scale(){},fillRect(...v){assert.ok(v.every(Number.isFinite));pixels++;}};
  for (const hair of Object.keys(HAIR_STYLES)) for(let d=0;d<8;d++) {
    const [faceX,faceY]=directionVector(d);
    drawPlayer(c,{faceX,faceY,appearance:{...DEFAULT_APPEARANCE,hair},equipment:d===0?{head:'hat'}:{}},0,model);
  }
  assert.ok(pixels>100);
});
test('Equipped quivers render saved heroes and inventory-free previews in all directions', (t) => {
  const c=new Proxy({}, {get:(target,key)=>target[key]??(()=>{}),set:(target,key,value)=>{target[key]=value;return true;}});
  const originalDocument=globalThis.document;
  globalThis.document={createElement:()=>({getContext:()=>c})};
  t.after(()=>{if(originalDocument===undefined)delete globalThis.document;else globalThis.document=originalDocument;});
  const model=defaultPlayerMotion();
  for(const inventory of [undefined,[],[{type:'arrow',qty:8}],[{type:'starter_arrow',qty:8}]])for(let d=0;d<8;d++){
    const [faceX,faceY]=directionVector(d);
    assert.doesNotThrow(()=>drawPlayer(c,{faceX,faceY,inventory,equipment:{back:'starter_quiver'},appearance:DEFAULT_APPEARANCE},0,model));
  }
});

test('New studios and newly selected rigs start paused', () => {
  const studio=new RigStudio(()=>{});
  assert.equal(studio.playing,false);
  studio.setSubject('water_elemental');
  assert.equal(studio.playing,false);
  assert.ok(studio.model.joints[studio.selected]);
});

test('Slim quiver follows animated torso and stays on its back despite saved layer orders',()=>{
 const c=new Proxy({}, {get:(target,key)=>target[key]??(()=>{}),set:(target,key,value)=>{target[key]=value;return true;}});
 const model=defaultPlayerMotion();
 for(const action of ['idle','walk','run','draw','ranged','dash','mine','carry','death','sleep'])for(let d=0;d<8;d++)for(const time of [0,.3,.7]){
  const [faceX,faceY]=directionVector(d),actor={faceX,faceY,animationAction:action,hp:100,equipment:{back:'starter_quiver'},inventory:[{type:'arrow',qty:3}]};
  const q=quiverPose(playerPose(actor,time,model),d);
  assert.ok(Object.values(q.top).every(Number.isFinite));assert.equal(q.width,4);
  model.renderOrder={[d]:['Body and pelvis','Head','Quiver']};
  drawPlayer(c,actor,time,model);const order=renderLayers(model,d);
  assert.equal(order.indexOf('Quiver')<order.indexOf('Body and pelvis'),q.behind,`${action} ${d} ${time}`);
 }
 const actor={animationAction:'idle'},q=quiverPose(playerPose(actor,0,model),0);
 assert.ok(Math.hypot(q.top.x-q.bottom.x,q.top.y-q.bottom.y)>q.width*3);
});

test('Bow ready pose keeps hands forward, feet planted, and correct saved-order occlusion',()=>{
 const c=new Proxy({}, {get:(target,key)=>target[key]??(()=>{}),set:(target,key,value)=>{target[key]=value;return true;}});
 const model=defaultPlayerMotion();
 for(let d=0;d<8;d++)for(const inventory of [[],[{type:'arrow',qty:3}]]){
  const [faceX,faceY]=directionVector(d),actor={faceX,faceY,hp:100,animationAction:'idle',equipment:{hand1:'bow'},inventory};
  const pose=playerPose(actor,0,model);assert.ok(pose.handL[1]>pose.chest[1]);assert.ok(pose.handR[1]>pose.chest[1]);
  assert.ok(pose.footR[0]>pose.footL[0]);model.renderOrder={[d]:['Body and pelvis','Bow']};
  drawPlayer(c,actor,0,model);const order=renderLayers(model,d);
  if(d>=3&&d<=5)assert.ok(order.indexOf('Bow')<order.indexOf('Body and pelvis'));
  if(d===0)assert.ok(order.indexOf('Bow')>order.indexOf('Body and pelvis'));
 }
});
test('shields and wands stay visible at their holding forearm at every viewing angle',()=>{
 const c=new Proxy({}, {get:(target,key)=>target[key]??(()=>{}),set:(target,key,value)=>{target[key]=value;return true;}});
 const model=defaultPlayerMotion();
 for(const action of ['idle','walk','run','cast','block'])for(let d=0;d<8;d++){
  const [faceX,faceY]=directionVector(d);
  const actor={faceX,faceY,appearance:DEFAULT_APPEARANCE,equipment:{hand1:'starter_wand',hand2:'starter_shield'},animationAction:action,hp:100};
  model.renderOrder={[d]:['Held item L','Held item R','Body and pelvis','Arm L','Arm R']};
  const pose=drawPlayer(c,actor,.32,model);
  const order=renderLayers(model,d);
  for(const side of ['L','R']){
   const arm=order.indexOf(`Arm ${side}`),held=order.indexOf(`Held item ${side}`);
   assert.ok(arm>=0&&held>=0,`${action} ${d} ${side} drawn`);
   const forearm=order.indexOf(`Forearm ${side}`);
   assert.ok(held>(forearm>=0?forearm:arm),`${action} ${d} ${side} grip remains visible above its own forearm`);
  }
 }
});
