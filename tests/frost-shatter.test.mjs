import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/core.mjs';
import {damageEnemy} from '../src/enemy-damage.mjs';
import {applyCombatFrost} from '../src/frost-shatter.mjs';
import {knownWeaponCombos} from '../src/weapon-combo-discovery.mjs';

function setup() {
  const game = new Game(() => 0.9);
  const player = game.addPlayer('keyboard');
  game.start();
  game.time = 20;
  game.openingBoard = false;
  game.weather = null;
  game.scenery = [];
  game.enemies = [];
  game.ghosts = [];
  game.terrain.fill('grass');
  game.house = null;
  game.onSound = () => {};
  game.persist = () => {};
  Object.assign(player, {
    x: 600, y: 600, faceX: 1, faceY: 0, hp: 100, mana: 100,
    equipment: {hand1: 'sword'},
  });
  const actor = (flags = {}) => {
    const enemy = {id: game.nextId++, kind: 'skeleton', x: 638, y: 600, hp: 250, maxHp: 250, ...flags};
    game.enemies.push(enemy);
    return enemy;
  };
  return {game, player, actor};
}

test('an ordinary spell keeps its chance while a charged ice spell primes its target through real projectile contact', () => {
  const {game, player, actor} = setup();
  player.equipment.hand1 = 'ice_wand';
  const target = actor({x: 680});
  for (const charge of [0, 1.2]) {
    assert.equal(game.fireSpell(player, charge), true);
    const bolt = game.spells.at(-1);
    target.x = bolt.x + bolt.vx / 5;
    target.y = bolt.y + bolt.vy / 5;
    for (let i = 0; i < 12 && game.spells.length; i++) game.tickProjectiles(0.025);
    assert.equal(target.frozen || 0, charge ? 2.4 : 0);
  }
  assert.ok(target.hp < target.maxHp);
});

test('only a true heavy melee hit breaks ice and consumes one freeze', () => {
  const {game, player, actor} = setup();
  const frozen = actor({frozen: 2, enemyMind: {threat: [], resistUntil: game.time + 5}});
  const context = {g: game, p: player};
  assert.equal(damageEnemy(frozen, 20, 'physical', {...context, melee: true}), 20);
  assert.equal(damageEnemy(frozen, 20, 'physical', {...context, heavy: true}), 20);
  assert.equal(frozen.frozen, 2);
  assert.equal(damageEnemy(frozen, 20, 'physical', {...context, melee: true, heavy: true}), 33);
  assert.equal(frozen.frozen, 0);
  assert.equal(damageEnemy(frozen, 20, 'physical', {...context, melee: true, heavy: true}), 20);
  assert.equal(game.effects.filter(effect => effect.gameplayFx === 'ice-break').length, 1);
});

test('real sword melee routes into shatter, and the burst assigns kill credit', () => {
  const {game, player, actor} = setup();
  const target = actor({frozen: 1.5});
  const neighbor = actor({x: 700, hp: 2});
  player.attackClip = 'swipe_big';
  game.resolveMelee(player, 1, {damage: 1});
  assert.equal(target.frozen, 0);
  assert.equal(neighbor.hp, 0);
  assert.equal(neighbor.killedBy, player.id);
  assert.equal(neighbor.ritualKill, false);
});

test('shards cap targets and respect walls, elevations, ownership and spawn protection', () => {
  const {game, player, actor} = setup();
  const origin = actor({frozen: 2});
  const allies = [actor({x: 647, allyOwner: 0}), actor({x: 650, owner: 0}), actor({x: 655, faction: 'neutral'}), actor({x: 649, room: 'elsewhere'})];
  const unreachable = [actor({x: 710}), actor({x: 657, jumpHeight: 25}), actor({x: 651, spawnReadyAt: game.time + 1})];
  const crowd = Array.from({length: 7}, (_, i) => actor({x: 651 + i * 4}));
  game.projectileBlocked = (x, y) => x > 700 && x < 705 && y === 600;
  damageEnemy(origin, 40, 'physical', {g: game, p: player, melee: true, heavy: true});
  assert.ok(crowd.slice(0, 4).every(enemy => enemy.hp < enemy.maxHp && enemy.frozen > 0));
  assert.ok(crowd.slice(4).every(enemy => enemy.hp === enemy.maxHp));
  assert.ok([...allies, ...unreachable].every(enemy => enemy.hp === enemy.maxHp));
});

test('cold spreads to the next attack, preserves jungle vines, and rewards boss setups modestly', () => {
  const {game, player, actor} = setup();
  const vine = actor({frozen: 2, jumanjiVines: 2});
  const heavy = {g: game, p: player, melee: true, heavy: true};
  assert.equal(damageEnemy(vine, 20, 'physical', heavy), 20);
  assert.equal(vine.frozen, 2);
  const boss = actor({x: 676, kind: 'skeleton_boss', frozen: 2, jumanjiVines: 0.75});
  const neighbor = actor({x: 700});
  assert.equal(damageEnemy(boss, 20, 'physical', heavy), 25);
  assert.equal(boss.frozen, 0.75);
  assert.equal(damageEnemy(neighbor, 20, 'physical', heavy), 20);
  assert.equal(neighbor.frozen, 1.25);
  game.time += 0.25;
  assert.equal(damageEnemy(neighbor, 20, 'physical', heavy), 33);
  assert.equal(neighbor.frozen, 0);
});

test('a partner’s real frost and fire spells trigger thermal shock once and credit both explorers', () => {
  const {game, player, actor} = setup();
  const partner = game.addPlayer('pad:0', 'Ember');
  Object.assign(partner, {x:600,y:600,faceX:1,faceY:0,hp:100,mana:100,equipment:{hand1:'fire_wand'}});
  player.equipment.hand1='ice_wand';
  const enemy = actor({x:690,jumanjiVines:0.6});
  const cast = (who, charge) => {
    assert.ok(game.fireSpell(who,charge));
    const bolt = game.spells.at(-1);
    enemy.x=bolt.x+bolt.vx/5;
    enemy.y=bolt.y+bolt.vy/5;
    for(let i=0;i<16&&game.spells.length;i++)game.tickProjectiles(0.025);
  };
  cast(player,1.2);
  assert.ok(enemy.frozen>1.6);
  const health=enemy.hp;
  cast(partner,0);
  assert.equal(enemy.frozen,0.6);
  assert.ok(enemy.hp<health&&enemy.enemyFlinchUntil>game.time);
  assert.ok(game.effects.some(effect=>effect.gameplayFx==='thermal-burst'));
  assert.deepEqual(knownWeaponCombos(player),['team_elements']);
  assert.deepEqual(knownWeaponCombos(partner),['thermal_shock','team_elements']);
  cast(partner,0);
  assert.equal(game.effects.filter(effect=>effect.gameplayFx==='thermal-burst').length,1);
});

test('a real flaming arrow reaction obeys shield, area, alliance and boss restrictions', () => {
  const {game, player, actor} = setup();
  const fire = {g:game,p:player,shot:{owner:player.id,flameDistance:99,vx:300,vy:0}};
  const guarded = actor({faceX:-1,faceY:0,combatRole:'shield',tactics:{phase:'approach'}});
  const ally = actor({friendly:true});
  const foreign = actor({room:'other'});
  const boss = actor({kind:'skeleton_boss',boss:true});
  for(const target of [guarded,ally,foreign,boss]) applyCombatFrost(game,target,2,player.id);
  for(const target of [guarded,ally,foreign]) {
    damageEnemy(target,20,'physical',fire);
    assert.equal(target.frozen,2);
  }
  assert.equal(damageEnemy(boss,50,'physical',fire),59);
  assert.equal(boss.frozen,0);
  assert.equal(boss.enemyFlinchUntil,undefined);
  assert.deepEqual(knownWeaponCombos(player),['thermal_shock']);
});
