import test from 'node:test';
import assert from 'node:assert/strict';
import { witchHatFrame, witchHatMotion, WitchHatInertia } from '../src/witch-hat-motion.mjs';

test('witch hat flex follows looping gait and reverses after an attack', () => {
  const sample = (action, progress) => witchHatFrame(witchHatMotion({}, 0, 0, action, progress));
  assert.deepEqual(sample('run', 0), sample('run', 1));
  assert.notDeepEqual(sample('run', .35), sample('run', .8));
  assert.equal(sample('slash', .45).crown, 2);
  assert.ok(sample('slash', .88).crown < 0);
  assert.deepEqual(sample('slash', 0), sample('slash', 1));
  assert.deepEqual(witchHatFrame(witchHatMotion({ angleRestOnly: true }, 2, 0, 'run', .35)), { crown: 0, brim: 0 });
});

test('witch hat inertia trails motion, survives repeat renders, and settles after a stop', () => {
  const history = new WitchHatInertia();
  const actor = { id: 4, x: 0, y: 0, faceX: 1, faceY: 0, moving: true };
  history.sample(actor, 0);
  const running = history.sample({ ...actor, x: 25 }, .12);
  assert.ok(running.crown < -.2);
  assert.equal(history.sample(actor, .12), running);
  assert.equal(history.sample(actor, .06), running);
  let resting;
  for (let step = 1; step <= 10; step++) {
    resting = history.sample({ ...actor, x: 25, moving: false }, .12 + step * .1);
  }
  assert.deepEqual(witchHatFrame(resting), { crown: 0, brim: 0 });
  const turned = history.sample({ ...actor, x: 25, faceX: -1, moving: false }, 1.24);
  assert.ok(Math.abs(turned.crown) > .2);
  const teleported = history.sample({ ...actor, x: 400, moving: false }, 1.34);
  assert.deepEqual(witchHatFrame(teleported), { crown: 0, brim: 0 });
});

test('idle and seated actor caches share the same discrete witch hat frame as the hat painter', async () => {
  const { Animator } = await import('../src/animation.mjs');
  const documentBefore = globalThis.document;
  const context = {
    clearRect() {}, drawImage() {}, fillRect() {}, save() {}, restore() {},
    translate() {}, scale() {}, rotate() {},
  };
  globalThis.document = { createElement: () => ({ getContext: () => context }) };
  try {
    const animator = new Animator({});
    const actor = { id: 1, sprite: 'player', x: 100, y: 100, hp: 100, faceX: 0, faceY: 1, equipment: { head: 'witch_hat' } };
    const seated = { ...actor, trainRide: { seat: 1 }, animationAction: 'train_sit' };
    for (const [subject, cache] of [[actor, 'playerFrames'], [seated, 'seatedFrames']]) {
      const draw = crown => animator.drawActor(context, { ...subject, witchHatInertia: { crown, brim: 0 } }, 0);
      draw(0);
      draw(.2);
      assert.equal(animator[cache].size, 1);
      draw(.7);
      assert.equal(animator[cache].size, 2);
    }
  } finally {
    if (documentBefore === undefined) delete globalThis.document;
    else globalThis.document = documentBefore;
  }
});
