import assert from 'node:assert/strict';
import test from 'node:test';
import {Game} from '../src/core.mjs';
import {alleyBlocked,switchAlleyLayer} from '../src/diagon-alley.mjs';
import {NOCTURNE_BOSS_ANCHOR,NOCTURNE_BOSS_AGGRO_RANGE,isNocturneBossLoot,nocturneBossActors} from '../src/nocturne-boss.mjs';
import {restoreSession,saveSession} from '../src/session.mjs';
import {enterWildLands} from '../src/wild-lands.mjs';

function setup(){
 const game=new Game(()=>.45,{deferWorld:true});
 const player=game.addPlayer('keyboard','Explorer');
 assert.ok(enterWildLands(game,{persistent:true}).ok);
 switchAlleyLayer(game,'diagon');
 player.invincible=true;
 Object.assign(player,{x:9460,y:5010});
 return {game,player};
}

const checkpoint=game=>restoreSession(JSON.parse(JSON.stringify(saveSession(game))));

test('reachable rear-court approach summons exactly two Death Eaters and casts native hostile green bolts',()=>{
 const {game,player}=setup();
 assert.ok(!alleyBlocked(game,player.x,player.y));
 assert.ok(Math.hypot(player.x-NOCTURNE_BOSS_ANCHOR.x,player.y-NOCTURNE_BOSS_ANCHOR.y)>NOCTURNE_BOSS_AGGRO_RANGE);
 game.update(.05,{});
 assert.equal(game.trainTest.nocturneBoss,undefined);
 assert.equal(nocturneBossActors(game)[0].nocturneBossWaiting,true);
 for(let i=0;i<26&&!game.trainTest.nocturneBoss;i++)game.update(.05,{keyboard:{y:-1}});
 const state=game.trainTest.nocturneBoss;
 assert.ok(state,'the real walk through the rear lane engages the encounter');
 assert.deepEqual(state.actors.map(actor=>actor.nocturneBossRole),['lord','minion','minion']);
 assert.ok(state.actors.every(actor=>!alleyBlocked(game,actor.x,actor.y)));
 for(let i=0;i<58&&!game.spells.some(bolt=>bolt.nocturneBossRole==='lord');i++)game.update(.05,{});
 const bolt=game.spells.find(bolt=>bolt.nocturneBossRole==='lord');
 assert.equal(bolt?.color,'#74ec3b');
 assert.equal(bolt?.hostile,true);
 player.invincible=false;
 const hp=player.hp;
 for(let i=0;i<18&&player.hp===hp;i++)game.update(.05,{});
 assert.ok(player.hp<hp,'hostile green magic hits the player with PvP off');
 assert.equal(game.enemies.filter(actor=>actor.nocturneBossRole==='minion').length,2);
});

test('health taunts, partial deaths, exact rewards and claimed loot survive scene and checkpoint changes',()=>{
 let {game,player}=setup();
 Object.assign(player,{x:9507,y:4949});
 game.update(.05,{});
 let state=game.trainTest.nocturneBoss;
 const [lord,iron]=state.actors;
 lord.hp=lord.maxHp*.85;
 game.update(.05,{});
 assert.equal(state.speech.threshold,.9);
 lord.hp=lord.maxHp*.55;
 game.update(.05,{});
 lord.hp=lord.maxHp*.25;
 game.update(.05,{});
 assert.deepEqual(state.thresholds,[.9,.6,.3]);
 assert.deepEqual(state.speechQueue.map(line=>line.threshold),[.6,.3]);
 iron.hp=0;
 game.update(.05,{});
 assert.deepEqual(game.loot.filter(isNocturneBossLoot).map(item=>item.type),['death_eater_iron_mask']);
 const mask=game.loot.find(isNocturneBossLoot);
 Object.assign(player,{x:mask.x,y:mask.y});
 assert.ok(game.collect(player,mask));
 assert.equal(state.claimedLootIds.length,1);

 switchAlleyLayer(game,undefined);
 game=checkpoint(game);
 switchAlleyLayer(game,'diagon');
 player=game.players[0];
 Object.assign(player,{x:9507,y:4949});
 game.update(.05,{});
 state=game.trainTest.nocturneBoss;
 assert.deepEqual(state.thresholds,[.9,.6,.3]);
 assert.equal(state.claimedLootIds.length,1);
 assert.equal(state.actors[0].hp,lord.maxHp*.25);
 assert.equal(game.enemies.filter(actor=>actor.nocturneBossRole&&actor.hp>0).length,2);
 state.actors[0].hp=0;
 state.actors[2].hp=0;
 game.update(.05,{});
 assert.ok(state.death.startedAt<=game.time);
 const expected=[['dark_essence',10],['dark_lord_wand',1],['death_eater_ivory_mask',1]];
 assert.deepEqual(game.loot.filter(isNocturneBossLoot).map(item=>[item.type,item.qty]).sort(),expected);
 game=checkpoint(game);
 game.update(.05,{});
 assert.deepEqual(game.loot.filter(isNocturneBossLoot).map(item=>[item.type,item.qty]).sort(),expected);
 assert.equal(game.enemies.filter(actor=>actor.nocturneBossRole&&actor.hp>0).length,0);
});
