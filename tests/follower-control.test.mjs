import test from "node:test";
import assert from "node:assert/strict";
import { controlledFollower, cycleFollowerControl, syncControlledFollower } from "../src/follower-control.mjs";
import {startFollowerAttack,tickFollowerAttack} from '../src/follower-attacks.mjs';
import {Game,EVENTS} from '../src/core.mjs';
import {saveSession,restoreSession} from '../src/session.mjs';
import {Profiles} from '../src/profiles.mjs';
import {controlledUnit} from '../src/controlled-unit.mjs';
import {applyDefinitions} from '../src/definitions.mjs';
import fs from 'node:fs';

test("control cycles through every owned follower and returns to the saved player position", () => {
  const player = { id: 1, profileId: "p1", name: "DAD", x: 10, y: 20 };
  const wolf = { id: 2, kind: "wolf", name: "Wolf", allyOwner: 1, x: 100, y: 110, hp: 20 };
  const april = { id: 3, name: "April", ownerKey: "p1", x: 200, y: 210, hp: 80 };
  const game = { players: [player], enemies: [wolf], villageFollowers: [april], ghosts: [], message() {} };
  assert.equal(cycleFollowerControl(game, player), wolf);
  assert.deepEqual([player.x, player.y], [100, 110]);
  assert.equal(cycleFollowerControl(game, player), april);
  assert.deepEqual([player.x, player.y], [200, 210]);
  assert.equal(cycleFollowerControl(game, player), null);
  assert.deepEqual([player.x, player.y], [10, 20]);
  assert.equal(player.controlledFollowerId, undefined);
});

test("death of the controlled follower restores the main character immediately", () => {
  const player = { id: 1, profileId: "p1", name: "DAD", x: 10, y: 20 };
  const wolf = { id: 2, kind: "wolf", allyOwner: 1, x: 100, y: 110, hp: 20 };
  const game = { players: [player], enemies: [wolf], villageFollowers: [], ghosts: [], message() {} };
  cycleFollowerControl(game, player);
  wolf.hp = 0;
  assert.equal(controlledFollower(game, player), null);
  assert.deepEqual([player.x, player.y], [10, 20]);
});
test('controlled-unit lookup includes tamed, pet, ghost and village-follower pools',()=>{
 const p={id:1,controlledFollowerId:4},village={id:4,hp:10,kind:'villager'};
 assert.equal(controlledUnit({players:[p],villageFollowers:[village]},p),village);
});

test('creature bags stay separate and persistent through switching, session reload and profile capture',()=>{
 const g=new Game(),p=g.addPlayer('keyboard','Hero');p.profileId='recovery-hero';
 p.inventory=[{type:'potion',qty:3}];p.equipment.hand1='sword';
 const follower={id:999,kind:'wolf',allyOwner:p.id,faction:'ally',hp:50,x:600,y:600};g.enemies.push(follower);
 cycleFollowerControl(g,p);p.inventory.push({type:'arrow',qty:4});p.equipment.hand1='stick';
 assert.equal(follower.inventory[0].type,'arrow');assert.equal(p.controlMainLoadout.inventory[0].type,'potion');
 const profiles=new Profiles();profiles.data.heroes=[{id:p.profileId}];profiles.save=()=>{};profiles.capture(g);
 assert.equal(profiles.data.heroes[0].equipment.hand1,'sword');assert.equal(profiles.data.heroes[0].inventory[0].type,'potion');
 const restored=restoreSession(JSON.parse(JSON.stringify(saveSession(g)))),rp=restored.players[0];
 assert.equal(controlledFollower(restored,rp).inventory[0].type,'arrow');
 assert.equal(rp.inventory,controlledFollower(restored,rp).inventory,'reopened inventory stays bound to creature');cycleFollowerControl(restored,rp);
 assert.equal(rp.equipment.hand1,'sword');assert.equal(rp.inventory[0].type,'potion');
 cycleFollowerControl(restored,rp);assert.equal(rp.inventory[0].qty,4);assert.equal(rp.equipment.hand1,'stick');
});

test('hero follows behind the controlled creature and returns at its following position',()=>{
 const p={id:1,name:'Hero',x:100,y:100,faceX:1,faceY:0},f={id:2,allyOwner:1,hp:10,x:200,y:100};
 const g={players:[p],enemies:[f],message(){}};cycleFollowerControl(g,p);p.x=350;
 for(let i=0;i<120;i++)syncControlledFollower(g,p,1/60);
 assert.equal(f.x,350);assert.ok(Math.hypot(p.controlPetPosition.x-f.x,p.controlPetPosition.y-f.y)>40);
 const x=p.controlPetPosition.x;cycleFollowerControl(g,p);assert.equal(p.x,x);
});

test('controlled-creature attack stays combat while Interact opens nearby supplies',()=>{
 const g=new Game(()=>.5),p=g.addPlayer('pad:0','Hero');g.start();g.openingBoard=false;
 const chest=g.supplyChests[0],wolf={id:9001,kind:'wolf',allyOwner:p.id,faction:'ally',hp:70,maxHp:70,damage:12,speed:40,x:chest.x,y:chest.y,faceX:1,faceY:0,inventory:[],equipment:{},equipmentSockets:{}};
 g.enemies=[wolf];cycleFollowerControl(g,p);g.update(.02,{'pad:0':{attack:true}});assert.equal(chest.opened,false);
 g.update(.02,{'pad:0':{attack:false}});assert.ok(wolf.controlledAttack,'Attack starts the creature-native attack');assert.equal(chest.opened,false);
 g.update(.02,{'pad:0':{interact:true}});assert.equal(chest.opened,true,'Interact opens the chest independently');
});

test('controlled Captain uses native slash/thrust, damages once and cannot attack frozen',()=>{
 const owner={id:1,faceX:1,faceY:0},f={id:2,kind:'oathless_captain',allyOwner:1,hp:100,damage:9,x:0,y:0};
 const target={id:3,kind:'wolf',hp:100,x:25,y:0,faction:'enemy'},ally={id:4,hp:100,x:15,y:0,faction:'ally'};
 const g={players:[owner],enemies:[f,ally,target],effects:[],projectileBlocked:()=>false,onSound(){}};
 startFollowerAttack(g,owner,f);assert.equal(f.animationAction,'slash');
 for(let i=0;i<30;i++)tickFollowerAttack(g,f,.02);assert.equal(target.hp,91);assert.equal(ally.hp,100);
 startFollowerAttack(g,owner,f);assert.equal(f.animationAction,'thrust');f.frozen=1;tickFollowerAttack(g,f,.02);assert.equal(f.controlledAttack,undefined);
});

test('recovered shared authored rigs load with newly added default clips without rewriting source',()=>{
 const source=fs.readFileSync(new URL('../authored/rigs.json',import.meta.url),'utf8'),data=JSON.parse(source);
 applyDefinitions(data,structuredClone(EVENTS),{});assert.equal(JSON.stringify(data),JSON.stringify(JSON.parse(source)));
});
