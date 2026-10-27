import test from 'node:test';import assert from 'node:assert/strict';import {Game} from '../src/core.mjs';import {igniteTallGrassAt,grassRootBurned} from '../src/tall-grass.mjs';import {grassFieldInstances} from '../src/grass-field.mjs';import {lightSources} from '../src/night-cycle.mjs';import {saveSession,restoreSession} from '../src/session.mjs';import {bridgeAt} from '../src/terrain-support.mjs';import {tickSwimming} from '../src/swimming.mjs';
test('Cinder paths burn local blade roots rather than a whole horizontal clump and survive saves',()=>{
 const g=new Game(()=>.4),p=g.addPlayer('keyboard');g.start();g.openingBoard=false;g.scenery=[];g.terrain.fill('grass');g.effects=[];const patch={id:'burn-qa',kind:'tall_grass',x:500,y:468,rootY:500,size:80,tuftSeed:12};g.scenery=[patch];
 const before=grassFieldInstances(g,{sx:450,sy:450,ex:550,ey:550},[patch]);for(const [x,y]of [[496,491],[500,500],[504,509]])igniteTallGrassAt(g,x,y,{trail:true});
 assert.ok(patch.grassBurnMarks.length>=2);assert.equal(patch.charred,undefined);assert.equal(grassRootBurned(patch,500,500),true);assert.equal(grassRootBurned(patch,530,500),false);const after=grassFieldInstances(g,{sx:450,sy:450,ex:550,ey:550},[patch]);assert.ok(after.length<before.length&&after.length>before.length*.5);assert.ok(g.effects.every(f=>f.particle==='cinder-trail'&&f.x>=496&&f.x<=504));
 const restored=restoreSession(JSON.parse(JSON.stringify(saveSession(g))));assert.deepEqual(restored.scenery.find(p=>p.id==='burn-qa').grassBurnMarks,patch.grassBurnMarks);
});
test('Fire bolts and their burning paths light the world and disappear from light sources at expiry',()=>{
 const g=new Game(()=>.4);g.phase='play';g.sky={elapsed:330};g.players=[];g.scenery=[];g.spells=[{fire:true,x:100,y:200,life:1}];g.effects=[{particle:'cinder-trail',x:120,y:220,life:.5}];let sources=lightSources(g);assert.ok(sources.some(s=>s.x===100&&s.radius>=90));assert.ok(sources.some(s=>s.x===120&&s.intensity>0));g.spells[0].life=0;g.effects[0].life=0;sources=lightSources(g);assert.ok(!sources.some(s=>s.x===100||s.x===120));
});
test('Beach pier uses forest bridge swim-under support and never turns house floorboards into bridges',()=>{
 const g=new Game(()=>.4),p=g.addPlayer('keyboard');g.environment='beach';g.start();g.openingBoard=false;g.scenery=[];p.x=448;p.y=256;p.swimming=true;p.groundHeight=0;p.jumpHeight=0;assert.equal(bridgeAt(g,p.x,p.y),true);tickSwimming(g,p,{},.02);assert.equal(p.underBridge,true);assert.equal(p.swimming,true);const x=p.x;assert.ok(g.moveActor(p,4,0)>0&&p.x>x);p.swimming=false;p.underBridge=false;tickSwimming(g,p,{},.02);assert.equal(p.groundHeight,10);assert.equal(p.swimming,false);g.generatedEnvironment='house';assert.equal(bridgeAt(g,448,256),false);
});

test('A diagonal Cinder bolt records ground fire on its actual simulated path',()=>{
 const g=new Game(()=>.4),p=g.addPlayer('keyboard');g.start();g.openingBoard=false;g.enemies=[];g.terrain.fill('grass');g.scenery=[{id:'diagonal-qa',kind:'tall_grass',x:500,y:468,rootY:500,size:80,tuftSeed:12}];p.x=p.y=400;
 g.spells=[{owner:p.id,x:480,y:480,vx:200,vy:200,fire:true,life:2,remaining:180,damage:0,size:4,age:0}];
 for(let i=0;i<16;i++)g.tickAdventure(.01,{});
 const marks=g.scenery[0].grassBurnMarks;assert.ok(marks?.length>=2);assert.ok(marks.every(m=>Math.abs(m.y-m.x)<.01));assert.equal(g.scenery[0].charred,undefined);
});
