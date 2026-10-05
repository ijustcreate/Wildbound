import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,EVENTS} from '../src/core.mjs';
import {MYSTERY_EVENTS,startMystery,tickMystery,interactMystery} from '../src/mysteries.mjs';
import {houseLightSources,toggleHouseLight} from '../src/house-lights.mjs';
import {defaultHouse,validateHouse} from '../src/house-design.mjs';
import {tickSwimming} from '../src/swimming.mjs';
import {tickEnvironment} from '../src/environment.mjs';
import {tickBoardSequence} from '../src/board-sequence.mjs';
import {snapshot} from '../src/rooms.mjs';
const game=()=>{const g=new Game(()=>.5);g.addPlayer('keyboard');g.phase='play';g.terrain.fill('grass');g.blocked=()=>false;g.enemies=[];g.scenery=[];g.persist=()=>{};return g;};
test('all three mysteries require both stages, serialize, and reward exactly once',()=>{
 for(const event of MYSTERY_EVENTS){const g=game(),p=g.players[0];assert.ok(startMystery(g,event));assert.equal(g.mystery.stage,1);assert.equal(g.loot.length,0);assert.equal(interactMystery(g,p),false);
  if(event.mystery.goal==='defeat'){for(const e of g.enemies)e.hp=0;tickMystery(g);}else{Object.assign(p,g.mystery.object);assert.ok(interactMystery(g,p));}
  assert.equal(g.mystery.stage,2);assert.equal(g.loot.length,0);assert.equal(snapshot(g).mystery.stage,2);
  Object.assign(p,g.mystery.object);assert.ok(interactMystery(g,p));assert.equal(g.loot.at(-1).type,event.mystery.reward);assert.equal(interactMystery(g,p),false);assert.equal(g.loot.length,1);
 }
});
test('normal event draw starts a mystery and does not overwrite an unfinished one',()=>{const g=game();g.spawnEvent(EVENTS.findIndex(e=>e.name===MYSTERY_EVENTS[0].name));assert.equal(g.mystery.stage,1);assert.equal(startMystery(g,MYSTERY_EVENTS[1]),false);});
test('a new expedition clears the previous mystery and roll cooldown',()=>{const g=game();startMystery(g,MYSTERY_EVENTS[0]);g.rollCooldown=1;g.newExpedition();assert.equal(g.mystery,null);assert.equal(g.rollCooldown,0);});
test('default house has lamps, night activates them, manual off survives day/night',()=>{const g=game();g.house=defaultHouse();assert.ok(validateHouse(g.house));const lamp=g.house.furniture.find(f=>f.kind==='lamp');assert.ok(lamp);g.sky={elapsed:0};assert.equal(houseLightSources(g).length,0);g.sky.elapsed=320;assert.ok(houseLightSources(g).length);Object.assign(g.players[0],{x:lamp.x+12,y:lamp.y+12});assert.ok(toggleHouseLight(g,g.players[0]));assert.equal(lamp.lightMode,'off');g.sky.elapsed=0;g.sky.elapsed=320;assert.ok(!houseLightSources(g).some(s=>s.x===lamp.x+12&&s.y===lamp.y+12));});
test('water movement and landing impulses never create footprints; jump splash is larger',()=>{const g=game(),p=g.players[0];g.terrain.fill('water');Object.assign(p,{x:400,y:400,trackPosition:{x:370,y:400},trackImpulse:{x:400,y:400,kind:'landing'}});tickEnvironment(g,.01);assert.equal(g.footprints.length,0);p.jumpHeight=20;tickSwimming(g,p,{},.01);p.jumpHeight=0;p.landTime=.22;tickSwimming(g,p,{},.01);assert.equal(g.effects.at(-1).particle,'jump-splash');});
test('closing a dice reveal blocks an immediate second roll',()=>{const g=game(),p=g.players[0];assert.ok(g.hitTable(p));g.roll.resolved=true;g.roll.elapsed=g.roll.landingAt+30;tickBoardSequence(g,.01,{});assert.equal(g.roll,null);assert.equal(g.rollCooldown,1.25);assert.equal(g.hitTable(p),false);});
