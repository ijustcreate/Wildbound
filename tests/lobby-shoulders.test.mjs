import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/core.mjs';
import {LobbyPractice} from '../src/lobby-practice.mjs';
import {LobbyState} from '../src/playable-lobby.mjs';
import {lobbyPracticeInput} from '../src/lobby-input-release.mjs';
import {normalizeMapping} from '../src/controls.mjs';

test('a fresh dash after closing a menu is not swallowed by a held attack',()=>{
 const g=new Game(),p=g.addPlayer('pad:0'),lobby=new LobbyState(),practice=new LobbyPractice();
 lobby.sync([p]);const s=lobby.members.get(p.id);Object.assign(s,{spawned:true,panel:null,x:300,y:350});
 lobbyPracticeInput(s,{attack:true},true);s.inventoryRelease=true;
 const input=lobbyPracticeInput(s,{attack:true,dodge:true,x:1});
 assert.equal(input.attack,false);assert.equal(input.dodge,true);
 practice.stepPractice(.02,[p],lobby.members,{[p.device]:input});
 const a=practice.players[0];assert.ok(a.dashTime>0);assert.ok(a.x>300);assert.equal(a.attack,0);
 assert.equal(lobbyPracticeInput(s,{}).attack,undefined);
 assert.equal(lobbyPracticeInput(s,{attack:true}).attack,true);
});

test('the closing accept press stays suppressed while a fresh shoulder remains usable',()=>{
 const s={practiceClosing:true};
 assert.equal(lobbyPracticeInput(s,{jump:true,use:true}).jump,false);
 const next=lobbyPracticeInput(s,{jump:true,use:true,holdPosition:true,block:true});
 assert.equal(next.jump,false);assert.equal(next.holdPosition,true);
 lobbyPracticeInput(s,{});assert.equal(lobbyPracticeInput(s,{jump:true}).jump,true);
});

test('controller hold anchors swords, shields and empty hands while either stick turns the hero',()=>{
 for(const equipment of [{hand1:'sword'},{hand1:null,hand2:'shield'},{hand1:null,hand2:null}]){
  const g=new Game();g.phase='play';g.openingBoard=false;g.scenery=[];g.terrain.fill('grass');g.blocked=()=>false;
  const p=g.addPlayer('pad:0');Object.assign(p,{x:500,y:500,slideX:90,slideY:50});Object.assign(p.equipment,equipment);
  for(let i=0;i<10;i++)g.update(.02,{'pad:0':{x:1,block:true,holdPosition:true}});
  assert.equal(p.x,500);assert.equal(p.y,500);assert.equal(p.faceX,1);assert.equal(p.moving,false);assert.equal(p.slideX,0);
  g.update(.02,{'pad:0':{x:1,aimX:0,aimY:-1,block:true,holdPosition:true,attack:true}});
  assert.equal(p.faceY,-1);assert.equal(p.x,500);
  g.update(.02,{'pad:0':{x:1}});assert.ok(p.x>500);
 }
});

test('older trigger layout migrates to right dash and left hold without losing face remaps',()=>{
 const saved={attack:2,jump:0,dodge:6,loot:1,trap:10,interact:3,pause:8,board:4,potion:5,block:7,inventory:9,portal:13,bait:12,field:11};
 const migrated=normalizeMapping(saved);assert.equal(migrated.dodge,7);assert.equal(migrated.block,6);
 assert.equal(migrated.pause,9);assert.equal(migrated.inventory,8);assert.equal(migrated.portal,12);
 assert.equal(saved.dodge,6);assert.equal(normalizeMapping({...saved,attack:16}).attack,16);
});

test('opening a lobby panel cancels dash recovery and sliding as well as the dash itself',()=>{
 const g=new Game(),p=g.addPlayer('pad:0'),lobby=new LobbyState(),practice=new LobbyPractice();
 lobby.sync([p]);const s=lobby.members.get(p.id);Object.assign(s,{spawned:true,panel:null,x:300,y:350});
 practice.stepPractice(.02,[p],lobby.members,{});const a=practice.players[0];
 Object.assign(a,{dashRecovery:.18,dashX:1,dashY:0,slideX:100,slideY:100});s.panel='choose';
 practice.stepPractice(.02,[p],lobby.members,{'pad:0':{x:1,dodge:true}});
 assert.equal(a.x,300);assert.equal(a.y,350);assert.equal(a.dashRecovery,0);assert.equal(a.slideX,0);
});
