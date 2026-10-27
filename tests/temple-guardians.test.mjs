import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/core.mjs';
import {ensureTemple,TEMPLE_STAIRS} from '../src/temple.mjs';
import {saveSession,restoreSession} from '../src/session.mjs';
import {playerCombatTargets} from '../src/succubus-charm.mjs';
const setup=()=>{const g=new Game(()=>.4);g.environment='temple';const p=g.addPlayer('keyboard'),q=g.addPlayer('pad:0');g.start();g.openingBoard=false;ensureTemple(g);for(const a of [p,q]){Object.assign(a,TEMPLE_STAIRS);g.enterRoom(a,g.portals.find(d=>d.temple));a.roomX=160;a.roomY=140;a.hp=a.maxHp=1000;}return {g,p,q};};
const take=(g,p,action='use')=>{g.openInventory(p,'temple');p.ui.panel='chest';p.ui.index=0;g.inventoryAction(p,action);p.ui=null;};
test('entering and reopening the ritual chest does not summon guardians; failed withdrawal stays dormant',()=>{
 const {g,p}=setup();for(let n=0;n<3;n++){g.openInventory(p,'temple');p.ui=null;}assert.equal(g.ghosts.length,0);assert.ok(!g.templeTigersSummoned);
 p.inventory=Array.from({length:24},()=>({type:'hat',qty:1}));take(g,p);assert.equal(g.templeChest[0].type,'ritual_dagger');assert.equal(g.ghosts.length,0);
});
test('ordinary, bulk and drag withdrawals summon exactly two guardians once',()=>{
 for(const action of ['use','lootAll','drag']){const {g,p,q}=setup();g.openInventory(p,'temple');if(action==='drag')assert.ok(g.moveInventoryItem(p,{mode:'chest',index:0},{mode:'pack',index:5}));else take(g,p,action);
 assert.equal(g.ghosts.filter(a=>a.ritualTiger).length,2);assert.ok(g.templeTigersSummoned);g.openInventory(q,'temple');g.inventoryAction(q,'lootAll');assert.equal(g.ghosts.length,2);}
});
test('a second player can damage and defeat sanctum guardians with real room attack input',()=>{
 const {g,p,q}=setup();take(g,p);const e=g.ghosts[0];q.equipment.hand1='sword';q.roomX=140;q.roomY=145;q.faceX=0;q.faceY=-1;e.roomX=140;e.roomY=120;e.hp=20;p.roomX=200;
 g.update(.02,{'pad:0':{attack:true}});assert.ok(e.hp<20);assert.equal(e.killedBy,q.id);
 for(let n=0;n<10;n++)g.update(.05,{});q.roomX=e.roomX;q.roomY=e.roomY+15;q.faceY=-1;g.update(.02,{'pad:0':{attack:true}});assert.ok(e.hp<=0);assert.ok(!g.ghosts.includes(e));
});
test('room arrows and magic hit guardians, spend ammunition or mana, and leave friendly pets alone',()=>{
 for(const weapon of ['bow','wand']){const {g,p,q}=setup();take(g,p);p.roomX=260;q.roomX=120;q.roomY=160;q.faceX=1;q.faceY=0;q.equipment.hand1=weapon;q.inventory=[{type:'arrow',qty:5}];const beforeMana=q.mana,e=g.ghosts[0];e.roomX=190;e.roomY=160;e.speed=0;e.cooldown=99;
 const friendly={...e,id:999,wildTiger:false,ritualTiger:false,faction:'ally',owner:q.id,roomX:145,hp:120,life:99};g.ghosts.push(friendly);
 g.update(.02,{'pad:0':{attack:true,block:true,aimX:1,aimY:0}});g.update(.02,{'pad:0':{attack:false}});for(let n=0;n<24;n++)g.update(.02,{});
 assert.ok(e.hp<120,weapon);assert.equal(friendly.hp,120);if(weapon==='bow')assert.equal(q.inventory[0].qty,4);else assert.ok(q.mana<beforeMana);
 }
});
test('saved guardians remain fightable, old premature spawns are repaired, and downstairs ranged targeting includes them',()=>{
 const {g,p}=setup();take(g,p);const r=restoreSession(JSON.parse(JSON.stringify(saveSession(g))));r.update(.02,{});assert.equal(r.ghosts.filter(a=>a.ritualTiger).length,2);
 const ghost=r.ghosts[0];ghost.room=null;assert.ok(playerCombatTargets(r,r.players[0]).includes(ghost));ghost.room='temple-upper';assert.ok(!playerCombatTargets(r,r.players[0]).includes(ghost));
 r.templeChest=[{type:'ritual_dagger',qty:1}];ensureTemple(r);assert.equal(r.ghosts.filter(a=>a.ritualTiger).length,0);assert.equal(r.templeTigersSummoned,false);
});
