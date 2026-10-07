import test from 'node:test';
import assert from 'node:assert/strict';
import { createLobbySettingsControllerRouter } from '../src/lobby-settings-controller.mjs';
import { controllerFamily, controllerButtonNames } from '../src/controls.mjs';

const pad = (index = 0, id = 'Xbox Wireless Controller') => ({
  index, id, mapping: 'standard', axes: [0, 0, 0, 0],
  buttons: Array.from({ length: 17 }, () => ({ pressed: false })),
});
const settings = ownerDevice => ({ id: 'settings-dialog', dataset: { ownerDevice } });

for (const [screen, id, family, startName] of [
  ['home', 'Xbox Wireless Controller', 'xbox', 'Menu'],
  ['lobby', 'Nintendo Switch Pro Controller', 'switch', '+'],
]) {
  test(`${screen}: ${family} Start/${startName} opens settings once and requires release to close`, () => {
    const router = createLobbySettingsControllerRouter(), p = pad(0, id);
    p.buttons[9].pressed = true;
    assert.equal(controllerFamily(p), family);
    assert.equal(controllerButtonNames(p)[9], startName);
    assert.equal(router.route({ pad: p, screen }), 'open');
    // Even a stale edge snapshot cannot re-toggle an opening press.
    for (let frame = 0; frame < 10; frame++)
      assert.equal(router.route({ pad: p, screen, dialog: settings('pad:0') }), 'consume');
    p.buttons[9].pressed = false;
    assert.equal(router.route({ pad: p, screen, dialog: settings('pad:0') }), 'navigate');
    p.buttons[9].pressed = true;
    assert.equal(router.route({ pad: p, screen, dialog: settings('pad:0') }), 'close');
    assert.equal(router.route({ pad: p, screen }), 'consume');
  });
}

test('Two controllers cannot navigate or close each other’s settings, including keyboard ownership', () => {
  const router = createLobbySettingsControllerRouter(), p = pad(1, 'Nintendo Switch Pro Controller');
  for (const owner of ['pad:0', 'keyboard']) {
    p.buttons[9].pressed = false;
    assert.equal(router.route({ pad: p, screen: 'lobby', dialog: settings(owner) }), 'consume');
    p.buttons[9].pressed = true;
    assert.equal(router.route({ pad: p, screen: 'lobby', dialog: settings(owner) }), 'consume');
  }
});

test('A combined Start/accept/direction press remains consumed until buttons and sticks are neutral', () => {
  const router = createLobbySettingsControllerRouter(), p = pad();
  p.buttons[9].pressed = p.buttons[0].pressed = true;
  p.axes[0] = 1;
  assert.equal(router.route({ pad: p, screen: 'lobby' }), 'open');
  p.buttons[9].pressed = false;
  assert.equal(router.route({ pad: p, screen: 'lobby', dialog: settings('pad:0') }), 'consume');
  p.buttons[0].pressed = false;
  assert.equal(router.route({ pad: p, screen: 'lobby', dialog: settings('pad:0') }), 'consume');
  p.axes[0] = 0;
  assert.equal(router.route({ pad: p, screen: 'lobby', dialog: settings('pad:0') }), 'navigate');
});

test('A delayed successful desktop claim retains the first Start press without repeating it', () => {
  const router = createLobbySettingsControllerRouter(), p = pad();
  p.buttons[9].pressed = true;
  const previous = p.buttons.map(button => button.pressed);
  assert.equal(router.route({ pad: p, previous, screen: 'lobby', pendingOpen: true }), 'open');
  assert.equal(router.route({ pad: p, previous, screen: 'lobby', dialog: settings('pad:0') }), 'consume');
});

test('A held Start without a new edge cannot join or open menu settings', () => {
  const router = createLobbySettingsControllerRouter(), p = pad();
  p.buttons[9].pressed = true;
  assert.equal(router.route({ pad: p, previous: p.buttons.map(button => button.pressed), screen: 'lobby' }), 'consume');
});

test('Held owner accept and ignored non-owner back remain consumed after settings closes', () => {
  const router = createLobbySettingsControllerRouter(), p = pad(), q = pad(1);
  p.buttons[0].pressed = true; q.buttons[1].pressed = true;
  assert.equal(router.route({ pad: p, screen: 'lobby', dialog: settings('pad:0') }), 'navigate');
  assert.equal(router.route({ pad: q, screen: 'lobby', dialog: settings('pad:0') }), 'consume');
  for (const controller of [p, q]) {
    assert.equal(router.route({ pad: controller, screen: 'lobby' }), 'consume');
    controller.buttons.forEach(button => { button.pressed = false; });
    assert.equal(router.route({ pad: controller, screen: 'lobby' }), null);
  }
});

test('Expedition pause, other modals, workshop controls and ordinary join input remain on their original routes', () => {
  const router = createLobbySettingsControllerRouter(), p = pad();
  p.buttons[9].pressed = true;
  for (const screen of ['play', 'workshop']) assert.equal(router.route({ pad: p, screen }), null);
  for (const id of ['pause-dialog', 'character-name-dialog', 'controller-keyboard'])
    assert.equal(router.route({ pad: p, screen: 'lobby', dialog: { id }, pendingOpen: true }), null);
  p.buttons[9].pressed = false;
  p.buttons[0].pressed = true;
  assert.equal(router.route({ pad: p, screen: 'lobby' }), null);
});

test('Releasing a claim clears only that controller’s consumed press', () => {
  const router = createLobbySettingsControllerRouter(), p = pad(), q = pad(1);
  p.buttons[9].pressed = q.buttons[9].pressed = true;
  assert.equal(router.route({ pad: p, screen: 'home' }), 'open');
  assert.equal(router.route({ pad: q, screen: 'home' }), 'open');
  router.release(`${p.index}|${p.id}|${p.mapping}`);
  assert.equal(router.route({ pad: p, screen: 'home' }), 'open');
  assert.equal(router.route({ pad: q, screen: 'home' }), 'consume');
});
