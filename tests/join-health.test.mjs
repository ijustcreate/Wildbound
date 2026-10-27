import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/core.mjs';
import {Profiles} from '../src/profiles.mjs';
import {freshCharacter,refreshVitals} from '../src/items.mjs';
import {saveSession,restoreSession} from '../src/session.mjs';
import {migrateSavedStarterChest} from '../src/starter-chest.mjs';

test('joining with a leveled saved explorer fills the final equipped maximum health',()=>{
 const g=new Game(()=>.5),p=g.addPlayer('keyboard'),profiles=new Profiles(),h=freshCharacter('health-join','Healthy Explorer');h.level=23;
 p.hp=1;profiles.assign(p,h);assert.ok(p.maxHp>100);assert.equal(p.hp,p.maxHp);
 g.start();const late=g.addPlayer('pad:0');profiles.assign(late,h);assert.equal(late.hp,late.maxHp);
});
test('a fresh expedition and a new expedition refill wounded or downed lobby heroes',()=>{
 const g=new Game(()=>.5),p=g.addPlayer('keyboard'),q=g.addPlayer('pad:0');p.level=23;q.level=10;refreshVitals(p);refreshVitals(q);p.hp=1;q.hp=0;
 assert.ok(g.start());assert.equal(p.hp,p.maxHp);assert.equal(q.hp,q.maxHp);
 p.hp=3;q.hp=0;g.newExpedition();assert.equal(p.hp,p.maxHp);assert.equal(q.hp,q.maxHp);
});
test('continuing a saved expedition keeps actual health rather than granting a join heal',()=>{
 const g=new Game(()=>.5),p=g.addPlayer('keyboard');g.start();p.hp=37;
 const restored=restoreSession(JSON.parse(JSON.stringify(saveSession(g))));assert.equal(restored.players[0].hp,37);
});
test('legacy starter deposits migrate once without dropping potions, sockets or bag contents',()=>{
 const h={starterChest:[{type:'potion',qty:6},{type:'armor_bag',qty:1,contents:[{type:'hat',qty:1}]},{type:'starter_sword',qty:1,sockets:['azure_bead']}]};
 migrateSavedStarterChest(h);const first=structuredClone(h.field.overflow);assert.equal(first[0].qty,6);assert.deepEqual(first[1].contents,[{type:'hat',qty:1}]);assert.deepEqual(first[2].sockets,['azure_bead']);
 migrateSavedStarterChest(h);assert.deepEqual(h.field.overflow,first);
});
