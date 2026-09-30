import {LOBBY_PLAYER_SIZE,PLAYER_RENDER_SIZE} from '../src/render-settings.mjs';
import test from 'node:test';import assert from 'node:assert/strict';
import {Game} from '../src/core.mjs';
import {RANGER_SET,ITEMS,hasSetSkill,count,stat,rollGear} from '../src/items.mjs';
import {tamePet,tickHunterPets,feedPet,hurtPet,petRecord,restoreHunterPet,petPvPEvent} from '../src/hunter-pets.mjs';
import {tickWildBatRoost} from '../src/bat-roost.mjs';
import {bowHandleWorld,playerMotion,poseAt} from '../src/player-motion.mjs';
import {rigSubject} from '../src/rig-subjects.mjs';
import {chargedProjectileRange} from '../src/projectile-range.mjs';
import {Profiles} from '../src/profiles.mjs';
import {saveSession,restoreSession} from '../src/session.mjs';
const setup=()=>{const g=new Game(()=>.5);g.phase='play';g.openingBoard=false;g.generatedEnvironment='forest';g.scenery=[];g.house=null;g.enemies=[];g.terrain.fill('grass');const p=g.addPlayer('keyboard');Object.assign(p,{x:300,y:300});return {g,p};};
const ranger=p=>{for(const id of RANGER_SET)p.equipment[ITEMS[id].slot]=id;};
const animal=(g,kind='wolf')=>{const e={id:g.nextId++,kind,hp:60,maxHp:60,x:330,y:300,damage:10,speed:90,state:'hunt'};g.enemies.push(e);return e;};
test('Ranger requires five compatible pieces to tame, and three to get a one-ammo volley',()=>{
 const {g,p}=setup();p.equipment.hand1='bow';p.inventory=[{type:'arrow',qty:2}];
 for(const id of RANGER_SET.slice(0,3))p.equipment[ITEMS[id].slot]=id;
 assert.equal(hasSetSkill(p,'tame_pet'),false);assert.ok(stat(p,'bowDamage')>0);
 g.fireArrow(p,1.2);assert.equal(g.arrows.length,3);assert.equal(count(p,'arrow'),1);
 const angles=g.arrows.map(a=>a.angle);assert.ok(angles[0]<angles[1]&&angles[1]<angles[2]);
 ranger(p);assert.equal(hasSetSkill(p,'tame_pet'),true);assert.equal(ITEMS.ranger_quiver.slot,'back');
 assert.ok(Object.keys(ITEMS).filter(id=>ITEMS[id].rarity==='rare').includes('ranger_quiver'));
});
test('Bow arrows originate at the held handle in all directions, both scenes and charged poses',()=>{
 for(const lobby of [false,true])for(let i=0;i<8;i++)for(const charge of [0,.6,1.2]){
  const {g,p}=setup();g.generatedEnvironment=lobby?'lobby':'forest';p.equipment.hand1='bow';p.inventory=[{type:'arrow',qty:1}];
  Object.assign(p,{faceX:Math.cos(i*Math.PI/4),faceY:Math.sin(i*Math.PI/4),charge,attack:.34});
  const expected=bowHandleWorld({...p,attack:0,bowAiming:true},g.time,playerMotion,lobby?LOBBY_PLAYER_SIZE:PLAYER_RENDER_SIZE);
  g.fireArrow(p,charge);const a=g.arrows[0];assert.ok(Math.abs(a.x-expected.x)<1e-9);assert.ok(Math.abs(a.y-a.z-expected.y)<1e-9);
 }
});
test('Arrows and wands cover matched basic, partial and charged ranges, then fizzle',()=>{
 for(const charge of [0,.6,1.2]){
  const {g,p}=setup();Object.assign(p,{x:300,y:500,faceX:1,faceY:0});p.equipment.hand1='bow';p.inventory=[{type:'arrow',qty:1}];
  g.fireArrow(p,charge);const a=g.arrows[0],start=a.x;p.equipment.hand1='wand';g.fireSpell(p,charge);const b=g.spells[0],boltStart=b.x;
  for(let n=0;n<700;n++)g.tickAdventure(.005,{});
  assert.ok(Math.abs(a.x-start-chargedProjectileRange(charge))<3);
  assert.ok(Math.abs(b.x-boltStart-chargedProjectileRange(charge))<1e-6);
  assert.ok(g.effects.some(e=>e.magicBolt&&!e.hit));
 }
});
test('Magic hits create one spark burst on walls and creatures, and expiry creates a fizzle',()=>{
 for(const target of ['wall','enemy','miss']){
  const {g,p}=setup();p.equipment.hand1='wand';p.faceX=1;p.faceY=0;g.fireSpell(p,0);const b=g.spells[0];
  if(target==='wall')g.house={walls:[{x:b.x+30,y:b.y-20,w:8,h:40}],doors:[],furniture:[],pools:[]};
  if(target==='enemy')g.enemies=[{id:500,kind:'wolf',x:b.x+30,y:b.y,hp:100,maxHp:100}];
  for(let n=0;n<100;n++)g.tickAdventure(.02,{});
  const bursts=g.effects.filter(e=>e.magicBolt);assert.equal(bursts.length,1);assert.equal(bursts[0].hit,target!=='miss');
 }
});
test('Taming is gear-gated, retains one pet after unequipping, and grants upgraded animal stats',()=>{
 for(const kind of ['lion','wolf','bat','panther','tiger']){
  const {g,p}=setup(),e=animal(g,kind);assert.equal(tamePet(g,p,e),false);ranger(p);assert.ok(tamePet(g,p,e));
  const pet=p.hunterPet;assert.equal(g.enemies.length,0);assert.ok(pet.maxHp>=100&&pet.damage>=16);assert.equal(pet.collar,p.color);
  p.equipment={};tickHunterPets(g,.1,{});assert.equal(p.hunterPet,pet);assert.equal(tamePet(g,p,animal(g)),false);
 }
});
test('Pets heal naturally and use meat, except bats use fruit; feeding produces hearts',()=>{
 for(const kind of ['wolf','bat']){
  const {g,p}=setup();ranger(p);tamePet(g,p,animal(g,kind));const pet=p.hunterPet;pet.hp=10;p.inventory=[{type:'meat',qty:2}];
  const success=feedPet(g,p);assert.equal(success,kind!=='bat');if(kind==='bat'){p.inventory=[{type:'fruit',qty:2}];assert.ok(feedPet(g,p));}
  assert.ok(pet.hp>10);assert.ok(pet.heartTime>0);const health=pet.hp;g.time=10;tickHunterPets(g,1,{});assert.ok(pet.hp>health);
 }
});
test('Pets revive during the 60-second window, otherwise are lost and may be retamed',()=>{
 const {g,p}=setup();ranger(p);tamePet(g,p,animal(g));let pet=p.hunterPet;
 hurtPet(g,pet,9999);assert.equal(pet.hp,0);
 for(let n=0;n<90;n++)tickHunterPets(g,.02,{keyboard:{interact:true}});
 assert.ok(pet.hp>0);pet.invuln=0;hurtPet(g,pet,9999);
 for(let n=0;n<61;n++)tickHunterPets(g,1,{});
 assert.equal(p.hunterPet,null);assert.ok(tamePet(g,p,animal(g,'lion')));
});
test('Ground pets sit facing an idle owner; bats hang in a nearby tree or hover',()=>{
 for(const kind of ['lion','wolf','panther','tiger','bat']){
  const {g,p}=setup();ranger(p);tamePet(g,p,animal(g,kind));const pet=p.hunterPet;
  if(kind==='bat')g.scenery=[{kind:'tree',x:320,y:280,rootY:310,size:64}];
  for(let n=0;n<2400;n++){g.time+=.02;tickHunterPets(g,.02,{});}
  assert.equal(pet.animationAction,kind==='bat'?'hang':'sit');
  const rig=rigSubject(kind),pose=poseAt(rig.data,pet.animationAction,2);
  if(kind==='bat'){assert.ok(pose.head[2]<pose.footL[2]);g.scenery=[];tickHunterPets(g,1,{});assert.notEqual(pet.animationAction,'sit');}
  else assert.ok(pose.pelvis[2]<rig.data.joints.pelvis.position[2]);
 }
});
test('Wild bats roost away from players and wake within aggro range',()=>{
 const {g,p}=setup(),bat=animal(g,'bat');Object.assign(bat,{x:900,y:900});g.scenery=[{kind:'tree',x:900,y:900,rootY:900,size:64}];
 for(let n=0;n<30;n++)assert.ok(tickWildBatRoost(g,bat,.1,[p]));assert.equal(bat.animationAction,'hang');
 p.x=bat.x;p.y=bat.y;assert.equal(tickWildBatRoost(g,bat,.1,[p]),false);assert.equal(bat.animationAction,null);
});
test('Pet PvP is retaliation-only and clears when the owner withdraws',()=>{
 const {g,p}=setup();ranger(p);tamePet(g,p,animal(g));const q=g.addPlayer('pad:0');Object.assign(q,{x:340,y:300});g.pvp=true;
 tickHunterPets(g,.1,{});assert.equal(p.hunterPet.pvpTarget,null);
 petPvPEvent(g,q,p);assert.equal(p.hunterPet.pvpTarget,q.id);
 p.x=900;p.y=900;tickHunterPets(g,.1,{});assert.equal(p.hunterPet.pvpTarget,null);
 g.pvp=false;petPvPEvent(g,p,q);assert.equal(p.hunterPet.pvpTarget,null);
});
test('Pet name, collar, health and downed time survive profiles and session reloads',()=>{
 const {g,p}=setup();ranger(p);tamePet(g,p,animal(g,'bat'));Object.assign(p.hunterPet,{name:'Fig',collar:'#aabbcc',hp:0,downedRemaining:23});
 const saved=petRecord(p.hunterPet),restored=restoreHunterPet(saved);assert.equal(restored.name,'Fig');assert.equal(restored.downedRemaining,23);
 const session=restoreSession(JSON.parse(JSON.stringify(saveSession(g))));assert.equal(session.players[0].hunterPet.name,'Fig');assert.equal(session.players[0].hunterPet.hp,0);
 const profiles=new Profiles();profiles.save=()=>{};profiles.data.heroes=[{id:p.profileId}];profiles.capture(g);
 const q=g.addPlayer('pad:0');profiles.assign(q,profiles.data.heroes[0]);assert.equal(q.hunterPet.name,'Fig');assert.equal(q.hunterPet.collar,'#aabbcc');
});
test('Loot prompt wins over nearby winter props, including medium-length Y presses',()=>{
 for(const hold of [.1,.4,.52,.7]){
  const {g,p}=setup();g.generatedEnvironment='ice';g.scenery=[{kind:'winter_cache',x:300,y:296,size:36}];p.inventory=[];
  g.dropLoot(p.x+5,p.y,'potion',2,'Winter supplies',true);
  for(let t=0;t<hold;t+=.02)g.tickAdventure(.02,{keyboard:{interact:true}});
  g.tickAdventure(.02,{keyboard:{}});assert.equal(count(p,'potion'),2);assert.equal(g.scenery[0].used,undefined);
 }
});

test('Existing authored rigs migrate without making unrelated animals require a sit clip',async()=>{
 const {readFile}=await import('node:fs/promises');const d=JSON.parse(await readFile(new URL('../authored/rigs.json',import.meta.url),'utf8'));
 const {validateBeastMotion}=await import('../src/beast-motion.mjs'),{validateAlligatorMotion}=await import('../src/alligator-motion.mjs'),{validateRhinoMotion}=await import('../src/rhino-motion.mjs'),{validateBatMotion}=await import('../src/bat-motion.mjs'),{validateWolfMotion}=await import('../src/wolf-motion.mjs');
 for(const [kind,m]of Object.entries(d.beastMotions))assert.equal(validateBeastMotion(kind,m),true,kind);
 assert.equal(validateAlligatorMotion(d.alligator),true);assert.equal(validateRhinoMotion(d.rhino),true);assert.equal(validateBatMotion(d.bat),true);assert.equal(validateWolfMotion(d.wolf),true);
});
test('Pet attacks a nearby enemy, follows its owner, and responds to actual PvP damage',()=>{
 const {g,p}=setup();ranger(p);tamePet(g,p,animal(g));const pet=p.hunterPet;
 const foe=animal(g,'lion');foe.x=pet.x+10;tickHunterPets(g,.1,{});assert.ok(foe.hp<60);assert.equal(foe.killedBy,p.id);
 g.enemies=[];p.x=550;const before=pet.x;for(let i=0;i<25;i++)tickHunterPets(g,.05,{});assert.ok(pet.x>before);
 const q=g.addPlayer('pad:0');Object.assign(q,{x:p.x+20,y:p.y,invuln:0});g.pvp=true;g.hurt(q,4,p);assert.equal(pet.pvpTarget,q.id);
 g.pvp=false;tickHunterPets(g,.05,{});assert.equal(pet.pvpTarget,null);
});
