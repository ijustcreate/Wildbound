import assert from 'node:assert/strict';
import test from 'node:test';
import {
  greyhavenMimActive, greyhavenMimBlocked, greyhavenMimComplete, greyhavenMimPrompt,
  greyhavenMimSubjects, interactGreyhavenMim, startGreyhavenMim, tickGreyhavenMim,
} from '../src/greyhaven-mim.mjs';
import {castleInteriorBlocked, toCastleWorld} from '../src/wild-castle.mjs';

function visit() {
  const heroes = [1, 2, 3].map(id => ({id, hp: 100, ...toCastleWorld({x: 480, y: id === 3 ? 450 : 288})}));
  const g = {trainTest: {time: 0, design: {wildLands: true, activeRoom: 'castle-greyhaven-3'}},
    players: heroes, hurt: (p, amount) => { p.hp -= amount; }, persist: () => { g.saved = true; }};
  const walk = (p, x, y) => {
    const q = toCastleWorld({x, y});
    assert.equal(castleInteriorBlocked(3, q.x, q.y, 7), false, `expected a walkable spot at (${x}, ${y})`);
    assert.equal(greyhavenMimBlocked(g, q.x, q.y, 7), false);
    Object.assign(p, q);
  };
  const tick = seconds => {
    for (let elapsed = 0; elapsed < seconds - 1e-7; elapsed += .05) {
      const dt = Math.min(seconds - elapsed, .05);
      g.trainTest.time += dt;
      tickGreyhavenMim(g, dt);
    }
  };
  return {g, heroes, walk, tick};
}

test('Mim can dodge the lantern, yank the crocks and smash both screens in a two-player duel', () => {
  const {g, heroes: [p, partner, passerby], walk, tick} = visit();
  p.ui = {shop: 'npc-dialogue'};
  assert.equal(startGreyhavenMim(g, p), true);
  assert.equal(p.ui, null);
  assert.equal(greyhavenMimActive(g), true);
  assert.equal(greyhavenMimSubjects(g, 2).length, 0);
  walk(p, 480, 343);
  assert.equal(greyhavenMimPrompt(g, p), 'WAIT FOR THE MOTH TO SETTLE');
  assert.equal(interactGreyhavenMim(g, p), true);
  assert.match(g.trainTest.notice, /darts clear/);

  tick(3.1);
  assert.equal(greyhavenMimPrompt(g, p), 'FLASH THE LANTERN NOW');
  assert.equal(interactGreyhavenMim(g, p), true);
  tick(3.1);
  assert.equal(greyhavenMimPrompt(g, p), 'FLASH THE LANTERN NOW');
  assert.equal(interactGreyhavenMim(g, p), true);
  assert.match(g.trainTest.notice, /rattle a crock/i);

  walk(p, 429, 300);
  assert.equal(greyhavenMimPrompt(g, p), 'RATTLE THE CROCK');
  assert.equal(interactGreyhavenMim(g, p), true);
  assert.equal(greyhavenMimSubjects(g, 3).length, 4);
  tick(1.05);
  assert.equal(greyhavenMimSubjects(g, 3).length, 2);
  assert.equal(greyhavenMimPrompt(g, partner), 'SNIP THE SPELL CORD');
  assert.equal(interactGreyhavenMim(g, partner), true);
  walk(p, 531, 300);
  assert.equal(interactGreyhavenMim(g, p), true);
  tick(1.05);
  assert.equal(interactGreyhavenMim(g, partner), true);

  const leftScreen = toCastleWorld({x: 416, y: 332});
  const rightScreen = toCastleWorld({x: 544, y: 332});
  assert.equal(greyhavenMimBlocked(g, leftScreen.x, leftScreen.y), true);
  assert.equal(greyhavenMimBlocked(g, leftScreen.x, leftScreen.y, 7, 28), false);
  walk(p, 416, 354);
  assert.equal(greyhavenMimPrompt(g, p), 'BAIT THE GIANT’S SLAM');
  assert.equal(interactGreyhavenMim(g, p), true);
  walk(p, 416, 391);
  tick(1.15);
  assert.equal(greyhavenMimBlocked(g, leftScreen.x, leftScreen.y), false);
  assert.equal(greyhavenMimBlocked(g, rightScreen.x, rightScreen.y), true);
  assert.equal(p.hp, 100);

  walk(p, 544, 354);
  assert.equal(interactGreyhavenMim(g, p), true);
  tick(1.15);
  assert.equal(p.hp, 80, 'a challenger who stays inside the telegraph is hit');
  assert.equal(greyhavenMimBlocked(g, rightScreen.x, rightScreen.y), false);
  assert.equal(greyhavenMimPrompt(g, partner), 'BREAK THE MOSS SIGIL');
  assert.equal(interactGreyhavenMim(g, partner), true);
  assert.equal(greyhavenMimActive(g), false);
  assert.equal(greyhavenMimSubjects(g, 3).length, 0);
  assert.equal(greyhavenMimComplete(p), true);
  assert.equal(greyhavenMimComplete(partner), true);
  assert.equal(greyhavenMimComplete(passerby), false);
  assert.equal(g.saved, true);
});

test('Mim’s duel resets on floor change and when everybody retreats', () => {
  const {g, heroes: [p, partner], walk, tick} = visit();
  assert.equal(startGreyhavenMim(g, p), true);
  assert.equal(startGreyhavenMim(g, partner), false);
  g.trainTest.design.activeRoom = 'castle-greyhaven-2';
  tick(.05);
  g.trainTest.design.activeRoom = 'castle-greyhaven-3';
  assert.equal(greyhavenMimActive(g), false);
  assert.equal(startGreyhavenMim(g, p), true);
  walk(p, 480, 460);
  walk(partner, 480, 460);
  tick(2.1);
  assert.equal(greyhavenMimActive(g), false);
  assert.equal(greyhavenMimComplete(p), false);
  assert.match(g.trainTest.notice, /calls off the duel/);
  p.ui = {shop: 'npc-dialogue'};
  assert.equal(startGreyhavenMim(g, p), false);
  assert.match(p.ui.notice, /crest rug/);
});
