import test from 'node:test';
import assert from 'node:assert/strict';
import { CREATURE_PACK } from '../../src/creature-packs/eldritch.mjs';

function inspectFacing(facing) {
  const subject = CREATURE_PACK.subjects.great_owl, model = subject.defaults();
  const colors = new Map();
  const bounds = [Infinity, Infinity, -Infinity, -Infinity];
  subject.draw({
    set fillStyle(value) { this.color = value; },
    fillRect(x, y, w, h) {
      colors.set(this.color, (colors.get(this.color) || 0) + Math.max(1, w * h));
      bounds[0] = Math.min(bounds[0], x); bounds[1] = Math.min(bounds[1], y);
      bounds[2] = Math.max(bounds[2], x + w); bounds[3] = Math.max(bounds[3], y + h);
    },
  }, {
    kind: 'great_owl', x: 80, y: 80,
    faceX: -Math.sin(facing * Math.PI / 4), faceY: Math.cos(facing * Math.PI / 4),
    state: 'idle', animationAction: 'idle', moving: false,
  }, 0, model);
  return { bounds, colors, palette: model.palette };
}

test('Great Owl art keeps a face-forward mask, feather fan, and distinct folded profile in all eight views', () => {
  const front = inspectFacing(0), rear = inspectFacing(4);
  const profileL = inspectFacing(2), profileR = inspectFacing(6);
  for (let d = 0; d < 8; d++) {
    const { bounds, colors, palette } = inspectFacing(d);
    assert.ok(colors.size >= 6, `facing ${d} retains a useful feather/face palette`);
    assert.ok(bounds.every(Number.isFinite), `facing ${d} has finite rendered bounds`);
    assert.ok(bounds[2] - bounds[0] >= 25, `facing ${d} retains the owl silhouette width`);
  }
  assert.ok((front.colors.get(front.palette.eye) || 0) > 0, 'front-facing view retains its golden eyes');
  assert.equal(rear.colors.get(rear.palette.eye) || 0, 0, 'rear-facing view hides the facial eyes');
  assert.ok((front.colors.get(front.palette.light) || 0) > 0, 'front wing mass retains broad feather highlights');
  for (const side of [profileL, profileR]) {
    const profileHeight = side.bounds[3] - side.bounds[1];
    const frontHeight = front.bounds[3] - front.bounds[1];
    assert.ok(profileHeight > frontHeight * 1.1, 'side profile has the raised folded wing and trailing tail');
  }
});
