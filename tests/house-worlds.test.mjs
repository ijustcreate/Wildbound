import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/core.mjs';
import {travelHouseWorlds} from '../src/house-worlds.mjs';
import {saveSession,restoreSession} from '../src/session.mjs';

test('house mode travels the entire party and restores independent world snapshots',()=>{
 const g=new Game();g.addPlayer('keyboard','One');g.addPlayer('pad:0','Two');g.environment='house';g.start();g.houseWorldsEnabled=true;g.random=()=>.3;
 g.players[0].hp=71;g.players[0].x=740;g.loot.push({id:987,type:'stone',qty:2,x:700,y:700});
 assert.equal(travelHouseWorlds(g,6),false);
 assert.equal(travelHouseWorlds(g,5),true);assert.equal(g.generatedEnvironment,'forest');assert.equal(g.players.length,2);
 g.players[0].hp=42;g.players[0].x=900;g.loot.push({id:988,type:'stone',qty:3,x:950,y:950});
 travelHouseWorlds(g,8);assert.equal(g.generatedEnvironment,'house');assert.equal(g.players[0].hp,71);assert.equal(g.players[0].x,740);assert.ok(g.loot.some(l=>l.id===987));assert.ok(!g.loot.some(l=>l.id===988));
 const restored=restoreSession(JSON.parse(JSON.stringify(saveSession(g))));restored.random=()=>.3;
 travelHouseWorlds(restored,5);assert.equal(restored.generatedEnvironment,'forest');assert.equal(restored.players[0].hp,42);assert.equal(restored.players[0].x,900);assert.ok(restored.loot.some(l=>l.id===988));
});
test('ordinary games do not warp on five or eight',()=>{const g=new Game();assert.equal(travelHouseWorlds(g,5),false);assert.equal(travelHouseWorlds(g,8),false);});
