import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/core.mjs';
import {ALLEY_SHOP_HEARTH,alleyGate,inDiagon} from '../src/diagon-alley.mjs';
import {flooFireGreen,HOMESTEAD_HEARTH} from '../src/floo-travel.mjs';
import {give} from '../src/items.mjs';
import {leaveTrainTest,trainPrompt,trainWorldBlocked} from '../src/train-test.mjs';
import {merchantAction,merchantRows} from '../src/traveling-merchant.mjs';
import {enterWildLands} from '../src/wild-lands.mjs';
import {snapshotWildLands} from '../src/wild-lands-session.mjs';

const powder=p=>p.inventory.find(item=>item?.type==='floo_powder')?.qty||0;
const step=(g,input={})=>g.update(.05,{keyboard:input});
const waitForFlame=g=>{for(let i=0;i<7;i++)step(g);};

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
 assert.match(trainPrompt(g,p),/FLOO TO THE HOMESTEAD/);
 step(g,{interact:true});
 assert.ok(flooFireGreen(g,ALLEY_SHOP_HEARTH.id));assert.equal(powder(p),2);
 waitForFlame(g);
 assert.ok(!inDiagon(g));assert.equal(powder(p),1);
 assert.ok(flooFireGreen(g,HOMESTEAD_HEARTH.id));
 assert.ok(Math.hypot(p.x-HOMESTEAD_HEARTH.x,p.y-HOMESTEAD_HEARTH.y)<25);
 walkInto(g,p,HOMESTEAD_HEARTH);
 assert.match(trainPrompt(g,p),/FLOO TO DIAGON ALLEY/);
 step(g,{interact:true});waitForFlame(g);
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
 walkInto(g,p,HOMESTEAD_HEARTH);step(g,{interact:true});
 step(g,{y:1});step(g,{y:1});waitForFlame(g);
 assert.ok(!inDiagon(g));assert.equal(powder(p),2);
 assert.ok(!flooFireGreen(g,HOMESTEAD_HEARTH.id));
 walkInto(g,p,HOMESTEAD_HEARTH);step(g,{interact:true});waitForFlame(g);
 assert.ok(inDiagon(g));assert.equal(powder(p),1);
 assert.ok(g.trainTest.alleyReturn);
 leaveTrainTest(g);
 assert.equal(powder(original),1);
});
