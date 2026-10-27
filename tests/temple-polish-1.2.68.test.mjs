import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/core.mjs';
import {ensureTemple,TEMPLE_STAIRS} from '../src/temple.mjs';
import {dropInventoryItem,canDropInventoryItem} from '../src/inventory-world.mjs';
import {collectTempleLoot} from '../src/temple-loot.mjs';
import {tickSalvage,salvageReason} from '../src/salvage.mjs';
import {saveSession,restoreSession} from '../src/session.mjs';
import {tickRitualPets} from '../src/hunter-pets.mjs';
import {cycleFollowerControl,controlledFollower} from '../src/follower-control.mjs';
const setup=()=>{const g=new Game(()=>.4);g.environment='temple';const p=g.addPlayer('keyboard');g.start();g.openingBoard=false;ensureTemple(g);Object.assign(p,TEMPLE_STAIRS);g.enterRoom(p,g.portals.find(d=>d.temple));p.roomX=160;p.roomY=140;return {g,p};};
test('sanctum drops and salvage stay in room coordinates and survive a saved expedition',()=>{
 const {g,p}=setup();assert.ok(canDropInventoryItem(g,p));
 const item=dropInventoryItem(g,p,'sword',1,{sockets:['ruby']});assert.equal(g.templeLoot.length,1);assert.equal(item.x,p.roomX);assert.equal(item.y,p.roomY);
 const r=restoreSession(JSON.parse(JSON.stringify(saveSession(g)))),q=r.players[0];q.inventory=[];assert.ok(collectTempleLoot(r,q));assert.deepEqual(q.inventory[0].sockets,['ruby']);assert.equal(r.templeLoot.length,0);
 q.inventory=[{type:'sword',qty:1}];q.ui={panel:'pack',index:0};assert.equal(salvageReason(q),'');for(let i=0;i<14;i++)tickSalvage(r,q,true,.1);
 assert.ok(r.templeLoot.some(l=>l.type==='relic_dust'&&l.room===q.room));assert.ok(!r.loot.some(l=>l.salvageBorn===r.time));
 r.start();assert.equal(r.templeLoot.length,0);
});
test('ritual tiger control keeps the real hero dagger, survives updates and save, then returns the loadout',()=>{
 const g=new Game(()=>.3),p=g.addPlayer('pad:0');g.start();g.openingBoard=false;g.enemies=[];g.scenery=[];g.terrain.fill('grass');p.room=null;p.x=p.y=500;p.equipment.hand1='ritual_dagger';
 tickRitualPets(g,.02);const id=p.ritualPet.id;cycleFollowerControl(g,p);assert.equal(controlledFollower(g,p).id,id);assert.notEqual(p.equipment.hand1,'ritual_dagger');
 for(let i=0;i<40;i++)g.update(.02,{'pad:0':{x:1}});
 assert.equal(p.ritualPet.id,id);assert.equal(controlledFollower(g,p).id,id);assert.ok(!g.log.some(s=>s.includes('follower fell')));
 const r=restoreSession(JSON.parse(JSON.stringify(saveSession(g)))),q=r.players[0];r.update(.02,{});assert.equal(controlledFollower(r,q).id,id);
 cycleFollowerControl(r,q);assert.equal(q.equipment.hand1,'ritual_dagger');assert.ok(!q.controlledFollowerId);tickRitualPets(r,.02);assert.equal(q.ritualPet.id,id);
});
