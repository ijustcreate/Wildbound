import test from 'node:test';
import assert from 'node:assert/strict';
import {tickSwimming,BREATH_SECONDS} from '../src/swimming.mjs';
import {startJump} from '../src/jumping.mjs';
import {Game} from '../src/core.mjs';
import {readFileSync} from 'node:fs';
import {upgradePlayerMotion,defaultPlayerMotion} from '../src/player-motion.mjs';
import {enemyCanSeeTarget} from '../src/enemy-sight.mjs';
import {villagerAction} from '../src/villager-motion.mjs';
test('Shipping swim animation upgrades without overwriting edited strokes',()=>{
 const model=JSON.parse(readFileSync(new URL('../authored/rigs.json',import.meta.url))).player;
 assert.deepEqual(upgradePlayerMotion(model).clips.swim,model.artGeneration===3?model.clips.swim:defaultPlayerMotion().clips.swim);
 model.clips.swim.keys[0].joints.handL[0]=123;assert.deepEqual(upgradePlayerMotion(model).clips.swim,model.clips.swim);
});
const fixture=()=>({g:{terrain:Array(2500).fill('water'),effects:[]},p:{id:1,x:300,y:300,hp:100,maxHp:100,faceX:1,faceY:0,moving:true}});
test('Players walk into and out of pools but walls and non-swimming enemies stay blocked',()=>{
 const g=new Game();g.environment='house';g.addPlayer('keyboard');g.start();g.scenery=[];g.terrain.fill('grass');
 g.house={pools:[{x:300,y:300,w:200,h:200}],walls:[],doors:[],furniture:[]};const p=g.players[0];Object.assign(p,{x:275,y:350});
 g.moveActor(p,60,0);assert.ok(p.x>300);tickSwimming(g,p,{},.1);assert.ok(p.swimming);assert.equal(g.attack(p,1),false);
 g.moveActor(p,-100,0);assert.ok(p.x<300);tickSwimming(g,p,{},.1);assert.ok(!p.swimming);
 const enemy={kind:'skeleton',x:275,y:350};g.moveActor(enemy,60,0);assert.ok(enemy.x<300);
 g.house.walls=[{x:300,y:300,w:16,h:200}];Object.assign(p,{x:275,y:350});g.moveActor(p,60,0);assert.ok(p.x<300);
});
test('Snakes can enter deep water and see surface swimmers but lose submerged players',()=>{
 const g=new Game();g.environment='house';g.addPlayer('keyboard');g.start();g.scenery=[];g.terrain.fill('grass');
 g.house={pools:[{x:300,y:300,w:200,h:200}],walls:[],doors:[],furniture:[]};
 const snake={kind:'snake',x:275,y:350,speed:70};g.moveActor(snake,60,0);
 assert.ok(snake.x>300);assert.equal(snake.swimming,true);
 const p=g.players[0];Object.assign(p,{x:350,y:350,hp:100,swimming:true,diveDepth:0});
 assert.equal(enemyCanSeeTarget(snake,p),true);p.diveDepth=.5;assert.equal(enemyCanSeeTarget(snake,p),false);
 const anaconda={kind:'anaconda',x:275,y:380,speed:70};g.moveActor(anaconda,60,0);assert.ok(anaconda.x>300);
});
test('April can enter deep water and uses the oathless humanoid swim clips',()=>{
 const g=new Game();g.environment='house';g.addPlayer('keyboard');g.start();g.scenery=[];g.terrain.fill('grass');
 g.house={pools:[{x:300,y:300,w:200,h:200}],walls:[],doors:[],furniture:[]};
 const april={kind:'villager',villagerId:'april',x:275,y:350,faceX:1,faceY:0};
 g.moveActor(april,60,0);assert.ok(april.x>300,'April is not blocked at the pool edge');assert.equal(april.swimming,true);
 assert.equal(villagerAction({...april,moving:true}),'swim');assert.equal(villagerAction({...april,moving:false}),'swim_idle');
});
test('A swimming snake can bite at the surface and drops its attack when the player dives',()=>{
 const g=new Game(()=>.5);g.environment='house';const p=g.addPlayer('keyboard');g.start();
 g.openingBoard=false;g.scenery=[];g.terrain.fill('grass');g.house={pools:[{x:300,y:300,w:200,h:200}],walls:[],doors:[],furniture:[]};
 const snake={id:g.nextId++,kind:'snake',group:8,x:342,y:350,hp:60,maxHp:60,speed:70,damage:10,state:'hunt',timer:0,cooldown:0,faceX:1,faceY:0,orbit:1,tacticTime:0};
 g.configureCreature(snake,false);g.enemies=[snake];Object.assign(p,{x:350,y:350,hp:100,invuln:0});
 for(let n=0;n<50&&p.hp===100;n++)g.update(.05,{});
 assert.ok(p.hp<100,'surface bite');
 p.diveDepth=1;snake.state='windup';snake.timer=.8;g.update(.05,{});
 assert.equal(snake.state,'hunt');assert.equal(snake.timer,0);assert.equal(snake.moving,false);
});
test('Water entry emits particles once; moving surface swimmers leave wakes',()=>{
 const {g,p}=fixture();tickSwimming(g,p,{},.1);assert.equal(p.swimming,true);assert.equal(p.breath,BREATH_SECONDS);assert.equal(g.effects.filter(e=>e.particle==='splash').length,1);assert.ok(g.effects.some(e=>e.particle==='swim-wake'));
 tickSwimming(g,p,{},.1);assert.equal(g.effects.filter(e=>e.particle==='splash').length,1);
});
test('Holding attack dives, releasing floats up; air recovers quickly',()=>{
 const {g,p}=fixture();for(let i=0;i<30;i++)tickSwimming(g,p,{attack:true},.1);
 assert.equal(p.diveDepth,1);assert.ok(p.breath<20);assert.ok(g.effects.some(e=>e.particle==='bubbles'));
 for(let i=0;i<40;i++)tickSwimming(g,p,{},.1);assert.equal(p.diveDepth,0);assert.equal(p.breath,20);assert.equal(p.breathVisible,0);
});
test('Twenty seconds of submersion then 25% max health per full second',()=>{
 const {g,p}=fixture();p.diveDepth=1;tickSwimming(g,p,{attack:true},20);assert.equal(p.breath,0);assert.equal(p.hp,100);
 tickSwimming(g,p,{attack:true},1);assert.equal(p.hp,75);tickSwimming(g,p,{attack:true},2);assert.equal(p.hp,25);
 p.diveDepth=0;tickSwimming(g,p,{},.1);assert.equal(p.hp,25);assert.ok(p.breath>0);assert.equal(p.drownClock,0);
});
test('Jump exits water; landing emits another splash; leaving water resets depth',()=>{
 const {g,p}=fixture();tickSwimming(g,p,{},.1);assert.ok(startJump(p));tickSwimming(g,p,{},.1);assert.equal(p.swimming,false);
 p.jumpHeight=0;tickSwimming(g,p,{},.1);assert.equal(g.effects.filter(e=>e.particle==='splash').length,2);
 g.terrain.fill('grass');tickSwimming(g,p,{attack:true},.1);assert.equal(p.swimming,false);assert.equal(p.diveDepth,0);
});
