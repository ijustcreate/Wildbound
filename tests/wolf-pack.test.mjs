import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,EVENTS} from '../src/core.mjs';
import {insideHouse} from '../src/expansion.mjs';
import {wolfPack,tickWolf} from '../src/wolf-pack.mjs';
import {wolfMotion,defaultWolfMotion,validateWolfMotion} from '../src/wolf-motion.mjs';
import {lionMotion} from '../src/lion-motion.mjs';
import {RIG_SUBJECTS} from '../src/rig-subjects.mjs';
import {creatureCue} from '../src/sound-bank.mjs';
import {existsSync} from 'node:fs';
const setup=environment=>{const g=new Game();g.environment=environment;g.addPlayer('keyboard');g.start();g.openingBoard=false;return g;};
test('first house lion appears on a clear interior floor; later lions use exterior',()=>{
 const g=setup('house'),i=EVENTS.findIndex(e=>e.kind==='lion');g.spawnEvent(i);
 const lion=g.enemies.at(-1);assert.ok(insideHouse(lion.x,lion.y,g.house));assert.equal(g.blocked(lion.x,lion.y),false);
 g.spawnEvent(i);const next=g.enemies.at(-1);assert.equal(insideHouse(next.x,next.y,g.house),false);
});
test('wolf has independent model and renderer, and dedicated sound assets',()=>{
 assert.notEqual(wolfMotion,lionMotion);assert.ok(validateWolfMotion(defaultWolfMotion()));assert.notEqual(RIG_SUBJECTS.wolf.draw,RIG_SUBJECTS.lion.draw);
 for(const action of ['spawn','attack','hurt','death']){const cue=creatureCue('wolf',action);assert.ok(cue.files[0].includes('/wolf/'));assert.ok(existsSync(cue.files[0]));}
});
test('pack shares alpha target, follows its leader and elects a successor',()=>{
 const g=setup('forest');g.spawnEvent(EVENTS.findIndex(e=>e.kind==='wolf'));const wolves=g.enemies.filter(e=>e.kind==='wolf');const {alpha}=wolfPack(g,wolves[0]);assert.equal(wolves.filter(e=>e.alpha).length,1);
 const target=g.players[0];Object.assign(target,{x:800,y:800});Object.assign(alpha,{x:300,y:300});
 for(const e of wolves)tickWolf(g,e,[target],.05);
 assert.ok(wolves.every(e=>e.packTargetId===target.id));assert.equal(wolves[1].packRole,'follow');
 alpha.hp=0;assert.notEqual(wolfPack(g,wolves[1]).alpha.id,alpha.id);assert.equal(wolves.filter(e=>e.hp>0&&e.alpha).length,1);
});
test('wolf bite has a windup, only one attacker, and respects walls',()=>{
 const g=setup('house');g.spawnEvent(EVENTS.findIndex(e=>e.kind==='wolf'));const pack=g.enemies.filter(e=>e.kind==='wolf'),p=g.players[0];g.time=0;
 Object.assign(p,{x:640,y:580});pack.forEach(e=>Object.assign(e,{x:640,y:610,cooldown:0}));
 for(const e of pack)tickWolf(g,e,[p],.01);assert.equal(pack.filter(e=>e.state==='windup').length,1);
 const e=pack[0],hp=p.hp;Object.assign(e,{x:460,y:580,timer:0});p.x=490;tickWolf(g,e,[p],.01);assert.equal(p.hp,hp);
});
