import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {defaultBeetleMotion,upgradeBeetleMotion,beetleAction,beetleFrame,drawBeetle} from '../src/beetle-motion.mjs';
import {legacyInsectMotion,validateBeastMotion,beastMotions,replaceBeastMotion,beastMotionRevisions} from '../src/beast-motion.mjs';
import {poseAt,directionVector,setJointKey} from '../src/player-motion.mjs';
import {captureLayers,capturedLayers,releaseLayers} from '../src/render-order.mjs';
import {companionVisualActor} from '../src/companion-locomotion.mjs';
import {Game} from '../src/core.mjs';
import {befriendCreature,tickFriendlyCreature} from '../src/friendly-creatures.mjs';
function canvas(){const calls=[];return {calls,fillStyle:'',fillRect(x,y,w,h){assert.ok([x,y,w,h].every(Number.isInteger));assert.ok(w>0&&h>0);calls.push([x,y,w,h,this.fillStyle]);}};}

test('shared shipped beetle upgrades without rewriting authored rigs or losing custom artwork',()=>{
 const saved=JSON.parse(fs.readFileSync(new URL('../authored/rigs.json',import.meta.url))).beastMotions.beetle,legacy=legacyInsectMotion();
 assert.ok(validateBeastMotion('beetle',saved));assert.deepEqual(upgradeBeetleMotion(saved,legacy),defaultBeetleMotion());
 const custom=structuredClone(legacy);custom.palette.body='#112233';custom.joints.head.position[0]=2;custom.visibility.foot0L[2]=false;custom.clips.walk.keys[2].joints.foot0L=[1,2,3];
 custom.boneSprites={Body:{2:{width:1,height:1,x:0,y:0,palette:['transparent','#abcdef'],pixels:[1]}}};custom.renderOrder={2:['Head','Body']};
 const upgraded=upgradeBeetleMotion(custom,legacy);
 for(const f of ['boneSprites','renderOrder'])assert.deepEqual(upgraded[f],custom[f]);
 assert.equal(upgraded.palette.body,'#112233');assert.deepEqual(upgraded.joints.head,custom.joints.head);assert.deepEqual(upgraded.visibility.foot0L,custom.visibility.foot0L);assert.deepEqual(upgraded.clips.walk,custom.clips.walk);
 assert.ok(validateBeastMotion('beetle',upgraded));assert.deepEqual(upgradeBeetleMotion(upgraded,legacy),upgraded);assert.deepEqual(custom.clips.run,legacy.clips.run);
 for(const bad of [m=>m.joints.head.position[0]=Infinity,m=>delete m.visibility.head,m=>delete m.clips.walk,m=>m.version=9]){const m=structuredClone(legacy);bad(m);assert.equal(validateBeastMotion('beetle',m),false);}
});
test('six articulated legs use complementary tripod contact phases, distinct gaits and smooth wraparound',()=>{
 const m=defaultBeetleMotion();assert.ok(validateBeastMotion('beetle',m));
 assert.equal(Object.keys(m.joints).filter(n=>n.startsWith('foot')).length,6);
 for(let f=0;f<12;f+=.25){const p=poseAt(m,'walk',f),up=Object.keys(p).filter(n=>n.startsWith('foot')&&p[n][2]>1.001);assert.ok(up.length<=3);
  for(const triplet of [['foot0L','foot1R','foot2L'],['foot0R','foot1L','foot2R']])assert.equal(new Set(triplet.map(n=>Math.round(p[n][2]*100))).size,1);
 }
 assert.notDeepEqual(m.clips.walk,m.clips.run);assert.notDeepEqual(poseAt(m,'walk',2),poseAt(m,'run',2));
 const a=poseAt(m,'run',11.999),b=poseAt(m,'run',0);for(const n of Object.keys(a))assert.ok(Math.hypot(...a[n].map((v,i)=>v-b[n][i]))<.02,n);
 assert.notDeepEqual(poseAt(m,'attack',0).jawL,poseAt(m,'attack',3).jawL);
 assert.ok(poseAt(m,'death',9).pelvis[2]<poseAt(m,'idle',0).pelvis[2]);
});
test('gameplay attack, damage, traps, stationary poses and editor overrides select the correct beetle clip',()=>{
 const m=defaultBeetleMotion();for(const [actor,clip]of [[{moving:true,speed:90},'walk'],[{moving:true,speed:180},'run'],[{attack:.2,moving:true},'attack'],[{flash:.15,attack:.2},'hurt'],[{state:'snared',attack:.2},'snared'],[{hp:0},'death'],[{state:'windup'},'windup'],[{},'idle'],[{animationAction:'bite'},'attack']])assert.equal(beetleAction(actor),clip);
 assert.equal(beetleFrame({moving:true,step:0},5,m),0);assert.ok(beetleFrame({moving:true,step:7},5,m)>0);
 assert.ok(beetleFrame({attack:.1},5,m)>beetleFrame({attack:.2},5,m));assert.equal(beetleFrame({playerFrame:2},99,m),2);
 const friend=companionVisualActor({kind:'beetle',faction:'ally',hp:20,moving:true,step:7,speed:90,poseTime:0},m);assert.equal(friend.animationAction,'walk');assert.equal(friend.poseTime,undefined);assert.ok(friend.playerFrame>0);
 assert.equal(companionVisualActor({...friend,attack:.2,animationAction:null},m).animationAction,null);
});
test('every beetle clip renders in eight directions with crisp, bounded, palette-coloured pixels',()=>{
 const m=defaultBeetleMotion();const idleViews=new Set();
 for(const clip of Object.keys(m.clips))for(let d=0;d<8;d++)for(const f of [0,3,7]){
  const [faceX,faceY]=directionVector(d),c=canvas();drawBeetle(c,{kind:'beetle',faceX,faceY,animationAction:clip,playerFrame:f},0,m);
  assert.ok(c.calls.length>40&&c.calls.length<1000,clip+' '+d+' '+c.calls.length);
  for(const [x,y,w,h,color]of c.calls){assert.ok(x>=-48&&y>=-48&&x+w<48&&y+h<48);assert.ok(Object.values(m.palette).includes(color));}
  if(clip==='idle'&&f===0)idleViews.add(JSON.stringify(c.calls));
 }
 assert.equal(idleViews.size,8);const c=canvas();m.palette.body='#ff1234';drawBeetle(c,{faceX:0,faceY:1},0,m);assert.ok(c.calls.some(p=>p[4]==='#ff1234'));
});
test('studio layer capture targets actual insect bones and painted overrides remain usable',()=>{
 const m=defaultBeetleMotion(),c=canvas();captureLayers(m);drawBeetle(c,{faceX:0,faceY:1,animationAction:'idle',playerFrame:0},0,m);releaseLayers(m);
 const layers=capturedLayers(m,0);assert.equal(layers.filter(l=>/^foot/.test(l.id)).length,6);assert.ok(layers.find(l=>l.id==='foot1R').bones.includes('knee1R'));
 const layer=layers.find(l=>l.id==='Body');m.boneSprites={Body:{0:{...layer.sprite,palette:layer.sprite.palette.map((p,i)=>i?'#ab23ef':p)}}};const painted=canvas();drawBeetle(painted,{faceX:0,faceY:1},0,m);assert.ok(painted.calls.some(p=>p[4]==='#ab23ef'));
 const before=poseAt(m,'walk',2).antennaL;setJointKey(m,'walk',2,'antennaL',[before[0]-1,before[1],before[2]]);assert.ok(validateBeastMotion('beetle',m));
 const old=structuredClone(beastMotions.beetle),revision=beastMotionRevisions.beetle;replaceBeastMotion('beetle',m);assert.ok(beastMotionRevisions.beetle>revision);replaceBeastMotion('beetle',old);
});
test('charmed beetles advance their walk poses with actual follower movement',()=>{
 const g=new Game(()=>.5);g.phase='play';g.openingBoard=false;g.scenery=[];g.house=null;g.terrain.fill('grass');const owner=g.addPlayer('pad:0');Object.assign(owner,{x:300,y:300});
 const e={id:900,kind:'beetle',hp:40,maxHp:40,x:450,y:300,speed:90,damage:10,animationAction:'attack',playerFrame:0};g.enemies=[e];assert.ok(befriendCreature(e,owner.id));const frames=new Set();
 for(let i=0;i<12;i++){tickFriendlyCreature(g,e,.05);const v=companionVisualActor(e,defaultBeetleMotion());frames.add(beetleFrame(v,i*.05,defaultBeetleMotion()));}
 assert.ok(frames.size>6);assert.ok(e.x<450);assert.equal(e.animationAction,null);
});
