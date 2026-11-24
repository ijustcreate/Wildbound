import assert from 'node:assert/strict';
import test from 'node:test';
import {Game} from '../src/core.mjs';
import {enterWildLands} from '../src/wild-lands.mjs';
import {HOGSMEADE_SHACK,hogsmeadeDoor,inHogsmeadeBuilding} from '../src/hogsmeade-layout.mjs';
import {BOGGART_CABINET,BOGGART_COOLDOWN,BOGGART_FORMS,BOGGART_LOOT,SHACK_TRAPDOOR,SHACK_TRAPDOOR_MESSAGE,
 shackBoggartState,shackTrapdoorClick} from '../src/hogsmeade-boggart.mjs';
import {saveSession,restoreSession} from '../src/session.mjs';
import {trainInteraction,trainPrompt,trainWorldBlocked} from '../src/train-test.mjs';
import {LUPIN_MIDNIGHT,lupinWolf,tickLupin} from '../src/remus-lupin.mjs';

function setup(index){
 const g=new Game(()=>.5);
 g.addPlayer('keyboard','Shack explorer');g.phase='play';g.openingBoard=false;g.persist=()=>{};
 assert.ok(enterWildLands(g,{persistent:true}).ok);
 g.trainTest.preparing=false;
 g.trainTest.hogsmeade={[HOGSMEADE_SHACK.id]:{unboarded:true,broken:true},lupin:{status:'independent'}};
 const p=g.players[0];
 Object.assign(p,{x:BOGGART_CABINET.x,y:BOGGART_CABINET.y+18,faceX:0,faceY:1,equipment:{hand1:'dagger'}});
 g.enemies=[];g.random=()=> (index+.5)/BOGGART_FORMS.length;
 return {g,p};
}

const checkpoint=g=>restoreSession(JSON.parse(JSON.stringify(saveSession(g))));
const boggart=g=>g.enemies.find(e=>e.shackBoggart);
const fixtureApproach=(g,p)=>trainWorldBlocked(g,p.x,p.y,7,false,true,0,false,p);

test('all five Boggart forms use the native cabinet and only hostile forms enter combat',()=>{
 for(const [index,form] of BOGGART_FORMS.entries()){
  const {g,p}=setup(index);
  assert.match(trainPrompt(g,p),/OPEN THE BOGGART CABINET/);
  assert.equal(fixtureApproach(g,p),false);
  assert.ok(trainInteraction(g,p));
  assert.ok(g.trainTest.notice.includes(form.label));
  const state=shackBoggartState(g),enemy=boggart(g);
  if(form.id==='bunny'){
   assert.equal(enemy,undefined);
   assert.ok(state.bunnyUntil>g.trainTest.time);
   assert.equal(g.loot.length,0);
  }else{
   assert.equal(enemy.name,'Boggart');
   assert.equal(enemy.shackBoggart,form.id);
   assert.equal(enemy.kind,form.kind);
   assert.equal(enemy.faction,'enemy');
   assert.ok(inHogsmeadeBuilding(HOGSMEADE_SHACK,enemy.x,enemy.y,-7));
   assert.equal(g.blocked(enemy.x,enemy.y,13),false);
   if(form.id==='dementor')assert.equal(enemy.happinessDevourer,true);
   if(form.id==='death-eater')assert.match(enemy.equipment.head,/^death_eater_/);
   if(form.id==='werewolf')assert.equal(enemy.lupinWerewolf,undefined);
  }
  assert.ok(trainInteraction(g,p));
  assert.equal(g.enemies.length,form.id==='bunny'?0:1);
  assert.equal(g.trainTest.notice,'The Boggart is still loose.');
 }
});

test('native melee, the expedition checkpoint and the cabinet cooldown preserve just one Dark Essence drop',()=>{
 const {g:before,p:opener}=setup(0);
 assert.ok(trainInteraction(before,opener));
 const g=checkpoint(before),p=g.players[0],enemy=boggart(g);
 g.persist=()=>{};
 assert.ok(enemy?.hp>0);assert.equal(g.enemies.filter(e=>e.shackBoggart).length,1);
 Object.assign(p,{x:enemy.x,y:enemy.y+24,faceX:0,faceY:-1});
 const beforeHit=enemy.hp;
 for(let i=0;i<20&&enemy.hp>0;i++)g.resolveMelee(p,0,{damage:1,reach:1,arc:120});
 assert.ok(enemy.hp<beforeHit);assert.ok(enemy.hp<=0);
 g.tickCombatActors(.05);
 assert.deepEqual(g.loot.map(({type,qty,source})=>({type,qty,source})),[{type:'dark_essence',qty:3,source:BOGGART_LOOT}]);
 assert.ok(inHogsmeadeBuilding(HOGSMEADE_SHACK,g.loot[0].x,g.loot[0].y));
 assert.equal(g.blocked(g.loot[0].x,g.loot[0].y,7),false);
 assert.equal(g.killedCreatures?.spider,undefined);
 assert.deepEqual(g.trainTest.hogsmeade.lupin,{status:'independent'});
 const escaped=checkpoint(g),again=escaped.players[0];escaped.persist=()=>{};
 const state=shackBoggartState(escaped);
 Object.assign(again,{x:BOGGART_CABINET.x,y:BOGGART_CABINET.y+18});
 assert.equal(state.readyAt,escaped.trainTest.time+BOGGART_COOLDOWN);
 assert.match(trainPrompt(escaped,again),/QUIET/);
 assert.ok(trainInteraction(escaped,again));
 assert.equal(escaped.loot.length,1);
 escaped.tickCombatActors(.05);
 assert.equal(escaped.loot.length,1);
 escaped.trainTest.time=state.readyAt+.1;
 assert.match(trainPrompt(escaped,again),/OPEN THE BOGGART CABINET/);
});

test('the cabinet werewolf and transformed Lupin coexist and resolve independently',()=>{
 const {g,p}=setup(2);
 g.sky.elapsed=LUPIN_MIDNIGHT+1;
 tickLupin(g);
 const lupin=lupinWolf(g);
 assert.ok(lupin?.hp>0);
 assert.ok(trainInteraction(g,p));
 const enemy=boggart(g);
 assert.equal(enemy.kind,lupin.kind);
 assert.notEqual(enemy.id,lupin.id);
 const hp=lupin.hp;
 enemy.hp=0;g.tickCombatActors(.05);
 assert.equal(lupinWolf(g),lupin);
 assert.equal(lupin.hp,hp);
 assert.equal(g.trainTest.hogsmeade.remusLupin.form,'wolf');
 assert.equal(g.loot.filter(l=>l.source===BOGGART_LOOT).length,1);
});

test('the Shack floor trapdoor is passable, clickable from nearby, and stays locked',()=>{
 const {g,p}=setup(4);
 Object.assign(p,{x:SHACK_TRAPDOOR.x,y:SHACK_TRAPDOOR.y-17});
 assert.equal(g.blocked(SHACK_TRAPDOOR.x,SHACK_TRAPDOOR.y,7),false);
 assert.match(trainPrompt(g,p),/CHECK THE TRAPDOOR/);
 assert.ok(shackTrapdoorClick(g,p,SHACK_TRAPDOOR));
 assert.equal(shackTrapdoorClick(g,p,{x:SHACK_TRAPDOOR.x+26,y:SHACK_TRAPDOOR.y}),false);
 const previous={x:p.x,y:p.y,room:g.trainTest.design.activeRoom};
 assert.ok(trainInteraction(g,p));
 assert.equal(g.trainTest.notice,SHACK_TRAPDOOR_MESSAGE);
 assert.deepEqual({x:p.x,y:p.y,room:g.trainTest.design.activeRoom},previous);
 assert.equal(shackBoggartState(g),undefined);
 Object.assign(p,hogsmeadeDoor(HOGSMEADE_SHACK));
 assert.equal(shackTrapdoorClick(g,p,SHACK_TRAPDOOR),false);
});
