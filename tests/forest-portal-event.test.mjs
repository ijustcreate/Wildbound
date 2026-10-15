import test from 'node:test';
import assert from 'node:assert/strict';
import {registerHooks} from 'node:module';

// The landscape renderer has unrelated missing imports in this checkout. The
// round-trip state test needs only its reconstruction boundary.
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === './forest-landscape.mjs' && context.parentURL?.endsWith('/forest-portal-event.mjs'))
      return {url:'data:text/javascript,export function restoreForestLandscape(){}',shortCircuit:true};
    return nextResolve(specifier, context);
  },
});
const {openForestPortal,travelThroughForestPortal} = await import('../src/forest-portal-event.mjs');
const {Game} = await import('../src/core.mjs');

class TestGame {
  constructor() {
    this.phase = 'play'; this.players = []; this.portals = [];
    this.nextId = 10; this.seed = 17; this.mapMode = 'bounded';
    this.environment = 'forest'; this.generatedEnvironment = 'forest';
    this.forestLandscapeVersion = 0; this.explored = new Set();
    this.log = []; this.boardProgress = 2; this.openingBoard = true;
    this.difficulty = 'adventure'; this.diceCount = 2;
    this.persist = () => {}; this.random = Math.random;
  }
  blocked() { return false; }
  message(message) { this.log.unshift(message); }
  start() { this.phase = 'play'; this.portals = []; this.boardProgress = 0; return true; }
}

test('dev portal carries the live party into a saved forest and back to its board', () => {
  const game = new TestGame();
  const player = {id:1,name:'Scout',hp:50,x:740,y:800,faceX:1,faceY:0,inventory:[{type:'map'}]};
  game.players = [player];
  assert.equal(openForestPortal(game, player.id).ok, true);
  assert.equal(game.openingBoard, false);
  const outbound = game.portals[0];
  assert.equal(outbound.forestTravel, 'outbound');
  assert.equal(outbound.closing, null);
  assert.equal(openForestPortal(game, player.id).ok, false);

  assert.equal(travelThroughForestPortal(game, outbound), true);
  assert.equal(game.mapMode, 'boundless');
  assert.equal(game.players[0], player);
  assert.equal(game.portals[0].forestTravel, 'return');
  assert.equal(game.portals[0].closing, null);
  game.boardProgress = 7;
  player.inventory.push({type:'gem'});
  assert.equal(travelThroughForestPortal(game, game.portals[0]), true);
  assert.equal(game.mapMode, 'bounded');
  assert.equal(game.boardProgress, 2);
  assert.deepEqual([player.x,player.y], [740,800]);
  assert.equal(player.inventory[1].type, 'gem');
  assert.equal(game.portals[0].forestTravel, 'outbound');
  assert.deepEqual(game.portals[0].entryReady, []);

  assert.equal(travelThroughForestPortal(game, game.portals[0]), true);
  assert.equal(game.mapMode, 'boundless');
  assert.equal(game.boardProgress, 7);
});

test('touching a Heartwood portal performs a world transition instead of opening an empty room', () => {
  const game = new Game(() => .5);
  const player = game.addPlayer('server:1', 'Scout');
  game.start();
  game.openingBoard = false;
  player.x = 740;
  player.y = 800;
  assert.equal(openForestPortal(game, player.id).ok, true);
  const outbound = game.portals[0];
  player.x = outbound.x;
  player.y = outbound.y;
  assert.equal(game.enterRoom(player, outbound), true);
  assert.equal(game.mapMode, 'boundless');
  assert.equal(player.room, null);
  assert.equal(game.portals[0].forestTravel, 'return');
});
