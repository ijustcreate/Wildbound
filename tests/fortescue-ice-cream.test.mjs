import assert from 'node:assert/strict';
import test from 'node:test';
import {Game} from '../src/core.mjs';
import {ALLEY_SHOPS} from '../src/diagon-alley.mjs';
import {ITEMS,stat} from '../src/items.mjs';
import {inventoryToolbar} from '../src/inventory-toolbar.mjs';
import {saveSession,restoreSession} from '../src/session.mjs';
import {enterWildLands} from '../src/wild-lands.mjs';
import {syncWizardingShopStock} from '../src/wizarding-shop-goods.mjs';

const types=[
 'diagon_ice_cream_mint_chip','diagon_ice_cream_chocolate','diagon_ice_cream',
 'diagon_ice_cream_bertie_botts','diagon_ice_cream_moonberry',
];

function setup(){
 const game=new Game(()=>.4,{deferWorld:true});
 const player=game.addPlayer('keyboard','Explorer');
 assert.ok(enterWildLands(game,{persistent:true}).ok);
 return {game,player};
}

function eat(game,player,type){
 player.inventory=[{type,qty:2}];
 game.openInventory(player);
 assert.equal(inventoryToolbar(game,player,['A','B','X','Y']).options[0].label,'Eat ice cream');
 game.inventoryAction(player,'use');
 assert.equal(player.inventory[0].qty,1);
}

test('Fortescue’s offers five flavors and repairs old stock once without replacing it',()=>{
 const shop=ALLEY_SHOPS.find(s=>s.id==='floreans');
 assert.deepEqual(shop.stock.map(([type])=>type),[...types,'chocolate_frog']);
 const strawberry={item:{type:'diagon_ice_cream',qty:1},price:8};
 const frog={item:{type:'chocolate_frog',qty:1},price:15};
 const old={stock:[strawberry,frog],revision:7};
 syncWizardingShopStock(old,shop);
 syncWizardingShopStock(old,shop);
 assert.equal(old.revision,11);
 assert.deepEqual(old.stock.map(row=>row.item.type).sort(),[...types,'chocolate_frog'].sort());
 assert.equal(old.stock[0],strawberry);
 assert.equal(old.stock[1],frog);
 assert.ok(types.every(type=>ITEMS[type].iceCream&&ITEMS[type].description.includes('90 seconds')));
});

test('ordinary scoops replace the previous bonus, including the legacy Strawberry heal',()=>{
 let {game,player}=setup();
 const base={armor:stat(player,'armor'),manaRegen:stat(player,'manaRegen'),hpRegen:stat(player,'hpRegen'),speedBonus:stat(player,'speedBonus')};
 eat(game,player,types[0]);
 assert.equal(stat(player,'manaRegen'),base.manaRegen+1);
 eat(game,player,types[1]);
 assert.equal(stat(player,'manaRegen'),base.manaRegen);
 assert.equal(stat(player,'armor'),base.armor+2);
 player.hp=player.maxHp-45;
 const hp=player.hp;
 eat(game,player,types[2]);
 assert.equal(player.hp,hp+35);
 assert.equal(stat(player,'armor'),base.armor);
 assert.equal(stat(player,'hpRegen'),base.hpRegen+.2);
 eat(game,player,types[4]);
 assert.equal(stat(player,'hpRegen'),base.hpRegen);
 assert.equal(stat(player,'speedBonus'),base.speedBonus+.05);
 game.tickHeroVitals(player,30);
 game=restoreSession(JSON.parse(JSON.stringify(saveSession(game))));
 player=game.players[0];
 assert.equal(player.field.fortescueIceCream.remaining,60);
 assert.equal(stat(player,'speedBonus'),base.speedBonus+.05);
 game.tickHeroVitals(player,60);
 assert.equal(stat(player,'speedBonus'),base.speedBonus);
 assert.equal(player.field.fortescueIceCream,undefined);
});

test('Bertie Bott’s rolls exactly one mild flavor and reports the result',()=>{
 const {game,player}=setup();
 const stats=['manaRegen','armor','hpRegen','speedBonus'];
 const base=stats.map(key=>stat(player,key));
 for(const [index,flavor] of ['mint','chocolate','strawberry','moonberry'].entries()){
  game.random=()=>(index+.5)/4;
  eat(game,player,types[3]);
  assert.equal(player.field.fortescueIceCream.flavor,flavor);
  assert.equal(player.field.fortescueIceCream.remaining,90);
  assert.deepEqual(stats.filter((key,i)=>stat(player,key)>base[i]),[stats[index]]);
  assert.match(player.ui.notice,/for 90 seconds/);
 }
});
