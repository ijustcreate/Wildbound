import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/core.mjs';
import {equip,ITEMS,stat} from '../src/items.mjs';
import {alleyBlocked,alleyGate} from '../src/diagon-alley.mjs';
import {enterWildLands} from '../src/wild-lands.mjs';
import {leaveTrainTest,trainPrompt,trainInteraction} from '../src/train-test.mjs';
import {npcDialogueAction,npcDialogueView} from '../src/npc-quests.mjs';
import {restoreSession,saveSession} from '../src/session.mjs';
import {NOCTURNE_DARK_WIZARDS,isNocturneDarkWizardLoot} from '../src/nocturne-dark-wizards.mjs';
import {DEATH_EATER_MASKS} from '../src/death-eater-masks.mjs';

const [corvin,isolde]=NOCTURNE_DARK_WIZARDS;
const maskIds=Object.keys(DEATH_EATER_MASKS);
const count=(p,type)=>p.inventory.reduce((n,i)=>n+(i?.type===type?i.qty:0),0);
const tick=(g,input={})=>g.update(.05,{keyboard:input});
function rounds(g,n){for(let i=0;i<n;i++)tick(g);}

function enter(persistent=true){
 const g=new Game(()=>.5),original=g.addPlayer('keyboard','Alley visitor');
 g.start();g.openingBoard=false;g.persist=()=>{};
 assert.ok(enterWildLands(g,{persistent}).ok);
 const p=g.players[0],gate=alleyGate(g);
 g.trainTest.preparing=false;
 p.equipment.hand1='starter_wand';
 Object.assign(p,{x:gate.x,y:gate.y+65});
 assert.ok(trainInteraction(g,p));g.trainTest.time+=1;
 assert.ok(trainInteraction(g,p));assert.equal(g.trainTest.design.activeRoom,'diagon');
 return {g,p,original};
}

function meet(g,p,w){
 assert.equal(alleyBlocked(g,w.x,w.y,8),false,w.name+' stands on clear paving');
 Object.assign(p,{x:w.x+49,y:w.y,faceX:-1,faceY:0});
 assert.match(trainPrompt(g,p),new RegExp(w.name.toUpperCase()));
 tick(g,{interact:true,loot:true});tick(g);
 assert.equal(npcDialogueView(g,p).npc.name,w.name);
}

function defeat(g,p,w){
 const enemy=g.enemies.find(e=>e.darkWizardId===w.id);
 assert.ok(enemy?.hp>0);
 const hp=enemy.hp;
 for(let shot=0;shot<5&&enemy.hp>0;shot++){
  Object.assign(p,{faceX:enemy.x-p.x,faceY:enemy.y-p.y,mana:p.maxMana});
  assert.ok(g.fireSpell(p,.9));
  rounds(g,12);
 }
 assert.ok(enemy.hp<hp,'normal bolts damage the wizard');
 assert.ok(enemy.defeated,'ordinary combat processes the defeat');
 return enemy;
}

function pickUp(g,p,loot){
 Object.assign(p,{x:loot.x,y:loot.y});
 tick(g,{interact:true,loot:true});tick(g);
 assert.ok(!g.loot.some(l=>l.id===loot.id));
}

test('only the provocative choice turns a wizard hostile, who fights with native projectiles',()=>{
 const {g,p}=enter();
 meet(g,p,corvin);
 npcDialogueAction(g,p,'choice:1');assert.equal(p.ui.node,'question');
 tick(g,{interact:true,loot:true});tick(g);
 assert.equal(p.ui,null);assert.ok(!g.enemies.some(e=>e.darkWizardId));
 meet(g,p,isolde);
 npcDialogueAction(g,p,'next');npcDialogueAction(g,p,'next');
 tick(g,{interact:true,loot:true});tick(g);
 const enemy=g.enemies.find(e=>e.darkWizardId===isolde.id);
 assert.ok(enemy&&enemy.faction==='enemy');
 assert.equal(p.ui,null);assert.equal(g.enemies.filter(e=>e.darkWizardId).length,1);
 const hp=p.hp;
 for(let i=0;i<55&&p.hp===hp;i++)tick(g);
 assert.ok(p.hp<hp,'the wizard lands a real hit');
});

test('duel loot survives a checkpoint, is earned once, and settles into the preview character',()=>{
 const {g,p,original}=enter(false);
 meet(g,p,isolde);
 assert.ok(npcDialogueAction(g,p,'choice:2'));
 g.random=()=>.2;
 const defeatActor=defeat(g,p,isolde);
 const drops=g.loot.filter(isNocturneDarkWizardLoot);
 assert.deepEqual(drops.map(l=>[l.type,l.qty]),[['dark_essence',3],[maskIds[1],1]]);
 assert.equal(g.trainTest.nocturneDarkWizards[isolde.id].status,'defeated');
 g.enemyLoot(defeatActor);
 assert.equal(g.loot.filter(isNocturneDarkWizardLoot).length,2);
 const restored=restoreSession(JSON.parse(JSON.stringify(saveSession(g))));
 assert.deepEqual(restored.trainTest.nocturneDarkWizardDrops.map(l=>l.id),drops.map(l=>l.id));
 for(const loot of drops)pickUp(g,p,loot);
 assert.equal(count(p,'dark_essence'),3);assert.equal(count(p,maskIds[1]),1);
 assert.equal(g.trainTest.nocturneDarkWizardDrops.length,0);
 assert.equal(count(original,'dark_essence'),0);
 leaveTrainTest(g);
 assert.equal(count(original,'dark_essence'),3);assert.equal(count(original,maskIds[1]),1);
});

test('all three masks can drop and grant +2 to real attack and healing spells only while worn',()=>{
 const {g,p}=enter();
 for(const [index,id] of maskIds.entries()){
  const w=isolde;
  delete g.trainTest.nocturneDarkWizards?.[w.id];
  g.trainTest.nocturneDarkWizardDrops=[];
  g.enemies=[];g.loot=[];g.arrows=[];g.spells=[];
  meet(g,p,w);npcDialogueAction(g,p,'choice:2');
  const enemy=g.enemies.find(e=>e.darkWizardId===w.id);
  g.random=()=>(index+.5)*.14;
  enemy.hp=0;g.enemyLoot(enemy);
  const loot=g.loot.find(l=>l.type===id&&isNocturneDarkWizardLoot(l));
  assert.ok(loot,id+' can be rolled');
  assert.equal(g.collect(p,loot),true);
  p.equipment.head=null;
  assert.equal(stat(p,'spellDamage'),0);
  assert.ok(equip(p,p.inventory.findIndex(i=>i?.type===id)));
  p.mana=p.maxMana;p.equipment.hand1='starter_wand';
  assert.ok(g.fireSpell(p,0));assert.equal(g.spells.at(-1).damage,ITEMS.starter_wand.damage+2);
  p.mana=p.maxMana;p.equipment.hand1='healing_wand';
  assert.ok(g.fireSpell(p,0));assert.equal(g.spells.at(-1).healingAmount,ITEMS.healing_wand.healingAmount+2);
 }
});
