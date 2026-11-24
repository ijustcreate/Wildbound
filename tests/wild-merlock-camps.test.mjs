import assert from 'node:assert/strict';
import test from 'node:test';
import {Game} from '../src/core.mjs';
import {enterWildLands} from '../src/wild-lands.mjs';
import {MERLOCK_CAMPS,MERLOCK_CAMP_AGGRO,merlockCampGround} from '../src/wild-merlock-camps.mjs';
import {tickWildBiomeSpawns,wildBiomeTargets,tickWildBiomeLeash} from '../src/wild-biome-spawns.mjs';
import {nearestTrainTrack} from '../src/train-track.mjs';
import {restoreSession,saveSession} from '../src/session.mjs';

test('beach camps use dry land and the shared spawn, leash, and checkpoint system',()=>{
 const g=new Game(()=>.5,{deferWorld:true}),p=g.addPlayer('keyboard','Beach explorer');
 g.phase='play';g.persist=()=>{};
 assert.ok(enterWildLands(g,{persistent:true}).ok);
 const t=g.trainTest,camp=MERLOCK_CAMPS.find(entry=>entry.key.endsWith('emberbank'));
 t.preparing=false;
 assert.ok(MERLOCK_CAMPS.every(entry=>entry.members.length>=2&&entry.members.length<=5&&
  merlockCampGround(t.design,entry)&&nearestTrainTrack(t.route,entry.x,entry.y).distance>=200));
 Object.assign(p,{x:camp.x,y:camp.y-280});
 for(let i=0;i<5;i++){t.time+=.36;tickWildBiomeSpawns(g);}
 const live=g.enemies.filter(e=>e.wildSpawnKey&&e.hp>0),patrol=live.filter(e=>e.merlockCamp===camp.key);
 assert.equal(patrol.length,5);
 assert.ok(live.length<=24);
 assert.ok(live.filter(e=>Math.hypot(e.x-camp.x,e.y-camp.y)<940).length<=12);
 assert.deepEqual(new Set(patrol.map(e=>e.shoreRole)),new Set(['melee','spear','healer']));
 assert.ok(patrol.every(e=>e.group===camp.key&&e.kind==='shore_goblin'&&e.name==='Merlock'));
 const enemy=patrol[0];
 const near={...p,x:camp.x,y:camp.y-58},far={...p,x:camp.x,y:camp.y-MERLOCK_CAMP_AGGRO-35};
 assert.deepEqual(wildBiomeTargets(g,enemy,[near,far,{...near,swimming:true}]),[near]);
 Object.assign(enemy,{x:camp.x,y:camp.y+MERLOCK_CAMP_AGGRO+25});
 assert.ok(tickWildBiomeLeash(g,enemy,.05,[near]));
 assert.equal(enemy.returningToWildSpawn,true);
 const restored=restoreSession(JSON.parse(JSON.stringify(saveSession(g))));
 assert.equal(restored.enemies.filter(e=>e.merlockCamp===camp.key&&e.hp>0).length,5);
});
