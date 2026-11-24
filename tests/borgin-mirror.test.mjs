import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/core.mjs';
import {BORGIN_MIRROR_STORE,switchAlleyLayer} from '../src/diagon-alley.mjs';
import {borginMirrorPoint,borginMirrorView,tickBorginMirror} from '../src/borgin-mirror.mjs';
import {enterWildLands} from '../src/wild-lands.mjs';
import {restoreSession,saveSession} from '../src/session.mjs';
import {STOLEN_HEART,stolenHeartName} from '../src/stolen-heart.mjs';
import {GARDEN_POOL} from '../src/diagon-garden-layout.mjs';
import {inGardenPond} from '../src/diagon-garden-ward.mjs';
import {RETURNED_HEART_GLOW_SECONDS} from '../src/returned-heart-glow.mjs';

const store=BORGIN_MIRROR_STORE,mirror=borginMirrorPoint(store);

function open(){
 const g=new Game(()=>.4,{deferWorld:true}),p=g.addPlayer('keyboard','Rowan Tide');
 g.phase='play';g.persist=()=>{};
 p.profileId='rowan-qa';
 assert.ok(enterWildLands(g,{persistent:true}).ok);
 g.trainTest.preparing=false;
 switchAlleyLayer(g,'diagon');
 Object.assign(p,{x:mirror.x,y:mirror.y+49,faceX:0,faceY:-1,moving:false});
 return {g,p};
}

function gaze(g,seconds){
 for(let i=0;i<Math.round(seconds/.05);i++)tickBorginMirror(g,store,.05);
}

function jumpIntoPool(g,hero,device){
 Object.assign(hero,{x:GARDEN_POOL.x,y:GARDEN_POOL.y+68,swimming:false,jumpHeight:0,landTime:0,faceY:-1});
 for(let i=0;i<12;i++)g.update(.05,{[device]:{jump:i<5,y:i<7?-1:0}});
 for(let i=0;i<25&&hero.inventory.some(item=>item?.type===STOLEN_HEART);i++)g.update(.05,{});
 assert.ok(inGardenPond(hero),'a normal jump reaches the pool');
}

test('the mirror requires thirty uninterrupted seconds facing it and the creature persists through its emergence',()=>{
 const {g,p}=open();
 assert.ok(borginMirrorView(g,store).skeletal&&borginMirrorView(g,store).heart);
 gaze(g,25);
 p.faceY=1;
 gaze(g,9);
 assert.equal(borginMirrorView(g,store).progress,0);
 p.faceY=-1;
 gaze(g,29.95);
 assert.equal(g.trainTest.borginMirrorFight,undefined);
 gaze(g,.05);
 assert.equal(g.trainTest.borginMirrorFight.phase,'emerging');
 assert.equal(borginMirrorView(g,store).emergence,0);
 gaze(g,.4);
 const restored=restoreSession(JSON.parse(JSON.stringify(saveSession(g))));
 assert.ok(borginMirrorView(restored,store).emergence>0);
 gaze(restored,.55);
 const enemies=restored.enemies.filter(e=>e.borginReflection);
 assert.equal(enemies.length,1);
 assert.equal(enemies[0].name,'Rowan Tide’s Reflection');
 assert.ok(enemies[0].mirrorHeartVisible);
 const hero=restored.players[0],hp=hero.hp;
 restored.combatHitstop=0;
 for(let i=0;i<36;i++)restored.tickCombatActors(.05);
 assert.ok(hero.hp<hp,'the materialized reflection lands a native attack');
});

test('the first defeat restores a normal reflection and drops the owner’s heart, later fights are heartless',()=>{
 const {g,p}=open();
 gaze(g,31);
 const first=g.enemies.find(e=>e.borginReflection);
 assert.ok(first&&first.hp>0);
 first.hp=0;g.tickCombatActors(.05);
 const drops=g.loot.filter(item=>item.type===STOLEN_HEART);
 assert.equal(drops.length,1);
 assert.equal(stolenHeartName(drops[0]),'Rowan Tide’s Stolen Heart');
 assert.equal(drops[0].stolenHeart.ownerKey,'profile:rowan-qa');
 assert.equal(borginMirrorView(g,store).skeletal,false);
 gaze(g,31);
 assert.equal(g.trainTest.borginMirrorFight,undefined,'continuing to stand in the same spot preserves the clear reflection');
 p.y=mirror.y+106;gaze(g,.05);
 p.y=mirror.y+49;gaze(g,2);
 const returned=borginMirrorView(g,store);
 assert.ok(returned.skeletal);
 assert.equal(returned.heart,false);
 gaze(g,29);
 const second=g.enemies.find(e=>e.borginReflection&&e.hp>0);
 assert.ok(second);
 assert.equal(second.mirrorHeartVisible,false);
 second.hp=0;g.tickCombatActors(.05);
 assert.equal(g.loot.filter(item=>item.type===STOLEN_HEART).length,1);
 assert.equal(borginMirrorView(g,store).skeletal,false);
});

test('another player can pick up a heart and return it with a real jump into the garden pond',()=>{
 const {g,p}=open();
 const helper=g.addPlayer('pad:1','Ellis Green');
 helper.profileId='ellis-qa';
 const step=(input={})=>g.update(.05,{'pad:1':input});
 gaze(g,31);
 const first=g.enemies.find(e=>e.borginReflection);
 first.hp=0;g.tickCombatActors(.05);
 const heart=g.loot.find(item=>item.type===STOLEN_HEART);
 Object.assign(helper,{x:heart.x,y:heart.y+7});
 assert.ok(g.collect(helper,heart),'a second player may collect the owner’s heart');
 assert.equal(helper.inventory.find(item=>item?.type===STOLEN_HEART).stolenHeart.ownerKey,'profile:rowan-qa');
 Object.assign(helper,{x:GARDEN_POOL.x,y:GARDEN_POOL.y});
 step();
 assert.ok(inGardenPond(helper));
 assert.ok(helper.inventory.some(item=>item?.type===STOLEN_HEART),'just swimming in the pool cannot return it');
 jumpIntoPool(g,helper,'pad:1');
 assert.ok(!helper.inventory.some(item=>item?.type===STOLEN_HEART));
 assert.ok(p.field.returnedHeartGlow>RETURNED_HEART_GLOW_SECONDS-2);
 assert.equal(helper.field?.returnedHeartGlow,undefined);
 assert.equal(p.npcQuests.borginMirror.heartIssued,undefined);
 assert.ok(borginMirrorView(g,store).heart);
 gaze(g,31);
 const again=g.enemies.find(e=>e.borginReflection&&e.hp>0);
 assert.ok(again.mirrorHeartVisible);
 again.hp=0;g.tickCombatActors(.05);
 assert.equal(g.loot.filter(item=>item.type===STOLEN_HEART).length,1,'a returned heart allows one new heart drop');
});

test('the owner can jump into the pond with their own heart and restore it',()=>{
 const {g,p}=open();
 gaze(g,31);
 g.enemies.find(e=>e.borginReflection).hp=0;
 g.tickCombatActors(.05);
 const heart=g.loot.find(item=>item.type===STOLEN_HEART);
 Object.assign(p,{x:heart.x,y:heart.y+7});
 assert.ok(g.collect(p,heart));
 jumpIntoPool(g,p,'keyboard');
 assert.ok(!p.inventory.some(item=>item?.type===STOLEN_HEART));
 assert.ok(p.field.returnedHeartGlow>RETURNED_HEART_GLOW_SECONDS-2);
 assert.equal(g.trainTest.borginMirrorClaims['profile:rowan-qa'],undefined);
 Object.assign(p,{x:mirror.x,y:mirror.y+49,swimming:false,faceX:0,faceY:-1});
 assert.ok(borginMirrorView(g,store).heart);
});

test('the same expedition remembers a return made while the owner is away',()=>{
 const {g,p}=open();
 const helper=g.addPlayer('pad:1','Ellis Green');
 gaze(g,31);
 g.enemies.find(e=>e.borginReflection).hp=0;
 g.tickCombatActors(.05);
 const heart=g.loot.find(item=>item.type===STOLEN_HEART);
 Object.assign(helper,{x:heart.x,y:heart.y+7});
 assert.ok(g.collect(helper,heart));
 p.disconnected=true;
 jumpIntoPool(g,helper,'pad:1');
 assert.equal(g.trainTest.borginMirrorReturns['profile:rowan-qa'],true);
 const restored=restoreSession(JSON.parse(JSON.stringify(saveSession(g))));
 const owner=restored.players.find(hero=>hero.profileId===p.profileId);
 owner.disconnected=false;
 restored.update(.05,{});
 assert.equal(restored.trainTest.borginMirrorReturns['profile:rowan-qa'],undefined);
 assert.ok(owner.field.returnedHeartGlow>RETURNED_HEART_GLOW_SECONDS-2);
 assert.equal(owner.npcQuests.borginMirror.heartIssued,undefined);
});
