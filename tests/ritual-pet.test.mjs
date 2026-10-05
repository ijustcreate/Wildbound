import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/core.mjs';
import {tickRitualPets} from '../src/hunter-pets.mjs';
import {summonTempleTigers,tickGhosts} from '../src/temple.mjs';
test('dagger companion belongs to equipped owner and vanishes on unequip',()=>{
 const g=new Game(()=>.5),p=g.addPlayer('keyboard');p.equipment.hand1='ritual_dagger';
 tickRitualPets(g,.016);assert.equal(p.ritualPet.owner,p.id);assert.equal(p.ritualPet.spiritGhost,true);assert.ok(!p.scaredTime);
 const saved=p.ritualPet;p.equipment.hand1=null;tickRitualPets(g,.016);assert.equal(p.ritualPet,undefined);assert.ok(saved);
});
test('ritual chest tigers are independent killable creatures, never owner pets',()=>{
 const g=new Game(()=>0),p=g.addPlayer('keyboard');summonTempleTigers(g,p);assert.equal(g.ghosts.length,2);
 for(const tiger of g.ghosts){assert.equal(tiger.owner,null);assert.equal(tiger.hp,120);tiger.hp=0;}
 tickGhosts(g,.016);assert.equal(g.ghosts.length,0);assert.ok(!p.scaredTime);
});
