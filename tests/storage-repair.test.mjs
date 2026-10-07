import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/core.mjs';
import {Profiles} from '../src/profiles.mjs';
import {ROOM_STATIONS} from '../src/shops.mjs';
import {tickStorageRoom} from '../src/storage-room.mjs';
import {robotOnline,tickRobotRepair} from '../src/storage-repair.mjs';
import {saveSession,restoreSession} from '../src/session.mjs';
import {storageLightLevel,drawStorageDust,STORAGE_DUST_LIMIT} from '../src/storage-art.mjs';
const setup=()=>{const g=new Game(()=>.42),p=g.addPlayer('keyboard'),q=g.addPlayer('pad:0');g.phase='play';g.portals=[{id:30,owner:p.id}];Object.assign(p,{room:30,roomX:ROOM_STATIONS.robot.x,roomY:ROOM_STATIONS.robot.y+20});Object.assign(q,{room:30,roomX:p.roomX+5,roomY:p.roomY});return {g,p,q};};
test('First robot meeting explains repair, sales and buyback once per character; actual input dismisses it',()=>{
 const {g,p}=setup();tickStorageRoom(g,p,{interact:true},.05,true);assert.equal(p.ui.shop,'robot-intro');assert.equal(p.robotIntroduced,true);assert.equal(p.robotRepair,undefined);
 g.inventoryAction(p,'robotContinue');assert.equal(p.ui,null);tickStorageRoom(g,p,{interact:true},.05,true);assert.ok(p.robotRepair);assert.equal(p.ui,null);
 const loaded=restoreSession(JSON.parse(JSON.stringify(saveSession(g))));assert.equal(loaded.players[0].robotIntroduced,true);
 const profiles=new Profiles();p.profileId='intro';profiles.data.heroes=[{id:p.profileId}];profiles.save=()=>{};profiles.capture(g);const q={};profiles.assign(q,profiles.data.heroes[0]);assert.equal(q.robotIntroduced,true);
});
test('Repairs stay fixed through new levels, lobby returns, session reload and character reassignment',()=>{
 const {g,p,q}=setup();for(let i=0;i<50;i++)tickRobotRepair(g,p,true,.05);assert.equal(p.robotRepaired,true);assert.equal(q.robotRepaired,false);
 const profiles=new Profiles();p.profileId='fixed';profiles.data.heroes=[{id:p.profileId}];profiles.save=()=>{};profiles.capture(g);
 g.start();assert.equal(p.robotRepaired,true);g.completeVictory();g.newExpedition();assert.equal(p.robotRepaired,true);g.phase='lobby';assert.equal(p.robotRepaired,true);
 const loaded=restoreSession(JSON.parse(JSON.stringify(saveSession(g))));assert.equal(loaded.players[0].robotRepaired,true);
 const hero={};profiles.assign(hero,profiles.data.heroes[0]);assert.equal(hero.robotRepaired,true);assert.equal(hero.robotIntroduced,true);
 const legacy={...profiles.data.heroes[0]};delete legacy.robotIntroduced;profiles.assign(hero,legacy);assert.equal(hero.robotIntroduced,true);assert.equal(hero.robotRepaired,true);
});
test('Robot starts broken, cannot trade, repairs once on a held interaction, and stays repaired',()=>{
 const {g,p}=setup();assert.equal(robotOnline(p),false);g.openShop(p,'robot');assert.notEqual(p.ui?.shop,'robot');p.ui=null;
 for(let i=0;i<20;i++)tickStorageRoom(g,p,{interact:true},.05,false);assert.equal(robotOnline(p),false);assert.ok(p.robotRepair.progress>.9);
 tickStorageRoom(g,p,{},.05,false);assert.equal(p.robotRepair,undefined);
 let saves=0;g.persist=()=>saves++;for(let i=0;i<50;i++)tickStorageRoom(g,p,{interact:true},.05,false);assert.equal(robotOnline(p),true);assert.equal(saves,1);
 tickStorageRoom(g,p,{interact:true},.05,true);assert.equal(p.ui.shop,'robot');
 const profiles=new Profiles();p.profileId='repair-test';profiles.data.heroes=[{id:p.profileId}];profiles.save=()=>{};profiles.capture(g);assert.equal(profiles.data.heroes[0].robotRepaired,true);p.robotRepaired=false;profiles.assign(p,profiles.data.heroes[0]);assert.equal(p.robotRepaired,true);
});
test('Guests repair the storage owner only, and moving away/death/UI cancels progress',()=>{
 const {g,p,q}=setup();for(let i=0;i<50;i++)tickRobotRepair(g,q,true,.05);assert.equal(robotOnline(p),true);assert.equal(robotOnline(q),false);
 p.robotRepaired=false;tickRobotRepair(g,q,true,.05);q.roomX=20;tickRobotRepair(g,q,true,.05);assert.equal(q.robotRepair,undefined);
 q.roomX=ROOM_STATIONS.robot.x;tickRobotRepair(g,q,true,.05);q.hp=0;tickRobotRepair(g,q,true,.05);assert.equal(q.robotRepair,undefined);
 q.hp=100;tickRobotRepair(g,q,true,.05);q.ui={mode:'inventory'};tickRobotRepair(g,q,true,.05);assert.equal(q.robotRepair,undefined);
});
test('Room flicker is local and bounded, dust stays capped and deterministic',()=>{
 const levels=Array.from({length:200},(_,i)=>storageLightLevel(i*.05,2));assert.ok(Math.min(...levels)>.4);assert.ok(Math.max(...levels)<1.01);assert.ok(new Set(levels).size>10);
 const draw=time=>{const points=[],c={globalAlpha:1,save(){},restore(){},fillRect(...v){assert.ok(v.every(Number.isFinite));points.push(v);}};assert.equal(drawStorageDust(c,time,1),32);assert.equal(points.length,STORAGE_DUST_LIMIT);return points;};assert.deepEqual(draw(3),draw(3));assert.notDeepEqual(draw(3),draw(4));
});
