import assert from 'node:assert/strict';
import test from 'node:test';
import {Game} from '../src/core.mjs';
import {give,moveInventoryItem} from '../src/items.mjs';
import {saveSession,restoreSession} from '../src/session.mjs';
import {useChocolateFrog} from '../src/train-students.mjs';
import {enterWildLands} from '../src/wild-lands.mjs';
import {WIZARD_CARDS} from '../src/wizard-cards.mjs';
import {WIZARD_CARD_COLLECTION,wizardCardIds} from '../src/wizard-card-collection.mjs';

const collection=items=>items.find(item=>item?.type===WIZARD_CARD_COLLECTION);
const contents=(...types)=>types.map(type=>({type,qty:1}));
function setup(random=.9){
 const game=new Game(()=>random,{deferWorld:true});
 const player=game.addPlayer('keyboard','Collector');
 assert.ok(enterWildLands(game,{persistent:true}).ok);
 player.inventory=[];
 return {game,player};
}

test('an escaping or bottled Chocolate Frog adds a different card to the same slot',()=>{
 const {game,player}=setup(0);
 player.inventory=[{type:'chocolate_frog',qty:1}];
 game.openInventory(player);
 game.inventoryAction(player,'use');
 assert.equal(game.chocolateFrogs.length,1);
 assert.equal(collection(player.inventory).contents.length,1);
 assert.match(player.ui.notice,/escaped.*Card:/i);
 const first=wizardCardIds(collection(player.inventory))[0];
 assert.ok(give(player.inventory,'caught_chocolate_frog'));
 player.ui.index=player.inventory.findIndex(item=>item?.type==='caught_chocolate_frog');
 game.inventoryAction(player,'use');
 assert.equal(game.chocolateFrogs.length,2);
 assert.ok(player.inventory.some(item=>item?.type==='empty_jar'));
 assert.equal(player.inventory.filter(item=>item?.type===WIZARD_CARD_COLLECTION).length,1);
 const ids=wizardCardIds(collection(player.inventory));
 assert.equal(ids[0],first);
 assert.equal(ids.length,2);
 assert.notEqual(ids[1],first);
});

test('the album completes at 20 distinct cards, saves, and opens an independently navigable gallery',()=>{
 let {game,player}=setup();
 assert.ok(give(player.inventory,'chocolate_frog',22));
 for(let i=0;i<22;i++)assert.ok(useChocolateFrog(game,player));
 assert.equal(player.inventory.filter(Boolean).length,1);
 const ids=wizardCardIds(collection(player.inventory));
 assert.deepEqual([...ids].sort(),WIZARD_CARDS.map(card=>card.id).sort());
 game=restoreSession(JSON.parse(JSON.stringify(saveSession(game))));
 player=game.players[0];
 const packIndex=player.inventory.indexOf(collection(player.inventory));
 game.openInventory(player);
 player.ui.index=packIndex;
 game.inventoryAction(player,'use');
 assert.deepEqual(player.ui.wizardCards,{index:0,packIndex});
 game.inventoryAction(player,'prev');
 assert.equal(player.ui.wizardCards.index,19);
 game.inventoryAction(player,'next');
 assert.equal(player.ui.wizardCards.index,0);
 game.inventoryAction(player,'close');
 assert.equal(player.ui.wizardCards,undefined);
 assert.equal(player.ui.index,packIndex);
 assert.deepEqual(wizardCardIds(collection(player.inventory)),ids);
});

test('a partial album navigates the full catalog without changing the saved cards',()=>{
 const {game,player}=setup();
 const types=[WIZARD_CARDS[12].id,WIZARD_CARDS[2].id];
 player.inventory=[{type:WIZARD_CARD_COLLECTION,qty:1,contents:contents(...types)}];
 game.openInventory(player);
 game.inventoryAction(player,'use');
 assert.equal(player.ui.wizardCards.index,2);
 game.inventoryAction(player,'prev');
 assert.equal(player.ui.wizardCards.index,1);
 game.inventoryAction(player,'wizard-card:19');
 assert.equal(player.ui.wizardCards.index,19);
 game.inventoryAction(player,'wizard-card:20');
 assert.equal(player.ui.wizardCards.index,19);
 game.inventoryAction(player,'next');
 assert.equal(player.ui.wizardCards.index,0);
 game.inventoryAction(player,'prev');
 assert.equal(player.ui.wizardCards.index,19);
 assert.deepEqual(wizardCardIds(collection(player.inventory)),types);
});

test('a first card survives a full backpack and both cards fit one slot after a slot opens',()=>{
 let {game,player}=setup();
 player.inventory=Array.from({length:32},()=>({type:'sword',qty:1}));
 player.inventory[0]={type:'chocolate_frog',qty:2};
 assert.ok(useChocolateFrog(game,player));
 assert.equal(collection(player.inventory),undefined);
 const first=wizardCardIds(collection(player.field.overflow))[0];
 game=restoreSession(JSON.parse(JSON.stringify(saveSession(game))));
 player=game.players[0];
 assert.equal(wizardCardIds(collection(player.field.overflow))[0],first);
 assert.ok(useChocolateFrog(game,player));
 const ids=wizardCardIds(collection(player.inventory));
 assert.equal(ids[0],first);
 assert.equal(ids.length,2);
 assert.equal(collection(player.field.overflow),undefined);
 assert.equal(player.inventory.filter(Boolean).length,32);
});

test('storage and player-to-player ground pickup retain and merge album contents',()=>{
 const {game,player}=setup();
 const guest=game.addPlayer('pad:0','Guest');
 const [first,second,third]=WIZARD_CARDS.map(card=>card.id);
 const chest=[{type:WIZARD_CARD_COLLECTION,qty:1,contents:contents(first,second)}];
 player.inventory=[{type:WIZARD_CARD_COLLECTION,qty:1,contents:contents(first)}];
 assert.ok(moveInventoryItem(player,chest,{mode:'chest',index:0},{mode:'pack',index:1}));
 assert.equal(player.inventory.filter(Boolean).length,1);
 assert.deepEqual(wizardCardIds(collection(player.inventory)),[first,second]);
 assert.ok(!chest.some(Boolean));
 game.openInventory(player);
 game.inventoryAction(player,'drop');
 const loot=collection(game.loot);
 assert.deepEqual(wizardCardIds(loot),[first,second]);
 Object.assign(guest,{x:loot.x,y:loot.y,inventory:[{type:WIZARD_CARD_COLLECTION,qty:1,contents:contents(third)}]});
 assert.ok(game.collect(guest,loot));
 assert.equal(guest.inventory.filter(Boolean).length,1);
 assert.deepEqual(wizardCardIds(collection(guest.inventory)),[third,first,second]);
});
