import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/core.mjs';
import {playerAction,playerPose,defaultPlayerMotion,upgradePlayerMotion} from '../src/player-motion.mjs';
import {buildHeroGeneration} from '../src/hero-generation.mjs';
import {graveyardWorld,harvestGravestone,tickGraveyard} from '../src/graveyard-world.mjs';
import {restoreHunterPet,tickHunterPets} from '../src/hunter-pets.mjs';
import {companionVisualActor} from '../src/companion-locomotion.mjs';
import {rigSubject} from '../src/rig-subjects.mjs';
import {isUndergroundRoom} from '../src/underground-audio.mjs';
const field=()=>{const g=new Game(()=>.15),p=g.addPlayer('keyboard');Object.assign(g,{phase:'play',openingBoard:false,scenery:[],enemies:[],house:null});g.terrain.fill('grass');Object.assign(p,{x:360,y:420,hp:100});return {g,p};};
test('Wing hover hangs feet below the pelvis on an editable clip; ordinary jumps and edited hover keys remain intact',()=>{
 const model=buildHeroGeneration(defaultPlayerMotion()),snapshot=JSON.stringify(model),a={hp:100,jumpHeight:42,wingHover:true};
 assert.equal(playerAction(a),'wing_hover');assert.equal(playerAction({...a,wingHover:false,jumpVelocity:1}),'jump_air');
 for(let frame=0;frame<8;frame++){
  const p=playerPose({...a,playerFrame:frame},0,model);
  for(const side of ['L','R'])assert.ok(p['foot'+side][2]<p.pelvis[2]-8,'Feet are hanging, not tucked to the hips');
 }
 assert.equal(JSON.stringify(model),snapshot);
 model.clips.wing_hover.keys[0].joints.handR[0]+=2;
 assert.deepEqual(upgradePlayerMotion(model).clips.wing_hover,model.clips.wing_hover);
});
test('Wing flight clears house fences and closed gates after ascent, while solid house walls remain blocked',()=>{
 for(const [kind,door]of [['fence',false],['gate',true],['wall',false]]){
  const {g,p}=field(),barrier={kind,x:400,y:350,w:16,h:150,open:false};g.house={floors:[],walls:door?[]:[barrier],doors:door?[barrier]:[],furniture:[]};
  g.moveActor(p,100,0);assert.ok(p.x<400);
  p.x=360;p.wingHover=true;p.jumpHeight=10;g.moveActor(p,100,0);assert.ok(p.x<400);
  p.x=360;p.jumpHeight=42;g.moveActor(p,100,0);assert.equal(p.x>416,kind!=='wall');
 }
});
test('Bats, bees and other native flyers cross both fence systems without being given a manual flight flag',()=>{
 for(const kind of ['bat','bee','wasp','tsetse','raven','pelican'])for(const cemetery of [false,true]){
  const {g}=field(),e={kind,x:360,y:420,hp:20};
  if(cemetery){g.generatedEnvironment='graveyard';g.graveyard={featuresVersion:2};g.scenery=[{kind:'cemetery_fence',graveyard:true,graveyardFootprint:{x:400,y:350,w:8,h:150}}];}
  else g.house={walls:[{kind:'fence',x:400,y:350,w:16,h:150}],doors:[],furniture:[]};
  g.moveActor(e,100,0);assert.ok(e.x>416,kind);
 }
 const {g,p}=field();g.generatedEnvironment='graveyard';g.graveyard={featuresVersion:2};g.scenery=[{kind:'cemetery_fence',graveyard:true,graveyardFootprint:{x:400,y:350,w:8,h:150}}];
 g.moveActor(p,100,0);assert.ok(p.x<400);p.x=360;p.wingHover=true;p.jumpHeight=42;g.moveActor(p,100,0);assert.ok(p.x>416);
});
test('A disturbed grave zombie pursues through the cemetery after rising instead of staying at its grave',()=>{
 const {g,p}=field();g.random=()=>.1;Object.assign(g,graveyardWorld(75),{generatedEnvironment:'graveyard',seed:75});const s=g.scenery.find(s=>s.kind==='gravestone');
 Object.assign(p,{x:s.x,y:s.rootY+24,faceX:0,faceY:-1});assert.ok(harvestGravestone(g,p,100));const e=g.enemies[0],origin={x:e.x,y:e.y};
 p.y=e.y+140;for(let i=0;i<3;i++)tickGraveyard(g,1);
 assert.ok(!e.graveEmergence);for(let i=0;i<160;i++)g.update(.05,{});
 assert.ok(Math.hypot(e.x-origin.x,e.y-origin.y)>65,'Zombie navigates beyond the spawn plot');assert.ok(e.step>0);
});
test('Each hunter pet follows a stable owner-relative point and advances gait from actual travel',()=>{
 for(const kind of ['lion','wolf','panther','tiger','bat']){
  const {g,p}=field(),pet=restoreHunterPet({kind});Object.assign(pet,{id:3,x:250,y:420});p.hunterPet=pet;p.faceX=1;p.faceY=0;
  const frames=new Set();for(let i=0;i<30;i++){tickHunterPets(g,.05);const a=companionVisualActor(pet,rigSubject(kind).data);if(pet.moving)frames.add(a.playerFrame??i);}
  assert.ok(pet.x>250&&frames.size>3,kind+' advances');
  const position={x:pet.x,y:pet.y};for(let i=0;i<180;i++){g.time+=.05;tickHunterPets(g,.05);}
  assert.ok(Math.hypot(pet.x-position.x,pet.y-position.y)<8,kind+' does not jump between orbit targets');
  pet.attack=.25;const attack=companionVisualActor(pet,rigSubject(kind).data);assert.equal(attack.animationAction,kind==='bat'?'dive':'bite');assert.ok(attack.playerFrame>0);
 }
});
test('Underground SFX routing applies to wells and crypts, excluding surface and upper/storage rooms',()=>{
 const g={portals:[{id:'well',oldWell:true},{id:'crypt',oldWell:true,mausoleum:true},{id:'storage'}]};
 for(const room of ['well','crypt'])assert.ok(isUndergroundRoom(g,room));
 for(const room of [null,'storage','temple-upper'])assert.ok(!isUndergroundRoom(g,room));
});
