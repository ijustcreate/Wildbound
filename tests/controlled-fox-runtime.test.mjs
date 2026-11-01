import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/core.mjs';
import { cycleFollowerControl, syncControlledFollower } from '../src/follower-control.mjs';
import { tickCreaturePackActor } from '../src/creature-packs/index.mjs';
import { companionVisualActor } from '../src/companion-locomotion.mjs';
import { nightAction, nightMotions } from '../src/night-rigs.mjs';
import { tickControlledWater } from '../src/controlled-water.mjs';

function controlledFox(){
  const game=new Game();game.phase='play';game.openingBoard=false;game.house=null;game.scenery=[];game.terrain.fill('grass');
  const player=game.addPlayer('keyboard');Object.assign(player,{x:320,y:320,faceX:0,faceY:-1});
  const fox={id:game.nextId++,kind:'fox_kit',wildlifePackKind:'fox_kit',name:'Fox',faction:'ally',allyOwner:player.id,hp:42,maxHp:42,speed:92,x:320,y:320,state:'wander',moving:false,animationAction:'run',step:0};
  game.enemies.push(fox);cycleFollowerControl(game,player);return {game,player,fox};
}

test('controlled fox bypasses pack AI and stale run pose clears to idle/walk',()=>{
  const {game,player,fox}=controlledFox();
  assert.equal(tickCreaturePackActor(game,fox,.016,[]),false);
  syncControlledFollower(game,player,.016);
  assert.equal(fox.animationAction,null);
  assert.equal(nightAction('fox',{...fox,kind:'fox',moving:false},nightMotions.fox),'idle');
  const slow=companionVisualActor({...fox,moving:true,locomotionSpeed:60},nightMotions.fox);
  assert.equal(slow.animationAction,'walk');
});

test('controlled fox receives jump input and renders jump pose without replacing attacks',()=>{
  const {game,player,fox}=controlledFox();
  game.update(.016,{keyboard:{jump:true}});
  assert.ok(fox.jumpHeight>0,'the controlled fox starts the ordinary player jump');
  const jump=companionVisualActor({...fox,animationAction:null,controlledAttack:null,attack:0,jumpHeight:12,jumpAge:.2},nightMotions.fox);
  assert.equal(jump.animationAction,'jump');
  const attack=companionVisualActor({...fox,animationAction:'bite',controlledAttack:{phase:'windup'},jumpHeight:12},nightMotions.fox);
  assert.equal(attack.animationAction,'bite','attacks retain priority over jump pose selection');
});

test('controlled fox swim and dive state reach the actor and its native poses',()=>{
  const {game,player,fox}=controlledFox();game.terrain.fill('water');
  tickControlledWater(game,player,fox,{x:0,y:0,attack:false},.1);
  assert.equal(fox.swimming,true);
  assert.equal(companionVisualActor({...fox,animationAction:null},nightMotions.fox).animationAction,'swim');
  tickControlledWater(game,player,fox,{x:0,y:0,attack:true},.5);
  assert.ok(fox.diveDepth>.12);
  assert.equal(companionVisualActor({...fox,animationAction:null},nightMotions.fox).animationAction,'dive');
});
