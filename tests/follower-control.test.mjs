import test from "node:test";
import assert from "node:assert/strict";
import { controlledFollower, cycleFollowerControl, syncControlledFollower, followControlledUnit } from "../src/follower-control.mjs";
import {startFollowerAttack,tickFollowerAttack} from '../src/follower-attacks.mjs';
import {Game,EVENTS} from '../src/core.mjs';
import {saveSession,restoreSession} from '../src/session.mjs';
import {Profiles} from '../src/profiles.mjs';
import {controlledUnit} from '../src/controlled-unit.mjs';
import {applyDefinitions} from '../src/definitions.mjs';
import fs from 'node:fs';
import {actorRenderSize,creatureRenderSize,PLAYER_RENDER_SIZE} from '../src/render-settings.mjs';
import {graveyardWorld} from '../src/graveyard-world.mjs';
import {tickHazards} from '../src/hazards.mjs';
import {lightSources} from '../src/night-cycle.mjs';
import {lionAction} from '../src/lion-motion.mjs';
import {defaultBeastMotion} from '../src/beast-motion.mjs';
import {villagerAction,villagerMotion} from '../src/villager-motion.mjs';

test("control cycles through every owned follower and returns to the saved player position", () => {
  const player = { id: 1, profileId: "p1", name: "DAD", x: 10, y: 20 };
  const wolf = { id: 2, kind: "wolf", name: "Wolf", allyOwner: 1, x: 100, y: 110, hp: 20 };
  const april = { id: 3, name: "April", ownerKey: "p1", x: 200, y: 210, hp: 80 };
  const game = { players: [player], enemies: [wolf], villageFollowers: [april], ghosts: [], message() {} };
  assert.equal(cycleFollowerControl(game, player), wolf);
  assert.deepEqual([player.x, player.y], [100, 110]);
  assert.equal(cycleFollowerControl(game, player), april);
  assert.deepEqual([player.x, player.y], [200, 210]);
  assert.equal(cycleFollowerControl(game, player), null);
  assert.deepEqual([player.x, player.y], [10, 20]);
  assert.equal(player.controlledFollowerId, undefined);
});

test("death of the controlled follower restores the main character immediately", () => {
  const player = { id: 1, profileId: "p1", name: "DAD", x: 10, y: 20 };
  const wolf = { id: 2, kind: "wolf", allyOwner: 1, x: 100, y: 110, hp: 20 };
  const game = { players: [player], enemies: [wolf], villageFollowers: [], ghosts: [], message() {} };
  cycleFollowerControl(game, player);
  wolf.hp = 0;
  assert.equal(controlledFollower(game, player), null);
  assert.deepEqual([player.x, player.y], [10, 20]);
});
test('controlled-unit lookup includes tamed, pet, ghost and village-follower pools',()=>{
 const p={id:1,controlledFollowerId:4},village={id:4,hp:10,kind:'villager'};
 assert.equal(controlledUnit({players:[p],villageFollowers:[village]},p),village);
});

test('creature bags stay separate and persistent through switching, session reload and profile capture',()=>{
 const g=new Game(),p=g.addPlayer('keyboard','Hero');p.profileId='recovery-hero';
 p.inventory=[{type:'potion',qty:3}];p.equipment.hand1='sword';
 const follower={id:999,kind:'wolf',allyOwner:p.id,faction:'ally',hp:50,x:600,y:600};g.enemies.push(follower);
 cycleFollowerControl(g,p);p.inventory.push({type:'arrow',qty:4});p.equipment.hand1='stick';
 assert.equal(follower.inventory[0].type,'arrow');assert.equal(p.controlMainLoadout.inventory[0].type,'potion');
 const profiles=new Profiles();profiles.data.heroes=[{id:p.profileId}];profiles.save=()=>{};profiles.capture(g);
 assert.equal(profiles.data.heroes[0].equipment.hand1,'sword');assert.equal(profiles.data.heroes[0].inventory[0].type,'potion');
 const restored=restoreSession(JSON.parse(JSON.stringify(saveSession(g)))),rp=restored.players[0];
 assert.equal(controlledFollower(restored,rp).inventory[0].type,'arrow');
 assert.equal(rp.inventory,controlledFollower(restored,rp).inventory,'reopened inventory stays bound to creature');cycleFollowerControl(restored,rp);
 assert.equal(rp.equipment.hand1,'sword');assert.equal(rp.inventory[0].type,'potion');
 cycleFollowerControl(restored,rp);assert.equal(rp.inventory[0].qty,4);assert.equal(rp.equipment.hand1,'stick');
});

test('hero follows behind the controlled creature and returns at its following position',()=>{
 const p={id:1,name:'Hero',x:100,y:100,faceX:1,faceY:0},f={id:2,allyOwner:1,hp:10,x:200,y:100};
 const g={players:[p],enemies:[f],message(){}};cycleFollowerControl(g,p);p.x=350;
 for(let i=0;i<120;i++)syncControlledFollower(g,p,1/60);
 assert.equal(f.x,350);assert.ok(Math.hypot(p.controlPetPosition.x-f.x,p.controlPetPosition.y-f.y)>40);
 p.swimming=true;p.diveDepth=.2;p.breath=12;p.breathVisible=1;f.swimming=true;
 syncControlledFollower(g,p,1/60);
 assert.equal(p.controlPetPosition.swimming,false,'the following hero uses its own floor instead of the controlled swimmer');
 assert.equal(p.controlPetPosition.diveDepth,0);
 const x=p.controlPetPosition.x;cycleFollowerControl(g,p);assert.equal(p.x,x);
});

test('controlled-creature attack stays combat while Interact opens nearby supplies',()=>{
 const g=new Game(()=>.5),p=g.addPlayer('pad:0','Hero');g.start();g.openingBoard=false;
 const chest=g.supplyChests[0],wolf={id:9001,kind:'wolf',allyOwner:p.id,faction:'ally',hp:70,maxHp:70,damage:12,speed:40,x:chest.x,y:chest.y,faceX:1,faceY:0,inventory:[],equipment:{},equipmentSockets:{}};
 g.enemies=[wolf];cycleFollowerControl(g,p);g.update(.02,{'pad:0':{attack:true}});assert.equal(chest.opened,false);
 g.update(.02,{'pad:0':{attack:false}});assert.ok(wolf.controlledAttack,'Attack starts the creature-native attack');assert.equal(chest.opened,false);
 g.update(.02,{'pad:0':{interact:true}});assert.equal(chest.opened,true,'Interact opens the chest independently');
});

test('controlled Captain uses native slash/thrust, damages once and cannot attack frozen',()=>{
 const owner={id:1,faceX:1,faceY:0},f={id:2,kind:'oathless_captain',allyOwner:1,hp:100,damage:9,x:0,y:0};
 const target={id:3,kind:'wolf',hp:100,x:25,y:0,faction:'enemy'},ally={id:4,hp:100,x:15,y:0,faction:'ally'};
 const g={players:[owner],enemies:[f,ally,target],effects:[],projectileBlocked:()=>false,onSound(){}};
 startFollowerAttack(g,owner,f);assert.equal(f.animationAction,'slash');
 for(let i=0;i<30;i++)tickFollowerAttack(g,f,.02);assert.equal(target.hp,91);assert.equal(ally.hp,100);
 startFollowerAttack(g,owner,f);assert.equal(f.animationAction,'thrust');f.frozen=1;tickFollowerAttack(g,f,.02);assert.equal(f.controlledAttack,undefined);
});

test('controlled imp uses melee on tap and launches a damaging fireball on a full charge',()=>{
 const g=new Game(()=>.5),p=g.addPlayer('keyboard','Hero');g.start();g.openingBoard=false;
 g.projectileBlocked=()=>false;
 const imp={id:992,kind:'imp',allyOwner:p.id,faction:'ally',hp:60,maxHp:60,damage:14,speed:55,x:500,y:500,faceX:1,faceY:0,inventory:[],equipment:{},equipmentSockets:{},cooldown:0};
 const foe={id:993,kind:'skeleton',faction:'enemy',hp:60,maxHp:60,x:525,y:500};g.enemies.push(imp,foe);cycleFollowerControl(g,p);
 assert.equal(g.attack(p,0),true);assert.equal(imp.animationAction,'attack');
 for(let i=0;i<15;i++)g.update(.02,{keyboard:{attack:false}});assert.ok(foe.hp<60,'imp tap attack connects with its own melee');
 imp.cooldown=0;foe.hp=60;p.faceX=1;p.faceY=0;foe.x=imp.x+32;foe.y=imp.y+13;assert.equal(g.attack(p,1.2),true);assert.equal(g.fireballs.length,1);assert.equal(g.fireballs[0].friendly,true);
 tickHazards(g,.1);assert.ok(foe.hp<60,'the charged fireball damages the hostile it reaches');assert.equal(p.hp,100,'the friendly projectile never hits its controlling hero');
});
test('controlled fire and ice elementals use native melee on taps and only cast on a full charge',()=>{
 for(const [kind,ice] of [['fire_elemental',false],['water_elemental',true]]){
  const g=new Game(()=>.5),p=g.addPlayer('keyboard','Hero');g.start();g.openingBoard=false;g.projectileBlocked=()=>false;p.faceX=1;p.faceY=0;
  const follower={id:950+(ice?1:0),kind,allyOwner:p.id,faction:'ally',hp:80,maxHp:80,damage:18,speed:55,x:500,y:500,faceX:1,faceY:0,inventory:[],equipment:{},equipmentSockets:{},cooldown:0};
  const foe={id:970+(ice?1:0),kind:'skeleton',faction:'enemy',hp:100,maxHp:100,x:525,y:500};g.enemies.push(follower,foe);cycleFollowerControl(g,p);
  assert.equal(g.attack(p,0),true);assert.notEqual(follower.animationAction,'cast','a tap remains the elemental native melee');
  for(let i=0;i<15;i++)g.update(.02,{keyboard:{attack:false}});assert.ok(foe.hp<100);
  follower.cooldown=0;foe.hp=100;foe.x=follower.x+44;foe.y=follower.y+16;assert.equal(startFollowerAttack(g,p,follower,1.2),true);
  assert.equal(follower.animationAction,'cast');assert.equal(g.fireballs.at(-1).ice,ice);
  tickHazards(g,.1);assert.ok(foe.hp<100);assert.equal(p.hp,100);
  assert.equal(!!foe.burning,!ice,'only the fire elemental applies burn');
 }
});

test('the displaced torch-bearing hero keeps a carried light while a follower is controlled',()=>{
 const g=new Game(),p=g.addPlayer('keyboard','Hero');g.start();g.openingBoard=false;p.equipment.hand1='torch';
 const wolf={id:994,kind:'wolf',allyOwner:p.id,faction:'ally',hp:30,maxHp:30,x:p.x+180,y:p.y,inventory:[],equipment:{},equipmentSockets:{}};g.enemies.push(wolf);
 cycleFollowerControl(g,p);syncControlledFollower(g,p,.01);
 const hero=p.controlPetPosition,source=lightSources(g).find(s=>s.owner===`actor:${p.id}:hero`&&Math.hypot(s.x-hero.x,s.y-hero.y)<1);
 assert.ok(source,'hero torch source follows the detached hero position');assert.equal(source.radius,280);
});

test('controlled April native melee strikes harvest trees instead of only targeting creatures',()=>{
 const g=new Game(()=>.5),owner=g.addPlayer('keyboard','Hero');g.start();g.openingBoard=false;
 owner.profileId='april-tree-test';owner.faceX=1;owner.faceY=0;
 const april={id:883,kind:'villager',villagerId:'april',ownerKey:owner.profileId,name:'April',faction:'ally',allyOwner:owner.id,
  hp:100,maxHp:100,damage:9,speed:70,x:500,y:500,faceX:1,faceY:0,inventory:[],equipment:{},equipmentSockets:{}};
 g.villageFollowers=[april];cycleFollowerControl(g,owner);
 const tree={kind:'tree',x:530,y:500,size:80};g.scenery=[tree];
 startFollowerAttack(g,owner,april);
 for(let i=0;i<20;i++)tickFollowerAttack(g,april,.02);
 assert.ok(tree.harvest>0,'the strike frame applies harvest damage to the tree');
 assert.equal(april.gatherAction,'woodcut','the native rig enters its woodcut feedback');
});

test('controlled April swim state follows her floor tile and never her displaced hero cache',()=>{
 const g=new Game(()=>.5),p=g.addPlayer('keyboard','Hero');g.start();g.openingBoard=false;g.terrain.fill('grass');
 p.profileId='april-water-test';p.swimming=true;
 const april={id:884,kind:'villager',villagerId:'april',ownerKey:p.profileId,name:'April',faction:'ally',allyOwner:p.id,
  hp:100,maxHp:100,damage:9,speed:70,x:500,y:500,faceX:1,faceY:0,swimming:true,inventory:[],equipment:{},equipmentSockets:{}};
 g.villageFollowers=[april];cycleFollowerControl(g,p);syncControlledFollower(g,p);
 assert.equal(april.swimming,false,'dry ground clears an old swimming flag');assert.equal(p.swimming,false,'the input proxy uses April’s actual surface state');
 g.terrain[15*50+15]='water';syncControlledFollower(g,p);
 assert.equal(april.swimming,true);assert.equal(p.swimming,true,'deep water still blocks land attacks');
 april.jumpHeight=8;syncControlledFollower(g,p);assert.equal(april.swimming,false,'an airborne April does not use the swim clip');
});

test('controlled April owns the pickup pose, cuts tall grass, and can damage peaceful wild fauna',()=>{
 const g=new Game(()=>.5),p=g.addPlayer('keyboard','Hero');g.start();g.openingBoard=false;g.terrain.fill('grass');
 p.profileId='april-action-test';p.aprilFriend={active:true};p.faceX=1;p.faceY=0;
 const april={id:885,kind:'villager',villagerId:'april',ownerKey:p.profileId,name:'April',faction:'ally',allyOwner:p.id,
  hp:100,maxHp:100,damage:9,speed:70,x:500,y:500,faceX:1,faceY:0,inventory:[],equipment:{},equipmentSockets:{}};
 g.villageFollowers=[april];cycleFollowerControl(g,p);
 const potion={id:886,type:'potion',qty:1,x:500,y:500};g.loot.push(potion);
 assert.equal(g.collect(p,potion),true);assert.equal(p.pickupTime,0,'the displaced hero must not play the loot animation');
 assert.equal(villagerAction(april),'pickup');assert.ok(villagerMotion.clips.pickup,'April has a native pickup gesture');
 g.terrain.fill('grass');
 const grass={kind:'tall_grass',x:530,y:500,rootY:514,size:80,tuftSeed:3};g.scenery=[grass];
 assert.equal(g.attack(p,0),true);for(let i=0;i<24;i++)g.update(.02,{keyboard:{attack:false}});
 assert.equal(grass.cut,true,'April’s sword strike cuts the grass through the follower attack path');
 const deer={id:887,kind:'stag',faction:'neutral',hp:74,maxHp:74,x:530,y:500,homeX:530,homeY:500,speed:116};g.enemies.push(deer);april.cooldown=0;p.faceX=1;p.faceY=0;
 assert.equal(g.attack(p,0),true);for(let i=0;i<12;i++)g.update(.02,{keyboard:{attack:false}});
 assert.ok(deer.hp<74,'a controlled sword hit can hurt a peaceful deer');
});

test('controlled April advances her oathless-captain jump and attack animations',()=>{
 const g=new Game(()=>.5),p=g.addPlayer('keyboard','Hero');g.start();g.openingBoard=false;
 p.profileId='april-test';p.aprilFriend={active:true};
 const april={id:881,kind:'villager',villagerId:'april',ownerKey:p.profileId,name:'April',faction:'ally',allyOwner:p.id,
  hp:100,maxHp:100,damage:9,speed:70,x:500,y:500,faceX:1,faceY:0,inventory:[],equipment:{},equipmentSockets:{}};
 g.villageFollowers=[april];cycleFollowerControl(g,p);
 g.update(.08,{keyboard:{jump:true}});
 assert.ok(april.jumpHeight>0,'April receives the normal controlled jump arc');
 assert.equal(april.animationAction,'jump','her airborne state selects the rig jump clip');
 g.update(.08,{keyboard:{jump:false}});
 const target={id:882,kind:'wolf',hp:100,maxHp:100,x:535,y:500,faction:'enemy'};
 g.enemies.push(target);april.cooldown=0;
 assert.equal(g.attack(p,0),true);
 assert.ok(['jump_slash','slash','thrust'].includes(april.animationAction),'attack uses a clip available on the oathless captain rig');
 for(let i=0;i<40;i++)g.update(.02,{keyboard:{attack:false,jump:false}});
 assert.equal(april.controlledAttack,undefined,'the normal simulation advances April through attack recovery');
 assert.ok(target.hp<=100);
});

test('analog locomotion changes from walk to run at 75 percent with a soft return threshold',()=>{
 const g=new Game(()=>.5),p=g.addPlayer('keyboard','Hero');g.start();g.openingBoard=false;
 g.update(.02,{keyboard:{x:.74,y:0}});assert.equal(p.movementGait,'walk');
 g.update(.02,{keyboard:{x:.76,y:0}});assert.equal(p.movementGait,'run');
 g.update(.02,{keyboard:{x:.70,y:0}});assert.equal(p.movementGait,'run','small stick fluctuations do not flicker back to walking');
 g.update(.02,{keyboard:{x:.67,y:0}});assert.equal(p.movementGait,'walk');
 g.update(.02,{keyboard:{x:0,y:0}});assert.equal(p.movementGait,'idle');
});

test('feline control uses walk below half stick and selects real walk clips',()=>{
 const g=new Game(()=>.5),p=g.addPlayer('keyboard','Hero');g.start();g.openingBoard=false;
 const cat={id:883,kind:'panther',allyOwner:p.id,faction:'ally',hp:80,maxHp:80,speed:92,x:400,y:400,inventory:[],equipment:{},equipmentSockets:{}};
 g.enemies=[cat];cycleFollowerControl(g,p);
 g.update(.02,{keyboard:{x:.4,y:0}});assert.equal(cat.walking,true);assert.equal(lionAction(cat),'walk');assert.ok(defaultBeastMotion('panther').clips.walk,'panther has a native prowl walk clip');
 g.update(.02,{keyboard:{x:.8,y:0}});assert.equal(cat.walking,false);assert.equal(lionAction(cat),'run');
});

test('aimed charged cat attack shows a range target and launches a longer pounce',()=>{
 const owner={id:1,faceX:1,faceY:0,pounceAimActive:true},cat={id:2,kind:'lion',allyOwner:1,faction:'ally',hp:80,speed:90,x:100,y:100,cooldown:0};
 let moved=0;const game={players:[owner],enemies:[cat],effects:[],onSound(){},moveActor(actor,dx,dy){actor.x+=dx;actor.y+=dy;moved+=Math.hypot(dx,dy);return Math.hypot(dx,dy);}};
 assert.equal(startFollowerAttack(game,owner,cat,1.2),true);assert.equal(cat.controlledAttack.phase,'pounce');assert.ok(cat.pounceAim.x>=278,'max charge displays the full leap target');
 for(let i=0;i<35;i++)tickFollowerAttack(game,cat,.02);
 assert.ok(moved>170,'fully charged pounce covers a much longer distance than a basic step');assert.equal(cat.jumpHeight,0);assert.equal(cat.controlledAttack.phase,'recover');
});

test('holding attack and L on a controlled cat charges and releases the aimed pounce',()=>{
 const g=new Game(()=>.5),p=g.addPlayer('keyboard','Hero');g.start();g.openingBoard=false;
 const cat={id:884,kind:'lion',allyOwner:p.id,faction:'ally',hp:90,maxHp:90,speed:92,x:400,y:400,faceX:1,faceY:0,inventory:[],equipment:{},equipmentSockets:{},cooldown:0};
 g.enemies=[cat];cycleFollowerControl(g,p);
 for(let i=0;i<8;i++)g.update(.05,{keyboard:{attack:true,block:true,x:0,y:0}});
 assert.ok(cat.pounceAim?.range>90,'the aiming square follows charge distance');
 g.update(.02,{keyboard:{attack:false,block:true,x:0,y:0}});
 assert.equal(cat.controlledAttack?.phase,'pounce','release converts the held attack into the aimed leap');
});

test('controlled golem keeps its native scale, punches on tap, and throws a charged ground-grab rock on release',()=>{
 const owner={id:1,faceX:1,faceY:0},golem={id:2,kind:'golem',allyOwner:1,faction:'ally',hp:180,damage:18,x:0,y:0,cooldown:0};
 const target={id:3,kind:'wolf',hp:100,maxHp:100,x:32,y:0,faction:'enemy'};
 const g={players:[owner],enemies:[golem,target],arrows:[],effects:[],nextId:10,projectileBlocked:()=>false,onSound(){}};
 assert.equal(actorRenderSize({isPlayer:true,controlledBy:owner.id,kind:'golem'}),creatureRenderSize('golem'));
 startFollowerAttack(g,owner,golem,.08);
 assert.equal(golem.animationAction,'slam','tap uses the golem hit animation');
 for(let i=0;i<12;i++)tickFollowerAttack(g,golem,.02);
 assert.equal(target.hp,78,'the golem hit deals its native heavy damage');
 golem.cooldown=0;
 startFollowerAttack(g,owner,golem,.9);
 assert.equal(g.arrows.length,1);assert.equal(g.arrows[0].rock,true);assert.equal(g.arrows[0].owner,owner.id);
 assert.equal(golem.animationAction,'throw');assert.ok(g.arrows[0].damage>16);
});

test('holding the actual controller attack drives the golem ground-grab pose, then throws on release',()=>{
 const g=new Game(()=>.5),p=g.addPlayer('keyboard','Hero');g.start();g.openingBoard=false;
 const golem={id:901,kind:'golem',allyOwner:p.id,faction:'ally',hp:180,maxHp:180,damage:18,speed:40,x:500,y:500,faceX:1,faceY:0,inventory:[],equipment:{},equipmentSockets:{},cooldown:0};
 g.enemies=[golem];cycleFollowerControl(g,p);
 for(let i=0;i<12;i++)g.update(.05,{keyboard:{attack:true}});
 assert.equal(golem.state,'rocklift');assert.ok(golem.rockGrabCharge>0);assert.equal(golem.animationAction,null);
 g.update(.05,{keyboard:{attack:false}});
 assert.ok(g.arrows.some(arrow=>arrow.rock&&arrow.owner===p.id),'release launches the prepared rock');
});

test('a controlled spider basic melee strike damages a nearby cemetery tombstone',()=>{
 const g=new Game(()=>.5),owner=g.addPlayer('keyboard','Hero');g.start();g.openingBoard=false;
 Object.assign(g,graveyardWorld(75));g.generatedEnvironment='graveyard';g.phase='play';g.time=0;
 const stone=g.scenery.find(p=>p.kind==='gravestone'&&!p.depleted);
 const spider={id:980,kind:'spider',allyOwner:owner.id,faction:'ally',hp:30,maxHp:30,damage:9,
  x:stone.x,y:stone.rootY+14,faceX:0,faceY:-1,cooldown:0};
 owner.faceX=0;owner.faceY=-1;g.enemies.push(spider);cycleFollowerControl(g,owner);
 const before=stone.hp;assert.equal(g.attack(owner,0),true);
 for(let i=0;i<20;i++)g.update(.02,{keyboard:{attack:false}});
 assert.ok(stone.hp<before,'the spider native melee strike should use the graveyard tombstone damage path');
});

test('jump input never starts a jump on a controlled flying creature',()=>{
 const g=new Game(()=>.5),owner=g.addPlayer('keyboard','Hero');g.start();g.openingBoard=false;
 const bat={id:981,kind:'bat',allyOwner:owner.id,faction:'ally',hp:40,maxHp:40,damage:8,speed:50,
  x:500,y:500,faceX:1,faceY:0,inventory:[],equipment:{},equipmentSockets:{},jumpHeight:0,jumpVelocity:0};
 g.enemies.push(bat);cycleFollowerControl(g,owner);
 for(let i=0;i<8;i++)g.update(.05,{keyboard:{jump:true}});
 assert.equal(bat.jumpHeight||0,0);assert.equal(bat.jumpVelocity||0,0);
});

test('controlled companion invulnerability and blink timers expire instead of freezing on the hurt frame',()=>{
 const g=new Game(()=>.5),p=g.addPlayer('keyboard','Hero');g.start();g.openingBoard=false;
 const spider={id:902,kind:'spider',allyOwner:p.id,faction:'ally',hp:70,maxHp:70,damage:10,speed:40,x:500,y:500,inventory:[],equipment:{},equipmentSockets:{}};
 g.enemies=[spider];cycleFollowerControl(g,p);g.hurt(spider,10);
 assert.ok(spider.invuln>0);for(let i=0;i<16;i++)g.update(.05,{keyboard:{}});
 assert.equal(spider.invuln,0);assert.equal(spider.flash,0);assert.equal(spider.hit,0);
});

test('recovered shared authored rigs load with newly added default clips without rewriting source',()=>{
 const source=fs.readFileSync(new URL('../authored/rigs.json',import.meta.url),'utf8'),data=JSON.parse(source);
 applyDefinitions(data,structuredClone(EVENTS),{});assert.equal(JSON.stringify(data),JSON.stringify(JSON.parse(source)));
});

test('displaced hero routes around walls, settles, and never moves from creature rotation or zero dt',()=>{
 const g=new Game(()=>.4),p=g.addPlayer('pad:0','Hero');g.phase='play';g.openingBoard=false;
 // A solid wall separates the real hero and controlled flying creature.
 const blocked=(x,y,r=8)=>x+r>600&&x-r<650&&y+r>300&&y-r<600;
 g.blocked=blocked;g.generatedEnvironment='forest';g.traps=[];g.house=null;
 p.controlPetPosition={x:520,y:450,room:null};const f={x:760,y:450,faceX:0,faceY:-1};
 let detoured=false;
 for(let i=0;i<800;i++){g.time+=1/60;followControlledUnit(g,p,f,1/60);const h=p.controlPetPosition;assert.equal(blocked(h.x,h.y),false);if(h.y<292||h.y>608)detoured=true;}
 const h=p.controlPetPosition;assert.ok(detoured,'Hero goes around the wall');assert.ok(Math.hypot(h.x-f.x,h.y-f.y)<81);assert.equal(h.moving,false,'Hero settles at follow spacing');
 const before=[h.x,h.y,h.step];for(let i=0;i<80;i++){f.faceX=Math.sin(i);f.faceY=Math.cos(i);followControlledUnit(g,p,f,1/60);}assert.deepEqual([h.x,h.y,h.step],before,'Turning alone does not make the hero orbit');
 f.x+=200;followControlledUnit(g,p,f,0);assert.deepEqual([h.x,h.y,h.step],before);assert.equal(h.moving,false);
});


test('April receives replaced equipment and bag containers immediately from inventory UI',()=>{
 const g=new Game(()=>.5),p=g.addPlayer('keyboard');p.profileId='april-gear-owner';
 const heroGear=p.equipment,heroBag=p.inventory;
 const april={id:991,villagerId:'april',kind:'villager',ownerKey:p.profileId,name:'April',x:p.x+40,y:p.y,hp:80,equipment:{hand1:'april_blade'},inventory:[{type:'wand',qty:1},{type:'hat',qty:1}],equipmentSockets:{}};
 g.villageFollowers=[april];cycleFollowerControl(g,p);p.ui={panel:'pack',index:0};
 g.inventoryAction(p,'equip');assert.equal(april.equipment.hand1,'wand');assert.equal(april.equipment,p.equipment);assert.equal(april.inventory,p.inventory);
 p.ui.index=1;g.inventoryAction(p,'equip');assert.equal(april.equipment.head,'hat');
 cycleFollowerControl(g,p);assert.equal(p.equipment,heroGear);assert.equal(p.inventory,heroBag);assert.equal(april.equipment.hand1,'wand');
 cycleFollowerControl(g,p);assert.equal(p.equipment.hand1,'wand');
 p.ui={panel:'gear',index:0};g.inventoryAction(p,'use');assert.equal(april.equipment.head,null);
 const restored=restoreSession(JSON.parse(JSON.stringify(saveSession(g)))),rp=restored.players[0];
 assert.equal(controlledFollower(restored,rp).equipment.hand1,'wand');assert.equal(controlledFollower(restored,rp).equipment.head,null);
 cycleFollowerControl(restored,rp);cycleFollowerControl(restored,rp);assert.equal(rp.equipment.hand1,'wand');
});
