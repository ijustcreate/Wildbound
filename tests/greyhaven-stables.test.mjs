import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/core.mjs';
import {enterWildLands} from '../src/wild-lands.mjs';
import {switchWildLandsLayer} from '../src/wild-lands-world.mjs';
import {toCastleWorld} from '../src/wild-castle.mjs';
import {trainInteraction, trainPrompt} from '../src/train-test.mjs';
import {greyhavenCastDialogue, greyhavenCastDialogueAction} from '../src/greyhaven-cast.mjs';
import {greyhavenStableActorHidden, greyhavenStableBlocked, greyhavenStablePrompt} from '../src/greyhaven-stables.mjs';

const course = [[18142, 2291], [18214, 2397], [18056, 2478], [17869, 2506], [17779, 2404], [17885, 2323], [18004, 2298]];
const stableProgress = p => p.npcQuests?.greyhavenStables;

function expedition() {
  const g = new Game(() => .5, {deferWorld: true});
  const p = g.addPlayer('keyboard', 'Stable hand');
  const messages = [];
  g.message = text => messages.push(text);
  g.persist = () => {};
  assert.ok(enterWildLands(g, {persistent: true}).ok);
  g.trainTest.preparing = false;
  p.invuln = 999;
  return {g, p, messages};
}

function place(p, x, y) {
  Object.assign(p, {x, y, swimming: false, groundHeight: 0, jumpHeight: 0, jumpVelocity: 0, ui: null});
}

function ector(g, p) {
  switchWildLandsLayer(g, 'castle-greyhaven-1');
  const spot = toCastleWorld({x: 382, y: 441});
  place(p, spot.x, spot.y);
  assert.match(trainPrompt(g, p), /TALK TO SIR ECTOR/);
  assert.ok(trainInteraction(g, p));
  return greyhavenCastDialogue(g, p);
}

test('Ector unlocks the stable with three ordered chores and sends the player on a different night watch', () => {
  const {g, p} = expedition();
  assert.match(ector(g, p).text, /kitchen bucket/);
  assert.ok(greyhavenCastDialogueAction(g, p, 'start'));
  assert.equal(p.ui, null);
  assert.equal(stableProgress(p).dayStep, 0);
  const bucket = toCastleWorld({x: 236, y: 227});
  place(p, bucket.x, bucket.y);
  assert.match(trainPrompt(g, p), /WATER BUCKET/);
  assert.ok(trainInteraction(g, p));
  switchWildLandsLayer(g, null);
  assert.ok(greyhavenStableBlocked(g, 17963, 2236, 6));
  assert.ok(greyhavenStableBlocked(g, 17964, 2243, 9, {x: 17964, y: 2252}));
  for (let y = 2225; y < 2251; y++) {
    assert.equal(greyhavenStableBlocked(g, 17964, y, 9, {x: 17964, y: y - 1}), false,
      'An explorer restored inside the closed gate can walk all the way out');
  }
  place(p, 18027, 2221);
  assert.equal(greyhavenStablePrompt(g, p), '');
  place(p, 17898, 2194);
  assert.match(trainPrompt(g, p), /WATER THE HORSES/);
  assert.ok(trainInteraction(g, p));
  place(p, 18027, 2221);
  assert.match(trainPrompt(g, p), /SET OUT THE HAY/);
  assert.ok(trainInteraction(g, p));
  assert.ok(stableProgress(p).stableUnlocked);
  place(p, 17964, 2254);
  assert.match(trainPrompt(g, p), /UNLOCK THE STABLE GATE/);
  assert.ok(trainInteraction(g, p));
  assert.equal(greyhavenStableBlocked(g, 17964, 2236, 6), false);
  assert.equal(ector(g, p).choices.some(choice => choice.action === 'start'), false);
  g.sky.elapsed = 350;
  p.ui = null;
  assert.match(ector(g, p).text, /storm lantern/);
  assert.ok(greyhavenCastDialogueAction(g, p, 'start'));
  switchWildLandsLayer(g, null);
  for (const [x, y, text] of [[17929, 2231, /STORM LANTERN/], [17900, 2252, /HOOFPRINTS/], [17924, 2287, /HOOFPRINTS/],
    [17981, 2282, /HOOFPRINTS/], [18051, 2248, /SOOTHE THE LOST PONY/]]) {
    place(p, x, y);
    assert.match(trainPrompt(g, p), text);
    assert.ok(trainInteraction(g, p));
  }
  place(p, 17965, 2253);
  assert.doesNotMatch(trainPrompt(g, p), /TIE BRACKEN/);
  for (let i = 0; i < 24; i++) g.update(.05, {keyboard: {}});
  const coins = p.coins;
  assert.match(trainPrompt(g, p), /TIE BRACKEN/);
  assert.ok(trainInteraction(g, p));
  assert.ok(stableProgress(p).nightDone);
  assert.equal(p.coins, coins + 10);
  assert.doesNotMatch(trainPrompt(g, p), /TIE BRACKEN/);
});

test('Kay’s mounted race follows real movement and ordered flags, with two rushed shortcuts and a one-time purse', () => {
  const {g, p, messages} = expedition();
  const turn = name => {
    place(p, 17994, 2258);
    assert.match(trainPrompt(g, p), /TALK TO KAY/, name);
    assert.ok(trainInteraction(g, p));
    assert.ok(greyhavenCastDialogueAction(g, p, 'start'));
  };
  place(p, 17994, 2258);
  assert.ok(trainInteraction(g, p));
  assert.match(greyhavenCastDialogue(g, p).text, /stable key/);
  (p.npcQuests ??= {}).greyhavenStables = {stableUnlocked: true};
  const other = g.addPlayer('gamepad-0', 'Spectator');
  place(other, 17990, 2245);
  turn('first challenge');
  assert.ok(greyhavenStableActorHidden(g, 'greyhaven-kay'));
  for (let i = 0; i < 65; i++) g.update(.05, {keyboard: {}});
  assert.match(trainPrompt(g, p), /FLAG 1 \/ 7/);
  const coins = p.coins;
  let frame = 0;
  for (const [index, [x, y]] of course.entries()) {
    while (Math.hypot(p.x - x, p.y - y) > 21 && frame < 400) {
      const gap = Math.hypot(p.x - x, p.y - y);
      g.update(.05, {keyboard: {x: (x - p.x) / gap, y: (y - p.y) / gap, attack: frame % 49 === 0}});
      frame++;
    }
    assert.ok(frame < 400, `Could not reach flag ${index + 1} from (${p.x}, ${p.y})`);
  }
  assert.ok(messages.some(text => text.includes('wet grass')));
  assert.ok(messages.some(text => text.includes('loose rail')));
  assert.ok(stableProgress(p).bestRace < 7);
  assert.equal(p.coins, coins + 20);
  assert.equal(greyhavenStableActorHidden(g, 'greyhaven-kay'), false);
  assert.equal(stableProgress(other)?.bestRace, undefined);
  turn('repeat challenge');
  g.update(.05, {keyboard: {interact: true}});
  assert.equal(greyhavenStableActorHidden(g, 'greyhaven-kay'), false);
  assert.equal(p.coins, coins + 20);
});
