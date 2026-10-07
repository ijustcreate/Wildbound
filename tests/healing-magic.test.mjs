import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/core.mjs';
import {ITEMS, give, equip, rollGear, itemStats} from '../src/items.mjs';
import {saveSession, restoreSession} from '../src/session.mjs';
import {Profiles} from '../src/profiles.mjs';
import {snapshot, cleanInput, Rooms} from '../src/rooms.mjs';
import {canSpellHeal, applySpellHealing, hitHealingBolt, tickSpellHealing,
  spellHealingTargets, spellHealingPoint, createRoomHealingBolt, healingAdventureMethods,
  HEALING_COLOR} from '../src/healing-magic.mjs';
import {drawMagicBolt} from '../src/magic-bolt-render.mjs';
import {drawMagicBurst, finishMagicBolt} from '../src/magic-bolt-effects.mjs';
import {paintItem} from '../src/item-art.mjs';
import {directionalHelmet} from '../src/wearable-art.mjs';
import {generateWellTunnels, tickOldWells} from '../src/old-well.mjs';

function setup() {
  const g=new Game(()=>.2), p=g.addPlayer('keyboard'), q=g.addPlayer('net:healer');
  Object.assign(g,{phase:'play',openingBoard:false,generatedEnvironment:'forest',scenery:[],
    house:null,forestLandscape:null,enemies:[],ghosts:[],portals:[],pickups:[],loot:[]});
  g.terrain.fill('grass');
  Object.assign(p,{x:400,y:400,faceX:1,faceY:0,hp:100,mana:100});
  Object.assign(q,{x:470,y:400,hp:20,mana:100});
  p.equipment.hand1='healing_wand';
  return {g,p,q};
}
const bolt=(p,hot=false)=>({owner:p.id,healingAmount:24,healingHot:hot,healingHotAmount:4});
function alignTarget(g,p,q,charge=0,slot='hand1') {
  assert.equal(g.fireSpell(p,charge,slot),true);
  const b=g.spells.at(-1);q.x=b.x+b.vx*.24;q.y=b.y+b.vy*.24;
  return b;
}
function pixelCanvas() {
  const calls=[];
  return {calls,globalAlpha:1,save(){},restore(){},fillRect(x,y,w,h){
    assert.ok([x,y,w,h].every(Number.isInteger));calls.push({x,y,w,h,color:this.fillStyle});
  },ellipse(){throw Error('Smooth orb');},createRadialGradient(){throw Error('Blur');}};
}

test('healing gear equips in either hand/head and participates in normal loot without GM restrictions',()=>{
  const {p}=setup();p.equipment.hand1=null;
  for(const [id,slot]of [['healing_wand','hand2'],['halo','head']]) {
    give(p.inventory,id);assert.equal(equip(p,p.inventory.findIndex(i=>i?.type===id),slot),true);
    assert.equal(p.equipment[slot],id);
    const pool=Object.keys(ITEMS).filter(t=>ITEMS[t].slot&&!ITEMS[t].supplyOnly&&!ITEMS[t].npcOnly&&!ITEMS[t].bossOnly&&ITEMS[t].rarity===ITEMS[id].rarity);
    assert.equal(rollGear(()=>((pool.indexOf(id)+.5)/pool.length),ITEMS[id].rarity),id);
    assert.equal(ITEMS[id].gmOnly,undefined);
  }
  assert.match(itemStats('healing_wand'),/Spell healing 24–36/);
  assert.match(itemStats('halo'),/Outgoing spell healing \+25%/);
});

test('normal wand-style light blue bolt costs mana, heals once, and reports effective healing',()=>{
  const {g,p,q}=setup(),b=alignTarget(g,p,q);
  assert.equal(b.color,HEALING_COLOR);assert.equal(b.damage,0);assert.equal(p.mana,88);
  g.tickAdventure(.4,{});
  assert.equal(q.hp,44);assert.equal(g.spells.length,0);
  assert.equal(g.effects.filter(e=>e.spellHealing).length,1);
  assert.equal(g.effects.find(e=>e.spellHealing).text,'+24');
  assert.equal(g.effects.find(e=>e.healingRise).color,HEALING_COLOR);
});

test('charge increases healing to 36 without offensive gear/combo bonuses',()=>{
  const {g,p,q}=setup();p.inventory.push({type:'miners_keepsake',qty:1});
  const b=alignTarget(g,p,q,1.2);
  assert.equal(b.healingAmount,36);assert.equal(b.damage,0);assert.equal(b.size,14);
  g.tickAdventure(.4,{});assert.equal(q.hp,56);
});

test('halo boosts outgoing and incoming healing multiplicatively with exact fractional numbers',()=>{
  const {g,p,q}=setup();p.equipment.head=q.equipment.head='halo';
  const b=alignTarget(g,p,q,1.2);assert.equal(b.healingAmount,45);
  g.tickAdventure(.4,{});assert.equal(q.hp,76.25);
  assert.equal(g.effects.find(e=>e.spellHealing).amount,56.25);
  assert.equal(q.healingOverTime[0].amount,5);
  tickSpellHealing(g,1);assert.equal(q.hp,82.5);
});

test('overheal never creates numbers/particles, reduces health, or blocks new HoT stacks',()=>{
  const {g,p,q}=setup();q.hp=97;
  assert.equal(applySpellHealing(g,p,q,24),3);
  assert.equal(g.effects.find(e=>e.spellHealing).text,'+3');
  const n=g.effects.length;
  assert.equal(hitHealingBolt(g,bolt(p,true),q),true);
  assert.equal(q.hp,100);assert.equal(g.effects.length,n);assert.equal(q.healingOverTime.length,1);
  q.hp=120;assert.equal(applySpellHealing(g,p,q,24),0);assert.equal(q.hp,120);
});

test('independent three-tick stacks cannot be delayed indefinitely by repeated hits',()=>{
  const {g,p,q}=setup();q.hp=1;
  hitHealingBolt(g,bolt(p,true),q);tickSpellHealing(g,.4);
  hitHealingBolt(g,bolt(p,true),q);tickSpellHealing(g,.4);
  hitHealingBolt(g,bolt(p,true),q);
  const timers=q.healingOverTime.map(s=>s.nextTick);
  hitHealingBolt(g,bolt(p,true),q);
  assert.equal(q.healingOverTime.length,3);assert.deepEqual(q.healingOverTime.map(s=>s.nextTick),timers);
  q.hp=1;g.effects=[];
  tickSpellHealing(g,.2);assert.equal(q.hp,5);assert.equal(q.healingOverTime[0].ticksLeft,2);
  tickSpellHealing(g,2.8);
  assert.equal(q.hp,37);assert.equal(q.healingOverTime,undefined);
  assert.equal(g.effects.filter(e=>e.spellHealing).length,9);
});

test('without a halo no HoT; full health hits consume the projectile with no overheal number',()=>{
  const {g,p,q}=setup();q.hp=q.maxHp;
  alignTarget(g,p,q);g.tickAdventure(.4,{});
  assert.equal(g.spells.length,0);assert.equal(q.healingOverTime,undefined);
  assert.equal(g.effects.some(e=>e.spellHealing||e.healingRise),false);
});

test('mana exhaustion, discounts, regeneration, offhand casts and no consumable ammo',()=>{
  const {g,p,q}=setup();p.equipment.hand1=null;p.equipment.hand2='healing_wand';
  const before=JSON.stringify(p.inventory);p.mana=11;
  assert.equal(g.fireSpell(p,0,'hand2'),false);assert.equal(p.mana,11);assert.equal(g.spells.length,0);
  g.tickAdventure(1,{});assert.ok(p.mana>11);
  alignTarget(g,p,q,0,'hand2');assert.equal(JSON.stringify(p.inventory),before);
  const original=ITEMS.halo.manaDiscount;
  try {ITEMS.halo.manaDiscount=.25;p.equipment.head='halo';p.mana=9;
    assert.equal(g.fireSpell(p,0,'hand2'),true);assert.equal(p.mana,0);
  } finally {if(original===undefined)delete ITEMS.halo.manaDiscount;else ITEMS.halo.manaDiscount=original;}
});

test('offensive bolt loop cannot damage or heal hostiles, even in PvP',()=>{
  for(const pvp of [false,true]) {
    const {g,p,q}=setup();g.pvp=pvp;const b=alignTarget(g,p,q);
    const enemy={id:999,kind:'lion',hp:40,maxHp:100,x:b.x+b.vx*.1,y:b.y+b.vy*.1};
    g.enemies=[enemy];g.tickAdventure(.4,{});
    assert.equal(enemy.hp,40);assert.equal(enemy.aggro,undefined);assert.equal(enemy.killedBy,undefined);
    assert.equal(q.hp,pvp?20:44);
    assert.equal(hitHealingBolt(g,bolt(p,true),enemy),false);
  }
});

test('heals friendly followers, hunter/ritual pets and summoned companions; excludes wild ghosts',()=>{
  const {g,p}=setup();
  const ally={id:90,kind:'lion',faction:'ally',allyOwner:p.id,hp:10,maxHp:100};
  const explorer={id:91,kind:'explorer_sword',faction:'ally',hp:10,maxHp:100};
  const hunter={id:92,kind:'wolf',hunterPet:true,hp:10,maxHp:100};
  const ritual={id:93,kind:'tiger',ritualPet:true,faction:'ally',hp:10,maxHp:100};
  const skeleton={id:94,kind:'skeleton',pet:true,ghost:true,owner:p.id,faction:'ally',hp:10,maxHp:120};
  const spirit={id:95,kind:'tiger',ghost:true,owner:p.id,hp:10,maxHp:120};
  const wild={id:96,kind:'tiger',wildTiger:true,faction:'hostile',owner:p.id,hp:10,maxHp:120};
  g.enemies=[ally,explorer];p.hunterPet=hunter;p.ritualPet=ritual;g.ghosts=[skeleton,spirit,wild];
  for(const target of [ally,explorer,hunter,ritual,skeleton,spirit]) {
    assert.equal(applySpellHealing(g,p,target,24),24);assert.equal(target.hp,34);
  }
  assert.equal(applySpellHealing(g,p,wild,24),0);
  assert.equal(spellHealingTargets(g,p).includes(wild),false);
});

test('real swept projectile hits each friendly companion type and stops at walls',()=>{
  for(const kind of ['follower','hunter','ritual','skeleton']) {
    const {g,p,q}=setup();q.room='storage';
    const pet={id:800,kind:'wolf',faction:'ally',owner:p.id,hp:5,maxHp:100};
    if(kind==='follower')g.enemies=[pet];
    if(kind==='hunter')p.hunterPet=pet;
    if(kind==='ritual')p.ritualPet=pet;
    if(kind==='skeleton')g.ghosts=[{...pet,kind:'skeleton',pet:true,ghost:true}];
    const target=kind==='skeleton'?g.ghosts[0]:pet;
    alignTarget(g,p,target);g.tickAdventure(.8,{});assert.equal(target.hp,29,kind);
  }
  const {g,p,q}=setup(),b=alignTarget(g,p,q),wallX=b.x+20;g.projectileBlocked=x=>x>wallX;
  g.tickAdventure(.4,{});assert.equal(q.hp,20);assert.equal(g.spells.length,0);
});

test('PvP heals own pets only and clears pending ticks when allegiance changes',()=>{
  const {g,p,q}=setup(),own={id:80,hp:10,maxHp:100,faction:'ally',owner:p.id},other={id:81,hp:10,maxHp:100,faction:'ally',owner:q.id};
  p.hunterPet=own;q.hunterPet=other;g.pvp=true;
  assert.equal(canSpellHeal(g,p,q),false);assert.equal(canSpellHeal(g,p,other),false);
  assert.equal(applySpellHealing(g,p,own,24),24);
  g.pvp=false;hitHealingBolt(g,bolt(p,true),q);g.pvp=true;tickSpellHealing(g,1);
  assert.equal(q.hp,44);assert.equal(q.healingOverTime,undefined);
});

test('dead/downed actors, defeated followers, charmed heroes and detached pets never revive/heal',()=>{
  const {g,p,q}=setup();q.hp=0;
  assert.equal(hitHealingBolt(g,bolt(p,true),q),false);assert.equal(q.hp,0);
  q.hp=20;q.succubusCharm={remaining:2};assert.equal(canSpellHeal(g,p,q),false);
  delete q.succubusCharm;p.succubusCharm={remaining:2};assert.equal(g.fireSpell(p),false);
  delete p.succubusCharm;
  const pet={id:901,kind:'wolf',faction:'ally',owner:p.id,hp:20,maxHp:100,downedRemaining:60};
  p.hunterPet=pet;hitHealingBolt(g,bolt(p,true),pet);pet.hp=0;tickSpellHealing(g,1);
  assert.equal(pet.hp,0);assert.equal(pet.healingOverTime,undefined);assert.equal(pet.downedRemaining,60);
  p.hunterPet=null;pet.hp=20;assert.equal(canSpellHeal(g,p,pet),false);
  g.enemies=[pet];pet.defeated=true;assert.equal(canSpellHeal(g,p,pet),false);
  q.room='storage';assert.equal(canSpellHeal(g,p,q),false);
  p.hp=0;assert.equal(g.fireSpell(p),false);
});

test('removed caster, hostile conversion and malformed saved stacks terminate safely',()=>{
  const {g,p,q}=setup();hitHealingBolt(g,bolt(p,true),q);g.players=g.players.filter(a=>a!==p);
  tickSpellHealing(g,1);assert.equal(q.hp,44);assert.equal(q.healingOverTime,undefined);
  g.players.push(p);const e={id:80,faction:'ally',owner:p.id,hp:10,maxHp:100};g.enemies=[e];
  hitHealingBolt(g,bolt(p,true),e);e.faction='hostile';tickSpellHealing(g,1);
  assert.equal(e.hp,34);assert.equal(e.healingOverTime,undefined);
  q.healingOverTime=[{owner:p.id,amount:4,nextTick:NaN,ticksLeft:3},
    {owner:p.id,amount:Infinity,nextTick:1,ticksLeft:3}];
  tickSpellHealing(g,100);assert.equal(q.hp,44);assert.equal(q.healingOverTime,undefined);
});

test('session JSON preserves equipped gear, sockets, in-flight bolts and partially elapsed stacks',()=>{
  const {g,p,q}=setup();p.equipment.head='halo';p.equipmentSockets={hand1:['azure_bead'],head:['mana_rune']};
  const pet={id:90,kind:'wolf',hunterPet:true,faction:'ally',owner:p.id,hp:30,maxHp:100};p.hunterPet=pet;
  hitHealingBolt(g,bolt(p,true),q);hitHealingBolt(g,bolt(p,true),pet);tickSpellHealing(g,.6);
  alignTarget(g,p,q);
  const loaded=restoreSession(JSON.parse(JSON.stringify(saveSession(g))));
  const [lp,lq]=loaded.players;assert.equal(lp.equipment.head,'halo');assert.equal(lp.equipment.hand1,'healing_wand');
  assert.deepEqual(lp.equipmentSockets,p.equipmentSockets);
  assert.equal(loaded.spells[0].healing,true);assert.equal(lq.healingOverTime[0].nextTick,.4);
  tickSpellHealing(loaded,.4);assert.equal(lq.hp,48);assert.equal(lp.hunterPet.hp,58);
  loaded.tickAdventure(.4,{});assert.equal(lq.hp,78);
});

test('profile capture retains new item IDs and sockets without touching persistent saves',()=>{
  const {g,p}=setup();p.equipment.head='halo';p.equipmentSockets={head:['azure_bead']};
  const profiles=new Profiles();profiles.save=()=>{};profiles.data.heroes=[{id:p.profileId}];
  profiles.capture(g);const restored={};profiles.assign(restored,profiles.data.heroes[0]);
  assert.equal(restored.equipment.hand1,'healing_wand');assert.equal(restored.equipment.head,'halo');
  assert.deepEqual(restored.equipmentSockets.head,['azure_bead']);
});

test('host routes network inputs to their owner; transmitted snapshots include healing and effects',()=>{
  const {g,p,q}=setup();p.equipment.hand1=null;q.equipment.hand1='healing_wand';q.equipment.head='halo';
  Object.assign(q,{x:400,y:400,faceX:1,faceY:0});Object.assign(p,{x:470,y:400,hp:30});
  const room=Object.create(Rooms.prototype);Object.assign(room,{role:'host',age:0,inputs:{},send(data){this.sent=data;}});
  room.inputs[q.device]=cleanInput({attack:true,aimX:1,aimY:0});
  g.tickAdventure(.05,room.tick(g,.05,{keyboard:{}}));
  assert.equal(g.spells.length,0);
  room.inputs[q.device]=cleanInput({attack:false,aimX:1,aimY:0});
  g.tickAdventure(.05,room.tick(g,.05,{keyboard:{}}));
  assert.equal(g.spells[0].owner,q.id);assert.equal(p.mana,100);assert.ok(q.mana<100);
  const b=g.spells[0],healing=Math.round(b.healingAmount*100)/100;p.x=b.x+b.vx*.2;p.y=b.y+b.vy*.2;g.tickAdventure(.3,{});
  assert.equal(p.hp,Math.round((30+healing)*100)/100);assert.equal(p.healingOverTime[0].owner,q.id);
  room.tick(g,.2,{});const sent=JSON.parse(JSON.stringify(room.sent));
  assert.equal(sent.state.players[0].healingOverTime[0].owner,q.id);
  assert.equal(sent.state.effects.find(e=>e.spellHealing).amount,healing);
  assert.deepEqual(snapshot(g).spells,g.spells);
});

test('a save triggered inside the ordinary adventure step retains isolated in-flight healing',()=>{
  const {g,p,q}=setup();alignTarget(g,p,q);let saved;
  const methods=healingAdventureMethods({tickAdventure(){saved=JSON.parse(JSON.stringify(saveSession(this)));}});
  methods.tickAdventure.call(g,0,{});
  assert.equal(saved.state.spells.length,0);assert.equal(saved.state.healingBoltsInStep.length,1);
  assert.equal(g.healingBoltsInStep,undefined);assert.equal(g.spells.length,1);
  const loaded=restoreSession(saved);loaded.tickAdventure(.4,{});
  assert.equal(loaded.players[1].hp,44);assert.equal(loaded.healingBoltsInStep,undefined);
});

test('halo also boosts existing lunar self-cast healing and shows its effective amount',()=>{
  const {g,p}=setup();p.hp=20;
  Object.assign(p.equipment,{head:'halo',hand1:'moon_blade',hand2:'moon_shield',
    shoulders:'moon_shoulders',feet:'moon_steps'});
  // Moon circlet is the remaining group; an unrecognized extra slot here is a
  // fixture to check simultaneous full-set and halo stats through stat().
  p.equipment.testCirclet='moon_circlet';
  p.equipment.hand1='moon_bow'; // Still completes the weapon group.
  p.equipment.testWand='wand';
  assert.equal(g.fireSpell(p,0,'testWand'),true);
  assert.equal(p.hp,24.69);assert.equal(g.effects.find(e=>e.spellHealing).amount,4.69);
});

test('native pixel healing darts, rising target particles, honeycomb cells and floating halo',()=>{
  const c=pixelCanvas();drawMagicBolt(c,{x:100,y:60,vx:260,vy:0,age:.5,color:HEALING_COLOR,healing:true});
  assert.ok(c.calls.some(p=>p.color===HEALING_COLOR));assert.ok(c.calls.every(p=>p.w===p.h&&p.w<=3));
  const early=pixelCanvas(),late=pixelCanvas();
  drawMagicBurst(early,{healingRise:true,x:80,y:90,color:HEALING_COLOR,life:.8,duration:1});
  drawMagicBurst(late,{healingRise:true,x:80,y:90,color:HEALING_COLOR,life:.2,duration:1});
  assert.equal(early.calls.length,14);assert.ok(late.calls.every((p,i)=>p.y<early.calls[i].y));
  const honey=pixelCanvas();paintItem(honey,'honeycomb');
  assert.ok(honey.calls.some(p=>p.color==='#f9e6ac'));assert.ok(honey.calls.some(p=>p.y===19));
  assert.equal(honey.calls.filter(p=>p.color==='#f9e6ac'&&p.y===3).length,9);
  for(let d=0;d<8;d++) {const halo=pixelCanvas();assert.equal(directionalHelmet(halo,'halo',{x:0,y:0},d),true);
    assert.ok(halo.calls.every(p=>p.y<=-8));assert.ok(halo.calls.length>=5);}
});

function enterTestRoom(p,q) {
  Object.assign(p,{room:'old-well-1',roomX:80,roomY:100});
  Object.assign(q,{room:'old-well-1',roomX:140,roomY:100});
}

test('room shot creator uses local origin/aim, normal charge/mana/halo, and no world collision/tip path',()=>{
  const {g,p,q}=setup();enterTestRoom(p,q);p.equipment.head='halo';
  g.projectileBlocked=()=>{throw Error('Room shot must not ask world LOS');};
  const b=createRoomHealingBolt(g,p,1.2,'hand1',{aim:{x:3,y:4}});
  assert.equal(b.room,p.room);assert.deepEqual([b.x,b.y],[80,100]);assert.deepEqual([b.vx,b.vy],[156,208]);
  assert.equal(b.healingAmount,45);assert.equal(b.healingHotAmount,5);assert.equal(b.damage,0);
  assert.equal(b.remaining,560);assert.equal(b.size,14);assert.equal(p.mana,88);
  assert.equal(b.color,HEALING_COLOR);assert.equal(g.spells.length,0);
  assert.equal(g.fireSpell(p),false); // World casting continues to reject room origins.
  const other=createRoomHealingBolt(g,p,0,'hand1',{origin:{x:91,y:102},aim:{x:-1,y:0}});
  assert.deepEqual([other.x,other.y,other.vx,other.vy],[91,102,-260,0]);
});

test('room shots heal only registered same-room allies/spirits, with effects anchored in room coordinates',()=>{
  const {g,p,q}=setup();enterTestRoom(p,q);p.equipment.head=q.equipment.head='halo';
  const pet={id:90,kind:'tiger',owner:p.id,faction:'ally',spiritGhost:true,hunterPet:true,
    room:p.room,roomX:102,roomY:104,x:1400,y:1400,hp:10,maxHp:100};p.hunterPet=pet;
  const summoned={...pet,id:91,kind:'skeleton',hunterPet:false,pet:true};g.ghosts=[summoned];
  const foe={id:'well-enemy',kind:'bat',room:p.room,roomX:130,roomY:100,x:130,y:100,hp:24,maxHp:24};
  g.portals=[{id:p.room,oldWell:true,well:{enemies:[foe],bolts:[]}}];
  const b=createRoomHealingBolt(g,p);
  assert.ok(spellHealingTargets(g,b).includes(q));assert.ok(spellHealingTargets(g,b).includes(pet));
  assert.ok(spellHealingTargets(g,b).includes(summoned));assert.ok(!spellHealingTargets(g,b).includes(foe));
  assert.equal(hitHealingBolt(g,b,q),true);assert.equal(q.hp,57.5);
  const fx=g.effects.find(e=>e.spellHealing);
  assert.deepEqual([fx.x,fx.y,fx.room,fx.amount],[140,74,p.room,37.5]);
  const rise=g.effects.find(e=>e.healingRise);assert.equal(rise.room,p.room);assert.equal(rise.x,q.roomX);
  assert.equal(hitHealingBolt(g,b,foe),false);assert.equal(foe.hp,24);
  assert.equal(hitHealingBolt(g,b,pet),true);assert.equal(pet.hp,40);
  q.room='different-well';assert.equal(hitHealingBolt(g,b,q),false);
  q.room=null;assert.equal(hitHealingBolt(g,b,q),false);
  assert.deepEqual(spellHealingPoint(pet),{x:102,y:104});
});

test('room shot failures are atomic and offhand/PvP rules match world spells',()=>{
  const {g,p,q}=setup();enterTestRoom(p,q);p.equipment.hand1=null;p.equipment.hand2='healing_wand';
  p.mana=11;assert.equal(createRoomHealingBolt(g,p,0,'hand2'),null);assert.equal(p.mana,11);
  p.mana=100;assert.equal(createRoomHealingBolt(g,p,0,'hand2',{aim:{x:NaN,y:1}}),null);assert.equal(p.mana,100);
  assert.equal(createRoomHealingBolt(g,p,0,'hand2',{aim:{x:0,y:0}}),null);assert.equal(p.mana,100);
  p.ui={};assert.equal(createRoomHealingBolt(g,p,0,'hand2'),null);delete p.ui;
  const b=createRoomHealingBolt(g,p,0,'hand2');assert.equal(b.slot,'hand2');assert.equal(p.mana,88);
  g.pvp=true;assert.equal(hitHealingBolt(g,b,q),false);assert.equal(q.hp,20);
  p.hp=0;assert.equal(createRoomHealingBolt(g,p,0,'hand2'),null);
});

test('room-local HoT survives session snapshots, heals once per second and tags all target effects',()=>{
  const {g,p,q}=setup();enterTestRoom(p,q);p.equipment.head='halo';
  const b=createRoomHealingBolt(g,p);hitHealingBolt(g,b,q);tickSpellHealing(g,.4);
  const saved=restoreSession(JSON.parse(JSON.stringify(saveSession(g))));
  assert.equal(saved.players[1].healingOverTime[0].room,'old-well-1');
  const lq=saved.players[1];assert.equal(lq.hp,50);tickSpellHealing(saved,.6);assert.equal(lq.hp,55);
  assert.ok(saved.effects.filter(e=>e.spellHealing||e.healingRise).every(e=>e.room==='old-well-1'&&e.x===140));
  tickSpellHealing(saved,2);assert.equal(lq.hp,65);assert.equal(lq.healingOverTime,undefined);
});

test('room changes clear HoT and in-flight world bolts cannot heal room occupants through surface coordinates',()=>{
  const {g,p,q}=setup(),outside=alignTarget(g,p,q);enterTestRoom(p,q);
  assert.equal(hitHealingBolt(g,outside,q),false);
  const b=createRoomHealingBolt(g,p);hitHealingBolt(g,{...b,healingHot:true,healingHotAmount:4},q);
  p.room=q.room='old-well-2';tickSpellHealing(g,1);
  assert.equal(q.hp,44);assert.equal(q.healingOverTime,undefined);
  assert.equal(hitHealingBolt(g,b,q),false);
});

test('room impact bursts carry room tags and dead spirits do not revive or emit healing effects',()=>{
  const {g,p,q}=setup();enterTestRoom(p,q);
  const b=createRoomHealingBolt(g,p);finishMagicBolt(g,b,true);
  assert.equal(g.effects[0].room,p.room);assert.equal(g.effects[0].y,b.y-16);
  const dead={id:80,kind:'skeleton',owner:p.id,pet:true,ghost:true,faction:'ally',room:p.room,
    roomX:102,roomY:108,hp:0,maxHp:100};g.ghosts=[dead];
  const n=g.effects.length;assert.equal(hitHealingBolt(g,b,dead),false);
  assert.equal(g.effects.length,n);assert.equal(dead.hp,0);
});

test('parent well collision pipeline heals room allies without damaging its separate foes',()=>{
  const {g,p,q}=setup();enterTestRoom(p,q);p.equipment.head='halo';
  const s=generateWellTunnels(41),d={id:p.room,oldWell:true,x:1100,y:1200,well:s};g.portals=[d];
  const foe={id:'well-hostile',kind:'bat',x:105,y:100,hp:24,maxHp:24,damage:0,speed:0,state:'idle',cooldown:10};
  s.enemies=[foe];s.bolts.push(createRoomHealingBolt(g,p));
  tickOldWells(g,.2);assert.equal(q.hp,50);assert.equal(foe.hp,24);
  assert.equal(s.bolts.length,0);assert.equal(q.healingOverTime[0].amount,5);
  assert.ok(g.effects.every(fx=>fx.room===p.room));
  tickSpellHealing(g,1);assert.equal(q.hp,55);
});
