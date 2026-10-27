import test from 'node:test';import assert from 'node:assert/strict';
import {Game,EVENTS} from '../src/core.mjs';
import {awakenCemeteryPumpkins,PUMPKIN_WAKE_CHANCE} from '../src/squashling-awakening.mjs';
import {defaultNightMotion,validateNightMotion,nightAction} from '../src/night-rigs.mjs';
import {tickNightEnemy} from '../src/night-enemies.mjs';
import {poseAt} from '../src/player-motion.mjs';
const setup=(roll=0)=>{const g=new Game(()=>roll),p=g.addPlayer('keyboard');g.start();Object.assign(g,{phase:'play',openingBoard:false,generatedEnvironment:'graveyard',enemies:[],scenery:[{id:'crop',kind:'pumpkin_crop',x:500,y:500,rootY:500,picked:false,graveyard:true}]});g.terrain.fill('grass');g.projectileBlocked=()=>false;g.blocked=()=>false;Object.assign(p,{x:500,y:550});return{g,p,crop:g.scenery[0]};};
test('cemetery proximity rolls once, replaces the picked head, and survives saved state without duplication',()=>{
 const {g,p,crop}=setup();assert.equal(awakenCemeteryPumpkins(g),1);const e=g.enemies[0];assert.equal(e.kind,'squashling');assert.equal(crop.picked,true);assert.equal(crop.awakened,true);assert.ok(e.pumpkinAwaken>0);assert.equal(awakenCemeteryPumpkins(g),0);
 const saved=JSON.parse(JSON.stringify({scenery:g.scenery,enemies:g.enemies}));g.scenery=saved.scenery;g.enemies=saved.enemies;assert.equal(awakenCemeteryPumpkins(g),0);
 const passive=setup(PUMPKIN_WAKE_CHANCE+.1);assert.equal(awakenCemeteryPumpkins(passive.g),0);passive.g.random=()=>0;assert.equal(awakenCemeteryPumpkins(passive.g),0);assert.equal(passive.crop.picked,false);
 const distant=setup();distant.p.x=100;assert.equal(awakenCemeteryPumpkins(distant.g),0);assert.ok(!distant.crop.awakeningChecked);distant.p.x=500;distant.g.paused=true;assert.equal(awakenCemeteryPumpkins(distant.g),0);
});
test('pumpkin emergence cannot attack, vine lash warns first, and the native rig retains the exact reference motion',()=>{
 const {g,p}=setup();awakenCemeteryPumpkins(g);const e=g.enemies[0],hp=p.hp;for(let i=0;i<8;i++)tickNightEnemy(g,e,p,.1);assert.equal(p.hp,hp);assert.equal(nightAction('squashling',e),'awaken');
 for(let i=0;i<25;i++)tickNightEnemy(g,e,p,.1);assert.ok(p.hp<hp);assert.ok(p.hp>=hp-26,'recovery prevents repeated contact hits');
 const m=defaultNightMotion('squashling');assert.ok(validateNightMotion('squashling',m));assert.match(m.provenance.url,/33154/);assert.equal(m.provenance.display,21900);assert.ok(m.joints.rootTipL&&m.joints.handR);for(const[action,clip]of Object.entries(m.clips))for(let i=0;i<clip.length;i++)assert.ok(Object.values(poseAt(m,action,i)).flat().every(Number.isFinite));
 assert.equal(EVENTS[59].kind,'old_well');assert.equal(EVENTS.find(e=>e.kind==='squashling').kind,'squashling');
});
