import assert from 'node:assert/strict';
import test from 'node:test';
import {npcDialogueAction, npcDialogueView} from '../src/npc-quests.mjs';
import {trainInteraction, trainPrompt} from '../src/train-test.mjs';
import {castleDrawbridgeProjection} from '../src/wild-castle-drawbridge-art.mjs';
import {castleInteriorBlocked, toCastleWorld} from '../src/wild-castle.mjs';
import {castleResidents, tickCastleResidents} from '../src/wild-castle-residents.mjs';
import {GREYHAVEN} from '../src/wild-castle-site.mjs';

function visit(elapsed, story) {
  const p = {id: 1, name: 'Explorer', hp: 10, device: 'keyboard', x: 0, y: 0, inventory: []};
  const g = {time: 0, sky: {elapsed}, players: [p],
    trainTest: {design: {wildLands: true, activeRoom: `castle-greyhaven-${story}`}}};
  return {g, p};
}

function find(g, name) {
  return [1, 2, 3].flatMap(story => castleResidents(g, story)).find(actor => actor.name === name);
}

test('Merlin and Wart walk the daily rounds and Archimedes follows between floors', () => {
  const {g} = visit(470, 1);
  const phases = [
    [470, 1, 'Kitchen', 2, 'Gallery bedchamber'],
    [40, 2, 'Gallery library', 1, 'Great Hall practice floor'],
    [170, 3, 'High Solar study', 3, 'High Solar study'],
    [270, 1, 'Gate landing', 1, 'Banquet room'],
    [340, 3, 'Orb chamber', 2, 'West gallery rail'],
  ];
  const merlin = find(g, 'Merlin'), wart = find(g, 'Wart'), owl = find(g, 'Archimedes');
  let sawWalking = false;
  let sawFlight = false;
  for (const [elapsed, merlinFloor, merlinPlace, wartFloor, wartPlace] of phases) {
    g.sky.elapsed = elapsed;
    for (let i = 0; i < 640; i++) {
      g.time += .1;
      tickCastleResidents(g, .1);
      for (const actor of [merlin, wart]) {
        const {x, y} = toCastleWorld(actor);
        assert.equal(castleInteriorBlocked(actor.story, x, y, actor.radius), false);
      }
      assert.equal(owl.story, merlin.story);
      sawWalking ||= merlin.moving && merlin.movementGait === 'walk';
      sawFlight ||= owl.owlPhase === 'fly';
    }
    assert.equal(merlin.story, merlinFloor);
    assert.equal(merlin.routine[merlin.index].place, merlinPlace);
    assert.equal(wart.story, wartFloor);
    assert.equal(wart.routine[wart.index].place, wartPlace);
    assert.ok(Math.hypot(owl.x - merlin.x, owl.y - merlin.y) < 35);
  }
  assert.equal(owl.owlVariant, 'archimedes');
  assert.ok(sawWalking && sawFlight);
});

test('Greyhaven dialogue uses the railway interaction and grants each gift once per hero', () => {
  const {g, p} = visit(40, 1);
  const wart = find(g, 'Wart');
  Object.assign(p, toCastleWorld({x: wart.x + 20, y: wart.y + 4}));
  assert.match(trainPrompt(g, p), /TALK TO WART/);
  assert.equal(trainInteraction(g, p, []), true);
  assert.equal(npcDialogueView(g, p).title, 'Great Hall practice floor');
  npcDialogueAction(g, p, 'choice:0');
  assert.match(npcDialogueView(g, p).text, /Turn at the hip/);
  p.inventory = Array.from({length: 32}, () => ({type: 'sword', qty: 1}));
  npcDialogueAction(g, p, 'gift');
  assert.match(p.ui.notice, /Make room/);
  assert.equal(p.npcQuests, undefined);
  p.inventory[0] = null;
  npcDialogueAction(g, p, 'gift');
  assert.equal(p.inventory[0].type, 'greyhaven_practice_sword');
  assert.ok(p.npcQuests.greyhavenGifts.greyhaven_practice_sword);
  assert.equal(npcDialogueView(g, p).choices.some(choice => choice.action === 'gift'), false);
  npcDialogueAction(g, p, 'watch');
  assert.equal(p.ui, null);
  tickCastleResidents(g, .023);
  assert.equal(wart.animationAction, 'slash');
});

test('the moving span meets the stone bridge flat and swings up through its edge', () => {
  const open = castleDrawbridgeProjection(0), moving = castleDrawbridgeProjection(.5);
  const raised = castleDrawbridgeProjection(1);
  assert.equal(open.tipY, GREYHAVEN.drawbridge.bottom);
  assert.ok(moving.tipY < open.tipY && moving.tipY > raised.tipY);
  assert.ok(raised.tipY < GREYHAVEN.drawbridge.top);
  assert.ok(moving.lift > 1 && raised.depth < 0);
});
