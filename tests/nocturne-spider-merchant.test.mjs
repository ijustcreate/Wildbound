import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/core.mjs';
import {Profiles} from '../src/profiles.mjs';
import {freshCharacter,give} from '../src/items.mjs';
import {npcDialogueAction,npcDialogueView} from '../src/npc-quests.mjs';
import {leaveTrainTest,trainInteraction,trainPrompt} from '../src/train-test.mjs';
import {enterWildLands} from '../src/wild-lands.mjs';
import {saveSession,restoreSession} from '../src/session.mjs';
import {NOCTURNE_SPIDER_MERCHANT as wizard,NOCTURNE_SPIDER_STOCK as stock} from '../src/nocturne-spider-merchant.mjs';
import {restoreHunterPet} from '../src/hunter-pets.mjs';
import {rigSubject} from '../src/rig-subjects.mjs';

const essence=p=>p.inventory.reduce((n,i)=>n+(i?.type==='dark_essence'?i.qty:0),0);
function fixture(persistent,originalEssence=0){
 const game=new Game(()=>.5),original=game.addPlayer('keyboard','Spider keeper');
 const profiles=new Profiles(),hero=freshCharacter('spider-keeper-qa','Spider keeper');
 profiles.write=async data=>{profiles.saved=JSON.parse(JSON.stringify(data));};
 profiles.data.heroes.push(hero);profiles.assign(original,hero);
 if(originalEssence)give(original.inventory,'dark_essence',originalEssence);
 game.start();game.openingBoard=false;game.persist=()=>profiles.capture(game);
 assert.equal(enterWildLands(game,{persistent}).ok,true);
 game.trainTest.design.activeRoom='diagon';game.trainTest.preparing=false;
 const p=game.players[0];
 Object.assign(p,{x:wizard.x-36,y:wizard.y});
 return {game,p,original,profiles,hero};
}

test('Silas opens the native merchant dialogue and charges only Dark Essence for each spider',()=>{
 for(const [index,s] of stock.entries()){
  const {game,p,profiles,hero}=fixture(true,s.price+2),gold=p.coins;
  assert.match(trainPrompt(game,p),/SILAS THREADNEEDLE/);
  assert.equal(trainInteraction(game,p),true);
  const view=npcDialogueView(game,p);
  assert.equal(view.npc.name,wizard.name);
  assert.equal(view.choices.length,4);
  assert.match(view.choices[index].label,new RegExp(s.price+' Dark Essence'));
  assert.ok(rigSubject(s.kind));
  assert.equal(npcDialogueAction(game,p,`choice:${index}`),true);
  assert.equal(p.hunterPet.kind,s.kind);
  assert.equal(essence(p),2);assert.equal(p.coins,gold);
  assert.equal(profiles.saved.heroes[0].hunterPet.kind,s.kind);
  npcDialogueAction(game,p,'adopt:'+s.kind);
  assert.equal(essence(p),2,'cannot charge twice');
  npcDialogueAction(game,p,'close');
  game.update(.05,{keyboard:{}});
  assert.ok(Number.isFinite(p.hunterPet.x)&&Math.hypot(p.hunterPet.x-p.x,p.hunterPet.y-p.y)<70);
  const saved=restoreSession(JSON.parse(JSON.stringify(saveSession(game))));
  assert.equal(saved.players[0].hunterPet.kind,s.kind);
  assert.equal(essence(saved.players[0]),2);
  profiles.assign(saved.players[0],JSON.parse(JSON.stringify(hero)));
  assert.equal(saved.players[0].hunterPet.kind,s.kind);
 }
});

test('the merchant rejects an unfunded or distant trade and never replaces a companion',()=>{
 const {game,p}=fixture(true,2);
 trainInteraction(game,p);npcDialogueAction(game,p,'use');
 assert.match(p.ui.notice,/4 Dark Essence/);
 assert.equal(essence(p),2);assert.ok(!p.hunterPet);
 p.x-=150;npcDialogueAction(game,p,'adopt:spider');
 assert.equal(p.ui,null);assert.equal(essence(p),2);
 Object.assign(p,{x:wizard.x-30,y:wizard.y});give(p.inventory,'dark_essence',10);
 p.hunterPet=restoreHunterPet({kind:'wolf'});
 trainInteraction(game,p);npcDialogueAction(game,p,'adopt:spider');
 assert.equal(p.hunterPet.kind,'wolf');assert.equal(essence(p),12);
});

test('preview adoption and other Dark Essence trades share one durable debit',()=>{
 const {game,p,original,hero}=fixture(false,8);
 const t=game.trainTest;
 t.alleyPurchases={[p.id]:{spent:0,gold:25,items:[],delta:{dark_essence:-5}}};
 give(p.inventory,'dark_essence',5);
 trainInteraction(game,p);npcDialogueAction(game,p,'adopt:spider');
 assert.match(p.ui.notice,/from your expedition/);
 assert.equal(essence(original),8);assert.ok(!p.hunterPet);
 t.alleyPurchases[p.id]={spent:0,gold:0,items:[],delta:{}};
 npcDialogueAction(game,p,'adopt:tarantula');assert.equal(p.hunterPet.kind,'tarantula');
 assert.equal(t.alleyPurchases[p.id].delta.dark_essence,-6);
 assert.equal(essence(original),8);assert.ok(!original.hunterPet);
 leaveTrainTest(game);
 assert.equal(essence(original),2);assert.equal(original.hunterPet.kind,'tarantula');
 assert.equal(hero.hunterPet.kind,'tarantula');
});
