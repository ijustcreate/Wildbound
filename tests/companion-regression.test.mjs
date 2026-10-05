import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/core.mjs';
import {befriendCreature,tickFriendlyCreature} from '../src/friendly-creatures.mjs';
import {lionAction,lionFrame,lionMotion} from '../src/lion-motion.mjs';
import {restoreHunterPet,hurtPet,tickHunterPets} from '../src/hunter-pets.mjs';
const setup=()=>{const g=new Game(()=>.5);g.phase='play';g.openingBoard=false;g.scenery=[];g.house=null;g.terrain.fill('grass');const p=g.addPlayer('pad:0');Object.assign(p,{x:300,y:300,hp:60});return {g,p};};
const animal=(g,kind,x=330)=>{const e={id:g.nextId++,kind,hp:60,maxHp:60,x,y:300,speed:90,damage:10,cooldown:0,state:'hunt',faceX:0,faceY:1};g.enemies.push(e);return e;};
test('hostile panther death heals survivors without the out-of-scope alive crash',()=>{
 const {g,p}=setup(),e=animal(g,'panther');e.hp=0;
 assert.doesNotThrow(()=>g.update(.05,{}));assert.equal(e.defeated,true);assert.equal(g.cleared,1);assert.ok(p.hp>=85);
 assert.doesNotThrow(()=>g.update(.05,{}));assert.equal(g.cleared,1);
});
test('last friendship panther can be hurt and die without loot, heal or kill rewards',()=>{
 const {g,p}=setup(),e=animal(g,'panther');befriendCreature(e,p.id);e.hit=.2;e.hp=1;g.update(.05,{});e.hp=0;
 const hp=p.hp;assert.doesNotThrow(()=>g.update(.05,{}));assert.equal(e.defeated,true);assert.equal(g.cleared,0);assert.equal(g.loot.length,0);assert.equal(p.hp,hp);assert.equal(g.killedCreatures?.panther,undefined);
 for(let n=0;n<80;n++)g.update(.05,{});assert.equal(g.enemies.length,0);
});
test('friendship lion clears hostile poses and transitions run, bite, hurt and idle',()=>{
 const {g,p}=setup(),e=animal(g,'lion',430);Object.assign(e,{state:'charge',animationAction:'pounce',poseTime:.7,motionDuration:.48,flash:.2,attack:.3});
 assert.equal(befriendCreature(e,p.id),true);tickFriendlyCreature(g,e,.25);assert.equal(lionAction(e),'run');assert.ok(lionFrame(e,1,lionMotion)>0);
 const q=animal(g,'wolf',e.x+20);tickFriendlyCreature(g,e,.05);assert.equal(lionAction(e),'bite');assert.equal(q.hp,50);assert.equal(q.killedBy,p.id);
 g.enemies=[e];p.x=e.x;p.y=e.y;tickFriendlyCreature(g,e,.4);assert.equal(lionAction(e),'idle');assert.equal(e.attack,0);assert.equal(e.moving,false);
 e.hit=.2;tickFriendlyCreature(g,e,.05);assert.equal(lionAction(e),'hurt');tickFriendlyCreature(g,e,.2);assert.equal(lionAction(e),'idle');
});
test('allied cats never attack allies, practice targets or neutral creatures',()=>{
 const {g,p}=setup(),e=animal(g,'lion');befriendCreature(e,p.id);
 const ally=animal(g,'wolf',335);befriendCreature(ally,p.id);const dummy=animal(g,'wolf',336);dummy.practiceTarget=true;const neutral=animal(g,'wolf',337);neutral.faction='neutral';
 tickFriendlyCreature(g,e,.1);for(const q of [ally,dummy,neutral])assert.equal(q.hp,60);
 p.hp=0;tickFriendlyCreature(g,e,.1);assert.equal(e.moving,false);assert.equal(lionAction(e),'idle');
});
test('Ranger panther down, revive and final expiration survive the real update loop',()=>{
 const {g,p}=setup(),pet=restoreHunterPet({kind:'panther',name:'Shadow'});Object.assign(pet,{id:g.nextId++,owner:p.id,x:320,y:300});p.hunterPet=pet;
 hurtPet(g,pet,999);assert.equal(pet.hp,0);assert.doesNotThrow(()=>g.update(.05,{}));
 for(let n=0;n<33;n++)tickHunterPets(g,.05,{[p.device]:{interact:true}});assert.ok(pet.hp>0);
 pet.invuln=0;hurtPet(g,pet,999);pet.downedRemaining=.01;assert.doesNotThrow(()=>g.update(.05,{}));assert.equal(p.hunterPet,null);
 const e=animal(g,'panther');e.hp=0;p.hp=0;assert.doesNotThrow(()=>g.update(.05,{}));assert.equal(g.phase,'lost');
});
test('wand conversion through actual collision releases old hostile attack state',()=>{
 const {g,p}=setup(),e=animal(g,'lion');e.animationAction='pounce';e.state='charge';p.equipment.hand1='friendship_wand';p.faceX=1;p.faceY=0;p.mana=999;
 g.fireSpell(p);const b=g.spells[0];e.x=b.x+20;e.y=b.y;
 for(let n=0;n<12;n++){g.tickAdventure(.01,{});if(e.faction==='ally')break;}
 assert.equal(e.faction,'ally');assert.equal(e.allyOwner,p.id);assert.equal(e.aggro,false);assert.equal(e.animationAction,null);
});
