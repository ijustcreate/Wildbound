import test from 'node:test';
import assert from 'node:assert/strict';
import {generateWorld} from '../src/world.mjs';
import {Game} from '../src/core.mjs';
import {saveSession,restoreSession} from '../src/session.mjs';
import {clearingDistance,restoreForestLandscape,routeDistance} from '../src/forest-landscape.mjs';
import {burnTallGrass,createHouseShortGrass,createForestTallGrass,drawGrassProp,grassPalette,igniteTallGrassAt,tickTallGrass} from '../src/tall-grass.mjs';
import {lightTorchFire} from '../src/night-equipment.mjs';
import {tickHazards} from '../src/hazards.mjs';

test('forest tall grass is deterministic, varied, and stays away from paving and the starting clearing',()=>{
 const a=generateWorld(417,'forest'),b=generateWorld(417,'forest'),patches=a.scenery.filter(p=>p.kind==='tall_grass');
 assert.ok(patches.length>100&&patches.length<450);
 assert.deepEqual(patches.map(p=>[p.id,p.x,p.y,p.grassPalette]),b.scenery.filter(p=>p.kind==='tall_grass').map(p=>[p.id,p.x,p.y,p.grassPalette]));
 assert.ok(new Set(patches.map(p=>p.grassPalette)).size>1);
 assert.ok(patches.every(p=>p.size>=72&&p.size<=92));
 for(const p of patches){assert.ok(routeDistance(a.forestLandscape,p.x,p.rootY)>=68);assert.ok(clearingDistance(p.x,p.rootY,417)>=1.02);}
});

test('tall grass has a low varied silhouette within its gameplay footprint',()=>{
 const calls=[];const c={save(){},restore(){},translate(){},scale(){},fillRect(...r){calls.push(r);}};
 const patch={kind:'tall_grass',x:500,y:460,rootY:500,size:80,tuftSeed:17};
 assert.equal(drawGrassProp(c,patch,2,'forest'),true);
 assert.ok(calls.length>0);
 assert.ok(calls.every(([x,y,w,h])=>x>=-44&&x+w<=44&&y>=-40&&y+h<=8));
 assert.ok(new Set(calls.filter(([,y])=>y<-10).map(([x])=>x)).size>20,'foliage spans the patch instead of one isolated blade');
});

test('existing forest saves upgrade to dense patches without restoring nearby cut grass',()=>{
 const world=generateWorld(217,'forest'),old=world.scenery.find(p=>p.kind==='tall_grass');
 old.cut=true;old.charred=true;
 world.scenery=world.scenery.filter(p=>p.kind!=='tall_grass').concat(old);
 world.seed=217;world.environment='forest';world.generatedEnvironment='forest';world.forestLandscapeVersion=1;
 restoreForestLandscape(world,1);
 const patches=world.scenery.filter(p=>p.kind==='tall_grass');
 assert.equal(world.forestLandscapeVersion,2);assert.ok(patches.length>100);
 assert.ok(patches.some(p=>p.charred&&Math.hypot(p.x-old.x,p.rootY-old.rootY)<old.size*.7));
});

test('the house yard gets short grass only on outdoor grass, never floors or paths',()=>{
 const world=generateWorld(91,'house'),patches=world.scenery.filter(p=>p.kind==='short_grass');
 assert.ok(patches.length>20);
 for(const p of patches){assert.equal(world.terrain[Math.floor(p.rootY/32)*50+Math.floor(p.x/32)],'grass');assert.ok(!world.house.floors.some(r=>p.x>=r.x-14&&p.x<r.x+r.w+14&&p.rootY>=r.y-14&&p.rootY<r.y+r.h+14));assert.ok(!world.house.paths.some(r=>p.x>=r.x-8&&p.x<r.x+r.w+8&&p.rootY>=r.y-8&&p.rootY<r.y+r.h+8));}
 assert.equal(createHouseShortGrass(91,world.terrain,world.house).length,patches.length);
});

const field=()=>{const g=new Game(()=>.5),p=g.addPlayer('keyboard');g.start();g.openingBoard=false;g.scenery=[];g.enemies=[];g.terrain.fill('grass');Object.assign(p,{x:500,y:500,faceX:1,faceY:0});return{g,p};};
const tuft=(x=536)=>({id:'test-grass-'+x,kind:'tall_grass',x,y:482,rootY:514,size:44,procedural:true,tuftSeed:x});

test('only a bladed swing cuts tall grass; a torch swing burns it while lighting a torch patch does not',()=>{
 const {g,p}=field(),patch=tuft();g.scenery=[patch];g.attack(p);assert.equal(patch.cut,undefined);
 p.attack=0;p.equipment.hand1='starter_sword';g.attack(p);assert.equal(patch.cut,true);assert.equal(patch.charred,undefined);
 p.attack=0;p.equipment.hand1='torch';const torchTarget=tuft(536);g.scenery=[torchTarget];g.attack(p);assert.equal(torchTarget.charred,true);
 p.attack=0;const litTarget=tuft(536);g.scenery=[litTarget];assert.equal(lightTorchFire(g,p),true);tickTallGrass(g,.1);assert.equal(litTarget.charred,undefined);
});

test('a fire bolt chars a lasting streak, spreads only a few clumps, and burns out quickly',()=>{
 const {g}=field(),patches=[tuft(500),tuft(548),tuft(596),tuft(644),tuft(692)];g.scenery=patches;
 for(const p of patches)assert.equal(igniteTallGrassAt(g,p.x,p.rootY),true);tickTallGrass(g,.15);
 assert.ok(patches.filter(p=>p.grassFire>0).length>=2);
 for(let i=0;i<3;i++)tickTallGrass(g,.16);
 assert.ok(patches.every(p=>p.charred));assert.ok(patches.filter(p=>p.grassFire>0).length<=3);
 tickTallGrass(g,.8);assert.equal(patches.filter(p=>p.grassFire>0).length,0);
 assert.ok(patches.every(p=>p.cut&&p.charred));
 const restored=restoreSession(JSON.parse(JSON.stringify(saveSession(g))));
 assert.ok(restored.scenery.filter(p=>p.kind==='tall_grass').every(p=>p.charred));
});

test('a travelling world fireball chars the clumps along its visible flight path',()=>{
 const {g}=field(),patches=[tuft(500),tuft(548),tuft(596)];g.scenery=patches;
 g.fireballs=[{x:480,y:514,vx:480,vy:0,life:2,trail:.2,damage:1,burnDamage:1}];
 tickHazards(g,.1);
 assert.ok(patches.some(p=>p.charred));
});

test('grass palettes support authored tint and shade overrides without changing gameplay scale',()=>{
 const natural=grassPalette({grassPalette:'forest'},'forest'),gold=grassPalette({grassPalette:'forest',grassTint:'#d69945',grassShade:.72},'forest');
 assert.equal(natural.length,4);assert.equal(gold.length,4);assert.notDeepEqual(gold,natural);
});
