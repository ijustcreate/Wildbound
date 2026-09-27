import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,EVENTS} from '../src/core.mjs';
import {ensureTemple,TEMPLE_STAIRS,templeRoomStep,tickGhosts,tickGorilla} from '../src/temple.mjs';
import {saveSession,restoreSession} from '../src/session.mjs';
const setup=()=>{const g=new Game(()=>.4);g.environment='temple';const p=g.addPlayer('keyboard');g.start();g.openingBoard=false;ensureTemple(g);return {g,p};};
test('Temple stairs return safely and share one persistent legendary chest',()=>{
 const {g,p}=setup();assert.ok(g.house.temple);assert.ok(g.scenery.filter(s=>s.kind==='tree').length>100);
 Object.assign(p,TEMPLE_STAIRS);const door=g.portals.find(d=>d.temple);assert.equal(g.enterRoom(p,door),true);
 p.roomX=160;p.roomY=100;templeRoomStep(g,p,{interact:true},.05);assert.equal(p.ui.storage,'temple');assert.equal(g.storageFor(p)[0].type,'ritual_dagger');
 g.templeChest[0]=null;g.leaveRoom(p);assert.ok(g.portals.includes(door));assert.equal(p.room,null);assert.equal(g.templeChest[0],null);
 const restored=restoreSession(JSON.parse(JSON.stringify(saveSession(g))));ensureTemple(restored);assert.equal(restored.templeChest[0],null);assert.equal(restored.portals.filter(d=>d.temple).length,1);
});
test('Gorilla and monkeys spawn only in the jungle temple',()=>{
 for(const kind of ['gorilla','monkey']){const index=EVENTS.findIndex(e=>e.kind===kind);const g=new Game();g.addPlayer('keyboard');g.start();g.spawnEvent(index);assert.equal(g.enemies.length,0);}
 const {g}=setup();g.spawnEvent(EVENTS.findIndex(e=>e.kind==='gorilla'));assert.deepEqual(g.enemies.map(e=>e.kind),['gorilla','monkey','monkey','monkey']);assert.ok(g.enemies[0].maxHp>g.enemies[1].maxHp);
});
test('Ritual dagger kills summon a temporary ally that hurts enemies, not players',()=>{
 const {g,p}=setup();p.x=800;p.y=950;p.faceX=1;p.faceY=0;p.equipment.hand1='ritual_dagger';
 g.enemies=[{id:900,kind:'monkey',x:830,y:950,hp:1,damage:10,speed:20,state:'hunt',cooldown:1}];g.attack(p);g.update(.05,{});assert.equal(g.ghosts.length,1);assert.equal(g.ghosts[0].life,30);
 const ghost=g.ghosts[0];g.enemies=[{id:901,kind:'monkey',x:ghost.x+20,y:ghost.y,hp:100}];const hp=p.hp;tickGhosts(g,.05);assert.ok(g.enemies[0].hp<100);assert.equal(p.hp,hp);tickGhosts(g,30);assert.equal(g.ghosts.length,0);
});
test('Melee PvP is opt-in and obeys walls',()=>{
 const {g,p}=setup(),q=g.addPlayer('pad:0');Object.assign(p,{x:800,y:950,faceX:1,faceY:0,attack:0});Object.assign(q,{x:830,y:950,invuln:0});g.attack(p);assert.equal(q.hp,100);g.pvp=true;p.attack=0;g.attack(p);assert.ok(q.hp<100);
 q.hp=100;q.invuln=0;p.attack=0;g.house.walls.push({x:812,y:920,w:8,h:80});g.attack(p);assert.equal(q.hp,100);
});
test('Gorilla telegraphs its slam, attacks nearby players and recovers',()=>{
 const {g,p}=setup();Object.assign(p,{x:800,y:950,invuln:0});const e={kind:'gorilla',x:850,y:950,hp:550,state:'hunt',cooldown:0,speed:60};tickGorilla(g,e,.05);assert.equal(e.state,'windup');tickGorilla(g,e,1);assert.equal(e.state,'recover');assert.ok(p.hp<100);
});
test('Ritual chest transfers the dagger once through normal inventory controls',()=>{
 const {g,p}=setup();Object.assign(p,TEMPLE_STAIRS);g.enterRoom(p,g.portals.find(d=>d.temple));g.openInventory(p,'temple');p.ui.panel='chest';p.ui.index=0;g.inventoryAction(p,'use');assert.ok(p.inventory.some(i=>i?.type==='ritual_dagger'));assert.equal(g.templeChest.filter(i=>i?.type==='ritual_dagger').length,0);
});
test('Player arrows only hit other players with PvP enabled',()=>{
 for(const enabled of [false,true]){const {g,p}=setup(),q=g.addPlayer('pad:1');g.pvp=enabled;Object.assign(p,{x:800,y:950});Object.assign(q,{x:835,y:950,invuln:0});g.arrows=[{id:555,owner:p.id,x:820,y:950,z:18,vz:0,vx:180,vy:0,damage:12}];g.tickAdventure(.05,{});assert.equal(q.hp<100,enabled);}
});
test('Private storage and temple staircase coexist independently',()=>{
 const {g,p}=setup();p.x=800;p.y=960;g.portal(p);const privateDoor=g.portals.find(d=>!d.temple&&d.owner===p.id);assert.ok(privateDoor);Object.assign(p,{x:privateDoor.x,y:privateDoor.y});g.enterRoom(p,privateDoor);g.leaveRoom(p);assert.equal(g.portals.filter(d=>!d.temple).length,0);assert.equal(g.portals.filter(d=>d.temple).length,1);
});
