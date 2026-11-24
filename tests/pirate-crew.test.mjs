import assert from 'node:assert/strict';
import test from 'node:test';
import {Game} from '../src/core.mjs';
import {enterWildLands} from '../src/wild-lands.mjs';
import {PIRATE_CAVE_BERTH,pirateShip,pirateShipPoint,pirateShipPrompt,interactPirateShip,syncPirateShipPlayer,tickPirateShip} from '../src/pirate-ship.mjs';
import {HOOK_LOOT,PARROT_CAGE} from '../src/pirate-crew-data.mjs';
import {pirateCrewActors,pirateCrewSpeech} from '../src/pirate-crew.mjs';
import {pirateShotFloor} from '../src/pirate-combat-floor.mjs';
import {canReachRailwayLoot} from '../src/railway-loot.mjs';
import {npcDialogueAction,npcDialogueView} from '../src/npc-quests.mjs';
import {saveSession,restoreSession} from '../src/session.mjs';
import {switchWildLandsLayer} from '../src/wild-lands-world.mjs';

function setup(cave=false){
 const g=new Game(()=>.01,{deferWorld:true});g.addPlayer('keyboard','Deck tester');g.phase='play';
 assert.ok(enterWildLands(g,{persistent:true}).ok);
 g.enemies=[];g.onSound=()=>{};g.persist=()=>{};g.trainTest.preparing=false;
 if(cave)switchWildLandsLayer(g,PIRATE_CAVE_BERTH.id);
 const p=g.players[0];
 put(g,p,{level:'deck',x:-253,y:-12});
 tickPirateShip(g,0);
 return {g,p};
}

function put(g,p,ride){
 p.pirateRide={shipId:pirateShip(g).id,...ride};
 syncPirateShipPlayer(g,p);
}

function advance(g,duration,fight=false){
 for(let elapsed=0;elapsed<duration;elapsed+=.05){
  g.time+=.05;g.trainTest.time+=.05;
  tickPirateShip(g,.05);
  if(fight)g.tickCombatActors(.05);
 }
}

const find=(g,role)=>pirateCrewActors(g).find(actor=>actor.pirateRole===role);
const checkpoint=g=>restoreSession(JSON.parse(JSON.stringify(saveSession(g))));

function challengeCaptain(g,p){
 assert.equal(pirateShipPrompt(g,p),'TALK TO CAPTAIN HOOK');
 assert.ok(interactPirateShip(g,p));
 assert.match(npcDialogueView(g,p).text,/quarterdeck/);
 assert.ok(npcDialogueAction(g,p,'choice:0'));
 assert.match(npcDialogueView(g,p).text,/Peter Pan/);
 assert.ok(npcDialogueAction(g,p,'choice:1'));
 assert.equal(p.ui,null);
}

test('the outdoor crew keeps moving, can converse on both decks, and the Lazy Pirate stays in the main nest',()=>{
 const {g,p}=setup(),smee=find(g,'smee'),lazy=find(g,'lazy'),levels=new Set(),actorPaths=new Map(),barks=new Set();
 assert.equal(pirateCrewActors(g).length,7);
 for(let i=0;i<1160;i++){
  if(i===475)put(g,p,{level:'hold',x:-191,y:12});
  advance(g,.05);
  levels.add(smee.pirateRide.level);
  for(const actor of pirateCrewActors(g)){
   if(!actorPaths.has(actor))actorPaths.set(actor,new Set());
   actorPaths.get(actor).add(actor.pathIndex);
   assert.equal(g.blocked(actor.x,actor.y,7,false,true,false,0,0,false,actor),false,actor.name+' stands on clear ship floor');
  }
  const speech=pirateCrewSpeech(g);
  if(speech)barks.add(pirateCrewActors(g).find(a=>a.id===speech.actorId).pirateRide.level);
 }
 assert.deepEqual(levels,new Set(['deck','hold']));
 assert.deepEqual(barks,new Set(['deck','hold']));
 assert.ok([...actorPaths].every(([actor,paths])=>actor===lazy?paths.size===1:paths.size>=4));
 assert.deepEqual(lazy.pirateRide,{shipId:'portal-island',level:'nest',nest:'main',x:18,y:-17});
 put(g,p,{...lazy.pirateRide,x:33,y:-9});
 assert.equal(pirateShipPrompt(g,p),'TALK TO LAZY PIRATE');
 assert.ok(interactPirateShip(g,p));
 assert.match(npcDialogueView(g,p).text,/another ship.*cave beneath the mountain/);
});

test('only endorsing Pan provokes Hook, and the crew cannot attack through a ship floor',()=>{
 const {g,p}=setup();
 assert.ok(interactPirateShip(g,p));
 npcDialogueAction(g,p,'choice:0');npcDialogueAction(g,p,'choice:0');
 assert.equal(g.enemies.length,0);
 npcDialogueAction(g,p,'close');challengeCaptain(g,p);
 const hook=find(g,'hook');
 assert.equal(g.enemies.length,6);assert.equal(find(g,'lazy').faction,'neutral');
 const hp=p.hp;
 put(g,p,{level:'hold',x:hook.pirateRide.x,y:hook.pirateRide.y});
 for(const enemy of g.enemies.filter(e=>e!==hook))enemy.hp=0;
 advance(g,1.8,true);
 assert.equal(p.hp,hp);
 assert.equal(hook.pirateWindup,undefined);
 put(g,p,{level:'deck',x:hook.pirateRide.x,y:hook.pirateRide.y+25});
 advance(g,1.5,true);
 assert.ok(p.hp<hp,'Hook winds up and strikes the explorer standing on his deck');
});

test('native melee and spell hit Hook on his deck and rewards stay attached to that deck after reload',()=>{
 const {g,p}=setup();challengeCaptain(g,p);
 const hook=find(g,'hook');
 p.equipment={hand1:'dagger'};
 const face=()=>{const d=Math.hypot(hook.x-p.x,hook.y-p.y)||1;p.faceX=(hook.x-p.x)/d;p.faceY=(hook.y-p.y)/d;};
 put(g,p,{level:'hold',x:hook.pirateRide.x,y:hook.pirateRide.y+23});face();
 g.resolveMelee(p,0,{damage:1,reach:1,arc:120});assert.equal(hook.hp,hook.maxHp);
 put(g,p,{level:'deck',x:hook.pirateRide.x,y:hook.pirateRide.y+23});face();
 assert.equal(g.projectileBlocked(hook.x,hook.y,1),true,'the hull stays solid to an outside shot');
 assert.equal(g.projectileBlocked(hook.x,hook.y,1,false,p),false,'the same deck is attainable to an aboard strike');
 g.resolveMelee(p,0,{damage:1,reach:1,arc:120});assert.ok(hook.hp<hook.maxHp);
 const before=hook.hp;
 const launch=pirateShipPoint(pirateShip(g),hook.pirateRide.x,hook.pirateRide.y+38);
 g.spells.push({...pirateShotFloor(p),x:launch.x,y:launch.y,vx:faceComponent('x'),vy:faceComponent('y'),size:6,remaining:92,life:1,damage:21,owner:p.id});
 function faceComponent(axis){return (hook[axis]-launch[axis])/38*240;}
 for(let i=0;i<12;i++)g.tickProjectiles(.035);
 assert.ok(hook.hp<before,'a real bolt advances and hits on the launching deck');
 hook.hp=0;find(g,'orla').hp=0;g.tickCombatActors(.05);
 assert.deepEqual(g.loot.filter(l=>l.source==='Captain Hook').map(l=>l.type),HOOK_LOOT);
 assert.ok(g.loot.some(l=>l.type===PARROT_CAGE&&l.railwaySurface.level==='hold'));
 assert.ok(g.loot.filter(l=>l.source==='Captain Hook').every(l=>canReachRailwayLoot(p,l)));
 assert.ok(g.loot.filter(l=>l.source==='Captain Hook').every(l=>!canReachRailwayLoot({...p,pirateRide:{...p.pirateRide,level:'hold'}},l)));
 const restored=checkpoint(g);restored.persist=()=>{};
 advance(restored,.2,true);
 assert.equal(restored.loot.filter(l=>l.source==='Captain Hook').length,4);
 assert.ok(find(restored,'hook').hp<=0);
});

test('the separate wreck has only native cutlass skeletons guarding its top deck',()=>{
 const {g,p}=setup(true),wreck=pirateCrewActors(g);
 assert.equal(g.trainTest.pirateCrew,undefined);
 assert.equal(wreck.length,4);
 assert.ok(wreck.every(e=>e.kind==='skeleton_deckhand'&&e.pirateWreckHat&&e.pirateRide.level==='deck'&&e.faction==='enemy'));
 const [skeleton]=wreck;
 put(g,p,{level:'hold',x:skeleton.pirateRide.x,y:skeleton.pirateRide.y+16});
 const hp=p.hp;advance(g,1.5,true);assert.equal(p.hp,hp);
 put(g,p,{level:'deck',x:skeleton.pirateRide.x,y:skeleton.pirateRide.y+24});
 advance(g,1.6,true);assert.ok(p.hp<hp);
 skeleton.hp=0;g.tickCombatActors(.05);
 const restored=checkpoint(g);advance(restored,.2,true);
 assert.ok(pirateCrewActors(restored).find(e=>e.id===skeleton.id).hp<=0);
 assert.equal(restored.trainTest.pirateCrew,undefined);
});
