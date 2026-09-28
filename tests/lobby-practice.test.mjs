import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/core.mjs';
import {LobbyPractice,lobbyDiceOffsets} from '../src/lobby-practice.mjs';
import {LobbyState} from '../src/playable-lobby.mjs';
import {playerAction} from '../src/player-motion.mjs';
const setup=()=>{const game=new Game(),p=game.addPlayer('keyboard'),lobby=new LobbyState(),practice=new LobbyPractice();lobby.sync([p]);Object.assign(lobby.members.get(p.id),{spawned:true,panel:null});const tick=input=>practice.stepPractice(.05,[p],lobby.members,{keyboard:input});return {p,practice,lobby,tick};};
test('Tray contains exactly the selected number of centered dice',()=>{assert.deepEqual(lobbyDiceOffsets('1'),[-12]);assert.equal(lobbyDiceOffsets('2').length,2);});
test('Lobby uses real jumping, dodging, blocking and weapon attacks without changing the saved player',()=>{
 const {p,practice,tick}=setup();p.equipment.hand2='shield';const before=JSON.stringify(p);
 tick({jump:true});tick({});const a=practice.players[0];assert.ok(a.jumpHeight>0);assert.match(playerAction(a),/^jump/);
 for(let i=0;i<20;i++)tick({});tick({dodge:true,x:1});assert.ok(a.dashTime>0);
 tick({block:true});assert.equal(a.blocking,true);
 tick({attack:true});tick({});assert.ok(a.attack>0);assert.ok(a.attackClip);
 tick({trap:true});assert.equal(practice.traps.length,1);assert.equal(JSON.stringify(p),before);
});
test('Selection panels suppress attacks and movement, and pause freezes practice',()=>{
 const {p,practice,lobby,tick}=setup();tick({attack:true});const a=practice.players[0],s=lobby.members.get(p.id),x=a.x;
 s.panel='board';tick({x:1,attack:true,jump:true});assert.equal(a.x,x);assert.equal(a.attack,0);assert.equal(a.jumpHeight||0,0);
 const time=practice.time;practice.stepPractice(.05,[p],lobby.members,{},true);assert.equal(practice.time,time);
});
test('Equipped bows and wands fire actual practice projectiles without consuming saved ammunition',()=>{
 for(const weapon of ['bow','wand']){
   const {p,practice,tick}=setup();p.equipment.hand1=weapon;p.inventory.push({type:'arrow',qty:3});
   const before=JSON.stringify(p.inventory);tick({attack:true});tick({});
   assert.ok((weapon==='bow'?practice.arrows:practice.spells).length>0,weapon);
   assert.equal(JSON.stringify(p.inventory),before);
 }
});
