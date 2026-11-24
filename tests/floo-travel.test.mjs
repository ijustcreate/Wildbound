import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/core.mjs';
import {ALLEY_SHOP_HEARTH,alleyGate,inDiagon} from '../src/diagon-alley.mjs';
import {flooFireGreen,HOMESTEAD_HEARTH,THREE_BROOMSTICKS_HEARTH} from '../src/floo-travel.mjs';
import {npcDialogueView} from '../src/npc-quests.mjs';
import {give} from '../src/items.mjs';
import {leaveTrainTest,trainPrompt,trainWorldBlocked} from '../src/train-test.mjs';
import {merchantAction,merchantRows} from '../src/traveling-merchant.mjs';
import {enterWildLands} from '../src/wild-lands.mjs';
import {snapshotWildLands} from '../src/wild-lands-session.mjs';

const powder=p=>p.inventory.find(item=>item?.type==='floo_powder')?.qty||0;
const step=(g,input={})=>g.update(.05,{keyboard:input});
const waitForFlame=g=>{for(let i=0;i<7;i++)step(g);};
const select=(g,p,id)=>{
 assert.ok(npcDialogueView(g,p).choices.some(choice=>choice.action==='floo:'+id));
 g.inventoryAction(p,'floo:'+id);
};

function setup(persistent){
 const g=new Game(()=>.5),original=g.addPlayer('keyboard');
 g.phase='play';g.openingBoard=false;
 const saves=[];
 g.persist=()=>{if(g.trainTest)saves.push(snapshotWildLands(g.trainTest));};
 original.coins=100;
 assert.ok(enterWildLands(g,{persistent}).ok);
 g.trainTest.preparing=false;
 return {g,p:g.players[0],original,saves};
}

function walkInto(g,p,hearth){
 Object.assign(p,{x:hearth.x,y:hearth.y+19});
 assert.ok(!trainWorldBlocked(g,hearth.x,hearth.y-6,8),'open hearth center');
 assert.ok(trainWorldBlocked(g,hearth.x+20,hearth.y-6,8),'solid jamb');
 assert.ok(trainWorldBlocked(g,hearth.x,hearth.y-24,8),'solid rear');
 assert.ok(!trainPrompt(g,p).includes('FLOO'),'standing outside does not offer travel');
 g.moveActor(p,0,-25);
 assert.ok(p.y<=hearth.y,'explorer actually walked into the hearth');
}

test('Floo travel spends one purchased pinch per direction and immediate save records the destination',()=>{
 const {g,p,saves}=setup(true);
 const gate=alleyGate(g);
 p.equipment.hand1='starter_wand';
 Object.assign(p,{x:gate.x,y:gate.y+55});
 step(g,{interact:true});g.trainTest.time+=1;step(g);step(g,{interact:true});
 assert.ok(inDiagon(g));
 step(g);
 Object.assign(p,{x:9190,y:4942});step(g,{interact:true});
 assert.equal(p.ui.alleyShop,'nocturne-curios');
 p.ui.index=merchantRows(g,p).findIndex(row=>row.item.type==='floo_powder');
 merchantAction(g,p,'use');merchantAction(g,p,'use');
 assert.equal(powder(p),2);assert.equal(p.coins,80);
 p.ui=null;step(g);
 walkInto(g,p,ALLEY_SHOP_HEARTH);
 assert.match(trainPrompt(g,p),/USE FLOO POWDER/);
 step(g,{interact:true});
 assert.equal(p.ui.flooHearth,'nocturne-curios');
 select(g,p,'homestead');
 assert.ok(flooFireGreen(g,ALLEY_SHOP_HEARTH.id));assert.equal(powder(p),2);
 waitForFlame(g);
 assert.ok(!inDiagon(g));assert.equal(powder(p),1);
 assert.ok(flooFireGreen(g,HOMESTEAD_HEARTH.id));
 assert.ok(Math.hypot(p.x-HOMESTEAD_HEARTH.x,p.y-HOMESTEAD_HEARTH.y)<25);
 walkInto(g,p,HOMESTEAD_HEARTH);
 assert.match(trainPrompt(g,p),/USE FLOO POWDER/);
 step(g,{interact:true});select(g,p,'nocturne-curios');waitForFlame(g);
 assert.ok(inDiagon(g));assert.equal(powder(p),0);
 assert.equal(saves.at(-1).design.activeRoom,'diagon');
 walkInto(g,p,ALLEY_SHOP_HEARTH);
 assert.ok(!trainPrompt(g,p).includes('FLOO'));
 step(g,{interact:true});waitForFlame(g);
 assert.ok(inDiagon(g));assert.equal(powder(p),0);
});

test('leaving the hearth before the burst costs nothing and a preview commits only the used powder',()=>{
 const {g,p,original}=setup(false);
 give(original.inventory,'floo_powder',2);give(p.inventory,'floo_powder',2);
 walkInto(g,p,HOMESTEAD_HEARTH);step(g,{interact:true});select(g,p,'nocturne-curios');
 step(g,{y:1});step(g,{y:1});waitForFlame(g);
 assert.ok(!inDiagon(g));assert.equal(powder(p),2);
 assert.ok(!flooFireGreen(g,HOMESTEAD_HEARTH.id));
 walkInto(g,p,HOMESTEAD_HEARTH);step(g,{interact:true});select(g,p,'nocturne-curios');waitForFlame(g);
 assert.ok(inDiagon(g));assert.equal(powder(p),1);
 assert.ok(g.trainTest.alleyReturn);
 leaveTrainTest(g);
 assert.equal(powder(original),1);
});

test('the Three Broomsticks Use menu chooses either fireplace and only cross-layer travel moves the party',()=>{
 const {g,p}=setup(true);
 p.equipment.hand1=p.equipment.hand2=null;
 const visitor=g.addPlayer('gamepad-0','Visitor');
 Object.assign(visitor,{x:7855,y:4140,ui:{panel:'pack',index:0}});
 const {x,y}=visitor,visitorPack=visitor.ui;
 give(p.inventory,'floo_powder',3);
 const usePowder=()=>{
  p.ui={panel:'pack',index:p.inventory.findIndex(item=>item?.type==='floo_powder')};
  g.inventoryAction(p,'use');
 };
 Object.assign(p,{x:THREE_BROOMSTICKS_HEARTH.x,y:THREE_BROOMSTICKS_HEARTH.y+19});
 usePowder();
 assert.equal(p.ui.flooHearth,'three-broomsticks');
 assert.deepEqual(npcDialogueView(g,p).choices.slice(0,2).map(c=>c.label),['Wilds Homestead','Nocturne Alley']);
 g.inventoryAction(p,'close');
 assert.equal(powder(p),3);
 usePowder();select(g,p,'homestead');
 assert.ok(flooFireGreen(g,THREE_BROOMSTICKS_HEARTH.id));
 waitForFlame(g);
 assert.equal(powder(p),2);
 assert.equal(g.portalTransition.effect,'floo');
 assert.deepEqual(g.portalTransition.ids,[p.id]);
 assert.deepEqual({x:visitor.x,y:visitor.y}, {x,y});
 assert.equal(visitor.ui,visitorPack);
 usePowder();select(g,p,'nocturne-curios');waitForFlame(g);
 assert.ok(inDiagon(g));
 assert.equal(powder(p),1);
 for(const hero of [p,visitor]){
  assert.ok(!trainWorldBlocked(g,hero.x,hero.y,8));
  assert.ok(Math.hypot(hero.x-ALLEY_SHOP_HEARTH.x,hero.y-ALLEY_SHOP_HEARTH.y)<80);
 }
 assert.ok(Math.hypot(p.x-visitor.x,p.y-visitor.y)>=20);
 usePowder();
 assert.ok(npcDialogueView(g,p).choices.find(c=>c.action==='floo:three-broomsticks').disabled);
 give(p.inventory,'starter_wand');
 select(g,p,'three-broomsticks');waitForFlame(g);
 assert.ok(!inDiagon(g));
 assert.equal(powder(p),0);
 assert.ok(flooFireGreen(g,THREE_BROOMSTICKS_HEARTH.id));
 assert.ok(Math.hypot(p.x-THREE_BROOMSTICKS_HEARTH.x,p.y-THREE_BROOMSTICKS_HEARTH.y)<27);
});
