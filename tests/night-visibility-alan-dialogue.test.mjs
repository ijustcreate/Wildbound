import test from 'node:test';import assert from 'node:assert/strict';
import {Game} from '../src/core.mjs';import {sightRadius,enemySightOpacity} from '../src/night-cycle.mjs';import {openNpcDialogue,npcDialogueAction} from '../src/npc-quests.mjs';import {saveSession,restoreSession} from '../src/session.mjs';
test('Night base sight is readable and enemy alpha fades continuously to the exact sight boundary',()=>{
 const g=new Game(()=>.4),p=g.addPlayer('keyboard');g.start();p.room=null;p.inventory=[];p.equipment={};g.sky.elapsed=330;const radius=sightRadius(g,p);assert.ok(radius>=140&&radius<200);let last=1;
 for(let distance=radius*.6;distance<=radius+3;distance+=.2){const value=enemySightOpacity(g,{x:p.x+distance,y:p.y});assert.ok(value<=last+.00001);assert.ok(Math.abs(value-last)<.02);last=value;}assert.equal(last,0);
 p.inventory=[{type:'lantern',qty:1}];assert.equal(sightRadius(g,p),280);g.sky.elapsed=0;assert.equal(sightRadius(g,p),280);
});
test('Alan keeps a resolved decision across reopening attempts and session saves, while cancel remains reversible',()=>{
 for(const decision of ['alan:follow','alan:patrol','alan:leave']){
  const g=new Game(()=>.4),p=g.addPlayer('keyboard');g.start();g.openingBoard=false;p.room=null;const alan={id:g.nextId++,kind:'alan',hp:180,maxHp:180,x:p.x+10,y:p.y,faction:'ally',allyMode:'patrol'};g.enemies=[alan];
  assert.equal(openNpcDialogue(g,p),true);npcDialogueAction(g,p,'close');assert.equal(alan.dialogueResolved,undefined);assert.equal(openNpcDialogue(g,p),true);npcDialogueAction(g,p,decision);assert.equal(p.ui,null);assert.equal(alan.dialogueResolved,true);assert.equal(openNpcDialogue(g,p),false);
  const restored=restoreSession(JSON.parse(JSON.stringify(saveSession(g))));assert.equal(restored.enemies.find(e=>e.kind==='alan').dialogueResolved,true);assert.equal(openNpcDialogue(restored,restored.players[0]),false);
 }
});
