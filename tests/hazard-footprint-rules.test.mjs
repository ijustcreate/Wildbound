import test from 'node:test';
import assert from 'node:assert/strict';
import {webSlow} from '../src/expansion.mjs';
import {tickHazards} from '../src/hazards.mjs';
import {drawTracks} from '../src/environment.mjs';
import {sampleBansheeSteps} from '../src/banshee-steps.mjs';
import {Game} from '../src/core.mjs';
import {beachWorld, BEACH_PIER} from '../src/beach-world.mjs';
import {waterAt} from '../src/environment.mjs';

test('ground webs slow grounded actors but never airborne or flying actors',()=>{
 const g={webs:[{x:100,y:100,radius:40}]};
 assert.equal(webSlow(g,{kind:'lion',x:100,y:100}),true);
 for(const a of [{kind:'lion',x:100,y:100,jumpHeight:12},{kind:'bat',x:100,y:100},{kind:'bee',x:100,y:100,flying:true}])assert.equal(webSlow(g,a),false);
});

test('ground fire does not hit airborne or flying players and enemies',()=>{
 const g={time:0,fireballs:[],firePatches:[{x:96,y:96,life:3,tick:0,damage:10,playerLit:true}],players:[],enemies:[],effects:[],fireParticles:[],volcanoes:[],lava:[],bananas:[],shieldBlocks:()=>false,hurt:(p,n)=>{p.hp-=n;}};
 const ground={x:100,y:100,hp:100,maxHp:100,kind:'lion'},air={x:100,y:100,jumpHeight:20,hp:100,maxHp:100,kind:'bat'},player={x:100,y:100,hp:100,maxHp:100,jumpHeight:20};
 g.players.push(player);g.enemies.push(ground,air);tickHazards(g,.5);
 assert.equal(player.hp,100);assert.equal(air.hp,100);assert.ok(ground.hp<100);
});

test('active Banshee Queen suppresses ordinary footprints and owns the icy trail',()=>{
 const queen={id:9,kind:'banshee_queen',hp:100,x:100,y:100,moving:true,faceX:1,faceY:0};
 const g={time:1,enemies:[queen],players:[],footprints:[{x:90,y:90,time:0}],terrain:Array(2500).fill('grass')};
 const ctx={save(){},restore(){},translate(){},rotate(){},fillRect(){},fillStyle:'',strokeStyle:'',beginPath(){},moveTo(){},lineTo(){},stroke(){}};
 drawTracks(ctx,g);assert.equal(g.footprints.length,1);
 const before=sampleBansheeSteps(g);queen.x=116;const after=sampleBansheeSteps(g);assert.ok(after.length>before.length);
 queen.hp=0;assert.doesNotThrow(()=>drawTracks(ctx,g));
});

test('beach pier tiles behave as bridge tiles for water/collision routing',()=>{
 const world=beachWorld(42),g={...world,generatedEnvironment:'beach',phase:'play',mapMode:'bounded'};
 const x=BEACH_PIER.x+16,y=BEACH_PIER.y+16;
 assert.equal(world.terrain[Math.floor(y/32)*50+Math.floor(x/32)],'wood');
 assert.equal(waterAt(g,x,y),'bridge');
 const game=new Game(()=>.5);game.generatedEnvironment='beach';Object.assign(game,world);game.phase='play';
 assert.equal(game.blocked(x,y,8,false,false,false,0),false);
});
