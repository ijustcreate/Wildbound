import test from 'node:test';
import assert from 'node:assert/strict';
import {continueAfterDefeat} from '../src/defeat-flow.mjs';

test('revive and continue restores a defeated party in the same expedition',()=>{
 const messages=[],game={phase:'lost',players:[{hp:0,maxHp:100,stun:2,frozen:1},{hp:0,maxHp:40,attack:.3}],message:m=>messages.push(m)};
 assert.equal(continueAfterDefeat(game),true);assert.equal(game.phase,'play');
 assert.deepEqual(game.players.map(p=>p.hp),[55,40]);assert.ok(game.players.every(p=>p.invuln===3&&p.revive===0));assert.equal(messages.length,1);
});
test('revive action cannot be used outside defeat',()=>{
 const game={phase:'play',players:[{hp:20}]};assert.equal(continueAfterDefeat(game),false);assert.equal(game.players[0].hp,20);
});
