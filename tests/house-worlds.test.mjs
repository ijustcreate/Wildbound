import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/core.mjs';
import {travelHouseWorlds,prepareHouseWorldTravel,beginHouseWorldTravel,HOUSE_WORLD_DESTINATIONS,WORLD_TRAVEL_EVENTS} from '../src/house-worlds.mjs';
import {saveSession,restoreSession} from '../src/session.mjs';
import {tickBoardSequence} from '../src/board-sequence.mjs';
import {livingAnimals,updateLivingEcosystem} from '../src/living-ecosystem.mjs';
import {ownedFollowers} from '../src/follower-control.mjs';

const setup=()=>{const g=new Game(()=>.2);g.houseWorldsEnabled=true;g.environment='ice';g.addPlayer('keyboard','One');g.addPlayer('pad:0','Two');g.start();g.openingBoard=false;return g;};
const choose=(g,to)=>{g.houseWorlds.bag=[to];};
const finish=g=>{for(let i=0;i<60&&g.worldTravel;i++)g.update(.05,{});assert.equal(g.worldTravel,null);};

test('Wildbound starts in the house and keeps campaign/player state across frozen map visits',()=>{
 const g=setup(),p=g.players[0],q=g.players[1],house=g.house,terrain=g.terrain,scenery=g.scenery;
 assert.equal(g.generatedEnvironment,'house');assert.equal(g.mapMode,'bounded');
 p.hp=71;p.progress=p.boardProgress=17;p.inventory.push({type:'pumpkin',qty:2});q.room='storage';q.progress=q.boardProgress=9;
 g.round=4;g.turn=1;g.locked=true;g.turnOrder=[p.id,q.id];g.repeatTurnPlayerId=p.id;g.time=135;
 g.house.doors[0].open=true;g.loot.push({id:987,type:'stone',qty:2,x:700,y:700});g.nextId=988;
 updateLivingEcosystem(g,.1);const ambient=livingAnimals(g);
 choose(g,'forest');assert.equal(travelHouseWorlds(g,6),false);assert.equal(travelHouseWorlds(g,5),true);
 assert.equal(g.generatedEnvironment,'forest');assert.equal(g.players[0],p);assert.equal(q.room,null);assert.equal(p.progress,17);assert.equal(q.progress,9);
 assert.deepEqual([g.round,g.turn,g.locked,g.repeatTurnPlayerId],[4,1,true,p.id]);assert.equal(g.houseWorlds.worlds.house.house,house);
 p.hp=42;p.coins=123;p.progress=p.boardProgress=25;g.time=56;const forest=g.scenery;
 g.loot.push({id:g.nextId++,type:'stone',qty:3,x:950,y:950});
 assert.equal(travelHouseWorlds(g,8),true);assert.equal(g.generatedEnvironment,'house');
 assert.equal(g.house,house);assert.equal(g.terrain,terrain);assert.equal(g.scenery,scenery);assert.equal(g.time,135);
 assert.equal(g.house.doors[0].open,true);assert.equal(p.hp,42);assert.equal(p.progress,25);assert.equal(p.coins,123);
 assert.equal(p.inventory.at(-1).type,'pumpkin');assert.ok(g.loot.some(l=>l.id===987));assert.deepEqual(livingAnimals(g),ambient);
 choose(g,'forest');travelHouseWorlds(g,5);assert.equal(g.scenery,forest);assert.equal(g.time,56);assert.equal(p.progress,25);
});

test('all six travel cards are distinct and a full bag visits every environment',()=>{
 const g=setup(),seen=[];
 for(let n=0;n<6;n++){assert.ok(travelHouseWorlds(g,5));seen.push(g.generatedEnvironment);assert.ok(travelHouseWorlds(g,8));}
 assert.deepEqual([...seen].sort(),[...HOUSE_WORLD_DESTINATIONS].sort());
 for(const key of HOUSE_WORLD_DESTINATIONS){assert.match(WORLD_TRAVEL_EVENTS[key].verse,/five or eight/);assert.match(WORLD_TRAVEL_EVENTS[key].tip,/whole party/);}
 assert.equal(new Set(Object.values(WORLD_TRAVEL_EVENTS).map(e=>e.name)).size,7);
});

test('Wildbound map travel carries every living owned follower with its player and back',()=>{
 const g=setup(),p=g.players[0];
 const tamed={id:g.nextId++,kind:'lion',name:'Tamed lion',x:700,y:700,hp:90,maxHp:100,allyOwner:p.id,faction:'ally',speed:90};
 const skeleton={id:g.nextId++,kind:'skeleton',name:'Raised skeleton',x:710,y:700,hp:80,maxHp:100,owner:p.id,pet:true,ghost:true,faction:'ally'};
 const april={id:g.nextId++,kind:'april',name:'April',x:720,y:700,hp:60,maxHp:80,ownerKey:String(p.profileId||p.id),faction:'ally'};
 g.enemies.push(tamed);g.ghosts??=[];g.ghosts.push(skeleton);g.villageFollowers??=[];g.villageFollowers.push(april);
 p.controlledFollowerId=tamed.id;p.controlMainPosition={x:710,y:710};p.x=tamed.x;p.y=tamed.y;tamed.controlledBy=p.id;
 choose(g,'forest');assert.ok(travelHouseWorlds(g,5));
 for(const actor of [tamed,skeleton,april])assert.ok(ownedFollowers(g,p).includes(actor),actor.name+' travels with the party');
 assert.equal(p.controlMainPosition.x,780);assert.equal(p.controlMainPosition.y,837);assert.equal(p.controlledFollowerId,tamed.id);assert.equal(tamed.controlledBy,p.id);
 assert.notEqual(tamed.x,700);assert.equal(g.houseWorlds.worlds.house.enemies.includes(tamed),false);
 assert.ok(travelHouseWorlds(g,8));
 for(const actor of [tamed,skeleton,april])assert.ok(ownedFollowers(g,p).includes(actor),actor.name+' returns with the party');
 assert.equal(g.enemies.filter(actor=>actor.id===tamed.id).length,1);
 assert.equal(g.ghosts.filter(actor=>actor.id===skeleton.id).length,1);
 assert.equal(g.villageFollowers.filter(actor=>actor.id===april.id).length,1);
});

test('travel is the actual five/eight roll event, advances the turn once, freezes both worlds and retains doubles',()=>{
 for(const dice of [[2,3],[4,4]]){
  const g=setup(),p=g.players[0];choose(g,'beach');g.turnOrder=[p.id];
  g.event={name:'Original encounter',kind:'lion'};const original=g.event,time=g.time;
  p.progress=p.boardProgress=10;
  g.roll={dice,total:dice[0]+dice[1],elapsed:0,playerId:p.id,resolved:false,startProgress:10,targetProgress:10+dice[0]+dice[1],landingAt:2};
  tickBoardSequence(g,2.1);assert.equal(g.event.kind,'world_travel');assert.equal(g.event.destination,'beach');assert.equal(p.progress,10+dice[0]+dice[1]);
  tickBoardSequence(g,6);assert.equal(g.worldTravel.stage,'depart');assert.equal(g.generatedEnvironment,'house');assert.equal(g.time,time);
  if(dice[0]===dice[1])assert.equal(g.repeatTurnPlayerId,p.id);
  const progress=p.progress,round=g.round,turn=g.turn;
  finish(g);assert.equal(g.generatedEnvironment,'beach');assert.equal(p.progress,progress);assert.equal(g.turn,turn);assert.equal(g.round,round);
  assert.equal(g.houseWorlds.worlds.house.event,original);assert.equal(g.houseWorlds.worlds.house.time,time);
 }
});

test('saving during departure/arrival and in an away map preserves the trip and house without recursive worlds',()=>{
 for(const stage of ['depart','arrive','away']){
  let g=setup();g.house.doors[0].open=true;g.players[0].progress=g.players[0].boardProgress=23;choose(g,'graveyard');
  prepareHouseWorldTravel(g,5);beginHouseWorldTravel(g,5);
  if(stage!=='depart')for(let i=0;i<29;i++)g.update(.05);
  if(stage==='away')finish(g);
  const saved=JSON.parse(JSON.stringify(saveSession(g)));g=restoreSession(saved);if(g.worldTravel)finish(g);
  assert.equal(g.generatedEnvironment,'graveyard');assert.equal(g.players[0].progress,23);
  assert.ok(travelHouseWorlds(g,8));assert.equal(g.house.doors[0].open,true);assert.equal(g.players[0].progress,23);
  for(const state of Object.values(g.houseWorlds.worlds)){assert.equal(state.houseWorlds,undefined);assert.equal(state.players,undefined);}
 }
});

test('away-map victory returns to preserved house finale, clears hostiles and offers rewards; restart is fresh',()=>{
 const g=setup(),p=g.players[0];g.house.doors[0].open=true;const house=g.house;
 choose(g,'desert');travelHouseWorlds(g,5);p.progress=p.boardProgress=48;p.x=800;p.y=850;
 assert.ok(g.beginSeal(p));g.completeVictory();assert.equal(g.phase,'won');assert.equal(g.generatedEnvironment,'house');
 assert.equal(g.house,house);assert.equal(g.house.doors[0].open,true);assert.equal(p.progress,48);assert.ok(g.victoryChest);
 assert.ok(g.victoryRewards.length);assert.ok(g.enemies.every(e=>['ally','neutral'].includes(e.faction)));
 const restored=restoreSession(JSON.parse(JSON.stringify(saveSession(g))));assert.equal(restored.generatedEnvironment,'house');assert.equal(restored.phase,'won');
 g.newExpedition();assert.equal(g.generatedEnvironment,'house');assert.equal(p.progress,0);assert.deepEqual(g.houseWorlds.worlds,{});
});

test('ordinary expeditions never warp and non-travel rolls keep ordinary encounters',()=>{
 const g=new Game();g.addPlayer('keyboard');g.start();assert.equal(travelHouseWorlds(g,5),false);assert.equal(travelHouseWorlds(g,8),false);
 const wild=setup(),p=wild.players[0];wild.roll={dice:[3,3],total:6,playerId:p.id,resolved:false};wild.resolveRoll();
 assert.notEqual(wild.event?.kind,'world_travel');assert.equal(wild.houseWorlds.pending,undefined);
});
