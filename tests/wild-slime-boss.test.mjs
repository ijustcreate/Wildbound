import assert from 'node:assert/strict';
import test from 'node:test';
import {Game} from '../src/core.mjs';
import {damageEnemy} from '../src/enemy-damage.mjs';
import {befriendCreature} from '../src/friendly-creatures.mjs';
import {playerCombatTargets} from '../src/succubus-charm.mjs';
import {enterWildLands} from '../src/wild-lands.mjs';
import {WILD_SLIME_HOLLOW as hollow} from '../src/wild-slime-hollow-site.mjs';

function setup(){
  const game=new Game(()=>.45,{deferWorld:true});
  const player=game.addPlayer('keyboard','Explorer');
  const partner=game.addPlayer('pad:0','Partner');
  assert.ok(enterWildLands(game,{persistent:true}).ok);
  Object.assign(player,{x:hollow.x,y:hollow.y+150});
  Object.assign(partner,{x:hollow.x,y:hollow.y+hollow.radius+28});
  game.update(.05,{});
  const boss=game.enemies.find(e=>e.wildSlimeRole==='boss');
  assert.equal(boss?.wildSlimeMove.phase,'entry');
  return {game,player,partner,boss};
}

function advance(game,condition){
  for(let i=0;i<140&&!condition();i++)game.update(.05,{});
  assert.ok(condition(),'The encounter reached the expected phase in the game loop');
}

test('Mireheart drops in immune and releases four hostile slimes at the end of the entrance',()=>{
  const {game,player,boss}=setup();
  const adds=game.enemies.filter(e=>e.wildSlimeRole==='add');
  assert.equal(adds.length,4);
  assert.ok(boss.jumpHeight>120);
  assert.ok(!playerCombatTargets(game,player).includes(boss));
  assert.equal(damageEnemy(boss,50,'fire'),0);
  const fullHealth=boss.hp;
  Object.assign(player,{x:boss.x,y:boss.y+56,faceX:0,faceY:-1});
  game.resolveMelee(player,0,{damage:1});
  assert.equal(boss.hp,fullHealth,'Ground melee cannot damage the entrance animation');
  const spots=adds.map(e=>[e.x,e.y]);
  advance(game,()=>boss.wildSlimeMove.elapsed>=.55);
  assert.ok(boss.jumpHeight<60);
  assert.deepEqual(adds.map(e=>[e.x,e.y]),spots);
  advance(game,()=>boss.wildSlimeMove.phase==='ready');
  assert.equal(boss.jumpHeight,0);
  assert.ok(playerCombatTargets(game,player).includes(boss));
  Object.assign(player,{x:boss.x,y:boss.y+56,faceX:0,faceY:-1});
  game.resolveMelee(player,0,{damage:1});
  assert.ok(boss.hp<fullHealth,'The normal melee path reaches the enlarged body');
  for(const slime of [boss,...adds])assert.equal(befriendCreature(slime,player.id),false);
  advance(game,()=>adds.some((e,i)=>e.x!==spots[i][0]||e.y!==spots[i][1]));
});

test('The slam locks its footprint, misses a sidestep, and damages only a grounded player at the landing',()=>{
  const {game,player,partner,boss}=setup();
  const hits=[];
  const hurt=game.hurt.bind(game);
  game.hurt=(p,amount,source,options)=>{
    if(source===boss)hits.push(p.id);
    return hurt(p,amount,source,options);
  };
  advance(game,()=>boss.wildSlimeMove.phase==='windup');
  const aim={...boss.wildSlimeMove.target};
  assert.deepEqual(aim,{x:player.x,y:player.y});
  player.x-=86;
  Object.assign(partner,aim);
  advance(game,()=>boss.wildSlimeMove.phase==='slam');
  assert.deepEqual(boss.wildSlimeMove.target,aim);
  assert.equal(hits.length,0,'Air travel cannot damage the player');
  advance(game,()=>boss.wildSlimeMove.phase==='recover');
  assert.deepEqual(hits,[partner.id]);
  assert.ok(partner.hp<partner.maxHp);
  assert.deepEqual(boss.wildSlimeMove.target,aim);
  assert.ok(Math.hypot(boss.x-aim.x,boss.y-aim.y)<boss.hitRadius);
  for(let i=0;i<16;i++)game.update(.05,{});
  assert.equal(boss.wildSlimeMove.phase,'recover');
  assert.deepEqual(hits,[partner.id]);
});

test('An arena trap interrupts the windup and expends the trap without capturing Mireheart',()=>{
  const {game,boss}=setup();
  advance(game,()=>boss.wildSlimeMove.phase==='windup');
  game.traps.push({x:boss.x,y:boss.y,life:10,capture:1});
  game.update(.05,{});
  assert.equal(game.traps.length,0);
  assert.equal(boss.wildSlimeMove.phase,'recover');
  assert.equal(boss.state,'recover');
  assert.ok(boss.hp>0);
});
