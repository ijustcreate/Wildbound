import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/core.mjs';
import {BORGIN_MIRROR_STORE as store,switchAlleyLayer,transferAlleyPurchases} from '../src/diagon-alley.mjs';
import {mirroredShopPoint} from '../src/diagon-shop-rooms.mjs';
import {BACKPACK_SLOTS,count,give} from '../src/items.mjs';
import {npcDialogueAction,npcDialogueView} from '../src/npc-quests.mjs';
import {restoreSession,saveSession} from '../src/session.mjs';
import {STOLEN_HEART,dropStolenHeart,stolenHeartMetadata,stolenHeartName} from '../src/stolen-heart.mjs';
import {trainPrompt} from '../src/train-test.mjs';
import {enterWildLands} from '../src/wild-lands.mjs';

const service=mirroredShopPoint(store,{x:24,y:17});
const heartIn=p=>p.inventory.find(item=>item?.type===STOLEN_HEART);
const fullPack=()=>Array.from({length:32},()=>({type:'hat',qty:1}));
const reload=g=>restoreSession(JSON.parse(JSON.stringify(saveSession(g))));

function setup(){
 const g=new Game(()=>.4,{deferWorld:true});
 const owner=g.addPlayer('keyboard','Rowan'),guest=g.addPlayer('pad:1','Rowan');
 owner.profileId='rowan-owner';guest.profileId='rowan-guest';
 g.phase='play';g.persist=()=>{};
 assert.ok(enterWildLands(g,{persistent:true}).ok);
 g.trainTest.preparing=false;
 switchAlleyLayer(g,'diagon');
 for(const p of g.players)Object.assign(p,service,{inventory:[],coins:100});
 return {g,owner,guest};
}

function openMirrorDialogue(g,p){
 assert.match(trainPrompt(g,p),/TALK TO MR\. BORGIN/);
 const press=()=>g.update(.05,{[p.device]:{interact:true}});
 g.update(.05,{});press();g.update(.05,{});
 assert.ok(p.ui?.borginHeart);
 npcDialogueAction(g,p,'borgin:mirror');
 assert.equal(p.ui.node,'mirror');
}

test('another explorer can pick up, store, and return a named heart through shared storage and saves',()=>{
 let {g,owner,guest}=setup();
 const metadata=stolenHeartMetadata(owner);
 assert.ok(dropStolenHeart(g,guest.x,guest.y,metadata));
 g=reload(g);[owner,guest]=g.players;
 const floor=g.nearbyLoot(guest);
 assert.equal(stolenHeartName(floor),'Rowan’s Stolen Heart');
 assert.ok(g.collect(guest,floor));
 assert.deepEqual(heartIn(guest).stolenHeart,metadata.stolenHeart);
 openMirrorDialogue(g,guest);
 assert.equal(npcDialogueView(g,guest).choices.some(choice=>choice.action==='borgin:trade'),false);
 npcDialogueAction(g,guest,'borgin:trade');
 assert.equal(count(guest,'dark_essence'),0);assert.ok(heartIn(guest));
 npcDialogueAction(g,guest,'close');
 g.openInventory(guest,'shared');g.inventoryAction(guest,'store');
 assert.equal(heartIn(guest),undefined);
 g=reload(g);[owner,guest]=g.players;
 g.openInventory(owner,'shared');g.inventoryAction(owner,'panel:chest');g.inventoryAction(owner,'use');
 assert.deepEqual(heartIn(owner).stolenHeart,metadata.stolenHeart);
});

test('Borgin quietly pays exactly 50 Dark Essence for the explorer’s own heart and still opens the antiques counter',()=>{
 const {g,owner,guest}=setup();
 assert.ok(give(owner.inventory,STOLEN_HEART,1,BACKPACK_SLOTS,stolenHeartMetadata(guest)));
 assert.ok(give(owner.inventory,STOLEN_HEART,1,BACKPACK_SLOTS,stolenHeartMetadata(owner)));
 owner.inventory.push(...fullPack().slice(0,30));
 openMirrorDialogue(g,owner);
 const choice=npcDialogueView(g,owner).choices.find(choice=>choice.action==='borgin:trade');
 assert.equal(choice.label,'Trade Rowan’s Stolen Heart · Receive 50 Dark Essence');
 owner.ui.index=1;
 g.update(.05,{keyboard:{interact:true}});
 assert.equal(count(owner,'dark_essence'),50);
 assert.equal(owner.coins,100);
 assert.equal(heartIn(owner).stolenHeart.ownerKey,'profile:rowan-guest');
 npcDialogueAction(g,owner,'borgin:trade');
 assert.equal(count(owner,'dark_essence'),50);
 npcDialogueAction(g,owner,'borgin:shop');
 assert.equal(owner.ui.shop,'merchant');assert.equal(owner.ui.alleyShop,store.id);
 assert.deepEqual(g.trainTest.alleyMerchants[store.id].stock.map(row=>[row.item.type,row.price]),store.stock);
 const restored=reload(g).players[0];
 assert.equal(count(restored,'dark_essence'),50);
 assert.equal(heartIn(restored).stolenHeart.ownerKey,'profile:rowan-guest');
});

test('a full backpack keeps world loot in place, and a legacy overflow rejects the exchange without taking the heart',()=>{
 const {g,owner}=setup();
 owner.inventory=fullPack();
 const metadata=stolenHeartMetadata(owner),floor=dropStolenHeart(g,owner.x,owner.y,metadata);
 assert.equal(g.collect(owner,floor),false);assert.ok(g.loot.includes(floor));
 owner.inventory.push({type:STOLEN_HEART,qty:1,...metadata});
 openMirrorDialogue(g,owner);
 const before=JSON.stringify(owner.inventory);
 npcDialogueAction(g,owner,'borgin:trade');
 assert.equal(JSON.stringify(owner.inventory),before);
 assert.match(owner.ui.notice,/Make room/);
});

test('an existing owned heart exchanges once after leaving a shop preview',()=>{
 const {g,owner}=setup();
 assert.ok(give(owner.inventory,STOLEN_HEART,1,BACKPACK_SLOTS,stolenHeartMetadata(owner)));
 const t=g.trainTest;
 t.persistent=false;t.returnPlayers=[structuredClone(owner)];
 openMirrorDialogue(g,owner);
 npcDialogueAction(g,owner,'borgin:trade');
 assert.equal(count(owner,'dark_essence'),50);
 transferAlleyPurchases(g,t);transferAlleyPurchases(g,t);
 const original=t.returnPlayers[0];
 assert.equal(count(original,'dark_essence'),50);assert.equal(heartIn(original),undefined);
});
