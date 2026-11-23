import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/core.mjs';
import {TvWildbound} from '../src/tv-wildbound.mjs';
import {arenaLoadout,startEncounter} from '../src/tv-arena-run.mjs';
import {recoverTvDrops} from '../src/tv-recovery.mjs';
import {merchantAction,merchantPurchaseReason} from '../src/traveling-merchant.mjs';
import {tickSpeciesCombat} from '../src/enemy-species-combat.mjs';
import {navigateEnemy} from '../src/navigation.mjs';
import {BACKPACK_SLOTS,ITEMS} from '../src/items.mjs';

const hero=id=>({id,name:id,inventory:[],equipment:{}});
function arena(owners=[hero('one')]){
  const mode=new TvWildbound(owners,17);
  mode.intro=2.8;
  return mode;
}
const filledBag=()=>Array.from({length:BACKPACK_SLOTS},()=>({type:'sword',qty:1}));

test('TV victory returns distinct drops once and keeps full bag overflow through a profile round trip',()=>{
  const one=hero('one'),two=hero('two'),mode=arena([one,two]);
  two.inventory=filledBag();
  mode.dropItem(one.id,'iron_sword',1,{sockets:['dark_essence']});
  mode.dropItem(two.id,'caught_snowy_owl',1,{captureContainer:'critter_cage'});
  mode.finish();
  mode.finish();
  mode.releaseOwnedDrops();
  assert.deepEqual(one.inventory,[{type:'iron_sword',qty:1,sockets:['dark_essence']}]);
  assert.equal(mode.loot.length,0);
  assert.equal(two.npcQuests.tvArena.items.length,1);
  const restored=JSON.parse(JSON.stringify(two));
  restored.inventory[9]=null;
  assert.equal(recoverTvDrops(restored),true);
  assert.deepEqual(restored.inventory[9],{type:'caught_snowy_owl',qty:1,captureContainer:'critter_cage'});
  assert.equal(recoverTvDrops(restored),false);
});

test('a teammate picking up a live TV drop removes it from the original owner’s recovery',()=>{
  const one=hero('one'),two=hero('two'),mode=arena([one,two]);
  mode.dropItem(one.id,'iron_sword');
  const actor=mode.players.get(two.id),item=mode.loot[0];
  Object.assign(item,{x:actor.x,y:actor.y-20,age:.6,vy:0});
  mode.step(.05,{two:{loot:true}});
  mode.finish();
  assert.deepEqual(one.inventory,[]);
  assert.deepEqual(two.inventory,[{type:'iron_sword',qty:1}]);
});

test('an unavailable TV player does not block a spawn and a camper triggers an alternate spawn',()=>{
  for(const disconnected of [true,false]){
    const one=hero('one'),two=hero('two'),mode=arena([one,two]);
    const blocked=mode.enemySpawns[0],camper=mode.players.get(two.id);
    Object.assign(camper,{x:blocked.x,y:blocked.y});
    two.lobbyDisconnected=disconnected;
    startEncounter(mode,1,one.id);
    mode.waveQueue=[{spawnId:blocked.id,kind:'bramblecap',delay:0}];
    for(let frame=0;frame<45&&mode.waveQueue.length;frame++)mode.step(.05);
    assert.equal(mode.waveQueue.length,0);
    assert.equal(mode.enemies.length,1);
    assert.equal(mode.enemies[0].home===blocked.x,disconnected);
    two.lobbyDisconnected=false;
    mode.enemies[0].emerging=0;
    mode.defeat(mode.enemies[0]);
    mode.step(.05);
    assert.equal(mode.roundsCleared,1);
  }
});

test('TV camera follows the connected explorer in either direction and retains focus on distant reconnect',()=>{
  for(const [activeX,inactiveX] of [[2400,200],[200,2400]]){
    const one=hero('one'),two=hero('two'),mode=arena([one,two]);
    mode.players.get(one.id).x=inactiveX;
    mode.players.get(two.id).x=activeX;
    one.lobbyDisconnected=true;
    mode.step(.05);
    assert.ok(mode.camera<=activeX&&mode.camera+960>=activeX);
    one.lobbyDisconnected=false;
    mode.step(.05);
    assert.ok(mode.camera<=activeX&&mode.camera+960>=activeX);
  }
});

test('fast feet crossing a creature before floor collision stomp without converting side contact',()=>{
  const owner=hero('one'),mode=arena([owner]),p=mode.players.get(owner.id);
  const enemy=mode.spawnAt({x:300,y:437,face:-1},'bramblecap');
  enemy.emerging=0;
  Object.assign(p,{x:300,y:397,vy:750,grounded:false,invulnerable:0});
  mode.step(.05);
  assert.equal(enemy.alive,false);
  assert.equal(p.hp,3);
  assert.ok(p.vy<0);
  const side=mode.spawnAt({x:300,y:437,face:-1},'bramblecap');
  side.emerging=0;
  Object.assign(p,{x:300,y:437,vy:0,grounded:true,invulnerable:0});
  mode.step(.05);
  assert.equal(side.alive,true);
  assert.equal(p.hp,2);
});

test('TV rifle makes a bounded arena shot, uses only arena ammunition and hits a distant target',()=>{
  const owner=hero('one');
  owner.equipment.hand1='rifle';
  owner.inventory=[{type:'cartridge',qty:3}];
  const mode=arena([owner]),p=mode.players.get(owner.id);
  Object.assign(p,{x:1000,y:437});
  const enemy=mode.spawnAt({x:1210,y:437,face:-1},'bramblecap');
  Object.assign(enemy,{emerging:0,speed:0});
  assert.equal(arenaLoadout(mode,p).role,'rifle');
  assert.equal(mode.attack(p),true);
  assert.equal(mode.projectiles[0].kind,'rifle');
  assert.equal(p.arenaAmmo,3);
  assert.equal(owner.inventory[0].qty,3);
  for(let i=0;i<10;i++)mode.step(.05);
  assert.equal(enemy.alive,false);
});

test('merchant quote and purchase use existing stack room and reject a quantity that cannot fit',()=>{
  const g=new Game(),p=g.addPlayer('keyboard');
  p.inventory=filledBag();
  p.inventory[0]={type:'potion',qty:ITEMS.potion.stack-1};
  p.coins=25;
  p.ui={shop:'merchant',panel:'stock',index:0};
  const listing={item:{type:'potion',qty:1},price:5};
  g.merchant={x:p.x,y:p.y,stock:[listing],revision:0};
  assert.equal(merchantPurchaseReason(p,listing.item,listing.price),'');
  merchantAction(g,p,'use');
  assert.equal(p.inventory[0].qty,ITEMS.potion.stack);
  assert.equal(p.coins,20);
  assert.match(merchantPurchaseReason(p,listing.item,listing.price),/space/i);
  merchantAction(g,p,'use');
  assert.equal(p.coins,20);
});

const actor=(kind,overrides={})=>({id:9,kind,x:550,y:400,hp:100,maxHp:100,speed:40,damage:8,cooldown:0,state:'hunt',faceX:-1,faceY:0,...overrides});
const target=(id,x)=>({id,x,y:400,hp:100,maxHp:100});
function combat(e,players=[target(1,400)]){
  return {time:0,nextId:10,players,enemies:[e],traps:[],loot:[],arrows:[],bananas:[],effects:[],blocked:()=>false,projectileBlocked:()=>false,
    moveActor(a,dx,dy){a.x+=dx;a.y+=dy;return Math.hypot(dx,dy);},
    hurt(p,damage){p.hp-=damage;}
  };
}

test('Flash Decoy staggers a standard species and Trapper applies to species and legacy navigation',()=>{
  const lion=actor('lion'),g=combat(lion);
  g.traps=[{x:lion.x,y:lion.y,life:5,variant:'interrupt'}];
  tickSpeciesCombat(g,lion,.05,g.players);
  assert.equal(lion.speciesCombat.phase,'recover');
  assert.equal(lion.timer,1.8);
  for(let i=0;i<40;i++)tickSpeciesCombat(g,lion,.05,g.players);
  assert.equal(lion.hp,100);
  for(const kind of ['lion','panther']){
    const enemy=actor(kind),world=combat(enemy);
    world.traps=[{x:enemy.x,y:enemy.y,life:5,variant:'capture',capture:.75}];
    if(kind==='lion')tickSpeciesCombat(world,enemy,.05,world.players);
    else navigateEnemy(world,enemy,world.players[0],.05);
    assert.equal(enemy.state,'snared');
    assert.equal(enemy.timer,1.5);
  }
});

test('standard monkey telegraphs and throws once, while freeze cancels the next windup',()=>{
  const e=actor('monkey'),g=combat(e);
  tickSpeciesCombat(g,e,.05,g.players);
  assert.ok(e.pendingBanana);
  assert.equal(g.bananas.length,0);
  for(let i=0;i<6;i++)tickSpeciesCombat(g,e,.05,g.players);
  assert.equal(g.bananas.length,1);
  assert.ok(g.bananas[0].vx<0);
  Object.assign(e,{throwTime:0,bananaTimer:0});
  tickSpeciesCombat(g,e,.05,g.players);
  assert.ok(e.pendingBanana);
  e.frozen=.6;
  tickSpeciesCombat(g,e,.05,g.players);
  assert.equal(e.pendingBanana,null);
  assert.equal(g.bananas.length,1);
});

test('standard archer resupplies early and cannot redirect a committed shot to a distant explorer',()=>{
  const e=actor('archer',{arrowsLeft:2,startingArrows:36}),g=combat(e,[target(1,400),target(2,1200)]);
  g.loot=[{type:'arrow',qty:12,x:e.x+5,y:e.y}];
  tickSpeciesCombat(g,e,.05,g.players);
  assert.equal(e.arrowsLeft,14);
  assert.equal(g.loot.length,0);
  tickSpeciesCombat(g,e,.05,g.players);
  assert.equal(e.speciesCombat.phase,'windup');
  g.players[0].hp=0;
  for(let i=0;i<18;i++)tickSpeciesCombat(g,e,.05,[g.players[1]]);
  assert.equal(g.arrows.length,0);
  assert.equal(e.arrowsLeft,14);
});

test('melee only spends a dark essence rune from a contributing weapon hand',()=>{
  for(const offhand of ['starter_wand','dagger']){
    const g=new Game(()=>.5),p=g.addPlayer('keyboard');
    g.phase='play';g.openingBoard=false;g.scenery=[];g.terrain.fill('grass');
    Object.assign(p,{x:400,y:400,faceX:1,faceY:0,hp:p.maxHp-30,equipment:{hand1:'sword',hand2:offhand},equipmentSockets:{hand2:['dark_essence']}});
    const enemy=actor('lion',{x:430}),before=p.hp;
    g.enemies=[enemy];
    g.resolveMelee(p,0,{damage:1});
    assert.ok(enemy.hp<100);
    assert.equal(p.hp>before,offhand==='dagger');
    assert.equal(p.equipmentSockets.hand2.length,offhand==='dagger'?0:1);
  }
});
