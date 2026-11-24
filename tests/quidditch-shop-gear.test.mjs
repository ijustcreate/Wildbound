import assert from 'node:assert/strict';
import test from 'node:test';
import {Game} from '../src/core.mjs';
import {ITEMS} from '../src/items.mjs';
import {broomFlightSpeed} from '../src/broom-mount.mjs';
import {BROOM_SPEED_POTION,BROOM_SPEED_POTION_SECONDS} from '../src/broom-speed-potion.mjs';
import {inventoryToolbar} from '../src/inventory-toolbar.mjs';
import {QUIDDITCH_TEAMS} from '../src/quidditch-layout.mjs';
import {saveSession,restoreSession} from '../src/session.mjs';
import {enterWildLands} from '../src/wild-lands.mjs';

function setup(){
 const game=new Game(()=>.4,{deferWorld:true});
 const player=game.addPlayer('keyboard','Rider');
 assert.ok(enterWildLands(game,{persistent:true}).ok);
 return {game,player};
}

test('both team uniforms use their match colors and equip in separate slots',()=>{
 const {game,player}=setup();
 for(const [id,team] of Object.entries(QUIDDITCH_TEAMS)){
  const robe=`quidditch_${id}_robe`,scarf=`quidditch_${id}_scarf`;
  assert.equal(ITEMS[robe].trimColor,team.color);
  assert.equal(ITEMS[robe].artColor,team.dark);
  assert.deepEqual(ITEMS[scarf].scarf,[team.color,team.dark]);
  player.inventory=[{type:robe,qty:1},{type:scarf,qty:1}];
  game.openInventory(player);
  game.inventoryAction(player,'use');
  player.ui.index=1;
  game.inventoryAction(player,'use');
  assert.equal(player.equipment.chest,robe);
  assert.equal(player.equipment.back,scarf);
  player.ui=null;
 }
});

test('the broom potion applies exactly ten percent, refreshes, and expires on the saved gameplay clock',()=>{
 let {game,player}=setup();
 player.broomMount={item:{type:'nimbus_2000',qty:1},time:0};
 const baseSpeed=broomFlightSpeed(player);
 player.inventory=[{type:BROOM_SPEED_POTION,qty:2}];
 game.openInventory(player);
 assert.equal(inventoryToolbar(game,player,['A','B','X','Y']).options[0].reason,'');
 game.inventoryAction(player,'use');
 assert.equal(player.inventory[0].qty,1);
 assert.equal(player.field.broomSpeedRemaining,BROOM_SPEED_POTION_SECONDS);
 assert.equal(broomFlightSpeed(player),baseSpeed*1.1);
 game.tickHeroVitals(player,45);
 assert.equal(player.field.broomSpeedRemaining,255);
 game.inventoryAction(player,'use');
 assert.equal(player.inventory[0],null);
 assert.equal(player.field.broomSpeedRemaining,BROOM_SPEED_POTION_SECONDS);
 assert.equal(broomFlightSpeed(player),baseSpeed*1.1);
 game.tickHeroVitals(player,125);
 game=restoreSession(JSON.parse(JSON.stringify(saveSession(game))));
 player=game.players[0];
 assert.equal(player.field.broomSpeedRemaining,175);
 assert.equal(broomFlightSpeed(player),baseSpeed*1.1);
 game.tickHeroVitals(player,175);
 assert.equal(player.field.broomSpeedRemaining,0);
 assert.equal(broomFlightSpeed(player),baseSpeed);
});
