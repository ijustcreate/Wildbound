import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/core.mjs';
import {befriendCreature,tickFriendlyCreature} from '../src/friendly-creatures.mjs';
import {cycleFollowerControl,syncControlledFollower} from '../src/follower-control.mjs';
import {stationaryCreature} from '../src/stationary-creatures.mjs';

const arena=()=>{const g=new Game(()=>.5);g.phase='play';g.openingBoard=false;g.scenery=[];g.house=null;g.terrain.fill('grass');const p=g.addPlayer('keyboard');Object.assign(p,{x:500,y:500});return {g,p};};
const actor=(g,kind,x=520)=>{const e={id:g.nextId++,kind,x,y:500,hp:200,maxHp:200,speed:90,damage:10,cooldown:0,state:'idle',faceX:1,faceY:0};g.enemies.push(e);return e;};
test('eggs reject friendship while hatched baby spiders can be charmed and follow',()=>{
 const {g,p}=arena(),egg=actor(g,'spider_egg');assert.equal(befriendCreature(egg,p.id),false);assert.notEqual(egg.faction,'ally');
 const baby=actor(g,'baby_spider',650);assert.equal(befriendCreature(baby,p.id),true);tickFriendlyCreature(g,baby,.1);assert.ok(baby.x<650);
});
test('hostile and charmed rooted anatomy never moves from melee, body separation or follower navigation',()=>{
 for(const kind of ['vine','carnivorous_flower','mimic_vine','poison_pod','bee_hive','spider_egg']){
  const {g,p}=arena(),e=actor(g,kind);assert.ok(stationaryCreature(e));const start={x:e.x,y:e.y};
  assert.equal(g.moveActor(e,35,-20),0);assert.deepEqual({x:e.x,y:e.y},start);
  p.faceX=1;p.faceY=0;p.equipment.hand1='sword';g.update(.05,{keyboard:{attack:true,aimX:1,aimY:0}});for(let n=0;n<6;n++)g.update(.05,{keyboard:{aimX:1,aimY:0}});assert.ok(e.hp<200,kind+' takes damage');assert.deepEqual({x:e.x,y:e.y},start,kind+' cannot be knocked back');
  Object.assign(p,{x:e.x,y:e.y});g.update(.05,{});assert.deepEqual({x:e.x,y:e.y},start,kind+' cannot be pushed by overlap');
  if(befriendCreature(e,p.id)){p.x=800;tickFriendlyCreature(g,e,.5);assert.deepEqual({x:e.x,y:e.y},start,kind+' stays rooted after charm');}
 }
});
test('taking direct control of a charmed plant does not grant walking, dash or jump',()=>{
 const {g,p}=arena(),e=actor(g,'vine',600);befriendCreature(e,p.id);cycleFollowerControl(g,p);const start={x:e.x,y:e.y};
 for(let n=0;n<10;n++){g.update(.03,{keyboard:{x:1,y:1,dodge:true,jump:true}});syncControlledFollower(g,p,.03);}
 assert.deepEqual({x:e.x,y:e.y},start);assert.equal(e.jumpHeight||0,0);
});
test('a temporarily stopped mobile enemy remains movable',()=>{const {g}=arena(),e=actor(g,'wolf');e.speed=0;assert.equal(stationaryCreature(e),false);assert.ok(g.moveActor(e,10,0)>0);});
